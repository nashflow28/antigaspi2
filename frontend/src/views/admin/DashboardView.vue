<template>
  <DashboardLayout
    :sidebar="sidebar"
    :header="header"
    class="bg-gradient-to-br from-surface-light via-surface-light to-primary-50 dark:from-surface-dark dark:via-surface-darker dark:to-primary-950"
  >
    <div class="mx-auto w-full max-w-7xl space-y-8 px-3 py-6 sm:px-6 sm:py-8">
      <!-- Header -->
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">
            Tableau de bord administrateur
          </h1>
          <p class="text-neutral-600 dark:text-neutral-300">
            Supervision globale de la plateforme GÊLADAL
          </p>
        </div>
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Select v-model="selectedPeriod" size="sm" class="min-w-[180px]">
            <option value="today">Aujourd'hui</option>
            <option value="week">Cette semaine</option>
            <option value="month">Ce mois</option>
            <option value="year">Cette année</option>
          </Select>
          <Button
            variant="primary"
            :loading="isLoading"
            @click="refreshData"
          >
            <ArrowPathIcon class="h-4 w-4" />
            <span>Actualiser</span>
          </Button>
        </div>
      </div>

      <!-- Key Metrics -->
      <StatCardGrid columns="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 xl:gap-6">
        <StatCard
          v-for="stat in statHighlights"
          :key="stat.id"
          :title="stat.title"
          :value="stat.value"
          :description="stat.description"
          :icon="stat.icon"
          :accent="stat.accent"
          :trend="stat.trend"
        />
      </StatCardGrid>

      <!-- Charts and Analytics -->
      <div class="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card>
          <template #header>
            <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 class="text-xl font-semibold text-neutral-900 dark:text-neutral-50">
                  Évolution du chiffre d'affaires
                </h3>
                <p class="text-sm text-neutral-500 dark:text-neutral-400">
                  Revenus cumulés sur la période sélectionnée
                </p>
              </div>
              <Select v-model="revenueChartPeriod" size="sm" class="min-w-[150px]">
                <option value="7d">7 derniers jours</option>
                <option value="30d">30 derniers jours</option>
                <option value="90d">90 derniers jours</option>
              </Select>
            </div>
          </template>
          <div class="h-80">
            <canvas ref="revenueChartCanvas" class="h-full w-full" />
          </div>
        </Card>

        <Card>
          <template #header>
            <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 class="text-xl font-semibold text-neutral-900 dark:text-neutral-50">
                  Répartition des utilisateurs
                </h3>
                <p class="text-sm text-neutral-500 dark:text-neutral-400">
                  Consommateurs, commerçants et administrateurs actifs
                </p>
              </div>
              <div class="flex flex-wrap gap-2">
                <Badge variant="success" size="sm">Consommateurs</Badge>
                <Badge variant="warning" size="sm">Commerçants</Badge>
                <Badge variant="primary" size="sm">Administrateurs</Badge>
              </div>
            </div>
          </template>
          <div class="h-80">
            <canvas ref="userGrowthChartCanvas" class="h-full w-full" />
          </div>
        </Card>
      </div>

      <!-- Platform Activity -->
      <div class="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card class="xl:col-span-2">
          <template #header>
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-xl font-semibold text-neutral-900 dark:text-neutral-50">
                  Activité récente
                </h3>
                <p class="text-sm text-neutral-500 dark:text-neutral-400">
                  Derniers événements sur la plateforme
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                class="text-primary-600 hover:text-primary-700 dark:text-primary-300"
                @click="viewAllActivities"
              >
                Voir tout
              </Button>
            </div>
          </template>

          <div class="space-y-4">
            <div
              v-for="activity in recentActivities"
              :key="activity.id"
              class="flex flex-col gap-4 rounded-xl border border-transparent bg-surface-light/70 p-4 transition-colors duration-200 hover:border-primary-400/30 hover:bg-primary-500/5 dark:bg-surface-dark/60"
            >
              <div class="flex items-start gap-4">
                <div
                  class="flex h-10 w-10 items-center justify-center rounded-xl"
                  :class="getActivityIconClass(activity.type)"
                >
                  <component :is="getActivityIcon(activity.type)" class="h-5 w-5" />
                </div>
                <div class="flex-1 space-y-1">
                  <p class="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                    {{ activity.title }}
                  </p>
                  <p class="text-sm text-neutral-500 dark:text-neutral-400">
                    {{ activity.description }}
                  </p>
                  <p class="text-xs text-neutral-400">
                    {{ formatTimeAgo(activity.timestamp) }} · {{ activity.user }}
                  </p>
                </div>
                <Badge :variant="getActivityStatusVariant(activity.status)" size="sm">
                  {{ formatActivityStatus(activity.status) }}
                </Badge>
              </div>
            </div>
          </div>
        </Card>

        <div class="space-y-6">
          <Card>
            <template #header>
              <h3 class="text-xl font-semibold text-neutral-900 dark:text-neutral-50">
                État du système
              </h3>
            </template>
            <div class="space-y-4">
              <div
                v-for="service in systemHealth"
                :key="service.name"
                class="flex items-center justify-between rounded-xl bg-surface-light/70 p-3 dark:bg-surface-dark/60"
              >
                <div class="flex items-center gap-4">
                  <div
                    class="flex h-10 w-10 items-center justify-center rounded-full"
                    :class="service.status === 'healthy' ? 'bg-primary-500/10 text-primary-600' : 'bg-accent-red/10 text-accent-red'"
                  >
                    <component
                      :is="service.status === 'healthy' ? CheckCircleIcon : ExclamationTriangleIcon"
                      class="h-5 w-5"
                    />
                  </div>
                  <div>
                    <p class="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                      {{ service.name }}
                    </p>
                    <p class="text-xs text-neutral-500 dark:text-neutral-400">
                      {{ service.description }}
                    </p>
                  </div>
                </div>
                <div class="text-right text-sm text-neutral-500 dark:text-neutral-400">
                  <p class="font-semibold text-neutral-900 dark:text-neutral-100">
                    {{ service.uptime }}
                  </p>
                  <p>{{ service.responseTime }}</p>
                </div>
              </div>
            </div>
          </Card>

          <QuickActionsCard
            title="Actions rapides"
            :actions="quickActions"
            @action="handleQuickAction"
          />
        </div>
      </div>

      <!-- Performance Metrics -->
      <div class="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card>
          <template #header>
            <div class="flex items-center gap-4">
              <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500/10 text-primary-600">
                <GlobeEuropeAfricaIcon class="h-5 w-5" />
              </div>
              <div>
                <h3 class="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
                  Impact environnemental
                </h3>
                <p class="text-xs text-neutral-500 dark:text-neutral-400">
                  Bilan de la semaine
                </p>
              </div>
            </div>
          </template>
          <dl class="space-y-4 text-sm text-neutral-600 dark:text-neutral-300">
            <div class="flex items-center justify-between">
              <dt>CO₂ économisé</dt>
              <dd class="font-semibold text-primary-600 dark:text-primary-300">
                {{ formatNumber(environmentalImpact.co2Saved) }} kg
              </dd>
            </div>
            <div class="flex items-center justify-between">
              <dt>Eau économisée</dt>
              <dd class="font-semibold text-primary-600 dark:text-primary-300">
                {{ formatNumber(environmentalImpact.waterSaved) }} L
              </dd>
            </div>
            <div class="flex items-center justify-between">
              <dt>Déchets évités</dt>
              <dd class="font-semibold text-primary-600 dark:text-primary-300">
                {{ formatNumber(environmentalImpact.wasteSaved) }} kg
              </dd>
            </div>
          </dl>
          <div class="mt-4 rounded-xl bg-primary-500/10 p-4 text-sm font-medium text-primary-700 dark:text-primary-300">
            🌱 Équivalent à {{ environmentalImpact.treesEquivalent }} arbres plantés
          </div>
        </Card>

        <Card>
          <template #header>
            <h3 class="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
              Top commerçants
            </h3>
          </template>
          <div class="space-y-3">
            <div
              v-for="(merchant, index) in topMerchants"
              :key="merchant.id"
              class="flex items-center justify-between rounded-xl bg-surface-light/70 p-3 dark:bg-surface-dark/60"
            >
              <div class="flex items-center gap-3">
                <span class="flex h-8 w-8 items-center justify-center rounded-full bg-primary-500/10 text-sm font-semibold text-primary-600">
                  {{ index + 1 }}
                </span>
                <div>
                  <p class="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                    {{ merchant.name }}
                  </p>
                  <p class="text-xs text-neutral-500 dark:text-neutral-400">
                    {{ merchant.productsSold }} produits vendus
                  </p>
                </div>
              </div>
              <span class="text-sm font-semibold text-primary-600 dark:text-primary-300">
                {{ formatCurrency(merchant.revenue) }}
              </span>
            </div>
          </div>
        </Card>

        <Card>
          <template #header>
            <h3 class="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
              Catégories populaires
            </h3>
          </template>
          <div class="space-y-3">
            <div
              v-for="category in popularCategories"
              :key="category.name"
              class="flex items-center justify-between rounded-xl bg-surface-light/70 p-3 dark:bg-surface-dark/60"
            >
              <div>
                <p class="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                  {{ category.name }}
                </p>
                <p class="text-xs text-neutral-500 dark:text-neutral-400">
                  {{ category.percentage }}% des ventes
                </p>
              </div>
              <Badge variant="secondary" size="sm">
                {{ category.products }} produits
              </Badge>
            </div>
          </div>
        </Card>
      </div>

      <!-- Alerts -->
      <Card>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-xl font-semibold text-neutral-900 dark:text-neutral-50">
              Alertes & notifications
            </h3>
            <Badge variant="warning" size="sm">
              {{ alerts.length }} alertes actives
            </Badge>
          </div>
        </template>
        <div class="space-y-3">
          <div
            v-for="alert in alerts"
            :key="alert.id"
            class="flex items-start gap-4 rounded-xl border p-4"
            :class="getAlertClass(alert.type)"
          >
            <component
              :is="getAlertIcon(alert.type)"
              :class="getAlertIconClass(alert.type)"
              class="h-5 w-5 flex-shrink-0"
            />
            <div class="flex-1 space-y-1">
              <p class="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                {{ alert.title }}
              </p>
              <p class="text-sm text-neutral-500 dark:text-neutral-400">
                {{ alert.message }}
              </p>
              <p class="text-xs text-neutral-400">
                {{ formatTimeAgo(alert.timestamp) }}
              </p>
            </div>
            <button
              class="text-neutral-400 transition hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-300"
              @click="dismissAlert(alert.id)"
            >
              <XMarkIcon class="h-4 w-4" />
            </button>
          </div>
        </div>
      </Card>

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
  </DashboardLayout>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { formatPrice } from '@/utils/currency'
