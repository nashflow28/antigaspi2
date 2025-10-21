// @ts-nocheck
import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { Alert } from 'react-native'
import AdminUsersScreen from '../AdminUsersScreen'
import authSlice from '../../../store/slices/authSlice'
import { ThemeProvider } from '../../../theme/ThemeContext'
import apiService from '../../../services/api'

// Mock navigation
const mockNavigate = jest.fn()
const mockNavigation = {
  navigate: mockNavigate,
  goBack: jest.fn(),
  setOptions: jest.fn(),
}

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => mockNavigation,
}))

// Mock Alert
jest.spyOn(Alert, 'alert')

// Mock users data
const mockUsers = [
  {
    id: 2,
    first_name: 'Jean',
    last_name: 'Dupont',
    email: 'jean.dupont@email.com',
    role: 'consumer',
    city: 'Lomé',
    is_suspended: false,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 3,
    first_name: 'Marie',
    last_name: 'Martin',
    email: 'boulangerie.martin@email.com',
    role: 'merchant',
    city: 'Kara',
    is_suspended: false,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 4,
    first_name: 'Admin',
    last_name: 'User',
    email: 'admin@antigaspi.com',
    role: 'admin',
    city: 'Lomé',
    is_suspended: false,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 5,
    first_name: 'Paul',
    last_name: 'Bloqué',
    email: 'paul.bloque@email.com',
    role: 'consumer',
    city: 'Sokodé',
    is_suspended: true,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
]

jest.mock('../../../services/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    patch: jest.fn(),
  },
}))

// Create test store
const createTestStore = () => {
  return configureStore({
    reducer: {
      auth: authSlice,
    },
    preloadedState: {
      auth: {
        user: {
          id: 1,
          first_name: 'Admin',
          last_name: 'User',
          email: 'admin@antigaspi.com',
          role: 'admin',
          city: 'Lomé',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
        },
        token: 'admin-token',
        isAuthenticated: true,
        loading: false,
        error: null,
      },
    },
  })
}

// Helper to render with providers
const renderWithProviders = (component: React.ReactElement, store: any) => {
  return render(
    <Provider store={store}>
      <ThemeProvider>{component}</ThemeProvider>
    </Provider>
  )
}

