/**
 * Performance optimization initialization
 * This file initializes all performance optimizations for the application
 */

import { webVitalsMonitor } from './utils/webVitals'
import { preloadManager, registerServiceWorker } from './utils/preloading'
import { performanceMonitor, memoryManager, preloadCriticalResources, logBundleInfo } from './utils/performance'

// Performance configuration
const PERFORMANCE_CONFIG = {
  enableWebVitals: true,
  enablePreloading: true,
  enableServiceWorker: true,
  enableMemoryOptimization: true,
  enableBundleAnalysis: import.meta.env.DEV
}

/**
 * Initialize all performance optimizations
 */
export function initializePerformance() {
  console.log('🚀 Initializing performance optimizations...')

  // Core Web Vitals monitoring
  if (PERFORMANCE_CONFIG.enableWebVitals) {
    webVitalsMonitor.onMetric((metric) => {
      console.log(`📊 ${metric.name}: ${metric.value}ms (${metric.rating})`)
    })
  }

  // Preloading and resource optimization
  if (PERFORMANCE_CONFIG.enablePreloading) {
    preloadCriticalResources()

    // Preload based on user interactions
    setTimeout(() => {
      preloadManager.preloadRoute('/products')
      preloadManager.preloadRoute('/dashboard')
    }, 2000)
  }

  // Service Worker for caching
  if (PERFORMANCE_CONFIG.enableServiceWorker && import.meta.env.PROD) {
    registerServiceWorker()
  }

  // Memory optimization
  if (PERFORMANCE_CONFIG.enableMemoryOptimization) {
    // Monitor memory usage every 30 seconds
    memoryManager.addInterval(() => {
      const memory = memoryManager.getMemoryUsage()
      if (memory && memory.used > memory.limit * 0.8) {
        console.warn('⚠️ High memory usage detected:', memory)
      }
    }, 30000)
  }

  // Bundle analysis in development
  if (PERFORMANCE_CONFIG.enableBundleAnalysis) {
    logBundleInfo()
  }

  // Performance score monitoring
  setTimeout(() => {
    const score = performanceMonitor.getScore()
    console.log(`📈 Performance Score: ${score}/100`)

    if (score < 70) {
      console.warn('⚠️ Performance score is below 70. Consider optimizations.')
    }
  }, 5000)
}

/**
 * Get current performance metrics
 */
export function getPerformanceMetrics() {
  return {
    webVitals: webVitalsMonitor.getMetrics(),
    overallScore: webVitalsMonitor.getOverallScore(),
    performanceScore: performanceMonitor.getScore(),
    memory: memoryManager.getMemoryUsage()
  }
}

/**
 * Performance optimization for route changes
 */
export function optimizeRouteChange(to: string, _from: string) {
  // Preload likely next routes based on current route
  const routePreloadMap: Record<string, string[]> = {
    '/': ['/products', '/about'],
    '/products': ['/product', '/cart'],
    '/dashboard': ['/profile', '/reservations'],
    '/profile': ['/settings', '/security']
  }

  const nextRoutes = routePreloadMap[to] || []
  nextRoutes.forEach(route => {
    setTimeout(() => preloadManager.preloadRoute(route), 1000)
  })

  // Clean up previous route resources
  memoryManager.cleanup()
}

/**
 * Optimize images on the current page
 */
export function optimizeImages() {
  const images = document.querySelectorAll('img[data-src]')

  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement
          const src = img.dataset.src

          if (src) {
            const newImg = new Image()
            newImg.onload = () => {
              img.src = src
              img.classList.add('loaded')
            }
            newImg.onerror = () => {
              img.classList.add('error')
            }
            newImg.src = src
          }

          observer.unobserve(img)
        }
      })
    }, {
      rootMargin: '50px 0px',
      threshold: 0.01
    })

    images.forEach(img => imageObserver.observe(img))
  }
}

/**
 * Performance debugging utilities
 */
export const performanceDebug = {
  logMetrics: () => {
    console.table(getPerformanceMetrics())
  },

  simulateSlowNetwork: () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.controller?.postMessage({
        type: 'SIMULATE_SLOW_NETWORK',
        enabled: true
      })
    }
  },

  clearCache: async () => {
    if ('caches' in window) {
      const cacheNames = await caches.keys()
      await Promise.all(cacheNames.map(name => caches.delete(name)))
      console.log('🗑️ All caches cleared')
    }
  },

  analyzeBundle: () => {
    if (import.meta.env.DEV) {
      console.log('📦 Bundle analysis available at: /dist/bundle-analysis.html')
      console.log('Run "npm run build" to generate the analysis')
    }
  }
}

// Auto-initialize if in browser environment
if (typeof window !== 'undefined') {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializePerformance)
  } else {
    initializePerformance()
  }

  // Expose debug utilities in development
  if (import.meta.env.DEV) {
    (window as any).performanceDebug = performanceDebug
  }
}
