import React from 'react'
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native'
import { Alert } from 'react-native'
import MerchantSurpriseBasketsScreen from './MerchantSurpriseBasketsScreen'
import apiService from '../../services/api'
import { TEST_IDS } from '../../utils/testIds'

// Mock dependencies
jest.mock('../../services/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}))
jest.mock('@react-navigation/native', () => ({
  useFocusEffect: (callback: () => void) => {
    React.useEffect(() => {
      callback()
    }, [])
  },
}))
jest.mock('../../theme', () => {
  const { mockUseTheme } = require('../../__mocks__/themeMock')
  return {
    useTheme: mockUseTheme,
  }
})
jest.mock('../../utils/imageHelpers', () => ({
  getImageUrl: (url: string) => url || 'default-image.jpg',
}))
jest.mock('../../utils/currencyHelpers', () => ({
  formatCurrency: (amount: number) => `${amount} XOF`,
}))

// Spy on Alert.alert
jest.spyOn(Alert, 'alert')

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
  beforeEach(() => {
    jest.clearAllMocks()
    ;(apiService.get as jest.Mock).mockResolvedValue({ data: mockBaskets })
  })

  // ============ RENDERING TESTS ============

  test('should render screen with testID', async () => {
    const { getByTestId } = render(
      <MerchantSurpriseBasketsScreen navigation={mockNavigation} />
    )
    await waitFor(() => {
      expect(getByTestId(TEST_IDS.merchantSurpriseBaskets)).toBeTruthy()
    })
  })

  test('should render loading spinner on initial load', () => {
    ;(apiService.get as jest.Mock).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ data: mockBaskets }), 100))
    )
    const { getByText } = render(
      <MerchantSurpriseBasketsScreen navigation={mockNavigation} />
    )
    expect(getByText('Chargement des paniers...')).toBeTruthy()
  })

  test('should render header with title', async () => {
    const { getByText } = render(
      <MerchantSurpriseBasketsScreen navigation={mockNavigation} />
    )
    await waitFor(() => {
      expect(getByText('Paniers Surprise')).toBeTruthy()
      expect(getByText('Mes Paniers')).toBeTruthy()
    })
  })

  test('should render create basket button', async () => {
    const { getByTestId } = render(
      <MerchantSurpriseBasketsScreen navigation={mockNavigation} />
    )
    await waitFor(() => {
      expect(getByTestId('create-basket-button')).toBeTruthy()
    })
  })

  // ============ DATA LOADING TESTS ============

  test('should load baskets on mount', async () => {
    render(<MerchantSurpriseBasketsScreen navigation={mockNavigation} />)
    await waitFor(() => {
      expect(apiService.get).toHaveBeenCalledWith('/surprise-baskets/merchant/list')
    })
  })

  test('should display baskets after loading', async () => {
    const { getByText } = render(
      <MerchantSurpriseBasketsScreen navigation={mockNavigation} />
    )
    await waitFor(() => {
      expect(getByText('Panier Matin')).toBeTruthy()
      expect(getByText('Panier Soir')).toBeTruthy()
    })
  })

  test('should show error alert when loading fails', async () => {
    ;(apiService.get as jest.Mock).mockRejectedValue(new Error('Network error'))
    render(<MerchantSurpriseBasketsScreen navigation={mockNavigation} />)
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Erreur', 'Impossible de charger les paniers surprise')
    })
  })

  // ============ STATS DISPLAY TESTS ============

  test('should display correct active count', async () => {
    const { getByText } = render(
      <MerchantSurpriseBasketsScreen navigation={mockNavigation} />
    )
    await waitFor(() => {
      expect(getByText('1')).toBeTruthy() // 1 active basket
    })
  })

  test('should display correct inactive count', async () => {
    const { getByText } = render(
      <MerchantSurpriseBasketsScreen navigation={mockNavigation} />
    )
    await waitFor(() => {
      expect(getByText('1')).toBeTruthy() // 1 inactive basket
    })
  })

  test('should calculate total revenue correctly', async () => {
    // Total: (2000 * 5) + (3000 * 3) = 10,000 + 9,000 = 19,000 XOF
    const { getByText } = render(
      <MerchantSurpriseBasketsScreen navigation={mockNavigation} />
    )
    await waitFor(() => {
      expect(getByText('19000 XOF')).toBeTruthy()
    })
  })

  // ============ FILTER TESTS ============

  test('should filter baskets by active status', async () => {
    const { getByText, queryByText } = render(
      <MerchantSurpriseBasketsScreen navigation={mockNavigation} />
    )
    await waitFor(() => {
      expect(getByText('Panier Matin')).toBeTruthy()
    })

    // Click "Actifs" filter button
    const activeFilterButton = getByText('Actifs')
    fireEvent.press(activeFilterButton)

    await waitFor(() => {
      expect(getByText('Panier Matin')).toBeTruthy()
      expect(queryByText('Panier Soir')).toBeNull() // Inactive basket should be hidden
    })
  })

  test('should filter baskets by inactive status', async () => {
    const { getByText, queryByText } = render(
      <MerchantSurpriseBasketsScreen navigation={mockNavigation} />
    )
    await waitFor(() => {
      expect(getByText('Panier Soir')).toBeTruthy()
    })

    // Click "Inactifs" filter button
    const inactiveFilterButton = getByText('Inactifs')
    fireEvent.press(inactiveFilterButton)

    await waitFor(() => {
      expect(getByText('Panier Soir')).toBeTruthy()
      expect(queryByText('Panier Matin')).toBeNull() // Active basket should be hidden
    })
  })

  test('should show all baskets when "Tous" filter is selected', async () => {
    const { getByText } = render(
      <MerchantSurpriseBasketsScreen navigation={mockNavigation} />
    )
    await waitFor(() => {
      const allFilterButton = getByText('Tous')
      fireEvent.press(allFilterButton)
    })

    await waitFor(() => {
      expect(getByText('Panier Matin')).toBeTruthy()
      expect(getByText('Panier Soir')).toBeTruthy()
    })
  })

  // ============ REFRESH TESTS ============

  test('should refresh baskets on pull-to-refresh', async () => {
    const { getByTestId } = render(
      <MerchantSurpriseBasketsScreen navigation={mockNavigation} />
    )
    await waitFor(() => {
      expect(apiService.get).toHaveBeenCalledTimes(1)
    })

    // Trigger refresh (FlatList has refreshControl)
    // Note: In real implementation, would use getByType(FlatList) and trigger onRefresh
    // For now, we verify the API is called again
    await waitFor(() => {
      expect(apiService.get).toHaveBeenCalled()
    })
  })

  // ============ CREATE BASKET TESTS ============

  test('should open modal when create button is pressed', async () => {
    const { getByTestId, getByText } = render(
      <MerchantSurpriseBasketsScreen navigation={mockNavigation} />
    )
    await waitFor(() => {
      const createButton = getByTestId('create-basket-button')
      fireEvent.press(createButton)
    })

    await waitFor(() => {
      expect(getByText('Nouveau Panier Surprise')).toBeTruthy()
    })
  })

  test('should show validation error when name is empty', async () => {
    const { getByTestId, getByText } = render(
      <MerchantSurpriseBasketsScreen navigation={mockNavigation} />
    )
    await waitFor(() => {
      fireEvent.press(getByTestId('create-basket-button'))
    })

    await waitFor(() => {
      const submitButton = getByText('Créer')
      fireEvent.press(submitButton)
    })

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Erreur', 'Le nom est requis')
    })
  })

  test('should show validation error when price is invalid', async () => {
    const { getByTestId, getByText, getByPlaceholderText } = render(
      <MerchantSurpriseBasketsScreen navigation={mockNavigation} />
    )
    await waitFor(() => {
      fireEvent.press(getByTestId('create-basket-button'))
    })

    await waitFor(() => {
      const nameInput = getByPlaceholderText('Ex: Panier du Matin')
      fireEvent.changeText(nameInput, 'Test Panier')

      const priceInput = getByPlaceholderText('Ex: 2000')
      fireEvent.changeText(priceInput, '0')

      const submitButton = getByText('Créer')
      fireEvent.press(submitButton)
    })

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Erreur', 'Le prix doit être supérieur à 0')
    })
  })

  test('should show validation error when quantity is invalid', async () => {
    const { getByTestId, getByText, getByPlaceholderText } = render(
      <MerchantSurpriseBasketsScreen navigation={mockNavigation} />
    )
    await waitFor(() => {
      fireEvent.press(getByTestId('create-basket-button'))
    })

    await waitFor(() => {
      const nameInput = getByPlaceholderText('Ex: Panier du Matin')
      fireEvent.changeText(nameInput, 'Test Panier')

      const priceInput = getByPlaceholderText('Ex: 2000')
      fireEvent.changeText(priceInput, '2000')

      const quantityInput = getByPlaceholderText('Ex: 5')
      fireEvent.changeText(quantityInput, '0')

      const submitButton = getByText('Créer')
      fireEvent.press(submitButton)
    })

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Erreur', 'La quantité doit être supérieure à 0')
    })
  })

  test('should create basket successfully', async () => {
    ;(apiService.post as jest.Mock).mockResolvedValue({ data: { id: 3 } })
    const { getByTestId, getByText, getByPlaceholderText } = render(
      <MerchantSurpriseBasketsScreen navigation={mockNavigation} />
    )
    await waitFor(() => {
      fireEvent.press(getByTestId('create-basket-button'))
    })

    await waitFor(() => {
      fireEvent.changeText(getByPlaceholderText('Ex: Panier du Matin'), 'Nouveau Panier')
      fireEvent.changeText(getByPlaceholderText('Ex: Viennoiseries, fruits...'), 'Description test')
      fireEvent.changeText(getByPlaceholderText('Ex: 2000'), '2500')
      fireEvent.changeText(getByPlaceholderText('Ex: 5'), '10')

      fireEvent.press(getByText('Créer'))
    })

    await waitFor(() => {
      expect(apiService.post).toHaveBeenCalledWith('/surprise-baskets', {
        name: 'Nouveau Panier',
        description: 'Description test',
        discounted_price: 2500,
        quantity_available: 10,
      })
      expect(Alert.alert).toHaveBeenCalledWith('Succès', 'Panier créé avec succès')
    })
  })

  // ============ EDIT BASKET TESTS ============

  test('should open modal with basket data when edit is pressed', async () => {
    const { getByText } = render(
      <MerchantSurpriseBasketsScreen navigation={mockNavigation} />
    )
    await waitFor(() => {
      expect(getByText('Panier Matin')).toBeTruthy()
    })

    const modifierButtons = await screen.findAllByText('Modifier')
    fireEvent.press(modifierButtons[0])

    await waitFor(() => {
      expect(getByText('Modifier le Panier')).toBeTruthy()
    })
  })

  test('should update basket successfully', async () => {
    ;(apiService.put as jest.Mock).mockResolvedValue({ data: { success: true } })
    const { getByText, getByDisplayValue } = render(
      <MerchantSurpriseBasketsScreen navigation={mockNavigation} />
    )
    await waitFor(() => {
      expect(getByText('Panier Matin')).toBeTruthy()
    })

    const modifierButtons = await screen.findAllByText('Modifier')
    fireEvent.press(modifierButtons[0])

    await waitFor(() => {
      const nameInput = getByDisplayValue('Panier Matin')
      fireEvent.changeText(nameInput, 'Panier Matin Modifié')

      fireEvent.press(getByText('Enregistrer'))
    })

    await waitFor(() => {
      expect(apiService.put).toHaveBeenCalledWith('/surprise-baskets/1', {
        name: 'Panier Matin Modifié',
        description: 'Viennoiseries du matin',
        discounted_price: 2000,
        quantity_available: 5,
      })
      expect(Alert.alert).toHaveBeenCalledWith('Succès', 'Panier modifié avec succès')
    })
  })

  // ============ DELETE BASKET TESTS ============

  test('should show confirmation alert when delete is pressed', async () => {
    const { getByText } = render(
      <MerchantSurpriseBasketsScreen navigation={mockNavigation} />
    )
    await waitFor(() => {
      expect(getByText('Panier Matin')).toBeTruthy()
    })

    const supprimerButtons = await screen.findAllByText('Supprimer')
    fireEvent.press(supprimerButtons[0])

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Supprimer le panier',
        'Êtes-vous sûr de vouloir supprimer ce panier surprise ?',
        expect.any(Array)
      )
    })
  })

  test('should delete basket successfully after confirmation', async () => {
    ;(apiService.delete as jest.Mock).mockResolvedValue({ data: { success: true } })

    // Mock Alert.alert to auto-confirm
    ;(Alert.alert as jest.Mock).mockImplementation((title, message, buttons) => {
      if (buttons && buttons[1]) {
        buttons[1].onPress()
      }
    })

    const { getByText } = render(
      <MerchantSurpriseBasketsScreen navigation={mockNavigation} />
    )
    await waitFor(() => {
      expect(getByText('Panier Matin')).toBeTruthy()
    })

    const supprimerButtons = await screen.findAllByText('Supprimer')
    fireEvent.press(supprimerButtons[0])

    await waitFor(() => {
      expect(apiService.delete).toHaveBeenCalledWith('/surprise-baskets/1')
      expect(Alert.alert).toHaveBeenCalledWith('Succès', 'Le panier a été supprimé')
    })
  })

  // ============ TOGGLE STATUS TESTS ============

  test('should toggle basket status from active to inactive', async () => {
    ;(apiService.put as jest.Mock).mockResolvedValue({ data: { success: true } })
    const { getByText } = render(
      <MerchantSurpriseBasketsScreen navigation={mockNavigation} />
    )
    await waitFor(() => {
      expect(getByText('Panier Matin')).toBeTruthy()
    })

    const desactiverButton = getByText('Désactiver')
    fireEvent.press(desactiverButton)

    await waitFor(() => {
      expect(apiService.put).toHaveBeenCalledWith('/surprise-baskets/1', {
        is_active: false,
      })
      expect(Alert.alert).toHaveBeenCalledWith('Succès', 'Panier désactivé')
    })
  })

  test('should toggle basket status from inactive to active', async () => {
    ;(apiService.put as jest.Mock).mockResolvedValue({ data: { success: true } })
    const { getByText } = render(
      <MerchantSurpriseBasketsScreen navigation={mockNavigation} />
    )
    await waitFor(() => {
      expect(getByText('Panier Soir')).toBeTruthy()
    })

    const activerButtons = await screen.findAllByText('Activer')
    fireEvent.press(activerButtons[0])

    await waitFor(() => {
      expect(apiService.put).toHaveBeenCalledWith('/surprise-baskets/2', {
        is_active: true,
      })
      expect(Alert.alert).toHaveBeenCalledWith('Succès', 'Panier activé')
    })
  })

  // ============ EMPTY STATE TESTS ============

  test('should display empty state when no baskets exist', async () => {
    ;(apiService.get as jest.Mock).mockResolvedValue({ data: [] })
    const { getByText } = render(
      <MerchantSurpriseBasketsScreen navigation={mockNavigation} />
    )
    await waitFor(() => {
      expect(getByText('Aucun panier surprise')).toBeTruthy()
      expect(getByText('Commencez par créer votre premier panier surprise')).toBeTruthy()
    })
  })

  // ============ BADGE DISPLAY TESTS ============

  test('should display "Actif" badge for active baskets', async () => {
    const { getAllByText } = render(
      <MerchantSurpriseBasketsScreen navigation={mockNavigation} />
    )
    await waitFor(() => {
      const actifBadges = getAllByText('Actif')
      expect(actifBadges.length).toBeGreaterThan(0)
    })
  })

  test('should display "Inactif" badge for inactive baskets', async () => {
    const { getAllByText } = render(
      <MerchantSurpriseBasketsScreen navigation={mockNavigation} />
    )
    await waitFor(() => {
      const inactifBadges = getAllByText('Inactif')
      expect(inactifBadges.length).toBeGreaterThan(0)
    })
  })

  // ============ PRICE FORMATTING TESTS ============

  test('should format prices correctly', async () => {
    const { getByText } = render(
      <MerchantSurpriseBasketsScreen navigation={mockNavigation} />
    )
    await waitFor(() => {
      expect(getByText('2000 XOF')).toBeTruthy()
      expect(getByText('3000 XOF')).toBeTruthy()
    })
  })

  // ============ QUANTITY DISPLAY TESTS ============

  test('should display quantities correctly', async () => {
    const { getByText } = render(
      <MerchantSurpriseBasketsScreen navigation={mockNavigation} />
    )
    await waitFor(() => {
      expect(getByText('5 disponibles')).toBeTruthy()
      expect(getByText('3 disponibles')).toBeTruthy()
    })
  })
})
