<template>
  <DashboardLayout
    :sidebar="sidebar"
    :header="header"
    :mobile-nav="mobileNav"
    class="bg-gradient-to-br from-neutral-50 via-sky-50/40 to-primary-50"
  >
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            @click="$router.back()"
          >
            <ArrowLeft class="h-4 w-4" />
          </Button>
          <div>
            <h1 class="text-2xl font-semibold text-neutral-900 dark:text-white">
              Détails de livraison
            </h1>
            <p v-if="delivery" class="text-sm text-neutral-600 dark:text-neutral-400">
              Code: {{ delivery.delivery_code || `#${delivery.id}` }}
            </p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <Badge v-if="delivery" :variant="statusVariant" size="sm">
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

      <!-- Loading state -->
      <div v-if="loading && !delivery" class="flex items-center justify-center py-20">
        <Loading label="Chargement des détails..." />
      </div>

      <!-- Error state -->
      <Alert v-else-if="error" variant="error" class="my-8">
        {{ error }}
      </Alert>

      <!-- Content -->
      <div v-else-if="delivery" class="grid gap-6 lg:grid-cols-3">
        <!-- Main info -->
        <div class="space-y-6 lg:col-span-2">
          <!-- Delivery timeline -->
          <Card>
            <template #header>
              <h2 class="font-semibold text-neutral-900 dark:text-white">
                Progression
              </h2>
            </template>

            <div class="space-y-4">
              <div
                v-for="(step, index) in deliverySteps"
                :key="step.status"
                class="flex items-start gap-4"
              >
                <div class="flex flex-col items-center">
                  <div
                    :class="[
                      'flex h-10 w-10 items-center justify-center rounded-full',
                      step.completed
                        ? 'bg-primary-500 text-white'
                        : step.current
                          ? 'bg-primary-100 text-primary-600 dark:bg-primary-900 dark:text-primary-400'
                          : 'bg-neutral-100 text-neutral-400 dark:bg-neutral-800'
                    ]"
                  >
                    <component :is="step.icon" class="h-5 w-5" />
                  </div>
                  <div
                    v-if="index < deliverySteps.length - 1"
                    :class="[
                      'mt-2 h-10 w-0.5',
                      step.completed ? 'bg-primary-500' : 'bg-neutral-200 dark:bg-neutral-700'
                    ]"
                  />
                </div>
                <div class="flex-1 pb-4">
                  <p
                    :class="[
                      'font-medium',
                      step.completed || step.current
                        ? 'text-neutral-900 dark:text-white'
                        : 'text-neutral-400 dark:text-neutral-500'
                    ]"
                  >
                    {{ step.label }}
                  </p>
                  <p
                    v-if="step.time"
                    class="text-sm text-neutral-500 dark:text-neutral-400"
                  >
                    {{ formatDateTime(step.time) }}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <!-- Addresses -->
          <Card>
            <template #header>
              <h2 class="font-semibold text-neutral-900 dark:text-white">
                Itinéraire
              </h2>
            </template>

            <div class="space-y-6">
              <!-- Pickup -->
              <div class="flex items-start gap-4">
                <div class="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900">
                  <Package class="h-5 w-5 text-primary-600 dark:text-primary-400" />
                </div>
                <div class="flex-1">
                  <p class="text-xs font-medium uppercase text-neutral-500 dark:text-neutral-400">
                    Point de retrait
                  </p>
                  <p class="mt-1 font-medium text-neutral-900 dark:text-white">
                    {{ pickupAddress }}
                  </p>
                  <p v-if="merchantName" class="text-sm text-neutral-600 dark:text-neutral-400">
                    {{ merchantName }}
                  </p>
                  <Button
                    variant="link"
                    size="sm"
                    class="mt-2 h-auto p-0"
                    @click="openNavigation('pickup')"
                  >
                    <Navigation class="mr-1 h-3 w-3" />
                    Itinéraire
                  </Button>
                </div>
              </div>

              <!-- Divider -->
              <div class="relative">
                <div class="absolute inset-0 flex items-center">
                  <div class="w-full border-t border-dashed border-neutral-200 dark:border-neutral-700" />
                </div>
                <div class="relative flex justify-center">
                  <span class="bg-white px-2 text-neutral-400 dark:bg-neutral-800">
                    <Truck class="h-4 w-4" />
                  </span>
                </div>
              </div>

              <!-- Delivery -->
              <div class="flex items-start gap-4">
                <div class="flex h-10 w-10 items-center justify-center rounded-full bg-secondary-100 dark:bg-secondary-900">
                  <MapPin class="h-5 w-5 text-secondary-600 dark:text-secondary-400" />
                </div>
                <div class="flex-1">
                  <p class="text-xs font-medium uppercase text-neutral-500 dark:text-neutral-400">
                    Point de livraison
                  </p>
                  <p class="mt-1 font-medium text-neutral-900 dark:text-white">
                    {{ deliveryAddress }}
                  </p>
                  <p v-if="delivery.delivery_notes" class="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                    Note: {{ delivery.delivery_notes }}
                  </p>
                  <Button
                    variant="link"
                    size="sm"
                    class="mt-2 h-auto p-0"
                    @click="openNavigation('delivery')"
                  >
                    <Navigation class="mr-1 h-3 w-3" />
                    Itinéraire
                  </Button>
                </div>
              </div>
            </div>

            <!-- View on map button -->
            <template #footer>
              <Button
                variant="outline"
                class="w-full"
                @click="$router.push('/driver/map')"
              >
                <Map class="mr-2 h-4 w-4" />
                Voir sur la carte
              </Button>
            </template>
          </Card>

          <!-- Product details -->
          <Card>
            <template #header>
              <h2 class="font-semibold text-neutral-900 dark:text-white">
                Contenu de la commande
              </h2>
            </template>

            <div class="space-y-4">
              <div class="flex items-start gap-4 rounded-lg bg-neutral-50 p-4 dark:bg-neutral-800">
                <div class="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-neutral-200 dark:bg-neutral-700">
                  <img
                    v-if="productImage"
                    :src="productImage"
                    :alt="productName"
                    class="h-full w-full object-cover"
                  >
                  <div v-else class="flex h-full w-full items-center justify-center">
                    <Package class="h-8 w-8 text-neutral-400" />
                  </div>
                </div>
                <div class="flex-1">
                  <p class="font-medium text-neutral-900 dark:text-white">
                    {{ productName }}
                  </p>
                  <p class="text-sm text-neutral-600 dark:text-neutral-400">
                    Quantité: {{ delivery.reservation?.quantity || 1 }}
                  </p>
                  <p v-if="productPrice" class="mt-1 font-semibold text-primary-600 dark:text-primary-400">
                    {{ formatPrice(productPrice) }}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <!-- Sidebar -->
        <div class="space-y-6">
          <!-- Customer info -->
          <Card>
            <template #header>
              <h2 class="font-semibold text-neutral-900 dark:text-white">
                Client
              </h2>
            </template>

            <div class="space-y-4">
              <div class="flex items-center gap-3">
                <div class="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
                  <User class="h-6 w-6 text-neutral-500" />
                </div>
                <div>
                  <p class="font-medium text-neutral-900 dark:text-white">
                    {{ customerName }}
                  </p>
                  <p v-if="customerPhone" class="text-sm text-neutral-600 dark:text-neutral-400">
                    {{ customerPhone }}
                  </p>
                </div>
              </div>

              <div v-if="customerPhone" class="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  class="flex-1"
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
          </Card>

          <!-- Earnings -->
          <Card>
            <template #header>
              <h2 class="font-semibold text-neutral-900 dark:text-white">
                Gains
              </h2>
            </template>

            <div class="space-y-3 text-sm">
              <div class="flex items-center justify-between">
                <span class="text-neutral-600 dark:text-neutral-400">Frais de livraison</span>
                <span class="font-semibold text-neutral-900 dark:text-white">
                  {{ formatPrice(delivery.delivery_fee || 0) }}
                </span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-neutral-600 dark:text-neutral-400">Commission plateforme</span>
                <span class="font-semibold text-neutral-900 dark:text-white">
                  {{ formatPrice(delivery.platform_commission || 0) }}
                </span>
              </div>
              <div class="border-t border-neutral-200 pt-3 dark:border-neutral-700">
                <div class="flex items-center justify-between">
                  <span class="font-medium text-neutral-900 dark:text-white">Votre gain</span>
                  <span class="text-lg font-bold text-primary-600 dark:text-primary-400">
                    {{ formatPrice(delivery.driver_commission || 0) }}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          <!-- Actions -->
          <Card v-if="canTakeAction">
            <template #header>
              <h2 class="font-semibold text-neutral-900 dark:text-white">
                Actions
              </h2>
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
                v-if="delivery.can_cancel"
                variant="destructive"
                class="w-full"
                :disabled="actionLoading"
                @click="handleCancel"
              >
                <XCircle class="mr-2 h-4 w-4" />
                Annuler
              </Button>
            </div>
          </Card>

          <!-- Delivery info -->
          <Card>
            <template #header>
              <h2 class="font-semibold text-neutral-900 dark:text-white">
                Informations
              </h2>
            </template>

            <div class="space-y-3 text-sm">
              <div class="flex items-center justify-between">
                <span class="text-neutral-600 dark:text-neutral-400">Code</span>
                <span class="font-mono font-medium text-neutral-900 dark:text-white">
                  {{ delivery.delivery_code || delivery.id }}
                </span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-neutral-600 dark:text-neutral-400">Créée le</span>
                <span class="text-neutral-900 dark:text-white">
                  {{ formatDateTime(delivery.created_at) }}
                </span>
              </div>
              <div v-if="delivery.picked_up_at" class="flex items-center justify-between">
                <span class="text-neutral-600 dark:text-neutral-400">Collectée</span>
                <span class="text-neutral-900 dark:text-white">
                  {{ formatDateTime(delivery.picked_up_at) }}
                </span>
              </div>
              <div v-if="delivery.delivered_at" class="flex items-center justify-between">
                <span class="text-neutral-600 dark:text-neutral-400">Livrée</span>
                <span class="text-neutral-900 dark:text-white">
                  {{ formatDateTime(delivery.delivered_at) }}
                </span>
              </div>
              <div v-if="delivery.distance_km" class="flex items-center justify-between">
                <span class="text-neutral-600 dark:text-neutral-400">Distance</span>
                <span class="text-neutral-900 dark:text-white">
                  {{ delivery.distance_km.toFixed(1) }} km
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
import { computed, onMounted, ref, type Component } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowLeft,
  RefreshCw,
  Package,
  MapPin,
  Navigation,
  Truck,
  Map,
  User,
  Phone,
  MessageSquare,
  XCircle,
  Play,
  CheckCircle,
  CircleCheck
} from 'lucide-vue-next'
import DashboardLayout from '@/components/ui/2025/DashboardLayout.vue'
import { Badge, Button, Card, Loading, Alert } from '@/components/ui/2025'
import { useDriverStore } from '@/stores/driver'
import { useDashboardLayout } from '@/composables/useDashboardLayout'
import { notify } from '@/composables/useNotifications'
import { formatPrice } from '@/utils/currency'
import type { Delivery } from '@/types'

