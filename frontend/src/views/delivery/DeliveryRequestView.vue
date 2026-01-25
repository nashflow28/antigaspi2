<template>
  <div class="min-h-screen bg-gradient-to-br from-surface-light via-neutral-50 to-primary-50 dark:from-surface-dark dark:via-neutral-900 dark:to-surface-darker">
    <div class="container px-3 py-6 sm:py-8">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex items-center gap-3">
          <Button variant="ghost" size="sm" @click="router.back()">
            <ArrowLeft class="h-4 w-4" />
            Retour
          </Button>
          <div>
            <h1 class="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Demander une livraison</h1>
            <p class="text-sm text-neutral-600 dark:text-neutral-400">
              Renseignez votre adresse pour recevoir votre commande à domicile.
            </p>
          </div>
        </div>
        <Badge v-if="reservation" variant="outline" size="sm">
          Réservation {{ reservation.reservation_code }}
        </Badge>
      </div>

      <div v-if="loading" class="mt-6">
        <Card class="animate-pulse">
          <div class="h-6 bg-neutral-200 dark:bg-neutral-700 rounded w-1/3 mb-4" />
          <div class="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-2/3" />
        </Card>
      </div>

      <div v-else-if="error" class="mt-6">
        <Card class="text-center">
          <div class="mx-auto mt-3 h-12 w-12 rounded-full bg-accent-red/10 flex items-center justify-center">
            <AlertCircle class="h-6 w-6 text-accent-red" />
          </div>
          <h2 class="mt-4 text-lg font-semibold text-neutral-900 dark:text-neutral-100">Impossible de charger la réservation</h2>
          <p class="text-sm text-neutral-600 dark:text-neutral-400 mt-2">{{ error }}</p>
          <Button class="mt-4" @click="loadReservation">
            Réessayer
          </Button>
        </Card>
      </div>

      <div v-else class="mt-6 grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div class="space-y-6">
          <Card>
            <template #header>
              <h2 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Résumé de la réservation</h2>
            </template>
            <div class="flex items-start gap-4">
              <div class="h-16 w-16 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                <Package class="h-6 w-6 text-neutral-400" />
              </div>
              <div class="flex-1">
                <p class="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                  {{ reservation?.product.name }}
                </p>
                <p class="text-sm text-neutral-600 dark:text-neutral-400">
                  {{ reservation?.product.merchant.name }} • {{ reservation?.product.merchant.address }}
                </p>
                <div class="mt-3 flex flex-wrap gap-3 text-sm text-neutral-500 dark:text-neutral-400">
                  <span>Quantité : {{ reservation?.quantity }}</span>
                  <span>Montant : {{ formatPrice(reservation?.total_amount ?? 0) }}</span>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <template #header>
              <div class="flex items-center justify-between">
                <h2 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Adresse de livraison</h2>
                <Badge v-if="availabilityChecked" :variant="availabilityOk ? 'success' : 'error'" size="sm">
                  {{ availabilityOk ? 'Zone couverte' : 'Zone non couverte' }}
                </Badge>
              </div>
            </template>

            <div class="grid gap-4">
              <Input
                v-model="form.address"
                label="Adresse complète"
                placeholder="Ex : 12 rue des marchés, Lomé"
              />
              <div class="grid gap-4 md:grid-cols-2">
                <Input
                  v-model="form.latitude"
                  type="number"
                  label="Latitude"
                  placeholder="Ex : 6.1725"
                  step="0.0001"
                />
                <Input
                  v-model="form.longitude"
                  type="number"
                  label="Longitude"
                  placeholder="Ex : 1.2314"
                  step="0.0001"
                />
              </div>
              <div class="grid gap-4 md:grid-cols-2">
                <Input
                  v-model="form.recipientName"
                  label="Nom du destinataire"
                  placeholder="Ex : Kossi Awesso"
                />
                <Input
                  v-model="form.recipientPhone"
                  label="Téléphone"
                  placeholder="Ex : +228 90 12 34 56"
                />
              </div>
              <div class="grid gap-4 md:grid-cols-2">
                <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Instructions de livraison
                  <textarea
                    v-model="form.instructions"
                    rows="3"
                    class="mt-2 w-full rounded-xl border border-neutral-200 bg-white px-3 py-3 text-sm text-neutral-900 shadow-inner transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-50"
                    placeholder="Ex : Appelez avant d'arriver"
                  />
                </label>
                <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Notes additionnelles
                  <textarea
                    v-model="form.notes"
                    rows="3"
                    class="mt-2 w-full rounded-xl border border-neutral-200 bg-white px-3 py-3 text-sm text-neutral-900 shadow-inner transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-50"
                    placeholder="Ex : Laisser au gardien"
                  />
                </label>
              </div>

              <div class="flex flex-wrap items-center gap-3">
                <Button
                  variant="outline"
                  :disabled="!canEstimate || estimateLoading"
                  @click="handleEstimate"
                >
                  <Loader2 v-if="estimateLoading" class="h-4 w-4 animate-spin" />
                  Estimer les frais
                </Button>
                <Button
                  :disabled="!canSubmit"
                  :loading="requestLoading"
                  @click="handleRequest"
                >
                  Demander la livraison
                </Button>
              </div>
            </div>
          </Card>
        </div>

        <div class="space-y-6">
          <Card v-if="estimate">
            <template #header>
              <h2 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Estimation</h2>
            </template>
            <div class="space-y-3 text-sm text-neutral-600 dark:text-neutral-400">
              <div class="flex items-center justify-between">
                <span>Frais de livraison</span>
                <span class="font-semibold text-neutral-900 dark:text-neutral-100">
                  {{ formatPrice(estimate.delivery_fee) }}
                </span>
              </div>
              <div v-if="estimate.distance_km" class="flex items-center justify-between">
                <span>Distance</span>
                <span>{{ estimate.distance_km.toFixed(1) }} km</span>
              </div>
              <div v-if="estimate.estimated_time" class="flex items-center justify-between">
                <span>Temps estimé</span>
                <span>{{ estimate.estimated_time }}</span>
              </div>
              <div v-if="estimate.free_delivery" class="rounded-xl bg-primary-50 px-3 py-3 text-primary-700">
                {{ estimate.free_delivery_message || 'Livraison gratuite sur cette commande !' }}
              </div>
            </div>
          </Card>

          <Card v-if="existingDelivery">
            <template #header>
              <h2 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Livraison existante</h2>
            </template>
            <p class="text-sm text-neutral-600 dark:text-neutral-400">
              Une livraison est déjà associée à cette réservation.
            </p>
            <div class="mt-4 flex items-center justify-between">
              <Badge variant="info" size="sm">
                {{ statusLabel(existingDelivery.status) }}
              </Badge>
              <Button size="sm" @click="router.push({ name: 'delivery-tracking', params: { deliveryId: existingDelivery.id } })">
                Suivre
              </Button>
            </div>
          </Card>

          <Card>
            <template #header>
              <h2 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Conseils</h2>
            </template>
            <ul class="space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
              <li>• Assurez-vous que votre téléphone est joignable pendant la livraison.</li>
              <li>• Les frais varient selon la distance et la disponibilité des livreurs.</li>
              <li>• Vous pouvez annuler tant que la livraison n'a pas démarré.</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { AlertCircle, ArrowLeft, Loader2, Package } from 'lucide-vue-next'
