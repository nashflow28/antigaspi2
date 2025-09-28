<template>
  <select
    :id="id"
    v-model="modelValue"
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
    'block w-full rounded border transition-colors duration-200',
    'focus:ring-2 focus:ring-offset-2 focus:outline-none',
    'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed'
  ]

  // Size classes
  const sizeClasses = {
    xs: 'px-3 py-xs text-xs',
    sm: 'px-3 py-1 text-sm',
    md: 'px-3 py-2 text-sm',
    lg: 'px-3 py-2.5 text-base',
    xl: 'px-3 py-3 text-lg'
  }

  // Variant classes
  const variantClasses = {
    default: 'border-gray-300 focus:border-blue-500 focus:ring-blue-500',
    success: 'border-blue-300 focus:border-blue-500 focus:ring-green-500',
    warning: 'border-amber-300 focus:border-amber-500 focus:ring-amber-500',
    error: 'border-red-300 focus:border-red-500 focus:ring-red-500'
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
