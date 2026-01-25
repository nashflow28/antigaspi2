<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-emerald-50 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900 px-4 py-12">
    <Card class="w-full max-w-md">
      <div class="text-center mb-8">
        <div class="mx-auto w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mb-4">
          <Phone class="h-8 w-8 text-primary-600 dark:text-primary-400" />
        </div>
        <h1 class="text-2xl font-bold text-neutral-900 dark:text-white">
          {{ isLogin ? 'Connexion par téléphone' : 'Inscription par téléphone' }}
        </h1>
        <p class="text-neutral-600 dark:text-neutral-400 mt-2">
          {{ isLogin ? 'Entrez votre numéro pour recevoir un code' : 'Créez votre compte avec votre numéro' }}
        </p>
      </div>

      <form class="space-y-6" @submit.prevent="handleSubmit">
        <!-- Name (register only) -->
        <div v-if="!isLogin">
          <Label for="name">Nom complet</Label>
          <Input
            id="name"
            v-model="form.name"
            type="text"
            placeholder="Jean Dupont"
            :error="errors.name"
            required
          />
        </div>

        <!-- Phone Number -->
        <div>
          <Label for="phone">Numéro de téléphone</Label>
          <div class="relative">
            <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <span class="text-neutral-500 dark:text-neutral-400 text-sm">+228</span>
            </div>
            <Input
              id="phone"
              v-model="form.phone"
              type="tel"
              class="pl-14"
              placeholder="90 12 34 56"
              :error="errors.phone"
              required
            />
          </div>
          <p class="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
            Nous vous enverrons un code de vérification par SMS
          </p>
        </div>

        <!-- Role Selection (register only) - Consumer only for phone registration -->
        <!-- Merchants must use email registration to provide business details -->
        <input v-model="form.role" type="hidden">

        <!-- Email (optional, register only) -->
        <div v-if="!isLogin">
          <Label for="email">Email (optionnel)</Label>
          <Input
            id="email"
            v-model="form.email"
            type="email"
            placeholder="jean@example.com"
            :error="errors.email"
          />
        </div>

        <!-- Error Message -->
        <div v-if="error" class="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <p class="text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
            <AlertCircle class="h-4 w-4 flex-shrink-0" />
            {{ error }}
          </p>
        </div>

        <!-- Submit Button -->
        <Button
          type="submit"
          variant="primary"
          size="lg"
          class="w-full"
          :disabled="loading || !isFormValid"
        >
          <Loader2 v-if="loading" class="h-5 w-5 animate-spin mr-2" />
          {{ loading ? 'Envoi en cours...' : 'Recevoir le code' }}
        </Button>

        <!-- Toggle Login/Register -->
        <div class="text-center text-sm">
          <span class="text-neutral-600 dark:text-neutral-400">
            {{ isLogin ? 'Pas encore de compte ?' : 'Déjà un compte ?' }}
          </span>
          <button
            type="button"
            class="ml-1 text-primary-600 dark:text-primary-400 font-medium hover:underline"
            @click="toggleMode"
          >
            {{ isLogin ? 'S\'inscrire' : 'Se connecter' }}
          </button>
        </div>

        <!-- Or Divider -->
        <div class="relative">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-neutral-200 dark:border-neutral-700" />
          </div>
          <div class="relative flex justify-center text-sm">
            <span class="px-2 bg-white dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400">ou</span>
          </div>
        </div>

        <!-- Email Login Link -->
        <div class="text-center">
          <router-link
            :to="isLogin ? '/login' : '/register'"
            class="text-sm text-neutral-600 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400"
          >
            {{ isLogin ? 'Connexion par email' : 'Inscription par email' }}
          </router-link>
        </div>
      </form>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Phone, AlertCircle, Loader2 } from 'lucide-vue-next'
import Card from '@/components/ui/2025/Card.vue'
import Button from '@/components/ui/2025/Button.vue'
import Input from '@/components/ui/2025/Input.vue'
import Label from '@/components/ui/2025/Label.vue'
import { otpService } from '@/services/otpService'

const router = useRouter()
const route = useRoute()

const isLogin = ref(route.name === 'phone-login')
const loading = ref(false)
const error = ref('')

// Check if phone is already verified (coming from OTP login for non-existent user)
const phoneAlreadyVerified = ref(route.query.verified === 'true')

