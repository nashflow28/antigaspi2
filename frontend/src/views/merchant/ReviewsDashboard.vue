<template>
  <DashboardLayout
    :sidebar="sidebar"
    :header="header"
    class="bg-gradient-to-br from-neutral-50 to-neutral-100"
  >
    <!-- Header -->
    <div class="bg-white/80 backdrop-blur-sm border-b border-neutral-200 sticky top-0 z-10">
      <div class="container mx-auto px-4 py-6">
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 class="text-3xl font-bold text-neutral-900">Dashboard Avis</h1>
            <p class="text-neutral-600 mt-1">
              Gérez et analysez les avis clients de votre commerce
            </p>
          </div>

          <div class="flex items-center space-x-3">
            <button
              class="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              :disabled="loading"
              @click="refreshData"
            >
              <RefreshCw class="w-5 h-5 mr-2" :class="{ 'animate-spin': loading }" />
              Actualiser
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="container mx-auto px-4 py-8">
      <!-- Loading State -->
      <div v-if="loading && !dashboardData" class="text-center py-16">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto" />
        <p class="text-neutral-600 mt-4">Chargement du dashboard...</p>
      </div>

      <div v-else-if="dashboardData" class="space-y-8">
        <!-- Key Statistics -->
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <div class="bg-white rounded-2xl shadow-lg border border-neutral-100 p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-neutral-600 text-sm font-medium">Total des avis</p>
                <p class="text-3xl font-bold text-neutral-900">{{ dashboardData.stats.total_reviews }}</p>
                <p class="text-sm text-neutral-500 mt-1">
                  {{ dashboardData.stats.verified_reviews }} vérifiés
                </p>
              </div>
              <div class="p-3 bg-blue-100 rounded-xl">
                <MessageSquare class="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </div>

          <div class="bg-white rounded-2xl shadow-lg border border-neutral-100 p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-neutral-600 text-sm font-medium">Note moyenne</p>
                <div class="flex items-center space-x-2">
                  <p class="text-3xl font-bold text-neutral-900">{{ dashboardData.stats.average_rating }}</p>
                  <Star class="w-6 h-6 text-yellow-400 fill-yellow-400" />
                </div>
                <div class="flex mt-1">
                  <Star
                    v-for="star in 5"
                    :key="star"
                    class="w-4 h-4"
                    :class="star <= Math.round(dashboardData.stats.average_rating) ? 'text-yellow-400 fill-yellow-400' : 'text-neutral-300'"
                  />
                </div>
              </div>
              <div class="p-3 bg-yellow-100 rounded-xl">
                <Star class="w-8 h-8 text-yellow-600" />
              </div>
            </div>
          </div>

          <div class="bg-white rounded-2xl shadow-lg border border-neutral-100 p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-neutral-600 text-sm font-medium">Cette semaine</p>
                <p class="text-3xl font-bold text-neutral-900">{{ dashboardData.stats.reviews_this_week }}</p>
                <p class="text-sm text-green-600 mt-1">
                  +{{ dashboardData.stats.reviews_today }} aujourd'hui
                </p>
              </div>
              <div class="p-3 bg-green-100 rounded-xl">
                <Calendar class="w-8 h-8 text-green-600" />
              </div>
            </div>
          </div>

          <div class="bg-white rounded-2xl shadow-lg border border-neutral-100 p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-neutral-600 text-sm font-medium">Ce mois</p>
                <p class="text-3xl font-bold text-neutral-900">{{ dashboardData.stats.reviews_this_month }}</p>
                <p class="text-sm text-neutral-500 mt-1">
                  {{ Math.round((dashboardData.stats.reviews_this_month / dashboardData.stats.total_reviews) * 100) }}% du total
                </p>
              </div>
              <div class="p-3 bg-purple-100 rounded-xl">
                <BarChart3 class="w-8 h-8 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        <!-- Charts Section -->
        <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <!-- Rating Distribution -->
          <div class="bg-white rounded-2xl shadow-lg border border-neutral-100 p-6">
            <h3 class="text-xl font-semibold text-neutral-900 mb-6">Répartition des notes</h3>
            <div class="space-y-4">
              <div
                v-for="rating in dashboardData.stats.rating_distribution"
                :key="rating.rating"
                class="flex items-center space-x-4"
              >
                <div class="flex items-center space-x-1 w-20">
                  <span class="text-sm font-medium">{{ rating.rating }}</span>
                  <Star class="w-4 h-4 text-yellow-400 fill-yellow-400" />
                </div>
                <div class="flex-1 bg-neutral-200 rounded-full h-3">
                  <div
                    class="bg-gradient-to-r from-yellow-400 to-yellow-500 h-3 rounded-full transition-all duration-500"
                    :style="{ width: rating.percentage + '%' }"
                  />
                </div>
                <div class="flex items-center space-x-2 w-20">
                  <span class="text-sm text-neutral-600">{{ rating.count }}</span>
                  <span class="text-xs text-neutral-500">({{ rating.percentage }}%)</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Monthly Trend -->
          <div class="bg-white rounded-2xl shadow-lg border border-neutral-100 p-6">
            <h3 class="text-xl font-semibold text-neutral-900 mb-6">Évolution mensuelle</h3>
            <div v-if="dashboardData.monthly_trend.length > 0" class="space-y-3">
              <div
                v-for="month in dashboardData.monthly_trend"
                :key="month.month"
                class="flex items-center justify-between p-3 bg-neutral-50 rounded-lg"
              >
                <div>
                  <p class="font-medium text-sm">{{ formatMonth(month.month) }}</p>
                  <p class="text-xs text-neutral-500">{{ month.count }} avis</p>
                </div>
                <div class="text-right">
                  <div class="flex items-center space-x-1">
                    <Star class="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    <span class="font-medium text-sm">{{ month.avg_rating }}</span>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="text-center py-8">
              <BarChart3 class="w-12 h-12 text-neutral-400 mx-auto mb-4" />
              <p class="text-neutral-600">Pas assez de données pour le graphique</p>
            </div>
          </div>
        </div>

        <!-- Product Performance -->
        <div class="bg-white rounded-2xl shadow-lg border border-neutral-100">
          <div class="px-6 py-4 border-b border-neutral-200">
            <h3 class="text-xl font-semibold text-neutral-900">Performance par produit</h3>
            <p class="text-neutral-600 text-sm">Vos produits les mieux notés</p>
          </div>
          <div class="p-6">
            <div v-if="dashboardData.product_stats.length > 0" class="space-y-4">
              <div
                v-for="product in dashboardData.product_stats"
                :key="product.product_id"
                class="flex items-center justify-between p-4 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors"
              >
                <div class="flex-1">
                  <h4 class="font-medium text-neutral-900">{{ product.product_name }}</h4>
                  <p class="text-sm text-neutral-600">{{ product.review_count }} avis</p>
                </div>
                <div class="flex items-center space-x-2">
                  <div class="flex items-center space-x-1">
                    <Star class="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    <span class="font-medium">{{ product.avg_rating }}</span>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="text-center py-8">
              <Package class="w-12 h-12 text-neutral-400 mx-auto mb-4" />
              <p class="text-neutral-600">Aucun produit avec des avis pour le moment</p>
            </div>
          </div>
        </div>

        <!-- Recent Reviews -->
        <div class="bg-white rounded-2xl shadow-lg border border-neutral-100">
          <div class="px-6 py-4 border-b border-neutral-200">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-xl font-semibold text-neutral-900">Avis récents</h3>
                <p class="text-neutral-600 text-sm">Derniers avis reçus</p>
              </div>
              <router-link
                to="/merchant/reviews"
                class="text-primary-600 text-sm hover:text-primary-700 transition-colors"
              >
                Voir tous les avis
              </router-link>
            </div>
          </div>
          <div class="divide-y divide-neutral-200">
            <div v-if="dashboardData.recent_reviews.length > 0">
              <div
                v-for="review in dashboardData.recent_reviews"
                :key="review.id"
                class="px-6 py-4 hover:bg-neutral-50 transition-colors"
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
                        <span class="font-medium text-neutral-900">{{ review.user.name }}</span>
                        <div class="flex items-center">
                          <Star
                            v-for="star in 5"
                            :key="star"
                            class="w-4 h-4"
                            :class="star <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-neutral-300'"
                          />
                        </div>
                        <span v-if="review.is_verified_purchase" class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                          <ShieldCheck class="w-3 h-3 mr-1" />
                          Achat vérifié
                        </span>
                      </div>
                      <span class="text-sm text-neutral-500">{{ review.time_ago }}</span>
                    </div>

                    <div v-if="review.title" class="mb-2">
                      <h4 class="font-medium text-neutral-900">{{ review.title }}</h4>
                    </div>

                    <div v-if="review.comment" class="text-neutral-700 text-sm leading-relaxed mb-2">
                      {{ review.comment }}
                    </div>

                    <div v-if="review.product" class="inline-flex items-center text-xs text-blue-600 bg-blue-50 rounded-full px-2 py-1">
                      <Package class="w-3 h-3 mr-1" />
                      {{ review.product.name }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="px-6 py-8 text-center">
              <MessageSquare class="w-12 h-12 text-neutral-400 mx-auto mb-4" />
              <h4 class="text-lg font-medium text-neutral-900 mb-2">Aucun avis</h4>
              <p class="text-neutral-600">Vous n'avez pas encore reçu d'avis clients.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="text-center py-16">
        <AlertTriangle class="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 class="text-xl font-semibold text-neutral-900 mb-2">Erreur de chargement</h2>
        <p class="text-neutral-600 mb-4">{{ error }}</p>
        <button
          class="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          @click="refreshData"
        >
          <RefreshCw class="w-5 h-5 mr-2" />
          Réessayer
        </button>
      </div>
    </div>
  </DashboardLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import {
  MessageSquare,
  Star,
  Calendar,
  BarChart3,
  Package,
  ShieldCheck,
  RefreshCw,
  AlertTriangle
} from 'lucide-vue-next'
import DashboardLayout from '@/components/ui/DashboardLayout.vue'
import { useDashboardLayout } from '@/composables/useDashboardLayout'

interface DashboardData {
  merchant: {
    id: number
    business_name: string
    business_type: string
  }
  stats: {
    total_reviews: number
    average_rating: number
    verified_reviews: number
    reviews_today: number
    reviews_this_week: number
    reviews_this_month: number
    rating_distribution: Array<{
      rating: number
      count: number
      percentage: number
    }>
  }
  recent_reviews: Array<{
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
  }>
  monthly_trend: Array<{
    month: string
    count: number
    avg_rating: number
  }>
  product_stats: Array<{
    product_id: number
    product_name: string
    review_count: number
    avg_rating: number
  }>
}

const authStore = useAuthStore()
const { sidebar, header } = useDashboardLayout('merchant')
const dashboardData = ref<DashboardData | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

const getInitials = (name: string) => {
  return name.split(' ').map(part => part[0]).join('').toUpperCase().slice(0, 2)
}

const formatMonth = (monthStr: string) => {
  const [year, month] = monthStr.split('-')
  const date = new Date(parseInt(year), parseInt(month) - 1)
  return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
}

const loadDashboard = async () => {
  loading.value = true
  error.value = null

  try {
    const response = await fetch('http://localhost:8000/api/merchants/reviews/dashboard', {
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
      dashboardData.value = data.data
    } else {
      throw new Error(data.message || 'Erreur lors du chargement')
    }
  } catch (err) {
    console.error('Error loading dashboard:', err)
    error.value = err instanceof Error ? err.message : 'Erreur inconnue'
  } finally {
    loading.value = false
  }
}

const refreshData = () => {
  loadDashboard()
}

onMounted(() => {
  // Check if user is merchant
  if (authStore.user?.role !== 'merchant') {
    error.value = 'Accès réservé aux commerçants'
    return
  }

  loadDashboard()
})
</script>
