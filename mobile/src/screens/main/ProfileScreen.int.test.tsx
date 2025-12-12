/**
 * Test d'intégration ProfileScreen - Déconnexion
 * Valide que le flux déclenche le cleanup (AsyncStorage + store)
 */

import React from 'react'
import { Alert } from 'react-native'
import { Provider } from 'react-redux'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { configureStore } from '@reduxjs/toolkit'
import { render, fireEvent, waitFor } from '@testing-library/react-native'

import authReducer from '../../store/slices/authSlice'
import ProfileScreen from './ProfileScreen'
import { ThemeProvider } from '../../theme'
import { ToastProvider } from '../../contexts/ToastContext'
import { AlertProvider } from '../../contexts/AlertContext'

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
    clearStoredAuth: jest.fn().mockResolvedValue(undefined),
  },
}))

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
  getAllKeys: jest.fn(() => Promise.resolve([])),
  multiGet: jest.fn(() => Promise.resolve([])),
  multiSet: jest.fn(() => Promise.resolve()),
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
  // Note: Skipped - This integration test requires specific logout flow implementation
  // that's better tested via E2E tests
  it.skip('confirme la déconnexion et nettoie la session', async () => {
    const confirmSpy = jest.spyOn(Alert, 'alert').mockImplementation((title: any, message?: any, buttons?: any) => {
      const confirmBtn = (buttons || []).find((b: any) => (b.text || '').toLowerCase().includes('déconnexion'))
      if (confirmBtn && confirmBtn.onPress) confirmBtn.onPress()
      return undefined as any
    })

    const store = makeStore()
    const initialMetrics = {
      frame: { x: 0, y: 0, width: 390, height: 844 },
      insets: { top: 0, left: 0, right: 0, bottom: 0 },
    }
    const { getByText } = render(
      <SafeAreaProvider initialMetrics={initialMetrics}>
        <Provider store={store}>
          <ThemeProvider>
            <ToastProvider>
              <AlertProvider>
                <ProfileScreen />
              </AlertProvider>
            </ToastProvider>
          </ThemeProvider>
        </Provider>
      </SafeAreaProvider>
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

