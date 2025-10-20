/**
 * Toast Context and Provider
 * Global toast management with auto-dismiss
 */
import React, { createContext, useContext, useState, useCallback } from 'react'
import Toast, { ToastVariant } from '../components/2025/Toast'

interface ToastConfig {
  message: string
  variant?: ToastVariant
  duration?: number
}

interface ToastContextType {
  showToast: (config: ToastConfig) => void
  showSuccess: (message: string, duration?: number) => void
  showError: (message: string, duration?: number) => void
  showWarning: (message: string, duration?: number) => void
  showInfo: (message: string, duration?: number) => void
  hideToast: () => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toast, setToast] = useState<ToastConfig & { visible: boolean }>({
    message: '',
    variant: 'info',
    duration: 3000,
    visible: false,
  })

  const showToast = useCallback((config: ToastConfig) => {
    setToast({
      ...config,
      visible: true,
      variant: config.variant || 'info',
      duration: config.duration || 3000,
    })
  }, [])

  const showSuccess = useCallback((message: string, duration = 3000) => {
    showToast({ message, variant: 'success', duration })
  }, [showToast])

  const showError = useCallback((message: string, duration = 4000) => {
    showToast({ message, variant: 'error', duration })
  }, [showToast])

  const showWarning = useCallback((message: string, duration = 3500) => {
    showToast({ message, variant: 'warning', duration })
  }, [showToast])

  const showInfo = useCallback((message: string, duration = 3000) => {
    showToast({ message, variant: 'info', duration })
  }, [showToast])

  const hideToast = useCallback(() => {
    setToast((prev) => ({ ...prev, visible: false }))
  }, [])

  return (
    <ToastContext.Provider
      value={{
        showToast,
        showSuccess,
        showError,
        showWarning,
        showInfo,
        hideToast,
      }}
    >
      {children}
      <Toast
        message={toast.message}
        variant={toast.variant}
        duration={toast.duration}
        visible={toast.visible}
        onDismiss={hideToast}
      />
    </ToastContext.Provider>
  )
}

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}
