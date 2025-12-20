import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { FavoritesState, Product } from '../../types'
import apiService from '../../services/api'
import offlineService from '../../services/offlineService'
import { storeLogger } from '../../utils/logger'

export const favoritesInitialState: FavoritesState = {
  favoriteIds: [], // Cache local des IDs favoris pour accès rapide
  favorites: [], // Produits favoris complets (pour écran Favoris)
  loading: false,
  error: null,
}

const FAVORITES_CACHE_KEY = 'favorites_list'
const FAVORITE_IDS_CACHE_KEY = 'favorite_ids'

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

// Actions asynchrones
export const fetchFavorites = createAsyncThunk(
  'favorites/fetchFavorites',
  async (_, { rejectWithValue }) => {
    if (await isOffline()) {
      const cached = await safeGetCache<Product[]>(FAVORITES_CACHE_KEY)
      if (cached) {
        return cached
      }
    }

    try {
      const response = await apiService.getFavorites()
      await safeSetCache(FAVORITES_CACHE_KEY, response.data)
      return response.data
    } catch (error: any) {
      const fallback = await safeGetCache<Product[]>(FAVORITES_CACHE_KEY)
      if (fallback) {
        return fallback
      }
      return rejectWithValue(error.message || 'Erreur lors de la récupération des favoris')
    }
  }
)

export const fetchFavoriteIds = createAsyncThunk(
  'favorites/fetchFavoriteIds',
  async (_, { rejectWithValue }) => {
    if (await isOffline()) {
      const cached = await safeGetCache<number[]>(FAVORITE_IDS_CACHE_KEY)
      if (cached) {
        return cached
      }
    }

    try {
      const response = await apiService.getFavoriteIds()
      await safeSetCache(FAVORITE_IDS_CACHE_KEY, response.data)
      return response.data // Array of product IDs
    } catch (error: any) {
      const fallback = await safeGetCache<number[]>(FAVORITE_IDS_CACHE_KEY)
      if (fallback) {
        return fallback
      }
      return rejectWithValue(error.message || 'Erreur lors de la récupération des IDs favoris')
    }
  }
)

export const toggleFavorite = createAsyncThunk(
  'favorites/toggleFavorite',
  async (productId: number, { rejectWithValue }) => {
    try {
      const response = await apiService.toggleFavorite(productId)
      return {
        productId,
        isFavorite: response.is_favorite,
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Erreur lors de la modification du favori')
    }
  }
)

export const checkFavorite = createAsyncThunk(
  'favorites/checkFavorite',
  async (productId: number, { rejectWithValue }) => {
    try {
      const response = await apiService.checkFavorite(productId)
      return {
        productId,
        isFavorite: response.is_favorite,
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Erreur lors de la vérification du favori')
    }
  }
)

const favoritesSlice = createSlice({
  name: 'favorites',
  initialState: favoritesInitialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    // Synchronous toggle for optimistic UI update
    optimisticToggleFavorite: (state, action: PayloadAction<number>) => {
      const productId = action.payload
      if (state.favoriteIds.includes(productId)) {
        state.favoriteIds = state.favoriteIds.filter(id => id !== productId)
        state.favorites = state.favorites.filter(p => p.id !== productId)
      } else {
        state.favoriteIds.push(productId)
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch favorites (full details)
      .addCase(fetchFavorites.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchFavorites.fulfilled, (state, action: PayloadAction<Product[]>) => {
        state.loading = false
        state.favorites = action.payload
        state.favoriteIds = action.payload.map(p => p.id)
        state.error = null
      })
      .addCase(fetchFavorites.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })

      // Fetch favorite IDs (lightweight batch check)
      .addCase(fetchFavoriteIds.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchFavoriteIds.fulfilled, (state, action: PayloadAction<number[]>) => {
        state.loading = false
        state.favoriteIds = action.payload
        state.error = null
      })
      .addCase(fetchFavoriteIds.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })

      // Toggle favorite
      .addCase(toggleFavorite.pending, (state) => {
        // Keep UI responsive (loading indicator optional)
        state.error = null
      })
      .addCase(toggleFavorite.fulfilled, (state, action) => {
        const { productId, isFavorite } = action.payload
        if (isFavorite) {
          // Added to favorites
          if (!state.favoriteIds.includes(productId)) {
            state.favoriteIds.push(productId)
          }
        } else {
          // Removed from favorites
          state.favoriteIds = state.favoriteIds.filter(id => id !== productId)
          state.favorites = state.favorites.filter(p => p.id !== productId)
        }
        state.error = null
      })
      .addCase(toggleFavorite.rejected, (state, action) => {
        state.error = action.payload as string
      })

      // Check favorite
      .addCase(checkFavorite.fulfilled, (state, action) => {
        const { productId, isFavorite } = action.payload
        if (isFavorite && !state.favoriteIds.includes(productId)) {
          state.favoriteIds.push(productId)
        } else if (!isFavorite) {
          state.favoriteIds = state.favoriteIds.filter(id => id !== productId)
        }
      })
  },
})

export const { clearError, optimisticToggleFavorite } = favoritesSlice.actions
export const favoritesReducer = favoritesSlice.reducer
export default favoritesReducer