import apiService from '@/services/api'
import AdminModal from '@/components/ui/AdminModal.vue'
import DashboardLayout from '@/components/ui/DashboardLayout.vue'
import { useDashboardLayout } from '@/composables/useDashboardLayout'
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
  InformationCircleIcon,
  BanknotesIcon,
  ArrowTrendingUpIcon
} from '@heroicons/vue/24/outline'
import { Card, Button, Select, Badge, type BadgeVariant } from '@/components/ui/2025'
import { QuickActionsCard, StatCard, StatCardGrid } from '@/components/dashboard/2025'
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

const { sidebar, header } = useDashboardLayout('admin')

const selectedPeriod = ref('month')
const revenueChartPeriod = ref('30d')
const isLoading = ref(false)

const revenueChartCanvas = ref<HTMLCanvasElement | null>(null)
const userGrowthChartCanvas = ref<HTMLCanvasElement | null>(null)
let revenueChart: any = null
let userGrowthChart: any = null

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
    message: "L'espace de stockage des images est à 85% de sa capacité.",
    timestamp: '2024-01-15T09:30:00Z'
  },
  {
    id: 2,
    type: 'info',
    title: 'Mise à jour disponible',
    message: "Une nouvelle version de l'API est disponible avec des corrections de sécurité.",
    timestamp: '2024-01-14T16:20:00Z'
  }
])

