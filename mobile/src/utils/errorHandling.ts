import { Alert } from 'react-native'

export const showErrorAlert = (error: any, title: string = 'Erreur', onRetry?: () => void) => {
  const message = typeof error === 'string' ? error : (error?.message || 'Une erreur est survenue')

  const buttons = onRetry
    ? [
        { text: 'Annuler', style: 'cancel' as const },
        { text: 'Réessayer', onPress: onRetry }
      ]
    : [{ text: 'OK' }]

  Alert.alert(title, message, buttons)
}

export const showSuccessAlert = (title: string, message: string) => {
  Alert.alert(title, message, [{ text: 'OK' }])
}

export const handleApiError = (error: any): string => {
  if (error.response?.data?.message) {
    return error.response.data.message
  }
  if (error.message) {
    return error.message
  }
  return 'Une erreur est survenue. Veuillez réessayer.'
}
