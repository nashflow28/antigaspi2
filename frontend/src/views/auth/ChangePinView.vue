<template>
  <div class="min-h-screen bg-gradient-to-br from-neutral-50 to-primary-50 dark:from-neutral-900 dark:to-neutral-800">
    <div class="container mx-auto px-4 py-10">
      <!-- Back button -->
      <div class="mb-8">
        <Button
          variant="ghost"
          size="sm"
          @click="$router.back()"
        >
          <ArrowLeft class="mr-2 h-4 w-4" />
          Retour
        </Button>
      </div>

      <div class="mx-auto max-w-md">
        <!-- Header -->
        <div class="mb-8 text-center">
          <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900">
            <Lock class="h-8 w-8 text-primary-600 dark:text-primary-400" />
          </div>
          <h1 class="text-2xl font-semibold text-neutral-900 dark:text-white">
            Modifier le code PIN
          </h1>
          <p class="mt-2 text-neutral-600 dark:text-neutral-400">
            Sécurisez votre compte en modifiant votre code PIN.
          </p>
        </div>

        <!-- Info card -->
        <Card class="mb-6 border-primary-200 bg-primary-50 dark:border-primary-800 dark:bg-primary-900/20">
          <div class="flex items-start gap-3 p-4">
            <Shield class="mt-0.5 h-5 w-5 flex-shrink-0 text-primary-600 dark:text-primary-400" />
            <div>
              <p class="font-medium text-primary-900 dark:text-primary-100">
                Sécurisez votre compte
              </p>
              <p class="mt-1 text-sm text-primary-700 dark:text-primary-300">
                Votre code PIN protège l'accès à votre compte et vos paiements.
              </p>
            </div>
          </div>
        </Card>

        <!-- Form -->
        <Card class="p-6">
          <form class="space-y-6" @submit.prevent="handleSubmit">
            <!-- Current PIN -->
            <div>
              <label
                for="current-pin"
                class="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300"
              >
                Code PIN actuel
              </label>
              <div class="relative">
                <Input
                  id="current-pin"
                  v-model="form.currentPin"
                  :type="showCurrentPin ? 'text' : 'password'"
                  inputmode="numeric"
                  pattern="[0-9]*"
                  maxlength="4"
                  placeholder="••••"
                  class="text-center text-xl tracking-[0.5em]"
                  :disabled="loading"
                  @input="onPinInput('currentPin', $event)"
                />
                <button
                  type="button"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                  @click="showCurrentPin = !showCurrentPin"
                >
                  <Eye v-if="!showCurrentPin" class="h-5 w-5" />
                  <EyeOff v-else class="h-5 w-5" />
                </button>
              </div>
            </div>

            <!-- New PIN -->
            <div>
              <label
                for="new-pin"
                class="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300"
              >
                Nouveau code PIN
              </label>
              <div class="relative">
                <Input
                  id="new-pin"
                  ref="newPinInput"
                  v-model="form.newPin"
                  :type="showNewPin ? 'text' : 'password'"
                  inputmode="numeric"
                  pattern="[0-9]*"
                  maxlength="4"
                  placeholder="••••"
                  class="text-center text-xl tracking-[0.5em]"
                  :disabled="loading"
                  @input="onPinInput('newPin', $event)"
                />
                <button
                  type="button"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                  @click="showNewPin = !showNewPin"
                >
                  <Eye v-if="!showNewPin" class="h-5 w-5" />
                  <EyeOff v-else class="h-5 w-5" />
                </button>
              </div>
              <!-- PIN strength indicator -->
              <div
                v-if="form.newPin"
                class="mt-2"
              >
                <div class="flex gap-1">
                  <div
                    v-for="i in 4"
                    :key="i"
                    :class="[
                      'h-1 flex-1 rounded-full transition-colors',
                      i <= pinStrength.level
                        ? pinStrength.color
                        : 'bg-neutral-200 dark:bg-neutral-700'
                    ]"
                  />
                </div>
                <p :class="['mt-1 text-xs', pinStrength.textColor]">
                  {{ pinStrength.text }}
                </p>
              </div>
            </div>

            <!-- Confirm PIN -->
            <div>
              <label
                for="confirm-pin"
                class="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300"
              >
                Confirmer le nouveau code PIN
              </label>
              <div class="relative">
                <Input
                  id="confirm-pin"
                  ref="confirmPinInput"
                  v-model="form.confirmPin"
                  :type="showConfirmPin ? 'text' : 'password'"
                  inputmode="numeric"
                  pattern="[0-9]*"
                  maxlength="4"
                  placeholder="••••"
                  class="text-center text-xl tracking-[0.5em]"
                  :disabled="loading"
                  :class="{
                    'border-error-500 focus:ring-error-500': form.confirmPin && form.newPin !== form.confirmPin,
                    'border-success-500 focus:ring-success-500': form.confirmPin && form.newPin === form.confirmPin && form.confirmPin.length === 4
                  }"
                  @input="onPinInput('confirmPin', $event)"
                />
                <button
                  type="button"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                  @click="showConfirmPin = !showConfirmPin"
                >
                  <Eye v-if="!showConfirmPin" class="h-5 w-5" />
                  <EyeOff v-else class="h-5 w-5" />
                </button>
              </div>
              <p
                v-if="form.confirmPin && form.newPin !== form.confirmPin"
                class="mt-1 text-sm text-error-600 dark:text-error-400"
              >
                Les codes PIN ne correspondent pas
              </p>
              <p
                v-if="form.confirmPin && form.newPin === form.confirmPin && form.confirmPin.length === 4"
                class="mt-1 text-sm text-success-600 dark:text-success-400"
              >
                <CheckCircle class="mr-1 inline h-4 w-4" />
                Les codes PIN correspondent
              </p>
            </div>

            <!-- Error message -->
            <Alert v-if="error" variant="error">
              {{ error }}
            </Alert>

            <!-- Success message -->
            <Alert v-if="success" variant="success">
              {{ success }}
            </Alert>

            <!-- Submit button -->
            <Button
              type="submit"
              class="w-full"
              :disabled="!isFormValid || loading"
            >
              <template v-if="loading">
                <Loader2 class="mr-2 h-4 w-4 animate-spin" />
                Modification...
              </template>
              <template v-else>
                <Lock class="mr-2 h-4 w-4" />
                Modifier le code PIN
              </template>
            </Button>
          </form>
        </Card>

        <!-- Security tips -->
        <div class="mt-8 rounded-lg bg-neutral-100 p-4 dark:bg-neutral-800">
          <p class="mb-3 text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Conseils pour un code PIN sécurisé :
          </p>
          <ul class="space-y-2">
            <li
              v-for="tip in tips"
              :key="tip"
              class="flex items-start gap-2 text-sm text-neutral-600 dark:text-neutral-400"
            >
              <CheckCircle class="mt-0.5 h-4 w-4 flex-shrink-0 text-success-500" />
              {{ tip }}
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  ArrowLeft,
  Lock,
  Shield,
  Eye,
  EyeOff,
  CheckCircle,
  Loader2
} from 'lucide-vue-next'
import { Card, Button, Input, Alert } from '@/components/ui/2025'
import { deviceService } from '@/services/deviceService'
import { notify } from '@/composables/useNotifications'

