<template>
  <DashboardLayout
    :sidebar="sidebar"
    :header="header"
    :mobile-nav="mobileNav"
    class="bg-gradient-to-br from-surface-light via-surface-light to-primary-50 dark:from-surface-dark dark:via-surface-darker dark:to-primary-950"
  >
    <div class="mx-auto w-full max-w-7xl space-y-8 px-3 py-6 sm:px-6 sm:py-8">
      <DashboardHeader
        eyebrow="Commerçant"
        title="Tableau de bord commerçant"
        subtitle="Gérez vos produits, vos réservations et vos performances"
      >
        <template #actions>
          <Button
            tag="router-link"
            to="/merchant/products?action=create"
            variant="primary"
            size="lg"
            class="gap-2 shadow-glow"
          >
            <PlusIcon class="h-5 w-5" />
            <span>Nouveau produit</span>
          </Button>
        </template>
      </DashboardHeader>

      <!-- Statistics Cards -->
      <StatCardGrid columns="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 xl:gap-6">
        <StatCard
          v-for="stat in statHighlights"
          :key="stat.id"
          :title="stat.title"
          :value="stat.value"
          :description="stat.description"
          :icon="stat.icon"
          :accent="stat.accent"
        />
      </StatCardGrid>

      <!-- Main Content Grid -->
      <div class="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3 xl:gap-8">
        <!-- Recent Reservations -->
        <Card class="lg:col-span-2">
          <template #header>
            <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 class="text-xl font-semibold text-neutral-900 dark:text-neutral-50">
                  Réservations récentes
                </h2>
                <p class="text-sm text-neutral-500 dark:text-neutral-400">
                  Les 5 dernières réservations enregistrées
                </p>
              </div>
              <Button
                tag="router-link"
                to="/merchant/reservations"
                variant="ghost"
                size="sm"
                class="text-primary-600 hover:text-primary-700 dark:text-primary-300"
              >
                <span>Voir tout</span>
                <ArrowRightIcon class="h-4 w-4" />
              </Button>
            </div>
          </template>

          <div v-if="recentReservations.length === 0" class="py-10 text-center">
            <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800">
              <ClockIcon class="h-6 w-6 text-neutral-400" />
            </div>
            <p class="mt-4 text-neutral-500 dark:text-neutral-400">
              Aucune réservation récente
            </p>
          </div>

          <ul v-else class="space-y-4">
            <li
              v-for="reservation in recentReservations"
              :key="reservation.id"
              class="flex flex-col gap-4 rounded-xl border border-transparent bg-surface-light/60 p-4 transition-colors duration-200 hover:border-primary-400/30 hover:bg-primary-500/5 dark:bg-surface-dark/60"
            >
              <div class="flex flex-1 items-start justify-between gap-4">
                <div class="flex items-start gap-4">
                  <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-500/10">
                    <UserIcon class="h-6 w-6 text-primary-600" />
                  </div>
                  <div class="space-y-1">
                    <p class="font-semibold text-neutral-900 dark:text-neutral-50">
                      {{ reservation.customer_name }}
                    </p>
                    <p class="text-sm text-neutral-500 dark:text-neutral-400">
                      {{ reservation.product_name }}
                    </p>
                    <p class="text-xs text-neutral-400">
                      {{ formatDate(reservation.created_at) }}
                    </p>
                  </div>
                </div>
                <div class="flex flex-col items-end gap-2 text-right">
                  <Badge :variant="getStatusVariant(reservation.status)" size="sm">
                    {{ getStatusText(reservation.status) }}
                  </Badge>
                  <span class="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                    {{ formatCurrency(reservation.total_amount) }} F CFA
                  </span>
                </div>
              </div>
            </li>
          </ul>
        </Card>

        <!-- Quick Actions -->
        <div class="space-y-6">
          <QuickActionsCard
            title="Actions rapides"
            :actions="quickActions"
            @action="handleQuickAction"
          />

          <LocationManager />

          <Card>
            <template #header>
              <h2 class="text-xl font-semibold text-neutral-900 dark:text-neutral-50">
                Performance
              </h2>
            </template>
            <dl class="space-y-4 text-sm text-neutral-600 dark:text-neutral-300">
              <div class="flex items-center justify-between">
                <dt>Taux de conversion</dt>
                <dd class="font-semibold text-primary-600 dark:text-primary-300">
                  {{ stats.conversion_rate }}%
                </dd>
              </div>
              <div class="flex items-center justify-between">
                <dt>Évaluation moyenne</dt>
                <dd class="flex items-center gap-2">
                  <StarIcon class="h-4 w-4 text-accent-orange" />
                  <span class="font-semibold text-neutral-900 dark:text-neutral-100">
                    {{ stats.average_rating }}
                  </span>
                </dd>
              </div>
              <div class="flex items-center justify-between">
                <dt>Produits vendus</dt>
                <dd class="font-semibold text-primary-600 dark:text-primary-300">
                  {{ stats.products_sold }}
                </dd>
              </div>
              <div class="flex items-center justify-between">
                <dt>Impact CO₂</dt>
                <dd class="font-semibold text-accent-blue">
                  -{{ stats.co2_saved }}kg
                </dd>
              </div>
            </dl>
          </Card>

          <Card>
            <template #header>
              <h2 class="text-xl font-semibold text-neutral-900 dark:text-neutral-50">
                Notifications
              </h2>
            </template>
            <div v-if="notifications.length === 0" class="py-8 text-center">
              <BellIcon class="mx-auto h-6 w-6 text-neutral-400" />
              <p class="mt-3 text-sm text-neutral-500 dark:text-neutral-400">
                Aucune notification
              </p>
            </div>
            <ul v-else class="space-y-3">
              <li
                v-for="notification in notifications"
                :key="notification.id"
                class="flex gap-3 rounded-xl bg-surface-light/70 p-3 dark:bg-surface-dark/60"
              >
                <span class="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-primary-500" />
                <div class="space-y-1 text-left">
                  <p class="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                    {{ notification.title }}
                  </p>
                  <p class="text-xs text-neutral-500 dark:text-neutral-400">
                    {{ notification.message }}
                  </p>
                  <p class="text-xs text-neutral-400">
                    {{ formatDate(notification.created_at) }}
                  </p>
                </div>
              </li>
            </ul>
          </Card>
        </div>
      </div>

      <!-- Recent Products -->
      <Card class="mt-8">
        <template #header>
          <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 class="text-xl font-semibold text-neutral-900 dark:text-neutral-50">
                Mes produits récents
              </h2>
              <p class="text-sm text-neutral-500 dark:text-neutral-400">
                Les dernières offres ajoutées à votre vitrine
              </p>
            </div>
            <Button
              tag="router-link"
              to="/merchant/products"
              variant="ghost"
              size="sm"
              class="text-primary-600 hover:text-primary-700 dark:text-primary-300"
            >
              <span>Voir tout</span>
              <ArrowRightIcon class="h-4 w-4" />
            </Button>
          </div>
        </template>

        <div v-if="recentProducts.length === 0" class="py-12 text-center">
          <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800">
            <ShoppingBagIcon class="h-6 w-6 text-neutral-400" />
          </div>
          <p class="mt-4 text-neutral-500 dark:text-neutral-400">
            Aucun produit ajouté
          </p>
          <Button
            tag="router-link"
            to="/merchant/products/create"
            variant="primary"
            size="sm"
            class="mt-4"
          >
            <PlusIcon class="h-4 w-4" />
            <span>Ajouter votre premier produit</span>
          </Button>
        </div>

        <div v-else class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <div
            v-for="product in recentProducts"
            :key="product.id"
            class="flex flex-col gap-3 rounded-xl border border-transparent bg-surface-light/70 p-4 transition-colors duration-200 hover:border-primary-400/40 hover:bg-primary-500/5 dark:bg-surface-dark/60"
          >
            <div class="aspect-square w-full overflow-hidden rounded-lg bg-neutral-100 dark:bg-neutral-800">
              <img
                v-if="product.image_url"
                :src="product.image_url"
                :alt="product.name"
                class="h-full w-full object-cover"
              >
              <div v-else class="flex h-full w-full items-center justify-center">
                <ShoppingBagIcon class="h-8 w-8 text-neutral-400" />
              </div>
            </div>
            <div class="space-y-2">
              <h3 class="text-base font-semibold text-neutral-900 dark:text-neutral-50">
                {{ product.name }}
              </h3>
              <p class="text-sm text-neutral-500 dark:text-neutral-400">
                {{ product.category }}
              </p>
            </div>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="text-lg font-semibold text-primary-600 dark:text-primary-300">
                  {{ formatCurrency(product.discounted_price) }} F CFA
                </span>
                <span class="text-xs text-neutral-400 line-through">
                  {{ formatCurrency(product.original_price) }} F CFA
                </span>
              </div>
              <Badge variant="secondary" size="sm">
                {{ product.quantity_available }} dispo
              </Badge>
            </div>
          </div>
        </div>
      </Card>
    </div>
  </DashboardLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import LocationManager from '@/components/merchant/LocationManager.vue'
