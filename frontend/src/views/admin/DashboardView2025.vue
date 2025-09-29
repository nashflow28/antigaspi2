<template>
  <DashboardLayout
    :sidebar="sidebar"
    :header="header"
    class="bg-gradient-to-br from-surface-light via-surface-light to-primary-50 dark:from-surface-dark dark:via-surface-darker dark:to-primary-950"
  >
    <div class="mx-auto w-full max-w-7xl space-y-8 px-3 py-6 sm:px-6 sm:py-8">
      <DashboardHeader
        eyebrow="Administration"
        title="Tableau de bord administrateur"
        subtitle="Supervisez la santé de la plateforme, les performances et l'impact environnemental"
      >
        <template #meta>
          <Select v-model="selectedPeriod" size="sm" class="min-w-[180px]">
            <option value="today">Aujourd'hui</option>
            <option value="week">Cette semaine</option>
            <option value="month">Ce mois</option>
            <option value="year">Cette année</option>
          </Select>
        </template>
        <template #actions>
          <Button
            variant="primary"
            size="lg"
            class="gap-2"
            :loading="isLoading"
            @click="refreshData"
          >
            <ArrowPathIcon class="h-5 w-5" />
            Actualiser
          </Button>
        </template>
      </DashboardHeader>

      <StatCardGrid :columns="'grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4'">
        <StatCard
          title="Utilisateurs totaux"
          :value="formatNumber(stats.totalUsers)"
          :description="`+${formatNumber(stats.newUsersThisMonth)} ce mois`"
          :icon="UsersIcon"
          accent="primary"
        />
        <StatCard
          title="Commerçants actifs"
          :value="formatNumber(stats.activeMerchants)"
          :description="`${stats.merchantGrowthRate}% de croissance`"
          :icon="BuildingStorefrontIcon"
          accent="success"
        />
        <StatCard
          title="Produits sauvés"
          :value="formatNumber(stats.productsSaved)"
          :description="`${formatNumber(stats.kgFoodSaved)} kg sauvés`"
          :icon="ShoppingBagIcon"
          accent="info"
        />
        <StatCard
          title="Chiffre d'affaires"
          :value="formatCurrency(stats.totalRevenue)"
          :description="`+${stats.revenueGrowth}% vs mois dernier`"
          :icon="BanknotesIcon"
          accent="warning"
          variant="gradient"
        />
      </StatCardGrid>

      <!-- Charts and Analytics -->
      <div class="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <!-- Revenue Chart -->
        <Card variant="glass">
          <template #header>
            <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 class="text-xl font-semibold text-neutral-900 dark:text-neutral-50">Évolution du chiffre d'affaires</h3>
                <p class="text-sm text-neutral-500 dark:text-neutral-400">Revenus cumulés sur la période sélectionnée</p>
              </div>
              <Select v-model="revenueChartPeriod" size="sm" class="min-w-[160px]">
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

        <!-- User Growth Chart -->
        <Card variant="glass">
          <template #header>
            <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 class="text-xl font-semibold text-neutral-900 dark:text-neutral-50">Croissance des utilisateurs</h3>
                <p class="text-sm text-neutral-500 dark:text-neutral-400">Évolution hebdomadaire des profils actifs</p>
              </div>
              <div class="flex flex-wrap gap-2">
                <Badge variant="success" size="sm">Consommateurs</Badge>
                <Badge variant="primary" size="sm">Commerçants</Badge>
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
        <!-- Recent Activity -->
        <Card variant="glass" class="xl:col-span-2">
          <template #header>
            <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 class="text-xl font-semibold text-neutral-900 dark:text-neutral-50">Activité récente</h3>
                <p class="text-sm text-neutral-500 dark:text-neutral-400">Suivi temps réel des opérations clés</p>
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
              class="flex items-center gap-4 rounded-2xl border border-neutral-200/60 bg-surface-light/70 p-4 transition-colors duration-200 hover:border-primary-400/40 hover:bg-primary-500/5 dark:border-neutral-700/60 dark:bg-surface-dark/70"
            >
              <div class="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl" :class="getActivityIconClass(activity.type)">
                <component :is="getActivityIcon(activity.type)" class="h-5 w-5" />
              </div>

              <div class="flex-grow space-y-1">
                <p class="text-sm font-semibold text-neutral-900 dark:text-neutral-50">{{ activity.title }}</p>
                <p class="text-sm text-neutral-500 dark:text-neutral-400">{{ activity.description }}</p>
                <p class="text-xs text-neutral-400">{{ formatTimeAgo(activity.timestamp) }}</p>
              </div>

              <div class="flex-shrink-0">
                <Badge :variant="getActivityStatusVariant(activity.status)" size="sm">
                  {{ activity.status }}
                </Badge>
              </div>
            </div>
          </div>
        </Card>

        <!-- System Health -->
        <Card variant="glass">
          <template #header>
            <h3 class="text-xl font-semibold text-neutral-900 dark:text-neutral-50">État du système</h3>
          </template>

          <div class="space-y-4">
            <div
              v-for="service in systemHealth"
              :key="service.name"
              class="flex items-center justify-between rounded-2xl border border-neutral-200/60 bg-surface-light/70 p-4 dark:border-neutral-700/60 dark:bg-surface-dark/70"
            >
              <div class="flex items-center gap-3">
                <div
                  :class="service.status === 'healthy' ? 'bg-primary-500/10 text-primary-600' : 'bg-accent-red/10 text-accent-red'"
                  class="flex h-10 w-10 items-center justify-center rounded-xl"
                >
                  <component
                    :is="service.status === 'healthy' ? CheckCircleIcon : ExclamationTriangleIcon"
                    class="h-5 w-5"
                  />
                </div>
                <div>
                  <p class="text-sm font-semibold text-neutral-900 dark:text-neutral-50">{{ service.name }}</p>
                  <p class="text-xs text-neutral-500 dark:text-neutral-400">{{ service.description }}</p>
                </div>
              </div>

              <div class="text-right">
                <p class="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{{ service.uptime }}</p>
                <p class="text-xs text-neutral-500 dark:text-neutral-400">{{ service.responseTime }}</p>
              </div>
            </div>
          </div>

          <!-- Quick Actions -->
          <div class="mt-6 border-t border-neutral-200/60 pt-6 dark:border-neutral-700/60">
            <h4 class="mb-4 text-sm font-semibold text-neutral-900 dark:text-neutral-50">Actions rapides</h4>
            <div class="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                size="sm"
                class="justify-start gap-2 text-xs"
                @click="viewLogs"
              >
                <DocumentTextIcon class="h-4 w-4" />
                Logs
              </Button>
              <Button
                variant="outline"
                size="sm"
                class="justify-start gap-2 text-xs"
                @click="viewMetrics"
              >
                <ChartBarIcon class="h-4 w-4" />
                Métriques
              </Button>
              <Button
                variant="outline"
                size="sm"
                class="justify-start gap-2 text-xs"
                @click="manageUsers"
              >
                <UsersIcon class="h-4 w-4" />
                Utilisateurs
              </Button>
              <Button
                variant="outline"
                size="sm"
                class="justify-start gap-2 text-xs"
                @click="systemSettings"
              >
                <CogIcon class="h-4 w-4" />
                Paramètres
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <!-- Performance Metrics -->
      <div class="grid grid-cols-1 gap-6 md:grid-cols-3">
        <!-- Environmental Impact -->
        <Card variant="glass">
          <div class="flex items-center gap-3">
            <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-500/10 text-primary-600 dark:text-primary-300">
              <GlobeEuropeAfricaIcon class="h-6 w-6" />
            </div>
            <h3 class="text-lg font-semibold text-neutral-900 dark:text-neutral-50">Impact environnemental</h3>
          </div>

          <div class="mt-6 space-y-4">
            <div class="flex items-center justify-between">
              <span class="text-sm text-neutral-600 dark:text-neutral-300">CO₂ économisé</span>
              <span class="text-sm font-semibold text-primary-600 dark:text-primary-300">{{ formatNumber(environmentalImpact.co2Saved) }} kg</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm text-neutral-600 dark:text-neutral-300">Eau économisée</span>
              <span class="text-sm font-semibold text-accent-blue">{{ formatNumber(environmentalImpact.waterSaved) }} L</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm text-neutral-600 dark:text-neutral-300">Déchets évités</span>
              <span class="text-sm font-semibold text-primary-600 dark:text-primary-300">{{ formatNumber(environmentalImpact.wasteSaved) }} kg</span>
            </div>
          </div>

          <div class="mt-6 rounded-2xl bg-primary-500/10 p-4 text-sm font-semibold text-primary-600 dark:text-primary-300">
            🌱 Équivalent à {{ environmentalImpact.treesEquivalent }} arbres plantés
          </div>
        </Card>

        <!-- Top Merchants -->
        <Card variant="glass">
          <template #header>
            <h3 class="text-lg font-semibold text-neutral-900 dark:text-neutral-50">Top commerçants</h3>
          </template>

          <div class="space-y-3">
            <div
              v-for="(merchant, index) in topMerchants"
              :key="merchant.id"
              class="flex items-center gap-3 rounded-2xl border border-neutral-200/60 bg-surface-light/70 p-3 dark:border-neutral-700/60 dark:bg-surface-dark/70"
            >
              <div class="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary-500/10 text-sm font-semibold text-primary-600 dark:text-primary-300">
                {{ index + 1 }}
              </div>
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-semibold text-neutral-900 dark:text-neutral-50">{{ merchant.name }}</p>
                <p class="text-xs text-neutral-500 dark:text-neutral-400">{{ merchant.productsSold }} produits vendus</p>
              </div>
              <div class="text-right text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                {{ formatCurrency(merchant.revenue) }}
              </div>
            </div>
          </div>
        </Card>

        <!-- Popular Categories -->
        <Card variant="glass">
          <template #header>
            <h3 class="text-lg font-semibold text-neutral-900 dark:text-neutral-50">Catégories populaires</h3>
          </template>

          <div class="space-y-3">
            <div
              v-for="category in popularCategories"
              :key="category.id"
              class="flex items-center justify-between gap-4"
            >
              <div class="flex items-center gap-3">
                <span class="text-xl">{{ category.icon }}</span>
                <div>
                  <p class="text-sm font-semibold text-neutral-900 dark:text-neutral-50">{{ category.name }}</p>
                  <p class="text-xs text-neutral-500 dark:text-neutral-400">{{ category.productCount }} produits</p>
                </div>
              </div>
              <div class="flex flex-col items-end gap-1">
                <div class="h-2.5 w-24 overflow-hidden rounded-full bg-neutral-200/70 dark:bg-neutral-700/60">
                  <div
                    class="h-full rounded-full bg-primary-500"
                    :style="{ width: `${category.percentage}%` }"
                  />
                </div>
                <p class="text-xs text-neutral-500 dark:text-neutral-400">{{ category.percentage }}%</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <!-- Alerts and Notifications -->
      <Card v-if="alerts.length > 0" variant="glass">
        <template #header>
          <h3 class="text-lg font-semibold text-neutral-900 dark:text-neutral-50">Alertes et notifications</h3>
        </template>

        <div class="space-y-3">
          <div
            v-for="alert in alerts"
            :key="alert.id"
            class="flex items-start gap-4 rounded-2xl border bg-surface-light/70 p-4 transition-colors duration-200 dark:bg-surface-dark/70"
            :class="getAlertClass(alert.type)"
          >
            <div class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-surface-light/90 dark:bg-surface-dark/80" :class="getAlertIconClass(alert.type)">
              <component :is="getAlertIcon(alert.type)" class="h-5 w-5" />
            </div>
            <div class="flex-1 space-y-1">
              <p class="text-sm font-semibold text-neutral-900 dark:text-neutral-50">{{ alert.title }}</p>
              <p class="text-sm text-neutral-500 dark:text-neutral-400">{{ alert.message }}</p>
              <p class="text-xs text-neutral-400">{{ formatTimeAgo(alert.timestamp) }}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              class="flex-shrink-0 text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
              @click="dismissAlert(alert.id)"
            >
              <XMarkIcon class="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

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
  </DashboardLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, watch } from 'vue'
