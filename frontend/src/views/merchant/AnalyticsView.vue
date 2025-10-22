<template>
  <DashboardLayout :sidebar="sidebar" :header="header">
    <div class="mx-auto w-full max-w-7xl space-y-8 px-3 py-6 sm:px-6 sm:py-8">
      <DashboardHeader
        eyebrow="Commerçant"
        title="Analytics avancées"
        subtitle="Visualisez vos performances, exportez des rapports et identifiez vos meilleures opportunités"
      >
        <template #actions>
          <div class="flex flex-wrap gap-2">
            <Button
              variant="ghost"
              size="sm"
              class="gap-2"
              :loading="loadingStates.refreshing"
              @click="refreshAll"
            >
              <ArrowPathIcon class="h-4 w-4" />
              Rafraîchir
            </Button>
            <Button
              variant="outline"
              size="sm"
              class="gap-2"
              :disabled="analyticsDailyBreakdown.length === 0 || loadingStates.exporting"
              :loading="loadingStates.exporting && exportFormat === 'csv'"
              @click="exportAnalytics('csv')"
            >
              <ArrowDownTrayIcon class="h-4 w-4" />
              Export CSV
            </Button>
            <Button
              variant="primary"
              size="sm"
              class="gap-2"
              :disabled="analyticsDailyBreakdown.length === 0 || loadingStates.exporting"
              :loading="loadingStates.exporting && exportFormat === 'pdf'"
              @click="exportAnalytics('pdf')"
            >
              <DocumentArrowDownIcon class="h-4 w-4" />
              Export PDF
            </Button>
          </div>
        </template>
      </DashboardHeader>

      <Card variant="glass">
        <template #header>
          <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 class="text-xl font-semibold text-neutral-900 dark:text-neutral-50">
                Période analysée
              </h2>
              <p class="text-sm text-neutral-500 dark:text-neutral-400">
                Choisissez une plage personnalisée ou appliquez un raccourci temporel pour mettre à jour toutes les sections.
              </p>
            </div>
            <div class="flex flex-wrap items-center gap-2">
              <template v-for="option in quickRanges" :key="option.id">
                <Button
                  :variant="activeQuickRange === option.id ? 'primary' : 'ghost'"
                  size="sm"
                  class="gap-2"
                  :disabled="loadingStates.analytics"
                  @click="applyQuickRange(option)"
                >
                  <CalendarDaysIcon class="h-4 w-4" />
                  {{ option.label }}
                </Button>
              </template>
            </div>
          </div>
        </template>

        <div class="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <div class="lg:col-span-4">
            <Input
              v-model="analyticsRange.start"
              type="date"
              label="Date de début"
              variant="filled"
              :max="analyticsRange.end || todayIso"
              :disabled="loadingStates.analytics"
              @update:modelValue="markCustomRange"
            />
          </div>
          <div class="lg:col-span-4">
            <Input
              v-model="analyticsRange.end"
              type="date"
              label="Date de fin"
              variant="filled"
              :min="analyticsRange.start"
              :max="todayIso"
              :disabled="loadingStates.analytics"
              @update:modelValue="markCustomRange"
            />
          </div>
          <div class="flex flex-col justify-end gap-3 lg:col-span-4">
            <div class="flex flex-wrap items-center gap-2">
              <Button
                variant="primary"
                class="gap-2"
                :loading="loadingStates.analytics"
                @click="applyCustomRange"
              >
                <ClipboardDocumentListIcon class="h-4 w-4" />
                Appliquer la période
              </Button>
              <Button
                variant="ghost"
                class="gap-2"
                :disabled="!isCustomRangeModified || loadingStates.analytics"
                @click="resetCustomRange"
              >
                <SparklesIcon class="h-4 w-4" />
                Réinitialiser
              </Button>
            </div>
            <p v-if="analyticsRangeError" class="text-sm text-accent-red">
              {{ analyticsRangeError }}
            </p>
            <p
              v-else-if="analyticsLastUpdated"
              class="text-xs text-neutral-500 dark:text-neutral-400"
            >
              Actualisé {{ formatTimeAgo(analyticsLastUpdated) }}
            </p>
          </div>
        </div>
      </Card>

      <StatCardGrid columns="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Revenus sur la période"
          :value="`${formatCurrency(summaryMetrics.totalRevenue)} F CFA`"
          :description="`Revenu moyen ${formatCurrency(summaryMetrics.averageOrderValue)} F CFA`"
          :icon="BanknotesIcon"
          accent="success"
        />
        <StatCard
          title="Réservations complétées"
          :value="formatNumber(summaryMetrics.totalReservations)"
          :description="`${formatNumber(summaryMetrics.averageDailyReservations)} / jour`"
          :icon="ChartBarIcon"
          accent="primary"
        />
        <StatCard
          title="Produits sauvés"
          :value="formatNumber(summaryMetrics.productsSaved)"
          :description="`${formatNumber(summaryMetrics.impactPercentage)}% des objectifs`"
          :icon="SparklesIcon"
          accent="info"
        />
        <StatCard
          title="Nouveaux clients"
          :value="formatNumber(summaryMetrics.newUsers)"
          :description="`${formatNumber(summaryMetrics.returningRate)}% récurrents`"
          :icon="UsersIcon"
          accent="warning"
        />
      </StatCardGrid>

      <div class="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card variant="glass" class="xl:col-span-2">
          <template #header>
            <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h3 class="text-xl font-semibold text-neutral-900 dark:text-neutral-50">
                  Évolution du chiffre d'affaires
                </h3>
                <p class="text-sm text-neutral-500 dark:text-neutral-400">
                  Tendances quotidiennes des revenus sur la période sélectionnée.
                </p>
              </div>
              <Select v-model="chartPeriod" size="sm" :disabled="loadingStates.charts">
                <option value="week">7 jours</option>
                <option value="month">30 jours</option>
                <option value="quarter">90 jours</option>
              </Select>
            </div>
          </template>

          <div class="relative h-80">
            <canvas
              v-if="hasRevenueData"
              ref="revenueChartCanvas"
              class="h-full w-full"
            />
            <div
              v-else
              class="flex h-full items-center justify-center rounded-xl border border-dashed border-neutral-200 dark:border-neutral-700"
            >
              <p class="text-sm text-neutral-500 dark:text-neutral-400">
                Aucune donnée de revenu disponible sur la période choisie.
              </p>
            </div>
          </div>
        </Card>

        <Card variant="glass">
          <template #header>
            <div>
              <h3 class="text-xl font-semibold text-neutral-900 dark:text-neutral-50">
                Top produits vendus
              </h3>
              <p class="text-sm text-neutral-500 dark:text-neutral-400">
                Classement des meilleures ventes par quantité réservée.
              </p>
            </div>
          </template>

          <div v-if="hasTopProducts" class="space-y-4">
            <div
              v-for="(product, index) in topProducts"
              :key="product.product_id || index"
              class="flex flex-col gap-2 rounded-xl bg-surface-light/70 p-4 ring-1 ring-neutral-200/60 dark:bg-surface-dark/60 dark:ring-neutral-700/60"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <Badge :variant="index === 0 ? 'primary' : 'secondary'" size="sm">
                    #{{ index + 1 }}
                  </Badge>
                  <p class="font-medium text-neutral-900 dark:text-neutral-100">
                    {{ product.product_name }}
                  </p>
                </div>
                <p class="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                  {{ formatNumber(product.total_sold) }} ventes
                </p>
              </div>
              <div class="h-2 rounded-full bg-neutral-200 dark:bg-neutral-700">
                <div
                  class="h-full rounded-full bg-primary-500"
                  :style="{ width: `${product.progress}%` }"
                />
              </div>
            </div>
          </div>
          <div
            v-else
            class="flex h-72 items-center justify-center rounded-xl border border-dashed border-neutral-200 dark:border-neutral-700"
          >
            <p class="text-sm text-neutral-500 dark:text-neutral-400">Pas encore de données de vente disponibles.</p>
          </div>
        </Card>
      </div>

      <Card variant="glass">
        <template #header>
          <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 class="text-xl font-semibold text-neutral-900 dark:text-neutral-50">
                Tendance des réservations
              </h3>
              <p class="text-sm text-neutral-500 dark:text-neutral-400">
                Nombre de réservations reçues par jour.
              </p>
            </div>
            <Badge variant="neutral" size="sm">
              {{ formatNumber(summaryMetrics.totalReservations) }} réservations sur la période
            </Badge>
          </div>
        </template>

        <div class="relative h-80">
          <canvas
            v-if="hasReservationData"
            ref="reservationsChartCanvas"
            class="h-full w-full"
          />
          <div
            v-else
            class="flex h-full items-center justify-center rounded-xl border border-dashed border-neutral-200 dark:border-neutral-700"
          >
            <p class="text-sm text-neutral-500 dark:text-neutral-400">
              Aucune réservation trouvée pour la période analysée.
            </p>
          </div>
        </div>
      </Card>

      <Card variant="glass">
        <template #header>
          <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 class="text-xl font-semibold text-neutral-900 dark:text-neutral-50">
                Détails quotidiens
              </h3>
              <p class="text-sm text-neutral-500 dark:text-neutral-400">
                Suivi jour par jour des indicateurs clés : chiffre d'affaires, réservations et impact.
              </p>
            </div>
            <Badge variant="primary" size="sm" v-if="analyticsDailyBreakdown.length > 0">
              {{ analyticsDailyBreakdown.length }} jours analysés
            </Badge>
          </div>
        </template>

        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-neutral-200 dark:divide-neutral-800">
            <thead>
              <tr class="bg-surface-light/80 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:bg-surface-dark/80 dark:text-neutral-400">
                <th class="px-4 py-3">Date</th>
                <th class="px-4 py-3">Chiffre d'affaires</th>
                <th class="px-4 py-3">Réservations</th>
                <th class="px-4 py-3">Produits sauvés</th>
                <th class="px-4 py-3">Nouveaux clients</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-neutral-100 dark:divide-neutral-800">
              <tr v-if="analyticsDailyBreakdown.length === 0">
                <td colspan="5" class="px-4 py-6 text-center text-sm text-neutral-500 dark:text-neutral-400">
                  Aucune donnée disponible pour la période sélectionnée.
                </td>
              </tr>
              <tr
                v-for="entry in analyticsDailyBreakdown"
                :key="entry.date"
                class="text-sm text-neutral-700 transition hover:bg-primary-500/5 dark:text-neutral-200"
              >
                <td class="whitespace-nowrap px-4 py-3">
                  {{ formatDate(entry.date) }}
                </td>
                <td class="whitespace-nowrap px-4 py-3 font-semibold text-neutral-900 dark:text-neutral-50">
                  {{ formatCurrency(entry.total_revenue ?? 0) }} F CFA
                </td>
                <td class="whitespace-nowrap px-4 py-3">
                  {{ formatNumber(entry.total_reservations ?? 0) }}
                </td>
                <td class="whitespace-nowrap px-4 py-3">
                  {{ formatNumber(entry.products_saved_from_waste ?? 0) }}
                </td>
                <td class="whitespace-nowrap px-4 py-3">
                  {{ formatNumber(entry.new_users ?? 0) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  </DashboardLayout>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import DashboardLayout from '@/components/ui/DashboardLayout.vue'
import { DashboardHeader, StatCard, StatCardGrid } from '@/components/dashboard/2025'
import { Button, Card, Badge, Select, Input } from '@/components/ui/2025'
import { useDashboardLayout } from '@/composables/useDashboardLayout'
import { useAuthStore } from '@/stores/auth'
import { notify } from '@/composables/useNotifications'
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  BanknotesIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  ClipboardDocumentListIcon,
  DocumentArrowDownIcon,
  SparklesIcon,
  UsersIcon
} from '@heroicons/vue/24/outline'
import { Chart as ChartJS, CategoryScale, LinearScale, LineElement, PointElement, BarElement, Title, Tooltip, Legend, LineController, BarController } from 'chart.js'
import jsPDF from 'jspdf'
import { apiService } from '@/services/api'
import type { AnalyticsDailyBreakdownEntry, AnalyticsSummary } from '@/types'

type ChartPeriod = 'week' | 'month' | 'quarter'

type QuickRangeOption = {
  id: string
  label: string
  days: number
}

type MerchantChartPoint = {
  date: string
  revenue?: number
  count?: number
}

type MerchantTopProduct = {
  product_id?: number
  product_name: string
  total_sold: number
  progress: number
}

ChartJS.register(
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  LineController,
  BarController
)

const { sidebar, header } = useDashboardLayout('merchant')
const authStore = useAuthStore()

const chartPeriod = ref<ChartPeriod>('month')
const revenueChartCanvas = ref<HTMLCanvasElement | null>(null)
const reservationsChartCanvas = ref<HTMLCanvasElement | null>(null)
let revenueChartInstance: ChartJS<'line'> | null = null
let reservationsChartInstance: ChartJS<'line'> | null = null

const analyticsSummary = ref<AnalyticsSummary>({})
const analyticsDailyBreakdown = ref<AnalyticsDailyBreakdownEntry[]>([])
const analyticsRange = reactive<{ start: string; end: string }>({ start: '', end: '' })
const defaultAnalyticsRange = reactive<{ start: string; end: string }>({ start: '', end: '' })
const analyticsRangeError = ref<string | null>(null)
const analyticsLastUpdated = ref<string | null>(null)

const revenueTrend = ref<{ labels: string[]; values: number[] }>({ labels: [], values: [] })
const reservationsTrend = ref<{ labels: string[]; values: number[] }>({ labels: [], values: [] })
const topProducts = ref<MerchantTopProduct[]>([])

const loadingStates = reactive({
  analytics: false,
  charts: false,
  refreshing: false,
  exporting: false
})
const exportFormat = ref<'csv' | 'pdf' | null>(null)
const activeQuickRange = ref<string>('30d')

const quickRanges: QuickRangeOption[] = [
  { id: '7d', label: '7 jours', days: 7 },
  { id: '30d', label: '30 jours', days: 30 },
  { id: '90d', label: '90 jours', days: 90 }
]

const merchantId = computed<number | null>(() => {
  const user = authStore.user as unknown as Record<string, unknown> | null
  if (!user) {
    return null
  }

  const direct = user.merchant_id ?? user.merchantId
  if (typeof direct === 'number') {
    return direct
  }
  if (typeof direct === 'string') {
    const parsed = Number(direct)
    return Number.isFinite(parsed) ? parsed : null
  }

  const nested = (user.merchant as Record<string, unknown> | undefined) ??
    (user.merchant_profile as Record<string, unknown> | undefined) ??
    (user.profile as Record<string, unknown> | undefined)?.merchant

  if (nested) {
    const nestedId = nested.id ?? nested.merchant_id ?? nested.merchantId
    if (typeof nestedId === 'number') {
      return nestedId
    }
    if (typeof nestedId === 'string') {
      const parsed = Number(nestedId)
      return Number.isFinite(parsed) ? parsed : null
    }
  }

  return null
})

const todayIso = computed(() => new Date().toISOString().split('T')[0])

const summaryMetrics = computed(() => {
  const totalRevenue = Number(analyticsSummary.value.total_revenue ?? 0)
  const totalReservations = Number(analyticsSummary.value.total_reservations ?? 0)
  const productsSaved = Number(analyticsSummary.value.products_saved_from_waste ?? 0)
  const newUsers = Number(analyticsSummary.value.new_users ?? 0)

  const days = Math.max(analyticsDailyBreakdown.value.length, 1)
  const averageOrderValue = totalReservations > 0 ? Math.round(totalRevenue / totalReservations) : 0
  const averageDailyReservations = totalReservations > 0 ? Math.round(totalReservations / days) : 0
  const impactPercentage = productsSaved > 0 ? Math.min(Math.round((productsSaved / (days * 10)) * 100), 100) : 0
  const returningRate = newUsers > 0 && totalReservations > 0
    ? Math.min(Math.round(((totalReservations - newUsers) / totalReservations) * 100), 100)
    : 0

  return {
    totalRevenue,
    totalReservations,
    productsSaved,
    newUsers,
    averageOrderValue,
    averageDailyReservations,
    impactPercentage,
    returningRate
  }
})

const hasRevenueData = computed(() => revenueTrend.value.values.length > 0)
const hasReservationData = computed(() => reservationsTrend.value.values.length > 0)
const hasTopProducts = computed(() => topProducts.value.length > 0)

const isCustomRangeModified = computed(() =>
  analyticsRange.start !== defaultAnalyticsRange.start || analyticsRange.end !== defaultAnalyticsRange.end
)

const formatNumber = (value: number) => new Intl.NumberFormat('fr-FR').format(Math.round(value))
const formatCurrency = (value: number) => new Intl.NumberFormat('fr-FR').format(Math.round(value))
const formatDate = (date: string) =>
  new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })

