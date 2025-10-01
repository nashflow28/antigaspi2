<template>
  <!-- Migration Progressive Pattern -->
  <LoginForm2025 v-if="useDesignSystem2025().isEnabled" />
  <div v-else class="space-y-8">
    <!-- Header moderne -->
    <div class="text-left sm:text-center animate-fade-in-up">
      <h3 class="text-xl font-semibold text-gray-900 mt-2">
        Content de vous revoir !
      </h3>
      <p class="text-gray-700">
        Connectez-vous pour accéder à votre compte Antigaspi
      </p>
    </div>

    <form class="space-y-6 animate-fade-in-up" style="animation-delay: 0.2s;" @submit.prevent="handleSubmit">
      <!-- Email Input -->
      <div class="space-y-4">
        <label for="email" class="block text-sm font-medium text-gray-800 mt-2 flex items-center gap-2">
          <span>Adresse email</span>
          <span class="text-red-600">*</span>
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
            <Mail class="h-4 w-4 text-gray-400" />
          </template>
        </Input>
      </div>

      <!-- Password Input -->
      <div class="space-y-4">
        <label for="password" class="block text-sm font-medium text-gray-800 mt-2 flex items-center gap-2">
          <span>Mot de passe</span>
          <span class="text-red-600">*</span>
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
              <Lock class="h-4 w-4 text-gray-400" />
            </template>
          </Input>
          <button
            type="button"
            class="relative sm:absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:transition-colors duration-200"
            @click="togglePasswordVisibility"
          >
            <Eye v-if="!showPassword" class="h-4 w-4" />
            <EyeOff v-else class="h-4 w-4" />
          </button>
        </div>
      </div>

      <!-- Options et liens -->
      <div class="flex items-center justify-start sm:justify-between">
        <div class="flex items-center gap-2">
          <input
            id="remember-me"
            v-model="form.remember"
            type="checkbox"
            class="h-4 w-4 text-blue-600 bg-white border-2 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
          >
          <label for="remember-me" class="text-sm text-gray-800 font-medium">
            Se souvenir de moi
          </label>
        </div>

        <div class="text-sm">
          <a href="#" class="font-medium text-blue-600 hover:transition-colors duration-200 hover:underline">
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
        class="w-full glow-effect group relative overflow-hidden sm:block"
      >
        <span class="relative z-10 flex items-center justify-center gap-2">
          <Loader2 v-if="loading" class="h-4 w-4 animate-spin" />
          <span>{{ loading ? 'Connexion en cours...' : 'Se connecter' }}</span>
        </span>
        <div class="relative sm:absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-500/90 opacity-0 group-hover:transition-opacity duration-300" />
      </Button>

      <!-- Divider -->
      <div class="relative">
        <div class="relative sm:absolute inset-0 flex items-center">
          <div class="w-full border-t border-gray-200" />
        </div>
        <div class="relative flex justify-center text-sm">
          <span class="px-3 bg-white text-gray-500 font-medium">ou</span>
        </div>
      </div>

      <!-- Register Link -->
      <div class="text-left sm:text-center">
        <p class="text-gray-700">
          Pas encore de compte ?
          <router-link
            to="/register"
            class="font-medium text-blue-600 hover:transition-colors duration-200 hover:underline ml-1"
          >
            Créer un compte
          </router-link>
        </p>
      </div>
    </form>

    <!-- Footer Links -->
    <div class="text-left sm:text-center text-sm text-gray-500 animate-fade-in-up" style="animation-delay: 0.4s;">
      <p>
        En vous connectant, vous acceptez nos
        <a href="#" class="text-blue-600 hover:text-blue-900 hover:transition-colors duration-200">
          Conditions d'utilisation
        </a>
        et notre
        <a href="#" class="text-blue-600 hover:text-blue-900 hover:transition-colors duration-200">
          Politique de confidentialité
        </a>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-vue-next'
import type { LoginCredentials } from '@/types'
import { useDesignSystem2025 } from '@/composables/useDesignSystem2025'
import LoginForm2025 from './LoginForm2025.vue'

// Import 2025 Design System components for fallback
import Input from '@/components/ui/2025/Input.vue'
import Button from '@/components/ui/2025/Button.vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const isValidRedirect = (target: unknown): target is string => {
  return typeof target === 'string' && target.startsWith('/') && !target.startsWith('//')
}

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
      console.log('[LoginForm] Login successful, authStore.user:', authStore.user)
      console.log('[LoginForm] User role:', authStore.user?.role)
      console.log('[LoginForm] isAuthenticated:', authStore.isAuthenticated)
      console.log('[LoginForm] token:', authStore.token?.substring(0, 20) + '...')

      // Small delay to ensure reactive state propagates
      await new Promise(resolve => setTimeout(resolve, 100))

      console.log('[LoginForm] After delay - isAuthenticated:', authStore.isAuthenticated)

      // Check for redirect query parameter
      const redirectTarget = route.query.redirect
      if (isValidRedirect(redirectTarget)) {
        console.log('[LoginForm] Redirecting to query redirect:', redirectTarget)
        await router.push(redirectTarget)
        return
      }

      // Direct redirect based on user role
      const user = authStore.user
      console.log('[LoginForm] Checking user role for redirect...')
      let targetPath = '/dashboard'

      if (user?.role === 'admin') {
        targetPath = '/admin/dashboard'
        console.log('[LoginForm] Redirecting admin to', targetPath)
      } else if (user?.role === 'merchant') {
        targetPath = '/merchant/dashboard'
        console.log('[LoginForm] Redirecting merchant to', targetPath)
      } else {
        console.log('[LoginForm] Redirecting consumer to', targetPath)
      }

      console.log('[LoginForm] About to call router.push with:', targetPath)
      const navigationResult = await router.push(targetPath)
      console.log('[LoginForm] Navigation result:', navigationResult)
      console.log('[LoginForm] Current route after push:', router.currentRoute.value.path)
    }
  } catch {
    // L'erreur est déjà gérée par le store et affichée via les notifications
    // console.error('Login error:', error)
  } finally {
    loading.value = false
  }
}
</script>
