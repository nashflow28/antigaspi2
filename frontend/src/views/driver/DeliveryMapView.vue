<template>
  <DashboardLayout
    :sidebar="sidebar"
    :header="header"
    :mobile-nav="mobileNav"
    class="bg-gradient-to-br from-neutral-50 via-sky-50/40 to-primary-50"
  >
    <div class="flex h-[calc(100vh-120px)] flex-col gap-4">
      <!-- Header -->
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-2xl font-semibold text-neutral-900 dark:text-white">
            Carte de livraison
          </h1>
          <p class="text-sm text-neutral-600 dark:text-neutral-400">
            Visualisez votre itinéraire et gérez la livraison en cours.
          </p>
        </div>
        <div class="flex items-center gap-2">
          <Badge v-if="activeDelivery" :variant="statusVariant" size="sm">
            {{ statusLabel }}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            :disabled="loading"
            @click="refresh"
          >
            <RefreshCw class="h-4 w-4" :class="{ 'animate-spin': loading }" />
          </Button>
        </div>
      </div>

      <!-- Main content -->
      <div class="grid flex-1 gap-4 lg:grid-cols-[1fr_350px]">
        <!-- Map -->
        <Card class="relative overflow-hidden">
          <DeliveryMap
            ref="mapRef"
            :pickup-location="pickupLocation"
            :delivery-location="deliveryLocation"
            :driver-location="driverLocation"
            height="100%"
            :show-route="true"
            :show-navigation-buttons="true"
            @location-update="handleLocationUpdate"
          />

          <!-- Map overlays -->
          <div v-if="!activeDelivery && !loading" class="absolute inset-0 flex items-center justify-center bg-white/90 dark:bg-neutral-800/90">
            <EmptyState
              title="Aucune livraison en cours"
              description="Acceptez une livraison pour voir l'itinéraire sur la carte."
              action-label="Voir les livraisons"
              icon="🗺️"
              @action="$router.push('/driver/deliveries/available')"
            />
          </div>
        </Card>

        <!-- Sidebar -->
        <div class="flex flex-col gap-4">
          <!-- Delivery info -->
          <Card v-if="activeDelivery">
            <template #header>
              <div class="flex items-center justify-between">
                <h2 class="font-semibold text-neutral-900 dark:text-white">
                  Livraison #{{ activeDelivery.delivery_code || activeDelivery.id }}
                </h2>
                <Badge :variant="statusVariant" size="sm">
                  {{ statusLabel }}
                </Badge>
              </div>
            </template>

            <div class="space-y-4">
              <!-- Product info -->
              <div class="flex items-start gap-3 rounded-lg bg-neutral-50 p-3 dark:bg-neutral-800">
                <Package class="mt-0.5 h-5 w-5 text-primary-500" />
                <div>
                  <p class="font-medium text-neutral-900 dark:text-white">
                    {{ activeDelivery.reservation?.product?.name || 'Commande GÊLADAL' }}
                  </p>
                  <p class="text-sm text-neutral-600 dark:text-neutral-400">
                    {{ activeDelivery.reservation?.quantity || 1 }} article(s)
                  </p>
                </div>
              </div>

              <!-- Pickup -->
              <div class="flex items-start gap-3">
                <div class="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900">
                  <MapPin class="h-4 w-4 text-primary-600 dark:text-primary-400" />
                </div>
                <div class="flex-1">
                  <p class="text-xs font-medium uppercase text-neutral-500 dark:text-neutral-400">
                    Retrait
                  </p>
                  <p class="font-medium text-neutral-900 dark:text-white">
                    {{ pickupAddress }}
                  </p>
                  <Button
                    v-if="pickupLocation"
                    variant="link"
                    size="sm"
                    class="mt-1 h-auto p-0"
                    @click="openNavigation('pickup')"
                  >
                    <Navigation class="mr-1 h-3 w-3" />
                    Itinéraire
                  </Button>
                </div>
              </div>

              <!-- Delivery -->
              <div class="flex items-start gap-3">
                <div class="flex h-8 w-8 items-center justify-center rounded-full bg-secondary-100 dark:bg-secondary-900">
                  <MapPin class="h-4 w-4 text-secondary-600 dark:text-secondary-400" />
                </div>
                <div class="flex-1">
                  <p class="text-xs font-medium uppercase text-neutral-500 dark:text-neutral-400">
                    Livraison
                  </p>
                  <p class="font-medium text-neutral-900 dark:text-white">
                    {{ deliveryAddress }}
                  </p>
                  <Button
                    v-if="deliveryLocation"
                    variant="link"
                    size="sm"
                    class="mt-1 h-auto p-0"
                    @click="openNavigation('delivery')"
                  >
                    <Navigation class="mr-1 h-3 w-3" />
                    Itinéraire
                  </Button>
                </div>
              </div>

              <!-- Customer info -->
              <div class="border-t border-neutral-200 pt-4 dark:border-neutral-700">
                <p class="text-xs font-medium uppercase text-neutral-500 dark:text-neutral-400">
                  Client
                </p>
                <p class="mt-1 font-medium text-neutral-900 dark:text-white">
                  {{ customerName }}
                </p>
                <div v-if="customerPhone" class="mt-2 flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    :href="`tel:${customerPhone}`"
                    as="a"
                  >
                    <Phone class="mr-2 h-4 w-4" />
                    Appeler
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    :href="`sms:${customerPhone}`"
                    as="a"
                  >
                    <MessageSquare class="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          <!-- Actions -->
          <Card v-if="activeDelivery">
            <template #header>
              <h2 class="font-semibold text-neutral-900 dark:text-white">Actions</h2>
            </template>

            <div class="space-y-3">
              <Button
                v-for="action in availableActions"
                :key="action.label"
                :variant="action.variant || 'primary'"
                class="w-full"
                :disabled="actionLoading"
                @click="executeAction(action)"
              >
                <component :is="action.icon" class="mr-2 h-4 w-4" />
                {{ action.label }}
              </Button>

              <Button
                v-if="activeDelivery.can_cancel"
                variant="destructive"
                class="w-full"
                :disabled="actionLoading"
                @click="handleCancel"
              >
                <XCircle class="mr-2 h-4 w-4" />
                Annuler la livraison
              </Button>
            </div>
          </Card>

          <!-- Driver position -->
          <Card>
            <template #header>
              <div class="flex items-center justify-between">
                <h2 class="font-semibold text-neutral-900 dark:text-white">Ma position</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  @click="updateDriverLocation"
                >
                  <RefreshCw class="h-4 w-4" />
                </Button>
              </div>
            </template>

            <div class="space-y-3">
              <div v-if="driverLocation" class="text-sm text-neutral-600 dark:text-neutral-400">
                <p>Lat: {{ driverLocation.latitude.toFixed(6) }}</p>
                <p>Lng: {{ driverLocation.longitude.toFixed(6) }}</p>
                <p v-if="lastLocationUpdate" class="mt-2 text-xs text-neutral-500">
                  Mise à jour: {{ formatTime(lastLocationUpdate) }}
                </p>
              </div>
              <div v-else class="text-sm text-neutral-500 dark:text-neutral-400">
                Position non disponible
              </div>

              <Button
                variant="outline"
                size="sm"
                class="w-full"
                @click="updateDriverLocation"
              >
                <Navigation class="mr-2 h-4 w-4" />
                Actualiser ma position
              </Button>
            </div>
          </Card>

          <!-- Earnings summary -->
          <Card v-if="activeDelivery">
            <template #header>
              <h2 class="font-semibold text-neutral-900 dark:text-white">Gains</h2>
            </template>

            <div class="space-y-2 text-sm">
              <div class="flex items-center justify-between">
                <span class="text-neutral-600 dark:text-neutral-400">Frais de livraison</span>
                <span class="font-semibold text-neutral-900 dark:text-white">
                  {{ formatPrice(activeDelivery.delivery_fee || 0) }}
                </span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-neutral-600 dark:text-neutral-400">Ma commission</span>
                <span class="font-semibold text-primary-600 dark:text-primary-400">
                  {{ formatPrice(activeDelivery.driver_commission || 0) }}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  </DashboardLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch, type Component } from 'vue'
