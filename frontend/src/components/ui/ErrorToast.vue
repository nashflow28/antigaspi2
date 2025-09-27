<template>
  <Teleport to="body">
    <div
      v-if="errors.length > 0"
      class="pointer-events-none fixed inset-0 z-50 flex flex-col items-end justify-start gap-2 p-4 sm:p-6"
    >
      <TransitionGroup
        name="error-toast"
        tag="div"
        class="flex flex-col gap-2"
      >
        <div
          v-for="error in visibleErrors"
          :key="error.id"
          class="pointer-events-auto w-full max-w-sm overflow-hidden rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5"
          :class="getErrorClasses(error.severity)"
        >
          <div class="p-4">
            <div class="flex items-start">
              <div class="flex-shrink-0">
                <component
                  :is="getErrorIcon(error.severity)"
                  class="h-6 w-6"
                  :class="getIconClasses(error.severity)"
                />
              </div>

              <div class="ml-3 w-0 flex-1 pt-0.5">
                <p class="text-responsive-sm font-medium text-neutral-900">
                  {{ getErrorTitle(error.severity) }}
                </p>
                <p class="mt-1 text-responsive-sm text-neutral-500">
                  {{ error.userMessage }}
                </p>

                <!-- Action buttons for critical errors -->
                <div
                  v-if="error.severity === 'critical' && error.retryable"
                  class="mt-3 flex space-x-7"
                >
                  <button
                    type="button"
                    class="rounded-md bg-white text-responsive-sm font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    @click="retryError(error)"
                  >
                    Réessayer
                  </button>
                </div>
              </div>

              <div class="ml-4 flex flex-shrink-0">
                <button
                  type="button"
                  class="inline-flex rounded-md bg-white text-neutral-400 hover:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  @click="dismissError(error.id)"
                >
                  <span class="sr-only">Fermer</span>
                  <X class="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          <!-- Auto-dismiss progress bar -->
          <div
            v-if="error.severity !== 'critical' && getTimeRemaining(error) > 0"
            class="h-1 bg-neutral-200"
          >
            <div
              class="h-full transition-all duration-100 ease-linear"
              :class="getProgressClasses(error.severity)"
              :style="{ width: `${getProgressWidth(error)}%` }"
            />
          </div>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { X, AlertTriangle, XCircle, AlertCircle, Info } from 'lucide-vue-next'
import { useErrorHandler } from '@/composables/useErrorHandler'
import type { ErrorInfo, ErrorSeverity } from '@/utils/errorTypes'

const { globalErrors, removeError } = useErrorHandler()

// Show only recent errors (last 5)
const visibleErrors = computed(() => {
  return globalErrors.value
    .slice(-5)
    .reverse() // Most recent first
})

const errors = computed(() => globalErrors.value)

// Auto-dismiss timer
let dismissTimer: NodeJS.Timeout | null = null

const startDismissTimer = () => {
  if (dismissTimer) {
    clearInterval(dismissTimer)
  }

  dismissTimer = setInterval(() => {
    const now = Date.now()
    const dismissableErrors = errors.value.filter(error =>
      error.severity !== 'critical' &&
      (now - error.timestamp) >= 10000
    )

    dismissableErrors.forEach(error => {
      removeError(error.id)
    })
  }, 1000)
}

const getTimeRemaining = (error: ErrorInfo): number => {
  if (error.severity === 'critical') return 0
  const elapsed = Date.now() - error.timestamp
  const remaining = Math.max(0, 10000 - elapsed)
  return remaining
}

const getProgressWidth = (error: ErrorInfo): number => {
  if (error.severity === 'critical') return 0
  const remaining = getTimeRemaining(error)
  return (remaining / 10000) * 100
}

const getErrorTitle = (severity: ErrorSeverity): string => {
  switch (severity) {
    case 'critical': return 'Erreur critique'
    case 'error': return 'Erreur'
    case 'warning': return 'Attention'
    case 'info': return 'Information'
    default: return 'Erreur'
  }
}

const getErrorIcon = (severity: ErrorSeverity) => {
  switch (severity) {
    case 'critical': return XCircle
    case 'error': return AlertTriangle
    case 'warning': return AlertCircle
    case 'info': return Info
    default: return AlertTriangle
  }
}

const getErrorClasses = (severity: ErrorSeverity): string => {
  switch (severity) {
    case 'critical': return 'border-l-4 border-red-400'
    case 'error': return 'border-l-4 border-orange-400'
    case 'warning': return 'border-l-4 border-yellow-400'
    case 'info': return 'border-l-4 border-blue-400'
    default: return 'border-l-4 border-gray-400'
  }
}

const getIconClasses = (severity: ErrorSeverity): string => {
  switch (severity) {
    case 'critical': return 'text-red-400'
    case 'error': return 'text-orange-400'
    case 'warning': return 'text-yellow-400'
    case 'info': return 'text-blue-400'
    default: return 'text-gray-400'
  }
}

const getProgressClasses = (severity: ErrorSeverity): string => {
  switch (severity) {
    case 'error': return 'bg-orange-400'
    case 'warning': return 'bg-yellow-400'
    case 'info': return 'bg-blue-400'
    default: return 'bg-gray-400'
  }
}

const dismissError = (errorId: string) => {
  removeError(errorId)
}

const retryError = (error: ErrorInfo) => {
  // This would be implemented based on the specific error context
  console.log('Retrying error:', error)
  removeError(error.id)
}

onMounted(() => {
  startDismissTimer()
})

onUnmounted(() => {
  if (dismissTimer) {
    clearInterval(dismissTimer)
  }
})
</script>

<style scoped>
.error-toast-enter-active,
.error-toast-leave-active {
  transition: all 0.3s ease;
}

.error-toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.error-toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.error-toast-move {
  transition: transform 0.3s ease;
}
</style>
