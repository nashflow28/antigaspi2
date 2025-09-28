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
    xs: 'px-xs py-1 text-xs rounded-full',
    sm: 'px-sm py-xs text-xs rounded-full',
    md: 'px-md py-sm text-sm rounded-full',
    lg: 'px-lg py-sm text-base rounded-full'
  }
  return sizes[props.size]
})

const variantClasses = computed(() => {
  const variants = {
    default: [
      'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-100',
      'hover:bg-neutral-200 dark:hover:bg-neutral-700'
    ].join(' '),

    primary: [
      'bg-primary-100 text-primary-700',
      'hover:bg-primary-200',
      'ring-1 ring-primary-500/20'
    ].join(' '),

    secondary: [
      'bg-surface-light text-neutral-700 dark:bg-surface-dark dark:text-neutral-200',
      'hover:bg-neutral-100 dark:hover:bg-neutral-700',
      'ring-1 ring-neutral-400/20 dark:ring-neutral-600/30'
    ].join(' '),

    success: [
      'bg-primary-50 text-primary-700',
      'hover:bg-primary-100',
      'ring-1 ring-primary-500/30'
    ].join(' '),

    warning: [
      'bg-accent-orange/10 text-accent-orange',
      'hover:bg-accent-orange/20',
      'ring-1 ring-accent-orange/30'
    ].join(' '),

    error: [
      'bg-accent-red/10 text-accent-red',
      'hover:bg-accent-red/20',
      'ring-1 ring-accent-red/30'
    ].join(' '),

    info: [
      'bg-accent-blue/10 text-accent-blue',
      'hover:bg-accent-blue/20',
      'ring-1 ring-accent-blue/30'
    ].join(' '),

    outline: [
      'bg-transparent text-neutral-700 dark:text-neutral-200',
      'border border-neutral-300 dark:border-neutral-600',
      'hover:bg-neutral-100 dark:hover:bg-neutral-700'
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
