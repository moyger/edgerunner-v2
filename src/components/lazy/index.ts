/**
 * Lazy-loaded components for performance optimization
 * Code splitting for better initial load times
 */

import { createLazyComponent } from '../shared/LazyWrapper'

// Lazy load major feature components
export const LazyDashboard = createLazyComponent(
  () => import('../features/dashboard/Dashboard'),
  'dashboard'
)

export const LazyStrategyBuilder = createLazyComponent(
  () => import('../features/strategy/StrategyBuilder'),
  'strategy'
)

export const LazyTradeJournalPage = createLazyComponent(
  () => import('../features/journal/TradeJournalPage'),
  'journal'
)

export const LazySettings = createLazyComponent(
  () => import('../features/settings/Settings'),
  'settings'
)

export const LazyDocumentation = createLazyComponent(
  () => import('../shared/Documentation'),
  'default'
)

export const LazyApiTestingPage = createLazyComponent(
  () => import('../features/api-testing/ApiTestingPage'),
  'default'
)

// Lazy load strategy sub-components for additional granular loading
export const LazyStrategyConfigDialog = createLazyComponent(
  () => import('../features/strategy/StrategyConfigDialog').then(m => ({ default: m.StrategyConfigDialog })),
  'default'
)

export const LazyStrategyEditSheet = createLazyComponent(
  () => import('../features/strategy/StrategyEditSheet').then(m => ({ default: m.StrategyEditSheet })),
  'default'
)

export const LazyStrategyComparisonDialog = createLazyComponent(
  () => import('../features/strategy/StrategyComparisonDialog').then(m => ({ default: m.StrategyComparisonDialog })),
  'default'
)

// Lazy load heavy UI components
export const LazyEquityChart = createLazyComponent(
  () => import('../features/dashboard/EquityChart').then(m => ({ default: m.EquityChart })),
  'default'
)

export const LazyTradeJournal = createLazyComponent(
  () => import('../features/journal/TradeJournal').then(m => ({ default: m.TradeJournal })),
  'default'
)

// Pre-load critical components (but still code-split)
export const preloadCriticalComponents = () => {
  // Pre-load dashboard since it's the default view
  import('../features/dashboard/Dashboard')
  
  // Pre-load sidebar and topbar since they're always visible
  import('../layout/Sidebar')
  import('../layout/TopBar')
}