import { storeToRefs } from 'pinia'
import {
  RefreshCw,
  MapPin,
  Package,
  Phone,
  MessageSquare,
  Navigation,
  XCircle,
  Play,
  CheckCircle,
  Truck
} from 'lucide-vue-next'
import DashboardLayout from '@/components/ui/2025/DashboardLayout.vue'
import { Badge, Button, Card, EmptyState } from '@/components/ui/2025'
import DeliveryMap from '@/components/maps/DeliveryMap.vue'
import { useDriverStore } from '@/stores/driver'
import { useDashboardLayout } from '@/composables/useDashboardLayout'
import { notify } from '@/composables/useNotifications'
import { formatPrice } from '@/utils/currency'

interface Location {
  latitude: number
  longitude: number
  label?: string
}

interface Action {
  label: string
  icon: Component
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  handler: () => Promise<void>
}

const driverStore = useDriverStore()
const { activeDelivery, loading, profile } = storeToRefs(driverStore)
const { sidebar, header, mobileNav } = useDashboardLayout('driver')

const mapRef = ref<InstanceType<typeof DeliveryMap> | null>(null)
const actionLoading = ref(false)
const driverLocation = ref<Location | null>(null)
const lastLocationUpdate = ref<Date | null>(null)

// Computed: Pickup location
const pickupLocation = computed<Location | null>(() => {
  if (!activeDelivery.value) return null

  const delivery = activeDelivery.value
  const merchant = delivery.reservation?.product?.merchant

  if (delivery.pickup_latitude && delivery.pickup_longitude) {
    return {
      latitude: delivery.pickup_latitude,
      longitude: delivery.pickup_longitude,
      label: pickupAddress.value
    }
  }

  if (merchant?.latitude && merchant?.longitude) {
    return {
      latitude: merchant.latitude,
      longitude: merchant.longitude,
      label: pickupAddress.value
    }
  }

  return null
})

