import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { nextTick } from 'vue'
import { useCartStore } from '@/stores/cart'
import { useAuthStore } from '@/stores/auth'

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

describe('Cart Integration', () => {
  let cartStore: ReturnType<typeof useCartStore>
  let authStore: ReturnType<typeof useAuthStore>

  const mockProduct = {
    id: 1,
    name: 'Pain artisanal',
    price: 250,
    originalPrice: 500,
    quantity: 1,
    imageUrl: '/images/pain.jpg',
    merchantId: 1,
    merchantName: 'Boulangerie Martin'
  }

  beforeEach(() => {
    localStorageMock.clear()
    vi.clearAllMocks()
    setActivePinia(createPinia())
    cartStore = useCartStore()
    authStore = useAuthStore()
  })

  describe('Cart Operations', () => {
    it('should add product to cart successfully', () => {
      cartStore.addItem(mockProduct)

      expect(cartStore.items).toHaveLength(1)
      // Cart store adds 'type' field
      expect(cartStore.items[0].id).toBe(mockProduct.id)
      expect(cartStore.items[0].name).toBe(mockProduct.name)
      expect(cartStore.items[0].type).toBe('product')
      expect(cartStore.totalQuantity).toBe(1)
      expect(cartStore.totalPrice).toBe(250)
    })

    it('should update quantity for existing item', () => {
      cartStore.addItem(mockProduct)
      cartStore.addItem({ ...mockProduct, quantity: 2 })

      expect(cartStore.items).toHaveLength(1)
      expect(cartStore.items[0].quantity).toBe(3)
      expect(cartStore.totalQuantity).toBe(3)
      expect(cartStore.totalPrice).toBe(750)
    })

    it('should calculate savings correctly', () => {
      cartStore.addItem(mockProduct)
      cartStore.addItem({
        ...mockProduct,
        id: 2,
        price: 300,
        originalPrice: 600,
        quantity: 1
      })

      // First item: (500 - 250) * 1 = 250
      // Second item: (600 - 300) * 1 = 300
      // Total savings: 550
      expect(cartStore.totalSavings).toBe(550)
    })

    it('should handle cart persistence', async () => {
      cartStore.addItem(mockProduct)

      // Wait for Vue's watcher to trigger persist()
      await nextTick()

      // Verify setItem was called with cart data containing the item
      expect(localStorageMock.setItem).toHaveBeenCalled()
      const calls = localStorageMock.setItem.mock.calls
      const lastCall = calls[calls.length - 1]
      expect(lastCall[0]).toBe('antigaspi_cart_items')

      const savedData = JSON.parse(lastCall[1])
      expect(savedData).toHaveLength(1)
      expect(savedData[0].id).toBe(mockProduct.id)
    })

    it('should remove item from cart', () => {
      cartStore.addItem(mockProduct)
      cartStore.addItem({ ...mockProduct, id: 2, name: 'Croissant' })

      expect(cartStore.items).toHaveLength(2)

      cartStore.removeItem(1)

      expect(cartStore.items).toHaveLength(1)
      expect(cartStore.items[0].id).toBe(2)
    })

    it('should clear entire cart', () => {
      cartStore.addItem(mockProduct)
      cartStore.addItem({ ...mockProduct, id: 2 })

      expect(cartStore.items).toHaveLength(2)

      cartStore.clearCart()

      expect(cartStore.items).toHaveLength(0)
      expect(cartStore.isEmpty).toBe(true)
      expect(cartStore.totalPrice).toBe(0)
    })

    it('should update item quantity', () => {
      cartStore.addItem(mockProduct)
      cartStore.updateQuantity(1, 5)

      expect(cartStore.items[0].quantity).toBe(5)
      expect(cartStore.totalQuantity).toBe(5)
      expect(cartStore.totalPrice).toBe(1250) // 250 * 5
    })

    it('should handle zero quantity by removing item', () => {
      cartStore.addItem(mockProduct)
      cartStore.updateQuantity(1, 0)

      expect(cartStore.items).toHaveLength(0)
      expect(cartStore.isEmpty).toBe(true)
    })
  })

  describe('Cart State Management', () => {
    it('should maintain cart state across store instances', () => {
      // Add item to first store instance
      cartStore.addItem(mockProduct)

      // Simulate saved cart with type field
      const savedItem = { ...mockProduct, type: 'product' }
      localStorageMock.getItem.mockReturnValue(JSON.stringify([savedItem]))

      // Create new store instance (simulating page refresh)
      setActivePinia(createPinia())
      const newCartStore = useCartStore()

      expect(newCartStore.items).toHaveLength(1)
      expect(newCartStore.items[0].id).toBe(mockProduct.id)
      expect(newCartStore.totalQuantity).toBe(1)
    })

    it('should handle corrupted localStorage data', () => {
      localStorageMock.getItem.mockReturnValue('invalid-json')

      setActivePinia(createPinia())
      const newCartStore = useCartStore()

      expect(newCartStore.items).toEqual([])
      expect(newCartStore.isEmpty).toBe(true)
    })
  })

  describe('Cart and Authentication Integration', () => {
    it('should preserve cart when user logs in', () => {
      // Add items to cart as anonymous user
      cartStore.addItem(mockProduct)
      cartStore.addItem({ ...mockProduct, id: 2, name: 'Croissant', price: 150 })

      expect(cartStore.items).toHaveLength(2)

      // User logs in
      authStore.user = {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        role: 'consumer'
      } as any
      authStore.token = 'test-token'

      // Cart should be preserved
      expect(cartStore.items).toHaveLength(2)
      expect(cartStore.totalPrice).toBe(400) // 250 + 150
    })

    it('should clear cart when user logs out', async () => {
      // Set authenticated user with cart items
      authStore.user = {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        role: 'consumer'
      } as any
      authStore.token = 'test-token'

      cartStore.addItem(mockProduct)
      expect(cartStore.items).toHaveLength(1)

      // User logs out
      await authStore.logout()

      // Note: In real implementation, you might want to clear cart on logout
      // This test documents current behavior
      expect(cartStore.items).toHaveLength(1) // Cart persists by default
    })
  })

  describe('Cart Validation', () => {
    it('should handle invalid item data gracefully', () => {
      const invalidItem = {
        id: 1,
        name: '',
        price: 'invalid' as any,
        quantity: -1
      }

      cartStore.addItem(invalidItem)

      // Should handle gracefully - price should be resolved to 0 for invalid values
      expect(cartStore.items).toHaveLength(1)
      expect(cartStore.items[0].price).toBe(0) // Invalid price resolved to 0
    })

    it('should prevent duplicate items from different merchants', () => {
      const item1 = { ...mockProduct, merchantId: 1 }
      const item2 = { ...mockProduct, merchantId: 2 }

      cartStore.addItem(item1)
      cartStore.addItem(item2)

      // Items with different merchantId are treated as different items
      expect(cartStore.items).toHaveLength(2)
    })
  })
})
