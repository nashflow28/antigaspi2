<template>
  <div class="min-h-screen bg-gradient-to-br from-neutral-50 to-primary-50">
    <!-- Loading state -->
    <div v-if="loading" class="container-fluid py-8">
      <div class="card animate-pulse">
        <div class="space-y-4">
          <div class="h-8 bg-neutral-200 rounded w-1/3"></div>
          <div class="h-4 bg-neutral-200 rounded w-3/4"></div>
          <div class="h-4 bg-neutral-200 rounded w-1/2"></div>
        </div>
      </div>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="container-fluid py-8">
      <div class="card text-center py-12">
        <div class="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle class="w-10 h-10 text-red-500" />
        </div>
        <h3 class="text-lg font-semibold text-neutral-900 mb-2">
          Erreur de chargement
        </h3>
        <p class="text-neutral-600 mb-4">{{ error }}</p>
        <div class="flex gap-3 justify-center">
          <button @click="loadReservation" class="btn btn-primary">
            Réessayer
          </button>
          <router-link to="/reservations" class="btn btn-outline">
            Retour aux réservations
          </router-link>
        </div>
      </div>
    </div>

    <!-- Main content -->
    <div v-else-if="reservation" class="container-fluid py-8">
      <!-- Header -->
      <div class="glass-bg glass-border border-b mb-8">
        <div class="container-fluid py-6">
          <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <div class="flex items-center gap-3 mb-2">
                <router-link
                  to="/reservations"
                  class="btn btn-ghost btn-sm"
                >
                  <ArrowLeft class="w-4 h-4" />
                  Retour
                </router-link>
                <div class="h-6 w-px bg-neutral-300"></div>
                <span class="text-sm text-neutral-500">Réservation</span>
              </div>
              <h1 class="text-2xl font-bold text-neutral-900">
                {{ reservation.product.name }}
              </h1>
              <p class="text-neutral-600">
                Code: {{ reservation.reservation_code }}
              </p>
            </div>

            <!-- Status badge -->
            <div class="flex items-center gap-3">
              <span
                class="px-3 py-1 rounded-full text-sm font-medium"
                :class="getStatusClass(reservation.status)"
              >
                {{ getStatusText(reservation.status) }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Main information -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Product details -->
          <div class="card">
            <h3 class="text-lg font-semibold text-neutral-900 mb-4">
              Détails du produit
            </h3>
            <div class="flex gap-4">
              <div
                v-if="reservation.product.image_url"
                class="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0"
              >
                <img
                  :src="reservation.product.image_url"
                  :alt="reservation.product.name"
                  class="w-full h-full object-cover"
                />
              </div>
              <div
                v-else
                class="w-24 h-24 bg-neutral-100 rounded-xl flex items-center justify-center flex-shrink-0"
              >
                <Package class="w-8 h-8 text-neutral-400" />
              </div>

              <div class="flex-1">
                <h4 class="font-semibold text-neutral-900 mb-2">
                  {{ reservation.product.name }}
                </h4>
                <div class="space-y-1 text-sm text-neutral-600">
                  <div class="flex items-center gap-2">
                    <Store class="w-4 h-4" />
                    <span>{{ reservation.product.merchant.name }}</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <MapPin class="w-4 h-4" />
                    <span>{{ reservation.product.merchant.address }}</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <Phone class="w-4 h-4" />
                    <span>{{ reservation.product.merchant.phone }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Reservation details -->
          <div class="card">
            <h3 class="text-lg font-semibold text-neutral-900 mb-4">
              Détails de la réservation
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="text-sm font-medium text-neutral-700">Quantité réservée</label>
                <p class="text-lg font-semibold text-neutral-900">{{ reservation.quantity }}</p>
              </div>
              <div>
                <label class="text-sm font-medium text-neutral-700">Prix unitaire</label>
                <div class="flex items-center gap-2">
                  <span class="text-lg font-semibold text-primary-600">
                    {{ formatPrice(reservation.discounted_price) }}
                  </span>
                  <span class="text-sm text-neutral-500 line-through">
                    {{ formatPrice(reservation.original_price) }}
                  </span>
                </div>
              </div>
              <div>
                <label class="text-sm font-medium text-neutral-700">Montant total</label>
                <p class="text-xl font-bold text-primary-600">
                  {{ formatPrice(reservation.total_amount) }}
                </p>
              </div>
              <div>
                <label class="text-sm font-medium text-neutral-700">Date de retrait</label>
                <p class="text-lg font-semibold text-neutral-900">
                  {{ formatDate(reservation.pickup_date) }}
                </p>
              </div>
            </div>

            <div v-if="reservation.pickup_notes" class="mt-4 pt-4 border-t border-neutral-200">
              <label class="text-sm font-medium text-neutral-700">Notes de retrait</label>
              <p class="text-neutral-600 mt-1">{{ reservation.pickup_notes }}</p>
            </div>
          </div>

          <!-- Actions -->
          <div class="card" v-if="canPerformActions">
            <h3 class="text-lg font-semibold text-neutral-900 mb-4">
              Actions disponibles
            </h3>
            <div class="flex flex-wrap gap-3">
              <button
                v-if="reservation.status === 'pending'"
                @click="cancelReservation"
                class="btn btn-outline btn-danger"
              >
                <X class="w-4 h-4" />
                Annuler la réservation
              </button>

              <button
                @click="contactMerchant"
                class="btn btn-outline"
              >
                <Phone class="w-4 h-4" />
                Contacter le commerçant
              </button>

              <button
                @click="downloadReceipt"
                class="btn btn-outline"
              >
                <Download class="w-4 h-4" />
                Télécharger le reçu
              </button>
            </div>
          </div>
        </div>

        <!-- Sidebar -->
        <div class="space-y-6">
          <!-- Status timeline -->
          <div class="card">
            <h3 class="text-lg font-semibold text-neutral-900 mb-4">
              Suivi de la réservation
            </h3>
            <div class="space-y-4">
              <div
                v-for="(step, index) in statusSteps"
                :key="index"
                class="flex items-center gap-3"
              >
                <div
                  class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  :class="step.completed ? 'bg-primary-500 text-white' : 'bg-neutral-200 text-neutral-500'"
                >
                  <component :is="step.icon" class="w-4 h-4" />
                </div>
                <div class="flex-1">
                  <p
                    class="font-medium"
                    :class="step.completed ? 'text-neutral-900' : 'text-neutral-500'"
                  >
                    {{ step.title }}
                  </p>
                  <p class="text-sm text-neutral-500">{{ step.description }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Savings summary -->
          <div class="card bg-gradient-to-r from-accent-orange to-accent-orange/90 text-white">
            <div class="flex items-center gap-3 mb-4">
              <div class="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <DollarSign class="w-6 h-6" />
              </div>
              <div>
                <h3 class="font-semibold">Vos économies</h3>
                <p class="text-sm opacity-90">Sur cette réservation</p>
              </div>
            </div>
            <div class="space-y-2">
              <div class="flex justify-between items-center">
                <span class="text-sm">Prix original</span>
                <span>{{ formatPrice(reservation.original_price * reservation.quantity) }}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-sm">Prix payé</span>
                <span>{{ formatPrice(reservation.total_amount) }}</span>
              </div>
              <div class="border-t border-white/20 pt-2">
                <div class="flex justify-between items-center">
                  <span class="font-semibold">Économisé</span>
                  <span class="font-bold text-lg">
                    {{ formatPrice((reservation.original_price * reservation.quantity) - reservation.total_amount) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
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

const getStatusClass = (status: string) => {
  const classes = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    ready: 'bg-green-100 text-green-800',
    completed: 'bg-primary-100 text-primary-800',
    cancelled: 'bg-red-100 text-red-800',
    expired: 'bg-neutral-100 text-neutral-800'
  }
  return classes[status as keyof typeof classes] || 'bg-neutral-100 text-neutral-800'
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
  // TODO: Implement receipt download
  console.log('Téléchargement du reçu...')
}

onMounted(() => {
  loadReservation()
})
</script>