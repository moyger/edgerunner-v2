import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from '../App.tsx'
import './index.css'

// Initialize monitoring, configuration, and security
import { initializeMonitoring, setupGlobalErrorHandlers } from './lib/monitoring'
import { config } from './lib/config'
import './lib/security' // Initialize security on import
import { initializeAccessibility } from './lib/accessibility'

// Initialize error monitoring
if (config.monitoring.sentryEnabled || config.app.environment === 'production') {
  initializeMonitoring()
}

// Setup global error handlers
setupGlobalErrorHandlers()

// Initialize accessibility features (basic setup, UI store integration happens in App)
initializeAccessibility()

// Add semantic structure to root
const rootElement = document.getElementById('root')!
rootElement.setAttribute('role', 'application')
rootElement.setAttribute('aria-label', 'Edgerunner v2 Trading Platform')

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)