import DashboardLayout from '@/components/ui/2025/DashboardLayout.vue'
import { useDashboardLayout } from '@/composables/useDashboardLayout'
import {
  PlusIcon,
  ShoppingBagIcon,
  ClockIcon,
  BanknotesIcon,
  CheckCircleIcon,
  ChartBarIcon,
  ArrowRightIcon,
  UserIcon,
  CogIcon,
  StarIcon,
  BellIcon
} from '@heroicons/vue/24/outline'
import { Card, Button, Badge, type BadgeVariant } from '@/components/ui/2025'
import { DashboardHeader, QuickActionsCard, StatCard, StatCardGrid } from '@/components/dashboard/2025'
import { notify } from '@/composables/useNotifications'
import { apiService } from '@/services/api'
import type { ApiResponse, Product, Reservation } from '@/types'

const { sidebar, header, mobileNav } = useDashboardLayout('merchant')

type WithOptionalMeta<T> = T & {
  meta?: Record<string, unknown>
  metrics?: Record<string, unknown>
  summary?: Record<string, unknown>
}

type MerchantReservationsResponse = WithOptionalMeta<ApiResponse<Reservation[]>>
type MerchantProductsResponse = WithOptionalMeta<ApiResponse<Product[]>>

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

const statHighlights = computed(() => [
  {
    id: 'products',
    title: 'Produits actifs',
    value: stats.total_products.toLocaleString('fr-FR'),
    description: 'Disponibles dans votre vitrine',
    icon: ShoppingBagIcon,
    accent: 'primary' as const
  },
  {
    id: 'pending',
    title: 'Réservations en attente',
    value: stats.pending_reservations.toLocaleString('fr-FR'),
    description: 'À confirmer dès que possible',
    icon: ClockIcon,
    accent: 'warning' as const
  },
  {
    id: 'revenue',
    title: 'Revenus du mois',
    value: `${formatCurrency(stats.total_revenue)} F CFA`,
    description: 'Chiffre d’affaires estimé',
    icon: BanknotesIcon,
    accent: 'success' as const
  },
  {
    id: 'completed',
    title: 'Réservations terminées',
    value: stats.completed_reservations.toLocaleString('fr-FR'),
    description: 'Clients satisfaits ce mois',
    icon: CheckCircleIcon,
    accent: 'info' as const
  }
])

