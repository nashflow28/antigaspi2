<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="text-left sm:text-center animate-fade-in-up">
      <h3 class="text-xl font-semibold text-neutral-900 mt-2">
        Connexion rapide
      </h3>
      <p class="text-neutral-700">
        Entrez votre code PIN pour {{ formattedPhone }}
      </p>
      <button
        type="button"
        class="text-sm text-primary-600 hover:text-primary-900 mt-2"
        @click="$emit('go-back')"
      >
        Modifier le numéro
      </button>
    </div>

    <!-- PIN Input Form -->
    <form class="space-y-6 animate-fade-in-up" style="animation-delay: 0.2s;" @submit.prevent="handleSubmit">
      <!-- PIN Code Input -->
      <div class="space-y-4">
        <label for="pin" class="block text-sm font-medium text-neutral-900">
          Code PIN
        </label>
        <Input
          id="pin"
          v-model="pinCode"
          :type="showPin ? 'text' : 'password'"
          inputmode="numeric"
          placeholder="••••"
          autocomplete="off"
          required
          maxlength="4"
          data-testid="pin-input"
          :left-icon="Lock"
          :right-icon="showPin ? EyeOff : Eye"
          :error="errors.pin"
          class="text-center text-2xl tracking-widest"
          @input="handlePinInput"
          @click:right-icon="togglePinVisibility"
        />
        <p class="text-sm text-neutral-600">
          Code PIN à 4 chiffres
        </p>
      </div>

      <!-- Submit Button -->
      <Button
        type="submit"
        size="lg"
        :loading="loading"
        :disabled="!isFormValid || loading"
        full-width
        data-testid="submit-pin"
        class="glow-effect group relative overflow-hidden sm:block"
      >
        <span class="relative z-10 flex items-center justify-center gap-2">
          <Loader2 v-if="loading" class="h-4 w-4 animate-spin" />
          <span>{{ loading ? 'Connexion...' : 'Se connecter' }}</span>
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

    <!-- Use OTP instead -->
    <div class="text-left sm:text-center animate-fade-in-up" style="animation-delay: 0.4s;">
      <p class="text-sm text-neutral-700">
        Vous avez oublié votre code PIN ?
      </p>
      <button
        type="button"
        class="font-semibold text-primary-600 hover:text-primary-900 mt-2"
        @click="$emit('use-otp-instead')"
      >
        Utiliser un code SMS
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { deviceService } from '@/services/deviceService'
import { useAuthStore } from '@/stores/auth'
import { useDesignSystem2025 } from '@/composables/useDesignSystem2025'

// Import 2025 components
import Button from '@/components/ui/2025/Button.vue'
import Input from '@/components/ui/2025/Input.vue'

// Import icons
import { Lock, Eye, EyeOff, Loader2, AlertCircle, CheckCircle } from 'lucide-vue-next'
import { sanitizeErrorMessage, logXssAttempt } from '@/utils/sanitization'

// Props
const props = defineProps<{
  phoneNumber: string
}>()

// Emits
const emit = defineEmits<{
  'go-back': []
  'use-otp-instead': []
  'verified': [token: string, user: any]
}>()

// Composables
const authStore = useAuthStore()
const { logMigration } = useDesignSystem2025()

// Log migration usage
logMigration('PINEntryForm', 'Using 2025 components', {
  components: ['Button', 'Input']
})

// Reactive state
const loading = ref(false)
const showPin = ref(false)
const pinCode = ref('')
const errorMessage = ref('')
const successMessage = ref('')

const errors = ref({
  pin: ''
})

// Computed
const isFormValid = computed(() => {
  return pinCode.value.length === 4 && !errors.value.pin
})

const formattedPhone = computed(() => {
  return deviceService.formatPhoneForDisplay(props.phoneNumber)
})

// Methods
const togglePinVisibility = () => {
  showPin.value = !showPin.value
}

const handlePinInput = (event: Event) => {
  const input = event.target as HTMLInputElement
  let value = input.value.replace(/\D/g, '') // Remove non-digits

  // Limit to 4 digits
  if (value.length > 4) {
    value = value.substring(0, 4)
  }

  pinCode.value = value
  errors.value.pin = ''
}

const validateForm = (): boolean => {
  errors.value.pin = ''

  if (!pinCode.value) {
    errors.value.pin = 'Le code PIN est requis'
    return false
  }

  if (pinCode.value.length !== 4) {
    errors.value.pin = 'Le code PIN doit contenir 4 chiffres'
    return false
  }

  if (!/^\d{4}$/.test(pinCode.value)) {
    errors.value.pin = 'Le code PIN ne doit contenir que des chiffres'
    return false
  }

  return true
}

const handleSubmit = async () => {
  if (!validateForm()) return

  loading.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const result = await deviceService.loginWithPin(props.phoneNumber, pinCode.value)

    if (!result.success) {
      errorMessage.value = result.message || 'Code PIN incorrect'
      // Clear PIN on error
      pinCode.value = ''
      return
    }

    const data = result.data!

    if (data.status === 'success' && data.token && data.user) {
      logMigration('PINEntryForm', 'User logged in with PIN', { phone: props.phoneNumber })

      // Set auth in store
      authStore.setAuth(data.token, data.user)

      successMessage.value = 'Connexion réussie!'

      setTimeout(() => {
        emit('verified', data.token, data.user)
      }, 1000)
    } else {
      errorMessage.value = 'Erreur de connexion - veuillez réessayer'
    }
  } catch (error: unknown) {
    const rawError = (error instanceof Error ? error.message : String(error)) || 'Une erreur est survenue'
    logXssAttempt(rawError, 'PINEntryForm error')
    errorMessage.value = sanitizeErrorMessage(rawError)
    logMigration('PINEntryForm', 'Error logging in with PIN', { error: rawError })
    // Clear PIN on error
    pinCode.value = ''
  } finally {
    loading.value = false
  }
}
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
