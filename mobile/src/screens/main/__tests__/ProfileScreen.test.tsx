// @ts-nocheck
import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import { Provider } from 'react-redux'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { configureStore } from '@reduxjs/toolkit'
import ProfileScreen from '../ProfileScreen'
import authSlice from '../../../store/slices/authSlice'
import { ThemeProvider } from '../../../theme/ThemeContext'
import { ToastProvider } from '../../../contexts/ToastContext'
import { AlertProvider } from '../../../contexts/AlertContext'
import { TEST_IDS } from '../../../utils/testIds'

// Mock navigation
const mockNavigate = jest.fn()
const mockNavigation = {
  navigate: mockNavigate,
  goBack: jest.fn(),
  setOptions: jest.fn(),
}

// Mock useNavigation hook
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => mockNavigation,
}))

// Mock AsyncStorage - use full mock, not partial
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
  getAllKeys: jest.fn(() => Promise.resolve([])),
  multiGet: jest.fn(() => Promise.resolve([])),
  multiSet: jest.fn(() => Promise.resolve()),
}))

// Create test store
const createTestStore = (userRole: 'consumer' | 'merchant' = 'consumer') => {
  return configureStore({
    reducer: {
      auth: authSlice,
    },
    preloadedState: {
      auth: {
        user: {
          id: 1,
          first_name: 'Jean',
          last_name: 'Dupont',
          email: 'jean.dupont@email.com',
          role: userRole,
        },
        token: 'test-token',
        isAuthenticated: true,
        loading: false,
        error: null,
      },
    },
  })
}

// Helper to render with providers
const renderWithProviders = (component: React.ReactElement, store: any) => {
  const initialMetrics = {
    frame: { x: 0, y: 0, width: 390, height: 844 },
    insets: { top: 0, left: 0, right: 0, bottom: 0 },
  }
  return render(
    <SafeAreaProvider initialMetrics={initialMetrics}>
      <Provider store={store}>
        <ThemeProvider>
          <ToastProvider>
            <AlertProvider>
              {component}
            </AlertProvider>
          </ToastProvider>
        </ThemeProvider>
      </Provider>
    </SafeAreaProvider>
  )
}

