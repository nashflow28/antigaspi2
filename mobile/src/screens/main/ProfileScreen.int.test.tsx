/**
 * Test d'intégration ProfileScreen - Déconnexion
 * Valide que le flux déclenche le cleanup (AsyncStorage + store)
 */

import React from 'react'
import { Alert } from 'react-native'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { render, fireEvent, waitFor } from '@testing-library/react-native'

import authReducer from '../../store/slices/authSlice'
import ProfileScreen from './ProfileScreen'
import { ThemeProvider } from '../../theme'

// Mock navigation pour éviter erreurs de contexte
jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native')
  return {
    ...actual,
    useNavigation: () => ({ navigate: jest.fn() }),
  }
})

// Mock API logout pour ne pas appeler le réseau
jest.mock('../../services/api', () => ({
  __esModule: true,
  default: {
    logout: jest.fn().mockResolvedValue(undefined),
  },
}))

import AsyncStorage from '@react-native-async-storage/async-storage'

const makeStore = () =>
  configureStore({
    reducer: { auth: authReducer } as any,
    preloadedState: {
      auth: {
        user: {
          id: 10,
          email: 'user@test.com',
          role: 'consumer',
          first_name: 'User',
          last_name: 'Test',
          city: 'Test City',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        token: 'token-xyz',
        isAuthenticated: true,
        loading: false,
        error: null,
      },
    },
  })

describe('ProfileScreen - Déconnexion', () => {
  it('confirme la déconnexion et nettoie la session', async () => {
    const confirmSpy = jest.spyOn(Alert, 'alert').mockImplementation((title: any, message?: any, buttons?: any) => {
      const confirmBtn = (buttons || []).find((b: any) => (b.text || '').toLowerCase().includes('déconnexion'))
      if (confirmBtn && confirmBtn.onPress) confirmBtn.onPress()
      return undefined as any
    })

    const store = makeStore()
    const { getByText } = render(
      <Provider store={store}>
        <ThemeProvider>
          <ProfileScreen />
        </ThemeProvider>
      </Provider>
    )

    fireEvent.press(getByText('Déconnexion'))

    await waitFor(() => {
      expect(AsyncStorage.clear).toHaveBeenCalled()
      const state = (store.getState() as any).auth
      expect(state.isAuthenticated).toBe(false)
      expect(state.user).toBeNull()
      expect(state.token).toBeNull()
    })

    confirmSpy.mockRestore()
  })
})

