import React from 'react'
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native'
import { Alert } from 'react-native'
import AdminAnalyticsScreen from './AdminAnalyticsScreen'
import apiService from '../../services/api'
import { TEST_IDS } from '../../utils/testIds'

// Mock dependencies
jest.mock('../../services/api', () => ({
  __esModule: true,
  default: {
    getAdminAnalytics: jest.fn(),
  },
}))
jest.mock('../../theme', () => {
  const { mockUseTheme } = require('../../__mocks__/themeMock')
  return {
    useTheme: mockUseTheme,
  }
})
jest.mock('../../components/admin/RevenueChart', () => 'RevenueChart')
jest.mock('../../components/admin/GeographicChart', () => 'GeographicChart')
jest.mock('../../components/admin/ExportButton', () => 'ExportButton')
jest.mock('../../utils/currencyHelpers', () => ({
  formatCurrency: (amount: number) => `${amount} XOF`,
}))

// Spy on Alert.alert
jest.spyOn(Alert, 'alert')

const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
}

const mockAnalyticsData = {
  overview: {
    total_revenue: 150000,
    total_transactions: 45,
    average_order_value: 3333.33,
    revenue_growth: 15.5,
    transaction_growth: 8.2,
  },
  revenue_trend: [
    { date: '2025-01-15', revenue: 12000, transactions: 8 },
    { date: '2025-01-16', revenue: 15000, transactions: 10 },
    { date: '2025-01-17', revenue: 18000, transactions: 12 },
  ],
  geographic_distribution: [
    { city: 'Lomé', revenue: 80000, percentage: 53.3 },
    { city: 'Kara', revenue: 40000, percentage: 26.7 },
    { city: 'Sokodé', revenue: 30000, percentage: 20.0 },
  ],
  top_merchants: [
    { merchant_id: 1, merchant_name: 'Boulangerie Martin', revenue: 50000, transactions: 20 },
    { merchant_id: 2, merchant_name: 'Épicerie Durand', revenue: 40000, transactions: 15 },
    { merchant_id: 3, merchant_name: 'Marché Bio', revenue: 30000, transactions: 10 },
  ],
}