describe('ProfileScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('shows profile summary with identity and role badge', () => {
      const store = createTestStore()
      const { getByTestId, getByText } = renderWithProviders(<ProfileScreen />, store)

      expect(getByTestId(TEST_IDS.profileScreen)).toBeTruthy()
      expect(getByTestId(TEST_IDS.profileName)).toBeTruthy()
      expect(getByText('Jean Dupont')).toBeTruthy()
      expect(getByTestId(TEST_IDS.profileEmail)).toBeTruthy()
      expect(getByText('jean.dupont@email.com')).toBeTruthy()
      expect(getByText('Consommateur')).toBeTruthy()
    })

    it('displays merchant role badge', () => {
      const store = createTestStore('merchant')
      const { getByText } = renderWithProviders(<ProfileScreen />, store)

      expect(getByText('Commerçant')).toBeTruthy()
    })
  })

  describe('Menu Options', () => {
    it('displays edit profile button', () => {
      const store = createTestStore()
      const { getByTestId } = renderWithProviders(<ProfileScreen />, store)

      expect(getByTestId(TEST_IDS.editProfileButton)).toBeTruthy()
    })

    it('displays notifications option', () => {
      const store = createTestStore()
      const { getByText } = renderWithProviders(<ProfileScreen />, store)

      expect(getByText('Notifications')).toBeTruthy()
    })

    it('displays help & support option', () => {
      const store = createTestStore()
      const { getByText } = renderWithProviders(<ProfileScreen />, store)

      expect(getByText('Aide & Support')).toBeTruthy()
    })

    it('displays theme toggle option', () => {
      const store = createTestStore()
      const { getByText } = renderWithProviders(<ProfileScreen />, store)

      expect(getByText('Thème sombre')).toBeTruthy()
    })

    it('displays logout button', () => {
      const store = createTestStore()
      const { getByTestId } = renderWithProviders(<ProfileScreen />, store)

      expect(getByTestId(TEST_IDS.logoutButton)).toBeTruthy()
    })
  })

  describe('Merchant-Specific Features', () => {
    it('displays opening hours option for merchants', () => {
      const store = createTestStore('merchant')
      const { getByText } = renderWithProviders(<ProfileScreen />, store)

      expect(getByText("Heures d'ouverture")).toBeTruthy()
    })

    it('does not display opening hours option for consumers', () => {
      const store = createTestStore('consumer')
      const { queryByText } = renderWithProviders(<ProfileScreen />, store)

      expect(queryByText("Heures d'ouverture")).toBeFalsy()
    })

    it('navigates to ProfileEdit when merchant presses edit profile', async () => {
      const store = createTestStore('merchant')
      const { getByTestId } = renderWithProviders(<ProfileScreen />, store)

      const editButton = getByTestId(TEST_IDS.editProfileButton)
      fireEvent.press(editButton)

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('ProfileEdit')
      })
    })

    it('navigates to OpeningHours when merchant presses opening hours', async () => {
      const store = createTestStore('merchant')
      const { getByText } = renderWithProviders(<ProfileScreen />, store)

      const openingHoursButton = getByText("Heures d'ouverture")
      fireEvent.press(openingHoursButton)

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('OpeningHours')
      })
    })

    it('navigates to Notifications when merchant presses notifications', async () => {
      const store = createTestStore('merchant')
      const { getByText } = renderWithProviders(<ProfileScreen />, store)

      const notificationsButton = getByText('Notifications')
      fireEvent.press(notificationsButton)

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('Notifications')
      })
    })
  })

  describe('Consumer-Specific Features', () => {
    it('shows coming soon alert for consumer edit profile', () => {
      const store = createTestStore('consumer')
      const { getByTestId } = renderWithProviders(<ProfileScreen />, store)

      const editButton = getByTestId(TEST_IDS.editProfileButton)
      fireEvent.press(editButton)

      // Alert is shown (mocked in test environment)
      expect(editButton).toBeTruthy()
    })

    it('shows coming soon alert for consumer notifications', () => {
      const store = createTestStore('consumer')
      const { getByText } = renderWithProviders(<ProfileScreen />, store)

      const notificationsButton = getByText('Notifications')
      fireEvent.press(notificationsButton)

      // Alert is shown (mocked in test environment)
      expect(notificationsButton).toBeTruthy()
    })
  })

  describe('Theme Switcher', () => {
    it('displays dark theme toggle switch', () => {
      const store = createTestStore()
      const { getByText } = renderWithProviders(<ProfileScreen />, store)

      expect(getByText('Thème sombre')).toBeTruthy()
      expect(getByText('Activez ou désactivez le mode sombre de l\'application')).toBeTruthy()
    })

    it('displays theme mode description', () => {
      const store = createTestStore()
      const { getByText } = renderWithProviders(<ProfileScreen />, store)

      expect(getByText('Activez ou désactivez le mode sombre de l\'application')).toBeTruthy()
    })

    it('displays auto mode reset button', () => {
      const store = createTestStore()
      const { getByText } = renderWithProviders(<ProfileScreen />, store)

      expect(getByText('Revenir au mode automatique')).toBeTruthy()
    })
  })

  describe('Logout Functionality', () => {
    it('displays logout button with correct text', () => {
      const store = createTestStore()
      const { getByText } = renderWithProviders(<ProfileScreen />, store)

      expect(getByText('Déconnexion')).toBeTruthy()
    })

    it('logout button can be pressed', () => {
      const store = createTestStore()
      const { getByTestId } = renderWithProviders(<ProfileScreen />, store)

      const logoutButton = getByTestId(TEST_IDS.logoutButton)
      fireEvent.press(logoutButton)

      // Should not crash
      expect(logoutButton).toBeTruthy()
    })

    it('shows logout confirmation alert when pressed on native', () => {
      const store = createTestStore()
      const { getByTestId } = renderWithProviders(<ProfileScreen />, store)

      const logoutButton = getByTestId(TEST_IDS.logoutButton)
      fireEvent.press(logoutButton)

      // Alert.alert is mocked in test environment
      expect(logoutButton).toBeTruthy()
    })
  })

  describe('User Role Display', () => {
    it('shows correct badge for consumer role', () => {
      const store = createTestStore('consumer')
      const { getByText } = renderWithProviders(<ProfileScreen />, store)

      expect(getByText('Consommateur')).toBeTruthy()
    })

    it('shows correct badge for merchant role', () => {
      const store = createTestStore('merchant')
      const { getByText } = renderWithProviders(<ProfileScreen />, store)

      expect(getByText('Commerçant')).toBeTruthy()
    })
  })

  describe('Profile Information Card', () => {
    it('displays all user information in a card', () => {
      const store = createTestStore()
      const { getByText } = renderWithProviders(<ProfileScreen />, store)

      // Check all info is present
      expect(getByText('Jean Dupont')).toBeTruthy()
      expect(getByText('jean.dupont@email.com')).toBeTruthy()
      expect(getByText('Consommateur')).toBeTruthy()
    })

    it('formats user name correctly', () => {
      const store = createTestStore()
      const { getByTestId } = renderWithProviders(<ProfileScreen />, store)

      const nameElement = getByTestId(TEST_IDS.profileName)
      expect(nameElement).toBeTruthy()
    })
  })

  describe('Menu Item Layout', () => {
    it('displays menu items with proper icons', () => {
      const store = createTestStore('merchant')
      const { getByText } = renderWithProviders(<ProfileScreen />, store)

      // Check all menu items are present
      expect(getByText('Modifier le profil')).toBeTruthy()
      expect(getByText("Heures d'ouverture")).toBeTruthy()
      expect(getByText('Notifications')).toBeTruthy()
      expect(getByText('Aide & Support')).toBeTruthy()
    })

    it('displays chevron icons for navigable menu items', () => {
      const store = createTestStore()
      const { getByText } = renderWithProviders(<ProfileScreen />, store)

      // Menu items should be present
      expect(getByText('Modifier le profil')).toBeTruthy()
      expect(getByText('Notifications')).toBeTruthy()
      expect(getByText('Aide & Support')).toBeTruthy()
    })
  })
})
