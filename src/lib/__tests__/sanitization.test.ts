import { describe, it, expect, beforeEach } from 'vitest'
import { 
  sanitizeHtml,
  sanitizeSql,
  sanitizeSymbol,
  sanitizeAmount,
  sanitizePercentage,
  sanitizeText,
  sanitizeEmail,
  sanitizePhone,
  sanitizeUrl,
  sanitizeFileName,
  sanitizeStrategyName,
  sanitizeTimeZone,
  sanitizeFormData,
  RateLimiter
} from '../sanitization'

describe('Sanitization Functions', () => {
  describe('sanitizeHtml', () => {
    it('escapes HTML entities', () => {
      const maliciousHtml = '<script>alert("xss")</script>'
      const result = sanitizeHtml(maliciousHtml)
      expect(result).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;')
    })

    it('handles empty and non-string inputs', () => {
      expect(sanitizeHtml('')).toBe('')
      expect(sanitizeHtml(null as any)).toBe('')
      expect(sanitizeHtml(123 as any)).toBe('')
    })
  })

  describe('sanitizeSql', () => {
    it('escapes SQL injection patterns', () => {
      const sqlInjection = "'; DROP TABLE users; --"
      const result = sanitizeSql(sqlInjection)
      expect(result).toBe("''\\; DROP TABLE users\\; \\--")
    })

    it('escapes stored procedure calls', () => {
      const spCall = 'xp_cmdshell sp_configure'
      const result = sanitizeSql(spCall)
      expect(result).toBe('xp\\_cmdshell sp\\_configure')
    })
  })

  describe('sanitizeSymbol', () => {
    it('converts to uppercase and removes invalid characters', () => {
      expect(sanitizeSymbol('aapl')).toBe('AAPL')
      expect(sanitizeSymbol('GOOGL.US')).toBe('GOOGLUS')
      expect(sanitizeSymbol('BRK-A')).toBe('BRKA')
    })

    it('limits length to 10 characters', () => {
      const longSymbol = 'VERYLONGSYMBOL'
      expect(sanitizeSymbol(longSymbol)).toBe('VERYLONGSY')
    })

    it('handles non-string inputs', () => {
      expect(sanitizeSymbol(null as any)).toBe('')
      expect(sanitizeSymbol(123 as any)).toBe('')
    })
  })

  describe('sanitizeAmount', () => {
    it('rounds to 2 decimal places', () => {
      expect(sanitizeAmount(123.456)).toBe(123.46)
      expect(sanitizeAmount('123.456')).toBe(123.46)
    })

    it('handles invalid inputs', () => {
      expect(sanitizeAmount('invalid')).toBe(0)
      expect(sanitizeAmount(NaN)).toBe(0)
      expect(sanitizeAmount(Infinity)).toBe(0)
    })
  })

  describe('sanitizePercentage', () => {
    it('clamps between 0 and 100', () => {
      expect(sanitizePercentage(-5)).toBe(0)
      expect(sanitizePercentage(150)).toBe(100)
      expect(sanitizePercentage(50.567)).toBe(50.57)
    })
  })

  describe('sanitizeText', () => {
    it('removes dangerous content', () => {
      const dangerous = 'Hello<script>alert(1)</script>world'
      expect(sanitizeText(dangerous)).toBe('Helloscriptalert(1)/scriptworld')
    })

    it('removes protocol handlers', () => {
      const protocols = 'Click javascript:alert(1) or data:text/html,<script>alert(1)</script>'
      const result = sanitizeText(protocols)
      expect(result).not.toContain('javascript:')
      expect(result).not.toContain('data:')
    })

    it('respects max length', () => {
      const longText = 'a'.repeat(2000)
      expect(sanitizeText(longText, 100)).toHaveLength(100)
    })
  })

  describe('sanitizeEmail', () => {
    it('converts to lowercase and removes invalid characters', () => {
      expect(sanitizeEmail('USER@EXAMPLE.COM')).toBe('user@example.com')
      expect(sanitizeEmail('user+tag@domain.com')).toBe('user+tag@domain.com')
      expect(sanitizeEmail('user name@domain.com')).toBe('username@domain.com')
    })

    it('respects RFC 5321 length limit', () => {
      const longEmail = 'a'.repeat(300) + '@domain.com'
      expect(sanitizeEmail(longEmail)).toHaveLength(254)
    })
  })

  describe('sanitizePhone', () => {
    it('keeps only + and digits', () => {
      expect(sanitizePhone('+1 (555) 123-4567')).toBe('+15551234567')
      expect(sanitizePhone('555.123.4567')).toBe('5551234567')
    })

    it('limits length', () => {
      const longPhone = '+' + '1'.repeat(20)
      expect(sanitizePhone(longPhone)).toHaveLength(16)
    })
  })

  describe('sanitizeUrl', () => {
    it('allows safe protocols', () => {
      expect(sanitizeUrl('https://example.com')).toBe('https://example.com/')
      expect(sanitizeUrl('mailto:user@example.com')).toBe('mailto:user@example.com')
    })

    it('rejects dangerous protocols', () => {
      expect(sanitizeUrl('javascript:alert(1)')).toBe('')
      expect(sanitizeUrl('data:text/html,<script>alert(1)</script>')).toBe('')
      expect(sanitizeUrl('file:///etc/passwd')).toBe('')
    })

    it('handles invalid URLs', () => {
      expect(sanitizeUrl('not-a-url')).toBe('')
      expect(sanitizeUrl('')).toBe('')
    })
  })

  describe('sanitizeFileName', () => {
    it('replaces special characters with underscores', () => {
      expect(sanitizeFileName('my file!@#$.txt')).toBe('my_file_.txt')
      expect(sanitizeFileName('../../etc/passwd')).toBe('etc_passwd') // Directory traversal removed
    })

    it('removes leading and trailing underscores', () => {
      expect(sanitizeFileName('___file___')).toBe('file')
    })

    it('collapses multiple underscores', () => {
      expect(sanitizeFileName('my___file.txt')).toBe('my_file.txt')
    })
  })

  describe('sanitizeStrategyName', () => {
    it('allows only safe characters', () => {
      expect(sanitizeStrategyName('My Strategy #1!')).toBe('My Strategy 1')
      expect(sanitizeStrategyName('Test-Strategy_v2')).toBe('Test-Strategy_v2')
    })

    it('collapses multiple spaces', () => {
      expect(sanitizeStrategyName('My   Strategy')).toBe('My Strategy')
    })
  })

  describe('sanitizeTimeZone', () => {
    it('validates timezone format', () => {
      expect(sanitizeTimeZone('America/New_York')).toBe('America/New_York')
      expect(sanitizeTimeZone('Europe/London')).toBe('Europe/London')
    })

    it('defaults to UTC for invalid timezones', () => {
      expect(sanitizeTimeZone('Invalid/Timezone')).toBe('UTC')
      expect(sanitizeTimeZone('NotATimezone')).toBe('UTC')
      expect(sanitizeTimeZone('')).toBe('UTC')
    })
  })

  describe('sanitizeFormData', () => {
    it('sanitizes different field types appropriately', () => {
      const formData = {
        email: 'USER@EXAMPLE.COM',
        symbol: 'aapl',
        description: 'A <script>alert(1)</script> strategy',
        amount: 123.456,
        phone: '+1 (555) 123-4567',
        url: 'https://example.com',
        nested: {
          value: 'test'
        }
      }

      const sanitized = sanitizeFormData(formData)

      expect(sanitized.email).toBe('user@example.com')
      expect(sanitized.symbol).toBe('AAPL')
      expect(sanitized.description).not.toContain('<script>')
      expect(sanitized.amount).toBe(123.46)
      expect(sanitized.phone).toBe('+15551234567')
      expect(sanitized.url).toBe('https://example.com/')
    })
  })

  describe('RateLimiter', () => {
    let rateLimiter: RateLimiter

    beforeEach(() => {
      rateLimiter = new RateLimiter(3, 1000) // 3 attempts per second
    })

    it('allows requests within limit', () => {
      expect(rateLimiter.isAllowed('user1')).toBe(true)
      expect(rateLimiter.isAllowed('user1')).toBe(true)
      expect(rateLimiter.isAllowed('user1')).toBe(true)
    })

    it('blocks requests over limit', () => {
      // Use up the limit
      rateLimiter.isAllowed('user1')
      rateLimiter.isAllowed('user1')
      rateLimiter.isAllowed('user1')

      // Should be blocked
      expect(rateLimiter.isAllowed('user1')).toBe(false)
    })

    it('allows different users independently', () => {
      // Use up limit for user1
      rateLimiter.isAllowed('user1')
      rateLimiter.isAllowed('user1')
      rateLimiter.isAllowed('user1')

      // user2 should still be allowed
      expect(rateLimiter.isAllowed('user2')).toBe(true)
    })

    it('resets rate limit for user', () => {
      // Use up the limit
      rateLimiter.isAllowed('user1')
      rateLimiter.isAllowed('user1')
      rateLimiter.isAllowed('user1')

      // Reset and should be allowed again
      rateLimiter.reset('user1')
      expect(rateLimiter.isAllowed('user1')).toBe(true)
    })
  })
})