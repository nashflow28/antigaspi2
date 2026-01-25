<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="text-left sm:text-center animate-fade-in-up">
      <h3 class="text-xl font-semibold text-neutral-900 mt-2">
        Vérification du code
      </h3>
      <p class="text-neutral-700">
        Nous avons envoyé un code à {{ formattedPhone }}
      </p>
      <button
        type="button"
        class="text-sm text-primary-600 hover:text-primary-900 mt-2"
        @click="$emit('go-back')"
      >
        Modifier le numéro
      </button>
    </div>

    <!-- OTP Input Form -->
    <form class="space-y-6 animate-fade-in-up" style="animation-delay: 0.2s;" @submit.prevent="handleSubmit">
      <!-- OTP Code Input -->
      <div class="space-y-4">
        <label for="otp" class="block text-sm font-medium text-neutral-900">
          Code de vérification
        </label>
        <Input
          id="otp"
          v-model="otpCode"
          type="text"
          inputmode="numeric"
          placeholder="000000"
          autocomplete="one-time-code"
          required
          maxlength="6"
          data-testid="otp-input"
          :left-icon="Shield"
          :error="errors.otp"
          class="text-center text-2xl tracking-widest"
          @input="handleOtpInput"
        />
        <p class="text-sm text-neutral-600">
          Code à 6 chiffres envoyé par SMS
        </p>
      </div>

      <!-- Submit Button -->
      <Button
        type="submit"
        size="lg"
        :loading="verifying"
        :disabled="!isFormValid || verifying"
        full-width
        data-testid="submit-otp"
        class="glow-effect group relative overflow-hidden sm:block"
      >
        <span class="relative z-10 flex items-center justify-center gap-2">
          <Loader2 v-if="verifying" class="h-4 w-4 animate-spin" />
          <span>{{ verifying ? 'Vérification...' : 'Vérifier' }}</span>
        </span>
        <div class="relative sm:absolute inset-0 bg-gradient-to-r from-primary-600 to-primary-500/90 opacity-0 group-hover:transition-opacity duration-300" />
      </Button>

      <!-- Error Message -->
      <div v-if="errorMessage" class="p-4 rounded bg-red-50 border border-red-200">
        <div class="flex items-stretch sm:items-start gap-3">
          <AlertCircle class="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
          <div>
            <h4 class="text-sm font-semibold text-red-800">Erreur</h4>
            <p class="text-sm text-red-700 mt-1">{{ errorMessage }}</p>
          </div>
        </div>
      </div>

      <!-- Success Message -->
      <div v-if="successMessage" class="p-4 rounded bg-green-50 border border-green-200">
        <div class="flex items-stretch sm:items-start gap-3">
          <CheckCircle class="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
          <div>
            <h4 class="text-sm font-semibold text-green-800">Succès</h4>
            <p class="text-sm text-green-700 mt-1">{{ successMessage }}</p>
          </div>
        </div>
      </div>
    </form>

    <!-- Resend Code -->
    <div class="text-left sm:text-center animate-fade-in-up" style="animation-delay: 0.4s;">
      <p class="text-sm text-neutral-700">
        Vous n'avez pas reçu le code ?
      </p>
      <button
        type="button"
        :disabled="resendCooldown > 0 || resending"
        class="font-semibold text-primary-600 hover:text-primary-900 disabled:text-neutral-400 disabled:cursor-not-allowed mt-2"
        @click="handleResend"
      >
        <span v-if="resending">Envoi en cours...</span>
        <span v-else-if="resendCooldown > 0">Renvoyer ({{ resendCooldown }}s)</span>
        <span v-else>Renvoyer le code</span>
      </button>
    </div>

    <!-- Loading message for initial OTP send -->
    <div v-if="sendingInitial" class="p-4 rounded bg-primary-50 border border-primary-200">
      <div class="flex items-center gap-3">
        <Loader2 class="h-4 w-4 text-primary-600 animate-spin" />
        <p class="text-sm text-primary-700">Envoi du code en cours...</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { deviceService } from '@/services/deviceService'
import { useAuthStore } from '@/stores/auth'
import { useDesignSystem2025 } from '@/composables/useDesignSystem2025'

// Import 2025 components
import Button from '@/components/ui/2025/Button.vue'
import Input from '@/components/ui/2025/Input.vue'

// Import icons
import { Shield, Loader2, AlertCircle, CheckCircle } from 'lucide-vue-next'
import { sanitizeErrorMessage, logXssAttempt } from '@/utils/sanitization'

// Props
const props = defineProps<{
  phoneNumber: string
  isNewUser: boolean
}>()

// Emits
const emit = defineEmits<{
  'go-back': []
  'verified': [token: string, user: any]
  'new-user-verified': [phone: string]
}>()

// Composables
const authStore = useAuthStore()
const { logMigration } = useDesignSystem2025()

// Log migration usage
logMigration('OTPVerificationForm', 'Using 2025 components', {
  components: ['Button', 'Input']
})

// Reactive state
const sendingInitial = ref(false)
const verifying = ref(false)
const resending = ref(false)
const otpCode = ref('')
const errorMessage = ref('')
const successMessage = ref('')
const resendCooldown = ref(0)
let cooldownInterval: number | null = null

const errors = ref({
  otp: ''
})