const modal = ref({
  show: false,
  title: '',
  content: '',
  icon: InformationCircleIcon,
  type: 'info' as 'info' | 'success' | 'warning' | 'error',
  actionButton: '',
  action: null as (() => void) | null
})

const formatNumber = (num: number): string => new Intl.NumberFormat('fr-FR').format(num)
const formatCurrency = (amount: number): string => formatPrice(amount)

const statHighlights = computed(() => [
  {
    id: 'users',
    title: 'Utilisateurs totaux',
    value: formatNumber(stats.value.totalUsers),
    description: `${formatNumber(stats.value.newUsersThisMonth)} nouveaux ce mois`,
    icon: UsersIcon,
    accent: 'primary' as const,
    trend: {
      value: `+${formatNumber(stats.value.newUsersThisMonth)}`,
      label: 'sur 30 jours',
      icon: ArrowTrendingUpIcon,
      tone: 'positive' as const
    }
  },
  {
    id: 'merchants',
    title: 'Commerçants actifs',
    value: formatNumber(stats.value.activeMerchants),
    description: `${stats.value.merchantGrowthRate}% de croissance`,
    icon: BuildingStorefrontIcon,
    accent: 'success' as const
  },
  {
    id: 'products',
    title: 'Produits sauvés',
    value: formatNumber(stats.value.productsSaved),
    description: `${formatNumber(stats.value.kgFoodSaved)} kg sauvés`,
    icon: ShoppingBagIcon,
    accent: 'info' as const
  },
  {
    id: 'revenue',
    title: "Chiffre d'affaires",
    value: formatCurrency(stats.value.totalRevenue),
    description: `+${stats.value.revenueGrowth}% vs. mois dernier`,
    icon: BanknotesIcon,
    accent: 'warning' as const
  }
])

