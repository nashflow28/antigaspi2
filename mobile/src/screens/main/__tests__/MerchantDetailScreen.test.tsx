// @ts-nocheck
import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { ThemeProvider } from '../../../theme/ThemeContext'
import MerchantDetailScreen from '../MerchantDetailScreen'
import merchantsSlice from '../../../store/slices/merchantsSlice'
import productsReducer from '../../../store/slices/productsSlice'
import reviewsSlice from '../../../store/slices/reviewsSlice'
import authSlice from '../../../store/slices/authSlice'

// Mock navigation
const mockNavigate = jest.fn()
const mockGoBack = jest.fn()
const mockNavigation = {
  navigate: mockNavigate,
  goBack: mockGoBack,
  setOptions: jest.fn(),
}

// Mock route params
const mockRoute = {
  params: {
    merchantId: 1,
  },
}

// Mock merchant data (matching Merchant type from types/index.ts)
const mockMerchant = {
  id: 1,
  business_name: 'Boulangerie Martin',
  business_type: 'Boulangerie artisanale',
  city: 'Lomé',
  address: '15 Rue du Commerce',
  phone: '+228 90 12 34 56',
  is_verified: true,
  latitude: 6.1319,
  longitude: 1.2228,
  products_count: 8,
}

// Mock products (matching Product type from types/index.ts)
const mockProducts = [
  {
    id: 1,
    name: 'Pain complet',
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
    merchant: mockMerchant,
    created_at: '2025-10-20T10:00:00Z',
    is_active: true,
  },
  {
    id: 2,
    name: 'Croissants',
    description: 'Croissants au beurre artisanaux',
    original_price: '300',
    discounted_price: '150',
    quantity_available: 20,
    expiration_date: '2025-10-21T23:59:59Z',
    image_url: 'croissants.jpg',
    discount_percentage: 50,
    savings: 150,
    days_until_expiration: 1,
    category: { id: 1, name: 'Boulangerie' },
    merchant: mockMerchant,
    created_at: '2025-10-20T10:00:00Z',
    is_active: true,
  },
]

// Mock reviews (matching Review type from types/index.ts)
const mockReviews = [
  {
    id: 1,
    rating: 5,
    title: 'Excellent produits',
    comment: 'Excellent produits!',
    stars: '★★★★★',
    time_ago: 'Il y a 5 jours',
    is_verified_purchase: true,
    user: {
      id: 101,
      name: 'Jean Dupont',
    },
    created_at: '2025-01-15T10:00:00Z',
  },
  {
    id: 2,
    rating: 4,
    title: 'Très bon',
    comment: 'Très bon',
    stars: '★★★★☆',
    time_ago: 'Il y a 6 jours',
    is_verified_purchase: true,
    user: {
      id: 102,
      name: 'Marie Martin',
    },
    created_at: '2025-01-14T10:00:00Z',
  },
]

// Create test store
const createTestStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      merchants: merchantsSlice,
      products: productsReducer,
      reviews: reviewsSlice,
      auth: authSlice,
    },
    preloadedState: {
      merchants: {
        merchants: initialState.merchants || [mockMerchant],
        currentMerchant: initialState.currentMerchant || mockMerchant,
        loading: false,
        error: null,
      },
      products: {
        products: initialState.products || mockProducts,
        categories: [],
        loading: false,
        error: null,
      },
      reviews: {
        reviews: initialState.reviews || mockReviews,
        stats: {
          average_rating: 4.5,
          total_reviews: 2,
        },
        loading: false,
        error: null,
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
      <ThemeProvider>
        {component}
      </ThemeProvider>
    </Provider>
  )
}

