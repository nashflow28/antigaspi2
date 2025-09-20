import { defineStore } from 'pinia'
import { computed, reactive, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import {
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  subscribeToPush,
  updateNotificationPreferences,
  type ServerNotification
} from '@/services/notificationService'

export interface ToastNotification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  duration?: number
  show?: boolean
}

interface PaginationState {
  currentPage: number
  lastPage: number
  perPage: number
  total: number
}

interface ChannelPreferences {
  email: boolean
  sms: boolean
  push: boolean
}

export const useNotificationStore = defineStore('notification', () => {
  const toasts = ref<ToastNotification[]>([])
  const serverNotifications = ref<ServerNotification[]>([])
  const pagination = reactive<PaginationState>({
    currentPage: 1,
    lastPage: 1,
    perPage: 20,
    total: 0
  })
  const loading = ref(false)
  const preferences = reactive<ChannelPreferences>({
    email: true,
    sms: false,
    push: false
  })

  const unreadCount = computed(() => serverNotifications.value.filter(n => !n.is_read).length)

  const authStore = useAuthStore()

  const setToast = (
    type: ToastNotification['type'],
    title: string,
    message: string,
    duration = 5000
  ) => {
    const id = Date.now().toString()
    const notification: ToastNotification = {
      id,
      type,
      title,
      message,
      duration,
      show: true
    }

    toasts.value.push(notification)

    if (duration > 0) {
      setTimeout(() => removeToast(id), duration)
    }

    return id
  }

  const removeToast = (id: string) => {
    const index = toasts.value.findIndex(n => n.id === id)
    if (index > -1) {
      toasts.value.splice(index, 1)
    }
  }

  const clearToasts = () => {
    toasts.value = []
  }

  const hydratePreferencesFromUser = () => {
    if (!authStore.user) return

    preferences.email = !!authStore.user.prefers_email_notifications
    preferences.sms = !!authStore.user.prefers_sms_notifications
    preferences.push = !!authStore.user.prefers_push_notifications
  }

  const loadNotifications = async (options: { unread?: boolean; page?: number } = {}) => {
    loading.value = true
    try {
      const response = await fetchNotifications({
        unread: options.unread,
        page: options.page,
        perPage: pagination.perPage
      })

      serverNotifications.value = response.data
      pagination.currentPage = response.meta.current_page
      pagination.lastPage = response.meta.last_page
      pagination.perPage = response.meta.per_page
      pagination.total = response.meta.total
    } finally {
      loading.value = false
    }
  }

  const markAsRead = async (id: number) => {
    const notification = serverNotifications.value.find(item => item.id === id)
    if (!notification || notification.is_read) return

    await markNotificationAsRead(id)
    notification.is_read = true
  }

  const markAllAsRead = async () => {
    if (!unreadCount.value) return
    await markAllNotificationsAsRead()
    serverNotifications.value = serverNotifications.value.map(notification => ({
      ...notification,
      is_read: true
    }))
  }

  const savePreferences = async (updated: ChannelPreferences) => {
    const response = await updateNotificationPreferences({
      email: updated.email,
      sms: updated.sms,
      push: updated.push
    })

    preferences.email = response.data.prefers_email_notifications
    preferences.sms = response.data.prefers_sms_notifications
    preferences.push = response.data.prefers_push_notifications

    if (authStore.user) {
      authStore.user.prefers_email_notifications = preferences.email
      authStore.user.prefers_sms_notifications = preferences.sms
      authStore.user.prefers_push_notifications = preferences.push
      localStorage.setItem('user', JSON.stringify(authStore.user))
    }

    return { ...preferences }
  }

  const ensurePushSubscription = async () => {
    if (!preferences.push) {
      return null
    }

    try {
      return await subscribeToPush()
    } catch (error) {
      console.warn('Failed to subscribe to push notifications', error)
      return null
    }
  }

  return {
    // state
    toasts,
    serverNotifications,
    pagination,
    loading,
    preferences,
    unreadCount,

    // toast helpers
    show: setToast,
    remove: removeToast,
    clear: clearToasts,

    // server helpers
    hydratePreferencesFromUser,
    loadNotifications,
    markAsRead,
    markAllAsRead,
    savePreferences,
    ensurePushSubscription
  }
})
