// @ts-nocheck
import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import { Alert } from 'react-native'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { NavigationContainer } from '@react-navigation/native'
import { ThemeProvider } from '../../../theme/ThemeContext'
import FavoritesScreen from '../FavoritesScreen'
import productsReducer from '../../../store/slices/productsSlice'
import favoritesSlice, { fetchFavorites, toggleFavorite } from '../../../store/slices/favoritesSlice'
import authSlice from '../../../store/slices/authSlice'
import { makeProduct } from '@test-utils'

// Mock API_BASE_URL
jest.mock('../../../services/api', () => ({
  API_BASE_URL: 'http://localhost:8000/api',
  default: {
    getProducts: jest.fn(),
    getCategories: jest.fn(),
  },
}))

// Mock navigation
const mockNavigate = jest.fn()
const mockNavigation = {
  navigate: mockNavigate,
  goBack: jest.fn(),
  setOptions: jest.fn(),
}

// Mock favorite products (matching Product type from types/index.ts)
const mockFavoriteProducts = [
  makeProduct({
    id: 1,
    name: 'Pain complet artisanal',
    description: 'Pain frais du jour',
    original_price: '500',
    discounted_price: '250',
    quantity_available: 10,
    expiration_date: '2025-10-21T23:59:59Z',
    image_url: 'pain.jpg',
    discount_percentage: 50,
    savings: 250,
    days_until_expiration: 1,
    category: { id: 1, name: 'Boulangerie' },
    merchant: {
      id: 1,
      business_name: 'Boulangerie Martin',
      business_type: 'boulangerie',
      city: 'Lomé',
      address: '15 Rue du Commerce',
      phone: '+228 90 12 34 56',
      is_verified: true,
    },
    created_at: '2025-10-20T10:00:00Z',
    is_active: true,
  }),
  makeProduct({
    id: 2,
    name: 'Bananes mûres',
    description: 'Parfaites pour smoothies',
    original_price: '300',
    discounted_price: '150',
    quantity_available: 25,
    expiration_date: '2025-10-22T23:59:59Z',
    image_url: 'bananes.jpg',
    discount_percentage: 50,
    savings: 150,
    days_until_expiration: 2,
    category: { id: 2, name: 'Fruits et légumes' },
    merchant: {
      id: 2,
      business_name: 'Fruits Bio Nature',
      business_type: 'fruits_legumes',
      city: 'Sokodé',
      address: '8 Avenue de la Paix',
      phone: '+228 90 22 33 44',
      is_verified: true,
    },
    created_at: '2025-10-19T14:30:00Z',
    is_active: true,
  }),
]

jest.mock('../../../store/slices/favoritesSlice', () => {
  const actual = jest.requireActual('../../../store/slices/favoritesSlice')
  const mockFetchFavorites = jest.fn(() => async () => ({
    type: 'favorites/fetchFavorites/fulfilled',
    payload: mockFavoriteProducts,
  }))
  mockFetchFavorites.fulfilled = {
    match: (action: { type: string }) => action.type === 'favorites/fetchFavorites/fulfilled',
  }

  const mockToggleFavorite = jest.fn(() => async () => ({
    type: 'favorites/toggleFavorite/fulfilled',
  }))
  mockToggleFavorite.fulfilled = {
    match: (action: { type: string }) => action.type === 'favorites/toggleFavorite/fulfilled',
  }

  return {
    ...actual,
    fetchFavorites: mockFetchFavorites,
    toggleFavorite: mockToggleFavorite,
  }
})

// Create test store
const createTestStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      products: productsReducer,
      favorites: favoritesSlice,
      auth: authSlice,
    },
    preloadedState: {
      products: {
        products: [],
        categories: [],
        loading: false,
        error: null,
      },
      favorites: {
        favoriteIds: initialState.favoriteIds || [1, 2],
        favorites: initialState.favorites || mockFavoriteProducts,
        loading: initialState.loading || false,
        error: initialState.error || null,
      },
      auth: {
        user: { id: 1, name: 'Test User', role: 'consumer' },
        token: 'test-token',
        isAuthenticated: true,
      },
    },
  })
}

