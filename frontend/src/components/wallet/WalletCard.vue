<template>
  <div class="bg-gradient-to-r from-green-500 to-green-600 rounded p-6 text-white shadow-lg">
    <div class="flex items-center justify-start sm:justify-between mt-3">
      <div class="flex items-center space-y-2 sm:space-x-3">
        <div class="w-12 h-10 bg-white/20 rounded-full flex items-center justify-center">
          <svg class="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" />
          </svg>
        </div>
        <div>
          <h3 class="text-lg font-semibold">Portefeuille</h3>
          <p class="text-primary-100 text-sm">{{ wallet?.currency || 'XOF' }}</p>
        </div>
      </div>
      <div class="text-right">
        <div class="text-xl font-semibold">{{ formattedBalance }}</div>
        <div class="text-primary-100 text-sm">Solde disponible</div>
      </div>
    </div>

    <div class="flex items-center justify-start sm:justify-between text-sm">
      <div class="flex items-center space-y-4 sm:space-x-4">
        <div class="flex items-center space-y-4 sm:space-x-2">
          <div class="h-4 w-4 rounded-full" :class="wallet?.is_active ? 'bg-primary-300' : 'bg-red-300'" />
          <span class="text-primary-100">{{ wallet?.is_active ? 'Actif' : 'Inactif' }}</span>
        </div>
        <div class="text-primary-100">
          Limite: {{ formatAmount(wallet?.daily_limit || 0) }}
        </div>
      </div>
      <div class="flex space-y-4 sm:space-x-2">
        <button
          class="px-3 py-3 bg-white/20 rounded hover:transition-colors"
          @click="$emit('recharge')"
        >
          Recharger
        </button>
        <button
          class="px-3 py-3 bg-white/20 rounded hover:transition-colors"
          @click="$emit('settings')"
        >
          Paramètres
        </button>
      </div>
    </div>

    <div v-if="wallet?.remaining_daily_limit !== undefined" class="mt-4">
      <div class="flex justify-start sm:justify-between text-sm text-primary-100 mb-1">
        <span>Limite quotidienne restante</span>
        <span>{{ formatAmount(wallet.remaining_daily_limit) }}</span>
      </div>
      <div class="w-full bg-white/20 rounded-full h-4">
        <div
          class="bg-white rounded-full h-4 transition-all duration-300"
          :style="{width: dailyLimitPercentage + '%'}"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Wallet {
  id: number
  balance: number
  formatted_balance: string
  currency: string
  daily_limit: number
  remaining_daily_limit: number
  is_active: boolean
  has_pin: boolean
  last_transaction_at: string | null
}

interface Props {
  wallet: Wallet | null
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})


const formattedBalance = computed(() => {
  if (!props.wallet) return '0 XOF'
  return props.wallet.formatted_balance || `${formatAmount(props.wallet.balance)} ${props.wallet.currency}`
})

const dailyLimitPercentage = computed(() => {
  if (!props.wallet) return 0
  const used = props.wallet.daily_limit - props.wallet.remaining_daily_limit
  return (used / props.wallet.daily_limit) * 100
})

const formatAmount = (amount: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}
</script>