const router = useRouter()

const form = reactive({
  currentPin: '',
  newPin: '',
  confirmPin: ''
})

const showCurrentPin = ref(false)
const showNewPin = ref(false)
const showConfirmPin = ref(false)
const loading = ref(false)
const error = ref<string | null>(null)
const success = ref<string | null>(null)

const newPinInput = ref<HTMLInputElement | null>(null)
const confirmPinInput = ref<HTMLInputElement | null>(null)

const tips = [
  'Évitez les suites simples (1234, 0000)',
  'N\'utilisez pas votre date de naissance',
  'Ne partagez jamais votre code PIN',
  'Changez régulièrement votre code PIN'
]

// Computed: PIN strength
const pinStrength = computed(() => {
  const pin = form.newPin

  if (!pin || pin.length < 4) {
    return { level: 0, text: '', color: '', textColor: '' }
  }

  // Check for simple patterns
  const isSequential = /^(0123|1234|2345|3456|4567|5678|6789|9876|8765|7654|6543|5432|4321|3210)$/.test(pin)
  const isRepeating = /^(\d)\1{3}$/.test(pin)
  const isPalindrome = pin === pin.split('').reverse().join('')
  const hasRepetition = /(\d)\1/.test(pin)

  if (isSequential || isRepeating) {
    return {
      level: 1,
      text: 'Très faible - Évitez les suites et répétitions',
      color: 'bg-error-500',
      textColor: 'text-error-600 dark:text-error-400'
    }
  }

  if (isPalindrome) {
    return {
      level: 2,
      text: 'Faible - Évitez les palindromes',
      color: 'bg-warning-500',
      textColor: 'text-warning-600 dark:text-warning-400'
    }
  }

  if (hasRepetition) {
    return {
      level: 3,
      text: 'Moyen - Acceptable',
      color: 'bg-warning-400',
      textColor: 'text-warning-600 dark:text-warning-400'
    }
  }

  return {
    level: 4,
    text: 'Fort - Excellent choix !',
    color: 'bg-success-500',
    textColor: 'text-success-600 dark:text-success-400'
  }
})

