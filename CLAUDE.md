# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## About This Project

Edgerunner v2 is a comprehensive algorithmic trading platform built with React and TypeScript. It provides real-time trading dashboard functionality, strategy building capabilities, backtesting, trade journaling, and portfolio management for quantitative traders.

## Development Commands

### Essential Commands
- `npm run dev` - Start development server on port 3000 (auto-opens browser)
- `npm run build` - Build for production (runs TypeScript compilation + Vite build)
- `npm run lint` - Run ESLint for code quality checks
- `npm run preview` - Preview production build locally

### Testing & Development
- `npm test` - Run test suite with Vitest
- `npm run test:ui` - Run tests with Vitest UI interface
- `npm run test:coverage` - Run tests with coverage reporting
- Testing framework: Vitest + React Testing Library + jsdom
- Test utilities available in `/src/test/test-utils.tsx` with theme provider wrapper
- The development server uses Vite with React Fast Refresh for instant updates
- TypeScript compilation happens in both development and build modes

## Architecture Overview

### Core Technology Stack
- **Frontend Framework**: React 18.3+ with TypeScript 5.6+
- **Build Tool**: Vite 6.0+ with React plugin
- **State Management**: Redux for global state (UI and trading data)
- **UI Framework**: Radix UI primitives with Tailwind CSS styling
- **Charts/Visualization**: Recharts for financial data visualization
- **Icons**: Lucide React
- **Styling**: Tailwind CSS with CSS custom properties for theming

### Application Structure

**High-Level Architecture:**
- Single-page application with tab-based navigation
- Global state management through Zustand stores
- Feature-based component organization
- Comprehensive TypeScript interfaces for trading domain objects

**Key Application Patterns:**
1. **Feature-Based Organization**: Components are organized by business domain (dashboard, trading, strategy, journal, settings)
2. **State Management**: Uses Redux with persistence for UI state and separate stores for trading data
3. **Component Composition**: Extensive use of Radix UI primitives composed into custom components
4. **Error Boundaries**: Comprehensive error handling wrapping each major feature
5. **Theme System**: CSS custom properties with light/dark mode support

### Directory Structure

```
src/
├── components/
│   ├── features/           # Business domain components
│   │   ├── dashboard/      # Trading dashboard and portfolio overview
│   │   ├── strategy/       # Strategy builder and management
│   │   ├── journal/        # Trade journaling and analytics
│   │   └── settings/       # Application configuration
│   ├── layout/             # App shell components (Sidebar, TopBar)
│   └── shared/             # Reusable components (ThemeProvider, etc.)
├── store/                  # Redux state management
├── types/                  # TypeScript type definitions
├── services/               # API and external service integration
├── hooks/                  # Custom React hooks
└── utils/                  # Utility functions
```

### State Management Architecture

**Redux Stores:**
- `uiStore.ts` - UI state (active tab, sidebar state, theme) with persistence
- `tradingStore.ts` - Trading data, strategies, and portfolio state

**State Patterns:**
- Actions and reducers that preserve existing component behavior
- Persistence for UI preferences using Redux Persist
- Redux DevTools integration for debugging
- Selectors and action creators for component compatibility

### Component Architecture

**UI Component System:**
- Comprehensive Radix UI component library in `/components/ui/`
- Custom business components compose UI primitives
- Consistent theming through CSS custom properties
- Responsive design with Tailwind utilities

**Key Component Patterns:**
- Error boundaries wrap each feature
- Feature components are self-contained with their own state
- Layout components handle navigation and theming
- Mock data is used throughout for development

### Trading Domain Model

**Core Types:**
- `Strategy` - Trading strategy configuration and performance
- `Position` - Open trading positions with P&L tracking
- `Trade` - Executed trade records
- `Portfolio` - Account-level aggregations
- Tab-based navigation system with `TabId` type

**Features Currently Implemented:**
- Real-time dashboard with equity curves and performance metrics
- Strategy builder with entry/exit logic configuration
- Trade journal with filtering and analytics
- Settings management for notifications, security, and account preferences
- Theme switching with persistence

