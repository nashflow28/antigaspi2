import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { Review, ReviewStats, ReviewsState } from '../../types'
import apiService from '../../services/api'

export const reviewsInitialState: ReviewsState = {
  reviews: [],
  stats: null,
  loading: false,
  error: null,
  currentPage: 1,
  totalPages: 1,
  hasMore: false,
}

// Async thunks

/**
 * Fetch reviews for a merchant with optional filters
 * @param params - { merchantId, productId?, rating?, page?, perPage? }
 */
export const fetchReviews = createAsyncThunk(
  'reviews/fetchReviews',
  async (
    params: {
      merchantId: number
      productId?: number
      rating?: number
      page?: number
      perPage?: number
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await apiService.getReviews(params)
      return {
        reviews: response.data,
        pagination: response.pagination,
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Erreur lors du chargement des avis')
    }
  }
)

/**
 * Fetch review statistics for a merchant
 * @param merchantId - ID du commerçant
 */
export const fetchReviewStats = createAsyncThunk(
  'reviews/fetchStats',
  async (merchantId: number, { rejectWithValue }) => {
    try {
      const response = await apiService.getReviewStats(merchantId)
      return response.data as ReviewStats
    } catch (error: any) {
      return rejectWithValue(error.message || 'Erreur lors du chargement des statistiques')
    }
  }
)

/**
 * Create a new review
 * @param data - { merchantId, productId?, rating, title?, comment? }
 */
export const createReview = createAsyncThunk(
  'reviews/create',
  async (
    data: {
      merchantId: number
      productId?: number
      rating: number
      title?: string
      comment?: string
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await apiService.createReview(data)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.message || 'Erreur lors de la création de l\'avis')
    }
  }
)

/**
 * Update an existing review
 * @param params - { reviewId, rating, title?, comment? }
 */
export const updateReview = createAsyncThunk(
  'reviews/update',
  async (
    params: {
      reviewId: number
      rating: number
      title?: string
      comment?: string
    },
    { rejectWithValue }
  ) => {
    try {
      const { reviewId, ...data } = params
      const response = await apiService.updateReview(reviewId, data)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.message || 'Erreur lors de la modification de l\'avis')
    }
  }
)

/**
 * Delete a review
 * @param reviewId - ID de l'avis à supprimer
 */
export const deleteReview = createAsyncThunk(
  'reviews/delete',
  async (reviewId: number, { rejectWithValue }) => {
    try {
      await apiService.deleteReview(reviewId)
      return reviewId
    } catch (error: any) {
      return rejectWithValue(error.message || 'Erreur lors de la suppression de l\'avis')
    }
  }
)

const reviewsSlice = createSlice({
  name: 'reviews',
  initialState: reviewsInitialState,
  reducers: {
    clearReviews: (state) => {
      state.reviews = []
      state.currentPage = 1
      state.totalPages = 1
      state.hasMore = false
    },
    clearError: (state) => {
      state.error = null
    },
    resetReviewsState: () => reviewsInitialState,
  },
  extraReducers: (builder) => {
    // Fetch Reviews
    builder
      .addCase(fetchReviews.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchReviews.fulfilled, (state, action) => {
        state.loading = false
        const { reviews, pagination } = action.payload

        if (pagination && pagination.current_page === 1) {
          // First page: replace all reviews
          state.reviews = reviews
        } else {
          // Subsequent pages: append reviews
          state.reviews = [...state.reviews, ...reviews]
        }

        if (pagination) {
          state.currentPage = pagination.current_page
          state.totalPages = pagination.last_page
          state.hasMore = pagination.current_page < pagination.last_page
        }
      })
      .addCase(fetchReviews.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })

    // Fetch Stats
    builder
      .addCase(fetchReviewStats.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchReviewStats.fulfilled, (state, action) => {
        state.loading = false
        state.stats = action.payload
      })
      .addCase(fetchReviewStats.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })

    // Create Review
    builder
      .addCase(createReview.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createReview.fulfilled, (state, action) => {
        state.loading = false
        // Optionally prepend the new review to the list (API doesn't return full review)
        // We'll refetch reviews after creation instead
      })
      .addCase(createReview.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })

    // Update Review
    builder
      .addCase(updateReview.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(updateReview.fulfilled, (state, action) => {
        state.loading = false
        // Update the review in the list
        const updatedReview = action.payload
        const index = state.reviews.findIndex((r) => r.id === updatedReview.id)
        if (index !== -1) {
          state.reviews[index] = { ...state.reviews[index], ...updatedReview }
        }
      })
      .addCase(updateReview.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })

    // Delete Review
    builder
      .addCase(deleteReview.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(deleteReview.fulfilled, (state, action) => {
        state.loading = false
        // Remove the review from the list
        const reviewId = action.payload
        state.reviews = state.reviews.filter((r) => r.id !== reviewId)
      })
      .addCase(deleteReview.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
  },
})

export const { clearReviews, clearError, resetReviewsState } = reviewsSlice.actions
export const reviewsReducer = reviewsSlice.reducer
export default reviewsReducer
