// @ts-nocheck
import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { Alert } from 'react-native'
import AdminDashboardScreen from '../AdminDashboardScreen'
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
const mockStats = {
  total_users: 250,
  total_merchants: 45,
  total_products: 320,
  active_products: 285,
  total_reservations: 1240,
  total_revenue: 4850000,
  pending_merchants: 3,
  pending_products: 7,
  recent_activity: [
    {
      id: 1,
      type: 'new_user',
      description: 'Nouvel utilisateur inscrit',
      created_at: '2025-01-15T10:00:00Z',
    },
    {
      id: 2,
      type: 'new_merchant',
      description: 'Nouveau commerçant en attente',
      created_at: '2025-01-15T09:30:00Z',
    },
  ],
}

jest.mock('../../../services/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
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

describe('AdminDashboardScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    apiService.get.mockResolvedValue({
      data: mockStats,
    })
  })

  describe('Data Loading', () => {
    it('loads stats from /admin/dashboard endpoint on mount', async () => {
      const store = createTestStore()
      renderWithProviders(<AdminDashboardScreen />, store)

      await waitFor(() => {
        expect(apiService.get).toHaveBeenCalledWith('/admin/dashboard')
      })
    })

    it('displays loading state initially', () => {
      const store = createTestStore()
      const { getByText } = renderWithProviders(<AdminDashboardScreen />, store)

      expect(getByText('Chargement du tableau de bord...')).toBeTruthy()
    })

    it('displays stats after loading', async () => {
      const store = createTestStore()
      const { getByText } = renderWithProviders(<AdminDashboardScreen />, store)

      await waitFor(() => {
        expect(getByText('250')).toBeTruthy() // total_users
        expect(getByText('45')).toBeTruthy() // total_merchants
        expect(getByText('320')).toBeTruthy() // total_products
        expect(getByText('1,240')).toBeTruthy() // total_reservations (formatted)
      })
    })

    it('shows default stats when API returns empty', async () => {
      apiService.get.mockResolvedValueOnce({ data: null })

      const store = createTestStore()
      const { getByText } = renderWithProviders(<AdminDashboardScreen />, store)

      await waitFor(() => {
        expect(getByText('0')).toBeTruthy()
      })
    })

    it('handles API error gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
      apiService.get.mockRejectedValueOnce(new Error('Network error'))

      const store = createTestStore()
      renderWithProviders(<AdminDashboardScreen />, store)

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Erreur chargement stats admin:',
          expect.any(Error)
        )
      })

      consoleErrorSpy.mockRestore()
    })
  })

  describe('Stat Cards Display', () => {
    it('displays users stat card with correct data', async () => {
      const store = createTestStore()
      const { getByText } = renderWithProviders(<AdminDashboardScreen />, store)

      await waitFor(() => {
        expect(getByText('250')).toBeTruthy()
        expect(getByText('Utilisateurs')).toBeTruthy()
      })
    })

    it('displays merchants stat card with correct data', async () => {
      const store = createTestStore()
      const { getByText } = renderWithProviders(<AdminDashboardScreen />, store)

      await waitFor(() => {
        expect(getByText('45')).toBeTruthy()
        expect(getByText('Commerçants')).toBeTruthy()
      })
    })

    it('displays products stat card with correct data and active count', async () => {
      const store = createTestStore()
      const { getByText } = renderWithProviders(<AdminDashboardScreen />, store)

      await waitFor(() => {
        expect(getByText('320')).toBeTruthy()
        expect(getByText('Produits')).toBeTruthy()
        expect(getByText('285 actifs')).toBeTruthy()
      })
    })

    it('displays reservations stat card with correct data', async () => {
      const store = createTestStore()
      const { getByText } = renderWithProviders(<AdminDashboardScreen />, store)

      await waitFor(() => {
        expect(getByText('1,240')).toBeTruthy()
        expect(getByText('Réservations')).toBeTruthy()
      })
    })
  })

  describe('Alert Card', () => {
    it('displays alert card when there are pending merchants', async () => {
      const store = createTestStore()
      const { getByText } = renderWithProviders(<AdminDashboardScreen />, store)

      await waitFor(() => {
        expect(getByText('Actions requises')).toBeTruthy()
        expect(getByText('• 3 commerçants à valider')).toBeTruthy()
      })
    })

    it('displays alert card when there are pending products', async () => {
      const store = createTestStore()
      const { getByText } = renderWithProviders(<AdminDashboardScreen />, store)

      await waitFor(() => {
        expect(getByText('Actions requises')).toBeTruthy()
        expect(getByText('• 7 produits à modérer')).toBeTruthy()
      })
    })

    it('hides alert card when no pending items', async () => {
      apiService.get.mockResolvedValueOnce({
        data: {
          ...mockStats,
          pending_merchants: 0,
          pending_products: 0,
        },
      })

      const store = createTestStore()
      const { queryByText } = renderWithProviders(<AdminDashboardScreen />, store)

      await waitFor(() => {
        expect(queryByText('Actions requises')).toBeNull()
      })
    })
  })

  describe('Revenue Card', () => {
    it('displays total revenue in XOF currency', async () => {
      const store = createTestStore()
      const { getByText } = renderWithProviders(<AdminDashboardScreen />, store)

      await waitFor(() => {
        expect(getByText('Revenus totaux')).toBeTruthy()
        expect(getByText('4,850,000 XOF')).toBeTruthy()
      })
    })
  })

  describe('Quick Actions', () => {
    it('renders all quick action cards', async () => {
      const store = createTestStore()
      const { getByText } = renderWithProviders(<AdminDashboardScreen />, store)

      await waitFor(() => {
        expect(getByText('Gérer utilisateurs')).toBeTruthy()
        expect(getByText('Gérer produits')).toBeTruthy()
        expect(getByText('Gérer commerçants')).toBeTruthy()
        expect(getByText('Gérer catégories')).toBeTruthy()
      })
    })
  })

  describe('Refresh', () => {
    it('refreshes dashboard data on pull-to-refresh', async () => {
      const store = createTestStore()
      const { getByTestId } = renderWithProviders(<AdminDashboardScreen />, store)

      await waitFor(() => {
        expect(apiService.get).toHaveBeenCalledTimes(1)
      })

      // Simulate pull-to-refresh
      const scrollView = getByTestId(/scrollview/i)
      if (scrollView) {
        fireEvent(scrollView, 'refresh')
      }

      await waitFor(() => {
        expect(apiService.get).toHaveBeenCalledTimes(2)
      })
    })

    it('refreshes dashboard data on header refresh button press', async () => {
      const store = createTestStore()
      const { getByLabelText } = renderWithProviders(<AdminDashboardScreen />, store)

      await waitFor(() => {
        expect(apiService.get).toHaveBeenCalledTimes(1)
      })

      const refreshButton = getByLabelText('Rafraîchir le dashboard')
      fireEvent.press(refreshButton)

      await waitFor(() => {
        expect(apiService.get).toHaveBeenCalledTimes(2)
      })
    })
  })
})