// Computed
const isFormValid = computed(() => {
  return otpCode.value.length === 6 && !errors.value.otp
})

const formattedPhone = computed(() => {
  return deviceService.formatPhoneForDisplay(props.phoneNumber)
})

// Methods
const handleOtpInput = (event: Event) => {
  const input = event.target as HTMLInputElement
  let value = input.value.replace(/\D/g, '') // Remove non-digits

  // Limit to 6 digits
  if (value.length > 6) {
    value = value.substring(0, 6)
  }

  otpCode.value = value
  errors.value.otp = ''
}

const startCooldown = (seconds: number) => {
  resendCooldown.value = seconds

  if (cooldownInterval) {
    clearInterval(cooldownInterval)
  }

  cooldownInterval = window.setInterval(() => {
    if (resendCooldown.value > 0) {
      resendCooldown.value--
    } else if (cooldownInterval) {
      clearInterval(cooldownInterval)
      cooldownInterval = null
    }
  }, 1000)
}

const sendInitialOtp = async () => {
  sendingInitial.value = true
  errorMessage.value = ''

  try {
    const result = await deviceService.sendOtp(props.phoneNumber)

    if (result.success) {
      successMessage.value = 'Code envoyé avec succès'
      startCooldown(60) // 60 seconds cooldown
      setTimeout(() => {
        successMessage.value = ''
      }, 3000)
    } else {
      errorMessage.value = result.message || "Erreur lors de l'envoi du code"
    }
  } catch (error: unknown) {
    const rawError = (error instanceof Error ? error.message : String(error)) || 'Une erreur est survenue'
    logXssAttempt(rawError, 'OTPVerificationForm initial send error')
    errorMessage.value = sanitizeErrorMessage(rawError)
  } finally {
    sendingInitial.value = false
  }
}

const handleResend = async () => {
  if (resendCooldown.value > 0 || resending.value) return

  resending.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const result = await deviceService.sendOtp(props.phoneNumber)

    if (result.success) {
      successMessage.value = 'Code renvoyé avec succès'
      startCooldown(60)
      setTimeout(() => {
        successMessage.value = ''
      }, 3000)
    } else {
      errorMessage.value = result.message || 'Impossible de renvoyer le code'
    }
  } catch (error: unknown) {
    const rawError = (error instanceof Error ? error.message : String(error)) || 'Une erreur est survenue'
    logXssAttempt(rawError, 'OTPVerificationForm resend error')
    errorMessage.value = sanitizeErrorMessage(rawError)
  } finally {
    resending.value = false
  }
}

const validateForm = (): boolean => {
  errors.value.otp = ''

  if (!otpCode.value) {
    errors.value.otp = 'Le code est requis'
    return false
  }

  if (otpCode.value.length !== 6) {
    errors.value.otp = 'Le code doit contenir 6 chiffres'
    return false
  }

  if (!/^\d{6}$/.test(otpCode.value)) {
    errors.value.otp = 'Le code ne doit contenir que des chiffres'
    return false
  }

  return true
}

const handleSubmit = async () => {
  if (!validateForm()) return

  verifying.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const result = await deviceService.verifyOtpAndLogin(props.phoneNumber, otpCode.value)

    if (!result.success) {
      errorMessage.value = result.message || 'Code incorrect'
      return
    }

    const data = result.data!

    if (data.status === 'new_user' || data.requires_registration) {
      // New user needs to complete registration
      logMigration('OTPVerificationForm', 'New user verified - needs registration', { phone: props.phoneNumber })
      emit('new-user-verified', props.phoneNumber)
    } else if (data.status === 'success' && data.token && data.user) {
      // Existing user logged in successfully
      logMigration('OTPVerificationForm', 'User verified and logged in', { phone: props.phoneNumber })

      // Set auth in store
      authStore.setAuth(data.token, data.user)

      successMessage.value = 'Connexion réussie!'

      setTimeout(() => {
        emit('verified', data.token!, data.user!)
      }, 1000)
    } else {
      errorMessage.value = 'Erreur de connexion - veuillez réessayer'
    }
  } catch (error: unknown) {
    const rawError = (error instanceof Error ? error.message : String(error)) || 'Une erreur est survenue'
    logXssAttempt(rawError, 'OTPVerificationForm verify error')
    errorMessage.value = sanitizeErrorMessage(rawError)
    logMigration('OTPVerificationForm', 'Error verifying OTP', { error: rawError })
  } finally {
    verifying.value = false
  }
}

// Lifecycle hooks
onMounted(() => {
  // Send OTP automatically when component mounts
  sendInitialOtp()
})

onUnmounted(() => {
  if (cooldownInterval) {
    clearInterval(cooldownInterval)
  }
})
</script>

<style scoped>
.glow-effect {
  position: relative;
  background: linear-gradient(45deg, #10B981, #059669);
}

.glow-effect::before {
  content: '';
  position: absolute;
  inset: 0;
  padding: 2px;
  background: linear-gradient(45deg, #10B981, #3B82F6, #10B981);
  border-radius: inherit;
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask-composite: exclude;
  opacity: 0;
  transition: opacity 0.3s;
}

.glow-effect:hover::before {
  opacity: 1;
}

@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in-up {
  animation: fade-in-up 0.6s ease-out forwards;
}
</style>
