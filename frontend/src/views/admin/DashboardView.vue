<template>
  <div class="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50 p-6">
    <!-- Header -->
    <div class="mb-8">
      <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div>
          <h1 class="text-3xl lg:text-4xl font-display font-bold text-neutral-900 mb-2">
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
              <CurrencyEuroIcon class="w-8 h-8" />
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
        <div class="h-64 flex items-center justify-center bg-neutral-50 rounded-lg">
          <div class="text-center">
            <ChartBarIcon class="w-16 h-16 text-neutral-300 mx-auto mb-2" />
            <p class="text-neutral-500">Graphique des revenus</p>
            <p class="text-sm text-neutral-400">Intégration Chart.js à venir</p>
          </div>
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
        <div class="h-64 flex items-center justify-center bg-neutral-50 rounded-lg">
          <div class="text-center">
            <ChartPieIcon class="w-16 h-16 text-neutral-300 mx-auto mb-2" />
            <p class="text-neutral-500">Graphique de croissance</p>
            <p class="text-sm text-neutral-400">Intégration Chart.js à venir</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Platform Activity -->
    <div class="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
      <!-- Recent Activity -->
      <div class="xl:col-span-2 card">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-xl font-semibold text-neutral-900">Activité récente</h3>
          <button class="text-primary-600 text-sm hover:text-primary-700">
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
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
  ArrowPathIcon,
  UsersIcon,
  BuildingStorefrontIcon,
  ShoppingBagIcon,
  CurrencyEuroIcon,
  ChartBarIcon,
  ChartPieIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  CogIcon,
  GlobeEuropeAfricaIcon,
  XMarkIcon,
  UserPlusIcon,
  ShoppingCartIcon,
  BellIcon,
  ShieldExclamationIcon
} from '@heroicons/vue/24/outline'

// Reactive data
const selectedPeriod = ref('month')
const revenueChartPeriod = ref('30d')
const isLoading = ref(false)

// Mock data
const stats = ref({
  totalUsers: 12547,
  newUsersThisMonth: 1247,
  activeMerchants: 523,
  merchantGrowthRate: 15.3,
  productsSaved: 25847,
  kgFoodSaved: 18500,
  totalRevenue: 156780,
  revenueGrowth: 23.5
})

const recentActivities = ref([
  {
    id: 1,
    type: 'user_registered',
    title: 'Nouvel utilisateur inscrit',
    description: 'Marie Dupont s\'est inscrite comme consommatrice',
    timestamp: '2024-01-15T14:30:00Z',
    status: 'success'
  },
  {
    id: 2,
    type: 'merchant_joined',
    title: 'Nouveau commerçant',
    description: 'Boulangerie Martin a rejoint la plateforme',
    timestamp: '2024-01-15T12:15:00Z',
    status: 'success'
  },
  {
    id: 3,
    type: 'product_sold',
    title: 'Produit vendu',
    description: 'Pain de campagne bio vendu par Artisan Baker',
    timestamp: '2024-01-15T11:45:00Z',
    status: 'completed'
  },
  {
    id: 4,
    type: 'alert',
    title: 'Alerte système',
    description: 'Pic d\'utilisation détecté sur le serveur web',
    timestamp: '2024-01-15T10:20:00Z',
    status: 'warning'
  }
])

const systemHealth = ref([
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
  },
  {
    name: 'CDN Images',
    description: 'Stockage média',
    status: 'warning',
    uptime: '98.5%',
    responseTime: '250ms'
  }
])

const environmentalImpact = ref({
  co2Saved: 15420,
  waterSaved: 125000,
  wasteSaved: 18500,
  treesEquivalent: 342
})

const topMerchants = ref([
  { id: 1, name: 'Boulangerie Artisanale', productsSold: 145, revenue: 2340.50 },
  { id: 2, name: 'Ferme Bio Martin', productsSold: 98, revenue: 1876.20 },
  { id: 3, name: 'Épicerie du Coin', productsSold: 76, revenue: 1234.80 },
  { id: 4, name: 'Fromagerie Tradition', productsSold: 54, revenue: 987.30 },
  { id: 5, name: 'Maraîcher Local', productsSold: 43, revenue: 756.90 }
])

const popularCategories = ref([
  { id: 1, name: 'Boulangerie', icon: '🥖', productCount: 1247, percentage: 35 },
  { id: 2, name: 'Fruits & Légumes', icon: '🥬', productCount: 987, percentage: 28 },
  { id: 3, name: 'Fromages', icon: '🧀', productCount: 543, percentage: 15 },
  { id: 4, name: 'Plats préparés', icon: '🍲', productCount: 432, percentage: 12 },
  { id: 5, name: 'Viandes', icon: '🥩', productCount: 321, percentage: 10 }
])

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

// Methods
const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('fr-FR').format(num)
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount)
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

const refreshData = async () => {
  isLoading.value = true
  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
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

// Quick actions
const viewLogs = () => console.log('View logs')
const viewMetrics = () => console.log('View metrics')
const manageUsers = () => console.log('Manage users')
const systemSettings = () => console.log('System settings')

// Lifecycle
onMounted(() => {
  // Load initial data
  console.log('Admin dashboard loaded')
})
</script>
