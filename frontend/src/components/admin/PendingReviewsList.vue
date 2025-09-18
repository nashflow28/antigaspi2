<template>
  <div class="bg-white rounded-2xl shadow-lg border border-gray-100">
    <div class="px-6 py-4 border-b border-gray-200">
      <div class="flex items-center justify-between">
        <h3 class="text-xl font-semibold text-neutral-900">
          Avis en attente de modération
          <span v-if="pagination" class="text-neutral-500 font-normal">
            ({{ pagination.total }} au total)
          </span>
        </h3>
        <button
          @click="loadReviews"
          class="inline-flex items-center px-3 py-1 text-sm text-primary-600 hover:text-primary-700 transition-colors"
          :disabled="loading"
        >
          <RefreshCw class="w-4 h-4 mr-1" :class="{ 'animate-spin': loading }" />
          Actualiser
        </button>
      </div>
    </div>

    <div class="divide-y divide-gray-200">
      <!-- Loading State -->
      <div v-if="loading" class="px-6 py-8 text-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
        <p class="text-gray-500 mt-2">Chargement des avis...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="reviews.length === 0" class="px-6 py-8 text-center">
        <CheckCircle class="w-12 h-12 text-green-400 mx-auto mb-4" />
        <h4 class="text-lg font-medium text-gray-900 mb-2">Aucun avis en attente</h4>
        <p class="text-gray-600">Tous les avis ont été modérés !</p>
      </div>

      <!-- Reviews List -->
      <div
        v-else
        v-for="review in reviews"
        :key="review.id"
        class="px-6 py-6 hover:bg-gray-50 transition-colors"
      >
        <ReviewModerationCard
          :review="review"
          @approved="onReviewApproved"
          @rejected="onReviewRejected"
        />
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="pagination && pagination.last_page > 1" class="px-6 py-4 border-t border-gray-200">
      <div class="flex items-center justify-between">
        <div class="text-sm text-gray-500">
          Page {{ pagination.current_page }} sur {{ pagination.last_page }}
          ({{ pagination.total }} avis au total)
        </div>
        <div class="flex space-x-2">
          <button
            @click="loadPage(pagination.current_page - 1)"
            :disabled="pagination.current_page <= 1"
            class="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Précédent
          </button>
          <button
            @click="loadPage(pagination.current_page + 1)"
            :disabled="pagination.current_page >= pagination.last_page"
            class="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
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
import { useAuthStore } from '@/stores/auth'
import ReviewModerationCard from '@/components/admin/ReviewModerationCard.vue'
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

const authStore = useAuthStore()
const reviews = ref<Review[]>([])
const pagination = ref<Pagination | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

const loadReviews = async (page: number = 1) => {
  loading.value = true
  error.value = null

  try {
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: '10'
    })

    const response = await fetch(`http://localhost:8000/api/admin/reviews/pending?${params}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authStore.token}`
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    if (data.success) {
      reviews.value = data.data
      pagination.value = data.pagination
    } else {
      throw new Error(data.message || 'Erreur lors du chargement')
    }
  } catch (err) {
    console.error('Error loading pending reviews:', err)
    error.value = err instanceof Error ? err.message : 'Erreur inconnue'
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