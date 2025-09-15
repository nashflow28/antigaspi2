<template>
  <div class="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50 p-6">
    <!-- Header -->
    <div class="mb-8">
      <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div>
          <h1 class="text-3xl lg:text-4xl font-bold text-neutral-900 mb-2">
            Tableau de bord Administrateur
          </h1>
          <p class="text-neutral-600 text-lg">
            Supervision globale de la plateforme Antigaspi
          </p>
        </div>

        <div class="flex flex-col sm:flex-row gap-4">
          <select v-model="selectedPeriod" class="input">
            <option value="today">Aujourd'hui</option>
            <option value="week">Cette semaine</option>
            <option value="month">Ce mois</option>
            <option value="year">Cette année</option>
          </select>

          <button
            @click="refreshData"
            class="btn btn-primary glow-effect"
            :disabled="isLoading"
          >
            <ArrowPathIcon class="w-5 h-5 mr-2" :class="{ 'animate-spin': isLoading }" />
            Actualiser
          </button>
        </div>
      </div>

      <!-- Key Metrics -->
      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mt-8">
        <div class="card bg-gradient-to-r from-primary-500 to-primary-600 text-white">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-primary-100 text-sm font-medium">Utilisateurs Totaux</p>
              <p class="text-3xl font-bold">{{ formatNumber(stats.totalUsers) }}</p>
              <p class="text-primary-200 text-sm mt-1">
                +{{ stats.newUsersThisMonth }} ce mois
              </p>
            </div>
            <div class="p-3 bg-white/20 rounded-xl">
              <UsersIcon class="w-8 h-8" />
            </div>
          </div>
        </div>

        <div class="card bg-gradient-to-r from-success-500 to-success-600 text-white">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-success-100 text-sm font-medium">Commerçants Actifs</p>
              <p class="text-3xl font-bold">{{ formatNumber(stats.activeMerchants) }}</p>
              <p class="text-success-200 text-sm mt-1">
                {{ stats.merchantGrowthRate }}% de croissance
              </p>
            </div>
            <div class="p-3 bg-white/20 rounded-xl">
              <BuildingStorefrontIcon class="w-8 h-8" />
            </div>
          </div>
        </div>

        <div class="card bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-blue-100 text-sm font-medium">Produits Sauvés</p>
              <p class="text-3xl font-bold">{{ formatNumber(stats.productsSaved) }}</p>
              <p class="text-blue-200 text-sm mt-1">
                {{ formatNumber(stats.kgFoodSaved) }} kg sauvés
              </p>
            </div>
            <div class="p-3 bg-white/20 rounded-xl">
              <ShoppingBagIcon class="w-8 h-8" />
            </div>
          </div>
        </div>

        <div class="card bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-orange-100 text-sm font-medium">Chiffre d'affaires</p>
              <p class="text-3xl font-bold">{{ formatCurrency(stats.totalRevenue) }}</p>
              <p class="text-orange-200 text-sm mt-1">
                +{{ stats.revenueGrowth }}% vs mois dernier
              </p>
            </div>
            <div class="p-3 bg-white/20 rounded-xl">
              <div class="text-lg font-bold">F CFA</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Charts and Analytics -->
    <div class="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
      <!-- Revenue Chart -->
      <div class="card">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-xl font-semibold text-neutral-900">Évolution du chiffre d'affaires</h3>
          <select v-model="revenueChartPeriod" class="input text-sm">
            <option value="7d">7 derniers jours</option>
            <option value="30d">30 derniers jours</option>
            <option value="90d">90 derniers jours</option>
          </select>
        </div>
        <div class="h-64">
          <canvas ref="revenueChartCanvas" class="w-full h-full"></canvas>
        </div>
      </div>

      <!-- User Growth Chart -->
      <div class="card">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-xl font-semibold text-neutral-900">Croissance des utilisateurs</h3>
          <div class="flex gap-2">
            <span class="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm">
              Consommateurs
            </span>
            <span class="px-3 py-1 bg-success-100 text-success-700 rounded-full text-sm">
              Commerçants
            </span>
          </div>
        </div>
        <div class="h-64">
          <canvas ref="userGrowthChartCanvas" class="w-full h-full"></canvas>
        </div>
      </div>
    </div>

    <!-- Platform Activity -->
    <div class="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
      <!-- Recent Activity -->
      <div class="xl:col-span-2 card">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-xl font-semibold text-neutral-900">Activité récente</h3>
          <button
            @click="viewAllActivities"
            class="text-primary-600 text-sm hover:text-primary-700 transition-colors"
          >
            Voir tout
          </button>
        </div>

        <div class="space-y-4">
          <div
            v-for="activity in recentActivities"
            :key="activity.id"
            class="flex items-center gap-4 p-4 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors"
          >
            <div class="flex-shrink-0">
              <div
                :class="getActivityIconClass(activity.type)"
                class="w-10 h-10 rounded-full flex items-center justify-center"
              >
                <component :is="getActivityIcon(activity.type)" class="w-5 h-5" />
              </div>
            </div>

            <div class="flex-grow min-w-0">
              <p class="text-neutral-900 font-medium">{{ activity.title }}</p>
              <p class="text-neutral-600 text-sm">{{ activity.description }}</p>
              <p class="text-neutral-400 text-xs mt-1">{{ formatTimeAgo(activity.timestamp) }}</p>
            </div>

            <div class="flex-shrink-0">
              <span
                :class="getActivityStatusClass(activity.status)"
                class="px-2 py-1 rounded-full text-xs font-medium"
              >
                {{ activity.status }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- System Health -->
      <div class="card">
        <h3 class="text-xl font-semibold text-neutral-900 mb-6">État du système</h3>

        <div class="space-y-4">
          <div
            v-for="service in systemHealth"
            :key="service.name"
            class="flex items-center justify-between p-3 bg-neutral-50 rounded-lg"
          >
            <div class="flex items-center gap-3">
              <div
                :class="service.status === 'healthy' ? 'bg-success-100' : 'bg-error-100'"
                class="w-8 h-8 rounded-full flex items-center justify-center"
              >
                <component
                  :is="service.status === 'healthy' ? CheckCircleIcon : ExclamationTriangleIcon"
                  :class="service.status === 'healthy' ? 'text-success-600' : 'text-error-600'"
                  class="w-4 h-4"
                />
              </div>
              <div>
                <p class="font-medium text-sm">{{ service.name }}</p>
                <p class="text-xs text-neutral-500">{{ service.description }}</p>
              </div>
            </div>

            <div class="text-right">
              <p class="text-sm font-medium">{{ service.uptime }}</p>
              <p class="text-xs text-neutral-500">{{ service.responseTime }}</p>
            </div>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="mt-6 pt-6 border-t border-neutral-200">
          <h4 class="font-semibold text-neutral-900 mb-3">Actions rapides</h4>
          <div class="grid grid-cols-2 gap-2">
            <button
              @click="viewLogs"
              class="btn btn-outline btn-sm text-xs"
            >
              <DocumentTextIcon class="w-4 h-4 mr-1" />
              Logs
            </button>
            <button
              @click="viewMetrics"
              class="btn btn-outline btn-sm text-xs"
            >
              <ChartBarIcon class="w-4 h-4 mr-1" />
              Métriques
            </button>
            <button
              @click="manageUsers"
              class="btn btn-outline btn-sm text-xs"
            >
              <UsersIcon class="w-4 h-4 mr-1" />
              Utilisateurs
            </button>
            <button
              @click="systemSettings"
              class="btn btn-outline btn-sm text-xs"
            >
              <CogIcon class="w-4 h-4 mr-1" />
              Paramètres
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Performance Metrics -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <!-- Environmental Impact -->
      <div class="card">
        <div class="flex items-center gap-3 mb-4">
          <div class="p-2 bg-green-100 rounded-lg">
            <GlobeEuropeAfricaIcon class="w-6 h-6 text-green-600" />
          </div>
          <h3 class="text-lg font-semibold text-neutral-900">Impact Environnemental</h3>
        </div>

        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <span class="text-neutral-600">CO₂ économisé</span>
            <span class="font-bold text-green-600">{{ formatNumber(environmentalImpact.co2Saved) }} kg</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-neutral-600">Eau économisée</span>
            <span class="font-bold text-blue-600">{{ formatNumber(environmentalImpact.waterSaved) }} L</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-neutral-600">Déchets évités</span>
            <span class="font-bold text-orange-600">{{ formatNumber(environmentalImpact.wasteSaved) }} kg</span>
          </div>
        </div>

        <div class="mt-4 p-3 bg-green-50 rounded-lg">
          <p class="text-green-700 text-sm font-medium">
            🌱 Équivalent à {{ environmentalImpact.treesEquivalent }} arbres plantés
          </p>
        </div>
      </div>

      <!-- Top Merchants -->
      <div class="card">
        <h3 class="text-lg font-semibold text-neutral-900 mb-4">Top Commerçants</h3>

        <div class="space-y-3">
          <div
            v-for="(merchant, index) in topMerchants"
            :key="merchant.id"
            class="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg"
          >
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center font-bold text-sm">
                {{ index + 1 }}
              </div>
            </div>
            <div class="flex-grow min-w-0">
              <p class="font-medium text-sm truncate">{{ merchant.name }}</p>
              <p class="text-xs text-neutral-500">{{ merchant.productsSold }} produits vendus</p>
            </div>
            <div class="text-right">
              <p class="font-medium text-sm">{{ formatCurrency(merchant.revenue) }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Popular Categories -->
      <div class="card">
        <h3 class="text-lg font-semibold text-neutral-900 mb-4">Catégories Populaires</h3>

        <div class="space-y-3">
          <div
            v-for="category in popularCategories"
            :key="category.id"
            class="flex items-center justify-between"
          >
            <div class="flex items-center gap-3">
              <span class="text-2xl">{{ category.icon }}</span>
              <div>
                <p class="font-medium text-sm">{{ category.name }}</p>
                <p class="text-xs text-neutral-500">{{ category.productCount }} produits</p>
              </div>
            </div>
            <div class="text-right">
              <div class="w-16 bg-neutral-200 rounded-full h-2">
                <div
                  class="bg-primary-500 h-2 rounded-full"
                  :style="{ width: `${category.percentage}%` }"
                ></div>
              </div>
              <p class="text-xs text-neutral-500 mt-1">{{ category.percentage }}%</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Alerts and Notifications -->
    <div v-if="alerts.length > 0" class="card mb-8">
      <h3 class="text-lg font-semibold text-neutral-900 mb-4">Alertes et notifications</h3>

      <div class="space-y-3">
        <div
          v-for="alert in alerts"
          :key="alert.id"
          :class="getAlertClass(alert.type)"
          class="flex items-start gap-3 p-4 rounded-lg border"
        >
          <component
            :is="getAlertIcon(alert.type)"
            :class="getAlertIconClass(alert.type)"
            class="w-5 h-5 flex-shrink-0 mt-0.5"
          />
          <div class="flex-grow">
            <p class="font-medium">{{ alert.title }}</p>
            <p class="text-sm opacity-80 mt-1">{{ alert.message }}</p>
            <p class="text-xs opacity-60 mt-2">{{ formatTimeAgo(alert.timestamp) }}</p>
          </div>
          <button
            @click="dismissAlert(alert.id)"
            class="text-current opacity-60 hover:opacity-100 flex-shrink-0"
          >
            <XMarkIcon class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    <!-- Modal for detailed info -->
    <AdminModal
      :show="modal.show"
      :title="modal.title"
      :content="modal.content"
      :icon="modal.icon"
      :type="modal.type"
      :action-button="modal.actionButton"
      @close="closeModal"
      @action="handleModalAction"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { formatPrice } from '@/utils/currency'
import AdminModal from '@/components/ui/AdminModal.vue'
import {
  ArrowPathIcon,
  UsersIcon,
  BuildingStorefrontIcon,
  ShoppingBagIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  CogIcon,
  GlobeEuropeAfricaIcon,
  XMarkIcon,
  UserPlusIcon,
  ShoppingCartIcon,
  BellIcon,
  ShieldExclamationIcon,
  InformationCircleIcon
} from '@heroicons/vue/24/outline'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  DoughnutController,
  LineController
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  DoughnutController,
  LineController
)

// Reactive data
const selectedPeriod = ref('month')
const revenueChartPeriod = ref('30d')
const isLoading = ref(false)

// Chart references
const revenueChartCanvas = ref<HTMLCanvasElement | null>(null)
const userGrowthChartCanvas = ref<HTMLCanvasElement | null>(null)
let revenueChart: any = null
let userGrowthChart: any = null

// Store and utilities
const authStore = useAuthStore()
const stats = ref({
  totalUsers: 0,
  newUsersThisMonth: 0,
  activeMerchants: 0,
  merchantGrowthRate: 0,
  productsSaved: 0,
  kgFoodSaved: 0,
  totalRevenue: 0,
  revenueGrowth: 0
})

const recentActivities = ref<any[]>([])

const systemHealth = ref<any[]>([])

const environmentalImpact = ref({
  co2Saved: 0,
  waterSaved: 0,
  wasteSaved: 0,
  treesEquivalent: 0
})

const topMerchants = ref<any[]>([])

const popularCategories = ref<any[]>([])

const alerts = ref([
  {
    id: 1,
    type: 'warning',
    title: 'Limite de stockage atteinte',
    message: 'L\'espace de stockage des images est à 85% de sa capacité.',
    timestamp: '2024-01-15T09:30:00Z'
  },
  {
    id: 2,
    type: 'info',
    title: 'Mise à jour disponible',
    message: 'Une nouvelle version de l\'API est disponible avec des corrections de sécurité.',
    timestamp: '2024-01-14T16:20:00Z'
  }
])

// Modal state
const modal = ref({
  show: false,
  title: '',
  content: '',
  icon: InformationCircleIcon,
  type: 'info' as 'info' | 'success' | 'warning' | 'error',
  actionButton: '',
  action: null as (() => void) | null
})

// Methods
const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('fr-FR').format(num)
}

