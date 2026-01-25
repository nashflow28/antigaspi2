<template>
  <div class="min-h-screen bg-gradient-to-br from-surface-light to-primary-50 dark:from-surface-dark dark:to-surface-darker">
    <!-- Loading state -->
    <div v-if="loading" class="container py-6 sm:py-8">
      <Card class="animate-pulse">
        <div class="space-y-4">
          <div class="h-10 bg-neutral-200 dark:bg-neutral-700 rounded w-xs/3" />
          <div class="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4" />
          <div class="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-1/2" />
        </div>
      </Card>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="container py-6 sm:py-8">
      <Card class="text-left sm:text-center py-8 sm:py-12 lg:py-16">
        <div class="w-20 h-12 bg-accent-red/10 rounded-full flex items-center justify-center mx-auto mt-3">
          <AlertCircle class="h-6 w-6 text-accent-red" />
        </div>
        <h3 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mt-2">
          Erreur de chargement
        </h3>
        <p class="text-neutral-600 dark:text-neutral-300 mt-3">{{ error }}</p>
        <div class="flex gap-4 justify-center">
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
    <div v-else-if="reservation" class="container py-6 sm:py-8">
      <!-- Header -->
      <div class="bg-surface-light dark:bg-surface-dark/60 backdrop-blur-md border-b mt-4 sm:mb-3xl">
        <div class="container py-6">
          <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <div>
              <div class="flex items-center gap-4 mt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  @click="$router.push('/reservations')"
                >
                  <ArrowLeft class="h-4 w-4" />
                  Retour
                </Button>
                <div class="h-10 w-px bg-neutral-300 dark:bg-neutral-600" />
                <span class="text-sm text-neutral-500 dark:text-neutral-400">Réservation</span>
              </div>
              <h1 class="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                {{ reservation.product.name }}
              </h1>
              <p class="text-neutral-600 dark:text-neutral-300">
                Code: {{ reservation.reservation_code }}
              </p>
            </div>

            <!-- Status badge -->
            <div class="flex items-center gap-4">
              <Badge
                :variant="getStatusVariant(reservation.status)"
                size="lg"
                class="px-3 py-3"
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
            <h3 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mt-3">
              Détails du produit
            </h3>
            <div class="flex gap-3">
              <div
                v-if="reservation.product.image_url"
                class="w-6xl h-6xl rounded overflow-hidden sm:block flex-shrink-0"
              >
                <img
                  :src="reservation.product.image_url"
                  :alt="reservation.product.name"
                  class="w-full h-full object-cover"
                >
              </div>
              <div
                v-else
                class="w-6xl h-6xl bg-neutral-100 dark:bg-neutral-800 rounded flex items-center justify-center flex-shrink-0"
              >
                <Package class="h-6 w-6 text-neutral-400 dark:text-neutral-500" />
              </div>

              <div class="flex-1">
                <h4 class="font-semibold text-neutral-900 dark:text-neutral-100 mt-2">
                  {{ reservation.product.name }}
                </h4>
                <div class="space-y-4 text-sm text-neutral-600 dark:text-neutral-300">
                  <div class="flex items-center gap-2">
                    <Store class="h-4 w-4" />
                    <span>{{ reservation.product.merchant.name }}</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <MapPin class="h-4 w-4" />
                    <span>{{ reservation.product.merchant.address }}</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <Phone class="h-4 w-4" />
                    <span>{{ reservation.product.merchant.phone }}</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <!-- Reservation details -->
          <Card>
            <h3 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mt-3">
              Détails de la réservation
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label class="text-sm font-medium text-neutral-800 dark:text-neutral-200">Quantité réservée</label>
                <p class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{{ reservation.quantity }}</p>
              </div>
              <div>
                <label class="text-sm font-medium text-neutral-800 dark:text-neutral-200">Prix unitaire</label>
                <div class="flex items-center gap-2">
                  <span class="text-lg font-semibold text-primary-600 dark:text-primary-400">
                    {{ formatPrice(reservation.discounted_price) }}
                  </span>
                  <span class="text-sm text-neutral-500 dark:text-neutral-400 line-through">
                    {{ formatPrice(reservation.original_price) }}
                  </span>
                </div>
              </div>
              <div>
                <label class="text-sm font-medium text-neutral-800 dark:text-neutral-200">Montant total</label>
                <p class="text-xl font-semibold text-primary-600 dark:text-primary-400">
                  {{ formatPrice(reservation.total_amount ?? 0) }}
                </p>
              </div>
              <div>
                <label class="text-sm font-medium text-neutral-800 dark:text-neutral-200">Date de retrait</label>
                <p class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                  {{ formatDate(reservation.pickup_date) }}
                </p>
              </div>
            </div>

            <div v-if="reservation.pickup_notes" class="mt-4 padding-t-lg border-t border-neutral-200 dark:border-neutral-700">
              <label class="text-sm font-medium text-neutral-800 dark:text-neutral-200">Notes de retrait</label>
              <p class="text-neutral-600 dark:text-neutral-300 mt-1">{{ reservation.pickup_notes }}</p>
            </div>
          </Card>

          <!-- Actions -->
          <Card v-if="canPerformActions || delivery || deliveryLoading">
            <h3 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mt-3">
              Actions disponibles
            </h3>
            <div class="flex flex-wrap gap-4">
              <Button
                v-if="reservation.status === 'pending'"
                variant="destructive"
                @click="cancelReservation"
              >
                <X class="h-4 w-4" />
                Annuler la réservation
              </Button>

              <Button
                variant="outline"
                @click="contactMerchant"
              >
                <Phone class="h-4 w-4" />
                Contacter le commerçant
              </Button>

              <Button
                variant="outline"
                @click="downloadReceipt"
              >
                <Download class="h-4 w-4" />
                Télécharger le reçu
              </Button>

              <Button
                v-if="canRequestDelivery"
                variant="primary"
                @click="requestDelivery"
              >
                <Truck class="h-4 w-4" />
                Demander une livraison
              </Button>

              <Button
                v-if="canTrackDelivery"
                variant="outline"
                @click="trackDelivery"
              >
                <Truck class="h-4 w-4" />
                Suivre la livraison
              </Button>

              <Button
                v-if="canRateDelivery"
                variant="outline"
                @click="rateDelivery"
              >
                <Truck class="h-4 w-4" />
                Noter la livraison
              </Button>

              <Button
                v-if="canCancelDelivery"
                variant="destructive"
                @click="cancelDelivery"
              >
                <X class="h-4 w-4" />
                Annuler la livraison
              </Button>
            </div>

            <p v-if="deliveryLoading" class="mt-4 text-sm text-neutral-500 dark:text-neutral-400">
              Chargement des informations de livraison...
            </p>
            <p v-else-if="deliveryError" class="mt-4 text-sm text-accent-red">
              {{ deliveryError }}
            </p>
            <div v-else-if="delivery" class="mt-4 text-sm text-neutral-600 dark:text-neutral-300">
              Statut livraison : <span class="font-semibold">{{ delivery.status }}</span>
            </div>
          </Card>
        </div>

        <!-- Sidebar -->
        <div class="space-y-6">
          <!-- Status timeline -->
          <Card>
            <h3 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mt-3">
              Suivi de la réservation
            </h3>
            <div class="space-y-4">
              <div
                v-for="(step, index) in statusSteps"
                :key="index"
                class="flex items-center gap-4"
              >
                <div
                  class="h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0"
                  :class="step.completed ? 'bg-primary-50 dark:bg-primary-500/20 text-primary-900 dark:text-primary-100' : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-500 dark:text-neutral-400'"
                >
                  <component :is="step.icon" class="h-4 w-4" />
                </div>
                <div class="flex-1">
                  <p
                    class="font-medium"
                    :class="step.completed ? 'text-neutral-900 dark:text-neutral-100' : 'text-neutral-500 dark:text-neutral-400'"
                  >
                    {{ step.title }}
                  </p>
                  <p class="text-sm text-neutral-500 dark:text-neutral-400">{{ step.description }}</p>
                </div>
              </div>
            </div>
          </Card>

          <!-- Savings summary -->
          <Card class="bg-gradient-to-r from-accent-orange to-accent-orange/90 text-white">
            <div class="flex items-center gap-4 mt-3">
              <div class="w-12 h-10 bg-surface-light dark:bg-surface-dark/20 rounded flex items-center justify-center">
                <DollarSign class="h-6 w-6" />
              </div>
              <div>
                <h3 class="font-semibold">Vos économies</h3>
                <p class="text-sm opacity-90">Sur cette réservation</p>
              </div>
            </div>
            <div class="space-y-4">
              <div class="flex justify-between items-center">
                <span class="text-sm">Prix original</span>
                <span>{{ formatPrice(reservation.original_price * reservation.quantity) }}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-sm">Prix payé</span>
                <span>{{ formatPrice(reservation.total_amount ?? 0) }}</span>
              </div>
              <div class="border-t border-neutral-200/20 dark:border-neutral-700/20 padding-t-sm">
                <div class="flex justify-between items-center">
                  <span class="font-semibold">Économisé</span>
                  <span class="font-semibold text-lg">
                    {{ formatPrice((reservation.original_price * reservation.quantity) - (reservation.total_amount ?? 0)) }}
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
import { useRoute, useRouter } from 'vue-router'
import { formatPrice } from '@/utils/currency'
import { notify } from '@/composables/useNotifications'
import { apiService } from '@/services/api'
import { deliveryService } from '@/services/deliveryService'
import { useReservationsStore } from '@/stores/reservations'
import {
  AlertCircle, ArrowLeft, Calendar, Check, DollarSign,
  Download, MapPin, Package, Phone, Store, Truck, X
} from 'lucide-vue-next'
import type { Reservation, Delivery } from '@/types'

