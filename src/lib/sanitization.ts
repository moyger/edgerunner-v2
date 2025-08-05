/**
 * Input sanitization utilities for financial trading application
 * Prevents XSS, injection attacks, and ensures data integrity
 */

// HTML sanitization - removes dangerous HTML tags and attributes
export function sanitizeHtml(input: string): string {
  if (typeof input !== 'string') return ''
  
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim()
}

// SQL injection prevention - escape common SQL injection patterns
export function sanitizeSql(input: string): string {
  if (typeof input !== 'string') return ''
  
  return input
    .replace(/'/g, "''")
    .replace(/;/g, '\\;')
    .replace(/--/g, '\\--')
    .replace(/\/\*/g, '\\/*')
    .replace(/\*\//g, '\\*/')
    .replace(/xp_/gi, 'xp\\_')
    .replace(/sp_/gi, 'sp\\_')
    .trim()
}

// Symbol validation and sanitization for trading
export function sanitizeSymbol(symbol: string): string {
  if (typeof symbol !== 'string') return ''
  
  return symbol
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '') // Only allow alphanumeric characters
    .slice(0, 10) // Limit length to 10 characters
}

// Financial amount sanitization
export function sanitizeAmount(amount: number | string): number {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  
  if (isNaN(num) || !isFinite(num)) return 0
  
  // Round to 2 decimal places for currency
  return Math.round(num * 100) / 100
}

// Percentage sanitization
export function sanitizePercentage(percentage: number | string): number {
  const num = typeof percentage === 'string' ? parseFloat(percentage) : percentage
  
  if (isNaN(num) || !isFinite(num)) return 0
  
  // Clamp between 0 and 100, round to 2 decimal places
  return Math.round(Math.max(0, Math.min(100, num)) * 100) / 100
}

// Text sanitization for user content (descriptions, notes)
export function sanitizeText(text: string, maxLength: number = 1000): string {
  if (typeof text !== 'string') return ''
  
  return text
    .trim()
    .slice(0, maxLength)
    .replace(/[\r\n\t]+/g, ' ') // Replace multiple whitespace with single space
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/data:/gi, '') // Remove data: protocol
    .replace(/vbscript:/gi, '') // Remove vbscript: protocol
}

// Email sanitization
export function sanitizeEmail(email: string): string {
  if (typeof email !== 'string') return ''
  
  return email
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9@._+-]/g, '') // Only allow valid email characters including +
    .slice(0, 254) // RFC 5321 limit
}

// Phone number sanitization
export function sanitizePhone(phone: string): string {
  if (typeof phone !== 'string') return ''
  
  return phone
    .replace(/[^+0-9]/g, '') // Only allow + and digits
    .slice(0, 16) // Reasonable international phone number limit
}

// URL sanitization for external links
export function sanitizeUrl(url: string): string {
  if (typeof url !== 'string') return ''
  
  try {
    const parsed = new URL(url)
    
    // Only allow safe protocols
    const allowedProtocols = ['http:', 'https:', 'mailto:']
    if (!allowedProtocols.includes(parsed.protocol)) {
      return ''
    }
    
    return parsed.toString()
  } catch {
    return ''
  }
}

// JSON sanitization for API payloads
export function sanitizeJson(obj: any): any {
  if (obj === null || obj === undefined) return null
  
  if (typeof obj === 'string') {
    return sanitizeText(obj)
  }
  
  if (typeof obj === 'number') {
    return isFinite(obj) ? obj : 0
  }
  
  if (typeof obj === 'boolean') {
    return obj
  }
  
  if (Array.isArray(obj)) {
    return obj.map(sanitizeJson).slice(0, 1000) // Limit array size
  }
  
  if (typeof obj === 'object') {
    const sanitized: any = {}
    let keyCount = 0
    
    for (const [key, value] of Object.entries(obj)) {
      if (keyCount >= 100) break // Limit object keys
      
      const sanitizedKey = sanitizeText(key, 50)
      if (sanitizedKey) {
        sanitized[sanitizedKey] = sanitizeJson(value)
        keyCount++
      }
    }
    
    return sanitized
  }
  
  return null
}

