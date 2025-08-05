/**
 * Security utilities and Content Security Policy implementation
 * Banking-grade security for trading platform
 */

import { config } from './config'

// CSP directives for trading platform
export const CSP_DIRECTIVES = {
  'default-src': ["'self'"],
  'script-src': [
    "'self'",
    "'unsafe-inline'", // Required for Vite in development
    "'unsafe-eval'", // Required for Vite in development
    ...(config.app.environment === 'development' ? ["'unsafe-inline'", "'unsafe-eval'"] : []),
    'https://browser.sentry-cdn.com', // Sentry SDK
    'https://js.sentry-cdn.com',
  ],
  'style-src': [
    "'self'",
    "'unsafe-inline'", // Required for Tailwind CSS and dynamic styles
    'https://fonts.googleapis.com',
  ],
  'font-src': [
    "'self'",
    'https://fonts.gstatic.com',
    'data:', // For icon fonts
  ],
  'img-src': [
    "'self'",
    'data:', // For inline images and charts
    'blob:', // For generated charts
    'https:', // For external logos/images if needed
  ],
  'connect-src': [
    "'self'",
    config.api.baseUrl,
    config.websocket.url,
    'https://sentry.io', // Error reporting
    'https://*.sentry.io',
    ...(config.app.environment === 'development' ? ['ws://localhost:*', 'http://localhost:*'] : []),
  ],
  'frame-src': ["'none'"], // Prevent iframe embedding
  'object-src': ["'none'"], // Prevent object/embed
  'base-uri': ["'self'"], // Restrict base tag
  'form-action': ["'self'"], // Restrict form submissions
  'frame-ancestors': ["'none'"], // Prevent clickjacking
  'upgrade-insecure-requests': [], // Force HTTPS in production
}

// Generate CSP header string
export function generateCSPHeader(): string {
  const directives = Object.entries(CSP_DIRECTIVES)
    .map(([directive, sources]) => {
      if (sources.length === 0) {
        return directive
      }
      return `${directive} ${sources.join(' ')}`
    })
    .join('; ')
  
  return directives
}

// Security headers configuration
export const SECURITY_HEADERS = {
  // Content Security Policy
  'Content-Security-Policy': generateCSPHeader(),
  
  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',
  
  // Prevent iframe embedding (clickjacking protection)
  'X-Frame-Options': 'DENY',
  
  // XSS Protection
  'X-XSS-Protection': '1; mode=block',
  
  // Referrer Policy
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  
  // Permissions Policy (formerly Feature Policy)
  'Permissions-Policy': [
    'camera=()', // Disable camera
    'microphone=()', // Disable microphone
    'geolocation=()', // Disable geolocation
    'payment=()', // Disable payment API
    'usb=()', // Disable USB API
    'serial=()', // Disable serial API
  ].join(', '),
  
  ...(config.app.environment === 'production' && {
    // HTTPS enforcement (production only)
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  }),
}

// Apply security headers (for development server)
export function applySecurityHeaders(): void {
  if (typeof document === 'undefined') return
  
  // Add CSP via meta tag for development
  const existingCSP = document.querySelector('meta[http-equiv="Content-Security-Policy"]')
  if (!existingCSP) {
    const cspMeta = document.createElement('meta')
    cspMeta.setAttribute('http-equiv', 'Content-Security-Policy')
    cspMeta.setAttribute('content', generateCSPHeader())
    document.head.appendChild(cspMeta)
  }
  
  // Add other security meta tags
  const securityMetas = [
    { name: 'referrer', content: 'strict-origin-when-cross-origin' },
    { name: 'robots', content: 'noindex, nofollow' }, // Prevent search engine indexing
  ]
  
  securityMetas.forEach(({ name, content }) => {
    const existing = document.querySelector(`meta[name="${name}"]`)
    if (!existing) {
      const meta = document.createElement('meta')
      meta.setAttribute('name', name)
      meta.setAttribute('content', content)
      document.head.appendChild(meta)
    }
  })
}

// Session security utilities
export class SessionSecurity {
  private static readonly SESSION_KEY = 'edgerunner_session'
  private static readonly CSRF_KEY = 'edgerunner_csrf'
  private static sessionTimer: NodeJS.Timeout | null = null
  
  // Generate CSRF token
  static generateCSRFToken(): string {
    const array = new Uint8Array(32)
    crypto.getRandomValues(array)
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
  }
  
  // Initialize session security
  static initialize(): void {
    this.setupSessionTimeout()
    this.setupCSRFProtection()
    this.setupStorageEventHandling()
  }
  
  // Setup automatic session timeout
  private static setupSessionTimeout(): void {
    const timeoutMs = config.security.sessionTimeout
    
    this.sessionTimer = setTimeout(() => {
      this.expireSession('timeout')
    }, timeoutMs)
    
    // Reset timer on user activity
    const resetTimer = () => {
      if (this.sessionTimer) {
        clearTimeout(this.sessionTimer)
      }
      this.sessionTimer = setTimeout(() => {
        this.expireSession('timeout')
      }, timeoutMs)
    }
    
    // Listen for user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart']
    events.forEach(event => {
      document.addEventListener(event, resetTimer, { passive: true })
    })
  }
  
