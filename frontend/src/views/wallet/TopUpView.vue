<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-900">
    <!-- Header -->
    <header class="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">
      <div class="max-w-lg mx-auto px-4 py-4">
        <div class="flex items-center gap-4">
          <button
            type="button"
            class="p-2 -ml-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            @click="goBack"
          >
            <ArrowLeft class="h-5 w-5 text-slate-600 dark:text-slate-400" />
          </button>
          <h1 class="text-lg font-semibold text-slate-900 dark:text-white">
            Recharger mon portefeuille
          </h1>
        </div>
      </div>
    </header>

    <main class="max-w-lg mx-auto px-4 py-6">
      <!-- Step 1: Amount Selection -->
      <div v-if="step === 'amount'" class="space-y-6">
        <!-- Current Balance -->
        <Card class="p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-slate-500 dark:text-slate-400">Solde actuel</p>
              <p class="text-2xl font-bold text-slate-900 dark:text-white">
                {{ formatAmount(currentBalance) }} <span class="text-sm">XOF</span>
              </p>
            </div>
            <div class="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
              <Wallet class="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
        </Card>

        <!-- Quick Amount Buttons -->
        <div>
          <h3 class="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
            Montants rapides
          </h3>
          <div class="grid grid-cols-3 gap-3">
            <button
              v-for="preset in presetAmounts"
              :key="preset"
              type="button"
              class="py-4 rounded-xl border-2 font-semibold transition-all"
              :class="selectedAmount === preset
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-primary-300'"
              @click="selectPreset(preset)"
            >
              {{ formatAmount(preset) }}
            </button>
          </div>
        </div>

        <!-- Custom Amount -->
        <div>
          <Label for="custom-amount">Ou entrez un montant personnalisé</Label>
          <div class="relative mt-1">
            <Input
              id="custom-amount"
              v-model="customAmountInput"
              type="text"
              inputmode="numeric"
              placeholder="5000"
              class="pr-14 text-lg"
              @input="handleCustomAmount"
            />
            <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <span class="text-slate-500 dark:text-slate-400">XOF</span>
            </div>
          </div>
          <p v-if="amountError" class="mt-1 text-sm text-red-600 dark:text-red-400">
            {{ amountError }}
          </p>
          <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Minimum : {{ formatAmount(minAmount) }} XOF • Maximum : {{ formatAmount(maxAmount) }} XOF
          </p>
        </div>

        <!-- Amount Summary -->
        <Card v-if="selectedAmount > 0" class="p-4 bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800">
          <div class="flex items-center justify-between">
            <span class="text-slate-700 dark:text-slate-300">Montant à recharger</span>
            <span class="text-xl font-bold text-primary-700 dark:text-primary-300">
              {{ formatAmount(selectedAmount) }} XOF
            </span>
          </div>
        </Card>

        <!-- Continue Button -->
        <Button
          type="button"
          variant="primary"
          size="lg"
          class="w-full"
          :disabled="!selectedAmount || selectedAmount < minAmount || selectedAmount > maxAmount"
          @click="proceedToPayment"
        >
          Continuer
          <ArrowRight class="h-5 w-5 ml-2" />
        </Button>
      </div>

      <!-- Step 2: Payment Method -->
      <div v-if="step === 'payment'" class="space-y-6">
        <Card class="p-6">
          <MobileMoneyPayment
            :amount="selectedAmount"
            purpose="wallet_topup"
            @success="handlePaymentSuccess"
            @error="handlePaymentError"
            @cancel="handlePaymentCancel"
          />
        </Card>
      </div>

      <!-- Step 3: Success -->
      <div v-if="step === 'success'" class="space-y-6">
        <Card class="p-8 text-center">
          <div class="mx-auto w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-6">
            <CheckCircle class="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h2 class="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            Recharge réussie !
          </h2>
          <p class="text-slate-600 dark:text-slate-400">
            Votre portefeuille a été crédité de {{ formatAmount(selectedAmount) }} XOF
          </p>

          <div class="mt-6 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
            <div class="flex items-center justify-between text-sm mb-2">
              <span class="text-slate-500">Ancien solde</span>
              <span class="text-slate-700 dark:text-slate-300">{{ formatAmount(currentBalance) }} XOF</span>
            </div>
            <div class="flex items-center justify-between text-sm mb-2">
              <span class="text-slate-500">Recharge</span>
              <span class="text-emerald-600 dark:text-emerald-400">+{{ formatAmount(selectedAmount) }} XOF</span>
            </div>
            <div class="border-t border-slate-200 dark:border-slate-700 pt-2 mt-2">
              <div class="flex items-center justify-between">
                <span class="font-medium text-slate-700 dark:text-slate-300">Nouveau solde</span>
                <span class="text-xl font-bold text-primary-600 dark:text-primary-400">
                  {{ formatAmount(newBalance) }} XOF
                </span>
              </div>
            </div>
          </div>

          <div class="mt-6 space-y-3">
            <Button
              type="button"
              variant="primary"
              size="lg"
              class="w-full"
              @click="goToWallet"
            >
              Voir mon portefeuille
            </Button>
            <Button
              type="button"
              variant="outline"
              class="w-full"
              @click="resetAndTopUpAgain"
            >
              Faire une autre recharge
            </Button>
          </div>
        </Card>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, ArrowRight, Wallet, CheckCircle } from 'lucide-vue-next'