const formatTimeAgo = (isoDate: string) => {
  const date = new Date(isoDate)
  const diffMs = Date.now() - date.getTime()
  const diffMinutes = Math.floor(diffMs / 60000)
  if (diffMinutes < 1) {
    return "à l'instant"
  }
  if (diffMinutes < 60) {
    return `il y a ${diffMinutes} min`
  }
  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) {
    return `il y a ${diffHours} h`
  }
  const diffDays = Math.floor(diffHours / 24)
  return `il y a ${diffDays} j`
}

const setDateRangeFromDays = (days: number, options: { updateDefault?: boolean } = {}) => {
  const end = new Date()
  const start = new Date()
  start.setDate(end.getDate() - (days - 1))

  const startIso = start.toISOString().split('T')[0]
  const endIso = end.toISOString().split('T')[0]

  analyticsRange.start = startIso
  analyticsRange.end = endIso

  if (options.updateDefault) {
    defaultAnalyticsRange.start = startIso
    defaultAnalyticsRange.end = endIso
  }
}

const markCustomRange = () => {
  activeQuickRange.value = 'custom'
}

const validateAnalyticsRange = () => {
  analyticsRangeError.value = null

  if (!analyticsRange.start || !analyticsRange.end) {
    analyticsRangeError.value = 'Veuillez sélectionner une date de début et une date de fin.'
    return false
  }

  const start = new Date(analyticsRange.start)
  const end = new Date(analyticsRange.end)

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    analyticsRangeError.value = 'La plage de dates sélectionnée est invalide.'
    return false
  }

  if (start > end) {
    analyticsRangeError.value = 'La date de début doit précéder la date de fin.'
    return false
  }

  return true
}

