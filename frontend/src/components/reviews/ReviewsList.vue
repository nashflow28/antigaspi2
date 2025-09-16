<template>
  <div class="bg-white rounded-2xl shadow-lg border border-gray-100">
    <!-- Header -->
    <div class="px-6 py-4 border-b border-gray-200">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
            <MessageSquare class="w-5 h-5 text-yellow-600" />
          </div>
          <div>
            <h3 class="text-lg font-semibold text-gray-900">
              Avis clients ({{ stats?.total_reviews || 0 }})
            </h3>
            <div v-if="stats && stats.total_reviews > 0" class="flex items-center space-x-2">
              <div class="flex items-center">
                <Star class="w-4 h-4 text-yellow-400 fill-yellow-400" />
                <span class="ml-1 text-sm font-medium text-gray-900">{{ stats.average_rating }}</span>
              </div>
              <span class="text-xs text-gray-500">sur {{ stats.total_reviews }} avis</span>
            </div>
          </div>
        </div>

        <!-- Filter Dropdown -->
        <div class="relative">
          <select
            v-model="currentFilter"
            @change="fetchReviews"
            class="text-sm border border-gray-300 rounded-lg px-3 py-1 focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
          >
            <option value="">Tous les avis</option>
            <option value="5">5 étoiles</option>
            <option value="4">4 étoiles</option>
            <option value="3">3 étoiles</option>
            <option value="2">2 étoiles</option>
            <option value="1">1 étoile</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Rating Statistics -->
    <div v-if="stats && stats.total_reviews > 0" class="px-6 py-4 border-b border-gray-200">
      <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div
          v-for="rating in stats.rating_distribution"
          :key="rating.rating"
          class="flex items-center space-x-2"
        >
          <div class="flex items-center space-x-1 text-xs text-gray-600 w-16">
            <span>{{ rating.rating }}</span>
            <Star class="w-3 h-3 text-yellow-400 fill-yellow-400" />
          </div>
          <div class="flex-1 bg-gray-200 rounded-full h-2">
            <div
              class="bg-yellow-400 h-2 rounded-full transition-all duration-300"
              :style="{ width: rating.percentage + '%' }"
            ></div>
          </div>
          <span class="text-xs text-gray-500 w-8">{{ rating.count }}</span>
        </div>
      </div>
    </div>

    <!-- Reviews List -->
    <div class="divide-y divide-gray-200">
      <div v-if="loading" class="px-6 py-8 text-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600 mx-auto"></div>
        <p class="text-gray-500 mt-2">Chargement des avis...</p>
      </div>

      <div v-else-if="reviews.length === 0" class="px-6 py-8 text-center">
        <MessageSquare class="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h4 class="text-lg font-medium text-gray-900 mb-2">Aucun avis</h4>
        <p class="text-gray-600">
          {{ currentFilter ? 'Aucun avis avec cette note' : 'Soyez le premier à laisser un avis !' }}
        </p>
      </div>

      <div
        v-else
        v-for="review in reviews"
        :key="review.id"
        class="px-6 py-4 hover:bg-gray-50 transition-colors"
      >
        <div class="flex space-x-4">
          <!-- User Avatar -->
          <div class="flex-shrink-0">
            <div class="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span class="text-white text-sm font-medium">
                {{ getInitials(review.user.name) }}
              </span>
            </div>
          </div>

          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center space-x-2">
                <span class="font-medium text-gray-900">{{ review.user.name }}</span>
                <div class="flex items-center">
                  <Star
                    v-for="star in 5"
                    :key="star"
                    class="w-4 h-4"
                    :class="star <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'"
                  />
                </div>
                <span v-if="review.is_verified_purchase" class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                  <ShieldCheck class="w-3 h-3 mr-1" />
                  Achat vérifié
                </span>
              </div>
              <span class="text-sm text-gray-500">{{ review.time_ago }}</span>
            </div>

            <div v-if="review.title" class="mb-2">
              <h4 class="font-medium text-gray-900">{{ review.title }}</h4>
            </div>

            <div v-if="review.comment" class="text-gray-700 text-sm leading-relaxed mb-2">
              {{ review.comment }}
            </div>

            <div v-if="review.product" class="inline-flex items-center text-xs text-blue-600 bg-blue-50 rounded-full px-2 py-1">
              <Package class="w-3 h-3 mr-1" />
              {{ review.product.name }}
            </div>

            <!-- Edit/Delete buttons for user's own reviews -->
            <div v-if="authStore.isAuthenticated && authStore.user?.id === review.user.id" class="flex space-x-2 mt-3">
              <button
                @click="editingReviewId = review.id"
                class="inline-flex items-center px-3 py-1 text-xs text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-full transition-colors"
              >
                <Edit class="w-3 h-3 mr-1" />
                Modifier
              </button>
            </div>
          </div>
        </div>

        <!-- Edit Review Form -->
        <div v-if="editingReviewId === review.id" class="mt-4">
          <EditReviewForm
            :review-id="review.id"
            @success="onReviewUpdated"
            @deleted="onReviewDeleted"
            @cancel="editingReviewId = null"
          />
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="pagination && pagination.last_page > 1" class="px-6 py-4 border-t border-gray-200">
      <div class="flex items-center justify-between">
        <div class="text-sm text-gray-500">
          Page {{ pagination.current_page }} sur {{ pagination.last_page }}
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
import { ref, onMounted, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { MessageSquare, Star, ShieldCheck, Package, Edit, Trash2 } from 'lucide-vue-next'
import EditReviewForm from './EditReviewForm.vue'

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
  }
  product?: {
    id: number
    name: string
  }
}

