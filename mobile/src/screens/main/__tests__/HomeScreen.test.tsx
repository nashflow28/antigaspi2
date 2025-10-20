// @ts-nocheck
import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import HomeScreen from '../HomeScreen'
import productsReducer from '../../../store/slices/productsSlice'
import authSlice from '../../../store/slices/authSlice'
import merchantsSlice from '../../../store/slices/merchantsSlice'
import favoritesSlice from '../../../store/slices/favoritesSlice'
import { ThemeProvider } from '../../../theme/ThemeContext'

// Mock navigation
const mockNavigate = jest.fn()
const mockNavigation = {
  navigate: mockNavigate,
  goBack: jest.fn(),
  setOptions: jest.fn(),
}

// Mock products data
const mockProducts = [
  {
    id: 1,
    name: 'Pain complet artisanal',
    description: 'Pain complet aux graines',
    original_price: '500.00',
    discounted_price: '250.00',
    quantity_available: 15,
    expiration_date: '2025-10-10T00:00:00.000000Z',
    image_url: '/storage/products/pain.jpg',
    discount_percentage: 50,
    savings: 250,
    days_until_expiration: 4,
    category: {
      id: 1,
      name: 'Boulangerie',
      icon: '🥐',
    },
    merchant: {
      id: 1,
      business_name: 'Boulangerie Martin',
      business_type: 'Boulangerie',
      city: 'Lomé',
      address: '456 Avenue du Commerce',
      phone: '+228 90 98 76 54',
      is_verified: true,
    },
    created_at: '2025-09-25T16:24:53.000000Z',
  },
  {
    id: 2,
    name: 'Bananes mûres',
    description: 'Lot de bananes',
    original_price: '300.00',
    discounted_price: '150.00',
    quantity_available: 10,
    expiration_date: '2025-10-08T00:00:00.000000Z',
    image_url: '/storage/products/bananes.jpg',
    discount_percentage: 50,
    savings: 150,
    days_until_expiration: 2,
    category: {
      id: 2,
      name: 'Fruits et Légumes',
      icon: '🥕',
    },
    merchant: {
      id: 2,
      business_name: 'Marché Bio',
      business_type: 'Fruits',
      city: 'Lomé',
      address: '123 Rue du marché',
      phone: '+228 90 11 22 33',
      is_verified: true,
    },
    created_at: '2025-09-25T16:24:53.000000Z',
  },
]

const mockCategories = [
  { id: 1, name: 'Boulangerie', description: 'Produits de boulangerie' },
  { id: 2, name: 'Fruits et Légumes', description: 'Fruits et légumes frais' },
]

// Create test store
const createTestStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      products: productsReducer,
      auth: authSlice,
      merchants: merchantsSlice,
      favorites: favoritesSlice,
    },
    preloadedState: {
      products: {
        products: mockProducts,
        categories: mockCategories,
        loading: false,
        loadingMore: false,
        error: null,
        filters: {},
        currentPage: 1,
        hasMore: false,
      },
      auth: {
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        error: null,
      },
      merchants: {
        merchants: [],
        loading: false,
        error: null,
      },
      favorites: {
        favoriteIds: [],
        loading: false,
        error: null,
      },
      ...initialState,
    },
  })
}

// Helper to render with providers
const renderWithProviders = (component: React.ReactElement, store: any) => {
  return render(
    <Provider store={store}>
      <ThemeProvider>
        {component}
      </ThemeProvider>
    </Provider>
  )
}

