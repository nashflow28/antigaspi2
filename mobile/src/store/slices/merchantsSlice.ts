import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import apiService from '../../services/api'
import offlineService from '../../services/offlineService'
import { storeLogger } from '../../utils/logger'

export interface Merchant {
  id: number
  business_name: string
  business_type: string
  is_verified: boolean
  latitude: number | null
  longitude: number | null
  products_count: number
  photo_url?: string | null
  logo_url?: string | null
  average_rating?: number | null
  reviews_count?: number
  user: {
    city: string
    address: string | null
    phone: string
    photo_url?: string | null
  }
}

interface MerchantsState {
  merchants: Merchant[]
  loading: boolean
  error: string | null
}

export const merchantsInitialState: MerchantsState = {
  merchants: [],
  loading: false,
  error: null,
}

const MERCHANTS_CACHE_KEY = 'merchants_list'

const safeSetCache = async <T>(key: string, value: T): Promise<void> => {
  try {
    await offlineService.setCache(key, value)
  } catch (error) {
    storeLogger.warn('Failed to set cache:', key, error)
  }
}

const safeGetCache = async <T>(key: string): Promise<T | null> => {
  try {
    return await offlineService.getCache<T>(key)
  } catch (error) {
    storeLogger.warn('Failed to get cache:', key, error)
    return null
  }
}

const isOffline = async (): Promise<boolean> => {
  try {
    return !(await offlineService.checkConnectivity())
  } catch {
    return !offlineService.getConnectivityStatus()
  }
}

// Thunk pour récupérer la liste des marchands
export const fetchMerchants = createAsyncThunk(
  'merchants/fetchMerchants',
  async (_, { rejectWithValue }) => {
    if (await isOffline()) {
      const cached = await safeGetCache<Merchant[]>(MERCHANTS_CACHE_KEY)
      if (cached) {
        return cached
      }
    }

    try {
      const response = await apiService.getMerchants()
      if (response.success && response.data) {
        await safeSetCache(MERCHANTS_CACHE_KEY, response.data)
        return response.data
      }
      throw new Error('Erreur lors de la récupération des marchands')
    } catch (error: any) {
      const fallback = await safeGetCache<Merchant[]>(MERCHANTS_CACHE_KEY)
      if (fallback) {
        return fallback
      }
      return rejectWithValue(error.message || 'Une erreur est survenue')
    }
  }
)

const merchantsSlice = createSlice({
  name: 'merchants',
  initialState: merchantsInitialState,
  reducers: {
    clearMerchants: (state) => {
      state.merchants = []
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMerchants.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchMerchants.fulfilled, (state, action: PayloadAction<Merchant[]>) => {
        state.loading = false
        state.merchants = action.payload
      })
      .addCase(fetchMerchants.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
  },
})

export const { clearMerchants } = merchantsSlice.actions
export const merchantsReducer = merchantsSlice.reducer
export default merchantsReducer
