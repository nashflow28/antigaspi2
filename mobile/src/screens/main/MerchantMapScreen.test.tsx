import React from 'react'
import { render, fireEvent, waitFor, act } from '@testing-library/react-native'
import { Alert, Linking } from 'react-native'
import MerchantMapScreen from './MerchantMapScreen'
import * as Location from 'expo-location'
import apiService from '../../services/api'

// Mock dependencies
jest.mock('react-native-maps', () => {
  const { View } = require('react-native')
  return {
    __esModule: true,
    default: View,
    Marker: View,
    Callout: View,
    UrlTile: View,
  }
})

jest.mock('expo-location')
jest.mock('../../services/api', () => ({
  __esModule: true,
  default: {
    getMerchants: jest.fn(),
    get: jest.fn(),
    post: jest.fn(),
  },
}))
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
  }),
}))
jest.mock('../../theme', () => {
  const { mockUseTheme } = require('../../__mocks__/themeMock')
  return {
    useTheme: mockUseTheme,
  }
})

// Spy on Alert and Linking
jest.spyOn(Alert, 'alert')
jest.spyOn(Linking, 'canOpenURL').mockResolvedValue(true)
jest.spyOn(Linking, 'openURL').mockResolvedValue(true)

const mockMerchants = [
  {
    id: 1,
    business_name: 'Boulangerie Martin',
    business_type: 'Boulangerie',
    city: 'Lomé',
    address: '123 Rue du Commerce',
    phone: '+228 90 00 00 00',
    is_verified: true,
    latitude: 6.1256,
    longitude: 1.2225,
  },
  {
    id: 2,
    business_name: 'Marché Bio',
    business_type: 'Épicerie',
    city: 'Lomé',
    address: '456 Avenue de la Paix',
    phone: '+228 91 11 11 11',
    is_verified: false,
    latitude: 6.1356,
    longitude: 1.2325,
  },
]