### File Import Patterns

**Import Alias Configuration:**
- `@/` - Root directory alias configured in vite.config.ts
- Relative imports used throughout for better maintainability
- UI components imported from `/components/ui/` directory

**Component Export Patterns:**
- Feature components export through index.ts barrel files
- UI components are individual exports
- Types are centralized in `/src/types/index.ts`

## Development Guidelines

### Code Style & Patterns
- Use TypeScript strict mode - all types should be properly defined
- Follow the existing component composition patterns using Radix UI
- Maintain the feature-based directory organization
- Use Redux actions for state mutations, not direct state access
- Implement error boundaries for new features
- Follow the existing mock data patterns for development

### Input Validation & Security
- **Validation**: All forms use Zod schemas with React Hook Form integration
- **Sanitization**: Comprehensive input sanitization in `/src/lib/sanitization.ts`
- **Form validation helpers**: Available in `/src/hooks/useFormValidation.ts`
- **Security**: XSS prevention, SQL injection protection, and rate limiting implemented
- **Trading-specific validation**: Symbol validation, financial amount validation, risk parameter validation

### Error Monitoring & Configuration
- **Error Monitoring**: Sentry integration with trading-specific error tracking
- **Configuration Management**: Type-safe environment variable handling in `/src/lib/config.ts`
- **Performance Monitoring**: Built-in performance measurement for critical operations
- **Error Classification**: Trading-specific error types (connection, validation, order, calculation errors)
- **Sensitive Data Protection**: Automatic sanitization of financial data in error reports
- **Environment Support**: Development, staging, and production environment configurations

### Accessibility & WCAG Compliance
- **Screen Reader Support**: Comprehensive ARIA labeling and screen reader announcements
- **Keyboard Navigation**: Full keyboard accessibility with trading-specific shortcuts
- **Color Contrast**: WCAG 2.1 AA compliant color combinations with high contrast mode support
- **Focus Management**: Intelligent focus trapping and restoration for modals and dialogs
- **Semantic HTML**: Proper landmark roles, headings hierarchy, and semantic structure
- **Trading Accessibility**: Specialized accessibility features for financial data and trading actions
- **Skip Links**: Navigation shortcuts for keyboard users
- **Motion Preferences**: Respects reduced motion preferences for users with vestibular disorders

### Performance Optimization
- **Code Splitting**: Lazy-loaded components with React.Suspense for optimal bundle sizes
- **Component Memoization**: Strategic use of React.memo and useMemo for expensive calculations
- **Bundle Analysis**: Vite bundle analyzer integration for monitoring application size
- **Lazy Loading**: Feature-based code splitting with preloading for critical components
- **Memory Management**: Proper cleanup of subscriptions and event listeners

### UI Development
- Use existing UI components from `/components/ui/` before creating new ones
- Follow the Tailwind CSS patterns established in the codebase
- Respect the theme system using CSS custom properties
- Use Lucide React icons consistently
- Implement responsive design using Tailwind's responsive utilities

### Trading Feature Development
- Use the comprehensive type system in `/src/types/` for trading objects
- Follow the existing patterns for strategy, position, and trade management
- Integrate with the existing Redux stores rather than creating component-level state
- Use Recharts for any new financial visualizations
- Maintain the mock data approach until backend integration

### Performance Considerations
- Vite provides fast development builds with HMR
- React 18 concurrent features are available
- Redux provides efficient re-renders with proper selector usage
- Recharts is optimized for financial data visualization
- Consider virtualization for large data sets in tables/lists

## Important Notes

- No backend is currently implemented - all data is mocked
- Testing framework needs to be set up
- The app uses a tab-based navigation system rather than routing
- Theme switching is fully implemented with persistence
- Error boundaries are critical - maintain them for new features
- The build process requires both TypeScript compilation and Vite bundling

## Development Reminders
- Always provide a working URL when there's an update/changes especially on the frontend/backend