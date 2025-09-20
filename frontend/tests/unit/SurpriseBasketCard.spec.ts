import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SurpriseBasketCard from '@/components/product/SurpriseBasketCard.vue'
import type { SurpriseBasket } from '@/services/surpriseBasketService'

const createBasket = (overrides: Partial<SurpriseBasket> = {}): SurpriseBasket => ({
  id: 1,
  merchant_id: 10,
  category_id: 2,
  name: 'Panier découverte',
  description: 'Sélection gourmande',
  surprise_description: 'Un assortiment frais',
  original_price: 12000,
  discounted_price: 6000,
  quantity_available: 4,
  min_items: 1,
  max_items: 3,
  total_original_value: 12000,
  expiration_date: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
  image_url: undefined,
  is_active: true,
  is_surprise_basket: true,
  basket_items_count: 3,
  basket_total_value: 12000,
  basket_savings: 6000,
  basket_discount_percentage: 50,
  merchant: {
    id: 22,
    business_name: 'Boulangerie du jour',
    description: '',
    address: '',
    phone: '',
    email: ''
  },
  category: { id: 2, name: 'Boulangerie', description: '' },
  surprise_basket_items: [],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides
})

describe('SurpriseBasketCard', () => {
  it('affiche les informations principales du panier', () => {
    const basket = createBasket()
    const wrapper = mount(SurpriseBasketCard, {
      props: { basket }
    })

    expect(wrapper.text()).toContain('Panier découverte')
    expect(wrapper.text()).toContain('Boulangerie du jour')
    expect(wrapper.text()).toMatch(/6.?000 F CFA/)
  })

  it('émet un événement reserve lorsque le bouton est cliqué', async () => {
    const basket = createBasket({ id: 42 })
    const wrapper = mount(SurpriseBasketCard, {
      props: { basket }
    })

    await wrapper.get('[data-testid="surprise-basket-reserve"]').trigger('click')
    const reserveEvents = wrapper.emitted('reserve')
    expect(reserveEvents).toBeTruthy()
    expect(reserveEvents?.[0]).toEqual([basket])
  })
})
