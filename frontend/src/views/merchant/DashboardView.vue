<template>
  <DashboardLayout
    :sidebar="sidebar"
    :header="header"
    class="bg-gradient-to-br from-blue-50 to-indigo-50"
  >
    <div class="max-w-full sm:max-w-7xl mx-auto p-6">
      <!-- Header -->
      <div class="mb-6 sm:mb-8">
        <div class="flex items-center justify-start sm:justify-between">
          <div>
            <h1 class="text-responsive-xl font-semibold text-heading">Tableau de bord Commerçant</h1>
            <p class="text-body mt-1">Gérez vos produits et réservations</p>
          </div>
          <div class="flex items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <router-link
              to="/merchant/products?action=create"
              class="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-medium hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center space-y-2 sm:space-y-0 sm:space-x-2"
            >
              <PlusIcon class="w-5 h-5" />
              <span>Nouveau produit</span>
            </router-link>
          </div>
        </div>
      </div>

      <!-- Statistics Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <div class="bg-white rounded-2xl shadow-lg p-6 border border-neutral-100">
          <div class="flex items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <div class="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <ShoppingBagIcon class="w-10 h-10 text-info" />
            </div>
            <div>
              <p class="text-responsive-xl font-semibold text-heading">{{ stats.total_products }}</p>
              <p class="text-body text-responsive-sm">Produits actifs</p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-2xl shadow-lg p-6 border border-neutral-100">
          <div class="flex items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <div class="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <ClockIcon class="w-10 h-10 text-success" />
            </div>
            <div>
              <p class="text-responsive-xl font-semibold text-heading">{{ stats.pending_reservations }}</p>
              <p class="text-body text-responsive-sm">En attente</p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-2xl shadow-lg p-6 border border-neutral-100">
          <div class="flex items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <div class="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
              <BanknotesIcon class="w-10 h-10 text-warning" />
            </div>
            <div>
              <p class="text-responsive-xl font-semibold text-heading">{{ Math.round(stats.total_revenue).toLocaleString('fr-FR') }} F CFA</p>
              <p class="text-body text-responsive-sm">Revenus ce mois</p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-2xl shadow-lg p-6 border border-neutral-100">
          <div class="flex items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <div class="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <CheckCircleIcon class="w-10 h-10 text-purple-600" />
            </div>
            <div>
              <p class="text-responsive-xl font-semibold text-heading">{{ stats.completed_reservations }}</p>
              <p class="text-body text-responsive-sm">Terminées</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Content Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        <!-- Recent Reservations -->
        <div class="lg:col-span-2 bg-white rounded-2xl shadow-lg border border-neutral-100">
          <div class="p-6 border-b border-neutral-200">
            <div class="flex items-center justify-start sm:justify-between">
              <h2 class="text-responsive-xl font-semibold text-heading">Réservations récentes</h2>
              <router-link
                to="/merchant/reservations"
                class="text-info hover:text-blue-700 text-responsive-sm font-medium flex items-center space-y-2 sm:space-y-0 sm:space-x-2"
              >
                <span>Voir tout</span>
                <ArrowRightIcon class="w-5 h-5" />
              </router-link>
            </div>
          </div>
          <div class="p-6">
            <div v-if="recentReservations.length === 0" class="text-left sm:text-center py-8 sm:py-10 lg:py-12">
              <ClockIcon class="w-12 h-12 text-placeholder mx-auto mb-4" />
              <p class="text-muted">Aucune réservation récente</p>
            </div>
            <div v-else class="space-y-4">
              <div
                v-for="reservation in recentReservations"
                :key="reservation.id"
                class="flex items-center justify-start sm:justify-between p-4 bg-neutral-50 rounded-xl hover:transition-colors"
              >
                <div class="flex items-center space-y-4 sm:space-y-0 sm:space-x-4">
                  <div class="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <UserIcon class="w-10 h-10 text-info" />
                  </div>
                  <div>
                    <p class="font-medium text-heading">{{ reservation.customer_name }}</p>
                    <p class="text-responsive-sm text-body">{{ reservation.product_name }}</p>
                    <p class="text-responsive-xs text-muted">{{ formatDate(reservation.created_at) }}</p>
                  </div>
                </div>
                <div class="flex items-center space-y-3 sm:space-y-0 sm:space-x-3">
                  <span
                    :class="[
                      'px-4 py-3 rounded-full text-responsive-sm font-medium',
                      getStatusColor(reservation.status)
                    ]"
                  >
                    {{ getStatusText(reservation.status) }}
                  </span>
                  <span class="font-semibold text-heading">{{ Math.round(reservation.total_amount).toLocaleString('fr-FR') }} F CFA</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="space-y-6">
          <!-- Quick Actions Card -->
          <div class="bg-white rounded-2xl shadow-lg border border-neutral-100 p-6">
            <h2 class="text-responsive-xl font-semibold text-heading mb-4">Actions rapides</h2>
            <div class="space-y-3">
              <router-link
                to="/merchant/products/create"
                class="flex items-center space-y-3 sm:space-y-0 sm:space-x-3 p-3 bg-blue-50 hover:transition-colors"
              >
                <PlusIcon class="w-5 h-5 text-info" />
                <span class="font-medium text-blue-700">Ajouter un produit</span>
              </router-link>
              <router-link
                to="/merchant/products"
                class="flex items-center space-y-3 sm:space-y-0 sm:space-x-3 p-3 bg-green-50 hover:transition-colors"
              >
                <ShoppingBagIcon class="w-5 h-5 text-success" />
                <span class="font-medium text-green-700">Gérer les produits</span>
              </router-link>
              <router-link
                to="/merchant/reservations"
                class="flex items-center space-y-3 sm:space-y-0 sm:space-x-3 p-3 bg-purple-50 hover:transition-colors"
              >
                <ClockIcon class="w-5 h-5 text-purple-600" />
                <span class="font-medium text-purple-700">Voir les réservations</span>
              </router-link>
              <router-link
                to="/profile"
                class="flex items-center space-y-3 sm:space-y-0 sm:space-x-3 p-3 bg-neutral-50 hover:transition-colors"
              >
                <CogIcon class="w-5 h-5 text-body" />
                <span class="font-medium text-body-emphasis">Paramètres</span>
              </router-link>
            </div>
          </div>

          <!-- Location Manager -->
          <LocationManager />

          <!-- Performance Card -->
          <div class="bg-white rounded-2xl shadow-lg border border-neutral-100 p-6">
            <h2 class="text-responsive-xl font-semibold text-heading mb-4">Performance</h2>
            <div class="space-y-4">
              <div class="flex justify-start sm:justify-between items-center">
                <span class="text-body">Taux de conversion</span>
                <span class="font-semibold text-success">{{ stats.conversion_rate }}%</span>
              </div>
              <div class="flex justify-start sm:justify-between items-center">
                <span class="text-body">Évaluation moyenne</span>
                <div class="flex items-center space-y-2 sm:space-y-0 sm:space-x-2">
                  <StarIcon class="w-5 h-5 text-yellow-400" />
                  <span class="font-semibold">{{ stats.average_rating }}</span>
                </div>
              </div>
              <div class="flex justify-start sm:justify-between items-center">
                <span class="text-body">Produits vendus</span>
                <span class="font-semibold text-info">{{ stats.products_sold }}</span>
              </div>
              <div class="flex justify-start sm:justify-between items-center">
                <span class="text-body">Impact CO2</span>
                <span class="font-semibold text-emerald-600">-{{ stats.co2_saved }}kg</span>
              </div>
            </div>
          </div>

          <!-- Notifications Card -->
          <div class="bg-white rounded-2xl shadow-lg border border-neutral-100 p-6">
            <h2 class="text-responsive-xl font-semibold text-heading mb-4">Notifications</h2>
            <div class="space-y-3">
              <div v-if="notifications.length === 0" class="text-left sm:text-center py-6">
                <BellIcon class="w-10 h-10 text-placeholder mx-auto mb-2" />
                <p class="text-muted text-responsive-sm">Aucune notification</p>
              </div>
              <div
                v-for="notification in notifications"
                v-else
                :key="notification.id"
                class="flex items-stretch sm:items-start space-y-3 sm:space-y-0 sm:space-x-3 p-3 bg-neutral-50 rounded-xl"
              >
                <div class="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                <div>
                  <p class="text-responsive-sm font-medium text-heading">{{ notification.title }}</p>
                  <p class="text-responsive-xs text-body">{{ notification.message }}</p>
                  <p class="text-responsive-xs text-muted mt-1">{{ formatDate(notification.created_at) }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Products -->
      <div class="mt-8 bg-white rounded-2xl shadow-lg border border-neutral-100">
        <div class="p-6 border-b border-neutral-200">
          <div class="flex items-center justify-start sm:justify-between">
            <h2 class="text-responsive-xl font-semibold text-heading">Mes produits récents</h2>
            <router-link
              to="/merchant/products"
              class="text-info hover:text-blue-700 text-responsive-sm font-medium flex items-center space-y-2 sm:space-y-0 sm:space-x-2"
            >
              <span>Voir tout</span>
              <ArrowRightIcon class="w-5 h-5" />
            </router-link>
          </div>
        </div>
        <div class="p-6">
          <div v-if="recentProducts.length === 0" class="text-left sm:text-center py-8 sm:py-10 lg:py-12">
            <ShoppingBagIcon class="w-12 h-12 text-placeholder mx-auto mb-4" />
            <p class="text-muted">Aucun produit ajouté</p>
            <router-link
              to="/merchant/products/create"
              class="inline-flex items-center mt-4 text-info hover:text-blue-700 font-medium"
            >
              <PlusIcon class="w-5 h-5 mr-1" />
              Ajouter votre premier produit
            </router-link>
          </div>
          <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            <div
              v-for="product in recentProducts"
              :key="product.id"
              class="bg-neutral-50 rounded-xl p-4 hover:transition-colors"
            >
              <div class="aspect-square bg-neutral-200 rounded-lg mb-4 flex items-center justify-center">
                <img
                  v-if="product.image_url"
                  :src="product.image_url"
                  :alt="product.name"
                  class="w-full h-full object-cover rounded-lg"
                >
                <ShoppingBagIcon v-else class="w-10 h-10 text-placeholder" />
              </div>
              <h3 class="font-medium text-heading mb-1">{{ product.name }}</h3>
              <p class="text-responsive-sm text-body mb-2">{{ product.category }}</p>
              <div class="flex items-center justify-start sm:justify-between">
                <div class="flex items-center space-y-2 sm:space-y-0 sm:space-x-2">
                  <span class="text-responsive-lg font-semibold text-success">{{ Math.round(product.discounted_price).toLocaleString('fr-FR') }} F CFA</span>
                  <span class="text-responsive-sm text-muted line-through">{{ Math.round(product.original_price).toLocaleString('fr-FR') }} F CFA</span>
                </div>
                <span class="text-responsive-xs bg-blue-100 text-blue-700 px-4 py-3 rounded-full">
                  {{ product.quantity_available }} dispo
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </DashboardLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import { useAuthStore } from '@/stores/auth'
import LocationManager from '@/components/merchant/LocationManager.vue'
import DashboardLayout from '@/components/ui/DashboardLayout.vue'
import { useDashboardLayout } from '@/composables/useDashboardLayout'
import {
  PlusIcon,
  ShoppingBagIcon,
  ClockIcon,
  BanknotesIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  UserIcon,
  CogIcon,
  StarIcon,
  BellIcon
} from '@heroicons/vue/24/outline'

const authStore = useAuthStore()
const { sidebar, header } = useDashboardLayout('merchant')

// Reactive data
const stats = reactive({
  total_products: 0,
  pending_reservations: 0,
  total_revenue: 0,
  completed_reservations: 0,
  conversion_rate: 0,
  average_rating: 0,
  products_sold: 0,
  co2_saved: 0
})

const recentReservations = ref<any[]>([])
const recentProducts = ref<any[]>([])
const notifications = ref<any[]>([])

// Methods
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800'
    case 'confirmed':
      return 'bg-blue-100 text-blue-800'
    case 'ready':
      return 'bg-purple-100 text-purple-800'
    case 'completed':
      return 'bg-green-100 text-green-800'
    case 'cancelled':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const getStatusText = (status: string) => {
  switch (status) {
    case 'pending':
      return 'En attente'
    case 'confirmed':
      return 'Confirmée'
    case 'ready':
      return 'Prête'
    case 'completed':
      return 'Terminée'
    case 'cancelled':
      return 'Annulée'
    default:
      return 'Inconnu'
  }
}

const loadDashboardData = async () => {
  try {
    // Future: Connect to real analytics API
    // Currently using static data for demo purposes
    stats.total_products = 8
    stats.pending_reservations = 3
    stats.total_revenue = 160928 // 245.50€ × 656
    stats.completed_reservations = 15
    stats.conversion_rate = 67
    stats.average_rating = 4.5
    stats.products_sold = 23
    stats.co2_saved = 48.5

    // Load real reservations data
    await loadRecentReservations()

    // Load real products data
    await loadRecentProducts()

    notifications.value = [
      {
        id: 1,
        title: 'Nouvelle réservation',
        message: 'Vous avez reçu une nouvelle réservation de Marie Dubois',
        created_at: new Date().toISOString()
      }
    ]
  } catch (error) {
    // console.error('Error loading dashboard data:', error)
  }
}

const loadRecentReservations = async () => {
  try {
    const response = await fetch('http://localhost:8000/api/reservations/merchant/list?per_page=5', {
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
    if (data.success && data.data) {
      // Transform API data to match dashboard interface
      recentReservations.value = data.data.map((res: any) => ({
        id: res.id,
        customer_name: `${res.consumer?.first_name || ''} ${res.consumer?.last_name || ''}`.trim() || 'Client',
        product_name: res.product?.name || 'Produit inconnu',
        total_amount: parseFloat(res.total_amount || 0),
        status: res.status,
        created_at: res.created_at
      }))
    }
  } catch (error) {
    // console.error('Erreur lors du chargement des réservations récentes:', error)
    recentReservations.value = []
  }
}

const loadRecentProducts = async () => {
  try {
    const response = await fetch('http://localhost:8000/api/products/merchant?per_page=5', {
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
    if (data.success && data.data) {
      // Transform API data to match dashboard interface
      recentProducts.value = data.data.map((product: any) => ({
        id: product.id,
        name: product.name,
        category: product.category?.name || 'Catégorie',
        discounted_price: parseFloat(product.discounted_price || 0),
        original_price: parseFloat(product.original_price || 0),
        quantity_available: product.quantity_available || 0,
        image_url: product.image_url || null
      }))
    }
  } catch (error) {
    // console.error('Erreur lors du chargement des produits récents:', error)
    recentProducts.value = []
  }
}

onMounted(() => {
  loadDashboardData()
})
</script>
