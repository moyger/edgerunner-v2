import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock import.meta.env
const mockEnv = {
  VITE_APP_NAME: 'Test App',
  VITE_APP_VERSION: '1.0.0',
  VITE_APP_ENVIRONMENT: 'development',
  VITE_API_BASE_URL: 'http://localhost:8000/api',
  VITE_FEATURE_LIVE_TRADING: 'false',
  VITE_FEATURE_PAPER_TRADING: 'true',
  VITE_DEBUG_MODE: 'true',
  VITE_MAX_POSITION_SIZE: '0.1',
}

vi.stubGlobal('import', {
  meta: {
    env: mockEnv
  }
})

describe('Configuration Management', () => {
  beforeEach(() => {
    // Reset environment before each test
    vi.clearAllMocks()
  })

  describe('Environment Variable Parsing', () => {
    it('should parse string environment variables correctly', async () => {
      const { config } = await import('../config')
      
      expect(config.app.name).toBe('Test App')
      expect(config.app.version).toBe('1.0.0')
      expect(config.app.environment).toBe('development')
    })

    it('should parse boolean environment variables correctly', async () => {
      const { config } = await import('../config')
      
      expect(config.features.liveTrading).toBe(false)
      expect(config.features.paperTrading).toBe(true)
      expect(config.development.debugMode).toBe(true)
    })

    it('should parse number environment variables correctly', async () => {
      const { config } = await import('../config')
      
      expect(config.trading.maxPositionSize).toBe(0.1)
    })

    it('should use default values when environment variables are missing', async () => {
      // Mock missing environment variables
      vi.stubGlobal('import', {
        meta: {
          env: {}
        }
      })

      const { config } = await import('../config')
      
      expect(config.app.name).toBe('Edgerunner v2')
      expect(config.api.timeout).toBe(30000)
      expect(config.features.paperTrading).toBe(true)
    })
  })

  describe('Feature Flags', () => {
    it('should check if features are enabled correctly', async () => {
      const { featureFlags } = await import('../config')
      
      expect(featureFlags.isEnabled('paperTrading')).toBe(true)
      expect(featureFlags.isEnabled('liveTrading')).toBe(false)
    })

    it('should enforce feature requirements', async () => {
      const { featureFlags } = await import('../config')
      
      expect(() => featureFlags.requireFeature('paperTrading')).not.toThrow()
      expect(() => featureFlags.requireFeature('liveTrading')).toThrow()
    })

    it('should validate live trading requirements', async () => {
      const { featureFlags } = await import('../config')
      
      // Should be false in development even if enabled
      expect(featureFlags.canTradeLive()).toBe(false)
    })
  })

  describe('Environment Utilities', () => {
    it('should identify development environment correctly', async () => {
      const { isDevelopment, isProduction } = await import('../config')
      
      expect(isDevelopment).toBe(true)
      expect(isProduction).toBe(false)
    })
  })

  describe('Configuration Validation', () => {
    it('should validate valid configuration without errors', async () => {
      const { validateConfig } = await import('../config')
      
      expect(() => validateConfig()).not.toThrow()
    })

    it('should reject invalid environment values', async () => {
      vi.stubGlobal('import', {
        meta: {
          env: {
            ...mockEnv,
            VITE_APP_ENVIRONMENT: 'invalid'
          }
        }
      })

      const { validateConfig } = await import('../config')
      
      expect(() => validateConfig()).toThrow('Invalid environment: invalid')
    })

    it('should reject invalid URLs', async () => {
      vi.stubGlobal('import', {
        meta: {
          env: {
            ...mockEnv,
            VITE_API_BASE_URL: 'not-a-url'
          }
        }
      })

      const { validateConfig } = await import('../config')
      
      expect(() => validateConfig()).toThrow('Invalid API base URL')
    })

    it('should reject invalid position size', async () => {
      vi.stubGlobal('import', {
        meta: {
          env: {
            ...mockEnv,
            VITE_MAX_POSITION_SIZE: '2.0' // Over 100%
          }
        }
      })

      const { validateConfig } = await import('../config')
      
      expect(() => validateConfig()).toThrow('Invalid max position size')
    })
  })

  describe('Debug Utilities', () => {
    it('should log debug messages when debug mode is enabled', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      
      const { debug } = await import('../config')
      
      debug.log('test message')
      
      expect(consoleSpy).toHaveBeenCalledWith('[DEBUG]', 'test message')
      
      consoleSpy.mockRestore()
    })

    it('should not log debug messages when debug mode is disabled', async () => {
      vi.stubGlobal('import', {
        meta: {
          env: {
            ...mockEnv,
            VITE_DEBUG_MODE: 'false'
          }
        }
      })

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      
      const { debug } = await import('../config')
      
      debug.log('test message')
      
      expect(consoleSpy).not.toHaveBeenCalled()
      
      consoleSpy.mockRestore()
    })
  })

  describe('Public Configuration', () => {
    it('should redact sensitive information in public config', async () => {
      vi.stubGlobal('import', {
        meta: {
          env: {
            ...mockEnv,
            VITE_SENTRY_DSN: 'https://secret@sentry.io/123'
          }
        }
      })

      const { getPublicConfig } = await import('../config')
      
      const publicConfig = getPublicConfig()
      
      expect(publicConfig.monitoring.sentryDsn).toBe('[REDACTED]')
    })
  })
})