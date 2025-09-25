import { beforeAll, beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia, type Pinia } from 'pinia'
import { defineComponent, nextTick } from 'vue'

import NotificationContainer from '@/components/ui/NotificationContainer.vue'
import NotificationSystem from '@/components/ui/NotificationSystem.vue'
import Toast from '@/components/ui/Toast.vue'
import { useReservationsStore } from '@/stores/reservations'
import { useNotifications } from '@/composables/useNotifications'
import { apiService } from '@/services/api'

const baseReservation = {
  id: 1,
  reservation_code: 'ABC123',
  quantity: 1,
  original_price: 10,
  discounted_price: 5,
  status: 'pending' as const,
  product: {
    id: 1,
    name: 'Produit test'
  },
  latest_payment: null
}

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

  afterEach(() => {
    vi.restoreAllMocks()
    const { clearAll } = useNotifications()
    clearAll()
  })

  it('renders an error toast for reservation failures and retries via the action button', async () => {
    const getReservationsSpy = vi
      .spyOn(apiService, 'getReservations')
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({ data: [baseReservation] })

    const wrapper = mountNotifications()
    const reservationsStore = useReservationsStore()

    await reservationsStore.fetchReservations()
    await nextTick()
    await nextTick()

    let toasts = wrapper.findAllComponents(Toast)
    expect(toasts).toHaveLength(1)
    expect(wrapper.html()).toContain('Réservations')
    expect(wrapper.html()).toContain('Network error')

    const retryButton = toasts[0]
      .findAll('button')
      .find(button => button.text().includes('Réessayer'))

    expect(retryButton).toBeDefined()
    await retryButton!.trigger('click')

    await nextTick()
    await nextTick()

    expect(getReservationsSpy).toHaveBeenCalledTimes(2)
    toasts = wrapper.findAllComponents(Toast)
    expect(toasts).toHaveLength(0)
  })

  it('shows a success toast when a reservation is created', async () => {
    vi.spyOn(apiService, 'createReservation').mockResolvedValue({
      data: baseReservation,
      payment: null
    })

    const wrapper = mountNotifications()
    const reservationsStore = useReservationsStore()

    await reservationsStore.createReservation({ productId: 1, quantity: 1, paymentMethod: 'card' })
    await nextTick()
    await nextTick()

    const toasts = wrapper.findAllComponents(Toast)
    expect(toasts.length).toBeGreaterThan(0)

    const successToast = toasts.find(toast => toast.text().includes('Réservation créée avec succès'))
    expect(successToast).toBeDefined()
    expect(successToast?.text()).toContain('Réservations')

    const closeButton = successToast?.find('button[aria-label="Fermer la notification"]')
    expect(closeButton?.exists()).toBe(true)
    await closeButton?.trigger('click')

    await nextTick()

    expect(wrapper.findAllComponents(Toast)).toHaveLength(0)
  })
})
