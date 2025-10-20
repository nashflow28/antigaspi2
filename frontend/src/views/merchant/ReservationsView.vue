<template>
  <DashboardLayout
    :sidebar="sidebar"
    :header="header"
    class="bg-gradient-to-br from-green-50 to-blue-50"
  >
    <div class="p-6">
      <!-- Header -->
      <div class="mt-4 sm:mb-3xl">
        <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 sm:gapadding-xl">
          <div>
            <h1 class="text-xl lg:text-3xl font-semibold text-gray-900 mt-2">
              Réservations
            </h1>
            <p class="text-gray-700 text-lg">
              Gérez les réservations de vos clients
            </p>
          </div>

          <div class="flex flex-col gap-3 sm:flex-row">
            <Input
              v-model="searchQuery"
              :left-icon="MagnifyingGlassIcon"
              placeholder="Rechercher par code ou nom..."
              class="w-full sm:w-80"
              variant="outline"
            />

            <select
              v-model="selectedDateRange"
              class="w-full rounded border border-gray-300 bg-white px-3 py-3.5 text-sm text-gray-800 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="today">Aujourd'hui</option>
              <option value="week">Cette semaine</option>
              <option value="month">Ce mois</option>
              <option value="all">Toutes les dates</option>
            </select>

            <Button
              variant="outline"
              class="flex items-center gap-2"
              :disabled="filteredReservations.length === 0"
              @click="exportReservations"
            >
              <ArrowDownTrayIcon class="h-4 w-4" />
              Exporter
            </Button>
          </div>
        </div>

        <!-- Quick stats -->
        <div class="grid grid-cols-1 gap-3 md:grid-cols-4 mt-6">
          <Card
            v-for="stat in stats"
            :key="stat.label"
            no-padding
            rounded="xl"
            class="p-6 text-white shadow-lg"
            :class="stat.background"
          >
            <div class="flex items-center justify-between">
              <div>
                <p :class="stat.subtitleClass">{{ stat.label }}</p>
                <p class="text-xl font-semibold">{{ stat.value }}</p>
              </div>
              <div class="rounded bg-white/20 p-3">
                <component :is="stat.icon" class="h-8 w-8" />
              </div>
            </div>
          </Card>
        </div>
      </div>

      <!-- Filters -->
      <Card class="mt-4">
        <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div class="flex flex-wrap gap-2">
            <Button
              v-for="filter in filters"
              :key="filter.key"
              size="sm"
              rounded
              :variant="activeFilter === filter.key ? 'primary' : 'secondary'"
              class="font-medium"
              @click="activeFilter = filter.key"
            >
              <span class="flex items-center gap-2">
                {{ filter.label }}
                <Badge
                  v-if="filter.count !== null"
                  size="xs"
                  variant="outline"
                  class="bg-white/40 text-gray-700"
                >
                  {{ filter.count }}
                </Badge>
              </span>
            </Button>
          </div>

          <div class="flex items-center gap-3">
            <select
              v-model="sortBy"
              class="w-full rounded border border-gray-300 bg-white px-3 py-3.5 text-sm text-gray-800 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="created_at">Plus récent</option>
              <option value="pickup_date">Date de récupération</option>
              <option value="expires_at">Date d'expiration</option>
              <option value="total_amount">Montant</option>
            </select>
          </div>
        </div>
      </Card>

      <!-- Reservations List -->
      <div v-if="filteredReservations.length > 0" class="space-y-4">
        <Card
          v-for="reservation in filteredReservations"
          :key="reservation.id"
          class="transition-shadow hover:shadow-lg"
        >
          <div class="flex flex-col lg:flex-row gap-3 sm:gapadding-xl">
            <!-- Product Image -->
            <div class="flex-shrink-0">
              <img
                :src="reservation.product.image_url || '/images/placeholder.jpg'"
                :alt="reservation.product.name"
                class="w-6xl h-6xl lg:w-7xl lg:h-7xl object-cover rounded"
              >
            </div>

            <!-- Reservation Details -->
            <div class="flex-grow">
              <div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
                <div class="flex-grow">
                  <!-- Header with status -->
                  <div class="flex items-start justify-between mt-2">
                    <div>
                      <h3 class="font-semibold text-lg text-gray-900 mb-1">
                        {{ reservation.product.name }}
                      </h3>
                      <p class="text-sm text-gray-700">
                        Code: <span class="font-mono font-medium">{{ reservation.reservation_code }}</span>
                      </p>
                    </div>

                    <div class="flex items-center gap-2">
                      <Badge
                        :variant="getStatusBadgeVariant(reservation.status)"
                        size="sm"
                        rounded
                      >
                        {{ getStatusLabel(reservation.status) }}
                      </Badge>

                      <Badge
                        v-if="isUrgent(reservation)"
                        variant="error"
                        size="xs"
                        rounded
                        pulse
                      >
                        Urgent
                      </Badge>
                    </div>
                  </div>

                  <!-- Customer Info -->
                  <div class="mb-4">
                    <div class="flex items-center gap-2 text-gray-700 text-sm">
                      <UserIcon class="h-4 w-4" />
                      <span class="font-medium">{{ reservation.consumer.name }}</span>
                      <span>•</span>
                      <span>{{ reservation.consumer.phone }}</span>
                    </div>
                  </div>

                  <!-- Reservation Details Grid -->
                  <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                    <div>
                      <p class="text-gray-500">Quantité</p>
                      <p class="font-medium">{{ reservation.quantity }}</p>
                    </div>
                    <div>
                      <p class="text-gray-500">Montant</p>
                      <p class="font-medium">{{ formatPrice(reservation.total_amount) }}</p>
                    </div>
                    <div>
                      <p class="text-gray-500">Récupération</p>
                      <p class="font-medium">{{ formatDateTime(reservation.pickup_date) }}</p>
                    </div>
                    <div>
                      <p class="text-gray-500">Expire</p>
                      <p :class="isExpired(reservation) ? 'text-red-600 font-medium' : 'font-medium'">
                        {{ formatDateTime(reservation.expires_at) }}
                      </p>
                    </div>
                  </div>

                  <!-- Notes -->
                  <div v-if="reservation.notes" class="mt-3">
                    <p class="text-gray-500 text-sm">Notes:</p>
                    <p class="text-gray-800 text-sm">{{ reservation.notes }}</p>
                  </div>
                </div>

                <!-- Actions -->
                <div class="flex items-center gap-2 min-w-[200px]">
                  <!-- Primary action based on status -->
                  <template v-if="reservation.status === 'pending'">
                    <Button
                      size="sm"
                      variant="secondary"
                      class="flex-1 gap-2 border-emerald-500 bg-emerald-500 text-white hover:border-emerald-600 hover:bg-emerald-600"
                      @click="updateReservationStatus(reservation, 'confirmed')"
                    >
                      <CheckIcon class="h-4 w-4" />
                      Confirmer
                    </Button>
                  </template>

                  <template v-else-if="reservation.status === 'confirmed'">
                    <Button
                      size="sm"
                      variant="secondary"
                      class="flex-1 gap-2 border-blue-500 bg-blue-500 text-white hover:border-blue-500/90 hover:bg-blue-500/90"
                      @click="markAsReady(reservation)"
                    >
                      <BellIcon class="h-4 w-4" />
                      Marquer prêt
                    </Button>
                  </template>

                  <template v-else-if="reservation.status === 'ready'">
                    <Button
                      size="sm"
                      variant="secondary"
                      class="flex-1 gap-2 border-emerald-500 bg-emerald-500 text-white hover:border-emerald-600 hover:bg-emerald-600"
                      @click="updateReservationStatus(reservation, 'completed')"
                    >
                      <CheckCircleIcon class="h-4 w-4" />
                      Marquer récupérée
                    </Button>
                  </template>

                  <template v-else>
                    <Button
                      size="sm"
                      variant="outline"
                      class="flex-1 gap-2"
                      @click="contactCustomer(reservation)"
                    >
                      <PhoneIcon class="h-4 w-4" />
                      Contacter
                    </Button>
                  </template>

                  <!-- Three dots menu -->
                  <div class="relative">
                    <Button
                      size="sm"
                      variant="ghost"
                      class="p-2"
                      :class="{ 'bg-gray-100': openDropdown === reservation.id }"
                      @click="toggleDropdown(reservation.id)"
                    >
                      <EllipsisVerticalIcon class="h-4 w-4" />
                    </Button>

                    <!-- Dropdown menu -->
                    <div
                      v-if="openDropdown === reservation.id"
                      class="relative sm:absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded shadow-lg py-3 z-10 min-w-[160px]"
                    >
                      <button
                        class="w-full px-3 py-3 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                        @click="viewReservationDetails(reservation); closeDropdown()"
                      >
                        <EyeIcon class="h-4 w-4" />
                        Voir détails
                      </button>

                      <button
                        class="w-full px-3 py-3 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                        @click="contactCustomer(reservation); closeDropdown()"
                      >
                        <PhoneIcon class="h-4 w-4" />
                        Contacter client
                      </button>

                      <template v-if="reservation.status === 'pending'">
                        <hr class="my-xs border-gray-200">
                        <button
                          class="w-full px-3 py-3 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
                          @click="updateReservationStatus(reservation, 'cancelled'); closeDropdown()"
                        >
                          <XMarkIcon class="h-4 w-4" />
                          Annuler
                        </button>
                      </template>

                      <template v-if="reservation.status === 'confirmed'">
                        <hr class="my-xs border-gray-200">
                        <button
                          class="w-full px-3 py-3 text-left text-sm hover:bg-green-50 text-green-600 flex items-center gap-2"
                          @click="updateReservationStatus(reservation, 'completed'); closeDropdown()"
                        >
                          <CheckCircleIcon class="h-4 w-4" />
                          Marquer récupérée
                        </button>
                      </template>

                      <hr class="my-xs border-gray-200">
                      <button
                        class="w-full px-3 py-3 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                        @click="exportSingleReservation(reservation); closeDropdown()"
                      >
                        <ArrowDownTrayIcon class="h-4 w-4" />
                        Exporter
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <!-- Empty State -->
      <div v-else class="text-left sm:text-center py-8 sm:py-12 lg:py-16">
        <BookmarkIcon class="w-12 h-10 text-gray-500 mx-auto mt-3" />
        <h3 class="text-xl font-semibold text-gray-900 mt-2">Aucune réservation trouvée</h3>
        <p class="text-gray-700">
          {{ searchQuery ? 'Aucune réservation ne correspond à votre recherche.' : 'Les nouvelles réservations apparaîtront ici.' }}
        </p>
      </div>

      <!-- Reservation Details Modal -->
      <div
        v-if="showDetailsModal"
        class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[120]"
        @click.self="showDetailsModal = false"
      >
        <Card class="w-full max-h-[90vh] max-w-full sm:max-w-80 overflow-y-auto" rounded="xl">
          <div class="mt-4 flex items-center justify-between">
            <h2 class="text-xl font-semibold text-gray-900">
              Détails de la réservation
            </h2>
            <Button
              variant="ghost"
              size="sm"
              class="text-gray-400 hover:text-gray-700"
              @click="showDetailsModal = false"
            >
              <XMarkIcon class="h-4 w-4" />
            </Button>
          </div>

          <div v-if="selectedReservation" class="space-y-6">
            <!-- Reservation Info -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gapadding-xl">
              <div>
                <p class="text-xs font-semibold uppercase tracking-wide text-gray-500">Code de réservation</p>
                <p class="font-mono text-lg">{{ selectedReservation.reservation_code }}</p>
              </div>
              <div>
                <p class="text-xs font-semibold uppercase tracking-wide text-gray-500">Statut</p>
                <Badge
                  :variant="getStatusBadgeVariant(selectedReservation.status)"
                  size="sm"
                  rounded
                >
                  {{ getStatusLabel(selectedReservation.status) }}
                </Badge>
              </div>
            </div>

            <!-- Customer Details -->
            <div>
              <h3 class="text-lg font-semibold mt-3">Informations client</h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <p class="text-xs font-semibold uppercase tracking-wide text-gray-500">Nom</p>
                  <p>{{ selectedReservation.consumer.name }}</p>
                </div>
                <div>
                  <p class="text-xs font-semibold uppercase tracking-wide text-gray-500">Téléphone</p>
                  <p>{{ selectedReservation.consumer.phone }}</p>
                </div>
              </div>
            </div>

            <!-- Product Details -->
            <div>
              <h3 class="text-lg font-semibold mt-3">Détails du produit</h3>
              <div class="flex gap-3">
                <img
                  :src="selectedReservation.product.image_url || '/images/placeholder.jpg'"
                  :alt="selectedReservation.product.name"
                  class="w-20 h-12 object-cover rounded"
                >
                <div class="flex-grow">
                  <h4 class="font-semibold">{{ selectedReservation.product.name }}</h4>
                  <p class="text-gray-700 text-sm">{{ selectedReservation.product.description }}</p>
                  <div class="mt-2 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span class="text-gray-500">Prix unitaire:</span>
                      <span class="ml-1 font-medium">{{ formatPrice(selectedReservation.discounted_price) }}</span>
                    </div>
                    <div>
                      <span class="text-gray-500">Quantité:</span>
                      <span class="ml-1 font-medium">{{ selectedReservation.quantity }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Timeline -->
            <div>
              <h3 class="text-lg font-semibold mt-3">Chronologie</h3>
              <div class="space-y-2">
                <div class="flex items-center gap-3">
                  <div class="w-xs h-3 bg-blue-500 rounded-full" />
                  <div>
                    <p class="text-sm font-medium">Réservation créée</p>
                    <p class="text-xs text-gray-500">{{ formatDateTime(selectedReservation.created_at) }}</p>
                  </div>
                </div>

                <div v-if="selectedReservation.confirmed_at" class="flex items-center gap-3">
                  <div class="w-xs h-3 bg-blue-500 rounded-full" />
                  <div>
                    <p class="text-sm font-medium">Confirmée</p>
                    <p class="text-xs text-gray-500">{{ formatDateTime(selectedReservation.confirmed_at) }}</p>
                  </div>
                </div>

                <div v-if="selectedReservation.status === 'completed'" class="flex items-center gap-3">
                  <div class="w-xs h-3 bg-blue-500 rounded-full" />
                  <div>
                    <p class="text-sm font-medium">Récupérée</p>
                    <p class="text-xs text-gray-500">{{ formatDateTime(selectedReservation.pickup_date) }}</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Notes -->
            <div v-if="selectedReservation.notes">
              <h3 class="text-lg font-semibold mt-3">Notes</h3>
              <p class="text-gray-800">{{ selectedReservation.notes }}</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  </DashboardLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { formatPrice } from '@/utils/currency'
import {
  MagnifyingGlassIcon,
  BookmarkIcon,
  ClockIcon,
  CheckCircleIcon,
  ShoppingBagIcon,
  UserIcon,
  CheckIcon,
  XMarkIcon,
  BellIcon,
  PhoneIcon,
  EyeIcon,
  EllipsisVerticalIcon,
  ArrowDownTrayIcon
} from '@heroicons/vue/24/outline'
import DashboardLayout from '@/components/ui/DashboardLayout.vue'
import { useDashboardLayout } from '@/composables/useDashboardLayout'
import Card from '@/components/ui/2025/Card.vue'
import Button from '@/components/ui/2025/Button.vue'
import Badge from '@/components/ui/2025/Badge.vue'
import Input from '@/components/ui/2025/Input.vue'
import { apiService } from '@/services/api'
import { notify } from '@/composables/useNotifications'

// Reactive data
const reservations = ref<any[]>([])
const searchQuery = ref('')
const selectedDateRange = ref('all')
const activeFilter = ref('all')
const sortBy = ref('created_at')
const showDetailsModal = ref(false)
const selectedReservation = ref<any>(null)
const loading = ref(false)
const openDropdown = ref<number | null>(null)
const { sidebar, header } = useDashboardLayout('merchant')

// Filters
const filters = computed(() => [
  { key: 'all', label: 'Toutes', count: reservations.value.length },
  { key: 'pending', label: 'En attente', count: pendingReservations.value.length },
  { key: 'confirmed', label: 'Confirmées', count: confirmedReservations.value.length },
  { key: 'ready', label: 'Prêtes', count: readyReservations.value.length },
  { key: 'completed', label: 'Récupérées', count: completedReservations.value.length },
  { key: 'expired', label: 'Expirées', count: expiredReservations.value.length }
])

const stats = computed(() => [
  {
    label: 'Total Réservations',
    value: reservations.value.length,
    background: 'bg-gradient-to-r from-blue-500 to-blue-600',
    subtitleClass: 'text-blue-100 text-sm font-medium',
    icon: BookmarkIcon
  },
  {
    label: 'En Attente',
    value: pendingReservations.value.length,
    background: 'bg-gradient-to-r from-orange-500 to-orange-500/90',
    subtitleClass: 'text-orange-500/70 text-sm font-medium',
    icon: ClockIcon
  },
  {
    label: 'Confirmées',
    value: confirmedReservations.value.length,
    background: 'bg-gradient-to-r from-blue-500 to-blue-600',
    subtitleClass: 'text-blue-100 text-sm font-medium',
    icon: CheckCircleIcon
  },
  {
    label: 'Récupérées',
    value: completedReservations.value.length,
    background: 'bg-gradient-to-r from-blue-500 to-blue-600',
    subtitleClass: 'text-secondary-100 text-sm font-medium',
    icon: ShoppingBagIcon
  }
])

// Computed properties
const pendingReservations = computed(() =>
  reservations.value.filter(r => r.status === 'pending')
)

const confirmedReservations = computed(() =>
  reservations.value.filter(r => r.status === 'confirmed')
)

const readyReservations = computed(() =>
  reservations.value.filter(r => r.status === 'ready')
)

const completedReservations = computed(() =>
  reservations.value.filter(r => r.status === 'completed')
)

const expiredReservations = computed(() =>
  reservations.value.filter(r => isExpired(r))
)

const filteredReservations = computed(() => {
  let filtered = reservations.value

  // Apply search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(r =>
      r.reservation_code.toLowerCase().includes(query) ||
      r.consumer.name.toLowerCase().includes(query) ||
      r.product.name.toLowerCase().includes(query)
    )
  }

  // Apply status filter
  if (activeFilter.value !== 'all') {
    if (activeFilter.value === 'expired') {
      filtered = filtered.filter(r => isExpired(r))
    } else {
      filtered = filtered.filter(r => r.status === activeFilter.value)
    }
  }

  // Apply date range filter
  if (selectedDateRange.value !== 'all') {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    filtered = filtered.filter(r => {
      const reservationDate = new Date(r.created_at)

      switch (selectedDateRange.value) {
        case 'today':
          return reservationDate >= today
        case 'week': {
          const weekAgo = new Date(today)
          weekAgo.setDate(weekAgo.getDate() - 7)
          return reservationDate >= weekAgo
        }
        case 'month': {
          const monthAgo = new Date(today)
          monthAgo.setMonth(monthAgo.getMonth() - 1)
          return reservationDate >= monthAgo
        }
        default:
          return true
      }
    })
  }

  // Apply sorting
  filtered.sort((a, b) => {
    switch (sortBy.value) {
      case 'pickup_date':
        return new Date(a.pickup_date).getTime() - new Date(b.pickup_date).getTime()
      case 'expires_at':
        return new Date(a.expires_at).getTime() - new Date(b.expires_at).getTime()
      case 'total_amount':
        return b.total_amount - a.total_amount
      default:
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    }
  })

  return filtered
})