// Computed: Delivery location
const deliveryLocation = computed<Location | null>(() => {
  if (!activeDelivery.value) return null

  const delivery = activeDelivery.value

  if (delivery.delivery_latitude && delivery.delivery_longitude) {
    return {
      latitude: delivery.delivery_latitude,
      longitude: delivery.delivery_longitude,
      label: deliveryAddress.value
    }
  }

  return null
})

// Computed: Addresses
const pickupAddress = computed(() => {
  if (!activeDelivery.value) return 'Adresse de retrait'

  return activeDelivery.value.pickup_address ||
    activeDelivery.value.reservation?.product?.merchant?.address ||
    'Adresse de retrait'
})

const deliveryAddress = computed(() => {
  if (!activeDelivery.value) return 'Adresse de livraison'

  return activeDelivery.value.delivery_address || 'Adresse de livraison'
})

// Computed: Customer info
const customerName = computed(() => {
  if (!activeDelivery.value) return 'Client'

  const reservation = activeDelivery.value.reservation as any
  const consumer = reservation?.consumer || reservation?.user || {}

  const fullName = [consumer.first_name, consumer.last_name]
    .filter(Boolean)
    .join(' ')
    .trim()

  return fullName || consumer.name || 'Client'
})

const customerPhone = computed(() => {
  if (!activeDelivery.value) return null

  const reservation = activeDelivery.value.reservation as any
  const consumer = reservation?.consumer || reservation?.user || {}

  return consumer.phone || activeDelivery.value.recipient_phone || null
})

// Computed: Status
const statusLabel = computed(() => {
  if (!activeDelivery.value) return ''

  const labels: Record<string, string> = {
    pending: 'En attente',
    assigned: 'Assignée',
    picking_up: 'En route vers retrait',
    picked_up: 'Colis récupéré',
    delivering: 'En livraison',
    delivered: 'Livrée',
    cancelled: 'Annulée',
    failed: 'Échouée'
  }

  return labels[activeDelivery.value.status] || activeDelivery.value.status
})

