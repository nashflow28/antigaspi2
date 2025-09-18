import { ref, onMounted, onUnmounted, Ref } from 'vue'

interface LazyLoadOptions {
  root?: Element | null
  rootMargin?: string
  threshold?: number | number[]
  loadingClass?: string
  errorClass?: string
  loadedClass?: string
}

const defaultOptions: LazyLoadOptions = {
  root: null,
  rootMargin: '50px',
  threshold: 0.1,
  loadingClass: 'lazy-loading',
  errorClass: 'lazy-error',
  loadedClass: 'lazy-loaded'
}

export const useLazyImage = (options: LazyLoadOptions = {}) => {
  const finalOptions = { ...defaultOptions, ...options }

  const imageRef: Ref<HTMLImageElement | null> = ref(null)
  const isLoaded = ref(false)
  const isLoading = ref(false)
  const hasError = ref(false)

  let observer: IntersectionObserver | null = null

  const loadImage = (img: HTMLImageElement, src: string) => {
    return new Promise<void>((resolve, reject) => {
      const imageLoader = new Image()

      imageLoader.onload = () => {
        img.src = src
        img.classList.remove(finalOptions.loadingClass!)
        img.classList.add(finalOptions.loadedClass!)
        isLoaded.value = true
        isLoading.value = false
        resolve()
      }

      imageLoader.onerror = () => {
        img.classList.remove(finalOptions.loadingClass!)
        img.classList.add(finalOptions.errorClass!)
        hasError.value = true
        isLoading.value = false
        reject(new Error('Failed to load image'))
      }

      imageLoader.src = src
    })
  }

  const observeImage = (img: HTMLImageElement) => {
    const dataSrc = img.dataset.src
    if (!dataSrc) return

    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const image = entry.target as HTMLImageElement
            const src = image.dataset.src

            if (src) {
              isLoading.value = true
              image.classList.add(finalOptions.loadingClass!)

              loadImage(image, src).catch(() => {
                // Error handled in loadImage
              })

              observer?.unobserve(image)
            }
          }
        })
      },
      {
        root: finalOptions.root,
        rootMargin: finalOptions.rootMargin,
        threshold: finalOptions.threshold
      }
    )

    observer.observe(img)
  }

  onMounted(() => {
    if (imageRef.value) {
      observeImage(imageRef.value)
    }
  })

  onUnmounted(() => {
    if (observer) {
      observer.disconnect()
    }
  })

  return {
    imageRef,
    isLoaded,
    isLoading,
    hasError
  }
}

export const useLazyContent = <T>(
  loadFunction: () => Promise<T>,
  options: { threshold?: number; rootMargin?: string } = {}
) => {
  const elementRef: Ref<Element | null> = ref(null)
  const content = ref<T | null>(null)
  const isLoaded = ref(false)
  const isLoading = ref(false)
  const error = ref<Error | null>(null)

  let observer: IntersectionObserver | null = null

  const load = async () => {
    if (isLoaded.value || isLoading.value) return

    isLoading.value = true
    error.value = null

    try {
      content.value = await loadFunction()
      isLoaded.value = true
    } catch (err) {
      error.value = err instanceof Error ? err : new Error('Unknown error')
    } finally {
      isLoading.value = false
    }
  }

  onMounted(() => {
    if (!elementRef.value) return

    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            load()
            observer?.unobserve(entry.target)
          }
        })
      },
      {
        rootMargin: options.rootMargin || '100px',
        threshold: options.threshold || 0.1
      }
    )

    observer.observe(elementRef.value)
  })

  onUnmounted(() => {
    if (observer) {
      observer.disconnect()
    }
  })

  return {
    elementRef,
    content,
    isLoaded,
    isLoading,
    error,
    load
  }
}

// Hook pour lazy loading de composants Vue
export const useLazyComponent = () => {
  const componentRef: Ref<Element | null> = ref(null)
  const shouldLoad = ref(false)

  let observer: IntersectionObserver | null = null

  onMounted(() => {
    if (!componentRef.value) return

    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            shouldLoad.value = true
            observer?.unobserve(entry.target)
          }
        })
      },
      {
        rootMargin: '200px',
        threshold: 0.01
      }
    )

    observer.observe(componentRef.value)
  })

  onUnmounted(() => {
    if (observer) {
      observer.disconnect()
    }
  })

  return {
    componentRef,
    shouldLoad
  }
}

// Helper pour optimiser les images
export const optimizeImageUrl = (
  url: string,
  width?: number,
  height?: number,
  quality: number = 80
): string => {
  if (!url) return ''

  // Si c'est une URL data: (base64), la retourner telle quelle
  if (url.startsWith('data:')) return url

  // Si c'est une URL externe complète, la retourner telle quelle pour l'instant
  if (url.startsWith('http')) return url

  // Pour les URLs relatives, on pourrait ajouter des paramètres d'optimisation
  // selon le service d'images utilisé (ex: Cloudinary, ImageKit, etc.)
  let optimizedUrl = url

  const params = new URLSearchParams()

  if (width) params.append('w', width.toString())
  if (height) params.append('h', height.toString())
  if (quality !== 80) params.append('q', quality.toString())

  if (params.toString()) {
    optimizedUrl += (url.includes('?') ? '&' : '?') + params.toString()
  }

  return optimizedUrl
}

// Générer des URLs responsive
export const generateSrcSet = (
  baseUrl: string,
  sizes: number[] = [320, 640, 768, 1024, 1280]
): string => {
  return sizes
    .map(size => `${optimizeImageUrl(baseUrl, size)} ${size}w`)
    .join(', ')
}

// Placeholder SVG pour les images
export const generatePlaceholder = (
  width: number = 300,
  height: number = 200,
  backgroundColor: string = '#f3f4f6',
  textColor: string = '#9ca3af',
  text: string = 'Chargement...'
): string => {
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="${backgroundColor}"/>
      <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="14" fill="${textColor}" text-anchor="middle" dy="0.3em">${text}</text>
    </svg>
  `

  return `data:image/svg+xml;base64,${btoa(svg)}`
}