/**
 * Performance monitoring and optimization utilities
 */

interface PerformanceMetrics {
  fcp: number | null
  lcp: number | null
  fid: number | null
  cls: number | null
  ttfb: number | null
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    fcp: null,
    lcp: null,
    fid: null,
    cls: null,
    ttfb: null
  }

  private observers: PerformanceObserver[] = []

  constructor() {
    this.initializeObservers()
  }

  private initializeObservers() {
    // Largest Contentful Paint
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const lastEntry = entries[entries.length - 1] as any
          this.metrics.lcp = lastEntry.startTime
        })
        lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true })
        this.observers.push(lcpObserver)
      } catch (e) {
        console.warn('LCP observer not supported')
      }

      // First Input Delay
      try {
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          entries.forEach((entry: any) => {
            this.metrics.fid = entry.processingStart - entry.startTime
          })
        })
        fidObserver.observe({ type: 'first-input', buffered: true })
        this.observers.push(fidObserver)
      } catch (e) {
        console.warn('FID observer not supported')
      }

      // Cumulative Layout Shift
      try {
        const clsObserver = new PerformanceObserver((list) => {
          let cls = 0
          list.getEntries().forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              cls += entry.value
            }
          })
          this.metrics.cls = cls
        })
        clsObserver.observe({ type: 'layout-shift', buffered: true })
        this.observers.push(clsObserver)
      } catch (e) {
        console.warn('CLS observer not supported')
      }
    }

    // First Contentful Paint
    this.measureFCP()

    // Time to First Byte
    this.measureTTFB()
  }

  private measureFCP() {
    const paintEntries = performance.getEntriesByType('paint')
    const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint')
    if (fcpEntry) {
      this.metrics.fcp = fcpEntry.startTime
    }
  }

  private measureTTFB() {
    const navigationEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[]
    if (navigationEntries.length > 0) {
      const entry = navigationEntries[0]
      this.metrics.ttfb = entry.responseStart - entry.requestStart
    }
  }

  getMetrics(): PerformanceMetrics {
    return { ...this.metrics }
  }

  getScore(): number {
    const { fcp, lcp, fid, cls, ttfb } = this.metrics
    let score = 100

    // FCP scoring (good: <1.8s, needs improvement: 1.8-3s, poor: >3s)
    if (fcp !== null) {
      if (fcp > 3000) score -= 20
      else if (fcp > 1800) score -= 10
    }

    // LCP scoring (good: <2.5s, needs improvement: 2.5-4s, poor: >4s)
    if (lcp !== null) {
      if (lcp > 4000) score -= 25
      else if (lcp > 2500) score -= 15
    }

    // FID scoring (good: <100ms, needs improvement: 100-300ms, poor: >300ms)
    if (fid !== null) {
      if (fid > 300) score -= 20
      else if (fid > 100) score -= 10
    }

    // CLS scoring (good: <0.1, needs improvement: 0.1-0.25, poor: >0.25)
    if (cls !== null) {
      if (cls > 0.25) score -= 20
      else if (cls > 0.1) score -= 10
    }

    // TTFB scoring (good: <200ms, needs improvement: 200-500ms, poor: >500ms)
    if (ttfb !== null) {
      if (ttfb > 500) score -= 15
      else if (ttfb > 200) score -= 5
    }

    return Math.max(0, score)
  }

  disconnect() {
    this.observers.forEach(observer => observer.disconnect())
    this.observers = []
  }
}

// Memory management utilities
export class MemoryManager {
  private cleanupFunctions: (() => void)[] = []
  private intervals: NodeJS.Timeout[] = []
  private timeouts: NodeJS.Timeout[] = []

  addCleanup(fn: () => void) {
    this.cleanupFunctions.push(fn)
  }

  addInterval(fn: () => void, delay: number): NodeJS.Timeout {
    const interval = setInterval(fn, delay)
    this.intervals.push(interval)
    return interval
  }

  addTimeout(fn: () => void, delay: number): NodeJS.Timeout {
    const timeout = setTimeout(fn, delay)
    this.timeouts.push(timeout)
    return timeout
  }

  cleanup() {
    // Clear all intervals
    this.intervals.forEach(interval => clearInterval(interval))
    this.intervals = []

    // Clear all timeouts
    this.timeouts.forEach(timeout => clearTimeout(timeout))
    this.timeouts = []

    // Run cleanup functions
    this.cleanupFunctions.forEach(fn => {
      try {
        fn()
      } catch (error) {
        console.warn('Cleanup function failed:', error)
      }
    })
    this.cleanupFunctions = []
  }

  getMemoryUsage() {
    if ('memory' in performance) {
      const memory = (performance as any).memory
      return {
        used: Math.round(memory.usedJSHeapSize / 1048576 * 100) / 100, // MB
        total: Math.round(memory.totalJSHeapSize / 1048576 * 100) / 100, // MB
        limit: Math.round(memory.jsHeapSizeLimit / 1048576 * 100) / 100 // MB
      }
    }
    return null
  }
}

// Image lazy loading with intersection observer
export function setupImageLazyLoading() {
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement
          const src = img.dataset.src
          if (src) {
            img.src = src
            img.removeAttribute('data-src')
            observer.unobserve(img)
          }
        }
      })
    }, {
      rootMargin: '50px 0px',
      threshold: 0.01
    })

    // Observe all images with data-src
    document.querySelectorAll('img[data-src]').forEach(img => {
      imageObserver.observe(img)
    })

    return imageObserver
  }
  return null
}

// Resource hints utilities
export function addResourceHint(href: string, rel: 'preload' | 'prefetch' | 'preconnect', as?: string) {
  const link = document.createElement('link')
  link.rel = rel
  link.href = href
  if (as) link.setAttribute('as', as)
  document.head.appendChild(link)
}

export function preloadCriticalResources() {
  // Preconnect to API
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api'
  // Only preconnect if we have a full URL (not relative path)
  if (apiBaseUrl.startsWith('http')) {
    const apiOrigin = new URL(apiBaseUrl).origin
    addResourceHint(apiOrigin, 'preconnect')
  }

  // Preload critical fonts
  addResourceHint('/fonts/inter-var.woff2', 'preload', 'font')

  // Prefetch likely next routes
  setTimeout(() => {
    addResourceHint('/products', 'prefetch')
    addResourceHint('/dashboard', 'prefetch')
  }, 2000)
}

// Bundle size monitoring
export function logBundleInfo() {
  if (process.env.NODE_ENV === 'development') {
    console.log('📦 Bundle Analysis:', {
      chunks: Object.keys(import.meta.glob('../**/*.vue')).length,
      timestamp: new Date().toISOString(),
      url: 'dist/bundle-analysis.html (after build)'
    })
  }
}

// Export singleton instances
export const performanceMonitor = new PerformanceMonitor()
export const memoryManager = new MemoryManager()

// Auto cleanup on page unload
window.addEventListener('beforeunload', () => {
  performanceMonitor.disconnect()
  memoryManager.cleanup()
})
