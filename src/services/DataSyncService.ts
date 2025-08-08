/**
 * Data Synchronization Service
 * Handles data consistency, conflict resolution, and synchronization across multiple sources
 */

export interface SyncableData {
  id: string;
  version: number;
  lastModified: number;
  checksum?: string;
  source: string;
  data: any;
}

export interface ConflictResolution {
  strategy: 'latest-wins' | 'source-priority' | 'manual' | 'merge';
  sourcePriority?: string[];
  mergeFunction?: (local: SyncableData, remote: SyncableData) => SyncableData;
}

export interface SyncConflict {
  id: string;
  local: SyncableData;
  remote: SyncableData;
  conflictType: 'version' | 'concurrent-edit' | 'delete-edit' | 'checksum';
  timestamp: number;
  resolved: boolean;
  resolution?: SyncableData;
}

export interface SyncSession {
  id: string;
  source: string;
  startTime: number;
  endTime?: number;
  status: 'pending' | 'active' | 'completed' | 'failed';
  itemsProcessed: number;
  conflicts: SyncConflict[];
  errors: string[];
}

export interface SyncOptions {
  batchSize: number;
  maxRetries: number;
  retryDelay: number;
  conflictResolution: ConflictResolution;
  validateData: boolean;
  enableOptimisticLocking: boolean;
  syncBidirectional: boolean;
}

export class DataSyncService {
  private localStore = new Map<string, SyncableData>();
  private conflictStore = new Map<string, SyncConflict>();
  private activeSessions = new Map<string, SyncSession>();
  private syncLocks = new Map<string, Promise<void>>();
  private defaultOptions: SyncOptions;

  constructor() {
    this.defaultOptions = {
      batchSize: 100,
      maxRetries: 3,
      retryDelay: 1000,
      conflictResolution: {
        strategy: 'latest-wins',
      },
      validateData: true,
      enableOptimisticLocking: true,
      syncBidirectional: true,
    };
  }

  /**
   * Store data locally with metadata
   */
  async storeData(id: string, data: any, source: string = 'local'): Promise<SyncableData> {
    const syncableData: SyncableData = {
      id,
      version: this.getNextVersion(id),
      lastModified: Date.now(),
      checksum: this.calculateChecksum(data),
      source,
      data: this.deepClone(data),
    };

    this.localStore.set(id, syncableData);
    return syncableData;
  }

  /**
   * Get data by ID
   */
  async getData(id: string): Promise<SyncableData | null> {
    return this.localStore.get(id) || null;
  }

  /**
   * Sync with remote source
   */
  async syncWithRemote(
    remoteData: SyncableData[],
    source: string,
    options: Partial<SyncOptions> = {}
  ): Promise<SyncSession> {
    const sessionId = this.generateId();
    const effectiveOptions = { ...this.defaultOptions, ...options };

    const session: SyncSession = {
      id: sessionId,
      source,
      startTime: Date.now(),
      status: 'active',
      itemsProcessed: 0,
      conflicts: [],
      errors: [],
    };

    this.activeSessions.set(sessionId, session);

    try {
      // Process in batches
      const batches = this.createBatches(remoteData, effectiveOptions.batchSize);
      
      for (const batch of batches) {
        await this.processBatch(batch, session, effectiveOptions);
      }

      session.status = 'completed';
      session.endTime = Date.now();

      console.log(`Sync completed for source ${source}:`, {
        itemsProcessed: session.itemsProcessed,
        conflicts: session.conflicts.length,
        errors: session.errors.length,
      });

    } catch (error) {
      session.status = 'failed';
      session.endTime = Date.now();
      session.errors.push(error instanceof Error ? error.message : 'Unknown error');
      console.error('Sync failed:', error);
    }

    return session;
  }

