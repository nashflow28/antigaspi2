<template>
  <div class="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-6">
    <!-- Header -->
    <div class="mb-8">
      <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div>
          <h1 class="text-3xl lg:text-4xl font-display font-bold text-neutral-900 mb-2">
            Réservations
          </h1>
          <p class="text-neutral-600 text-lg">
            Gérez les réservations de vos clients
          </p>
        </div>

        <div class="flex flex-col sm:flex-row gap-4">
          <div class="relative">
            <MagnifyingGlassIcon class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Rechercher par code ou nom..."
              class="input pl-10 w-full sm:w-80"
            />
          </div>

          <select v-model="selectedDateRange" class="input">
            <option value="today">Aujourd'hui</option>
            <option value="week">Cette semaine</option>
            <option value="month">Ce mois</option>
            <option value="all">Toutes les dates</option>
          </select>
        </div>
      </div>

      <!-- Quick stats -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
        <div class="card bg-gradient-to-r from-primary-500 to-primary-600 text-white">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-primary-100 text-sm font-medium">Total Réservations</p>
              <p class="text-3xl font-bold">{{ reservations.length }}</p>
            </div>
            <div class="p-3 bg-white/20 rounded-xl">
              <BookmarkIcon class="w-6 h-6" />
            </div>
          </div>
        </div>

        <div class="card bg-gradient-to-r from-warning-500 to-warning-600 text-white">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-warning-100 text-sm font-medium">En Attente</p>
              <p class="text-3xl font-bold">{{ pendingReservations.length }}</p>
            </div>
            <div class="p-3 bg-white/20 rounded-xl">
              <ClockIcon class="w-6 h-6" />
            </div>
          </div>
        </div>

        <div class="card bg-gradient-to-r from-success-500 to-success-600 text-white">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-success-100 text-sm font-medium">Confirmées</p>
              <p class="text-3xl font-bold">{{ confirmedReservations.length }}</p>
            </div>
            <div class="p-3 bg-white/20 rounded-xl">
              <CheckCircleIcon class="w-6 h-6" />
            </div>
          </div>
        </div>

        <div class="card bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-blue-100 text-sm font-medium">Récupérées</p>
              <p class="text-3xl font-bold">{{ completedReservations.length }}</p>
            </div>
            <div class="p-3 bg-white/20 rounded-xl">
              <ShoppingBagIcon class="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="card mb-6">
      <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div class="flex flex-wrap gap-2">
          <button
            v-for="filter in filters"
            :key="filter.key"
            @click="activeFilter = filter.key"
            :class="[
              'px-4 py-2 rounded-lg font-medium transition-colors',
              activeFilter === filter.key
                ? 'bg-primary-100 text-primary-700 border-2 border-primary-200'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            ]"
          >
            {{ filter.label }}
            <span v-if="filter.count !== null" class="ml-2 text-sm">
              ({{ filter.count }})
            </span>
          </button>
        </div>

        <div class="flex items-center gap-4">
          <select v-model="sortBy" class="input">
            <option value="created_at">Plus récent</option>
            <option value="pickup_date">Date de récupération</option>
            <option value="expires_at">Date d'expiration</option>
            <option value="total_amount">Montant</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Reservations List -->
    <div v-if="filteredReservations.length > 0" class="space-y-4">
      <div
        v-for="reservation in filteredReservations"
        :key="reservation.id"
        class="card hover:shadow-lg transition-shadow"
      >
        <div class="flex flex-col lg:flex-row gap-6">
          <!-- Product Image -->
          <div class="flex-shrink-0">
            <img
              :src="reservation.product.image_url || '/images/placeholder.jpg'"
              :alt="reservation.product.name"
              class="w-24 h-24 lg:w-32 lg:h-32 object-cover rounded-lg"
            />
          </div>

          <!-- Reservation Details -->
          <div class="flex-grow">
            <div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
              <div class="flex-grow">
                <!-- Header with status -->
                <div class="flex items-start justify-between mb-2">
                  <div>
                    <h3 class="font-semibold text-lg text-neutral-900 mb-1">
                      {{ reservation.product.name }}
                    </h3>
                    <p class="text-sm text-neutral-600">
                      Code: <span class="font-mono font-medium">{{ reservation.reservation_code }}</span>
                    </p>
                  </div>

                  <div class="flex items-center gap-2">
                    <span
                      :class="getStatusBadgeClass(reservation.status)"
                      class="px-3 py-1 rounded-full text-sm font-medium"
                    >
                      {{ getStatusLabel(reservation.status) }}
                    </span>

                    <span
                      v-if="isUrgent(reservation)"
                      class="px-2 py-1 bg-error-100 text-error-700 rounded-full text-xs font-medium"
                    >
                      Urgent
                    </span>
                  </div>
                </div>

                <!-- Customer Info -->
                <div class="mb-3">
                  <div class="flex items-center gap-2 text-neutral-600 text-sm">
                    <UserIcon class="w-4 h-4" />
                    <span class="font-medium">{{ reservation.consumer.name }}</span>
                    <span>•</span>
                    <span>{{ reservation.consumer.phone }}</span>
                  </div>
                </div>

                <!-- Reservation Details Grid -->
                <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p class="text-neutral-500">Quantité</p>
                    <p class="font-medium">{{ reservation.quantity }}</p>
                  </div>
                  <div>
                    <p class="text-neutral-500">Montant</p>
                    <p class="font-medium">{{ formatPrice(reservation.total_amount) }}€</p>
                  </div>
                  <div>
                    <p class="text-neutral-500">Récupération</p>
                    <p class="font-medium">{{ formatDateTime(reservation.pickup_date) }}</p>
                  </div>
                  <div>
                    <p class="text-neutral-500">Expire</p>
                    <p :class="isExpired(reservation) ? 'text-error-600 font-medium' : 'font-medium'">
                      {{ formatDateTime(reservation.expires_at) }}
                    </p>
                  </div>
                </div>

                <!-- Notes -->
                <div v-if="reservation.notes" class="mt-3">
                  <p class="text-neutral-500 text-sm">Notes:</p>
                  <p class="text-neutral-700 text-sm">{{ reservation.notes }}</p>
                </div>
              </div>

              <!-- Actions -->
              <div class="flex flex-col gap-2 min-w-[200px]">
                <template v-if="reservation.status === 'pending'">
                  <button
                    @click="updateReservationStatus(reservation, 'confirmed')"
                    class="btn btn-success btn-sm"
                  >
                    <CheckIcon class="w-4 h-4 mr-1" />
                    Confirmer
                  </button>
                  <button
                    @click="updateReservationStatus(reservation, 'cancelled')"
                    class="btn btn-error btn-sm"
                  >
                    <XMarkIcon class="w-4 h-4 mr-1" />
                    Annuler
                  </button>
                </template>

                <template v-else-if="reservation.status === 'confirmed'">
                  <button
                    @click="markAsReady(reservation)"
                    class="btn btn-primary btn-sm"
                  >
                    <BellIcon class="w-4 h-4 mr-1" />
                    Marquer prêt
                  </button>
                  <button
                    @click="updateReservationStatus(reservation, 'completed')"
                    class="btn btn-success btn-sm"
                  >
                    <CheckCircleIcon class="w-4 h-4 mr-1" />
                    Récupérée
                  </button>
                </template>

                <template v-else-if="reservation.status === 'ready'">
                  <button
                    @click="updateReservationStatus(reservation, 'completed')"
                    class="btn btn-success btn-sm"
                  >
                    <CheckCircleIcon class="w-4 h-4 mr-1" />
                    Marquer récupérée
                  </button>
                </template>

                <!-- Always show contact and details buttons -->
                <button
                  @click="contactCustomer(reservation)"
                  class="btn btn-outline btn-sm"
                >
                  <PhoneIcon class="w-4 h-4 mr-1" />
                  Contacter
                </button>

                <button
                  @click="viewReservationDetails(reservation)"
                  class="btn btn-outline btn-sm"
                >
                  <EyeIcon class="w-4 h-4 mr-1" />
                  Détails
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="text-center py-12">
      <BookmarkIcon class="w-16 h-16 text-neutral-300 mx-auto mb-4" />
      <h3 class="text-xl font-semibold text-neutral-900 mb-2">Aucune réservation trouvée</h3>
      <p class="text-neutral-600">
        {{ searchQuery ? 'Aucune réservation ne correspond à votre recherche.' : 'Les nouvelles réservations apparaîtront ici.' }}
      </p>
    </div>

    <!-- Reservation Details Modal -->
    <div
      v-if="showDetailsModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      @click.self="showDetailsModal = false"
    >
      <div class="card max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-2xl font-bold text-neutral-900">
            Détails de la réservation
          </h2>
          <button @click="showDetailsModal = false" class="text-neutral-400 hover:text-neutral-600">
            <XMarkIcon class="w-6 h-6" />
          </button>
        </div>

        <div v-if="selectedReservation" class="space-y-6">
          <!-- Reservation Info -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="label">Code de réservation</label>
              <p class="font-mono text-lg">{{ selectedReservation.reservation_code }}</p>
            </div>
            <div>
              <label class="label">Statut</label>
              <span
                :class="getStatusBadgeClass(selectedReservation.status)"
                class="px-3 py-1 rounded-full text-sm font-medium"
              >
                {{ getStatusLabel(selectedReservation.status) }}
              </span>
            </div>
          </div>

          <!-- Customer Details -->
          <div>
            <h3 class="text-lg font-semibold mb-4">Informations client</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="label">Nom</label>
                <p>{{ selectedReservation.consumer.name }}</p>
              </div>
              <div>
                <label class="label">Téléphone</label>
                <p>{{ selectedReservation.consumer.phone }}</p>
              </div>
            </div>
          </div>

          <!-- Product Details -->
          <div>
            <h3 class="text-lg font-semibold mb-4">Détails du produit</h3>
            <div class="flex gap-4">
              <img
                :src="selectedReservation.product.image_url || '/images/placeholder.jpg'"
                :alt="selectedReservation.product.name"
                class="w-20 h-20 object-cover rounded-lg"
              />
              <div class="flex-grow">
                <h4 class="font-semibold">{{ selectedReservation.product.name }}</h4>
                <p class="text-neutral-600 text-sm">{{ selectedReservation.product.description }}</p>
                <div class="mt-2 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span class="text-neutral-500">Prix unitaire:</span>
                    <span class="font-medium ml-1">{{ formatPrice(selectedReservation.discounted_price) }}€</span>
                  </div>
                  <div>
                    <span class="text-neutral-500">Quantité:</span>
                    <span class="font-medium ml-1">{{ selectedReservation.quantity }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Timeline -->
          <div>
            <h3 class="text-lg font-semibold mb-4">Chronologie</h3>
            <div class="space-y-3">
              <div class="flex items-center gap-3">
                <div class="w-3 h-3 bg-primary-500 rounded-full"></div>
                <div>
                  <p class="text-sm font-medium">Réservation créée</p>
                  <p class="text-xs text-neutral-500">{{ formatDateTime(selectedReservation.created_at) }}</p>
                </div>
              </div>

              <div v-if="selectedReservation.confirmed_at" class="flex items-center gap-3">
                <div class="w-3 h-3 bg-success-500 rounded-full"></div>
                <div>
                  <p class="text-sm font-medium">Confirmée</p>
                  <p class="text-xs text-neutral-500">{{ formatDateTime(selectedReservation.confirmed_at) }}</p>
                </div>
              </div>

              <div v-if="selectedReservation.status === 'completed'" class="flex items-center gap-3">
                <div class="w-3 h-3 bg-blue-500 rounded-full"></div>
                <div>
                  <p class="text-sm font-medium">Récupérée</p>
                  <p class="text-xs text-neutral-500">{{ formatDateTime(selectedReservation.pickup_date) }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Notes -->
          <div v-if="selectedReservation.notes">
            <h3 class="text-lg font-semibold mb-4">Notes</h3>
            <p class="text-neutral-700">{{ selectedReservation.notes }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
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
  EyeIcon
} from '@heroicons/vue/24/outline'

// Reactive data
const reservations = ref<any[]>([])
const searchQuery = ref('')
const selectedDateRange = ref('all')
const activeFilter = ref('all')
const sortBy = ref('created_at')
const showDetailsModal = ref(false)
const selectedReservation = ref<any>(null)

// Filters
const filters = computed(() => [
  { key: 'all', label: 'Toutes', count: reservations.value.length },
  { key: 'pending', label: 'En attente', count: pendingReservations.value.length },
  { key: 'confirmed', label: 'Confirmées', count: confirmedReservations.value.length },
  { key: 'ready', label: 'Prêtes', count: readyReservations.value.length },
  { key: 'completed', label: 'Récupérées', count: completedReservations.value.length },
  { key: 'expired', label: 'Expirées', count: expiredReservations.value.length }
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
        case 'week':
          const weekAgo = new Date(today)
          weekAgo.setDate(weekAgo.getDate() - 7)
          return reservationDate >= weekAgo
        case 'month':
          const monthAgo = new Date(today)
          monthAgo.setMonth(monthAgo.getMonth() - 1)
          return reservationDate >= monthAgo
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

// Methods
const formatPrice = (price: number): string => {
  return price?.toFixed(2) || '0.00'
}

const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getStatusBadgeClass = (status: string): string => {
  const classes: Record<string, string> = {
    pending: 'bg-warning-100 text-warning-700',
    confirmed: 'bg-success-100 text-success-700',
    ready: 'bg-blue-100 text-blue-700',
    completed: 'bg-primary-100 text-primary-700',
    cancelled: 'bg-error-100 text-error-700',
    expired: 'bg-neutral-100 text-neutral-700'
  }
  return classes[status] || classes.pending
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
    reservation.status = newStatus

    if (newStatus === 'confirmed') {
      reservation.confirmed_at = new Date().toISOString()
    } else if (newStatus === 'completed') {
      reservation.pickup_date = new Date().toISOString()
    }

    console.log(`Updated reservation ${reservation.id} to status: ${newStatus}`)
  } catch (error) {
    console.error('Error updating reservation status:', error)
  }
}

const markAsReady = async (reservation: any) => {
  try {
    reservation.status = 'ready'
    console.log(`Marked reservation ${reservation.id} as ready`)
    // TODO: Send notification to customer
  } catch (error) {
    console.error('Error marking reservation as ready:', error)
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

const loadReservations = async () => {
  try {
    // Mock data for development
    reservations.value = [
      {
        id: 1,
        reservation_code: 'AGP-2024-001',
        status: 'pending',
        quantity: 2,
        total_amount: 5.40,
        notes: 'Merci de garder au frais',
        created_at: '2024-01-15T10:00:00Z',
        confirmed_at: null,
        expires_at: '2024-01-16T18:00:00Z',
        pickup_date: '2024-01-16T16:00:00Z',
        discounted_price: 2.70,
        product: {
          id: 1,
          name: 'Pain de campagne bio',
          description: 'Délicieux pain artisanal fait avec des ingrédients biologiques locaux',
          image_url: '/images/bread.jpg'
        },
        consumer: {
          name: 'Marie Dupont',
          phone: '+33 6 12 34 56 78'
        }
      },
      {
        id: 2,
        reservation_code: 'AGP-2024-002',
        status: 'confirmed',
        quantity: 1,
        total_amount: 4.00,
        notes: null,
        created_at: '2024-01-14T15:30:00Z',
        confirmed_at: '2024-01-14T16:00:00Z',
        expires_at: '2024-01-17T20:00:00Z',
        pickup_date: '2024-01-17T18:00:00Z',
        discounted_price: 4.00,
        product: {
          id: 2,
          name: 'Fromage de chèvre',
          description: 'Fromage artisanal crémeux de la ferme locale',
          image_url: '/images/cheese.jpg'
        },
        consumer: {
          name: 'Pierre Martin',
          phone: '+33 6 98 76 54 32'
        }
      },
      {
        id: 3,
        reservation_code: 'AGP-2024-003',
        status: 'completed',
        quantity: 3,
        total_amount: 25.20,
        notes: 'Livraison à domicile possible ?',
        created_at: '2024-01-13T08:45:00Z',
        confirmed_at: '2024-01-13T09:15:00Z',
        expires_at: '2024-01-14T19:00:00Z',
        pickup_date: '2024-01-14T17:30:00Z',
        discounted_price: 8.40,
        product: {
          id: 3,
          name: 'Légumes de saison',
          description: 'Assortiment de légumes frais de saison cultivés localement',
          image_url: '/images/vegetables.jpg'
        },
        consumer: {
          name: 'Sophie Blanc',
          phone: '+33 6 11 22 33 44'
        }
      }
    ]
  } catch (error) {
    console.error('Error loading reservations:', error)
  }
}

// Lifecycle
onMounted(() => {
  loadReservations()
})
</script>
