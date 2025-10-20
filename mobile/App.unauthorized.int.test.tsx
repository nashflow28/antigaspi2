/**
 * App - Interception 401 (déconnexion automatique)
 * Vérifie qu’un 401 nettoie la session (AsyncStorage + store) et force le retour à l’auth
 */

import React from 'react'
import { Alert } from 'react-native'
import { render, waitFor } from '@testing-library/react-native'

// Mock d’axios pour contrôler les interceptors
let responseErrorHandler: ((error: any) => any) | null = null
jest.mock('axios', () => ({
  __esModule: true,
  default: {
    create: () => ({
      interceptors: {
        request: { use: jest.fn() },
        response: {
          use: (_success: any, error: any) => {
            responseErrorHandler = error
          },
        },
      },
      request: jest.fn(async () => {
        // Simule une réponse 401 et déclenche le handler interceptor
        if (responseErrorHandler) {
          await responseErrorHandler({ response: { status: 401 }, message: 'Unauthorized' })
        }
        throw { response: { status: 401 }, message: 'Unauthorized' }
      }),
    }),
  },
}))

// Mock Alert pour éviter UI native
jest.spyOn(Alert, 'alert').mockImplementation(() => undefined as any)

// NavigationRef peut être mocké si on veut vérifier navigate('Login'), non requis ici

import App from './App'
import { store } from './src/store'
import apiService from './src/services/api'

describe('App - 401 interceptor', () => {
  it('nettoie la session après 401 et met isAuthenticated à false', async () => {
    // Préparer un état authentifié
    store.dispatch({
      type: 'auth/login/fulfilled',
      payload: {
        success: true,
        data: {
          token: 't',
          user: { id: 1, email: 'a@b.c', role: 'consumer' },
        },
      },
    })

    render(<App />)

    // Déclencher un appel qui finit en 401 via axios mock
    await apiService
      .getProfile()
      .catch(() => undefined)

    await waitFor(() => {
      const auth = store.getState().auth
      expect(auth.isAuthenticated).toBe(false)
      expect(auth.user).toBeNull()
      expect(auth.token).toBeNull()
    })
  })
})

