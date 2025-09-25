import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia, type Pinia } from 'pinia'
import { defineComponent, nextTick } from 'vue'

import NotificationContainer from '@/components/ui/NotificationContainer.vue'
import NotificationSystem from '@/components/ui/NotificationSystem.vue'
import Toast from '@/components/ui/Toast.vue'
import { useReservationsStore } from '@/stores/reservations'
import { useNotifications } from '@/composables/useNotifications'

const createLocalStorageMock = () => {
  let store: Record<string, string> = {}

  return {
    getItem: vi.fn(key => (key in store ? store[key] : null)),
    setItem: vi.fn((key, value) => {
      store[key] = value
    }),
    removeItem: vi.fn(key => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      store = {}
    })
  }
}

beforeAll(() => {
  Object.defineProperty(window, 'localStorage', {
    value: createLocalStorageMock(),
    writable: true
  })
})

describe('Notifications integration', () => {
  let pinia: Pinia

  const mountNotifications = () => {
    const TestHost = defineComponent({
      components: { NotificationContainer, NotificationSystem },
      template: `
        <div>
          <NotificationContainer />
          <NotificationSystem />
        </div>
      `
    })

    return mount(TestHost, {
      global: {
        plugins: [pinia],
        stubs: {
          teleport: true,
          transition: false,
          'transition-group': false
        }
      }
    })
  }

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)

    const { clearAll } = useNotifications()
    clearAll()
  })

  it('relays reservations store errors into the global notification stack and clears on close', async () => {
    const reservationsStore = useReservationsStore()

    reservationsStore.error = 'Réservation impossible' as any

    const clearReservationsSpy = vi.spyOn(reservationsStore, 'clearError')

    const wrapper = mountNotifications()

    await nextTick()
    await nextTick()

    const toasts = wrapper.findAllComponents(Toast)
    expect(toasts).toHaveLength(1)
    expect(wrapper.html()).toContain('Réservations')
    expect(wrapper.html()).toContain('Réservation impossible')

    const closeButton = toasts[0].find('button[aria-label="Fermer la notification"]')
    expect(closeButton.exists()).toBe(true)
    await closeButton.trigger('click')

    await nextTick()

    expect(clearReservationsSpy).toHaveBeenCalledTimes(1)
  })

  it('deduplicates notifications for the same store and updates the message', async () => {
    const reservationsStore = useReservationsStore()

    reservationsStore.error = 'Erreur initiale' as any

    const wrapper = mountNotifications()

    await nextTick()

    let reservationToast = wrapper.findAllComponents(Toast).find(toast => toast.text().includes('Erreur initiale'))
    expect(reservationToast).toBeDefined()

    reservationsStore.error = 'Nouvelle erreur critique' as any

    await nextTick()
    await nextTick()

    const allToasts = wrapper.findAllComponents(Toast).filter(toast => toast.text().includes('Réservations'))
    expect(allToasts).toHaveLength(1)
    reservationToast = allToasts[0]
    expect(reservationToast?.text()).toContain('Nouvelle erreur critique')
  })
})
