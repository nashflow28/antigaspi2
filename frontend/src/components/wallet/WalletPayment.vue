<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div class="bg-white rounded-xl p-6 w-full max-w-md">
      <div class="flex items-center justify-between mb-6">
        <h3 class="text-xl font-semibold text-neutral-900">Paiement Portefeuille</h3>
        <button
          class="text-neutral-400 hover:text-neutral-600"
          @click="$emit('close')"
        >
          <svg
            class="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <!-- Résumé du paiement -->
      <div class="bg-neutral-50 rounded-lg p-4 mb-6">
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm text-neutral-600">Montant à payer</span>
          <span class="text-lg font-semibold text-neutral-900">{{ formatAmount(amount) }} XOF</span>
        </div>
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm text-neutral-600">Solde actuel</span>
          <span class="text-sm font-medium text-green-600">{{ formatAmount(walletBalance) }} XOF</span>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-sm text-neutral-600">Solde après paiement</span>
          <span class="text-sm font-medium" :class="remainingBalance >= 0 ? 'text-green-600' : 'text-red-600'">
            {{ formatAmount(remainingBalance) }} XOF
          </span>
        </div>
      </div>

      <!-- Vérifications de sécurité -->
      <div v-if="!canPay" class="mb-6">
        <div class="bg-red-50 border border-red-200 rounded-lg p-4">
          <div class="flex items-start space-x-2">
            <svg class="w-5 h-5 text-red-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
            <div class="text-sm text-red-700">
              <p class="font-medium">Paiement impossible</p>
              <ul class="mt-1 space-y-1">
                <li v-if="walletBalance < amount">• Solde insuffisant</li>
                <li v-if="!walletActive">• Portefeuille désactivé</li>
                <li v-if="exceedsDailyLimit">• Limite quotidienne dépassée</li>
                <li v-if="!hasPin">• Code PIN non configuré</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <form v-else @submit.prevent="handlePayment">
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-neutral-700 mb-2">
              Code PIN du portefeuille
            </label>
            <input
              v-model="pin"
              type="password"
              maxlength="6"
              placeholder="••••••"
              class="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-center text-lg tracking-widest"
              :class="{'border-red-300': error}"
              required
              autocomplete="off"
              @input="formatPinInput"
            >
            <p v-if="error" class="mt-1 text-sm text-red-600">{{ error }}</p>
          </div>

          <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div class="flex items-start space-x-2">
              <svg class="w-5 h-5 text-blue-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
              </svg>
              <div class="text-sm text-blue-700">
                <p class="font-medium">Information</p>
                <p>{{ description || 'Le montant sera débité instantanément de votre portefeuille.' }}</p>
              </div>
            </div>
          </div>
        </div>

        <div class="flex space-x-3 mt-6">
          <button
            type="button"
            class="flex-1 px-4 py-3 border border-neutral-300 rounded-lg text-neutral-700 hover:bg-neutral-50 transition-colors"
            @click="$emit('close')"
          >
            Annuler
          </button>
          <button
            type="submit"
            :disabled="loading || !pin || pin.length < 4"
            class="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <span v-if="loading" class="flex items-center justify-center">
              <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                  class="opacity-25"
                />
                <path fill="currentColor" class="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Traitement...
            </span>
            <span v-else>
              Payer {{ formatAmount(amount) }} XOF
            </span>
          </button>
        </div>
      </form>

      <!-- Actions alternatives si paiement impossible -->
      <div v-if="!canPay" class="mt-6 space-y-3">
        <button
          v-if="walletBalance < amount"
          class="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          @click="$emit('recharge')"
        >
          Recharger le portefeuille
        </button>
        <button
          v-if="!hasPin"
          class="w-full px-4 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
          @click="$emit('setupPin')"
        >
          Configurer un code PIN
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface Props {
  amount: number
  walletBalance: number
  dailyLimit: number
  dailySpent: number
  walletActive: boolean
  hasPin: boolean
  description?: string
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

const emit = defineEmits<{
  close: []
  payment: [pin: string]
  recharge: []
  setupPin: []
}>()

const pin = ref('')
const error = ref('')

const remainingBalance = computed(() => props.walletBalance - props.amount)

const exceedsDailyLimit = computed(() => {
  return (props.dailySpent + props.amount) > props.dailyLimit
})

const canPay = computed(() => {
  return props.walletBalance >= props.amount &&
         props.walletActive &&
         !exceedsDailyLimit.value &&
         props.hasPin
})

const formatAmount = (amount: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

const formatPinInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  target.value = target.value.replace(/\D/g, '')
  error.value = ''
}

const handlePayment = () => {
  if (!pin.value || pin.value.length < 4) {
    error.value = 'Veuillez saisir votre code PIN'
    return
  }

  if (pin.value.length > 6) {
    error.value = 'Le code PIN ne peut pas dépasser 6 chiffres'
    return
  }

  emit('payment', pin.value)
}

const setError = (message: string) => {
  error.value = message
}

defineExpose({
  setError
})
</script>