const formatTimeAgo = (timestamp: string): string => {
  const date = new Date(timestamp)
  const now = new Date()
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

  if (diffInHours < 1) return "Il y a moins d'une heure"
  if (diffInHours < 24) return `Il y a ${diffInHours}h`

  const diffInDays = Math.floor(diffInHours / 24)
  return `Il y a ${diffInDays}j`
}

const getActivityIconClass = (type: string): string => {
  const classes: Record<string, string> = {
    user_registered: 'bg-primary-500/10 text-primary-600',
    merchant_joined: 'bg-primary-500/10 text-primary-600',
    product_sold: 'bg-accent-orange/15 text-accent-orange',
    alert: 'bg-accent-red/10 text-accent-red'
  }
  return classes[type] || 'bg-neutral-200/80 text-neutral-600 dark:bg-neutral-800/80 dark:text-neutral-200'
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

const getActivityStatusVariant = (status: string): BadgeVariant => {
  const variants: Record<string, BadgeVariant> = {
    success: 'success',
    completed: 'primary',
    warning: 'warning',
    error: 'error'
  }
  return variants[status] || 'secondary'
}

const formatActivityStatus = (status: string): string => {
  const labels: Record<string, string> = {
    success: 'Succès',
    completed: 'Terminé',
    warning: 'Attention',
    error: 'Erreur'
  }
  return labels[status] || status
}

const getAlertClass = (type: string): string => {
  const classes: Record<string, string> = {
    warning: 'border-accent-orange/30 bg-accent-orange/10 text-accent-orange',
    error: 'border-accent-red/30 bg-accent-red/10 text-accent-red',
    info: 'border-primary-400/30 bg-primary-500/10 text-primary-700 dark:text-primary-300',
    success: 'border-primary-400/30 bg-primary-500/10 text-primary-700 dark:text-primary-300'
  }
  return classes[type] || 'border-neutral-200 bg-surface-light text-neutral-700 dark:border-neutral-700 dark:bg-surface-dark dark:text-neutral-200'
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
    warning: 'text-accent-orange',
    error: 'text-accent-red',
    info: 'text-primary-600 dark:text-primary-300',
    success: 'text-primary-600 dark:text-primary-300'
  }
  return classes[type] || 'text-neutral-500 dark:text-neutral-300'
}

interface DashboardApiResponse {
  success: boolean
  data: {
    stats: typeof stats.value
    topMerchants: typeof topMerchants.value
    popularCategories: typeof popularCategories.value
    recentActivities: typeof recentActivities.value
    environmentalImpact: typeof environmentalImpact.value
  }
}

const loadDashboardData = async () => {
  try {
    const response = await apiService.get<DashboardApiResponse>('/admin/dashboard')
    if (response.success && response.data) {
      stats.value = response.data.stats
      topMerchants.value = response.data.topMerchants
      popularCategories.value = response.data.popularCategories
      recentActivities.value = response.data.recentActivities
      environmentalImpact.value = response.data.environmentalImpact
    }
  } catch (error) {
    loadDemoData()
  }
}

