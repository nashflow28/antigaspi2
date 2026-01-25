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
            <h1 class="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Statut du paiement</h1>
            <p class="text-sm text-neutral-600 dark:text-neutral-400">Suivez l'évolution de votre paiement Mobile Money.</p>
          </div>
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

      <div class="mt-6">
        <Card v-if="error" class="text-center">
          <AlertCircle class="h-6 w-6 text-accent-red mx-auto" />
          <p class="mt-2 text-sm text-neutral-600 dark:text-neutral-400">{{ error }}</p>
        </Card>

        <Card v-else>
          <template #header>
            <div class="flex items-center justify-between">
              <h2 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Détails du paiement</h2>
              <Badge v-if="payment" :variant="statusVariant(payment.status)" size="sm">
                {{ statusLabel(payment.status) }}
              </Badge>
            </div>
          </template>

          <div v-if="payment" class="space-y-3 text-sm text-neutral-600 dark:text-neutral-400">
            <div class="flex items-center justify-between">
              <span>Montant</span>
              <span class="font-semibold text-neutral-900 dark:text-neutral-100">{{ formatPrice(payment.amount) }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span>Méthode</span>
              <span class="font-semibold text-neutral-900 dark:text-neutral-100">{{ methodLabel(payment.payment_method) }}</span>
            </div>
            <div v-if="payment.reference" class="flex items-center justify-between">
              <span>Référence</span>
              <span class="font-semibold text-neutral-900 dark:text-neutral-100">{{ payment.reference }}</span>
            </div>
            <div v-if="payment.customer_phone" class="flex items-center justify-between">
              <span>Téléphone</span>
              <span class="font-semibold text-neutral-900 dark:text-neutral-100">{{ payment.customer_phone }}</span>
            </div>
          </div>

          <div v-else class="text-sm text-neutral-600 dark:text-neutral-400">
            Chargement du paiement...
          </div>

          <div class="mt-6 flex flex-wrap gap-3">
            <Button v-if="payment && payment.status === 'pending'" variant="outline" @click="cancelPayment">
              Annuler
            </Button>
            <Button v-if="payment && isFinalStatus(payment.status)" @click="router.push('/reservations')">
              Voir mes réservations
            </Button>
          </div>
        </Card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { AlertCircle, ArrowLeft, RefreshCw } from 'lucide-vue-next'
import { Button, Card, Badge } from '@/components/ui/2025'
import { usePaymentsStore, isFinalStatus } from '@/stores/payments'
import { formatPrice } from '@/utils/currency'
import { notify } from '@/composables/useNotifications'

const route = useRoute()
const router = useRouter()
const paymentsStore = usePaymentsStore()
const { currentPayment: payment, loading, error } = storeToRefs(paymentsStore)

const paymentId = computed(() => Number(route.params.paymentId))

const statusLabel = (status: string) => {
  const labels: Record<string, string> = {
    pending: 'En attente',
    success: 'Payé',
    failed: 'Échec',
    on_site: 'Sur place',
    refunded: 'Remboursé'
  }
  return labels[status] || status
}

const statusVariant = (status: string) => {
  if (status === 'success') return 'success'
  if (status === 'failed') return 'error'
  if (status === 'refunded') return 'secondary'
  return 'warning'
}

const methodLabel = (method: string) => {
  const labels: Record<string, string> = {
    wallet: 'Portefeuille',
    flooz: 'Flooz',
    tmoney: 'TMoney',
    orange_money: 'Orange Money',
    mtn_momo: 'MTN MoMo',
    on_site: 'Sur place'
  }
  return labels[method] || method
}

const refresh = async () => {
  if (Number.isNaN(paymentId.value)) {
    notify.error('Identifiant de paiement invalide')
    return
  }

  await paymentsStore.refreshPayment(paymentId.value)
}

const cancelPayment = async () => {
  if (Number.isNaN(paymentId.value)) return
  const reason = window.prompt('Pourquoi souhaitez-vous annuler ce paiement ?')
  if (!reason) return

  const result = await paymentsStore.cancelPayment(paymentId.value, reason)
  if (result.success) {
    notify.success('Paiement annulé')
  }
}

onMounted(async () => {
  await refresh()
  if (!Number.isNaN(paymentId.value)) {
    paymentsStore.startPolling(paymentId.value)
  }
})

onUnmounted(() => {
  paymentsStore.stopPolling()
})
</script>
