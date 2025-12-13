import React from 'react'
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native'
import { Linking } from 'react-native'
import MerchantMapScreen from './MerchantMapScreen'
import * as Location from 'expo-location'
import apiService from '../../services/api'
import { TEST_IDS } from '../../utils/testIds'

jest.mock('../../components/OpenStreetMap', () => {
  const React = require('react')
  const { View, TouchableOpacity, Text } = require('react-native')
  const { TEST_IDS } = require('../../utils/testIds')
  const OpenStreetMap = ({ markers, onMarkerPress }: any) => (
    <View testID="openstreetmap">
      {(markers || []).map((m: any) => (
        <TouchableOpacity
          key={m.id}
          testID={`${TEST_IDS.merchantMapMarker}-${m.id}`}
          onPress={() => onMarkerPress?.(m.id)}
        >
          <Text>{m.title}</Text>
        </TouchableOpacity>
      ))}
    </View>
  )
  return { __esModule: true, default: OpenStreetMap }
})

jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
  Accuracy: { Balanced: 3 },
}))

jest.mock('../../services/api', () => ({
  __esModule: true,
  default: {
    getMerchants: jest.fn(),
  },
}))

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
  }),
}))

jest.mock('../../theme', () => {
  const { mockUseTheme } = require('../../__mocks__/themeMock')
  return { useTheme: mockUseTheme }
})

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
  let consoleErrorSpy: jest.SpyInstance | undefined
  let consoleLogSpy: jest.SpyInstance | undefined

  beforeAll(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterAll(() => {
    consoleErrorSpy?.mockRestore()
    consoleLogSpy?.mockRestore()
  })

  beforeEach(() => {
    jest.clearAllMocks()

    ;(Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' })
    ;(Location.getCurrentPositionAsync as jest.Mock).mockResolvedValue({
      coords: { latitude: 6.1256, longitude: 1.2225 },
    })

    ;(apiService.getMerchants as jest.Mock).mockResolvedValue({ data: mockMerchants })
  })

  test('renders loading state initially', () => {
    const { getByTestId } = render(<MerchantMapScreen />)
    expect(getByTestId(TEST_IDS.merchantMapLoading)).toBeTruthy()
  })

  test('renders map and merchant count after loading', async () => {
    render(<MerchantMapScreen />)

    await waitFor(() => {
      expect(screen.getByTestId(TEST_IDS.merchantMapScreen)).toBeTruthy()
      expect(screen.getByTestId(TEST_IDS.merchantMapCountBadge)).toBeTruthy()
      expect(screen.getByText(/2 commer/i)).toBeTruthy()
    })
  })

  test('requests location and loads merchants on mount', async () => {
    render(<MerchantMapScreen />)

    await waitFor(() => {
      expect(Location.requestForegroundPermissionsAsync).toHaveBeenCalled()
      expect(apiService.getMerchants).toHaveBeenCalled()
    })
  })

  test('opens callout when marker pressed', async () => {
    render(<MerchantMapScreen />)

    await waitFor(() => {
      expect(screen.getByTestId(`${TEST_IDS.merchantMapMarker}-1`)).toBeTruthy()
    })

    fireEvent.press(screen.getByTestId(`${TEST_IDS.merchantMapMarker}-1`))

    await waitFor(() => {
      expect(screen.getByText(/Appeler/i)).toBeTruthy()
      expect(screen.getByText(/Voir la boutique/i)).toBeTruthy()
    })
  })

  test('opens phone dialer when call pressed', async () => {
    render(<MerchantMapScreen />)

    await waitFor(() => {
      expect(screen.getByTestId(`${TEST_IDS.merchantMapMarker}-1`)).toBeTruthy()
    })
    fireEvent.press(screen.getByTestId(`${TEST_IDS.merchantMapMarker}-1`))

    await waitFor(() => {
      expect(screen.getByText(/Appeler/i)).toBeTruthy()
    })
    fireEvent.press(screen.getByText(/Appeler/i))

    await waitFor(() => {
      expect(Linking.openURL).toHaveBeenCalled()
    })
  })

  test('shows modal when phone dialer not available', async () => {
    ;(Linking.canOpenURL as jest.Mock).mockResolvedValueOnce(false)

    render(<MerchantMapScreen />)
    await waitFor(() => {
      expect(screen.getByTestId(`${TEST_IDS.merchantMapMarker}-1`)).toBeTruthy()
    })
    fireEvent.press(screen.getByTestId(`${TEST_IDS.merchantMapMarker}-1`))

    fireEvent.press(screen.getByText(/Appeler/i))

    await waitFor(() => {
      expect(screen.getByText('Erreur')).toBeTruthy()
      expect(screen.getByText(/composeur/i)).toBeTruthy()
    })
  })

  test('opens maps when directions pressed', async () => {
    render(<MerchantMapScreen />)
    await waitFor(() => {
      expect(screen.getByTestId(`${TEST_IDS.merchantMapMarker}-1`)).toBeTruthy()
    })
    fireEvent.press(screen.getByTestId(`${TEST_IDS.merchantMapMarker}-1`))

    fireEvent.press(screen.getByText(/Itin/i))

    await waitFor(() => {
      expect(Linking.openURL).toHaveBeenCalled()
    })
  })

  test('shows modal when maps fails to open', async () => {
    ;(Linking.openURL as jest.Mock).mockRejectedValueOnce(new Error('Cannot open maps'))

    render(<MerchantMapScreen />)
    await waitFor(() => {
      expect(screen.getByTestId(`${TEST_IDS.merchantMapMarker}-1`)).toBeTruthy()
    })
    fireEvent.press(screen.getByTestId(`${TEST_IDS.merchantMapMarker}-1`))

    fireEvent.press(screen.getByText(/Itin/i))

    await waitFor(() => {
      expect(screen.getByText('Erreur')).toBeTruthy()
      expect(screen.getByText(/navigation/i)).toBeTruthy()
    })
  })
})
