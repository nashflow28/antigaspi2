import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useProductsStore } from '@/stores/products'

// Mock API
vi.mock('@/services/api', () => ({
  apiService: {
    getProducts: vi.fn(),
    getProductById: vi.fn(),
    createProduct: vi.fn(),
    updateProduct: vi.fn(),
    deleteProduct: vi.fn()
  }
}))

// Mock notifications
vi.mock('@/composables/useNotifications', () => ({
  notify: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn()
  }
}))

describe('Products Store', () => {
  let productsStore: ReturnType<typeof useProductsStore>

  const mockProduct = {
    id: 1,
    name: 'Pain artisanal',
    description: 'Pain fait maison',
    price: 250,
    originalPrice: 500,
    quantity: 10,
    imageUrl: '/images/pain.jpg',
    categoryId: 1,
    merchantId: 1,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  }

  beforeEach(() => {
    setActivePinia(createPinia())
    productsStore = useProductsStore()
    vi.clearAllMocks()
  })

  describe('Initial State', () => {
    it('should initialize with empty products array', () => {
      expect(productsStore.products).toEqual([])
      expect(productsStore.loading).toBe(false)
      expect(productsStore.selectedProduct).toBeNull()
    })

    it('should have required methods', () => {
      expect(typeof productsStore.fetchProducts).toBe('function')
      expect(typeof productsStore.fetchProductById).toBe('function')
      expect(typeof productsStore.addProduct).toBe('function')
    })
  })

  describe('Products Loading', () => {
    it('should fetch products successfully', async () => {
      const mockProducts = [mockProduct, { ...mockProduct, id: 2, name: 'Croissant' }]

      const { apiService } = await import('@/services/api')
      vi.mocked(apiService.getProducts).mockResolvedValue({
        data: mockProducts,
        success: true
      })

      await productsStore.fetchProducts()

      expect(productsStore.products).toEqual(mockProducts)
      expect(productsStore.loading).toBe(false)
    })

    it('should handle fetch products error', async () => {
      const { apiService } = await import('@/services/api')
      vi.mocked(apiService.getProducts).mockRejectedValue(new Error('Network error'))

      await productsStore.fetchProducts()

      expect(productsStore.products).toEqual([])
      expect(productsStore.loading).toBe(false)
    })

    it('should set loading state during fetch', async () => {
      let resolvePromise: () => void
      const apiPromise = new Promise(resolve => {
        resolvePromise = resolve
      })

      const { apiService } = await import('@/services/api')
      vi.mocked(apiService.getProducts).mockReturnValue(apiPromise as any)

      const fetchPromise = productsStore.fetchProducts()

      expect(productsStore.loading).toBe(true)

      resolvePromise!({ data: [], success: true })
      await fetchPromise

      expect(productsStore.loading).toBe(false)
    })
  })

  describe('Product Management', () => {
    it('should fetch single product by ID', async () => {
      const { apiService } = await import('@/services/api')
      vi.mocked(apiService.getProductById).mockResolvedValue({
        data: mockProduct,
        success: true
      })

      await productsStore.fetchProductById(1)

      expect(productsStore.selectedProduct).toEqual(mockProduct)
    })

    it('should handle product creation', async () => {
      const newProduct = { ...mockProduct, id: undefined }

      const { apiService } = await import('@/services/api')
      vi.mocked(apiService.createProduct).mockResolvedValue({
        data: mockProduct,
        success: true
      })

      const result = await productsStore.addProduct(newProduct)

      expect(result.success).toBe(true)
      expect(productsStore.products).toContain(mockProduct)
    })
  })

  describe('Product Filtering', () => {
    beforeEach(() => {
      productsStore.products = [
        mockProduct,
        { ...mockProduct, id: 2, categoryId: 2, price: 300 },
        { ...mockProduct, id: 3, categoryId: 1, price: 400 }
      ]
    })

    it('should filter products by category', () => {
      const filtered = productsStore.getProductsByCategory(1)
      expect(filtered).toHaveLength(2)
      expect(filtered.every(p => p.categoryId === 1)).toBe(true)
    })

    it('should filter products by price range', () => {
      const filtered = productsStore.getProductsByPriceRange(200, 350)
      expect(filtered).toHaveLength(2) // Products with price 250 and 300
      expect(filtered.every(p => p.price >= 200 && p.price <= 350)).toBe(true)
    })

    it('should search products by name', () => {
      const searchResults = productsStore.searchProducts('Pain')
      expect(searchResults).toHaveLength(3) // All products contain 'Pain' in name
    })
  })
})
