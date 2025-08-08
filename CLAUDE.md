# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Essential Commands

### Development
```bash
# Start full application (frontend + backend)
npm run dev

# Frontend only (if backend already running)
npm run dev:frontend-only

# Backend only
cd backend && python3 start.py

# Build production
npm run build

# Run tests
npm test                    # Run all tests
npm run test:ui            # Run tests with UI
npm run test:coverage      # Generate coverage report
npx vitest run path/to/test.ts  # Run single test file

# Type checking
npx tsc --noEmit

# Linting (needs eslint.config.js migration from v9)
npm run lint
```

### Backend Operations
```bash
# Start backend server
cd backend && python3 start.py

# Stop backend
npm run backend:stop

# Backend health check
curl http://localhost:8000/health
```

## Architecture Overview

### Full-Stack Auto-Startup System
This is a **zero-configuration trading platform** that automatically:
1. Starts the backend server if not running
2. Discovers available brokers (IBKR, MT5, ByBit)
3. Auto-connects to configured brokers
4. Syncs market data
5. Provides visual startup progress

The auto-startup logic is in `src/services/AutoStartupService.ts` and `src/components/StartupProgress.tsx`.

### Frontend Architecture

**State Management**: Zustand store in `src/store/uiStore.ts` manages global UI state. Access with:
```typescript
import { useUIStore } from '@/store/uiStore'
```

