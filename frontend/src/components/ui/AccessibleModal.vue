<template>
  <Teleport to="body">
    <Transition
      name="modal-backdrop"
      @before-enter="onBeforeEnter"
      @after-enter="onAfterEnter"
      @before-leave="onBeforeLeave"
      @after-leave="onAfterLeave"
    >
      <div
        v-if="modelValue"
        class="fixed inset-0 z-[120] flex items-center justify-center p-4"
        :class="backdropClasses"
        @click="onBackdropClick"
      >
        <!-- Backdrop -->
        <div
          class="relative sm:absolute inset-0 bg-black/50 backdrop-blur-sm"
          :aria-hidden="true"
        />

        <!-- Modal Container -->
        <Transition name="modal-content" appear>
          <div
            v-if="modelValue"
            ref="modalRef"
            :class="modalClasses"
            role="dialog"
            :aria-modal="true"
            :aria-labelledby="titleId"
            :aria-describedby="descriptionId"
            :aria-label="ariaLabel"
            @click.stop
            @keydown="onKeyDown"
          >
            <!-- Skip Link -->
            <a
              href="#modal-close"
              class="skip-link sr-only focus:not-sr-only focus:relative sm:absolute focus:top-2 focus:right-2 bg-primary-600 text-white px-4 py-3 rounded text-responsive-sm z-10"
            >
              Skip to close button
            </a>

            <!-- Header -->
            <header
              v-if="hasHeader"
              :class="headerClasses"
            >
              <div class="flex items-center justify-start sm:justify-between">
                <!-- Title -->
                <h2
                  :id="titleId"
                  :class="titleClasses"
                >
                  <slot name="title">{{ title }}</slot>
                </h2>

                <!-- Close Button -->
                <Button
                  v-if="closable"
                  id="modal-close"
                  variant="ghost"
                  size="icon"
                  :aria-label="closeAriaLabel"
                  class="ml-4 -mr-2 shrink-0"
                  :left-icon="X"
                  @click="close"
                >
                  <span class="sr-only">{{ closeAriaLabel }}</span>
                </Button>
              </div>

              <!-- Description -->
              <p
                v-if="description || slots.description"
                :id="descriptionId"
                class="text-responsive-sm text-body dark:text-placeholder mt-2"
              >
                <slot name="description">{{ description }}</slot>
              </p>
            </header>

            <!-- Body -->
            <div
              :class="bodyClasses"
              role="main"
              :tabindex="scrollable ? 0 : undefined"
              :aria-label="scrollable ? 'Scrollable content' : undefined"
            >
              <slot />
            </div>

            <!-- Footer -->
            <footer
              v-if="hasFooter"
              :class="footerClasses"
              role="contentinfo"
            >
              <slot name="footer">
                <div class="flex gap-3 justify-center sm:justify-end">
                  <Button
                    v-if="showCancel"
                    variant="outline"
                    :aria-describedby="`${titleId}-cancel-help`"
                    @click="cancel"
                  >
                    {{ cancelText }}
                  </Button>

                  <Button
                    v-if="showConfirm"
                    :variant="confirmButtonVariant"
                    :loading="loading"
                    :aria-describedby="`${titleId}-confirm-help`"
                    @click="confirm"
                  >
                    {{ confirmText }}
                  </Button>
                </div>

                <!-- Hidden help text for buttons -->
                <div class="sr-only">
                  <div
                    v-if="showCancel"
                    :id="`${titleId}-cancel-help`"
                  >
                    Close this dialog without saving changes
                  </div>
                  <div
                    v-if="showConfirm"
                    :id="`${titleId}-confirm-help`"
                  >
                    Confirm and apply changes
                  </div>
                </div>
              </slot>
            </footer>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onUnmounted, useSlots } from 'vue'
import { X } from 'lucide-vue-next'
import { useAccessibility } from '@/composables/useAccessibility'
import Button from './Button.vue'

interface Props {
  modelValue: boolean
  title?: string
  description?: string
  ariaLabel?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full'
  closable?: boolean
  closeOnBackdrop?: boolean
  closeOnEscape?: boolean
  scrollable?: boolean
  loading?: boolean
  persistent?: boolean
  showCancel?: boolean
  showConfirm?: boolean
  cancelText?: string
  confirmText?: string
  confirmVariant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning'
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  closable: true,
  closeOnBackdrop: true,
  closeOnEscape: true,
  scrollable: false,
  loading: false,
  persistent: false,
  showCancel: false,
  showConfirm: false,
  cancelText: 'Annuler',
  confirmText: 'Confirmer',
  confirmVariant: 'primary'
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  close: []
  cancel: []
  confirm: []
  opened: []
  closed: []
}>()

const slots = useSlots()
const {
  trapFocusInContainer,
  createAriaId,
  announce,
  saveFocus,
  restoreFocusToSaved
} = useAccessibility({
  trapFocus: true,
  autoFocus: true,
  restoreFocus: true
})

const modalRef = ref<HTMLElement>()
const cleanupFocusTrap = ref<(() => void) | null>(null)

// IDs pour ARIA
const titleId = createAriaId('modal-title')
const descriptionId = createAriaId('modal-description')

// Computed properties
const hasHeader = computed(() =>
  props.title || props.description || slots.title || slots.description || props.closable
)

const hasFooter = computed(() =>
  slots.footer || props.showCancel || props.showConfirm
)

const closeAriaLabel = computed(() =>
  'Close dialog'
)