import { formatPrice } from '@/utils/currency'
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
  BanknotesIcon
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

// Import 2025 Design System components
import Card from '@/components/ui/2025/Card.vue'
import Button from '@/components/ui/2025/Button.vue'
import Badge from '@/components/ui/2025/Badge.vue'
import Select from '@/components/ui/2025/Select.vue'
import {
  DashboardHeader,
  StatCard,
  StatCardGrid
} from '@/components/dashboard/2025'
import apiService from '@/services/api'
import type {
  AdminDashboardActivity,
  AdminDashboardCategory,
  AdminDashboardEnvironmentalImpact,
  AdminDashboardMerchant,
  AdminDashboardStats,
  AdminDashboardUserDistributionEntry,
  AdminSystemHealthService,
  AnalyticsDailyBreakdownEntry
} from '@/types'

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
const { sidebar, header } = useDashboardLayout('admin')
const stats = ref<AdminDashboardStats>({
  totalUsers: 0,
  newUsersThisMonth: 0,
  activeMerchants: 0,
  merchantGrowthRate: 0,
  productsSaved: 0,
  kgFoodSaved: 0,
  totalRevenue: 0,
  revenueGrowth: 0
})

const recentActivities = ref<AdminDashboardActivity[]>([])

const systemHealth = ref<AdminSystemHealthService[]>([])