const quickActions = [
  {
    id: 'create-product',
    label: 'Ajouter un produit',
    description: 'Créez une nouvelle offre',
    to: '/merchant/products/create',
    icon: PlusIcon,
    tone: 'primary' as const
  },
  {
    id: 'manage-products',
    label: 'Gérer les produits',
    description: 'Modifiez vos fiches actuelles',
    to: '/merchant/products',
    icon: ShoppingBagIcon,
    tone: 'neutral' as const
  },
  {
    id: 'view-reservations',
    label: 'Voir les réservations',
    description: 'Suivez les commandes en cours',
    to: '/merchant/reservations',
    icon: ClockIcon,
    tone: 'warning' as const
  },
  {
    id: 'analytics',
    label: 'Analytics avancées',
    description: 'Analysez vos performances détaillées',
    to: '/merchant/analytics',
    icon: ChartBarIcon,
    tone: 'primary' as const
  },
  {
    id: 'settings',
    label: 'Paramètres',
    description: 'Mettez à jour votre profil',
    to: '/profile',
    icon: CogIcon,
    tone: 'neutral' as const
  }
]

const formatCurrency = (value: number) => Math.round(value).toLocaleString('fr-FR')

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getStatusVariant = (status: string): BadgeVariant => {
  switch (status) {
    case 'pending':
      return 'warning'
    case 'confirmed':
      return 'info'
    case 'ready':
      return 'primary'
    case 'completed':
      return 'success'
    case 'cancelled':
      return 'error'
    default:
      return 'secondary'
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

const handleQuickAction = (action: { id?: string | number; label?: string; to?: string | Record<string, unknown>; handler?: () => void }) => {
  if (action.handler) {
    action.handler()
    return
  }
  if (!action.to) {
    return
  }
}

const parseNumber = (value: unknown) => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    return Number.isNaN(parsed) ? null : parsed
  }

  return null
}

