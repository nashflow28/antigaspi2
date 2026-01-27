<template>
  <div class="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-800">
    <header class="border-b border-neutral-200 bg-white/80 backdrop-blur-sm dark:border-neutral-700 dark:bg-neutral-800/80">
      <div class="container mx-auto px-4 py-6 lg:px-8 lg:py-8">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <nav class="text-sm text-neutral-500 dark:text-neutral-400" aria-label="Fil d'Ariane">
              <ol class="flex items-center gap-2">
                <li>
                  <RouterLink to="/merchant/dashboard" class="hover:text-neutral-800 dark:hover:text-neutral-200">
                    Tableau de bord
                  </RouterLink>
                </li>
                <li class="text-neutral-400 dark:text-neutral-500">/</li>
                <li class="font-medium text-neutral-800 dark:text-neutral-200">Notifications</li>
              </ol>
            </nav>
            <h1 class="mt-3 text-2xl font-semibold text-neutral-900 dark:text-white">Notifications</h1>
            <p class="mt-2 text-neutral-600 dark:text-neutral-400">
              Suivez les réservations, avis clients et alertes importantes de votre commerce.
            </p>
          </div>
          <div class="flex items-center gap-3">
            <Badge v-if="unreadCount > 0" variant="primary">
              {{ unreadCount }} non lue{{ unreadCount > 1 ? 's' : '' }}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              :disabled="loading"
              @click="refreshNotifications"
            >
              <RefreshCw class="mr-2 h-4 w-4" />
              Actualiser
            </Button>
            <Button
              variant="outline"
              size="sm"
              :disabled="!unreadCount || loading"
              @click="handleMarkAllAsRead"
            >
              <CheckCheck class="mr-2 h-4 w-4" />
              Tout marquer lu
            </Button>
          </div>
        </div>
      </div>
    </header>

    <main class="container mx-auto px-4 py-8 lg:px-8">
      <div class="grid gap-6 lg:grid-cols-[1fr_280px]">
        <!-- Liste des notifications -->
        <Card class="overflow-hidden border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-800">
          <!-- Filtres par type -->
          <div class="border-b border-neutral-200 bg-neutral-50 px-4 py-3 dark:border-neutral-700 dark:bg-neutral-900">
            <div class="flex flex-wrap items-center gap-2">
              <Button
                v-for="filter in typeFilters"
                :key="filter.key"
                :variant="activeFilter === filter.key ? 'primary' : 'ghost'"
                size="sm"
                @click="setFilter(filter.key)"
              >
                <component :is="filter.icon" class="mr-1.5 h-4 w-4" />
                {{ filter.label }}
                <Badge
                  v-if="filter.count > 0"
                  :variant="activeFilter === filter.key ? 'secondary' : 'primary'"
                  size="sm"
                  class="ml-1.5"
                >
                  {{ filter.count }}
                </Badge>
              </Button>
            </div>
          </div>

          <div class="max-h-[calc(100vh-320px)] overflow-y-auto">
            <Loading
              v-if="loading && !notifications.length"
              type="skeleton"
              :skeleton-lines="5"
              class="p-4"
            />

            <EmptyState
              v-else-if="!notifications.length"
              title="Aucune notification"
              :description="activeFilter === 'all'
                ? 'Vous n\'avez pas encore de notifications. Elles apparaîtront ici dès qu\'un client interagit avec votre commerce.'
                : `Aucune notification de type ${getFilterLabel(activeFilter)}.`"
              :icon="Bell"
              class="py-12"
            />

            <ul v-else class="divide-y divide-neutral-200 dark:divide-neutral-700">
              <li
                v-for="notification in filteredNotifications"
                :key="notification.id"
                :class="[
                  'flex gap-4 px-4 py-4 transition-colors',
                  notification.is_read
                    ? 'bg-white dark:bg-neutral-800'
                    : 'bg-primary-50/50 dark:bg-primary-900/20'
                ]"
              >
                <div
                  :class="[
                    'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full',
                    getTypeColor(notification.type)
                  ]"
                >
                  <component :is="getTypeIcon(notification.type)" class="h-5 w-5" />
                </div>

                <div class="min-w-0 flex-1">
                  <div class="flex items-start justify-between gap-2">
                    <div class="min-w-0">
                      <p class="font-semibold text-neutral-900 dark:text-white">
                        {{ notification.title }}
                      </p>
                      <p class="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                        {{ notification.message }}
                      </p>
                    </div>
                    <Badge
                      v-if="!notification.is_read"
                      variant="primary"
                      size="sm"
                      class="flex-shrink-0"
                    >
                      Nouveau
                    </Badge>
                  </div>

                  <div class="mt-2 flex flex-wrap items-center gap-4">
                    <span class="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
                      <Clock class="h-3.5 w-3.5" />
                      {{ formatRelativeTime(notification.created_at) }}
                    </span>

                    <!-- Actions contextuelles -->
                    <div class="flex items-center gap-2">
                      <Button
                        v-if="notification.type === 'reservation' && notification.data?.reservation_id"
                        variant="ghost"
                        size="xs"
                        @click="goToReservation(notification.data.reservation_id)"
                      >
                        Voir la réservation
                      </Button>
                      <Button
                        v-if="notification.type === 'review' && notification.data?.review_id"
                        variant="ghost"
                        size="xs"
                        @click="goToReviews"
                      >
                        Voir l'avis
                      </Button>
                      <Button
                        v-if="notification.type === 'product' && notification.data?.product_id"
                        variant="ghost"
                        size="xs"
                        @click="goToProduct(notification.data.product_id)"
                      >
                        Voir le produit
                      </Button>
                      <Button
                        v-if="!notification.is_read"
                        variant="ghost"
                        size="xs"
                        :loading="markingRead === notification.id"
                        @click="handleMarkAsRead(notification.id)"
                      >
                        Marquer lu
                      </Button>
                    </div>
                  </div>
                </div>
              </li>
            </ul>

            <!-- Pagination -->
            <div v-if="pagination.lastPage > 1" class="border-t border-neutral-200 p-4 dark:border-neutral-700">
              <Pagination
                :current-page="pagination.currentPage"
                :total-pages="pagination.lastPage"
                :total="pagination.total"
                :page-size="pagination.perPage"
                @page-change="loadPage"
              />
            </div>
          </div>
        </Card>

        <!-- Sidebar stats et liens rapides -->
        <div class="space-y-6">
          <!-- Stats rapides -->
          <Card class="border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-800">
            <h3 class="flex items-center gap-2 text-sm font-semibold text-neutral-700 dark:text-neutral-300">
              <BarChart3 class="h-4 w-4" />
              Résumé
            </h3>
            <div class="mt-4 space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-sm text-neutral-600 dark:text-neutral-400">Total</span>
                <span class="font-semibold text-neutral-900 dark:text-white">{{ pagination.total }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm text-neutral-600 dark:text-neutral-400">Non lues</span>
                <span class="font-semibold text-primary-600 dark:text-primary-400">{{ unreadCount }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm text-neutral-600 dark:text-neutral-400">Aujourd'hui</span>
                <span class="font-semibold text-neutral-900 dark:text-white">{{ todayCount }}</span>
              </div>
            </div>
          </Card>

          <!-- Liens rapides -->
          <Card class="border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-800">
            <h3 class="flex items-center gap-2 text-sm font-semibold text-neutral-700 dark:text-neutral-300">
              <Zap class="h-4 w-4" />
              Actions rapides
            </h3>
            <div class="mt-4 space-y-2">
              <RouterLink
                to="/merchant/reservations"
                class="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-neutral-700 transition-colors hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-700"
              >
                <Receipt class="h-4 w-4 text-primary-500" />
                Gérer les réservations
              </RouterLink>
              <RouterLink
                to="/merchant/reviews"
                class="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-neutral-700 transition-colors hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-700"
              >
                <Star class="h-4 w-4 text-amber-500" />
                Voir les avis clients
              </RouterLink>
              <RouterLink
                to="/merchant/products"
                class="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-neutral-700 transition-colors hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-700"
              >
                <Package class="h-4 w-4 text-emerald-500" />
                Gérer les produits
              </RouterLink>
              <RouterLink
                to="/merchant/messaging"
                class="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-neutral-700 transition-colors hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-700"
              >
                <MessageSquare class="h-4 w-4 text-blue-500" />
                Messagerie clients
              </RouterLink>
            </div>
          </Card>

          <!-- Préférences -->
          <Card class="border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-800">
            <h3 class="flex items-center gap-2 text-sm font-semibold text-neutral-700 dark:text-neutral-300">
              <Settings class="h-4 w-4" />
              Préférences
            </h3>
            <p class="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
              Configurez vos préférences de notification depuis les paramètres du compte.
            </p>
            <Button
              variant="outline"
              size="sm"
              class="mt-3 w-full"
              @click="$router.push('/merchant/profile')"
            >
              Configurer
            </Button>
          </Card>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import {
  Button,
  Card,
  Badge,
  Loading,
  EmptyState,
  Pagination
} from '@/components/ui/2025'
import { useNotificationStore } from '@/stores/notification'
import { notify } from '@/composables/useNotifications'
import {
  Bell,
  RefreshCw,
  CheckCheck,
  Clock,
  Receipt,
  Star,
  Package,
  CreditCard,
  AlertTriangle,
  MessageSquare,
  BarChart3,
  Zap,
  Settings
} from 'lucide-vue-next'

const router = useRouter()
const notificationStore = useNotificationStore()

const loading = ref(false)
const markingRead = ref<number | null>(null)
const activeFilter = ref<string>('all')

const notifications = computed(() => notificationStore.serverNotifications)
const pagination = computed(() => notificationStore.pagination)
const unreadCount = computed(() => notificationStore.unreadCount)

const todayCount = computed(() => {
  const today = new Date().toDateString()
  return notifications.value.filter(n => {
    if (!n.created_at) return false
    const date = new Date(n.created_at)
    return date.toDateString() === today
  }).length
})

const filteredNotifications = computed(() => {
  if (activeFilter.value === 'all') {
    return notifications.value
  }
  if (activeFilter.value === 'unread') {
    return notifications.value.filter(n => !n.is_read)
  }
  return notifications.value.filter(n => n.type === activeFilter.value)
})

const typeFilters = computed(() => {
  const countByType = (type: string) =>
    notifications.value.filter(n => n.type === type).length

  return [
    { key: 'all', label: 'Toutes', icon: Bell, count: notifications.value.length },
    { key: 'unread', label: 'Non lues', icon: Bell, count: unreadCount.value },
    { key: 'reservation', label: 'Réservations', icon: Receipt, count: countByType('reservation') },
    { key: 'review', label: 'Avis', icon: Star, count: countByType('review') },
    { key: 'product', label: 'Produits', icon: Package, count: countByType('product') },
    { key: 'payment', label: 'Paiements', icon: CreditCard, count: countByType('payment') }
  ]
})

const getFilterLabel = (key: string) => {
  return typeFilters.value.find(f => f.key === key)?.label ?? key
}

const getTypeIcon = (type: string | null) => {
  switch (type) {
    case 'reservation': return Receipt
    case 'review': return Star
    case 'product': return Package
    case 'payment': return CreditCard
    case 'alert': return AlertTriangle
    default: return Bell
  }
}

const getTypeColor = (type: string | null) => {
  switch (type) {
    case 'reservation':
      return 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400'
    case 'review':
      return 'bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400'
    case 'product':
      return 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400'
    case 'payment':
      return 'bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-400'
    case 'alert':
      return 'bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400'
    default:
      return 'bg-neutral-100 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-400'
  }
}

const formatRelativeTime = (value?: string | null) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMinutes < 1) return 'À l\'instant'
  if (diffMinutes < 60) return `Il y a ${diffMinutes} min`
  if (diffHours < 24) return `Il y a ${diffHours}h`
  if (diffDays === 1) return 'Hier'
  if (diffDays < 7) return `Il y a ${diffDays} jours`
  return date.toLocaleDateString('fr-FR')
}

