import { z } from 'zod'

// Trading Strategy Validation Schemas
export const strategyConfigSchema = z.object({
  name: z.string()
    .min(1, 'Strategy name is required')
    .max(50, 'Strategy name must be less than 50 characters')
    .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Strategy name can only contain letters, numbers, spaces, hyphens, and underscores'),
  
  description: z.string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
  
  type: z.enum(['long', 'short', 'hedge', 'arbitrage'], {
    errorMap: () => ({ message: 'Invalid strategy type' })
  }),
  
  // Universe/Symbol validation
  universe: z.array(
    z.string()
      .min(1, 'Symbol cannot be empty')
      .max(10, 'Symbol must be less than 10 characters')
      .regex(/^[A-Z0-9]+$/, 'Symbol must contain only uppercase letters and numbers')
  ).min(1, 'At least one symbol is required')
    .max(100, 'Maximum 100 symbols allowed'),
  
  // Risk Management
  maxPositionSize: z.number()
    .min(0.01, 'Position size must be at least 0.01')
    .max(100, 'Position size cannot exceed 100%'),
  
  maxDailyLoss: z.number()
    .min(0.01, 'Daily loss limit must be at least 0.01')
    .max(50, 'Daily loss limit cannot exceed 50%'),
  
  maxDrawdown: z.number()
    .min(1, 'Max drawdown must be at least 1%')
    .max(50, 'Max drawdown cannot exceed 50%'),
  
  leverageLimit: z.number()
    .min(1, 'Leverage must be at least 1x')
    .max(10, 'Leverage cannot exceed 10x'),
  
  // Entry/Exit Logic
  stopLoss: z.number()
    .min(0.1, 'Stop loss must be at least 0.1%')
    .max(20, 'Stop loss cannot exceed 20%'),
  
  takeProfit: z.number()
    .min(0.1, 'Take profit must be at least 0.1%')
    .max(50, 'Take profit cannot exceed 50%'),
  
  trailingStop: z.number()
    .min(0, 'Trailing stop cannot be negative')
    .max(10, 'Trailing stop cannot exceed 10%'),
})

// Trade Entry Validation
export const tradeEntrySchema = z.object({
  symbol: z.string()
    .min(1, 'Symbol is required')
    .max(10, 'Symbol must be less than 10 characters')
    .regex(/^[A-Z0-9]+$/, 'Symbol must contain only uppercase letters and numbers'),
  
  side: z.enum(['buy', 'sell'], {
    errorMap: () => ({ message: 'Side must be either buy or sell' })
  }),
  
  quantity: z.number()
    .min(0.001, 'Quantity must be at least 0.001')
    .max(1000000, 'Quantity cannot exceed 1,000,000'),
  
  price: z.number()
    .min(0.01, 'Price must be at least 0.01')
    .max(1000000, 'Price cannot exceed 1,000,000'),
  
  orderType: z.enum(['market', 'limit', 'stop', 'stop_limit'], {
    errorMap: () => ({ message: 'Invalid order type' })
  }),
  
  timeInForce: z.enum(['day', 'gtc', 'ioc', 'fok'], {
    errorMap: () => ({ message: 'Invalid time in force' })
  }).optional(),
  
  notes: z.string()
    .max(1000, 'Notes must be less than 1000 characters')
    .optional(),
})

// Portfolio Settings Validation
export const portfolioSettingsSchema = z.object({
  initialCapital: z.number()
    .min(1000, 'Initial capital must be at least $1,000')
    .max(100000000, 'Initial capital cannot exceed $100,000,000'),
  
  baseCurrency: z.enum(['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD'], {
    errorMap: () => ({ message: 'Unsupported base currency' })
  }),
  
  riskTolerance: z.enum(['conservative', 'moderate', 'aggressive'], {
    errorMap: () => ({ message: 'Invalid risk tolerance level' })
  }),
  
  maxConcurrentPositions: z.number()
    .min(1, 'Must allow at least 1 concurrent position')
    .max(50, 'Cannot exceed 50 concurrent positions'),
})