describe('AdminAnalyticsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(apiService.getAdminAnalytics as jest.Mock).mockResolvedValue(mockAnalyticsData)
  })

  // ============ RENDERING TESTS ============

  test('should render screen with testID', async () => {
    const { getByTestId } = render(<AdminAnalyticsScreen navigation={mockNavigation} />)
    await waitFor(() => {
      expect(getByTestId(TEST_IDS.adminAnalytics)).toBeTruthy()
    })
  })

  test('should render loading spinner on initial load', () => {
    ;(apiService.getAdminAnalytics as jest.Mock).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(mockAnalyticsData), 100))
    )
    const { getByText } = render(<AdminAnalyticsScreen navigation={mockNavigation} />)
    expect(getByText('Chargement des analytics...')).toBeTruthy()
  })

  test('should render header with title', async () => {
    const { getByText } = render(<AdminAnalyticsScreen navigation={mockNavigation} />)
    await waitFor(() => {
      expect(getByText('Analytics Avancées')).toBeTruthy()
      expect(getByText('Administrateur')).toBeTruthy()
    })
  })

  test('should render back button', async () => {
    const { getByTestId } = render(<AdminAnalyticsScreen navigation={mockNavigation} />)
    await waitFor(() => {
      expect(getByTestId('back-button')).toBeTruthy()
    })
  })

  test('should render refresh button', async () => {
    const { getByTestId } = render(<AdminAnalyticsScreen navigation={mockNavigation} />)
    await waitFor(() => {
      expect(getByTestId(TEST_IDS.refreshButton)).toBeTruthy()
    })
  })

  // ============ DATA LOADING TESTS ============

  test('should load analytics on mount', async () => {
    render(<AdminAnalyticsScreen navigation={mockNavigation} />)
    await waitFor(() => {
      expect(apiService.getAdminAnalytics).toHaveBeenCalledWith({
        period: '30d',
      })
    })
  })

  test('should show error alert when loading fails', async () => {
    ;(apiService.getAdminAnalytics as jest.Mock).mockRejectedValue(new Error('Network error'))
    render(<AdminAnalyticsScreen navigation={mockNavigation} />)
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Erreur', 'Impossible de charger les analytics')
    })
  })

  // ============ PERIOD SELECTOR TESTS ============

  test('should render all period buttons', async () => {
    const { getByText } = render(<AdminAnalyticsScreen navigation={mockNavigation} />)
    await waitFor(() => {
      expect(getByText('7 jours')).toBeTruthy()
      expect(getByText('30 jours')).toBeTruthy()
      expect(getByText('90 jours')).toBeTruthy()
      expect(getByText('Personnalisé')).toBeTruthy()
    })
  })

  test('should have "30 jours" selected by default', async () => {
    render(<AdminAnalyticsScreen navigation={mockNavigation} />)
    await waitFor(() => {
      expect(apiService.getAdminAnalytics).toHaveBeenCalledWith({
        period: '30d',
      })
    })
  })

  test('should change period to 7 days when clicked', async () => {
    const { getByText } = render(<AdminAnalyticsScreen navigation={mockNavigation} />)
    await waitFor(() => {
      expect(getByText('7 jours')).toBeTruthy()
    })

    fireEvent.press(getByText('7 jours'))

    await waitFor(() => {
      expect(apiService.getAdminAnalytics).toHaveBeenCalledWith({
        period: '7d',
      })
    })
  })

  test('should change period to 90 days when clicked', async () => {
    const { getByText } = render(<AdminAnalyticsScreen navigation={mockNavigation} />)
    await waitFor(() => {
      expect(getByText('90 jours')).toBeTruthy()
    })

    fireEvent.press(getByText('90 jours'))

    await waitFor(() => {
      expect(apiService.getAdminAnalytics).toHaveBeenCalledWith({
        period: '90d',
      })
    })
  })

  test('should show date pickers when "Personnalisé" is selected', async () => {
    const { getByText, getByTestId } = render(<AdminAnalyticsScreen navigation={mockNavigation} />)
    await waitFor(() => {
      expect(getByText('Personnalisé')).toBeTruthy()
    })

    fireEvent.press(getByText('Personnalisé'))

    await waitFor(() => {
      expect(getByText('Date de début')).toBeTruthy()
      expect(getByText('Date de fin')).toBeTruthy()
    })
  })

  test('should send custom date range when custom period is selected', async () => {
    const { getByText } = render(<AdminAnalyticsScreen navigation={mockNavigation} />)
    await waitFor(() => {
      fireEvent.press(getByText('Personnalisé'))
    })

    await waitFor(() => {
      expect(apiService.getAdminAnalytics).toHaveBeenCalledWith(
        expect.objectContaining({
          period: 'custom',
          start_date: expect.any(String),
          end_date: expect.any(String),
        })
      )
    })
  })

  // ============ KPI CARDS TESTS ============

  test('should display total revenue card', async () => {
    const { getByText, getByTestId } = render(<AdminAnalyticsScreen navigation={mockNavigation} />)
    await waitFor(() => {
      expect(getByText('Revenus Totaux')).toBeTruthy()
      expect(getByText('150000 XOF')).toBeTruthy()
    })
  })

  test('should display total transactions card', async () => {
    const { getByText } = render(<AdminAnalyticsScreen navigation={mockNavigation} />)
    await waitFor(() => {
      expect(getByText('Transactions')).toBeTruthy()
      expect(getByText('45')).toBeTruthy()
    })
  })

  test('should display average order value card', async () => {
    const { getByText } = render(<AdminAnalyticsScreen navigation={mockNavigation} />)
    await waitFor(() => {
      expect(getByText('Valeur Moyenne')).toBeTruthy()
      expect(getByText('3333.33 XOF')).toBeTruthy()
    })
  })

  test('should display growth percentage for revenue', async () => {
    const { getByText } = render(<AdminAnalyticsScreen navigation={mockNavigation} />)
    await waitFor(() => {
      expect(getByText('+15.5%')).toBeTruthy()
    })
  })

  test('should display growth percentage for transactions', async () => {
    const { getByText } = render(<AdminAnalyticsScreen navigation={mockNavigation} />)
    await waitFor(() => {
      expect(getByText('+8.2%')).toBeTruthy()
    })
  })

  // ============ TAB SELECTOR TESTS ============

  test('should render all tab buttons', async () => {
    const { getByText } = render(<AdminAnalyticsScreen navigation={mockNavigation} />)
    await waitFor(() => {
      expect(getByText('Revenus')).toBeTruthy()
      expect(getByText('Géographie')).toBeTruthy()
      expect(getByText('Commerçants')).toBeTruthy()
    })
  })

  test('should have "Revenus" tab selected by default', async () => {
    const { getByTestId } = render(<AdminAnalyticsScreen navigation={mockNavigation} />)
    await waitFor(() => {
      expect(getByTestId(TEST_IDS.revenueTab)).toBeTruthy()
    })
  })

  test('should switch to geography tab when clicked', async () => {
    const { getByText } = render(<AdminAnalyticsScreen navigation={mockNavigation} />)
    await waitFor(() => {
      expect(getByText('Géographie')).toBeTruthy()
    })

    fireEvent.press(getByText('Géographie'))

    await waitFor(() => {
      // Should display geographic chart
      expect(getByText('Répartition Géographique')).toBeTruthy()
    })
  })

  test('should switch to merchants tab when clicked', async () => {
    const { getByText } = render(<AdminAnalyticsScreen navigation={mockNavigation} />)
    await waitFor(() => {
      expect(getByText('Commerçants')).toBeTruthy()
    })

    fireEvent.press(getByText('Commerçants'))

    await waitFor(() => {
      // Should display merchant performance list
      expect(getByText('Top Commerçants')).toBeTruthy()
    })
  })

  // ============ REVENUE CHART TESTS ============

  test('should render revenue chart in revenue tab', async () => {
    const { getByText } = render(<AdminAnalyticsScreen navigation={mockNavigation} />)
    await waitFor(() => {
      fireEvent.press(getByText('Revenus'))
    })

    await waitFor(() => {
      expect(getByText('Évolution des Revenus')).toBeTruthy()
    })
  })

  // ============ GEOGRAPHIC CHART TESTS ============

  test('should render geographic chart in geography tab', async () => {
    const { getByText } = render(<AdminAnalyticsScreen navigation={mockNavigation} />)
    await waitFor(() => {
      fireEvent.press(getByText('Géographie'))
    })

    await waitFor(() => {
      expect(getByText('Répartition Géographique')).toBeTruthy()
    })
  })

  test('should display cities in geography tab', async () => {
    const { getByText } = render(<AdminAnalyticsScreen navigation={mockNavigation} />)
    await waitFor(() => {
      fireEvent.press(getByText('Géographie'))
    })

    await waitFor(() => {
      expect(getByText(/Lomé/)).toBeTruthy()
      expect(getByText(/Kara/)).toBeTruthy()
      expect(getByText(/Sokodé/)).toBeTruthy()
    })
  })

  // ============ MERCHANT PERFORMANCE TESTS ============

  test('should display merchant list in merchants tab', async () => {
    const { getByText } = render(<AdminAnalyticsScreen navigation={mockNavigation} />)
    await waitFor(() => {
      fireEvent.press(getByText('Commerçants'))
    })

    await waitFor(() => {
      expect(getByText('Boulangerie Martin')).toBeTruthy()
      expect(getByText('Épicerie Durand')).toBeTruthy()
      expect(getByText('Marché Bio')).toBeTruthy()
    })
  })

  test('should display merchant revenues', async () => {
    const { getByText } = render(<AdminAnalyticsScreen navigation={mockNavigation} />)
    await waitFor(() => {
      fireEvent.press(getByText('Commerçants'))
    })

    await waitFor(() => {
      expect(getByText('50000 XOF')).toBeTruthy()
      expect(getByText('40000 XOF')).toBeTruthy()
      expect(getByText('30000 XOF')).toBeTruthy()
    })
  })

  test('should display merchant transaction counts', async () => {
    const { getByText } = render(<AdminAnalyticsScreen navigation={mockNavigation} />)
    await waitFor(() => {
      fireEvent.press(getByText('Commerçants'))
    })

    await waitFor(() => {
      expect(getByText('20 transactions')).toBeTruthy()
      expect(getByText('15 transactions')).toBeTruthy()
      expect(getByText('10 transactions')).toBeTruthy()
    })
  })

  // ============ EXPORT BUTTON TESTS ============

  test('should render CSV export button', async () => {
    const { getByTestId } = render(<AdminAnalyticsScreen navigation={mockNavigation} />)
    await waitFor(() => {
      expect(getByTestId(TEST_IDS.exportCsvButton)).toBeTruthy()
    })
  })

  test('should render PDF export button', async () => {
    const { getByTestId } = render(<AdminAnalyticsScreen navigation={mockNavigation} />)
    await waitFor(() => {
      expect(getByTestId(TEST_IDS.exportPdfButton)).toBeTruthy()
    })
  })

  test('should display "CSV" text on CSV export button', async () => {
    const { getByText } = render(<AdminAnalyticsScreen navigation={mockNavigation} />)
    await waitFor(() => {
      const csvButtons = screen.getAllByText('CSV')
      expect(csvButtons.length).toBeGreaterThan(0)
    })
  })

  test('should display "PDF" text on PDF export button', async () => {
    const { getByText } = render(<AdminAnalyticsScreen navigation={mockNavigation} />)
    await waitFor(() => {
      const pdfButtons = screen.getAllByText('PDF')
      expect(pdfButtons.length).toBeGreaterThan(0)
    })
  })

  // ============ REFRESH FUNCTIONALITY TESTS ============

  test('should refresh data when refresh button is pressed', async () => {
    const { getByTestId } = render(<AdminAnalyticsScreen navigation={mockNavigation} />)
    await waitFor(() => {
      expect(apiService.getAdminAnalytics).toHaveBeenCalledTimes(1)
    })

    const refreshButton = getByTestId(TEST_IDS.refreshButton)
    fireEvent.press(refreshButton)

    await waitFor(() => {
      expect(apiService.getAdminAnalytics).toHaveBeenCalledTimes(2)
    })
  })

  // ============ NAVIGATION TESTS ============

  test('should navigate back when back button is pressed', async () => {
    const { getByTestId } = render(<AdminAnalyticsScreen navigation={mockNavigation} />)
    await waitFor(() => {
      const backButton = getByTestId('back-button')
      fireEvent.press(backButton)
    })

    expect(mockNavigation.goBack).toHaveBeenCalled()
  })

  // ============ EMPTY DATA TESTS ============

  test('should handle empty revenue trend data', async () => {
    ;(apiService.getAdminAnalytics as jest.Mock).mockResolvedValue({
      ...mockAnalyticsData,
      revenue_trend: [],
    })
    const { getByText } = render(<AdminAnalyticsScreen navigation={mockNavigation} />)
    await waitFor(() => {
      expect(getByText('Aucune donnée disponible')).toBeTruthy()
    })
  })

  test('should handle empty geographic data', async () => {
    ;(apiService.getAdminAnalytics as jest.Mock).mockResolvedValue({
      ...mockAnalyticsData,
      geographic_distribution: [],
    })
    const { getByText } = render(<AdminAnalyticsScreen navigation={mockNavigation} />)
    await waitFor(() => {
      fireEvent.press(getByText('Géographie'))
    })

    await waitFor(() => {
      expect(getByText('Aucune donnée géographique disponible')).toBeTruthy()
    })
  })

  test('should handle empty merchants data', async () => {
    ;(apiService.getAdminAnalytics as jest.Mock).mockResolvedValue({
      ...mockAnalyticsData,
      top_merchants: [],
    })
    const { getByText } = render(<AdminAnalyticsScreen navigation={mockNavigation} />)
    await waitFor(() => {
      fireEvent.press(getByText('Commerçants'))
    })

    await waitFor(() => {
      expect(getByText('Aucun commerçant trouvé')).toBeTruthy()
    })
  })

  // ============ PERCENTAGE FORMATTING TESTS ============

  test('should format positive growth percentage correctly', async () => {
    const { getByText } = render(<AdminAnalyticsScreen navigation={mockNavigation} />)
    await waitFor(() => {
      expect(getByText('+15.5%')).toBeTruthy()
    })
  })

  test('should display negative growth percentage with minus sign', async () => {
    ;(apiService.getAdminAnalytics as jest.Mock).mockResolvedValue({
      ...mockAnalyticsData,
      overview: {
        ...mockAnalyticsData.overview,
        revenue_growth: -5.2,
      },
    })
    const { getByText } = render(<AdminAnalyticsScreen navigation={mockNavigation} />)
    await waitFor(() => {
      expect(getByText('-5.2%')).toBeTruthy()
    })
  })

  // ============ DATE FORMATTING TESTS ============

  test('should format dates correctly in custom period', async () => {
    const { getByText } = render(<AdminAnalyticsScreen navigation={mockNavigation} />)
    await waitFor(() => {
      fireEvent.press(getByText('Personnalisé'))
    })

    await waitFor(() => {
      // Should show formatted dates (depends on implementation)
      expect(apiService.getAdminAnalytics).toHaveBeenCalledWith(
        expect.objectContaining({
          period: 'custom',
          start_date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
          end_date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        })
      )
    })
  })

  // ============ LOADING STATE TESTS ============

  test('should show loading indicator during refresh', async () => {
    ;(apiService.getAdminAnalytics as jest.Mock).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(mockAnalyticsData), 500))
    )
    const { getByTestId } = render(<AdminAnalyticsScreen navigation={mockNavigation} />)
    await waitFor(() => {
      const refreshButton = getByTestId(TEST_IDS.refreshButton)
      fireEvent.press(refreshButton)
    })

    // Loading state should be visible during refresh
    expect(apiService.getAdminAnalytics).toHaveBeenCalled()
  })

  // ============ TAB PERSISTENCE TESTS ============

  test('should maintain selected tab after data refresh', async () => {
    const { getByText, getByTestId } = render(<AdminAnalyticsScreen navigation={mockNavigation} />)
    await waitFor(() => {
      fireEvent.press(getByText('Géographie'))
    })

    await waitFor(() => {
      expect(getByText('Répartition Géographique')).toBeTruthy()
    })

    const refreshButton = getByTestId(TEST_IDS.refreshButton)
    fireEvent.press(refreshButton)

    await waitFor(() => {
      // Should still show geography tab
      expect(getByText('Répartition Géographique')).toBeTruthy()
    })
  })

  // ============ PERIOD PERSISTENCE TESTS ============

  test('should maintain selected period after tab change', async () => {
    const { getByText } = render(<AdminAnalyticsScreen navigation={mockNavigation} />)
    await waitFor(() => {
      fireEvent.press(getByText('7 jours'))
    })

    await waitFor(() => {
      fireEvent.press(getByText('Géographie'))
    })

    // Should still have 7 days period selected
    await waitFor(() => {
      expect(apiService.getAdminAnalytics).toHaveBeenLastCalledWith({
        period: '7d',
      })
    })
  })
})
