import { describe, it, expect } from 'vitest'
import { 
  strategyConfigSchema, 
  tradeEntrySchema, 
  userSettingsSchema,
  backtestConfigSchema,
  passwordSchema,
  emailSchema,
  phoneSchema
} from '../validations'

describe('Validation Schemas', () => {
  describe('strategyConfigSchema', () => {
    it('validates a complete strategy configuration', () => {
      const validStrategy = {
        name: 'Test Strategy',
        description: 'A test strategy for validation',
        type: 'long' as const,
        universe: ['AAPL', 'GOOGL', 'MSFT'],
        maxPositionSize: 10,
        maxDailyLoss: 5,
        maxDrawdown: 15,
        leverageLimit: 2,
        stopLoss: 2,
        takeProfit: 6,
        trailingStop: 1,
      }

      const result = strategyConfigSchema.safeParse(validStrategy)
      expect(result.success).toBe(true)
    })

    it('rejects invalid strategy name', () => {
      const invalidStrategy = {
        name: '', // Empty name
        type: 'long' as const,
        universe: ['AAPL'],
        maxPositionSize: 10,
        maxDailyLoss: 5,
        maxDrawdown: 15,
        leverageLimit: 1,
        stopLoss: 2,
        takeProfit: 6,
        trailingStop: 1,
      }

      const result = strategyConfigSchema.safeParse(invalidStrategy)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Strategy name is required')
      }
    })

    it('rejects invalid symbols in universe', () => {
      const invalidStrategy = {
        name: 'Test Strategy',
        type: 'long' as const,
        universe: ['aapl', 'GOOGL!'], // lowercase and special character
        maxPositionSize: 10,
        maxDailyLoss: 5,
        maxDrawdown: 15,
        leverageLimit: 1,
        stopLoss: 2,
        takeProfit: 6,
        trailingStop: 1,
      }

      const result = strategyConfigSchema.safeParse(invalidStrategy)
      expect(result.success).toBe(false)
    })

    it('rejects out-of-range risk parameters', () => {
      const invalidStrategy = {
        name: 'Test Strategy',
        type: 'long' as const,
        universe: ['AAPL'],
        maxPositionSize: 150, // Over 100%
        maxDailyLoss: 5,
        maxDrawdown: 15,
        leverageLimit: 1,
        stopLoss: 2,
        takeProfit: 6,
        trailingStop: 1,
      }

      const result = strategyConfigSchema.safeParse(invalidStrategy)
      expect(result.success).toBe(false)
    })
  })

  describe('tradeEntrySchema', () => {
    it('validates a complete trade entry', () => {
      const validTrade = {
        symbol: 'AAPL',
        side: 'buy' as const,
        quantity: 100,
        price: 150.50,
        orderType: 'limit' as const,
        timeInForce: 'gtc' as const,
        notes: 'Test trade',
      }

      const result = tradeEntrySchema.safeParse(validTrade)
      expect(result.success).toBe(true)
    })

    it('rejects invalid symbol format', () => {
      const invalidTrade = {
        symbol: 'aapl!', // lowercase with special character
        side: 'buy' as const,
        quantity: 100,
        price: 150.50,
        orderType: 'limit' as const,
      }

      const result = tradeEntrySchema.safeParse(invalidTrade)
      expect(result.success).toBe(false)
    })

    it('rejects negative quantities and prices', () => {
      const invalidTrade = {
        symbol: 'AAPL',
        side: 'buy' as const,
        quantity: -100, // Negative quantity
        price: 150.50,
        orderType: 'limit' as const,
      }

      const result = tradeEntrySchema.safeParse(invalidTrade)
      expect(result.success).toBe(false)
    })
  })

  describe('userSettingsSchema', () => {
    it('validates complete user settings', () => {
      const validSettings = {
        theme: 'dark' as const,
        notifications: {
          email: true,
          push: false,
          tradingAlerts: true,
          systemUpdates: true,
          marketNews: false,
        },
        display: {
          currency: 'USD' as const,
          timeZone: 'America/New_York',
          chartTheme: 'dark' as const,
          compactMode: false,
        },
        trading: {
          defaultRiskLevel: 2.5,
          autoExecute: false,
          confirmTrades: true,
          maxDailyTrades: 50,
        },
      }

      const result = userSettingsSchema.safeParse(validSettings)
      expect(result.success).toBe(true)
    })

    it('rejects invalid time zone format', () => {
      const invalidSettings = {
        theme: 'dark' as const,
        notifications: {
          email: true,
          push: false,
          tradingAlerts: true,
          systemUpdates: true,
          marketNews: false,
        },
        display: {
          currency: 'USD' as const,
          timeZone: 'InvalidTimeZone', // Invalid format
          chartTheme: 'dark' as const,
          compactMode: false,
        },
        trading: {
          defaultRiskLevel: 2.5,
          autoExecute: false,
          confirmTrades: true,
          maxDailyTrades: 50,
        },
      }

      const result = userSettingsSchema.safeParse(invalidSettings)
      expect(result.success).toBe(false)
    })
  })

  describe('backtestConfigSchema', () => {
    it('validates complete backtest configuration', () => {
      const validConfig = {
        startDate: '2023-01-01',
        endDate: '2023-12-31',
        initialCapital: 100000,
        benchmark: 'SPY',
        commission: 1.0,
        slippage: 0.1,
      }

      const result = backtestConfigSchema.safeParse(validConfig)
      expect(result.success).toBe(true)
    })

    it('rejects end date before start date', () => {
      const invalidConfig = {
        startDate: '2023-12-31',
        endDate: '2023-01-01', // End before start
        initialCapital: 100000,
        benchmark: 'SPY',
        commission: 1.0,
        slippage: 0.1,
      }

      const result = backtestConfigSchema.safeParse(invalidConfig)
      expect(result.success).toBe(false)
    })

    it('rejects invalid date format', () => {
      const invalidConfig = {
        startDate: '01/01/2023', // Wrong format
        endDate: '2023-12-31',
        initialCapital: 100000,
        benchmark: 'SPY',
        commission: 1.0,
        slippage: 0.1,
      }

      const result = backtestConfigSchema.safeParse(invalidConfig)
      expect(result.success).toBe(false)
    })
  })

  describe('passwordSchema', () => {
    it('validates strong password', () => {
      const strongPassword = 'MyStr0ng!Pass'
      const result = passwordSchema.safeParse(strongPassword)
      expect(result.success).toBe(true)
    })

    it('rejects weak passwords', () => {
      const weakPasswords = [
        'password', // No uppercase, number, or special char
        'PASSWORD', // No lowercase, number, or special char
        'Password', // No number or special char
        'Pass123', // No special char
        'Pass!', // Too short
        'a'.repeat(129), // Too long
      ]

      weakPasswords.forEach(password => {
        const result = passwordSchema.safeParse(password)
        expect(result.success).toBe(false)
      })
    })
  })

  describe('emailSchema', () => {
    it('validates proper email addresses', () => {
      const validEmails = [
        'user@example.com',
        'test.email+tag@domain.co.uk',
        'user123@test-domain.org',
      ]

      validEmails.forEach(email => {
        const result = emailSchema.safeParse(email)
        expect(result.success).toBe(true)
      })
    })

    it('rejects invalid email addresses', () => {
      const invalidEmails = [
        'invalid-email',
        '@domain.com',
        'user@',
        'user space@domain.com',
        'a'.repeat(250) + '@domain.com', // Too long
      ]

      invalidEmails.forEach(email => {
        const result = emailSchema.safeParse(email)
        expect(result.success).toBe(false)
      })
    })
  })

  describe('phoneSchema', () => {
    it('validates international phone numbers', () => {
      const validPhones = [
        '+1234567890',
        '+442071234567',
        '+33123456789',
      ]

      validPhones.forEach(phone => {
        const result = phoneSchema.safeParse(phone)
        expect(result.success).toBe(true)
      })
    })

    it('rejects invalid phone numbers', () => {
      const invalidPhones = [
        '1234567890', // Missing +
        '+0123456789', // Starts with 0
        '+1 234 567 890', // Contains spaces
        '+' + '1'.repeat(16), // Too long
      ]

      invalidPhones.forEach(phone => {
        const result = phoneSchema.safeParse(phone)
        expect(result.success).toBe(false)
      })
    })
  })
})