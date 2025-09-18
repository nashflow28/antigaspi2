import { ref, computed } from 'vue'
import { notify } from './useNotifications'

interface NetworkError {
  message: string
  code?: string
  retryable: boolean
}

interface RetryConfig {
  maxRetries: number
  baseDelay: number
  maxDelay: number
  backoffFactor: number
}

const defaultRetryConfig: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2
}

const isOnline = ref(navigator.onLine)
const pendingRequests = ref(new Map<string, any>())

// Écouter les changements de connexion
window.addEventListener('online', () => {
  isOnline.value = true
  notify.success('Connexion rétablie', 'En ligne')

  // Relancer les requêtes en attente
  replayPendingRequests()
})

window.addEventListener('offline', () => {
  isOnline.value = false
  notify.warning('Connexion interrompue. Les données seront synchronisées à la reconnexion.', 'Hors ligne')
})

export const useNetworkError = () => {
  const isNetworkError = (error: any): boolean => {
    if (!error) return false

    const errorMessage = error.message?.toLowerCase() || ''
    const errorName = error.name?.toLowerCase() || ''

    return (
      errorMessage.includes('network') ||
      errorMessage.includes('fetch') ||
      errorMessage.includes('connection') ||
      errorName.includes('networkerror') ||
      error.code === 'NETWORK_ERROR' ||
      error.status === 0
    )
  }

  const isRetryableError = (error: any): boolean => {
    if (isNetworkError(error)) return true

    // Codes d'erreur HTTP retryables
    const retryableStatusCodes = [408, 429, 500, 502, 503, 504]
    return retryableStatusCodes.includes(error.status)
  }

  const getErrorMessage = (error: any): NetworkError => {
    if (!isOnline.value) {
      return {
        message: 'Pas de connexion internet. Vos actions seront synchronisées une fois la connexion rétablie.',
        code: 'OFFLINE',
        retryable: true
      }
    }

    if (isNetworkError(error)) {
      return {
        message: 'Problème de connexion au serveur. Nouvelle tentative en cours...',
        code: 'NETWORK_ERROR',
        retryable: true
      }
    }

    if (error.status === 429) {
      return {
        message: 'Trop de requêtes. Veuillez patienter un moment.',
        code: 'RATE_LIMITED',
        retryable: true
      }
    }

    if (error.status >= 500) {
      return {
        message: 'Problème temporaire du serveur. Nouvelle tentative en cours...',
        code: 'SERVER_ERROR',
        retryable: true
      }
    }

    return {
      message: error.message || 'Une erreur inattendue s\'est produite',
      code: 'UNKNOWN_ERROR',
      retryable: false
    }
  }

  const sleep = (ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  const calculateDelay = (attempt: number, config: RetryConfig): number => {
    const delay = config.baseDelay * Math.pow(config.backoffFactor, attempt)
    return Math.min(delay, config.maxDelay)
  }

  const withRetry = async <T>(
    fn: () => Promise<T>,
    config: Partial<RetryConfig> = {},
    requestKey?: string
  ): Promise<T> => {
    const finalConfig = { ...defaultRetryConfig, ...config }
    let lastError: any

    for (let attempt = 0; attempt <= finalConfig.maxRetries; attempt++) {
      try {
        // Si on est hors ligne et que c'est la première tentative, stocker la requête
        if (!isOnline.value && attempt === 0 && requestKey) {
          pendingRequests.value.set(requestKey, { fn, config, requestKey })
          throw new Error('OFFLINE')
        }

        const result = await fn()

        // Nettoyer la requête en attente en cas de succès
        if (requestKey) {
          pendingRequests.value.delete(requestKey)
        }

        return result
      } catch (error) {
        lastError = error

        const networkError = getErrorMessage(error)

        // Si l'erreur n'est pas retryable, échouer immédiatement
        if (!networkError.retryable) {
          throw error
        }

        // Si c'est le dernier essai, échouer
        if (attempt === finalConfig.maxRetries) {
          if (!isOnline.value) {
            notify.warning(networkError.message, 'Mode hors ligne')
          } else {
            notify.error(`Impossible de se connecter après ${finalConfig.maxRetries + 1} tentatives`, 'Erreur réseau')
          }
          throw error
        }

        // Attendre avant de retry
        const delay = calculateDelay(attempt, finalConfig)

        if (attempt === 0) {
          notify.warning(networkError.message, 'Nouvelle tentative...')
        }

        await sleep(delay)
      }
    }

    throw lastError
  }

  const replayPendingRequests = async () => {
    if (!isOnline.value || pendingRequests.value.size === 0) return

    const requests = Array.from(pendingRequests.value.entries())
    pendingRequests.value.clear()

    for (const [key, { fn, config, requestKey }] of requests) {
      try {
        await withRetry(fn, config, requestKey)
        notify.success('Données synchronisées', 'Succès')
      } catch (error) {
        notify.error('Impossible de synchroniser certaines données', 'Erreur de synchronisation')
      }
    }
  }

  // Wrapper pour les requêtes fetch avec retry automatique
  const fetchWithRetry = async (
    url: string,
    options: RequestInit = {},
    retryConfig?: Partial<RetryConfig>
  ): Promise<Response> => {
    const requestKey = `${options.method || 'GET'}:${url}`

    return withRetry(async () => {
      const response = await fetch(url, options)

      if (!response.ok && isRetryableError({ status: response.status })) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return response
    }, retryConfig, requestKey)
  }

  return {
    isOnline: computed(() => isOnline.value),
    pendingRequestsCount: computed(() => pendingRequests.value.size),
    isNetworkError,
    isRetryableError,
    getErrorMessage,
    withRetry,
    fetchWithRetry,
    replayPendingRequests
  }
}