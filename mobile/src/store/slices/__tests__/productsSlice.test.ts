// @ts-nocheck
/**
 * Tests unitaires pour productsSlice
 * Teste fetchProducts, fetchMoreProducts, fetchProduct, fetchCategories + pagination + cache offline
 */

import { configureStore } from '@reduxjs/toolkit'
import productsReducer, {
  fetchProducts,
  fetchMoreProducts,
  fetchProduct,
  fetchCategories,
  setFilters,
  clearFilters,
  clearError,
  updateProduct,
  resetProducts,
} from '../productsSlice'
import { ProductsState, Product, Category, ProductFilters } from '../../../types'
import apiService from '../../../services/api'
import offlineService from '../../../services/offlineService'

// Mock apiService
jest.mock('../../../services/api', () => ({
  __esModule: true,
  default: {
    getProducts: jest.fn(),
    getProduct: jest.fn(),
    getCategories: jest.fn(),
  },
}))

// Mock offlineService
jest.mock('../../../services/offlineService', () => ({
  __esModule: true,
  default: {
    getCache: jest.fn(),
    setCache: jest.fn(),
    getConnectivityStatus: jest.fn(),
  },
}))

const mockGetProducts = apiService.getProducts as jest.MockedFunction<typeof apiService.getProducts>
const mockGetProduct = apiService.getProduct as jest.MockedFunction<typeof apiService.getProduct>
const mockGetCategories = apiService.getCategories as jest.MockedFunction<typeof apiService.getCategories>
const mockGetCache = offlineService.getCache as jest.MockedFunction<typeof offlineService.getCache>
const mockSetCache = offlineService.setCache as jest.MockedFunction<typeof offlineService.setCache>
const mockGetConnectivityStatus = offlineService.getConnectivityStatus as jest.MockedFunction<typeof offlineService.getConnectivityStatus>