const environmentalImpact = ref<AdminDashboardEnvironmentalImpact>({
  co2Saved: 0,
  waterSaved: 0,
  wasteSaved: 0,
  treesEquivalent: 0
})

const topMerchants = ref<AdminDashboardMerchant[]>([])

const popularCategories = ref<AdminDashboardCategory[]>([])

const revenueTrends = ref<{ labels: string[]; values: number[] }>({ labels: [], values: [] })
const userDistribution = ref<{ label: string; value: number }[]>([])

interface DashboardAlert {
  id: number | string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  timestamp: string
}

const alerts = ref<DashboardAlert[]>([])

const normalizeNumber = (value: unknown, fallback = 0): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string') {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) {
      return parsed
    }
  }

  return fallback
}

const toErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === 'string') {
    return error
  }

  return 'Une erreur inattendue est survenue.'
}

const handleApiError = (title: string, message: string) => {
  const alertId = `error-${title}`
  const timestamp = new Date().toISOString()
  const alert: DashboardAlert = {
    id: alertId,
    type: 'error',
    title,
    message,
    timestamp
  }

  const existingIndex = alerts.value.findIndex(existingAlert => existingAlert.id === alertId)
  if (existingIndex !== -1) {
    alerts.value[existingIndex] = alert
  } else {
    alerts.value.push(alert)
  }
}