  // Setup CSRF protection
  private static setupCSRFProtection(): void {
    let csrfToken = localStorage.getItem(this.CSRF_KEY)
    if (!csrfToken) {
      csrfToken = this.generateCSRFToken()
      localStorage.setItem(this.CSRF_KEY, csrfToken)
    }
  }
  
  // Handle storage events (detect session hijacking)
  private static setupStorageEventHandling(): void {
    window.addEventListener('storage', (event) => {
      if (event.key === this.SESSION_KEY && event.newValue === null) {
        // Session was cleared in another tab
        this.expireSession('external_logout')
      }
    })
  }
  
  // Expire session
  private static expireSession(reason: string): void {
    localStorage.removeItem(this.SESSION_KEY)
    localStorage.removeItem(this.CSRF_KEY)
    
    if (this.sessionTimer) {
      clearTimeout(this.sessionTimer)
      this.sessionTimer = null
    }
    
    // Notify user
    const event = new CustomEvent('session-expired', { detail: { reason } })
    window.dispatchEvent(event)
  }
  
  // Get CSRF token for API requests
  static getCSRFToken(): string | null {
    return localStorage.getItem(this.CSRF_KEY)
  }
  
  // Validate session
  static isSessionValid(): boolean {
    const session = localStorage.getItem(this.SESSION_KEY)
    const csrf = localStorage.getItem(this.CSRF_KEY)
    return !!(session && csrf)
  }
}

// Input sanitization for additional security layers
export class SecuritySanitizer {
  // Remove potentially dangerous HTML attributes
  static sanitizeHTMLAttributes(element: Element): void {
    const dangerousAttributes = [
      'onload', 'onerror', 'onclick', 'onmouseover', 'onfocus',
      'onblur', 'onchange', 'onsubmit', 'onreset', 'onselect',
      'onunload', 'onbeforeunload', 'style'
    ]
    
    dangerousAttributes.forEach(attr => {
      element.removeAttribute(attr)
    })
  }
  
  // Sanitize clipboard content
  static sanitizeClipboard(text: string): string {
    return text
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove scripts
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/data:(?!image\/)/gi, '') // Remove non-image data URIs
      .replace(/vbscript:/gi, '') // Remove vbscript
      .trim()
  }
  
  // Validate file uploads (if implemented)
  static validateFileUpload(file: File): { valid: boolean; error?: string } {
    const allowedTypes = ['image/png', 'image/jpeg', 'image/gif', 'text/csv']
    const maxSize = 10 * 1024 * 1024 // 10MB
    
    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'File type not allowed' }
    }
    
    if (file.size > maxSize) {
      return { valid: false, error: 'File size too large' }
    }
    
    return { valid: true }
  }
}

// Security audit utilities
export class SecurityAuditor {
  // Check for common security issues
  static auditApplication(): SecurityAuditResult {
    const issues: SecurityIssue[] = []
    
    // Check for inline scripts
    const inlineScripts = document.querySelectorAll('script:not([src])')
    if (inlineScripts.length > 0) {
      issues.push({
        type: 'inline-script',
        severity: 'medium',
        description: `Found ${inlineScripts.length} inline scripts`,
        recommendation: 'Move scripts to external files'
      })
    }
    
    // Check for external dependencies
    const externalScripts = document.querySelectorAll('script[src^="http"]')
    if (externalScripts.length > 0) {
      issues.push({
        type: 'external-script',
        severity: 'low',
        description: `Found ${externalScripts.length} external scripts`,
        recommendation: 'Ensure all external scripts are from trusted sources'
      })
    }
    
    // Check for missing security headers
    const hasCSP = document.querySelector('meta[http-equiv="Content-Security-Policy"]')
    if (!hasCSP) {
      issues.push({
        type: 'missing-csp',
        severity: 'high',
        description: 'Content Security Policy not found',
        recommendation: 'Implement CSP headers'
      })
    }
    
    // Check localStorage usage
    const localStorageItems = Object.keys(localStorage)
    const sensitiveKeys = localStorageItems.filter(key => 
      /password|token|secret|key|auth/i.test(key)
    )
    
    if (sensitiveKeys.length > 0) {
      issues.push({
        type: 'sensitive-storage',
        severity: 'high',
        description: `Potentially sensitive data in localStorage: ${sensitiveKeys.join(', ')}`,
        recommendation: 'Use secure storage for sensitive data'
      })
    }
    
    return {
      issues,
      score: this.calculateSecurityScore(issues),
      timestamp: new Date().toISOString()
    }
  }
  
  private static calculateSecurityScore(issues: SecurityIssue[]): number {
    let score = 100
    
    issues.forEach(issue => {
      switch (issue.severity) {
        case 'high':
          score -= 20
          break
        case 'medium':
          score -= 10
          break
        case 'low':
          score -= 5
          break
      }
    })
    
    return Math.max(0, score)
  }
}

// Types
export interface SecurityIssue {
  type: string
  severity: 'low' | 'medium' | 'high'
  description: string
  recommendation: string
}

export interface SecurityAuditResult {
  issues: SecurityIssue[]
  score: number
  timestamp: string
}

// Initialize security on module load
if (typeof window !== 'undefined') {
  applySecurityHeaders()
  SessionSecurity.initialize()
}