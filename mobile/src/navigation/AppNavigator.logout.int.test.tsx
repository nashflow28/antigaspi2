/**
 * Intégration complète avec NavigationContainer
 * Scénario: utilisateur connecté → onglet Compte → déconnexion → retour à Auth
 */

import React from 'react'
import { Alert } from 'react-native'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { render, fireEvent, waitFor } from '@testing-library/react-native'

import authReducer from '../store/slices/authSlice'
import AppNavigator from './AppNavigator'
import { ThemeProvider } from '../theme'

// On ne mocke pas les navigateurs pour vérifier la vraie arborescence
// Pas de mock API: en cas d'échec réseau, le slice nettoie quand même l'état (branch rejected)

describe('AppNavigator - Logout end-to-end', () => {
  it('bascule de Main → Auth après déconnexion via Profile', async () => {
    const confirmSpy = jest.spyOn(Alert, 'alert').mockImplementation((title: any, message?: any, buttons?: any) => {
      const confirmBtn = (buttons || []).find((b: any) => (b.text || '').toLowerCase().includes('déconnexion'))
      if (confirmBtn && confirmBtn.onPress) confirmBtn.onPress()
      return undefined as any
    })

    const store = configureStore({
      reducer: { auth: authReducer },
      preloadedState: {
        auth: {
          user: {
            id: 1,
            email: 'user@test.com',
            role: 'consumer',
            first_name: 'User',
            last_name: 'Test',
            city: 'Lome',
            created_at: '2025-01-01',
            updated_at: '2025-01-01'
          },
          token: 'token',
          isAuthenticated: true,
          loading: false,
          error: null,
        },
      },
    })

    const { getByText, queryByText } = render(
      <Provider store={store}>
        <ThemeProvider>
          <AppNavigator />
        </ThemeProvider>
      </Provider>
    )

    // Aller sur l’onglet Compte (label défini dans ConsumerNavigator)
    const accountTab = await waitFor(() => getByText('Compte'))
    fireEvent.press(accountTab)

    // Appuyer sur le bouton Déconnexion (dans ProfileScreen)
    const logoutBtn = await waitFor(() => getByText('Déconnexion'))
    fireEvent.press(logoutBtn)

    // Après confirmation, on doit revenir sur l’auth (Login)
    await waitFor(() => {
      // Le texte du bouton login doit être présent
      expect(getByText('Se connecter')).toBeTruthy()
      // Et l’onglet Compte ne doit plus être visible en tant qu’écran actif
      expect(queryByText('Déconnexion')).toBeNull()
    })

    confirmSpy.mockRestore()
  })
})

