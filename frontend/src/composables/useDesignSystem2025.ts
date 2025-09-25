import { computed, ref } from 'vue'

// Feature flags from environment variables
const DS_2025_ENABLED = import.meta.env.VITE_DS_2025 === 'true'
const BUTTON_2025_ENABLED = import.meta.env.VITE_BUTTON_2025 === 'true'
const CARD_2025_ENABLED = import.meta.env.VITE_CARD_2025 === 'true'
const BADGE_2025_ENABLED = import.meta.env.VITE_BADGE_2025 === 'true'
const MIGRATION_DEBUG = import.meta.env.VITE_MIGRATION_DEBUG === 'true'

// Global design system state
const designSystemState = ref({
  globalEnabled: DS_2025_ENABLED,
  components: {
    button: BUTTON_2025_ENABLED,
    card: CARD_2025_ENABLED,
    badge: BADGE_2025_ENABLED
  },
  debug: MIGRATION_DEBUG
})

/**
 * Main composable for Design System 2025 feature flags
 */
export function useDesignSystem2025() {
  // Global enable/disable
  const isEnabled = computed(() => designSystemState.value.globalEnabled)

  // Component-specific flags
  const components = computed(() => designSystemState.value.components)

  // Debug mode
  const isDebugMode = computed(() => designSystemState.value.debug)

  // Toggle functions (for runtime testing)
  const toggleGlobal = () => {
    designSystemState.value.globalEnabled = !designSystemState.value.globalEnabled
    if (isDebugMode.value) {
      console.log('🎨 Design System 2025 Global:', designSystemState.value.globalEnabled)
    }
  }

  const toggleComponent = (component: keyof typeof designSystemState.value.components) => {
    designSystemState.value.components[component] = !designSystemState.value.components[component]
    if (isDebugMode.value) {
      console.log(`🧩 Component ${component} 2025:`, designSystemState.value.components[component])
    }
  }

  // Helper to check if specific component should use 2025 version
  const shouldUse2025 = (component: keyof typeof designSystemState.value.components) => {
    return isEnabled.value || components.value[component]
  }

  // Debug logger
  const logMigration = (component: string, action: string, details?: any) => {
    if (isDebugMode.value) {
      console.log(`🔄 Migration [${component}]:`, action, details)
    }
  }

  return {
    // State
    isEnabled,
    components,
    isDebugMode,

    // Methods
    toggleGlobal,
    toggleComponent,
    shouldUse2025,
    logMigration,

    // Specific component helpers
    useButton2025: () => shouldUse2025('button'),
    useCard2025: () => shouldUse2025('card'),
    useBadge2025: () => shouldUse2025('badge')
  }
}

/**
 * Utility for legacy class mapping
 */
export function useLegacyClassMapping() {
  const { logMigration } = useDesignSystem2025()

  const mapButtonClasses = (classes: string[]): {
    variant: string
    size: string
    remainingClasses: string[]
  } => {
    let variant = 'primary'
    let size = 'md'
    const remainingClasses: string[] = []

    const variantMap: Record<string, string> = {
      'btn-primary': 'primary',
      'btn-secondary': 'secondary',
      'btn-accent': 'promo',
      'btn-outline': 'outline',
      'btn-ghost': 'ghost'
    }

    const sizeMap: Record<string, string> = {
      'btn-sm': 'sm',
      'btn-lg': 'lg',
      'btn-xl': 'xl'
    }

    classes.forEach(cls => {
      if (variantMap[cls]) {
        variant = variantMap[cls]
      } else if (sizeMap[cls]) {
        size = sizeMap[cls]
      } else if (cls !== 'btn') {
        remainingClasses.push(cls)
      }
    })

    logMigration('Button', 'Class mapping', {
      input: classes,
      output: { variant, size, remainingClasses }
    })

    return { variant, size, remainingClasses }
  }

  const mapCardClasses = (classes: string[]): {
    variant: string
    interactive: boolean
    remainingClasses: string[]
  } => {
    let variant = 'default'
    let interactive = false
    const remainingClasses: string[] = []

    const variantMap: Record<string, string> = {
      'card-glass': 'glass',
      'card-gradient': 'gradient',
      'card-elevated': 'elevated'
    }

    classes.forEach(cls => {
      if (variantMap[cls]) {
        variant = variantMap[cls]
      } else if (cls === 'card-interactive') {
        interactive = true
      } else if (cls !== 'card') {
        remainingClasses.push(cls)
      }
    })

    logMigration('Card', 'Class mapping', {
      input: classes,
      output: { variant, interactive, remainingClasses }
    })

    return { variant, interactive, remainingClasses }
  }

  const mapBadgeClasses = (classes: string[]): {
    variant: string
    size: string
    remainingClasses: string[]
  } => {
    let variant = 'default'
    let size = 'sm'
    const remainingClasses: string[] = []

    const variantMap: Record<string, string> = {
      'badge-primary': 'primary',
      'badge-secondary': 'secondary',
      'badge-success': 'success',
      'badge-warning': 'warning',
      'badge-error': 'error'
    }

    const sizeMap: Record<string, string> = {
      'badge-sm': 'sm',
      'badge-lg': 'lg'
    }

    classes.forEach(cls => {
      if (variantMap[cls]) {
        variant = variantMap[cls]
      } else if (sizeMap[cls]) {
        size = sizeMap[cls]
      } else if (cls !== 'badge') {
        remainingClasses.push(cls)
      }
    })

    logMigration('Badge', 'Class mapping', {
      input: classes,
      output: { variant, size, remainingClasses }
    })

    return { variant, size, remainingClasses }
  }

  return {
    mapButtonClasses,
    mapCardClasses,
    mapBadgeClasses
  }
}

/**
 * Migration statistics tracker
 */
export function useMigrationStats() {
  const stats = ref({
    componentsUsed: {
      button: { legacy: 0, new: 0 },
      card: { legacy: 0, new: 0 },
      badge: { legacy: 0, new: 0 }
    },
    lastUpdated: new Date()
  })

  const trackUsage = (
    component: 'button' | 'card' | 'badge',
    version: 'legacy' | 'new'
  ) => {
    stats.value.componentsUsed[component][version]++
    stats.value.lastUpdated = new Date()
  }

  const getStats = () => stats.value

  const resetStats = () => {
    Object.keys(stats.value.componentsUsed).forEach(component => {
      const comp = component as keyof typeof stats.value.componentsUsed
      stats.value.componentsUsed[comp].legacy = 0
      stats.value.componentsUsed[comp].new = 0
    })
    stats.value.lastUpdated = new Date()
  }

  return {
    stats,
    trackUsage,
    getStats,
    resetStats
  }
}