// Import 2025 Design System components
import Card from '@/components/ui/2025/Card.vue'
import Button from '@/components/ui/2025/Button.vue'
import Badge from '@/components/ui/2025/Badge.vue'

const route = useRoute()
const router = useRouter()
const reservationsStore = useReservationsStore()

// State
const loading = ref(true)
const error = ref<string | null>(null)
const reservation = ref<Reservation | null>(null)
const delivery = ref<Delivery | null>(null)
const deliveryLoading = ref(false)
const deliveryError = ref<string | null>(null)

// Computed
const canPerformActions = computed(() => {
  return reservation.value && ['pending', 'confirmed', 'ready'].includes(reservation.value.status)
})

const canRequestDelivery = computed(() => {
  return reservation.value &&
    ['pending', 'confirmed'].includes(reservation.value.status) &&
    !delivery.value
})

const canTrackDelivery = computed(() => {
  return delivery.value && !['cancelled', 'failed'].includes(delivery.value.status)
})

const canRateDelivery = computed(() => {
  return delivery.value && delivery.value.status === 'delivered' && !delivery.value.consumer_rating
})

const canCancelDelivery = computed(() => {
  return Boolean(delivery.value?.can_cancel)
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
          name: res.product?.merchant?.name || (res.product?.merchant as any)?.business_name || 'Commerçant inconnu',
          address: res.product?.merchant?.address || res.product?.merchant?.city || 'Adresse non renseignée',
          phone: res.product?.merchant?.phone || 'N/A'
        }
      },
      quantity,
      quantity_reserved: res.quantity_reserved ?? quantity,
      original_price: originalPrice,
      discounted_price: discountedPrice,
      total_amount: totalAmount,
      pickup_date: res.pickup_date ?? undefined,
      pickup_notes: res.pickup_notes ?? res.notes ?? '',
      reservation_code: res.reservation_code || `ANT-${res.id.toString().padStart(3, '0')}`
    }

    await loadDelivery(reservationId)
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

