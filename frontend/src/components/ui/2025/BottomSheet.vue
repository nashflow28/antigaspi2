<template>
  <Teleport to="body">
    <Transition name="bottom-sheet">
      <div
        v-if="modelValue"
        class="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
        @click="handleBackdropClick"
      >
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" />

        <!-- Sheet -->
        <div
          ref="sheetRef"
          class="relative z-10 w-full max-w-2xl rounded-t-3xl bg-white shadow-2xl transition-all sm:rounded-3xl dark:bg-neutral-900"
          :class="[
            sizeClasses,
            modelValue ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 sm:translate-y-0 sm:scale-95'
          ]"
          @click.stop
        >
          <!-- Handle (mobile only) -->
          <div class="flex justify-center py-3 sm:hidden">
            <div class="h-1.5 w-12 rounded-full bg-neutral-300 dark:bg-neutral-700" />
          </div>

          <!-- Content -->
          <div class="px-6 pb-6">
            <slot />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'

interface Props {
  modelValue: boolean
  size?: 'sm' | 'md' | 'lg' | 'xl'
  closeOnBackdrop?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  closeOnBackdrop: true
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'close': []
}>()

const sheetRef = ref<HTMLElement | null>(null)

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'max-h-[40vh] sm:max-h-[50vh]'
    case 'md':
      return 'max-h-[60vh] sm:max-h-[70vh]'
    case 'lg':
      return 'max-h-[80vh] sm:max-h-[85vh]'
    case 'xl':
      return 'max-h-[90vh] sm:max-h-[95vh]'
    default:
      return 'max-h-[60vh] sm:max-h-[70vh]'
  }
})

const handleBackdropClick = () => {
  if (props.closeOnBackdrop) {
    emit('update:modelValue', false)
    emit('close')
  }
}

const handleEscape = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && props.modelValue) {
    emit('update:modelValue', false)
    emit('close')
  }
}

watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
})

onMounted(() => {
  document.addEventListener('keydown', handleEscape)
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleEscape)
  document.body.style.overflow = ''
})
</script>

<style scoped>
.bottom-sheet-enter-active,
.bottom-sheet-leave-active {
  transition: opacity 0.3s ease;
}

.bottom-sheet-enter-active > div:last-child,
.bottom-sheet-leave-active > div:last-child {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease;
}

.bottom-sheet-enter-from,
.bottom-sheet-leave-to {
  opacity: 0;
}

.bottom-sheet-enter-from > div:last-child {
  transform: translateY(100%);
  opacity: 0;
}

.bottom-sheet-leave-to > div:last-child {
  transform: translateY(100%);
  opacity: 0;
}

@media (min-width: 640px) {
  .bottom-sheet-enter-from > div:last-child,
  .bottom-sheet-leave-to > div:last-child {
    transform: scale(0.95);
  }
}
</style>