const setFilter = (key: string) => {
  activeFilter.value = key
}

const loadNotifications = async (page = 1) => {
  loading.value = true
  try {
    await notificationStore.loadNotifications({ page })
  } catch (error: any) {
    notify.error(error?.message || 'Impossible de charger les notifications.', 'Notifications')
  } finally {
    loading.value = false
  }
}

const loadPage = async (page: number) => {
  await loadNotifications(page)
}

const refreshNotifications = async () => {
  await loadNotifications(pagination.value.currentPage)
  notify.info('Notifications actualisées.', 'Notifications')
}

const handleMarkAsRead = async (notificationId: number) => {
  markingRead.value = notificationId
  try {
    await notificationStore.markAsRead(notificationId)
  } catch (error: any) {
    notify.error(error?.message || 'Erreur lors de la mise à jour.', 'Notifications')
  } finally {
    markingRead.value = null
  }
}

const handleMarkAllAsRead = async () => {
  if (!unreadCount.value) return
  try {
    await notificationStore.markAllAsRead()
    notify.success('Toutes les notifications ont été marquées comme lues.', 'Notifications')
  } catch (error: any) {
    notify.error(error?.message || 'Erreur lors de la mise à jour.', 'Notifications')
  }
}

const goToReservation = (reservationId: number) => {
  router.push(`/merchant/reservations?highlight=${reservationId}`)
}

const goToReviews = () => {
  router.push('/merchant/reviews')
}

const goToProduct = (productId: number) => {
  router.push(`/merchant/products/${productId}/edit`)
}

onMounted(async () => {
  await loadNotifications()
})
</script>
