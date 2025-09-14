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
    primary: 'btn-primary-2025 text-white shadow-glow-soft hover:shadow-lift',
    secondary: 'bg-gradient-secondary text-white shadow-glow-blue hover:shadow-lift hover:from-secondary-600 hover:to-secondary-800',
    ghost: 'btn-ghost-2025 hover-lift-2025',
    outline: 'border-2 border-primary-500 text-primary-600 bg-transparent hover:bg-primary-50 hover:shadow-glow-soft dark:border-primary-400 dark:text-primary-400 dark:hover:bg-primary-900/20',
    gradient: 'bg-gradient-modern-2025 text-white shadow-glow hover:shadow-lift hover:scale-105',
    success: 'bg-success-500 hover:bg-success-600 text-white shadow-glow hover:shadow-lift',
    warning: 'bg-warning-500 hover:bg-warning-600 text-white shadow-glow hover:shadow-lift',
    danger: 'bg-red-500 hover:bg-red-600 text-white shadow-glow hover:shadow-lift'
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
    secondary: 'bg-secondary-500',
    ghost: 'bg-neutral-300',
    outline: 'bg-primary-500',
    gradient: 'bg-gradient-modern-2025',
    success: 'bg-success-500',
    warning: 'bg-warning-500',
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