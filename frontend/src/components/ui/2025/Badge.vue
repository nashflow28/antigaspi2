<template>
  <span :class="computedClasses">
    <component
      :is="leftIcon"
      v-if="leftIcon"
      :size="iconSize"
    />

    <slot />

    <component
      :is="rightIcon"
      v-if="rightIcon"
      :size="iconSize"
    />

    <button
      v-if="removable"
      class="badge-remove-btn"
      type="button"
      @click="handleRemove"
    >
      <X :size="iconSize" />
    </button>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { X } from 'lucide-vue-next'

// Types
export type BadgeVariant =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'outline'

export type BadgeSize = 'xs' | 'sm' | 'md' | 'lg'

// Props
interface Props {
  variant?: BadgeVariant
  size?: BadgeSize
  leftIcon?: any
  rightIcon?: any
  removable?: boolean
  rounded?: boolean
  pulse?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  size: 'sm',
  removable: false,
  rounded: false,
  pulse: false
})

// Emits
const emit = defineEmits<{
  remove: []
}>()

// Computed classes
const computedClasses = computed(() => {
  const baseClasses = [
    // Base badge styles
    'inline-flex items-center gap-1',
    'font-medium whitespace-nowrap',
    'transition-all duration-200',

    // Size classes
    sizeClasses.value,

    // Variant classes
    variantClasses.value,

    // Additional modifiers
    props.rounded && 'rounded-full',
    props.pulse && 'animate-pulse'
  ].filter(Boolean)

  return baseClasses.join(' ')
})

const sizeClasses = computed(() => {
  const sizes = {
    xs: 'px-3 py-1 text-xs rounded',
    sm: 'px-2 py-xs text-xs rounded',
    md: 'px-3 py-1 text-sm rounded',
    lg: 'px-3 py-2 text-base rounded'
  }
  return sizes[props.size]
})

const variantClasses = computed(() => {
  const variants = {
    default: [
      'bg-gray-100 text-gray-800',
      'hover:bg-gray-200'
    ].join(' '),

    primary: [
      'bg-blue-100 text-blue-800',
      'hover:bg-blue-200',
      'ring-1 ring-primary-600/20'
    ].join(' '),

    secondary: [
      'bg-gray-100 text-gray-700',
      'hover:bg-gray-200'
    ].join(' '),

    success: [
      'bg-green-100 text-green-800',
      'hover:bg-blue-200',
      'ring-1 ring-green-600/20'
    ].join(' '),

    warning: [
      'bg-yellow-100 text-yellow-800',
      'hover:bg-yellow-200',
      'ring-1 ring-yellow-600/20'
    ].join(' '),

    error: [
      'bg-red-100 text-red-800',
      'hover:bg-red-200',
      'ring-1 ring-red-600/20'
    ].join(' '),

    info: [
      'bg-blue-100 text-gray-800',
      'hover:bg-secondary-200',
      'ring-1 ring-blue-600/20'
    ].join(' '),

    outline: [
      'bg-transparent text-gray-700',
      'border border-gray-300',
      'hover:bg-gray-50 hover:text-gray-900'
    ].join(' ')
  }

  return variants[props.variant]
})

const iconSize = computed(() => {
  const sizes = {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16
  }
  return sizes[props.size]
})

// Methods
const handleRemove = () => {
  emit('remove')
}
</script>

<style scoped>
.badge-remove-btn {
  @apply ml-1 hover:bg-black/10 rounded-full p-0.5 transition-colors;
}
</style>
