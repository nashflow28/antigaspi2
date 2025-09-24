<template>
  <button
    :class="buttonClasses"
    :disabled="disabled || loading"
    :type="type"
    :aria-label="ariaLabel"
    :aria-describedby="ariaDescribedBy"
    @click="handleClick"
    @mousedown="onMouseDown"
    @mouseup="onMouseUp"
    @mouseleave="onMouseLeave"
    @focus="onFocus"
    @blur="onBlur"
    ref="buttonRef"
  >
    <!-- Ripple effect -->
    <span
      v-if="ripple && !prefersReducedMotion"
      class="absolute inset-0 overflow-hidden rounded-inherit"
    >
      <span
        v-for="(rippleItem, index) in ripples"
        :key="index"
        :class="rippleItem.class"
        :style="rippleItem.style"
        class="absolute rounded-full animate-ping opacity-75"
      ></span>
    </span>

    <!-- Loading spinner -->
    <Transition name="fade">
      <div v-if="loading" class="absolute inset-0 flex items-center justify-center">
        <Loader2 class="w-4 h-4 animate-spin" />
      </div>
    </Transition>

    <!-- Button content -->
    <span
      :class="contentClasses"
      class="relative flex items-center justify-center gap-2 transition-all duration-200"
    >
      <!-- Icon before -->
      <span v-if="iconBefore && !loading" :class="iconClasses">
        <component :is="iconBefore" />
      </span>

      <!-- Default slot -->
      <slot />

      <!-- Icon after -->
      <span v-if="iconAfter && !loading" :class="iconClasses">
        <component :is="iconAfter" />
      </span>

      <!-- Success checkmark -->
      <Transition name="primary-pop">
        <Check
          v-if="showSuccess"
          class="w-4 h-4 text-primary-500"
        />
      </Transition>
    </span>

    <!-- Glow effect for primary buttons -->
    <span
      v-if="variant === 'primary' && !disabled && !prefersReducedMotion"
      class="absolute inset-0 rounded-inherit bg-primary-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300"
    ></span>
  </button>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import { Loader2, Check } from 'lucide-vue-next'
import { useAnimations } from '@/composables/useAnimations'

interface Props {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'ghost' | 'outline'
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  loading?: boolean
  disabled?: boolean
  ripple?: boolean
  type?: 'button' | 'submit' | 'reset'
  iconBefore?: any
  iconAfter?: any
  ariaLabel?: string
  ariaDescribedBy?: string
  successDuration?: number
  block?: boolean
  rounded?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  loading: false,
  disabled: false,
  ripple: true,
  type: 'button',
  successDuration: 2000,
  block: false,
  rounded: false
})

const emit = defineEmits<{
  click: [event: MouseEvent]
  success: []
  focus: [event: FocusEvent]
  blur: [event: FocusEvent]
}>()

const { prefersReducedMotion, bounce } = useAnimations()

const buttonRef = ref<HTMLButtonElement>()
const ripples = ref<Array<{ class: string; style: string; id: number }>>([])
const showSuccess = ref(false)
const rippleId = ref(0)

// Computed classes
const buttonClasses = computed(() => {
  const baseClasses = [
    'relative',
    'inline-flex',
    'items-center',
    'justify-center',
    'font-medium',
    'transition-all',
    'duration-200',
    'focus:outline-none',
    'focus:ring-2',
    'focus:ring-offset-2',
    'group',
    'overflow-hidden'
  ]

  // Size classes
  const sizeClasses = {
    xs: ['px-2', 'py-1', 'text-xs', 'min-h-[24px]'],
    sm: ['px-3', 'py-1.5', 'text-sm', 'min-h-[32px]'],
    md: ['px-4', 'py-2', 'text-sm', 'min-h-[40px]'],
    lg: ['px-6', 'py-3', 'text-base', 'min-h-[48px]'],
    xl: ['px-8', 'py-4', 'text-lg', 'min-h-[56px]']
  }

  // Variant classes
  const variantClasses = {
    primary: [
      'bg-primary-600',
      'text-white',
      'shadow-sm',
      'hover:bg-primary-700',
      'hover:shadow-md',
      'hover:-translate-y-0.5',
      'active:bg-primary-800',
      'active:translate-y-0',
      'focus:ring-primary-500',
      'disabled:bg-primary-300',
      'disabled:cursor-not-allowed',
      'disabled:transform-none',
      'disabled:shadow-none'
    ],
    secondary: [
      'bg-accent-blue/90',
      'text-white',
      'shadow-sm',
      'hover:bg-accent-blue/95',
      'hover:shadow-md',
      'hover:-translate-y-0.5',
      'active:bg-accent-blue/95',
      'focus:ring-accent-blue',
      'disabled:bg-accent-blue/20'
    ],
    success: [
      'bg-primary-600',
      'text-white',
      'shadow-sm',
      'hover:bg-primary-700',
      'hover:shadow-md',
      'hover:-translate-y-0.5',
      'active:bg-primary-800',
      'focus:ring-primary-500',
      'disabled:bg-primary-300'
    ],
    danger: [
      'bg-red-600',
      'text-white',
      'shadow-sm',
      'hover:bg-red-700',
      'hover:shadow-md',
      'hover:-translate-y-0.5',
      'active:bg-red-800',
      'focus:ring-red-500',
      'disabled:bg-red-300'
    ],
    warning: [
      'bg-yellow-500',
      'text-white',
      'shadow-sm',
      'hover:bg-yellow-600',
      'hover:shadow-md',
      'hover:-translate-y-0.5',
      'active:bg-yellow-700',
      'focus:ring-yellow-500',
      'disabled:bg-yellow-300'
    ],
    ghost: [
      'bg-transparent',
      'text-gray-700',
      'hover:bg-gray-100',
      'hover:text-gray-900',
      'active:bg-gray-200',
      'focus:ring-gray-500',
      'disabled:text-gray-400',
      'disabled:hover:bg-transparent'
    ],
    outline: [
      'bg-transparent',
      'border',
      'border-gray-300',
      'text-gray-700',
      'hover:bg-gray-50',
      'hover:border-gray-400',
      'active:bg-gray-100',
      'focus:ring-gray-500',
      'disabled:text-gray-400',
      'disabled:border-gray-200'
    ]
  }

  // Rounded classes
  const roundedClasses = props.rounded ? ['rounded-full'] : ['rounded-lg']

  // Block classes
  const blockClasses = props.block ? ['w-full'] : []

  return [
    ...baseClasses,
    ...sizeClasses[props.size],
    ...variantClasses[props.variant],
    ...roundedClasses,
    ...blockClasses
  ]
})

