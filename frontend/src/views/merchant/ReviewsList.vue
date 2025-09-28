<template>
  <DashboardLayout
    :sidebar="sidebar"
    :header="header"
    class="bg-gradient-to-br from-gray-50 to-gray-100"
  >
    <!-- Header -->
    <div class="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
      <div class="container px-3 sm:px-4 lg:px-6 mx-auto px-3 py-6">
        <div class="flex flex-col lg:flex-row lg:items-center justify-start sm:justify-between gap-3">
          <div>
            <h1 class="text-xl font-semibold text-gray-900">Mes Avis</h1>
            <p class="text-gray-700 mt-1">
              Consultez et répondez aux avis de vos clients
            </p>
          </div>

          <div class="flex items-center space-y-2 sm:space-x-3">
            <router-link
              to="/merchant/reviews/dashboard"
              class="inline-flex items-center px-3 py-3 border border-blue-600 text-blue-600 rounded hover:transition-colors"
            >
              <ChartBarIcon class="h-4 w-4 mr-2" />
              Dashboard
            </router-link>
          </div>
        </div>
      </div>
    </div>

    <div class="container px-3 sm:px-4 lg:px-6 mx-auto px-3 py-6 sm:py-8">
      <!-- Filters -->
      <div class="bg-white rounded shadow-lg border border-gray-100 p-6 mt-4 sm:mb-3xl">
        <h3 class="text-lg font-semibold text-gray-900 mt-3">Filtres</h3>
        <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
          <!-- Rating Filter -->
          <div>
            <label class="block text-sm font-medium text-gray-800 mt-2">Note</label>
            <select
              v-model="filters.rating"
              class="w-full border border-gray-300 rounded px-3 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              @change="() => loadReviews()"
            >
              <option value="">Toutes les notes</option>
              <option value="5">5 étoiles</option>
              <option value="4">4 étoiles</option>
              <option value="3">3 étoiles</option>
              <option value="2">2 étoiles</option>
              <option value="1">1 étoile</option>
            </select>
          </div>

          <!-- Product Filter -->
          <div>
            <label class="block text-sm font-medium text-gray-800 mt-2">Produit</label>
            <select
              v-model="filters.product_id"
              class="w-full border border-gray-300 rounded px-3 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              @change="() => loadReviews()"
            >
              <option value="">Tous les produits</option>
              <option
                v-for="product in products"
                :key="product.id"
                :value="product.id"
              >
                {{ product.name }} ({{ product.review_count }})
              </option>
            </select>
          </div>

          <!-- Verified Filter -->
          <div>
            <label class="block text-sm font-medium text-gray-800 mt-2">Type</label>
            <select
              v-model="filters.verified_only"
              class="w-full border border-gray-300 rounded px-3 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              @change="() => loadReviews()"
            >
              <option value="">Tous les avis</option>
              <option value="true">Achats vérifiés uniquement</option>
            </select>
          </div>

          <!-- Sort Filter -->
          <div>
            <label class="block text-sm font-medium text-gray-800 mt-2">Tri</label>
            <select
              v-model="filters.sort"
              class="w-full border border-gray-300 rounded px-3 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              @change="() => loadReviews()"
            >
              <option value="recent">Plus récents</option>
              <option value="oldest">Plus anciens</option>
              <option value="rating_high">Note décroissante</option>
              <option value="rating_low">Note croissante</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Reviews List -->
      <div class="bg-white rounded shadow-lg border border-gray-100">
        <div class="px-4 py-4 border-b border-gray-200">
          <div class="flex items-center justify-start sm:justify-between">
            <h3 class="text-xl font-semibold text-gray-900">
              Avis clients
              <span v-if="pagination" class="text-gray-500 font-normal">
                ({{ pagination.total }} au total)
              </span>
            </h3>
            <button
              class="inline-flex items-center px-3 py-3 text-sm text-blue-600 hover:transition-colors"
              :disabled="loading"
              @click="() => loadReviews()"
            >
              <ArrowPathIcon class="h-4 w-4 mr-1" :class="{ 'animate-spin': loading }" />
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
            <ChatBubbleLeftRightIcon class="w-12 h-10 text-gray-400 mx-auto mt-3" />
            <h4 class="text-lg font-medium text-gray-900 mt-2">Aucun avis</h4>
            <p class="text-gray-700">
              {{ hasActiveFilters ? 'Aucun avis ne correspond à vos critères' : 'Vous n\'avez pas encore reçu d\'avis clients' }}
            </p>
          </div>

          <!-- Reviews -->
          <div
            v-for="review in reviews"
            v-else
            :key="review.id"
            class="px-4 py-6 hover:transition-colors"
          >
            <div class="flex space-y-4 sm:space-x-4">
              <!-- User Avatar -->
              <div class="flex-shrink-0">
                <div class="w-12 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                  <span class="text-white text-sm font-medium">
                    {{ getInitials(review.user.name) }}
                  </span>
                </div>
              </div>

              <div class="flex-1 min-w-none">
                <div class="flex items-center justify-start sm:justify-between mb-4">
                  <div class="flex items-center space-y-2 sm:space-x-3">
                    <span class="font-medium text-gray-900">{{ review.user.name }}</span>
                    <div class="flex items-center">
                      <StarIcon
                        v-for="star in 5"
                        :key="star"
                        class="h-4 w-4"
                        :class="star <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-500'"
                      />
                    </div>
                    <span v-if="review.is_verified_purchase" class="inline-flex items-center px-3 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                      <ShieldCheckIcon class="w-xs h-3 mr-1" />
                      Achat vérifié
                    </span>
                  </div>
                  <span class="text-sm text-gray-500">{{ review.time_ago }}</span>
                </div>

                <div v-if="review.title" class="mb-4">
                  <h4 class="font-medium text-gray-900">{{ review.title }}</h4>
                </div>

                <div v-if="review.comment" class="text-gray-800 text-sm leading-relaxed mb-4">
                  {{ review.comment }}
                </div>

                <div v-if="review.product" class="inline-flex items-center text-xs text-info bg-blue-50 rounded-full px-3 py-3 mt-3">
                  <ArchiveBoxIcon class="w-xs h-3 mr-1" />
                  {{ review.product.name }}
                </div>

                <!-- Merchant Response Section -->
                <MerchantResponse
                  :review="review"
                  @response-added="onResponseAdded"
                  @response-updated="onResponseUpdated"
                  @response-deleted="onResponseDeleted"
                />
              </div>
            </div>
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
    </div>
  </DashboardLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useDashboardLayout } from '@/composables/useDashboardLayout'