interface DeliveryStep {
  status: string
  label: string
  icon: Component
  completed: boolean
  current: boolean
  time?: string | null
}

interface Action {
  label: string
  icon: Component
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  handler: () => Promise<void>
}

const route = useRoute()
const router = useRouter()
const driverStore = useDriverStore()
const { sidebar, header, mobileNav } = useDashboardLayout('driver')

const delivery = ref<Delivery | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)
const actionLoading = ref(false)

// Computed
const deliveryId = computed(() => Number(route.params.id))

const statusLabel = computed(() => {
  if (!delivery.value) return ''

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

  return labels[delivery.value.status] || delivery.value.status
})

const statusVariant = computed(() => {
  if (!delivery.value) return 'default'

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

  return variants[delivery.value.status] || 'default'
})

const deliverySteps = computed<DeliveryStep[]>(() => {
  if (!delivery.value) return []

  const status = delivery.value.status
  const statusOrder = ['assigned', 'picking_up', 'picked_up', 'delivering', 'delivered']
  const currentIndex = statusOrder.indexOf(status)

  return [
    {
      status: 'assigned',
      label: 'Livraison acceptée',
      icon: CheckCircle,
      completed: currentIndex > 0,
      current: currentIndex === 0,
      time: delivery.value.assigned_at
    },
    {
      status: 'picking_up',
      label: 'En route vers le commerçant',
      icon: Truck,
      completed: currentIndex > 1,
      current: currentIndex === 1,
      time: delivery.value.picking_up_at
    },
    {
      status: 'picked_up',
      label: 'Colis récupéré',
      icon: Package,
      completed: currentIndex > 2,
      current: currentIndex === 2,
      time: delivery.value.picked_up_at
    },
    {
      status: 'delivering',
      label: 'En route vers le client',
      icon: Navigation,
      completed: currentIndex > 3,
      current: currentIndex === 3,
      time: delivery.value.delivering_at
    },
    {
      status: 'delivered',
      label: 'Livraison terminée',
      icon: CircleCheck,
      completed: currentIndex >= 4,
      current: currentIndex === 4,
      time: delivery.value.delivered_at
    }
  ]
})