const loadDelivery = async (reservationId: number) => {
  deliveryLoading.value = true
  deliveryError.value = null

  try {
    const response = await deliveryService.getHistory()
    const deliveries = Array.isArray(response.data)
      ? response.data
      : (response.data as any)?.data || []
    delivery.value = deliveries.find((item: Delivery) => item.reservation_id === reservationId) || null
  } catch (err: any) {
    deliveryError.value = err?.message || 'Impossible de charger la livraison associée'
  } finally {
    deliveryLoading.value = false
  }
}

const requestDelivery = () => {
  if (!reservation.value) return
  router.push({ name: 'delivery-request', params: { reservationId: reservation.value.id } })
}

const trackDelivery = () => {
  if (!delivery.value) return
  router.push({ name: 'delivery-tracking', params: { deliveryId: delivery.value.id } })
}

const rateDelivery = () => {
  if (!delivery.value) return
  router.push({ name: 'delivery-rating', params: { deliveryId: delivery.value.id } })
}

const cancelDelivery = async () => {
  if (!delivery.value) return
  const reason = window.prompt('Pourquoi souhaitez-vous annuler la livraison ?')
  if (!reason) return

  try {
    const response = await deliveryService.cancelDelivery(delivery.value.id, reason)
    delivery.value = response.data
    notify.success('Livraison annulée')
  } catch (err: any) {
    notify.error(err?.message || 'Impossible d’annuler la livraison')
  }
}

onMounted(() => {
  loadReservation()
})
</script>
