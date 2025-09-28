<template>
  <component
    :is="tag"
    :type="tag === 'button' ? type : undefined"
    :disabled="disabled"
    :href="tag === 'a' ? href : undefined"
    :to="tag === 'router-link' ? to : undefined"
    :data-variant="props.variant"
    :data-size="props.size"
    :data-state="loading ? 'loading' : disabled ? 'disabled' : 'default'"
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
    'font-semibold transition-all duration-200 ease-spring-out',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400',
    'focus-visible:ring-offset-2 focus-visible:ring-offset-surface-light dark:focus-visible:ring-offset-surface-dark',
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
    xs: 'px-xs py-xs text-xs gap-2 rounded-lg',
    sm: 'px-sm py-sm text-sm gap-2 rounded-lg',
    md: 'px-md py-md text-sm gap-2 rounded-lg',
    lg: 'px-lg py-lg text-base gap-3 rounded-xl',
    xl: 'px-xl py-xl text-lg gap-3 rounded-xl'
  }
  return sizes[props.size]
})

const variantClasses = computed(() => {
  const variants = {
    primary: [
      'bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700',
      'text-white',
      'border border-primary-500/80',
      'shadow-card hover:shadow-glow',
      'hover:from-primary-600 hover:via-primary-700 hover:to-primary-800',
      'active:from-primary-700 active:to-primary-900'
    ].join(' '),

    secondary: [
      'bg-surface-light text-neutral-800 dark:bg-surface-dark dark:text-neutral-100',
      'border border-neutral-200 dark:border-neutral-700',
      'shadow-card hover:shadow-glow',
      'hover:bg-neutral-50 dark:hover:bg-neutral-800'
    ].join(' '),

    ghost: [
      'bg-transparent text-primary-600 dark:text-primary-300',
      'hover:bg-primary-500/10 hover:text-primary-700',
      'dark:hover:bg-primary-500/20',
      'shadow-none'
    ].join(' '),

    outline: [
      'bg-transparent text-primary-600 dark:text-primary-300',
      'border border-primary-400/70 dark:border-primary-500/60',
      'hover:bg-primary-500/10 hover:text-primary-700',
      'dark:hover:bg-primary-500/20'
    ].join(' '),

    promo: [
      'bg-gradient-to-r from-accent-orange via-primary-500 to-accent-blue',
      'text-white',
      'border border-accent-orange/70',
      'shadow-glow hover:shadow-card',
      'hover:from-accent-orange/90 hover:to-accent-blue/90'
    ].join(' '),

    destructive: [
      'bg-accent-red text-white',
      'border border-accent-red/80',
      'hover:bg-accent-red/90',
      'shadow-card hover:shadow-glow'
    ].join(' '),

    error: [
      'bg-accent-red text-white',
      'border border-accent-red/80',
      'hover:bg-accent-red/90',
      'shadow-card hover:shadow-glow'
    ].join(' '),

    success: [
      'bg-primary-600 text-white',
      'border border-primary-500/80',
      'hover:bg-primary-700',
      'shadow-card hover:shadow-glow'
    ].join(' '),

    warning: [
      'bg-accent-orange text-neutral-900',
      'border border-accent-orange/80',
      'hover:bg-accent-orange/90',
      'shadow-card hover:shadow-glow'
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
