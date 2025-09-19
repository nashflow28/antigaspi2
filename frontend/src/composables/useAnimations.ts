import { ref, onMounted } from 'vue'

interface AnimationOptions {
  duration?: number
  delay?: number
  easing?: string
  fill?: 'forwards' | 'backwards' | 'both' | 'none'
}

const defaultOptions: AnimationOptions = {
  duration: 300,
  delay: 0,
  easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
  fill: 'forwards'
}

export const useAnimations = () => {
  const prefersReducedMotion = ref(
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )

  // Écouter les changements de préférence
  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  mediaQuery.addEventListener('change', (e) => {
    prefersReducedMotion.value = e.matches
  })

  const animate = (
    element: HTMLElement,
    keyframes: Keyframe[] | PropertyIndexedKeyframes,
    options: AnimationOptions = {}
  ): Animation | null => {
    if (prefersReducedMotion.value) {
      // Si l'utilisateur préfère les animations réduites, appliquer directement l'état final
      const finalKeyframe = Array.isArray(keyframes)
        ? keyframes[keyframes.length - 1]
        : keyframes

      if (finalKeyframe && typeof finalKeyframe === 'object') {
        Object.assign(element.style, finalKeyframe)
      }
      return null
    }

    const finalOptions = { ...defaultOptions, ...options }

    return element.animate(keyframes, {
      duration: finalOptions.duration,
      delay: finalOptions.delay,
      easing: finalOptions.easing,
      fill: finalOptions.fill
    })
  }

  // Animations pré-définies
  const fadeIn = (element: HTMLElement, options?: AnimationOptions) => {
    return animate(element, [
      { opacity: 0 },
      { opacity: 1 }
    ], options)
  }

  const fadeOut = (element: HTMLElement, options?: AnimationOptions) => {
    return animate(element, [
      { opacity: 1 },
      { opacity: 0 }
    ], options)
  }

  const slideInFromLeft = (element: HTMLElement, distance: number = 50, options?: AnimationOptions) => {
    return animate(element, [
      { transform: `translateX(-${distance}px)`, opacity: 0 },
      { transform: 'translateX(0)', opacity: 1 }
    ], options)
  }

  const slideInFromRight = (element: HTMLElement, distance: number = 50, options?: AnimationOptions) => {
    return animate(element, [
      { transform: `translateX(${distance}px)`, opacity: 0 },
      { transform: 'translateX(0)', opacity: 1 }
    ], options)
  }

  const slideInFromTop = (element: HTMLElement, distance: number = 30, options?: AnimationOptions) => {
    return animate(element, [
      { transform: `translateY(-${distance}px)`, opacity: 0 },
      { transform: 'translateY(0)', opacity: 1 }
    ], options)
  }

  const slideInFromBottom = (element: HTMLElement, distance: number = 30, options?: AnimationOptions) => {
    return animate(element, [
      { transform: `translateY(${distance}px)`, opacity: 0 },
      { transform: 'translateY(0)', opacity: 1 }
    ], options)
  }

  const scaleIn = (element: HTMLElement, options?: AnimationOptions) => {
    return animate(element, [
      { transform: 'scale(0.8)', opacity: 0 },
      { transform: 'scale(1)', opacity: 1 }
    ], options)
  }

  const scaleOut = (element: HTMLElement, options?: AnimationOptions) => {
    return animate(element, [
      { transform: 'scale(1)', opacity: 1 },
      { transform: 'scale(0.8)', opacity: 0 }
    ], options)
  }

  const bounce = (element: HTMLElement, options?: AnimationOptions) => {
    return animate(element, [
      { transform: 'translateY(0)' },
      { transform: 'translateY(-10px)' },
      { transform: 'translateY(0)' }
    ], { duration: 600, easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)', ...options })
  }

  const shake = (element: HTMLElement, options?: AnimationOptions) => {
    return animate(element, [
      { transform: 'translateX(0)' },
      { transform: 'translateX(-10px)' },
      { transform: 'translateX(10px)' },
      { transform: 'translateX(-10px)' },
      { transform: 'translateX(10px)' },
      { transform: 'translateX(0)' }
    ], { duration: 500, ...options })
  }

  const pulse = (element: HTMLElement, options?: AnimationOptions) => {
    return animate(element, [
      { transform: 'scale(1)' },
      { transform: 'scale(1.05)' },
      { transform: 'scale(1)' }
    ], { duration: 1000, ...options })
  }

  const glow = (element: HTMLElement, color: string = '#10B981', options?: AnimationOptions) => {
    return animate(element, [
      { boxShadow: 'none' },
      { boxShadow: `0 0 20px ${color}50` },
      { boxShadow: 'none' }
    ], { duration: 1500, ...options })
  }

  // Animation de typing pour le texte
  const typeWriter = async (element: HTMLElement, text: string, speed: number = 50) => {
    if (prefersReducedMotion.value) {
      element.textContent = text
      return
    }

    element.textContent = ''
    for (let i = 0; i <= text.length; i++) {
      element.textContent = text.slice(0, i)
      await new Promise(resolve => setTimeout(resolve, speed))
    }
  }

  // Animation en cascade pour une liste d'éléments
  const cascadeIn = (elements: HTMLElement[], options?: AnimationOptions & { stagger?: number }) => {
    const stagger = options?.stagger || 100
    const animations: Animation[] = []

    elements.forEach((element, index) => {
      const animation = slideInFromBottom(element, 30, {
        ...options,
        delay: index * stagger
      })
      if (animation) animations.push(animation)
    })

    return animations
  }

  // Animation de compteur pour les nombres
  const countUp = async (
    element: HTMLElement,
    from: number = 0,
    to: number,
    duration: number = 2000,
    formatter?: (value: number) => string
  ) => {
    if (prefersReducedMotion.value) {
      element.textContent = formatter ? formatter(to) : to.toString()
      return
    }

    const start = Date.now()
    const animate = () => {
      const now = Date.now()
      const progress = Math.min((now - start) / duration, 1)
      const current = from + (to - from) * progress

      element.textContent = formatter ? formatter(Math.floor(current)) : Math.floor(current).toString()

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }
    animate()
  }

  return {
    prefersReducedMotion,
    animate,
    fadeIn,
    fadeOut,
    slideInFromLeft,
    slideInFromRight,
    slideInFromTop,
    slideInFromBottom,
    scaleIn,
    scaleOut,
    bounce,
    shake,
    pulse,
    glow,
    typeWriter,
    cascadeIn,
    countUp
  }
}

// Hook pour animer automatiquement les éléments au scroll
export const useScrollAnimation = () => {
  const elementsToAnimate = ref<Map<HTMLElement, () => void>>(new Map())
  let observer: IntersectionObserver | null = null

  const addHTMLElement = (element: HTMLElement, animation: () => void) => {
    elementsToAnimate.value.set(element, animation)
    observer?.observe(element)
  }

  const removeHTMLElement = (element: HTMLElement) => {
    elementsToAnimate.value.delete(element)
    observer?.unobserve(element)
  }

  onMounted(() => {
    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const animation = elementsToAnimate.value.get(entry.target)
            if (animation) {
              animation()
              observer?.unobserve(entry.target)
              elementsToAnimate.value.delete(entry.target)
            }
          }
        })
      },
      {
        rootMargin: '50px 0px -100px 0px',
        threshold: 0.1
      }
    )

    elementsToAnimate.value.forEach((_, element) => {
      observer?.observe(element)
    })
  })

  return {
    addHTMLElement,
    removeHTMLElement
  }
}

// Classes CSS utilitaires pour les animations
export const animationClasses = {
  // Transitions de base
  transition: 'transition-all duration-300 ease-out',
  transitionFast: 'transition-all duration-150 ease-out',
  transitionSlow: 'transition-all duration-500 ease-out',

  // Hover effects
  hoverScale: 'hover:scale-105',
  hoverShadow: 'hover:shadow-lg',
  hoverGlow: 'hover:shadow-glow',
  hoverLift: 'hover:-translate-y-1',

  // Focus effects
  focusRing: 'focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
  focusVisible: 'focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',

  // Loading states
  loading: 'animate-pulse opacity-50 pointer-events-none',
  spinning: 'animate-spin',
  bouncing: 'animate-bounce',

  // Layout animations
  slideIn: 'transform transition-transform duration-300 ease-out',
  slideOut: 'transform transition-transform duration-300 ease-in',
  fadeIn: 'opacity-0 animate-fadeIn',
  fadeOut: 'opacity-100 animate-fadeOut'
}