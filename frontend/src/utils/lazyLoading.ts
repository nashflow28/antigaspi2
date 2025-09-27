import { defineAsyncComponent, AsyncComponentLoader, Component } from 'vue'

// Loading component for better UX during async loading
const LoadingComponent = defineAsyncComponent(() => import('@/components/performance/LoadingSkeleton.vue'))

// Error component for failed loads
const ErrorComponent = defineAsyncComponent(() => import('@/components/performance/ErrorFallback.vue'))

/**
 * Enhanced lazy loading with retry mechanism and loading states
 */
export function lazyLoad(
  loader: AsyncComponentLoader,
  options: {
    delay?: number
    timeout?: number
    suspensible?: boolean
    retry?: number
    loadingComponent?: Component
    errorComponent?: Component
  } = {}
) {
  const {
    delay = 200,
    timeout = 10000,
    suspensible = false,
    retry = 3,
    loadingComponent = LoadingComponent,
    errorComponent = ErrorComponent
  } = options

  let retries = 0

  const retryLoader = async () => {
    try {
      const component = await loader()
      return component
    } catch (error) {
      if (retries < retry) {
        retries++
        console.warn(`Component loading failed, retrying (${retries}/${retry})...`)
        await new Promise(resolve => setTimeout(resolve, 1000 * retries))
        return retryLoader()
      }
      throw error
    }
  }

  return defineAsyncComponent({
    loader: retryLoader,
    loadingComponent,
    errorComponent,
    delay,
    timeout,
    suspensible
  })
}

/**
 * Lazy load routes with route-level code splitting
 */
export function lazyRoute(importFn: () => Promise<any>) {
  return lazyLoad(importFn, {
    delay: 100,
    timeout: 15000,
    retry: 2
  })
}

/**
 * Lazy load heavy components (charts, maps, etc.)
 */
export function lazyHeavyComponent(importFn: () => Promise<any>) {
  return lazyLoad(importFn, {
    delay: 300,
    timeout: 20000,
    retry: 1
  })
}

/**
 * Preload component for better performance
 */
export function preloadComponent(importFn: () => Promise<any>) {
  // Preload after a delay to not block initial render
  setTimeout(() => {
    importFn().catch(() => {
      // Silently fail - component will be loaded when needed
    })
  }, 2000)
}

/**
 * Dynamic import with retry logic
 */
export async function dynamicImport<T>(
  importFn: () => Promise<T>,
  retries = 3,
  delay = 1000
): Promise<T> {
  try {
    return await importFn()
  } catch (error) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, delay))
      return dynamicImport(importFn, retries - 1, delay * 2)
    }
    throw error
  }
}
