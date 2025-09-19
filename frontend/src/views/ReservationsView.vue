<template>
  <div class="min-h-screen bg-gradient-subtle">
    <!-- Header avec statistiques -->
    <div class="glass-bg glass-border border-b">
      <div class="container-fluid py-8">
        <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <h1 class="text-3xl font-bold text-neutral-900 mb-2">
              Mes Réservations
            </h1>
            <p class="text-neutral-600">
              Gérez vos réservations et découvrez votre impact environnemental
            </p>
          </div>

          <!-- Statistiques rapides -->
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div class="card-glass text-center">
              <div class="text-2xl font-bold text-primary-600">{{ stats.total }}</div>
              <div class="text-xs text-neutral-500">Total</div>
            </div>
            <div class="card-glass text-center">
              <div class="text-2xl font-bold text-secondary-600">{{ stats.active }}</div>
              <div class="text-xs text-neutral-500">En cours</div>
            </div>
            <div class="card-glass text-center">
              <div class="text-2xl font-bold text-success-600">{{ stats.completed }}</div>
              <div class="text-xs text-neutral-500">Récupérées</div>
            </div>
            <div class="card-glass text-center">
              <div class="text-2xl font-bold text-accent-600">{{ stats.saved }}kg</div>
              <div class="text-xs text-neutral-500">Sauvées</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="container-fluid py-8">
      <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <!-- Filtres et actions -->
        <div class="lg:col-span-1">
          <div class="card space-y-6">
            <h3 class="text-lg font-semibold text-neutral-900">Filtres</h3>

            <!-- Filtre par statut -->
            <div>
              <label class="form-label">Statut</label>
              <select v-model="filters.status" class="form-select">
                <option value="">Tous les statuts</option>
                <option value="pending">En attente</option>
                <option value="confirmed">Confirmée</option>
                <option value="ready">Prête</option>
                <option value="completed">Récupérée</option>
                <option value="cancelled">Annulée</option>
                <option value="expired">Expirée</option>
              </select>
            </div>

            <!-- Filtre par période -->
            <div>
              <label class="form-label">Période</label>
              <select v-model="filters.period" class="form-select">
                <option value="">Toutes</option>
                <option value="today">Aujourd'hui</option>
                <option value="week">Cette semaine</option>
                <option value="month">Ce mois</option>
                <option value="year">Cette année</option>
              </select>
            </div>

            <!-- Actions rapides -->
            <div class="pt-4 border-t border-neutral-200">
              <h4 class="text-sm font-medium text-neutral-700 mb-3">Actions rapides</h4>
              <div class="space-y-2">
                <button
                  @click="exportReservations"
                  class="w-full btn btn-outline btn-sm"
                >
                  <Download class="w-4 h-4" />
                  Exporter
                </button>
                <button
                  @click="markAllAsRead"
                  class="w-full btn btn-ghost btn-sm"
                >
                  <CheckCheck class="w-4 h-4" />
                  Tout marquer lu
                </button>
              </div>
            </div>
          </div>

          <!-- Impact environnemental -->
          <div class="card mt-6 bg-gradient-accent text-white">
            <div class="flex items-center gap-3 mb-4">
              <div class="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Leaf class="w-6 h-6" />
              </div>
              <div>
                <h3 class="font-semibold">Votre Impact</h3>
                <p class="text-sm opacity-90">Ce mois-ci</p>
              </div>
            </div>
            <div class="space-y-3">
              <div class="flex justify-between items-center">
                <span class="text-sm">Nourriture sauvée</span>
                <span class="font-bold">{{ monthlyImpact.food }}kg</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-sm">CO₂ évité</span>
                <span class="font-bold">{{ monthlyImpact.co2 }}kg</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-sm">Économisé</span>
                <span class="font-bold">{{ formatPrice(monthlyImpact.savings) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Liste des réservations -->
        <div class="lg:col-span-3">
          <!-- En-tête avec tri -->
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div class="flex items-center gap-3">
              <button
                @click="viewMode = 'list'"
                class="btn btn-ghost btn-sm"
                :class="{ 'bg-primary-50 text-primary-600': viewMode === 'list' }"
              >
                <List class="w-4 h-4" />
              </button>
              <button
                @click="viewMode = 'grid'"
                class="btn btn-ghost btn-sm"
                :class="{ 'bg-primary-50 text-primary-600': viewMode === 'grid' }"
              >
                <Grid3X3 class="w-4 h-4" />
              </button>
              <span class="text-sm text-neutral-500">
                {{ filteredReservations.length }} réservation{{ filteredReservations.length > 1 ? 's' : '' }}
              </span>
            </div>

            <select v-model="sortBy" class="form-select w-auto">
              <option value="created_at_desc">Plus récentes</option>
              <option value="created_at_asc">Plus anciennes</option>
              <option value="pickup_date_asc">Date de retrait</option>
              <option value="status">Statut</option>
            </select>
          </div>

          <!-- Loading state -->
          <div v-if="loading" class="space-y-4">
            <div v-for="i in 3" :key="i" class="card animate-pulse">
              <div class="flex items-center gap-4">
                <div class="w-16 h-16 bg-neutral-200 rounded-xl"></div>
                <div class="flex-1 space-y-2">
                  <div class="h-4 bg-neutral-200 rounded w-3/4"></div>
                  <div class="h-3 bg-neutral-200 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Liste des réservations -->
          <div v-else-if="filteredReservations.length > 0" class="space-y-4">
            <ReservationCard
              v-for="reservation in filteredReservations"
              :key="reservation.id"
              :reservation="reservation"
              :view-mode="viewMode"
              @cancel="cancelReservation"
              @view="viewReservation"
              @contact="contactMerchant"
            />
          </div>

          <!-- État vide -->
          <div v-else class="card text-center py-12">
            <div class="w-20 h-20 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar class="w-10 h-10 text-neutral-400" />
            </div>
            <h3 class="text-lg font-semibold text-neutral-900 mb-2">
              {{ hasFilters ? 'Aucune réservation trouvée' : 'Aucune réservation encore' }}
            </h3>
            <p class="text-neutral-600 mb-6">
              {{ hasFilters
                ? 'Essayez de modifier vos filtres pour voir plus de résultats.'
                : 'Découvrez des produits près de chez vous et faites votre première réservation.'
              }}
            </p>
            <div class="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                v-if="hasFilters"
                @click="clearFilters"
                class="btn btn-outline"
              >
                Effacer les filtres
              </button>
              <router-link
                to="/products"
                class="btn btn-primary"
              >
                Découvrir les produits
              </router-link>
            </div>
          </div>

          <!-- Pagination -->
          <div v-if="filteredReservations.length > 0 && totalPages > 1" class="flex justify-center mt-8">
            <div class="flex items-center gap-2">
              <button
                @click="currentPage--"
                :disabled="currentPage <= 1"
                class="btn btn-outline btn-sm"
              >
                <ChevronLeft class="w-4 h-4" />
              </button>

              <div class="flex items-center gap-1">
                <button
                  v-for="page in visiblePages"
                  :key="page"
                  @click="currentPage = page"
                  class="btn btn-sm"
                  :class="page === currentPage ? 'btn-primary' : 'btn-ghost'"
                >
                  {{ page }}
                </button>
              </div>

              <button
                @click="currentPage++"
                :disabled="currentPage >= totalPages"
                class="btn btn-outline btn-sm"
              >
                <ChevronRight class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { formatPrice } from '@/utils/currency'
import {
  Calendar, CheckCheck, ChevronLeft, ChevronRight, Download,
  Grid3X3, Leaf, List
} from 'lucide-vue-next'
import ReservationCard from '@/components/reservation/ReservationCard.vue'
import type { Reservation } from '@/types'

const router = useRouter()

// État de l'interface
const loading = ref(true)
const viewMode = ref<'list' | 'grid'>('list')
const currentPage = ref(1)
const itemsPerPage = 12

// Filtres
const filters = reactive({
  status: '',
  period: ''
})

const sortBy = ref('created_at_desc')

// Données des réservations (simulées)
const reservations = ref<Reservation[]>([])

// Statistiques
const stats = computed(() => ({
  total: reservations.value.length,
  active: reservations.value.filter(r => ['pending', 'confirmed', 'ready'].includes(r.status)).length,
  completed: reservations.value.filter(r => r.status === 'completed').length,
  saved: reservations.value.reduce((sum, r) => sum + (r.status === 'completed' ? r.quantity : 0), 0)
}))

// Impact mensuel
const monthlyImpact = computed(() => {
  const thisMonth = reservations.value.filter(r => {
    const reservationDate = new Date(r.created_at)
    const now = new Date()
    return reservationDate.getMonth() === now.getMonth() &&
           reservationDate.getFullYear() === now.getFullYear() &&
           r.status === 'completed'
  })

  const food = thisMonth.reduce((sum, r) => sum + r.quantity, 0)
  const co2 = food * 2.5 // Estimation: 2.5kg CO2 par kg de nourriture
  const savings = thisMonth.reduce((sum, r) => sum + (r.original_price - r.discounted_price) * r.quantity, 0)

  return { food, co2: Math.round(co2), savings }
})

// Filtres et tri
const filteredReservations = computed(() => {
  let filtered = [...reservations.value]

  // Filtre par statut
  if (filters.status) {
    filtered = filtered.filter(r => r.status === filters.status)
  }

  // Filtre par période
  if (filters.period) {
    const now = new Date()
    filtered = filtered.filter(r => {
      const date = new Date(r.created_at)
      switch (filters.period) {
        case 'today':
          return date.toDateString() === now.toDateString()
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          return date >= weekAgo
        case 'month':
          return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
        case 'year':
          return date.getFullYear() === now.getFullYear()
        default:
          return true
      }
    })
  }

  // Tri
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

  // Pagination
  const start = (currentPage.value - 1) * itemsPerPage
  return filtered.slice(start, start + itemsPerPage)
})

const totalPages = computed(() =>
  Math.ceil(reservations.value.length / itemsPerPage)
)

const visiblePages = computed(() => {
  const pages = []
  const start = Math.max(1, currentPage.value - 2)
  const end = Math.min(totalPages.value, start + 4)

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  return pages
})

const hasFilters = computed(() =>
  filters.status || filters.period
)

// Méthodes
const loadReservations = async () => {
  loading.value = true
  try {
    const response = await fetch('http://localhost:8000/api/reservations', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${useAuthStore().token}`
      }
    })

    if (!response.ok) {
      if (response.status === 401) {
        router.push('/login')
        return
      }
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    console.log('Reservations API response:', data)

    if (data.success || data.data) {
      // Handle paginated response
      const reservationsData = data.data || []

      // Transform API data to match component interface
      reservations.value = reservationsData.map((res: any) => ({
        id: res.id,
        product: {
          id: res.product?.id,
          name: res.product?.name || 'Produit inconnu',
          image_url: res.product?.image_url || null,
          merchant: {
            name: res.product?.merchant?.name || res.product?.merchant?.business_name || 'Commerçant inconnu',
            address: res.product?.merchant?.address || res.product?.merchant?.city || 'Adresse non renseignée',
            phone: res.product?.merchant?.phone || 'N/A'
          }
        },
        quantity: res.quantity ?? res.quantity_reserved ?? 0,
        quantity_reserved: res.quantity_reserved ?? res.quantity ?? 0,
        original_price: parseFloat(res.product?.original_price || 0),
        discounted_price: parseFloat(res.product?.discounted_price || 0),
        total_amount: parseFloat(res.total_amount || 0),
        pickup_date: res.pickup_date ? new Date(res.pickup_date) : null,
        pickup_notes: res.notes || '',
        status: res.status,
        created_at: new Date(res.created_at),
        reservation_code: res.reservation_code || `ANT-${res.id.toString().padStart(3, '0')}`
      }))
    } else {
      console.error('API returned unexpected format:', data)
      reservations.value = []
    }
  } catch (error) {
    console.error('Erreur lors du chargement des réservations:', error)
    reservations.value = []
  } finally {
    loading.value = false
  }
}

const cancelReservation = async (reservationId: number) => {
  if (!confirm('Êtes-vous sûr de vouloir annuler cette réservation ?')) {
    return
  }

  try {
    // API call to cancel reservation
    const reservation = reservations.value.find(r => r.id === reservationId)
    if (reservation) {
      reservation.status = 'cancelled'
    }
  } catch (error) {
    console.error('Erreur lors de l\'annulation:', error)
  }
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
}

const exportReservations = () => {
  // Logique d'export des réservations
  console.log('Export des réservations...')
}

const markAllAsRead = () => {
  // Logique pour marquer toutes les notifications comme lues
  console.log('Marquer tout comme lu...')
}

onMounted(() => {
  loadReservations()
})
</script>
