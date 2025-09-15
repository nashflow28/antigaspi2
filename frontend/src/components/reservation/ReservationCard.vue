<template>
  <div class="card hover:shadow-medium transition-all duration-300">
    <!-- En-tête avec statut -->
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
          <ShoppingBag class="w-5 h-5 text-primary-600" />
        </div>
        <div>
          <div class="font-medium text-neutral-900">{{ reservation.reservation_code }}</div>
          <div class="text-sm text-neutral-500">
            {{ formatDate(reservation.created_at) }}
          </div>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <span
          class="badge text-xs font-medium px-2 py-1 rounded-full"
          :class="statusClasses[reservation.status]"
        >
          {{ statusLabels[reservation.status] }}
        </span>

        <!-- Menu d'actions -->
        <div class="relative" v-if="!isExpiredOrCancelled">
          <button
            @click="showActions = !showActions"
            class="btn btn-ghost btn-sm p-2"
          >
            <MoreVertical class="w-4 h-4" />
          </button>

          <div
            v-if="showActions"
            v-click-outside="() => showActions = false"
            class="absolute right-0 top-10 bg-white border border-neutral-200 rounded-xl shadow-medium z-10 py-2 min-w-[150px]"
          >
            <button
              @click="$emit('view', reservation.id); showActions = false"
              class="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
            >
              <Eye class="w-4 h-4" />
              Voir détails
            </button>
            <button
              v-if="reservation.product.merchant.phone"
              @click="$emit('contact', reservation); showActions = false"
              class="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
            >
              <Phone class="w-4 h-4" />
              Contacter
            </button>
            <button
              v-if="canCancel"
              @click="$emit('cancel', reservation.id); showActions = false"
              class="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 text-error-600 flex items-center gap-2"
            >
              <X class="w-4 h-4" />
              Annuler
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Contenu principal -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Informations produit -->
      <div>
        <div class="flex items-start gap-4">
          <!-- Image du produit -->
          <div class="w-16 h-16 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <Package class="w-8 h-8 text-primary-400" />
          </div>

          <!-- Détails produit -->
          <div class="flex-1 min-w-0">
            <h4 class="font-semibold text-neutral-900 mb-1 line-clamp-2">
              {{ reservation.product.name }}
            </h4>
            <div class="flex items-center gap-2 text-sm text-neutral-600 mb-2">
              <MapPin class="w-4 h-4 flex-shrink-0" />
              <span class="truncate">{{ reservation.product.merchant.name }}</span>
            </div>
            <div class="text-sm text-neutral-500">
              {{ reservation.product.merchant.address }}
            </div>
          </div>
        </div>

        <!-- Prix et quantité -->
        <div class="mt-4 pt-4 border-t border-neutral-100">
          <div class="flex items-center justify-between text-sm">
            <div class="flex items-center gap-2">
              <span class="text-neutral-600">Quantité:</span>
              <span class="font-medium">{{ reservation.quantity }}</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-lg font-bold text-primary-600">
                {{ formatPrice(reservation.discounted_price * reservation.quantity) }}
              </span>
              <span class="text-sm text-neutral-400 line-through">
                {{ formatPrice(reservation.original_price * reservation.quantity) }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Informations de retrait -->
      <div>
        <div class="space-y-4">
          <!-- Date et heure de retrait -->
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 bg-secondary-100 rounded-lg flex items-center justify-center">
              <Clock class="w-4 h-4 text-secondary-600" />
            </div>
            <div>
              <div class="font-medium text-neutral-900">
                {{ formatPickupDate(reservation.pickup_date) }}
              </div>
              <div class="text-sm text-neutral-500">
                {{ formatPickupTime(reservation.pickup_date) }}
              </div>
            </div>
          </div>

          <!-- Notes de retrait -->
          <div v-if="reservation.pickup_notes" class="flex items-start gap-3">
            <div class="w-8 h-8 bg-accent-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <MessageCircle class="w-4 h-4 text-accent-600" />
            </div>
            <div class="text-sm text-neutral-600">
              {{ reservation.pickup_notes }}
            </div>
          </div>

          <!-- Countdown ou statut -->
          <div v-if="reservation.status !== 'completed' && reservation.status !== 'cancelled' && reservation.status !== 'expired'">
            <div class="bg-gray-50 rounded-xl p-3">
              <div class="flex items-center justify-between">
                <span class="text-sm font-medium text-neutral-700">
                  {{ getStatusMessage() }}
                </span>
                <span v-if="timeLeft && timeLeft.total > 0" class="text-sm font-bold text-accent-600">
                  {{ formatTimeLeft() }}
                </span>
              </div>

              <!-- Barre de progression pour le temps restant -->
              <div v-if="timeLeft && timeLeft.total > 0" class="mt-2 w-full bg-neutral-200 rounded-full h-1">
                <div
                  class="bg-accent-500 h-1 rounded-full transition-all duration-300"
                  :style="{ width: `${Math.max(0, Math.min(100, (timeLeft.total / (24 * 60 * 60 * 1000)) * 100))}%` }"
                ></div>
              </div>
            </div>
          </div>

          <!-- Impact environnemental -->
          <div v-if="reservation.status === 'completed'" class="bg-success-50 rounded-xl p-3">
            <div class="flex items-center gap-2 mb-2">
              <Leaf class="w-4 h-4 text-success-600" />
              <span class="text-sm font-medium text-success-800">Impact positif</span>
            </div>
            <div class="grid grid-cols-2 gap-4 text-xs">
              <div class="text-success-700">
                <div class="font-semibold">{{ reservation.quantity }}kg</div>
                <div>Nourriture sauvée</div>
              </div>
              <div class="text-success-700">
                <div class="font-semibold">{{ (reservation.quantity * 2.5).toFixed(1) }}kg</div>
                <div>CO₂ évité</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Actions en bas -->
    <div v-if="!isExpiredOrCancelled" class="flex items-center justify-between mt-6 pt-4 border-t border-neutral-100">
      <div class="flex items-center gap-2">
        <button
          v-if="reservation.product.merchant.phone"
          @click="$emit('contact', reservation)"
          class="btn btn-ghost btn-sm"
        >
          <Phone class="w-4 h-4" />
          Contacter
        </button>
        <button
          @click="$emit('view', reservation.id)"
          class="btn btn-outline btn-sm"
        >
          <Eye class="w-4 h-4" />
          Détails
        </button>
      </div>

      <button
        v-if="canCancel"
        @click="$emit('cancel', reservation.id)"
        class="btn btn-ghost btn-sm text-error-600 hover:bg-error-50"
      >
        <X class="w-4 h-4" />
        Annuler
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { formatPrice } from '@/utils/currency'
import {
  Clock, Eye, Leaf, MapPin, MessageCircle, MoreVertical,
  Package, Phone, ShoppingBag, X
} from 'lucide-vue-next'
import type { Reservation } from '@/types'

interface Props {
  reservation: Reservation
  viewMode?: 'list' | 'grid'
}

const props = defineProps<Props>()

defineEmits<{
  cancel: [reservationId: number]
  view: [reservationId: number]
  contact: [reservation: Reservation]
}>()

const showActions = ref(false)
const timeLeft = ref<{
  total: number
  days: number
  hours: number
  minutes: number
} | null>(null)

// Classes de statut
const statusClasses = {
  pending: 'bg-warning-100 text-warning-800',
  confirmed: 'bg-secondary-100 text-secondary-800',
  ready: 'bg-success-100 text-success-800',
  completed: 'bg-primary-100 text-primary-800',
  cancelled: 'bg-neutral-100 text-neutral-600',
  expired: 'bg-error-100 text-error-800'
}

const statusLabels = {
  pending: 'En attente',
  confirmed: 'Confirmée',
  ready: 'Prête',
  completed: 'Récupérée',
  cancelled: 'Annulée',
  expired: 'Expirée'
}

// Calculs

const isExpiredOrCancelled = computed(() =>
  ['expired', 'cancelled'].includes(props.reservation.status)
)

const canCancel = computed(() =>
  ['pending', 'confirmed'].includes(props.reservation.status)
)

// Calcul du temps restant
const updateTimeLeft = () => {
  const now = new Date()
  const pickup = new Date(props.reservation.pickup_date)
  const diff = pickup.getTime() - now.getTime()

  if (diff > 0) {
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

    timeLeft.value = { total: diff, days, hours, minutes }
  } else {
    timeLeft.value = null
  }
}

// Timer pour le temps restant
let interval: ReturnType<typeof setInterval>

onMounted(() => {
  updateTimeLeft()
  interval = setInterval(updateTimeLeft, 60000) // Update every minute
})

onUnmounted(() => {
  if (interval) {
    clearInterval(interval)
  }
})

// Méthodes de formatage

const formatDate = (date: Date | string) => {
  const d = new Date(date)
  return d.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

const formatPickupDate = (date: Date | string) => {
  const d = new Date(date)
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  if (d.toDateString() === today.toDateString()) {
    return 'Aujourd\'hui'
  } else if (d.toDateString() === tomorrow.toDateString()) {
    return 'Demain'
  } else {
    return d.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    })
  }
}

const formatPickupTime = (date: Date | string) => {
  return new Date(date).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatTimeLeft = () => {
  if (!timeLeft.value) return ''

  const { days, hours, minutes } = timeLeft.value

  if (days > 0) {
    return `${days}j ${hours}h`
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`
  } else {
    return `${minutes}m`
  }
}

const getStatusMessage = () => {
  switch (props.reservation.status) {
    case 'pending':
      return 'En attente de confirmation'
    case 'confirmed':
      return 'À récupérer dans'
    case 'ready':
      return 'Prêt à être récupéré'
    default:
      return ''
  }
}

// Click outside directive implementation
const vClickOutside = {
  beforeMount: (el: any, binding: any) => {
    el.clickOutsideEvent = (event: Event) => {
      if (!(el === event.target || el.contains(event.target))) {
        binding.value()
      }
    }
    document.addEventListener('click', el.clickOutsideEvent)
  },
  unmounted: (el: any) => {
    document.removeEventListener('click', el.clickOutsideEvent)
  }
}
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>