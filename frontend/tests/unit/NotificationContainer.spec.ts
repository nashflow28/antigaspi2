import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia, storeToRefs } from 'pinia'
import { nextTick } from 'vue'
import NotificationContainer from '@/components/ui/NotificationContainer.vue'
import { useAuthStore } from '@/stores/auth'
import { useProductsStore } from '@/stores/products'
import { useReservationsStore } from '@/stores/reservations'

const notifyErrorMock = vi.fn()
const removeNotificationMock = vi.fn()

vi.mock('@/composables/useNotifications', () => ({
  useNotifications: () => ({
    notifications: { value: [] },
    notify: {
      success: vi.fn(),
      info: vi.fn(),
      warning: vi.fn(),
      error: notifyErrorMock
    },
    removeNotification: removeNotificationMock,
    clearNotifications: vi.fn()
  })
}))

describe('NotificationContainer', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    setActivePinia(createPinia())
    notifyErrorMock.mockReset()
    removeNotificationMock.mockReset()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('publishes notifications for each store error', async () => {
    notifyErrorMock.mockReturnValueOnce(1)
    notifyErrorMock.mockReturnValueOnce(2)
    notifyErrorMock.mockReturnValueOnce(3)

    mount(NotificationContainer)

    const authStore = useAuthStore()
    const productsStore = useProductsStore()
    const reservationsStore = useReservationsStore()

    authStore.setError('Erreur auth')
    productsStore.setError('Erreur produits')
    reservationsStore.setError('Erreur réservation')

    await nextTick()

    expect(notifyErrorMock).toHaveBeenNthCalledWith(1, expect.objectContaining({
      message: 'Erreur auth'
    }))
    expect(notifyErrorMock).toHaveBeenNthCalledWith(2, expect.objectContaining({
      message: 'Erreur produits'
    }))
    expect(notifyErrorMock).toHaveBeenNthCalledWith(3, expect.objectContaining({
      message: 'Erreur réservation'
    }))
  })

  it('removes the notification when a store error is cleared', async () => {
    notifyErrorMock.mockReturnValueOnce(42)

    mount(NotificationContainer)

    const authStore = useAuthStore()

    authStore.setError('Erreur auth')
    await nextTick()

    authStore.clearError()
    await nextTick()

    expect(removeNotificationMock).toHaveBeenCalledWith(42)
  })

  it('clears the store error when the notification is dismissed manually', async () => {
    notifyErrorMock.mockReturnValueOnce(7)

    mount(NotificationContainer)

    const authStore = useAuthStore()
    const { error } = storeToRefs(authStore)

    authStore.setError('Erreur auth')
    await nextTick()

    const onClose = notifyErrorMock.mock.calls[0]?.[0]?.onClose
    expect(typeof onClose).toBe('function')

    onClose?.()

    expect(error.value).toBeNull()
  })
})
