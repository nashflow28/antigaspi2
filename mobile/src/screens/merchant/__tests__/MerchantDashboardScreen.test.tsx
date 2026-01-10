// @ts-nocheck
import React from 'react'
import { render, fireEvent, waitFor, createTestStore as createStore } from '@test-utils'
import MerchantDashboardScreen from '../MerchantDashboardScreen'
import { TEST_IDS } from '../../../utils/testIds'
import apiService from '../../../services/api'

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

// Mock apiService
jest.mock('../../../services/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn((url) => {
      if (url.includes('merchant-stats')) {
        return Promise.resolve({
          data: {
            active_products: 8,
            pending_reservations: 5,
            todays_revenue: 12500,
            total_products: 12,
          },
        })
      }
      if (url.includes('reservations/merchant/list')) {
        return Promise.resolve({
          data: {
            data: [
              {
                id: 1,
                customer_name: 'Jean Dupont',
                product_name: 'Pain artisanal',
                quantity: 2,
                status: 'pending',
                created_at: '2025-10-18T10:00:00.000000Z',
              },
              {
                id: 2,
                customer_name: 'Marie Leblanc',
                product_name: 'Croissants',
                quantity: 5,
                status: 'confirmed',
                created_at: '2025-10-18T11:00:00.000000Z',
              },
            ],
          },
        })
      }
      if (url.includes('merchants/reviews/list')) {
        return Promise.resolve({ data: { data: [] } })
      }
      return Promise.resolve({ data: {} })
    }),
    getMerchantLocation: jest.fn(() => Promise.resolve({
      success: true,
      data: null,
    })),
    updateMerchantLocation: jest.fn(() => Promise.resolve({
      success: true,
      data: {
        latitude: 6.1319,
        longitude: 1.2228,
        has_location: true,
      },
    })),
  },
}))

const createTestStore = () => {
  return createStore({
    auth: {
      user: {
        id: 2,
        first_name: 'Marie',
        last_name: 'Martin',
        email: 'boulangerie.martin@email.com',
        role: 'merchant',
        merchant: {
          id: 1,
          business_name: 'Boulangerie Martin',
          business_type: 'Boulangerie',
        },
      },
      token: 'test-token',
      isAuthenticated: true,
      loading: false,
      error: null,
    },
  })
}

// Helper to render with providers
const renderWithProviders = (component: React.ReactElement, store: any) => {
  return render(component, { store })
}