const normalizeStats = (statsData?: AdminDashboardStats): AdminDashboardStats => {
  const base = stats.value

  if (!statsData) {
    return { ...base }
  }

  return {
    totalUsers: normalizeNumber(statsData.totalUsers ?? statsData.total_users, base.totalUsers ?? 0),
    newUsersThisMonth: normalizeNumber(statsData.newUsersThisMonth ?? statsData.new_users_this_month, base.newUsersThisMonth ?? 0),
    activeMerchants: normalizeNumber(statsData.activeMerchants ?? statsData.active_merchants, base.activeMerchants ?? 0),
    merchantGrowthRate: normalizeNumber(statsData.merchantGrowthRate ?? statsData.merchant_growth_rate, base.merchantGrowthRate ?? 0),
    productsSaved: normalizeNumber(statsData.productsSaved ?? statsData.products_saved, base.productsSaved ?? 0),
    kgFoodSaved: normalizeNumber(statsData.kgFoodSaved ?? statsData.kg_food_saved, base.kgFoodSaved ?? 0),
    totalRevenue: normalizeNumber(statsData.totalRevenue ?? statsData.total_revenue, base.totalRevenue ?? 0),
    revenueGrowth: normalizeNumber(statsData.revenueGrowth ?? statsData.revenue_growth, base.revenueGrowth ?? 0)
  }
}

const normalizeTopMerchants = (merchants?: AdminDashboardMerchant[]): AdminDashboardMerchant[] => {
  if (!Array.isArray(merchants)) {
    return []
  }

  return merchants.map((merchant, index) => ({
    ...merchant,
    id: merchant.id ?? index,
    name: merchant.name ?? merchant.business_name ?? `Commerçant ${index + 1}`,
    revenue: normalizeNumber(merchant.revenue, 0),
    productsSold: normalizeNumber(merchant.productsSold ?? merchant.products_sold, 0)
  }))
}

const normalizePopularCategories = (categories?: AdminDashboardCategory[]): AdminDashboardCategory[] => {
  if (!Array.isArray(categories)) {
    return []
  }

  return categories.map((category, index) => ({
    ...category,
    id: category.id ?? index,
    name: category.name ?? `Catégorie ${index + 1}`,
    productCount: normalizeNumber(category.productCount ?? category.product_count, 0),
    percentage: normalizeNumber(category.percentage, 0)
  }))
}

const normalizeRecentActivities = (activities?: AdminDashboardActivity[]): AdminDashboardActivity[] => {
  if (!Array.isArray(activities)) {
    return []
  }

  return activities.map((activity, index) => ({
    ...activity,
    id: activity.id ?? index,
    title: activity.title ?? activity.description ?? `Activité ${index + 1}`,
    description: activity.description ?? activity.title ?? '',
    timestamp: activity.timestamp ?? new Date().toISOString(),
    status: activity.status ?? 'info'
  }))
}

