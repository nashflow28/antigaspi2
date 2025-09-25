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
    <LoadingSpinner v-if="loading" :size="iconSize" />
    <component
      v-else-if="leftIcon"
      :is="leftIcon"
      :size="iconSize"
    />

    <span v-if="$slots.default" :class="contentClasses">
      <slot />
    </span>

    <component
      v-if="rightIcon && !loading"
      :is="rightIcon"
      :size="iconSize"
    />
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'

// Types
export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'ghost'
  | 'outline'
  | 'promo'
  | 'destructive'

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
    xs: 'px-2.5 py-1.5 text-xs gap-1 rounded-md',
    sm: 'px-3 py-2 text-sm gap-1.5 rounded-md',
    md: 'px-4 py-2.5 text-sm gap-2 rounded-lg',
    lg: 'px-6 py-3 text-base gap-2 rounded-lg',
    xl: 'px-8 py-4 text-lg gap-2.5 rounded-xl'
  }
  return sizes[props.size]
})

const variantClasses = computed(() => {
  const variants = {
    primary: [
      'bg-gradient-to-r from-primary-600 to-primary-700',
      'text-white border border-primary-600',
      'hover:from-primary-700 hover:to-primary-800',
      'focus:ring-primary-500',
      'active:from-primary-800 active:to-primary-900',
      'shadow-lg shadow-primary-500/25',
      'hover:shadow-xl hover:shadow-primary-500/30'
    ].join(' '),

    secondary: [
      'bg-white text-neutral-700',
      'border border-neutral-300',
      'hover:bg-neutral-50 hover:border-neutral-400',
      'focus:ring-neutral-500',
      'active:bg-neutral-100',
      'shadow-sm hover:shadow-md'
    ].join(' '),

    ghost: [
      'text-neutral-600 bg-transparent',
      'hover:text-neutral-900 hover:bg-neutral-100',
      'focus:ring-neutral-500',
      'active:bg-neutral-200'
    ].join(' '),

    outline: [
      'bg-transparent text-primary-600',
      'border border-primary-600',
      'hover:bg-primary-50 hover:text-primary-700',
      'focus:ring-primary-500',
      'active:bg-primary-100'
    ].join(' '),

    promo: [
      'bg-gradient-to-r from-accent-orange to-accent-yellow',
      'text-white border border-accent-orange',
      'hover:from-accent-orange/90 hover:to-accent-yellow/90',
      'focus:ring-accent-orange',
      'shadow-lg shadow-accent-orange/25',
      'hover:shadow-xl hover:shadow-accent-orange/30'
    ].join(' '),

    destructive: [
      'bg-red-600 text-white',
      'border border-red-600',
      'hover:bg-red-700 hover:border-red-700',
      'focus:ring-red-500',
      'active:bg-red-800',
      'shadow-lg shadow-red-500/25',
      'hover:shadow-xl hover:shadow-red-500/30'
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