import MerchantResponse from '@/components/reviews/MerchantResponse.vue'
import {
  ChatBubbleLeftRightIcon,
  StarIcon,
  ShieldCheckIcon,
  ArchiveBoxIcon,
  ChartBarIcon,
  ArrowPathIcon
} from '@heroicons/vue/24/outline'

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
  merchant_response?: string
  merchant_response_at?: string
}

interface Product {
  id: number
  name: string
  review_count: number
}

interface Pagination {
  current_page: number
  last_page: number
  per_page: number
  total: number
}

const authStore = useAuthStore()
const { sidebar, header } = useDashboardLayout('merchant')
const reviews = ref<Review[]>([])
const products = ref<Product[]>([])
const pagination = ref<Pagination | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

const filters = ref({
  rating: '',
  product_id: '',
  verified_only: '',
  sort: 'recent'
})

const hasActiveFilters = computed(() => {
  return filters.value.rating || filters.value.product_id || filters.value.verified_only
})

const getInitials = (name: string) => {
  return name.split(' ').map(part => part[0]).join('').toUpperCase().slice(0, 2)
}

const loadProducts = async () => {
  try {
    const response = await fetch('http://localhost:8000/api/merchants/reviews/products', {
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
      products.value = data.data
    }
  } catch (err) {
    // console.error('Error loading products:', err)
  }
}

const loadReviews = async (page: number = 1) => {
  loading.value = true
  error.value = null

  try {
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: '20'
    })

    // Add filters
    if (filters.value.rating) params.append('rating', filters.value.rating)
    if (filters.value.product_id) params.append('product_id', filters.value.product_id)
    if (filters.value.verified_only) params.append('verified_only', filters.value.verified_only)
    if (filters.value.sort) params.append('sort', filters.value.sort)

    const response = await fetch(`http://localhost:8000/api/merchants/reviews/list?${params}`, {
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
    // console.error('Error loading reviews:', err)
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

const onResponseAdded = (reviewId: number, response: any) => {
  const review = reviews.value.find(r => r.id === reviewId)
  if (review) {
    review.merchant_response = response.merchant_response
    review.merchant_response_at = response.merchant_response_at
  }
}

const onResponseUpdated = (reviewId: number, response: any) => {
  const review = reviews.value.find(r => r.id === reviewId)
  if (review) {
    review.merchant_response = response.merchant_response
    review.merchant_response_at = response.merchant_response_at
  }
}

const onResponseDeleted = (reviewId: number) => {
  const review = reviews.value.find(r => r.id === reviewId)
  if (review) {
    review.merchant_response = undefined
    review.merchant_response_at = undefined
  }
}

onMounted(async () => {
  // Check if user is merchant
  if (authStore.user?.role !== 'merchant') {
    error.value = 'Accès réservé aux commerçants'
    return
  }

  await loadProducts()
  await loadReviews()
})
</script>
