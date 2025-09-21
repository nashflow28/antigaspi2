import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { ref } from 'vue'
import SurpriseBasketsView from '@/views/consumer/SurpriseBasketsView.vue'
import SurpriseBasketDetailView from '@/views/consumer/SurpriseBasketDetailView.vue'
import type { SurpriseBasket } from '@/services/surpriseBasketService'

const baskets = ref<SurpriseBasket[]>([])
const paginationState = ref({ currentPage: 1, lastPage: 1, perPage: 12, total: 0 })
const loadingState = ref(false)
const currentBasket = ref<SurpriseBasket | null>(null)
const loadSurpriseBasketsMock = vi.fn(async () => {
  paginationState.value.total = baskets.value.length
})
const loadBasketMock = vi.fn(async (id: number) => {
  const basket = baskets.value.find(item => item.id === id) ?? null
  currentBasket.value = basket
  return basket
})

vi.mock('@/composables/useSurpriseBaskets', () => ({
  useSurpriseBaskets: () => ({
    surpriseBaskets: baskets,
    pagination: paginationState,
    loading: loadingState,
    currentBasket,
    loadSurpriseBaskets: loadSurpriseBasketsMock,
    loadBasket: loadBasketMock,
    getBasketById: (id: number) => baskets.value.find(item => item.id === id) ?? null
  })
}))

vi.mock('@/stores/reservations', () => ({
  useReservationsStore: () => ({
    createReservation: vi.fn(async () => ({ success: true }))
  })
}))

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({
    isAuthenticated: true,
    isConsumer: true,
    user: { first_name: 'Test', last_name: 'User', role: 'consumer' }
  })
}))

vi.mock('@/composables/useNotifications', () => ({
  notify: {
    success: vi.fn(),
    error: vi.fn()
  }
}))

vi.mock('@/stores/payments', () => ({
  usePaymentsStore: () => ({
    recordPayment: vi.fn(),
    startPolling: vi.fn(),
    clearPayment: vi.fn()
  }),
  isFinalStatus: () => false
}))

const createBasket = (overrides: Partial<SurpriseBasket> = {}): SurpriseBasket => ({
  id: 1,
  merchant_id: 5,
  category_id: 3,
  name: 'Panier Soleil',
  description: 'Produits du jour',
  surprise_description: 'Sélection surprise',
  original_price: 10000,
  discounted_price: 5000,
  quantity_available: 2,
  min_items: 1,
  max_items: 3,
  total_original_value: 12000,
  expiration_date: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
  image_url: undefined,
  is_active: true,
  is_surprise_basket: true,
  basket_items_count: 3,
  basket_total_value: 12000,
  basket_savings: 7000,
  basket_discount_percentage: 50,
  merchant: {
    id: 77,
    business_name: 'Maison Soleil',
    description: '',
    address: '',
    phone: '',
    email: ''
  },
  category: { id: 3, name: 'Traiteur', description: '' },
  surprise_basket_items: [],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides
})

beforeEach(() => {
  baskets.value = [
    createBasket({ id: 1 }),
    createBasket({ id: 2, name: 'Panier Fraîcheur', merchant: { id: 78, business_name: 'Fraîcheur & Co', description: '', address: '', phone: '', email: '' } })
  ]
  paginationState.value = { currentPage: 1, lastPage: 1, perPage: 12, total: baskets.value.length }
  currentBasket.value = null
  loadingState.value = false
  loadSurpriseBasketsMock.mockClear()
  loadBasketMock.mockClear()
})

describe('routing paniers surprise', () => {
  it('affiche la liste puis le détail d\'un panier via le router', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/surprise-baskets', name: 'surprise-baskets', component: SurpriseBasketsView },
        { path: '/surprise-baskets/:id/reserve', name: 'surprise-basket-reserve', component: SurpriseBasketDetailView }
      ]
    })

    const wrapper = mount({ template: '<router-view />' }, {
      global: {
        plugins: [router]
      }
    })

    await router.push('/surprise-baskets')
    await router.isReady()
    await flushPromises()
    expect(loadSurpriseBasketsMock).toHaveBeenCalled()
    expect(wrapper.html()).toContain('Paniers surprise disponibles')
    expect(wrapper.html()).toContain('Panier Soleil')

    await wrapper.get('[data-testid="surprise-basket-view"]').trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.name).toBe('surprise-basket-reserve')
    expect(wrapper.html()).toContain('Panier Soleil')
    expect(wrapper.html()).toContain('Réserver (paiement sur place)')
  })
})
