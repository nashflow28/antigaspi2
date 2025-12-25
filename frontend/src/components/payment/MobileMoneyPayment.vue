<template>
  <div class="space-y-6">
    <!-- Amount Display -->
    <div v-if="!hideAmount" class="text-center py-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
      <p class="text-sm text-slate-500 dark:text-slate-400 mb-1">Montant à payer</p>
      <p class="text-3xl font-bold text-slate-900 dark:text-white">
        {{ formatAmount(amount) }} <span class="text-lg">XOF</span>
      </p>
      <p v-if="fees > 0" class="text-sm text-slate-500 dark:text-slate-400 mt-1">
        + {{ formatAmount(fees) }} XOF de frais
      </p>
    </div>

    <!-- Step 1: Select Provider -->
    <div v-if="step === 'provider'" class="space-y-4">
      <h3 class="text-sm font-medium text-slate-700 dark:text-slate-300">
        Choisissez votre opérateur
      </h3>

      <div class="grid grid-cols-2 gap-3">
        <button
          v-for="provider in availableProviders"
          :key="provider.provider"
          type="button"
          class="relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all"
          :class="selectedProvider?.provider === provider.provider
            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
            : 'border-slate-200 dark:border-slate-700 hover:border-primary-300 dark:hover:border-primary-600'"
          :disabled="!provider.enabled"
          @click="selectProvider(provider)"
        >
          <div
            class="w-12 h-12 rounded-full flex items-center justify-center"
            :style="{ backgroundColor: provider.color + '20' }"
          >
            <component
              :is="getProviderIcon(provider.provider)"
              class="h-6 w-6"
              :style="{ color: provider.color }"
            />
          </div>
          <span class="text-sm font-medium text-slate-900 dark:text-white">
            {{ provider.name }}
          </span>
          <span
            v-if="!provider.enabled"
            class="absolute top-2 right-2 text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500"
          >
            Bientôt
          </span>
        </button>
      </div>
    </div>

    <!-- Step 2: Enter Phone Number -->
    <div v-if="step === 'phone'" class="space-y-4">
      <button
        type="button"
        class="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-primary-600"
        @click="step = 'provider'"
      >
        <ArrowLeft class="h-4 w-4" />
        Changer d'opérateur
      </button>

      <div class="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
        <div
          class="w-10 h-10 rounded-full flex items-center justify-center"
          :style="{ backgroundColor: selectedProvider?.color + '20' }"
        >
          <component
            :is="getProviderIcon(selectedProvider?.provider)"
            class="h-5 w-5"
            :style="{ color: selectedProvider?.color }"
          />
        </div>
        <div>
          <p class="font-medium text-slate-900 dark:text-white">{{ selectedProvider?.name }}</p>
          <p class="text-xs text-slate-500">Paiement mobile</p>
        </div>
      </div>

      <div>
        <Label for="phone">Numéro de téléphone</Label>
        <div class="relative mt-1">
          <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <span class="text-slate-500 dark:text-slate-400 text-sm">+228</span>
          </div>
          <Input
            id="phone"
            v-model="phone"
            type="tel"
            class="pl-14"
            placeholder="90 12 34 56"
            :error="phoneError"
            @blur="validatePhoneInput"
          />
        </div>
        <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Préfixes valides : {{ selectedProvider?.phonePrefix.join(', ') }}
        </p>
      </div>

      <!-- Fees Breakdown -->
      <div v-if="fees > 0" class="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
        <div class="flex items-center gap-2 text-amber-700 dark:text-amber-300 text-sm">
          <Info class="h-4 w-4" />
          <span>Frais de transaction : {{ formatAmount(fees) }} XOF</span>
        </div>
      </div>

      <Button
        type="button"
        variant="primary"
        size="lg"
        class="w-full"
        :disabled="!isPhoneValid || loading"
        @click="initiatePayment"
      >
        <Loader2 v-if="loading" class="h-5 w-5 animate-spin mr-2" />
        {{ loading ? 'Traitement...' : `Payer ${formatAmount(amount + fees)} XOF` }}
      </Button>
    </div>

    <!-- Step 3: OTP Verification -->
    <div v-if="step === 'otp'" class="space-y-4">
      <div class="text-center">
        <div class="mx-auto w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mb-4">
          <Smartphone class="h-8 w-8 text-primary-600 dark:text-primary-400" />
        </div>
        <h3 class="text-lg font-semibold text-slate-900 dark:text-white">
          Confirmez le paiement
        </h3>
        <p class="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Entrez le code reçu par SMS sur le {{ maskedPhone }}
        </p>
      </div>

      <div class="flex justify-center gap-2">
        <input
          v-for="(_, index) in otpLength"
          :key="index"
          :ref="el => otpInputs[index] = el as HTMLInputElement"
          type="text"
          inputmode="numeric"
          maxlength="1"
          class="w-12 h-14 text-center text-2xl font-bold rounded-xl border-2 transition-colors
                 bg-white dark:bg-slate-800
                 border-slate-200 dark:border-slate-700
                 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20
                 text-slate-900 dark:text-white"
          :class="{ 'border-red-500': otpError }"
          :value="otp[index] || ''"
          @input="handleOtpInput($event, index)"
          @keydown="handleOtpKeydown($event, index)"
        />
      </div>

      <p v-if="otpError" class="text-sm text-red-600 dark:text-red-400 text-center">
        {{ otpError }}
      </p>

      <Button
        type="button"
        variant="primary"
        size="lg"
        class="w-full"
        :disabled="otp.length < otpLength || loading"
        @click="confirmPayment"
      >
        <Loader2 v-if="loading" class="h-5 w-5 animate-spin mr-2" />
        {{ loading ? 'Vérification...' : 'Confirmer' }}
      </Button>

      <button
        type="button"
        class="w-full text-sm text-slate-500 dark:text-slate-400 hover:text-primary-600"
        @click="cancelPayment"
      >
        Annuler le paiement
      </button>
    </div>

    <!-- Step 4: Processing -->
    <div v-if="step === 'processing'" class="text-center py-8">
      <div class="mx-auto w-20 h-20 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mb-4">
        <Loader2 class="h-10 w-10 text-primary-600 dark:text-primary-400 animate-spin" />
      </div>
      <h3 class="text-lg font-semibold text-slate-900 dark:text-white">
        Traitement en cours...
      </h3>
      <p class="text-sm text-slate-600 dark:text-slate-400 mt-2">
        Veuillez patienter, ne fermez pas cette fenêtre
      </p>
    </div>

    <!-- Step 5: Success -->
    <div v-if="step === 'success'" class="text-center py-8">
      <div class="mx-auto w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-4">
        <CheckCircle class="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
      </div>
      <h3 class="text-lg font-semibold text-slate-900 dark:text-white">
        Paiement réussi !
      </h3>
      <p class="text-sm text-slate-600 dark:text-slate-400 mt-2">
        {{ successMessage }}
      </p>
      <p v-if="transactionId" class="text-xs text-slate-500 mt-2">
        Référence : {{ transactionId }}
      </p>
    </div>

    <!-- Step 6: Error -->
    <div v-if="step === 'error'" class="text-center py-8">
      <div class="mx-auto w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
        <XCircle class="h-10 w-10 text-red-600 dark:text-red-400" />
      </div>
      <h3 class="text-lg font-semibold text-slate-900 dark:text-white">
        Paiement échoué
      </h3>
      <p class="text-sm text-red-600 dark:text-red-400 mt-2">
        {{ errorMessage }}
      </p>
      <Button
        type="button"
        variant="outline"
        class="mt-4"
        @click="resetPayment"
      >
        Réessayer
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import {
  ArrowLeft, Smartphone, Loader2, CheckCircle, XCircle, Info,
  Phone, Wallet, CreditCard
} from 'lucide-vue-next'
import Button from '@/components/ui/2025/Button.vue'
import Input from '@/components/ui/2025/Input.vue'
import Label from '@/components/ui/2025/Label.vue'
import { mobileMoneyService, type MobileMoneyConfig, type MobileMoneyProvider } from '@/services/mobileMoneyService'