const contentClasses = computed(() => [
  props.loading ? 'opacity-0' : 'opacity-100'
])

const iconClasses = computed(() => {
  const sizeMap = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
    xl: 'w-6 h-6'
  }
  return sizeMap[props.size]
})

// Event handlers
const handleClick = (event: MouseEvent) => {
  if (props.disabled || props.loading) return

  // Create ripple effect
  if (props.ripple && !prefersReducedMotion.value) {
    createRipple(event)
  }

  // Bounce animation for primary buttons
  if (props.variant === 'primary' && buttonRef.value && !prefersReducedMotion.value) {
    bounce(buttonRef.value, { duration: 200 })
  }

  emit('click', event)
}

const onMouseDown = () => {
  if (buttonRef.value && !prefersReducedMotion.value) {
    buttonRef.value.style.transform = 'scale(0.98)'
  }
}

const onMouseUp = () => {
  if (buttonRef.value && !prefersReducedMotion.value) {
    buttonRef.value.style.transform = ''
  }
}

const onMouseLeave = () => {
  if (buttonRef.value && !prefersReducedMotion.value) {
    buttonRef.value.style.transform = ''
  }
}

const onFocus = (event: FocusEvent) => {
  emit('focus', event)
}

const onBlur = (event: FocusEvent) => {
  emit('blur', event)
}

// Ripple effect
const createRipple = (event: MouseEvent) => {
  if (!buttonRef.value) return

  const button = buttonRef.value
  const rect = button.getBoundingClientRect()
  const size = Math.max(rect.width, rect.height)
  const x = event.clientX - rect.left - size / 2
  const y = event.clientY - rect.top - size / 2

  const id = rippleId.value++
  const ripple = {
    id,
    class: 'bg-white',
    style: `
      left: ${x}px;
      top: ${y}px;
      width: ${size}px;
      height: ${size}px;
      animation-duration: 600ms;
    `
  }

  ripples.value.push(ripple)

  // Remove ripple after animation
  setTimeout(() => {
    const index = ripples.value.findIndex(r => r.id === id)
    if (index > -1) {
      ripples.value.splice(index, 1)
    }
  }, 600)
}

// Success state
const showSuccessState = () => {
  showSuccess.value = true
  setTimeout(() => {
    showSuccess.value = false
  }, props.successDuration)
  emit('success')
}

// Cleanup
onUnmounted(() => {
  ripples.value = []
})

// Expose methods
defineExpose({
  showSuccessState,
  focus: () => buttonRef.value?.focus(),
  blur: () => buttonRef.value?.blur()
})
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.primary-pop-enter-active {
  transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.primary-pop-enter-from {
  opacity: 0;
  transform: scale(0);
}

.primary-pop-leave-active {
  transition: all 0.2s ease;
}

.primary-pop-leave-to {
  opacity: 0;
  transform: scale(0);
}

/* Accessibility improvements */
@media (prefers-reduced-motion: reduce) {
  button {
    transform: none !important;
    transition: none !important;
  }
}

/* Focus visible for better keyboard navigation */
.group:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 2px;
}
</style>