// Computed: Form validity
const isFormValid = computed(() => {
  return form.currentPin.length === 4 &&
    form.newPin.length === 4 &&
    form.confirmPin.length === 4 &&
    form.newPin === form.confirmPin &&
    form.currentPin !== form.newPin
})

// Methods
const onPinInput = (field: 'currentPin' | 'newPin' | 'confirmPin', event: Event) => {
  const input = event.target as HTMLInputElement
  const value = input.value.replace(/\D/g, '').slice(0, 4)
  form[field] = value

  // Auto-focus next field when current is complete
  if (value.length === 4) {
    if (field === 'currentPin' && newPinInput.value) {
      newPinInput.value.focus()
    } else if (field === 'newPin' && confirmPinInput.value) {
      confirmPinInput.value.focus()
    }
  }
}

const handleSubmit = async () => {
  error.value = null
  success.value = null

  // Validation
  if (form.currentPin.length !== 4) {
    error.value = 'Le code PIN actuel doit contenir 4 chiffres.'
    return
  }

  if (form.newPin.length !== 4) {
    error.value = 'Le nouveau code PIN doit contenir 4 chiffres.'
    return
  }

  if (form.newPin !== form.confirmPin) {
    error.value = 'Les codes PIN ne correspondent pas.'
    return
  }

  if (form.currentPin === form.newPin) {
    error.value = 'Le nouveau code PIN doit être différent de l\'ancien.'
    return
  }

  loading.value = true

  try {
    const response = await deviceService.changePin(
      form.currentPin,
      form.newPin,
      form.confirmPin
    )

    if (response.success) {
      success.value = 'Votre code PIN a été modifié avec succès.'
      notify.success('Code PIN modifié avec succès')

      // Reset form
      form.currentPin = ''
      form.newPin = ''
      form.confirmPin = ''

      // Navigate back after delay
      setTimeout(() => {
        router.back()
      }, 2000)
    } else {
      error.value = response.message || 'Impossible de modifier le code PIN.'
    }
  } catch (err: any) {
    error.value = err?.response?.data?.message ||
      err?.message ||
      'Une erreur est survenue lors de la modification du code PIN.'
  } finally {
    loading.value = false
  }
}
</script>