const normalizeEnvironmentalImpact = (impact?: AdminDashboardEnvironmentalImpact): AdminDashboardEnvironmentalImpact => {
  const base = environmentalImpact.value

  return {
    co2Saved: normalizeNumber(impact?.co2Saved ?? impact?.co2_saved, base.co2Saved ?? 0),
    waterSaved: normalizeNumber(impact?.waterSaved ?? impact?.water_saved, base.waterSaved ?? 0),
    wasteSaved: normalizeNumber(impact?.wasteSaved ?? impact?.waste_saved, base.wasteSaved ?? 0),
    treesEquivalent: normalizeNumber(impact?.treesEquivalent ?? impact?.trees_equivalent, base.treesEquivalent ?? 0)
  }
}

const normalizeSystemHealth = (services?: AdminSystemHealthService[]): AdminSystemHealthService[] => {
  if (!Array.isArray(services)) {
    return []
  }

  return services.map((service, index) => ({
    ...service,
    name: service.name ?? `Service ${index + 1}`,
    description: service.description ?? '',
    status: service.status ?? 'unknown',
    uptime: service.uptime ?? service.uptime_percentage ?? '',
    responseTime: service.responseTime ?? service.response_time ?? ''
  }))
}

const userDistributionColors = ['#10B981', '#F59E0B', '#8B5CF6', '#14B8A6', '#6366F1']

const formatDateForApi = (date: Date): string => {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

const formatRevenueLabel = (date: Date, period: string): string => {
  if (Number.isNaN(date.getTime())) {
    return ''
  }

  const options: Intl.DateTimeFormatOptions =
    period === '90d'
      ? { day: '2-digit', month: 'short' }
      : { day: '2-digit', month: '2-digit' }

  return date.toLocaleDateString('fr-FR', options)
}

const buildRevenueFallbackDataset = (period: string) => {
  const days = period === '7d' ? 7 : period === '30d' ? 30 : 90
  const labels: string[] = []
  const values: number[] = []
  const today = new Date()

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(today.getDate() - i)
    labels.push(formatRevenueLabel(date, period))
    values.push(0)
  }

  return { labels, values }
}

const transformAnalyticsToRevenueTrends = (entries?: AnalyticsDailyBreakdownEntry[]) => {
  if (!Array.isArray(entries) || entries.length === 0) {
    return { labels: [] as string[], values: [] as number[] }
  }

  const sortedEntries = [...entries].sort((a, b) => {
    const dateA = new Date(a.date ?? '')
    const dateB = new Date(b.date ?? '')
    return dateA.getTime() - dateB.getTime()
  })

  const labels: string[] = []
  const values: number[] = []
  let cumulativeRevenue = 0

  sortedEntries.forEach(entry => {
    const date = new Date(entry.date ?? '')
    labels.push(formatRevenueLabel(date, revenueChartPeriod.value))
    cumulativeRevenue += normalizeNumber(entry.total_revenue, 0)
    values.push(Math.round(cumulativeRevenue))
  })

  return { labels, values }
}

const resolveUserLabel = (rawLabel: string, fallbackIndex: number) => {
  const sanitized = rawLabel?.toString().trim()
  if (!sanitized) {
    return `Segment ${fallbackIndex + 1}`
  }

  const normalized = sanitized.toLowerCase().replace(/[^a-z]/g, '')

  if (normalized.includes('consumer')) {
    return 'Consommateurs'
  }

  if (normalized.includes('merchant')) {
    return 'Commerçants'
  }

  if (normalized.includes('admin')) {
    return 'Administrateurs'
  }

  return sanitized.charAt(0).toUpperCase() + sanitized.slice(1)
}

const computeUserDistributionFallback = (currentStats: AdminDashboardStats) => {
  const totalUsers = Math.max(normalizeNumber(currentStats.totalUsers, 0), 0)
  const merchants = Math.max(normalizeNumber(currentStats.activeMerchants, 0), 0)
  const hasUsers = totalUsers > 0
  const estimatedAdmins = hasUsers ? Math.min(Math.max(totalUsers - merchants, 0), 5) : 0
  const adminCount = estimatedAdmins > 0 ? Math.max(estimatedAdmins, 1) : 0
  let consumers = totalUsers - merchants - adminCount

  if (consumers < 0) {
    consumers = Math.max(totalUsers - merchants, 0)
  }

  return [
    { label: 'Consommateurs', value: Math.max(consumers, 0) },
    { label: 'Commerçants', value: merchants },
    { label: 'Administrateurs', value: adminCount }
  ]
}

