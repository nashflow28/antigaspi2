<template>
  <Card class="space-y-4">
    <header class="flex items-center justify-between">
      <h3 class="text-lg font-semibold text-slate-900 dark:text-white">
        Statistiques {{ periodLabel }}
      </h3>
      <div class="flex gap-2">
        <button
          v-for="p in periods"
          :key="p.value"
          class="px-3 py-1 text-sm rounded-full transition-colors"
          :class="period === p.value
            ? 'bg-primary-500 text-white'
            : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300'"
          @click="$emit('period-change', p.value)"
        >
          {{ p.label }}
        </button>
      </div>
    </header>

    <div v-if="loading" class="h-48 flex items-center justify-center">
      <div class="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full" />
    </div>

    <div v-else-if="stats" class="space-y-6">
      <!-- Summary Cards -->
      <div class="grid grid-cols-3 gap-4">
        <div class="text-center p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20">
          <ArrowUpCircle class="h-8 w-8 mx-auto text-emerald-500 mb-2" />
          <p class="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {{ formatAmount(stats.period_stats.total_credits) }}
          </p>
          <p class="text-sm text-slate-600 dark:text-slate-400">Crédits</p>
        </div>
        <div class="text-center p-4 rounded-xl bg-rose-50 dark:bg-rose-900/20">
          <ArrowDownCircle class="h-8 w-8 mx-auto text-rose-500 mb-2" />
          <p class="text-2xl font-bold text-rose-600 dark:text-rose-400">
            {{ formatAmount(stats.period_stats.total_debits) }}
          </p>
          <p class="text-sm text-slate-600 dark:text-slate-400">Débits</p>
        </div>
        <div class="text-center p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20">
          <Activity class="h-8 w-8 mx-auto text-blue-500 mb-2" />
          <p class="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {{ stats.period_stats.transaction_count }}
          </p>
          <p class="text-sm text-slate-600 dark:text-slate-400">Transactions</p>
        </div>
      </div>

      <!-- Balance Progress -->
      <div class="space-y-3">
        <div class="flex justify-between text-sm">
          <span class="text-slate-600 dark:text-slate-400">Solde actuel</span>
          <span class="font-semibold text-slate-900 dark:text-white">
            {{ formatAmount(stats.current_balance) }} XOF
          </span>
        </div>
        <div class="flex justify-between text-sm">
          <span class="text-slate-600 dark:text-slate-400">Limite quotidienne restante</span>
          <span class="font-semibold text-slate-900 dark:text-white">
            {{ formatAmount(stats.remaining_daily_limit) }} / {{ formatAmount(stats.daily_limit) }} XOF
          </span>
        </div>
        <div class="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            class="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500"
            :style="{ width: limitUsagePercent + '%' }"
          />
        </div>
      </div>

      <!-- Transaction Breakdown -->
      <div class="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
        <div class="flex items-center gap-3">
          <div class="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
            <TrendingUp class="h-5 w-5 text-emerald-500" />
          </div>
          <div>
            <p class="text-sm text-slate-600 dark:text-slate-400">Entrées</p>
            <p class="font-semibold text-slate-900 dark:text-white">{{ stats.period_stats.credit_count }}</p>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <div class="h-10 w-10 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
            <TrendingDown class="h-5 w-5 text-rose-500" />
          </div>
          <div>
            <p class="text-sm text-slate-600 dark:text-slate-400">Sorties</p>
            <p class="font-semibold text-slate-900 dark:text-white">{{ stats.period_stats.debit_count }}</p>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="h-48 flex items-center justify-center text-slate-500">
      Aucune donnée disponible
    </div>
  </Card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ArrowUpCircle, ArrowDownCircle, Activity, TrendingUp, TrendingDown } from 'lucide-vue-next'
import Card from '@/components/ui/2025/Card.vue'
import type { WalletStats } from '@/types/wallet'

const props = defineProps<{
  stats: WalletStats | null
  period: string
  loading?: boolean
}>()

defineEmits<{
  'period-change': [period: string]
}>()

const periods = [
  { value: 'week', label: '7j' },
  { value: 'month', label: '30j' },
  { value: 'year', label: '1an' }
]

const periodLabel = computed(() => {
  const p = periods.find(p => p.value === props.period)
  return p ? p.label : ''
})

const limitUsagePercent = computed(() => {
  if (!props.stats || props.stats.daily_limit === 0) return 0
  const used = props.stats.daily_limit - props.stats.remaining_daily_limit
  return Math.min(100, (used / props.stats.daily_limit) * 100)
})

const formatAmount = (amount: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}
</script>
