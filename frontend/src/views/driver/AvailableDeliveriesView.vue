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
          <h1 class="text-2xl font-semibold text-neutral-900">Livraisons disponibles</h1>
          <p class="text-sm text-neutral-600">Choisissez une livraison et commencez votre course.</p>
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

      <div v-if="error" class="text-sm text-accent-red">{{ error }}</div>

      <div v-if="loading" class="grid gap-4">
        <Card v-for="index in 3" :key="index" class="animate-pulse">
          <div class="h-6 bg-neutral-200 rounded w-1/3 mb-4" />
          <div class="h-4 bg-neutral-200 rounded w-2/3" />
        </Card>
      </div>

      <EmptyState
        v-else-if="availableDeliveries.length === 0"
        title="Aucune livraison disponible"
        description="Revenez un peu plus tard ou passez en ligne pour recevoir des offres."
        icon="🚚"
      />

      <div v-else class="grid gap-4">
        <Card v-for="delivery in availableDeliveries" :key="delivery.id">
          <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div class="space-y-2">
              <p class="text-sm text-neutral-500">Livraison {{ delivery.delivery_code || delivery.id }}</p>
              <h2 class="text-lg font-semibold text-neutral-900">
                {{ delivery.reservation?.product?.name || 'Commande GÊLADAL' }}
              </h2>
              <p class="text-sm text-neutral-600">
                Retrait : {{ delivery.pickup_address || delivery.reservation?.product?.merchant?.address || 'Adresse inconnue' }}
              </p>
              <p class="text-sm text-neutral-600">
                Livraison : {{ delivery.delivery_address || 'Adresse inconnue' }}
              </p>
            </div>
            <div class="text-right space-y-2">
              <Badge variant="info" size="sm">{{ statusLabel(delivery.status) }}</Badge>
              <p class="text-sm text-neutral-600">Frais : <strong>{{ formatPrice(delivery.delivery_fee || 0) }}</strong></p>
            </div>
          </div>

          <div class="mt-4 flex flex-wrap gap-3">
            <Button size="sm" @click="handleAccept(delivery.id)">
              Accepter
            </Button>
            <Button size="sm" variant="outline" @click="handleReject(delivery.id)">
              Refuser
            </Button>
          </div>
        </Card>
      </div>
    </div>
  </DashboardLayout>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { RefreshCw } from 'lucide-vue-next'
import DashboardLayout from '@/components/ui/DashboardLayout.vue'
import { Badge, Button, Card, EmptyState } from '@/components/ui/2025'
import { useDriverStore } from '@/stores/driver'
import { useDashboardLayout } from '@/composables/useDashboardLayout'
import { formatPrice } from '@/utils/currency'

const driverStore = useDriverStore()
const { availableDeliveries, loading, error } = storeToRefs(driverStore)
const { sidebar, header, mobileNav } = useDashboardLayout('driver')

const statusLabel = (status: string) => {
  const labels: Record<string, string> = {
    pending: 'En attente',
    searching: 'Recherche',
    assigned: 'Assignée'
  }
  return labels[status] || status
}

const refresh = async () => {
  await driverStore.fetchAvailableDeliveries()
}

const handleAccept = async (deliveryId: number) => {
  const result = await driverStore.acceptDelivery(deliveryId)
  if (result) {
    await refresh()
  }
}

const handleReject = async (deliveryId: number) => {
  await driverStore.rejectDelivery(deliveryId)
}

onMounted(() => {
  refresh()
})
</script>
