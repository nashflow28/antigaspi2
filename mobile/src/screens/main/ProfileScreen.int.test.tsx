import React from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { render, fireEvent, waitFor, screen, createTestStore } from '@test-utils'
import ProfileScreen from './ProfileScreen'
import { TEST_IDS } from '../../utils/testIds'
import apiService from '../../services/api'
import { secureStorage } from '../../services/secureStorage'

jest.mock('../../hooks/usePersistedForm', () => ({
  clearAllFormCaches: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('../../services/api', () => ({
  __esModule: true,
  default: {
    logout: jest.fn().mockResolvedValue(undefined),
  },
}))

jest.mock('../../services/secureStorage', () => ({
  secureStorage: {
    removeToken: jest.fn().mockResolvedValue(undefined),
    removeUserData: jest.fn().mockResolvedValue(undefined),
  },
}))

jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native')
  return {
    ...actual,
    useNavigation: () => ({ navigate: jest.fn() }),
  }
})

const pressLogoutConfirm = () => {
  const matches = screen.getAllByText('Déconnexion')
  const last = matches[matches.length - 1] as any
  fireEvent.press(last.parent)
}

describe('ProfileScreen - Déconnexion', () => {
  let consoleLogSpy: jest.SpyInstance | undefined
  let consoleErrorSpy: jest.SpyInstance | undefined

  beforeEach(() => {
    jest.clearAllMocks()
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {})
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleLogSpy?.mockRestore()
    consoleErrorSpy?.mockRestore()
  })

  it('confirme la déconnexion et nettoie la session', async () => {
    const store = createTestStore({
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
    })

    render(<ProfileScreen />, { store })

    fireEvent.press(screen.getByTestId(TEST_IDS.logoutButton))

    await waitFor(() => {
      expect(screen.getAllByText(/connexion/i).length).toBeGreaterThan(0)
    })

    pressLogoutConfirm()

    await waitFor(() => {
      expect(secureStorage.removeToken).toHaveBeenCalled()
      expect(secureStorage.removeUserData).toHaveBeenCalled()
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('cart_data')
      expect(apiService.logout).toHaveBeenCalled()

      const auth = (store.getState() as any).auth
      expect(auth.isAuthenticated).toBe(false)
      expect(auth.user).toBeNull()
      expect(auth.token).toBeNull()
    })
  })
})
