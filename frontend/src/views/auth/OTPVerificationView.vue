<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-emerald-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 px-4 py-12">
    <Card class="w-full max-w-md">
      <div class="text-center mb-8">
        <div class="mx-auto w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-4">
          <ShieldCheck class="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h1 class="text-2xl font-bold text-slate-900 dark:text-white">
          Vérification du code
        </h1>
        <p class="text-slate-600 dark:text-slate-400 mt-2">
          Entrez le code envoyé au <span class="font-medium">{{ maskedPhone }}</span>
        </p>
      </div>

      <form class="space-y-6" @submit.prevent="handleVerify">
        <!-- OTP Input -->
        <div>
          <Label for="otp" class="sr-only">Code de vérification</Label>
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
              :class="{ 'border-red-500': error }"
              :value="otp[index] || ''"
              @input="handleOtpInput($event, index)"
              @keydown="handleKeydown($event, index)"
              @paste="handlePaste"
            >
          </div>
          <p v-if="error" class="mt-3 text-sm text-red-600 dark:text-red-400 text-center">
            {{ error }}
          </p>
        </div>

        <!-- Timer & Resend -->
        <div class="text-center">
          <p v-if="canResend" class="text-sm text-slate-600 dark:text-slate-400">
            Vous n'avez pas reçu le code ?
            <button
              type="button"
              class="text-primary-600 dark:text-primary-400 font-medium hover:underline"
              :disabled="resending"
              @click="handleResend"
            >
              {{ resending ? 'Envoi...' : 'Renvoyer' }}
            </button>
          </p>
          <p v-else class="text-sm text-slate-500 dark:text-slate-400">
            Renvoyer le code dans <span class="font-medium text-primary-600">{{ formatTime(countdown) }}</span>
          </p>
        </div>

        <!-- Submit Button -->
        <Button
          type="submit"
          variant="primary"
          size="lg"
          class="w-full"
          :disabled="loading || otp.length < otpLength"
        >
          <Loader2 v-if="loading" class="h-5 w-5 animate-spin mr-2" />
          {{ loading ? 'Vérification...' : 'Vérifier' }}
        </Button>

        <!-- Back Link -->
        <div class="text-center">
          <button
            type="button"
            class="text-sm text-slate-600 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 inline-flex items-center gap-1"
            @click="goBack"
          >
            <ArrowLeft class="h-4 w-4" />
            Modifier le numéro
          </button>
        </div>
      </form>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ShieldCheck, Loader2, ArrowLeft } from 'lucide-vue-next'
import Card from '@/components/ui/2025/Card.vue'
import Button from '@/components/ui/2025/Button.vue'
import Label from '@/components/ui/2025/Label.vue'
import { otpService } from '@/services/otpService'
import { useAuthStore } from '@/stores/auth'
import { notify } from '@/composables/useNotifications'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const otpLength = 6
const otp = ref('')
const otpInputs = ref<(HTMLInputElement | null)[]>([])
const loading = ref(false)
const resending = ref(false)
const error = ref('')
const countdown = ref(60)
const canResend = ref(false)

let countdownInterval: ReturnType<typeof setInterval> | null = null

const phone = computed(() => route.query.phone as string || '')
const mode = computed(() => route.query.mode as 'login' | 'register' || 'login')
const alreadyVerified = computed(() => route.query.verified === 'true')

