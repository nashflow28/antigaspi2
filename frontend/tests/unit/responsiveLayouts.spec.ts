import { mount } from '@vue/test-utils'
import { nextTick, ref } from 'vue'
import MainHomeView from '@/views/MainHomeView.vue'
import ProductsView from '@/views/ProductsView2025.vue'
import ReservationsView from '@/views/ReservationsView.vue'

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: vi.fn()
  })
}))

vi.mock('@/stores/cart', () => ({
  useCartStore: () => ({
    hydrateFromStorage: vi.fn(),
    itemsCount: 0
  })
}))

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({
    isAuthenticated: true,
    user: { phone: '0000000000', email: 'test@example.com' }
  })
}))

const reservationsMock = ref<any[]>([])
const loadingMock = ref(false)

vi.mock('@/stores/reservations', () => ({
  useReservationsStore: () => ({
    reservations: reservationsMock,
    loading: loadingMock,
    fetchReservations: vi.fn(async () => ({ success: true })),
    cancelReservation: vi.fn(async () => ({ success: true })),
    createReservation: vi.fn(async () => ({ success: true, data: null }))
  })
}))

vi.mock('@/stores/payments', () => ({
  usePaymentsStore: () => ({
    recordPayment: vi.fn()
  })
}))

vi.mock('@/components/ui/ProductCard.vue', () => ({
  default: {
    name: 'ProductCard',
    props: [
      'image',
      'name',
      'merchant',
      'price',
      'originalPrice',
      'discount',
      'quantity',
      'tags',
      'reserveLoading',
      'reserveDisabled',
      'onReserve'
    ],
    template: '<div class="product-card">Product</div>'
  }
}))

vi.mock('@/components/reservation/ReservationCard.vue', () => ({
  default: {
    name: 'ReservationCard',
    props: ['reservation', 'viewMode'],
    template: '<div class="reservation-card">Reservation</div>'
  }
}))

const globalStubs = {
  Button: {
    name: 'Button',
    props: ['variant', 'size', 'loading', 'leftIcon', 'rightIcon'],
    template: '<button><slot /></button>'
  },
  Card: {
    name: 'Card',
    props: ['variant', 'hover', 'padding'],
    template: '<div><slot /><slot name="header" /><slot name="footer" /></div>'
  },
  Skeleton: {
    name: 'Skeleton',
    props: ['rounded'],
    template: '<div class="skeleton" />'
  },
  EmptyState: {
    name: 'EmptyState',
    props: ['title', 'description', 'actionLabel', 'icon'],
    template: '<div class="empty"><slot /></div>'
  },
  Toast: {
    name: 'Toast',
    props: ['isOpen', 'tone', 'title', 'description', 'actionLabel', 'position'],
    template: '<div v-if="isOpen" class="toast" />'
  },
  ConfirmModal: {
    name: 'ConfirmModal',
    props: ['isOpen'],
    template: '<div v-if="isOpen" class="confirm-modal" />'
  }
}

describe('Responsive view layouts', () => {
  beforeEach(() => {
    reservationsMock.value = []
    loadingMock.value = false
    global.fetch = vi.fn(async () => ({
      ok: true,
      json: async () => ({ success: true, data: [] })
    })) as any
  })

  it('applies responsive product grid on MainHomeView', async () => {
    const wrapper = mount(MainHomeView, { global: { stubs: globalStubs } })
    wrapper.vm.loading = false
    wrapper.vm.displayProducts = [
      { id: 1, name: 'Produit test', merchant: 'Marchand', price: 10, originalPrice: 12, discount: 20, emoji: '🥖' }
    ]
    await nextTick()
    const grid = wrapper.find('[data-test="main-home-products"]')
    expect(grid.exists()).toBe(true)
    expect(grid.classes()).toEqual(expect.arrayContaining(['grid-cols-1', 'md:grid-cols-3', 'xl:grid-cols-4']))
  })

  it('applies responsive catalogue grid on ProductsView', async () => {
    const wrapper = mount(ProductsView, { global: { stubs: globalStubs } })
    wrapper.vm.loading = false
    wrapper.vm.products = [
      {
        id: 1,
        name: 'Produit test',
        description: 'Description',
        original_price: 10,
        discounted_price: 8,
        discount: 20,
        merchant: { name: 'Marchand', address: 'Adresse', distance: 1 },
        expires_at: new Date(),
        available_quantity: 5,
        reserved_quantity: 0,
        category: 'bakery',
        image_url: ''
      }
    ]
    await nextTick()
    const grid = wrapper.find('[data-test="products-grid"]')
    expect(grid.exists()).toBe(true)
    expect(grid.classes()).toEqual(expect.arrayContaining(['grid-cols-1', 'md:grid-cols-3', 'xl:grid-cols-4']))
  })

  it('applies responsive grid mode on ReservationsView', async () => {
    const wrapper = mount(ReservationsView, { global: { stubs: globalStubs } })
    loadingMock.value = false
    reservationsMock.value = [
      {
        id: 1,
        status: 'pending',
        created_at: new Date().toISOString(),
        pickup_date: new Date().toISOString(),
        quantity: 1,
        original_price: 10,
        discounted_price: 8,
        product: { merchant: { phone: null } }
      }
    ]
    wrapper.vm.viewMode = 'grid'
    await nextTick()
    const grid = wrapper.find('[data-test="reservations-grid"]')
    expect(grid.exists()).toBe(true)
    expect(grid.classes()).toEqual(expect.arrayContaining(['grid-cols-1', 'md:grid-cols-3', 'xl:grid-cols-4']))
  })
})
