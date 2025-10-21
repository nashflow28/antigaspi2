import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Review } from '@/types'
import { apiService } from '@/services/api'
import { notify } from '@/composables/useNotifications'

interface ReviewsState {
  reviews: Review[]
  loading: boolean
  pagination: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}

export const useReviewsStore = defineStore('reviews', () => {
  const state = ref<ReviewsState>({
    reviews: [],
    loading: false,
    pagination: {
      current_page: 1,
      last_page: 1,
      per_page: 15,
      total: 0
    }
  })

  // Getters
  const reviews = computed(() => state.value.reviews)
  const loading = computed(() => state.value.loading)
  const pagination = computed(() => state.value.pagination)

  // Actions
  const fetchReviews = async (params: { merchantId?: number; productId?: number; page?: number; rating?: number }) => {
    try {
      state.value.loading = true
      const query: {
        merchant_id?: number
        product_id?: number
        rating?: number
        page?: number
        per_page: number
      } = {
        per_page: 15
      }

      if (params.merchantId) {
        query.merchant_id = params.merchantId
      }

      if (params.productId) {
        query.product_id = params.productId
      }

      if (params.page) {
        query.page = params.page
      }

      if (typeof params.rating === 'number') {
        query.rating = params.rating
      }

      const response = await apiService.getReviewsList(query)

      if (params.page === 1 || !params.page) {
        state.value.reviews = response.data
      } else {
        state.value.reviews.push(...response.data)
      }

      state.value.pagination = response.pagination
      return { success: true }
    } catch (err: any) {
      notify.error(err.message || 'Erreur lors du chargement des avis', 'Avis')
      return { success: false, error: err.message }
    } finally {
      state.value.loading = false
    }
  }

  const createReview = async (data: {
    merchantId: number
    productId?: number
    rating: number
    title?: string
    comment?: string
    photos?: File[]
  }) => {
    try {
      state.value.loading = true
      const response = await apiService.createReview(data)

      notify.success('Avis publié avec succès!', 'Avis', { duration: 3000 })

      // Refresh reviews list
      await fetchReviews({ merchantId: data.merchantId })

      return { success: true, data: response.data }
    } catch (err: any) {
      notify.error(err.message || 'Erreur lors de la création de l\'avis', 'Avis')
      return { success: false, error: err.message }
    } finally {
      state.value.loading = false
    }
  }

  const clearReviews = () => {
    state.value.reviews = []
    state.value.pagination = {
      current_page: 1,
      last_page: 1,
      per_page: 15,
      total: 0
    }
  }

  return {
    // State
    state,
    reviews,
    loading,
    pagination,

    // Actions
    fetchReviews,
    createReview,
    clearReviews
  }
})
