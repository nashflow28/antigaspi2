<template>
  <div
    :class="computedClasses"
    :data-variant="props.variant"
    @click="handleClick"
  >
    <!-- Header -->
    <div v-if="$slots.header || title" class="ui-header">
      <slot name="header">
        <h3 v-if="title" class="ui-title">{{ title }}</h3>
      </slot>
    </div>

    <!-- Content -->
    <div v-if="$slots.default" class="ui-content">
      <slot />
    </div>

    <!-- Footer -->
    <div v-if="$slots.footer" class="ui-footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

// Types
export type CardVariant =
  | 'default'
  | 'glass'
  | 'gradient'
  | 'bordered'
  | 'elevated'

// Props
interface Props {
  variant?: CardVariant
  title?: string
  interactive?: boolean
  noPadding?: boolean
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full'
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  interactive: false,
  noPadding: false,
  shadow: 'md',
  rounded: 'lg'
})

// Emits
const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

// Computed classes
const computedClasses = computed(() => {
  const baseClasses = [
    // Base component styles
    'ui-2025',
    'surface-panel',
    'overflow-hidden',
    'transition-all duration-300',

    // Variant classes
    variantClasses.value,

    // Interactive states
    props.interactive && [
      'cursor-pointer',
      'hover:scale-[1.02]',
      'active:scale-[0.98]',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/60',
      'focus-visible:ring-offset-2 focus-visible:ring-offset-surface-light dark:focus-visible:ring-offset-surface-dark'
    ].filter(Boolean).join(' '),

    // Shadow
    shadowClasses.value,

    // Rounded corners
    roundedClasses.value,

    // Padding
    !props.noPadding && 'p-6'
  ].filter(Boolean)

  return baseClasses.join(' ')
})

const variantClasses = computed(() => {
  const variants = {
    default: [
      'bg-surface-light text-neutral-900',
      'dark:bg-surface-dark dark:text-neutral-50',
      'border border-neutral-200 dark:border-neutral-700',
      'shadow-card hover:shadow-glow'
    ].join(' '),

    glass: [
      'bg-surface-light/70 dark:bg-surface-dark/70',
      'backdrop-blur-xl',
      'border border-neutral-200/60 dark:border-neutral-700/60',
      'shadow-glow hover:shadow-card'
    ].join(' '),

    gradient: [
      'bg-gradient-to-br from-primary-500/15 via-surface-light to-primary-500/10',
      'dark:from-primary-500/20 dark:via-surface-dark dark:to-primary-500/10',
      'border border-primary-500/10 dark:border-primary-500/20',
      'text-neutral-900 dark:text-neutral-100'
    ].join(' '),

    bordered: [
      'bg-surface-light dark:bg-surface-dark',
      'border-2 border-primary-400/50 dark:border-primary-500/60',
      'hover:border-primary-500'
    ].join(' '),

    elevated: [
      'bg-surface-light dark:bg-surface-dark',
      'border border-neutral-200/60 dark:border-neutral-700/60',
      'shadow-card hover:shadow-glow'
    ].join(' ')
  }

  return variants[props.variant]
})

const shadowClasses = computed(() => {
  if (props.variant === 'glass' || props.variant === 'elevated') {
    return '' // Handled by variant
  }

  const shadows = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl'
  }

  return shadows[props.shadow]
})

const roundedClasses = computed(() => {
  const roundedOptions = {
    none: 'rounded-none',
    sm: 'rounded-lg',
    md: 'rounded-xl',
    lg: 'rounded-2xl',
    xl: 'rounded-3xl',
    full: 'rounded-full'
  }

  return roundedOptions[props.rounded]
})

// Methods
const handleClick = (event: MouseEvent) => {
  if (props.interactive) {
    emit('click', event)
  }
}
</script>

<style scoped>
.ui-2025 {
  /* Custom component styles for 2025 design system */
}

.ui-header {
  @apply border-b border-neutral-200 dark:border-neutral-700 pb-4 mb-4;
}

.ui-title {
  @apply text-lg font-semibold text-neutral-900 dark:text-neutral-50;
}

.ui-content {
  @apply text-neutral-700 dark:text-neutral-200;
}

.ui-footer {
  @apply border-t border-neutral-200 dark:border-neutral-700 pt-4 mt-4;
}

.shadow-glass {
  box-shadow: 0 8px 32px rgba(31, 38, 135, 0.1);
}

.shadow-ui-elevated {
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.1),
    0 10px 25px rgba(0, 0, 0, 0.05);
}

.shadow-ui-elevated-hover {
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.12),
    0 16px 32px rgba(0, 0, 0, 0.08);
}
</style>
