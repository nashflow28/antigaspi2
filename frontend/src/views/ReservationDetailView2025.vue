<template>
  <div class="min-h-screen bg-gradient-to-br from-neutral-50 to-primary-50">
    <!-- Loading state -->
    <div v-if="loading" class="container px-4 sm:px-6 lg:px-8-2025 py-6 sm:py-8">
      <Card class="animate-pulse">
        <div class="space-y-4">
          <div class="h-10 bg-neutral-200 rounded w-1/3" />
          <div class="h-5 bg-neutral-200 rounded w-3/4" />
          <div class="h-5 bg-neutral-200 rounded w-1/2" />
        </div>
      </Card>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="container px-4 sm:px-6 lg:px-8-2025 py-6 sm:py-8">
      <Card class="text-left sm:text-center py-8 sm:py-10 lg:py-12">
        <div class="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle class="w-10 h-10 text-red-500" />
        </div>
        <h3 class="text-responsive-lg font-semibold text-heading mb-2">
          Erreur de chargement
        </h3>
        <p class="text-body mb-4">{{ error }}</p>
        <div class="flex gap-3 justify-center">
          <Button variant="primary" @click="loadReservation">
            Réessayer
          </Button>
          <Button variant="outline" @click="$router.push('/reservations')">
            Retour aux réservations
          </Button>
        </div>
      </Card>
    </div>

    <!-- Main content -->
    <div v-else-if="reservation" class="container px-4 sm:px-6 lg:px-8-2025 py-6 sm:py-8">
      <!-- Header -->
      <div class="bg-white/60 backdrop-blur-md border-b mb-6 sm:mb-8">
        <div class="container px-4 sm:px-6 lg:px-8-2025 py-6">
          <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <div class="flex items-center gap-3 mb-2">
                <Button
                  variant="ghost"
                  size="sm"
                  @click="$router.push('/reservations')"
                >
                  <ArrowLeft class="w-5 h-5" />
                  Retour
                </Button>
                <div class="h-10 w-px bg-neutral-300" />
                <span class="text-responsive-sm text-muted">Réservation</span>
              </div>
              <h1 class="text-responsive-xl font-semibold text-heading">
                {{ reservation.product.name }}
              </h1>
              <p class="text-body">
                Code: {{ reservation.reservation_code }}
              </p>
            </div>

            <!-- Status badge -->
            <div class="flex items-center gap-3">
              <Badge
                :variant="getStatusVariant(reservation.status)"
                size="lg"
                class="px-4 py-3"
              >
                {{ getStatusText(reservation.status) }}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        <!-- Main information -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Product details -->
          <Card>
            <h3 class="text-responsive-lg font-semibold text-heading mb-4">
              Détails du produit
            </h3>
            <div class="flex gap-4">
              <div
                v-if="reservation.product.image_url"
                class="w-24 h-24 rounded-xl overflow-hidden sm:block flex-shrink-0"
              >
                <img
                  :src="reservation.product.image_url"
                  :alt="reservation.product.name"
                  class="w-full h-full object-cover"
                >
              </div>
              <div
                v-else
                class="w-24 h-24 bg-neutral-100 rounded-xl flex items-center justify-center flex-shrink-0"
              >
                <Package class="w-10 h-10 text-placeholder" />
              </div>

              <div class="flex-1">
                <h4 class="font-semibold text-heading mb-2">
                  {{ reservation.product.name }}
                </h4>
                <div class="space-y-2 text-responsive-sm text-body">
                  <div class="flex items-center gap-2">
                    <Store class="w-5 h-5" />
                    <span>{{ reservation.product.merchant.name }}</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <MapPin class="w-5 h-5" />
                    <span>{{ reservation.product.merchant.address }}</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <Phone class="w-5 h-5" />
                    <span>{{ reservation.product.merchant.phone }}</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <!-- Reservation details -->
          <Card>
            <h3 class="text-responsive-lg font-semibold text-heading mb-4">
              Détails de la réservation
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="text-responsive-sm font-medium text-body-emphasis">Quantité réservée</label>
                <p class="text-responsive-lg font-semibold text-heading">{{ reservation.quantity }}</p>
              </div>
              <div>
                <label class="text-responsive-sm font-medium text-body-emphasis">Prix unitaire</label>
                <div class="flex items-center gap-2">
                  <span class="text-responsive-lg font-semibold text-primary">
                    {{ formatPrice(reservation.discounted_price) }}
                  </span>
                  <span class="text-responsive-sm text-muted line-through">
                    {{ formatPrice(reservation.original_price) }}
                  </span>
                </div>
              </div>
              <div>
                <label class="text-responsive-sm font-medium text-body-emphasis">Montant total</label>
                <p class="text-responsive-xl font-semibold text-primary">
                  {{ formatPrice(reservation.total_amount) }}
                </p>
              </div>
              <div>
                <label class="text-responsive-sm font-medium text-body-emphasis">Date de retrait</label>
                <p class="text-responsive-lg font-semibold text-heading">
                  {{ formatDate(reservation.pickup_date) }}
                </p>
              </div>
            </div>

            <div v-if="reservation.pickup_notes" class="mt-4 pt-4 border-t border-neutral-200">
              <label class="text-responsive-sm font-medium text-body-emphasis">Notes de retrait</label>
              <p class="text-body mt-1">{{ reservation.pickup_notes }}</p>
            </div>
          </Card>

          <!-- Actions -->
          <Card v-if="canPerformActions">
            <h3 class="text-responsive-lg font-semibold text-heading mb-4">
              Actions disponibles
            </h3>
            <div class="flex flex-wrap gap-3">
              <Button
                v-if="reservation.status === 'pending'"
                variant="destructive"
                @click="cancelReservation"
              >
                <X class="w-5 h-5" />
                Annuler la réservation
              </Button>

              <Button
                variant="outline"
                @click="contactMerchant"
              >
                <Phone class="w-5 h-5" />
                Contacter le commerçant
              </Button>

              <Button
                variant="outline"
                @click="downloadReceipt"
              >
                <Download class="w-5 h-5" />
                Télécharger le reçu
              </Button>
            </div>
          </Card>
        </div>

        <!-- Sidebar -->
        <div class="space-y-6">
          <!-- Status timeline -->
          <Card>
            <h3 class="text-responsive-lg font-semibold text-heading mb-4">
              Suivi de la réservation
            </h3>
            <div class="space-y-4">
              <div
                v-for="(step, index) in statusSteps"
                :key="index"
                class="flex items-center gap-3"
              >
                <div
                  class="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  :class="step.completed ? 'bg-primary-500 text-white' : 'bg-neutral-200 text-muted'"
                >
                  <component :is="step.icon" class="w-5 h-5" />
                </div>
                <div class="flex-1">
                  <p
                    class="font-medium"
                    :class="step.completed ? 'text-heading' : 'text-muted'"
                  >
                    {{ step.title }}
                  </p>
                  <p class="text-responsive-sm text-muted">{{ step.description }}</p>
                </div>
              </div>
            </div>
          </Card>

          <!-- Savings summary -->
          <Card class="bg-gradient-to-r from-accent-orange to-accent-orange/90 text-white">
            <div class="flex items-center gap-3 mb-4">
              <div class="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <DollarSign class="w-10 h-10" />
              </div>
              <div>
                <h3 class="font-semibold">Vos économies</h3>
                <p class="text-responsive-sm opacity-90">Sur cette réservation</p>
              </div>
            </div>
            <div class="space-y-2">
              <div class="flex justify-between items-center">
                <span class="text-responsive-sm">Prix original</span>
                <span>{{ formatPrice(reservation.original_price * reservation.quantity) }}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-responsive-sm">Prix payé</span>
                <span>{{ formatPrice(reservation.total_amount) }}</span>
              </div>
              <div class="border-t border-white/20 pt-2">
                <div class="flex justify-between items-center">
                  <span class="font-semibold">Économisé</span>
                  <span class="font-semibold text-responsive-lg">
                    {{ formatPrice((reservation.original_price * reservation.quantity) - reservation.total_amount) }}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { formatPrice } from '@/utils/currency'
