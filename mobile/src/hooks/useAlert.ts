/**
 * useAlert - Hook personnalisé pour gérer les alertes stylisées
 *
 * Ce hook simplifie l'utilisation d'AlertModal dans tous les écrans
 * en fournissant une API similaire à Alert.alert natif
 */

import { useState, useCallback } from 'react'
import { AlertType, AlertButton } from '../components/AlertModal'

export interface UseAlertReturn {
  // State
  alertVisible: boolean
  alertType: AlertType
  alertTitle: string
  alertMessage: string
  alertButtons: AlertButton[]

  // Methods
  showAlert: (
    type: AlertType,
    title: string,
    message?: string,
    buttons?: AlertButton[]
  ) => void
  hideAlert: () => void

  // Shortcut methods
  showError: (title: string, message?: string, buttons?: AlertButton[]) => void
  showSuccess: (title: string, message?: string, buttons?: AlertButton[]) => void
  showWarning: (title: string, message?: string, buttons?: AlertButton[]) => void
  showInfo: (title: string, message?: string, buttons?: AlertButton[]) => void

  // For AlertModal props spread
  alertProps: {
    visible: boolean
    type: AlertType
    title: string
    message: string
    buttons: AlertButton[]
    onClose: () => void
  }
}

export const useAlert = (): UseAlertReturn => {
  const [alertVisible, setAlertVisible] = useState(false)
  const [alertType, setAlertType] = useState<AlertType>('info')
  const [alertTitle, setAlertTitle] = useState('')
  const [alertMessage, setAlertMessage] = useState('')
  const [alertButtons, setAlertButtons] = useState<AlertButton[]>([])

  const hideAlert = useCallback(() => {
    setAlertVisible(false)
  }, [])

  const showAlert = useCallback((
    type: AlertType,
    title: string,
    message?: string,
    buttons?: AlertButton[]
  ) => {
    setAlertType(type)
    setAlertTitle(title)
    setAlertMessage(message || '')
    setAlertButtons(buttons || [{ text: 'OK', onPress: () => setAlertVisible(false) }])
    setAlertVisible(true)
  }, [])

  // Shortcut methods
  const showError = useCallback((title: string, message?: string, buttons?: AlertButton[]) => {
    showAlert('error', title, message, buttons)
  }, [showAlert])

  const showSuccess = useCallback((title: string, message?: string, buttons?: AlertButton[]) => {
    showAlert('success', title, message, buttons)
  }, [showAlert])

  const showWarning = useCallback((title: string, message?: string, buttons?: AlertButton[]) => {
    showAlert('warning', title, message, buttons)
  }, [showAlert])

  const showInfo = useCallback((title: string, message?: string, buttons?: AlertButton[]) => {
    showAlert('info', title, message, buttons)
  }, [showAlert])

  // Props to spread directly on AlertModal
  const alertProps = {
    visible: alertVisible,
    type: alertType,
    title: alertTitle,
    message: alertMessage,
    buttons: alertButtons,
    onClose: hideAlert,
  }

  return {
    alertVisible,
    alertType,
    alertTitle,
    alertMessage,
    alertButtons,
    showAlert,
    hideAlert,
    showError,
    showSuccess,
    showWarning,
    showInfo,
    alertProps,
  }
}

export default useAlert
