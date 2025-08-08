/**
 * Authentication Manager
 * Handles secure credential storage, token refresh, and authentication flows
 */

import { credentialsValidator, type ValidationResult } from './CredentialsValidator';
import type { BrokerCredentials } from './brokers/types';

export interface AuthToken {
  token: string;
  refreshToken?: string;
  expiresAt: number;
  tokenType: 'bearer' | 'api-key' | 'session';
  scopes?: string[];
}

export interface StoredCredentials {
  brokerId: string;
  credentials: BrokerCredentials;
  token?: AuthToken;
  lastValidated: number;
  isEncrypted: boolean;
}

export interface AuthConfig {
  encryptionKey?: string;
  tokenRefreshThreshold: number; // Refresh when token expires in this many ms
  credentialsCacheTTL: number; // How long to cache credentials
  maxRetries: number;
  retryDelay: number;
}

export interface AuthResult {
  success: boolean;
  token?: AuthToken;
  error?: string;
  needsRefresh?: boolean;
}

export class AuthManager {
  private config: AuthConfig;
  private credentialsCache = new Map<string, StoredCredentials>();
  private refreshPromises = new Map<string, Promise<AuthResult>>();
  private encryptionKey: CryptoKey | null = null;

  constructor(config: Partial<AuthConfig> = {}) {
    this.config = {
      tokenRefreshThreshold: 300000, // 5 minutes
      credentialsCacheTTL: 3600000, // 1 hour
      maxRetries: 3,
      retryDelay: 1000,
      ...config,
    };

    this.initializeEncryption();
  }

  /**
   * Store credentials securely with encryption
   */
  async storeCredentials(brokerId: string, credentials: BrokerCredentials, encrypt: boolean = true): Promise<void> {
    const validation = credentialsValidator.validate(brokerId, credentials);
    if (!validation.isValid) {
      throw new Error(`Invalid credentials: ${validation.errors.join(', ')}`);
    }

    let processedCredentials = credentials;
    let isEncrypted = false;

    if (encrypt && this.encryptionKey) {
      try {
        processedCredentials = await this.encryptCredentials(credentials);
        isEncrypted = true;
      } catch (error) {
        console.warn('Failed to encrypt credentials, storing unencrypted:', error);
      }
    }

    const storedCreds: StoredCredentials = {
      brokerId,
      credentials: processedCredentials,
      lastValidated: Date.now(),
      isEncrypted,
    };

    this.credentialsCache.set(brokerId, storedCreds);

    // Also store in localStorage as backup (encrypted if possible)
    try {
      localStorage.setItem(`auth:${brokerId}`, JSON.stringify({
        ...storedCreds,
        credentials: isEncrypted ? processedCredentials : this.sanitizeCredentials(credentials),
      }));
    } catch (error) {
      console.warn('Failed to store credentials in localStorage:', error);
    }
  }

  /**
   * Get stored credentials
   */
  async getCredentials(brokerId: string): Promise<BrokerCredentials | null> {
    let stored = this.credentialsCache.get(brokerId);

    // Try to load from localStorage if not in cache
    if (!stored) {
      try {
        const storedData = localStorage.getItem(`auth:${brokerId}`);
        if (storedData) {
          stored = JSON.parse(storedData) as StoredCredentials;
          this.credentialsCache.set(brokerId, stored);
        }
      } catch (error) {
        console.warn('Failed to load credentials from localStorage:', error);
      }
    }

    if (!stored) {
      return null;
    }

    // Check if credentials are expired
    if (Date.now() - stored.lastValidated > this.config.credentialsCacheTTL) {
      this.removeCredentials(brokerId);
      return null;
    }

    // Decrypt if encrypted
    if (stored.isEncrypted && this.encryptionKey) {
      try {
        return await this.decryptCredentials(stored.credentials);
      } catch (error) {
        console.error('Failed to decrypt credentials:', error);
        this.removeCredentials(brokerId);
        return null;
      }
    }

    return stored.credentials;
  }

  /**
   * Remove stored credentials
   */
  removeCredentials(brokerId: string): void {
    this.credentialsCache.delete(brokerId);
    localStorage.removeItem(`auth:${brokerId}`);
  }

