<template>
  <div class="min-h-screen bg-neutral-50">
    <section class="bg-nav-gradient text-white">
      <div class="mx-auto max-w-6xl space-y-8 px-6 py-spacing-22">
        <div class="space-y-3">
          <p class="text-small uppercase tracking-wide text-white/80">Suivi des commandes</p>
          <h1 class="text-display-sm font-semibold leading-tight">Mes réservations</h1>
          <p class="max-w-2xl text-body text-white/80">Visualisez l'ensemble de vos réservations, suivez leur statut et mesurez votre impact positif.</p>
        </div>
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card
            v-for="item in statCards"
            :key="item.title"
            variant="glass"
            padding="lg"
            class="shadow-card"
          >
            <div class="space-y-2">
              <p class="text-caption uppercase tracking-wide text-white/80">{{ item.title }}</p>
              <p class="text-display-sm font-semibold">{{ item.value }}</p>
              <p class="text-small text-white/70">{{ item.subtitle }}</p>
            </div>
          </Card>
        </div>
      </div>
    </section>

    <main class="mx-auto max-w-6xl space-y-spacing-22 px-6 py-spacing-22">
      <div class="grid gap-spacing-22 lg:grid-cols-[320px,1fr]">
        <div class="space-y-6">
          <Card padding="lg" class="space-y-6">
            <template #header>
              <h2 class="text-h3 font-semibold text-neutral-900">Filtres</h2>
            </template>

            <div class="space-y-4">
              <label class="flex flex-col gap-2">
                <span class="text-small font-medium text-neutral-600">Statut</span>
                <select
                  v-model="filters.status"
                  class="w-full rounded-2xl border border-neutral-200 bg-surface-light px-4 py-3 text-body text-neutral-600 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200"
                >
                  <option value="">Tous les statuts</option>
                  <option value="pending">En attente</option>
                  <option value="confirmed">Confirmée</option>
                  <option value="ready">Prête</option>
                  <option value="completed">Récupérée</option>
                  <option value="cancelled">Annulée</option>
                  <option value="expired">Expirée</option>
                </select>
              </label>

              <label class="flex flex-col gap-2">
                <span class="text-small font-medium text-neutral-600">Période</span>
                <select
                  v-model="filters.period"
                  class="w-full rounded-2xl border border-neutral-200 bg-surface-light px-4 py-3 text-body text-neutral-600 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200"
                >
                  <option value="">Toutes</option>
                  <option value="today">Aujourd'hui</option>
                  <option value="week">Cette semaine</option>
                  <option value="month">Ce mois</option>
                  <option value="year">Cette année</option>
                </select>
              </label>
            </div>

            <div class="space-y-3 border-t border-neutral-200/70 pt-4">
              <p class="text-small font-semibold text-neutral-700">Actions rapides</p>
              <Button
                variant="ghost"
                size="sm"
                class="w-full justify-center text-neutral-600"
                :disabled="!hasFilters"
                @click="clearFilters"
              >
                Réinitialiser les filtres
              </Button>
              <Button
                variant="outline"
                size="sm"
                class="w-full justify-center"
                :left-icon="Download"
                @click="exportReservations"
              >
                Exporter la liste
              </Button>
              <Button
                variant="ghost"
                size="sm"
                class="w-full justify-center text-primary-600"
                :left-icon="CheckCheck"
                @click="markAllAsRead"
              >
                Tout marquer comme lu
              </Button>
            </div>
          </Card>

          <Card variant="highlight" padding="lg" class="space-y-4 text-neutral-900">
            <template #header>
              <div class="flex items-center gap-3">
                <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 text-white">
                  <Leaf class="h-7 w-7" />
                </div>
                <div>
                  <p class="text-small uppercase tracking-wide text-white/80">Impact du mois</p>
                  <h3 class="text-h3 font-semibold text-white">Votre contribution</h3>
                </div>
              </div>
            </template>

            <ul class="space-y-2 text-white/90">
              <li class="flex items-center justify-between text-body"><span>Nourriture sauvée</span><strong>{{ monthlyImpact.food }} kg</strong></li>
              <li class="flex items-center justify-between text-body"><span>CO₂ évité</span><strong>{{ monthlyImpact.co2 }} kg</strong></li>
              <li class="flex items-center justify-between text-body"><span>Économies réalisées</span><strong>{{ formatPrice(monthlyImpact.savings) }}</strong></li>
            </ul>
          </Card>
        </div>

        <div class="space-y-6">
          <Card padding="lg" class="space-y-6 shadow-card">
            <template #header>
              <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div class="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    :class="viewMode === 'list' ? 'bg-primary-100 text-primary-700' : 'text-neutral-500'"
                    :aria-pressed="viewMode === 'list'"
                    aria-label="Vue liste"
                    :left-icon="List"
                    @click="viewMode = 'list'"
                  >
                    <span class="sr-only">Vue liste</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    :class="viewMode === 'grid' ? 'bg-primary-100 text-primary-700' : 'text-neutral-500'"
                    :aria-pressed="viewMode === 'grid'"
                    aria-label="Vue grille"
                    :left-icon="Grid3X3"
                    @click="viewMode = 'grid'"
                  >
                    <span class="sr-only">Vue grille</span>
                  </Button>
                  <p class="text-small text-neutral-500">
                    {{ filteredReservations.length }} réservation{{ filteredReservations.length > 1 ? 's' : '' }}
                  </p>
                </div>
                <select
                  v-model="sortBy"
                  class="w-full rounded-2xl border border-neutral-200 bg-surface-light px-4 py-3 text-body text-neutral-600 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200 sm:w-auto"
                >
                  <option value="created_at_desc">Plus récentes</option>
                  <option value="created_at_asc">Plus anciennes</option>
                  <option value="pickup_date_asc">Date de retrait</option>
                  <option value="status">Statut</option>
                </select>
              </div>
            </template>

            <div v-if="loading" class="grid grid-cols-1 gap-6 md:grid-cols-3 xl:grid-cols-4">
              <Card
                v-for="index in 6"
                :key="index"
                padding="sm"
                class="space-y-4"
              >
                <Skeleton class="h-24 w-full" />
                <Skeleton class="h-4 w-3/4" />
                <Skeleton class="h-3 w-1/2" />
              </Card>
            </div>

            <EmptyState
              v-else-if="filteredReservations.length === 0"
              title="Aucune réservation"
              description="Vous n'avez pas encore de réservation correspondant à ces filtres. Explorez les produits pour commencer."
              action-label="Voir les produits"
              icon="📅"
              @action="handleEmptyStateAction"
            />

            <div v-else>
              <div
                v-if="viewMode === 'grid'"
                data-test="reservations-grid"
                class="grid grid-cols-1 gap-6 md:grid-cols-3 xl:grid-cols-4"
              >
                <ReservationCard
                  v-for="reservation in filteredReservations"
                  :key="reservation.id"
                  :reservation="reservation"
                  view-mode="grid"
                  @cancel="cancelReservation"
                  @view="viewReservation"
                  @contact="contactMerchant"
                />
              </div>

              <div v-else class="space-y-4">
                <ReservationCard
                  v-for="reservation in filteredReservations"
                  :key="reservation.id"
                  :reservation="reservation"
                  view-mode="list"
                  @cancel="cancelReservation"
                  @view="viewReservation"
                  @contact="contactMerchant"
                />
              </div>
            </div>

            <div v-if="filteredReservations.length > 0 && totalPages > 1" class="border-t border-neutral-200/70 pt-6">
              <div class="flex items-center justify-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  :disabled="currentPage <= 1"
                  :left-icon="ChevronLeft"
                  @click="currentPage--"
                />
                <div class="flex items-center gap-2">
                  <Button
                    v-for="page in visiblePages"
                    :key="page"
                    variant="ghost"
                    size="sm"
                    :class="page === currentPage ? 'bg-primary-100 text-primary-700' : 'text-neutral-600'"
                    @click="currentPage = page"
                  >
                    {{ page }}
                  </Button>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  :disabled="currentPage >= totalPages"
                  :left-icon="ChevronRight"
                  @click="currentPage++"
                />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </main>

    <Toast
      :is-open="toast.open"
      :tone="toast.tone"
      :title="toast.title"
      :description="toast.description"
      :on-close="closeToast"
    />

    <ConfirmModal
      :is-open="showCancelModal"
      type="danger"
      title="Annuler la réservation"
      message="Êtes-vous sûr de vouloir annuler cette réservation ? Cette action est irréversible."
      confirm-text="Oui, annuler"
      cancel-text="Non, garder"
      @confirm="confirmCancelReservation"
      @cancel="closeCancelModal"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import Button from '@/components/ui/Button.vue'
