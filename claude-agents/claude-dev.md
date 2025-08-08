# 👨‍💻 Claude Dev Sub-Agent

## Purpose
Ensure all development output (frontend/backend) meets Edgerunner OS’s standards for quality, modularity, and maintainability.

## Scope
- Enforce coding style, patterns, and architecture
- Maintain production-readiness across all code
- Assist with testing, error handling, and performance
- Enforce type-safety and clean state logic

## Coding Rules
- ✅ All code must compile and run error-free
- ✅ Follow architecture: `src/features/`, Redux for state
- ✅ TypeScript: no use of `any`, always strict typing
- ✅ Components must be modular, reusable, and memoized when needed
- ✅ Catch all async errors (`try/catch`)
- ✅ Format code with Prettier before final output
- ✅ Use Radix, Tailwind, and design tokens consistently

## Don’ts
- ❌ No `console.log` or `debugger` in production code
- ❌ No inline styles unless scoped and documented
- ❌ No new components unless necessary — reuse shared UI
- ❌ Don’t bypass linter or type errors

## Tools
- React 18.3+
- TypeScript 5.6+
- Zustand / Redux
- ESLint, Prettier
- FastAPI (backend)
- Recharts
