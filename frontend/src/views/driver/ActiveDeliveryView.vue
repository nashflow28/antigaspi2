<template>
  <DashboardLayout
    :sidebar="sidebar"
    :header="header"
    :mobile-nav="mobileNav"
    class="bg-gradient-to-br from-neutral-50 via-sky-50/40 to-primary-50"
  >
    <div class="space-y-6">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-2xl font-semibold text-neutral-900">Livraison en cours</h1>
          <p class="text-sm text-neutral-600">Gérez votre livraison active et mettez à jour son statut.</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          :disabled="loading"
          @click="refresh"
        >
          <RefreshCw class="h-4 w-4" :class="{ 'animate-spin': loading }" />
          Actualiser
        </Button>
      </div>

      <div v-if="!activeDelivery && !loading">
        <EmptyState
          title="Aucune livraison en cours"
          description="Acceptez une livraison pour commencer une course."
          action-label="Voir les livraisons disponibles"
          icon="🚴"
          @action="$router.push('/driver/deliveries/available')"
        />
      </div>

      <div v-else-if="activeDelivery" class="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card>
          <template #header>
            <div class="flex items-center justify-between">
              <h2 class="text-lg font-semibold text-neutral-900">Détails de la livraison</h2>
              <Badge variant="info" size="sm">{{ statusLabel(activeDelivery.status) }}</Badge>
            </div>
          </template>

          <div class="space-y-4 text-sm text-neutral-600">
            <div>
              <p class="font-semibold text-neutral-900">{{ activeDelivery.reservation?.product?.name || 'Commande GÊLADAL' }}</p>
              <p>Code : {{ activeDelivery.delivery_code || activeDelivery.id }}</p>
            </div>
            <div>
              <p class="font-medium text-neutral-900">Retrait</p>
              <p>{{ activeDelivery.pickup_address || activeDelivery.reservation?.product?.merchant?.address || 'Adresse inconnue' }}</p>
            </div>
            <div>
              <p class="font-medium text-neutral-900">Livraison</p>
              <p>{{ activeDelivery.delivery_address || 'Adresse inconnue' }}</p>
            </div>
            <div>
              <p class="font-medium text-neutral-900">Client</p>
              <p>{{ consumerInfo.name }}</p>
              <p v-if="consumerInfo.phone">{{ consumerInfo.phone }}</p>
            </div>
          </div>

          <div class="mt-6 flex flex-wrap gap-3">
            <Button
              v-for="action in availableActions"
              :key="action.label"
              size="sm"
              @click="action.handler"
            >
              {{ action.label }}
            </Button>
            <Button
              v-if="canReportFailure"
              size="sm"
              variant="outline"
              @click="handleReportFailure"
            >
              Signaler un problème
            </Button>
            <Button
              v-if="activeDelivery.can_cancel"
              size="sm"
              variant="destructive"
              @click="handleCancel"
            >
              Annuler la livraison
            </Button>
          </div>
        </Card>

        <div class="space-y-6">
          <Card>
            <template #header>
              <h2 class="text-lg font-semibold text-neutral-900">Mise à jour position</h2>
            </template>
            <div class="space-y-3">
              <Input
                v-model="location.latitude"
                label="Latitude"
                type="number"
                step="0.0001"
                placeholder="6.1725"
              />
              <Input
                v-model="location.longitude"
                label="Longitude"
                type="number"
                step="0.0001"
                placeholder="1.2314"
              />
              <Button size="sm" variant="outline" @click="updateLocation">Mettre à jour</Button>
            </div>
          </Card>

          <Card>
            <template #header>
              <h2 class="text-lg font-semibold text-neutral-900">Récapitulatif</h2>
            </template>
            <div class="space-y-2 text-sm text-neutral-600">
              <div class="flex items-center justify-between">
                <span>Frais</span>
                <span class="font-semibold text-neutral-900">{{ formatPrice(activeDelivery.delivery_fee || 0) }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span>Commission</span>
                <span class="font-semibold text-neutral-900">{{ formatPrice(activeDelivery.driver_commission || 0) }}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  </DashboardLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive } from 'vue'