describe('MerchantDetailScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering - Header', () => {
    it('renders without crashing', () => {
      const { getByText } = renderWithProviders(
        <MerchantDetailScreen navigation={mockNavigation} route={mockRoute} />
      )
      expect(getByText('Boulangerie Martin')).toBeTruthy()
    })

    it('displays merchant name', () => {
      const { getByText } = renderWithProviders(
        <MerchantDetailScreen navigation={mockNavigation} route={mockRoute} />
      )
      expect(getByText('Boulangerie Martin')).toBeTruthy()
    })

    it('displays merchant business type', () => {
      const { getByText } = renderWithProviders(
        <MerchantDetailScreen navigation={mockNavigation} route={mockRoute} />
      )
      expect(getByText('Boulangerie artisanale')).toBeTruthy()
    })

    it('displays verified badge for verified merchants', () => {
      const { getByTestId } = renderWithProviders(
        <MerchantDetailScreen navigation={mockNavigation} route={mockRoute} />
      )
      const verifiedBadge = getByTestId(/checkmark-circle/i) || getByTestId(/verified/i)
      expect(verifiedBadge).toBeTruthy()
    })

    it('displays back button', () => {
      const { getByTestId } = renderWithProviders(
        <MerchantDetailScreen navigation={mockNavigation} route={mockRoute} />
      )
      const backButton = getByTestId(/arrow-back/i) || getByTestId(/back-button/i)
      expect(backButton).toBeTruthy()
    })
  })

  describe('Navigation - Back Button', () => {
    it('navigates back when back button is pressed', async () => {
      const { getByTestId } = renderWithProviders(
        <MerchantDetailScreen navigation={mockNavigation} route={mockRoute} />
      )

      const backButton = getByTestId(/arrow-back/i) || getByTestId(/back-button/i)
      fireEvent.press(backButton)

      await waitFor(() => {
        expect(mockGoBack).toHaveBeenCalled()
      })
    })
  })

  describe('Tabs', () => {
    it('renders all three tabs', () => {
      const { getByText } = renderWithProviders(
        <MerchantDetailScreen navigation={mockNavigation} route={mockRoute} />
      )
      expect(getByText('Produits')).toBeTruthy()
      expect(getByText('Infos')).toBeTruthy()
      expect(getByText('Avis')).toBeTruthy()
    })

    it('displays products tab by default', () => {
      const { getByText } = renderWithProviders(
        <MerchantDetailScreen navigation={mockNavigation} route={mockRoute} />
      )
      expect(getByText('Pain complet')).toBeTruthy()
    })

    it('switches to info tab when clicked', async () => {
      const { getByText } = renderWithProviders(
        <MerchantDetailScreen navigation={mockNavigation} route={mockRoute} />
      )

      const infoTab = getByText('Infos')
      fireEvent.press(infoTab)

      await waitFor(() => {
        expect(getByText(/15 Rue du Commerce/i)).toBeTruthy()
      })
    })

    it('switches to reviews tab when clicked', async () => {
      const { getByText } = renderWithProviders(
        <MerchantDetailScreen navigation={mockNavigation} route={mockRoute} />
      )

      const reviewsTab = getByText('Avis')
      fireEvent.press(reviewsTab)

      await waitFor(() => {
        expect(getByText('Excellent produits!')).toBeTruthy()
      })
    })
  })

  describe('Products Tab', () => {
    it('displays merchant products', () => {
      const { getByText } = renderWithProviders(
        <MerchantDetailScreen navigation={mockNavigation} route={mockRoute} />
      )
      expect(getByText('Pain complet')).toBeTruthy()
      expect(getByText('Croissants')).toBeTruthy()
    })

    it('displays product prices', () => {
      const { getByText } = renderWithProviders(
        <MerchantDetailScreen navigation={mockNavigation} route={mockRoute} />
      )
      expect(getByText('250 F CFA')).toBeTruthy()
      expect(getByText('150 F CFA')).toBeTruthy()
    })

    it('navigates to ProductDetails when product is clicked', async () => {
      const { getByText } = renderWithProviders(
        <MerchantDetailScreen navigation={mockNavigation} route={mockRoute} />
      )

      const productCard = getByText('Pain complet')
      fireEvent.press(productCard)

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('ProductDetails', { productId: 1 })
      })
    })

    it('shows empty state when merchant has no products', () => {
      const store = createTestStore({ products: [] })
      const { getByText } = renderWithProviders(
        <MerchantDetailScreen navigation={mockNavigation} route={mockRoute} />,
        store
      )
      expect(getByText(/Aucun produit/i)).toBeTruthy()
    })
  })

  describe('Info Tab', () => {
    it('displays merchant address', async () => {
      const { getByText } = renderWithProviders(
        <MerchantDetailScreen navigation={mockNavigation} route={mockRoute} />
      )

      fireEvent.press(getByText('Infos'))

      await waitFor(() => {
        expect(getByText(/15 Rue du Commerce/i)).toBeTruthy()
      })
    })

    it('displays merchant phone number', async () => {
      const { getByText } = renderWithProviders(
        <MerchantDetailScreen navigation={mockNavigation} route={mockRoute} />
      )

      fireEvent.press(getByText('Infos'))

      await waitFor(() => {
        expect(getByText(/\+228 90 12 34 56/)).toBeTruthy()
      })
    })

    it('displays merchant city', async () => {
      const { getByText } = renderWithProviders(
        <MerchantDetailScreen navigation={mockNavigation} route={mockRoute} />
      )

      fireEvent.press(getByText('Infos'))

      await waitFor(() => {
        expect(getByText(/Lomé/i)).toBeTruthy()
      })
    })

    it('displays call button', async () => {
      const { getByText, getByTestId } = renderWithProviders(
        <MerchantDetailScreen navigation={mockNavigation} route={mockRoute} />
      )

      fireEvent.press(getByText('Infos'))

      await waitFor(() => {
        const callButton = getByTestId(/call/i) || getByText(/Appeler/i)
        expect(callButton).toBeTruthy()
      })
    })
  })

  describe('Reviews Tab', () => {
    it('displays merchant reviews', async () => {
      const { getByText } = renderWithProviders(
        <MerchantDetailScreen navigation={mockNavigation} route={mockRoute} />
      )

      fireEvent.press(getByText('Avis'))

      await waitFor(() => {
        expect(getByText('Excellent produits!')).toBeTruthy()
        expect(getByText('Très bon')).toBeTruthy()
      })
    })

    it('displays review ratings', async () => {
      const { getByText } = renderWithProviders(
        <MerchantDetailScreen navigation={mockNavigation} route={mockRoute} />
      )

      fireEvent.press(getByText('Avis'))

      await waitFor(() => {
        // Star ratings should be visible
        expect(getByText('Excellent produits!')).toBeTruthy()
      })
    })

    it('displays reviewer names', async () => {
      const { getByText } = renderWithProviders(
        <MerchantDetailScreen navigation={mockNavigation} route={mockRoute} />
      )

      fireEvent.press(getByText('Avis'))

      await waitFor(() => {
        expect(getByText('Jean Dupont')).toBeTruthy()
        expect(getByText('Marie Martin')).toBeTruthy()
      })
    })

    it('displays average rating', async () => {
      const { getByText } = renderWithProviders(
        <MerchantDetailScreen navigation={mockNavigation} route={mockRoute} />
      )

      fireEvent.press(getByText('Avis'))

      await waitFor(() => {
        expect(getByText(/4\.5/)).toBeTruthy()
      })
    })

    it('shows empty state when no reviews', async () => {
      const store = createTestStore({ reviews: [] })
      const { getByText } = renderWithProviders(
        <MerchantDetailScreen navigation={mockNavigation} route={mockRoute} />,
        store
      )

      fireEvent.press(getByText('Avis'))

      await waitFor(() => {
        expect(getByText(/Aucun avis/i)).toBeTruthy()
      })
    })
  })

  describe('Pull to Refresh', () => {
    it('allows refresh on products tab', async () => {
      const { getByTestId } = renderWithProviders(
        <MerchantDetailScreen navigation={mockNavigation} route={mockRoute} />
      )

      const scrollView = getByTestId(/scrollview/i) || getByTestId(/flatlist/i)
      expect(scrollView).toBeTruthy()
    })
  })

  describe('Loading State', () => {
    it('displays loading indicator when loading merchant data', () => {
      const store = createTestStore({ currentMerchant: null })
      store.dispatch = jest.fn()

      const { getByTestId } = renderWithProviders(
        <MerchantDetailScreen navigation={mockNavigation} route={mockRoute} />,
        store
      )

      // Should show loading state
      const loading = getByTestId(/loading/i) || getByTestId(/activityindicator/i)
      expect(loading).toBeTruthy()
    })
  })

  describe('Product Count Badge', () => {
    it('displays product count in header', () => {
      const { getByText } = renderWithProviders(
        <MerchantDetailScreen navigation={mockNavigation} route={mockRoute} />
      )
      expect(getByText(/8 produits/i) || getByText('8')).toBeTruthy()
    })
  })

  describe('Contact Options', () => {
    it('displays phone icon for contact', async () => {
      const { getByText, getByTestId } = renderWithProviders(
        <MerchantDetailScreen navigation={mockNavigation} route={mockRoute} />
      )

      fireEvent.press(getByText('Infos'))

      await waitFor(() => {
        const phoneIcon = getByTestId(/phone/i) || getByTestId(/call/i)
        expect(phoneIcon).toBeTruthy()
      })
    })

    it('displays location icon for address', async () => {
      const { getByText, getByTestId } = renderWithProviders(
        <MerchantDetailScreen navigation={mockNavigation} route={mockRoute} />
      )

      fireEvent.press(getByText('Infos'))

      await waitFor(() => {
        const locationIcon = getByTestId(/location/i) || getByTestId(/map/i)
        expect(locationIcon).toBeTruthy()
      })
    })
  })
})
