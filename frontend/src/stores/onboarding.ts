import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { notify } from '@/composables/useNotifications'

const STORAGE_KEY = 'antigaspi_onboarding_completed'

export const useOnboardingStore = defineStore('onboarding', () => {
  const initialized = ref(false)
  const loading = ref(false)
  const completed = ref(false)
  const currentStep = ref(0)
  const totalSteps = ref(3)

  const init = () => {
    if (initialized.value) {
      return
    }

    if (typeof window !== 'undefined') {
      completed.value = window.localStorage.getItem(STORAGE_KEY) === 'true'
    }

    initialized.value = true
  }

  const shouldShowOnboarding = computed(() => !completed.value)

  const persistCompletion = () => {
    if (typeof window === 'undefined') {
      return
    }

    try {
      window.localStorage.setItem(STORAGE_KEY, completed.value ? 'true' : 'false')
    } catch (error) {
      console.error('Unable to persist onboarding status', error)
    }
  }

  const goToStep = (stepIndex: number) => {
    const normalizedIndex = Math.max(0, Math.min(stepIndex, totalSteps.value - 1))
    currentStep.value = normalizedIndex
    return normalizedIndex
  }

  const nextStep = async () => {
    if (currentStep.value < totalSteps.value - 1) {
      currentStep.value += 1
      return { done: false, step: currentStep.value }
    }

    return completeOnboarding()
  }

  const previousStep = () => {
    if (currentStep.value === 0) {
      return currentStep.value
    }

    currentStep.value -= 1
    return currentStep.value
  }

  const completeOnboarding = () => {
    completed.value = true
    persistCompletion()
    notify.success('Bienvenue sur AntiGaspi !', 'Onboarding terminé')
    return { done: true as const }
  }

  const reset = () => {
    completed.value = false
    currentStep.value = 0
    persistCompletion()
  }

  const skipOnboarding = () => {
    completed.value = true
    persistCompletion()
    notify.info('Vous pourrez retrouver ce guide plus tard dans votre profil.', 'Onboarding ignoré')
    return { skipped: true as const }
  }

  return {
    loading,
    currentStep,
    totalSteps,
    shouldShowOnboarding,
    init,
    goToStep,
    nextStep,
    previousStep,
    completeOnboarding,
    reset,
    skipOnboarding,
  }
})