const normalizeUserDistribution = (
  distribution?: AdminDashboardUserDistributionEntry[] | Record<string, unknown>,
  fallbackStats?: AdminDashboardStats
) => {
  if (Array.isArray(distribution) && distribution.length > 0) {
    const normalized = distribution
      .map((entry, index) => ({
        label: resolveUserLabel(entry.label ?? entry.role ?? `Segment ${index + 1}`, index),
        value: normalizeNumber(entry.value ?? entry.count ?? entry.total, 0)
      }))
      .filter(segment => segment.value >= 0)

    if (normalized.length > 0) {
      return normalized
    }
  } else if (distribution && typeof distribution === 'object') {
    const normalized = Object.entries(distribution)
      .map(([key, value], index) => ({
        label: resolveUserLabel(key, index),
        value: normalizeNumber(value as number, 0)
      }))
      .filter(segment => segment.value >= 0)

    if (normalized.length > 0) {
      return normalized
    }
  }

  if (fallbackStats) {
    return computeUserDistributionFallback(fallbackStats)
  }

  return [] as { label: string; value: number }[]
}

const computeDateRangeForPeriod = (period: string) => {
  const endDate = new Date()
  const startDate = new Date(endDate)

  if (period === '7d') {
    startDate.setDate(endDate.getDate() - 6)
  } else if (period === '30d') {
    startDate.setDate(endDate.getDate() - 29)
  } else {
    startDate.setDate(endDate.getDate() - 89)
  }

  return {
    startDate: formatDateForApi(startDate),
    endDate: formatDateForApi(endDate)
  }
}

const loadRevenueTrendsForPeriod = async () => {
  try {
    const { startDate, endDate } = computeDateRangeForPeriod(revenueChartPeriod.value)
    const analyticsResponse = await apiService.getAnalyticsStats({ startDate, endDate })

    if (!analyticsResponse.success) {
      throw new Error(analyticsResponse.message || 'Impossible de charger les tendances de revenus.')
    }

    const dataset = transformAnalyticsToRevenueTrends(analyticsResponse.daily_breakdown)

    if (dataset.labels.length === 0) {
      revenueTrends.value = buildRevenueFallbackDataset(revenueChartPeriod.value)
    } else {
      revenueTrends.value = dataset
    }
  } catch (error) {
    const message = toErrorMessage(error)
    handleApiError('Erreur de chargement des tendances de revenus', message)
    revenueTrends.value = buildRevenueFallbackDataset(revenueChartPeriod.value)
  }
}

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
    user_registered: 'bg-primary-500/10 text-primary-600 dark:text-primary-300',
    merchant_joined: 'bg-primary-500/10 text-primary-600 dark:text-primary-300',
    product_sold: 'bg-accent-orange/10 text-accent-orange',
    alert: 'bg-accent-red/10 text-accent-red'
  }
  return classes[type] || 'bg-neutral-200/60 text-neutral-600 dark:bg-neutral-800/70 dark:text-neutral-300'
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

const getActivityStatusVariant = (status: string) => {
  const variants: Record<string, string> = {
    success: 'success',
    completed: 'primary',
    warning: 'warning',
    error: 'destructive'
  }
  return variants[status] || 'secondary'
}

const getAlertClass = (type: string): string => {
  const classes: Record<string, string> = {
    warning: 'border-accent-orange/40 bg-accent-orange/10 text-accent-orange',
    error: 'border-accent-red/50 bg-accent-red/10 text-accent-red',
    info: 'border-primary-400/40 bg-primary-500/10 text-primary-700 dark:text-primary-300',
    success: 'border-primary-500/40 bg-primary-500/10 text-primary-600 dark:text-primary-300'
  }
  return classes[type] || 'border-neutral-200/60 text-neutral-700 dark:border-neutral-700/60 dark:text-neutral-300'
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
  return classes[type] || 'text-neutral-600 dark:text-neutral-300'
}

const loadDashboardData = async () => {
  try {
    const response = await apiService.getAdminDashboard()

    if (!response.success) {
      throw new Error(response.message || 'Impossible de charger le tableau de bord administrateur.')
    }

    const dashboardData = response.data

    stats.value = normalizeStats(dashboardData?.stats)
    topMerchants.value = normalizeTopMerchants(dashboardData?.topMerchants)
    popularCategories.value = normalizePopularCategories(dashboardData?.popularCategories)
    recentActivities.value = normalizeRecentActivities(dashboardData?.recentActivities)
    environmentalImpact.value = normalizeEnvironmentalImpact(dashboardData?.environmentalImpact)
    userDistribution.value = normalizeUserDistribution(dashboardData?.userDistribution, stats.value)
    await loadRevenueTrendsForPeriod()
  } catch (error) {
    const message = toErrorMessage(error)
    handleApiError('Erreur de chargement du tableau de bord', message)
    throw error instanceof Error ? error : new Error(message)
  }
}

