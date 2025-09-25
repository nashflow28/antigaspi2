<template>
  <div
    :class="computedClasses"
    @click="handleClick"
  >
    <!-- Header -->
    <div v-if="$slots.header || title" class="card-header">
      <slot name="header">
        <h3 v-if="title" class="card-title">{{ title }}</h3>
      </slot>
    </div>

    <!-- Content -->
    <div v-if="$slots.default" class="card-content">
      <slot />
    </div>

    <!-- Footer -->
    <div v-if="$slots.footer" class="card-footer">
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
    // Base card styles
    'card-2025',
    'overflow-hidden',
    'transition-all duration-300',

    // Variant classes
    variantClasses.value,

    // Interactive states
    props.interactive && [
      'cursor-pointer',
      'hover:scale-[1.02]',
      'active:scale-[0.98]',
      'focus:outline-none focus:ring-2 focus:ring-primary-500/50'
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
      'bg-white',
      'border border-neutral-200',
      'hover:border-neutral-300'
    ].join(' '),

    glass: [
      'bg-white/60 backdrop-blur-md',
      'border border-white/20',
      'hover:bg-white/70',
      'shadow-glass'
    ].join(' '),

    gradient: [
      'bg-gradient-to-br from-white to-neutral-50',
      'border border-neutral-200',
      'hover:from-neutral-50 hover:to-neutral-100'
    ].join(' '),

    bordered: [
      'bg-white',
      'border-2 border-primary-200',
      'hover:border-primary-300'
    ].join(' '),

    elevated: [
      'bg-white',
      'border-0',
      'shadow-card-elevated',
      'hover:shadow-card-elevated-hover'
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
  const rounded = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    full: 'rounded-full'
  }

  return rounded[props.rounded]
})

// Methods
const handleClick = (event: MouseEvent) => {
  if (props.interactive) {
    emit('click', event)
  }
}
</script>

<style scoped>
.card-2025 {
  /* Custom card styles for 2025 design system */
}

.card-header {
  @apply border-b border-neutral-200 pb-4 mb-4;
}

.card-title {
  @apply text-lg font-semibold text-neutral-900;
}

.card-content {
  @apply text-neutral-700;
}

.card-footer {
  @apply border-t border-neutral-200 pt-4 mt-4;
}

.shadow-glass {
  box-shadow: 0 8px 32px rgba(31, 38, 135, 0.1);
}

.shadow-card-elevated {
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.1),
    0 10px 25px rgba(0, 0, 0, 0.05);
}

.shadow-card-elevated-hover {
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.12),
    0 16px 32px rgba(0, 0, 0, 0.08);
}
</style>