  /**
   * Resolve conflict manually
   */
  async resolveConflict(conflictId: string, resolution: SyncableData): Promise<boolean> {
    const conflict = this.conflictStore.get(conflictId);
    if (!conflict) {
      return false;
    }

    // Validate resolution
    if (resolution.id !== conflict.id) {
      throw new Error('Resolution ID must match conflict ID');
    }

    // Update local store
    const finalResolution: SyncableData = {
      ...resolution,
      version: Math.max(conflict.local.version, conflict.remote.version) + 1,
      lastModified: Date.now(),
      checksum: this.calculateChecksum(resolution.data),
    };

    this.localStore.set(conflict.id, finalResolution);

    // Mark conflict as resolved
    conflict.resolved = true;
    conflict.resolution = finalResolution;
    this.conflictStore.set(conflictId, conflict);

    console.log(`Conflict ${conflictId} resolved for item ${conflict.id}`);
    return true;
  }

  /**
   * Get all unresolved conflicts
   */
  getUnresolvedConflicts(): SyncConflict[] {
    return Array.from(this.conflictStore.values()).filter(c => !c.resolved);
  }

  /**
   * Get sync session status
   */
  getSyncSession(sessionId: string): SyncSession | null {
    return this.activeSessions.get(sessionId) || null;
  }

  /**
   * Get all active sync sessions
   */
  getActiveSessions(): SyncSession[] {
    return Array.from(this.activeSessions.values()).filter(s => s.status === 'active');
  }

  /**
   * Cancel active sync session
   */
  async cancelSync(sessionId: string): Promise<boolean> {
    const session = this.activeSessions.get(sessionId);
    if (!session || session.status !== 'active') {
      return false;
    }

    session.status = 'failed';
    session.endTime = Date.now();
    session.errors.push('Cancelled by user');

    return true;
  }

  /**
   * Get sync statistics
   */
  getStats(): {
    localItems: number;
    conflicts: number;
    activeSessions: number;
    completedSessions: number;
    failedSessions: number;
  } {
    const sessions = Array.from(this.activeSessions.values());
    
    return {
      localItems: this.localStore.size,
      conflicts: this.conflictStore.size,
      activeSessions: sessions.filter(s => s.status === 'active').length,
      completedSessions: sessions.filter(s => s.status === 'completed').length,
      failedSessions: sessions.filter(s => s.status === 'failed').length,
    };
  }

  /**
   * Export local data
   */
  exportData(filter?: (item: SyncableData) => boolean): SyncableData[] {
    const items = Array.from(this.localStore.values());
    return filter ? items.filter(filter) : items;
  }

  /**
   * Import data with conflict detection
   */
  async importData(
    items: SyncableData[],
    source: string,
    options: Partial<SyncOptions> = {}
  ): Promise<{ imported: number; conflicts: number; errors: number }> {
    const session = await this.syncWithRemote(items, source, options);
    
    return {
      imported: session.itemsProcessed - session.conflicts.length,
      conflicts: session.conflicts.length,
      errors: session.errors.length,
    };
  }

  /**
   * Clear all data and conflicts
   */
  clear(): void {
    this.localStore.clear();
    this.conflictStore.clear();
    this.activeSessions.clear();
    this.syncLocks.clear();
  }

  private async processBatch(
    batch: SyncableData[],
    session: SyncSession,
    options: SyncOptions
  ): Promise<void> {
    for (const remoteItem of batch) {
      try {
        await this.processItem(remoteItem, session, options);
        session.itemsProcessed++;
      } catch (error) {
        session.errors.push(`Failed to process item ${remoteItem.id}: ${error}`);
        console.error('Error processing item:', remoteItem.id, error);
      }
    }
  }

