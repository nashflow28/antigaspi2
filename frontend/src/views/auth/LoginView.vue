<template>
  <div class="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-900 py-8 sm:py-12 lg:py-16 px-3 sm:px-4 lg:px-6">
    <div class="max-w-xl w-full space-y-8">
      <!-- Header -->
      <div class="text-left sm:text-center">
        <router-link to="/" class="inline-flex items-center space-y-4 sm:space-x-2 text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300">
          <span class="text-xl">🥬</span>
          <span class="text-xl font-semibold">GÊLADAL</span>
        </router-link>
        <h2 class="mt-6 text-xl font-extrabold text-neutral-900 dark:text-neutral-50">
          Connexion
        </h2>
        <p class="mt-2 text-sm text-neutral-700 dark:text-neutral-300">
          Connectez-vous à votre compte pour continuer
        </p>
      </div>

      <!-- Login Forms -->
      <Card>
        <!-- Phone Login (Primary) -->
        <PhoneLoginForm
          v-if="authFlow === 'phone'"
          @switch-to-email="authFlow = 'email'"
          @go-to-otp="handleGoToOtp"
          @go-to-pin="handleGoToPin"
        />

        <!-- OTP Verification -->
        <OTPVerificationForm
          v-else-if="authFlow === 'otp'"
          :phone-number="phoneNumber"
          :is-new-user="isNewUser"
          @go-back="authFlow = 'phone'"
          @verified="handleVerified"
          @new-user-verified="handleNewUserVerified"
        />

        <!-- PIN Entry -->
        <PINEntryForm
          v-else-if="authFlow === 'pin'"
          :phone-number="phoneNumber"
          @go-back="authFlow = 'phone'"
          @use-otp-instead="handleUseOtpInstead"
          @verified="handleVerified"
        />

        <!-- Email Login (Legacy) -->
        <div v-else-if="authFlow === 'email'" class="space-y-6">
          <LoginForm2025 />
          <div class="text-left sm:text-center text-sm text-neutral-700 dark:text-neutral-300">
            <button
              type="button"
              class="font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-900 dark:hover:text-primary-200"
              @click="authFlow = 'phone'"
            >
              Utiliser le téléphone à la place
            </button>
          </div>
        </div>
      </Card>

      <!-- Additional Links -->
      <div class="text-left sm:text-center">
        <router-link
          to="/"
          class="text-sm text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 underline"
        >
          ← Retour à l'accueil
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import LoginForm2025 from '@/components/forms/LoginForm2025.vue'
import PhoneLoginForm from '@/components/forms/PhoneLoginForm.vue'
import OTPVerificationForm from '@/components/forms/OTPVerificationForm.vue'
import PINEntryForm from '@/components/forms/PINEntryForm.vue'
import Card from '@/components/ui/2025/Card.vue'

// Composables
const router = useRouter()
const route = useRoute()

// Type for authentication flow
type AuthFlow = 'phone' | 'email' | 'otp' | 'pin'

// Reactive state
const authFlow = ref<AuthFlow>('phone') // Start with phone by default (primary method)
const phoneNumber = ref('')
const isNewUser = ref(false)

// Methods
const handleGoToOtp = (phone: string, newUser: boolean) => {
  phoneNumber.value = phone
  isNewUser.value = newUser
  authFlow.value = 'otp'
}

const handleGoToPin = (phone: string) => {
  phoneNumber.value = phone
  authFlow.value = 'pin'
}

const handleUseOtpInstead = () => {
  authFlow.value = 'otp'
}

const handleVerified = (_token: string, user: any) => {
  // User is already logged in via authStore in the child components
  // Redirect based on user role
  const redirectTarget = route.query.redirect

  if (typeof redirectTarget === 'string' && redirectTarget.startsWith('/') && !redirectTarget.startsWith('//')) {
    router.push(redirectTarget)
    return
  }

  if (user?.role === 'admin') {
    router.push('/admin/dashboard')
  } else if (user?.role === 'merchant') {
    router.push('/merchant/dashboard')
  } else {
    router.push('/dashboard')
  }
}

const handleNewUserVerified = (phone: string) => {
  // New user verified - redirect to registration page with verified phone
  router.push({
    name: 'register',
    query: {
      phone,
      verified: 'true'
    }
  })
}
</script>
