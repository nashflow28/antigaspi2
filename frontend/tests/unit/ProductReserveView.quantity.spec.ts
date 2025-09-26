import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import ProductReserveView from '@/views/ProductReserveView2025.vue'

const routerPushMock = vi.hoisted(() => vi.fn())
const routerGoMock = vi.hoisted(() => vi.fn())
const apiGetProductMock = vi.hoisted(() => vi.fn())
const walletFetchMock = vi.hoisted(() => vi.fn())

const notifySuccessMock = vi.hoisted(() => vi.fn())
const notifyErrorMock = vi.hoisted(() => vi.fn())
const notifyInfoMock = vi.hoisted(() => vi.fn())

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { id: '1' } }),
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
    createReservation: vi.fn()
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
    hasWallet: true,
    isActive: true,
    hasPin: true,
    formattedBalance: '10\u00a0000 F CFA',
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
    description: 'Délicieux produit',
    original_price: 2000,
    discounted_price: 1500,
    discount_percentage: 25,
    expiration_date: new Date(Date.now() + 3600_000).toISOString(),
    quantity_available: 10,
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

describe('ProductReserveView2025 - quantity input', () => {
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

    walletFetchMock.mockReset()
    walletFetchMock.mockResolvedValue(undefined)

    routerPushMock.mockReset()
    routerGoMock.mockReset()

    notifySuccessMock.mockReset()
    notifyErrorMock.mockReset()
    notifyInfoMock.mockReset()
  })

  it('keeps manual quantity entry stable when typing a number', async () => {
    const wrapper = await mountView()

    const quantityInput = wrapper.find('input[type="number"]')
    expect(quantityInput.exists()).toBe(true)

    await quantityInput.setValue('3')
    await flushPromises()

    expect(wrapper.vm.reservation.quantity).toBe(3)
    expect(quantityInput.element.value).toBe('3')
  })
})

afterAll(() => {
  vi.resetModules()
})
