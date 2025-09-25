import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import ReservationDetailView from '@/views/ReservationDetailView.vue'
import Card from '@/components/ui/2025/Card.vue'
import Button from '@/components/ui/2025/Button.vue'
import Badge from '@/components/ui/2025/Badge.vue'

const getReservationMock = vi.hoisted(() => vi.fn())

vi.mock('vue-router', () => ({
  useRoute: () => ({
    params: { id: '42' }
  })
}))

vi.mock('@/stores/reservations', () => ({
  useReservationsStore: () => ({
    cancelReservation: vi.fn().mockResolvedValue({ success: true })
  })
}))

const notifyMock = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn()
}))

vi.mock('@/composables/useNotifications', () => ({
  notify: notifyMock
}))

vi.mock('@/services/api', () => ({
  apiService: {
    getReservation: getReservationMock
  }
}))

describe('ReservationDetailView (Design System 2025)', () => {
  beforeEach(() => {
    const now = new Date().toISOString()

    getReservationMock.mockResolvedValue({
      success: true,
      data: {
        id: 42,
        status: 'confirmed',
        reservation_code: 'ANT-042',
        quantity: 2,
        product: {
          id: 99,
          name: 'Panier surprise bio',
          description: 'Un assortiment de produits frais.',
          image_url: null,
          original_price: 6000,
          discounted_price: 3500,
          merchant: {
            id: 7,
            name: 'Marché du Centre',
            address: '12 avenue des Épices, Lomé',
            phone: '+22890000000'
          }
        },
        original_price: 6000,
        discounted_price: 3500,
        total_amount: 7000,
        pickup_date: now,
        pickup_notes: 'Présentez le code QR à l\'arrivée.'
      }
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders the reservation detail using 2025 UI primitives', async () => {
    const wrapper = mount(ReservationDetailView, {
      global: {
        stubs: {
          Transition: false
        }
      }
    })

    await flushPromises()

    expect(wrapper.findComponent(Card).exists()).toBe(true)
    expect(wrapper.findComponent(Button).exists()).toBe(true)
    expect(wrapper.findComponent(Badge).exists()).toBe(true)

    expect(wrapper.find('.container-2025').exists()).toBe(true)
    expect(wrapper.find('.card').exists()).toBe(false)
    expect(wrapper.find('.btn').exists()).toBe(false)
    expect(wrapper.html()).not.toContain('glass-bg')
    expect(wrapper.html()).not.toContain('glass-border')

    expect(getReservationMock).toHaveBeenCalledWith(42)
    expect(wrapper.text()).toContain('Panier surprise bio')
    expect(wrapper.text()).toContain('ANT-042')
  })
})
