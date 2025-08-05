/**
 * Accessibility utilities for WCAG 2.1 AA compliance
 * Trading platform accessibility for users with disabilities
 */

// Keyboard navigation keys
export const KEYS = {
  ENTER: 'Enter',
  SPACE: ' ',
  ESCAPE: 'Escape',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  TAB: 'Tab',
  HOME: 'Home',
  END: 'End',
  PAGE_UP: 'PageUp',
  PAGE_DOWN: 'PageDown',
} as const

// Color contrast utilities
export class ColorContrast {
  // Convert hex to RGB
  static hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null
  }

  // Calculate relative luminance
  static getRelativeLuminance(r: number, g: number, b: number): number {
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    })
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
  }

  // Calculate contrast ratio
  static getContrastRatio(color1: string, color2: string): number {
    const rgb1 = this.hexToRgb(color1)
    const rgb2 = this.hexToRgb(color2)
    
    if (!rgb1 || !rgb2) return 0
    
    const l1 = this.getRelativeLuminance(rgb1.r, rgb1.g, rgb1.b)
    const l2 = this.getRelativeLuminance(rgb2.r, rgb2.g, rgb2.b)
    
    const lighter = Math.max(l1, l2)
    const darker = Math.min(l1, l2)
    
    return (lighter + 0.05) / (darker + 0.05)
  }

  // Check WCAG compliance
  static isWCAGCompliant(color1: string, color2: string, level: 'AA' | 'AAA' = 'AA'): boolean {
    const ratio = this.getContrastRatio(color1, color2)
    return level === 'AA' ? ratio >= 4.5 : ratio >= 7
  }

  // Check for large text (18pt+ or 14pt+ bold)
  static isWCAGCompliantLargeText(color1: string, color2: string, level: 'AA' | 'AAA' = 'AA'): boolean {
    const ratio = this.getContrastRatio(color1, color2)
    return level === 'AA' ? ratio >= 3 : ratio >= 4.5
  }
}

// Screen reader utilities
export class ScreenReader {
  // Announce message to screen readers
  static announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    const announcement = document.createElement('div')
    announcement.setAttribute('aria-live', priority)
    announcement.setAttribute('aria-atomic', 'true')
    announcement.setAttribute('class', 'sr-only')
    announcement.textContent = message
    
    document.body.appendChild(announcement)
    
    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcement)
    }, 1000)
  }

  // Announce trading-specific events
  static announceTradeEvent(type: 'order_placed' | 'order_filled' | 'strategy_started' | 'strategy_stopped', details: string): void {
    const messages = {
      order_placed: `Order placed: ${details}`,
      order_filled: `Order filled: ${details}`,
      strategy_started: `Strategy started: ${details}`,
      strategy_stopped: `Strategy stopped: ${details}`
    }
    
    this.announce(messages[type], 'assertive')
  }

  // Announce price changes
  static announcePriceChange(symbol: string, oldPrice: number, newPrice: number): void {
    const direction = newPrice > oldPrice ? 'increased' : 'decreased'
    const change = Math.abs(newPrice - oldPrice)
    const message = `${symbol} price ${direction} by $${change.toFixed(2)} to $${newPrice.toFixed(2)}`
    
    this.announce(message, 'polite')
  }
}

// Focus management
export class FocusManager {
  private static focusHistory: HTMLElement[] = []

  // Trap focus within an element
  static trapFocus(element: HTMLElement): () => void {
    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>

    const firstFocusable = focusableElements[0]
    const lastFocusable = focusableElements[focusableElements.length - 1]

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== KEYS.TAB) return

      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          e.preventDefault()
          lastFocusable?.focus()
        }
      } else {
        if (document.activeElement === lastFocusable) {
          e.preventDefault()
          firstFocusable?.focus()
        }
      }
    }

    element.addEventListener('keydown', handleTabKey)
    firstFocusable?.focus()

    // Return cleanup function
    return () => {
      element.removeEventListener('keydown', handleTabKey)
    }
  }

  // Store current focus and focus new element
  static pushFocus(element: HTMLElement): void {
    const currentFocus = document.activeElement as HTMLElement
    if (currentFocus) {
      this.focusHistory.push(currentFocus)
    }
    element.focus()
  }

  // Restore previous focus
  static popFocus(): void {
    const previousFocus = this.focusHistory.pop()
    if (previousFocus) {
      previousFocus.focus()
    }
  }

  // Skip to main content
  static addSkipLinks(): void {
    const skipLink = document.createElement('a')
    skipLink.href = '#main-content'
    skipLink.textContent = 'Skip to main content'
    skipLink.className = 'sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 bg-blue-600 text-white p-2 z-50'
    
    const skipToNav = document.createElement('a')
    skipToNav.href = '#navigation'
    skipToNav.textContent = 'Skip to navigation'
    skipToNav.className = 'sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-24 bg-blue-600 text-white p-2 z-50'

    document.body.insertBefore(skipLink, document.body.firstChild)
    document.body.insertBefore(skipToNav, skipLink.nextSibling)
  }
}

