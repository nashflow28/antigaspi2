/**
 * AuthPromptContext - Contexte global pour gerer les invites de connexion
 * Permet de declencher le modal de connexion depuis n'importe ou dans l'app
 */

import React, { createContext, useContext, useState, useCallback, useRef } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '../store'
import LoginPromptModal from '../components/LoginPromptModal'
import { navigationRef } from '../navigation/NavigationRef'

interface AuthPromptOptions {
  actionDescription?: string
  onAuthenticated?: () => void
}

interface AuthPromptContextType {
  /**
   * Verifie si l'utilisateur est authentifie
   * Si non, affiche le modal de connexion et retourne false
   * Si oui, retourne true
   */
  requireAuth: (options?: AuthPromptOptions) => boolean

  /**
   * Affiche le modal de connexion
   */
  showLoginPrompt: (options?: AuthPromptOptions) => void

  /**
   * Cache le modal de connexion
   */
  hideLoginPrompt: () => void

  /**
   * Indique si l'utilisateur est authentifie
   */
  isAuthenticated: boolean
}

const AuthPromptContext = createContext<AuthPromptContextType | undefined>(undefined)

// Global reference for use outside React components
let globalRequireAuth: ((options?: AuthPromptOptions) => boolean) | null = null
let globalShowLoginPrompt: ((options?: AuthPromptOptions) => void) | null = null

export const getGlobalRequireAuth = () => globalRequireAuth
export const getGlobalShowLoginPrompt = () => globalShowLoginPrompt

export const AuthPromptProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth)
  const [visible, setVisible] = useState(false)
  const [actionDescription, setActionDescription] = useState<string | undefined>(undefined)
  const onAuthenticatedRef = useRef<(() => void) | undefined>(undefined)

  const hideLoginPrompt = useCallback(() => {
    setVisible(false)
    onAuthenticatedRef.current = undefined
  }, [])

  const showLoginPrompt = useCallback((options?: AuthPromptOptions) => {
    setActionDescription(options?.actionDescription)
    onAuthenticatedRef.current = options?.onAuthenticated
    setVisible(true)
  }, [])

  const requireAuth = useCallback((options?: AuthPromptOptions): boolean => {
    if (isAuthenticated) {
      return true
    }
    showLoginPrompt(options)
    return false
  }, [isAuthenticated, showLoginPrompt])

  const handleLogin = useCallback(() => {
    // Navigate to login screen
    navigationRef.navigate('Auth', { screen: 'Login' })
  }, [])

  const handleRegister = useCallback(() => {
    // Navigate to register screen
    navigationRef.navigate('Auth', { screen: 'Register' })
  }, [])

  // Set global references
  React.useEffect(() => {
    globalRequireAuth = requireAuth
    globalShowLoginPrompt = showLoginPrompt
    return () => {
      globalRequireAuth = null
      globalShowLoginPrompt = null
    }
  }, [requireAuth, showLoginPrompt])

  // Watch for authentication state changes to call onAuthenticated callback
  React.useEffect(() => {
    if (isAuthenticated && onAuthenticatedRef.current) {
      onAuthenticatedRef.current()
      onAuthenticatedRef.current = undefined
      hideLoginPrompt()
    }
  }, [isAuthenticated, hideLoginPrompt])

  return (
    <AuthPromptContext.Provider
      value={{
        requireAuth,
        showLoginPrompt,
        hideLoginPrompt,
        isAuthenticated,
      }}
    >
      {children}
      <LoginPromptModal
        visible={visible}
        onClose={hideLoginPrompt}
        onLogin={handleLogin}
        onRegister={handleRegister}
        actionDescription={actionDescription}
      />
    </AuthPromptContext.Provider>
  )
}

export const useAuthPrompt = (): AuthPromptContextType => {
  const context = useContext(AuthPromptContext)
  if (!context) {
    throw new Error('useAuthPrompt must be used within an AuthPromptProvider')
  }
  return context
}

export default AuthPromptContext
