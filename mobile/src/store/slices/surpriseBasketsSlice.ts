import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit'

import apiService from '../../services/api'
import {
  PaginatedSurpriseBaskets,
  SurpriseBasket,
  SurpriseBasketFilters,
  SurpriseBasketsState,
} from '../../types'

export const surpriseBasketsInitialState: SurpriseBasketsState = {
  baskets: [],
  selectedBasket: null,
  loading: false,
  loadingMore: false,
  error: null,
  filters: {},
  currentPage: 1,
  lastPage: 1,
  hasMore: true,
  total: 0,
}

type SurpriseBasketPagination = Pick<PaginatedSurpriseBaskets, 'current_page' | 'last_page' | 'total'>

interface SurpriseBasketListPayload {
  baskets: SurpriseBasket[]
  pagination: SurpriseBasketPagination
}

const buildListPayload = (data: PaginatedSurpriseBaskets): SurpriseBasketListPayload => ({
  baskets: data.data,
  pagination: {
    current_page: data.current_page,
    last_page: data.last_page,
    total: data.total,
  },
})

const mergeBaskets = (existing: SurpriseBasket[], incoming: SurpriseBasket[]): SurpriseBasket[] => {
  if (incoming.length === 0) {
    return existing
  }

  const result = [...existing]
  const indexById = new Map<number, number>()

  result.forEach((basket, index) => {
    indexById.set(basket.id, index)
  })

  incoming.forEach(basket => {
    const existingIndex = indexById.get(basket.id)
    if (existingIndex !== undefined) {
      result[existingIndex] = basket
    } else {
      indexById.set(basket.id, result.length)
      result.push(basket)
    }
  })

  return result
}

export const fetchSurpriseBaskets = createAsyncThunk<
  SurpriseBasketListPayload,
  (SurpriseBasketFilters & { page?: number; perPage?: number }) | undefined
>(
  'surpriseBaskets/fetchSurpriseBaskets',
  async (filters, { rejectWithValue }) => {
    try {
      const response = await apiService.getSurpriseBaskets(filters)
      return buildListPayload(response.data)
    } catch (error: any) {
      return rejectWithValue(
        error?.message ?? 'Impossible de charger les paniers surprise. Veuillez réessayer.'
      )
    }
  }
)

export const fetchMoreSurpriseBaskets = createAsyncThunk<
  SurpriseBasketListPayload,
  { page: number; filters?: SurpriseBasketFilters }
>(
  'surpriseBaskets/fetchMoreSurpriseBaskets',
  async ({ page, filters }, { rejectWithValue }) => {
    try {
      const response = await apiService.getSurpriseBaskets({ ...filters, page })
      return buildListPayload(response.data)
    } catch (error: any) {
      return rejectWithValue(
        error?.message ?? 'Impossible de charger davantage de paniers surprise.'
      )
    }
  }
)

export const fetchSurpriseBasketById = createAsyncThunk<SurpriseBasket, number>(
  'surpriseBaskets/fetchSurpriseBasketById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await apiService.getSurpriseBasket(id)
      return response.data
    } catch (error: any) {
      return rejectWithValue(
        error?.message ?? 'Impossible de charger ce panier surprise. Veuillez réessayer.'
      )
    }
  }
)

const surpriseBasketsSlice = createSlice({
  name: 'surpriseBaskets',
  initialState: surpriseBasketsInitialState,
  reducers: {
    setFilters: (state, action: PayloadAction<SurpriseBasketFilters>) => {
      state.filters = { ...state.filters, ...action.payload }
      state.currentPage = 1
      state.lastPage = 1
      state.hasMore = true
    },
    clearFilters: (state) => {
      state.filters = {}
      state.currentPage = 1
      state.lastPage = 1
      state.hasMore = true
    },
    setSelectedBasket: (state, action: PayloadAction<SurpriseBasket | null>) => {
      state.selectedBasket = action.payload
    },
    clearSelectedBasket: (state) => {
      state.selectedBasket = null
    },
    clearError: (state) => {
      state.error = null
    },
    resetSurpriseBaskets: (state) => {
      Object.assign(state, surpriseBasketsInitialState)
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSurpriseBaskets.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchSurpriseBaskets.fulfilled, (state, action) => {
        state.loading = false
        state.baskets = action.payload.baskets
        state.currentPage = action.payload.pagination.current_page
        state.lastPage = action.payload.pagination.last_page
        state.total = action.payload.pagination.total
        state.hasMore = action.payload.pagination.current_page < action.payload.pagination.last_page
      })
      .addCase(fetchSurpriseBaskets.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      .addCase(fetchMoreSurpriseBaskets.pending, (state) => {
        state.loadingMore = true
        state.error = null
      })
      .addCase(fetchMoreSurpriseBaskets.fulfilled, (state, action) => {
        state.loadingMore = false
        state.baskets = mergeBaskets(state.baskets, action.payload.baskets)
        state.currentPage = action.payload.pagination.current_page
        state.lastPage = action.payload.pagination.last_page
        state.total = action.payload.pagination.total
        state.hasMore = action.payload.pagination.current_page < action.payload.pagination.last_page
      })
      .addCase(fetchMoreSurpriseBaskets.rejected, (state, action) => {
        state.loadingMore = false
        state.error = action.payload as string
      })
      .addCase(fetchSurpriseBasketById.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchSurpriseBasketById.fulfilled, (state, action: PayloadAction<SurpriseBasket>) => {
        state.loading = false
        state.selectedBasket = action.payload
        state.baskets = mergeBaskets(state.baskets, [action.payload])
      })
      .addCase(fetchSurpriseBasketById.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
  },
})

export const {
  setFilters,
  clearFilters,
  setSelectedBasket,
  clearSelectedBasket,
  clearError,
  resetSurpriseBaskets,
} = surpriseBasketsSlice.actions

export const surpriseBasketsReducer = surpriseBasketsSlice.reducer

export default surpriseBasketsReducer
