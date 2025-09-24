import { readonly, ref } from 'vue'

export type NotificationType = 'success' | 'error' | 'info' | 'warning'

export interface NotificationAction {
  label: string
  handler: () => void
  dismissOnClick?: boolean
}

export interface NotificationInput {
  title?: string
  message: string
  description?: string
  duration?: number
  closable?: boolean
  persistent?: boolean
  action?: NotificationAction
  onClose?: () => void
}

export interface Notification extends NotificationInput {
  id: number
  type: NotificationType
  duration: number
  closable: boolean
}

interface NotifyHandler {
  (payload: string | NotificationInput): number
}

interface NotifyMethods {
  success: NotifyHandler
  error: NotifyHandler
  info: NotifyHandler
  warning: NotifyHandler
}

const notifications = ref<Notification[]>([])
const timers = new Map<number, ReturnType<typeof setTimeout>>()
let idSeed = 0

const removeNotification = (id: number): boolean => {
  const index = notifications.value.findIndex(notification => notification.id === id)
  if (index === -1) {
    return false
  }

  const [notification] = notifications.value.splice(index, 1)

  const timer = timers.get(id)
  if (timer) {
    clearTimeout(timer)
    timers.delete(id)
  }

  notification.onClose?.()

  return true
}

const clearNotifications = () => {
  // Clone to prevent mutation issues when removeNotification triggers callbacks
  const currentNotifications = [...notifications.value]
  currentNotifications.forEach(notification => {
    removeNotification(notification.id)
  })
}

const createNotification = (type: NotificationType, payload: string | NotificationInput): number => {
  const normalizedPayload: NotificationInput = typeof payload === 'string'
    ? { message: payload }
    : payload

  const id = ++idSeed
  const duration = normalizedPayload.duration ?? 5000
  const persistent = normalizedPayload.persistent ?? false
  const closable = normalizedPayload.closable ?? true

  const notification: Notification = {
    id,
    type,
    title: normalizedPayload.title,
    message: normalizedPayload.message,
    description: normalizedPayload.description,
    duration,
    closable,
    action: normalizedPayload.action,
    onClose: normalizedPayload.onClose
  }

  notifications.value = [...notifications.value, notification]

  if (!persistent && duration > 0) {
    const timer = setTimeout(() => {
      removeNotification(id)
    }, duration)

    timers.set(id, timer)
  }

  return id
}

const notify: NotifyMethods = {
  success: payload => createNotification('success', payload),
  error: payload => createNotification('error', payload),
  info: payload => createNotification('info', payload),
  warning: payload => createNotification('warning', payload)
}

export const useNotifications = () => {
  return {
    notifications: readonly(notifications),
    notify,
    removeNotification,
    clearNotifications
  }
}
