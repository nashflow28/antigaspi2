<template>
  <!-- Global Migration Wrapper Component -->
  <!-- Automatically replaces legacy components with 2025 versions based on feature flags -->

  <!-- Button Migration -->
  <Button2025
    v-if="componentType === 'button' && shouldMigrate"
    v-bind="mappedProps"
    v-on="$listeners"
  >
    <slot />
  </Button2025>

  <!-- Card Migration -->
  <Card2025
    v-else-if="componentType === 'card' && shouldMigrate"
    v-bind="mappedProps"
    v-on="$listeners"
  >
    <slot />
  </Card2025>

  <!-- Badge Migration -->
  <Badge2025
    v-else-if="componentType === 'badge' && shouldMigrate"
    v-bind="mappedProps"
  >
    <slot />
  </Badge2025>

  <!-- Legacy Fallback -->
  <component
    v-else
    :is="legacyTag"
    v-bind="legacyProps"
    :class="legacyClasses"
    v-on="$listeners"
  >
    <slot />
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDesignSystem2025, useLegacyClassMapping } from '@/composables/useDesignSystem2025'

// Import 2025 components
import Button2025 from './2025/Button.vue'
import Card2025 from './2025/Card.vue'
import Badge2025 from './2025/Badge.vue'

interface Props {
  componentType: 'button' | 'card' | 'badge'
  legacyTag?: string
  legacyClasses?: string
  [key: string]: any
}

const props = defineProps<Props>()

const { isEnabled, logMigration } = useDesignSystem2025()
const { mapButtonClasses, mapCardClasses, mapBadgeClasses } = useLegacyClassMapping()

// Should migrate this component?
const shouldMigrate = computed(() => {
  return isEnabled.value || (
    (props.componentType === 'button' && import.meta.env.VITE_BUTTON_2025 === 'true') ||
    (props.componentType === 'card' && import.meta.env.VITE_CARD_2025 === 'true') ||
    (props.componentType === 'badge' && import.meta.env.VITE_BADGE_2025 === 'true')
  )
})

// Map legacy props to new component props
const mappedProps = computed(() => {
  if (!props.legacyClasses) return {}

  const classArray = props.legacyClasses.split(' ')

  switch (props.componentType) {
    case 'button':
      return mapButtonClasses(classArray)
    case 'card':
      return mapCardClasses(classArray)
    case 'badge':
      return mapBadgeClasses(classArray)
    default:
      return {}
  }
})

const legacyProps = computed(() => {
  const { componentType, legacyTag, legacyClasses, ...otherProps } = props
  return otherProps
})

// Log migration usage
if (shouldMigrate.value) {
  logMigration('MigrationWrapper', `Using 2025 ${props.componentType}`, {
    legacyClasses: props.legacyClasses,
    mappedProps: mappedProps.value
  })
}
</script>