<template>
  <div class="bg-white rounded shadow-lg border border-gray-100">
    <div class="px-4 py-4 border-b border-gray-200">
      <div class="flex items-center justify-start sm:justify-between">
        <h3 class="text-xl font-semibold text-gray-900">
          Avis en attente de modération
          <span v-if="pagination" class="text-gray-500 font-normal">
            ({{ pagination.total }} au total)
          </span>
        </h3>
        <button
          class="inline-flex items-center px-3 py-3 text-sm text-blue-600 hover:transition-colors"
          :disabled="loading"
          @click="() => loadReviews()"
        >
          <RefreshCw class="h-4 w-4 mr-1" :class="{ 'animate-spin': loading }" />
          Actualiser
        </button>
      </div>
    </div>

    <div class="divide-y divide-neutral-200">
      <!-- Loading State -->
      <div v-if="loading" class="px-4 py-6 sm:py-8 text-left sm:text-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
        <p class="text-gray-500 mt-2">Chargement des avis...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="reviews.length === 0" class="px-4 py-6 sm:py-8 text-left sm:text-center">
        <CheckCircle class="w-12 h-10 text-blue-400 mx-auto mt-3" />
        <h4 class="text-lg font-medium text-gray-900 mt-2">Aucun avis en attente</h4>
        <p class="text-gray-700">Tous les avis ont été modérés !</p>
      </div>

      <!-- Reviews List -->
      <div
        v-for="review in reviews"
        v-else
        :key="review.id"
        class="px-4 py-6 hover:transition-colors"
      >
        <ReviewModerationCard
          :review="review"
          @approved="onReviewApproved"
          @rejected="onReviewRejected"
        />
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="pagination && pagination.last_page > 1" class="px-4 py-4 border-t border-gray-200">
      <div class="flex items-center justify-start sm:justify-between">
        <div class="text-sm text-gray-500">
          Page {{ pagination.current_page }} sur {{ pagination.last_page }}
          ({{ pagination.total }} avis au total)
        </div>
        <div class="flex space-y-4 sm:space-x-2">
          <button
            :disabled="pagination.current_page <= 1"
            class="px-3 py-3 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            @click="loadPage(pagination.current_page - 1)"
          >
            Précédent
          </button>
          <button
            :disabled="pagination.current_page >= pagination.last_page"
            class="px-3 py-3 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            @click="loadPage(pagination.current_page + 1)"
          >
            Suivant
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import ReviewModerationCard from '@/components/admin/ReviewModerationCard.vue'
import { notify } from '@/composables/useNotifications'
import apiService from '@/services/api'
import {
  RefreshCw,
  CheckCircle
} from 'lucide-vue-next'

interface Review {
  id: number
  rating: number
  title: string
  comment: string
  time_ago: string
  is_verified_purchase: boolean
  user: {
    id: number
    name: string
    email: string
  }
  merchant: {
    id: number
    business_name: string
    owner_name: string
  }
  product?: {
    id: number
    name: string
  }
  merchant_response?: string
  created_at: string
}

interface Pagination {
  current_page: number
  last_page: number
  per_page: number
  total: number
}

const emit = defineEmits<{
  reviewApproved: []
  reviewRejected: []
}>()

const reviews = ref<Review[]>([])
const pagination = ref<Pagination | null>(null)
const loading = ref(false)

const loadReviews = async (page: number = 1) => {
  loading.value = true

  try {
    const response = await apiService.getPendingReviews({
      page,
      perPage: 10
    })

    if (response.success) {
      reviews.value = response.data
      pagination.value = response.pagination ?? null
    } else {
      const message = response.message || 'Erreur lors du chargement des avis en attente'
      notify.error(message, 'Modération des avis')
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur lors du chargement des avis en attente'
    notify.error(message, 'Modération des avis')
  } finally {
    loading.value = false
  }
}

const loadPage = (page: number) => {
  if (page >= 1 && page <= (pagination.value?.last_page || 1)) {
    loadReviews(page)
  }
}

const onReviewApproved = (reviewId: number) => {
  // Remove the review from the list
  reviews.value = reviews.value.filter(r => r.id !== reviewId)

  // Update pagination count
  if (pagination.value) {
    pagination.value.total = Math.max(0, pagination.value.total - 1)
  }

  emit('reviewApproved')
}

const onReviewRejected = (reviewId: number) => {
  // Remove the review from the list
  reviews.value = reviews.value.filter(r => r.id !== reviewId)

  // Update pagination count
  if (pagination.value) {
    pagination.value.total = Math.max(0, pagination.value.total - 1)
  }

  emit('reviewRejected')
}

onMounted(() => {
  loadReviews()
})
</script>
