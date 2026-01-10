<template>
  <Teleport to="body">
    <Transition
      name="modal"
      @enter="onEnter"
      @after-enter="onAfterEnter"
      @before-leave="onBeforeLeave"
      @after-leave="onAfterLeave"
    >
      <div
        v-if="modelValue"
        :class="overlayClasses"
        @click="handleOverlayClick"
      >
        <!-- Modal Container -->
        <div
          ref="modalRef"
          :class="modalClasses"
          role="dialog"
          :aria-modal="true"
          :aria-labelledby="titleId"
          :aria-describedby="descriptionId"
          @click.stop
        >
          <!-- Close Button -->
          <button
            v-if="closable"
            :class="closeButtonClasses"
            type="button"
            @click="close"
          >
            <X :size="20" />
            <span class="sr-only">Fermer</span>
          </button>

          <!-- Header -->
          <div v-if="$slots.header || title" :class="headerClasses">
            <slot name="header">
              <h3 :id="titleId" :class="titleClasses">{{ title }}</h3>
              <p v-if="description" :id="descriptionId" :class="descriptionClasses">
                {{ description }}
              </p>
            </slot>
          </div>

          <!-- Content -->
          <div :class="contentClasses">
            <slot />
          </div>

          <!-- Footer -->
          <div v-if="$slots.footer" :class="footerClasses">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, useSlots, watch } from 'vue'
import { X } from 'lucide-vue-next'

// Types
export type ModalSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full'
export type ModalVariant = 'default' | 'glass' | 'minimal' | 'alert'

// Props
interface Props {
  modelValue: boolean
  title?: string
  description?: string
  size?: ModalSize
  variant?: ModalVariant
  closable?: boolean
  closeOnOverlay?: boolean
  closeOnEscape?: boolean
  persistent?: boolean
  centered?: boolean
  fullHeight?: boolean
  scrollable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  variant: 'default',
  closable: true,
  closeOnOverlay: true,
  closeOnEscape: true,
  persistent: false,
  centered: true,
  fullHeight: false,
  scrollable: false
})

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'close': []
  'open': []
  'escape': []
}>()

// Refs
const modalRef = ref<HTMLElement>()
const slots = useSlots()

// Computed
const titleId = computed(() => 'modal-title-' + (Math.random() * 1000000).toString(36))
const descriptionId = computed(() => 'modal-description-' + (Math.random() * 1000000).toString(36))

const overlayClasses = computed(() => [
  // Base overlay
  'fixed inset-0 z-50',
  'flex items-center justify-center',
  'bg-black/50 backdrop-blur-sm',
  'p-4',

  // Centering
  props.centered ? 'items-center' : 'items-start pt-16',

  // Scrollable
  props.scrollable && 'overflow-y-auto'
].filter(Boolean).join(' '))

const modalClasses = computed(() => [
  // Base modal
  'relative w-full max-h-full',
  'transform transition-all duration-300',
  'shadow-80',

  // Size
  sizeClasses.value,

  // Variant
  variantClasses.value,

  // Height
  props.fullHeight ? 'h-full' : 'max-h-[90vh]',

  // Scrollable content
  props.scrollable && 'flex flex-col'
].filter(Boolean).join(' '))

const sizeClasses = computed(() => {
  const sizes = {
    xs: 'max-w-xs',
    sm: 'max-w-sm',
    md: 'max-w-xl',
    lg: 'max-w-xl',
    xl: 'max-w-xl',
    '2xl': 'max-w-80',
    '3xl': 'max-w-6xl',
    full: 'max-w-full mx-lg'
  }
  return sizes[props.size]
})

const variantClasses = computed(() => {
  const variants = {
    default: [
      'bg-white rounded',
      'border border-neutral-200'
    ].join(' '),

    glass: [
      'bg-white/90 backdrop-blur-xl rounded',
      'border border-white/20',
      'shadow-glass'
    ].join(' '),

    minimal: [
      'bg-white rounded',
      'shadow-xl'
    ].join(' '),

    alert: [
      'bg-white rounded',
      'border-l-4 border-accent-orange',
      'shadow-xl'
    ].join(' ')
  }

  return variants[props.variant]
})

const closeButtonClasses = computed(() => [
  'absolute top-4 right-4 z-10',
  'flex items-center justify-center',
  'w-xxl h-12 rounded-full',
  'text-neutral-400 hover:text-neutral-700',
  'hover:bg-neutral-100 transition-colors',
  'focus:outline-none focus:ring-2 focus:ring-primary-500/50'
].join(' '))

const headerClasses = computed(() => [
  'px-4 pt-2xl',
  'pb-lg'
].join(' '))

const titleClasses = computed(() => [
  'text-xl font-semibold text-neutral-900',
  'mb-1'
].join(' '))

const descriptionClasses = computed(() => [
  'text-sm text-neutral-600'
].join(' '))

const contentClasses = computed(() => [
  props.scrollable ? 'flex-1 overflow-y-auto' : '',
  'px-4',
  !props.title ? 'pt-2xl' : '',
  !slots.footer ? 'pb-2xl' : 'pb-lg'
].filter(Boolean).join(' '))

const footerClasses = computed(() => [
  'px-4 pb-2xl',
  'border-t border-neutral-200',
  'bg-neutral-50/50'
].join(' '))

// Methods
const close = () => {
  if (!props.persistent) {
    emit('update:modelValue', false)
    emit('close')
  }
}

const handleOverlayClick = () => {
  if (props.closeOnOverlay) {
    close()
  }
}

const handleEscape = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && props.closeOnEscape) {
    emit('escape')
    close()
  }
}

// Lifecycle
const originalActiveElement = ref<Element | null>(null)

// Watchers
watch(() => props.modelValue, async (isOpen) => {
  if (isOpen) {
    originalActiveElement.value = document.activeElement
    document.body.style.overflow = 'hidden'
    await nextTick()
    emit('open')
  } else {
    document.body.style.overflow = ''
    ;(originalActiveElement.value as HTMLElement)?.focus()
  }
})

// Event listeners
onMounted(() => {
  document.addEventListener('keydown', handleEscape)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleEscape)
  document.body.style.overflow = ''
})

// Transition hooks
const onEnter = () => {
  // Animation enter
}

const onAfterEnter = () => {
  // Animation completed
}

const onBeforeLeave = () => {
  // Animation leave start
}

const onAfterLeave = () => {
  // Animation completed
}
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from {
  opacity: 0;
}

.modal-enter-to {
  opacity: 1;
}

.modal-leave-from {
  opacity: 1;
}

.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .relative,
.modal-leave-active .relative {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.modal-enter-from .relative {
  transform: scale(0.9) translateY(-20px);
  opacity: 0;
}

.modal-leave-to .relative {
  transform: scale(0.95) translateY(10px);
  opacity: 0;
}

.shadow-glass {
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}
</style>
