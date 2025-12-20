/**
 * useRequireAuth - Hook pour proteger les actions necessitant une authentification
 *
 * Usage:
 * const { requireAuth, withAuth, isAuthenticated } = useRequireAuth()
 *
 * Option 1: Verification simple
 * const handleFavorite = () => {
 *   if (!requireAuth({ actionDescription: 'ajouter aux favoris' })) return
 *   // action protegee
 * }
 *
 * Option 2: Wrapper de fonction
 * const handleReservation = withAuth(
 *   () => doSomething(),
 *   { actionDescription: 'faire une reservation' }
 * )
 */

import { useCallback } from 'react'
import { useAuthPrompt } from '../contexts/AuthPromptContext'

interface RequireAuthOptions {
  actionDescription?: string
  onAuthenticated?: () => void
}

interface UseRequireAuthReturn {
  /**
   * Verifie si l'utilisateur est authentifie
   * Affiche le modal de connexion si non authentifie
   * @returns true si authentifie, false sinon
   */
  requireAuth: (options?: RequireAuthOptions) => boolean

  /**
   * Wrapper pour proteger une fonction
   * La fonction ne s'execute que si l'utilisateur est authentifie
   */
  withAuth: <T extends (...args: any[]) => any>(
    fn: T,
    options?: RequireAuthOptions
  ) => (...args: Parameters<T>) => ReturnType<T> | undefined

  /**
   * Indique si l'utilisateur est authentifie
   */
  isAuthenticated: boolean

  /**
   * Affiche le modal de connexion manuellement
   */
  showLoginPrompt: (options?: RequireAuthOptions) => void
}

export const useRequireAuth = (): UseRequireAuthReturn => {
  const { requireAuth, showLoginPrompt, isAuthenticated } = useAuthPrompt()

  const withAuth = useCallback(<T extends (...args: any[]) => any>(
    fn: T,
    options?: RequireAuthOptions
  ) => {
    return (...args: Parameters<T>): ReturnType<T> | undefined => {
      if (!requireAuth(options)) {
        return undefined
      }
      return fn(...args)
    }
  }, [requireAuth])

  return {
    requireAuth,
    withAuth,
    isAuthenticated,
    showLoginPrompt,
  }
}

export default useRequireAuth
