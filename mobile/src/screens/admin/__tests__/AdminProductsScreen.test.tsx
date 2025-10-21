// @ts-nocheck
import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { Alert } from 'react-native'
import AdminProductsScreen from '../AdminProductsScreen'
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
Alert.prompt = jest.fn()

// Mock apiService
const mockProducts = [
  {
    id: 1,
    name: 'Pain complet artisanal',
    description: 'Pain frais du jour',
    original_price: '500',
    discounted_price: '300',
    discount_percentage: 40,
    quantity_available: 10,
    expiration_date: '2025-01-20',
    is_active: true,
    needs_approval: false,
    image_url: 'pain.jpg',
    category: { id: 1, name: 'Boulangerie' },
    merchant: {
      id: 1,
      business_name: 'Boulangerie Martin',
      city: 'Lomé',
      phone: '+228 90 12 34 56',
    },
  },
  {
    id: 2,
    name: 'Yaourts nature',
    description: 'Yaourts bio à consommer rapidement',
    original_price: '800',
    discounted_price: '500',
    discount_percentage: 37,
    quantity_available: 20,
    expiration_date: '2025-01-18',
    is_active: false,
    needs_approval: false,
    image_url: 'yaourt.jpg',
    category: { id: 2, name: 'Produits laitiers' },
    merchant: {
      id: 2,
      business_name: 'Épicerie Bio',
      city: 'Kara',
      phone: '+228 90 11 22 33',
    },
  },
  {
    id: 3,
    name: 'Bananes mûres',
    description: 'Bananes à vendre rapidement',
    original_price: '300',
    discounted_price: '150',
    discount_percentage: 50,
    quantity_available: 30,
    expiration_date: '2025-01-17',
    is_active: true,
    needs_approval: true,
    image_url: 'bananes.jpg',
    category: { id: 3, name: 'Fruits & Légumes' },
    merchant: {
      id: 3,
      business_name: 'Marché Central',
      city: 'Lomé',
      phone: '+228 90 33 44 55',
    },
  },
]

const mockCategories = [
  { id: 1, name: 'Boulangerie', icon: '🍞' },
  { id: 2, name: 'Produits laitiers', icon: '🥛' },
  { id: 3, name: 'Fruits & Légumes', icon: '🍎' },
]