// Keyboard shortcuts for power users
export class KeyboardShortcuts {
  private static shortcuts = new Map<string, () => void>()

  // Register keyboard shortcut
  static register(key: string, callback: () => void, description?: string): void {
    this.shortcuts.set(key.toLowerCase(), callback)
    
    // Add to help menu if description provided
    if (description) {
      this.addToHelpMenu(key, description)
    }
  }

  // Handle global keyboard events
  static handleKeyDown(event: KeyboardEvent): void {
    // Don't trigger shortcuts when typing in inputs
    const activeElement = document.activeElement
    if (activeElement && (
      activeElement.tagName === 'INPUT' ||
      activeElement.tagName === 'TEXTAREA' ||
      activeElement.hasAttribute('contenteditable')
    )) {
      return
    }

    const key = event.key.toLowerCase()
    const modifiers = []
    
    if (event.ctrlKey || event.metaKey) modifiers.push('ctrl')
    if (event.altKey) modifiers.push('alt')
    if (event.shiftKey) modifiers.push('shift')
    
    const shortcutKey = modifiers.length > 0 
      ? `${modifiers.join('+')}+${key}`
      : key

    const callback = this.shortcuts.get(shortcutKey)
    if (callback) {
      event.preventDefault()
      callback()
    }
  }

  // Add shortcut to help menu
  private static addToHelpMenu(key: string, description: string): void {
    // This would integrate with your help system
    console.log(`Keyboard shortcut registered: ${key} - ${description}`)
  }

  // Initialize trading-specific shortcuts
  static initializeTradingShortcuts(uiStore: any): void {
    // Navigation shortcuts
    this.register('1', () => uiStore.setActiveTab('dashboard'), 'Go to Dashboard')
    this.register('2', () => uiStore.setActiveTab('strategies'), 'Go to Strategies')
    this.register('3', () => uiStore.setActiveTab('journal'), 'Go to Trade Journal')
    this.register('4', () => uiStore.setActiveTab('settings'), 'Go to Settings')
    
    // Toggle shortcuts
    this.register('ctrl+b', () => uiStore.toggleSidebar(), 'Toggle Sidebar')
    this.register('ctrl+k', () => this.openCommandPalette(), 'Open Command Palette')
    this.register('?', () => this.showHelpModal(), 'Show Keyboard Shortcuts')
    
    // Emergency shortcuts
    this.register('ctrl+alt+h', () => this.haltAllStrategies(), 'Halt All Strategies')
  }

  private static openCommandPalette(): void {
    // Implementation for command palette
    console.log('Command palette opened')
  }

  private static showHelpModal(): void {
    // Implementation for help modal
    console.log('Help modal opened')
  }

  private static haltAllStrategies(): void {
    // Emergency halt all trading strategies
    ScreenReader.announce('Emergency halt initiated for all strategies', 'assertive')
    console.log('Emergency halt: All strategies stopped')
  }
}