import { formatPrice } from '@/utils/currency'
import { notify } from '@/composables/useNotifications'
import { deliveryService } from '@/services/deliveryService'
import { apiService } from '@/services/api'
import type { Delivery, Reservation } from '@/types'
import { Button, Card, Badge, Input } from '@/components/ui/2025'

interface DeliveryEstimateResult {
  delivery_fee: number
  driver_commission?: number
  platform_commission?: number
  estimated_time?: string | null
  distance_km?: number
  surge_multiplier?: number
  free_delivery?: boolean
  free_delivery_message?: string
}

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const error = ref<string | null>(null)
const reservation = ref<Reservation | null>(null)
const estimate = ref<DeliveryEstimateResult | null>(null)
const estimateLoading = ref(false)
const requestLoading = ref(false)
const existingDelivery = ref<Delivery | null>(null)
const availabilityChecked = ref(false)
const availabilityOk = ref(false)

const form = reactive({
  address: '',
  latitude: '',
  longitude: '',
  instructions: '',
  notes: '',
  recipientName: '',
  recipientPhone: ''
})

const canEstimate = computed(() => {
  return Boolean(form.latitude && form.longitude && reservation.value)
})

const canSubmit = computed(() => {
  if (!reservation.value) return false
  if (!['pending', 'confirmed'].includes(reservation.value.status)) return false
  if (!form.address.trim()) return false
  if (!form.latitude || !form.longitude) return false
  if (availabilityChecked.value && !availabilityOk.value) return false
  if (existingDelivery.value) return false
  return !requestLoading.value
})

