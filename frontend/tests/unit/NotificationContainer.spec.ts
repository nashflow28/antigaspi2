import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia, type Pinia } from 'pinia'
import { nextTick } from 'vue'

import NotificationContainer from '@/components/ui/NotificationContainer.vue'
import { useNotifications } from '@/composables/useNotifications'
import { useReservationsStore } from '@/stores/reservations'

describe('NotificationContainer', () => {
  let pinia: Pinia

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    const { clearAll } = useNotifications()
    clearAll()
  })

  it('renders a toast when the reservations store reports an error', async () => {
    const reservationsStore = useReservationsStore()

    reservationsStore.error = 'Réservation impossible' as any

    mount(NotificationContainer, {
      global: {
        plugins: [pinia],
        stubs: {
          teleport: true,
          transition: false,
          'transition-group': false
        }
      }
    })

    await nextTick()

    const { notifications } = useNotifications()

    expect(notifications.value).toHaveLength(1)
    expect(notifications.value[0]?.title).toBe('Réservations')
    expect(notifications.value[0]?.message).toBe('Réservation impossible')
  })

  it('clears the corresponding store error when toast is dismissed', async () => {
    vi.useFakeTimers()

    const reservationsStore = useReservationsStore()
    reservationsStore.error = 'Réservation impossible' as any

    const clearSpy = vi.spyOn(reservationsStore, 'clearError')

    mount(NotificationContainer, {
      global: {
        plugins: [pinia],
        stubs: {
          teleport: true,
          transition: false,
          'transition-group': false
        }
      }
    })

    await nextTick()

    const { notifications, removeNotification } = useNotifications()
    expect(notifications.value).toHaveLength(1)

    const [notification] = notifications.value
    removeNotification(notification.id)

    await nextTick()

    expect(clearSpy).toHaveBeenCalledTimes(1)
    expect(notifications.value).toHaveLength(0)

    vi.runOnlyPendingTimers()
    vi.useRealTimers()
  })
})