import { storeToRefs } from 'pinia'
import { RefreshCw } from 'lucide-vue-next'
import DashboardLayout from '@/components/ui/2025/DashboardLayout.vue'
import { Badge, Button, Card, EmptyState, Input } from '@/components/ui/2025'
import { useDriverStore } from '@/stores/driver'
import { useDashboardLayout } from '@/composables/useDashboardLayout'
import { notify } from '@/composables/useNotifications'
import { formatPrice } from '@/utils/currency'

const driverStore = useDriverStore()
const { activeDelivery, loading } = storeToRefs(driverStore)
const { sidebar, header, mobileNav } = useDashboardLayout('driver')

const location = reactive({
  latitude: '',
  longitude: ''
})

const consumerInfo = computed(() => {
  const reservation = (activeDelivery.value?.reservation as any) || {}
  const consumer = reservation.consumer || reservation.user || {}
  const name = consumer.name || [consumer.first_name, consumer.last_name].filter(Boolean).join(' ').trim() || 'Client'

  return {
    name,
    phone: consumer.phone || ''
  }
})

const statusLabel = (status: string) => {
  const labels: Record<string, string> = {
    assigned: 'Assignée',
    picking_up: 'En route',
    picked_up: 'Colis récupéré',
    delivering: 'En livraison',
    delivered: 'Livrée',
    cancelled: 'Annulée',
    failed: 'Échouée'
  }
  return labels[status] || status
}

const availableActions = computed(() => {
  if (!activeDelivery.value) return []

  const actions: Array<{ label: string; handler: () => Promise<void> | void }> = []

  if (activeDelivery.value.status === 'assigned') {
    actions.push({
      label: 'Démarrer la collecte',
      handler: async () => {
        await runAction(() => driverStore.startPickup(activeDelivery.value!.id), 'Collecte démarrée')
      }
    })
  }

  if (activeDelivery.value.status === 'picking_up') {
    actions.push({
      label: 'Confirmer la collecte',
      handler: async () => {
        await runAction(() => driverStore.confirmPickup(activeDelivery.value!.id), 'Collecte confirmée')
      }
    })
  }

  if (activeDelivery.value.status === 'picked_up') {
    actions.push({
      label: 'Démarrer la livraison',
      handler: async () => {
        await runAction(() => driverStore.startDelivery(activeDelivery.value!.id), 'Livraison démarrée')
      }
    })
    actions.push({
      label: 'Terminer la livraison',
      handler: async () => {
        await runAction(() => driverStore.completeDelivery(activeDelivery.value!.id), 'Livraison terminée')
      }
    })
  }

  if (activeDelivery.value.status === 'delivering') {
    actions.push({
      label: 'Terminer la livraison',
      handler: async () => {
        await runAction(() => driverStore.completeDelivery(activeDelivery.value!.id), 'Livraison terminée')
      }
    })
  }

  return actions
})

const canReportFailure = computed(() => {
  return activeDelivery.value && !['delivered', 'cancelled', 'failed'].includes(activeDelivery.value.status)
})

const refresh = async () => {
  await driverStore.fetchActiveDelivery()
}

const runAction = async (action: () => Promise<any>, successMessage: string) => {
  try {
    await action()
    notify.success(successMessage)
    await refresh()
  } catch (err: any) {
    notify.error(err?.message || 'Action impossible pour le moment.')
  }
}

const updateLocation = async () => {
  const lat = Number.parseFloat(location.latitude)
  const lng = Number.parseFloat(location.longitude)

  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    notify.warning('Veuillez saisir des coordonnées valides.')
    return
  }

  await driverStore.updateLocation(lat, lng)
  notify.success('Position mise à jour')
}

const handleReportFailure = async () => {
  if (!activeDelivery.value) return
  const reason = window.prompt('Expliquez le problème rencontré')
  if (!reason) return
  await driverStore.reportFailure(activeDelivery.value.id, reason)
  await refresh()
}

const handleCancel = async () => {
  if (!activeDelivery.value) return
  const reason = window.prompt('Pourquoi annuler cette livraison ?')
  if (!reason) return
  await driverStore.cancelDelivery(activeDelivery.value.id, reason)
  await refresh()
}

onMounted(() => {
  refresh()
})
</script>
