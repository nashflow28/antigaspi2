import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import apiService from '../../services/api'

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

// Thunk pour récupérer la liste des marchands
export const fetchMerchants = createAsyncThunk(
  'merchants/fetchMerchants',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiService.getMerchants()
      if (response.success && response.data) {
        return response.data
      }
      throw new Error('Erreur lors de la récupération des marchands')
    } catch (error: any) {
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
