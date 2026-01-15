<template>
  <form class="space-y-6" @submit.prevent="handleSubmit">
    <!-- Role Selection -->
    <div>
      <label class="block text-sm font-medium text-gray-800 mb-2">
        Je souhaite m'inscrire en tant que :
      </label>
      <div class="grid grid-cols-2 gap-3">
        <label
          class="relative flex cursor-pointer rounded border p-4 focus:outline-none"
          :class="form.role === 'consumer'
            ? 'border-blue-600 bg-blue-50 text-blue-900'
            : 'border-gray-300 bg-white text-gray-900 hover:bg-gray-50'"
        >
          <input
            v-model="form.role"
            type="radio"
            value="consumer"
            class="sr-only"
          >
          <div class="flex flex-col">
            <div class="flex items-center">
              <span class="text-xl mr-2">🛒</span>
              <span class="block text-sm font-medium">Consommateur</span>
            </div>
            <span class="mt-1 block text-xs text-gray-500">
              Découvrir et réserver des produits
            </span>
          </div>
        </label>

        <label
          class="relative flex cursor-pointer rounded border p-4 focus:outline-none"
          :class="form.role === 'merchant'
            ? 'border-blue-600 bg-blue-50 text-blue-900'
            : 'border-gray-300 bg-white text-gray-900 hover:bg-gray-50'"
        >
          <input
            v-model="form.role"
            type="radio"
            value="merchant"
            class="sr-only"
          >
          <div class="flex flex-col">
            <div class="flex items-center">
              <span class="text-xl mr-2">🏪</span>
              <span class="block text-sm font-medium">Commerçant</span>
            </div>
            <span class="mt-1 block text-xs text-gray-500">
              Vendre mes invendus
            </span>
          </div>
        </label>
      </div>
      <p v-if="errors.role" class="mt-1 text-sm text-red-600">{{ errors.role }}</p>
    </div>

    <!-- Personal Information -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div>
        <label for="first_name" class="block text-sm font-medium text-gray-800 mt-2">
          Prénom
        </label>
        <input
          id="first_name"
          v-model="form.first_name"
          name="first_name"
          type="text"
          required
          autocomplete="given-name"
          class="input-2025"
          :class="{ 'border-red-500': errors.first_name }"
          placeholder="Votre prénom"
        >
        <p v-if="errors.first_name" class="mt-1 text-sm text-red-600">{{ errors.first_name }}</p>
      </div>

      <div>
        <label for="last_name" class="block text-sm font-medium text-gray-800 mt-2">
          Nom
        </label>
        <input
          id="last_name"
          v-model="form.last_name"
          name="last_name"
          type="text"
          required
          autocomplete="family-name"
          class="input-2025"
          :class="{ 'border-red-500': errors.last_name }"
          placeholder="Votre nom"
        >
        <p v-if="errors.last_name" class="mt-1 text-sm text-red-600">{{ errors.last_name }}</p>
      </div>
    </div>

    <!-- Contact Information -->
    <div>
      <label for="email" class="block text-sm font-medium text-gray-800 mt-2">
        Adresse e-mail
      </label>
      <input
        id="email"
        v-model="form.email"
        type="email"
        required
        autocomplete="email"
        class="input-2025"
        :class="{ 'border-red-500': errors.email }"
        placeholder="votre@email.com"
      >
      <p v-if="errors.email" class="mt-1 text-sm text-red-600">{{ errors.email }}</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div>
        <label for="phone" class="block text-sm font-medium text-gray-800 mt-2">
          Téléphone
        </label>
        <input
          id="phone"
          v-model="form.phone"
          name="phone"
          type="tel"
          autocomplete="tel"
          class="input-2025"
          :class="{ 'border-red-500': errors.phone }"
          placeholder="+225 XX XX XX XX XX"
        >
        <p v-if="errors.phone" class="mt-1 text-sm text-red-600">{{ errors.phone }}</p>
      </div>

      <div>
        <label for="city" class="block text-sm font-medium text-gray-800 mt-2">
          Ville
        </label>
        <input
          id="city"
          v-model="form.city"
          name="city"
          type="text"
          required
          class="input-2025"
          :class="{ 'border-red-500': errors.city }"
          placeholder="Abidjan, Bouaké, Yamoussoukro..."
        >
        <p v-if="errors.city" class="mt-1 text-sm text-red-600">{{ errors.city }}</p>
      </div>
    </div>

    <!-- Business Information (for merchants) -->
    <template v-if="form.role === 'merchant'">
      <div class="border-t border-gray-200 pt-8">
        <h3 class="text-lg font-medium text-gray-900 mt-3">Informations commerciales</h3>

        <div>
          <label for="business_name" class="block text-sm font-medium text-gray-800 mt-2">
            Nom de l'entreprise
          </label>
          <input
            id="business_name"
            v-model="form.business_name"
            type="text"
            :required="form.role === 'merchant'"
            class="input-2025"
            :class="{ 'border-red-500': errors.business_name }"
            placeholder="Nom de votre commerce"
          >
          <p v-if="errors.business_name" class="mt-1 text-sm text-red-600">{{ errors.business_name }}</p>
        </div>

        <div class="mt-4">
          <label for="business_type" class="block text-sm font-medium text-gray-800 mt-2">
            Type de commerce
          </label>
          <select
            id="business_type"
            v-model="form.business_type"
            :required="form.role === 'merchant'"
            class="input-2025"
            :class="{ 'border-red-500': errors.business_type }"
          >
            <option value="">Sélectionner un type</option>
            <option value="Boulangerie">Boulangerie</option>
            <option value="Épicerie">Épicerie</option>
            <option value="Supermarché">Supermarché</option>
            <option value="Restaurant">Restaurant</option>
            <option value="Pâtisserie">Pâtisserie</option>
            <option value="Primeur">Primeur (Fruits & Légumes)</option>
            <option value="Boucherie">Boucherie</option>
            <option value="Poissonnerie">Poissonnerie</option>
            <option value="Traiteur">Traiteur</option>
            <option value="Autre">Autre</option>
          </select>
          <p v-if="errors.business_type" class="mt-1 text-sm text-red-600">{{ errors.business_type }}</p>
        </div>
      </div>
    </template>

    <!-- Password -->
    <div>
      <label for="password" class="block text-sm font-medium text-gray-800 mt-2">
        Mot de passe
      </label>
      <div class="relative">
        <input
          id="password"
          v-model="form.password"
          :type="showPassword ? 'text' : 'password'"
          required
          autocomplete="new-password"
          class="input-2025 pr-10"
          :class="{ 'border-red-500': errors.password }"
          placeholder="Au moins 6 caractères"
        >
        <button
          type="button"
          class="relative sm:absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-700"
          @click="togglePasswordVisibility"
        >
          <svg
            v-if="!showPassword"
            class="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            />
          </svg>
          <svg
            v-else
            class="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
            />
          </svg>
        </button>
      </div>
      <p v-if="errors.password" class="mt-1 text-sm text-red-600">{{ errors.password }}</p>
    </div>

    <div>
      <label for="password_confirmation" class="block text-sm font-medium text-gray-800 mt-2">
        Confirmer le mot de passe
      </label>
      <input
        id="password_confirmation"
        v-model="form.password_confirmation"
        :type="showPassword ? 'text' : 'password'"
        required
        autocomplete="new-password"
        class="input-2025"
        :class="{ 'border-red-500': errors.password_confirmation }"
        placeholder="Retapez votre mot de passe"
      >
      <p v-if="errors.password_confirmation" class="mt-1 text-sm text-red-600">{{ errors.password_confirmation }}</p>
    </div>

    <!-- Terms and Conditions -->
    <div class="flex items-stretch sm:items-start">
      <input
        id="terms"
        v-model="form.acceptTerms"
        type="checkbox"
        required
        class="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
      >
      <label for="terms" class="ml-2 block text-sm text-gray-900">
        J'accepte les
        <a href="#" class="text-blue-600 hover:text-blue-700">conditions d'utilisation</a>
        et la
        <a href="#" class="text-blue-600 hover:text-blue-700">politique de confidentialité</a>
      </label>
    </div>
    <p v-if="errors.acceptTerms" class="mt-1 text-sm text-red-600">{{ errors.acceptTerms }}</p>

    <!-- Submit Button -->
    <div>
      <Button
        type="submit"
        :disabled="loading"
        variant="primary"
        size="lg"
        class="w-full"
        :class="{ 'opacity-50 cursor-not-allowed': loading }"
      >
        <svg
          v-if="loading"
          class="animate-spin mr-2 w-4 h-4 text-white"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        {{ loading ? 'Inscription...' : 'Créer mon compte' }}
      </Button>
    </div>

    <div class="text-left sm:text-center">
      <p class="text-sm text-gray-700">
        Déjà un compte ?
        <router-link to="/login" class="font-medium text-blue-600 hover:text-blue-700">
          Se connecter
        </router-link>
      </p>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import type { RegisterData } from '@/types'