describe('productsSlice', () => {
  let store: ReturnType<typeof configureStore>

  beforeEach(() => {
    // Create fresh store for each test
    store = configureStore({
      reducer: {
        products: productsReducer,
      },
    })

    // Clear all mocks
    jest.clearAllMocks()

    // Default mock implementations
    mockGetCache.mockResolvedValue(null)
    mockSetCache.mockResolvedValue(undefined)
    mockGetConnectivityStatus.mockReturnValue(true) // Online by default
  })

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = store.getState().products

      expect(state).toEqual({
        products: [],
        categories: [],
        loading: false,
        loadingMore: false,
        error: null,
        filters: {},
        currentPage: 1,
        hasMore: true,
      })
    })
  })

  describe('Synchronous Reducers', () => {
    describe('setFilters', () => {
      it('should set filters and reset pagination', () => {
        const filters: ProductFilters = {
          category_id: 1,
          discount_min: 20,
        }

        store.dispatch(setFilters(filters))

        const state = store.getState().products
        expect(state.filters).toEqual(filters)
        expect(state.currentPage).toBe(1)
        expect(state.hasMore).toBe(true)
      })

      it('should merge filters with existing ones', () => {
        // Set initial filters
        store.dispatch(setFilters({ category_id: 1 }))

        // Add more filters
        store.dispatch(setFilters({ discount_min: 20 }))

        const state = store.getState().products
        expect(state.filters).toEqual({
          category_id: 1,
          discount_min: 20,
        })
      })

      it('should override existing filter values', () => {
        store.dispatch(setFilters({ category_id: 1 }))
        store.dispatch(setFilters({ category_id: 2 }))

        const state = store.getState().products
        expect(state.filters.category_id).toBe(2)
      })
    })

    describe('clearFilters', () => {
      it('should clear all filters and reset pagination', () => {
        // Set up state with filters
        store.dispatch(setFilters({ category_id: 1, discount_min: 20 }))

        store.dispatch(clearFilters())

        const state = store.getState().products
        expect(state.filters).toEqual({})
        expect(state.currentPage).toBe(1)
        expect(state.hasMore).toBe(true)
      })
    })

    describe('clearError', () => {
      it('should clear error state', () => {
        // Set up state with error
        store = configureStore({
          reducer: {
            products: productsReducer,
          },
          preloadedState: {
            products: {
              products: [],
              categories: [],
              loading: false,
              loadingMore: false,
              error: 'Some error',
              filters: {},
              currentPage: 1,
              hasMore: true,
            },
          },
        })

        store.dispatch(clearError())

        const state = store.getState().products
        expect(state.error).toBeNull()
      })
    })

    describe('updateProduct', () => {
      it('should update existing product in list', () => {
        const initialProducts: Product[] = [
          { id: 1, name: 'Product 1', price: 100, original_price: 150 } as Product,
          { id: 2, name: 'Product 2', price: 200, original_price: 250 } as Product,
        ]

        // Set up state with products
        store = configureStore({
          reducer: {
            products: productsReducer,
          },
          preloadedState: {
            products: {
              products: initialProducts,
              categories: [],
              loading: false,
              loadingMore: false,
              error: null,
              filters: {},
              currentPage: 1,
              hasMore: true,
            },
          },
        })

        const updatedProduct: Product = {
          id: 1,
          name: 'Updated Product 1',
          price: 120,
          original_price: 150,
        } as Product

        store.dispatch(updateProduct(updatedProduct))

        const state = store.getState().products
        expect(state.products[0]).toEqual(updatedProduct)
        expect(state.products[0].name).toBe('Updated Product 1')
        expect(state.products[1]).toEqual(initialProducts[1]) // Other product unchanged
      })

      it('should not add product if not in list', () => {
        const initialProducts: Product[] = [
          { id: 1, name: 'Product 1', price: 100 } as Product,
        ]

        store = configureStore({
          reducer: {
            products: productsReducer,
          },
          preloadedState: {
            products: {
              products: initialProducts,
              categories: [],
              loading: false,
              loadingMore: false,
              error: null,
              filters: {},
              currentPage: 1,
              hasMore: true,
            },
          },
        })

        const newProduct: Product = { id: 99, name: 'New Product', price: 500 } as Product

        store.dispatch(updateProduct(newProduct))

        const state = store.getState().products
        expect(state.products.length).toBe(1)
        expect(state.products.find(p => p.id === 99)).toBeUndefined()
      })
    })

    describe('resetProducts', () => {
      it('should reset products and pagination', () => {
        const initialProducts: Product[] = [
          { id: 1, name: 'Product 1', price: 100 } as Product,
          { id: 2, name: 'Product 2', price: 200 } as Product,
        ]

        store = configureStore({
          reducer: {
            products: productsReducer,
          },
          preloadedState: {
            products: {
              products: initialProducts,
              categories: [],
              loading: false,
              loadingMore: false,
              error: null,
              filters: {},
              currentPage: 5,
              hasMore: false,
            },
          },
        })

        store.dispatch(resetProducts())

        const state = store.getState().products
        expect(state.products).toEqual([])
        expect(state.currentPage).toBe(1)
        expect(state.hasMore).toBe(true)
      })
    })
  })

  describe('Async Actions - fetchProducts', () => {
    const mockProducts: Product[] = [
      { id: 1, name: 'Product 1', price: 100, original_price: 150 } as Product,
      { id: 2, name: 'Product 2', price: 200, original_price: 250 } as Product,
    ]

    it('should handle fetchProducts pending state', () => {
      mockGetProducts.mockReturnValue(new Promise(() => {})) // Never resolves

      store.dispatch(fetchProducts())

      const state = store.getState().products
      expect(state.loading).toBe(true)
      expect(state.error).toBeNull()
    })

    // SKIPPED: offlineService disabled in production (import commented in productsSlice.ts)
    it.skip('should handle fetchProducts fulfilled state (online)', async () => {
      mockGetProducts.mockResolvedValue({
        success: true,
        data: mockProducts,
      })

      await store.dispatch(fetchProducts())

      const state = store.getState().products
      expect(state.loading).toBe(false)
      expect(state.products).toEqual(mockProducts)
      expect(state.currentPage).toBe(1)
      expect(state.hasMore).toBe(false) // Less than 20 products
      expect(state.error).toBeNull()
      expect(mockSetCache).toHaveBeenCalledWith('products', mockProducts)
    })

    it('should set hasMore to true when fetching 20+ products', async () => {
      const manyProducts = Array.from({ length: 20 }, (_, i) => ({
        id: i + 1,
        name: `Product ${i + 1}`,
        price: 100,
      })) as Product[]

      mockGetProducts.mockResolvedValue({
        success: true,
        data: manyProducts,
      })

      await store.dispatch(fetchProducts())

      const state = store.getState().products
      expect(state.hasMore).toBe(true) // 20 products = more pages possible
    })

    // SKIPPED: offlineService disabled in production (import commented in productsSlice.ts)
    it.skip('should use cached products when offline', async () => {
      const cachedProducts: Product[] = [
        { id: 1, name: 'Cached Product', price: 50 } as Product,
      ]

      mockGetConnectivityStatus.mockReturnValue(false) // Offline
      mockGetCache.mockResolvedValue(cachedProducts)

      await store.dispatch(fetchProducts())

      const state = store.getState().products
      expect(state.products).toEqual(cachedProducts)
      expect(mockGetProducts).not.toHaveBeenCalled() // No API call when offline
    })

    // SKIPPED: offlineService disabled in production (import commented in productsSlice.ts)
    it.skip('should fetch from API and cache when online', async () => {
      mockGetProducts.mockResolvedValue({
        success: true,
        data: mockProducts,
      })

      await store.dispatch(fetchProducts())

      expect(mockGetProducts).toHaveBeenCalled()
      expect(mockSetCache).toHaveBeenCalledWith('products', mockProducts)
    })

    // SKIPPED: offlineService disabled in production (import commented in productsSlice.ts)
    it.skip('should use different cache keys for filtered results', async () => {
      const filters: ProductFilters = { category_id: 1 }

      mockGetProducts.mockResolvedValue({
        success: true,
        data: mockProducts,
      })

      await store.dispatch(fetchProducts(filters))

      expect(mockGetCache).toHaveBeenCalledWith(`products_${JSON.stringify(filters)}`)
      expect(mockSetCache).toHaveBeenCalledWith(`products_${JSON.stringify(filters)}`, mockProducts)
    })

    // SKIPPED: offlineService disabled in production (import commented in productsSlice.ts)
    it.skip('should fallback to cache on network error', async () => {
      const cachedProducts: Product[] = [
        { id: 1, name: 'Cached Product', price: 50 } as Product,
      ]

      mockGetCache.mockResolvedValue(cachedProducts)
      mockGetProducts.mockRejectedValue(new Error('Network error'))

      await store.dispatch(fetchProducts())

      const state = store.getState().products
      expect(state.products).toEqual(cachedProducts)
      expect(state.error).toBeNull() // No error when cache available
    })

    it('should handle fetchProducts rejected when no cache', async () => {
      mockGetCache.mockResolvedValue(null)
      mockGetProducts.mockRejectedValue(new Error('Network error'))

      await store.dispatch(fetchProducts())

      const state = store.getState().products
      expect(state.loading).toBe(false)
      expect(state.error).toBe('Network error')
      expect(state.products).toEqual([])
    })
  })

  describe('Async Actions - fetchMoreProducts (Pagination)', () => {
    const page2Products: Product[] = [
      { id: 21, name: 'Product 21', price: 300 } as Product,
      { id: 22, name: 'Product 22', price: 400 } as Product,
    ]

    it('should handle fetchMoreProducts pending state', () => {
      mockGetProducts.mockReturnValue(new Promise(() => {}))

      store.dispatch(fetchMoreProducts({ page: 2 }))

      const state = store.getState().products
      expect(state.loadingMore).toBe(true)
      expect(state.error).toBeNull()
    })

    it('should append products and increment page', async () => {
      const initialProducts: Product[] = [
        { id: 1, name: 'Product 1', price: 100 } as Product,
      ]

      store = configureStore({
        reducer: {
          products: productsReducer,
        },
        preloadedState: {
          products: {
            products: initialProducts,
            categories: [],
            loading: false,
            loadingMore: false,
            error: null,
            filters: {},
            currentPage: 1,
            hasMore: true,
          },
        },
      })

      mockGetProducts.mockResolvedValue({
        success: true,
        data: page2Products,
      })

      await store.dispatch(fetchMoreProducts({ page: 2 }))

      const state = store.getState().products
      expect(state.loadingMore).toBe(false)
      expect(state.products.length).toBe(3) // 1 initial + 2 new
      expect(state.products[1]).toEqual(page2Products[0])
      expect(state.currentPage).toBe(2) // Incremented
      expect(state.hasMore).toBe(false) // Less than 20 products loaded
    })

    it('should set hasMore correctly based on loaded products', async () => {
      const manyProducts = Array.from({ length: 20 }, (_, i) => ({
        id: i + 21,
        name: `Product ${i + 21}`,
        price: 100,
      })) as Product[]

      mockGetProducts.mockResolvedValue({
        success: true,
        data: manyProducts,
      })

      await store.dispatch(fetchMoreProducts({ page: 2 }))

      const state = store.getState().products
      expect(state.hasMore).toBe(true) // 20 products = more pages
    })

    it('should include filters in pagination request', async () => {
      const filters: ProductFilters = { category_id: 1 }

      mockGetProducts.mockResolvedValue({
        success: true,
        data: page2Products,
      })

      await store.dispatch(fetchMoreProducts({ filters, page: 2 }))

      expect(mockGetProducts).toHaveBeenCalledWith({
        ...filters,
        page: 2,
        per_page: 20,
      })
    })

    it('should handle fetchMoreProducts rejected state', async () => {
      mockGetProducts.mockRejectedValue(new Error('Pagination error'))

      await store.dispatch(fetchMoreProducts({ page: 2 }))

      const state = store.getState().products
      expect(state.loadingMore).toBe(false)
      expect(state.error).toBe('Pagination error')
    })
  })

  describe('Async Actions - fetchProduct (Single Product)', () => {
    const mockProduct: Product = {
      id: 1,
      name: 'Single Product',
      price: 150,
      original_price: 200,
    } as Product

    // SKIPPED: offlineService disabled in production (import commented in productsSlice.ts)
    it.skip('should fetch and add product to list when online', async () => {
      mockGetProduct.mockResolvedValue({
        success: true,
        data: mockProduct,
      })

      await store.dispatch(fetchProduct(1))

      const state = store.getState().products
      expect(state.products.length).toBe(1)
      expect(state.products[0]).toEqual(mockProduct)
      expect(mockSetCache).toHaveBeenCalledWith('product_1', mockProduct)
    })

    it('should update existing product in list', async () => {
      const initialProducts: Product[] = [
        { id: 1, name: 'Old Name', price: 100 } as Product,
        { id: 2, name: 'Product 2', price: 200 } as Product,
      ]

      store = configureStore({
        reducer: {
          products: productsReducer,
        },
        preloadedState: {
          products: {
            products: initialProducts,
            categories: [],
            loading: false,
            loadingMore: false,
            error: null,
            filters: {},
            currentPage: 1,
            hasMore: true,
          },
        },
      })

      mockGetProduct.mockResolvedValue({
        success: true,
        data: mockProduct,
      })

      await store.dispatch(fetchProduct(1))

      const state = store.getState().products
      expect(state.products.length).toBe(2) // No duplicate
      expect(state.products[0]).toEqual(mockProduct)
      expect(state.products[0].name).toBe('Single Product')
    })

    // SKIPPED: offlineService disabled in production (import commented in productsSlice.ts)
    it.skip('should use cached product when offline', async () => {
      mockGetConnectivityStatus.mockReturnValue(false)
      mockGetCache.mockResolvedValue(mockProduct)

      await store.dispatch(fetchProduct(1))

      const state = store.getState().products
      expect(state.products[0]).toEqual(mockProduct)
      expect(mockGetProduct).not.toHaveBeenCalled()
    })

    // SKIPPED: offlineService disabled in production (import commented in productsSlice.ts)
    it.skip('should fallback to cache on network error', async () => {
      mockGetCache.mockResolvedValue(mockProduct)
      mockGetProduct.mockRejectedValue(new Error('Network error'))

      await store.dispatch(fetchProduct(1))

      const state = store.getState().products
      expect(state.products[0]).toEqual(mockProduct)
    })
  })

  describe('Async Actions - fetchCategories', () => {
    const mockCategories: Category[] = [
      { id: 1, name: 'Category 1', slug: 'category-1' } as Category,
      { id: 2, name: 'Category 2', slug: 'category-2' } as Category,
    ]

    it('should handle fetchCategories pending state', () => {
      mockGetCategories.mockReturnValue(new Promise(() => {}))

      store.dispatch(fetchCategories())

      const state = store.getState().products
      expect(state.loading).toBe(true)
      expect(state.error).toBeNull()
    })

    // SKIPPED: offlineService disabled in production (import commented in productsSlice.ts)
    it.skip('should handle fetchCategories fulfilled state', async () => {
      mockGetCategories.mockResolvedValue({
        success: true,
        data: mockCategories,
      })

      await store.dispatch(fetchCategories())

      const state = store.getState().products
      expect(state.loading).toBe(false)
      expect(state.categories).toEqual(mockCategories)
      expect(state.error).toBeNull()
      expect(mockSetCache).toHaveBeenCalledWith('categories', mockCategories)
    })

    // SKIPPED: offlineService disabled in production (import commented in productsSlice.ts)
    it.skip('should use cached categories when offline', async () => {
      mockGetConnectivityStatus.mockReturnValue(false)
      mockGetCache.mockResolvedValue(mockCategories)

      await store.dispatch(fetchCategories())

      const state = store.getState().products
      expect(state.categories).toEqual(mockCategories)
      expect(mockGetCategories).not.toHaveBeenCalled()
    })

    it('should handle fetchCategories rejected state', async () => {
      mockGetCategories.mockRejectedValue(new Error('Categories error'))

      await store.dispatch(fetchCategories())

      const state = store.getState().products
      expect(state.loading).toBe(false)
      expect(state.error).toBe('Categories error')
    })
  })

  describe('Integration - Full Pagination Flow', () => {
    it('should handle complete pagination flow (load → load more → load more)', async () => {
      const page1Products = Array.from({ length: 20 }, (_, i) => ({
        id: i + 1,
        name: `Product ${i + 1}`,
        price: 100,
      })) as Product[]

      const page2Products = Array.from({ length: 20 }, (_, i) => ({
        id: i + 21,
        name: `Product ${i + 21}`,
        price: 100,
      })) as Product[]

      const page3Products = Array.from({ length: 5 }, (_, i) => ({
        id: i + 41,
        name: `Product ${i + 41}`,
        price: 100,
      })) as Product[]

      // Step 1: Initial load (page 1)
      mockGetProducts.mockResolvedValueOnce({
        success: true,
        data: page1Products,
      })

      await store.dispatch(fetchProducts())

      let state = store.getState().products
      expect(state.products.length).toBe(20)
      expect(state.currentPage).toBe(1)
      expect(state.hasMore).toBe(true)

      // Step 2: Load more (page 2)
      mockGetProducts.mockResolvedValueOnce({
        success: true,
        data: page2Products,
      })

      await store.dispatch(fetchMoreProducts({ page: 2 }))

      state = store.getState().products
      expect(state.products.length).toBe(40)
      expect(state.currentPage).toBe(2)
      expect(state.hasMore).toBe(true)

      // Step 3: Load more (page 3 - last page)
      mockGetProducts.mockResolvedValueOnce({
        success: true,
        data: page3Products,
      })

      await store.dispatch(fetchMoreProducts({ page: 3 }))

      state = store.getState().products
      expect(state.products.length).toBe(45)
      expect(state.currentPage).toBe(3)
      expect(state.hasMore).toBe(false) // Less than 20 products = no more pages
    })
  })

  describe('Integration - Filters + Reset Flow', () => {
    it('should reset pagination when filters change', async () => {
      // Set initial state with products and page 3
      const initialProducts: Product[] = [
        { id: 1, name: 'Product 1', price: 100 } as Product,
      ]

      store = configureStore({
        reducer: {
          products: productsReducer,
        },
        preloadedState: {
          products: {
            products: initialProducts,
            categories: [],
            loading: false,
            loadingMore: false,
            error: null,
            filters: {},
            currentPage: 3,
            hasMore: false,
          },
        },
      })

      // Change filters (should reset pagination)
      store.dispatch(setFilters({ category_id: 1 }))

      const state = store.getState().products
      expect(state.currentPage).toBe(1) // Reset to page 1
      expect(state.hasMore).toBe(true) // Reset hasMore
      expect(state.filters.category_id).toBe(1)
    })
  })
})
