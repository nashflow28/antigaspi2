<template>
  <Transition name="toast-slide">
    <div
      v-if="isOpen"
      :class="rootClasses"
      role="status"
      aria-live="assertive"
      :data-testid="`notification-${tone}`"
    >
      <div :class="toastClasses">
        <span aria-hidden="true" class="mt-1">
          <svg
            v-if="tone === 'success'"
            class="h-4 w-4 text-primary-500"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.707a1 1 0 10-1.414-1.414L9 10.172 7.707 8.879a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clip-rule="evenodd"
            />
          </svg>
          <svg
            v-else-if="tone === 'info'"
            class="h-4 w-4 text-primary-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M13 16h-1v-4h-1m1-4h.01M12 6a9 9 0 110 18 9 9 0 010-18z"
            />
          </svg>
          <svg
            v-else-if="tone === 'warning'"
            class="h-4 w-4 text-orange-500"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fill-rule="evenodd"
              d="M8.257 3.099c.765-1.36 2.72-1.36 3.485 0l6.518 11.598c.75 1.335-.213 2.999-1.742 2.999H3.48c-1.53 0-2.492-1.664-1.742-2.999L8.257 3.1zM11 14a1 1 0 10-2 0 1 1 0 002 0zm-1-2a1 1 0 01-1-1V8a1 1 0 112 0v3a1 1 0 01-1 1z"
              clip-rule="evenodd"
            />
          </svg>
          <svg
            v-else
            class="h-4 w-4 text-red-600"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3-9a1 1 0 00-1-1H8a1 1 0 100 2h4a1 1 0 001-1zm-4 4a1 1 0 112 0 1 1 0 01-2 0z"
              clip-rule="evenodd"
            />
          </svg>
        </span>
        <div class="flex-1 space-y-4">
          <p v-if="title" class="text-sm font-semibold text-neutral-800 dark:text-neutral-100">
            {{ title }}
          </p>
          <p v-if="description" class="text-xs text-neutral-500 dark:text-neutral-500">
            {{ description }}
          </p>
          <Button
            v-if="actionLabel"
            variant="ghost"
            size="sm"
            data-testid="notification-action-btn"
            class="px-0 text-primary-600 dark:text-primary-200"
            @click="handleAction"
          >
            {{ actionLabel }}
          </Button>
        </div>
        <button
          type="button"
          class="rounded p-2 text-neutral-400 transition hover:text-neutral-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
          aria-label="Fermer la notification"
          @click="handleClose"
        >
          <svg
            class="h-4 w-4"
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
        </button>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed, toRefs } from 'vue'
import { Button } from './2025'

type ToastTone = 'success' | 'info' | 'warning' | 'error';
type ToastPosition = 'global' | 'stacked';

const props = withDefaults(
  defineProps<{
    isOpen: boolean;
    tone?: ToastTone;
    title?: string;
    description?: string;
    actionLabel?: string;
    onAction?: () => void;
    onClose?: () => void;
    position?: ToastPosition;
  }>(),
  {
    tone: 'success',
    position: 'global'
  }
)

const emit = defineEmits<{
  (event: 'close'): void;
  (event: 'action'): void;
}>()

const toneClasses: Record<ToastTone, string> = {
  success: 'border-primary-500',
  info: 'border-primary-500',
  warning: 'border-orange-500',
  error: 'border-red-600'
}

const { isOpen, tone, title, description, actionLabel, position } = toRefs(props)

const toastClasses = computed(() => [
  'flex w-full items-start gap-3 rounded border-l-4 bg-white p-4 shadow-md dark:bg-neutral-900',
  toneClasses[tone.value]
])

const positionClasses: Record<ToastPosition, string> = {
  global: 'pointer-events-auto fixed inset-x-4 bottom-6 z-50 flex justify-center sm:inset-x-auto sm:right-6 sm:w-[360px]',
  stacked: 'pointer-events-auto z-50 w-full'
}

const rootClasses = computed(() => [
  positionClasses[position.value],
  'bg-white dark:bg-neutral-900 rounded shadow-md'
])

const handleClose = () => {
  props.onClose?.()
  emit('close')
}

const handleAction = () => {
  props.onAction?.()
  emit('action')
}

</script>

<style scoped>
.toast-slide-enter-active,
.toast-slide-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.toast-slide-enter-from {
  opacity: 0;
  transform: translateY(40px);
}

.toast-slide-enter-to,
.toast-slide-leave-from {
  opacity: 1;
  transform: translateY(0);
}

.toast-slide-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
</style>
