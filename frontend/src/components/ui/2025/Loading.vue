<template>
  <div :class="wrapperClasses">
    <!-- Spinner -->
    <div v-if="type === 'spinner'" :class="spinnerClasses">
      <div :class="spinnerInnerClasses" />
    </div>

    <!-- Dots -->
    <div v-else-if="type === 'dots'" :class="dotsClasses">
      <div
        v-for="i in 3"
        :key="i"
        :class="dotClasses"
        :style="{ animationDelay: (i - 1) * 0.2 + 's' }"
      />
    </div>

    <!-- Pulse -->
    <div v-else-if="type === 'pulse'" :class="pulseClasses" />

    <!-- Skeleton -->
    <div v-else-if="type === 'skeleton'" :class="skeletonClasses">
      <div v-for="i in skeletonLines" :key="i" :class="skeletonLineClasses" />
    </div>

    <!-- Progress Bar -->
    <div v-else-if="type === 'progress'" :class="progressClasses">
      <div :class="progressBarClasses" :style="progressStyle" />
    </div>

    <!-- Custom Content -->
    <div v-else-if="type === 'custom'" :class="customClasses">
      <slot />
    </div>

    <!-- Text -->
    <p v-if="text" :class="textClasses">{{ text }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

// Types
export type LoadingType = 'spinner' | 'dots' | 'pulse' | 'skeleton' | 'progress' | 'custom'
export type LoadingSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'
export type LoadingVariant = 'default' | 'primary' | 'muted'

// Props
interface Props {
  type?: LoadingType
  size?: LoadingSize
  variant?: LoadingVariant
  text?: string
  progress?: number
  skeletonLines?: number
  centered?: boolean
  overlay?: boolean
  transparent?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  type: 'spinner',
  size: 'md',
  variant: 'default',
  progress: 0,
  skeletonLines: 3,
  centered: false,
  overlay: false,
  transparent: false
})

// Computed
const wrapperClasses = computed(() => [
  'loading-2025',
  props.centered && 'flex flex-col items-center justify-center',
  props.overlay && [
    'absolute inset-0 z-40',
    props.transparent ? 'bg-white/70' : 'bg-white/90',
    'backdrop-blur-sm'
  ],
  props.text && 'space-y-4'
].flat().filter(Boolean).join(' '))

const colorClasses = computed(() => {
  const variants = {
    default: 'text-neutral-600',
    primary: 'text-primary-600',
    muted: 'text-neutral-400'
  }
  return variants[props.variant]
})

// Spinner
const spinnerClasses = computed(() => [
  'inline-block animate-spin',
  props.size === 'xs' && 'h-6 w-6',
  props.size === 'sm' && 'h-4 w-4',
  props.size === 'md' && 'w-12 h-10',
  props.size === 'lg' && 'w-xxl h-12',
  props.size === 'xl' && 'h-6 w-6',
  colorClasses.value
].filter(Boolean).join(' '))

const spinnerInnerClasses = computed(() => [
  'w-full h-full border-2 border-current border-t-transparent rounded-full'
].join(' '))

// Dots
const dotsClasses = computed(() => [
  'flex items-center space-x-1'
].join(' '))

const dotClasses = computed(() => [
  'animate-bounce rounded-full bg-current',
  props.size === 'xs' && 'w-xs h-3',
  props.size === 'sm' && 'w-xs.5 h-3.5',
  props.size === 'md' && 'h-4 w-4',
  props.size === 'lg' && 'w-sm.5 h-4.5',
  props.size === 'xl' && 'w-xs h-3',
  colorClasses.value
].filter(Boolean).join(' '))

// Pulse
const pulseClasses = computed(() => [
  'animate-pulse rounded bg-neutral-300',
  props.size === 'xs' && 'w-xxl h-12',
  props.size === 'sm' && 'h-6 w-6',
  props.size === 'md' && 'w-12 h-10',
  props.size === 'lg' && 'w-12 h-10',
  props.size === 'xl' && 'w-20 h-12'
].filter(Boolean).join(' '))

// Skeleton
const skeletonClasses = computed(() => [
  'animate-pulse space-y-4'
].join(' '))

const skeletonLineClasses = computed(() => [
  'h-10 bg-neutral-300 rounded last:w-sm/3'
].join(' '))

// Progress
const progressClasses = computed(() => [
  'w-full bg-neutral-200 rounded-full overflow-hidden',
  props.size === 'xs' && 'h-3',
  props.size === 'sm' && 'h-4',
  props.size === 'md' && 'h-3',
  props.size === 'lg' && 'h-10',
  props.size === 'xl' && 'h-10'
].filter(Boolean).join(' '))

const progressBarClasses = computed(() => [
  'h-full bg-gradient-to-r from-primary-500 to-primary-600',
  'transition-all duration-300 ease-out rounded-full'
].join(' '))

const progressStyle = computed(() => {
  const clampedProgress = Math.min(100, Math.max(0, props.progress))
  return { width: clampedProgress + '%' }
})

// Custom
const customClasses = computed(() => [
  props.centered && 'flex items-center justify-center'
].filter(Boolean).join(' '))

// Text
const textClasses = computed(() => [
  'text-sm font-medium',
  colorClasses.value,
  props.centered && 'text-center'
].filter(Boolean).join(' '))
</script>

<style scoped>
.loading-2025 {
  /* Custom loading styles for 2025 design system */
}

@keyframes bounce {
  0%, 80%, 100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}

.animate-bounce {
  animation: bounce 1.4s infinite ease-in-out both;
}
</style>