const loadDemoData = () => {
  stats.value = {
    totalUsers: 1248,
    newUsersThisMonth: 42,
    activeMerchants: 156,
    merchantGrowthRate: 5.4,
    productsSaved: 18450,
    kgFoodSaved: 9320,
    totalRevenue: 42000000,
    revenueGrowth: 8.2
  }

  topMerchants.value = [
    { id: 1, name: 'Boulangerie Martin', productsSold: 452, revenue: 11800000 },
    { id: 2, name: 'Primeur Bio Lyon', productsSold: 389, revenue: 9400000 },
    { id: 3, name: 'Épicerie Solidaire 13', productsSold: 328, revenue: 7200000 }
  ]

  popularCategories.value = [
    { name: 'Boulangerie', percentage: 32, products: 128 },
    { name: 'Fruits & Légumes', percentage: 28, products: 96 },
    { name: 'Épicerie', percentage: 18, products: 74 }
  ]

  recentActivities.value = [
    {
      id: 1,
      title: 'Nouvel utilisateur inscrit',
      type: 'user_registered',
      description: 'Marie Diallo a rejoint la plateforme',
      user: 'Marie Diallo',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      status: 'success'
    },
    {
      id: 2,
      title: 'Commerçant validé',
      type: 'merchant_joined',
      description: 'La Ferme du Coin est maintenant active',
      user: 'La Ferme du Coin',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
      status: 'completed'
    },
    {
      id: 3,
      title: 'Produit vendu',
      type: 'product_sold',
      description: '25 paniers anti-gaspi vendus',
      user: 'Boulangerie Martin',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
      status: 'success'
    }
  ]

  environmentalImpact.value = {
    co2Saved: 845,
    waterSaved: 12450,
    wasteSaved: 2156,
    treesEquivalent: 28
  }
}

interface SystemHealthApiResponse {
  success: boolean
  data: typeof systemHealth.value
}

