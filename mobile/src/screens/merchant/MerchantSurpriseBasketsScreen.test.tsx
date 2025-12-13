import React from 'react'
import { render, fireEvent, waitFor, screen } from '@test-utils'
import MerchantSurpriseBasketsScreen from './MerchantSurpriseBasketsScreen'
import apiService from '../../services/api'
import { TEST_IDS } from '../../utils/testIds'

jest.mock('../../services/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}))

jest.mock('@react-navigation/native', () => {
  const React = require('react')
  return {
    useFocusEffect: (callback: () => void) => {
      React.useEffect(() => {
        callback()
      }, [])
    },
    useNavigation: () => ({
      navigate: jest.fn(),
      goBack: jest.fn(),
    }),
  }
})

jest.mock('../../theme', () => {
  const actualTheme = jest.requireActual('../../theme')
  const { mockUseTheme } = require('../../__mocks__/themeMock')
  return {
    ...actualTheme,
    useTheme: mockUseTheme,
  }
})

jest.mock('../../utils/imageHelpers', () => ({
  getImageUrl: (url: string) => url || 'default-image.jpg',
}))

jest.mock('../../utils/currencyHelpers', () => ({
  formatCurrency: (amount: number) => `${amount} XOF`,
}))

const pressLastTextButton = (label: string) => {
  const matches = screen.getAllByText(label)
  const last = matches[matches.length - 1] as any
  fireEvent.press(last.parent)
}

const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
}

const mockBaskets = [
  {
    id: 1,
    name: 'Panier Matin',
    description: 'Viennoiseries du matin',
    discounted_price: 2000,
    quantity_available: 5,
    is_active: true,
    merchant_id: 1,
    created_at: '2025-01-15T08:00:00Z',
    updated_at: '2025-01-15T08:00:00Z',
  },
  {
    id: 2,
    name: 'Panier Soir',
    description: 'Produits du soir',
    discounted_price: 3000,
    quantity_available: 3,
    is_active: false,
    merchant_id: 1,
    created_at: '2025-01-15T18:00:00Z',
    updated_at: '2025-01-15T18:00:00Z',
  },
]

describe('MerchantSurpriseBasketsScreen', () => {
  let consoleLogSpy: jest.SpyInstance | undefined
  let consoleErrorSpy: jest.SpyInstance | undefined

  beforeEach(() => {
    jest.clearAllMocks()
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {})
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    ;(apiService.get as jest.Mock).mockResolvedValue({ data: { data: mockBaskets } })
  })

  afterEach(() => {
    consoleLogSpy?.mockRestore()
    consoleErrorSpy?.mockRestore()
  })

  test('loads and displays baskets', async () => {
    render(<MerchantSurpriseBasketsScreen navigation={mockNavigation} />)
    await screen.findByText('Panier Matin')
    expect(apiService.get).toHaveBeenCalledWith('/surprise-baskets/merchant/list')
    expect(screen.getByText('Panier Soir')).toBeTruthy()
  })

  test('opens create modal and validates required fields', async () => {
    render(<MerchantSurpriseBasketsScreen navigation={mockNavigation} />)

    fireEvent.press(await screen.findByTestId(TEST_IDS.createBasketButton))
    expect(screen.getByTestId(TEST_IDS.basketFormModal)).toBeTruthy()

    fireEvent.press(await screen.findByTestId(TEST_IDS.submitBasketButton))

    await waitFor(() => {
      expect(screen.getByText('Validation')).toBeTruthy()
      expect(screen.getByText(/Le nom est requis/i)).toBeTruthy()
    })
  })

  test('creates basket successfully', async () => {
    ;(apiService.post as jest.Mock).mockResolvedValue({ data: { id: 3 } })

    render(<MerchantSurpriseBasketsScreen navigation={mockNavigation} />)

    fireEvent.press(await screen.findByTestId(TEST_IDS.createBasketButton))
    fireEvent.changeText(screen.getByTestId(TEST_IDS.basketNameInput), 'Nouveau Panier')
    fireEvent.changeText(screen.getByTestId(TEST_IDS.basketDescriptionInput), 'Description test')
    fireEvent.changeText(screen.getByTestId(TEST_IDS.basketPriceInput), '2500')
    fireEvent.changeText(screen.getByTestId(TEST_IDS.basketQuantityInput), '10')

    fireEvent.press(await screen.findByTestId(TEST_IDS.submitBasketButton))

    await waitFor(() => {
      expect(apiService.post).toHaveBeenCalledWith(
        '/surprise-baskets',
        expect.objectContaining({
          name: 'Nouveau Panier',
          description: 'Description test',
          discounted_price: 2500,
          quantity_available: 10,
          min_items: null,
        })
      )
      expect(screen.getByText(/Création/i)).toBeTruthy()
      expect(screen.getByText(/panier surprise/i)).toBeTruthy()
    })
  })

  test('updates basket successfully', async () => {
    ;(apiService.put as jest.Mock).mockResolvedValue({ data: { success: true } })

    render(<MerchantSurpriseBasketsScreen navigation={mockNavigation} />)

    await screen.findByText('Panier Matin')
    fireEvent.press((await screen.findAllByText('Modifier'))[0])

    const nameInput = await screen.findByTestId(TEST_IDS.basketNameInput)
    fireEvent.changeText(nameInput, 'Panier Matin Modifie')

    fireEvent.press(await screen.findByTestId(TEST_IDS.submitBasketButton))

    await waitFor(() => {
      expect(apiService.put).toHaveBeenCalledWith(
        '/surprise-baskets/1',
        expect.objectContaining({ name: 'Panier Matin Modifie' })
      )
      expect(screen.getByText(/Modification/i)).toBeTruthy()
      expect(screen.getByText(/panier.*modifi/i)).toBeTruthy()
    })
  })

  test('confirms and deletes basket', async () => {
    ;(apiService.delete as jest.Mock).mockResolvedValue({ data: { success: true } })

    render(<MerchantSurpriseBasketsScreen navigation={mockNavigation} />)
    await screen.findByText('Panier Matin')

    fireEvent.press((await screen.findAllByText('Supprimer'))[0])

    await waitFor(() => {
      expect(screen.getByText('Supprimer le panier')).toBeTruthy()
    })
    pressLastTextButton('Supprimer')

    await waitFor(() => {
      expect(apiService.delete).toHaveBeenCalledWith('/surprise-baskets/1')
      expect(screen.getByText(/Suppression/i)).toBeTruthy()
      expect(screen.getByText(/panier.*supprim/i)).toBeTruthy()
    })
  })
})