  /**
   * Store authentication token
   */
  async storeToken(brokerId: string, token: AuthToken): Promise<void> {
    const stored = this.credentialsCache.get(brokerId);
    if (stored) {
      stored.token = token;
      this.credentialsCache.set(brokerId, stored);

      // Update localStorage
      try {
        const storedData = localStorage.getItem(`auth:${brokerId}`);
        if (storedData) {
          const parsedData = JSON.parse(storedData);
          parsedData.token = token;
          localStorage.setItem(`auth:${brokerId}`, JSON.stringify(parsedData));
        }
      } catch (error) {
        console.warn('Failed to update token in localStorage:', error);
      }
    }
  }

  /**
   * Get authentication token
   */
  async getToken(brokerId: string): Promise<AuthToken | null> {
    const stored = this.credentialsCache.get(brokerId);
    return stored?.token || null;
  }

  /**
   * Check if token needs refresh
   */
  tokenNeedsRefresh(token: AuthToken): boolean {
    return Date.now() + this.config.tokenRefreshThreshold > token.expiresAt;
  }

  /**
   * Refresh authentication token
   */
  async refreshToken(brokerId: string, baseUrl: string): Promise<AuthResult> {
    // Check if refresh is already in progress
    const existingPromise = this.refreshPromises.get(brokerId);
    if (existingPromise) {
      return existingPromise;
    }

    const refreshPromise = this.performTokenRefresh(brokerId, baseUrl);
    this.refreshPromises.set(brokerId, refreshPromise);

    try {
      const result = await refreshPromise;
      return result;
    } finally {
      this.refreshPromises.delete(brokerId);
    }
  }