const extractMetric = (
  sources: Array<Record<string, unknown> | undefined>,
  keys: string[],
  fallback: number
) => {
  for (const source of sources) {
    if (!source) {
      continue
    }

    for (const key of keys) {
      if (!(key in source)) {
        continue
      }

      const value = parseNumber((source as Record<string, unknown>)[key])
      if (value !== null) {
        return value
      }
    }
  }

  return fallback
}

type ReservationsLoadResult = {
  items: Array<{
    id: number
    customer_name: string
    product_name: string
    total_amount: number
    status: string
    created_at: string
  }>
  rawData: Reservation[]
  response: MerchantReservationsResponse | null
}

type ProductsLoadResult = {
  items: Array<{
    id: number
    name: string
    category: string
    discounted_price: number
    original_price: number
    quantity_available: number
    image_url: string | null
  }>
  rawData: Product[]
  response: MerchantProductsResponse | null
}

const loadRecentReservations = async (): Promise<ReservationsLoadResult> => {
  const emptyResult: ReservationsLoadResult = {
    items: [],
    rawData: [],
    response: null
  }

  try {
    const response = await apiService.getMerchantReservations({ per_page: 5 }) as MerchantReservationsResponse

    if (!response?.success) {
      const message = response?.message || 'Impossible de charger les réservations récentes.'
      notify.error(message)
      recentReservations.value = []
      return { ...emptyResult, response }
    }

    const reservationsData = Array.isArray(response.data) ? response.data : []

    const mappedReservations = reservationsData.map(res => {
      const consumer = (res as Reservation).consumer || (res as any).user || {}
      const customerName = `${(consumer as any)?.first_name || ''} ${(consumer as any)?.last_name || ''}`.trim()
      const product = (res as Reservation).product || {}

      return {
        id: res.id,
        customer_name: customerName || (consumer as any)?.name || 'Client',
        product_name: (product as any)?.name || 'Produit inconnu',
        total_amount: parseNumber((res as any)?.total_amount) ?? parseNumber((res as any)?.discounted_price) ?? 0,
        status: (res as any)?.status || 'pending',
        created_at: (res as any)?.created_at || new Date().toISOString()
      }
    })

    recentReservations.value = mappedReservations

    return {
      items: mappedReservations,
      rawData: reservationsData,
      response
    }
  } catch (error) {
    notify.error('Erreur lors du chargement des réservations récentes.')
    recentReservations.value = []
    return emptyResult
  }
}

const loadRecentProducts = async (): Promise<ProductsLoadResult> => {
  const emptyResult: ProductsLoadResult = {
    items: [],
    rawData: [],
    response: null
  }

  try {
    const response = await apiService.getMerchantProducts({ per_page: 5 }) as MerchantProductsResponse

    if (!response?.success) {
      const message = response?.message || 'Impossible de charger les produits récents.'
      notify.error(message)
      recentProducts.value = []
      return { ...emptyResult, response }
    }

    const productsData = Array.isArray(response.data) ? response.data : []

    const mappedProducts = productsData.map(product => ({
      id: product.id,
      name: product.name,
      category: (product.category as any)?.name || 'Catégorie',
      discounted_price: parseNumber((product as any)?.discounted_price) ?? 0,
      original_price: parseNumber((product as any)?.original_price) ?? 0,
      quantity_available: (product as any)?.quantity_available ?? 0,
      image_url: (product as any)?.image_url || null
    }))

    recentProducts.value = mappedProducts

    return {
      items: mappedProducts,
      rawData: productsData,
      response
    }
  } catch (error) {
    notify.error('Erreur lors du chargement des produits récents.')
    recentProducts.value = []
    return emptyResult
  }
}

