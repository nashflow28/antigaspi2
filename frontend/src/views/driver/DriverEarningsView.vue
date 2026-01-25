<template>
  <DashboardLayout :sidebar="sidebar" :header="header" class="bg-gradient-to-br from-neutral-50 via-sky-50/40 to-primary-50">
    <div class="space-y-6">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-2xl font-semibold text-neutral-900">Mes gains</h1>
          <p class="text-sm text-neutral-600">Suivez vos revenus et primes.</p>
        </div>
        <select
          v-model="period"
          class="rounded-xl border border-neutral-200 bg-white px-3 py-3 text-sm text-neutral-700"
          @change="refresh"
        >
          <option value="today">Aujourd'hui</option>
          <option value="week">Cette semaine</option>
          <option value="month">Ce mois</option>
          <option value="year">Cette année</option>
        </select>
      </div>

      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <p class="text-sm text-neutral-500">Total</p>
          <p class="text-2xl font-semibold text-neutral-900 mt-2">{{ formatPrice(summary.total || 0) }}</p>
        </Card>
        <Card>
          <p class="text-sm text-neutral-500">Livraisons</p>
          <p class="text-2xl font-semibold text-neutral-900 mt-2">{{ formatPrice(summary.deliveries || 0) }}</p>
        </Card>
        <Card>
          <p class="text-sm text-neutral-500">Pourboires</p>
          <p class="text-2xl font-semibold text-neutral-900 mt-2">{{ formatPrice(summary.tips || 0) }}</p>
        </Card>
        <Card>
          <p class="text-sm text-neutral-500">Bonus</p>
          <p class="text-2xl font-semibold text-neutral-900 mt-2">{{ formatPrice(summary.bonuses || 0) }}</p>
        </Card>
      </div>

      <Card>
        <template #header>
          <h2 class="text-lg font-semibold text-neutral-900">Historique des gains</h2>
        </template>

        <div v-if="loading" class="space-y-3">
          <div v-for="index in 4" :key="index" class="h-6 bg-neutral-200 rounded" />
        </div>

        <div v-else-if="earnings.length === 0" class="text-sm text-neutral-600">
          Aucun gain enregistré pour cette période.
        </div>

        <div v-else class="divide-y divide-neutral-200">
          <div v-for="earning in earnings" :key="earning.id" class="py-4 flex items-center justify-between">
            <div>
              <p class="text-sm font-semibold text-neutral-900">{{ earning.description || labelForType(earning.type) }}</p>
              <p class="text-xs text-neutral-500">{{ formatDate(earning.created_at) }}</p>
            </div>
            <span class="text-sm font-semibold" :class="earning.amount < 0 ? 'text-accent-red' : 'text-emerald-600'">
              {{ earning.amount < 0 ? '-' : '+' }}{{ formatPrice(Math.abs(earning.amount)) }}
            </span>
          </div>
        </div>
      </Card>
    </div>
  </DashboardLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import DashboardLayout from '@/components/ui/DashboardLayout.vue'
import { Card } from '@/components/ui/2025'
import { useDriverStore } from '@/stores/driver'
import { useDashboardLayout } from '@/composables/useDashboardLayout'
import { formatPrice } from '@/utils/currency'

const driverStore = useDriverStore()
const { earnings, earningsSummary, loading } = storeToRefs(driverStore)
const { sidebar, header } = useDashboardLayout('driver')

const period = ref('month')

const summary = computed(() => earningsSummary.value || {})

const refresh = async () => {
  await driverStore.fetchEarnings(period.value)
}

const labelForType = (type: string) => {
  const labels: Record<string, string> = {
    delivery: 'Livraison',
    bonus: 'Bonus',
    tip: 'Pourboire',
    withdrawal: 'Retrait'
  }
  return labels[type] || type
}

const formatDate = (date?: string) => {
  if (!date) return ''
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(date))
}

onMounted(() => {
  refresh()
})
</script>