const pickupAddress = computed(() => {
  if (!delivery.value) return ''

  return delivery.value.pickup_address ||
    delivery.value.reservation?.product?.merchant?.address ||
    'Adresse de retrait'
})

const deliveryAddress = computed(() => {
  if (!delivery.value) return ''

  return delivery.value.delivery_address || 'Adresse de livraison'
})

const merchantName = computed(() => {
  if (!delivery.value) return ''

  return delivery.value.reservation?.product?.merchant?.business_name ||
    delivery.value.reservation?.product?.merchant?.name || ''
})

const productName = computed(() => {
  if (!delivery.value) return 'Commande'

  return delivery.value.reservation?.product?.name || 'Commande GÊLADAL'
})

const productImage = computed(() => {
  if (!delivery.value) return null

  return delivery.value.reservation?.product?.image_url || null
})

const productPrice = computed(() => {
  if (!delivery.value) return 0

  return delivery.value.reservation?.product?.discounted_price ||
    delivery.value.reservation?.product?.price || 0
})

const customerName = computed(() => {
  if (!delivery.value) return 'Client'

  const reservation = delivery.value.reservation as any
  const consumer = reservation?.consumer || reservation?.user || {}

  const fullName = [consumer.first_name, consumer.last_name]
    .filter(Boolean)
    .join(' ')
    .trim()

  return fullName || consumer.name || delivery.value.recipient_name || 'Client'
})

