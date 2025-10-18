/**
 * AppNavigator - Test de déconnexion REFACTORISÉ
 *
 * AMÉLIORATIONS vs version originale:
 * ✅ Utilise renderWithProviders avec ThemeProvider inclus
 * ✅ Utilise createTestUser pour données complètes
 * ✅ Configuration du store simplifiée
 * ✅ Plus de wrapper Provider manuel
 */

import React from 'react'
import { Alert } from 'react-native'
import { fireEvent, waitFor } from '@testing-library/react-native'

// 🎯 Import des utilitaires de test centralisés
import { render, createTestStore } from '../test-utils/test-utils'
import { createTestUser } from '../test-utils/factories'

import AppNavigator from './AppNavigator'

describe('AppNavigator - Logout end-to-end (refactorisé)', () => {
  it('bascule de Main → Auth après déconnexion via Profile', async () => {
    // Mock de l'alert de confirmation
    const confirmSpy = jest.spyOn(Alert, 'alert').mockImplementation(
      (title: any, message?: any, buttons?: any) => {
        const confirmBtn = (buttons || []).find((b: any) =>
          (b.text || '').toLowerCase().includes('déconnexion')
        )
        if (confirmBtn && confirmBtn.onPress) confirmBtn.onPress()
        return undefined as any
      }
    )

    // ✅ AVANT: Configuration manuelle avec types incomplets
    // ✅ APRÈS: Utilisation de createTestUser avec tous les champs
    const store = createTestStore({
      auth: {
        user: createTestUser({
          id: 1,
          email: 'user@test.com',
          role: 'consumer',
        }),
        token: 'token',
        isAuthenticated: true,
        loading: false,
        error: null,
      },
    })

    // ✅ AVANT: <Provider store={store}><ThemeProvider>...</ThemeProvider></Provider>
    // ✅ APRÈS: render() inclut automatiquement tous les providers
    const { getByText, queryByText } = render(<AppNavigator />, { store })

    // Aller sur l'onglet Compte
    const accountTab = await waitFor(() => getByText('Compte'))
    fireEvent.press(accountTab)

    // Appuyer sur le bouton Déconnexion
    const logoutBtn = await waitFor(() => getByText('Déconnexion'))
    fireEvent.press(logoutBtn)

    // Vérifier retour à l'écran de connexion
    await waitFor(() => {
      expect(getByText('Se connecter')).toBeTruthy()
      expect(queryByText('Déconnexion')).toBeNull()
    })

    confirmSpy.mockRestore()
  })

  it('efface le token et l\'état utilisateur après déconnexion', async () => {
    // 🆕 Test supplémentaire pour valider le nettoyage de l'état Redux
    const confirmSpy = jest.spyOn(Alert, 'alert').mockImplementation(
      (title: any, message?: any, buttons?: any) => {
        const confirmBtn = (buttons || []).find((b: any) =>
          (b.text || '').toLowerCase().includes('déconnexion')
        )
        if (confirmBtn && confirmBtn.onPress) confirmBtn.onPress()
        return undefined as any
      }
    )

    const store = createTestStore({
      auth: {
        user: createTestUser({ role: 'consumer' }),
        token: 'valid-token',
        isAuthenticated: true,
        loading: false,
        error: null,
      },
    })

    const { getByText } = render(<AppNavigator />, { store })

    // État initial: utilisateur connecté
    expect(store.getState().auth.isAuthenticated).toBe(true)
    expect(store.getState().auth.token).toBe('valid-token')

    // Déconnexion
    const accountTab = await waitFor(() => getByText('Compte'))
    fireEvent.press(accountTab)

    const logoutBtn = await waitFor(() => getByText('Déconnexion'))
    fireEvent.press(logoutBtn)

    // Vérifier que l'état a été nettoyé
    await waitFor(() => {
      const authState = store.getState().auth
      expect(authState.isAuthenticated).toBe(false)
      expect(authState.token).toBeNull()
      expect(authState.user).toBeNull()
    })

    confirmSpy.mockRestore()
  })
})