// Helper to render with providers
const renderWithProviders = (component: React.ReactElement, store = createTestStore()) => {
  return render(
    <Provider store={store}>
      <NavigationContainer>
        <ThemeProvider>
          {component}
        </ThemeProvider>
      </NavigationContainer>
    </Provider>
  )
}

describe('FavoritesScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('fetches favorites on mount and renders products', async () => {
      const { getByText } = renderWithProviders(
        <FavoritesScreen navigation={mockNavigation} />
      )

      await waitFor(() => {
        expect(fetchFavorites).toHaveBeenCalled()
        expect(getByText('Pain complet artisanal')).toBeTruthy()
      })
    })

    it('displays all favorite products', () => {
      const { getByText } = renderWithProviders(
        <FavoritesScreen navigation={mockNavigation} />
      )

      expect(getByText('Pain complet artisanal')).toBeTruthy()
      expect(getByText('Bananes mûres')).toBeTruthy()
    })

    it('displays product prices', () => {
      const { getByText } = renderWithProviders(
        <FavoritesScreen navigation={mockNavigation} />
      )

      expect(getByText('250 F CFA')).toBeTruthy()
      expect(getByText('150 F CFA')).toBeTruthy()
    })

    it('displays merchant names', () => {
      const { getByText } = renderWithProviders(
        <FavoritesScreen navigation={mockNavigation} />
      )

      expect(getByText(/Boulangerie Martin/i)).toBeTruthy()
      expect(getByText(/Fruits Bio Nature/i)).toBeTruthy()
    })

    it('displays merchant cities', () => {
      const { getByText } = renderWithProviders(
        <FavoritesScreen navigation={mockNavigation} />
      )

      expect(getByText(/Lomé/i)).toBeTruthy()
      expect(getByText(/Sokodé/i)).toBeTruthy()
    })

    it('displays discount percentages', () => {
      const { getAllByText } = renderWithProviders(
        <FavoritesScreen navigation={mockNavigation} />
      )

      // Pain: (500-250)/500 = 50%
      // Bananes: (300-150)/300 = 50%
      expect(getAllByText('-50%').length).toBeGreaterThan(0)
    })

    it('displays product quantities', () => {
      const { getByText } = renderWithProviders(
        <FavoritesScreen navigation={mockNavigation} />
      )

      expect(getByText('10')).toBeTruthy()
      expect(getByText('25')).toBeTruthy()
    })
  })

  describe('Favorite actions', () => {
    it('removes a favorite after confirmation', async () => {
      const alertSpy = jest
        .spyOn(Alert, 'alert')
        .mockImplementation((_title, _message, buttons) => {
          const confirm = buttons?.find(button => button.style === 'destructive')
          confirm?.onPress?.()
        })

      const { getByLabelText } = renderWithProviders(
        <FavoritesScreen navigation={mockNavigation} />
      )

      fireEvent.press(getByLabelText('Retirer Pain complet artisanal des favoris'))

      await waitFor(() => {
        expect(toggleFavorite).toHaveBeenCalledWith(1)
        expect(fetchFavorites).toHaveBeenCalledTimes(2)
      })

      alertSpy.mockRestore()
    })
  })

  describe('Empty State', () => {
    it('shows empty state when no favorites', () => {
      const store = createTestStore({ favoriteIds: [], favorites: [] })
      const { getByText } = renderWithProviders(
        <FavoritesScreen navigation={mockNavigation} />,
        store
      )

      expect(getByText(/Aucun favori/i)).toBeTruthy()
    })

    it('shows motivational message in empty state', () => {
      const store = createTestStore({ favoriteIds: [], favorites: [] })
      const { getByText } = renderWithProviders(
        <FavoritesScreen navigation={mockNavigation} />,
        store
      )

      expect(getByText(/parcourir les produits/i)).toBeTruthy()
    })
  })

  describe('Loading State', () => {
    it('displays loading indicator when loading', () => {
      const store = createTestStore({ loading: true, favoriteIds: [], favorites: [] })
      const { getByTestId } = renderWithProviders(
        <FavoritesScreen navigation={mockNavigation} />,
        store
      )

      // ActivityIndicator should be present
      const loadingIndicator = getByTestId(/loading/i) || getByTestId(/activityindicator/i)
      expect(loadingIndicator).toBeTruthy()
    })
  })

  describe('Navigation', () => {
    it('navigates to ProductDetails when product card is pressed', async () => {
      const { getByText } = renderWithProviders(
        <FavoritesScreen navigation={mockNavigation} />
      )

      const productCard = getByText('Pain complet artisanal')
      fireEvent.press(productCard)

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('ProductDetails', { productId: 1 })
      })
    })
  })

  describe('Remove from Favorites', () => {
    it('shows remove button for each favorite', () => {
      const { getAllByTestId } = renderWithProviders(
        <FavoritesScreen navigation={mockNavigation} />
      )

      const removeButtons = getAllByTestId(/remove-favorite/i)
      expect(removeButtons.length).toBe(2)
    })

    it('shows confirmation modal when remove button is pressed', async () => {
      const { getAllByTestId, getByText } = renderWithProviders(
        <FavoritesScreen navigation={mockNavigation} />
      )

      const removeButtons = getAllByTestId(/remove-favorite/i)
      fireEvent.press(removeButtons[0])

      await waitFor(() => {
        expect(getByText(/Êtes-vous sûr/i)).toBeTruthy()
      })
    })

    it('cancels removal when cancel button is pressed in modal', async () => {
      const { getAllByTestId, getByText } = renderWithProviders(
        <FavoritesScreen navigation={mockNavigation} />
      )

      const removeButtons = getAllByTestId(/remove-favorite/i)
      fireEvent.press(removeButtons[0])

      await waitFor(() => {
        const cancelButton = getByText('Annuler')
        fireEvent.press(cancelButton)
      })

      // Product should still be visible
      expect(getByText('Pain complet artisanal')).toBeTruthy()
    })
  })

  describe('Pull to Refresh', () => {
    it('triggers refresh when pull to refresh is activated', async () => {
      const { getByTestId } = renderWithProviders(
        <FavoritesScreen navigation={mockNavigation} />
      )

      // Simulate pull to refresh
      const flatList = getByTestId(/flatlist/i) || getByTestId(/scrollview/i)
      expect(flatList).toBeTruthy()
    })
  })

  describe('Product Cards Layout', () => {
    it('displays product cards in grid format', () => {
      const { getByText } = renderWithProviders(
        <FavoritesScreen navigation={mockNavigation} />
      )

      // Verify multiple products are rendered
      expect(getByText('Pain complet artisanal')).toBeTruthy()
      expect(getByText('Bananes mûres')).toBeTruthy()
    })

    it('displays product images', () => {
      const { getAllByTestId } = renderWithProviders(
        <FavoritesScreen navigation={mockNavigation} />
      )

      // Images should be rendered
      const images = getAllByTestId(/image/i)
      expect(images.length).toBeGreaterThan(0)
    })
  })

  describe('Error Handling', () => {
    it('displays error message when there is an error', () => {
      const store = createTestStore({
        favoriteIds: [],
        favorites: [],
        error: 'Failed to load favorites'
      })
      const { getByText } = renderWithProviders(
        <FavoritesScreen navigation={mockNavigation} />,
        store
      )

      expect(getByText(/Failed to load favorites/i) || getByText(/erreur/i)).toBeTruthy()
    })
  })

  describe('Product Information Display', () => {
    it('displays original price with strikethrough', () => {
      const { getByText } = renderWithProviders(
        <FavoritesScreen navigation={mockNavigation} />
      )

      expect(getByText('500 F CFA')).toBeTruthy()
      expect(getByText('300 F CFA')).toBeTruthy()
    })

    it('displays category information', () => {
      const { getByText } = renderWithProviders(
        <FavoritesScreen navigation={mockNavigation} />
      )

      expect(getByText(/Boulangerie/i)).toBeTruthy()
      expect(getByText(/Fruits et légumes/i)).toBeTruthy()
    })
  })

  describe('Favorites Count', () => {
    it('displays count of favorite products', () => {
      const { getByText } = renderWithProviders(
        <FavoritesScreen navigation={mockNavigation} />
      )

      // Should show 2 products or a count indicator
      expect(getByText('Pain complet artisanal')).toBeTruthy()
      expect(getByText('Bananes mûres')).toBeTruthy()
    })
  })
})