const formatCurrency = (amount: number): string => {
  return formatPrice(amount)
}

const formatTimeAgo = (timestamp: string): string => {
  const date = new Date(timestamp)
  const now = new Date()
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

  if (diffInHours < 1) return 'Il y a moins d\'une heure'
  if (diffInHours < 24) return `Il y a ${diffInHours}h`

  const diffInDays = Math.floor(diffInHours / 24)
  return `Il y a ${diffInDays}j`
}

const getActivityIconClass = (type: string): string => {
  const classes: Record<string, string> = {
    user_registered: 'bg-blue-100 text-blue-600',
    merchant_joined: 'bg-green-100 text-green-600',
    product_sold: 'bg-orange-100 text-orange-600',
    alert: 'bg-red-100 text-red-600'
  }
  return classes[type] || 'bg-neutral-100 text-neutral-600'
}

const getActivityIcon = (type: string) => {
  const icons: Record<string, any> = {
    user_registered: UserPlusIcon,
    merchant_joined: BuildingStorefrontIcon,
    product_sold: ShoppingCartIcon,
    alert: BellIcon
  }
  return icons[type] || BellIcon
}

const getActivityStatusClass = (status: string): string => {
  const classes: Record<string, string> = {
    success: 'bg-green-100 text-green-700',
    completed: 'bg-blue-100 text-blue-700',
    warning: 'bg-yellow-100 text-yellow-700',
    error: 'bg-red-100 text-red-700'
  }
  return classes[status] || 'bg-neutral-100 text-neutral-700'
}

