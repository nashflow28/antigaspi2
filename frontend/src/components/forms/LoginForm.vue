<template>
  <!-- Migration Progressive Pattern -->
  <LoginForm2025 v-if="useDesignSystem2025().isEnabled" />
  <div v-else class="space-y-8">
    <!-- Header moderne -->
    <div class="text-center animate-fade-in-up">
      <h3 class="text-responsive-xl font-semibold text-neutral-900 mb-2">
        Content de vous revoir !
      </h3>
      <p class="text-neutral-600">
        Connectez-vous pour accéder à votre compte Antigaspi
      </p>
    </div>

    <form class="space-y-6 animate-fade-in-up" style="animation-delay: 0.2s;" @submit.prevent="handleSubmit">
      <!-- Email Input -->
      <div class="form-group-2025">
        <label for="email" class="block text-responsive-sm font-medium text-neutral-700 mb-2 flex items-center gap-2">
          <span>Adresse email</span>
          <span class="text-accent-red">*</span>
        </label>
        <Input
          id="email"
          v-model="form.email"
          type="email"
          placeholder="votre@email.com"
          :error="errors.email"
          autocomplete="email"
          required
          class="pl-12"
        >
          <template #icon>
            <Mail class="w-5 h-5 text-neutral-400" />
          </template>
        </Input>
      </div>

      <!-- Password Input -->
      <div class="form-group-2025">
        <label for="password" class="block text-responsive-sm font-medium text-neutral-700 mb-2 flex items-center gap-2">
          <span>Mot de passe</span>
          <span class="text-accent-red">*</span>
        </label>
        <div class="relative">
          <Input
            id="password"
            v-model="form.password"
            :type="showPassword ? 'text' : 'password'"
            placeholder="••••••••"
            :error="errors.password"
            autocomplete="current-password"
            required
            class="pl-12 pr-12"
          >
            <template #icon>
              <Lock class="w-5 h-5 text-neutral-400" />
            </template>
          </Input>
          <button
            type="button"
            class="absolute inset-y-0 right-0 pr-4 flex items-center text-neutral-400 hover:text-primary-600 transition-colors duration-200"
            @click="togglePasswordVisibility"
          >
            <Eye v-if="!showPassword" class="w-5 h-5" />
            <EyeOff v-else class="w-5 h-5" />
          </button>
        </div>
      </div>

      <!-- Options et liens -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <input
            id="remember-me"
            v-model="form.remember"
            type="checkbox"
            class="w-4 h-4 text-primary-600 bg-white border-2 border-neutral-300 rounded focus:ring-primary-500 focus:ring-2"
          >
          <label for="remember-me" class="text-responsive-sm text-neutral-700 font-medium">
            Se souvenir de moi
          </label>
        </div>

        <div class="text-responsive-sm">
          <a href="#" class="font-medium text-primary-600 hover:text-primary-700 transition-colors duration-200 hover:underline">
            Mot de passe oublié ?
          </a>
        </div>
      </div>

      <!-- Submit Button -->
      <Button
        type="submit"
        variant="primary"
        size="lg"
        :disabled="loading"
        class="w-full glow-effect group relative overflow-hidden"
      >
        <span class="relative z-10 flex items-center justify-center gap-2">
          <Loader2 v-if="loading" class="w-5 h-5 animate-spin" />
          <span>{{ loading ? 'Connexion en cours...' : 'Se connecter' }}</span>
        </span>
        <div class="absolute inset-0 bg-gradient-to-r from-primary-600 to-accent-blue/90 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </Button>

      <!-- Divider -->
      <div class="relative">
        <div class="absolute inset-0 flex items-center">
          <div class="w-full border-t border-neutral-200" />
        </div>
        <div class="relative flex justify-center text-responsive-sm">
          <span class="px-4 bg-white text-neutral-500 font-medium">ou</span>
        </div>
      </div>

      <!-- Register Link -->
      <div class="text-center">
        <p class="text-neutral-600">
          Pas encore de compte ?
          <router-link
            to="/register"
            class="font-medium text-primary-600 hover:text-primary-700 transition-colors duration-200 hover:underline ml-1"
          >
            Créer un compte
          </router-link>
        </p>
      </div>
    </form>

    <!-- Footer Links -->
    <div class="text-center text-responsive-sm text-neutral-500 animate-fade-in-up" style="animation-delay: 0.4s;">
      <p>
        En vous connectant, vous acceptez nos
        <a href="#" class="text-primary-600 hover:text-primary-700 hover:underline transition-colors duration-200">
          Conditions d'utilisation
        </a>
        et notre
        <a href="#" class="text-primary-600 hover:text-primary-700 hover:underline transition-colors duration-200">
          Politique de confidentialité
        </a>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-vue-next'
import type { LoginCredentials } from '@/types'
import { useDesignSystem2025 } from '@/composables/useDesignSystem2025'
import LoginForm2025 from './LoginForm2025.vue'

// Import 2025 Design System components for fallback
import Input from '@/components/ui/2025/Input.vue'
import Button from '@/components/ui/2025/Button.vue'

const router = useRouter()
const authStore = useAuthStore()

const loading = ref(false)
const showPassword = ref(false)
const errors = ref<Record<string, string>>({})

const form = reactive<LoginCredentials & { remember: boolean }>({
  email: '',
  password: '',
  remember: false
})

const validateForm = (): boolean => {
  errors.value = {}

  if (!form.email) {
    errors.value.email = 'L\'adresse e-mail est requise'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.value.email = 'Veuillez saisir une adresse e-mail valide'
  }

  if (!form.password) {
    errors.value.password = 'Le mot de passe est requis'
  } else if (form.password.length < 6) {
    errors.value.password = 'Le mot de passe doit contenir au moins 6 caractères'
  }

  return Object.keys(errors.value).length === 0
}

const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value
}

const handleSubmit = async () => {
  if (!validateForm()) {
    return
  }

  loading.value = true

  try {
    const result = await authStore.login({
      email: form.email,
      password: form.password
    })

    if (result.success) {
      // Rediriger selon le rôle de l'utilisateur
      const user = authStore.user
      if (user?.role === 'admin') {
        router.push('/admin/dashboard')
      } else if (user?.role === 'merchant') {
        router.push('/merchant/dashboard')
      } else {
        router.push('/dashboard')
      }
    }
  } catch (error: any) {
    // L'erreur est déjà gérée par le store et affichée via les notifications
    console.error('Login error:', error)
  } finally {
    loading.value = false
  }
}
</script>
