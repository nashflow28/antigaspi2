<template>
  <div class="space-y-8">
    <!-- Header moderne -->
    <div class="text-left sm:text-center animate-fade-in-up">
      <h3 class="text-responsive-xl font-semibold text-heading mb-2">
        Content de vous revoir !
      </h3>
      <p class="text-body">
        Connectez-vous pour accéder à votre compte Antigaspi
      </p>
    </div>

    <form class="space-y-6 animate-fade-in-up" style="animation-delay: 0.2s;" @submit.prevent="handleSubmit">
      <!-- Email Input -->
      <div class="space-y-2">
        <Input
          id="email"
          v-model="form.email"
          type="email"
          label="Adresse email"
          placeholder="votre@email.com"
          autocomplete="email"
          required
          :left-icon="Mail"
          :error="errors.email"
        />
      </div>

      <!-- Password Input -->
      <div class="space-y-2">
        <Input
          id="password"
          v-model="form.password"
          :type="showPassword ? 'text' : 'password'"
          label="Mot de passe"
          placeholder="Votre mot de passe"
          autocomplete="current-password"
          required
          :left-icon="Lock"
          :right-icon="showPassword ? EyeOff : Eye"
          :error="errors.password"
          @click:right-icon="togglePasswordVisibility"
        />
      </div>

      <!-- Remember Me -->
      <div class="flex items-center justify-start sm:justify-between">
        <label class="flex items-center gap-2">
          <input
            v-model="form.remember"
            type="checkbox"
            class="rounded border-neutral-300 text-primary focus:ring-primary-500"
          >
          <span class="text-responsive-sm text-body">Se souvenir de moi</span>
        </label>

        <router-link
          to="/forgot-password"
          class="text-responsive-sm text-primary hover:text-primary-emphasis font-medium"
        >
          Mot de passe oublié ?
        </router-link>
      </div>

      <!-- Submit Button -->
      <Button
        type="submit"
        size="lg"
        :loading="loading"
        :disabled="!isFormValid"
        full-width
        class="glow-effect group relative overflow-hidden sm:block"
      >
        <span class="relative z-10 flex items-center justify-center gap-2">
          <Loader2 v-if="loading" class="w-5 h-5 animate-spin" />
          <span>{{ loading ? 'Connexion en cours...' : 'Se connecter' }}</span>
        </span>
        <div class="relative sm:absolute inset-0 bg-gradient-to-r from-primary-600 to-accent-blue/90 opacity-0 group-hover:transition-opacity duration-300" />
      </Button>

      <!-- Error Message Global -->
      <div v-if="errorMessage" class="p-4 rounded-lg bg-red-50 border border-red-200">
        <div class="flex items-stretch sm:items-start gap-3">
          <AlertCircle class="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
          <div>
            <h4 class="text-responsive-sm font-semibold text-red-800">Erreur de connexion</h4>
            <p class="text-responsive-sm text-red-700 mt-1">{{ errorMessage }}</p>
          </div>
        </div>
      </div>
    </form>

    <!-- Social Login Options -->
    <div class="space-y-4 animate-fade-in-up" style="animation-delay: 0.4s;">
      <div class="relative">
        <div class="relative sm:absolute inset-0 flex items-center">
          <div class="w-full border-t border-neutral-300" />
        </div>
        <div class="relative flex justify-center text-responsive-sm">
          <span class="px-4 bg-white text-muted">Ou continuez avec</span>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Button
          variant="outline"
          class="flex items-center justify-center gap-2 py-3"
          @click="handleSocialLogin('google')"
        >
          <svg class="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Google
        </Button>

        <Button
          variant="outline"
          class="flex items-center justify-center gap-2 py-3"
          @click="handleSocialLogin('facebook')"
        >
          <svg class="w-5 h-5" fill="#1877F2" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
          Facebook
        </Button>
      </div>
    </div>

    <!-- Sign Up Link -->
    <div class="text-left sm:text-center text-responsive-sm text-body animate-fade-in-up" style="animation-delay: 0.6s;">
      Vous n'avez pas encore de compte ?
      <router-link
        to="/register"
        class="font-semibold text-primary hover:text-primary-emphasis ml-1"
      >
        Créez votre compte
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useDesignSystem2025 } from '@/composables/useDesignSystem2025'

// Import 2025 components
import Button from '@/components/ui/2025/Button.vue'
import Input from '@/components/ui/2025/Input.vue'

// Import icons
import { Mail, Lock, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-vue-next'
import { sanitizeErrorMessage, logXssAttempt } from '@/utils/sanitization'

// Composables
const router = useRouter()
const authStore = useAuthStore()
const { logMigration } = useDesignSystem2025()

// Log migration usage
logMigration('LoginForm', 'Using 2025 components', {
  components: ['Button', 'Input'],
  legacyReplaced: ['btn', 'btn-primary', 'btn-lg', 'form-input', 'form-group', 'form-label']
})

// Reactive state
const loading = ref(false)
const showPassword = ref(false)
const errorMessage = ref('')

const form = ref({
  email: '',
  password: '',
  remember: false
})

const errors = ref({
  email: '',
  password: ''
})

// Computed
const isFormValid = computed(() => {
  return form.value.email && form.value.password && !errors.value.email && !errors.value.password
})

// Methods
const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value
}

const validateForm = () => {
  errors.value.email = ''
  errors.value.password = ''

  if (!form.value.email) {
    errors.value.email = 'L\'adresse email est requise'
    return false
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(form.value.email)) {
    errors.value.email = 'Veuillez saisir une adresse email valide'
    return false
  }

  if (!form.value.password) {
    errors.value.password = 'Le mot de passe est requis'
    return false
  }

  if (form.value.password.length < 6) {
    errors.value.password = 'Le mot de passe doit contenir au moins 6 caractères'
    return false
  }

  return true
}

const handleSubmit = async () => {
  if (!validateForm()) return

  loading.value = true
  errorMessage.value = ''

  try {
    await authStore.login({
      email: form.value.email,
      password: form.value.password,
      remember: form.value.remember
    })

    logMigration('LoginForm', 'Login success', { email: form.value.email })
    router.push('/dashboard')
  } catch (error: unknown) {
    // SECURITY FIX: Sanitize error messages to prevent XSS
    const rawError = (error instanceof Error ? error.message : String(error)) || 'Une erreur est survenue lors de la connexion'
    logXssAttempt(rawError, 'LoginForm error message')
    errorMessage.value = sanitizeErrorMessage(rawError)
    logMigration('LoginForm', 'Login error', { error: rawError })
  } finally {
    loading.value = false
  }
}

const handleSocialLogin = (provider: string) => {
  logMigration('LoginForm', 'Social login attempt', { provider })
  // Implementation for social login would go here
  // Social login implementation needed
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
