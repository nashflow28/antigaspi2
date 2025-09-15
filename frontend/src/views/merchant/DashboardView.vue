<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="mb-8">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">Tableau de bord Commerçant</h1>
            <p class="text-gray-600 mt-1">Gérez vos produits et réservations</p>
          </div>
          <div class="flex items-center space-x-4">
            <router-link
              to="/merchant/products?action=create"
              class="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-medium hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center space-x-2"
            >
              <PlusIcon class="w-5 h-5" />
              <span>Nouveau produit</span>
            </router-link>
          </div>
        </div>
      </div>

      <!-- Statistics Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div class="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <div class="flex items-center space-x-4">
            <div class="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <ShoppingBagIcon class="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p class="text-2xl font-bold text-gray-900">{{ stats.total_products }}</p>
              <p class="text-gray-600 text-sm">Produits actifs</p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <div class="flex items-center space-x-4">
            <div class="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <ClockIcon class="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p class="text-2xl font-bold text-gray-900">{{ stats.pending_reservations }}</p>
              <p class="text-gray-600 text-sm">En attente</p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <div class="flex items-center space-x-4">
            <div class="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
              <BanknotesIcon class="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p class="text-2xl font-bold text-gray-900">{{ Math.round(stats.total_revenue).toLocaleString('fr-FR') }} F CFA</p>
              <p class="text-gray-600 text-sm">Revenus ce mois</p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <div class="flex items-center space-x-4">
            <div class="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <CheckCircleIcon class="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p class="text-2xl font-bold text-gray-900">{{ stats.completed_reservations }}</p>
              <p class="text-gray-600 text-sm">Terminées</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Content Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Recent Reservations -->
        <div class="lg:col-span-2 bg-white rounded-2xl shadow-lg border border-gray-100">
          <div class="p-6 border-b border-gray-200">
            <div class="flex items-center justify-between">
              <h2 class="text-xl font-semibold text-gray-900">Réservations récentes</h2>
              <router-link
                to="/merchant/reservations"
                class="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center space-x-1"
              >
                <span>Voir tout</span>
                <ArrowRightIcon class="w-4 h-4" />
              </router-link>
            </div>
          </div>
          <div class="p-6">
            <div v-if="recentReservations.length === 0" class="text-center py-12">
              <ClockIcon class="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p class="text-gray-500">Aucune réservation récente</p>
            </div>
            <div v-else class="space-y-4">
              <div
                v-for="reservation in recentReservations"
                :key="reservation.id"
                class="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <div class="flex items-center space-x-4">
                  <div class="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <UserIcon class="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p class="font-medium text-gray-900">{{ reservation.customer_name }}</p>
                    <p class="text-sm text-gray-600">{{ reservation.product_name }}</p>
                    <p class="text-xs text-gray-500">{{ formatDate(reservation.created_at) }}</p>
                  </div>
                </div>
                <div class="flex items-center space-x-3">
                  <span
                    :class="[
                      'px-3 py-1 rounded-full text-sm font-medium',
                      getStatusColor(reservation.status)
                    ]"
                  >
                    {{ getStatusText(reservation.status) }}
                  </span>
                  <span class="font-semibold text-gray-900">{{ Math.round(reservation.total_amount).toLocaleString('fr-FR') }} F CFA</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="space-y-6">
          <!-- Quick Actions Card -->
          <div class="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <h2 class="text-xl font-semibold text-gray-900 mb-4">Actions rapides</h2>
            <div class="space-y-3">
              <router-link
                to="/merchant/products/create"
                class="flex items-center space-x-3 p-3 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors"
              >
                <PlusIcon class="w-5 h-5 text-blue-600" />
                <span class="font-medium text-blue-700">Ajouter un produit</span>
              </router-link>
              <router-link
                to="/merchant/products"
                class="flex items-center space-x-3 p-3 bg-green-50 hover:bg-green-100 rounded-xl transition-colors"
              >
                <ShoppingBagIcon class="w-5 h-5 text-green-600" />
                <span class="font-medium text-green-700">Gérer les produits</span>
              </router-link>
              <router-link
                to="/merchant/reservations"
                class="flex items-center space-x-3 p-3 bg-purple-50 hover:bg-purple-100 rounded-xl transition-colors"
              >
                <ClockIcon class="w-5 h-5 text-purple-600" />
                <span class="font-medium text-purple-700">Voir les réservations</span>
              </router-link>
              <router-link
                to="/profile"
                class="flex items-center space-x-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <CogIcon class="w-5 h-5 text-gray-600" />
                <span class="font-medium text-gray-700">Paramètres</span>
              </router-link>
            </div>
          </div>

          <!-- Performance Card -->
          <div class="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <h2 class="text-xl font-semibold text-gray-900 mb-4">Performance</h2>
            <div class="space-y-4">
              <div class="flex justify-between items-center">
                <span class="text-gray-600">Taux de conversion</span>
                <span class="font-semibold text-green-600">{{ stats.conversion_rate }}%</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-gray-600">Évaluation moyenne</span>
                <div class="flex items-center space-x-1">
                  <StarIcon class="w-4 h-4 text-yellow-400" />
                  <span class="font-semibold">{{ stats.average_rating }}</span>
                </div>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-gray-600">Produits vendus</span>
                <span class="font-semibold text-blue-600">{{ stats.products_sold }}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-gray-600">Impact CO2</span>
                <span class="font-semibold text-emerald-600">-{{ stats.co2_saved }}kg</span>
              </div>
            </div>
          </div>

          <!-- Notifications Card -->
          <div class="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <h2 class="text-xl font-semibold text-gray-900 mb-4">Notifications</h2>
            <div class="space-y-3">
              <div v-if="notifications.length === 0" class="text-center py-6">
                <BellIcon class="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p class="text-gray-500 text-sm">Aucune notification</p>
              </div>
              <div
                v-else
                v-for="notification in notifications"
                :key="notification.id"
                class="flex items-start space-x-3 p-3 bg-gray-50 rounded-xl"
              >
                <div class="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <p class="text-sm font-medium text-gray-900">{{ notification.title }}</p>
                  <p class="text-xs text-gray-600">{{ notification.message }}</p>
                  <p class="text-xs text-gray-500 mt-1">{{ formatDate(notification.created_at) }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Products -->
      <div class="mt-8 bg-white rounded-2xl shadow-lg border border-gray-100">
        <div class="p-6 border-b border-gray-200">
          <div class="flex items-center justify-between">
            <h2 class="text-xl font-semibold text-gray-900">Mes produits récents</h2>
            <router-link
              to="/merchant/products"
              class="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center space-x-1"
            >
              <span>Voir tout</span>
              <ArrowRightIcon class="w-4 h-4" />
            </router-link>
          </div>
        </div>
        <div class="p-6">
          <div v-if="recentProducts.length === 0" class="text-center py-12">
            <ShoppingBagIcon class="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p class="text-gray-500">Aucun produit ajouté</p>
            <router-link
              to="/merchant/products/create"
              class="inline-flex items-center mt-4 text-blue-600 hover:text-blue-700 font-medium"
            >
              <PlusIcon class="w-4 h-4 mr-1" />
              Ajouter votre premier produit
            </router-link>
          </div>
          <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <div
              v-for="product in recentProducts"
              :key="product.id"
              class="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors"
            >
              <div class="aspect-square bg-gray-200 rounded-lg mb-4 flex items-center justify-center">
                <img
                  v-if="product.image_url"
                  :src="product.image_url"
                  :alt="product.name"
                  class="w-full h-full object-cover rounded-lg"
                />
                <ShoppingBagIcon v-else class="w-8 h-8 text-gray-400" />
              </div>
              <h3 class="font-medium text-gray-900 mb-1">{{ product.name }}</h3>
              <p class="text-sm text-gray-600 mb-2">{{ product.category }}</p>
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-2">
                  <span class="text-lg font-semibold text-green-600">{{ Math.round(product.discounted_price).toLocaleString('fr-FR') }} F CFA</span>
                  <span class="text-sm text-gray-500 line-through">{{ Math.round(product.original_price).toLocaleString('fr-FR') }} F CFA</span>
                </div>
                <span class="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                  {{ product.quantity_available }} dispo
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { formatPrice } from '@/utils/currency'
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
    // TODO: Implement actual API calls
    // Mock data for now
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
    console.error('Error loading dashboard data:', error)
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
    console.error('Erreur lors du chargement des réservations récentes:', error)
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
    console.error('Erreur lors du chargement des produits récents:', error)
    recentProducts.value = []
  }
}

onMounted(() => {
  loadDashboardData()
})
</script>
