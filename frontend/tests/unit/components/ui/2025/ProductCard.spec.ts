import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import ProductCard from '@/components/ui/2025/ProductCard.vue'

vi.mock('lucide-vue-next', () => ({
  Loader2: {
    name: 'Loader2',
    template: '<div class="mock-loader" />'
  },
  X: {
    name: 'X',
    template: '<div class="mock-x" />'
  }
}))

describe('ProductCard 2025', () => {
  const baseProps = {
    image: 'https://example.com/image.jpg',
    name: 'Panier découverte',
    merchant: 'Maison Bio',
    price: '2 500 F CFA',
    quantity: '3 restants',
    tags: ['Local', 'Bio'],
    stockBadges: [{ label: 'Stock limité', variant: 'warning' }]
  }

  it('renders product information without promotion', () => {
    const wrapper = mount(ProductCard, {
      props: baseProps
    })

    const card = wrapper.get('[data-testid="product-card-2025"]')
    expect(card.attributes('data-promo')).toBe('false')
    expect(wrapper.text()).toContain(baseProps.name)
    expect(wrapper.text()).toContain(baseProps.merchant)
    expect(wrapper.text()).toContain(baseProps.price)

    expect(wrapper.findAll('[data-testid="product-card-tag"]').length).toBe(baseProps.tags.length)
    expect(wrapper.findAll('[data-testid="product-card-stock-badge"]').length).toBe(baseProps.stockBadges.length)
    expect(wrapper.find('[data-testid="product-card-discount"]').exists()).toBe(false)
  })

  it('renders promotion badge and emits reserve event', async () => {
    const wrapper = mount(ProductCard, {
      props: {
        ...baseProps,
        discount: '-40%',
        reserveLoading: false
      }
    })

    const card = wrapper.get('[data-testid="product-card-2025"]')
    expect(card.attributes('data-promo')).toBe('true')

    const discountBadge = wrapper.get('[data-testid="product-card-discount"]')
    expect(discountBadge.text()).toBe('-40%')

    await wrapper.get('button').trigger('click')
    expect(wrapper.emitted('reserve')).toBeTruthy()
  })
})
