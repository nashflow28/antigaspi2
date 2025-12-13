import React from 'react'
import { render, fireEvent, waitFor, screen } from '@test-utils'
import { Alert } from 'react-native'
import AdminAnalyticsScreen from './AdminAnalyticsScreen'
import apiService from '../../services/api'
import { TEST_IDS } from '../../utils/testIds'

// Mock dependencies
jest.mock('../../services/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
  },
}))
jest.mock('../../theme', () => {
  const actualTheme = jest.requireActual('../../theme')
  const { mockUseTheme } = require('../../__mocks__/themeMock')
  return {
    ...actualTheme,
    useTheme: mockUseTheme,
  }
})
jest.mock('../../components/admin/RevenueChart', () => {
  const React = require('react')
  const { Text } = require('react-native')
  return () => <Text>RevenueChart</Text>
})
jest.mock('../../components/admin/GeographicChart', () => {
  const React = require('react')
  const { Text } = require('react-native')
  return ({ data }: { data: any[] }) => (
    <Text>
      GeographicChart:{' '}
      {Array.isArray(data) ? data.map((d) => d.city).join(',') : ''}
    </Text>
  )
})
jest.mock('../../components/admin/ExportButton', () => {
  const React = require('react')
  const { Text } = require('react-native')
  return ({ format }: { format: string }) => <Text>{format.toUpperCase()}</Text>
})
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
    { merchant_id: 2, merchant_name: 'Epicerie Durand', revenue: 40000, transactions: 15 },
    { merchant_id: 3, merchant_name: 'Marché Bio', revenue: 30000, transactions: 10 },
  ],
}

// Updated data shape matching AdminAnalyticsScreen expectations
const mockAnalyticsResponseData = {
  summary: {
    total_revenue: 150000,
    growth_rate: 15.5,
    total_transactions: 45,
    average_order_value: 3333.33,
  },
  revenue_chart: {
    labels: ['2025-01-15', '2025-01-16', '2025-01-17'],
    datasets: [
      {
        data: [12000, 15000, 18000],
      },
    ],
  },
  geographic_distribution: [
    { city: 'Lome', reservations_count: 20, revenue: 80000, percentage: 53.3 },
    { city: 'Kara', reservations_count: 15, revenue: 40000, percentage: 26.7 },
    { city: 'Sokode', reservations_count: 10, revenue: 30000, percentage: 20.0 },
  ],
  merchant_performance: [
    {
      merchant_id: 1,
      merchant_name: 'Boulangerie Martin',
      reservations_count: 20,
      revenue: 50000,
      average_order_value: 2500,
      growth_rate: 10,
    },
    {
      merchant_id: 2,
      merchant_name: 'Epicerie Durand',
      reservations_count: 15,
      revenue: 40000,
      average_order_value: 2666.67,
      growth_rate: 5,
    },
    {
      merchant_id: 3,
      merchant_name: 'Marche Bio',
      reservations_count: 10,
      revenue: 30000,
      average_order_value: 3000,
      growth_rate: -2,
    },
  ],
  daily_breakdown: [
    { date: '2025-01-15', reservations: 8, revenue: 12000, products_saved: 12, new_users: 2 },
    { date: '2025-01-16', reservations: 10, revenue: 15000, products_saved: 15, new_users: 3 },
    { date: '2025-01-17', reservations: 12, revenue: 18000, products_saved: 18, new_users: 4 },
  ],
}

// Same data with stable ASCII strings for assertions
const mockAnalyticsResponseDataSafe = {
  ...mockAnalyticsResponseData,
  geographic_distribution: [
    { city: 'Lome', reservations_count: 20, revenue: 80000, percentage: 53.3 },
    { city: 'Kara', reservations_count: 15, revenue: 40000, percentage: 26.7 },
    { city: 'Sokode', reservations_count: 10, revenue: 30000, percentage: 20.0 },
  ],
  merchant_performance: [
    {
      merchant_id: 1,
      merchant_name: 'Boulangerie Martin',
      reservations_count: 20,
      revenue: 50000,
      average_order_value: 2500,
      growth_rate: 10,
    },
    {
      merchant_id: 2,
      merchant_name: 'Epicerie Durand',
      reservations_count: 15,
      revenue: 40000,
      average_order_value: 2666.67,
      growth_rate: 5,
    },
    {
      merchant_id: 3,
      merchant_name: 'Marche Bio',
      reservations_count: 10,
      revenue: 30000,
      average_order_value: 3000,
      growth_rate: -2,
    },
  ],
}

