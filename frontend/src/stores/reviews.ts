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
  const fetchReviews = async (params: { merchantId?: number; productId?: number; page?: number }) => {
    try {
      state.value.loading = true
      const response = await apiService.getReviewsList({
        merchant_id: params.merchantId!,
        product_id: params.productId,
        page: params.page,
        per_page: 15
      })

      if (params.page === 1 || !params.page) {
        state.value.reviews = response.data
      } else {
        state.value.reviews.push(...response.data)
      }

      if (response.pagination) {
        state.value.pagination = response.pagination
      }
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
  }) => {
    try {
      state.value.loading = true
      const response = await apiService.createReview({
        merchant_id: data.merchantId,
        product_id: data.productId,
        rating: data.rating,
        title: data.title,
        comment: data.comment
      })

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