const maskedPhone = computed(() => {
  if (!phone.value) return ''
  const p = phone.value
  if (p.length < 8) return p
  return p.substring(0, 5) + '***' + p.substring(p.length - 2)
})

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${secs}s`
}

const startCountdown = () => {
  countdown.value = 60
  canResend.value = false

  if (countdownInterval) {
    clearInterval(countdownInterval)
  }

  countdownInterval = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      canResend.value = true
      if (countdownInterval) {
        clearInterval(countdownInterval)
        countdownInterval = null
      }
    }
  }, 1000)
}

const handleOtpInput = (event: Event, index: number) => {
  const target = event.target as HTMLInputElement
  const value = target.value.replace(/\D/g, '')

  // Update OTP string
  const otpArray = otp.value.split('')
  otpArray[index] = value
  otp.value = otpArray.join('').substring(0, otpLength)

  // Move to next input
  if (value && index < otpLength - 1) {
    otpInputs.value[index + 1]?.focus()
  }

  // Auto-submit when complete
  if (otp.value.length === otpLength) {
    handleVerify()
  }
}

const handleKeydown = (event: KeyboardEvent, index: number) => {
  if (event.key === 'Backspace' && !otp.value[index] && index > 0) {
    otpInputs.value[index - 1]?.focus()
  }
}

const handlePaste = (event: ClipboardEvent) => {
  event.preventDefault()
  const pastedData = event.clipboardData?.getData('text').replace(/\D/g, '').substring(0, otpLength)
  if (pastedData) {
    otp.value = pastedData
    // Focus last filled input
    const focusIndex = Math.min(pastedData.length, otpLength - 1)
    otpInputs.value[focusIndex]?.focus()

    // Auto-submit if complete
    if (pastedData.length === otpLength) {
      setTimeout(() => handleVerify(), 100)
    }
  }
}

const handleVerify = async () => {
  if (otp.value.length < otpLength) {
    error.value = 'Veuillez entrer le code complet'
    return
  }

  loading.value = true
  error.value = ''

  try {
    let result

    if (mode.value === 'login') {
      result = await otpService.loginWithOTP(phone.value, otp.value)

      // Handle case where OTP is valid but user doesn't exist (user_exists: false)
      // This happens when someone tries to login with a phone that's not registered
      if (result.success && !result.token && !result.user) {
        // OTP verified but user doesn't exist - redirect to registration
        notify.info('Numéro non inscrit', 'Créez votre compte pour continuer')

        // Store phone as verified for registration
        sessionStorage.setItem('pendingRegistration', JSON.stringify({
          phone: phone.value,
          first_name: '',
          last_name: '',
          role: 'consumer',
          city: 'Lomé'
        }))

        router.push({
          name: 'phone-register',
          query: { phone: phone.value, verified: 'true' }
        })
        return
      }
    } else {
      const pendingData = sessionStorage.getItem('pendingRegistration')
      if (pendingData) {
        const userData = JSON.parse(pendingData)
        result = await otpService.registerWithOTP({
          ...userData,
          code: otp.value
        })
      } else {
        result = await otpService.verifyOTP(phone.value, otp.value)
      }
    }

    if (result.success && result.token) {
      // Store auth data
      authStore.setAuth(result.token, result.user as any)

      notify.success('Connexion réussie', 'Bienvenue sur Antigaspi !')

      // Navigate to home (profile completion is optional on web)
      router.push({ name: 'home' })
    } else {
      error.value = result.error || 'Code incorrect'
      // Clear OTP on error
      otp.value = ''
      otpInputs.value[0]?.focus()
    }
  } catch (err: any) {
    error.value = err.message || 'Erreur de vérification'
    otp.value = ''
    otpInputs.value[0]?.focus()
  } finally {
    loading.value = false
  }
}

const handleResend = async () => {
  resending.value = true
  error.value = ''

  try {
    // Pass purpose to match the current flow (login or registration)
    const purpose = mode.value === 'login' ? 'login' : 'registration'
    const result = await otpService.resendOTP(phone.value, purpose)

    if (result.success) {
      notify.success('Code envoyé', 'Un nouveau code a été envoyé')
      startCountdown()
      otp.value = ''
      otpInputs.value[0]?.focus()
    } else {
      error.value = result.error || 'Impossible de renvoyer le code'
    }
  } catch (err: any) {
    error.value = err.message || 'Erreur lors du renvoi'
  } finally {
    resending.value = false
  }
}

const goBack = () => {
  router.push({
    name: mode.value === 'login' ? 'phone-login' : 'phone-register'
  })
}

// Watch OTP changes to update individual inputs
watch(otp, (newValue) => {
  otpInputs.value.forEach((input, index) => {
    if (input) {
      input.value = newValue[index] || ''
    }
  })
})

onMounted(async () => {
  if (!phone.value) {
    router.push({ name: 'phone-login' })
    return
  }

  // If phone is already verified (coming from login flow for non-existent user),
  // skip OTP entry and proceed directly to registration
  if (alreadyVerified.value && mode.value === 'register') {
    const pendingData = sessionStorage.getItem('pendingRegistration')
    if (pendingData) {
      loading.value = true
      try {
        const userData = JSON.parse(pendingData)
        // Register directly without requiring OTP again (phone already verified)
        const result = await otpService.registerWithVerifiedPhone(userData)

        if (result.success && result.token) {
          authStore.setAuth(result.token, result.user as any)
          notify.success('Compte créé', 'Bienvenue sur Antigaspi !')
          sessionStorage.removeItem('pendingRegistration')
          router.push({ name: 'home' })
        } else {
          error.value = result.error || 'Erreur lors de la création du compte'
        }
      } catch (err: any) {
        error.value = err.message || 'Erreur lors de la création du compte'
      } finally {
        loading.value = false
      }
    }
    return
  }

  startCountdown()
  // Focus first input
  setTimeout(() => otpInputs.value[0]?.focus(), 100)
})

onUnmounted(() => {
  if (countdownInterval) {
    clearInterval(countdownInterval)
  }
})
</script>
