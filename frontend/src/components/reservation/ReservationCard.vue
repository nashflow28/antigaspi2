<template>
  <Card class="hover:transition-all duration-300">
    <!-- En-tête avec statut -->
    <div class="flex items-center justify-start sm:justify-between mt-3">
      <div class="flex items-center gap-3">
        <div class="h-6 w-6 bg-primary-100 rounded flex items-center justify-center">
          <ShoppingBag class="h-4 w-4 text-primary-600" />
        </div>
        <div>
          <div class="font-medium text-neutral-900">{{ reservation.reservation_code }}</div>
          <div class="text-sm text-neutral-500">
            {{ formatDate(reservation.created_at) }}
          </div>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <Badge
          size="xs"
          :class="statusClasses[reservation.status]"
        >
          {{ statusLabels[reservation.status] }}
        </Badge>
        <Badge
          v-if="paymentStatus"
          size="xs"
          :class="paymentStatusClasses[paymentStatus]"
        >
          Paiement : {{ paymentStatusLabels[paymentStatus] }}
        </Badge>

        <!-- Menu d'actions -->
        <div v-if="!isExpiredOrCancelled" class="relative">
          <Button
            variant="ghost"
            size="sm"
            class="p-2"
            :left-icon="MoreVertical"
            @click="showActions = !showActions"
          />

          <div
            v-if="showActions"
            v-click-outside="() => showActions = false"
            class="relative sm:absolute right-0 top-10 bg-white border border-neutral-200 rounded shadow-lg z-10 py-3 min-w-[150px]"
          >
            <button
              class="w-full px-3 py-3 text-left text-sm hover:bg-neutral-50 flex items-center gap-2"
              @click="$emit('view', reservation.id); showActions = false"
            >
              <Eye class="h-4 w-4" />
              Voir détails
            </button>
            <button
              v-if="reservation.product.merchant.phone"
              class="w-full px-3 py-3 text-left text-sm hover:bg-neutral-50 flex items-center gap-2"
              @click="$emit('contact', reservation); showActions = false"
            >
              <Phone class="h-4 w-4" />
              Contacter
            </button>
            <button
              v-if="canCancel"
              class="w-full px-3 py-3 text-left text-sm hover:bg-neutral-50 text-red-600 flex items-center gap-2"
              @click="$emit('cancel', reservation.id); showActions = false"
            >
              <X class="h-4 w-4" />
              Annuler
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Contenu principal -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6">
      <!-- Informations produit -->
      <div>
        <div class="flex items-stretch sm:items-start gap-3">
          <!-- Image du produit -->
          <div class="w-12 h-10 bg-gradient-to-br from-primary-100 to-primary-500/10 rounded flex items-center justify-center flex-shrink-0">
            <Package class="h-6 w-6 text-primary-400" />
          </div>

          <!-- Détails produit -->
          <div class="flex-1 min-w-none">
            <h4 class="font-semibold text-neutral-900 mb-1 line-clamp-2">
              {{ reservation.product.name }}
            </h4>
            <div class="flex items-center gap-2 text-sm text-neutral-700 mt-2">
              <MapPin class="h-4 w-4 flex-shrink-0" />
              <span class="truncate">{{ reservation.product.merchant.name }}</span>
            </div>
            <div class="text-sm text-neutral-500">
              {{ reservation.product.merchant.address }}
            </div>
          </div>
        </div>

        <!-- Prix et quantité -->
        <div class="mt-4 padding-t-lg border-t border-neutral-100">
          <div class="flex items-center justify-start sm:justify-between text-sm">
            <div class="flex items-center gap-2">
              <span class="text-neutral-700">Quantité:</span>
              <span class="font-medium">{{ reservation.quantity }}</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-lg font-semibold text-primary-600">
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
          <!-- Informations paiement -->
          <div v-if="paymentStatus" class="bg-primary-50 rounded p-3 border border-primary-100">
            <div class="flex items-center justify-start sm:justify-between mt-2">
              <span class="text-sm font-medium text-primary-900">Paiement</span>
              <span class="text-sm font-semibold text-primary-800">
                {{ paymentStatusLabels[paymentStatus] }}
              </span>
            </div>
            <div v-if="latestPayment" class="space-y-4 text-xs text-primary-900">
              <div class="flex items-center justify-start sm:justify-between">
                <span>Méthode</span>
                <span class="font-medium">{{ paymentMethodLabels[latestPayment.payment_method] }}</span>
              </div>
              <div class="flex items-center justify-start sm:justify-between">
                <span>Montant</span>
                <span class="font-semibold">{{ formatPrice(latestPayment.amount || reservation.discounted_price * reservation.quantity) }}</span>
              </div>
              <div v-if="latestPayment.customer_phone" class="flex items-center justify-start sm:justify-between">
                <span>Téléphone</span>
                <span class="font-medium">{{ latestPayment.customer_phone }}</span>
              </div>
              <div v-if="latestPayment.reference" class="flex items-center justify-start sm:justify-between">
                <span>Référence</span>
                <span class="font-medium">{{ latestPayment.reference }}</span>
              </div>
            </div>
            <div v-else class="text-xs text-primary-900">
              Paiement en cours de synchronisation…
            </div>
          </div>

          <!-- Date et heure de retrait -->
          <div class="flex items-center gap-3">
            <div class="h-6 w-6 bg-primary-500/10 rounded flex items-center justify-center">
              <Clock class="h-4 w-4 text-primary-500" />
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
          <div v-if="reservation.pickup_notes" class="flex items-stretch sm:items-start gap-3">
            <div class="h-6 w-6 bg-orange-500/10 rounded flex items-center justify-center flex-shrink-0">
              <MessageCircle class="h-4 w-4 text-orange-500" />
            </div>
            <div class="text-sm text-neutral-700">
              {{ reservation.pickup_notes }}
            </div>
          </div>

          <!-- Countdown ou statut -->
          <div v-if="reservation.status !== 'completed' && reservation.status !== 'cancelled' && reservation.status !== 'expired'">
            <div class="bg-neutral-50 rounded p-3">
              <div class="flex items-center justify-start sm:justify-between">
                <span class="text-sm font-medium text-neutral-800">
                  {{ getStatusMessage() }}
                </span>
                <span v-if="timeLeft && timeLeft.total > 0" class="text-sm font-semibold text-orange-500">
                  {{ formatTimeLeft() }}
                </span>
              </div>

              <!-- Barre de progression pour le temps restant -->
              <div v-if="timeLeft && timeLeft.total > 0" class="mt-2 w-full bg-neutral-200 rounded-full h-3">
                <div
                  class="bg-orange-500 h-3 rounded-full transition-all duration-300"
                  :style="{ width: `${Math.max(0, Math.min(100, (timeLeft.total / (24 * 60 * 60 * 1000)) * 100))}%` }"
                />
              </div>
            </div>
          </div>

          <!-- Impact environnemental -->
          <div v-if="reservation.status === 'completed'" class="bg-primary-50 rounded p-3">
            <div class="flex items-center gap-2 mt-2">
              <Leaf class="h-4 w-4 text-primary-600" />
              <span class="text-sm font-medium text-primary-800">Impact positif</span>
            </div>
            <div class="grid grid-cols-2 gap-3 text-xs">
              <div class="text-primary-900">
                <div class="font-semibold">{{ reservation.quantity }}kg</div>
                <div>Nourriture sauvée</div>
              </div>
              <div class="text-primary-900">
                <div class="font-semibold">{{ (reservation.quantity * 2.5).toFixed(1) }}kg</div>
                <div>CO₂ évité</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Actions en bas -->
    <div v-if="!isExpiredOrCancelled" class="flex items-center justify-start sm:justify-between mt-6 padding-t-lg border-t border-neutral-100">
      <div class="flex items-center gap-2">
        <Button
          v-if="reservation.product.merchant.phone"
          variant="ghost"
          size="sm"
          :left-icon="Phone"
          @click="$emit('contact', reservation)"
        >
          Contacter
        </Button>
        <Button
          variant="outline"
          size="sm"
          :left-icon="Eye"
          @click="$emit('view', reservation.id)"
        >
          Détails
        </Button>
      </div>

      <Button
        v-if="canCancel"
        variant="ghost"
        size="sm"
        class="text-red-600 hover:bg-red-600/10"
        :left-icon="X"
        @click="$emit('cancel', reservation.id)"
      >
        Annuler
      </Button>
    </div>
  </Card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { formatPrice } from '@/utils/currency'