// File name sanitization for uploads
export function sanitizeFileName(fileName: string): string {
  if (typeof fileName !== 'string') return ''
  
  return fileName
    .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace special chars except letters, numbers, dots, underscores, hyphens
    .replace(/\.\./g, '_') // Replace directory traversal patterns
    .replace(/_{2,}/g, '_') // Replace multiple underscores with single
    .replace(/^_+|_+$/g, '') // Remove leading/trailing underscores
    .slice(0, 255) // Limit filename length
}

// Strategy name sanitization
export function sanitizeStrategyName(name: string): string {
  if (typeof name !== 'string') return ''
  
  return name
    .trim()
    .replace(/[^a-zA-Z0-9\s\-_]/g, '') // Only allow alphanumeric, spaces, hyphens, underscores
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .slice(0, 50)
}

// Time zone sanitization
export function sanitizeTimeZone(timeZone: string): string {
  if (typeof timeZone !== 'string') return 'UTC'
  
  // Basic validation for timezone format (Area/Location)
  const sanitized = timeZone.replace(/[^a-zA-Z0-9/_]/g, '')
  
  // More specific check for valid timezone pattern - must have known area prefixes
  const validAreas = ['America', 'Europe', 'Asia', 'Africa', 'Australia', 'Pacific', 'Atlantic', 'Indian', 'Antarctica']
  const parts = sanitized.split('/')
  
  if (parts.length === 2 && validAreas.includes(parts[0]) && parts[1].length > 0) {
    return sanitized
  }
  
  return 'UTC' // Default to UTC if invalid
}

// Comprehensive input sanitization for forms
export function sanitizeFormData<T extends Record<string, any>>(data: T): T {
  const sanitized = {} as T
  
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      // Apply appropriate sanitization based on field name
      if (key.toLowerCase().includes('email')) {
        sanitized[key as keyof T] = sanitizeEmail(value) as T[keyof T]
      } else if (key.toLowerCase().includes('phone')) {
        sanitized[key as keyof T] = sanitizePhone(value) as T[keyof T]
      } else if (key.toLowerCase().includes('url') || key.toLowerCase().includes('link')) {
        sanitized[key as keyof T] = sanitizeUrl(value) as T[keyof T]
      } else if (key.toLowerCase().includes('symbol')) {
        sanitized[key as keyof T] = sanitizeSymbol(value) as T[keyof T]
      } else {
        sanitized[key as keyof T] = sanitizeText(value) as T[keyof T]
      }
    } else if (typeof value === 'number') {
      sanitized[key as keyof T] = sanitizeAmount(value) as T[keyof T]
    } else {
      sanitized[key as keyof T] = sanitizeJson(value)
    }
  }
  
  return sanitized
}

// Rate limiting helper for form submissions
export class RateLimiter {
  private attempts: Map<string, number[]> = new Map()
  
  constructor(
    private maxAttempts: number = 5,
    private windowMs: number = 60000 // 1 minute
  ) {}
  
  isAllowed(identifier: string): boolean {
    const now = Date.now()
    const attempts = this.attempts.get(identifier) || []
    
    // Remove old attempts outside the window
    const recentAttempts = attempts.filter(time => now - time < this.windowMs)
    
    if (recentAttempts.length >= this.maxAttempts) {
      return false
    }
    
    // Add current attempt
    recentAttempts.push(now)
    this.attempts.set(identifier, recentAttempts)
    
    return true
  }
  
  reset(identifier: string): void {
    this.attempts.delete(identifier)
  }
}

// Global rate limiter instance for form submissions
export const formRateLimiter = new RateLimiter(10, 60000) // 10 attempts per minute