// Methods (formatPrice is now imported from @/utils/currency)

const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getStatusBadgeVariant = (status: string) => {
  const variants = {
    pending: 'warning',
    confirmed: 'primary',
    ready: 'info',
    completed: 'success',
    cancelled: 'error',
    expired: 'secondary'
  } as const

  return variants[status as keyof typeof variants] ?? 'secondary'
}

const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    pending: 'En attente',
    confirmed: 'Confirmée',
    ready: 'Prête',
    completed: 'Récupérée',
    cancelled: 'Annulée',
    expired: 'Expirée'
  }
  return labels[status] || status
}

const isExpired = (reservation: any): boolean => {
  return new Date(reservation.expires_at) < new Date()
}

const isUrgent = (reservation: any): boolean => {
  if (reservation.status === 'completed' || reservation.status === 'cancelled') {
    return false
  }

  const now = new Date()
  const expiresAt = new Date(reservation.expires_at)
  const hoursLeft = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60)

  return hoursLeft <= 2 && hoursLeft >= 0
}

const updateReservationStatus = async (reservation: any, newStatus: string) => {
  try {
    let response
    switch (newStatus) {
      case 'confirmed':
        response = await apiService.confirmReservation(reservation.id)
        break
      case 'completed':
        response = await apiService.completeReservation(reservation.id)
        break
      case 'cancelled':
        response = await apiService.cancelReservation(reservation.id)
        break
      default:
        return
    }

    if (!response.success) {
      notify.error(response.message || 'Impossible de mettre à jour la réservation.')
      return
    }

    const successMessage =
      newStatus === 'confirmed'
        ? 'Réservation confirmée avec succès.'
        : newStatus === 'completed'
          ? 'Réservation marquée comme récupérée.'
          : 'Réservation annulée.'

    notify.success(successMessage)

    await loadReservations()
  } catch (error) {
    notify.error('Une erreur est survenue lors de la mise à jour de la réservation.')
  }
}

