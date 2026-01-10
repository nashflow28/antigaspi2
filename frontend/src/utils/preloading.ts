/**
 * Intelligent preloading and resource optimization
 */

// PreloadConfig can be used in the future for typed configuration objects
// interface PreloadConfig { routes: string[]; components: string[]; images: string[]; priority: 'high' | 'low'; delay?: number }

class PreloadManager {
  private preloadedRoutes = new Set<string>()
  private preloadedImages = new Set<string>()
  private observer?: IntersectionObserver

  constructor() {
    this.initializeIntersectionObserver()
    this.preloadCriticalResources()
  }

  private initializeIntersectionObserver() {
    if ('IntersectionObserver' in window) {
      this.observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const element = entry.target as HTMLElement
              const route = element.dataset.preloadRoute
              const image = element.dataset.preloadImage

              if (route) this.preloadRoute(route)
              if (image) this.preloadImage(image)

              this.observer?.unobserve(element)
            }
          })
        },
        { rootMargin: '100px 0px' }
      )
    }
  }

  preloadRoute(route: string, priority: 'high' | 'low' = 'low') {
    if (this.preloadedRoutes.has(route)) return

    const link = document.createElement('link')
    link.rel = 'prefetch'
    link.href = route
    link.as = 'document'

    if (priority === 'high') {
      link.rel = 'preload'
    }

    document.head.appendChild(link)
    this.preloadedRoutes.add(route)

    console.log(`🔗 Preloading route: ${route}`)
  }

  preloadImage(src: string, priority: 'high' | 'low' = 'low') {
    if (this.preloadedImages.has(src)) return

    const link = document.createElement('link')
    link.rel = priority === 'high' ? 'preload' : 'prefetch'
    link.href = src
    link.as = 'image'

    document.head.appendChild(link)
    this.preloadedImages.add(src)

    console.log(`🖼️ Preloading image: ${src}`)
  }

  preloadComponent(importFn: () => Promise<any>, delay = 2000) {
    setTimeout(() => {
      importFn().catch(() => {
        // Silently fail - component will be loaded when needed
      })
    }, delay)
  }

  private preloadCriticalResources() {
    // Preconnect to API
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'
    const apiOrigin = new URL(apiBaseUrl).origin
    this.addResourceHint(apiOrigin, 'preconnect')

    // Preload critical routes based on user role
    setTimeout(() => {
      this.preloadRoute('/products', 'high')
      this.preloadRoute('/dashboard')
    }, 1000)

    // Preload critical images
    setTimeout(() => {
      this.preloadImage('/images/hero-bg.jpg', 'high')
      this.preloadImage('/images/logo.svg', 'high')
    }, 500)
  }

  private addResourceHint(href: string, rel: 'preload' | 'prefetch' | 'preconnect', as?: string) {
    const link = document.createElement('link')
    link.rel = rel
    link.href = href
    if (as) link.setAttribute('as', as)
    document.head.appendChild(link)
  }

  observeElement(element: HTMLElement) {
    if (this.observer) {
      this.observer.observe(element)
    }
  }
}

// Export singleton
export const preloadManager = new PreloadManager()

// Service Worker registration
export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js')
        console.log('SW registered:', registration)
      } catch (error) {
        console.log('SW registration failed:', error)
      }
    })
  }
}