describe('AdminUsersScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    apiService.get.mockResolvedValue({
      data: {
        data: mockUsers,
      },
    })
  })

  describe('Data Loading', () => {
    it('loads users from /admin/users endpoint on mount', async () => {
      const store = createTestStore()
      renderWithProviders(<AdminUsersScreen />, store)

      await waitFor(() => {
        expect(apiService.get).toHaveBeenCalledWith('/admin/users')
      })
    })

    it('displays loading state initially', () => {
      const store = createTestStore()
      const { getByText } = renderWithProviders(<AdminUsersScreen />, store)

      expect(getByText('Chargement des utilisateurs...')).toBeTruthy()
    })

    it('displays users after loading', async () => {
      const store = createTestStore()
      const { getByText } = renderWithProviders(<AdminUsersScreen />, store)

      await waitFor(() => {
        expect(getByText('Jean Dupont')).toBeTruthy()
        expect(getByText('Marie Martin')).toBeTruthy()
        expect(getByText('Paul Bloqué')).toBeTruthy()
      })
    })

    it('shows empty state when no users match filters', async () => {
      const store = createTestStore()
      const { getByText, getByPlaceholderText } = renderWithProviders(
        <AdminUsersScreen />,
        store
      )

      await waitFor(() => {
        expect(getByText('Jean Dupont')).toBeTruthy()
      })

      // Search for non-existent user
      const searchInput = getByPlaceholderText('Rechercher un utilisateur...')
      fireEvent.changeText(searchInput, 'NonExistentUser')

      await waitFor(() => {
        expect(getByText('Aucun utilisateur trouvé')).toBeTruthy()
        expect(getByText('Essayez de modifier votre recherche')).toBeTruthy()
      })
    })

    it('handles API error gracefully', async () => {
      apiService.get.mockRejectedValueOnce(new Error('Network error'))

      const store = createTestStore()
      renderWithProviders(<AdminUsersScreen />, store)

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Erreur', 'Impossible de charger les utilisateurs')
      })
    })
  })

  describe('Filtering by Role', () => {
    it('filters users by consumer role', async () => {
      const store = createTestStore()
      const { getByText, queryByText } = renderWithProviders(<AdminUsersScreen />, store)

      await waitFor(() => {
        expect(getByText('Jean Dupont')).toBeTruthy()
      })

      // Click on "Consommateurs" filter
      const consumerFilter = getByText(/Consommateurs \(2\)/)
      fireEvent.press(consumerFilter)

      // Only consumers should be visible
      await waitFor(() => {
        expect(getByText('Jean Dupont')).toBeTruthy()
        expect(getByText('Paul Bloqué')).toBeTruthy()
        expect(queryByText('Marie Martin')).toBeNull()
        expect(queryByText(/Admin User/)).toBeNull()
      })
    })

    it('filters users by merchant role', async () => {
      const store = createTestStore()
      const { getByText, queryByText } = renderWithProviders(<AdminUsersScreen />, store)

      await waitFor(() => {
        expect(getByText('Marie Martin')).toBeTruthy()
      })

      // Click on "Commerçants" filter
      const merchantFilter = getByText(/Commerçants \(1\)/)
      fireEvent.press(merchantFilter)

      // Only merchants should be visible
      await waitFor(() => {
        expect(getByText('Marie Martin')).toBeTruthy()
        expect(queryByText('Jean Dupont')).toBeNull()
        expect(queryByText(/Admin User/)).toBeNull()
      })
    })

    it('filters users by admin role', async () => {
      const store = createTestStore()
      const { getByText, queryByText } = renderWithProviders(<AdminUsersScreen />, store)

      await waitFor(() => {
        expect(getByText('Admin User')).toBeTruthy()
      })

      // Click on "Admins" filter
      const adminFilter = getByText(/Admins \(1\)/)
      fireEvent.press(adminFilter)

      // Only admins should be visible
      await waitFor(() => {
        expect(getByText('Admin User')).toBeTruthy()
        expect(queryByText('Jean Dupont')).toBeNull()
        expect(queryByText('Marie Martin')).toBeNull()
      })
    })

    it('shows all users when "Tous" filter is selected', async () => {
      const store = createTestStore()
      const { getByText } = renderWithProviders(<AdminUsersScreen />, store)

      await waitFor(() => {
        expect(getByText('Jean Dupont')).toBeTruthy()
      })

      // Click on "Commerçants" filter first
      const merchantFilter = getByText(/Commerçants \(1\)/)
      fireEvent.press(merchantFilter)

      // Then click on "Tous" filter
      const allFilter = getByText(/Tous \(4\)/)
      fireEvent.press(allFilter)

      // All users should be visible
      await waitFor(() => {
        expect(getByText('Jean Dupont')).toBeTruthy()
        expect(getByText('Marie Martin')).toBeTruthy()
        expect(getByText('Admin User')).toBeTruthy()
        expect(getByText('Paul Bloqué')).toBeTruthy()
      })
    })
  })

  describe('Search', () => {
    it('searches users by email', async () => {
      const store = createTestStore()
      const { getByPlaceholderText, getByText, queryByText } = renderWithProviders(
        <AdminUsersScreen />,
        store
      )

      await waitFor(() => {
        expect(getByText('Jean Dupont')).toBeTruthy()
      })

      const searchInput = getByPlaceholderText('Rechercher un utilisateur...')
      fireEvent.changeText(searchInput, 'boulangerie')

      await waitFor(() => {
        expect(getByText('Marie Martin')).toBeTruthy()
        expect(queryByText('Jean Dupont')).toBeNull()
      })
    })

    it('searches users by first_name', async () => {
      const store = createTestStore()
      const { getByPlaceholderText, getByText, queryByText } = renderWithProviders(
        <AdminUsersScreen />,
        store
      )

      await waitFor(() => {
        expect(getByText('Jean Dupont')).toBeTruthy()
      })

      const searchInput = getByPlaceholderText('Rechercher un utilisateur...')
      fireEvent.changeText(searchInput, 'marie')

      await waitFor(() => {
        expect(getByText('Marie Martin')).toBeTruthy()
        expect(queryByText('Jean Dupont')).toBeNull()
      })
    })

    it('searches users by last_name', async () => {
      const store = createTestStore()
      const { getByPlaceholderText, getByText, queryByText } = renderWithProviders(
        <AdminUsersScreen />,
        store
      )

      await waitFor(() => {
        expect(getByText('Jean Dupont')).toBeTruthy()
      })

      const searchInput = getByPlaceholderText('Rechercher un utilisateur...')
      fireEvent.changeText(searchInput, 'dupont')

      await waitFor(() => {
        expect(getByText('Jean Dupont')).toBeTruthy()
        expect(queryByText('Marie Martin')).toBeNull()
      })
    })

    it('clears search when close icon is pressed', async () => {
      const store = createTestStore()
      const { getByPlaceholderText, getByText, getAllByTestId } = renderWithProviders(
        <AdminUsersScreen />,
        store
      )

      await waitFor(() => {
        expect(getByText('Jean Dupont')).toBeTruthy()
      })

      const searchInput = getByPlaceholderText('Rechercher un utilisateur...')
      fireEvent.changeText(searchInput, 'marie')

      // Find and press close icon
      await waitFor(() => {
        const closeIcons = getAllByTestId(/ionicons/i)
        const closeIcon = closeIcons.find((icon) => icon.props.name === 'close-circle')
        if (closeIcon) {
          fireEvent.press(closeIcon)
        }
      })

      // All users should be visible again
      await waitFor(() => {
        expect(getByText('Jean Dupont')).toBeTruthy()
        expect(getByText('Marie Martin')).toBeTruthy()
      })
    })
  })

  describe('Suspend User', () => {
    it('suspends user with confirmation dialog', async () => {
      apiService.patch.mockResolvedValueOnce({ data: { success: true } })

      Alert.alert.mockImplementation((title, message, buttons) => {
        const blockButton = buttons?.find((b) => b.text === 'Bloquer')
        if (blockButton) {
          blockButton.onPress()
        }
      })

      const store = createTestStore()
      const { getByText } = renderWithProviders(<AdminUsersScreen />, store)

      await waitFor(() => {
        expect(getByText('Jean Dupont')).toBeTruthy()
      })

      // Find and press "Bloquer" button for Jean Dupont
      const blockButtons = getByText('Bloquer')
      fireEvent.press(blockButtons)

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          "Bloquer l'utilisateur",
          'Voulez-vous vraiment bloquer Jean Dupont ?',
          expect.any(Array)
        )
        expect(apiService.patch).toHaveBeenCalledWith('/admin/users/2/suspend')
        expect(Alert.alert).toHaveBeenCalledWith('Succès', 'Utilisateur bloqué')
      })
    })

    it('handles suspend API error', async () => {
      apiService.patch.mockRejectedValueOnce(new Error('API Error'))

      Alert.alert.mockImplementation((title, message, buttons) => {
        const blockButton = buttons?.find((b) => b.text === 'Bloquer')
        if (blockButton) {
          blockButton.onPress()
        }
      })

      const store = createTestStore()
      const { getByText } = renderWithProviders(<AdminUsersScreen />, store)

      await waitFor(() => {
        expect(getByText('Jean Dupont')).toBeTruthy()
      })

      const blockButtons = getByText('Bloquer')
      fireEvent.press(blockButtons)

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Erreur',
          'Impossible de mettre à jour le statut'
        )
      })
    })
  })

  describe('Unsuspend User', () => {
    it('unsuspends user with confirmation dialog', async () => {
      apiService.patch.mockResolvedValueOnce({ data: { success: true } })

      Alert.alert.mockImplementation((title, message, buttons) => {
        const unblockButton = buttons?.find((b) => b.text === 'Débloquer')
        if (unblockButton) {
          unblockButton.onPress()
        }
      })

      const store = createTestStore()
      const { getByText } = renderWithProviders(<AdminUsersScreen />, store)

      await waitFor(() => {
        expect(getByText('Paul Bloqué')).toBeTruthy()
      })

      // Find "Débloquer" button for Paul Bloqué (suspended user)
      const unblockButtons = getByText('Débloquer')
      fireEvent.press(unblockButtons)

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          "Débloquer l'utilisateur",
          'Voulez-vous vraiment débloquer Paul Bloqué ?',
          expect.any(Array)
        )
        expect(apiService.patch).toHaveBeenCalledWith('/admin/users/5/unsuspend')
        expect(Alert.alert).toHaveBeenCalledWith('Succès', 'Utilisateur débloqué')
      })
    })

    it('handles unsuspend API error', async () => {
      apiService.patch.mockRejectedValueOnce(new Error('API Error'))

      Alert.alert.mockImplementation((title, message, buttons) => {
        const unblockButton = buttons?.find((b) => b.text === 'Débloquer')
        if (unblockButton) {
          unblockButton.onPress()
        }
      })

      const store = createTestStore()
      const { getByText } = renderWithProviders(<AdminUsersScreen />, store)

      await waitFor(() => {
        expect(getByText('Paul Bloqué')).toBeTruthy()
      })

      const unblockButtons = getByText('Débloquer')
      fireEvent.press(unblockButtons)

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Erreur',
          'Impossible de mettre à jour le statut'
        )
      })
    })
  })

  describe('User Status Display', () => {
    it('displays "Bloqué" badge for suspended users', async () => {
      const store = createTestStore()
      const { getByText } = renderWithProviders(<AdminUsersScreen />, store)

      await waitFor(() => {
        expect(getByText('Paul Bloqué')).toBeTruthy()
        expect(getByText('Bloqué')).toBeTruthy()
      })
    })

    it('displays role badges correctly', async () => {
      const store = createTestStore()
      const { getByText } = renderWithProviders(<AdminUsersScreen />, store)

      await waitFor(() => {
        expect(getByText('Consommateur')).toBeTruthy()
        expect(getByText('Commerçant')).toBeTruthy()
        expect(getByText('Admin')).toBeTruthy()
      })
    })
  })

  describe('Refresh', () => {
    it('refreshes user list on pull-to-refresh', async () => {
      const store = createTestStore()
      const { getByTestId } = renderWithProviders(<AdminUsersScreen />, store)

      await waitFor(() => {
        expect(apiService.get).toHaveBeenCalledTimes(1)
      })

      // Simulate pull-to-refresh
      const flatList = getByTestId(/flatlist/i)
      if (flatList) {
        fireEvent(flatList, 'refresh')
      }

      await waitFor(() => {
        expect(apiService.get).toHaveBeenCalledTimes(2)
      })
    })
  })
})
