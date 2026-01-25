<template>
  <div class="min-h-screen bg-gradient-to-br from-surface-light via-neutral-50 to-primary-50 dark:from-surface-dark dark:via-neutral-900 dark:to-surface-darker">
    <div class="container px-3 py-6 sm:py-8">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Historique des livraisons</h1>
          <p class="text-sm text-neutral-600 dark:text-neutral-400">Retrouvez toutes vos livraisons passées et en cours.</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          :disabled="loading"
          @click="fetchHistory"
        >
          <RefreshCw class="h-4 w-4" :class="{ 'animate-spin': loading }" />
          Actualiser
        </Button>
      </div>

      <div class="mt-6">
        <div v-if="loading" class="grid gap-4">
          <Card v-for="index in 3" :key="index" class="animate-pulse">
            <div class="h-6 bg-neutral-200 dark:bg-neutral-700 rounded w-1/3 mb-4" />
            <div class="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-2/3" />
          </Card>
        </div>

        <EmptyState
          v-else-if="deliveries.length === 0"
          title="Aucune livraison"
          description="Vous n'avez pas encore demandé de livraison."
          action-label="Découvrir les réservations"
          icon="🚚"
          @action="router.push('/reservations')"
        />

        <div v-else class="grid gap-4">
          <Card v-for="delivery in deliveries" :key="delivery.id">
            <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div class="space-y-1">
                <p class="text-sm text-neutral-500 dark:text-neutral-400">Livraison {{ delivery.delivery_code || delivery.id }}</p>
                <h2 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                  {{ delivery.reservation?.product?.name || 'Commande GÊLADAL' }}
                </h2>
                <p class="text-sm text-neutral-600 dark:text-neutral-400">
                  {{ delivery.delivery_address || 'Adresse non renseignée' }}
                </p>
              </div>
              <div class="flex items-center gap-3">
                <Badge :variant="badgeVariant(delivery.status)" size="sm">
                  {{ statusLabel(delivery.status) }}
                </Badge>
                <span class="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                  {{ formatPrice(delivery.delivery_fee || 0) }}
                </span>
              </div>
            </div>

            <div class="mt-4 flex flex-wrap items-center gap-3">
              <Button
                v-if="!isFinal(delivery.status)"
                size="sm"
                variant="outline"
                @click="router.push({ name: 'delivery-tracking', params: { deliveryId: delivery.id } })"
              >
                Suivre
              </Button>
              <Button
                v-if="delivery.status === 'delivered' && !delivery.consumer_rating"
                size="sm"
                @click="router.push({ name: 'delivery-rating', params: { deliveryId: delivery.id } })"
              >
                Noter
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { deliveryService } from '@/services/deliveryService'
import { notify } from '@/composables/useNotifications'
import { formatPrice } from '@/utils/currency'
import type { Delivery } from '@/types'
import { Button, Card, Badge, EmptyState } from '@/components/ui/2025'
import { RefreshCw } from 'lucide-vue-next'

const router = useRouter()

const deliveries = ref<Delivery[]>([])
const loading = ref(false)

const statusLabel = (status: string) => {
  const labels: Record<string, string> = {
    pending: 'En attente',
    searching: 'Recherche livreur',
    assigned: 'Assignée',
    picking_up: 'Collecte',
    picked_up: 'Colis récupéré',
    delivering: 'En livraison',
    delivered: 'Livrée',
    cancelled: 'Annulée',
    failed: 'Échouée'
  }
  return labels[status] || status
}

const badgeVariant = (status: string) => {
  if (status === 'delivered') return 'success'
  if (status === 'cancelled' || status === 'failed') return 'error'
  if (status === 'delivering' || status === 'picked_up') return 'info'
  return 'warning'
}

const isFinal = (status: string) => ['delivered', 'cancelled', 'failed'].includes(status)

const fetchHistory = async () => {
  loading.value = true

  try {
    const response = await deliveryService.getHistory()
    const items = Array.isArray(response.data) ? response.data : (response.data as any)?.data || []
    deliveries.value = items
  } catch (err: any) {
    notify.error(err?.message || 'Impossible de charger l\'historique')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchHistory()
})
</script>
