<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div class="bg-white rounded-xl p-6 w-full max-w-md">
      <div class="flex items-center justify-between mb-6">
        <h3 class="text-responsive-xl font-semibold text-neutral-900">
          {{ hasPin ? 'Modifier le code PIN' : 'Configurer le code PIN' }}
        </h3>
        <button
          class="text-neutral-400 hover:text-neutral-600"
          @click="$emit('close')"
        >
          <svg
            class="w-10 h-10"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <form @submit.prevent="handleSubmit">
        <div class="space-y-4">
          <div v-if="hasPin">
            <label class="block text-responsive-sm font-medium text-neutral-700 mb-2">
              Code PIN actuel
            </label>
            <input
              v-model="form.currentPin"
              type="password"
              maxlength="6"
              placeholder="••••••"
              class="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-center text-responsive-lg tracking-widest"
              :class="{'border-red-300': errors.currentPin}"
              required
              @input="formatPinInput"
            >
            <p v-if="errors.currentPin" class="mt-1 text-responsive-sm text-red-600">{{ errors.currentPin }}</p>
          </div>

          <div>
            <label class="block text-responsive-sm font-medium text-neutral-700 mb-2">
              {{ hasPin ? 'Nouveau code PIN' : 'Code PIN' }}
            </label>
            <input
              v-model="form.newPin"
              type="password"
              maxlength="6"
              placeholder="••••••"
              class="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-center text-responsive-lg tracking-widest"
              :class="{'border-red-300': errors.newPin}"
              required
              @input="formatPinInput"
            >
            <p v-if="errors.newPin" class="mt-1 text-responsive-sm text-red-600">{{ errors.newPin }}</p>
          </div>

          <div>
            <label class="block text-responsive-sm font-medium text-neutral-700 mb-2">
              Confirmer le {{ hasPin ? 'nouveau ' : '' }}code PIN
            </label>
            <input
              v-model="form.confirmPin"
              type="password"
              maxlength="6"
              placeholder="••••••"
              class="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-center text-responsive-lg tracking-widest"
              :class="{'border-red-300': errors.confirmPin}"
              required
              @input="formatPinInput"
            >
            <p v-if="errors.confirmPin" class="mt-1 text-responsive-sm text-red-600">{{ errors.confirmPin }}</p>
          </div>

          <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div class="flex items-start space-x-2">
              <svg class="w-5 h-5 text-yellow-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
              </svg>
              <div class="text-responsive-sm text-yellow-700">
                <p class="font-medium">Sécurité importante</p>
                <ul class="mt-1 space-y-2 text-responsive-xs">
                  <li>• Le code PIN doit contenir 4 à 6 chiffres</li>
                  <li>• Évitez les codes évidents (1234, 0000, etc.)</li>
                  <li>• Ne partagez jamais votre code PIN</li>
                  <li>• Mémorisez-le, ne l'écrivez pas</li>
                </ul>
              </div>
            </div>
          </div>

          <!-- PIN Strength Indicator -->
          <div v-if="form.newPin" class="space-y-2">
            <div class="flex justify-between text-responsive-sm">
              <span class="text-neutral-600">Force du PIN</span>
              <span :class="pinStrengthClass">{{ pinStrengthText }}</span>
            </div>
            <div class="w-full bg-neutral-200 rounded-full h-2">
              <div
                class="h-2 rounded-full transition-all duration-300"
                :class="pinStrengthColor"
                :style="{width: pinStrengthPercentage + '%'}"
              />
            </div>
          </div>
        </div>

        <div class="flex space-x-3 mt-6">
          <button
            type="button"
            class="flex-1 px-4 py-3 border border-neutral-300 rounded-lg text-neutral-700 hover:transition-colors"
            @click="$emit('close')"
          >
            Annuler
          </button>
          <button
            type="submit"
            :disabled="loading || !isValid"
            class="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:transition-colors"
          >
            <span v-if="loading" class="flex items-center justify-center">
              <svg class="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                  class="opacity-25"
                />
                <path fill="currentColor" class="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Enregistrement...
            </span>
            <span v-else>
              {{ hasPin ? 'Modifier' : 'Configurer' }} le PIN
            </span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface PinForm {
  currentPin: string
  newPin: string
  confirmPin: string
}