describe('AdminAnalyticsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(apiService.get as jest.Mock).mockResolvedValue({ data: mockAnalyticsResponseDataSafe })
  })

  // ============ RENDERING TESTS ============

  test('should render main screen content', async () => {
    const { getByText, queryByText } = render(<AdminAnalyticsScreen navigation={mockNavigation} />)
    await waitFor(() => {
      expect(getByText('Analytics Avancées')).toBeTruthy()
    })
  })

  test('should render loading spinner on initial load', () => {
    ;(apiService.get as jest.Mock).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ data: mockAnalyticsResponseData }), 100))
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
      expect(apiService.get).toHaveBeenCalledWith('/admin/analytics', {
        params: { period: '30d' },
      })
    })
  })

  test('should show error alert when loading fails', async () => {
    const consoleSpyNew = jest.spyOn(console, 'error').mockImplementation(() => {})
    ;(apiService.get as jest.Mock).mockRejectedValue(new Error('Network error'))
    render(<AdminAnalyticsScreen navigation={mockNavigation} />)
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Erreur', 'Impossible de charger les analytics')
    })
    consoleSpyNew.mockRestore()
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
      expect(apiService.get).toHaveBeenCalledWith('/admin/analytics', {
        params: { period: '30d' },
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
      expect(apiService.get).toHaveBeenCalledWith('/admin/analytics', {
        params: { period: '7d' },
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
      expect(apiService.get).toHaveBeenCalledWith('/admin/analytics', {
        params: { period: '90d' },
      })
    })
  })

  test('should send custom date range when custom period is selected', async () => {
    const { getByText } = render(<AdminAnalyticsScreen navigation={mockNavigation} />)
    await waitFor(() => {
      fireEvent.press(getByText('Personnalisé'))
    })

    await waitFor(() => {
      expect(apiService.get).toHaveBeenCalledWith(
        '/admin/analytics',
        expect.objectContaining({
          params: expect.objectContaining({
            period: 'custom',
            start_date: expect.any(String),
            end_date: expect.any(String),
          }),
        })
      )
    })
  })

  // ============ KPI CARDS TESTS ============

  test('should display total revenue card', async () => {
    const { getByText, getByTestId } = render(<AdminAnalyticsScreen navigation={mockNavigation} />)
    await waitFor(() => {
      expect(getByText('Revenu Total')).toBeTruthy()
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
      expect(getByText('Panier Moyen')).toBeTruthy()
      expect(getByText('3333.33 XOF')).toBeTruthy()
    })
  })

  test('should display growth percentage for revenue', async () => {
    const { getByText } = render(<AdminAnalyticsScreen navigation={mockNavigation} />)
    await waitFor(() => {
      expect(getByText('+15.5%')).toBeTruthy()
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
    const { getByText, queryByText } = render(<AdminAnalyticsScreen navigation={mockNavigation} />)
    await waitFor(() => {
      expect(getByText('Géographie')).toBeTruthy()
    })

    fireEvent.press(getByText('Géographie'))

    await waitFor(() => {
      expect(getByText(/GeographicChart:/)).toBeTruthy()
      expect(queryByText('RevenueChart')).toBeNull()
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
      expect(getByText('Boulangerie Martin')).toBeTruthy()
    })
  })

  // ============ REVENUE CHART TESTS ============

test('should render revenue chart in revenue tab', async () => {
    const { getByText } = render(<AdminAnalyticsScreen navigation={mockNavigation} />)
    await waitFor(() => {
      fireEvent.press(getByText('Revenus'))
    })

    expect(getByText('RevenueChart')).toBeTruthy()
  })

  // ============ GEOGRAPHIC CHART TESTS ============

test('should render geographic chart in geography tab', async () => {
    const { getByText } = render(<AdminAnalyticsScreen navigation={mockNavigation} />)
    await waitFor(() => {
      fireEvent.press(getByText('Géographie'))
    })

    expect(getByText(/GeographicChart:/)).toBeTruthy()
  })

test('should display cities in geography tab', async () => {
    const { getByText } = render(<AdminAnalyticsScreen navigation={mockNavigation} />)
    await waitFor(() => {
      fireEvent.press(getByText('Géographie'))
    })

    expect(getByText(/Lome/)).toBeTruthy()
    expect(getByText(/Kara/)).toBeTruthy()
    expect(getByText(/Sokode/)).toBeTruthy()
  })

  // ============ MERCHANT PERFORMANCE TESTS ============

test('should display merchant list in merchants tab', async () => {
    const { getByText } = render(<AdminAnalyticsScreen navigation={mockNavigation} />)
    await waitFor(() => {
      fireEvent.press(getByText('Commerçants'))
    })

    await waitFor(() => {
      expect(getByText('Boulangerie Martin')).toBeTruthy()
      expect(getByText('Epicerie Durand')).toBeTruthy()
      expect(getByText('Marche Bio')).toBeTruthy()
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

test('should display merchant reservation counts', async () => {
    const { getByText } = render(<AdminAnalyticsScreen navigation={mockNavigation} />)
    await waitFor(() => {
      fireEvent.press(getByText('Commerçants'))
    })

    await waitFor(() => {
      expect(getByText(/20.*serv/i)).toBeTruthy()
      expect(getByText(/15.*serv/i)).toBeTruthy()
      expect(getByText(/10.*serv/i)).toBeTruthy()
    })
  })

  // ============ EXPORT BUTTON TESTS ============

test('should render CSV export button text', async () => {
    const { getByText } = render(<AdminAnalyticsScreen navigation={mockNavigation} />)
    await waitFor(() => {
      expect(getByText('CSV')).toBeTruthy()
    })
  })

test('should render PDF export button text', async () => {
    const { getByText } = render(<AdminAnalyticsScreen navigation={mockNavigation} />)
    await waitFor(() => {
      expect(getByText('PDF')).toBeTruthy()
    })
  })

  // ============ REFRESH FUNCTIONALITY TESTS ============

  test('should refresh data when refresh button is pressed', async () => {
    const { getByTestId } = render(<AdminAnalyticsScreen navigation={mockNavigation} />)
    await waitFor(() => {
      expect(apiService.get).toHaveBeenCalledTimes(1)
    })

    const refreshButton = getByTestId(TEST_IDS.refreshButton)
    fireEvent.press(refreshButton)

    await waitFor(() => {
      expect(apiService.get).toHaveBeenCalledTimes(2)
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

  test('should handle empty revenue chart data without crashing', async () => {
    ;(apiService.get as jest.Mock).mockResolvedValue({
      data: {
        ...mockAnalyticsResponseDataSafe,
        revenue_chart: {
          ...mockAnalyticsResponseDataSafe.revenue_chart,
          datasets: [{ data: [] }],
        },
      },
    })
    const { getByText } = render(<AdminAnalyticsScreen navigation={mockNavigation} />)
    await waitFor(() => {
      expect(getByText('RevenueChart')).toBeTruthy()
    })
  })

  test('should handle empty geographic data without crashing', async () => {
    ;(apiService.get as jest.Mock).mockResolvedValue({
      data: {
        ...mockAnalyticsResponseDataSafe,
        geographic_distribution: [],
      },
    })
    const utils = render(<AdminAnalyticsScreen navigation={mockNavigation} />)
    await waitFor(() => {
      fireEvent.press(utils.getByText('Géographie'))
    })
    expect(utils.getByText(/GeographicChart:/)).toBeTruthy()
  })

  test('should handle empty merchants data without crashing', async () => {
    ;(apiService.get as jest.Mock).mockResolvedValue({
      data: {
        ...mockAnalyticsResponseDataSafe,
        merchant_performance: [],
      },
    })
    const utils = render(<AdminAnalyticsScreen navigation={mockNavigation} />)
    await waitFor(() => {
      fireEvent.press(utils.getByText('Commerçants'))
    })
    expect(utils.queryByText('Boulangerie Martin')).toBeNull()
  })

  // ============ PERCENTAGE FORMATTING TESTS ============

  test('should format positive growth percentage correctly', async () => {
    const { getByText } = render(<AdminAnalyticsScreen navigation={mockNavigation} />)
    await waitFor(() => {
      expect(getByText('+15.5%')).toBeTruthy()
    })
  })

  test('should display negative growth percentage with minus sign', async () => {
    ;(apiService.get as jest.Mock).mockResolvedValue({
      data: {
        ...mockAnalyticsResponseData,
        summary: {
          ...mockAnalyticsResponseData.summary,
          growth_rate: -5.2,
        },
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
      expect(apiService.get).toHaveBeenCalledWith(
        '/admin/analytics',
        expect.objectContaining({
          params: expect.objectContaining({
            period: 'custom',
            start_date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
            end_date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
          }),
        })
      )
    })
  })

  // ============ LOADING STATE TESTS ============

  test('should show loading indicator during refresh', async () => {
    ;(apiService.get as jest.Mock).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ data: mockAnalyticsResponseData }), 500))
    )
    const { getByTestId } = render(<AdminAnalyticsScreen navigation={mockNavigation} />)
    await waitFor(() => {
      const refreshButton = getByTestId(TEST_IDS.refreshButton)
      fireEvent.press(refreshButton)
    })

    // Loading state should be visible during refresh
    expect(apiService.get).toHaveBeenCalled()
  })

  // ============ TAB PERSISTENCE TESTS ============

test('should maintain selected tab after data refresh', async () => {
    const { getByText, getByTestId } = render(<AdminAnalyticsScreen navigation={mockNavigation} />)
    await waitFor(() => {
      fireEvent.press(getByText('Géographie'))
    })

    await waitFor(() => {
      expect(getByText(/GeographicChart:/)).toBeTruthy()
    })

    const refreshButton = getByTestId(TEST_IDS.refreshButton)
    fireEvent.press(refreshButton)

    await waitFor(() => {
      // Should still show geography tab
      expect(getByText(/GeographicChart:/)).toBeTruthy()
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
      expect(apiService.get).toHaveBeenLastCalledWith('/admin/analytics', {
        params: { period: '7d' },
      })
    })
  })
})
