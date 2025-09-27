import { ref, computed, readonly } from 'vue'
import type { ErrorInfo, ErrorContext, ErrorSeverity } from '@/utils/errorTypes'

const globalErrors = ref<ErrorInfo[]>([])
const isOnline = ref(navigator.onLine)
const retryQueue = ref<(() => Promise<void>)[]>([])

export function useErrorHandler() {
  const hasErrors = computed(() => globalErrors.value.length > 0)
  const criticalErrors = computed(() =>
    globalErrors.value.filter(error => error.severity === 'critical')
  )

  const handleError = (
    error: Error | unknown,
    context: ErrorContext = {},
    severity: ErrorSeverity = 'error'
  ): ErrorInfo => {
    const timestamp = Date.now()
    const errorInfo: ErrorInfo = {
      id: generateErrorId(),
      message: getErrorMessage(error),
      severity,
      context,
      timestamp,
      stack: error instanceof Error ? error.stack : undefined,
      retryable: isRetryableError(error),
      userMessage: getUserFriendlyMessage(error, context)
    }

    globalErrors.value.push(errorInfo)

    if (severity !== 'critical') {
      setTimeout(() => {
        removeError(errorInfo.id)
      }, 10000)
    }

    logError(errorInfo)
    return errorInfo
  }

  const handleApiError = (error: unknown, endpoint: string, retryFn?: () => Promise<void>) => {
    const context: ErrorContext = {
      type: 'api',
      endpoint,
      userAgent: navigator.userAgent,
      online: isOnline.value
    }

    if (!isOnline.value) {
      return handleError(
        new Error('Network unavailable'),
        context,
        'warning'
      )
    }

    if (isAuthError(error)) {
      context.type = 'auth'
      return handleError(error, context, 'critical')
    }

    if (isValidationError(error)) {
      context.type = 'validation'
      return handleError(error, context, 'warning')
    }

    if (isServerError(error)) {
      context.type = 'server'
      if (retryFn) {
        retryQueue.value.push(retryFn)
      }
      return handleError(error, context, 'error')
    }

    return handleError(error, context, 'error')
  }

  const removeError = (errorId: string) => {
    const index = globalErrors.value.findIndex(e => e.id === errorId)
    if (index !== -1) {
      globalErrors.value.splice(index, 1)
    }
  }

  const clearErrors = () => {
    globalErrors.value = []
  }

  const setupNetworkMonitoring = () => {
    window.addEventListener('online', () => {
      isOnline.value = true
    })

    window.addEventListener('offline', () => {
      isOnline.value = false
      handleError(
        new Error('Connection lost'),
        { type: 'network' },
        'warning'
      )
    })
  }

  return {
    globalErrors: readonly(globalErrors),
    hasErrors,
    criticalErrors,
    isOnline: readonly(isOnline),
    handleError,
    handleApiError,
    removeError,
    clearErrors,
    setupNetworkMonitoring
  }
}

function generateErrorId(): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substr(2, 9)
  return `err_${timestamp}_${random}`
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return 'Une erreur inconnue est survenue'
}

function getUserFriendlyMessage(error: unknown, context: ErrorContext): string {
  const errorMessage = getErrorMessage(error).toLowerCase()

  if (!navigator.onLine || errorMessage.includes('network')) {
    return 'Problème de connexion internet. Vérifiez votre connexion et réessayez.'
  }

  if (context.type === 'auth' || errorMessage.includes('unauthorized')) {
    return 'Votre session a expiré. Veuillez vous reconnecter.'
  }

  if (context.type === 'validation' || errorMessage.includes('validation')) {
    return 'Veuillez vérifier les informations saisies et réessayer.'
  }

  if (context.type === 'server' || errorMessage.includes('500')) {
    return 'Problème temporaire du serveur. Nous travaillons à le résoudre.'
  }

  return 'Une erreur inattendue est survenue. Veuillez réessayer.'
}

function isRetryableError(error: unknown): boolean {
  const message = getErrorMessage(error).toLowerCase()
  return !navigator.onLine ||
         message.includes('network') ||
         message.includes('500') ||
         message.includes('timeout')
}

function isAuthError(error: unknown): boolean {
  const message = getErrorMessage(error).toLowerCase()
  return message.includes('unauthorized') || message.includes('401')
}

function isValidationError(error: unknown): boolean {
  const message = getErrorMessage(error).toLowerCase()
  return message.includes('validation') || message.includes('400')
}

function isServerError(error: unknown): boolean {
  const message = getErrorMessage(error).toLowerCase()
  return message.includes('500') || message.includes('502') || message.includes('503')
}

function logError(errorInfo: ErrorInfo) {
  if (import.meta.env.DEV) {
    console.group(`🚨 Error [${errorInfo.severity}]`)
    console.error('Message:', errorInfo.message)
    console.error('Context:', errorInfo.context)
    console.groupEnd()
  }
}
