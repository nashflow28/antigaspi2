import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useProductsStore } from '@/stores/products'
import { apiService } from '@/services/api'
import { notify } from '@/composables/useNotifications'

// Mock dependencies
vi.mock('@/services/api')
vi.mock('@/composables/useNotifications')

const mockedApiService = vi.mocked(apiService)
const mockedNotify = vi.mocked(notify)

describe('Products Store - Notifications & Callbacks', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('Fetch Products', () => {
    it('should show error notification with retry callback on fetch failure', async () => {
      mockedApiService.getProducts.mockRejectedValue(new Error('Network error'))

      const productsStore = useProductsStore()
      await productsStore.fetchProducts()

      expect(mockedNotify.error).toHaveBeenCalledWith(
        'Network error',
        'Catalogue',
        expect.objectContaining({
          action: expect.objectContaining({
            label: 'Réessayer',
            callback: expect.any(Function)
          })
        })
      )
    })

    it('should retry fetchProducts when error callback is executed', async () => {
      const mockFilters = { search: 'test', page: 1, per_page: 12 }

      // First call fails, second succeeds
      mockedApiService.getProducts
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          data: [{ id: 1, name: 'Test Product' }],
          pagination: { current_page: 1, last_page: 1 }
        })

      const productsStore = useProductsStore()
      await productsStore.fetchProducts(mockFilters)

      // Get retry callback
      const errorCall = mockedNotify.error.mock.calls[0]
      const retryCallback = errorCall[2]?.action?.callback

      // Execute retry
      await retryCallback()

      expect(mockedApiService.getProducts).toHaveBeenCalledTimes(2)
      expect(mockedApiService.getProducts).toHaveBeenLastCalledWith(mockFilters)
    })
  })

  describe('Create Product', () => {
    it('should show success notification on successful creation', async () => {
      const mockProduct = { name: 'New Product', price: 10 }
      const mockResponse = { data: { id: 1, ...mockProduct } }

      mockedApiService.createProduct.mockResolvedValue(mockResponse)

      const productsStore = useProductsStore()
      const result = await productsStore.createProduct(mockProduct)

      expect(result.success).toBe(true)
      expect(mockedNotify.success).toHaveBeenCalledWith(
        'Produit créé avec succès',
        'Catalogue',
        { duration: 3000 }
      )
    })

    it('should show error notification with retry callback on creation failure', async () => {
      const mockProduct = { name: 'Invalid Product' }

      mockedApiService.createProduct.mockRejectedValue(new Error('Validation error'))

      const productsStore = useProductsStore()
      await productsStore.createProduct(mockProduct)

      expect(mockedNotify.error).toHaveBeenCalledWith(
        'Validation error',
        'Catalogue',
        expect.objectContaining({
          action: expect.objectContaining({
            label: 'Réessayer',
            callback: expect.any(Function)
          })
        })
      )
    })

    it('should retry createProduct with same data when callback is executed', async () => {
      const mockProduct = { name: 'Test Product', price: 20 }

      // First fails, second succeeds
      mockedApiService.createProduct
        .mockRejectedValueOnce(new Error('Server error'))
        .mockResolvedValueOnce({ data: { id: 1, ...mockProduct } })

      const productsStore = useProductsStore()
      await productsStore.createProduct(mockProduct)

      // Execute retry callback
      const errorCall = mockedNotify.error.mock.calls[0]
      const retryCallback = errorCall[2]?.action?.callback
      await retryCallback()

      expect(mockedApiService.createProduct).toHaveBeenCalledTimes(2)
      expect(mockedApiService.createProduct).toHaveBeenLastCalledWith(mockProduct)
      expect(mockedNotify.success).toHaveBeenCalledWith(
        'Produit créé avec succès',
        'Catalogue',
        { duration: 3000 }
      )
    })
  })

  describe('Update Product', () => {
    it('should show success notification on successful update', async () => {
      const mockId = 1
      const mockUpdate = { name: 'Updated Product' }
      const mockResponse = { data: { id: mockId, ...mockUpdate } }

      mockedApiService.updateProduct.mockResolvedValue(mockResponse)

      const productsStore = useProductsStore()

      // Setup initial products
      productsStore.products = [{ id: 1, name: 'Old Product' }]

      const result = await productsStore.updateProduct(mockId, mockUpdate)

      expect(result.success).toBe(true)
      expect(mockedNotify.success).toHaveBeenCalledWith(
        'Produit mis à jour avec succès',
        'Catalogue',
        { duration: 3000 }
      )
    })

    it('should update product in store and currentProduct if selected', async () => {
      const mockId = 1
      const mockUpdate = { name: 'Updated Product' }
      const mockResponse = { data: { id: mockId, ...mockUpdate, price: 15 } }

      mockedApiService.updateProduct.mockResolvedValue(mockResponse)

      const productsStore = useProductsStore()

      // Setup initial state
      productsStore.products = [{ id: 1, name: 'Old Product', price: 10 }]
      productsStore.currentProduct = { id: 1, name: 'Old Product', price: 10 }

      await productsStore.updateProduct(mockId, mockUpdate)

      // Check product was updated in array
      expect(productsStore.products[0]).toEqual(mockResponse.data)
      // Check currentProduct was updated
      expect(productsStore.currentProduct).toEqual(mockResponse.data)
    })
  })

  describe('Delete Product', () => {
    it('should show success notification and remove product from store', async () => {
      const mockId = 1

      mockedApiService.deleteProduct.mockResolvedValue({})

      const productsStore = useProductsStore()

      // Setup initial products
      productsStore.products = [
        { id: 1, name: 'Product 1' },
        { id: 2, name: 'Product 2' }
      ]

      const result = await productsStore.deleteProduct(mockId)

      expect(result.success).toBe(true)
      expect(mockedNotify.success).toHaveBeenCalledWith(
        'Produit supprimé avec succès',
        'Catalogue',
        { duration: 3000 }
      )
      expect(productsStore.products).toHaveLength(1)
      expect(productsStore.products[0].id).toBe(2)
    })

    it('should clear currentProduct if deleted product is selected', async () => {
      const mockId = 1

      mockedApiService.deleteProduct.mockResolvedValue({})

      const productsStore = useProductsStore()

      // Setup current product
      productsStore.currentProduct = { id: 1, name: 'Product 1' }
      productsStore.products = [{ id: 1, name: 'Product 1' }]

      await productsStore.deleteProduct(mockId)

      expect(productsStore.currentProduct).toBeNull()
    })
  })

  describe('Network Error Scenarios', () => {
    it('should handle network timeouts with appropriate error messages', async () => {
      mockedApiService.getProducts.mockRejectedValue(new Error('Request timeout'))

      const productsStore = useProductsStore()
      await productsStore.fetchProducts()

      expect(mockedNotify.error).toHaveBeenCalledWith(
        'Request timeout',
        'Catalogue',
        expect.objectContaining({
          action: expect.objectContaining({
            label: 'Réessayer'
          })
        })
      )
    })

    it('should use default error message when API returns no message', async () => {
      mockedApiService.getProducts.mockRejectedValue(new Error())

      const productsStore = useProductsStore()
      await productsStore.fetchProducts()

      expect(mockedNotify.error).toHaveBeenCalledWith(
        'Erreur lors du chargement des produits',
        'Catalogue',
        expect.anything()
      )
    })
  })

  describe('Callback Safety', () => {
    it('should handle concurrent operations safely', async () => {
      const mockProduct = { name: 'Concurrent Product' }

      // Slow API response
      mockedApiService.createProduct.mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve({
          data: { id: 1, ...mockProduct }
        }), 100))
      )

      const productsStore = useProductsStore()

      // Start two concurrent creates
      const promise1 = productsStore.createProduct(mockProduct)
      const promise2 = productsStore.createProduct(mockProduct)

      await Promise.all([promise1, promise2])

      // Should only make one API call due to loading guard
      expect(mockedApiService.createProduct).toHaveBeenCalledTimes(1)
    })

    it('should preserve callback context when retrying', async () => {
      const specificFilters = { search: 'specific-term', page: 2 }

      mockedApiService.getProducts
        .mockRejectedValueOnce(new Error('First failure'))
        .mockResolvedValueOnce({ data: [], pagination: {} })

      const productsStore = useProductsStore()
      await productsStore.fetchProducts(specificFilters)

      // Execute retry callback
      const errorCall = mockedNotify.error.mock.calls[0]
      const retryCallback = errorCall[2]?.action?.callback
      await retryCallback()

      // Should retry with the same specific filters
      expect(mockedApiService.getProducts).toHaveBeenLastCalledWith(specificFilters)
    })
  })
})