import Card from '@/components/ui/Card.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import Skeleton from '@/components/ui/Skeleton.vue'
import Toast from '@/components/ui/Toast.vue'
import ConfirmModal from '@/components/ui/ConfirmModal.vue'
import ReservationCard from '@/components/reservation/ReservationCard.vue'
import { formatPrice } from '@/utils/currency'
import { notify } from '@/composables/useNotifications'
import { useReservationsStore } from '@/stores/reservations'
import type { Reservation } from '@/types'
import {
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  Download,
  Grid3X3,
  Leaf,
  List
} from 'lucide-vue-next'

const router = useRouter()
const reservationsStore = useReservationsStore()

const viewMode = ref<'list' | 'grid'>('list')
const currentPage = ref(1)
const itemsPerPage = 12
const sortBy = ref('created_at_desc')

const showCancelModal = ref(false)
const reservationToCancel = ref<number | null>(null)

const filters = reactive({
  status: '',
  period: ''
})

const toast = reactive({
  open: false,
  tone: 'success' as const,
  title: '',
  description: ''
})
let toastTimer: number | undefined

const reservations = reservationsStore.reservations
const loading = reservationsStore.loading

const stats = computed(() => ({
  total: reservations.value.length,
  active: reservations.value.filter(r => ['pending', 'confirmed', 'ready'].includes(r.status)).length,
  completed: reservations.value.filter(r => r.status === 'completed').length,
  saved: reservations.value.reduce((sum, r) => sum + (r.status === 'completed' ? r.quantity : 0), 0)
}))