const form = ref({
  name: '',
  phone: (route.query.phone as string) || '', // Pre-fill phone if provided
  email: '',
  role: 'consumer' // Phone registration is consumer-only; merchants use email registration
})

const errors = ref<Record<string, string>>({})

// On mount, check if we're coming from verified OTP and should skip OTP sending
onMounted(() => {
  if (phoneAlreadyVerified.value && form.value.phone) {
    // Phone is already verified, we just need user info for registration
    // No need to send OTP again
  }
})

const isFormValid = computed(() => {
  if (!form.value.phone) return false
  if (!isLogin.value && !form.value.name) return false
  return true
})

const toggleMode = () => {
  isLogin.value = !isLogin.value
  error.value = ''
  errors.value = {}
  router.replace(isLogin.value ? '/auth/phone-login' : '/auth/phone-register')
}

const validateForm = (): boolean => {
  errors.value = {}

  // Validate phone
  const phoneValidation = otpService.validatePhone(form.value.phone)
  if (!phoneValidation.valid) {
    errors.value.phone = phoneValidation.error!
    return false
  }

  // Validate name for registration
  if (!isLogin.value && (!form.value.name || form.value.name.length < 2)) {
    errors.value.name = 'Le nom doit contenir au moins 2 caractères'
    return false
  }

  // Validate email if provided
  if (form.value.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email)) {
    errors.value.email = 'Format d\'email invalide'
    return false
  }

  return true
}

const formatPhoneNumber = (phone: string): string => {
  // Remove spaces and non-digit chars except +
  const cleaned = phone.replace(/[^\d+]/g, '')

  // Handle various input formats
  if (cleaned.startsWith('+228')) {
    // Already formatted correctly
    return cleaned
  } else if (cleaned.startsWith('228') && cleaned.length >= 11) {
    // Has country code without + (e.g., "22890123456")
    return '+' + cleaned
  } else if (cleaned.startsWith('+')) {
    // Other country code - keep as is
    return cleaned
  } else {
    // Local number without country code - add Togo prefix
    return '+228' + cleaned
  }
}

const handleSubmit = async () => {
  if (!validateForm()) return

  loading.value = true
  error.value = ''

  try {
    const fullPhone = formatPhoneNumber(form.value.phone)

    // If phone is already verified (coming from OTP login for non-existent user),
    // skip OTP sending and go directly to registration with verified status
    if (phoneAlreadyVerified.value && !isLogin.value) {
      // Split name into first_name and last_name
      const nameParts = form.value.name.trim().split(' ')
      const firstName = nameParts[0] || ''
      const lastName = nameParts.slice(1).join(' ') || nameParts[0] || ''

      localStorage.setItem('pendingRegistration', JSON.stringify({
        first_name: firstName,
        last_name: lastName,
        email: form.value.email,
        phone: fullPhone,
        role: form.value.role,
        city: 'Lomé'
      }))

      // Go directly to OTP verification with already-verified status
      // OTPVerificationView will detect pendingRegistration and proceed to register
      router.push({
        name: 'otp-verify',
        query: {
          phone: fullPhone,
          mode: 'register',
          verified: 'true' // Signal that OTP is already verified
        }
      })
      return
    }

    // Normal flow: Send OTP via backend SMS service
    // Use 'login' for login flow, 'registration' for register flow (matches backend validation)
    const result = await otpService.sendOTP(
      fullPhone,
      isLogin.value ? 'login' : 'registration'
    )

    if (result.success) {
      // Store registration data if needed (use first_name/last_name for /auth/register-phone)
      if (!isLogin.value) {
        // Split name into first_name and last_name
        const nameParts = form.value.name.trim().split(' ')
        const firstName = nameParts[0] || ''
        const lastName = nameParts.slice(1).join(' ') || nameParts[0] || ''

        localStorage.setItem('pendingRegistration', JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          email: form.value.email,
          phone: fullPhone,
          role: form.value.role,
          city: 'Lomé' // Default city for West Africa
        }))
      }

      router.push({
        name: 'otp-verify',
        query: {
          phone: fullPhone,
          mode: isLogin.value ? 'login' : 'register'
        }
      })
    } else {
      error.value = result.error || 'Erreur lors de l\'envoi du code'
    }
  } catch (err: any) {
    error.value = err.message || 'Une erreur est survenue'
  } finally {
    loading.value = false
  }
}

</script>
