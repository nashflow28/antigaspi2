<template>
  <div v-if="hasError" class="error-boundary">
    <div class="error-container">
      <!-- Error Icon -->
      <div class="error-icon">
        <AlertTriangle class="w-16 h-16 text-red-500" />
      </div>

      <!-- Error Content -->
      <div class="error-content">
        <h2 class="error-title">
          {{ errorInfo.title || 'Une erreur est survenue' }}
        </h2>

        <p class="error-message">
          {{ errorInfo.message || 'Nous nous excusons pour le désagrément. Veuillez réessayer ou contacter le support si le problème persiste.' }}
        </p>

        <!-- Error Details (Dev Mode) -->
        <details v-if="isDev && errorDetails" class="error-details">
          <summary class="error-details-toggle">
            Détails techniques (Mode développement)
          </summary>
          <div class="error-details-content">
            <div class="error-stack">
              <h4>Stack Trace:</h4>
              <pre>{{ errorDetails.stack }}</pre>
            </div>
            <div class="error-info" v-if="errorDetails.info">
              <h4>Informations Vue:</h4>
              <pre>{{ errorDetails.info }}</pre>
            </div>
            <div class="error-props" v-if="errorDetails.props">
              <h4>Props du composant:</h4>
              <pre>{{ JSON.stringify(errorDetails.props, null, 2) }}</pre>
            </div>
          </div>
        </details>

        <!-- Actions -->
        <div class="error-actions">
          <button @click="retry" class="btn-retry">
            <RefreshCw class="w-4 h-4 mr-2" />
            Réessayer
          </button>

          <button @click="goHome" class="btn-home">
            <Home class="w-4 h-4 mr-2" />
            Retour à l'accueil
          </button>

          <button v-if="isDev" @click="clearError" class="btn-clear">
            <X class="w-4 h-4 mr-2" />
            Effacer l'erreur
          </button>
        </div>

        <!-- Support Info -->
        <div class="support-info">
          <p class="support-text">
            Besoin d'aide ? Contactez notre support :
          </p>
          <div class="support-methods">
            <a href="mailto:support@antigaspi.ci" class="support-link">
              <Mail class="w-4 h-4 mr-1" />
              support@antigaspi.ci
            </a>
            <span class="support-divider">•</span>
            <span class="error-id">ID: {{ errorId }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Slot par défaut quand pas d'erreur -->
  <slot v-else />
</template>

<script setup lang="ts">
import { ref, computed, onErrorCaptured, getCurrentInstance } from 'vue'
import { useRouter } from 'vue-router'
import { AlertTriangle, RefreshCw, Home, X, Mail } from 'lucide-vue-next'
import { useErrorReporting } from '@/composables/useErrorReporting'

interface ErrorInfo {
  title?: string
  message?: string
  level?: 'error' | 'warning' | 'info'
  recoverable?: boolean
}

interface ErrorDetails {
  stack?: string
  info?: string
  props?: Record<string, any>
  componentName?: string
  timestamp?: number
}

const props = withDefaults(defineProps<{
  fallback?: ErrorInfo
  onError?: (error: Error, info: ErrorDetails) => void
  enableRetry?: boolean
  enableNavigation?: boolean
  showSupportInfo?: boolean
}>(), {
  enableRetry: true,
  enableNavigation: true,
  showSupportInfo: true
})

const emit = defineEmits<{
  error: [error: Error, info: ErrorDetails]
  retry: []
  recovered: []
}>()

const router = useRouter()
const { reportError } = useErrorReporting()

const hasError = ref(false)
const errorInfo = ref<ErrorInfo>({})
const errorDetails = ref<ErrorDetails | null>(null)
const errorId = ref<string>('')
const retryCount = ref(0)

const isDev = computed(() => import.meta.env.DEV)
const maxRetries = 3

const generateErrorId = (): string => {
  return `ERR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// Capture d'erreurs Vue
onErrorCaptured((error: Error, instance, info: string) => {
  console.error('Error captured by ErrorBoundary:', error)

  const componentName = instance?.type?.name || instance?.type?.__name || 'UnknownComponent'
  const details: ErrorDetails = {
    stack: error.stack,
    info,
    componentName,
    timestamp: Date.now(),
    props: instance?.props
  }

  handleError(error, details)

  // Retourner false pour empêcher la propagation
  return false
})

const handleError = (error: Error, details: ErrorDetails) => {
  hasError.value = true
  errorId.value = generateErrorId()
  errorDetails.value = details

  // Utiliser le fallback si fourni, sinon des valeurs par défaut
  errorInfo.value = {
    title: props.fallback?.title,
    message: props.fallback?.message,
    level: props.fallback?.level || 'error',
    recoverable: props.fallback?.recoverable ?? true
  }

  // Émettre l'événement d'erreur
  emit('error', error, details)

  // Callback personnalisé si fourni
  if (props.onError) {
    props.onError(error, details)
  }

  // Reporter l'erreur
  reportError(error, {
    errorId: errorId.value,
    component: details.componentName,
    userAgent: navigator.userAgent,
    url: window.location.href,
    timestamp: details.timestamp,
    retryCount: retryCount.value
  })
}

const retry = () => {
  if (retryCount.value >= maxRetries) {
    errorInfo.value.message = `Nombre maximum de tentatives atteint (${maxRetries}). Veuillez rafraîchir la page ou contacter le support.`
    return
  }

  retryCount.value++
  hasError.value = false
  errorDetails.value = null

  emit('retry')

  // Si après 100ms il n'y a toujours pas d'erreur, on considère que c'est récupéré
  setTimeout(() => {
    if (!hasError.value) {
      emit('recovered')
      retryCount.value = 0
    }
  }, 100)
}

const clearError = () => {
  hasError.value = false
  errorDetails.value = null
  retryCount.value = 0
  emit('recovered')
}

const goHome = () => {
  router.push('/')
  clearError()
}

// Exposer les méthodes pour utilisation externe
defineExpose({
  hasError,
  retry,
  clearError,
  errorId
})
</script>

<style scoped>
.error-boundary {
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
  border-radius: 1rem;
  border: 1px solid #fecaca;
}

.error-container {
  max-width: 600px;
  width: 100%;
  text-align: center;
  background: white;
  padding: 2rem;
  border-radius: 1rem;
  box-shadow: 0 10px 25px -5px rgba(239, 68, 68, 0.1);
  border: 1px solid #fee2e2;
}

.error-icon {
  margin-bottom: 1.5rem;
  display: flex;
  justify-content: center;
}

.error-content {
  text-align: left;
}

.error-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #dc2626;
  margin-bottom: 1rem;
  text-align: center;
}

.error-message {
  color: #6b7280;
  line-height: 1.6;
  margin-bottom: 1.5rem;
  text-align: center;
}

.error-details {
  margin: 1.5rem 0;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  overflow: hidden;
}

.error-details-toggle {
  background: #f9fafb;
  padding: 0.75rem 1rem;
  cursor: pointer;
  font-weight: 500;
  color: #374151;
  border: none;
  width: 100%;
  text-align: left;
}

.error-details-toggle:hover {
  background: #f3f4f6;
}

.error-details-content {
  padding: 1rem;
  background: #fafafa;
  font-size: 0.875rem;
}

.error-stack,
.error-info,
.error-props {
  margin-bottom: 1rem;
}

.error-stack h4,
.error-info h4,
.error-props h4 {
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.5rem;
}

.error-stack pre,
.error-info pre,
.error-props pre {
  background: #1f2937;
  color: #f9fafb;
  padding: 0.75rem;
  border-radius: 0.375rem;
  overflow-x: auto;
  font-size: 0.75rem;
  line-height: 1.4;
}

.error-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.btn-retry,
.btn-home,
.btn-clear {
  display: inline-flex;
  align-items: center;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-weight: 500;
  transition: all 0.2s;
  border: none;
  cursor: pointer;
}

.btn-retry {
  background: #dc2626;
  color: white;
}

.btn-retry:hover {
  background: #b91c1c;
  transform: translateY(-1px);
}

.btn-home {
  background: #6b7280;
  color: white;
}

.btn-home:hover {
  background: #4b5563;
  transform: translateY(-1px);
}

.btn-clear {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
}

.btn-clear:hover {
  background: #e5e7eb;
}

.support-info {
  padding-top: 1.5rem;
  border-top: 1px solid #e5e7eb;
  text-align: center;
}

.support-text {
  color: #6b7280;
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
}

.support-methods {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.support-link {
  display: inline-flex;
  align-items: center;
  color: #2563eb;
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 500;
}

.support-link:hover {
  color: #1d4ed8;
  text-decoration: underline;
}

.support-divider {
  color: #d1d5db;
}

.error-id {
  font-family: 'Courier New', monospace;
  font-size: 0.75rem;
  color: #6b7280;
  background: #f3f4f6;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
}

/* Mobile responsiveness */
@media (max-width: 640px) {
  .error-boundary {
    padding: 1rem;
  }

  .error-container {
    padding: 1.5rem;
  }

  .error-title {
    font-size: 1.25rem;
  }

  .error-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .btn-retry,
  .btn-home,
  .btn-clear {
    justify-content: center;
  }

  .support-methods {
    flex-direction: column;
    gap: 0.25rem;
  }

  .support-divider {
    display: none;
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .error-boundary {
    background: linear-gradient(135deg, #3f1f1f 0%, #2c1010 100%);
    border-color: #7f1d1d;
  }

  .error-container {
    background: #1f2937;
    border-color: #374151;
  }

  .error-title {
    color: #f87171;
  }

  .error-message {
    color: #d1d5db;
  }

  .error-details {
    border-color: #374151;
  }

  .error-details-toggle {
    background: #374151;
    color: #d1d5db;
  }

  .error-details-toggle:hover {
    background: #4b5563;
  }

  .error-details-content {
    background: #374151;
  }

  .support-info {
    border-color: #374151;
  }

  .support-text {
    color: #9ca3af;
  }

  .error-id {
    background: #374151;
    color: #9ca3af;
  }
}
</style>