const loadSystemHealth = async () => {
  try {
    const response = await apiService.getAdminSystemHealth()

    if (!response.success) {
      throw new Error(response.message || "Impossible de charger l'état du système.")
    }

    systemHealth.value = normalizeSystemHealth(response.data)
  } catch (error) {
    const message = toErrorMessage(error)
    handleApiError("Erreur de chargement de l'état du système", message)
    systemHealth.value = []
    throw error instanceof Error ? error : new Error(message)
  }
}

const refreshData = async () => {
  isLoading.value = true
  try {
    await Promise.all([loadDashboardData(), loadSystemHealth()])
    // console.log('Data refreshed')
  } catch (error) {
    // console.error('Error refreshing data:', error)
  } finally {
    isLoading.value = false
  }
}

const dismissAlert = (alertId: number | string) => {
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
  const content = '📋 Logs système\n\n' +
    '✅ API Backend: 1,247 requêtes (99.9% succès)\n' +
    '✅ Base de données: 3,421 requêtes (98.7% < 50ms)\n' +
    '⚠️ Frontend: 2 erreurs JavaScript détectées\n' +
    'ℹ️ Cache Redis: 15,672 hits (94.3% ratio)\n\n' +
    `Dernière vérification: ${new Date().toLocaleTimeString('fr-FR')}`

  showModal('📋 Logs système', content, 'info', DocumentTextIcon, 'Voir tous les logs')
}

const viewMetrics = () => {
  const content = '📊 Métriques détaillées\n\n' +
    '👥 Utilisateurs actifs: 247 (dernières 24h)\n' +
    '🏪 Nouveaux commerçants: 12 (cette semaine)\n' +
    '📦 Produits ajoutés: 156 (aujourd\'hui)\n' +
    `💰 CA moyen/commande: ${formatCurrency(stats.value.totalRevenue / stats.value.productsSaved)}\n` +
    `🌍 Impact CO2: ${environmentalImpact.value.co2Saved}kg économisés\n\n` +
    `Période: ${selectedPeriod.value}`

  showModal('📊 Métriques détaillées', content, 'info', ChartBarIcon, 'Voir analytics')
}

const manageUsers = () => {
  const content = '👥 Gestion utilisateurs\n\n' +
    '📊 Statistiques:\n' +
    `• Total: ${formatNumber(stats.value.totalUsers)} utilisateurs\n` +
    `• Consommateurs: ${formatNumber(stats.value.totalUsers - stats.value.activeMerchants)}\n` +
    `• Commerçants: ${formatNumber(stats.value.activeMerchants)}\n` +
    `• Nouveaux ce mois: ${stats.value.newUsersThisMonth}\n\n` +
    '🚀 Accès rapide:\n' +
    '• Utilisateurs en attente de validation\n' +
    '• Comptes signalés\n' +
    '• Statistiques d\'engagement'

  showModal('👥 Gestion utilisateurs', content, 'info', UsersIcon, 'Accéder à la gestion')
}

