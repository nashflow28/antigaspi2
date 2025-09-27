<template>
  <div
    ref="triggerRef"
    class="tooltip-trigger inline-block"
    @mouseenter="show"
    @mouseleave="hide"
    @focus="show"
    @blur="hide"
  >
    <slot />

    <!-- Tooltip Content -->
    <Teleport to="body">
      <Transition name="tooltip">
        <div
          v-if="isVisible"
          ref="tooltipRef"
          :class="tooltipClasses"
          :style="tooltipStyle"
          role="tooltip"
          :aria-hidden="!isVisible"
        >
          <!-- Arrow -->
          <div :class="arrowClasses" />

          <!-- Content -->
          <div :class="contentClasses">
            <slot name="content">
              {{ content }}
            </slot>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'

// Types
export type TooltipPlacement =
  | 'top'
  | 'top-start'
  | 'top-end'
  | 'bottom'
  | 'bottom-start'
  | 'bottom-end'
  | 'left'
  | 'left-start'
  | 'left-end'
  | 'right'
  | 'right-start'
  | 'right-end'

export type TooltipVariant = 'default' | 'dark' | 'light' | 'error' | 'warning' | 'success'

// Props
interface Props {
  content?: string
  placement?: TooltipPlacement
  variant?: TooltipVariant
  disabled?: boolean
  delay?: number
  offset?: number
  maxWidth?: number
  arrow?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  placement: 'top',
  variant: 'dark',
  disabled: false,
  delay: 100,
  offset: 8,
  maxWidth: 200,
  arrow: true
})

// Refs
const triggerRef = ref<HTMLElement>()
const tooltipRef = ref<HTMLElement>()
const isVisible = ref(false)
const timeoutId = ref<number>()
const position = ref({ x: 0, y: 0 })

// Computed
const tooltipClasses = computed(() => [
  'fixed z-50 px-3 py-2 text-xs font-medium rounded-lg shadow-lg',
  'pointer-events-none',
  variantClasses.value,
  'transform-gpu'
].filter(Boolean).join(' '))

const variantClasses = computed(() => {
  const variants = {
    default: 'bg-neutral-900 text-white',
    dark: 'bg-neutral-900 text-white',
    light: 'bg-white text-heading border border-neutral-200',
    error: 'bg-red-600 text-white',
    warning: 'bg-yellow-500 text-white',
    success: 'bg-green-600 text-white'
  }
  return variants[props.variant]
})

const arrowClasses = computed(() => {
  if (!props.arrow) return ''

  const base = 'absolute w-2 h-2 transform rotate-45'
  const variantArrow = {
    default: 'bg-neutral-900',
    dark: 'bg-neutral-900',
    light: 'bg-white border-l border-t border-neutral-200',
    error: 'bg-red-600',
    warning: 'bg-yellow-500',
    success: 'bg-green-600'
  }

  const placementArrow = {
    'top': '-bottom-1 left-1/2 -translate-x-1/2',
    'top-start': '-bottom-1 left-2',
    'top-end': '-bottom-1 right-2',
    'bottom': '-top-1 left-1/2 -translate-x-1/2',
    'bottom-start': '-top-1 left-2',
    'bottom-end': '-top-1 right-2',
    'left': '-right-1 top-1/2 -translate-y-1/2',
    'left-start': '-right-1 top-2',
    'left-end': '-right-1 bottom-2',
    'right': '-left-1 top-1/2 -translate-y-1/2',
    'right-start': '-left-1 top-2',
    'right-end': '-left-1 bottom-2'
  }

  return [base, variantArrow[props.variant], placementArrow[props.placement]].join(' ')
})

const contentClasses = computed(() => [
  'relative z-10'
].join(' '))

const tooltipStyle = computed(() => {
  const style: Record<string, string> = {
    left: `${position.value.x}px`,
    top: `${position.value.y}px`,
    maxWidth: `${props.maxWidth}px`
  }

  return style
})

// Methods
const show = () => {
  if (props.disabled) return

  clearTimeout(timeoutId.value)
  timeoutId.value = window.setTimeout(() => {
    isVisible.value = true
    nextTick(updatePosition)
  }, props.delay)
}

const hide = () => {
  clearTimeout(timeoutId.value)
  isVisible.value = false
}

const updatePosition = () => {
  if (!triggerRef.value || !tooltipRef.value) return

  const triggerRect = triggerRef.value.getBoundingClientRect()
  const tooltipRect = tooltipRef.value.getBoundingClientRect()
  const viewport = {
    width: window.innerWidth,
    height: window.innerHeight
  }

  let x = 0
  let y = 0

  // Calculate base position
  switch (props.placement) {
    case 'top':
    case 'top-start':
    case 'top-end':
      y = triggerRect.top - tooltipRect.height - props.offset
      break
    case 'bottom':
    case 'bottom-start':
    case 'bottom-end':
      y = triggerRect.bottom + props.offset
      break
    case 'left':
    case 'left-start':
    case 'left-end':
      x = triggerRect.left - tooltipRect.width - props.offset
      break
    case 'right':
    case 'right-start':
    case 'right-end':
      x = triggerRect.right + props.offset
      break
  }

  // Calculate alignment
  if (props.placement.includes('top') || props.placement.includes('bottom')) {
    if (props.placement.endsWith('start')) {
      x = triggerRect.left
    } else if (props.placement.endsWith('end')) {
      x = triggerRect.right - tooltipRect.width
    } else {
      x = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2
    }
  } else {
    if (props.placement.endsWith('start')) {
      y = triggerRect.top
    } else if (props.placement.endsWith('end')) {
      y = triggerRect.bottom - tooltipRect.height
    } else {
      y = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2
    }
  }

  // Prevent overflow
  x = Math.max(8, Math.min(x, viewport.width - tooltipRect.width - 8))
  y = Math.max(8, Math.min(y, viewport.height - tooltipRect.height - 8))

  position.value = { x, y }
}

// Lifecycle
onMounted(() => {
  window.addEventListener('scroll', hide, true)
  window.addEventListener('resize', hide)
})

onUnmounted(() => {
  window.removeEventListener('scroll', hide, true)
  window.removeEventListener('resize', hide)
  clearTimeout(timeoutId.value)
})
</script>

<style scoped>
.tooltip-enter-active,
.tooltip-leave-active {
  transition: all 0.15s ease;
}

.tooltip-enter-from,
.tooltip-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>
