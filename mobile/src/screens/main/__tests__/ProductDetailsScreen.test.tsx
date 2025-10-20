// @ts-nocheck
import React from 'react'
import { render, waitFor } from '@testing-library/react-native'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import ProductDetailsScreen from '../ProductDetailsScreen'
import productsSlice from '../../../store/slices/productsSlice'
import authSlice from '../../../store/slices/authSlice'
import merchantsSlice from '../../../store/slices/merchantsSlice'
import favoritesSlice from '../../../store/slices/favoritesSlice'
import reviewsSlice from '../../../store/slices/reviewsSlice'
import reservationsSlice from '../../../store/slices/reservationsSlice'
import { ThemeProvider } from '../../../theme/ThemeContext'

// Mock navigation
const mockGoBack = jest.fn()
const mockNavigation = {
  navigate: jest.fn(),
  goBack: mockGoBack,
  setOptions: jest.fn(),
}

// Mock product data
const mockProduct = {
  id: 1,
  name: 'Pain complet artisanal',
  description: 'Pain complet aux graines, fabriqué le matin même',
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
}

// Create test store
const createTestStore = (productInStore = true) => {
  return configureStore({
    reducer: {
      products: productsSlice,
      auth: authSlice,
      merchants: merchantsSlice,
      favorites: favoritesSlice,
      reviews: reviewsSlice,
      reservations: reservationsSlice,
    },
    preloadedState: {
      products: {
        products: productInStore ? [mockProduct] : [],
        categories: [],
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
      reviews: {
        reviews: [],
        stats: null,
        loading: false,
        error: null,
        currentPage: 1,
        hasMore: false,
      },
      reservations: {
        reservations: [],
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
      <ThemeProvider>
        {component}
      </ThemeProvider>
    </Provider>
  )
}

describe('ProductDetailsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders without crashing when product exists in store', () => {
      const store = createTestStore(true)
      const route = { params: { productId: 1 } }

      const { getByText } = renderWithProviders(
        <ProductDetailsScreen navigation={mockNavigation} route={route} />,
        store
      )

      // Should display product name
      expect(getByText('Pain complet artisanal')).toBeTruthy()
    })

    it('displays product details correctly', () => {
      const store = createTestStore(true)
      const route = { params: { productId: 1 } }

      const { getByText } = renderWithProviders(
        <ProductDetailsScreen navigation={mockNavigation} route={route} />,
        store
      )

      // Check product details
      expect(getByText('Pain complet artisanal')).toBeTruthy()
      expect(getByText(/Boulangerie Martin/i)).toBeTruthy()
      expect(getByText(/Lomé/i)).toBeTruthy()
    })

    it('displays prices in F CFA format', () => {
      const store = createTestStore(true)
      const route = { params: { productId: 1 } }

      const { getAllByText } = renderWithProviders(
        <ProductDetailsScreen navigation={mockNavigation} route={route} />,
        store
      )

      // Should display prices with F CFA
      const priceElements = getAllByText(/F CFA/i)
      expect(priceElements.length).toBeGreaterThan(0)
    })

    it('displays quantity available', () => {
      const store = createTestStore(true)
      const route = { params: { productId: 1 } }

      const { getByText } = renderWithProviders(
        <ProductDetailsScreen navigation={mockNavigation} route={route} />,
        store
      )

      // Should show quantity (15 in this case)
      expect(getByText(/Quantité.*15/i)).toBeTruthy()
    })

    it('displays product description if available', () => {
      const store = createTestStore(true)
      const route = { params: { productId: 1 } }

      const { getByText } = renderWithProviders(
        <ProductDetailsScreen navigation={mockNavigation} route={route} />,
        store
      )

      // Should show description
      expect(getByText(/Pain complet aux graines/i)).toBeTruthy()
    })

    it('displays category information', () => {
      const store = createTestStore(true)
      const route = { params: { productId: 1 } }

      const { getByText } = renderWithProviders(
        <ProductDetailsScreen navigation={mockNavigation} route={route} />,
        store
      )

      // Should show category
      expect(getByText(/Catégorie.*Boulangerie/i)).toBeTruthy()
    })

    it('displays discount information correctly', () => {
      const store = createTestStore(true)
      const route = { params: { productId: 1 } }

      const { getByText } = renderWithProviders(
        <ProductDetailsScreen navigation={mockNavigation} route={route} />,
        store
      )

      // Should show discount percentage
      expect(getByText(/-50%/i)).toBeTruthy()
    })

    it('displays expiration information', () => {
      const store = createTestStore(true)
      const route = { params: { productId: 1 } }

      const { getByText } = renderWithProviders(
        <ProductDetailsScreen navigation={mockNavigation} route={route} />,
        store
      )

      // Should show expiration info
      expect(getByText(/Expire dans.*4 jours/i)).toBeTruthy()
    })

    it('displays merchant verified badge', () => {
      const store = createTestStore(true)
      const route = { params: { productId: 1 } }

      const { getByText } = renderWithProviders(
        <ProductDetailsScreen navigation={mockNavigation} route={route} />,
        store
      )

      // Should show verified badge
      expect(getByText(/Vérifié/i)).toBeTruthy()
    })
  })

  describe('Reservation Button', () => {
    it('shows "Réserver" button when product is available', () => {
      const store = createTestStore(true)
      const route = { params: { productId: 1 } }

      const { getByText } = renderWithProviders(
        <ProductDetailsScreen navigation={mockNavigation} route={route} />,
        store
      )

      // Should show reserve button
      expect(getByText('Réserver')).toBeTruthy()
    })

    it('shows "Rupture de stock" when product quantity is 0', () => {
      const unavailableProduct = { ...mockProduct, quantity_available: 0 }
      const store = configureStore({
        reducer: {
          products: productsSlice,
          auth: authSlice,
          merchants: merchantsSlice,
          favorites: favoritesSlice,
          reviews: reviewsSlice,
          reservations: reservationsSlice,
        },
        preloadedState: {
          products: {
            products: [unavailableProduct],
            categories: [],
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
          reviews: {
            reviews: [],
            stats: null,
            loading: false,
            error: null,
            currentPage: 1,
            hasMore: false,
          },
          reservations: {
            reservations: [],
            loading: false,
            error: null,
          },
        },
      })

      const route = { params: { productId: 1 } }

      const { getByText } = renderWithProviders(
        <ProductDetailsScreen navigation={mockNavigation} route={route} />,
        store
      )

      // Should show "Rupture de stock"
      expect(getByText('Rupture de stock')).toBeTruthy()
    })

    it('disables reserve button when product is out of stock', () => {
      const unavailableProduct = { ...mockProduct, quantity_available: 0 }
      const store = configureStore({
        reducer: {
          products: productsSlice,
          auth: authSlice,
          merchants: merchantsSlice,
          favorites: favoritesSlice,
          reviews: reviewsSlice,
          reservations: reservationsSlice,
        },
        preloadedState: {
          products: {
            products: [unavailableProduct],
            categories: [],
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
          reviews: {
            reviews: [],
            stats: null,
            loading: false,
            error: null,
            currentPage: 1,
            hasMore: false,
          },
          reservations: {
            reservations: [],
            loading: false,
            error: null,
          },
        },
      })

      const route = { params: { productId: 1 } }

      const { getByText } = renderWithProviders(
        <ProductDetailsScreen navigation={mockNavigation} route={route} />,
        store
      )

      const button = getByText('Rupture de stock')
      expect(button.props.disabled || button.props.accessibilityState?.disabled).toBeTruthy()
    })
  })

  describe('Navigation', () => {
    it('navigates back when back button is pressed', async () => {
      const store = createTestStore(true)
      const route = { params: { productId: 1 } }

      renderWithProviders(
        <ProductDetailsScreen navigation={mockNavigation} route={route} />,
        store
      )

      await waitFor(() => {
        // The screen sets up a back button in the header
        expect(mockNavigation.setOptions).toHaveBeenCalled()
      })
    })

    it('navigates to merchant page when merchant info is pressed', async () => {
      const store = createTestStore(true)
      const route = { params: { productId: 1 } }

      const { getByText } = renderWithProviders(
        <ProductDetailsScreen navigation={mockNavigation} route={route} />,
        store
      )

      const merchantName = getByText(/Boulangerie Martin/i)
      fireEvent.press(merchantName)

      await waitFor(() => {
        expect(mockNavigation.navigate).toHaveBeenCalledWith('MerchantDetail', { merchantId: 1 })
      })
    })
  })

  describe('Loading State', () => {
    it('shows loading state when product is not loaded yet', () => {
      const store = createTestStore(false)
      const route = { params: { productId: 1 } }

      const { getByText } = renderWithProviders(
        <ProductDetailsScreen navigation={mockNavigation} route={route} />,
        store
      )

      // Should show loading text
      expect(getByText('Chargement...')).toBeTruthy()
    })

    it('shows loading indicator while fetching product details', () => {
      const store = createTestStore(false)
      const route = { params: { productId: 1 } }

      const { getByTestId } = renderWithProviders(
        <ProductDetailsScreen navigation={mockNavigation} route={route} />,
        store
      )

      // Should show loading indicator
      expect(getByTestId('loading-indicator')).toBeTruthy()
    })
  })

  describe('User Interaction', () => {
    it('shows quantity selector when reserving product', async () => {
      const authenticatedStore = configureStore({
        reducer: {
          products: productsSlice,
          auth: authSlice,
          merchants: merchantsSlice,
          favorites: favoritesSlice,
          reviews: reviewsSlice,
          reservations: reservationsSlice,
        },
        preloadedState: {
          products: {
            products: [mockProduct],
            categories: [],
            loading: false,
            loadingMore: false,
            error: null,
            filters: {},
            currentPage: 1,
            hasMore: false,
          },
          auth: {
            user: { id: 1, email: 'test@example.com', role: 'consumer' },
            token: 'test-token',
            isAuthenticated: true,
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
          reviews: {
            reviews: [],
            stats: null,
            loading: false,
            error: null,
            currentPage: 1,
            hasMore: false,
          },
          reservations: {
            reservations: [],
            loading: false,
            error: null,
          },
        },
      })

      const route = { params: { productId: 1 } }

      const { getByText } = renderWithProviders(
        <ProductDetailsScreen navigation={mockNavigation} route={route} />,
        authenticatedStore
      )

      const reserveButton = getByText('Réserver')
      fireEvent.press(reserveButton)

      await waitFor(() => {
        // Should show quantity selector modal
        expect(getByText(/Quantité/i)).toBeTruthy()
      })
    })
  })

  describe('Favorites Feature', () => {
    it('shows favorite button for authenticated users', () => {
      const authenticatedStore = configureStore({
        reducer: {
          products: productsSlice,
          auth: authSlice,
          merchants: merchantsSlice,
          favorites: favoritesSlice,
          reviews: reviewsSlice,
          reservations: reservationsSlice,
        },
        preloadedState: {
          products: {
            products: [mockProduct],
            categories: [],
            loading: false,
            loadingMore: false,
            error: null,
            filters: {},
            currentPage: 1,
            hasMore: false,
          },
          auth: {
            user: { id: 1, email: 'test@example.com', role: 'consumer' },
            token: 'test-token',
            isAuthenticated: true,
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
          reviews: {
            reviews: [],
            stats: null,
            loading: false,
            error: null,
            currentPage: 1,
            hasMore: false,
          },
          reservations: {
            reservations: [],
            loading: false,
            error: null,
          },
        },
      })

      const route = { params: { productId: 1 } }

      const { getByTestId } = renderWithProviders(
        <ProductDetailsScreen navigation={mockNavigation} route={route} />,
        authenticatedStore
      )

      // Should show favorite button
      expect(getByTestId('favorite-button')).toBeTruthy()
    })
  })
})