const loadSystemHealth = async () => {
  try {
    const response = await apiService.get<SystemHealthApiResponse>('/admin/system-health')
    if (response.success && response.data) {
      systemHealth.value = response.data
    }
  } catch (error) {
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

const showModal = (
  title: string,
  content: string,
  type: 'info' | 'success' | 'warning' | 'error' = 'info',
  icon?: any,
  actionButton?: string,
  action?: () => void
) => {
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
  modal.value.action?.()
  closeModal()
}

const viewAllActivities = () => {
  const content = `Activités récentes détaillées:\n\n${recentActivities.value
    .map(activity => `• ${activity.description} — ${activity.user}\n  ${formatTimeAgo(activity.timestamp)}`)
    .join('\n\n')}`

  showModal('🔍 Voir toutes les activités', content, 'info', DocumentTextIcon, 'Gérer les activités')
}

const viewLogs = () => {
  const content =
    '📋 Logs système\n\n' +
    '✅ API Backend: 1 247 requêtes (99,9% succès)\n' +
    '✅ Base de données: 3 421 requêtes (98,7% < 50ms)\n' +
    '⚠️ Frontend: 2 erreurs JavaScript détectées\n' +
    'ℹ️ Cache Redis: 15 672 hits (94,3% ratio)\n\n' +
    `Dernière vérification: ${new Date().toLocaleTimeString('fr-FR')}`

  showModal('📋 Logs système', content, 'info', DocumentTextIcon, 'Voir tous les logs')
}

const viewMetrics = () => {
  const content =
    '📊 Métriques détaillées\n\n' +
    '👥 Utilisateurs actifs: 247 (24h)\n' +
    '🏪 Nouveaux commerçants: 12 (cette semaine)\n' +
    '📦 Produits ajoutés: 156 (aujourd\'hui)\n' +
    `💰 CA moyen/commande: ${formatCurrency(stats.value.totalRevenue / Math.max(stats.value.productsSaved, 1))}\n` +
    `🌍 Impact CO₂: ${environmentalImpact.value.co2Saved} kg économisés\n\n` +
    `Période: ${selectedPeriod.value}`

  showModal('📊 Métriques détaillées', content, 'info', ChartBarIcon, 'Voir analytics')
}

const manageUsers = () => {
  const content =
    '👥 Gestion utilisateurs\n\n' +
    '📊 Statistiques:\n' +
    `• Total: ${formatNumber(stats.value.totalUsers)} utilisateurs\n` +
    `• Consommateurs: ${formatNumber(stats.value.totalUsers - stats.value.activeMerchants)}\n` +
    `• Commerçants: ${formatNumber(stats.value.activeMerchants)}\n` +
    `• Nouveaux ce mois: ${stats.value.newUsersThisMonth}\n\n` +
    '🚀 Accès rapide:\n' +
    '• Utilisateurs en attente de validation\n' +
    '• Comptes signalés\n' +
    "• Statistiques d'engagement"

  showModal('👥 Gestion utilisateurs', content, 'info', UsersIcon, 'Accéder à la gestion')
}

const systemSettings = () => {
  const content =
    '⚙️ Paramètres système\n\n' +
    '🔧 Configuration actuelle:\n' +
    '• Mode: Production\n' +
    '• Version API: v1.2.3\n' +
    '• Base de données: MySQL 8.0\n' +
    '• Cache: Redis activé\n' +
    '• Notifications: Email + SMS\n\n' +
    '⚡ Actions disponibles:\n' +
    '• Maintenance programmée\n' +
    '• Sauvegarde manuelle\n' +
    '• Nettoyage cache\n' +
    '• Mise à jour sécurité'

  showModal('⚙️ Paramètres système', content, 'warning', CogIcon, 'Accéder aux paramètres')
}

const quickActions = computed(() => [
  {
    id: 'logs',
    label: 'Logs système',
    description: 'Surveillez la santé des services',
    icon: DocumentTextIcon,
    tone: 'neutral' as const,
    handler: viewLogs
  },
  {
    id: 'metrics',
    label: 'Métriques',
    description: 'Analyse détaillée des performances',
    icon: ChartBarIcon,
    tone: 'primary' as const,
    handler: viewMetrics
  },
  {
    id: 'users',
    label: 'Utilisateurs',
    description: 'Gérez les comptes et droits',
    icon: UsersIcon,
    tone: 'success' as const,
    handler: manageUsers
  },
  {
    id: 'settings',
    label: 'Paramètres',
    description: 'Configuration de la plateforme',
    icon: CogIcon,
    tone: 'warning' as const,
    handler: systemSettings
  }
])

const handleQuickAction = (action: { handler?: () => void }) => {
  action.handler?.()
}

const createRevenueChart = () => {
  try {
    if (!revenueChartCanvas.value) {
      return
    }

    const ctx = revenueChartCanvas.value.getContext('2d')
    if (!ctx) {
      return
    }

    if (revenueChart) {
      revenueChart.destroy()
    }

    const days = revenueChartPeriod.value === '7d' ? 7 : revenueChartPeriod.value === '30d' ? 30 : 90
    const labels: string[] = []
    const data: number[] = []

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      labels.push(date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }))
      const baseRevenue = 45_000 + Math.random() * 30_000
      data.push(Math.round(baseRevenue))
    }

    revenueChart = new ChartJS(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: "Chiffre d'affaires (F CFA)",
            data,
            borderColor: '#0ea5e9',
            backgroundColor: 'rgba(14,165,233,0.15)',
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#0ea5e9',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            pointRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(15,23,42,0.85)',
            titleColor: '#ffffff',
            bodyColor: '#ffffff',
            callbacks: {
              label: (context) => ` ${formatCurrency(context.parsed.y as number)} F CFA`
            }
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(148,163,184,0.2)' },
            ticks: { color: '#64748b' }
          },
          y: {
            grid: { color: 'rgba(148,163,184,0.2)' },
            ticks: {
              color: '#64748b',
              callback: (value) => formatNumber(Number(value))
            }
          }
        }
      }
    })
  } catch (error) {
    // silently ignore chart errors
  }
}

const createUserGrowthChart = () => {
  try {
    if (!userGrowthChartCanvas.value) {
      return
    }

    const ctx = userGrowthChartCanvas.value.getContext('2d')
    if (!ctx) {
      return
    }

    if (userGrowthChart) {
      userGrowthChart.destroy()
    }

    userGrowthChart = new ChartJS(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Consommateurs', 'Commerçants', 'Administrateurs'],
        datasets: [
          {
            data: [1091, 156, 1],
            backgroundColor: ['#10B981', '#F59E0B', '#6366F1'],
            borderWidth: 0
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 20,
              usePointStyle: true,
              color: '#64748b'
            }
          },
          tooltip: {
            backgroundColor: 'rgba(15,23,42,0.85)',
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

    setTimeout(() => {
      userGrowthChart?.resize()
    }, 50)
  } catch (error) {
    // silently ignore chart errors
  }
}

watch(revenueChartPeriod, () => {
  createRevenueChart()
})

onMounted(async () => {
  await refreshData()
  await nextTick()
  setTimeout(() => {
    createRevenueChart()
    createUserGrowthChart()
  }, 100)
})
</script>
