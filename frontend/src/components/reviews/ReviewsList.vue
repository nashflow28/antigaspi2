<template>
  <div class="bg-white rounded shadow-lg border border-gray-100">
    <!-- Header -->
    <div class="px-4 py-4 border-b border-gray-200">
      <div class="flex items-center justify-start sm:justify-between">
        <div class="flex items-center space-y-2 sm:space-x-3">
          <div class="h-6 w-6 bg-yellow-100 rounded flex items-center justify-center">
            <MessageSquare class="h-4 w-4 text-yellow-500" />
          </div>
          <div>
            <h3 class="text-lg font-semibold text-gray-900">
              Avis clients ({{ stats?.total_reviews || 0 }})
            </h3>
            <div v-if="stats && stats.total_reviews > 0" class="flex items-center space-y-4 sm:space-x-2">
              <div class="flex items-center">
                <Star class="h-4 w-4 text-yellow-400 fill-yellow-400" />
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
            class="text-sm border border-gray-300 rounded px-3 py-3 focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            @change="() => fetchReviews()"
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
    <div v-if="stats && stats.total_reviews > 0" class="px-4 py-4 border-b border-gray-200">
      <div class="grid grid-cols-1 md:grid-cols-5 gap-3">
        <div
          v-for="rating in stats.rating_distribution"
          :key="rating.rating"
          class="flex items-center space-y-4 sm:space-x-2"
        >
          <div class="flex items-center space-y-4 sm:space-x-2 text-xs text-gray-700 w-12">
            <span>{{ rating.rating }}</span>
            <Star class="w-xs h-3 text-yellow-400 fill-yellow-400" />
          </div>
          <div class="flex-1 bg-gray-200 rounded-full h-4">
            <div
              class="bg-yellow-400 h-4 rounded-full transition-all duration-300"
              :style="{ width: rating.percentage + '%' }"
            />
          </div>
          <span class="text-xs text-gray-500 w-12">{{ rating.count }}</span>
        </div>
      </div>
    </div>

    <!-- Reviews List -->
    <div class="divide-y divide-neutral-200">
      <div v-if="loading" class="px-4 py-6 sm:py-8 text-left sm:text-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600 mx-auto" />
        <p class="text-gray-500 mt-2">Chargement des avis...</p>
      </div>

      <div v-else-if="reviews.length === 0" class="px-4 py-6 sm:py-8 text-left sm:text-center">
        <MessageSquare class="w-12 h-10 text-gray-400 mx-auto mt-3" />
        <h4 class="text-lg font-medium text-gray-900 mt-2">Aucun avis</h4>
        <p class="text-gray-700">
          {{ currentFilter ? 'Aucun avis avec cette note' : 'Soyez le premier à laisser un avis !' }}
        </p>
      </div>

      <div
        v-for="review in reviews"
        v-else
        :key="review.id"
        class="px-4 py-4 hover:transition-colors"
      >
        <div class="flex space-y-4 sm:space-x-4">
          <!-- User Avatar -->
          <div class="flex-shrink-0">
            <div class="h-6 w-6 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
              <span class="text-white text-sm font-medium">
                {{ getInitials(review.user.name) }}
              </span>
            </div>
          </div>

          <div class="flex-1 min-w-none">
            <div class="flex items-center justify-start sm:justify-between mt-2">
              <div class="flex items-center space-y-4 sm:space-x-2">
                <span class="font-medium text-gray-900">{{ review.user.name }}</span>
                <div class="flex items-center">
                  <Star
                    v-for="star in 5"
                    :key="star"
                    class="h-4 w-4"
                    :class="star <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-500'"
                  />
                </div>
                <span v-if="review.is_verified_purchase" class="inline-flex items-center px-3 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                  <ShieldCheck class="w-xs h-3 mr-1" />
                  Achat vérifié
                </span>
              </div>
              <span class="text-sm text-gray-500">{{ review.time_ago }}</span>
            </div>

            <div v-if="review.title" class="mt-2">
              <h4 class="font-medium text-gray-900">{{ review.title }}</h4>
            </div>

            <div v-if="review.comment" class="text-gray-800 text-sm leading-relaxed mt-2">
              {{ review.comment }}
            </div>

            <div v-if="review.photos?.length" class="mt-3 flex flex-wrap gap-3">
              <img
                v-for="photo in review.photos"
                :key="photo.id"
                :src="photo.url"
                alt="Photo associée à l'avis"
                class="h-20 w-20 rounded-lg object-cover border border-gray-200"
              >
            </div>

            <div v-if="review.product" class="inline-flex items-center text-xs text-info bg-blue-50 rounded-full px-3 py-3">
              <Package class="w-xs h-3 mr-1" />
              {{ review.product.name }}
            </div>

            <!-- Action buttons -->
            <div v-if="authStore.isAuthenticated" class="flex space-y-4 sm:space-x-2 mt-3">
              <!-- Edit button for user's own reviews -->
              <button
                v-if="authStore.user?.id === review.user.id"
                class="inline-flex items-center px-3 py-3 text-xs text-info bg-blue-50 hover:transition-colors"
                @click="editingReviewId = review.id"
              >
                <Edit class="w-xs h-3 mr-1" />
                Modifier
              </button>

              <!-- Report button for other users' reviews (consumers only) -->
              <button
                v-if="authStore.user?.id !== review.user.id && authStore.isConsumer"
                class="inline-flex items-center px-3 py-3 text-xs text-red-600 bg-red-50 hover:transition-colors"
                @click="reportingReviewId = review.id"
              >
                <Flag class="w-xs h-3 mr-1" />
                Signaler
              </button>

              <!-- Reply button for merchants -->
              <button
                v-if="authStore.isMerchant"
                class="inline-flex items-center px-3 py-3 text-xs text-green-600 bg-green-50 hover:transition-colors"
                @click="replyingToReviewId = review.id"
              >
                <Reply class="w-xs h-3 mr-1" />
                Répondre
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

        <!-- Report Review Modal -->
        <div v-if="reportingReviewId === review.id" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[120]">
          <div class="bg-white rounded p-6 max-w-xl w-full mx-lg">
            <h3 class="text-lg font-semibold text-gray-900 mt-3">Signaler cet avis</h3>
            <p class="text-gray-700 mt-3">
              Pourquoi souhaitez-vous signaler cet avis ?
            </p>
            <div class="space-y-4 mt-4">
              <label class="flex items-center">
                <input
                  v-model="reportReason"
                  type="radio"
                  value="inappropriate"
                  class="mr-2"
                >
                Contenu inapproprié
              </label>
              <label class="flex items-center">
                <input
                  v-model="reportReason"
                  type="radio"
                  value="spam"
                  class="mr-2"
                >
                Spam ou contenu commercial
              </label>
              <label class="flex items-center">
                <input
                  v-model="reportReason"
                  type="radio"
                  value="fake"
                  class="mr-2"
                >
                Avis faux ou trompeur
              </label>
              <label class="flex items-center">
                <input
                  v-model="reportReason"
                  type="radio"
                  value="offensive"
                  class="mr-2"
                >
                Langage offensant
              </label>
            </div>
            <div class="flex justify-center sm:justify-end space-y-2 sm:space-x-3">
              <button
                class="px-3 py-3 text-gray-700 bg-gray-100 rounded hover:transition-colors"
                @click="reportingReviewId = null; reportReason = ''"
              >
                Annuler
              </button>
              <button
                class="px-3 py-3 bg-red-600 text-white rounded hover:transition-colors"
                @click="submitReport(review.id)"
              >
                Signaler
              </button>
            </div>
          </div>
        </div>

        <!-- Reply to Review Modal -->
        <div v-if="replyingToReviewId === review.id" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[120]">
          <div class="bg-white rounded p-6 max-w-xl w-full mx-lg">
            <h3 class="text-lg font-semibold text-gray-900 mt-3">Répondre à cet avis</h3>
            <p class="text-sm text-gray-700 mt-3">
              Répondez de manière professionnelle et constructive à l'avis de {{ review.user.name }}.
            </p>
            <textarea
              v-model="replyText"
              placeholder="Écrivez votre réponse..."
              class="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent"
              rows="4"
              maxlength="500"
            />
            <div class="text-xs text-gray-500 mt-1">
              {{ replyText?.length || 0 }}/500 caractères
            </div>
            <div class="flex justify-center sm:justify-end space-y-2 sm:space-x-3 mt-4">
              <button
                class="px-3 py-3 text-gray-700 bg-gray-100 rounded hover:transition-colors"
                @click="replyingToReviewId = null; replyText = ''"
              >
                Annuler
              </button>
              <button
                :disabled="!replyText?.trim()"
                class="px-3 py-3 bg-blue-600 text-white rounded hover:transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                @click="submitReply(review.id)"
              >
                Répondre
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="pagination && pagination.last_page > 1" class="px-4 py-4 border-t border-gray-200">
      <div class="flex items-center justify-start sm:justify-between">
        <div class="text-sm text-gray-500">
          Page {{ pagination.current_page }} sur {{ pagination.last_page }}
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
import { ref, onMounted, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { MessageSquare, Star, ShieldCheck, Package, Edit, Flag, Reply } from 'lucide-vue-next'
import EditReviewForm from './EditReviewForm.vue'
import apiService from '@/services/api'
import { notify } from '@/composables/useNotifications'
import type { ApiResponse, Review, ReviewStats } from '@/types'

interface Props {
  merchantId: number
  productId?: number
}

const props = defineProps<Props>()
const emit = defineEmits<{
  statsUpdated: [stats: ReviewStats]
}>()

const authStore = useAuthStore()

const reviews = ref<Review[]>([])
const stats = ref<ReviewStats | null>(null)
type ReviewsPagination = ApiResponse<Review[]>['pagination']
const pagination = ref<ReviewsPagination | null>(null)
const loading = ref(false)
const currentFilter = ref('')
const editingReviewId = ref<number | null>(null)
const reportingReviewId = ref<number | null>(null)
const replyingToReviewId = ref<number | null>(null)
const replyText = ref('')
const reportReason = ref('')

const getInitials = (name: string) => {
  return name.split(' ').map(part => part[0]).join('').toUpperCase().slice(0, 2)
}

const fetchStats = async (): Promise<void> => {
  if (!props.merchantId) {
    stats.value = null
    return
  }

  try {
    const response = await apiService.getReviewStats({
      merchant_id: props.merchantId,
      ...(props.productId ? { product_id: props.productId } : {})
    })

    if (response.success) {
      stats.value = response.data
      emit('statsUpdated', response.data)
    } else {
      const message = response.message || "Impossible de récupérer les statistiques d'avis du commerçant."
      notify.error(message, 'Avis commerçants')
    }
  } catch (error) {
    const message = error instanceof Error
      ? error.message
      : "Impossible de récupérer les statistiques d'avis du commerçant."
    notify.error(message, 'Avis commerçants')
  }
}

const fetchReviews = async (page = 1): Promise<void> => {
  if (!props.merchantId) {
    reviews.value = []
    pagination.value = null
    return
  }

  loading.value = true

  try {
    const response = await apiService.getReviewsList({
      merchant_id: props.merchantId,
      page,
      ...(props.productId ? { product_id: props.productId } : {}),
      ...(currentFilter.value ? { rating: currentFilter.value } : {})
    })

    if (response.success) {
      reviews.value = response.data ?? []
      pagination.value = response.pagination ?? null
    } else {
      reviews.value = []
      pagination.value = null
      const message = response.message || 'Impossible de charger les avis du commerçant.'
      notify.error(message, 'Avis commerçants')
    }
  } catch (error) {
    reviews.value = []
    pagination.value = null
    const message = error instanceof Error
      ? error.message
      : 'Impossible de charger les avis du commerçant.'
    notify.error(message, 'Avis commerçants')
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
  fetchReviews(pagination.value?.current_page || 1)
}

const onReviewDeleted = () => {
  editingReviewId.value = null
  // Refresh the entire list
  fetchReviews(pagination.value?.current_page || 1)
  fetchStats()
}

const submitReport = async (reviewId: number) => {
  if (!reportReason.value) {
    notify.warning('Veuillez sélectionner une raison de signalement.', 'Avis commerçants')
    return
  }

  try {
    const response = await apiService.reportReview(reviewId, reportReason.value)

    if (response.success) {
      notify.success(
        response.message || 'Avis signalé avec succès. Notre équipe va examiner votre signalement.',
        'Avis commerçants'
      )
      reportingReviewId.value = null
      reportReason.value = ''
    } else {
      notify.error(response.message || 'Erreur lors du signalement de cet avis.', 'Avis commerçants')
    }
  } catch (error) {
    const message = error instanceof Error
      ? error.message
      : 'Erreur lors du signalement de cet avis. Veuillez réessayer.'
    notify.error(message, 'Avis commerçants')
  }
}

const submitReply = async (reviewId: number) => {
  if (!replyText.value.trim()) {
    notify.warning('Veuillez écrire une réponse avant de la publier.', 'Avis commerçants')
    return
  }

  try {
    const response = await apiService.replyToReview(reviewId, replyText.value.trim())

    if (response.success) {
      notify.success(response.message || 'Réponse publiée avec succès !', 'Avis commerçants')
      replyingToReviewId.value = null
      replyText.value = ''
      // Refresh reviews to show the new reply
      fetchReviews(pagination.value?.current_page || 1)
    } else {
      notify.error(response.message || 'Erreur lors de la publication de la réponse.', 'Avis commerçants')
    }
  } catch (error) {
    const message = error instanceof Error
      ? error.message
      : 'Erreur lors de la publication de la réponse. Veuillez réessayer.'
    notify.error(message, 'Avis commerçants')
  }
}

// Expose refresh method to parent
const refreshReviews = async () => {
  await fetchStats()
  await fetchReviews(pagination.value?.current_page || 1)
}

// Expose methods to parent component
defineExpose({
  refreshReviews
})

watch(() => props.merchantId, () => {
  fetchStats()
  fetchReviews()
})

watch(() => props.productId, () => {
  fetchStats()
  fetchReviews()
})

onMounted(() => {
  fetchStats()
  fetchReviews()
})
</script>