import { notify } from '@/composables/useNotifications'
import { apiService } from '@/services/api'
import { useReservationsStore } from '@/stores/reservations'
import {
  AlertCircle, ArrowLeft, Calendar, Check, Clock, DollarSign,
  Download, MapPin, Package, Phone, Store, Truck, X
} from 'lucide-vue-next'
import type { Reservation } from '@/types'

// Import 2025 Design System components
import Card from '@/components/ui/2025/Card.vue'
import Button from '@/components/ui/2025/Button.vue'
import Badge from '@/components/ui/2025/Badge.vue'

const route = useRoute()
const reservationsStore = useReservationsStore()

// State
const loading = ref(true)
const error = ref<string | null>(null)
const reservation = ref<Reservation | null>(null)

// Computed
const canPerformActions = computed(() => {
  return reservation.value && ['pending', 'confirmed', 'ready'].includes(reservation.value.status)
})

const statusSteps = computed(() => {
  if (!reservation.value) return []

  const steps = [
    {
      title: 'Réservation créée',
      description: 'Votre réservation a été enregistrée',
      icon: Calendar,
      completed: true
    },
    {
      title: 'Confirmée',
      description: 'Le commerçant a confirmé votre réservation',
      icon: Check,
      completed: ['confirmed', 'ready', 'completed'].includes(reservation.value.status)
    },
    {
      title: 'Prête',
      description: 'Votre commande est prête à être récupérée',
      icon: Truck,
      completed: ['ready', 'completed'].includes(reservation.value.status)
    },
    {
      title: 'Récupérée',
      description: 'Vous avez récupéré votre commande',
      icon: Check,
      completed: reservation.value.status === 'completed'
    }
  ]

  if (reservation.value.status === 'cancelled') {
    return [
      steps[0],
      {
        title: 'Annulée',
        description: 'La réservation a été annulée',
        icon: X,
        completed: true
      }
    ]
  }

  return steps
})

