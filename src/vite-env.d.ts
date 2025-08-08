/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_NAME: string
  readonly VITE_APP_VERSION: string
  readonly VITE_APP_ENVIRONMENT: string
  readonly VITE_SENTRY_DSN: string
  readonly VITE_SENTRY_ENABLED: string
  readonly VITE_API_BASE_URL: string
  readonly VITE_API_TIMEOUT: string
  readonly VITE_API_RETRY_ATTEMPTS: string
  readonly VITE_WS_URL: string
  readonly VITE_WS_RECONNECT_INTERVAL: string
  readonly VITE_WS_MAX_RECONNECT_ATTEMPTS: string
  readonly VITE_FEATURE_LIVE_TRADING: string
  readonly VITE_FEATURE_PAPER_TRADING: string
  readonly VITE_FEATURE_BACKTESTING: string
  readonly VITE_FEATURE_SOCIAL_TRADING: string
  readonly VITE_CSP_REPORT_URI: string
  readonly VITE_SESSION_TIMEOUT: string
  readonly VITE_DEFAULT_CURRENCY: string
  readonly VITE_DEFAULT_TIMEZONE: string
  readonly VITE_MAX_CONCURRENT_ORDERS: string
  readonly VITE_MAX_POSITION_SIZE: string
  readonly VITE_MOCK_API: string
  readonly VITE_DEBUG_MODE: string
  readonly VITE_SHOW_DEBUG_PANEL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}