const loadAdvancedAnalytics = async () => {
  if (!validateAnalyticsRange()) {
    return
  }

  loadingStates.analytics = true
  try {
    const params: { startDate: string; endDate: string; merchantId?: number | string } = {
      startDate: analyticsRange.start,
      endDate: analyticsRange.end
    }
    if (merchantId.value !== null) {
      params.merchantId = merchantId.value
    }

    const response = await apiService.getAnalyticsStats(params)
    if (!response.success) {
      throw new Error(response.message || 'Impossible de charger les analytics avancés.')
    }

    const summary = response.summary ?? {}
    analyticsSummary.value = summary

    const breakdown = Array.isArray(response.daily_breakdown)
      ? response.daily_breakdown
      : []
    analyticsDailyBreakdown.value = breakdown

    analyticsLastUpdated.value = new Date().toISOString()
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur inattendue lors du chargement des analytics.'
    notify.error(message, 'Analytics avancées')
    analyticsSummary.value = {}
    analyticsDailyBreakdown.value = []
  } finally {
    loadingStates.analytics = false
  }
}

const renderRevenueChart = async () => {
  await nextTick()
  if (!hasRevenueData.value) {
    revenueChartInstance?.destroy()
    revenueChartInstance = null
    return
  }

  const canvas = revenueChartCanvas.value
  if (!canvas) {
    return
  }

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    return
  }

  revenueChartInstance?.destroy()
  revenueChartInstance = new ChartJS(ctx, {
    type: 'line',
    data: {
      labels: revenueTrend.value.labels,
      datasets: [
        {
          label: 'Chiffre d\'affaires',
          data: revenueTrend.value.values,
          borderColor: '#2563eb',
          backgroundColor: 'rgba(37, 99, 235, 0.15)',
          borderWidth: 2,
          tension: 0.35,
          fill: true,
          pointRadius: 4,
          pointBackgroundColor: '#2563eb'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: context => `${formatCurrency(Number(context.parsed.y ?? 0))} F CFA`
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: '#6b7280' }
        },
        y: {
          ticks: {
            color: '#6b7280',
            callback: value => `${formatCurrency(Number(value))}`
          }
        }
      }
    }
  })
}