**Component Organization**:
- `src/components/features/` - Feature-specific components (dashboard, strategy, journal)
- `src/components/ui/` - shadcn/ui component library (don't modify directly)
- `src/components/shared/` - Reusable components
- `src/components/lazy/` - Lazy-loaded component exports with loading skeletons

**Service Layer** (`src/services/`):
- `ApiIntegrationManager` - Orchestrates all API calls with correlation tracking
- `WebSocketManager` - Real-time data with auto-reconnect
- `BrokerService` - Unified interface for multiple brokers
- `RateLimiter` - Broker-specific rate limiting
- `MonitoringService` - Logging and performance tracking

**Key Patterns**:
- All feature components are lazy-loaded through `LazyWrapper`
- API calls go through `ApiIntegrationManager` for monitoring
- Use correlation IDs for request tracking
- Paper trading mode is default (check `config.features.liveTrading`)

### Backend Architecture

**Structure**:
```
backend/src/
├── routes/     # FastAPI endpoints
├── services/   # Business logic
├── adapters/   # Broker integrations
└── models.py   # Pydantic models
```

**Broker Adapters**: Located in `backend/src/adapters/`. Each broker (IBKR, MT5, ByBit) has its own adapter implementing a common interface.

**Health & Diagnostics**: The backend provides `/health` and `/diagnostics` endpoints for system monitoring.

### Type System

All TypeScript types are centralized in `src/types/index.ts`:
- `Strategy`, `Position`, `Trade` - Trading entities
- `BrokerCredentials` - Broker authentication
- `WebSocketMessage` - Real-time message types
- `ApiResponse` - Standardized API responses

### Testing Strategy

**Setup**: Tests use Vitest with React Testing Library. Test utilities are in `src/test/`.

**Mocked APIs**: The setup mocks ResizeObserver, matchMedia, and localStorage for component tests.

**Running Tests**:
```bash
# Component test example
npx vitest run src/components/__tests__/Button.test.tsx

# Service test example  
npx vitest run src/services/__tests__/ApiClient.test.ts
```

### Configuration

**Frontend Config** (`src/lib/config.ts`):
- Environment-based configuration
- Feature flags for live/paper trading
- API endpoints and timeouts

**Backend Config** (`backend/src/config.py`):
- Broker credentials from environment
- Server ports and CORS settings

### Security Considerations

- Paper trading is **default** - live trading requires explicit config
- Credentials stored in `AuthManager` with encryption
- All API calls include correlation IDs for audit trails
- Rate limiting per broker to prevent API abuse
- WebSocket connections auto-authenticate

### Common Development Tasks

**Adding a New Broker**:
1. Create adapter in `backend/src/adapters/`
2. Add broker type to `src/types/index.ts`
3. Update `BrokerService` in `src/services/`
4. Add UI in settings component

**Creating a New Feature Component**:
1. Create component in `src/components/features/[feature]/`
2. Add lazy export in `src/components/lazy/index.ts`
3. Update routing in `App.tsx`
4. Add tab to sidebar if needed

**Modifying API Endpoints**:
1. Update backend route in `backend/src/routes/`
2. Update types in `src/types/index.ts`
3. Update service method in relevant service file
4. Handle in `ApiIntegrationManager` if needed

### Performance Optimization

- Components are code-split and lazy-loaded
- Use `React.memo` for expensive renders
- WebSocket messages are queued during reconnection
- API responses are cached with configurable TTL
- Rate limiting prevents API overload

### Monitoring & Debugging

**Frontend Monitoring**:
- Sentry integration for error tracking
- `MonitoringService` for custom metrics
- Correlation IDs link frontend/backend requests
- Performance tracking in `ApiIntegrationManager`

**Backend Monitoring**:
- Health checks at `/health`
- Diagnostics at `/diagnostics`
- Structured logging with correlation IDs

### Production Build

The production build:
- Minifies and removes console logs
- Splits code for optimal loading
- Includes Sentry source maps (needs auth token)
- Builds to `dist/` directory

### Claude Code Hooks

TTS notifications are configured in `claude_code_config.json` using ElevenLabs API. Scripts in `claude-hooks/` handle the audio playback.

## Claude Agents Directory

The `claude-agents/` directory contains specialized Claude sub-agent configurations optimized for specific development domains in the Edgerunner v2 platform. Each agent provides focused, expert assistance for different aspects of development.

### Available Agents

| Agent | Focus Area | Primary Responsibilities |
|-------|------------|-------------------------|
| **claude-dev** | Development & Build | Vite config, TypeScript setup, dev server, dependencies |
| **claude-ui** | UI/UX Design | Radix UI, Tailwind CSS, accessibility, responsive design |
| **claude-api** | API Integration | FastAPI backend, broker adapters (IBKR/MT5/Bybit) |
| **claude-backtest** | Strategy Testing | Backtesting engine, performance metrics, trade simulation |
| **claude-tester** | Testing & QA | Vitest, React Testing Library, test coverage |

### Agent Selection Guidelines

**Use `claude-dev` when:**
- Development server issues
- Build configuration problems
- Dependency management
- TypeScript compilation errors

**Use `claude-ui` when:**
- Designing dashboard layouts
- Implementing accessibility features
- Creating responsive interfaces
- Working with Radix UI components

**Use `claude-api` when:**
- Building backend endpoints
- Integrating broker APIs
- Creating WebSocket connections
- Handling trading data flows

**Use `claude-backtest` when:**
- Developing strategy testing
- Calculating performance metrics
- Building simulation engines
- Analyzing trading results

**Use `claude-tester` when:**
- Writing unit tests
- Setting up test framework
- Testing trading calculations
- Ensuring code coverage

### Agent Integration

All agents are designed with knowledge of the Edgerunner v2 tech stack and architecture. They understand:
- Project structure and path aliases (`@/`)
- Component organization patterns
- Trading-specific requirements and patterns
- State management with Zustand
- Testing strategies and frameworks
- Build process and configuration

The agents work collaboratively and can cross-reference each other's domains when needed (e.g., claude-ui working with claude-tester for accessibility testing).

## Important Notes

- Always check if backend is running before frontend development
- Use paper trading mode for testing (default)
- Don't modify `src/components/ui/` directly - these are shadcn/ui components
- Run type checking before committing: `npx tsc --noEmit`
- API rate limits are broker-specific - check `RateLimiter` config
- WebSocket reconnects automatically - don't manually reconnect
- All new features should support both light and dark themes