# 🤖 Claude Agents - Edgerunner v2

This directory contains specialized Claude sub-agent configurations for the Edgerunner v2 algorithmic trading platform. Each agent is optimized for specific development domains to provide focused, expert assistance.

## 📋 Agent Directory

| Agent | Focus Area | Primary Responsibilities |
|-------|------------|-------------------------|
| **[claude-dev.md](./claude-dev.md)** | 🔧 Development & Build | Vite config, TypeScript setup, dev server, dependencies |
| **[claude-ui.md](./claude-ui.md)** | 🎨 UI/UX Design | Radix UI, Tailwind CSS, accessibility, responsive design |
| **[claude-api.md](./claude-api.md)** | 🔌 API Integration | FastAPI backend, broker adapters (IBKR/MT5/Bybit) |
| **[claude-backtest.md](./claude-backtest.md)** | 📈 Strategy Testing | Backtesting engine, performance metrics, trade simulation |
| **[claude-tester.md](./claude-tester.md)** | 🧪 Testing & QA | Vitest, React Testing Library, test coverage |

## 🚀 How to Use

### Direct Agent Invocation
```bash
# Example: Get UI development help
/claude-ui "Help me implement a responsive trading dashboard"

# Example: Debug build issues  
/claude-dev "Fix TypeScript compilation errors in development"

# Example: Set up API integration
/claude-api "Create IBKR adapter with order placement"
```

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

## 🏗 Architecture Context

All agents are designed for the Edgerunner v2 tech stack:

- **Frontend**: React 18+ with TypeScript 5.6+
- **Build Tool**: Vite 6.0+ with hot module replacement
- **UI Framework**: Radix UI primitives + Tailwind CSS
- **State**: Redux with persistence
- **Testing**: Vitest + React Testing Library
- **Backend**: FastAPI with broker integrations
- **Brokers**: Interactive Brokers, MetaTrader 5, Bybit

## 🔧 Project-Specific Optimizations

### 1. **Consolidated Instructions**
- Removed duplicate CLAUDE.md (main project instructions in root)
- Each agent references core project guidelines
- Specialized knowledge without redundancy

### 2. **Trading Domain Focus**
- Agents understand financial data types
- Trading-specific UI patterns
- Risk management considerations
- Performance calculation requirements

### 3. **Development Workflow Integration**
- Agents know the build process
- Understand path alias configuration (`@/`)
- Aware of component organization patterns
- Integrated with testing strategies

## 📚 Agent Cross-References

Agents are designed to work together:

- **claude-dev** ↔️ **claude-ui**: Development server + component building
- **claude-api** ↔️ **claude-backtest**: Data integration + strategy testing  
- **claude-ui** ↔️ **claude-tester**: Component development + accessibility testing
- **claude-backtest** ↔️ **claude-tester**: Strategy logic + calculation testing

## 🎯 Optimization Results

### Before Optimization:
- ❌ Duplicate CLAUDE.md with redundant information
- ❌ Empty/incomplete agent specifications
- ❌ No clear agent selection guidelines
- ❌ Generic instructions not trading-specific

### After Optimization:
- ✅ Comprehensive, specialized agent configurations
- ✅ Clear responsibility boundaries and focus areas
- ✅ Trading domain-specific knowledge and patterns
- ✅ Integrated workflow with cross-agent references
- ✅ Removal of redundant documentation

## 🔄 Usage Workflow

1. **Identify the Domain**: Development, UI, API, Testing, or Backtesting
2. **Select the Agent**: Use the agent directory above
3. **Provide Context**: Agents already know Edgerunner v2 architecture
4. **Get Specialized Help**: Agents provide focused, expert assistance

This optimized claude-agents directory provides specialized, non-redundant expertise for each aspect of Edgerunner v2 development while maintaining consistency with the main project guidelines.