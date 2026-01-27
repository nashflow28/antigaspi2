import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCartStore } from '@/stores/cart'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      store = {}
    })
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

// Mock notifications
vi.mock('@/composables/useNotifications', () => ({
  notify: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn()
  }
}))

describe('Cart Store', () => {
  let cartStore: ReturnType<typeof useCartStore>

  const mockCartItem = {
    id: 1,
    name: 'Pain artisanal',
    price: 250,
    originalPrice: 500,
    quantity: 2,
    imageUrl: '/images/pain.jpg',
    merchantId: 1,
    merchantName: 'Boulangerie Martin'
  }

  beforeEach(() => {
    // Clear localStorage BEFORE creating Pinia and store
    // so hydration starts with empty cart
    localStorageMock.clear()
    vi.clearAllMocks()
    setActivePinia(createPinia())
    cartStore = useCartStore()
  })

  describe('Initial State', () => {
    it('should initialize with empty cart', () => {
      expect(cartStore.items).toEqual([])
      expect(cartStore.itemsCount).toBe(0)
      expect(cartStore.totalAmount).toBe(0)
    })

    it('should have correct store methods', () => {
      expect(typeof cartStore.addItem).toBe('function')
      expect(typeof cartStore.removeItem).toBe('function')
      expect(typeof cartStore.clearCart).toBe('function')
    })
  })

  describe('Computed Properties', () => {
    beforeEach(() => {
      // Use addItem action instead of direct assignment
      cartStore.addItem(mockCartItem)
      cartStore.addItem({ ...mockCartItem, id: 2, quantity: 1, price: 150 })
    })

    it('should calculate total quantity correctly', () => {
      expect(cartStore.itemsCount).toBe(3) // 2 + 1
    })

    it('should calculate total price correctly', () => {
      expect(cartStore.totalAmount).toBe(650) // (250 * 2) + (150 * 1)
    })
  })

  describe('Cart Actions', () => {
    it('should add item to cart', () => {
      cartStore.addItem(mockCartItem)

      expect(cartStore.items).toHaveLength(1)
      expect(cartStore.items[0]).toMatchObject({
        id: mockCartItem.id,
        name: mockCartItem.name,
        price: mockCartItem.price,
        quantity: mockCartItem.quantity
      })
    })

    it('should handle cart operations', () => {
      cartStore.addItem(mockCartItem)
      expect(cartStore.items).toHaveLength(1)

      cartStore.removeItem(mockCartItem.id)
      expect(cartStore.items).toHaveLength(0)
    })
  })
})
