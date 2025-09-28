<template>
  <component
    :is="tag"
    :type="tag === 'button' ? type : undefined"
    :disabled="disabled"
    :href="tag === 'a' ? href : undefined"
    :to="tag === 'router-link' ? to : undefined"
    :class="computedClasses"
    @click="handleClick"
  >
    <Loader2 v-if="loading" :size="iconSize" class="animate-spin" />
    <component
      :is="leftIcon"
      v-else-if="leftIcon"
      :size="iconSize"
    />

    <span v-if="$slots.default" :class="contentClasses">
      <slot />
    </span>

    <component
      :is="rightIcon"
      v-if="rightIcon && !loading"
      :size="iconSize"
    />
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Loader2 } from 'lucide-vue-next'

// Types
export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'ghost'
  | 'outline'
  | 'promo'
  | 'destructive'
  | 'error'
  | 'success'
  | 'warning'

export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

// Props
interface Props {
  variant?: ButtonVariant
  size?: ButtonSize
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  loading?: boolean
  tag?: 'button' | 'a' | 'router-link'
  href?: string
  to?: string | object
  leftIcon?: any
  rightIcon?: any
  fullWidth?: boolean
  rounded?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  type: 'button',
  tag: 'button',
  disabled: false,
  loading: false,
  fullWidth: false,
  rounded: false
})

// Emits
const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

// Computed classes
const computedClasses = computed(() => {
  const baseClasses = [
    // Base styles
    'inline-flex items-center justify-center',
    'font-semibold transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'disabled:cursor-not-allowed',

    // Size classes
    sizeClasses.value,

    // Variant classes
    variantClasses.value,

    // Additional modifiers
    props.fullWidth && 'w-full',
    props.rounded && 'rounded-full',
    props.disabled && 'opacity-50',
    props.loading && 'cursor-wait'
  ].filter(Boolean)

  return baseClasses.join(' ')
})

const sizeClasses = computed(() => {
  const sizes = {
    xs: 'px-2 py-1 text-xs gap-2 rounded',
    sm: 'px-3 py-2 text-sm gap-2 rounded',
    md: 'px-3 py-2.5 text-sm gap-2 rounded',
    lg: 'px-4 py-3 text-base gap-2 rounded',
    xl: 'px-6 py-4 text-lg gap-3 rounded'
  }
  return sizes[props.size]
})

const variantClasses = computed(() => {
  const variants = {
    primary: [
      'bg-gradient-to-r from-blue-600 to-blue-700',
      'text-white border border-blue-600',
      'hover:from-blue-700 hover:to-blue-800',
      'focus:ring-blue-500',
      'active:from-blue-800 active:to-blue-900',
      'shadow-lg shadow-blue-500/25',
      'hover:shadow-xl hover:shadow-blue-500/30'
    ].join(' '),

    secondary: [
      'bg-white text-gray-800',
      'border border-gray-300',
      'hover:bg-gray-50 hover:border-gray-400',
      'focus:ring-gray-500',
      'active:bg-gray-100',
      'shadow-sm hover:shadow-md'
    ].join(' '),

    ghost: [
      'text-gray-700 bg-transparent',
      'hover:text-gray-900 hover:bg-gray-100',
      'focus:ring-gray-500',
      'active:bg-gray-200'
    ].join(' '),

    outline: [
      'bg-transparent text-blue-600',
      'border border-blue-600',
      'hover:bg-blue-50 hover:text-blue-900',
      'focus:ring-blue-500',
      'active:bg-blue-100'
    ].join(' '),

    promo: [
      'bg-gradient-to-r from-orange-500 to-yellow-500',
      'text-white border border-orange-500',
      'hover:from-orange-500/90 hover:to-yellow-500/90',
      'focus:ring-orange-500',
      'shadow-lg shadow-orange-500/25',
      'hover:shadow-xl hover:shadow-orange-500/30'
    ].join(' '),

    destructive: [
      'bg-red-600 text-white',
      'border border-red-600',
      'hover:bg-red-700 hover:border-red-700',
      'focus:ring-red-500',
      'active:bg-red-800',
      'shadow-lg shadow-red-500/25',
      'hover:shadow-xl hover:shadow-red-500/30'
    ].join(' '),

    error: [
      'bg-red-600 text-white',
      'border border-red-600',
      'hover:bg-red-700 hover:border-red-700',
      'focus:ring-red-500',
      'active:bg-red-800',
      'shadow-lg shadow-red-500/25',
      'hover:shadow-xl hover:shadow-red-500/30'
    ].join(' '),

    success: [
      'bg-blue-600 text-white',
      'border border-blue-600',
      'hover:bg-blue-700 hover:border-blue-700',
      'focus:ring-green-500',
      'active:bg-blue-800',
      'shadow-lg shadow-green-500/25',
      'hover:shadow-xl hover:shadow-green-500/30'
    ].join(' '),

    warning: [
      'bg-orange-500 text-white',
      'border border-orange-500',
      'hover:bg-orange-500/90 hover:border-orange-500/90',
      'focus:ring-orange-500',
      'active:bg-orange-500/80',
      'shadow-lg shadow-orange-500/25',
      'hover:shadow-xl hover:shadow-orange-500/30'
    ].join(' ')
  }

  return variants[props.variant]
})

const contentClasses = computed(() => {
  return props.loading ? 'ml-2' : ''
})

const iconSize = computed(() => {
  const sizes = {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20
  }
  return sizes[props.size]
})

// Methods
const handleClick = (event: MouseEvent) => {
  if (!props.disabled && !props.loading) {
    emit('click', event)
  }
}
</script>