  /**
   * Authenticate with broker
   */
  async authenticate(brokerId: string, credentials: BrokerCredentials, baseUrl: string): Promise<AuthResult> {
    let retries = 0;
    const maxRetries = this.config.maxRetries;

    while (retries <= maxRetries) {
      try {
        const response = await fetch(`${baseUrl}/api/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            broker: brokerId,
            credentials: this.sanitizeCredentials(credentials),
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `Authentication failed: ${response.statusText}`);
        }

        const data = await response.json();
        
        const token: AuthToken = {
          token: data.token || data.access_token,
          refreshToken: data.refresh_token,
          expiresAt: data.expires_at || Date.now() + (data.expires_in || 3600) * 1000,
          tokenType: data.token_type || 'bearer',
          scopes: data.scopes,
        };

        // Store token
        await this.storeToken(brokerId, token);

        return {
          success: true,
          token,
        };

      } catch (error) {
        retries++;
        if (retries <= maxRetries) {
          await this.delay(this.config.retryDelay * retries);
          continue;
        }

        return {
          success: false,
          error: error instanceof Error ? error.message : 'Authentication failed',
        };
      }
    }

    return {
      success: false,
      error: 'Max retries exceeded',
    };
  }

  /**
   * Get authorization headers for API requests
   */
  async getAuthHeaders(brokerId: string, baseUrl?: string): Promise<Record<string, string>> {
    const token = await this.getToken(brokerId);
    if (!token) {
      return {};
    }

    // Check if token needs refresh
    if (this.tokenNeedsRefresh(token) && baseUrl) {
      const refreshResult = await this.refreshToken(brokerId, baseUrl);
      if (refreshResult.success && refreshResult.token) {
        return this.buildAuthHeaders(refreshResult.token);
      }
    }

    return this.buildAuthHeaders(token);
  }

  /**
   * Validate credentials without storing them
   */
  validateCredentials(brokerId: string, credentials: BrokerCredentials): ValidationResult {
    return credentialsValidator.validate(brokerId, credentials);
  }

  /**
   * Test credentials by attempting authentication
   */
  async testCredentials(brokerId: string, credentials: BrokerCredentials, baseUrl: string): Promise<boolean> {
    try {
      const result = await this.authenticate(brokerId, credentials, baseUrl);
      return result.success;
    } catch (error) {
      console.error('Credential test failed:', error);
      return false;
    }
  }

  /**
   * Clear all authentication data
   */
  clearAll(): void {
    this.credentialsCache.clear();
    this.refreshPromises.clear();

    // Clear from localStorage
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('auth:')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
  }

  /**
   * Get authentication status for all brokers
   */
  getAuthStatus(): Record<string, { hasCredentials: boolean; hasToken: boolean; tokenExpired: boolean }> {
    const status: Record<string, any> = {};

    for (const [brokerId, stored] of this.credentialsCache.entries()) {
      status[brokerId] = {
        hasCredentials: !!stored.credentials,
        hasToken: !!stored.token,
        tokenExpired: stored.token ? Date.now() > stored.token.expiresAt : false,
      };
    }

    return status;
  }

  private async performTokenRefresh(brokerId: string, baseUrl: string): Promise<AuthResult> {
    const stored = this.credentialsCache.get(brokerId);
    if (!stored?.token?.refreshToken) {
      return {
        success: false,
        error: 'No refresh token available',
        needsRefresh: true,
      };
    }

    try {
      const response = await fetch(`${baseUrl}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${stored.token.refreshToken}`,
        },
        body: JSON.stringify({
          broker: brokerId,
        }),
      });

      if (!response.ok) {
        throw new Error(`Token refresh failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      const newToken: AuthToken = {
        token: data.token || data.access_token,
        refreshToken: data.refresh_token || stored.token.refreshToken,
        expiresAt: data.expires_at || Date.now() + (data.expires_in || 3600) * 1000,
        tokenType: data.token_type || stored.token.tokenType,
        scopes: data.scopes || stored.token.scopes,
      };

      await this.storeToken(brokerId, newToken);

      return {
        success: true,
        token: newToken,
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Token refresh failed',
        needsRefresh: true,
      };
    }
  }

  private buildAuthHeaders(token: AuthToken): Record<string, string> {
    const headers: Record<string, string> = {};

    switch (token.tokenType) {
      case 'bearer':
        headers['Authorization'] = `Bearer ${token.token}`;
        break;
      case 'api-key':
        headers['X-API-Key'] = token.token;
        break;
      case 'session':
        headers['X-Session-Token'] = token.token;
        break;
      default:
        headers['Authorization'] = `${token.tokenType} ${token.token}`;
    }

    return headers;
  }

  private async initializeEncryption(): Promise<void> {
    if (!window.crypto || !window.crypto.subtle) {
      console.warn('Web Crypto API not available, credentials will not be encrypted');
      return;
    }

    try {
      // Generate or retrieve encryption key
      const keyData = this.config.encryptionKey || 'edgerunner-auth-key-v1';
      const encoder = new TextEncoder();
      const keyBuffer = await window.crypto.subtle.digest('SHA-256', encoder.encode(keyData));
      
      this.encryptionKey = await window.crypto.subtle.importKey(
        'raw',
        keyBuffer,
        { name: 'AES-GCM' },
        false,
        ['encrypt', 'decrypt']
      );
    } catch (error) {
      console.warn('Failed to initialize encryption:', error);
    }
  }

  private async encryptCredentials(credentials: BrokerCredentials): Promise<BrokerCredentials> {
    if (!this.encryptionKey) {
      return credentials;
    }

    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify(credentials));
    const iv = window.crypto.getRandomValues(new Uint8Array(12));

    const encrypted = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      this.encryptionKey,
      data
    );

    return {
      encrypted: Array.from(new Uint8Array(encrypted)),
      iv: Array.from(iv),
    } as any;
  }

  private async decryptCredentials(encryptedData: any): Promise<BrokerCredentials> {
    if (!this.encryptionKey || !encryptedData.encrypted || !encryptedData.iv) {
      return encryptedData;
    }

    const encrypted = new Uint8Array(encryptedData.encrypted);
    const iv = new Uint8Array(encryptedData.iv);

    const decrypted = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      this.encryptionKey,
      encrypted
    );

    const decoder = new TextDecoder();
    const decryptedText = decoder.decode(decrypted);
    return JSON.parse(decryptedText);
  }

  private sanitizeCredentials(credentials: BrokerCredentials): Record<string, any> {
    const sanitized: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(credentials)) {
      if (['password', 'secretKey', 'secret'].includes(key)) {
        sanitized[key] = value ? '[REDACTED]' : undefined;
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Singleton instance
export const authManager = new AuthManager();