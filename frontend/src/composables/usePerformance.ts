import { ref, onMounted, onUnmounted, computed } from 'vue'
import { performanceMonitor, memoryManager, type MemoryManager } from '@/utils/performance'

export function usePerformance() {
  const metrics = ref({
    fcp: null as number | null,
    lcp: null as number | null,
    fid: null as number | null,
    cls: null as number | null,
    ttfb: null as number | null
  })

  const memory = ref({
    used: 0,
    total: 0,
    limit: 0
  })

  const score = computed(() => performanceMonitor.getScore())

  const updateMetrics = () => {
    metrics.value = performanceMonitor.getMetrics()
    const memoryUsage = memoryManager.getMemoryUsage()
    if (memoryUsage) {
      memory.value = memoryUsage
    }
  }

  onMounted(() => {
    updateMetrics()

    // Update metrics every 5 seconds
    const interval = memoryManager.addInterval(updateMetrics, 5000)

    // Update on key performance events
    window.addEventListener('load', updateMetrics)

    memoryManager.addCleanup(() => {
      window.removeEventListener('load', updateMetrics)
    })
  })

  return {
    metrics: computed(() => metrics.value),
    memory: computed(() => memory.value),
    score,
    updateMetrics
  }
}

export function useMemoryOptimization() {
  const cleanup = ref<(() => void)[]>([])

  const addCleanup = (fn: () => void) => {
    cleanup.value.push(fn)
    memoryManager.addCleanup(fn)
  }

  const addInterval = (fn: () => void, delay: number) => {
    return memoryManager.addInterval(fn, delay)
  }

  const addTimeout = (fn: () => void, delay: number) => {
    return memoryManager.addTimeout(fn, delay)
  }

  onUnmounted(() => {
    cleanup.value.forEach(fn => fn())
    cleanup.value = []
  })

  return {
    addCleanup,
    addInterval,
    addTimeout
  }
}

// Virtual scrolling for large lists
export function useVirtualScrolling(items: any[], itemHeight: number = 50) {
  const containerRef = ref<HTMLElement>()
  const scrollTop = ref(0)
  const containerHeight = ref(0)

  const visibleItems = computed(() => {
    const start = Math.floor(scrollTop.value / itemHeight)
    const end = Math.min(
      start + Math.ceil(containerHeight.value / itemHeight) + 1,
      items.length
    )

    return {
      start,
      end,
      items: items.slice(start, end),
      offsetY: start * itemHeight,
      totalHeight: items.length * itemHeight
    }
  })

  const onScroll = (event: Event) => {
    const target = event.target as HTMLElement
    scrollTop.value = target.scrollTop
  }

  onMounted(() => {
    if (containerRef.value) {
      containerHeight.value = containerRef.value.clientHeight

      const resizeObserver = new ResizeObserver(() => {
        if (containerRef.value) {
          containerHeight.value = containerRef.value.clientHeight
        }
      })

      resizeObserver.observe(containerRef.value)

      memoryManager.addCleanup(() => {
        resizeObserver.disconnect()
      })
    }
  })

  return {
    containerRef,
    visibleItems,
    onScroll
  }
}

// Debounced search for better performance
export function useDebouncedSearch(delay: number = 300) {
  const searchTerm = ref('')
  const debouncedSearchTerm = ref('')
  let timeoutId: NodeJS.Timeout | null = null

  const updateDebouncedSearch = (value: string) => {
    searchTerm.value = value

    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    timeoutId = setTimeout(() => {
      debouncedSearchTerm.value = value
    }, delay)
  }

  onUnmounted(() => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
  })

  return {
    searchTerm,
    debouncedSearchTerm: computed(() => debouncedSearchTerm.value),
    updateSearch: updateDebouncedSearch
  }
}

// Image lazy loading composable
export function useImageLazyLoading() {
  const imageRef = ref<HTMLImageElement>()
  const isLoaded = ref(false)
  const isError = ref(false)

  onMounted(() => {
    if (imageRef.value && 'IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && imageRef.value) {
              const img = imageRef.value
              const src = img.dataset.src

              if (src) {
                img.src = src
                img.onload = () => {
                  isLoaded.value = true
                  observer.unobserve(img)
                }
                img.onerror = () => {
                  isError.value = true
                  observer.unobserve(img)
                }
              }
            }
          })
        },
        {
          rootMargin: '50px 0px',
          threshold: 0.1
        }
      )

      observer.observe(imageRef.value)

      memoryManager.addCleanup(() => {
        observer.disconnect()
      })
    }
  })

  return {
    imageRef,
    isLoaded: computed(() => isLoaded.value),
    isError: computed(() => isError.value)
  }
}
