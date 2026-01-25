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
            <h1 class="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Suivi de livraison</h1>
            <p class="text-sm text-neutral-600 dark:text-neutral-400">
              Suivez en temps réel l'avancement de votre livraison.
            </p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            :disabled="loading"
            @click="refresh"
          >
            <RefreshCw class="h-4 w-4" :class="{ 'animate-spin': loading }" />
            Actualiser
          </Button>
          <Badge v-if="delivery" variant="info" size="sm">
            {{ statusLabel(delivery.status) }}
          </Badge>
        </div>
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
          <h2 class="mt-4 text-lg font-semibold text-neutral-900 dark:text-neutral-100">Suivi indisponible</h2>
          <p class="text-sm text-neutral-600 dark:text-neutral-400 mt-2">{{ error }}</p>
          <Button class="mt-4" @click="refresh">Réessayer</Button>
        </Card>
      </div>

      <div v-else class="mt-6 grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div class="space-y-6">
          <Card>
            <template #header>
              <h2 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Progression</h2>
            </template>
            <div class="space-y-4">
              <div
                v-for="step in timeline"
                :key="step.key"
                class="flex items-start gap-4"
              >
                <div
                  class="mt-1 flex h-8 w-8 items-center justify-center rounded-full"
                  :class="step.completed ? 'bg-primary-500 text-white' : 'bg-neutral-200 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400'"
                >
                  <component :is="step.icon" class="h-4 w-4" />
                </div>
                <div class="flex-1">
                  <p class="font-semibold text-neutral-900 dark:text-neutral-100">{{ step.label }}</p>
                  <p class="text-sm text-neutral-600 dark:text-neutral-400">{{ step.description }}</p>
                </div>
              </div>
            </div>
          </Card>

          <Card v-if="delivery">
            <template #header>
              <h2 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Détails de livraison</h2>
            </template>
            <div class="space-y-4 text-sm text-neutral-600 dark:text-neutral-400">
              <div class="flex items-center justify-between">
                <span>Code livraison</span>
                <span class="font-semibold text-neutral-900 dark:text-neutral-100">{{ delivery.delivery_code || delivery.id }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span>Frais</span>
                <span class="font-semibold text-neutral-900 dark:text-neutral-100">{{ formatPrice(delivery.delivery_fee || 0) }}</span>
              </div>
              <div class="flex items-start justify-between gap-4">
                <span>Adresse de livraison</span>
                <span class="text-right text-neutral-900 dark:text-neutral-100">{{ delivery.delivery_address }}</span>
              </div>
              <div class="flex items-start justify-between gap-4">
                <span>Adresse de retrait</span>
                <span class="text-right text-neutral-900 dark:text-neutral-100">{{ delivery.pickup_address }}</span>
              </div>
            </div>
          </Card>

          <Card v-if="delivery && delivery.status === 'delivered' && !delivery.consumer_rating">
            <template #header>
              <h2 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Votre avis</h2>
            </template>
            <p class="text-sm text-neutral-600 dark:text-neutral-400">
              Votre livreur a terminé la livraison. Donnez une note pour améliorer le service.
            </p>
            <Button class="mt-4" @click="router.push({ name: 'delivery-rating', params: { deliveryId: delivery.id } })">
              Noter la livraison
            </Button>
          </Card>
        </div>

        <div class="space-y-6">
          <Card v-if="delivery?.driver">
            <template #header>
              <h2 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Votre livreur</h2>
            </template>
            <div class="space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
              <p class="font-semibold text-neutral-900 dark:text-neutral-100">
                {{ delivery.driver.user?.first_name }} {{ delivery.driver.user?.last_name }}
              </p>
              <p>Véhicule : {{ vehicleLabel(delivery.driver.vehicle_type) }}</p>
              <p v-if="delivery.driver.user?.phone">Téléphone : {{ delivery.driver.user.phone }}</p>
              <p v-if="delivery.driver.rating">Note moyenne : {{ delivery.driver.rating.toFixed(1) }}/5</p>
            </div>
          </Card>

          <Card>
            <template #header>
              <h2 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Position</h2>
            </template>
            <div class="space-y-3 text-sm text-neutral-600 dark:text-neutral-400">
              <div v-if="driverPosition">
                <p>Latitude : {{ driverPosition.latitude }}</p>
                <p>Longitude : {{ driverPosition.longitude }}</p>
                <p v-if="driverPosition.updated_at">Mise à jour : {{ formatDate(driverPosition.updated_at) }}</p>
              </div>
              <p v-else>Aucune position disponible pour le moment.</p>
            </div>
          </Card>

          <Card v-if="delivery?.can_cancel && !isFinalStatus">
            <template #header>
              <h2 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Annulation</h2>
            </template>
            <p class="text-sm text-neutral-600 dark:text-neutral-400">
              Vous pouvez annuler la livraison tant qu'elle n'a pas démarré.
            </p>
            <Button variant="destructive" class="mt-4" @click="handleCancel">
              Annuler la livraison
            </Button>
          </Card>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { AlertCircle, ArrowLeft, CheckCircle2, MapPin, Package, RefreshCw, Truck } from 'lucide-vue-next'
import { deliveryService } from '@/services/deliveryService'
import { notify } from '@/composables/useNotifications'
import { formatPrice } from '@/utils/currency'
import type { Delivery, DeliveryTrackingResponse, DeliveryLocation } from '@/types'
import { Badge, Button, Card } from '@/components/ui/2025'

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const error = ref<string | null>(null)
const delivery = ref<Delivery | null>(null)
const driverPosition = ref<DeliveryLocation | null>(null)

let refreshInterval: ReturnType<typeof setInterval> | null = null

const statusOrder = ['pending', 'searching', 'assigned', 'picking_up', 'picked_up', 'delivering', 'delivered']

const isFinalStatus = computed(() => {
  return ['delivered', 'cancelled', 'failed'].includes(delivery.value?.status ?? '')
})

const timeline = computed(() => {
  const currentStatus = delivery.value?.status
  let currentIndex = statusOrder.indexOf(currentStatus || '')
  if (currentIndex === -1 && ['cancelled', 'failed'].includes(currentStatus || '')) {
    currentIndex = statusOrder.length
  }

  const steps = [
    {
      key: 'pending',
      label: 'Demande enregistrée',
      description: 'Nous recherchons un livreur.',
      icon: Package
    },
    {
      key: 'assigned',
      label: 'Livreur assigné',
      description: 'Un livreur s’est positionné pour la livraison.',
      icon: Truck
    },
    {
      key: 'picking_up',
      label: 'Collecte en cours',
      description: 'Le livreur se rend chez le commerçant.',
      icon: MapPin
    },
    {
      key: 'delivering',
      label: 'Livraison en cours',
      description: 'Le colis est en route vers vous.',
      icon: Truck
    },
    {
      key: 'delivered',
      label: 'Livrée',
      description: 'Livraison terminée. Merci !',
      icon: CheckCircle2
    }
  ]

  return steps.map(step => ({
    ...step,
    completed: currentIndex >= statusOrder.indexOf(step.key)
  }))
})

const statusLabel = (status: string) => {
  const labels: Record<string, string> = {
    pending: 'En attente',
    searching: 'Recherche livreur',
    assigned: 'Assignée',
    picking_up: 'Collecte en cours',
    picked_up: 'Colis récupéré',
    delivering: 'En livraison',
    delivered: 'Livrée',
    cancelled: 'Annulée',
    failed: 'Échouée'
  }
  return labels[status] || status
}

const vehicleLabel = (type?: string) => {
  const labels: Record<string, string> = {
    moto: 'Moto',
    velo: 'Vélo',
    voiture: 'Voiture',
    pied: 'À pied'
  }
  if (!type) return 'Non renseigné'
  return labels[type] || type
}

const formatDate = (dateString: string) => {
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(dateString))
}

const refresh = async () => {
  const deliveryId = Number(route.params.deliveryId)
  if (Number.isNaN(deliveryId)) {
    error.value = 'Identifiant de livraison invalide.'
    loading.value = false
    return
  }

  loading.value = true
  error.value = null

  try {
    const response = await deliveryService.trackDelivery(deliveryId)
    const data = response.data as DeliveryTrackingResponse
    delivery.value = data.delivery
    driverPosition.value = data.driver_position || null
  } catch (err: any) {
    const message = err?.message || 'Impossible de charger le suivi.'
    error.value = message
    notify.error(message)
  } finally {
    loading.value = false
  }
}

const handleCancel = async () => {
  if (!delivery.value) return
  const reason = window.prompt('Pourquoi souhaitez-vous annuler la livraison ?')
  if (!reason) return

  try {
    const response = await deliveryService.cancelDelivery(delivery.value.id, reason)
    delivery.value = response.data
    notify.success('Livraison annulée')
  } catch (err: any) {
    notify.error(err?.message || 'Impossible d’annuler la livraison.')
  }
}

onMounted(async () => {
  await refresh()

  refreshInterval = setInterval(() => {
    if (!isFinalStatus.value) {
      refresh()
    }
  }, 10000)
})

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
})
</script>
