// @ts-nocheck

import { configureStore } from '@reduxjs/toolkit'

import surpriseBasketsReducer, {
  clearError,
  clearFilters,
  clearSelectedBasket,
  fetchMoreSurpriseBaskets,
  fetchSurpriseBasketById,
  fetchSurpriseBaskets,
  resetSurpriseBaskets,
  setFilters,
  setSelectedBasket,
  surpriseBasketsInitialState,
} from '../surpriseBasketsSlice'
import apiService from '../../../services/api'

jest.mock('../../../services/api', () => ({
  __esModule: true,
  default: {
    getSurpriseBaskets: jest.fn(),
    getSurpriseBasket: jest.fn(),
  },
}))

const mockGetSurpriseBaskets = apiService.getSurpriseBaskets as jest.MockedFunction<
  typeof apiService.getSurpriseBaskets
>
const mockGetSurpriseBasket = apiService.getSurpriseBasket as jest.MockedFunction<
  typeof apiService.getSurpriseBasket
>

const createTestStore = (preloadedState?: any) =>
  configureStore({
    reducer: {
      surpriseBaskets: surpriseBasketsReducer,
    },
    preloadedState,
  })

const buildPaginatedResponse = (items: any[], page = 1, lastPage = 1, total = items.length) => ({
  data: {
    data: items,
    current_page: page,
    last_page: lastPage,
    per_page: items.length,
    total,
  },
})

describe('surpriseBasketsSlice', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return the initial state', () => {
    const store = createTestStore()
    expect(store.getState().surpriseBaskets).toEqual(surpriseBasketsInitialState)
  })

  describe('async thunks', () => {
    it('fetchSurpriseBaskets should store baskets and pagination info', async () => {
      const store = createTestStore()
      const basket = { id: 1, name: 'Panier surprise', discounted_price: 2000 }
      mockGetSurpriseBaskets.mockResolvedValue(
        buildPaginatedResponse([basket], 1, 3, 10)
      )

      await store.dispatch(fetchSurpriseBaskets({ page: 1 }))

      const state = store.getState().surpriseBaskets
      expect(state.loading).toBe(false)
      expect(state.baskets).toHaveLength(1)
      expect(state.baskets[0]).toMatchObject({ id: 1 })
      expect(state.currentPage).toBe(1)
      expect(state.lastPage).toBe(3)
      expect(state.hasMore).toBe(true)
      expect(state.total).toBe(10)
    })

    it('fetchSurpriseBaskets should handle errors', async () => {
      const store = createTestStore()
      mockGetSurpriseBaskets.mockRejectedValue(new Error('Network error'))

      await store.dispatch(fetchSurpriseBaskets(undefined))

      const state = store.getState().surpriseBaskets
      expect(state.loading).toBe(false)
      expect(state.error).toBe('Network error')
    })

    it('fetchMoreSurpriseBaskets should append new items', async () => {
      const preloadedState = {
        surpriseBaskets: {
          ...surpriseBasketsInitialState,
          baskets: [
            { id: 1, name: 'Panier existant', discounted_price: 1500 },
          ],
          currentPage: 1,
          lastPage: 3,
          hasMore: true,
        },
      }

      const store = createTestStore(preloadedState)
      const nextBasket = { id: 2, name: 'Nouveau panier', discounted_price: 2500 }

      mockGetSurpriseBaskets.mockResolvedValue(
        buildPaginatedResponse([nextBasket], 2, 3, 15)
      )

      await store.dispatch(fetchMoreSurpriseBaskets({ page: 2 }))

      const state = store.getState().surpriseBaskets
      expect(state.loadingMore).toBe(false)
      expect(state.baskets).toHaveLength(2)
      expect(state.baskets[1]).toMatchObject({ id: 2 })
      expect(state.currentPage).toBe(2)
      expect(state.lastPage).toBe(3)
      expect(state.hasMore).toBe(true)
      expect(state.total).toBe(15)
    })

    it('fetchSurpriseBasketById should set selected basket', async () => {
      const store = createTestStore()
      const basket = { id: 7, name: 'Panier détaillé', discounted_price: 3000 }

      mockGetSurpriseBasket.mockResolvedValue({ data: basket })

      await store.dispatch(fetchSurpriseBasketById(7))

      const state = store.getState().surpriseBaskets
      expect(state.loading).toBe(false)
      expect(state.selectedBasket).toMatchObject({ id: 7 })
      expect(state.baskets.some(item => item.id === 7)).toBe(true)
    })
  })

  describe('synchronous reducers', () => {
    it('setFilters merges filters and resets pagination', () => {
      const store = createTestStore()
      store.dispatch(setFilters({ city: 'Lomé', minPrice: 1500 }))

      const state = store.getState().surpriseBaskets
      expect(state.filters).toEqual({ city: 'Lomé', minPrice: 1500 })
      expect(state.currentPage).toBe(1)
      expect(state.lastPage).toBe(1)
      expect(state.hasMore).toBe(true)
    })

    it('clearFilters resets filters and pagination', () => {
      const preloadedState = {
        surpriseBaskets: {
          ...surpriseBasketsInitialState,
          filters: { city: 'Kara' },
          currentPage: 2,
          lastPage: 4,
          hasMore: false,
        },
      }

      const store = createTestStore(preloadedState)
      store.dispatch(clearFilters())

      const state = store.getState().surpriseBaskets
      expect(state.filters).toEqual({})
      expect(state.currentPage).toBe(1)
      expect(state.lastPage).toBe(1)
      expect(state.hasMore).toBe(true)
    })

    it('setSelectedBasket and clearSelectedBasket update state', () => {
      const store = createTestStore()
      const basket = { id: 3, name: 'Sélection', discounted_price: 1200 }

      store.dispatch(setSelectedBasket(basket))
      expect(store.getState().surpriseBaskets.selectedBasket).toMatchObject({ id: 3 })

      store.dispatch(clearSelectedBasket())
      expect(store.getState().surpriseBaskets.selectedBasket).toBeNull()
    })

    it('clearError resets error state', () => {
      const preloadedState = {
        surpriseBaskets: {
          ...surpriseBasketsInitialState,
          error: 'Some error',
        },
      }

      const store = createTestStore(preloadedState)
      store.dispatch(clearError())

      expect(store.getState().surpriseBaskets.error).toBeNull()
    })

    it('resetSurpriseBaskets restores initial state', () => {
      const preloadedState = {
        surpriseBaskets: {
          ...surpriseBasketsInitialState,
          baskets: [{ id: 1, name: 'Existing', discounted_price: 2000 }],
          filters: { city: 'Lomé' },
        },
      }

      const store = createTestStore(preloadedState)
      store.dispatch(resetSurpriseBaskets())

      expect(store.getState().surpriseBaskets).toEqual(surpriseBasketsInitialState)
    })
  })
})
