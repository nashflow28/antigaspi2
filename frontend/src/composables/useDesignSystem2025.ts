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
 * Clean feature flag management for 2025 Design System
 * Legacy class mapping functions removed - direct component migration preferred
 */