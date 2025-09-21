import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

export interface ErrorReport {
  error: Error
  context: ErrorContext
  metadata?: ErrorMetadata
}

export interface ErrorContext {
  errorId: string
  component?: string
  route?: string
  userAgent?: string
  url?: string
  timestamp?: number
  retryCount?: number
  userId?: string | number
  sessionId?: string
  buildVersion?: string
}

export interface ErrorMetadata {
  severity?: 'low' | 'medium' | 'high' | 'critical'
  category?: 'ui' | 'api' | 'network' | 'auth' | 'validation' | 'unknown'
  tags?: string[]
  breadcrumbs?: ErrorBreadcrumb[]
  userActions?: UserAction[]
}

export interface ErrorBreadcrumb {
  timestamp: number
  message: string
  category: 'navigation' | 'ui' | 'api' | 'console' | 'user'
  level: 'info' | 'warning' | 'error'
  data?: Record<string, any>
}

export interface UserAction {
  timestamp: number
  action: string
  target?: string
  data?: Record<string, any>
}

export const useErrorReporting = () => {
  const authStore = useAuthStore()

  const errorQueue = ref<ErrorReport[]>([])
  const isReporting = ref(false)
  const breadcrumbs = ref<ErrorBreadcrumb[]>([])
  const userActions = ref<UserAction[]>([])

  const isOnline = computed(() => navigator.onLine)
  const isDev = computed(() => import.meta.env.DEV)
  const buildVersion = computed(() => import.meta.env.VITE_APP_VERSION || 'dev')

  // Taille maximum des breadcrumbs et actions
  const MAX_BREADCRUMBS = 50
  const MAX_USER_ACTIONS = 30

  // Ajouter un breadcrumb
  const addBreadcrumb = (breadcrumb: Omit<ErrorBreadcrumb, 'timestamp'>) => {
    breadcrumbs.value.push({
      ...breadcrumb,
      timestamp: Date.now()
    })

    // Garder seulement les N derniers breadcrumbs
    if (breadcrumbs.value.length > MAX_BREADCRUMBS) {
      breadcrumbs.value = breadcrumbs.value.slice(-MAX_BREADCRUMBS)
    }
  }

  // Ajouter une action utilisateur
  const addUserAction = (action: Omit<UserAction, 'timestamp'>) => {
    userActions.value.push({
      ...action,
      timestamp: Date.now()
    })

    // Garder seulement les N dernières actions
    if (userActions.value.length > MAX_USER_ACTIONS) {
      userActions.value = userActions.value.slice(-MAX_USER_ACTIONS)
    }
  }

  // Déterminer la sévérité de l'erreur
  const getErrorSeverity = (error: Error): ErrorMetadata['severity'] => {
    const message = error.message.toLowerCase()

    if (message.includes('network') || message.includes('fetch')) {
      return 'medium'
    }

    if (message.includes('unauthorized') || message.includes('forbidden')) {
      return 'high'
    }

    if (message.includes('syntax') || message.includes('reference')) {
      return 'critical'
    }

    return 'low'
  }

  // Déterminer la catégorie de l'erreur
  const getErrorCategory = (error: Error): ErrorMetadata['category'] => {
    const message = error.message.toLowerCase()
    const stack = error.stack?.toLowerCase() || ''

    if (message.includes('fetch') || message.includes('network') || message.includes('xhr')) {
      return 'network'
    }

    if (message.includes('unauthorized') || message.includes('forbidden') || message.includes('token')) {
      return 'auth'
    }

    if (stack.includes('api') || message.includes('api')) {
      return 'api'
    }

    if (message.includes('validation') || message.includes('required') || message.includes('invalid')) {
      return 'validation'
    }

    if (stack.includes('vue') || stack.includes('component')) {
      return 'ui'
    }

    return 'unknown'
  }

  // Extraire des tags utiles de l'erreur
  const extractErrorTags = (error: Error, context: ErrorContext): string[] => {
    const tags: string[] = []

    if (context.component) {
      tags.push(`component:${context.component}`)
    }

    if (context.route) {
      tags.push(`route:${context.route}`)
    }

    if (error.name) {
      tags.push(`error-type:${error.name}`)
    }

    if (context.retryCount && context.retryCount > 0) {
      tags.push(`retry:${context.retryCount}`)
    }

    const userAgent = context.userAgent || navigator.userAgent
    if (userAgent.includes('Mobile')) {
      tags.push('mobile')
    } else if (userAgent.includes('Tablet')) {
      tags.push('tablet')
    } else {
      tags.push('desktop')
    }

    return tags
  }

  // Reporter une erreur
  const reportError = async (error: Error, context: Partial<ErrorContext> = {}) => {
    const fullContext: ErrorContext = {
      errorId: context.errorId || `ERR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      component: context.component,
      route: window.location.pathname,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: Date.now(),
      retryCount: context.retryCount || 0,
      userId: authStore.user?.id,
      sessionId: getSessionId(),
      buildVersion: buildVersion.value,
      ...context
    }

    const metadata: ErrorMetadata = {
      severity: getErrorSeverity(error),
      category: getErrorCategory(error),
      tags: extractErrorTags(error, fullContext),
      breadcrumbs: breadcrumbs.value.slice(-10), // Derniers 10 breadcrumbs
      userActions: userActions.value.slice(-5)   // Dernières 5 actions
    }

    const report: ErrorReport = {
      error,
      context: fullContext,
      metadata
    }

    // Log en console en mode dev
    if (isDev.value) {
      console.group(`🚨 Error Report: ${fullContext.errorId}`)
      console.error('Error:', error)
      console.log('Context:', fullContext)
      console.log('Metadata:', metadata)
      console.groupEnd()
    }

    // Ajouter à la queue
    errorQueue.value.push(report)

    // Envoyer immédiatement si en ligne
    if (isOnline.value) {
      await flushErrorQueue()
    }

    // Ajouter breadcrumb pour cette erreur
    addBreadcrumb({
      message: `Error reported: ${error.message}`,
      category: 'console',
      level: 'error',
      data: { errorId: fullContext.errorId, category: metadata.category }
    })
  }

  // Envoyer la queue d'erreurs
  const flushErrorQueue = async () => {
    if (isReporting.value || errorQueue.value.length === 0) {
      return
    }

    isReporting.value = true

    try {
      const reports = [...errorQueue.value]
      errorQueue.value = []

      // En production, envoyer vers un service de reporting (Sentry, LogRocket, etc.)
      if (!isDev.value) {
        await sendErrorReports(reports)
      }

      console.log(`📤 Sent ${reports.length} error report(s)`)
    } catch (error) {
      console.error('Failed to send error reports:', error)
      // Remettre les rapports dans la queue en cas d'échec
      errorQueue.value.unshift(...errorQueue.value)
    } finally {
      isReporting.value = false
    }
  }

  // Envoyer les rapports vers le service de reporting
  const sendErrorReports = async (reports: ErrorReport[]) => {
    // Simuler l'envoi - remplacer par votre service réel
    const payload = {
      reports: reports.map(report => ({
        id: report.context.errorId,
        message: report.error.message,
        stack: report.error.stack,
        context: report.context,
        metadata: report.metadata
      })),
      environment: import.meta.env.MODE,
      timestamp: Date.now()
    }

    // En production, remplacer par votre endpoint de reporting
    if (import.meta.env.PROD) {
      try {
        await fetch('/api/errors/report', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authStore.token}`
          },
          body: JSON.stringify(payload)
        })
      } catch (error) {
        console.warn('Error reporting service unavailable:', error)
      }
    }
  }

  // Obtenir l'ID de session
  const getSessionId = (): string => {
    let sessionId = sessionStorage.getItem('error-session-id')
    if (!sessionId) {
      sessionId = `SESSION-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      sessionStorage.setItem('error-session-id', sessionId)
    }
    return sessionId
  }

  // Capturer les erreurs globales non gérées
  const setupGlobalErrorHandlers = () => {
    // Erreurs JavaScript non capturées
    window.addEventListener('error', (event) => {
      reportError(new Error(event.message), {
        component: 'GlobalErrorHandler',
        errorId: `GLOBAL-${Date.now()}`,
        retryCount: 0
      })
    })

    // Promesses rejetées non gérées
    window.addEventListener('unhandledrejection', (event) => {
      const error = event.reason instanceof Error
        ? event.reason
        : new Error(String(event.reason))

      reportError(error, {
        component: 'UnhandledPromiseRejection',
        errorId: `PROMISE-${Date.now()}`,
        retryCount: 0
      })
    })

    // Événements de connectivité
    window.addEventListener('online', () => {
      addBreadcrumb({
        message: 'Connection restored',
        category: 'console',
        level: 'info'
      })

      // Essayer d'envoyer les erreurs en attente
      flushErrorQueue()
    })

    window.addEventListener('offline', () => {
      addBreadcrumb({
        message: 'Connection lost',
        category: 'console',
        level: 'warning'
      })
    })
  }

  // Nettoyer les données anciennes
  const cleanup = () => {
    const oneHourAgo = Date.now() - (60 * 60 * 1000)

    breadcrumbs.value = breadcrumbs.value.filter(b => b.timestamp > oneHourAgo)
    userActions.value = userActions.value.filter(a => a.timestamp > oneHourAgo)
  }

  // Configuration automatique
  if (typeof window !== 'undefined') {
    setupGlobalErrorHandlers()

    // Nettoyage périodique
    setInterval(cleanup, 5 * 60 * 1000) // Toutes les 5 minutes
  }

  return {
    // État
    errorQueue,
    isReporting,
    breadcrumbs,
    userActions,

    // Méthodes principales
    reportError,
    flushErrorQueue,

    // Méthodes utilitaires
    addBreadcrumb,
    addUserAction,
    cleanup,

    // Helpers
    getErrorSeverity,
    getErrorCategory,
    extractErrorTags
  }
}

// Fonction helper pour utilisation globale
export const reportGlobalError = (error: Error, context?: Partial<ErrorContext>) => {
  const { reportError } = useErrorReporting()
  return reportError(error, context)
}