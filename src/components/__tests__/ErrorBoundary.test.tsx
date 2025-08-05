import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '../../test/test-utils'
import { ErrorBoundary } from '../ErrorBoundary'

// Mock console.error to avoid noise in tests
const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

// Component that throws an error
const ThrowError = ({ shouldThrow = false }: { shouldThrow?: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error')
  }
  return <div>No error</div>
}

describe('ErrorBoundary', () => {
  afterEach(() => {
    consoleSpy.mockClear()
  })

  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    )

    expect(screen.getByText('No error')).toBeInTheDocument()
  })

  it('renders error UI when there is an error', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByText('We encountered an unexpected error. Please try refreshing the page or contact support if the problem persists.')).toBeInTheDocument()
  })

  it('shows error details in development', () => {
    // Set NODE_ENV to development for this test
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'development'

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText('Error Details (Development)')).toBeInTheDocument()
    expect(screen.getByText(/Test error/)).toBeInTheDocument()

    // Restore original environment
    process.env.NODE_ENV = originalEnv
  })

  it('provides a try again button', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
  })
})