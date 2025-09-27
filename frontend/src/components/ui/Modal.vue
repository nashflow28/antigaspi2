<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @click.self="onOverlayClick"
      >
        <div
          class="modal-overlay relative sm:absolute inset-0 bg-overlay"
          aria-hidden="true"
          @click="onOverlayClick"
        />

        <div
          role="dialog"
          aria-modal="true"
          :aria-labelledby="title ? modalTitleId : undefined"
          :aria-describedby="description ? modalDescriptionId : undefined"
          :class="['modal-panel', modalClass]"
          v-bind="otherAttrs"
        >
          <header v-if="title || showCloseButton" class="flex items-stretch sm:items-start justify-start sm:justify-between gap-4 px-6 py-5">
            <div class="space-y-2">
              <h2 v-if="title" :id="modalTitleId" class="text-h2 font-semibold text-primary-emphasis dark:text-primary-200">
                {{ title }}
              </h2>
              <p
                v-if="description"
                :id="modalDescriptionId"
                class="text-small text-muted dark:text-neutral-300"
              >
                {{ description }}
              </p>
            </div>

            <Button
              v-if="showCloseButton"
              variant="ghost"
              size="icon"
              aria-label="Fermer la fenêtre"
              @click="emitClose"
            >
              <svg
                class="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </Button>
          </header>

          <section class="px-6 pb-6">
            <slot />
          </section>

          <footer
            v-if="$slots.footer"
            class="mt-6 flex flex-col gap-3 border-t border-neutral-200/60 px-6 pb-6 pt-4 dark:border-neutral-700/60 sm:flex-row sm:items-center sm:justify-end"
          >
            <slot name="footer" />
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, useAttrs, useId, watch } from 'vue'

import Button from './Button.vue'

type ModalSize = 'sm' | 'default' | 'lg' | 'xl' | 'full';
type ModalVariant = 'surface' | 'glass' | 'dark';

const props = withDefaults(
  defineProps<{
    isOpen: boolean;
    title?: string;
    description?: string;
    size?: ModalSize;
    variant?: ModalVariant;
    showCloseButton?: boolean;
    closeOnOverlayClick?: boolean;
    closeOnEscape?: boolean;
  }>(),
  {
    size: 'default',
    variant: 'glass',
    showCloseButton: true,
    closeOnOverlayClick: true,
    closeOnEscape: true
  }
)

const emit = defineEmits<{
  (event: 'close'): void;
}>()

const attrs = useAttrs()
const generatedId = useId()
const modalTitleId = `modal-title-${generatedId}`
const modalDescriptionId = `modal-description-${generatedId}`

const sizeClasses: Record<ModalSize, string> = {
  sm: 'max-w-md',
  default: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-6xl mx-4'
}

const variantClasses: Record<ModalVariant, string> = {
  surface:
    'bg-white text-heading-secondary border border-neutral-200 shadow-card dark:bg-neutral-900 dark:text-neutral-50 dark:border-neutral-800',
  glass:
    'bg-white/90 text-heading-secondary border border-primary-500/15 shadow-glow backdrop-blur-xl dark:bg-neutral-900/80 dark:text-neutral-50',
  dark: 'bg-neutral-900 text-neutral-50 border border-neutral-700 shadow-glow'
}

const externalClass = computed(() => (attrs.class as string | undefined) ?? '')
const otherAttrs = computed(() => {
  const { class: _class, ...rest } = attrs
  return rest
})

const modalClass = computed(() => [
  'relative w-full rounded-3xl transition-all duration-300 ease-[0.22,1,0.36,1] transform-gpu',
  sizeClasses[props.size],
  variantClasses[props.variant],
  externalClass.value
])

const emitClose = () => {
  emit('close')
}

const onOverlayClick = () => {
  if (props.closeOnOverlayClick) {
    emitClose()
  }
}

const handleEscape = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && props.isOpen && props.closeOnEscape) {
    emitClose()
  }
}

watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      if (props.closeOnEscape) {
        window.addEventListener('keydown', handleEscape)
      }
      document.body.style.overflow = 'hidden'
    } else {
      window.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  },
  { immediate: true }
)

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleEscape)
  document.body.style.overflow = ''
})
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease-out;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .modal-panel,
.modal-leave-active .modal-panel {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.modal-enter-from .modal-panel,
.modal-leave-to .modal-panel {
  opacity: 0;
  transform: translateY(24px) scale(0.96);
}

.modal-enter-active .modal-overlay,
.modal-leave-active .modal-overlay {
  transition: opacity 0.3s ease;
}

.modal-enter-from .modal-overlay,
.modal-leave-to .modal-overlay {
  opacity: 0;
}
</style>