describe('HomeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders without crashing', () => {
      const store = createTestStore()
      const { getByText } = renderWithProviders(
        <HomeScreen navigation={mockNavigation} />,
        store
      )

      expect(getByText(/Tous/i)).toBeTruthy()
    })

    it('displays products correctly', () => {
      const store = createTestStore()
      const { getByText } = renderWithProviders(
        <HomeScreen navigation={mockNavigation} />,
        store
      )

      expect(getByText('Pain complet artisanal')).toBeTruthy()
      expect(getByText('Bananes mûres')).toBeTruthy()
    })

    it('displays prices in F CFA format', () => {
      const store = createTestStore()
      const { getAllByText } = renderWithProviders(
        <HomeScreen navigation={mockNavigation} />,
        store
      )

      const priceElements = getAllByText(/F CFA/i)
      expect(priceElements.length).toBeGreaterThan(0)
    })

    it('shows correct category count', () => {
      const store = createTestStore()
      const { getByText } = renderWithProviders(
        <HomeScreen navigation={mockNavigation} />,
        store
      )

      // Categories are displayed with counts, e.g. "Boulangerie (1)"
      expect(getByText(/Boulangerie \(/i)).toBeTruthy()
      expect(getByText(/Fruits et Légumes \(/i)).toBeTruthy()
    })

    it('displays discount percentages correctly', () => {
      const store = createTestStore()
      const { getAllByText } = renderWithProviders(
        <HomeScreen navigation={mockNavigation} />,
        store
      )

      // Should show discount percentages
      const discountElements = getAllByText(/-50%/i)
      expect(discountElements.length).toBeGreaterThan(0)
    })

    it('displays merchant information for each product', () => {
      const store = createTestStore()
      const { getByText } = renderWithProviders(
        <HomeScreen navigation={mockNavigation} />,
        store
      )

      expect(getByText('Boulangerie Martin')).toBeTruthy()
      expect(getByText('Marché Bio')).toBeTruthy()
    })

    it('shows "Tous" category by default', () => {
      const store = createTestStore()
      const { getByText } = renderWithProviders(
        <HomeScreen navigation={mockNavigation} />,
        store
      )

      expect(getByText('Tous')).toBeTruthy()
    })
  })

  describe('Navigation', () => {
    it('navigates to ProductDetails when product is pressed', async () => {
      const store = createTestStore()
      const { getByText } = renderWithProviders(
        <HomeScreen navigation={mockNavigation} />,
        store
      )

      const productCard = getByText('Pain complet artisanal')
      fireEvent.press(productCard)

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('ProductDetails', { productId: 1 })
      })
    })
  })

  describe('Category Filtering', () => {
    it('filters products by category when category chip is pressed', async () => {
      const store = createTestStore()
      const { getByText } = renderWithProviders(
        <HomeScreen navigation={mockNavigation} />,
        store
      )

      const boulangerieChip = getByText(/Boulangerie \(/i)
      fireEvent.press(boulangerieChip)

      await waitFor(() => {
        // After filtering by Boulangerie, only Pain should be visible
        expect(getByText('Pain complet artisanal')).toBeTruthy()
      })
    })

    it('shows all products when "Tous" is selected', async () => {
      const store = createTestStore()
      const { getByText } = renderWithProviders(
        <HomeScreen navigation={mockNavigation} />,
        store
      )

      // First filter by category
      const boulangerieChip = getByText(/Boulangerie \(/i)
      fireEvent.press(boulangerieChip)

      // Then click "Tous"
      const tousChip = getByText('Tous')
      fireEvent.press(tousChip)

      await waitFor(() => {
        // Should show all products again
        expect(getByText('Pain complet artisanal')).toBeTruthy()
        expect(getByText('Bananes mûres')).toBeTruthy()
      })
    })
  })

  describe('Empty States', () => {
    it('shows empty state when no products are available', () => {
      const store = createTestStore({
        products: {
          products: [],
          categories: mockCategories,
          loading: false,
          loadingMore: false,
          error: null,
          filters: {},
          currentPage: 1,
          hasMore: false,
        },
      })

      const { getByText } = renderWithProviders(
        <HomeScreen navigation={mockNavigation} />,
        store
      )

      expect(getByText(/Aucun produit/i)).toBeTruthy()
    })

    it('shows loading state when products are being fetched', () => {
      const store = createTestStore({
        products: {
          products: [],
          categories: [],
          loading: true,
          loadingMore: false,
          error: null,
          filters: {},
          currentPage: 1,
          hasMore: false,
        },
      })

      const { getByTestId } = renderWithProviders(
        <HomeScreen navigation={mockNavigation} />,
        store
      )

      // Should show loading indicator
      expect(getByTestId('loading-indicator')).toBeTruthy()
    })
  })

  describe('Product Information Display', () => {
    it('shows expiration information for products', () => {
      const store = createTestStore()
      const { getAllByText } = renderWithProviders(
        <HomeScreen navigation={mockNavigation} />,
        store
      )

      // Should show "Expire dans X jours"
      const expirationElements = getAllByText(/Expire dans/i)
      expect(expirationElements.length).toBeGreaterThan(0)
    })

    it('displays savings amount for each product', () => {
      const store = createTestStore()
      const { getByText } = renderWithProviders(
        <HomeScreen navigation={mockNavigation} />,
        store
      )

      // Should show savings (250 F CFA and 150 F CFA)
      expect(getByText(/Économisez.*250 F CFA/i)).toBeTruthy()
      expect(getByText(/Économisez.*150 F CFA/i)).toBeTruthy()
    })

    it('shows verified badge for verified merchants', () => {
      const store = createTestStore()
      const { getAllByText } = renderWithProviders(
        <HomeScreen navigation={mockNavigation} />,
        store
      )

      // Both merchants are verified
      const verifiedBadges = getAllByText(/Vérifié/i)
      expect(verifiedBadges.length).toBe(2)
    })
  })
})