type PaymentStep = 'provider' | 'phone' | 'otp' | 'processing' | 'success' | 'error'

const props = withDefaults(defineProps<{
  amount: number
  purpose?: 'wallet_topup' | 'order_payment' | 'subscription'
  reference?: string
  hideAmount?: boolean
  defaultProvider?: MobileMoneyProvider
}>(), {
  purpose: 'wallet_topup',
  hideAmount: false
})

const emit = defineEmits<{
  success: [{ transactionId: string; amount: number }]
  error: [{ message: string }]
  cancel: []
}>()

const step = ref<PaymentStep>('provider')
const loading = ref(false)
const providers = ref<MobileMoneyConfig[]>([])
const selectedProvider = ref<MobileMoneyConfig | null>(null)
const phone = ref('')
const phoneError = ref('')
const fees = ref(0)
const otp = ref('')
const otpInputs = ref<(HTMLInputElement | null)[]>([])
const otpLength = 6
const otpError = ref('')
const transactionId = ref('')
const successMessage = ref('')
const errorMessage = ref('')

const availableProviders = computed(() => providers.value)

const isPhoneValid = computed(() => {
  if (!phone.value || !selectedProvider.value) return false
  const validation = mobileMoneyService.validatePhone(phone.value, selectedProvider.value.provider)
  return validation.valid
})

const maskedPhone = computed(() => {
  const p = phone.value.replace(/\s/g, '')
  if (p.length < 4) return p
  return p.substring(0, 2) + '****' + p.substring(p.length - 2)
})

const formatAmount = (value: number): string => {
  return new Intl.NumberFormat('fr-FR').format(value)
}

const getProviderIcon = (provider?: MobileMoneyProvider) => {
  switch (provider) {
    case 'flooz':
    case 'tmoney':
      return Smartphone
    case 'orange_money':
    case 'mtn_momo':
      return Phone
    default:
      return Wallet
  }
}