describe('MerchantMapScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // Mock Location permissions
    ;(Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'granted',
    })
    ;(Location.getCurrentPositionAsync as jest.Mock).mockResolvedValue({
      coords: {
        latitude: 6.1256,
        longitude: 1.2225,
      },
    })

    // Mock API getMerchants
    ;(apiService.getMerchants as jest.Mock).mockResolvedValue({
      data: mockMerchants,
    })
  })

  // ============ RENDERING TESTS ============

  test('should render loading state initially', () => {
    const { getByTestId } = render(<MerchantMapScreen />)
    expect(getByTestId('merchant-map-loading')).toBeTruthy()
  })

  test('should render map after loading', async () => {
    const { getByTestId } = render(<MerchantMapScreen />)

    await waitFor(() => {
      expect(getByTestId('merchant-map-screen')).toBeTruthy()
    })
  })

  test('should request location permission on mount', async () => {
    render(<MerchantMapScreen />)

    await waitFor(() => {
      expect(Location.requestForegroundPermissionsAsync).toHaveBeenCalled()
    })
  })

  test('should call getMerchants API on mount', async () => {
    render(<MerchantMapScreen />)

    await waitFor(() => {
      expect(apiService.getMerchants).toHaveBeenCalled()
    })
  })

  // ============ ERROR STATE TESTS ============

  test('should display error state when API fails', async () => {
    ;(apiService.getMerchants as jest.Mock).mockRejectedValue({
      response: { data: { message: 'Network error' } },
    })

    const { getByTestId, getByText } = render(<MerchantMapScreen />)

    await waitFor(() => {
      expect(getByTestId('merchant-map-error')).toBeTruthy()
      expect(getByText('Network error')).toBeTruthy()
    })
  })

  test('should show retry button on error', async () => {
    ;(apiService.getMerchants as jest.Mock).mockRejectedValue(new Error('Test error'))

    const { getByTestId } = render(<MerchantMapScreen />)

    await waitFor(() => {
      expect(getByTestId('merchant-map-retry-button')).toBeTruthy()
    })
  })

  test('should retry fetch when retry button pressed', async () => {
    ;(apiService.getMerchants as jest.Mock).mockRejectedValueOnce(new Error('Test error'))
      .mockResolvedValueOnce({ data: mockMerchants })

    const { getByTestId } = render(<MerchantMapScreen />)

    await waitFor(() => {
      expect(getByTestId('merchant-map-retry-button')).toBeTruthy()
    })

    const retryButton = getByTestId('merchant-map-retry-button')
    fireEvent.press(retryButton)

    await waitFor(() => {
      expect(apiService.getMerchants).toHaveBeenCalledTimes(2)
    })
  })

  // ============ EMPTY STATE TESTS ============

  test('should display empty state when no merchants have location', async () => {
    ;(apiService.getMerchants as jest.Mock).mockResolvedValue({
      data: [
        { id: 1, business_name: 'Test', latitude: null, longitude: null },
      ],
    })

    const { getByTestId, getByText } = render(<MerchantMapScreen />)

    await waitFor(() => {
      expect(getByTestId('merchant-map-empty')).toBeTruthy()
      expect(getByText('Aucun commerçant à proximité')).toBeTruthy()
    })
  })

  test('should show refresh button in empty state', async () => {
    ;(apiService.getMerchants as jest.Mock).mockResolvedValue({ data: [] })

    const { getByTestId } = render(<MerchantMapScreen />)

    await waitFor(() => {
      expect(getByTestId('merchant-map-refresh-button')).toBeTruthy()
    })
  })

  // ============ MERCHANT DISPLAY TESTS ============

  test('should filter merchants without valid coordinates', async () => {
    const mixedData = [
      ...mockMerchants,
      { id: 3, business_name: 'No Location', latitude: null, longitude: null },
      { id: 4, business_name: 'Invalid', latitude: NaN, longitude: 1.0 },
    ]

    ;(apiService.getMerchants as jest.Mock).mockResolvedValue({ data: mixedData })

    const { getByText } = render(<MerchantMapScreen />)

    await waitFor(() => {
      // Should display 2 merchants (only valid ones)
      expect(getByText('2 commerçants')).toBeTruthy()
    })
  })

  test('should display merchant count badge', async () => {
    const { getByTestId, getByText } = render(<MerchantMapScreen />)

    await waitFor(() => {
      expect(getByTestId('merchant-map-count-badge')).toBeTruthy()
      expect(getByText('2 commerçants')).toBeTruthy()
    })
  })

  test('should display singular form for single merchant', async () => {
    ;(apiService.getMerchants as jest.Mock).mockResolvedValue({
      data: [mockMerchants[0]],
    })

    const { getByText } = render(<MerchantMapScreen />)

    await waitFor(() => {
      expect(getByText('1 commerçant')).toBeTruthy()
    })
  })

  // ============ LOCATION PERMISSION TESTS ============

  test('should handle location permission denied gracefully', async () => {
    ;(Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'denied',
    })

    const { getByTestId } = render(<MerchantMapScreen />)

    await waitFor(() => {
      // Should still load map with default location
      expect(getByTestId('merchant-map-screen')).toBeTruthy()
    })

    expect(Location.getCurrentPositionAsync).not.toHaveBeenCalled()
  })

  test('should get current position when permission granted', async () => {
    render(<MerchantMapScreen />)

    await waitFor(() => {
      expect(Location.getCurrentPositionAsync).toHaveBeenCalledWith({
        accuracy: Location.Accuracy.Balanced,
      })
    })
  })

  test('should handle location error gracefully', async () => {
    ;(Location.getCurrentPositionAsync as jest.Mock).mockRejectedValue(
      new Error('Location error')
    )

    const { getByTestId } = render(<MerchantMapScreen />)

    await waitFor(() => {
      // Should still render map despite location error
      expect(getByTestId('merchant-map-screen')).toBeTruthy()
    })
  })

  // ============ CALLOUT ACTIONS TESTS ============

  test('should open phone dialer when call button pressed', async () => {
    const { getByTestId } = render(<MerchantMapScreen />)

    await waitFor(() => {
      expect(getByTestId('merchant-map-call-button-1')).toBeTruthy()
    })

    fireEvent.press(getByTestId('merchant-map-call-button-1'))

    await waitFor(() => {
      expect(Linking.canOpenURL).toHaveBeenCalled()
      expect(Linking.openURL).toHaveBeenCalledWith(
        expect.stringContaining('+228 90 00 00 00')
      )
    })
  })

  test('should show alert when phone dialer not available', async () => {
    ;(Linking.canOpenURL as jest.Mock).mockResolvedValue(false)

    const { getByTestId } = render(<MerchantMapScreen />)

    await waitFor(() => {
      expect(getByTestId('merchant-map-call-button-1')).toBeTruthy()
    })

    fireEvent.press(getByTestId('merchant-map-call-button-1'))

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Erreur',
        expect.stringContaining('composeur téléphonique')
      )
    })
  })

  test('should open maps app when directions button pressed', async () => {
    const { getByTestId } = render(<MerchantMapScreen />)

    await waitFor(() => {
      expect(getByTestId('merchant-map-directions-button-1')).toBeTruthy()
    })

    fireEvent.press(getByTestId('merchant-map-directions-button-1'))

    await waitFor(() => {
      expect(Linking.openURL).toHaveBeenCalled()
    })
  })

  test('should show alert when maps app fails to open', async () => {
    ;(Linking.openURL as jest.Mock).mockRejectedValue(new Error('Cannot open maps'))

    const { getByTestId } = render(<MerchantMapScreen />)

    await waitFor(() => {
      expect(getByTestId('merchant-map-directions-button-1')).toBeTruthy()
    })

    fireEvent.press(getByTestId('merchant-map-directions-button-1'))

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Erreur',
        expect.stringContaining('navigation')
      )
    })
  })

  // ============ VERIFIED BADGE TESTS ============

  test('should display verified badge for verified merchants', async () => {
    const { getByTestId } = render(<MerchantMapScreen />)

    await waitFor(() => {
      expect(getByTestId('merchant-map-verified-badge-1')).toBeTruthy()
    })
  })

  test('should not display verified badge for unverified merchants', async () => {
    const { queryByTestId } = render(<MerchantMapScreen />)

    await waitFor(() => {
      expect(queryByTestId('merchant-map-verified-badge-2')).toBeNull()
    })
  })

  // ============ PULL TO REFRESH TESTS ============

  // Note: Pull-to-refresh removed because MapView doesn't support refreshControl prop
  // Users can refresh by navigating away and back, or by using location button
  test.skip('should refresh data on pull to refresh', async () => {
    const { getByTestId } = render(<MerchantMapScreen />)

    await waitFor(() => {
      expect(getByTestId('merchant-map-view')).toBeTruthy()
    })

    // Simulate pull to refresh
    const mapView = getByTestId('merchant-map-view')
    const refreshControl = mapView.props.refreshControl

    await act(async () => {
      refreshControl.props.onRefresh()
    })

    await waitFor(() => {
      expect(apiService.getMerchants).toHaveBeenCalledTimes(2)
    })
  })

  // ============ MARKER TESTS ============

  test('should render markers for each merchant', async () => {
    const { getByTestId } = render(<MerchantMapScreen />)

    await waitFor(() => {
      expect(getByTestId('merchant-map-marker-1')).toBeTruthy()
      expect(getByTestId('merchant-map-marker-2')).toBeTruthy()
    })
  })

  test('should render callout for each merchant', async () => {
    const { getByTestId } = render(<MerchantMapScreen />)

    await waitFor(() => {
      expect(getByTestId('merchant-map-marker-callout-1')).toBeTruthy()
      expect(getByTestId('merchant-map-marker-callout-2')).toBeTruthy()
    })
  })

  // ============ EDGE CASES ============

  test('should handle undefined merchant address', async () => {
    const merchantNoAddress = {
      ...mockMerchants[0],
      address: undefined,
    }

    ;(apiService.getMerchants as jest.Mock).mockResolvedValue({
      data: [merchantNoAddress],
    })

    const { getByTestId } = render(<MerchantMapScreen />)

    await waitFor(() => {
      expect(getByTestId('merchant-map-screen')).toBeTruthy()
    })
  })

  test('should handle API returning null data', async () => {
    ;(apiService.getMerchants as jest.Mock).mockResolvedValue({ data: null })

    const { queryByTestId } = render(<MerchantMapScreen />)

    await waitFor(() => {
      // Should show error state when data is null
      expect(
        queryByTestId('merchant-map-empty') || queryByTestId('merchant-map-error')
      ).toBeTruthy()
    })
  })

  test('should handle very large number of merchants', async () => {
    const manyMerchants = Array.from({ length: 100 }, (_, i) => ({
      id: i,
      business_name: `Merchant ${i}`,
      business_type: 'Commerce',
      city: 'Lomé',
      address: `Address ${i}`,
      phone: `+228 90 00 00 ${i}`,
      is_verified: i % 2 === 0,
      latitude: 6.1256 + i * 0.001,
      longitude: 1.2225 + i * 0.001,
    }))

    ;(apiService.getMerchants as jest.Mock).mockResolvedValue({ data: manyMerchants })

    const { getByText } = render(<MerchantMapScreen />)

    await waitFor(() => {
      expect(getByText('100 commerçants')).toBeTruthy()
    })
  })
})