const renderReservationsChart = async () => {
  await nextTick()
  if (!hasReservationData.value) {
    reservationsChartInstance?.destroy()
    reservationsChartInstance = null
    return
  }

  const canvas = reservationsChartCanvas.value
  if (!canvas) {
    return
  }

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    return
  }

  reservationsChartInstance?.destroy()
  reservationsChartInstance = new ChartJS(ctx, {
    type: 'line',
    data: {
      labels: reservationsTrend.value.labels,
      datasets: [
        {
          label: 'Réservations',
          data: reservationsTrend.value.values,
          borderColor: '#f97316',
          backgroundColor: 'rgba(249, 115, 22, 0.15)',
          borderWidth: 2,
          tension: 0.35,
          fill: true,
          pointRadius: 4,
          pointBackgroundColor: '#f97316'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: context => `${formatNumber(Number(context.parsed.y ?? 0))} réservations`
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: '#6b7280' }
        },
        y: {
          ticks: {
            color: '#6b7280',
            callback: value => formatNumber(Number(value))
          }
        }
      }
    }
  })
}

const loadRevenueTrend = async () => {
  loadingStates.charts = true
  try {
    const response = await apiService.get<{ success: boolean; data: { chart_data: MerchantChartPoint[] } }>(
      `/analytics/merchant-revenue-chart?period=${chartPeriod.value}`,
      true
    )

    if (!response.success) {
      throw new Error('Impossible de charger la tendance des revenus.')
    }

    const dataset = Array.isArray(response.data?.chart_data) ? response.data.chart_data : []
    revenueTrend.value = {
      labels: dataset.map(point => formatDate(point.date)),
      values: dataset.map(point => Number(point.revenue ?? 0))
    }
    await renderRevenueChart()
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur lors du chargement des revenus.'
    notify.error(message, 'Analytics avancées')
    revenueTrend.value = { labels: [], values: [] }
    await renderRevenueChart()
  } finally {
    loadingStates.charts = false
  }
}