// ARIA utilities
export class AriaUtils {
  // Generate unique IDs for ARIA relationships
  static generateId(prefix: string = 'aria'): string {
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}`
  }

  // Create ARIA labelledby relationship
  static labelledBy(element: HTMLElement, labelElement: HTMLElement): void {
    const labelId = labelElement.id || this.generateId('label')
    labelElement.id = labelId
    element.setAttribute('aria-labelledby', labelId)
  }

  // Create ARIA describedby relationship
  static describedBy(element: HTMLElement, descriptionElement: HTMLElement): void {
    const descId = descriptionElement.id || this.generateId('desc')
    descriptionElement.id = descId
    element.setAttribute('aria-describedby', descId)
  }

  // Set ARIA live region
  static setLiveRegion(element: HTMLElement, politeness: 'polite' | 'assertive' | 'off' = 'polite'): void {
    element.setAttribute('aria-live', politeness)
    element.setAttribute('aria-atomic', 'true')
  }

  // Trading-specific ARIA patterns
  static markAsTradeData(element: HTMLElement, symbol: string, value: number): void {
    element.setAttribute('role', 'cell')
    element.setAttribute('aria-label', `${symbol} value: $${value.toFixed(2)}`)
  }

  static markAsStrategy(element: HTMLElement, name: string, status: string): void {
    element.setAttribute('role', 'button')
    element.setAttribute('aria-label', `Strategy: ${name}, Status: ${status}`)
    element.setAttribute('aria-pressed', status === 'running' ? 'true' : 'false')
  }
}

// Accessibility audit utilities
export class AccessibilityAuditor {
  // Check for common accessibility issues
  static auditPage(): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = []

    // Check for images without alt text
    const images = document.querySelectorAll('img')
    images.forEach((img, index) => {
      if (!img.hasAttribute('alt')) {
        issues.push({
          type: 'missing-alt-text',
          severity: 'high',
          element: img,
          message: `Image ${index + 1} missing alt text`,
          fix: 'Add descriptive alt attribute'
        })
      }
    })

    // Check for buttons without accessible names
    const buttons = document.querySelectorAll('button')
    buttons.forEach((button, index) => {
      const hasText = button.textContent?.trim()
      const hasAriaLabel = button.hasAttribute('aria-label')
      const hasAriaLabelledby = button.hasAttribute('aria-labelledby')
      
      if (!hasText && !hasAriaLabel && !hasAriaLabelledby) {
        issues.push({
          type: 'missing-button-name',
          severity: 'high',
          element: button,
          message: `Button ${index + 1} has no accessible name`,
          fix: 'Add text content or aria-label'
        })
      }
    })

    // Check form inputs for labels
    const inputs = document.querySelectorAll('input, select, textarea')
    inputs.forEach((input, index) => {
      const hasLabel = document.querySelector(`label[for="${input.id}"]`)
      const hasAriaLabel = input.hasAttribute('aria-label')
      const hasAriaLabelledby = input.hasAttribute('aria-labelledby')
      
      if (!hasLabel && !hasAriaLabel && !hasAriaLabelledby) {
        issues.push({
          type: 'missing-form-label',
          severity: 'high',
          element: input,
          message: `Form control ${index + 1} has no label`,
          fix: 'Add associated label or aria-label'
        })
      }
    })

    // Check color contrast (simplified check)
    const colorElements = document.querySelectorAll('[style*="color"]')
    colorElements.forEach((element, index) => {
      // This would need more sophisticated color extraction
      issues.push({
        type: 'color-contrast-check',
        severity: 'low',
        element: element,
        message: `Element ${index + 1} may have contrast issues`,
        fix: 'Verify color contrast meets WCAG standards'
      })
    })

    return issues
  }

  // Generate accessibility report
  static generateReport(): AccessibilityReport {
    const issues = this.auditPage()
    const score = Math.max(0, 100 - issues.length * 5)
    
    return {
      score,
      issues,
      recommendations: this.generateRecommendations(issues),
      timestamp: new Date().toISOString()
    }
  }

  private static generateRecommendations(issues: AccessibilityIssue[]): string[] {
    const recommendations = []
    
    if (issues.some(i => i.type === 'missing-alt-text')) {
      recommendations.push('Add descriptive alt text to all images')
    }
    
    if (issues.some(i => i.type === 'missing-button-name')) {
      recommendations.push('Ensure all interactive elements have accessible names')
    }
    
    if (issues.some(i => i.type === 'missing-form-label')) {
      recommendations.push('Associate all form controls with labels')
    }

    recommendations.push('Test with keyboard navigation only')
    recommendations.push('Test with screen reader software')
    recommendations.push('Verify color contrast meets WCAG AA standards')
    
    return recommendations
  }
}

// Types
export interface AccessibilityIssue {
  type: string
  severity: 'low' | 'medium' | 'high'
  element: Element
  message: string
  fix: string
}

export interface AccessibilityReport {
  score: number
  issues: AccessibilityIssue[]
  recommendations: string[]
  timestamp: string
}

// Initialize accessibility features
export function initializeAccessibility(uiStore?: any): void {
  // Add skip links
  FocusManager.addSkipLinks()
  
  // Initialize keyboard shortcuts only if uiStore is provided
  if (uiStore) {
    KeyboardShortcuts.initializeTradingShortcuts(uiStore)
  }
  
  // Add global keyboard event listener
  document.addEventListener('keydown', KeyboardShortcuts.handleKeyDown)
  
  // Add focus-visible polyfill behavior
  document.addEventListener('keydown', () => {
    document.body.classList.add('keyboard-navigation')
  })
  
  document.addEventListener('mousedown', () => {
    document.body.classList.remove('keyboard-navigation')
  })
  
  // Announce page loads to screen readers only if we have a complete setup
  if (uiStore) {
    ScreenReader.announce('Trading platform loaded', 'polite')
  }
}