interface Stats {
  total_reviews: number
  average_rating: number
  verified_reviews: number
  rating_distribution: Array<{
    rating: number
    count: number
    percentage: number
  }>
}

interface Props {
  merchantId: number
  productId?: number
}

const props = defineProps<Props>()
const emit = defineEmits<{
  statsUpdated: [stats: Stats]
}>()

const authStore = useAuthStore()

const reviews = ref<Review[]>([])
const stats = ref<Stats | null>(null)
const pagination = ref<any>(null)
const loading = ref(false)
const currentFilter = ref('')
const editingReviewId = ref<number | null>(null)

const getInitials = (name: string) => {
  return name.split(' ').map(part => part[0]).join('').toUpperCase().slice(0, 2)
}

const fetchStats = async () => {
  try {
    const params = new URLSearchParams({ merchant_id: props.merchantId.toString() })
    const response = await fetch(`http://localhost:8000/api/reviews/stats?${params}`)
    const data = await response.json()

    if (data.success) {
      stats.value = data.data
      emit('statsUpdated', data.data)
    }
  } catch (error) {
    console.error('Error fetching review stats:', error)
  }
}

const fetchReviews = async (page: number = 1) => {
  loading.value = true

  try {
    const params = new URLSearchParams({
      merchant_id: props.merchantId.toString(),
      page: page.toString()
    })

    if (props.productId) {
      params.append('product_id', props.productId.toString())
    }

    if (currentFilter.value) {
      params.append('rating', currentFilter.value)
    }

    const response = await fetch(`http://localhost:8000/api/reviews?${params}`)
    const data = await response.json()

    if (data.success) {
      reviews.value = data.data
      pagination.value = data.pagination
    }
  } catch (error) {
    console.error('Error fetching reviews:', error)
  } finally {
    loading.value = false
  }
}

const loadPage = (page: number) => {
  if (page >= 1 && page <= (pagination.value?.last_page || 1)) {
    fetchReviews(page)
  }
}

const onReviewUpdated = (updatedReview: any) => {
  // Update the review in the list
  const index = reviews.value.findIndex(r => r.id === updatedReview.id)
  if (index !== -1) {
    reviews.value[index] = {
      ...reviews.value[index],
      ...updatedReview
    }
  }
  editingReviewId.value = null
  // Refresh stats
  fetchStats()
}

const onReviewDeleted = () => {
  editingReviewId.value = null
  // Refresh the entire list
  fetchReviews()
  fetchStats()
}

watch(() => props.merchantId, () => {
  fetchStats()
  fetchReviews()
})

onMounted(() => {
  fetchStats()
  fetchReviews()
})
</script>