jest.mock('../../../services/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
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

describe('AdminProductsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    apiService.get.mockImplementation((url: string) => {
      if (url.includes('/products')) {
        return Promise.resolve({ data: { data: mockProducts } })
      }
      if (url.includes('/categories')) {
        return Promise.resolve({ data: mockCategories })
      }
      return Promise.resolve({ data: [] })
    })
  })

  describe('Data Loading', () => {
    it('loads products from /products endpoint on mount', async () => {
      const store = createTestStore()
      renderWithProviders(<AdminProductsScreen />, store)

      await waitFor(() => {
        expect(apiService.get).toHaveBeenCalledWith('/products?per_page=100')
      })
    })

    it('loads categories from /categories endpoint on mount', async () => {
      const store = createTestStore()
      renderWithProviders(<AdminProductsScreen />, store)

      await waitFor(() => {
        expect(apiService.get).toHaveBeenCalledWith('/categories')
      })
    })

    it('displays loading state initially', () => {
      const store = createTestStore()
      const { getByText } = renderWithProviders(<AdminProductsScreen />, store)

      expect(getByText('Chargement des produits...')).toBeTruthy()
    })

    it('displays products after loading', async () => {
      const store = createTestStore()
      const { getByText } = renderWithProviders(<AdminProductsScreen />, store)

      await waitFor(() => {
        expect(getByText('Pain complet artisanal')).toBeTruthy()
        expect(getByText('Yaourts nature')).toBeTruthy()
        expect(getByText('Bananes mûres')).toBeTruthy()
      })
    })

    it('handles API error gracefully', async () => {
      apiService.get.mockRejectedValueOnce(new Error('Network error'))

      const store = createTestStore()
      renderWithProviders(<AdminProductsScreen />, store)

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Erreur', 'Impossible de charger les produits')
      })
    })
  })

  describe('Status Filtering', () => {
    it('filters products by active status', async () => {
      const store = createTestStore()
      const { getByText, queryByText } = renderWithProviders(<AdminProductsScreen />, store)

      await waitFor(() => {
        expect(getByText('Pain complet artisanal')).toBeTruthy()
      })

      // Click on "Actifs" filter
      const activeFilter = getByText(/Actifs/)
      fireEvent.press(activeFilter)

      await waitFor(() => {
        expect(getByText('Pain complet artisanal')).toBeTruthy()
        expect(getByText('Bananes mûres')).toBeTruthy()
        expect(queryByText('Yaourts nature')).toBeNull()
      })
    })

    it('filters products by inactive status', async () => {
      const store = createTestStore()
      const { getByText, queryByText } = renderWithProviders(<AdminProductsScreen />, store)

      await waitFor(() => {
        expect(getByText('Yaourts nature')).toBeTruthy()
      })

      // Click on "Inactifs" filter
      const inactiveFilter = getByText(/Inactifs/)
      fireEvent.press(inactiveFilter)

      await waitFor(() => {
        expect(getByText('Yaourts nature')).toBeTruthy()
        expect(queryByText('Pain complet artisanal')).toBeNull()
      })
    })

    it('filters products by pending status', async () => {
      const store = createTestStore()
      const { getByText, queryByText } = renderWithProviders(<AdminProductsScreen />, store)

      await waitFor(() => {
        expect(getByText('Bananes mûres')).toBeTruthy()
      })

      // Click on "En attente" filter
      const pendingFilter = getByText(/En attente/)
      fireEvent.press(pendingFilter)

      await waitFor(() => {
        expect(getByText('Bananes mûres')).toBeTruthy()
        expect(queryByText('Pain complet artisanal')).toBeNull()
        expect(queryByText('Yaourts nature')).toBeNull()
      })
    })

    it('displays pending count badge in header', async () => {
      const store = createTestStore()
      const { getByText } = renderWithProviders(<AdminProductsScreen />, store)

      await waitFor(() => {
        expect(getByText('1 produit en attente')).toBeTruthy()
      })
    })
  })

  describe('Category Filtering', () => {
    it('filters products by category', async () => {
      const store = createTestStore()
      const { getByText, queryByText } = renderWithProviders(<AdminProductsScreen />, store)

      await waitFor(() => {
        expect(getByText('Pain complet artisanal')).toBeTruthy()
      })

      // Click on "Boulangerie" category filter
      const categoryFilter = getByText(/Boulangerie/)
      fireEvent.press(categoryFilter)

      await waitFor(() => {
        expect(getByText('Pain complet artisanal')).toBeTruthy()
        expect(queryByText('Yaourts nature')).toBeNull()
        expect(queryByText('Bananes mûres')).toBeNull()
      })
    })

    it('combines status and category filters', async () => {
      const store = createTestStore()
      const { getByText, queryByText } = renderWithProviders(<AdminProductsScreen />, store)

      await waitFor(() => {
        expect(getByText('Pain complet artisanal')).toBeTruthy()
      })

      // Apply active filter
      const activeFilter = getByText(/Actifs/)
      fireEvent.press(activeFilter)

      // Apply Fruits & Légumes category
      const categoryFilter = getByText(/Fruits & Légumes/)
      fireEvent.press(categoryFilter)

      await waitFor(() => {
        expect(getByText('Bananes mûres')).toBeTruthy()
        expect(queryByText('Pain complet artisanal')).toBeNull()
        expect(queryByText('Yaourts nature')).toBeNull()
      })
    })
  })

  describe('Search', () => {
    it('searches products by name', async () => {
      const store = createTestStore()
      const { getByPlaceholderText, getByText, queryByText } = renderWithProviders(
        <AdminProductsScreen />,
        store
      )

      await waitFor(() => {
        expect(getByText('Pain complet artisanal')).toBeTruthy()
      })

      const searchInput = getByPlaceholderText('Rechercher un produit...')
      fireEvent.changeText(searchInput, 'Pain')

      await waitFor(() => {
        expect(getByText('Pain complet artisanal')).toBeTruthy()
        expect(queryByText('Yaourts nature')).toBeNull()
      })
    })

    it('searches products by merchant name', async () => {
      const store = createTestStore()
      const { getByPlaceholderText, getByText, queryByText } = renderWithProviders(
        <AdminProductsScreen />,
        store
      )

      await waitFor(() => {
        expect(getByText('Yaourts nature')).toBeTruthy()
      })

      const searchInput = getByPlaceholderText('Rechercher un produit...')
      fireEvent.changeText(searchInput, 'Épicerie')

      await waitFor(() => {
        expect(getByText('Yaourts nature')).toBeTruthy()
        expect(queryByText('Pain complet artisanal')).toBeNull()
      })
    })

    it('clears search when close icon is pressed', async () => {
      const store = createTestStore()
      const { getByPlaceholderText, getByText, getAllByTestId } = renderWithProviders(
        <AdminProductsScreen />,
        store
      )

      await waitFor(() => {
        expect(getByText('Pain complet artisanal')).toBeTruthy()
      })

      const searchInput = getByPlaceholderText('Rechercher un produit...')
      fireEvent.changeText(searchInput, 'Pain')

      // Find and press close icon
      await waitFor(() => {
        const closeIcons = getAllByTestId(/ionicons/i)
        const closeIcon = closeIcons.find((icon) => icon.props.name === 'close-circle')
        if (closeIcon) {
          fireEvent.press(closeIcon)
        }
      })

      // All products should be visible again
      await waitFor(() => {
        expect(getByText('Pain complet artisanal')).toBeTruthy()
        expect(getByText('Yaourts nature')).toBeTruthy()
        expect(getByText('Bananes mûres')).toBeTruthy()
      })
    })
  })

  describe('Approve Product', () => {
    it('approves product successfully', async () => {
      apiService.post.mockResolvedValueOnce({ data: { success: true } })

      Alert.alert.mockImplementation((title, message, buttons) => {
        const confirmButton = buttons?.find((b) => b.text === 'Approuver')
        if (confirmButton) {
          confirmButton.onPress()
        }
      })

      const store = createTestStore()
      const { getByText } = renderWithProviders(<AdminProductsScreen />, store)

      await waitFor(() => {
        expect(getByText('Bananes mûres')).toBeTruthy()
      })

      // Open product detail by pressing on card
      const productCard = getByText('Bananes mûres')
      fireEvent.press(productCard)

      // Wait for modal and press approve button
      await waitFor(() => {
        const approveButton = getByText('Approuver le produit')
        fireEvent.press(approveButton)
      })

      await waitFor(() => {
        expect(apiService.post).toHaveBeenCalledWith('/admin/products/3/approve')
        expect(Alert.alert).toHaveBeenCalledWith('Succès', 'Produit approuvé avec succès')
      })
    })

    it('handles approve API error', async () => {
      apiService.post.mockRejectedValueOnce({
        response: {
          data: {
            message: 'Produit déjà approuvé',
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
      const { getByText } = renderWithProviders(<AdminProductsScreen />, store)

      await waitFor(() => {
        expect(getByText('Bananes mûres')).toBeTruthy()
      })

      const productCard = getByText('Bananes mûres')
      fireEvent.press(productCard)

      await waitFor(() => {
        const approveButton = getByText('Approuver le produit')
        fireEvent.press(approveButton)
      })

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Erreur', "Impossible d'approuver le produit")
      })
    })
  })

  describe('Reject Product', () => {
    it('rejects product with valid reason (min 10 chars)', async () => {
      apiService.post.mockResolvedValueOnce({ data: { success: true } })

      Alert.prompt = jest.fn((title, message, buttons) => {
        const rejectButton = buttons?.find((b) => b.text === 'Rejeter')
        if (rejectButton) {
          rejectButton.onPress('Produit de mauvaise qualité')
        }
      })

      const store = createTestStore()
      const { getByText } = renderWithProviders(<AdminProductsScreen />, store)

      await waitFor(() => {
        expect(getByText('Bananes mûres')).toBeTruthy()
      })

      const productCard = getByText('Bananes mûres')
      fireEvent.press(productCard)

      await waitFor(() => {
        const rejectButton = getByText('Rejeter le produit')
        fireEvent.press(rejectButton)
      })

      await waitFor(() => {
        expect(apiService.post).toHaveBeenCalledWith('/admin/products/3/reject', {
          reason: 'Produit de mauvaise qualité',
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
      const { getByText } = renderWithProviders(<AdminProductsScreen />, store)

      await waitFor(() => {
        expect(getByText('Bananes mûres')).toBeTruthy()
      })

      const productCard = getByText('Bananes mûres')
      fireEvent.press(productCard)

      await waitFor(() => {
        const rejectButton = getByText('Rejeter le produit')
        fireEvent.press(rejectButton)
      })

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
            message: 'Impossible de rejeter ce produit',
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
      const { getByText } = renderWithProviders(<AdminProductsScreen />, store)

      await waitFor(() => {
        expect(getByText('Bananes mûres')).toBeTruthy()
      })

      const productCard = getByText('Bananes mûres')
      fireEvent.press(productCard)

      await waitFor(() => {
        const rejectButton = getByText('Rejeter le produit')
        fireEvent.press(rejectButton)
      })

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Erreur', 'Impossible de rejeter le produit')
      })
    })
  })

  describe('Toggle Active', () => {
    it('activates inactive product', async () => {
      apiService.put.mockResolvedValueOnce({ data: { success: true } })

      Alert.alert.mockImplementation((title, message, buttons) => {
        const confirmButton = buttons?.find((b) => b.text === 'Activer')
        if (confirmButton) {
          confirmButton.onPress()
        }
      })

      const store = createTestStore()
      const { getByText, getAllByText } = renderWithProviders(<AdminProductsScreen />, store)

      await waitFor(() => {
        expect(getByText('Yaourts nature')).toBeTruthy()
      })

      // Find "Activer" button for Yaourts nature (inactive product)
      const activateButtons = getAllByText('Activer')
      fireEvent.press(activateButtons[0])

      await waitFor(() => {
        expect(apiService.put).toHaveBeenCalledWith('/products/2', {
          is_active: true,
        })
        expect(Alert.alert).toHaveBeenCalledWith('Succès', 'Produit activé')
      })
    })

    it('deactivates active product', async () => {
      apiService.put.mockResolvedValueOnce({ data: { success: true } })

      Alert.alert.mockImplementation((title, message, buttons) => {
        const confirmButton = buttons?.find((b) => b.text === 'Désactiver')
        if (confirmButton) {
          confirmButton.onPress()
        }
      })

      const store = createTestStore()
      const { getByText, getAllByText } = renderWithProviders(<AdminProductsScreen />, store)

      await waitFor(() => {
        expect(getByText('Pain complet artisanal')).toBeTruthy()
      })

      // Find "Désactiver" button for Pain (active product)
      const deactivateButtons = getAllByText('Désactiver')
      fireEvent.press(deactivateButtons[0])

      await waitFor(() => {
        expect(apiService.put).toHaveBeenCalledWith('/products/1', {
          is_active: false,
        })
        expect(Alert.alert).toHaveBeenCalledWith('Succès', 'Produit désactivé')
      })
    })
  })

  describe('Delete Product', () => {
    it('deletes product with confirmation', async () => {
      apiService.delete.mockResolvedValueOnce({ data: { success: true } })

      Alert.alert.mockImplementation((title, message, buttons) => {
        const confirmButton = buttons?.find((b) => b.text === 'Supprimer')
        if (confirmButton) {
          confirmButton.onPress()
        }
      })

      const store = createTestStore()
      const { getByText } = renderWithProviders(<AdminProductsScreen />, store)

      await waitFor(() => {
        expect(getByText('Pain complet artisanal')).toBeTruthy()
      })

      const productCard = getByText('Pain complet artisanal')
      fireEvent.press(productCard)

      await waitFor(() => {
        const deleteButton = getByText('Supprimer définitivement')
        fireEvent.press(deleteButton)
      })

      await waitFor(() => {
        expect(apiService.delete).toHaveBeenCalledWith('/products/1')
        expect(Alert.alert).toHaveBeenCalledWith('Succès', 'Produit supprimé définitivement')
      })
    })

    it('handles delete API error', async () => {
      apiService.delete.mockRejectedValueOnce(new Error('Cannot delete'))

      Alert.alert.mockImplementation((title, message, buttons) => {
        const confirmButton = buttons?.find((b) => b.text === 'Supprimer')
        if (confirmButton) {
          confirmButton.onPress()
        }
      })

      const store = createTestStore()
      const { getByText } = renderWithProviders(<AdminProductsScreen />, store)

      await waitFor(() => {
        expect(getByText('Pain complet artisanal')).toBeTruthy()
      })

      const productCard = getByText('Pain complet artisanal')
      fireEvent.press(productCard)

      await waitFor(() => {
        const deleteButton = getByText('Supprimer définitivement')
        fireEvent.press(deleteButton)
      })

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Erreur', 'Impossible de supprimer le produit')
      })
    })
  })

  describe('Detail Modal', () => {
    it('opens detail modal on product press', async () => {
      const store = createTestStore()
      const { getByText } = renderWithProviders(<AdminProductsScreen />, store)

      await waitFor(() => {
        expect(getByText('Pain complet artisanal')).toBeTruthy()
      })

      const productCard = getByText('Pain complet artisanal')
      fireEvent.press(productCard)

      await waitFor(() => {
        expect(getByText('Détails Produit')).toBeTruthy()
        expect(getByText('Pain frais du jour')).toBeTruthy()
      })
    })

    it('closes detail modal on close button press', async () => {
      const store = createTestStore()
      const { getByText, queryByText, getAllByTestId } = renderWithProviders(
        <AdminProductsScreen />,
        store
      )

      await waitFor(() => {
        expect(getByText('Pain complet artisanal')).toBeTruthy()
      })

      const productCard = getByText('Pain complet artisanal')
      fireEvent.press(productCard)

      await waitFor(() => {
        expect(getByText('Détails Produit')).toBeTruthy()
      })

      // Find and press close button
      const closeIcons = getAllByTestId(/ionicons/i)
      const closeButton = closeIcons.find((icon) => icon.props.name === 'close' && icon.props.size === 28)
      if (closeButton) {
        fireEvent.press(closeButton.parent)
      }

      await waitFor(() => {
        expect(queryByText('Détails Produit')).toBeNull()
      })
    })
  })

  describe('Refresh', () => {
    it('refreshes product list on pull-to-refresh', async () => {
      const store = createTestStore()
      const { getByTestId } = renderWithProviders(<AdminProductsScreen />, store)

      await waitFor(() => {
        expect(apiService.get).toHaveBeenCalledTimes(2) // products + categories
      })

      // Simulate pull-to-refresh
      const flatList = getByTestId(/flatlist/i)
      if (flatList) {
        fireEvent(flatList, 'refresh')
      }

      await waitFor(() => {
        expect(apiService.get).toHaveBeenCalledTimes(4) // +2 for refresh
      })
    })

    it('refreshes on header refresh button press', async () => {
      const store = createTestStore()
      const { getByLabelText } = renderWithProviders(<AdminProductsScreen />, store)

      await waitFor(() => {
        expect(apiService.get).toHaveBeenCalledTimes(2)
      })

      const refreshButton = getByLabelText('Rafraîchir les produits')
      fireEvent.press(refreshButton)

      await waitFor(() => {
        expect(apiService.get).toHaveBeenCalledTimes(4)
      })
    })
  })

  describe('Empty State', () => {
    it('shows empty state when no products found', async () => {
      apiService.get.mockImplementation((url: string) => {
        if (url.includes('/products')) {
          return Promise.resolve({ data: { data: [] } })
        }
        if (url.includes('/categories')) {
          return Promise.resolve({ data: mockCategories })
        }
        return Promise.resolve({ data: [] })
      })

      const store = createTestStore()
      const { getByText } = renderWithProviders(<AdminProductsScreen />, store)

      await waitFor(() => {
        expect(getByText('Aucun produit trouvé')).toBeTruthy()
        expect(getByText('Aucun produit dans la base de données')).toBeTruthy()
      })
    })

    it('shows empty state with filter hint when filters applied', async () => {
      const store = createTestStore()
      const { getByText, getByPlaceholderText } = renderWithProviders(<AdminProductsScreen />, store)

      await waitFor(() => {
        expect(getByText('Pain complet artisanal')).toBeTruthy()
      })

      // Apply search with no results
      const searchInput = getByPlaceholderText('Rechercher un produit...')
      fireEvent.changeText(searchInput, 'NonExistentProduct')

      await waitFor(() => {
        expect(getByText('Aucun produit trouvé')).toBeTruthy()
        expect(getByText('Essayez de modifier vos filtres')).toBeTruthy()
      })
    })
  })
})
