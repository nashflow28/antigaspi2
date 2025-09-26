import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import ProductsView from '@/views/ProductsView2025.vue'

const routerPushMock = vi.hoisted(() => vi.fn())
const createReservationMock = vi.hoisted(() => vi.fn())
const recordPaymentMock = vi.hoisted(() => vi.fn())
const notifySuccessMock = vi.hoisted(() => vi.fn())
const notifyErrorMock = vi.hoisted(() => vi.fn())
const notifyInfoMock = vi.hoisted(() => vi.fn())
const notifyWarningMock = vi.hoisted(() => vi.fn())
const fetchMock = vi.hoisted(() => vi.fn())

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: routerPushMock })
}))

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({
    isAuthenticated: true,
    user: {
      email: 'user@example.com',
      phone: '+22890000000'
    }
  })
}))

vi.mock('@/stores/reservations', () => ({
  useReservationsStore: () => ({
    createReservation: createReservationMock
  })
}))

vi.mock('@/stores/payments', () => ({
  usePaymentsStore: () => ({
    recordPayment: recordPaymentMock
  })
}))

vi.mock('@/composables/useNotifications', () => ({
  notify: {
    success: notifySuccessMock,
    error: notifyErrorMock,
    info: notifyInfoMock,
    warning: notifyWarningMock
  }
}))

const buildProductPayload = () => ({
  id: 42,
  name: 'Panier gourmand',
  description: 'Sélection anti-gaspi de produits frais',
  original_price: '3000',
  discounted_price: '1500',
  discount_percentage: 50,
  category: { name: 'Boulangerie' },
  merchant: {
    business_name: 'Boulangerie du Coin',
    address: 'Marché de Lomé',
    city: 'Lomé',
    distance_km: 1.2
  },
  expiration_date: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
  quantity_available: 6,
  image_url: null
})

const buildPaymentPayload = () => ({
  id: 7,
  reservation_id: 99,
  amount: 1500,
  currency: 'XOF',
  payment_method: 'paystack',
  status: 'pending',
  provider: 'paystack',
  checkout_url: null,
  customer_phone: '+22890000000',
  customer_email: 'user@example.com',
  reference: 'ref-123',
  transaction_id: null,
  payload: null,
  paid_at: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
})

describe('ProductsView - quick reserve CTA', () => {
  const mountView = async () => {
    const wrapper = mount(ProductsView, {
      global: {
        stubs: {
          Transition: false
        }
      }
    })

    await flushPromises()
    return wrapper
  }

  beforeEach(() => {
    routerPushMock.mockReset()
    recordPaymentMock.mockReset()
    notifySuccessMock.mockReset()
    notifyErrorMock.mockReset()
    notifyInfoMock.mockReset()
    notifyWarningMock.mockReset()

    createReservationMock.mockReset()
    createReservationMock.mockResolvedValue({
      success: true,
      data: { id: 99 },
      payment: buildPaymentPayload()
    })

    fetchMock.mockReset()
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: [buildProductPayload()] })
    } as any)

    global.fetch = fetchMock as unknown as typeof fetch

    Object.defineProperty(window, 'open', {
      writable: true,
      value: vi.fn()
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('launches a quick reservation and notifies the user on success', async () => {
    const wrapper = await mountView()

    const reserveButton = wrapper
      .findAll('button')
      .find(button => button.text().includes('Réserver'))

    expect(reserveButton).toBeTruthy()

    await reserveButton!.trigger('click')
    await flushPromises()

    expect(createReservationMock).toHaveBeenCalledWith(
      expect.objectContaining({
        productId: 42,
        quantity: 1,
        paymentMethod: 'paystack'
      })
    )
    expect(recordPaymentMock).toHaveBeenCalledWith(expect.objectContaining({ id: 7 }))
    expect(notifySuccessMock).toHaveBeenCalledWith(
      expect.stringContaining('Réservation rapide'),
      'Paiement rapide'
    )
    expect(notifyErrorMock).not.toHaveBeenCalled()
    expect(routerPushMock).not.toHaveBeenCalled()
  })
})

afterAll(() => {
  vi.resetModules()
})
