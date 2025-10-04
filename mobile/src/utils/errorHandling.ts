/**
 * Gestion d'erreurs typées pour l'application mobile
 * Remplace les Alert.alert('Erreur', '...') génériques par des messages précis
 */
import { Alert } from 'react-native'
import { AxiosError } from 'axios'

/**
 * Codes d'erreur typés pour toute l'application
 */
export enum ErrorCode {
  // Erreurs réseau
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT',
  NO_CONNECTION = 'NO_CONNECTION',

  // Erreurs HTTP
  BAD_REQUEST = 'BAD_REQUEST',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  SERVER_ERROR = 'SERVER_ERROR',

  // Erreurs métier
  INSUFFICIENT_STOCK = 'INSUFFICIENT_STOCK',
  INVALID_PHONE = 'INVALID_PHONE',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  RESERVATION_EXPIRED = 'RESERVATION_EXPIRED',

  // Erreurs génériques
  UNKNOWN = 'UNKNOWN',
}

/**
 * Structure d'erreur typée
 */
export interface AppError {
  code: ErrorCode
  message: string
  originalError?: any
  details?: Record<string, any>
}

/**
 * Messages d'erreur user-friendly par code
 */
const ERROR_MESSAGES: Record<ErrorCode, string> = {
  [ErrorCode.NETWORK_ERROR]: 'Problème de connexion. Vérifiez votre réseau et réessayez.',
  [ErrorCode.TIMEOUT]: 'La requête a pris trop de temps. Réessayez.',
  [ErrorCode.NO_CONNECTION]: 'Pas de connexion internet. Activez le WiFi ou les données mobiles.',

  [ErrorCode.BAD_REQUEST]: 'Données invalides. Vérifiez les informations saisies.',
  [ErrorCode.UNAUTHORIZED]: 'Session expirée. Veuillez vous reconnecter.',
  [ErrorCode.FORBIDDEN]: 'Vous n\'avez pas l\'autorisation d\'accéder à cette ressource.',
  [ErrorCode.NOT_FOUND]: 'Ressource introuvable.',
  [ErrorCode.CONFLICT]: 'Cette ressource existe déjà.',
  [ErrorCode.SERVER_ERROR]: 'Erreur serveur. Nos équipes ont été notifiées.',

  [ErrorCode.INSUFFICIENT_STOCK]: 'Stock insuffisant pour cette quantité.',
  [ErrorCode.INVALID_PHONE]: 'Numéro de téléphone invalide pour ce provider.',
  [ErrorCode.PAYMENT_FAILED]: 'Le paiement a échoué. Réessayez.',
  [ErrorCode.RESERVATION_EXPIRED]: 'Cette réservation a expiré.',

  [ErrorCode.UNKNOWN]: 'Une erreur inattendue s\'est produite.',
}

/**
 * Convertir une erreur Axios ou générique en AppError typé
 */
export function parseError(error: any): AppError {
  // Erreur Axios (HTTP)
  if (error.isAxiosError || error.response) {
    const axiosError = error as AxiosError

    // Timeout
    if (axiosError.code === 'ECONNABORTED' || axiosError.message?.includes('timeout')) {
      return {
        code: ErrorCode.TIMEOUT,
        message: ERROR_MESSAGES[ErrorCode.TIMEOUT],
        originalError: error,
      }
    }

    // Pas de connexion
    if (axiosError.code === 'ERR_NETWORK' || !axiosError.response) {
      return {
        code: ErrorCode.NO_CONNECTION,
        message: ERROR_MESSAGES[ErrorCode.NO_CONNECTION],
        originalError: error,
      }
    }

    // Erreurs HTTP par status code
    const status = axiosError.response?.status
    const backendMessage = axiosError.response?.data?.message

    switch (status) {
      case 400:
        return {
          code: ErrorCode.BAD_REQUEST,
          message: backendMessage || ERROR_MESSAGES[ErrorCode.BAD_REQUEST],
          originalError: error,
        }

      case 401:
        return {
          code: ErrorCode.UNAUTHORIZED,
          message: ERROR_MESSAGES[ErrorCode.UNAUTHORIZED],
          originalError: error,
        }

      case 403:
        return {
          code: ErrorCode.FORBIDDEN,
          message: ERROR_MESSAGES[ErrorCode.FORBIDDEN],
          originalError: error,
        }

      case 404:
        return {
          code: ErrorCode.NOT_FOUND,
          message: backendMessage || ERROR_MESSAGES[ErrorCode.NOT_FOUND],
          originalError: error,
        }

      case 409:
        return {
          code: ErrorCode.CONFLICT,
          message: backendMessage || ERROR_MESSAGES[ErrorCode.CONFLICT],
          originalError: error,
        }

      case 500:
      case 502:
      case 503:
        return {
          code: ErrorCode.SERVER_ERROR,
          message: ERROR_MESSAGES[ErrorCode.SERVER_ERROR],
          originalError: error,
        }

      default:
        return {
          code: ErrorCode.NETWORK_ERROR,
          message: backendMessage || ERROR_MESSAGES[ErrorCode.NETWORK_ERROR],
          originalError: error,
        }
    }
  }

  // Erreur JavaScript standard
  if (error instanceof Error) {
    return {
      code: ErrorCode.UNKNOWN,
      message: error.message || ERROR_MESSAGES[ErrorCode.UNKNOWN],
      originalError: error,
    }
  }

  // Erreur inconnue
  return {
    code: ErrorCode.UNKNOWN,
    message: ERROR_MESSAGES[ErrorCode.UNKNOWN],
    originalError: error,
  }
}

/**
 * Afficher une alerte d'erreur avec message approprié
 * @param error - Erreur à afficher
 * @param title - Titre de l'alerte (optionnel)
 * @param onRetry - Callback si bouton "Réessayer" (optionnel)
 */
export function showErrorAlert(
  error: any,
  title: string = 'Erreur',
  onRetry?: () => void
) {
  const appError = parseError(error)

  const buttons = onRetry
    ? [
        { text: 'Annuler', style: 'cancel' as const },
        { text: 'Réessayer', onPress: onRetry },
      ]
    : [{ text: 'OK' }]

  Alert.alert(title, appError.message, buttons)
}

/**
 * Vérifier si l'erreur est une erreur réseau (offline)
 */
export function isNetworkError(error: any): boolean {
  const appError = parseError(error)
  return (
    appError.code === ErrorCode.NETWORK_ERROR ||
    appError.code === ErrorCode.NO_CONNECTION ||
    appError.code === ErrorCode.TIMEOUT
  )
}

/**
 * Vérifier si l'erreur nécessite une reconnexion
 */
export function requiresReauth(error: any): boolean {
  const appError = parseError(error)
  return appError.code === ErrorCode.UNAUTHORIZED
}