const parseCoordinate = (value: string) => {
  const parsed = Number.parseFloat(value)
  return Number.isNaN(parsed) ? null : parsed
}

const statusLabel = (status: string) => {
  const labels: Record<string, string> = {
    pending: 'En attente',
    searching: 'Recherche livreur',
    assigned: 'Assignée',
    picking_up: 'En cours de collecte',
    picked_up: 'Colis récupéré',
    delivering: 'En livraison',
    delivered: 'Livrée',
    cancelled: 'Annulée',
    failed: 'Échouée'
  }
  return labels[status] || status
}

const loadReservation = async () => {
  const reservationId = Number(route.params.reservationId)
  if (Number.isNaN(reservationId)) {
    error.value = 'Identifiant de réservation invalide.'
    loading.value = false
    return
  }

  loading.value = true
  error.value = null

  try {
    const response = await apiService.getReservation(reservationId)
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Réservation introuvable')
    }
    reservation.value = response.data as Reservation
    await checkExistingDelivery(reservationId)
  } catch (err: any) {
    const message = err?.message || 'Erreur lors du chargement de la réservation'
    error.value = message
    notify.error(message)
  } finally {
    loading.value = false
  }
}

const checkExistingDelivery = async (reservationId: number) => {
  try {
    const response = await deliveryService.getHistory()
    const deliveries = Array.isArray(response.data)
      ? response.data
      : (response.data as any)?.data || []

    const match = deliveries.find((delivery: Delivery) => delivery.reservation_id === reservationId)
    if (match) {
      existingDelivery.value = match
    }
  } catch (err) {
    // Silently ignore if history cannot be loaded
  }
}

const handleEstimate = async () => {
  const lat = parseCoordinate(form.latitude)
  const lng = parseCoordinate(form.longitude)

  if (!reservation.value || lat === null || lng === null) {
    notify.warning('Veuillez saisir des coordonnées valides.')
    return
  }

  estimateLoading.value = true
  try {
    const availability = await deliveryService.checkAvailability({
      delivery_latitude: lat,
      delivery_longitude: lng
    })
    availabilityChecked.value = true
    availabilityOk.value = availability.data.available

    if (!availability.data.available) {
      notify.warning('La livraison n’est pas disponible pour cette zone.')
      return
    }

    const response = await deliveryService.estimate(reservation.value.id, {
      delivery_latitude: lat,
      delivery_longitude: lng
    })
    estimate.value = response.data
  } catch (err: any) {
    notify.error(err?.message || 'Impossible d’obtenir une estimation.')
  } finally {
    estimateLoading.value = false
  }
}

const handleRequest = async () => {
  if (!reservation.value) return

  const lat = parseCoordinate(form.latitude)
  const lng = parseCoordinate(form.longitude)

  if (lat === null || lng === null) {
    notify.warning('Veuillez saisir des coordonnées valides.')
    return
  }

  requestLoading.value = true
  try {
    const response = await deliveryService.requestDelivery(reservation.value.id, {
      delivery_address: form.address.trim(),
      delivery_latitude: lat,
      delivery_longitude: lng,
      delivery_notes: form.notes.trim() || undefined,
      delivery_instructions: form.instructions.trim() || undefined,
      recipient_name: form.recipientName.trim() || undefined,
      recipient_phone: form.recipientPhone.trim() || undefined
    })

    notify.success(response.message || 'Livraison demandée avec succès.')
    router.push({
      name: 'delivery-tracking',
      params: { deliveryId: response.data.id }
    })
  } catch (err: any) {
    notify.error(err?.message || 'Impossible de demander la livraison.')
  } finally {
    requestLoading.value = false
  }
}

onMounted(() => {
  loadReservation()
})
</script>