// User Settings Validation
export const userSettingsSchema = z.object({
  theme: z.enum(['light', 'dark', 'system'], {
    errorMap: () => ({ message: 'Invalid theme selection' })
  }),
  
  notifications: z.object({
    email: z.boolean(),
    push: z.boolean(),
    tradingAlerts: z.boolean(),
    systemUpdates: z.boolean(),
    marketNews: z.boolean(),
  }),
  
  display: z.object({
    currency: z.enum(['USD', 'EUR', 'GBP'], {
      errorMap: () => ({ message: 'Unsupported display currency' })
    }),
    timeZone: z.string()
      .min(1, 'Time zone is required')
      .regex(/^[A-Za-z_]+\/[A-Za-z_]+$/, 'Invalid time zone format'),
    chartTheme: z.enum(['light', 'dark'], {
      errorMap: () => ({ message: 'Invalid chart theme' })
    }),
    compactMode: z.boolean(),
  }),
  
  trading: z.object({
    defaultRiskLevel: z.number()
      .min(0.1, 'Risk level must be at least 0.1%')
      .max(10, 'Risk level cannot exceed 10%'),
    autoExecute: z.boolean(),
    confirmTrades: z.boolean(),
    maxDailyTrades: z.number()
      .min(1, 'Must allow at least 1 trade per day')
      .max(1000, 'Cannot exceed 1000 trades per day'),
  }),
})

// Backtest Configuration Validation
export const backtestConfigSchema = z.object({
  startDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format')
    .refine((date) => {
      const parsed = new Date(date)
      const now = new Date()
      const minDate = new Date('2010-01-01')
      return parsed >= minDate && parsed <= now
    }, 'Start date must be between 2010-01-01 and today'),
  
  endDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format')
    .refine((date) => {
      const parsed = new Date(date)
      const now = new Date()
      return parsed <= now
    }, 'End date cannot be in the future'),
  
  initialCapital: z.number()
    .min(1000, 'Initial capital must be at least $1,000')
    .max(10000000, 'Initial capital cannot exceed $10,000,000'),
  
  benchmark: z.string()
    .min(1, 'Benchmark is required')
    .max(10, 'Benchmark symbol must be less than 10 characters')
    .regex(/^[A-Z0-9]+$/, 'Benchmark must contain only uppercase letters and numbers'),
  
  commission: z.number()
    .min(0, 'Commission cannot be negative')
    .max(100, 'Commission cannot exceed $100 per trade'),
  
  slippage: z.number()
    .min(0, 'Slippage cannot be negative')
    .max(5, 'Slippage cannot exceed 5%'),
}).refine((data) => {
  const start = new Date(data.startDate)
  const end = new Date(data.endDate)
  return start < end
}, {
  message: 'End date must be after start date',
  path: ['endDate']
})

// API Response Validation
export const apiResponseSchema = z.object({
  status: z.enum(['success', 'error']),
  message: z.string().optional(),
  timestamp: z.string().datetime(),
})

// Security - Password validation (if authentication is added)
export const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password cannot exceed 128 characters')
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
    'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')

// Email validation
export const emailSchema = z.string()
  .email('Invalid email address')
  .max(254, 'Email address too long')

// Phone number validation (for 2FA)
export const phoneSchema = z.string()
  .regex(/^\+[1-9]\d{1,14}$/, 'Phone number must be in international format (+1234567890)')

// Financial amount validation helper
export const financialAmountSchema = z.number()
  .refine((val) => {
    // Check for valid decimal places (max 2 for currency)
    const str = val.toString()
    const decimalIndex = str.indexOf('.')
    if (decimalIndex === -1) return true
    return str.length - decimalIndex - 1 <= 2
  }, 'Amount cannot have more than 2 decimal places')

// Export types for TypeScript
export type StrategyConfig = z.infer<typeof strategyConfigSchema>
export type TradeEntry = z.infer<typeof tradeEntrySchema>
export type PortfolioSettings = z.infer<typeof portfolioSettingsSchema>
export type UserSettings = z.infer<typeof userSettingsSchema>
export type BacktestConfig = z.infer<typeof backtestConfigSchema>
export type ApiResponse = z.infer<typeof apiResponseSchema>