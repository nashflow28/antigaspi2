// @ts-nocheck
/**
 * Tests unitaires pour favoritesSlice
 * Teste fetchFavorites, fetchFavoriteIds, toggleFavorite, checkFavorite
 */

import { configureStore } from '@reduxjs/toolkit'
import {
  favoritesReducer,
  favoritesInitialState,
  fetchFavorites,
  fetchFavoriteIds,
  toggleFavorite,
  checkFavorite,
  clearError,
  optimisticToggleFavorite,
} from '../favoritesSlice'
import type { Product } from '../../../types'
import apiService from '../../../services/api'
import offlineService from '../../../services/offlineService'

// Mock apiService
jest.mock('../../../services/api', () => ({
  __esModule: true,
  default: {
    getFavorites: jest.fn(),
    getFavoriteIds: jest.fn(),
    toggleFavorite: jest.fn(),
    checkFavorite: jest.fn(),
  },
}))

// Mock offlineService
jest.mock('../../../services/offlineService', () => ({
  __esModule: true,
  default: {
    getCache: jest.fn(),
    setCache: jest.fn(),
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

const mockGetFavorites = apiService.getFavorites as jest.MockedFunction<typeof apiService.getFavorites>
const mockGetFavoriteIds = apiService.getFavoriteIds as jest.MockedFunction<typeof apiService.getFavoriteIds>
const mockToggleFavorite = apiService.toggleFavorite as jest.MockedFunction<typeof apiService.toggleFavorite>
const mockCheckFavorite = apiService.checkFavorite as jest.MockedFunction<typeof apiService.checkFavorite>
const mockGetCache = offlineService.getCache as jest.MockedFunction<typeof offlineService.getCache>
const mockCheckConnectivity = offlineService.checkConnectivity as jest.MockedFunction<typeof offlineService.checkConnectivity>

// Mock product data
const mockProduct1: Product = {
  id: 1,
  name: 'Pain complet',
  description: 'Pain frais du jour',
  original_price: 500,
  discount_price: 250,
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
  description: 'Croissants au beurre',
  original_price: 200,
  discount_price: 100,
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

describe('favoritesSlice', () => {
  let store: ReturnType<typeof configureStore>

  beforeEach(() => {
    store = configureStore({
      reducer: {
        favorites: favoritesReducer,
      },
    })
    jest.clearAllMocks()
    mockCheckConnectivity.mockResolvedValue(true)
  })

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = store.getState().favorites

      expect(state).toEqual({
        favoriteIds: [],
        favorites: [],
        loading: false,
        error: null,
      })
    })
  })

  describe('Synchronous Reducers', () => {
    describe('clearError', () => {
      it('should clear error state', () => {
        store = configureStore({
          reducer: {
            favorites: favoritesReducer,
          },
          preloadedState: {
            favorites: {
              ...favoritesInitialState,
              error: 'Some error',
            },
          },
        })

        store.dispatch(clearError())

        const state = store.getState().favorites
        expect(state.error).toBeNull()
      })
    })

    describe('optimisticToggleFavorite', () => {
      it('should add product to favorites optimistically', () => {
        store.dispatch(optimisticToggleFavorite(1))

        const state = store.getState().favorites
        expect(state.favoriteIds).toContain(1)
      })

      it('should remove product from favorites optimistically', () => {
        store = configureStore({
          reducer: {
            favorites: favoritesReducer,
          },
          preloadedState: {
            favorites: {
              ...favoritesInitialState,
              favoriteIds: [1, 2, 3],
              favorites: [mockProduct1],
            },
          },
        })

        store.dispatch(optimisticToggleFavorite(1))

        const state = store.getState().favorites
        expect(state.favoriteIds).not.toContain(1)
        expect(state.favorites).not.toContainEqual(mockProduct1)
      })
    })
  })

  describe('fetchFavorites', () => {
    it('should set loading true when pending', () => {
      mockGetFavorites.mockReturnValue(new Promise(() => {}))

      store.dispatch(fetchFavorites())

      const state = store.getState().favorites
      expect(state.loading).toBe(true)
      expect(state.error).toBeNull()
    })

    it('should fetch favorites successfully', async () => {
      mockGetFavorites.mockResolvedValueOnce({
        data: [mockProduct1, mockProduct2],
      })

      await store.dispatch(fetchFavorites())

      const state = store.getState().favorites
      expect(state.loading).toBe(false)
      expect(state.favorites).toEqual([mockProduct1, mockProduct2])
      expect(state.favoriteIds).toEqual([1, 2])
      expect(state.error).toBeNull()
    })

    it('should use cache when offline', async () => {
      mockCheckConnectivity.mockResolvedValueOnce(false)
      mockGetCache.mockResolvedValueOnce([mockProduct1])

      await store.dispatch(fetchFavorites())

      const state = store.getState().favorites
      expect(state.favorites).toEqual([mockProduct1])
      expect(mockGetFavorites).not.toHaveBeenCalled()
    })

    it('should fallback to cache on API error', async () => {
      mockGetFavorites.mockRejectedValueOnce(new Error('Network error'))
      mockGetCache.mockResolvedValueOnce([mockProduct1])

      await store.dispatch(fetchFavorites())

      const state = store.getState().favorites
      expect(state.favorites).toEqual([mockProduct1])
    })

    it('should handle fetch failure with no cache', async () => {
      mockGetFavorites.mockRejectedValueOnce(new Error('Network error'))
      mockGetCache.mockResolvedValueOnce(null)

      await store.dispatch(fetchFavorites())

      const state = store.getState().favorites
      expect(state.loading).toBe(false)
      expect(state.error).toBe('Network error')
    })
  })

  describe('fetchFavoriteIds', () => {
    it('should set loading true when pending', () => {
      mockGetFavoriteIds.mockReturnValue(new Promise(() => {}))

      store.dispatch(fetchFavoriteIds())

      const state = store.getState().favorites
      expect(state.loading).toBe(true)
    })

    it('should fetch favorite IDs successfully', async () => {
      mockGetFavoriteIds.mockResolvedValueOnce({
        data: [1, 2, 3],
      })

      await store.dispatch(fetchFavoriteIds())

      const state = store.getState().favorites
      expect(state.loading).toBe(false)
      expect(state.favoriteIds).toEqual([1, 2, 3])
    })

    it('should use cache when offline', async () => {
      mockCheckConnectivity.mockResolvedValueOnce(false)
      mockGetCache.mockResolvedValueOnce([1, 2])

      await store.dispatch(fetchFavoriteIds())

      const state = store.getState().favorites
      expect(state.favoriteIds).toEqual([1, 2])
      expect(mockGetFavoriteIds).not.toHaveBeenCalled()
    })

    it('should handle fetch IDs failure', async () => {
      mockGetFavoriteIds.mockRejectedValueOnce(new Error('Failed to fetch'))
      mockGetCache.mockResolvedValueOnce(null)

      await store.dispatch(fetchFavoriteIds())

      const state = store.getState().favorites
      expect(state.loading).toBe(false)
      expect(state.error).toBe('Failed to fetch')
    })
  })

  describe('toggleFavorite', () => {
    it('should add to favorites when toggling on', async () => {
      mockToggleFavorite.mockResolvedValueOnce({
        is_favorite: true,
      })

      await store.dispatch(toggleFavorite(1))

      const state = store.getState().favorites
      expect(state.favoriteIds).toContain(1)
      expect(state.error).toBeNull()
    })

    it('should remove from favorites when toggling off', async () => {
      store = configureStore({
        reducer: {
          favorites: favoritesReducer,
        },
        preloadedState: {
          favorites: {
            ...favoritesInitialState,
            favoriteIds: [1, 2],
            favorites: [mockProduct1, mockProduct2],
          },
        },
      })

      mockToggleFavorite.mockResolvedValueOnce({
        is_favorite: false,
      })

      await store.dispatch(toggleFavorite(1))

      const state = store.getState().favorites
      expect(state.favoriteIds).not.toContain(1)
      expect(state.favorites).not.toContainEqual(mockProduct1)
    })

    it('should not duplicate favoriteId when already present', async () => {
      store = configureStore({
        reducer: {
          favorites: favoritesReducer,
        },
        preloadedState: {
          favorites: {
            ...favoritesInitialState,
            favoriteIds: [1],
          },
        },
      })

      mockToggleFavorite.mockResolvedValueOnce({
        is_favorite: true,
      })

      await store.dispatch(toggleFavorite(1))

      const state = store.getState().favorites
      expect(state.favoriteIds.filter(id => id === 1).length).toBe(1)
    })

    it('should handle toggle failure', async () => {
      mockToggleFavorite.mockRejectedValueOnce(new Error('Toggle failed'))

      await store.dispatch(toggleFavorite(1))

      const state = store.getState().favorites
      expect(state.error).toBe('Toggle failed')
    })
  })

  describe('checkFavorite', () => {
    it('should add to favoriteIds if is_favorite true and not present', async () => {
      mockCheckFavorite.mockResolvedValueOnce({
        is_favorite: true,
      })

      await store.dispatch(checkFavorite(1))

      const state = store.getState().favorites
      expect(state.favoriteIds).toContain(1)
    })

    it('should remove from favoriteIds if is_favorite false', async () => {
      store = configureStore({
        reducer: {
          favorites: favoritesReducer,
        },
        preloadedState: {
          favorites: {
            ...favoritesInitialState,
            favoriteIds: [1, 2],
          },
        },
      })

      mockCheckFavorite.mockResolvedValueOnce({
        is_favorite: false,
      })

      await store.dispatch(checkFavorite(1))

      const state = store.getState().favorites
      expect(state.favoriteIds).not.toContain(1)
      expect(state.favoriteIds).toContain(2)
    })

    it('should not add duplicate if already in favoriteIds', async () => {
      store = configureStore({
        reducer: {
          favorites: favoritesReducer,
        },
        preloadedState: {
          favorites: {
            ...favoritesInitialState,
            favoriteIds: [1],
          },
        },
      })

      mockCheckFavorite.mockResolvedValueOnce({
        is_favorite: true,
      })

      await store.dispatch(checkFavorite(1))

      const state = store.getState().favorites
      expect(state.favoriteIds.length).toBe(1)
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty favorites list', async () => {
      mockGetFavorites.mockResolvedValueOnce({
        data: [],
      })

      await store.dispatch(fetchFavorites())

      const state = store.getState().favorites
      expect(state.favorites).toEqual([])
      expect(state.favoriteIds).toEqual([])
    })

    it('should handle concurrent toggle operations', async () => {
      mockToggleFavorite
        .mockResolvedValueOnce({ is_favorite: true })
        .mockResolvedValueOnce({ is_favorite: true })
        .mockResolvedValueOnce({ is_favorite: true })

      await Promise.all([
        store.dispatch(toggleFavorite(1)),
        store.dispatch(toggleFavorite(2)),
        store.dispatch(toggleFavorite(3)),
      ])

      const state = store.getState().favorites
      expect(state.favoriteIds).toContain(1)
      expect(state.favoriteIds).toContain(2)
      expect(state.favoriteIds).toContain(3)
    })

    it('should handle rapid toggle on same product', async () => {
      // First toggle: add to favorites
      mockToggleFavorite.mockResolvedValueOnce({ is_favorite: true })
      await store.dispatch(toggleFavorite(1))

      let state = store.getState().favorites
      expect(state.favoriteIds).toContain(1)

      // Second toggle: remove from favorites
      mockToggleFavorite.mockResolvedValueOnce({ is_favorite: false })
      await store.dispatch(toggleFavorite(1))

      state = store.getState().favorites
      expect(state.favoriteIds).not.toContain(1)
    })
  })
})
