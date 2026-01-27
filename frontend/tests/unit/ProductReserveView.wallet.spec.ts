import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import ProductReserveView from '@/views/ProductReserveView2025.vue'

const createReservationMock = vi.hoisted(() => vi.fn())
const routerPushMock = vi.hoisted(() => vi.fn())
const walletCanPayMock = vi.hoisted(() => vi.fn())
const walletFetchMock = vi.hoisted(() => vi.fn())
const apiGetProductMock = vi.hoisted(() => vi.fn())

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { id: '1' }, query: { quantity: '1' } }),
  useRouter: () => ({ push: routerPushMock, go: vi.fn() })
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

vi.mock('@/stores/wallet', () => ({
  useWalletStore: () => ({
    hasWallet: true,
    isActive: true,
    hasPin: true,
    formattedBalance: '10\u00a0000 F CFA',
    canPay: walletCanPayMock,
    fetchWallet: walletFetchMock
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

const notifySuccessMock = vi.hoisted(() => vi.fn())
const notifyErrorMock = vi.hoisted(() => vi.fn())
const notifyInfoMock = vi.hoisted(() => vi.fn())

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
    description: 'Délicieux produit',
    original_price: 2000,
    discounted_price: 1500,
    discount_percentage: 25,
    expiration_date: new Date(Date.now() + 3600_000).toISOString(),
    quantity_available: 5,
    image_url: null,
    merchant: {
      business_name: 'Commerçant test',
      address: 'Rue principale',
      city: 'Lomé',
      phone: '+22890000000'
    }
  }
})

describe('ProductReserveView2025 - wallet reservations', () => {
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

    walletCanPayMock.mockReset()
    walletCanPayMock.mockReturnValue(true)

    walletFetchMock.mockReset()
    walletFetchMock.mockResolvedValue(undefined)

    createReservationMock.mockReset()
    createReservationMock.mockResolvedValue({
      success: true,
      data: {},
      payment: null
    })

    routerPushMock.mockReset()
    notifySuccessMock.mockReset()
    notifyErrorMock.mockReset()
    notifyInfoMock.mockReset()
  })

  it('blocks progression without a wallet PIN', async () => {
    const wrapper = await mountView()

    wrapper.vm.currentStep = 3
    wrapper.vm.paymentMethod = 'wallet'
    wrapper.vm.walletPin = ''

    expect(wrapper.vm.canProceedToNextStep).toBe(false)
  })

  it('sends the wallet PIN when confirming and clears it afterward', async () => {
    const wrapper = await mountView()

    wrapper.vm.paymentMethod = 'wallet'
    wrapper.vm.walletPin = '1234'
    wrapper.vm.acceptConditions = true

    await wrapper.vm.confirmReservation()

    expect(createReservationMock).toHaveBeenCalledWith(
      expect.objectContaining({
        walletPin: '1234',
        paymentMethod: 'wallet'
      })
    )
    expect(wrapper.vm.walletPin).toBe('')
    expect(routerPushMock).toHaveBeenCalled()
  })
})

afterAll(() => {
  vi.resetModules()
})
