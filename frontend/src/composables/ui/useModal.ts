import { ref, computed } from 'vue'

export interface UseModalOptions {
  initialValue?: boolean
}

export function useModal(options: UseModalOptions = {}) {
  const {
    initialValue = false
  } = options

  const isOpen = ref(initialValue)

  const open = () => {
    isOpen.value = true
  }

  const close = () => {
    isOpen.value = false
  }

  const toggle = () => {
    isOpen.value = !isOpen.value
  }

  return {
    isOpen: computed(() => isOpen.value),
    open,
    close,
    toggle
  }
}