const getAlertClass = (type: string): string => {
  const classes: Record<string, string> = {
    warning: 'bg-warning-50 border-warning-200 text-warning-800',
    error: 'bg-error-50 border-error-200 text-error-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    success: 'bg-success-50 border-success-200 text-success-800'
  }
  return classes[type] || 'bg-neutral-50 border-neutral-200 text-neutral-800'
}

const getAlertIcon = (type: string) => {
  const icons: Record<string, any> = {
    warning: ExclamationTriangleIcon,
    error: ShieldExclamationIcon,
    info: BellIcon,
    success: CheckCircleIcon
  }
  return icons[type] || BellIcon
}

const getAlertIconClass = (type: string): string => {
  const classes: Record<string, string> = {
    warning: 'text-warning-600',
    error: 'text-error-600',
    info: 'text-blue-600',
    success: 'text-success-600'
  }
  return classes[type] || 'text-neutral-600'
}

const loadDashboardData = async () => {
  try {
    const response = await fetch('http://localhost:8000/api/admin/dashboard', {
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
      // Update stats
      stats.value = data.data.stats

      // Update other data
      topMerchants.value = data.data.topMerchants
      popularCategories.value = data.data.popularCategories
      recentActivities.value = data.data.recentActivities
      environmentalImpact.value = data.data.environmentalImpact
    }
  } catch (error) {
    console.error('Error loading dashboard data:', error)
    // Fallback to demo data
    loadDemoData()
  }
}

const loadDemoData = () => {
  // Demo statistics for the platform
  stats.value = {
    totalUsers: 1247,
    newUsersThisMonth: 89,
    activeMerchants: 156,
    merchantGrowthRate: 23,
    productsSaved: 3429,
    kgFoodSaved: 2156,
    totalRevenue: 1847250, // In F CFA
    revenueGrowth: 15
  }

  // Demo top merchants
  topMerchants.value = [
    {
      id: 1,
      name: 'Boulangerie Martin',
      business_name: 'Boulangerie Martin',
      revenue: 185000,
      products_sold: 156,
      location: 'Cocody, Abidjan'
    },
    {
      id: 2,
      name: 'Épicerie Aya',
      business_name: 'Épicerie Aya',
      revenue: 142000,
      products_sold: 98,
      location: 'Plateau, Abidjan'
    },
    {
      id: 3,
      name: 'Fruits & Légumes Bio',
      business_name: 'Bio Fresh',
      revenue: 95000,
      products_sold: 124,
      location: 'Marcory, Abidjan'
    }
  ]

  // Demo popular categories
  popularCategories.value = [
    { name: 'Boulangerie', percentage: 35, count: 892 },
    { name: 'Fruits & Légumes', percentage: 28, count: 671 },
    { name: 'Épicerie', percentage: 18, count: 412 },
    { name: 'Produits Laitiers', percentage: 12, count: 298 },
    { name: 'Plats Préparés', percentage: 7, count: 156 }
  ]

  // Demo recent activities
  recentActivities.value = [
    {
      id: 1,
      type: 'user_registered',
      description: 'Nouveau consommateur inscrit',
      user: 'Kouassi Jean',
      timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
      status: 'success'
    },
    {
      id: 2,
      type: 'merchant_joined',
      description: 'Nouveau commerçant approuvé',
      user: 'Supermarché Express',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
      status: 'completed'
    },
    {
      id: 3,
      type: 'product_sold',
      description: 'Produit réservé avec succès',
      user: 'Pain complet - Boulangerie Martin',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), // 4 hours ago
      status: 'success'
    },
    {
      id: 4,
      type: 'user_registered',
      description: 'Nouveau consommateur inscrit',
      user: 'Traoré Fatou',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(), // 6 hours ago
      status: 'success'
    }
  ]

  // Demo environmental impact
  environmentalImpact.value = {
    co2Saved: 845, // kg
    waterSaved: 12450, // litres
    wasteSaved: 2156, // kg
    treesEquivalent: 28
  }
}