const hydrateStats = (
  reservationsResult: ReservationsLoadResult,
  productsResult: ProductsLoadResult
) => {
  const reservationsRaw = reservationsResult.response
  const productsRaw = productsResult.response

  const reservationsMetaSources = [
    reservationsRaw?.meta,
    reservationsRaw?.metrics,
    reservationsRaw?.summary
  ]

  const productsMetaSources = [
    productsRaw?.meta,
    productsRaw?.metrics,
    productsRaw?.summary
  ]

  const reservationsPagination = reservationsRaw?.pagination
  const productsPagination = productsRaw?.pagination

  const rawReservations = reservationsResult.rawData

  const totalReservations =
    parseNumber(reservationsPagination?.total) ?? rawReservations.length

  const pendingFromData = rawReservations.filter(res => (res as any)?.status === 'pending').length
  const completedFromData = rawReservations.filter(res => (res as any)?.status === 'completed').length
  const revenueFromData = rawReservations.reduce((sum, reservation) => {
    const amount = parseNumber((reservation as any)?.total_amount) ?? 0
    return sum + amount
  }, 0)
  const productsSoldFromData = rawReservations.reduce((sum, reservation) => {
    const quantity = parseNumber((reservation as any)?.quantity_reserved) ?? parseNumber((reservation as any)?.quantity) ?? 0
    return sum + quantity
  }, 0)

  stats.total_products =
    parseNumber(productsPagination?.total) ??
    extractMetric(productsMetaSources, ['total_products', 'products_total', 'products_count', 'count'], productsResult.rawData.length)

  stats.pending_reservations = extractMetric(
    [...reservationsMetaSources, reservationsPagination as Record<string, unknown> | undefined],
    ['pending_reservations', 'pending_count', 'pending'],
    pendingFromData
  )

  stats.completed_reservations = extractMetric(
    [...reservationsMetaSources, reservationsPagination as Record<string, unknown> | undefined],
    ['completed_reservations', 'completed_count', 'completed'],
    completedFromData
  )

  stats.total_revenue = extractMetric(
    reservationsMetaSources,
    ['total_revenue', 'revenue_total', 'revenue'],
    revenueFromData
  )

  stats.products_sold = extractMetric(
    [...reservationsMetaSources, ...productsMetaSources],
    ['products_sold', 'items_sold', 'sold_count'],
    productsSoldFromData
  )

  const computedConversion = totalReservations > 0 ? Math.round((stats.completed_reservations / totalReservations) * 100) : 0

  stats.conversion_rate = extractMetric(
    reservationsMetaSources,
    ['conversion_rate', 'conversion'],
    computedConversion
  )

  stats.average_rating = extractMetric(
    [...productsMetaSources, ...reservationsMetaSources],
    ['average_rating', 'avg_rating'],
    0
  )

  stats.co2_saved = extractMetric(
    [...reservationsMetaSources, ...productsMetaSources],
    ['co2_saved', 'co2_saved_kg', 'co2_reduction'],
    0
  )
}

const loadDashboardData = async () => {
  try {
    const [reservationsResult, productsResult] = await Promise.all([
      loadRecentReservations(),
      loadRecentProducts()
    ])

    hydrateStats(reservationsResult, productsResult)

    notifications.value = reservationsResult.rawData.slice(0, 3).map(reservation => {
      const consumer = (reservation as any)?.consumer || (reservation as any)?.user || {}
      const customerName = `${consumer?.first_name || ''} ${consumer?.last_name || ''}`.trim() || consumer?.name || 'Client'
      const productName = (reservation as any)?.product?.name || 'Produit'

      return {
        id: reservation.id,
        title: (reservation as any)?.status === 'pending' ? 'Nouvelle réservation' : `Réservation ${getStatusText((reservation as any)?.status)}`,
        message: `${productName} pour ${customerName}`,
        created_at: (reservation as any)?.created_at || new Date().toISOString()
      }
    })
  } catch (error) {
    notify.error('Une erreur est survenue lors du chargement du tableau de bord.')
  }
}

onMounted(() => {
  loadDashboardData()
})
</script>