import {
  Clock, Eye, Leaf, MapPin, MessageCircle, MoreVertical,
  Package, Phone, ShoppingBag, X
} from 'lucide-vue-next'
import type { Reservation } from '@/types'
import Card from '@/components/ui/2025/Card.vue'
import Button from '@/components/ui/2025/Button.vue'
import Badge from '@/components/ui/2025/Badge.vue'

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
  pending: 'bg-orange-500/15 text-orange-500/95',
  confirmed: 'bg-primary-500/10 text-primary-500/95',
  ready: 'bg-primary-100 text-primary-800',
  completed: 'bg-primary-100 text-primary-800',
  cancelled: 'bg-neutral-100 text-neutral-700',
  expired: 'bg-red-600/15 text-red-600/95'
}

const statusLabels = {
  pending: 'En attente',
  confirmed: 'Confirmée',
  ready: 'Prête',
  completed: 'Récupérée',
  cancelled: 'Annulée',
  expired: 'Expirée'
}

const paymentStatusClasses = {
  pending: 'bg-orange-500/15 text-orange-500/95',
  success: 'bg-primary-100 text-primary-800',
  failed: 'bg-red-600/15 text-red-600/95',
  on_site: 'bg-primary-500/10 text-primary-500/95',
  refunded: 'bg-neutral-100 text-neutral-800'
} as const

const paymentStatusLabels = {
  pending: 'En attente',
  success: 'Payé',
  failed: 'Échec',
  on_site: 'Sur place',
  refunded: 'Remboursé'
} as const

const paymentMethodLabels = {
  flooz: 'Flooz (Moov Togo)',
  tmoney: 'Mixx by Yas',
  orange_money: 'Orange Money',
  mtn_momo: 'MTN MoMo',
  paystack: 'Paystack',
  on_site: 'Paiement sur place',
  wallet: 'Portefeuille électronique'
} as const

// Calculs

const isExpiredOrCancelled = computed(() =>
  ['expired', 'cancelled'].includes(props.reservation.status)
)

const canCancel = computed(() =>
  ['pending', 'confirmed'].includes(props.reservation.status)
)

const latestPayment = computed(() => props.reservation.latest_payment ?? null)
const paymentStatus = computed(() => props.reservation.payment_status ?? latestPayment.value?.status ?? null)

// Calcul du temps restant
const updateTimeLeft = () => {
  if (!props.reservation.pickup_date) {
    timeLeft.value = null
    return
  }
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

const formatDate = (date: Date | string | undefined) => {
  if (!date) return 'Non définie'
  const d = new Date(date)
  return d.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

const formatPickupDate = (date: Date | string | undefined) => {
  if (!date) return 'Non définie'
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

const formatPickupTime = (date: Date | string | undefined) => {
  if (!date) return 'Non définie'; return new Date(date).toLocaleTimeString('fr-FR', {
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