import Card from '@/components/ui/2025/Card.vue'
import Button from '@/components/ui/2025/Button.vue'
import Input from '@/components/ui/2025/Input.vue'
import Label from '@/components/ui/2025/Label.vue'
import MobileMoneyPayment from '@/components/payment/MobileMoneyPayment.vue'
import { useWalletStore } from '@/stores/wallet'
import { notify } from '@/composables/useNotifications'

type TopUpStep = 'amount' | 'payment' | 'success'

const router = useRouter()
const walletStore = useWalletStore()

const step = ref<TopUpStep>('amount')
const selectedAmount = ref(0)
const customAmountInput = ref('')
const amountError = ref('')
const transactionId = ref('')

const presetAmounts = [1000, 2000, 5000, 10000, 20000, 50000]
const minAmount = 500
const maxAmount = 500000

const currentBalance = computed(() => walletStore.balance)
const newBalance = computed(() => currentBalance.value + selectedAmount.value)

const formatAmount = (value: number): string => {
  return new Intl.NumberFormat('fr-FR').format(value)
}

const selectPreset = (amount: number) => {
  selectedAmount.value = amount
  customAmountInput.value = amount.toString()
  amountError.value = ''
}

const handleCustomAmount = (event: Event) => {
  const target = event.target as HTMLInputElement
  const value = target.value.replace(/\D/g, '')
  customAmountInput.value = value
  const numValue = parseInt(value) || 0

  if (numValue > 0) {
    selectedAmount.value = numValue

    if (numValue < minAmount) {
      amountError.value = `Le montant minimum est de ${formatAmount(minAmount)} XOF`
    } else if (numValue > maxAmount) {
      amountError.value = `Le montant maximum est de ${formatAmount(maxAmount)} XOF`
    } else {
      amountError.value = ''
    }
  } else {
    selectedAmount.value = 0
    amountError.value = ''
  }
}

const proceedToPayment = () => {
  if (selectedAmount.value >= minAmount && selectedAmount.value <= maxAmount) {
    step.value = 'payment'
  }
}

const handlePaymentSuccess = async (result: { transactionId: string; amount: number }) => {
  transactionId.value = result.transactionId

  // Refresh wallet balance
  await walletStore.fetchWallet()

  step.value = 'success'
  notify.success('Recharge réussie', `${formatAmount(result.amount)} XOF ajoutés à votre portefeuille`)
}

const handlePaymentError = (error: { message: string }) => {
  notify.error('Erreur de paiement', error.message)
}

const handlePaymentCancel = () => {
  step.value = 'amount'
}

const resetAndTopUpAgain = () => {
  selectedAmount.value = 0
  customAmountInput.value = ''
  amountError.value = ''
  step.value = 'amount'
}

const goToWallet = () => {
  router.push({ name: 'wallet' })
}

const goBack = () => {
  if (step.value === 'payment') {
    step.value = 'amount'
  } else {
    router.back()
  }
}
</script>
