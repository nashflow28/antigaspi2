import { reactive } from 'vue'

export interface Toast {
  id: string
  title?: string
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
  duration?: number
  persistent?: boolean
  actions?: Array<{
    label: string
    action: () => void
  }>
}

export interface ToastOptions {
  title?: string
  duration?: number
  persistent?: boolean
  actions?: Array<{
    label: string
    action: () => void
  }>
}

const toasts = reactive<Toast[]>([])

let toastId = 0

export function useToast() {
  const generateId = () => `toast-${++toastId}`

  const addToast = (toast: Omit<Toast, 'id'>) => {
    const id = generateId()
    const newToast: Toast = {
      id,
      duration: 5000,
      ...toast
    }

    toasts.push(newToast)

    if (!newToast.persistent && newToast.duration) {
      setTimeout(() => {
        removeToast(id)
      }, newToast.duration)
    }

    return id
  }

  const removeToast = (id: string) => {
    const index = toasts.findIndex(toast => toast.id === id)
    if (index > -1) {
      toasts.splice(index, 1)
    }
  }

  const clearToasts = () => {
    toasts.splice(0, toasts.length)
  }

  const success = (message: string, options?: ToastOptions) => {
    return addToast({
      message,
      type: 'success',
      ...options
    })
  }

  const error = (message: string, options?: ToastOptions) => {
    return addToast({
      message,
      type: 'error',
      persistent: true,
      ...options
    })
  }

  const warning = (message: string, options?: ToastOptions) => {
    return addToast({
      message,
      type: 'warning',
      duration: 7000,
      ...options
    })
  }

  const info = (message: string, options?: ToastOptions) => {
    return addToast({
      message,
      type: 'info',
      ...options
    })
  }

  return {
    toasts,
    addToast,
    removeToast,
    clearToasts,
    success,
    error,
    warning,
    info
  }
}
