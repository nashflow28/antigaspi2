<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="text-left sm:text-center animate-fade-in-up">
      <h3 class="text-xl font-semibold text-gray-900 mt-2">
        Bienvenue sur Antigaspi
      </h3>
      <p class="text-gray-700">
        Connectez-vous avec votre numéro de téléphone
      </p>
    </div>

    <!-- Phone Input Form -->
    <form class="space-y-6 animate-fade-in-up" style="animation-delay: 0.2s;" @submit.prevent="handleSubmit">
      <!-- Phone Number Input -->
      <div class="space-y-4">
        <label for="phone" class="block text-sm font-medium text-gray-900">
          Numéro de téléphone
        </label>
        <div class="flex gap-2">
          <div class="flex items-center px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg">
            <Phone class="h-4 w-4 text-gray-500 mr-2" />
            <span class="font-semibold text-gray-900">+228</span>
          </div>
          <Input
            id="phone"
            v-model="phoneNumber"
            type="tel"
            placeholder="90 XX XX XX"
            autocomplete="tel"
            required
            data-testid="phone-input"
            :error="errors.phone"
            @input="formatPhoneInput"
          />
        </div>
        <p class="text-sm text-gray-600">
          Format: 90 XX XX XX (8 chiffres)
        </p>
      </div>

      <!-- Submit Button -->
      <Button
        type="submit"
        size="lg"
        :loading="loading"
        :disabled="!isFormValid || loading"
        full-width
        data-testid="submit-phone"
        class="glow-effect group relative overflow-hidden sm:block"
      >
        <span class="relative z-10 flex items-center justify-center gap-2">
          <Loader2 v-if="loading" class="h-4 w-4 animate-spin" />
          <span>{{ loading ? 'Vérification...' : 'Continuer' }}</span>
        </span>
        <div class="relative sm:absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-500/90 opacity-0 group-hover:transition-opacity duration-300" />
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
    </form>

    <!-- Info about the auth flow -->
    <div class="space-y-3 text-sm text-gray-600 animate-fade-in-up" style="animation-delay: 0.4s;">
      <div class="flex items-start gap-3">
        <ShieldCheck class="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <p>Connexion sécurisée par code SMS</p>
      </div>
      <div class="flex items-start gap-3">
        <Lock class="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <p>Code PIN pour connexion rapide sur cet appareil</p>
      </div>
    </div>

    <!-- Switch to email login -->
    <div class="text-left sm:text-center text-sm text-gray-700 animate-fade-in-up" style="animation-delay: 0.6s;">
      <button
        type="button"
        class="font-semibold text-blue-600 hover:text-blue-900"
        @click="$emit('switch-to-email')"
      >
        Utiliser l'email à la place
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { deviceService } from '@/services/deviceService'
import { useDesignSystem2025 } from '@/composables/useDesignSystem2025'

// Import 2025 components
import Button from '@/components/ui/2025/Button.vue'
import Input from '@/components/ui/2025/Input.vue'

// Import icons
import { Phone, Lock, Loader2, AlertCircle, ShieldCheck } from 'lucide-vue-next'
import { sanitizeErrorMessage, logXssAttempt } from '@/utils/sanitization'

// Composables
const { logMigration } = useDesignSystem2025()

// Emits
const emit = defineEmits<{
  'switch-to-email': []
  'go-to-otp': [phone: string, isNewUser: boolean]
  'go-to-pin': [phone: string]
}>()

// Log migration usage
logMigration('PhoneLoginForm', 'Using 2025 components', {
  components: ['Button', 'Input'],
})

// Reactive state
const loading = ref(false)
const phoneNumber = ref('')
const errorMessage = ref('')

const errors = ref({
  phone: '',
})

// Computed
const isFormValid = computed(() => {
  return phoneNumber.value.replace(/\s/g, '').length === 8 && !errors.value.phone
})

// Methods
const formatPhoneInput = (event: Event) => {
  const input = event.target as HTMLInputElement
  let value = input.value.replace(/\D/g, '') // Remove non-digits

  // Limit to 8 digits
  if (value.length > 8) {
    value = value.substring(0, 8)
  }

  // Format as XX XX XX XX
  const formatted = value.match(/.{1,2}/g)?.join(' ') || value
  phoneNumber.value = formatted
}

const validateForm = (): boolean => {
  errors.value.phone = ''

  const cleaned = phoneNumber.value.replace(/\s/g, '')

  if (!cleaned) {
    errors.value.phone = 'Le numéro de téléphone est requis'
    return false
  }

  if (cleaned.length !== 8) {
    errors.value.phone = 'Le numéro doit contenir 8 chiffres'
    return false
  }

  if (!/^\d{8}$/.test(cleaned)) {
    errors.value.phone = 'Le numéro ne doit contenir que des chiffres'
    return false
  }

  return true
}

const handleSubmit = async () => {
  if (!validateForm()) return

  loading.value = true
  errorMessage.value = ''

  try {
    const fullPhone = `+228${phoneNumber.value.replace(/\s/g, '')}`
    const result = await deviceService.checkPhone(fullPhone)

    if (!result.success) {
      errorMessage.value = result.message || 'Erreur de vérification'
      return
    }

    const data = result.data!

    if (!data.user_exists) {
      // New user - navigate to OTP for registration
      logMigration('PhoneLoginForm', 'New user - redirect to OTP', { phone: fullPhone })
      emit('go-to-otp', fullPhone, true)
    } else if (data.requires_pin && data.has_pin) {
      // Known device with PIN - can use PIN
      logMigration('PhoneLoginForm', 'Known device - redirect to PIN', { phone: fullPhone })
      emit('go-to-pin', fullPhone)
    } else {
      // User exists but needs OTP (new device or expired OTP)
      logMigration('PhoneLoginForm', 'Existing user - redirect to OTP', { phone: fullPhone })
      emit('go-to-otp', fullPhone, false)
    }
  } catch (error: unknown) {
    // SECURITY FIX: Sanitize error messages to prevent XSS
    const rawError = (error instanceof Error ? error.message : String(error)) || 'Une erreur est survenue'
    logXssAttempt(rawError, 'PhoneLoginForm error message')
    errorMessage.value = sanitizeErrorMessage(rawError)
    logMigration('PhoneLoginForm', 'Error checking phone', { error: rawError })
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
