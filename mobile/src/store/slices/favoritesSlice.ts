import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { FavoritesState, Product } from '../../types'
import apiService from '../../services/api'

const initialState: FavoritesState = {
  favoriteIds: [], // Cache local des IDs favoris pour accès rapide
  favorites: [], // Produits favoris complets (pour écran Favoris)
  loading: false,
  error: null,
}

// Actions asynchrones
export const fetchFavorites = createAsyncThunk(
  'favorites/fetchFavorites',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiService.getFavorites()
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.message || 'Erreur lors de la récupération des favoris')
    }
  }
)

export const fetchFavoriteIds = createAsyncThunk(
  'favorites/fetchFavoriteIds',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiService.getFavoriteIds()
      return response.data // Array of product IDs
    } catch (error: any) {
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
  initialState,
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
export default favoritesSlice.reducer
