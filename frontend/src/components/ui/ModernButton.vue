<template>
  <component
    :is="tag"
    :type="tag === 'button' ? type : undefined"
    :to="tag === 'router-link' ? to : undefined"
    :href="tag === 'a' ? href : undefined"
    :disabled="disabled"
    :class="[
      'btn-2025',
      variantClasses,
      sizeClasses,
      {
        'animate-shimmer-2025': shimmer && !disabled,
        'animate-pulse': loading,
        'cursor-not-allowed opacity-60': disabled
      },
      $attrs.class
    ]"
    @click="handleClick"
  >
    <!-- Loading Spinner -->
    <div
      v-if="loading"
      class="animate-spin rounded-full border-2 border-current border-t-transparent mr-2"
      :class="sizeSpinnerClasses"
    ></div>

    <!-- Left Icon -->
    <component
      v-if="leftIcon && !loading"
      :is="leftIcon"
      :class="sizeIconClasses"
      class="mr-2"
    />

    <!-- Slot Content -->
    <span class="relative z-10">
      <slot>{{ label }}</slot>
    </span>

    <!-- Right Icon -->
    <component
      v-if="rightIcon && !loading"
      :is="rightIcon"
      :class="sizeIconClasses"
      class="ml-2"
    />

    <!-- Gradient Overlay for Shimmer Effect -->
    <div
      v-if="shimmer && !disabled"
      class="absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/25 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
    ></div>

    <!-- Glow Effect -->
    <div
      v-if="glow"
      class="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-75 transition-all duration-300 pointer-events-none blur-md"
      :class="glowClasses"
    ></div>
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue'

export interface ModernButtonProps {
  // Content
  label?: string
  leftIcon?: any
  rightIcon?: any

  // Variants
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'gradient' | 'success' | 'warning' | 'danger'
  size?: 'sm' | 'md' | 'lg' | 'xl'

  // States
  loading?: boolean
  disabled?: boolean

  // Effects
  shimmer?: boolean
  glow?: boolean

  // Navigation
  tag?: 'button' | 'router-link' | 'a'
  type?: 'button' | 'submit' | 'reset'
  to?: string | object
  href?: string
}

const props = withDefaults(defineProps<ModernButtonProps>(), {
  variant: 'primary',
  size: 'md',
  tag: 'button',
  type: 'button',
  loading: false,
  disabled: false,
  shimmer: false,
  glow: true
})

const emit = defineEmits<{
  click: [event: Event]
}>()

// Variant classes
const variantClasses = computed(() => {
  const variants = {
    primary: 'btn-2025 bg-primary-600 text-white shadow-card hover:bg-primary-700 hover:shadow-glow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-50 disabled:opacity-60 disabled:cursor-not-allowed',
    secondary: 'btn-2025 bg-gradient-to-r from-accent-blue to-accent-blue/90 text-white shadow-glow hover:from-accent-blue/95 hover:to-accent-blue/80 hover:shadow-glow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/60 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-50 disabled:opacity-60 disabled:cursor-not-allowed',
    ghost: 'btn-2025 bg-transparent text-primary-600 hover:bg-primary-50 hover:text-primary-700 border border-primary-200 hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-50',
    outline: 'btn-2025 border-2 border-primary-500 text-primary-600 bg-transparent hover:bg-primary-50 hover:shadow-card dark:border-primary-400 dark:text-primary-400 dark:hover:bg-primary-900/20',
    gradient: 'btn-2025 bg-gradient-to-br from-primary-500 via-accent-blue to-accent-blue/90 text-white shadow-glow hover:shadow-glow hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-50',
    success: 'btn-2025 bg-primary-500 hover:bg-primary-600 text-white shadow-glow hover:shadow-glow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-50',
    warning: 'btn-2025 bg-accent-orange hover:bg-accent-orange/90 text-white shadow-glow hover:shadow-glow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-orange/60 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-50',
    danger: 'btn-2025 bg-accent-red hover:bg-accent-red/90 text-white shadow-glow hover:shadow-glow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-red/60 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-50'
  }
  return variants[props.variant]
})

// Size classes
const sizeClasses = computed(() => {
  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
    xl: 'px-8 py-4 text-lg'
  }
  return sizes[props.size]
})

// Icon size classes
const sizeIconClasses = computed(() => {
  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
    xl: 'w-6 h-6'
  }
  return iconSizes[props.size]
})

// Spinner size classes
const sizeSpinnerClasses = computed(() => {
  const spinnerSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
    xl: 'w-6 h-6'
  }
  return spinnerSizes[props.size]
})

// Glow effect classes
const glowClasses = computed(() => {
  const glows = {
    primary: 'bg-primary-500',
    secondary: 'bg-accent-blue/50',
    ghost: 'bg-neutral-300',
    outline: 'bg-primary-500',
    gradient: 'bg-gradient-to-br from-primary-500 via-accent-blue to-accent-blue/90',
    success: 'bg-primary-500',
    warning: 'bg-accent-orange',
    danger: 'bg-red-500'
  }
  return glows[props.variant]
})

// Handle click
const handleClick = (event: Event) => {
  if (!props.disabled && !props.loading) {
    emit('click', event)
  }
}
</script>

<style scoped>
/* Modern Button Transitions */
.btn-2025 {
  position: relative;
  transform-style: preserve-3d;
}

.btn-2025:active:not(:disabled) {
  transform: translateY(-1px) scale(0.98);
}

/* Shimmer animation */
@keyframes shimmer {
  0% {
    left: -100%;
  }
  100% {
    left: 100%;
  }
}

.animate-shimmer-2025::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.4),
    transparent
  );
  animation: shimmer 2s infinite;
  border-radius: inherit;
}
</style>