const confirmButtonVariant = computed(() => {
  const mapping: Record<
    NonNullable<Props['confirmVariant']>,
    'primary' | 'secondary' | 'ghost' | 'outline' | 'promo' | 'destructive'
  > = {
    primary: 'primary',
    secondary: 'secondary',
    success: 'primary',
    danger: 'destructive',
    warning: 'promo'
  }

  return mapping[props.confirmVariant]
})

const backdropClasses = computed(() => [
  'bg-black/20',
  'backdrop-blur-sm',
  {
    'cursor-pointer': props.closeOnBackdrop && !props.persistent
  }
])

const modalClasses = computed(() => {
  const baseClasses = [
    'relative',
    'bg-white',
    'dark:bg-dark-800',
    'rounded-xl',
    'shadow-2xl',
    'border',
    'border-gray-200',
    'dark:border-dark-700',
    'max-h-[90vh]',
    'flex',
    'flex-col',
    'focus:outline-none'
  ]

  const sizeClasses = {
    xs: ['w-full', 'max-w-xs'],
    sm: ['w-full', 'max-w-sm'],
    md: ['w-full', 'max-w-md'],
    lg: ['w-full', 'max-w-lg'],
    xl: ['w-full', 'max-w-2xl'],
    full: ['w-full', 'h-full', 'max-w-none', 'max-h-none', 'rounded-none']
  }

  return [
    ...baseClasses,
    ...sizeClasses[props.size]
  ]
})

const headerClasses = computed(() => [
  'px-6',
  'py-4',
  'border-b',
  'border-gray-200',
  'dark:border-dark-700',
  'shrink-0'
])

const titleClasses = computed(() => [
  'text-lg',
  'font-semibold',
  'text-gray-900',
  'dark:text-white',
  'leading-6'
])

const bodyClasses = computed(() => [
  'px-6',
  'py-4',
  'flex-1',
  {
    'overflow-y-auto': props.scrollable,
    'min-h-0': props.scrollable
  }
])

const footerClasses = computed(() => [
  'px-6',
  'py-4',
  'bg-gray-50',
  'dark:bg-dark-900',
  'border-t',
  'border-gray-200',
  'dark:border-dark-700',
  'rounded-b-xl',
  'shrink-0'
])

// Methods
const close = () => {
  if (props.persistent && props.loading) return
  emit('update:modelValue', false)
  emit('close')
}

const cancel = () => {
  emit('cancel')
  close()
}

const confirm = () => {
  emit('confirm')
}

const onBackdropClick = () => {
  if (props.closeOnBackdrop && !props.persistent) {
    close()
  }
}

const onKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && props.closeOnEscape && !props.persistent) {
    close()
  }
}

// Lifecycle events
const onBeforeEnter = () => {
  document.body.style.overflow = 'hidden'
  saveFocus()
}

const onAfterEnter = async () => {
  await nextTick()

  if (modalRef.value) {
    // Configurer le piège de focus
    cleanupFocusTrap.value = trapFocusInContainer(modalRef.value) || null

    // Annoncer l'ouverture
    const modalTitle = props.title || props.ariaLabel || 'Dialog opened'
    announce(`${modalTitle}. Use Tab to navigate and Escape to close.`)
  }

  emit('opened')
}

const onBeforeLeave = () => {
  // Nettoyer le piège de focus
  if (cleanupFocusTrap.value) {
    cleanupFocusTrap.value()
    cleanupFocusTrap.value = null
  }
}

const onAfterLeave = () => {
  document.body.style.overflow = ''
  restoreFocusToSaved()
  announce('Dialog closed')
  emit('closed')
}

// Watch pour réagir aux changements de props
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    // Empêcher le scroll du body quand le modal est ouvert
    document.body.classList.add('modal-open')
  } else {
    document.body.classList.remove('modal-open')
  }
})

// Cleanup
onUnmounted(() => {
  document.body.style.overflow = ''
  document.body.classList.remove('modal-open')

  if (cleanupFocusTrap.value) {
    cleanupFocusTrap.value()
  }
})
</script>

<style scoped>
/* Transitions pour le backdrop */
.modal-backdrop-enter-active,
.modal-backdrop-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.modal-backdrop-enter-from,
.modal-backdrop-leave-to {
  opacity: 0;
}

/* Transitions pour le contenu */
.modal-content-enter-active,
.modal-content-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.modal-content-enter-from {
  opacity: 0;
  transform: scale(0.95) translateY(-20px);
}

.modal-content-leave-to {
  opacity: 0;
  transform: scale(1.05) translateY(20px);
}

/* Skip link styles */
.skip-link {
  position: absolute;
  top: -40px;
  left: 6px;
  background: var(--primary-600);
  color: white;
  padding: 8px;
  text-decoration: none;
  border-radius: 4px;
  z-index: 100;
}

.skip-link:focus {
  top: 6px;
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .modal-content-enter-from,
  .modal-content-leave-to {
    transform: scale(0.9) translateY(50px);
  }
}

/* Accessibility pour reduced motion */
@media (prefers-reduced-motion: reduce) {
  .modal-backdrop-enter-active,
  .modal-backdrop-leave-active,
  .modal-content-enter-active,
  .modal-content-leave-active {
    transition: none !important;
  }

  .modal-content-enter-from,
  .modal-content-leave-to {
    transform: none !important;
  }
}
</style>

<style>
/* Style global pour empêcher le scroll quand modal ouvert */
body.modal-open {
  overflow: hidden;
  padding-right: var(--scrollbar-width, 0px);
}
</style>
