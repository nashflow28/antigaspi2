/**
 * AppNavigator - Restauration d'auth au démarrage
 * Cas couverts:
 *  - Token+User présents en stockage -> MainNavigator après Splash
 *  - Pas de session -> AuthNavigator après Splash
 */

import React from 'react'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { render, waitFor } from '@testing-library/react-native'

import authReducer from '../store/slices/authSlice'
import AppNavigator from './AppNavigator'

// Mock des navigateurs enfants pour détection simple
jest.mock('./MainNavigator', () => {
  const React = require('react')
  const { Text } = require('react-native')
  return () => React.createElement(Text, null, 'MAIN_NAV')
})

jest.mock('./AuthNavigator', () => {
  const React = require('react')
  const { Text } = require('react-native')
  return () => React.createElement(Text, null, 'AUTH_NAV')
})

// Mock du service API utilisé par loadStoredAuth
jest.mock('../services/api', () => ({
  __esModule: true,
  default: {
    getStoredToken: jest.fn(),
    getStoredUser: jest.fn(),
  },
}))

const apiService = require('../services/api').default as jest.Mocked<any>

const makeStore = () =>
  configureStore({
    reducer: { auth: authReducer },
    preloadedState: {
      auth: {
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        error: null,
      },
    },
  })

describe('AppNavigator - Restauration auth', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('rendu MainNavigator quand token+user persistés', async () => {
    apiService.getStoredToken.mockResolvedValue('persisted-token')
    apiService.getStoredUser.mockResolvedValue({ id: 1, email: 'saved@user.com', role: 'consumer' })

    const store = makeStore()
    const { getByText } = render(
      <Provider store={store}>
        <AppNavigator />
      </Provider>
    )

    await waitFor(() => {
      expect(getByText('MAIN_NAV')).toBeTruthy()
    })
  })

  it('rendu AuthNavigator quand aucune session persistée', async () => {
    apiService.getStoredToken.mockResolvedValue(null)
    apiService.getStoredUser.mockResolvedValue(null)

    const store = makeStore()
    const { getByText } = render(
      <Provider store={store}>
        <AppNavigator />
      </Provider>
    )

    await waitFor(() => {
      expect(getByText('AUTH_NAV')).toBeTruthy()
    })
  })
})

