/**
 * AlertContext - Contexte global pour afficher des alertes stylisées
 * Peut être utilisé depuis n'importe où dans l'app, y compris les services API
 */

import React, { createContext, useContext, useState, useCallback, useRef } from 'react'
import AlertModal, { AlertType, AlertButton } from '../components/AlertModal'

interface AlertOptions {
  title: string
  message?: string
  type?: AlertType
  buttons?: AlertButton[]
  onClose?: () => void
}

interface AlertContextType {
  showAlert: (options: AlertOptions) => void
  showSuccess: (title: string, message?: string, onClose?: () => void) => void
  showError: (title: string, message?: string, onClose?: () => void) => void
  showWarning: (title: string, message?: string, onClose?: () => void) => void
  showInfo: (title: string, message?: string, onClose?: () => void) => void
  hideAlert: () => void
}

const AlertContext = createContext<AlertContextType | undefined>(undefined)

// Global reference for use outside React components (like in api.ts)
let globalShowAlert: ((options: AlertOptions) => void) | null = null

export const getGlobalAlert = () => globalShowAlert

export const AlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [visible, setVisible] = useState(false)
  const [alertConfig, setAlertConfig] = useState<AlertOptions>({
    title: '',
    message: '',
    type: 'info',
    buttons: [{ text: 'OK' }],
  })
  const onCloseRef = useRef<(() => void) | undefined>(undefined)

  const hideAlert = useCallback(() => {
    setVisible(false)
    if (onCloseRef.current) {
      onCloseRef.current()
      onCloseRef.current = undefined
    }
  }, [])

  const showAlert = useCallback((options: AlertOptions) => {
    onCloseRef.current = options.onClose
    setAlertConfig({
      title: options.title,
      message: options.message,
      type: options.type || 'info',
      buttons: options.buttons || [{ text: 'OK' }],
    })
    setVisible(true)
  }, [])

  const showSuccess = useCallback((title: string, message?: string, onClose?: () => void) => {
    showAlert({ title, message, type: 'success', onClose })
  }, [showAlert])

  const showError = useCallback((title: string, message?: string, onClose?: () => void) => {
    showAlert({ title, message, type: 'error', onClose })
  }, [showAlert])

  const showWarning = useCallback((title: string, message?: string, onClose?: () => void) => {
    showAlert({ title, message, type: 'warning', onClose })
  }, [showAlert])

  const showInfo = useCallback((title: string, message?: string, onClose?: () => void) => {
    showAlert({ title, message, type: 'info', onClose })
  }, [showAlert])

  // Set global reference
  React.useEffect(() => {
    globalShowAlert = showAlert
    return () => {
      globalShowAlert = null
    }
  }, [showAlert])

  return (
    <AlertContext.Provider
      value={{
        showAlert,
        showSuccess,
        showError,
        showWarning,
        showInfo,
        hideAlert,
      }}
    >
      {children}
      <AlertModal
        visible={visible}
        onClose={hideAlert}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        buttons={alertConfig.buttons}
      />
    </AlertContext.Provider>
  )
}

export const useAlert = (): AlertContextType => {
  const context = useContext(AlertContext)
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider')
  }
  return context
}

export default AlertContext
