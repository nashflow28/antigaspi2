<template>
  <div
    v-if="hasError"
    class="flex min-h-[400px] items-center justify-center rounded-[32px] bg-gradient-to-br from-rose-50 via-red-50 to-red-100 px-6 py-10 sm:px-10"
  >
    <Card
      variant="elevated"
      rounded="xl"
      class="w-full max-w-2xl space-y-6 bg-white/80 p-8 text-center shadow-xl backdrop-blur"
    >
      <div class="flex flex-col items-center gap-4">
        <div class="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600 shadow-inner">
          <AlertTriangle class="h-8 w-8" />
        </div>

        <div class="space-y-2">
          <h2 class="text-responsive-xl font-semibold text-neutral-900">
            {{ errorInfo.title || 'Une erreur est survenue' }}
          </h2>
          <p class="text-responsive-base text-neutral-600">
            {{ errorInfo.message || 'Nous nous excusons pour le désagrément. Veuillez réessayer ou contacter le support si le problème persiste.' }}
          </p>
        </div>
      </div>

      <details
        v-if="isDev && errorDetails"
        class="rounded-xl border border-neutral-200 bg-white/70 text-left shadow-sm"
      >
        <summary class="flex cursor-pointer items-center justify-between gap-3 px-4 py-3 text-responsive-sm font-medium text-neutral-700">
          Détails techniques (Mode développement)
        </summary>
        <div class="space-y-4 border-t border-neutral-100 bg-neutral-50/80 px-4 py-4 text-responsive-sm text-neutral-700">
          <div v-if="errorDetails.stack" class="space-y-2">
            <h4 class="font-semibold text-neutral-800">Stack Trace</h4>
            <pre class="max-h-64 overflow-auto rounded-lg bg-neutral-900/90 p-3 text-responsive-xs text-neutral-100">{{ errorDetails.stack }}</pre>
          </div>
          <div v-if="errorDetails.info" class="space-y-2">
            <h4 class="font-semibold text-neutral-800">Informations Vue</h4>
            <pre class="max-h-48 overflow-auto rounded-lg bg-neutral-900/90 p-3 text-responsive-xs text-neutral-100">{{ errorDetails.info }}</pre>
          </div>
          <div v-if="errorDetails.props" class="space-y-2">
            <h4 class="font-semibold text-neutral-800">Props du composant</h4>
            <pre class="max-h-48 overflow-auto rounded-lg bg-neutral-900/90 p-3 text-responsive-xs text-neutral-100">{{ JSON.stringify(errorDetails.props, null, 2) }}</pre>
          </div>
        </div>
      </details>

      <div class="flex flex-wrap items-center justify-center gap-3">
        <Button
          v-if="props.enableRetry"
          variant="destructive"
          class="gap-2"
          @click="retry"
        >
          <RefreshCw class="h-4 w-4" />
          Réessayer
        </Button>
        <Button
          v-if="props.enableNavigation"
          variant="secondary"
          class="gap-2"
          @click="goHome"
        >
          <Home class="h-4 w-4" />
          Retour à l'accueil
        </Button>
        <Button
          v-if="isDev"
          variant="outline"
          class="gap-2"
          @click="clearError"
        >
          <X class="h-4 w-4" />
          Effacer l'erreur
        </Button>
      </div>

      <div v-if="props.showSupportInfo" class="space-y-3 rounded-xl bg-neutral-50/70 px-5 py-4 text-center">
        <p class="text-responsive-sm text-neutral-600">
          Besoin d'aide ? Contactez notre support :
        </p>
        <div class="flex flex-wrap items-center justify-center gap-2 text-responsive-sm font-medium text-neutral-700">
          <a
            href="mailto:support@antigaspi.ci"
            class="flex items-center gap-2 text-primary-600 transition hover:text-primary-700"
          >
            <Mail class="h-4 w-4" />
            support@antigaspi.ci
          </a>
          <span class="text-neutral-400">•</span>
          <span class="rounded-full bg-white px-3 py-1 text-responsive-xs font-semibold uppercase tracking-wide text-neutral-500">
            ID: {{ errorId }}
          </span>
        </div>
      </div>
    </Card>
  </div>

  <!-- Slot par défaut quand pas d'erreur -->
  <slot v-else />
</template>

<script setup lang="ts">
import { ref, computed, onErrorCaptured } from 'vue'
import { useRouter } from 'vue-router'
import { AlertTriangle, RefreshCw, Home, X, Mail } from 'lucide-vue-next'
import Card from '@/components/ui/2025/Card.vue'
import Button from '@/components/ui/2025/Button.vue'
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

  const componentName = 'UnknownComponent'
  const details: ErrorDetails = {
    stack: error.stack,
    info,
    componentName,
    timestamp: Date.now(),
    props: (instance as any)?.$props
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

