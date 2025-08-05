import React, { Suspense, lazy, ComponentType } from 'react'
import { ErrorBoundary } from '../ErrorBoundary'
import { Skeleton } from '../../../components/ui/skeleton'
import { Card, CardContent } from '../../../components/ui/card'

// Loading skeleton for different component types
const LoadingSkeletons = {
  dashboard: (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    </div>
  ),
  
  strategy: (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-10 w-24" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-96 w-full" />
            </CardContent>
          </Card>
        </div>
        <div>
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  ),
  
  journal: (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <Skeleton className="h-6 w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  ),
  
  settings: (
    <div className="p-6 space-y-6">
      <Skeleton className="h-6 w-32 mb-4" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-4 w-24 mb-4" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  ),
  
  default: (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center space-y-4">
        <Skeleton className="h-8 w-32 mx-auto" />
        <Skeleton className="h-4 w-48 mx-auto" />
      </div>
    </div>
  )
}

interface LazyWrapperProps {
  children: React.ReactNode
  fallbackType?: keyof typeof LoadingSkeletons
  errorFallback?: React.ReactNode
}

// Wrapper component for lazy-loaded components
export function LazyWrapper({ 
  children, 
  fallbackType = 'default',
  errorFallback 
}: LazyWrapperProps) {
  return (
    <ErrorBoundary fallback={errorFallback}>
      <Suspense fallback={LoadingSkeletons[fallbackType]}>
        {children}
      </Suspense>
    </ErrorBoundary>
  )
}

// HOC for creating lazy components with proper loading states
export function createLazyComponent<T extends ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>,
  fallbackType: keyof typeof LoadingSkeletons = 'default'
) {
  const LazyComponent = lazy(componentImport)
  
  return function WrappedLazyComponent(props: React.ComponentProps<T>) {
    return (
      <LazyWrapper fallbackType={fallbackType}>
        <LazyComponent {...props} />
      </LazyWrapper>
    )
  }
}

// Performance monitoring HOC
export function withPerformanceMonitoring<T extends ComponentType<any>>(
  Component: T,
  componentName: string
) {
  return function PerformanceMonitoredComponent(props: React.ComponentProps<T>) {
    const startTime = performance.now()
    
    React.useEffect(() => {
      const endTime = performance.now()
      const renderTime = endTime - startTime
      
      // Log slow renders in development
      if (renderTime > 100 && import.meta.env.DEV) {
        console.warn(`Slow render detected for ${componentName}: ${renderTime.toFixed(2)}ms`)
      }
      
      // Send to monitoring in production
      if (import.meta.env.PROD && renderTime > 200) {
        // This would integrate with your monitoring system
        console.log(`Performance metric: ${componentName} rendered in ${renderTime.toFixed(2)}ms`)
      }
    }, [startTime])
    
    return <Component {...props} />
  }
}

