<template>
  <label
    :for="for"
    :class="computedClasses"
  >
    <slot />
  </label>
</template>

<script setup lang="ts">
import { computed } from 'vue'

// Types
export type LabelSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'
export type LabelVariant = 'default' | 'muted' | 'success' | 'warning' | 'error'

// Props
interface Props {
  for?: string
  size?: LabelSize
  variant?: LabelVariant
  required?: boolean
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  variant: 'default',
  required: false,
  disabled: false
})

// Computed
const computedClasses = computed(() => {
  const baseClasses = [
    'label-2025',
    'block font-medium transition-colors duration-200'
  ]

  // Size classes
  const sizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg'
  }

  // Variant classes
  const variantClasses = {
    default: 'text-gray-800',
    muted: 'text-gray-500',
    success: 'text-blue-900',
    warning: 'text-amber-700',
    error: 'text-red-700'
  }

  // State classes
  if (props.disabled) {
    baseClasses.push('text-gray-400 cursor-not-allowed')
  }

  baseClasses.push(sizeClasses[props.size])
  baseClasses.push(variantClasses[props.variant])

  return baseClasses.join(' ')
})
</script>

<style scoped>
.label-2025 {
  /* Custom label styles for 2025 design system */
  font-family: inherit;
}

.label-2025:focus-within {
  color: theme('colors.primary.600');
}
</style>
