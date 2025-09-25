<template>
  <!-- Progressive Migration Pattern for Button -->
  <Button2025
    v-if="useDesignSystem2025().useButton2025()"
    v-bind="mappedProps"
    @click="$emit('click', $event)"
  >
    <slot />
  </Button2025>

  <!-- Legacy fallback -->
  <component
    v-else
    :is="tag"
    :type="tag === 'button' ? type : undefined"
    :disabled="disabled"
    :href="tag === 'a' ? href : undefined"
    :class="legacyClasses"
    @click="handleLegacyClick"
  >
    <slot />
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDesignSystem2025, useLegacyClassMapping } from '@/composables/useDesignSystem2025'
import Button2025 from './2025/Button.vue'

// Types
type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'promo' | 'destructive'
type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

interface Props {
  // New props (2025)
  variant?: ButtonVariant
  size?: ButtonSize

  // Legacy props support
  class?: string
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  loading?: boolean
  tag?: 'button' | 'a' | 'router-link'
  href?: string
  to?: string | object
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  type: 'button',
  tag: 'button',
  disabled: false,
  loading: false
})

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

// Composables
const { logMigration, useButton2025 } = useDesignSystem2025()
const { mapButtonClasses } = useLegacyClassMapping()

// Map legacy classes to new props if needed
const mappedProps = computed(() => {
  if (!props.class) {
    return {
      variant: props.variant,
      size: props.size,
      type: props.type,
      disabled: props.disabled,
      loading: props.loading,
      tag: props.tag,
      href: props.href,
      to: props.to
    }
  }

  // Parse legacy classes from class string
  const classArray = props.class.split(' ').filter(Boolean)
  const mapping = mapButtonClasses(classArray)

  return {
    variant: mapping.variant as ButtonVariant,
    size: mapping.size as ButtonSize,
    type: props.type,
    disabled: props.disabled,
    loading: props.loading,
    tag: props.tag,
    href: props.href,
    to: props.to,
    class: mapping.remainingClasses.join(' ')
  }
})

// Legacy classes for fallback
const legacyClasses = computed(() => {
  if (useButton2025()) return ''

  const baseClasses = ['btn']

  // Map variant to legacy classes
  if (props.variant === 'primary') baseClasses.push('btn-primary')
  if (props.variant === 'secondary') baseClasses.push('btn-secondary')
  if (props.variant === 'ghost') baseClasses.push('btn-ghost')
  if (props.variant === 'outline') baseClasses.push('btn-outline')
  if (props.variant === 'promo') baseClasses.push('btn-accent')

  // Map size to legacy classes
  if (props.size === 'sm') baseClasses.push('btn-sm')
  if (props.size === 'lg') baseClasses.push('btn-lg')

  // Add custom classes
  if (props.class) baseClasses.push(props.class)

  return baseClasses.join(' ')
})

// Legacy click handler
const handleLegacyClick = (event: MouseEvent) => {
  if (!props.disabled && !props.loading) {
    emit('click', event)
  }
}

// Log usage
if (useButton2025()) {
  logMigration('ButtonWrapper', 'Using 2025 version', { props: mappedProps.value })
} else {
  logMigration('ButtonWrapper', 'Using legacy version', { classes: legacyClasses.value })
}
</script>