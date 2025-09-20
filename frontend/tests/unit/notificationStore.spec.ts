import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useNotificationStore } from '@/stores/notification'
import { useAuthStore } from '@/stores/auth'

vi.mock('@/services/notificationService', () => ({
  fetchNotifications: vi.fn().mockResolvedValue({
    success: true,
    data: [
      { id: 1, user_id: 1, type: 'reservation_status', title: 'Test', message: 'Message', is_read: false },
      { id: 2, user_id: 1, type: 'reservation_status', title: 'Test 2', message: 'Message 2', is_read: true }
    ],
    meta: {
      current_page: 1,
      last_page: 1,
      per_page: 20,
      total: 2
    }
  }),
  markNotificationAsRead: vi.fn().mockResolvedValue({ success: true }),
  markAllNotificationsAsRead: vi.fn().mockResolvedValue({ success: true }),
  subscribeToPush: vi.fn().mockResolvedValue({ endpoint: 'https://example.com' }),
  updateNotificationPreferences: vi.fn().mockResolvedValue({
    success: true,
    data: {
      prefers_email_notifications: false,
      prefers_sms_notifications: true,
      prefers_push_notifications: true
    }
  })
}))

const notificationService = await import('@/services/notificationService')

describe('notification store', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setActivePinia(createPinia())
    localStorage.clear()

    const authStore = useAuthStore()
    authStore.user = {
      id: 1,
      first_name: 'Jane',
      last_name: 'Doe',
      email: 'jane@example.com',
      role: 'consumer',
      city: 'Paris',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      prefers_email_notifications: true,
      prefers_sms_notifications: false,
      prefers_push_notifications: false
    } as any
  })

  it('loads notifications and computes unread count', async () => {
    const store = useNotificationStore()

    await store.loadNotifications()

    expect(store.serverNotifications).toHaveLength(2)
    expect(store.unreadCount).toBe(1)
    expect(store.pagination.total).toBe(2)
  })

  it('marks notifications as read', async () => {
    const store = useNotificationStore()
    await store.loadNotifications()

    await store.markAsRead(1)

    expect(notificationService.markNotificationAsRead).toHaveBeenCalledWith(1)
    expect(store.serverNotifications.find(n => n.id === 1)?.is_read).toBe(true)
  })

  it('saves channel preferences and syncs auth store', async () => {
    const store = useNotificationStore()
    const authStore = useAuthStore()

    store.hydratePreferencesFromUser()

    const saved = await store.savePreferences({ email: false, sms: true, push: true })

    expect(notificationService.updateNotificationPreferences).toHaveBeenCalledWith({
      email: false,
      sms: true,
      push: true
    })
    expect(saved.email).toBe(false)
    expect(authStore.user?.prefers_sms_notifications).toBe(true)
    expect(authStore.user?.prefers_push_notifications).toBe(true)
  })

  it('subscribes to push notifications when enabled', async () => {
    const store = useNotificationStore()
    store.preferences.push = true

    await store.ensurePushSubscription()

    expect(notificationService.subscribeToPush).toHaveBeenCalled()
  })
})