import Button from '@/components/ui/2025/Button.vue'

const router = useRouter()
const authStore = useAuthStore()

const loading = ref(false)
const showPassword = ref(false)
const errors = ref<Record<string, string>>({})

const form = reactive<RegisterData & { acceptTerms: boolean }>({
  first_name: '',
  last_name: '',
  email: '',
  password: '',
  password_confirmation: '',
  phone: '',
  city: '',
  role: 'consumer',
  business_name: '',
  business_type: '',
  acceptTerms: false
})

const validateForm = (): boolean => {
  errors.value = {}

  // Required fields
  if (!form.first_name.trim()) {
    errors.value.first_name = 'Le prénom est requis'
  }

  if (!form.last_name.trim()) {
    errors.value.last_name = 'Le nom est requis'
  }

  if (!form.email.trim()) {
    errors.value.email = 'L\'adresse e-mail est requise'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.value.email = 'Veuillez saisir une adresse e-mail valide'
  }

  if (!form.city.trim()) {
    errors.value.city = 'La ville est requise'
  }

  if (!form.role) {
    errors.value.role = 'Veuillez sélectionner votre type de compte'
  }

  // Merchant-specific validation
  if (form.role === 'merchant') {
    if (!form.business_name?.trim()) {
      errors.value.business_name = 'Le nom de l\'entreprise est requis'
    }
    if (!form.business_type) {
      errors.value.business_type = 'Le type de commerce est requis'
    }
  }

  // Password validation
  if (!form.password) {
    errors.value.password = 'Le mot de passe est requis'
  } else if (form.password.length < 6) {
    errors.value.password = 'Le mot de passe doit contenir au moins 6 caractères'
  }

  if (!form.password_confirmation) {
    errors.value.password_confirmation = 'La confirmation du mot de passe est requise'
  } else if (form.password !== form.password_confirmation) {
    errors.value.password_confirmation = 'Les mots de passe ne correspondent pas'
  }

  // Phone validation (optional but if provided, should be valid)
  if (form.phone) {
    // Clean phone number for validation
    const cleanedPhone = form.phone.replace(/[\s\-()]/g, '')
    if (!/^\+?[\d]{8,}$/.test(cleanedPhone)) {
      errors.value.phone = 'Veuillez saisir un numéro de téléphone valide'
    }
  }

  // Terms acceptance
  if (!form.acceptTerms) {
    errors.value.acceptTerms = 'Vous devez accepter les conditions d\'utilisation'
  }

  return Object.keys(errors.value).length === 0
}