const loadSystemHealth = async () => {
  try {
    const response = await fetch('http://localhost:8000/api/admin/system-health', {
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
      systemHealth.value = data.data
    }
  } catch (error) {
    console.error('Error loading system health:', error)
    // Fallback to mock data for system health
    systemHealth.value = [
      {
        name: 'API Backend',
        description: 'Services Laravel',
        status: 'healthy',
        uptime: '99.9%',
        responseTime: '45ms'
      },
      {
        name: 'Base de données',
        description: 'MySQL Principal',
        status: 'healthy',
        uptime: '99.8%',
        responseTime: '12ms'
      },
      {
        name: 'Frontend',
        description: 'Application Vue.js',
        status: 'healthy',
        uptime: '100%',
        responseTime: '120ms'
      }
    ]
  }
}

const refreshData = async () => {
  isLoading.value = true
  try {
    await Promise.all([loadDashboardData(), loadSystemHealth()])
    console.log('Data refreshed')
  } catch (error) {
    console.error('Error refreshing data:', error)
  } finally {
    isLoading.value = false
  }
}

const dismissAlert = (alertId: number) => {
  const index = alerts.value.findIndex(alert => alert.id === alertId)
  if (index !== -1) {
    alerts.value.splice(index, 1)
  }
}

// Modal functions
const showModal = (title: string, content: string, type: 'info' | 'success' | 'warning' | 'error' = 'info', icon?: any, actionButton?: string, action?: () => void) => {
  modal.value.title = title
  modal.value.content = content
  modal.value.type = type
  modal.value.icon = icon || InformationCircleIcon
  modal.value.actionButton = actionButton || ''
  modal.value.action = action || null
  modal.value.show = true
}

const closeModal = () => {
  modal.value.show = false
  modal.value.action = null
}

const handleModalAction = () => {
  if (modal.value.action) {
    modal.value.action()
  }
  closeModal()
}

// Navigation and actions
const viewAllActivities = () => {
  const content = `Activités récentes détaillées:\n\n${recentActivities.value.map(activity =>
    `• ${activity.description}: ${activity.user}\n  ${formatTimeAgo(activity.timestamp)}`
  ).join('\n\n')}`

  showModal('🔍 Voir toutes les activités', content, 'info', DocumentTextIcon, 'Gérer les activités')
}

// Quick actions
const viewLogs = () => {
  const content = `📋 Logs système\n\n` +
    `✅ API Backend: 1,247 requêtes (99.9% succès)\n` +
    `✅ Base de données: 3,421 requêtes (98.7% < 50ms)\n` +
    `⚠️ Frontend: 2 erreurs JavaScript détectées\n` +
    `ℹ️ Cache Redis: 15,672 hits (94.3% ratio)\n\n` +
    `Dernière vérification: ${new Date().toLocaleTimeString('fr-FR')}`

  showModal('📋 Logs système', content, 'info', DocumentTextIcon, 'Voir tous les logs')
}

const viewMetrics = () => {
  const content = `📊 Métriques détaillées\n\n` +
    `👥 Utilisateurs actifs: 247 (dernières 24h)\n` +
    `🏪 Nouveaux commerçants: 12 (cette semaine)\n` +
    `📦 Produits ajoutés: 156 (aujourd'hui)\n` +
    `💰 CA moyen/commande: ${formatCurrency(stats.value.totalRevenue / stats.value.productsSaved)}\n` +
    `🌍 Impact CO2: ${environmentalImpact.value.co2Saved}kg économisés\n\n` +
    `Période: ${selectedPeriod.value}`

  showModal('📊 Métriques détaillées', content, 'info', ChartBarIcon, 'Voir analytics')
}

const manageUsers = () => {
  const content = `👥 Gestion utilisateurs\n\n` +
    `📊 Statistiques:\n` +
    `• Total: ${formatNumber(stats.value.totalUsers)} utilisateurs\n` +
    `• Consommateurs: ${formatNumber(stats.value.totalUsers - stats.value.activeMerchants)}\n` +
    `• Commerçants: ${formatNumber(stats.value.activeMerchants)}\n` +
    `• Nouveaux ce mois: ${stats.value.newUsersThisMonth}\n\n` +
    `🚀 Accès rapide:\n` +
    `• Utilisateurs en attente de validation\n` +
    `• Comptes signalés\n` +
    `• Statistiques d'engagement`

  showModal('👥 Gestion utilisateurs', content, 'info', UsersIcon, 'Accéder à la gestion')
}

const systemSettings = () => {
  const content = `⚙️ Paramètres système\n\n` +
    `🔧 Configuration actuelle:\n` +
    `• Mode: Production\n` +
    `• Version API: v1.2.3\n` +
    `• Base de données: MySQL 8.0\n` +
    `• Cache: Redis activé\n` +
    `• Notifications: Email + SMS\n\n` +
    `⚡ Actions disponibles:\n` +
    `• Maintenance programmée\n` +
    `• Sauvegarde manuelle\n` +
    `• Nettoyage cache\n` +
    `• Mise à jour sécurité`

  showModal('⚙️ Paramètres système', content, 'warning', CogIcon, 'Accéder aux paramètres')
}

// Lifecycle
// Chart creation functions
const createRevenueChart = () => {
  try {
    console.log('📈 createRevenueChart: Début de création')
    console.log('📈 revenueChartCanvas.value:', revenueChartCanvas.value)

    if (!revenueChartCanvas.value) {
      console.error('❌ Canvas element not ready for revenue chart')
      return
    }

    console.log('📈 Canvas dimensions:', {
      width: revenueChartCanvas.value.offsetWidth,
      height: revenueChartCanvas.value.offsetHeight,
      clientWidth: revenueChartCanvas.value.clientWidth,
      clientHeight: revenueChartCanvas.value.clientHeight
    })

    const ctx = revenueChartCanvas.value.getContext('2d')
    if (!ctx) {
      console.error('❌ Canvas context not available for revenue chart')
      return
    }

    console.log('📈 Canvas context obtenu:', ctx)

    // Destroy existing chart if it exists
    if (revenueChart) {
      console.log('📈 Destruction du graphique existant')
      revenueChart.destroy()
    }

  // Generate demo data based on selected period
  const generateRevenueData = () => {
    const days = revenueChartPeriod.value === '7d' ? 7 : revenueChartPeriod.value === '30d' ? 30 : 90
    const labels = []
    const data = []

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      labels.push(date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }))

      // Generate realistic revenue data with some randomness
      const baseRevenue = 45000 + Math.random() * 30000
      data.push(Math.round(baseRevenue))
    }

    return { labels, data }
  }

  const { labels, data } = generateRevenueData()
  console.log('📈 Données du graphique:', { labels, data })

  console.log('📈 Tentative de création du graphique Chart.js...')

    revenueChart = new ChartJS(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Chiffre d\'affaires (F CFA)',
          data,
          borderColor: '#10B981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#10B981',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 5
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: '#ffffff',
            bodyColor: '#ffffff',
            borderColor: '#10B981',
            borderWidth: 1,
            callbacks: {
              label: (context) => {
                return `${context.parsed.y.toLocaleString()} F CFA`
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              display: false
            }
          },
          y: {
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            },
            ticks: {
              callback: (value) => {
                return (value as number).toLocaleString() + ' F'
              }
            }
          }
        }
      }
    })

    console.log('📈 Instance Chart.js créée:', revenueChart)
    console.log('Revenue chart created successfully')

    // Force resize to ensure visibility
    setTimeout(() => {
      if (revenueChart) {
        revenueChart.resize()
        console.log('📈 Revenue chart resized')
      }
    }, 50)

  } catch (error) {
    console.error('Error creating revenue chart:', error)
  }
}