const systemSettings = () => {
  const content = '⚙️ Paramètres système\n\n' +
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

// Lifecycle
// Chart creation functions
const createRevenueChart = () => {
  try {
    // console.log('📈 createRevenueChart: Début de création')
    // console.log('📈 revenueChartCanvas.value:', revenueChartCanvas.value)

    if (!revenueChartCanvas.value) {
      // console.error('❌ Canvas element not ready for revenue chart')
      return
    }

    // console.log('📈 Canvas dimensions:', {
    //   width: revenueChartCanvas.value.offsetWidth,
    //   height: revenueChartCanvas.value.offsetHeight,
    //   clientWidth: revenueChartCanvas.value.clientWidth,
    //   clientHeight: revenueChartCanvas.value.clientHeight
    // })

    const ctx = revenueChartCanvas.value.getContext('2d')
    if (!ctx) {
      // console.error('❌ Canvas context not available for revenue chart')
      return
    }

    // console.log('📈 Canvas context obtenu:', ctx)

    // Destroy existing chart if it exists
    if (revenueChart) {
      // console.log('📈 Destruction du graphique existant')
      revenueChart.destroy()
    }

    const fallbackDataset = buildRevenueFallbackDataset(revenueChartPeriod.value)
    const dataset = revenueTrends.value
    const labels = dataset.labels.length ? dataset.labels : fallbackDataset.labels
    const data = dataset.values.length ? dataset.values : fallbackDataset.values
    // console.log('📈 Données du graphique:', { labels, data })

    // console.log('📈 Tentative de création du graphique Chart.js...')

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

    // console.log('📈 Instance Chart.js créée:', revenueChart)
    // console.log('Revenue chart created successfully')

    // Force resize to ensure visibility
    setTimeout(() => {
      if (revenueChart) {
        revenueChart.resize()
        // console.log('📈 Revenue chart resized')
      }
    }, 50)

  } catch (error) {
    // console.error('Error creating revenue chart:', error)
  }
}

const createUserGrowthChart = () => {
  try {
    // console.log('🍩 createUserGrowthChart: Début de création')
    // console.log('🍩 userGrowthChartCanvas.value:', userGrowthChartCanvas.value)

    if (!userGrowthChartCanvas.value) {
      // console.error('❌ Canvas element not ready for user growth chart')
      return
    }

    // console.log('🍩 Canvas dimensions:', {
    //   width: userGrowthChartCanvas.value.offsetWidth,
    //   height: userGrowthChartCanvas.value.offsetHeight,
    //   clientWidth: userGrowthChartCanvas.value.clientWidth,
    //   clientHeight: userGrowthChartCanvas.value.clientHeight
    // })

    const ctx = userGrowthChartCanvas.value.getContext('2d')
    if (!ctx) {
      // console.error('❌ Canvas context not available for user growth chart')
      return
    }

    // console.log('🍩 Canvas context obtenu:', ctx)

    // Destroy existing chart if it exists
    if (userGrowthChart) {
      // console.log('🍩 Destruction du graphique existant')
      userGrowthChart.destroy()
    }

    const distribution = userDistribution.value.length
      ? userDistribution.value
      : computeUserDistributionFallback(stats.value)

    const labels = distribution.map(segment => segment.label)
    const values = distribution.map(segment => segment.value)
    const colors = distribution.map((_, index) => userDistributionColors[index % userDistributionColors.length])

    const chartData = {
      labels,
      datasets: [{
        data: values,
        backgroundColor: colors,
        borderWidth: 0
      }]
    }

    // console.log('🍩 Données du graphique doughnut:', chartData)

    // console.log('🍩 Tentative de création du graphique doughnut Chart.js...')

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
                const value = typeof context.parsed === 'number'
                  ? context.parsed
                  : Number(context.parsed ?? 0)
                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0'
                return `${context.label}: ${value} (${percentage}%)`
              }
            }
          }
        }
      }
    })

    // console.log('🍩 Instance Chart.js doughnut créée:', userGrowthChart)
    // console.log('User growth chart created successfully')

    // Force resize to ensure visibility
    setTimeout(() => {
      if (userGrowthChart) {
        userGrowthChart.resize()
        // console.log('🍩 User growth chart resized')
      }
    }, 50)

  } catch (error) {
    // console.error('Error creating user growth chart:', error)
  }
}

// Watch for period changes to update charts
watch(revenueChartPeriod, async () => {
  await loadRevenueTrendsForPeriod()
})

watch(
  revenueTrends,
  () => {
    nextTick(() => {
      createRevenueChart()
    })
  },
  { deep: true, flush: 'post' }
)

watch(
  userDistribution,
  () => {
    nextTick(() => {
      createUserGrowthChart()
    })
  },
  { deep: true, flush: 'post' }
)

onMounted(async () => {
  try {
    // console.log('🚀 Dashboard: Initialisation...')

    // Load data first
    await refreshData()
    // console.log('📊 Dashboard: Données chargées')

    // Wait for DOM to be ready
    await nextTick()
    // console.log('🎨 Dashboard: DOM prêt')

    // Create charts with delay to ensure canvas elements are fully rendered
    setTimeout(() => {
      // console.log('📈 Dashboard: Création des graphiques...')
      createRevenueChart()
      createUserGrowthChart()
      // console.log('✅ Dashboard: Graphiques créés')
    }, 100)

    // console.log('✅ Admin dashboard loaded with charts')
  } catch (error) {
    // console.error('❌ Error during dashboard initialization:', error)
  }
})
</script>
