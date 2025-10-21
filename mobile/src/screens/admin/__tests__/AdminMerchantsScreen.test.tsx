// @ts-nocheck
import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { Alert } from 'react-native'
import AdminMerchantsScreen from '../AdminMerchantsScreen'
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

// Mock apiService
const mockMerchants = [
  {
    id: 1,
    business_name: 'Boulangerie Martin',
    business_type: 'Boulangerie',
    city: 'Lomé',
    phone: '+228 90 12 34 56',
    is_verified: false,
    products_count: 5,
    active_products: 3,
    user: {
      id: 2,
      email: 'boulangerie.martin@email.com',
      first_name: 'Marie',
      last_name: 'Martin',
      city: 'Lomé',
    },
  },
  {
    id: 2,
    business_name: 'Épicerie Bio',
    business_type: 'Épicerie',
    city: 'Kara',
    phone: '+228 90 11 22 33',
    is_verified: true,
    products_count: 12,
    active_products: 8,
    user: {
      id: 3,
      email: 'epicerie.bio@email.com',
      first_name: 'Jean',
      last_name: 'Dupont',
      city: 'Kara',
    },
  },
]

jest.mock('../../../services/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
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

describe('AdminMerchantsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    apiService.get.mockResolvedValue({
      data: {
        merchants: mockMerchants,
        pending_products: [],
      },
    })
  })

  describe('Data Loading', () => {
    it('loads merchants from /admin/moderation endpoint on mount', async () => {
      const store = createTestStore()
      renderWithProviders(<AdminMerchantsScreen />, store)

      await waitFor(() => {
        expect(apiService.get).toHaveBeenCalledWith('/admin/moderation')
      })
    })

    it('displays loading state initially', () => {
      const store = createTestStore()
      const { getByText } = renderWithProviders(<AdminMerchantsScreen />, store)

      expect(getByText('Chargement des commerçants...')).toBeTruthy()
    })

    it('displays merchants after loading', async () => {
      const store = createTestStore()
      const { getByText } = renderWithProviders(<AdminMerchantsScreen />, store)

      await waitFor(() => {
        expect(getByText('Boulangerie Martin')).toBeTruthy()
        expect(getByText('Épicerie Bio')).toBeTruthy()
      })
    })

    it('shows empty state when no merchants', async () => {
      apiService.get.mockResolvedValueOnce({
        data: {
          merchants: [],
          pending_products: [],
        },
      })

      const store = createTestStore()
      const { getByText } = renderWithProviders(<AdminMerchantsScreen />, store)

      await waitFor(() => {
        expect(getByText('Aucun commerçant trouvé')).toBeTruthy()
      })
    })

    it('handles API error gracefully', async () => {
      apiService.get.mockRejectedValueOnce(new Error('Network error'))

      const store = createTestStore()
      renderWithProviders(<AdminMerchantsScreen />, store)

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Erreur', 'Impossible de charger les commerçants')
      })
    })
  })

  describe('Filtering', () => {
    it('filters merchants by verified status', async () => {
      const store = createTestStore()
      const { getByText, queryByText } = renderWithProviders(<AdminMerchantsScreen />, store)

      await waitFor(() => {
        expect(getByText('Boulangerie Martin')).toBeTruthy()
      })

      // Click on "Vérifiés" filter
      const verifiedFilter = getByText(/Vérifiés/)
      fireEvent.press(verifiedFilter)

      // Only verified merchant should be visible
      await waitFor(() => {
        expect(getByText('Épicerie Bio')).toBeTruthy()
        expect(queryByText('Boulangerie Martin')).toBeNull()
      })
    })

    it('filters merchants by pending status', async () => {
      const store = createTestStore()
      const { getByText, queryByText } = renderWithProviders(<AdminMerchantsScreen />, store)

      await waitFor(() => {
        expect(getByText('Boulangerie Martin')).toBeTruthy()
      })

      // Click on "En attente" filter
      const pendingFilter = getByText(/En attente/)
      fireEvent.press(pendingFilter)

      // Only pending merchant should be visible
      await waitFor(() => {
        expect(getByText('Boulangerie Martin')).toBeTruthy()
        expect(queryByText('Épicerie Bio')).toBeNull()
      })
    })
  })

  describe('Search', () => {
    it('searches merchants by business_name', async () => {
      const store = createTestStore()
      const { getByPlaceholderText, getByText, queryByText } = renderWithProviders(
        <AdminMerchantsScreen />,
        store
      )

      await waitFor(() => {
        expect(getByText('Boulangerie Martin')).toBeTruthy()
      })

      const searchInput = getByPlaceholderText('Rechercher un commerçant...')
      fireEvent.changeText(searchInput, 'Boulangerie')

      await waitFor(() => {
        expect(getByText('Boulangerie Martin')).toBeTruthy()
        expect(queryByText('Épicerie Bio')).toBeNull()
      })
    })

    it('clears search when close icon is pressed', async () => {
      const store = createTestStore()
      const { getByPlaceholderText, getByText, getAllByTestId } = renderWithProviders(
        <AdminMerchantsScreen />,
        store
      )

      await waitFor(() => {
        expect(getByText('Boulangerie Martin')).toBeTruthy()
      })

      const searchInput = getByPlaceholderText('Rechercher un commerçant...')
      fireEvent.changeText(searchInput, 'Boulangerie')

      // Find and press close icon (Ionicons close-circle)
      await waitFor(() => {
        const closeIcons = getAllByTestId(/ionicons/i)
        const closeIcon = closeIcons.find(
          (icon) => icon.props.name === 'close-circle'
        )
        if (closeIcon) {
          fireEvent.press(closeIcon)
        }
      })

      // Both merchants should be visible again
      await waitFor(() => {
        expect(getByText('Boulangerie Martin')).toBeTruthy()
        expect(getByText('Épicerie Bio')).toBeTruthy()
      })
    })
  })

  describe('Approve Merchant', () => {
    it('approves merchant with success alert', async () => {
      apiService.post.mockResolvedValueOnce({ data: { success: true } })

      // Mock Alert.alert to auto-confirm
      Alert.alert.mockImplementation((title, message, buttons) => {
        const confirmButton = buttons?.find((b) => b.text === 'Approuver')
        if (confirmButton) {
          confirmButton.onPress()
        }
      })

      const store = createTestStore()
      const { getByText } = renderWithProviders(<AdminMerchantsScreen />, store)

      await waitFor(() => {
        expect(getByText('Boulangerie Martin')).toBeTruthy()
      })

      // Find approve button (checkmark-circle icon) and press it
      const approveButton = getByText('Approuver')
      fireEvent.press(approveButton)

      await waitFor(() => {
        expect(apiService.post).toHaveBeenCalledWith('/admin/merchants/1/approve')
        expect(Alert.alert).toHaveBeenCalledWith(
          'Succès',
          'Commerçant approuvé avec succès'
        )
      })
    })

    it('handles approve API error', async () => {
      apiService.post.mockRejectedValueOnce({
        response: {
          data: {
            message: 'Commerçant déjà vérifié',
          },
        },
      })

      Alert.alert.mockImplementation((title, message, buttons) => {
        const confirmButton = buttons?.find((b) => b.text === 'Approuver')
        if (confirmButton) {
          confirmButton.onPress()
        }
      })

      const store = createTestStore()
      const { getByText } = renderWithProviders(<AdminMerchantsScreen />, store)

      await waitFor(() => {
        expect(getByText('Boulangerie Martin')).toBeTruthy()
      })

      const approveButton = getByText('Approuver')
      fireEvent.press(approveButton)

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Erreur', 'Commerçant déjà vérifié')
      })
    })
  })

  describe('Reject Merchant', () => {
    it('rejects merchant with valid reason (min 10 chars)', async () => {
      apiService.post.mockResolvedValueOnce({ data: { success: true } })

      // Mock Alert.prompt for rejection reason
      Alert.prompt = jest.fn((title, message, buttons) => {
        const rejectButton = buttons?.find((b) => b.text === 'Rejeter')
        if (rejectButton) {
          rejectButton.onPress('Documents invalides ou incomplets')
        }
      })

      const store = createTestStore()
      const { getByText } = renderWithProviders(<AdminMerchantsScreen />, store)

      await waitFor(() => {
        expect(getByText('Boulangerie Martin')).toBeTruthy()
      })

      const rejectButton = getByText('Rejeter')
      fireEvent.press(rejectButton)

      await waitFor(() => {
        expect(apiService.post).toHaveBeenCalledWith('/admin/merchants/1/reject', {
          reason: 'Documents invalides ou incomplets',
        })
      })
    })

    it('shows error if rejection reason too short', async () => {
      Alert.prompt = jest.fn((title, message, buttons) => {
        const rejectButton = buttons?.find((b) => b.text === 'Rejeter')
        if (rejectButton) {
          rejectButton.onPress('Court')
        }
      })

      const store = createTestStore()
      const { getByText } = renderWithProviders(<AdminMerchantsScreen />, store)

      await waitFor(() => {
        expect(getByText('Boulangerie Martin')).toBeTruthy()
      })

      const rejectButton = getByText('Rejeter')
      fireEvent.press(rejectButton)

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Erreur',
          'La raison doit contenir au moins 10 caractères'
        )
        expect(apiService.post).not.toHaveBeenCalled()
      })
    })

    it('handles reject API error', async () => {
      apiService.post.mockRejectedValueOnce({
        response: {
          data: {
            message: 'Impossible de rejeter ce commerçant',
          },
        },
      })

      Alert.prompt = jest.fn((title, message, buttons) => {
        const rejectButton = buttons?.find((b) => b.text === 'Rejeter')
        if (rejectButton) {
          rejectButton.onPress('Raison valide avec 10 caractères')
        }
      })

      const store = createTestStore()
      const { getByText } = renderWithProviders(<AdminMerchantsScreen />, store)

      await waitFor(() => {
        expect(getByText('Boulangerie Martin')).toBeTruthy()
      })

      const rejectButton = getByText('Rejeter')
      fireEvent.press(rejectButton)

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Erreur',
          'Impossible de rejeter ce commerçant'
        )
      })
    })
  })

  describe('Refresh', () => {
    it('refreshes merchant list on pull-to-refresh', async () => {
      const store = createTestStore()
      const { getByTestId } = renderWithProviders(<AdminMerchantsScreen />, store)

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
