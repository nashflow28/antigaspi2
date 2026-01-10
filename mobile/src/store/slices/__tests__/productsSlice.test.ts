// @ts-nocheck
/**
 * Tests unitaires pour productsSlice
 * Teste fetchProducts, fetchProduct, fetchCategories, fetchMoreProducts, filters
 */

import { configureStore } from '@reduxjs/toolkit'
import {
  productsReducer,
  productsInitialState,
  fetchProducts,
  fetchProduct,
  fetchCategories,
  fetchMoreProducts,
  setFilters,
  clearFilters,
  clearError,
  updateProduct,
  resetProducts,
} from '../productsSlice'
import type { Product, Category } from '../../../types'
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
    getCache: jest.fn().mockResolvedValue(null),
    setCache: jest.fn().mockResolvedValue(undefined),
    checkConnectivity: jest.fn().mockResolvedValue(true),
    getConnectivityStatus: jest.fn().mockReturnValue(true),
  },
}))

// Mock logger
jest.mock('../../../utils/logger', () => ({
  storeLogger: {
    warn: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}))

// Mock schema validator
jest.mock('../../../utils/schemaValidator', () => ({
  validateSchema: jest.fn().mockReturnValue({ valid: true, errors: [] }),
  ProductSchema: {},
}))

const mockGetProducts = apiService.getProducts as jest.MockedFunction<typeof apiService.getProducts>
const mockGetProduct = apiService.getProduct as jest.MockedFunction<typeof apiService.getProduct>
const mockGetCategories = apiService.getCategories as jest.MockedFunction<typeof apiService.getCategories>
const mockCheckConnectivity = offlineService.checkConnectivity as jest.MockedFunction<typeof offlineService.checkConnectivity>
const mockGetCache = offlineService.getCache as jest.MockedFunction<typeof offlineService.getCache>

// Mock data
const mockProduct1: Product = {
  id: 1,
  name: 'Pain complet',
  description: 'Pain frais',
  original_price: 500,
  discounted_price: 250,
  discount_percentage: 50,
  quantity_available: 10,
  expiration_date: '2024-01-20',
  image_url: '/images/pain.jpg',
  is_active: true,
  merchant_id: 1,
  category_id: 1,
  created_at: '2024-01-01',
  updated_at: '2024-01-15',
}

const mockProduct2: Product = {
  id: 2,
  name: 'Croissants',
  description: 'Croissants frais',
  original_price: 200,
  discounted_price: 100,
  discount_percentage: 50,
  quantity_available: 5,
  expiration_date: '2024-01-19',
  image_url: '/images/croissant.jpg',
  is_active: true,
  merchant_id: 1,
  category_id: 1,
  created_at: '2024-01-01',
  updated_at: '2024-01-15',
}

const mockCategory1: Category = {
  id: 1,
  name: 'Boulangerie',
  description: 'Pains et viennoiseries',
  icon: 'bread',
  products_count: 10,
}

const mockCategory2: Category = {
  id: 2,
  name: 'Fruits',
  description: 'Fruits frais',
  icon: 'apple',
  products_count: 15,
}

describe('productsSlice', () => {
  let store: ReturnType<typeof configureStore>

  beforeEach(() => {
    store = configureStore({
      reducer: {
        products: productsReducer,
      },
    })
    jest.clearAllMocks()
    mockCheckConnectivity.mockResolvedValue(true)
    mockGetCache.mockResolvedValue(null)
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
        store = configureStore({
          reducer: {
            products: productsReducer,
          },
          preloadedState: {
            products: {
              ...productsInitialState,
              currentPage: 5,
              hasMore: false,
            },
          },
        })

        store.dispatch(setFilters({ category_id: 1, search: 'pain' }))

        const state = store.getState().products
        expect(state.filters).toEqual({ category_id: 1, search: 'pain' })
        expect(state.currentPage).toBe(1)
        expect(state.hasMore).toBe(true)
      })

      it('should merge filters with existing ones', () => {
        store = configureStore({
          reducer: {
            products: productsReducer,
          },
          preloadedState: {
            products: {
              ...productsInitialState,
              filters: { category_id: 1 },
            },
          },
        })

        store.dispatch(setFilters({ search: 'pain' }))

        const state = store.getState().products
        expect(state.filters).toEqual({ category_id: 1, search: 'pain' })
      })
    })

    describe('clearFilters', () => {
      it('should clear all filters and reset pagination', () => {
        store = configureStore({
          reducer: {
            products: productsReducer,
          },
          preloadedState: {
            products: {
              ...productsInitialState,
              filters: { category_id: 1, search: 'pain' },
              currentPage: 3,
              hasMore: false,
            },
          },
        })

        store.dispatch(clearFilters())

        const state = store.getState().products
        expect(state.filters).toEqual({})
        expect(state.currentPage).toBe(1)
        expect(state.hasMore).toBe(true)
      })
    })

    describe('clearError', () => {
      it('should clear error state', () => {
        store = configureStore({
          reducer: {
            products: productsReducer,
          },
          preloadedState: {
            products: {
              ...productsInitialState,
              error: 'Some error',
            },
          },
        })

        store.dispatch(clearError())

        const state = store.getState().products
        expect(state.error).toBeNull()
      })
    })

    describe('updateProduct', () => {
      it('should update existing product', () => {
        store = configureStore({
          reducer: {
            products: productsReducer,
          },
          preloadedState: {
            products: {
              ...productsInitialState,
              products: [mockProduct1, mockProduct2],
            },
          },
        })

        const updatedProduct = { ...mockProduct1, quantity_available: 5 }
        store.dispatch(updateProduct(updatedProduct))

        const state = store.getState().products
        expect(state.products[0].quantity_available).toBe(5)
      })

      it('should not add product if not found', () => {
        store = configureStore({
          reducer: {
            products: productsReducer,
          },
          preloadedState: {
            products: {
              ...productsInitialState,
              products: [mockProduct1],
            },
          },
        })

        store.dispatch(updateProduct(mockProduct2))

        const state = store.getState().products
        expect(state.products.length).toBe(1)
      })
    })

    describe('resetProducts', () => {
      it('should reset products list and pagination', () => {
        store = configureStore({
          reducer: {
            products: productsReducer,
          },
          preloadedState: {
            products: {
              ...productsInitialState,
              products: [mockProduct1, mockProduct2],
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

  describe('fetchProducts', () => {
    it('should set loading true when pending', () => {
      mockGetProducts.mockReturnValue(new Promise(() => {}))

      store.dispatch(fetchProducts(undefined))

      const state = store.getState().products
      expect(state.loading).toBe(true)
      expect(state.error).toBeNull()
    })

    it('should fetch products successfully', async () => {
      mockGetProducts.mockResolvedValueOnce({
        data: [mockProduct1, mockProduct2],
      })

      await store.dispatch(fetchProducts(undefined))

      const state = store.getState().products
      expect(state.loading).toBe(false)
      expect(state.products).toHaveLength(2)
      expect(state.products[0].id).toBe(1)
      expect(state.products[1].id).toBe(2)
    })

    it('should apply filters when fetching', async () => {
      mockGetProducts.mockResolvedValueOnce({
        data: [mockProduct1],
      })

      await store.dispatch(fetchProducts({ category_id: 1 }))

      expect(mockGetProducts).toHaveBeenCalledWith({ category_id: 1 })
    })

    it('should normalize prices (string to number)', async () => {
      mockGetProducts.mockResolvedValueOnce({
        data: [{
          ...mockProduct1,
          original_price: '500' as any,
          discounted_price: '250' as any,
        }],
      })

      await store.dispatch(fetchProducts(undefined))

      const state = store.getState().products
      expect(typeof state.products[0].original_price).toBe('number')
      expect(typeof state.products[0].discounted_price).toBe('number')
    })

    it('should use cache when offline', async () => {
      mockCheckConnectivity.mockResolvedValueOnce(false)
      mockGetCache.mockResolvedValueOnce([mockProduct1])

      await store.dispatch(fetchProducts(undefined))

      const state = store.getState().products
      expect(state.products).toEqual([mockProduct1])
      expect(mockGetProducts).not.toHaveBeenCalled()
    })

    it('should fallback to cache on API error', async () => {
      mockGetProducts.mockRejectedValueOnce(new Error('Network error'))
      mockGetCache.mockResolvedValueOnce([mockProduct1])

      await store.dispatch(fetchProducts(undefined))

      const state = store.getState().products
      expect(state.products).toEqual([mockProduct1])
    })

    it('should handle fetch failure with no cache', async () => {
      mockGetProducts.mockRejectedValueOnce(new Error('Network error'))
      mockGetCache.mockResolvedValueOnce(null)

      await store.dispatch(fetchProducts(undefined))

      const state = store.getState().products
      expect(state.loading).toBe(false)
      expect(state.error).toBe('Network error')
    })

    it('should set hasMore based on response length', async () => {
      // Less than 20 products means no more pages
      mockGetProducts.mockResolvedValueOnce({
        data: [mockProduct1, mockProduct2],
      })

      await store.dispatch(fetchProducts(undefined))

      const state = store.getState().products
      expect(state.hasMore).toBe(false)
    })
  })

  describe('fetchProduct', () => {
    it('should fetch single product successfully', async () => {
      mockGetProduct.mockResolvedValueOnce({
        data: mockProduct1,
      })

      await store.dispatch(fetchProduct(1))

      expect(mockGetProduct).toHaveBeenCalledWith(1)
    })

    it('should use cache when offline', async () => {
      mockCheckConnectivity.mockResolvedValueOnce(false)
      mockGetCache.mockResolvedValueOnce(mockProduct1)

      const result = await store.dispatch(fetchProduct(1))

      expect(result.payload).toEqual(mockProduct1)
      expect(mockGetProduct).not.toHaveBeenCalled()
    })

    it('should fallback to cache on error', async () => {
      mockGetProduct.mockRejectedValueOnce(new Error('Not found'))
      mockGetCache.mockResolvedValueOnce(mockProduct1)

      const result = await store.dispatch(fetchProduct(1))

      expect(result.payload).toEqual(mockProduct1)
    })
  })

  describe('fetchCategories', () => {
    it('should fetch categories successfully', async () => {
      mockGetCategories.mockResolvedValueOnce({
        data: [mockCategory1, mockCategory2],
      })

      await store.dispatch(fetchCategories())

      const state = store.getState().products
      expect(state.categories).toEqual([mockCategory1, mockCategory2])
    })

    it('should use cache when offline', async () => {
      mockCheckConnectivity.mockResolvedValueOnce(false)
      mockGetCache.mockResolvedValueOnce([mockCategory1])

      await store.dispatch(fetchCategories())

      const state = store.getState().products
      expect(state.categories).toEqual([mockCategory1])
      expect(mockGetCategories).not.toHaveBeenCalled()
    })

    it('should fallback to cache on error', async () => {
      mockGetCategories.mockRejectedValueOnce(new Error('Network error'))
      mockGetCache.mockResolvedValueOnce([mockCategory1])

      await store.dispatch(fetchCategories())

      const state = store.getState().products
      expect(state.categories).toEqual([mockCategory1])
    })
  })

  describe('fetchMoreProducts', () => {
    beforeEach(() => {
      store = configureStore({
        reducer: {
          products: productsReducer,
        },
        preloadedState: {
          products: {
            ...productsInitialState,
            products: [mockProduct1],
            currentPage: 1,
          },
        },
      })
    })

    it('should fetch more products successfully', async () => {
      mockGetProducts.mockResolvedValueOnce({
        data: [mockProduct2],
      })

      await store.dispatch(fetchMoreProducts({ page: 2 }))

      expect(mockGetProducts).toHaveBeenCalledWith({ page: 2, per_page: 20 })
    })

    it('should apply filters when fetching more', async () => {
      mockGetProducts.mockResolvedValueOnce({
        data: [mockProduct2],
      })

      await store.dispatch(fetchMoreProducts({ filters: { category_id: 1 }, page: 2 }))

      expect(mockGetProducts).toHaveBeenCalledWith({ category_id: 1, page: 2, per_page: 20 })
    })

    it('should handle fetch more failure', async () => {
      mockGetProducts.mockRejectedValueOnce(new Error('Network error'))

      await store.dispatch(fetchMoreProducts({ page: 2 }))

      const state = store.getState().products
      expect(state.loadingMore).toBe(false)
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty products list', async () => {
      mockGetProducts.mockResolvedValueOnce({
        data: [],
      })

      await store.dispatch(fetchProducts(undefined))

      const state = store.getState().products
      expect(state.products).toEqual([])
      expect(state.hasMore).toBe(false)
    })

    it('should handle concurrent fetch operations', async () => {
      mockGetProducts.mockResolvedValue({ data: [mockProduct1] })
      mockGetCategories.mockResolvedValue({ data: [mockCategory1] })

      await Promise.all([
        store.dispatch(fetchProducts(undefined)),
        store.dispatch(fetchCategories()),
      ])

      const state = store.getState().products
      expect(state.products).toEqual([mockProduct1])
      expect(state.categories).toEqual([mockCategory1])
    })

    it('should handle products with missing prices', async () => {
      mockGetProducts.mockResolvedValueOnce({
        data: [{
          ...mockProduct1,
          original_price: undefined as any,
          discounted_price: null as any,
        }],
      })

      await store.dispatch(fetchProducts(undefined))

      const state = store.getState().products
      expect(state.products[0].original_price).toBe(0)
      expect(state.products[0].discounted_price).toBe(0)
    })
  })
})