  private async processItem(
    remoteItem: SyncableData,
    session: SyncSession,
    options: SyncOptions
  ): Promise<void> {
    // Validate data if required
    if (options.validateData && !this.validateSyncableData(remoteItem)) {
      throw new Error('Invalid remote data format');
    }

    const localItem = this.localStore.get(remoteItem.id);

    if (!localItem) {
      // New item - just store it
      this.localStore.set(remoteItem.id, this.deepClone(remoteItem));
      return;
    }

    // Check for conflicts
    const conflictType = this.detectConflict(localItem, remoteItem);
    
    if (conflictType) {
      const conflict = this.createConflict(localItem, remoteItem, conflictType);
      
      if (options.conflictResolution.strategy === 'manual') {
        // Store conflict for manual resolution
        this.conflictStore.set(conflict.id, conflict);
        session.conflicts.push(conflict);
      } else {
        // Auto-resolve conflict
        const resolved = await this.autoResolveConflict(conflict, options.conflictResolution);
        if (resolved) {
          this.localStore.set(remoteItem.id, resolved);
          conflict.resolved = true;
          conflict.resolution = resolved;
        } else {
          // Fallback to manual resolution
          this.conflictStore.set(conflict.id, conflict);
          session.conflicts.push(conflict);
        }
      }
    } else {
      // No conflict - update local data
      this.localStore.set(remoteItem.id, this.deepClone(remoteItem));
    }
  }

  private detectConflict(local: SyncableData, remote: SyncableData): string | null {
    // Version conflict
    if (local.version !== remote.version && local.lastModified !== remote.lastModified) {
      if (local.lastModified > remote.lastModified && remote.version > local.version) {
        return 'concurrent-edit';
      }
      if (local.version > remote.version) {
        return 'version';
      }
    }

    // Checksum mismatch with same version
    if (local.version === remote.version && local.checksum !== remote.checksum) {
      return 'checksum';
    }

    // Data was deleted locally but modified remotely (or vice versa)
    if (local.data === null && remote.data !== null) {
      return 'delete-edit';
    }

    return null;
  }

  private createConflict(
    local: SyncableData,
    remote: SyncableData,
    conflictType: string
  ): SyncConflict {
    return {
      id: this.generateId(),
      local: this.deepClone(local),
      remote: this.deepClone(remote),
      conflictType: conflictType as any,
      timestamp: Date.now(),
      resolved: false,
    };
  }

  private async autoResolveConflict(
    conflict: SyncConflict,
    resolution: ConflictResolution
  ): Promise<SyncableData | null> {
    switch (resolution.strategy) {
      case 'latest-wins':
        return conflict.local.lastModified > conflict.remote.lastModified
          ? conflict.local
          : conflict.remote;

      case 'source-priority':
        if (resolution.sourcePriority) {
          const localPriority = resolution.sourcePriority.indexOf(conflict.local.source);
          const remotePriority = resolution.sourcePriority.indexOf(conflict.remote.source);
          
          if (localPriority !== -1 && remotePriority !== -1) {
            return localPriority < remotePriority ? conflict.local : conflict.remote;
          }
        }
        return conflict.remote; // Default to remote if no priority defined

      case 'merge':
        if (resolution.mergeFunction) {
          try {
            return resolution.mergeFunction(conflict.local, conflict.remote);
          } catch (error) {
            console.error('Merge function failed:', error);
          }
        }
        return null;

      default:
        return null;
    }
  }

  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  private getNextVersion(id: string): number {
    const existing = this.localStore.get(id);
    return existing ? existing.version + 1 : 1;
  }

  private calculateChecksum(data: any): string {
    const str = JSON.stringify(data, Object.keys(data).sort());
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  private validateSyncableData(data: SyncableData): boolean {
    return !!(
      data &&
      typeof data.id === 'string' &&
      typeof data.version === 'number' &&
      typeof data.lastModified === 'number' &&
      typeof data.source === 'string' &&
      data.data !== undefined
    );
  }

  private deepClone<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    if (obj instanceof Date) {
      return new Date(obj.getTime()) as unknown as T;
    }

    if (obj instanceof Array) {
      return obj.map(item => this.deepClone(item)) as unknown as T;
    }

    const cloned = {} as T;
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = this.deepClone(obj[key]);
      }
    }

    return cloned;
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
  }
}

// Singleton instance
export const dataSyncService = new DataSyncService();