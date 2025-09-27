export type ErrorSeverity = 'info' | 'warning' | 'error' | 'critical'

export type ErrorType =
  | 'api'
  | 'auth'
  | 'validation'
  | 'network'
  | 'component'
  | 'async'
  | 'server'
  | 'retry'
  | 'unknown'

export interface ErrorContext {
  type?: ErrorType
  endpoint?: string
  component?: string
  operation?: string
  userAgent?: string
  url?: string
  online?: boolean
  props?: Record<string, any>
  timestamp?: number
}

export interface ErrorInfo {
  id: string
  message: string
  userMessage: string
  severity: ErrorSeverity
  context: ErrorContext
  timestamp: number
  stack?: string
  retryable: boolean
  retryCount?: number
  lastRetry?: number
}

export interface ApiError {
  response?: {
    status: number
    statusText: string
    data?: {
      message?: string
      errors?: Record<string, string[]>
    }
  }
  message: string
}

export interface ValidationError {
  field: string
  message: string
  code?: string
}

export interface NetworkError {
  type: 'offline' | 'timeout' | 'connection'
  message: string
  retryable: boolean
}

export interface ComponentError {
  componentName: string
  props?: Record<string, any>
  error: Error
  recoverable: boolean
}

export const ERROR_CODES = {
  NETWORK_OFFLINE: 'NETWORK_OFFLINE',
  NETWORK_TIMEOUT: 'NETWORK_TIMEOUT',
  NETWORK_CONNECTION_FAILED: 'NETWORK_CONNECTION_FAILED',
  API_UNAUTHORIZED: 'API_UNAUTHORIZED',
  API_FORBIDDEN: 'API_FORBIDDEN',
  API_NOT_FOUND: 'API_NOT_FOUND',
  API_VALIDATION_FAILED: 'API_VALIDATION_FAILED',
  API_SERVER_ERROR: 'API_SERVER_ERROR',
  API_RATE_LIMITED: 'API_RATE_LIMITED',
  COMPONENT_MOUNT_FAILED: 'COMPONENT_MOUNT_FAILED',
  COMPONENT_RENDER_ERROR: 'COMPONENT_RENDER_ERROR',
  COMPONENT_PROP_VALIDATION: 'COMPONENT_PROP_VALIDATION',
  APP_INITIALIZATION_FAILED: 'APP_INITIALIZATION_FAILED',
  APP_NAVIGATION_ERROR: 'APP_NAVIGATION_ERROR',
  APP_STATE_CORRUPTION: 'APP_STATE_CORRUPTION',
  USER_INPUT_INVALID: 'USER_INPUT_INVALID',
  USER_PERMISSION_DENIED: 'USER_PERMISSION_DENIED',
  USER_SESSION_EXPIRED: 'USER_SESSION_EXPIRED'
} as const

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES]

export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  [ERROR_CODES.NETWORK_OFFLINE]: 'Vous semblez être hors ligne. Vérifiez votre connexion internet.',
  [ERROR_CODES.NETWORK_TIMEOUT]: 'La connexion a pris trop de temps. Réessayez dans quelques instants.',
  [ERROR_CODES.NETWORK_CONNECTION_FAILED]: 'Impossible de se connecter au serveur. Vérifiez votre connexion.',
  [ERROR_CODES.API_UNAUTHORIZED]: 'Votre session a expiré. Veuillez vous reconnecter.',
  [ERROR_CODES.API_FORBIDDEN]: 'Vous n avez pas les permissions nécessaires pour cette action.',
  [ERROR_CODES.API_NOT_FOUND]: 'La ressource demandée est introuvable.',
  [ERROR_CODES.API_VALIDATION_FAILED]: 'Les informations saisies ne sont pas valides.',
  [ERROR_CODES.API_SERVER_ERROR]: 'Erreur temporaire du serveur. Réessayez dans quelques instants.',
  [ERROR_CODES.API_RATE_LIMITED]: 'Trop de requêtes. Attendez un moment avant de réessayer.',
  [ERROR_CODES.COMPONENT_MOUNT_FAILED]: 'Erreur lors du chargement du composant.',
  [ERROR_CODES.COMPONENT_RENDER_ERROR]: 'Erreur d affichage du composant.',
  [ERROR_CODES.COMPONENT_PROP_VALIDATION]: 'Paramètres de composant invalides.',
  [ERROR_CODES.APP_INITIALIZATION_FAILED]: 'Échec du démarrage de l application.',
  [ERROR_CODES.APP_NAVIGATION_ERROR]: 'Erreur de navigation.',
  [ERROR_CODES.APP_STATE_CORRUPTION]: 'État de l application corrompu.',
  [ERROR_CODES.USER_INPUT_INVALID]: 'Veuillez vérifier les informations saisies.',
  [ERROR_CODES.USER_PERMISSION_DENIED]: 'Permission refusée pour cette action.',
  [ERROR_CODES.USER_SESSION_EXPIRED]: 'Votre session a expiré. Reconnectez-vous.'
}

export function classifyError(error: unknown): { code: ErrorCode; severity: ErrorSeverity } {
  if (!error) {
    return { code: ERROR_CODES.APP_STATE_CORRUPTION, severity: 'critical' }
  }

  const message = getErrorMessage(error).toLowerCase()

  if (!navigator.onLine) {
    return { code: ERROR_CODES.NETWORK_OFFLINE, severity: 'warning' }
  }

  if (message.includes('timeout') || message.includes('aborted')) {
    return { code: ERROR_CODES.NETWORK_TIMEOUT, severity: 'warning' }
  }

  if (message.includes('network') || message.includes('fetch')) {
    return { code: ERROR_CODES.NETWORK_CONNECTION_FAILED, severity: 'error' }
  }

  if (message.includes('401') || message.includes('unauthorized')) {
    return { code: ERROR_CODES.API_UNAUTHORIZED, severity: 'critical' }
  }

  if (message.includes('403') || message.includes('forbidden')) {
    return { code: ERROR_CODES.API_FORBIDDEN, severity: 'critical' }
  }

  if (message.includes('404') || message.includes('not found')) {
    return { code: ERROR_CODES.API_NOT_FOUND, severity: 'warning' }
  }

  if (message.includes('400') || message.includes('validation')) {
    return { code: ERROR_CODES.API_VALIDATION_FAILED, severity: 'warning' }
  }

  if (message.includes('500') || message.includes('server error')) {
    return { code: ERROR_CODES.API_SERVER_ERROR, severity: 'error' }
  }

  if (message.includes('429') || message.includes('rate limit')) {
    return { code: ERROR_CODES.API_RATE_LIMITED, severity: 'warning' }
  }

  if (message.includes('component') || message.includes('render')) {
    return { code: ERROR_CODES.COMPONENT_RENDER_ERROR, severity: 'error' }
  }

  return { code: ERROR_CODES.APP_STATE_CORRUPTION, severity: 'error' }
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as any).message)
  }
  return 'Unknown error'
}

export function getUserFriendlyMessage(errorCode: ErrorCode): string {
  return ERROR_MESSAGES[errorCode] || 'Une erreur inattendue est survenue.'
}

export function isRetryableError(errorCode: ErrorCode): boolean {
  const retryableCodes: ErrorCode[] = [
    ERROR_CODES.NETWORK_TIMEOUT,
    ERROR_CODES.NETWORK_CONNECTION_FAILED,
    ERROR_CODES.API_SERVER_ERROR,
    ERROR_CODES.API_RATE_LIMITED
  ]

  return retryableCodes.includes(errorCode)
}
