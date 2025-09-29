import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import ProductReserveView from '@/views/ProductReserveView2025.vue'

const routerPushMock = vi.hoisted(() => vi.fn())
const routerGoMock = vi.hoisted(() => vi.fn())
const apiGetProductMock = vi.hoisted(() => vi.fn())
const createReservationMock = vi.hoisted(() => vi.fn())
const walletFetchMock = vi.hoisted(() => vi.fn())

const notifySuccessMock = vi.hoisted(() => vi.fn())
const notifyErrorMock = vi.hoisted(() => vi.fn())
const notifyInfoMock = vi.hoisted(() => vi.fn())

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { id: '1' }, query: {} }),
  useRouter: () => ({ push: routerPushMock, go: routerGoMock })
}))

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({
    isAuthenticated: true,
    isConsumer: true,
    user: {
      id: 1,
      email: 'user@example.com',
      phone: '+22890123456'
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
    recordPayment: vi.fn(),
    startPolling: vi.fn(),
    clearPayment: vi.fn()
  })
}))

vi.mock('@/stores/wallet', () => ({
  useWalletStore: () => ({
    hasWallet: false,
    isActive: false,
    hasPin: false,
    formattedBalance: '0 F CFA',
    canPay: vi.fn(),
    fetchWallet: walletFetchMock
  })
}))

vi.mock('@/composables/useNotifications', () => ({
  notify: {
    success: notifySuccessMock,
    error: notifyErrorMock,
    info: notifyInfoMock
  }
}))

vi.mock('@/services/api', () => ({
  apiService: {
    getProduct: apiGetProductMock
  }
}))

const resolveProduct = () => ({
  data: {
    id: 1,
    name: 'Produit test',
    description: 'Produit sans date d\'expiration',
    original_price: 2000,
    discounted_price: 1500,
    discount_percentage: 25,
    expiration_date: null,
    quantity_available: 5,
    reserved_quantity: 0,
    image_url: null,
    merchant: {
      business_name: 'Commerçant test',
      address: 'Rue principale',
      city: 'Lomé',
      phone: '+22890000000'
    }
  }
})

describe('ProductReserveView2025 - missing expiration date', () => {
  const mountView = async () => {
    const wrapper = mount(ProductReserveView, {
      global: {
        stubs: {
          RouterLink: { template: '<a><slot /></a>' }
        }
      }
    })

    await flushPromises()
    return wrapper
  }

  beforeEach(() => {
    apiGetProductMock.mockReset()
    apiGetProductMock.mockResolvedValue(resolveProduct())

    createReservationMock.mockReset()
    createReservationMock.mockResolvedValue({
      success: true,
      data: {},
      payment: null
    })

    walletFetchMock.mockReset()
    walletFetchMock.mockResolvedValue(undefined)

    routerPushMock.mockReset()
    routerGoMock.mockReset()

    notifySuccessMock.mockReset()
    notifyErrorMock.mockReset()
    notifyInfoMock.mockReset()
  })

  it('affiche un message de secours lorsque la date d\'expiration est manquante', async () => {
    const wrapper = await mountView()

    expect(wrapper.text()).toContain('Date non renseignée')

    expect(wrapper.vm.getMaxPickupDate()).toBe('')
  })

  it('permet de finaliser la réservation malgré une date d\'expiration manquante', async () => {
    const wrapper = await mountView()

    wrapper.vm.reservation.pickup_date = '2025-01-02'
    wrapper.vm.reservation.pickup_time = '10:00'
    wrapper.vm.acceptConditions = true

    await wrapper.vm.confirmReservation()

    expect(createReservationMock).toHaveBeenCalledWith(
      expect.objectContaining({
        productId: 1,
        pickupDate: '2025-01-02',
        pickupTime: '10:00'
      })
    )
    expect(routerPushMock).toHaveBeenCalled()
  })
})

afterAll(() => {
  vi.resetModules()
})
