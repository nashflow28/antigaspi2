import { ref, computed } from 'vue'

export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title?: string
  message: string
  autoClose?: boolean
  duration?: number
  progress?: number
  timer?: NodeJS.Timeout
  actionLabel?: string
  onAction?: () => void
  onClose?: () => void
}

const notifications = ref<Notification[]>([])
const notificationIdCounter = ref(0)

export const useNotifications = () => {
  const addNotification = (notification: Omit<Notification, 'id' | 'progress' | 'timer'>) => {
    const id = `notification-${++notificationIdCounter.value}`
    const autoClose = notification.autoClose !== false
    const duration = notification.duration || 5000

    const newNotification: Notification = {
      ...notification,
      id,
      autoClose,
      duration,
      progress: 100
    }

    notifications.value.push(newNotification)

    if (autoClose) {
      let progress = 100
      const interval = 50
      const step = (interval / duration) * 100

      const timer = setInterval(() => {
        progress -= step
        const notif = notifications.value.find(n => n.id === id)
        if (notif) {
          notif.progress = Math.max(0, progress)
        }

        if (progress <= 0) {
          clearInterval(timer)
          removeNotification(id)
        }
      }, interval)

      newNotification.timer = timer
    }

    return id
  }

  const removeNotification = (id: string) => {
    const index = notifications.value.findIndex(n => n.id === id)
    if (index > -1) {
      const notification = notifications.value[index]
      if (notification.timer) {
        clearInterval(notification.timer)
      }
      notification.onClose?.()
      notifications.value.splice(index, 1)
    }
  }

  const handleAction = (id: string) => {
    const notification = notifications.value.find(n => n.id === id)
    if (!notification) return

    notification.onAction?.()
    removeNotification(id)
  }

  const clearAll = () => {
    notifications.value.forEach(notification => {
      if (notification.timer) {
        clearInterval(notification.timer)
      }
      notification.onClose?.()
    })
    notifications.value = []
  }

  // Helper methods for common notification types
  const success = (message: string, title?: string, options?: Partial<Notification>) => {
    return addNotification({ type: 'success', message, title, ...options })
  }

  const error = (message: string, title?: string, options?: Partial<Notification>) => {
    return addNotification({
      type: 'error',
      message,
      title,
      autoClose: false, // Errors don't auto-close by default
      ...options
    })
  }

  const warning = (message: string, title?: string, options?: Partial<Notification>) => {
    return addNotification({ type: 'warning', message, title, ...options })
  }

  const info = (message: string, title?: string, options?: Partial<Notification>) => {
    return addNotification({ type: 'info', message, title, ...options })
  }

  return {
    notifications: computed(() => notifications.value),
    addNotification,
    removeNotification,
    handleAction,
    clearAll,
    success,
    error,
    warning,
    info
  }
}

// Global notification instance
export const notify = useNotifications()