const statusVariant = computed(() => {
  if (!activeDelivery.value) return 'default'

  const variants: Record<string, 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info'> = {
    pending: 'default',
    assigned: 'info',
    picking_up: 'warning',
    picked_up: 'primary',
    delivering: 'warning',
    delivered: 'success',
    cancelled: 'error',
    failed: 'error'
  }

  return variants[activeDelivery.value.status] || 'default'
})

// Computed: Available actions
const availableActions = computed<Action[]>(() => {
  if (!activeDelivery.value) return []

  const actions: Action[] = []
  const status = activeDelivery.value.status

  if (status === 'assigned') {
    actions.push({
      label: 'Démarrer la collecte',
      icon: Play,
      handler: async () => {
        await driverStore.startPickup(activeDelivery.value!.id)
        notify.success('Collecte démarrée')
        await refresh()
      }
    })
  }

  if (status === 'picking_up') {
    actions.push({
      label: 'Confirmer la collecte',
      icon: CheckCircle,
      handler: async () => {
        await driverStore.confirmPickup(activeDelivery.value!.id)
        notify.success('Collecte confirmée')
        await refresh()
      }
    })
  }

  if (status === 'picked_up') {
    actions.push({
      label: 'Démarrer la livraison',
      icon: Truck,
      handler: async () => {
        await driverStore.startDelivery(activeDelivery.value!.id)
        notify.success('Livraison démarrée')
        await refresh()
      }
    })
  }

  if (status === 'delivering' || status === 'picked_up') {
    actions.push({
      label: 'Terminer la livraison',
      icon: CheckCircle,
      variant: 'primary',
      handler: async () => {
        await driverStore.completeDelivery(activeDelivery.value!.id)
        notify.success('Livraison terminée !')
        await refresh()
      }
    })
  }

  return actions
})

// Methods
const refresh = async () => {
  await driverStore.fetchActiveDelivery()
}

const executeAction = async (action: Action) => {
  actionLoading.value = true
  try {
    await action.handler()
  } catch (err: any) {
    notify.error(err?.message || 'Une erreur est survenue')
  } finally {
    actionLoading.value = false
  }
}

const handleCancel = async () => {
  if (!activeDelivery.value) return

  const reason = window.prompt('Pourquoi annuler cette livraison ?')
  if (!reason) return

  actionLoading.value = true
  try {
    await driverStore.cancelDelivery(activeDelivery.value.id, reason)
    notify.info('Livraison annulée')
    await refresh()
  } catch (err: any) {
    notify.error(err?.message || 'Impossible d\'annuler la livraison')
  } finally {
    actionLoading.value = false
  }
}

const updateDriverLocation = () => {
  if ('geolocation' in navigator) {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        driverLocation.value = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        }
        lastLocationUpdate.value = new Date()

        // Update position on backend
        await driverStore.updateLocation(position.coords.latitude, position.coords.longitude)
        notify.success('Position mise à jour')
      },
      () => {
        notify.warning('Impossible d\'obtenir votre position')
      },
      { enableHighAccuracy: true }
    )
  } else {
    notify.warning('La géolocalisation n\'est pas supportée')
  }
}

const handleLocationUpdate = (location: Location) => {
  driverLocation.value = location
  lastLocationUpdate.value = new Date()
}

const openNavigation = (type: 'pickup' | 'delivery') => {
  const location = type === 'pickup' ? pickupLocation.value : deliveryLocation.value
  if (!location) return

  const url = `https://www.google.com/maps/dir/?api=1&destination=${location.latitude},${location.longitude}`
  window.open(url, '_blank')
}

const formatTime = (date: Date) => {
  return new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

// Watch for driver profile location
watch(
  () => profile.value,
  (newProfile) => {
    if (newProfile?.current_latitude && newProfile?.current_longitude) {
      driverLocation.value = {
        latitude: newProfile.current_latitude,
        longitude: newProfile.current_longitude
      }
      if (newProfile.last_location_update) {
        lastLocationUpdate.value = new Date(newProfile.last_location_update)
      }
    }
  },
  { immediate: true }
)

onMounted(async () => {
  await refresh()

  // Get driver location
  if (!driverLocation.value) {
    updateDriverLocation()
  }
})
</script>