const loadReservationsTrend = async () => {
  loadingStates.charts = true
  try {
    const response = await apiService.get<{ success: boolean; data: { chart_data: MerchantChartPoint[] } }>(
      `/analytics/merchant-reservations-chart?period=${chartPeriod.value}`,
      true
    )

    if (!response.success) {
      throw new Error('Impossible de charger la tendance des réservations.')
    }

    const dataset = Array.isArray(response.data?.chart_data) ? response.data.chart_data : []
    reservationsTrend.value = {
      labels: dataset.map(point => formatDate(point.date)),
      values: dataset.map(point => Number(point.count ?? 0))
    }
    await renderReservationsChart()
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur lors du chargement des réservations.'
    notify.error(message, 'Analytics avancées')
    reservationsTrend.value = { labels: [], values: [] }
    await renderReservationsChart()
  } finally {
    loadingStates.charts = false
  }
}

const loadTopProducts = async () => {
  try {
    const response = await apiService.get<{ success: boolean; data: { chart_data: Array<{ product_id: number; product_name: string; total_sold: number }> } }>(
      '/analytics/merchant-products-chart?limit=5',
      true
    )

    if (!response.success) {
      throw new Error('Impossible de charger les meilleures ventes.')
    }

    const dataset = Array.isArray(response.data?.chart_data) ? response.data.chart_data : []
    const maxSold = dataset.reduce((max, product) => Math.max(max, Number(product.total_sold ?? 0)), 0)
    topProducts.value = dataset.map(product => ({
      product_id: product.product_id,
      product_name: product.product_name,
      total_sold: Number(product.total_sold ?? 0),
      progress: maxSold > 0
        ? Math.min(Math.round((Number(product.total_sold ?? 0) / maxSold) * 100), 100)
        : 0
    }))
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur lors du chargement des meilleures ventes.'
    notify.error(message, 'Analytics avancées')
    topProducts.value = []
  }
}

