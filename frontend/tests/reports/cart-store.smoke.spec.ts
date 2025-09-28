import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCartStore } from '@/stores/cart'

const buildCartItem = () => ({
  id: 1,
  name: 'Baguette Tradition',
  price: 250,
  originalPrice: 500,
  quantity: 1,
  imageUrl: '/images/baguette.jpg',
  merchantId: 12,
  merchantName: 'Boulangerie du Centre'
})

describe('Cart store smoke tests', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('exposes empty state and derived helpers by default', () => {
    const cartStore = useCartStore()

    expect(cartStore.items).toEqual([])
    expect(cartStore.totalQuantity).toBe(0)
    expect(cartStore.totalPrice).toBe(0)
    expect(cartStore.totalSavings).toBe(0)
    expect(cartStore.isEmpty).toBe(true)
  })

  it('adds products, computes totals and persists to storage', () => {
    const cartStore = useCartStore()
    const item = buildCartItem()

    cartStore.addItem(item)
    cartStore.addItem({ ...item, merchantId: 99 })

    expect(cartStore.items).toHaveLength(2)
    expect(cartStore.totalQuantity).toBe(2)
    expect(cartStore.totalPrice).toBe(500)
    expect(cartStore.totalSavings).toBe(500)
    expect(cartStore.isEmpty).toBe(false)
  })

  it('updates quantity and clears cart correctly', () => {
    const cartStore = useCartStore()
    const item = buildCartItem()

    cartStore.addItem(item)
    cartStore.updateQuantity(item.id, 3)

    expect(cartStore.totalQuantity).toBe(3)
    expect(cartStore.totalPrice).toBe(750)

    cartStore.clearCart()

    expect(cartStore.items).toEqual([])
    expect(cartStore.isEmpty).toBe(true)
  })
})
