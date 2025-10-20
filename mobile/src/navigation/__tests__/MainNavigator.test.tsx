// @ts-nocheck
import React from 'react'
import { render } from '@testing-library/react-native'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import MainNavigator from '../MainNavigator'
import authSlice from '../../store/slices/authSlice'
import productsSlice from '../../store/slices/productsSlice'
import merchantsSlice from '../../store/slices/merchantsSlice'
import favoritesSlice from '../../store/slices/favoritesSlice'

// Mock navigators
jest.mock('../ConsumerNavigator', () => {
  const { View, Text } = require('react-native')
  return () => <View testID="consumer-navigator"><Text>Consumer Navigator</Text></View>
})

jest.mock('../MerchantNavigator', () => {
  const { View, Text } = require('react-native')
  return () => <View testID="merchant-navigator"><Text>Merchant Navigator</Text></View>
})

jest.mock('../AdminNavigator', () => {
  const { View, Text } = require('react-native')
  return () => <View testID="admin-navigator"><Text>Admin Navigator</Text></View>
})

const createTestStore = (userRole: 'consumer' | 'merchant' | 'admin' | null) => {
  return configureStore({
    reducer: {
      auth: authSlice,
      products: productsSlice,
      merchants: merchantsSlice,
      favorites: favoritesSlice,
    },
    preloadedState: {
      auth: {
        user: userRole ? {
          id: 1,
          first_name: 'Test',
          last_name: 'User',
          email: 'test@example.com',
          role: userRole,
          city: 'Lomé',
          created_at: '2025-01-01',
          updated_at: '2025-01-01',
        } : null,
        token: userRole ? 'test-token' : null,
        isAuthenticated: !!userRole,
        loading: false,
        error: null,
      },
      products: {
        products: [],
        categories: [],
        loading: false,
        loadingMore: false,
        error: null,
        filters: {},
        currentPage: 1,
        hasMore: false,
      },
      merchants: {
        merchants: [],
        loading: false,
        error: null,
      },
      favorites: {
        favoriteIds: [],
        loading: false,
        error: null,
      },
    },
  })
}

describe('MainNavigator - Role-based Navigation', () => {
  it('renders ConsumerNavigator for consumer role', () => {
    const store = createTestStore('consumer')
    const { getByTestId } = render(
      <Provider store={store}>
        <MainNavigator />
      </Provider>
    )

    expect(getByTestId('consumer-navigator')).toBeTruthy()
  })

  it('renders MerchantNavigator for merchant role', () => {
    const store = createTestStore('merchant')
    const { getByTestId } = render(
      <Provider store={store}>
        <MainNavigator />
      </Provider>
    )

    expect(getByTestId('merchant-navigator')).toBeTruthy()
  })

  it('renders AdminNavigator for admin role', () => {
    const store = createTestStore('admin')
    const { getByTestId } = render(
      <Provider store={store}>
        <MainNavigator />
      </Provider>
    )

    expect(getByTestId('admin-navigator')).toBeTruthy()
  })

  it('renders ConsumerNavigator by default when no user', () => {
    const store = createTestStore(null)
    const { getByTestId } = render(
      <Provider store={store}>
        <MainNavigator />
      </Provider>
    )

    expect(getByTestId('consumer-navigator')).toBeTruthy()
  })
})