const loadCharts = async () => {
  await Promise.all([loadRevenueTrend(), loadReservationsTrend(), loadTopProducts()])
}

const refreshAll = async () => {
  loadingStates.refreshing = true
  try {
    await Promise.all([loadAdvancedAnalytics(), loadCharts()])
  } finally {
    loadingStates.refreshing = false
  }
}

const applyQuickRange = async (option: QuickRangeOption) => {
  activeQuickRange.value = option.id
  setDateRangeFromDays(option.days)
  await loadAdvancedAnalytics()
}

const applyCustomRange = async () => {
  if (!validateAnalyticsRange()) {
    return
  }
  await loadAdvancedAnalytics()
}

const resetCustomRange = async () => {
  activeQuickRange.value = '30d'
  analyticsRange.start = defaultAnalyticsRange.start
  analyticsRange.end = defaultAnalyticsRange.end
  await loadAdvancedAnalytics()
}

const exportAnalytics = async (format: 'csv' | 'pdf') => {
  if (analyticsDailyBreakdown.value.length === 0 || loadingStates.exporting) {
    return
  }

  loadingStates.exporting = true
  exportFormat.value = format

  try {
    if (format === 'csv') {
      const rows = [
        ['Date', 'Chiffre d\'affaires (F CFA)', 'Réservations', 'Produits sauvés', 'Nouveaux clients'],
        ...analyticsDailyBreakdown.value.map(entry => [
          formatDate(entry.date),
          formatCurrency(Number(entry.total_revenue ?? 0)),
          formatNumber(Number(entry.total_reservations ?? 0)),
          formatNumber(Number(entry.products_saved_from_waste ?? 0)),
          formatNumber(Number(entry.new_users ?? 0))
        ])
      ]

      const csvContent = rows.map(row => row.join(';')).join('\n')
      const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `analytics-${analyticsRange.start}-to-${analyticsRange.end}.csv`
      link.click()
      URL.revokeObjectURL(url)
    } else {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' })
      const marginX = 40
      let cursorY = 60

      const addLine = (text: string, options: { bold?: boolean } = {}) => {
        if (options.bold) {
          doc.setFont(undefined, 'bold')
        } else {
          doc.setFont(undefined, 'normal')
        }
        doc.text(text, marginX, cursorY)
        cursorY += 18
      }

      doc.setFontSize(20)
      addLine('Rapport analytics avancé', { bold: true })
      doc.setFontSize(12)
      addLine(`Période: ${analyticsRange.start} → ${analyticsRange.end}`)
      if (analyticsLastUpdated.value) {
        addLine(`Dernière mise à jour: ${new Date(analyticsLastUpdated.value).toLocaleString('fr-FR')}`)
      }
      cursorY += 10

      addLine(`Revenus totaux: ${formatCurrency(summaryMetrics.value.totalRevenue)} F CFA`)
      addLine(`Réservations: ${formatNumber(summaryMetrics.value.totalReservations)}`)
      addLine(`Produits sauvés: ${formatNumber(summaryMetrics.value.productsSaved)}`)
      addLine(`Nouveaux clients: ${formatNumber(summaryMetrics.value.newUsers)}`)
      cursorY += 10

      if (analyticsDailyBreakdown.value.length > 0) {
        addLine('Top 10 jours performants', { bold: true })
        analyticsDailyBreakdown.value.slice(0, 10).forEach(entry => {
          addLine(
            `${formatDate(entry.date)} • ${formatCurrency(Number(entry.total_revenue ?? 0))} F CFA • ${formatNumber(Number(entry.total_reservations ?? 0))} réservations`
          )
        })
      }

      doc.save(`analytics-${analyticsRange.start}-to-${analyticsRange.end}.pdf`)
    }
    notify.success('Export généré avec succès.', 'Analytics avancées')
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Impossible de générer le rapport.'
    notify.error(message, 'Analytics avancées')
  } finally {
    loadingStates.exporting = false
    exportFormat.value = null
  }
}

watch(chartPeriod, async () => {
  await loadCharts()
})

watch(merchantId, async (newId) => {
  if (newId !== null) {
    await refreshAll()
  }
})

onMounted(async () => {
  setDateRangeFromDays(30, { updateDefault: true })
  if (merchantId.value !== null) {
    await refreshAll()
  }
})

onBeforeUnmount(() => {
  revenueChartInstance?.destroy()
  reservationsChartInstance?.destroy()
})
</script>
