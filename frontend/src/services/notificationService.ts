import { api, apiEndpoints, type ApiResponse } from './apiClient'

export interface ServerNotification {
  id: number
  user_id: number
  type: string | null
  title: string
  message: string
  is_read: boolean
  sent_via?: string | null
  sent_at?: string | null
  created_at?: string | null
}

interface NotificationListResponse {
  success: boolean
  data: ServerNotification[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}

interface PreferencesResponse extends ApiResponse<{
  prefers_email_notifications: boolean
  prefers_sms_notifications: boolean
  prefers_push_notifications: boolean
}> {}

const vapidPublicKey = (import.meta.env.VITE_VAPID_PUBLIC_KEY || '') as string

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export async function fetchNotifications(options: { unread?: boolean; page?: number; perPage?: number } = {}): Promise<NotificationListResponse> {
  const params = new URLSearchParams()

  if (options.unread) params.append('unread', '1')
  if (options.page) params.append('page', options.page.toString())
  if (options.perPage) params.append('per_page', options.perPage.toString())

  const query = params.toString()
  const endpoint = query ? `${apiEndpoints.notifications}?${query}` : apiEndpoints.notifications

  return api.get<NotificationListResponse>(endpoint)
}

export function markNotificationAsRead(id: number) {
  return api.post<ApiResponse<ServerNotification>>(apiEndpoints.notificationRead(id))
}

export function markAllNotificationsAsRead() {
  return api.post<ApiResponse<null>>(apiEndpoints.notificationsReadAll)
}

export function updateNotificationPreferences(preferences: { email: boolean; sms: boolean; push: boolean }) {
  return api.patch<PreferencesResponse>(apiEndpoints.notificationPreferences, preferences)
}

export async function subscribeToPush(): Promise<PushSubscription | null> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return null
  }

  if (!vapidPublicKey) {
    console.warn('Missing VAPID public key for push subscriptions')
    return null
  }

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') {
    return null
  }

  const registration = await navigator.serviceWorker.ready
  let subscription = await registration.pushManager.getSubscription()

  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource
    })
  }

  const subscriptionData = subscription.toJSON()

  await api.post(apiEndpoints.notificationSubscriptions, {
    endpoint: subscriptionData.endpoint,
    public_key: subscriptionData.keys?.p256dh,
    auth_token: subscriptionData.keys?.auth,
    content_encoding: 'aes128gcm'
  })

  return subscription
}

export async function unsubscribeFromPush(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) {
    return false
  }

  const registration = await navigator.serviceWorker.ready
  const subscription = await registration.pushManager.getSubscription()

  if (!subscription) {
    return false
  }

  const endpoint = subscription.endpoint
  await subscription.unsubscribe()
  await api.delete(`${apiEndpoints.notificationSubscriptions}?endpoint=${encodeURIComponent(endpoint)}`)

  return true
}