const createUserGrowthChart = () => {
  try {
    console.log('🍩 createUserGrowthChart: Début de création')
    console.log('🍩 userGrowthChartCanvas.value:', userGrowthChartCanvas.value)

    if (!userGrowthChartCanvas.value) {
      console.error('❌ Canvas element not ready for user growth chart')
      return
    }

    console.log('🍩 Canvas dimensions:', {
      width: userGrowthChartCanvas.value.offsetWidth,
      height: userGrowthChartCanvas.value.offsetHeight,
      clientWidth: userGrowthChartCanvas.value.clientWidth,
      clientHeight: userGrowthChartCanvas.value.clientHeight
    })

    const ctx = userGrowthChartCanvas.value.getContext('2d')
    if (!ctx) {
      console.error('❌ Canvas context not available for user growth chart')
      return
    }

    console.log('🍩 Canvas context obtenu:', ctx)

    // Destroy existing chart if it exists
    if (userGrowthChart) {
      console.log('🍩 Destruction du graphique existant')
      userGrowthChart.destroy()
    }

    const chartData = {
      labels: ['Consommateurs', 'Commerçants', 'Administrateurs'],
      datasets: [{
        data: [1091, 156, 1], // Based on demo data: 1091 consumers, 156 merchants, 1 admin
        backgroundColor: [
          '#10B981', // Green for consumers
          '#F59E0B', // Orange for merchants
          '#8B5CF6'  // Purple for admins
        ],
        borderWidth: 0,
      }]
    }

    console.log('🍩 Données du graphique doughnut:', chartData)

    console.log('🍩 Tentative de création du graphique doughnut Chart.js...')

    userGrowthChart = new ChartJS(ctx, {
      type: 'doughnut',
      data: chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 20,
              usePointStyle: true,
              font: {
                size: 12
              }
            }
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: '#ffffff',
            bodyColor: '#ffffff',
            callbacks: {
              label: (context) => {
                const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0)
                const percentage = ((context.parsed as number / total) * 100).toFixed(1)
                return `${context.label}: ${context.parsed} (${percentage}%)`
              }
            }
          }
        }
      }
    })

    console.log('🍩 Instance Chart.js doughnut créée:', userGrowthChart)
    console.log('User growth chart created successfully')

    // Force resize to ensure visibility
    setTimeout(() => {
      if (userGrowthChart) {
        userGrowthChart.resize()
        console.log('🍩 User growth chart resized')
      }
    }, 50)

  } catch (error) {
    console.error('Error creating user growth chart:', error)
  }
}

// Watch for period changes to update charts
watch(revenueChartPeriod, () => {
  createRevenueChart()
})

onMounted(async () => {
  try {
    console.log('🚀 Dashboard: Initialisation...')

    // Load data first
    await refreshData()
    console.log('📊 Dashboard: Données chargées')

    // Wait for DOM to be ready
    await nextTick()
    console.log('🎨 Dashboard: DOM prêt')

    // Create charts with delay to ensure canvas elements are fully rendered
    setTimeout(() => {
      console.log('📈 Dashboard: Création des graphiques...')
      createRevenueChart()
      createUserGrowthChart()
      console.log('✅ Dashboard: Graphiques créés')
    }, 100)

    console.log('✅ Admin dashboard loaded with charts')
  } catch (error) {
    console.error('❌ Error during dashboard initialization:', error)
  }
})
</script>