const customerPhone = computed(() => {
  if (!delivery.value) return null

  const reservation = delivery.value.reservation as any
  const consumer = reservation?.consumer || reservation?.user || {}

  return consumer.phone || delivery.value.recipient_phone || null
})

const canTakeAction = computed(() => {
  if (!delivery.value) return false

  return !['delivered', 'cancelled', 'failed'].includes(delivery.value.status)
})

const availableActions = computed<Action[]>(() => {
  if (!delivery.value) return []

  const actions: Action[] = []
  const status = delivery.value.status

  if (status === 'assigned') {
    actions.push({
      label: 'Démarrer la collecte',
      icon: Play,
      handler: async () => {
        await driverStore.startPickup(delivery.value!.id)
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
        await driverStore.confirmPickup(delivery.value!.id)
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
        await driverStore.startDelivery(delivery.value!.id)
        notify.success('Livraison démarrée')
        await refresh()
      }
    })
  }

  if (status === 'delivering' || status === 'picked_up') {
    actions.push({
      label: 'Terminer la livraison',
      icon: CircleCheck,
      variant: 'primary',
      handler: async () => {
        await driverStore.completeDelivery(delivery.value!.id)
        notify.success('Livraison terminée !')
        await refresh()
      }
    })
  }

  return actions
})

// Methods
const refresh = async () => {
  loading.value = true
  error.value = null

  try {
    const result = await driverStore.fetchDeliveryById(deliveryId.value)
    if (result) {
      delivery.value = result
    } else {
      error.value = 'Livraison non trouvée'
    }
  } catch (err: any) {
    error.value = err?.message || 'Erreur lors du chargement'
  } finally {
    loading.value = false
  }
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
  if (!delivery.value) return

  const reason = window.prompt('Pourquoi annuler cette livraison ?')
  if (!reason) return

  actionLoading.value = true
  try {
    await driverStore.cancelDelivery(delivery.value.id, reason)
    notify.info('Livraison annulée')
    router.push('/driver/history')
  } catch (err: any) {
    notify.error(err?.message || 'Impossible d\'annuler la livraison')
  } finally {
    actionLoading.value = false
  }
}

const openNavigation = (type: 'pickup' | 'delivery') => {
  if (!delivery.value) return

  let lat: number | undefined
  let lng: number | undefined

  if (type === 'pickup') {
    lat = delivery.value.pickup_latitude ??
      delivery.value.reservation?.product?.merchant?.latitude ?? undefined
    lng = delivery.value.pickup_longitude ??
      delivery.value.reservation?.product?.merchant?.longitude ?? undefined
  } else {
    lat = delivery.value.delivery_latitude ?? undefined
    lng = delivery.value.delivery_longitude ?? undefined
  }

  if (lat && lng) {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
    window.open(url, '_blank')
  }
}

const formatDateTime = (value: string | undefined | null) => {
  if (!value) return ''

  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(new Date(value))
}

onMounted(() => {
  refresh()
})
</script>