// Methods
const loadReservation = async () => {
  loading.value = true
  error.value = null

  const reservationId = Number(route.params.id)
  if (Number.isNaN(reservationId)) {
    error.value = 'Identifiant de réservation invalide'
    loading.value = false
    return
  }

  try {
    const response = await apiService.getReservation(reservationId)

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Réservation introuvable')
    }

    const res = response.data
    const quantity = res.quantity ?? res.quantity_reserved ?? 0
    const originalPrice = Number(res.product?.original_price ?? res.original_price ?? 0)
    const discountedPrice = Number(res.product?.discounted_price ?? res.discounted_price ?? 0)
    const totalAmount = Number(res.total_amount ?? quantity * discountedPrice)

    reservation.value = {
      ...res,
      product: {
        id: res.product?.id ?? 0,
        name: res.product?.name || 'Produit inconnu',
        description: res.product?.description,
        image_url: res.product?.image_url || null,
        original_price: originalPrice,
        discounted_price: discountedPrice,
        merchant: {
          id: res.product?.merchant?.id,
          name: res.product?.merchant?.name || res.product?.merchant?.business_name || 'Commerçant inconnu',
          address: res.product?.merchant?.address || res.product?.merchant?.city || 'Adresse non renseignée',
          phone: res.product?.merchant?.phone || 'N/A'
        }
      },
      quantity,
      quantity_reserved: res.quantity_reserved ?? quantity,
      original_price: originalPrice,
      discounted_price: discountedPrice,
      total_amount: totalAmount,
      pickup_date: res.pickup_date ?? null,
      pickup_notes: res.pickup_notes ?? res.notes ?? '',
      reservation_code: res.reservation_code || `ANT-${res.id.toString().padStart(3, '0')}`
    }
  } catch (err: any) {
    const message = err?.message || 'Erreur lors du chargement de la réservation'
    error.value = message
    notify.error(message)
  } finally {
    loading.value = false
  }
}

// Convert status to 2025 Badge variant
const getStatusVariant = (status: string) => {
  const variants = {
    pending: 'warning' as const,
    confirmed: 'info' as const,
    ready: 'success' as const,
    completed: 'primary' as const,
    cancelled: 'error' as const,
    expired: 'secondary' as const
  }
  return variants[status as keyof typeof variants] || 'secondary' as const
}

const getStatusText = (status: string) => {
  const texts = {
    pending: 'En attente',
    confirmed: 'Confirmée',
    ready: 'Prête',
    completed: 'Récupérée',
    cancelled: 'Annulée',
    expired: 'Expirée'
  }
  return texts[status as keyof typeof texts] || status
}

const formatDate = (date: string | Date | null | undefined) => {
  if (!date) return 'Non définie'

  const parsedDate = typeof date === 'string' ? new Date(date) : date
  if (Number.isNaN(parsedDate?.getTime?.())) {
    return 'Non définie'
  }

  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'full',
    timeStyle: 'short'
  }).format(parsedDate)
}

const cancelReservation = async () => {
  if (!reservation.value) {
    return
  }

  if (!confirm('Êtes-vous sûr de vouloir annuler cette réservation ?')) {
    return
  }

  try {
    const response = await reservationsStore.cancelReservation(reservation.value.id)

    if (response.success) {
      reservation.value.status = 'cancelled'
      reservation.value.cancelled_at = new Date().toISOString()
      notify.success('Réservation annulée avec succès.')
    } else {
      notify.error(response.error || 'Erreur lors de l\'annulation de la réservation.')
    }
  } catch (err: any) {
    const message = err?.message || 'Erreur lors de l\'annulation de la réservation.'
    notify.error(message)
  }
}

const contactMerchant = () => {
  if (reservation.value?.product.merchant.phone) {
    window.open(`tel:${reservation.value.product.merchant.phone}`)
  }
}

const downloadReceipt = () => {
  // Future: Implement PDF receipt generation
  // This feature will generate a PDF receipt for the reservation
  alert('Fonctionnalité de téléchargement à venir')
}

onMounted(() => {
  loadReservation()
})
</script>
