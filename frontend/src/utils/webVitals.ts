/**
 * Core Web Vitals monitoring and reporting
 */

interface WebVitalMetric {
  name: string
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  delta: number
  id: string
}

class WebVitalsMonitor {
  private metrics: Map<string, WebVitalMetric> = new Map()
  private callbacks: ((metric: WebVitalMetric) => void)[] = []

  constructor() {
    this.initializeObservers()
  }

  onMetric(callback: (metric: WebVitalMetric) => void) {
    this.callbacks.push(callback)
  }

  private reportMetric(metric: WebVitalMetric) {
    this.metrics.set(metric.name, metric)
    this.callbacks.forEach(callback => callback(metric))

    // Log to console in development
    if (import.meta.env.DEV) {
      console.log(`🔍 ${metric.name}:`, {
        value: `${metric.value}ms`,
        rating: metric.rating,
        id: metric.id
      })
    }
  }

  private initializeObservers() {
    // Largest Contentful Paint (LCP)
    this.observeLCP()

    // First Input Delay (FID)
    this.observeFID()

    // Cumulative Layout Shift (CLS)
    this.observeCLS()

    // First Contentful Paint (FCP)
    this.observeFCP()

    // Time to First Byte (TTFB)
    this.observeTTFB()
  }

  private observeLCP() {
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const lastEntry = entries[entries.length - 1] as any

          const metric: WebVitalMetric = {
            name: 'LCP',
            value: lastEntry.startTime,
            rating: this.getLCPRating(lastEntry.startTime),
            delta: lastEntry.startTime,
            id: this.generateId()
          }

          this.reportMetric(metric)
        })

        observer.observe({ type: 'largest-contentful-paint', buffered: true })
      } catch (e) {
        console.warn('LCP observer not supported')
      }
    }
  }

  private observeFID() {
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry: any) => {
            const value = entry.processingStart - entry.startTime

            const metric: WebVitalMetric = {
              name: 'FID',
              value,
              rating: this.getFIDRating(value),
              delta: value,
              id: this.generateId()
            }

            this.reportMetric(metric)
          })
        })

        observer.observe({ type: 'first-input', buffered: true })
      } catch (e) {
        console.warn('FID observer not supported')
      }
    }
  }

  private observeCLS() {
    if ('PerformanceObserver' in window) {
      try {
        let clsValue = 0

        const observer = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value
            }
          })

          const metric: WebVitalMetric = {
            name: 'CLS',
            value: clsValue,
            rating: this.getCLSRating(clsValue),
            delta: clsValue,
            id: this.generateId()
          }

          this.reportMetric(metric)
        })

        observer.observe({ type: 'layout-shift', buffered: true })
      } catch (e) {
        console.warn('CLS observer not supported')
      }
    }
  }

  private observeFCP() {
    const paintEntries = performance.getEntriesByType('paint')
    const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint')

    if (fcpEntry) {
      const metric: WebVitalMetric = {
        name: 'FCP',
        value: fcpEntry.startTime,
        rating: this.getFCPRating(fcpEntry.startTime),
        delta: fcpEntry.startTime,
        id: this.generateId()
      }

      this.reportMetric(metric)
    }
  }

  private observeTTFB() {
    const navigationEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[]

    if (navigationEntries.length > 0) {
      const entry = navigationEntries[0]
      const value = entry.responseStart - entry.requestStart

      const metric: WebVitalMetric = {
        name: 'TTFB',
        value,
        rating: this.getTTFBRating(value),
        delta: value,
        id: this.generateId()
      }

      this.reportMetric(metric)
    }
  }

  private getLCPRating(value: number): 'good' | 'needs-improvement' | 'poor' {
    if (value <= 2500) return 'good'
    if (value <= 4000) return 'needs-improvement'
    return 'poor'
  }

  private getFIDRating(value: number): 'good' | 'needs-improvement' | 'poor' {
    if (value <= 100) return 'good'
    if (value <= 300) return 'needs-improvement'
    return 'poor'
  }

  private getCLSRating(value: number): 'good' | 'needs-improvement' | 'poor' {
    if (value <= 0.1) return 'good'
    if (value <= 0.25) return 'needs-improvement'
    return 'poor'
  }

  private getFCPRating(value: number): 'good' | 'needs-improvement' | 'poor' {
    if (value <= 1800) return 'good'
    if (value <= 3000) return 'needs-improvement'
    return 'poor'
  }

  private getTTFBRating(value: number): 'good' | 'needs-improvement' | 'poor' {
    if (value <= 200) return 'good'
    if (value <= 500) return 'needs-improvement'
    return 'poor'
  }

  private generateId(): string {
    const timestamp = new Date().getTime()
    const random = Math.random().toString(36).substr(2, 9)
    return `${timestamp}-${random}`
  }

  getMetrics(): WebVitalMetric[] {
    return Array.from(this.metrics.values())
  }

  getOverallScore(): number {
    const metrics = this.getMetrics()
    if (metrics.length === 0) return 0

    let score = 0
    let count = 0

    metrics.forEach(metric => {
      switch (metric.rating) {
        case 'good':
          score += 100
          break
        case 'needs-improvement':
          score += 50
          break
        case 'poor':
          score += 0
          break
      }
      count++
    })

    return Math.round(score / count)
  }
}

// Export singleton
export const webVitalsMonitor = new WebVitalsMonitor()
