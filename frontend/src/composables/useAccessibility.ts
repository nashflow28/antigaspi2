import { ref, computed, onMounted, onUnmounted } from 'vue'

export interface AccessibilityOptions {
  trapFocus?: boolean
  autoFocus?: boolean
  restoreFocus?: boolean
  announceChanges?: boolean
}

export const useAccessibility = (options: AccessibilityOptions = {}) => {
  const {
    autoFocus = false,
    restoreFocus = false,
    announceChanges = true
  } = options

  const focusableElements = ref<HTMLElement[]>([])
  const currentFocusIndex = ref(0)
  const previouslyFocusedElement = ref<HTMLElement | null>(null)
  const announcer = ref<HTMLElement | null>(null)

  // Sélecteur pour les éléments focusables
  const focusableSelector = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]'
  ].join(', ')

  // Créer un annonceur pour les lecteurs d'écran
  const createAnnouncer = () => {
    const element = document.createElement('div')
    element.setAttribute('aria-live', 'polite')
    element.setAttribute('aria-atomic', 'true')
    element.style.position = 'absolute'
    element.style.left = '-10000px'
    element.style.width = '1px'
    element.style.height = '1px'
    element.style.overflow = 'hidden'
    document.body.appendChild(element)
    return element
  }

  // Annoncer un message aux lecteurs d'écran
  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (!announceChanges || !announcer.value) return

    announcer.value.setAttribute('aria-live', priority)
    announcer.value.textContent = ''

    setTimeout(() => {
      if (announcer.value) {
        announcer.value.textContent = message
      }
    }, 100)
  }

  // Obtenir tous les éléments focusables dans un conteneur
  const getFocusableElements = (container: HTMLElement): HTMLElement[] => {
    return Array.from(container.querySelectorAll(focusableSelector))
      .filter(element => {
        const htmlElement = element as HTMLElement
        return htmlElement.offsetWidth > 0 &&
               htmlElement.offsetHeight > 0 &&
               !htmlElement.hasAttribute('disabled')
      }) as HTMLElement[]
  }

  // Piéger le focus dans un conteneur
  const trapFocusInContainer = (container: HTMLElement) => {
    focusableElements.value = getFocusableElements(container)

    if (focusableElements.value.length === 0) return

    const firstElement = focusableElements.value[0]
    const lastElement = focusableElements.value[focusableElements.value.length - 1]

    const handleTabKey = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return

      if (event.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          event.preventDefault()
          lastElement.focus()
        }
      } else {
        // Tab seul
        if (document.activeElement === lastElement) {
          event.preventDefault()
          firstElement.focus()
        }
      }
    }

    container.addEventListener('keydown', handleTabKey)

    // Focus automatique si requis
    if (autoFocus) {
      firstElement.focus()
    }

    return () => {
      container.removeEventListener('keydown', handleTabKey)
    }
  }

  // Navigation avec les touches fléchées
  const handleArrowNavigation = (event: KeyboardEvent, elements: HTMLElement[]) => {
    const { key } = event
    if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(key)) {
      return false
    }

    event.preventDefault()

    switch (key) {
      case 'ArrowUp':
      case 'ArrowLeft':
        currentFocusIndex.value = currentFocusIndex.value > 0
          ? currentFocusIndex.value - 1
          : elements.length - 1
        break
      case 'ArrowDown':
      case 'ArrowRight':
        currentFocusIndex.value = currentFocusIndex.value < elements.length - 1
          ? currentFocusIndex.value + 1
          : 0
        break
      case 'Home':
        currentFocusIndex.value = 0
        break
      case 'End':
        currentFocusIndex.value = elements.length - 1
        break
    }

    elements[currentFocusIndex.value]?.focus()
    return true
  }

  // Créer des IDs uniques pour les éléments ARIA
  const createAriaId = (prefix: string = 'aria') => {
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}`
  }

  // Gérer la navigation par espace/entrée
  const handleActivationKeys = (event: KeyboardEvent, callback: () => void) => {
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault()
      callback()
    }
  }

  // Calculer la description accessible
  const getAccessibleDescription = (element: HTMLElement): string => {
    const ariaLabel = element.getAttribute('aria-label')
    if (ariaLabel) return ariaLabel

    const ariaLabelledBy = element.getAttribute('aria-labelledby')
    if (ariaLabelledBy) {
      const labelElement = document.getElementById(ariaLabelledBy)
      if (labelElement) return labelElement.textContent || ''
    }

    const ariaDescribedBy = element.getAttribute('aria-describedby')
    if (ariaDescribedBy) {
      const descriptionElement = document.getElementById(ariaDescribedBy)
      if (descriptionElement) return descriptionElement.textContent || ''
    }

    return element.textContent || ''
  }

  // Vérifier si un élément est focusable
  const isFocusable = (element: HTMLElement): boolean => {
    if (element.hasAttribute('disabled')) return false
    if (element.getAttribute('tabindex') === '-1') return false

    const style = window.getComputedStyle(element)
    if (style.display === 'none' || style.visibility === 'hidden') return false

    return element.matches(focusableSelector)
  }

  // Skip links pour navigation rapide
  const createSkipLink = (target: string, label: string): HTMLElement => {
    const link = document.createElement('a')
    link.href = `#${target}`
    link.textContent = label
    link.className = 'skip-link sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded z-50'

    link.addEventListener('click', (event) => {
      event.preventDefault()
      const targetElement = document.getElementById(target)
      if (targetElement) {
        targetElement.focus()
        targetElement.scrollIntoView({ behavior: 'smooth' })
      }
    })

    return link
  }

  // États de focus pour composants complexes
  const focusState = ref({
    hasFocus: false,
    focusVisible: false,
    focusWithin: false
  })

  const updateFocusState = (element: HTMLElement) => {
    focusState.value.hasFocus = document.activeElement === element
    focusState.value.focusVisible = element.matches(':focus-visible')
    focusState.value.focusWithin = element.matches(':focus-within')
  }

  // Gérer la restauration du focus
  const saveFocus = () => {
    if (restoreFocus) {
      previouslyFocusedElement.value = document.activeElement as HTMLElement
    }
  }

  const restoreFocusToSaved = () => {
    if (restoreFocus && previouslyFocusedElement.value) {
      previouslyFocusedElement.value.focus()
      previouslyFocusedElement.value = null
    }
  }

  // Lifecycle
  onMounted(() => {
    if (announceChanges) {
      announcer.value = createAnnouncer()
    }
  })

  onUnmounted(() => {
    if (announcer.value) {
      document.body.removeChild(announcer.value)
    }
  })

  return {
    // State
    focusableElements,
    currentFocusIndex,
    focusState,

    // Methods
    announce,
    getFocusableElements,
    trapFocusInContainer,
    handleArrowNavigation,
    handleActivationKeys,
    createAriaId,
    getAccessibleDescription,
    isFocusable,
    createSkipLink,
    updateFocusState,
    saveFocus,
    restoreFocusToSaved,

    // Computed
    hasFocusableElements: computed(() => focusableElements.value.length > 0),
    currentFocusedElement: computed(() => focusableElements.value[currentFocusIndex.value])
  }
}