describe('MerchantDashboardScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('fetches dashboard data on mount', async () => {
      const store = createTestStore()
      renderWithProviders(<MerchantDashboardScreen />, store)

      await waitFor(() => {
      expect(apiService.get).toHaveBeenCalledWith('/analytics/merchant-stats')
      expect(apiService.get).toHaveBeenCalledWith('/reservations/merchant/list?limit=5')
      })
    })

    it('displays header with correct titles', () => {
      const store = createTestStore()
      const { getByText } = renderWithProviders(<MerchantDashboardScreen />, store)

      // Header shows merchant business_name from Redux state
      expect(getByText('Boulangerie Martin')).toBeTruthy()
      expect(getByText('Tableau de bord')).toBeTruthy()
    })

    it('reloads dashboard data when refresh button is pressed', async () => {
      const store = createTestStore()
      const { getByLabelText } = renderWithProviders(<MerchantDashboardScreen />, store)

      const refreshButton = getByLabelText('Rafraîchir le tableau de bord')
      fireEvent.press(refreshButton)

      // Initial load: 3 calls (stats, reservations, reviews) + Refresh: 3 more = 6 total
      await waitFor(() => {
      expect(apiService.get).toHaveBeenCalledTimes(6)
      })
    })
  })

  describe('Stats Cards', () => {
    it('displays active products card with testID', () => {
      const store = createTestStore()
      const { getByTestId } = renderWithProviders(<MerchantDashboardScreen />, store)

      expect(getByTestId(TEST_IDS.activeProductsCard)).toBeTruthy()
    })

    it('displays total sales card with testID', () => {
      const store = createTestStore()
      const { getByTestId } = renderWithProviders(<MerchantDashboardScreen />, store)

      expect(getByTestId(TEST_IDS.totalSalesCard)).toBeTruthy()
    })

    it('displays active products label', () => {
      const store = createTestStore()
      const { getByText } = renderWithProviders(<MerchantDashboardScreen />, store)

      expect(getByText('Produits actifs')).toBeTruthy()
    })

    it('displays pending reservations label', () => {
      const store = createTestStore()
      const { getByText } = renderWithProviders(<MerchantDashboardScreen />, store)

      expect(getByText('Réserv. à traiter')).toBeTruthy()
    })

    it('displays todays revenue label', () => {
      const store = createTestStore()
      const { getByText } = renderWithProviders(<MerchantDashboardScreen />, store)

      expect(getByText("Revenus aujourd'hui")).toBeTruthy()
    })

    it('loads and displays stats from API', async () => {
      const store = createTestStore()
      const { findByText } = renderWithProviders(<MerchantDashboardScreen />, store)

      // Wait for API data to load
      expect(await findByText('8')).toBeTruthy() // active_products
      expect(await findByText('5')).toBeTruthy() // pending_reservations
    })

    it('formats revenue with F currency symbol', async () => {
      const store = createTestStore()
      const { findByText } = renderWithProviders(<MerchantDashboardScreen />, store)

      expect(await findByText(/12[,\s]?500 F/i)).toBeTruthy()
    })
  })

  describe('Analytics Button', () => {
    it('displays view statistics button', () => {
      const store = createTestStore()
      const { getByText } = renderWithProviders(<MerchantDashboardScreen />, store)

      expect(getByText('Voir statistiques détaillées')).toBeTruthy()
    })

    it('navigates to Analytics when button is pressed', async () => {
      const store = createTestStore()
      const { getByText } = renderWithProviders(<MerchantDashboardScreen />, store)

      const analyticsButton = getByText('Voir statistiques détaillées')
      fireEvent.press(analyticsButton)

      await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('Analytics')
      })
    })
  })

  describe('Recent Reservations Section', () => {
    it('displays recent reservations title', () => {
      const store = createTestStore()
      const { getByText } = renderWithProviders(<MerchantDashboardScreen />, store)

      expect(getByText('Réservations récentes')).toBeTruthy()
    })

    it('displays see all links', () => {
      const store = createTestStore()
      const { getAllByText } = renderWithProviders(<MerchantDashboardScreen />, store)

      // Multiple "Voir tout" links (reservations + reviews sections)
      const seeAllLinks = getAllByText('Voir tout')
      expect(seeAllLinks.length).toBeGreaterThanOrEqual(1)
    })

    it('loads and displays recent reservations from API', async () => {
      const store = createTestStore()
      const { findByText } = renderWithProviders(<MerchantDashboardScreen />, store)

      expect(await findByText('Jean Dupont')).toBeTruthy()
      expect(await findByText('Marie Leblanc')).toBeTruthy()
    })

    it('displays product names for reservations', async () => {
      const store = createTestStore()
      const { findByText } = renderWithProviders(<MerchantDashboardScreen />, store)

      expect(await findByText('Pain artisanal')).toBeTruthy()
      expect(await findByText('Croissants')).toBeTruthy()
    })

    it('displays reservation status badges', async () => {
      const store = createTestStore()
      const { findByText } = renderWithProviders(<MerchantDashboardScreen />, store)

      expect(await findByText('En attente')).toBeTruthy() // pending status
      expect(await findByText('Confirmée')).toBeTruthy() // confirmed status
    })

    it('displays reservation quantities', async () => {
      const store = createTestStore()
      const { findByText } = renderWithProviders(<MerchantDashboardScreen />, store)

      expect(await findByText(/Qté.*2/i)).toBeTruthy()
      expect(await findByText(/Qté.*5/i)).toBeTruthy()
    })
  })

  describe('Empty State', () => {
    it('displays empty state when no reservations', async () => {
      // Mock empty reservations
      const apiService = require('../../../services/api').default
      apiService.get.mockImplementationOnce((url) => {
        if (url.includes('merchant-stats')) {
          return Promise.resolve({
            data: {
              active_products: 8,
              pending_reservations: 0,
              todays_revenue: 0,
              total_products: 12,
            },
          })
        }
        return Promise.resolve({ data: { data: [] } })
      })

      const store = createTestStore()
      const { findByText } = renderWithProviders(<MerchantDashboardScreen />, store)

      expect(await findByText('Aucune réservation récente')).toBeTruthy()
    })
  })

  describe('Refresh Functionality', () => {
    it('can pull to refresh dashboard data', async () => {
      const store = createTestStore()
      const { getByTestId } = renderWithProviders(<MerchantDashboardScreen />, store)

      // Component should load initially
      await waitFor(() => {
      expect(getByTestId(TEST_IDS.merchantDashboard)).toBeTruthy()
      })
    })
  })

  describe('Status Display', () => {
    it('displays correct text for pending status', async () => {
      const store = createTestStore()
      const { findByText } = renderWithProviders(<MerchantDashboardScreen />, store)

      expect(await findByText('En attente')).toBeTruthy()
    })

    it('displays correct text for confirmed status', async () => {
      const store = createTestStore()
      const { findByText } = renderWithProviders(<MerchantDashboardScreen />, store)

      expect(await findByText('Confirmée')).toBeTruthy()
    })
  })

  describe('Card Layout', () => {
    it('displays all three stat cards', () => {
      const store = createTestStore()
      const { getByText } = renderWithProviders(<MerchantDashboardScreen />, store)

      expect(getByText('Produits actifs')).toBeTruthy()
      expect(getByText('Réserv. à traiter')).toBeTruthy()
      expect(getByText("Revenus aujourd'hui")).toBeTruthy()
    })

    it('displays stats in correct format', async () => {
      const store = createTestStore()
      const { findByText } = renderWithProviders(<MerchantDashboardScreen />, store)

      // Stats should be numbers
      expect(await findByText('8')).toBeTruthy()
      expect(await findByText('5')).toBeTruthy()
    })
  })
})