const selectProvider = async (provider: MobileMoneyConfig) => {
  if (!provider.enabled) return
  selectedProvider.value = provider

  // Calculate fees
  const feeResult = await mobileMoneyService.calculateFees(props.amount, provider.provider)
  fees.value = feeResult.fees

  step.value = 'phone'
}

const validatePhoneInput = () => {
  if (!phone.value || !selectedProvider.value) {
    phoneError.value = ''
    return
  }

  const validation = mobileMoneyService.validatePhone(phone.value, selectedProvider.value.provider)
  phoneError.value = validation.error || ''
}

const initiatePayment = async () => {
  if (!selectedProvider.value || !isPhoneValid.value) return

  loading.value = true
  phoneError.value = ''

  try {
    const result = await mobileMoneyService.initiatePayment({
      amount: props.amount,
      provider: selectedProvider.value.provider,
      phone: phone.value,
      purpose: props.purpose,
      reference: props.reference
    })

    if (result.success) {
      transactionId.value = result.transactionId || ''

      if (result.requiresOTP) {
        step.value = 'otp'
        // Focus first OTP input
        setTimeout(() => otpInputs.value[0]?.focus(), 100)
      } else {
        // Payment was directly processed (e.g., USSD prompt sent)
        step.value = 'processing'
        pollPaymentStatus()
      }
    } else {
      phoneError.value = result.error || 'Erreur lors de l\'initiation'
    }
  } catch (error: any) {
    phoneError.value = error.message || 'Erreur de connexion'
  } finally {
    loading.value = false
  }
}

const handleOtpInput = (event: Event, index: number) => {
  const target = event.target as HTMLInputElement
  const value = target.value.replace(/\D/g, '')

  const otpArray = otp.value.split('')
  otpArray[index] = value
  otp.value = otpArray.join('').substring(0, otpLength)

  if (value && index < otpLength - 1) {
    otpInputs.value[index + 1]?.focus()
  }

  if (otp.value.length === otpLength) {
    confirmPayment()
  }
}

const handleOtpKeydown = (event: KeyboardEvent, index: number) => {
  if (event.key === 'Backspace' && !otp.value[index] && index > 0) {
    otpInputs.value[index - 1]?.focus()
  }
}

const confirmPayment = async () => {
  if (otp.value.length < otpLength) return

  loading.value = true
  otpError.value = ''

  try {
    const result = await mobileMoneyService.confirmPayment(transactionId.value, otp.value)

    if (result.success) {
      step.value = 'processing'
      pollPaymentStatus()
    } else {
      otpError.value = result.error || 'Code incorrect'
      otp.value = ''
      otpInputs.value[0]?.focus()
    }
  } catch (error: any) {
    otpError.value = error.message || 'Erreur de vérification'
  } finally {
    loading.value = false
  }
}

const pollPaymentStatus = async () => {
  const maxAttempts = 30
  const interval = 2000
  let attempts = 0

  const check = async () => {
    attempts++

    try {
      const status = await mobileMoneyService.checkStatus(transactionId.value)

      if (status.status === 'completed') {
        step.value = 'success'
        successMessage.value = `Votre paiement de ${formatAmount(props.amount)} XOF a été traité avec succès.`
        emit('success', { transactionId: transactionId.value, amount: props.amount })
        return
      }

      if (status.status === 'failed' || status.status === 'cancelled') {
        step.value = 'error'
        errorMessage.value = status.error || 'Le paiement a échoué'
        emit('error', { message: errorMessage.value })
        return
      }

      if (attempts < maxAttempts) {
        setTimeout(check, interval)
      } else {
        step.value = 'error'
        errorMessage.value = 'Le paiement a expiré. Veuillez réessayer.'
        emit('error', { message: errorMessage.value })
      }
    } catch (error: any) {
      if (attempts < maxAttempts) {
        setTimeout(check, interval)
      } else {
        step.value = 'error'
        errorMessage.value = 'Impossible de vérifier le statut du paiement'
        emit('error', { message: errorMessage.value })
      }
    }
  }

  check()
}

const cancelPayment = async () => {
  if (transactionId.value) {
    await mobileMoneyService.cancelPayment(transactionId.value)
  }
  emit('cancel')
  resetPayment()
}

const resetPayment = () => {
  step.value = 'provider'
  phone.value = ''
  phoneError.value = ''
  otp.value = ''
  otpError.value = ''
  transactionId.value = ''
  errorMessage.value = ''
}

// Watch for OTP changes to update inputs
watch(otp, (newValue) => {
  otpInputs.value.forEach((input, index) => {
    if (input) {
      input.value = newValue[index] || ''
    }
  })
})

onMounted(async () => {
  providers.value = await mobileMoneyService.getProviders()

  // Auto-select default provider if specified
  if (props.defaultProvider) {
    const provider = providers.value.find(p => p.provider === props.defaultProvider && p.enabled)
    if (provider) {
      selectProvider(provider)
    }
  }
})
</script>