const statCards = computed(() => [
  { title: 'Total', value: stats.value.total, subtitle: 'Réservations cumulées' },
  { title: 'En cours', value: stats.value.active, subtitle: 'À venir ou en préparation' },
  { title: 'Récupérées', value: stats.value.completed, subtitle: 'Commandes finalisées' },
  { title: 'Quantité sauvée', value: `${stats.value.saved} kg`, subtitle: 'Impact positif enregistré' }
])

const monthlyImpact = computed(() => {
  const thisMonth = reservations.value.filter(r => {
    const reservationDate = new Date(r.created_at)
    const now = new Date()
    return reservationDate.getMonth() === now.getMonth() &&
      reservationDate.getFullYear() === now.getFullYear() &&
      r.status === 'completed'
  })

  const food = thisMonth.reduce((sum, r) => sum + r.quantity, 0)
  const co2 = food * 2.5
  const savings = thisMonth.reduce((sum, r) => sum + (r.original_price - r.discounted_price) * r.quantity, 0)

  return { food, co2: Math.round(co2), savings }
})

const filteredReservations = computed(() => {
  let filtered = [...reservations.value]

  if (filters.status) {
    filtered = filtered.filter(r => r.status === filters.status)
  }

  if (filters.period) {
    const now = new Date()
    filtered = filtered.filter(r => {
      const date = new Date(r.created_at)
      switch (filters.period) {
        case 'today':
          return date.toDateString() === now.toDateString()
        case 'week':
          return date >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        case 'month':
          return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
        case 'year':
          return date.getFullYear() === now.getFullYear()
        default:
          return true
      }
    })
  }

  filtered.sort((a, b) => {
    switch (sortBy.value) {
      case 'created_at_desc':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      case 'created_at_asc':
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      case 'pickup_date_asc':
        return new Date(a.pickup_date).getTime() - new Date(b.pickup_date).getTime()
      case 'status':
        return a.status.localeCompare(b.status)
      default:
        return 0
    }
  })

  const start = (currentPage.value - 1) * itemsPerPage
  return filtered.slice(start, start + itemsPerPage)
})

const totalPages = computed(() => Math.ceil(reservations.value.length / itemsPerPage))

const visiblePages = computed(() => {
  const pages: number[] = []
  const start = Math.max(1, currentPage.value - 2)
  const end = Math.min(totalPages.value, start + 4)

  for (let page = start; page <= end; page++) {
    pages.push(page)
  }

  return pages
})

const hasFilters = computed(() => filters.status || filters.period)

const openToast = (tone: 'success' | 'info' | 'warning', title: string, description: string) => {
  toast.open = true
  toast.tone = tone
  toast.title = title
  toast.description = description
  if (toastTimer) {
    window.clearTimeout(toastTimer)
  }
  toastTimer = window.setTimeout(() => {
    toast.open = false
  }, 2600)
}

const closeToast = () => {
  toast.open = false
  if (toastTimer) {
    window.clearTimeout(toastTimer)
    toastTimer = undefined
  }
}

const loadReservations = async () => {
  const result = await reservationsStore.fetchReservations()
  if (!result.success) {
    notify.error(result.error || 'Impossible de charger vos réservations pour le moment.')
  }
}

const cancelReservation = (reservationId: number) => {
  reservationToCancel.value = reservationId
  showCancelModal.value = true
}

const confirmCancelReservation = async () => {
  if (!reservationToCancel.value) return

  try {
    const response = await reservationsStore.cancelReservation(reservationToCancel.value)

    if (response.success) {
      openToast('success', 'Réservation annulée', 'La réservation a été annulée avec succès.')
    } else {
      notify.error(response.error || 'Erreur lors de l\'annulation de la réservation.')
    }
  } catch (error: any) {
    const message = error?.message || 'Erreur lors de l\'annulation de la réservation.'
    notify.error(message)
  }

  showCancelModal.value = false
  reservationToCancel.value = null
}

const closeCancelModal = () => {
  showCancelModal.value = false
  reservationToCancel.value = null
}

const viewReservation = (reservationId: number) => {
  router.push(`/reservations/${reservationId}`)
}

const contactMerchant = (reservation: Reservation) => {
  const phone = reservation.product.merchant.phone
  if (phone) {
    window.open(`tel:${phone}`)
  }
}

const clearFilters = () => {
  filters.status = ''
  filters.period = ''
  currentPage.value = 1
  openToast('info', 'Filtres réinitialisés', 'Tous les filtres ont été effacés.')
}

const exportReservations = () => {
  openToast('success', 'Export en cours', 'Un export de vos réservations est en préparation.')
}

const markAllAsRead = () => {
  openToast('info', 'Notifications à jour', 'Toutes vos réservations ont été marquées comme consultées.')
}

const handleEmptyStateAction = () => {
  if (hasFilters.value) {
    clearFilters()
  } else {
    router.push('/products')
  }
}

onMounted(() => {
  loadReservations()
})
</script>