const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value
}

// Normalize phone to international format with +228 prefix (Togo)
const normalizePhone = (phone: string): string => {
  if (!phone) return ''

  // Clean the phone number (remove spaces, dashes, parentheses)
  let cleaned = phone.replace(/[\s\-()]/g, '')

  // If already has + prefix, return as-is (already international)
  if (cleaned.startsWith('+')) {
    return cleaned
  }

  // If starts with 00, replace with +
  if (cleaned.startsWith('00')) {
    return '+' + cleaned.substring(2)
  }

  // If starts with country code without +, add +
  if (cleaned.startsWith('228')) {
    return '+' + cleaned
  }

  // Otherwise, assume local Togo number and add +228
  return '+228' + cleaned
}

const handleSubmit = async () => {
  if (!validateForm()) {
    return
  }

  loading.value = true

  try {
    const registerData: RegisterData = {
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      email: form.email.trim().toLowerCase(),
      password: form.password,
      password_confirmation: form.password_confirmation,
      phone: form.phone?.trim() ? normalizePhone(form.phone.trim()) : undefined,
      city: form.city.trim(),
      role: form.role,
      business_name: form.role === 'merchant' ? form.business_name?.trim() : undefined,
      business_type: form.role === 'merchant' ? form.business_type : undefined
    }

    const result = await authStore.register(registerData)

    if (result.success) {
      // Rediriger selon le rôle de l'utilisateur
      const user = authStore.user
      if (user?.role === 'merchant') {
        router.push('/merchant/dashboard')
      } else {
        router.push('/dashboard')
      }
    }
  } catch {
    // L'erreur est déjà gérée par le store et affichée via les notifications
    // console.error('Register error:', error)
  } finally {
    loading.value = false
  }
}
</script>
