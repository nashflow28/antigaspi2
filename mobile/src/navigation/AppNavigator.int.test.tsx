/**
 * Tests d'intégration AppNavigator
 * Vérifie le routage conditionnel Auth/Main selon isAuthenticated
 */

import React from 'react'
import { Text } from 'react-native'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { render, waitFor } from '@testing-library/react-native'

import authReducer from '../store/slices/authSlice'
import AppNavigator from './AppNavigator'

// Mock des sous-navigateurs pour rendre du texte identifiable
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

const makeStore = (preloadedAuth: any) =>
  configureStore({
    reducer: { auth: authReducer },
    preloadedState: { auth: preloadedAuth },
  })

describe('AppNavigator routing', () => {
  it('rend AuthNavigator quand non authentifié', async () => {
    const store = makeStore({
      user: null,
      token: null,
      isAuthenticated: false,
      loading: false,
      error: null,
    })

    const { getByText } = render(
      <Provider store={store}>
        <AppNavigator />
      </Provider>
    )

    await waitFor(() => {
      expect(getByText('AUTH_NAV')).toBeTruthy()
    })
  })

  it('rend MainNavigator quand authentifié', async () => {
    const store = makeStore({
      user: { id: 1, email: 'x@y.z', role: 'consumer' },
      token: 't',
      isAuthenticated: true,
      loading: false,
      error: null,
    })

    const { getByText } = render(
      <Provider store={store}>
        <AppNavigator />
      </Provider>
    )

    await waitFor(() => {
      expect(getByText('MAIN_NAV')).toBeTruthy()
    })
  })
})

