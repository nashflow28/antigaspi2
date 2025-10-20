import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

vi.mock('@/composables/useNotifications', () => {
  const success = vi.fn().mockReturnValue('success-notification')
  const error = vi.fn().mockReturnValue('error-notification')
  const info = vi.fn().mockReturnValue('info-notification')

  return {
    notify: {
      success,
      error,
      info
    }
  }
})

import { nextTick } from 'vue'
import { useCartStore } from '@/stores/cart'
import type { CartItem } from '@/stores/cart'

const notifyMock = () => import('@/composables/useNotifications').then(module => module.notify)

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
  const createStorageStub = () => {
    const store = new Map<string, string>()
    return {
      get length() {
        return store.size
      },
      clear: () => {
        store.clear()
      },
      getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
      key: (index: number) => Array.from(store.keys())[index] ?? null,
      removeItem: (key: string) => {
        store.delete(key)
      },
      setItem: (key: string, value: string) => {
        store.set(key, String(value))
      }
    }
  }

  beforeEach(() => {
    setActivePinia(createPinia())
    const stub = createStorageStub()
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: stub
    })
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: stub
    })
  })

  afterEach(async () => {
    await notifyMock()
    vi.clearAllMocks()
    window.localStorage.clear()

    const originalSetItem = Storage.prototype.setItem
    if (localStorage.setItem !== originalSetItem) {
      localStorage.setItem = originalSetItem
    }
  })

  it('exposes empty state and derived helpers by default', () => {
    const cartStore = useCartStore()

    expect(cartStore.items).toEqual([])
    expect(cartStore.totalQuantity).toBe(0)
    expect(cartStore.totalPrice).toBe(0)
    expect(cartStore.totalSavings).toBe(0)
    expect(cartStore.isEmpty).toBe(true)
  })

  it('hydrates from storage, adds products, computes totals and persists to storage', async () => {
    const storedItem: CartItem = {
      id: 42,
      name: 'Soupe du jour',
      price: 300,
      originalPrice: 550,
      quantity: 2,
      imageUrl: null,
      merchantId: null,
      merchantName: null
    }

    window.localStorage.setItem('antigaspi_cart_items', JSON.stringify([storedItem]))

    const cartStore = useCartStore()
    const item = buildCartItem()

    cartStore.addItem(item)
    cartStore.addItem({ ...item, merchantId: 99 })

    expect(cartStore.items).toHaveLength(3)
    expect(cartStore.totalQuantity).toBe(4)
    expect(cartStore.totalPrice).toBe(1100)
    expect(cartStore.totalSavings).toBe(1000)
    expect(cartStore.isEmpty).toBe(false)

    await nextTick()
    const rehydratedItems = JSON.parse(window.localStorage.getItem('antigaspi_cart_items') ?? '[]')
    expect(rehydratedItems).toHaveLength(3)
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

  it('handles invalid payloads and emits notifications', async () => {
    const cartStore = useCartStore()
    const notify = await notifyMock()

    const invalid = cartStore.addItem({ id: 0, name: '', price: 0 } as any)
    expect(invalid.success).toBe(false)
    expect(notify.error).toHaveBeenCalledWith(
      'Article invalide',
      'Panier',
      expect.objectContaining({ action: expect.objectContaining({ label: 'Réessayer' }) })
    )
    const retryInvalid = notify.error.mock.calls.at(-1)?.[2]?.action?.callback
    await retryInvalid?.()

    const missing = cartStore.removeItem(999)
    expect(missing.success).toBe(false)
    expect(notify.error).toHaveBeenCalledWith(
      'Article introuvable dans le panier',
      'Panier',
      expect.objectContaining({ action: expect.objectContaining({ label: 'Réessayer' }) })
    )
    const retryMissing = notify.error.mock.calls.at(-1)?.[2]?.action?.callback
    await retryMissing?.()

    const item = buildCartItem()
    cartStore.addItem({ ...item, silent: true })
    const updated = cartStore.updateQuantity(item.id, 0)
    expect(updated.success).toBe(true)
    expect(notify.info).toHaveBeenCalledWith('Article retiré du panier', 'Panier', expect.any(Object))
  })

  it('recovers from storage persistence errors and exposes pending operations', async () => {
    const cartStore = useCartStore()
    const notify = await notifyMock()

    const originalSetItem = window.localStorage.setItem
    window.localStorage.setItem = vi.fn(() => {
      throw new Error('quota')
    }) as typeof window.localStorage.setItem

    cartStore.addItem({ ...buildCartItem(), silent: true })
    await nextTick()

    expect(notify.error).toHaveBeenCalledWith(
      "Impossible d'enregistrer le panier localement",
      'Panier',
      expect.objectContaining({ action: expect.objectContaining({ label: 'Réessayer' }) })
    )
    const retryPersist = notify.error.mock.calls.at(-1)?.[2]?.action?.callback
    expect(cartStore.pendingOperation).toBe('persist')
    await retryPersist?.()
    expect(cartStore.pendingOperation).toBeNull()

    window.localStorage.setItem = originalSetItem
    cartStore.clearCart({ silent: true })
    await nextTick()
    await nextTick()
    expect(cartStore.pendingOperation).toBe(null)
  })

  it('normalizes product payloads through addProduct helper', async () => {
    const cartStore = useCartStore()

    const product = {
      id: 7,
      name: 'Panier dégustation',
      discounted_price: '12.5',
      original_price: '20.00',
      merchant: { id: 8, business_name: 'Maison Verte' }
    }

    const result = cartStore.addProduct(product as any, 2)
    expect(result.success).toBe(true)
    expect(cartStore.items[0]).toMatchObject({
      id: 7,
      quantity: 2,
      price: 12.5,
      originalPrice: 20,
      merchantId: 8
    })
  })

  it('handles corrupted storage payload during hydration', async () => {
    window.localStorage.setItem('antigaspi_cart_items', '{invalid json')
    const notify = await notifyMock()
    const cartStore = useCartStore()

    expect(cartStore.items).toEqual([])
    expect(cartStore.isHydrated).toBe(true)
    expect(notify.error).toHaveBeenCalledWith(
      'Impossible de charger le panier sauvegardé',
      'Panier',
      expect.objectContaining({ action: expect.objectContaining({ label: 'Réessayer' }) })
    )
    const retryHydrate = notify.error.mock.calls.at(-1)?.[2]?.action?.callback
    await retryHydrate?.()
  })
})
