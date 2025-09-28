<template>
  <DashboardLayout
    :sidebar="sidebar"
    :header="header"
    class="bg-gradient-to-br from-surface-light via-surface-light to-primary-50 dark:from-surface-dark dark:via-surface-darker dark:to-primary-950"
  >
    <div class="mx-auto w-full max-w-7xl px-3 py-6 sm:px-6 sm:py-8">
      <!-- Header -->
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">
            Tableau de bord commerçant
          </h1>
          <p class="text-neutral-600 dark:text-neutral-300">
            Gérez vos produits, vos réservations et vos performances
          </p>
        </div>
        <Button
          tag="router-link"
          to="/merchant/products?action=create"
          variant="primary"
          size="md"
          class="shadow-glow"
        >
          <PlusIcon class="h-4 w-4" />
          <span> Nouveau produit </span>
        </Button>
      </div>

      <!-- Statistics Cards -->
      <StatCardGrid class="mt-8" columns="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 xl:gap-6">
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
import { Card, Button, Badge } from '@/components/ui/2025'
import { QuickActionsCard, StatCard, StatCardGrid } from '@/components/dashboard/2025'
import type { BadgeVariant } from '@/components/ui/2025'

const authStore = useAuthStore()
const { sidebar, header } = useDashboardLayout('merchant')

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

const handleQuickAction = (action: (typeof quickActions)[number]) => {
  if (!action.to) {
    return
  }
}

const loadDashboardData = async () => {
  try {
    stats.total_products = 8
    stats.pending_reservations = 3
    stats.total_revenue = 160_928
    stats.completed_reservations = 15
    stats.conversion_rate = 67
    stats.average_rating = 4.5
    stats.products_sold = 23
    stats.co2_saved = 48.5

    await loadRecentReservations()
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
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authStore.token}`
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    if (data.success && data.data) {
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
    recentReservations.value = []
  }
}

const loadRecentProducts = async () => {
  try {
    const response = await fetch('http://localhost:8000/api/products/merchant?per_page=5', {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authStore.token}`
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    if (data.success && data.data) {
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
    recentProducts.value = []
  }
}

onMounted(() => {
  loadDashboardData()
})
</script>
