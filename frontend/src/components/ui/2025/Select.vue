<template>
  <select
    :id="id"
    :value="modelValue"
    :name="name"
    :disabled="disabled"
    :required="required"
    :class="computedClasses"
    @change="handleChange"
  >
    <slot />
  </select>
</template>

<script setup lang="ts">
import { computed } from 'vue'

// Types
export type SelectSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'
export type SelectVariant = 'default' | 'success' | 'warning' | 'error'

// Props
interface Props {
  id?: string
  name?: string
  modelValue?: string | number
  size?: SelectSize
  variant?: SelectVariant
  disabled?: boolean
  required?: boolean
  placeholder?: string
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  variant: 'default',
  disabled: false,
  required: false
})

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: string | number]
  'change': [event: Event]
}>()

// Computed
const computedClasses = computed(() => {
  const baseClasses = [
    'select-2025',
    'block w-full rounded-xl border bg-surface-light text-neutral-700 shadow-card transition-all duration-200',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-light',
    'dark:bg-surface-dark dark:text-neutral-100 dark:border-neutral-700/70 dark:focus-visible:ring-offset-surface-dark',
    'disabled:bg-surface-muted/60 disabled:text-neutral-400 disabled:opacity-70 disabled:cursor-not-allowed'
  ]

  const sizeClasses = {
    xs: 'px-3 py-1 text-xs',
    sm: 'px-3 py-2 text-sm',
    md: 'px-3 py-2.5 text-sm',
    lg: 'px-4 py-3 text-base',
    xl: 'px-5 py-4 text-lg'
  }

  const variantClasses = {
    default: 'border-neutral-200/80 focus-visible:border-primary-500',
    success: 'border-primary-400/60 text-primary-600 focus-visible:border-primary-500 dark:text-primary-300',
    warning: 'border-accent-orange/60 text-accent-orange focus-visible:border-accent-orange',
    error: 'border-accent-red/60 text-accent-red focus-visible:border-accent-red'
  }

  baseClasses.push(sizeClasses[props.size])
  baseClasses.push(variantClasses[props.variant])

  return baseClasses.join(' ')
})

// Methods
const handleChange = (event: Event) => {
  const target = event.target as HTMLSelectElement
  emit('update:modelValue', target.value)
  emit('change', event)
}
</script>

<style scoped>
.select-2025 {
  /* Custom select styles for 2025 design system */
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e");
  background-position: right 0.5rem center;
  background-repeat: no-repeat;
  background-size: 1.5em 1.5em;
  padding-right: 2.5rem;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

.select-2025:focus {
  box-shadow: 0 0 0 2px theme('colors.primary.500');
}
</style>
