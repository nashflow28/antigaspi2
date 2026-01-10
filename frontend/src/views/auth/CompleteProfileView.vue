<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-emerald-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 px-4 py-12">
    <Card class="w-full max-w-md">
      <div class="text-center mb-8">
        <div class="mx-auto w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mb-4">
          <UserCircle class="h-8 w-8 text-primary-600 dark:text-primary-400" />
        </div>
        <h1 class="text-2xl font-bold text-slate-900 dark:text-white">
          Complétez votre profil
        </h1>
        <p class="text-slate-600 dark:text-slate-400 mt-2">
          Quelques informations supplémentaires pour personnaliser votre expérience
        </p>
      </div>

      <form class="space-y-6" @submit.prevent="handleSubmit">
        <!-- Name -->
        <div>
          <Label for="name">Nom complet *</Label>
          <Input
            id="name"
            v-model="form.name"
            type="text"
            placeholder="Jean Dupont"
            :error="errors.name"
            required
          />
        </div>

        <!-- Email -->
        <div>
          <Label for="email">Email</Label>
          <Input
            id="email"
            v-model="form.email"
            type="email"
            placeholder="jean@example.com"
            :error="errors.email"
          />
          <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Optionnel - Pour recevoir les notifications par email
          </p>
        </div>

        <!-- Location -->
        <div>
          <Label for="location">Ville / Quartier</Label>
          <div class="relative">
            <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <MapPin class="h-5 w-5 text-slate-400" />
            </div>
            <Input
              id="location"
              v-model="form.location"
              type="text"
              class="pl-10"
              placeholder="Lomé, Tokoin"
              :error="errors.location"
            />
          </div>
        </div>

        <!-- Preferences -->
        <div>
          <Label>Préférences alimentaires</Label>
          <div class="mt-2 grid grid-cols-2 gap-2">
            <button
              v-for="pref in preferences"
              :key="pref.value"
              type="button"
              class="flex items-center gap-2 p-3 rounded-xl border-2 transition-all"
              :class="form.preferences.includes(pref.value)
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                : 'border-slate-200 dark:border-slate-700 hover:border-primary-300 dark:hover:border-primary-600'"
              @click="togglePreference(pref.value)"
            >
              <component :is="pref.icon" class="h-5 w-5" />
              <span class="text-sm font-medium">{{ pref.label }}</span>
            </button>
          </div>
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
          :disabled="loading || !form.name"
        >
          <Loader2 v-if="loading" class="h-5 w-5 animate-spin mr-2" />
          {{ loading ? 'Enregistrement...' : 'Terminer l\'inscription' }}
        </Button>

        <!-- Skip Link -->
        <div class="text-center">
          <button
            type="button"
            class="text-sm text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400"
            @click="skipProfile"
          >
            Compléter plus tard
          </button>
        </div>
      </form>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { UserCircle, MapPin, AlertCircle, Loader2, Leaf, Apple, Fish, Milk } from 'lucide-vue-next'
import Card from '@/components/ui/2025/Card.vue'
import Button from '@/components/ui/2025/Button.vue'
import Input from '@/components/ui/2025/Input.vue'
import Label from '@/components/ui/2025/Label.vue'
import { useAuthStore } from '@/stores/auth'
import { apiService } from '@/services/api'
import { notify } from '@/composables/useNotifications'

const router = useRouter()
const authStore = useAuthStore()

const loading = ref(false)
const error = ref('')

const form = ref({
  name: '',
  email: '',
  location: '',
  preferences: [] as string[]
})

const errors = ref<Record<string, string>>({})

const preferences = [
  { value: 'vegetarian', label: 'Végétarien', icon: Leaf },
  { value: 'vegan', label: 'Végan', icon: Apple },
  { value: 'halal', label: 'Halal', icon: Fish },
  { value: 'lactose_free', label: 'Sans lactose', icon: Milk }
]

const togglePreference = (value: string) => {
  const index = form.value.preferences.indexOf(value)
  if (index === -1) {
    form.value.preferences.push(value)
  } else {
    form.value.preferences.splice(index, 1)
  }
}

const validateForm = (): boolean => {
  errors.value = {}

  if (!form.value.name || form.value.name.length < 2) {
    errors.value.name = 'Le nom doit contenir au moins 2 caractères'
    return false
  }

  if (form.value.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email)) {
    errors.value.email = 'Format d\'email invalide'
    return false
  }

  return true
}

const handleSubmit = async () => {
  if (!validateForm()) return

  loading.value = true
  error.value = ''

  try {
    const response = await apiService.put<{ success: boolean; message?: string; data?: { user?: Record<string, unknown> } }>('/profile/complete', {
      name: form.value.name,
      email: form.value.email || undefined,
      location: form.value.location || undefined,
      preferences: form.value.preferences.length > 0 ? form.value.preferences : undefined
    })

    if (response.success) {
      // Update user in store
      if (response.data?.user) {
        authStore.setUser(response.data.user as any)
      }

      notify.success('Profil complété', 'Bienvenue sur Antigaspi !')
      router.push({ name: 'home' })
    } else {
      error.value = response.message || 'Erreur lors de la mise à jour'
    }
  } catch (err: any) {
    error.value = err.message || 'Une erreur est survenue'
  } finally {
    loading.value = false
  }
}

const skipProfile = async () => {
  // Mark profile as skipped but not completed
  try {
    await apiService.post('/profile/skip-completion')
  } catch {
    // Ignore errors - just navigate away
  }
  router.push({ name: 'home' })
}

onMounted(() => {
  // Pre-fill with existing user data if available
  const user = authStore.user
  if (user) {
    form.value.name = `${user.first_name || ''} ${user.last_name || ''}`.trim() || ''
    form.value.email = user.email || ''
    form.value.location = user.city || ''
    form.value.preferences = (user as any).preferences || []
  }
})
</script>
