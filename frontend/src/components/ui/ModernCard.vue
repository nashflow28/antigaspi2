<template>
  <component
    :is="tag"
    :to="tag === 'router-link' ? to : undefined"
    :href="tag === 'a' ? href : undefined"
    :class="[
      'card-2025',
      variantClasses,
      {
        'cursor-pointer': interactive,
        'transition-transform duration-300': interactive || hoverLift,
        'hover:-translate-y-1': hoverLift,
        'animate-fade-in': fadeIn,
        'animate-scale-in': scaleIn
      },
      $attrs.class
    ]"
    @click="handleClick"
  >
    <!-- Gradient Background Overlay -->
    <div
      v-if="gradient"
      class="absolute inset-0 rounded-3xl opacity-10 pointer-events-none"
      :class="gradientClasses"
    ></div>

    <!-- Header Section -->
    <header v-if="$slots.header || title" class="mb-4">
      <slot name="header">
        <div class="flex items-start justify-between">
          <div>
            <h3
              v-if="title"
              class="text-lg font-semibold text-neutral-900 dark:text-dark-50"
            >
              {{ title }}
            </h3>
            <p
              v-if="subtitle"
              class="text-sm text-neutral-600 dark:text-dark-300 mt-1"
            >
              {{ subtitle }}
            </p>
          </div>
          <slot name="actions"></slot>
        </div>
      </slot>
    </header>

    <!-- Content Section -->
    <div class="relative z-10">
      <slot></slot>
    </div>

    <!-- Footer Section -->
    <footer v-if="$slots.footer" class="mt-4 pt-4 border-t border-neutral-100 dark:border-dark-700">
      <slot name="footer"></slot>
    </footer>

    <!-- Badge/Tag -->
    <div
      v-if="badge"
      class="absolute top-4 right-4 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold shadow-card"
      :class="badgeVariantClasses"
    >
      {{ badge }}
    </div>

    <!-- Hover Glow Effect -->
    <div
      v-if="glow && interactive"
      class="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-500 pointer-events-none"
      :class="glowClasses"
    ></div>

    <!-- Loading Overlay -->
    <div
      v-if="loading"
      class="absolute inset-0 bg-white/80 dark:bg-dark-800/80 backdrop-blur-sm rounded-3xl flex items-center justify-center"
    >
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
    </div>
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue'

export interface ModernCardProps {
  // Content
  title?: string
  subtitle?: string
  badge?: string

  // Variants
  variant?: 'default' | 'glass' | 'elevated' | 'bordered' | 'gradient'
  badgeVariant?: 'success' | 'warning' | 'error' | 'info'

  // Behavior
  interactive?: boolean
  loading?: boolean

  // Effects
  hoverLift?: boolean
  glow?: boolean
  gradient?: boolean
  fadeIn?: boolean
  scaleIn?: boolean

  // Navigation
  tag?: 'div' | 'article' | 'section' | 'router-link' | 'a'
  to?: string | object
  href?: string
}

const props = withDefaults(defineProps<ModernCardProps>(), {
  variant: 'default',
  badgeVariant: 'info',
  tag: 'div',
  interactive: false,
  loading: false,
  hoverLift: true,
  glow: true,
  gradient: false,
  fadeIn: false,
  scaleIn: false
})

const emit = defineEmits<{
  click: [event: Event]
}>()

// Variant classes
const variantClasses = computed(() => {
  const variants = {
    default: 'bg-white/90 dark:bg-dark-800/90 border border-neutral-200/50 dark:border-dark-600/50',
    glass: 'bg-white/70 dark:bg-neutral-900/80 backdrop-blur-lg border border-white/20 dark:border-neutral-800/60',
    elevated: 'bg-white dark:bg-dark-800 shadow-glow border-0',
    bordered: 'bg-white/95 dark:bg-dark-800/95 border-2 border-primary-200 dark:border-primary-700',
    gradient: 'bg-emerald-glass border border-white/30 dark:border-neutral-800/60'
  }
  return variants[props.variant]
})

// Badge variant classes
const badgeVariantClasses = computed(() => {
  const variants = {
    success: 'bg-primary-500/10 text-primary-700 border border-primary-500/20 dark:bg-primary-900/30 dark:text-primary-200 dark:border-primary-700/40',
    warning: 'bg-accent-orange/15 text-accent-orange/90 border border-accent-orange/30 dark:bg-accent-orange/20 dark:text-accent-orange/80 dark:border-accent-orange/30',
    error: 'bg-accent-red/10 text-accent-red/90 border border-accent-red/30 dark:bg-accent-red/20 dark:text-accent-red/80 dark:border-accent-red/30',
    info: 'bg-accent-blue/10 text-accent-blue/90 border border-accent-blue/30 dark:bg-accent-blue/20 dark:text-accent-blue/80 dark:border-accent-blue/30'
  }
  return variants[props.badgeVariant]
})

// Gradient classes
const gradientClasses = computed(() => {
  return 'bg-gradient-to-br from-primary-500 via-accent-blue to-accent-blue/90'
})

// Glow effect classes
const glowClasses = computed(() => {
  return 'bg-gradient-to-br from-primary-500 via-accent-blue to-accent-blue/90'
})

// Handle click
const handleClick = (event: Event) => {
  if (props.interactive && !props.loading) {
    emit('click', event)
  }
}
</script>

<style scoped>
/* Card transform origin for better 3D effect */
.card-2025 {
  transform-origin: center;
  will-change: transform;
}

/* Smooth transitions for all states */
.card-2025 * {
  transition-property: color, background-color, border-color;
  transition-duration: 0.2s;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}

/* Enhanced hover state for interactive cards */
.card-2025.cursor-pointer:hover {
  transform: translateY(-4px) scale(1.01);
}

/* Focus states for accessibility */
.card-2025:focus-visible {
  outline: 2px solid theme('colors.primary.500');
  outline-offset: 2px;
}

/* Loading state */
.card-2025:has([v-if="loading"]) {
  pointer-events: none;
}
</style>