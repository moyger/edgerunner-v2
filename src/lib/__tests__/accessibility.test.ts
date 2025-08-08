/**
 * Accessibility utilities test suite
 * Tests for WCAG 2.1 AA compliance features
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { 
  ColorContrast, 
  ScreenReader, 
  FocusManager, 
  KeyboardShortcuts,
  AriaUtils,
  AccessibilityAuditor,
  initializeAccessibility 
} from '../accessibility'

// Mock DOM methods
Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  value: vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  })),
})

describe('Color Contrast Utilities', () => {
  describe('Hex to RGB Conversion', () => {
    it('should convert valid hex colors to RGB', () => {
      const result = ColorContrast.hexToRgb('#ff0000')
      expect(result).toEqual({ r: 255, g: 0, b: 0 })
    })

    it('should handle hex colors without hash', () => {
      const result = ColorContrast.hexToRgb('00ff00')
      expect(result).toEqual({ r: 0, g: 255, b: 0 })
    })

    it('should return null for invalid hex colors', () => {
      const result = ColorContrast.hexToRgb('invalid')
      expect(result).toBeNull()
    })
  })

  describe('Contrast Ratio Calculation', () => {
    it('should calculate contrast ratio between white and black', () => {
      const ratio = ColorContrast.getContrastRatio('#ffffff', '#000000')
      expect(ratio).toBeCloseTo(21, 0) // Perfect contrast
    })

    it('should return 0 for invalid colors', () => {
      const ratio = ColorContrast.getContrastRatio('invalid', '#000000')
      expect(ratio).toBe(0)
    })
  })

  describe('WCAG Compliance', () => {
    it('should identify WCAG AA compliant color combinations', () => {
      const isCompliant = ColorContrast.isWCAGCompliant('#000000', '#ffffff', 'AA')
      expect(isCompliant).toBe(true)
    })

    it('should identify non-compliant color combinations', () => {
      const isCompliant = ColorContrast.isWCAGCompliant('#888888', '#999999', 'AA')
      expect(isCompliant).toBe(false)
    })
  })
})

describe('Screen Reader Utilities', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('should create announcement elements', () => {
    ScreenReader.announce('Test message', 'polite')
    
    const announcements = document.querySelectorAll('[aria-live]')
    expect(announcements).toHaveLength(1)
    expect(announcements[0]?.textContent).toBe('Test message')
  })

  it('should remove announcement elements after delay', async () => {
    ScreenReader.announce('Test message', 'polite')
    
    // Wait for removal timeout
    await new Promise(resolve => setTimeout(resolve, 1100))
    
    const announcements = document.querySelectorAll('[aria-live]')
    expect(announcements).toHaveLength(0)
  })

  it('should announce trading events with proper formatting', () => {
    ScreenReader.announceTradeEvent('order_placed', 'AAPL 100 shares at $150')
    
    const announcements = document.querySelectorAll('[aria-live]')
    expect(announcements[0]?.textContent).toBe('Order placed: AAPL 100 shares at $150')
  })
})

describe('Focus Management', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('should add skip links to document body', () => {
    FocusManager.addSkipLinks()
    
    const skipLinks = document.querySelectorAll('a[href^="#"]')
    expect(skipLinks.length).toBeGreaterThan(0)
    expect(skipLinks[0]?.textContent).toContain('Skip to')
  })

  it('should manage focus history', () => {
    const button = document.createElement('button')
    document.body.appendChild(button)
    button.focus()
    
    const newButton = document.createElement('button')
    document.body.appendChild(newButton)
    
    FocusManager.pushFocus(newButton)
    expect(document.activeElement).toBe(newButton)
    
    FocusManager.popFocus()
    expect(document.activeElement).toBe(button)
  })
})

describe('Keyboard Shortcuts', () => {
  beforeEach(() => {
    KeyboardShortcuts['shortcuts'].clear()
  })

  it('should register keyboard shortcuts', () => {
    const mockCallback = vi.fn()
    KeyboardShortcuts.register('ctrl+s', mockCallback, 'Save')
    
    expect(KeyboardShortcuts['shortcuts'].get('ctrl+s')).toBe(mockCallback)
  })

  it('should handle keyboard events correctly', () => {
    const mockCallback = vi.fn()
    KeyboardShortcuts.register('ctrl+s', mockCallback)
    
    const event = new KeyboardEvent('keydown', {
      key: 's',
      ctrlKey: true
    })
    
    KeyboardShortcuts.handleKeyDown(event)
    expect(mockCallback).toHaveBeenCalled()
  })

  it('should not trigger shortcuts when typing in inputs', () => {
    const mockCallback = vi.fn()
    KeyboardShortcuts.register('a', mockCallback)
    
    const input = document.createElement('input')
    document.body.appendChild(input)
    input.focus()
    
    const event = new KeyboardEvent('keydown', { key: 'a' })
    Object.defineProperty(event, 'target', { value: input })
    
    KeyboardShortcuts.handleKeyDown(event)
    expect(mockCallback).not.toHaveBeenCalled()
  })
})

describe('ARIA Utilities', () => {
  it('should generate unique IDs', () => {
    const id1 = AriaUtils.generateId('test')
    const id2 = AriaUtils.generateId('test')
    
    expect(id1).toMatch(/^test-/)
    expect(id2).toMatch(/^test-/)
    expect(id1).not.toBe(id2)
  })

  it('should create labelledby relationships', () => {
    const element = document.createElement('div')
    const label = document.createElement('span')
    label.textContent = 'Label'
    
    AriaUtils.labelledBy(element, label)
    
    expect(label.id).toBeTruthy()
    expect(element.getAttribute('aria-labelledby')).toBe(label.id)
  })

  it('should set live regions correctly', () => {
    const element = document.createElement('div')
    AriaUtils.setLiveRegion(element, 'assertive')
    
    expect(element.getAttribute('aria-live')).toBe('assertive')
    expect(element.getAttribute('aria-atomic')).toBe('true')
  })
})

describe('Accessibility Auditor', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('should detect missing alt text on images', () => {
    const img = document.createElement('img')
    img.src = 'test.jpg'
    document.body.appendChild(img)
    
    const issues = AccessibilityAuditor.auditPage()
    const altTextIssues = issues.filter(issue => issue.type === 'missing-alt-text')
    
    expect(altTextIssues).toHaveLength(1)
    expect(altTextIssues[0]?.severity).toBe('high')
  })

  it('should detect buttons without accessible names', () => {
    const button = document.createElement('button')
    document.body.appendChild(button)
    
    const issues = AccessibilityAuditor.auditPage()
    const buttonIssues = issues.filter(issue => issue.type === 'missing-button-name')
    
    expect(buttonIssues).toHaveLength(1)
    expect(buttonIssues[0]?.severity).toBe('high')
  })

  it('should generate accessibility reports', () => {
    const report = AccessibilityAuditor.generateReport()
    
    expect(report).toHaveProperty('score')
    expect(report).toHaveProperty('issues')
    expect(report).toHaveProperty('recommendations')
    expect(report).toHaveProperty('timestamp')
    expect(Array.isArray(report.issues)).toBe(true)
    expect(Array.isArray(report.recommendations)).toBe(true)
  })
})

describe('Accessibility Initialization', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    // Remove existing event listeners
    document.removeEventListener('keydown', KeyboardShortcuts.handleKeyDown)
  })

  it('should initialize accessibility features', () => {
    const mockUIStore = {
      setActiveTab: vi.fn(),
      toggleSidebar: vi.fn()
    }
    
    initializeAccessibility(mockUIStore)
    
    // Check that skip links were added
    const skipLinks = document.querySelectorAll('a[href^="#"]')
    expect(skipLinks.length).toBeGreaterThan(0)
    
    // Check that body classes are managed
    expect(document.body.classList.contains('keyboard-navigation')).toBe(false)
  })
})