const props = defineProps<{
  hasPin: boolean
  loading?: boolean
}>()

const emit = defineEmits<{
  close: []
  submit: [data: { currentPin?: string; newPin: string }]
}>()

const form = ref<PinForm>({
  currentPin: '',
  newPin: '',
  confirmPin: ''
})

const errors = ref<Partial<Record<keyof PinForm, string>>>({})

const formatPinInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  target.value = target.value.replace(/\D/g, '')
}

const pinStrength = computed(() => {
  const pin = form.value.newPin
  if (!pin) return 0

  let strength = 0

  // Length check
  if (pin.length >= 4) strength += 25
  if (pin.length >= 6) strength += 25

  // No consecutive numbers
  let hasConsecutive = false
  for (let i = 0; i < pin.length - 1; i++) {
    if (Math.abs(parseInt(pin[i]) - parseInt(pin[i + 1])) === 1) {
      hasConsecutive = true
      break
    }
  }
  if (!hasConsecutive) strength += 25

  // No repeated digits
  const unique = new Set(pin.split(''))
  if (unique.size >= 3) strength += 25

  return strength
})

const pinStrengthText = computed(() => {
  if (pinStrength.value < 25) return 'Très faible'
  if (pinStrength.value < 50) return 'Faible'
  if (pinStrength.value < 75) return 'Moyen'
  return 'Fort'
})

const pinStrengthClass = computed(() => {
  if (pinStrength.value < 25) return 'text-red-600'
  if (pinStrength.value < 50) return 'text-orange-600'
  if (pinStrength.value < 75) return 'text-yellow-600'
  return 'text-green-600'
})

const pinStrengthColor = computed(() => {
  if (pinStrength.value < 25) return 'bg-red-500'
  if (pinStrength.value < 50) return 'bg-orange-500'
  if (pinStrength.value < 75) return 'bg-yellow-500'
  return 'bg-green-500'
})

const pinStrengthPercentage = computed(() => pinStrength.value)

const isValid = computed(() => {
  return (!props.hasPin || form.value.currentPin) &&
         form.value.newPin &&
         form.value.newPin.length >= 4 &&
         form.value.newPin.length <= 6 &&
         form.value.newPin === form.value.confirmPin &&
         pinStrength.value >= 25
})

const validateForm = (): boolean => {
  errors.value = {}

  if (props.hasPin && !form.value.currentPin) {
    errors.value.currentPin = 'Le code PIN actuel est requis'
    return false
  }

  if (!form.value.newPin) {
    errors.value.newPin = 'Le nouveau code PIN est requis'
    return false
  }

  if (form.value.newPin.length < 4) {
    errors.value.newPin = 'Le code PIN doit contenir au moins 4 chiffres'
    return false
  }

  if (form.value.newPin.length > 6) {
    errors.value.newPin = 'Le code PIN ne peut pas dépasser 6 chiffres'
    return false
  }

  if (!/^\d+$/.test(form.value.newPin)) {
    errors.value.newPin = 'Le code PIN ne doit contenir que des chiffres'
    return false
  }

  if (form.value.newPin !== form.value.confirmPin) {
    errors.value.confirmPin = 'Les codes PIN ne correspondent pas'
    return false
  }

  // Check for weak PINs
  const weakPins = ['1234', '0000', '1111', '2222', '3333', '4444', '5555', '6666', '7777', '8888', '9999']
  if (weakPins.includes(form.value.newPin)) {
    errors.value.newPin = 'Ce code PIN est trop évident, choisissez-en un autre'
    return false
  }

  if (pinStrength.value < 25) {
    errors.value.newPin = 'Ce code PIN est trop faible'
    return false
  }

  return true
}

const handleSubmit = () => {
  if (validateForm()) {
    const data: { currentPin?: string; newPin: string } = {
      newPin: form.value.newPin
    }

    if (props.hasPin) {
      data.currentPin = form.value.currentPin
    }

    emit('submit', data)
  }
}
</script>