const markAsReady = async (reservation: any) => {
  try {
    const response = await apiService.markReservationReady(reservation.id)

    if (!response.success) {
      notify.error(response.message || 'Impossible de marquer la réservation comme prête.')
      return
    }

    notify.success('Réservation marquée comme prête.')

    await loadReservations()
  } catch (error) {
    notify.error('Une erreur est survenue lors de la préparation de la réservation.')
  }
}

const contactCustomer = (reservation: any) => {
  const phone = reservation.consumer.phone
  const message = `Bonjour ${reservation.consumer.name}, votre réservation ${reservation.reservation_code} est prête à être récupérée.`
  const whatsappUrl = `https://wa.me/${phone.replace(/\s/g, '')}?text=${encodeURIComponent(message)}`
  window.open(whatsappUrl, '_blank')
}

const viewReservationDetails = (reservation: any) => {
  selectedReservation.value = reservation
  showDetailsModal.value = true
}

// Dropdown menu functions
const toggleDropdown = (reservationId: number) => {
  openDropdown.value = openDropdown.value === reservationId ? null : reservationId
}

const closeDropdown = () => {
  openDropdown.value = null
}

// Export functions
const exportReservations = () => {
  const dataToExport = filteredReservations.value.map(reservation => ({
    code: reservation.reservation_code,
    client: reservation.consumer.name,
    telephone: reservation.consumer.phone,
    produit: reservation.product.name,
    quantite: reservation.quantity_reserved,
    montant: reservation.total_amount,
    statut: getStatusLabel(reservation.status),
    date_reservation: formatDateTime(reservation.created_at),
    date_retrait: reservation.pickup_date ? formatDateTime(reservation.pickup_date) : 'N/A',
    notes: reservation.notes || 'Aucune'
  }))

  const csvContent = [
    // Header
    ['Code', 'Client', 'Téléphone', 'Produit', 'Quantité', 'Montant', 'Statut', 'Date réservation', 'Date retrait', 'Notes'].join(','),
    // Data rows
    ...dataToExport.map(row => Object.values(row).map(value => `"${value}"`).join(','))
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `reservations_${new Date().toISOString().split('T')[0]}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

const exportSingleReservation = (reservation: any) => {
  const dataToExport = [{
    code: reservation.reservation_code,
    client: reservation.consumer.name,
    telephone: reservation.consumer.phone,
    produit: reservation.product.name,
    quantite: reservation.quantity_reserved,
    montant: reservation.total_amount,
    statut: getStatusLabel(reservation.status),
    date_reservation: formatDateTime(reservation.created_at),
    date_retrait: reservation.pickup_date ? formatDateTime(reservation.pickup_date) : 'N/A',
    notes: reservation.notes || 'Aucune'
  }]

  const csvContent = [
    // Header
    ['Code', 'Client', 'Téléphone', 'Produit', 'Quantité', 'Montant', 'Statut', 'Date réservation', 'Date retrait', 'Notes'].join(','),
    // Data row
    Object.values(dataToExport[0]).map(value => `"${value}"`).join(',')
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `reservation_${reservation.reservation_code}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

const loadReservations = async () => {
  try {
    loading.value = true
    const response = await apiService.getMerchantReservations()

    if (!response.success) {
      notify.error(response.message || 'Impossible de récupérer les réservations.')
      reservations.value = []
      return
    }

    const data = Array.isArray(response.data) ? response.data : []

    reservations.value = data.map(res => ({
      ...res,
      reservation_code: (res as any)?.reservation_code,
      status: (res as any)?.status,
      quantity: Number((res as any)?.quantity ?? 1),
      total_amount: Number((res as any)?.total_amount ?? 0),
      discounted_price: Number((res as any)?.discounted_price ?? (res as any)?.product?.discounted_price ?? 0),
      notes: (res as any)?.pickup_notes ?? null,
      created_at: (res as any)?.created_at,
      confirmed_at: (res as any)?.confirmed_at ?? null,
      expires_at: (res as any)?.expires_at,
      pickup_date: (res as any)?.pickup_date,
      product: {
        id: (res as any)?.product?.id || 0,
        name: (res as any)?.product?.name || 'Produit inconnu',
        description: (res as any)?.product?.description || '',
        image_url: (res as any)?.product?.image_url || '/images/placeholder.jpg',
        ...((res as any)?.product || {})
      },
      consumer: {
        name:
          `${(res as any)?.consumer?.first_name || ''} ${(res as any)?.consumer?.last_name || ''}`.trim() ||
          (res as any)?.consumer?.name ||
          `${(res as any)?.user?.first_name || ''} ${(res as any)?.user?.last_name || ''}`.trim() ||
          'Client',
        phone: (res as any)?.consumer?.phone || (res as any)?.user?.phone || 'N/A'
      }
    }))
  } catch (error) {
    notify.error('Une erreur est survenue lors du chargement des réservations.')
    reservations.value = []
  } finally {
    loading.value = false
  }
}

// Lifecycle
// Close dropdown when clicking outside
const handleClickOutside = (event: Event) => {
  const target = event.target as Element
  if (!target.closest('.relative')) {
    closeDropdown()
  }
}

onMounted(() => {
  loadReservations()
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>
