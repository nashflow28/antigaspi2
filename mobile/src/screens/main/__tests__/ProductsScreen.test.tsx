// @ts-nocheck
import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { ThemeProvider } from '../../../theme/ThemeContext'
import ProductsScreen from '../ProductsScreen'
import productsSlice from '../../../store/slices/productsSlice'
import merchantsSlice from '../../../store/slices/merchantsSlice'
import authSlice from '../../../store/slices/authSlice'
import favoritesSlice from '../../../store/slices/favoritesSlice'
import connectivitySlice from '../../../store/slices/connectivitySlice'
import reservationsSlice from '../../../store/slices/reservationsSlice'
import reviewsSlice from '../../../store/slices/reviewsSlice'

// Mock navigation
const mockNavigate = jest.fn()
const mockNavigation = {
  navigate: mockNavigate,
  goBack: jest.fn(),
  setOptions: jest.fn(),
}

// Mock data - Merchants (matching merchantsSlice structure with nested user)
const mockMerchants = [
  {
    id: 1,
    business_name: 'Boulangerie Martin',
    business_type: 'Boulangerie artisanale',
    is_verified: true,
    latitude: 6.1319,
    longitude: 1.2228,
    products_count: 8,
    user: {
      city: 'Lomé',
      address: '15 Rue du Commerce',
      phone: '+228 90 12 34 56',
    },
  },
  {
    id: 2,
    business_name: 'Fruits Bio Nature',
    business_type: 'Fruits et légumes bio',
    is_verified: false,
    latitude: 8.9833,
    longitude: 1.1333,
    products_count: 15,
    user: {
      city: 'Sokodé',
      address: '22 Avenue des Fruits',
      phone: '+228 90 22 33 44',
    },
  },
  {
    id: 3,
    business_name: 'Boucherie Moderne',
    business_type: 'Viande et charcuterie',
    is_verified: true,
    latitude: 9.5511,
    longitude: 1.1861,
    products_count: 5,
    user: {
      city: 'Kara',
      address: '8 Boulevard Central',
      phone: '+228 90 33 44 55',
    },
  },
]

// Mock data - Products (matching Product type from types/index.ts)
const mockProducts = [
  {
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
    merchant: mockMerchants[0],
    created_at: '2025-10-20T10:00:00Z',
    is_active: true,
  },
  {
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
    merchant: mockMerchants[1],
    created_at: '2025-10-19T14:30:00Z',
    is_active: true,
  },
  {
    id: 3,
    name: 'Poulet fermier',
    description: 'Élevage local',
    original_price: '4000',
    discounted_price: '3200',
    quantity_available: 3,
    expiration_date: '2025-10-21T23:59:59Z',
    image_url: 'poulet.jpg',
    discount_percentage: 20,
    savings: 800,
    days_until_expiration: 1,
    category: { id: 3, name: 'Viande' },
    merchant: mockMerchants[2],
    created_at: '2025-10-20T08:00:00Z',
    is_active: true,
  },
]

// Mock categories
const mockCategories = [
  { id: 1, name: 'Boulangerie', description: 'Pains et viennoiseries' },
  { id: 2, name: 'Fruits et légumes', description: 'Produits frais' },
  { id: 3, name: 'Viande', description: 'Viandes et volailles' },
  { id: 4, name: 'Épicerie', description: 'Produits secs' },
]

// Create test store (matching real store structure from store/index.ts)
const createTestStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      auth: authSlice,
      connectivity: connectivitySlice,
      products: productsSlice,
      reservations: reservationsSlice,
      merchants: merchantsSlice,
      favorites: favoritesSlice,
      reviews: reviewsSlice,
    },
    preloadedState: {
      auth: {
        user: initialState.user || { id: 1, first_name: 'Test', last_name: 'User', email: 'test@test.com', role: 'consumer', city: 'Lomé', created_at: '2025-01-01', updated_at: '2025-01-01' },
        token: 'test-token',
        isAuthenticated: true,
        loading: false,
        error: null,
      },
      connectivity: {
        isConnected: true,
        isInternetReachable: true,
      },
      products: {
        products: initialState.products || mockProducts,
        categories: initialState.categories || mockCategories,
        loading: initialState.loading || false,
        loadingMore: initialState.loadingMore || false,
        error: initialState.error || null,
        filters: initialState.filters || {},
        currentPage: initialState.currentPage || 1,
        hasMore: initialState.hasMore !== undefined ? initialState.hasMore : true,
      },
      reservations: {
        reservations: [],
        loading: false,
        error: null,
      },
      merchants: {
        merchants: initialState.merchants || mockMerchants,
        loading: initialState.loading || false,
        error: initialState.error || null,
      },
      favorites: {
        favoriteIds: initialState.favoriteIds || [],
        favorites: initialState.favorites || [],
        loading: initialState.loading || false,
        error: initialState.error || null,
      },
      reviews: {
        reviews: [],
        stats: null,
        loading: false,
        error: null,
        currentPage: 1,
        totalPages: 1,
        hasMore: false,
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

describe('ProductsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering - Mode Toggle', () => {
    it('renders without crashing', () => {
      const { getByText } = renderWithProviders(
        <ProductsScreen navigation={mockNavigation} />
      )
      expect(getByText('Boutiques')).toBeTruthy()
      expect(getByText('Produits')).toBeTruthy()
    })

    it('renders in merchants mode by default', () => {
      const store = createTestStore()
      const { getByText } = renderWithProviders(
        <ProductsScreen navigation={mockNavigation} />,
        store
      )
      // Merchants should be displayed
      expect(getByText('Boulangerie Martin')).toBeTruthy()
    })

    it('switches to products mode when products button is pressed', async () => {
      const { getByText } = renderWithProviders(
        <ProductsScreen navigation={mockNavigation} />
      )

      const productsButton = getByText('Produits')
      fireEvent.press(productsButton)

      await waitFor(() => {
        expect(getByText('Pain complet artisanal')).toBeTruthy()
      })
    })

    it('switches back to merchants mode when boutiques button is pressed', async () => {
      const { getByText } = renderWithProviders(
        <ProductsScreen navigation={mockNavigation} />
      )

      // Switch to products
      const productsButton = getByText('Produits')
      fireEvent.press(productsButton)

      await waitFor(() => {
        expect(getByText('Pain complet artisanal')).toBeTruthy()
      })

      // Switch back to merchants
      const boutiquesButton = getByText('Boutiques')
      fireEvent.press(boutiquesButton)

      await waitFor(() => {
        expect(getByText('Boulangerie Martin')).toBeTruthy()
      })
    })
  })

  describe('Rendering - Merchants Mode', () => {
    it('displays all merchants in list', () => {
      const { getByText } = renderWithProviders(
        <ProductsScreen navigation={mockNavigation} />
      )

      expect(getByText('Boulangerie Martin')).toBeTruthy()
      expect(getByText('Fruits Bio Nature')).toBeTruthy()
      expect(getByText('Boucherie Moderne')).toBeTruthy()
    })

    it('displays merchant business types', () => {
      const { getByText } = renderWithProviders(
        <ProductsScreen navigation={mockNavigation} />
      )

      expect(getByText('Boulangerie artisanale')).toBeTruthy()
      expect(getByText('Fruits et légumes bio')).toBeTruthy()
      expect(getByText('Viande et charcuterie')).toBeTruthy()
    })

    it('displays merchant cities', () => {
      const { getByText } = renderWithProviders(
        <ProductsScreen navigation={mockNavigation} />
      )

      expect(getByText('Lomé')).toBeTruthy()
      expect(getByText('Sokodé')).toBeTruthy()
      expect(getByText('Kara')).toBeTruthy()
    })

    it('displays product count for each merchant', () => {
      const { getByText } = renderWithProviders(
        <ProductsScreen navigation={mockNavigation} />
      )

      expect(getByText('8 produits disponibles')).toBeTruthy()
      expect(getByText('15 produits disponibles')).toBeTruthy()
      expect(getByText('5 produits disponibles')).toBeTruthy()
    })
  })

  describe('Rendering - Products Mode', () => {
    it('displays all products in grid when in products mode', async () => {
      const { getByText } = renderWithProviders(
        <ProductsScreen navigation={mockNavigation} />
      )

      const productsButton = getByText('Produits')
      fireEvent.press(productsButton)

      await waitFor(() => {
        expect(getByText('Pain complet artisanal')).toBeTruthy()
        expect(getByText('Bananes mûres')).toBeTruthy()
        expect(getByText('Poulet fermier')).toBeTruthy()
      })
    })

    it('displays product prices correctly', async () => {
      const { getByText } = renderWithProviders(
        <ProductsScreen navigation={mockNavigation} />
      )

      fireEvent.press(getByText('Produits'))

      await waitFor(() => {
        expect(getByText('250 F CFA')).toBeTruthy()
        expect(getByText('150 F CFA')).toBeTruthy()
        expect(getByText('3,200 F CFA')).toBeTruthy()
      })
    })

    it('displays discount percentages', async () => {
      const { getAllByText } = renderWithProviders(
        <ProductsScreen navigation={mockNavigation} />
      )

      fireEvent.press(getAllByText('Produits')[0])

      await waitFor(() => {
        // Pain: (500-250)/500 = 50%
        expect(getAllByText('-50%').length).toBeGreaterThan(0)
      })
    })

    it('displays product quantities as badges', async () => {
      const { getByText } = renderWithProviders(
        <ProductsScreen navigation={mockNavigation} />
      )

      fireEvent.press(getByText('Produits'))

      await waitFor(() => {
        expect(getByText('10')).toBeTruthy() // Pain quantity
        expect(getByText('25')).toBeTruthy() // Bananas quantity
        expect(getByText('3')).toBeTruthy() // Chicken quantity
      })
    })

    it('displays merchant name and city for each product', async () => {
      const { getByText, getAllByText } = renderWithProviders(
        <ProductsScreen navigation={mockNavigation} />
      )

      fireEvent.press(getByText('Produits'))

      await waitFor(() => {
        expect(getAllByText(/Boulangerie Martin/i).length).toBeGreaterThan(0)
        expect(getAllByText(/Lomé/i).length).toBeGreaterThan(0)
      })
    })
  })

  describe('Search Functionality', () => {
    it('renders search input', () => {
      const { getByPlaceholderText } = renderWithProviders(
        <ProductsScreen navigation={mockNavigation} />
      )

      expect(getByPlaceholderText('Boutique, ville, type')).toBeTruthy()
    })

    it('filters merchants by business name', async () => {
      const { getByPlaceholderText, getByText, queryByText } = renderWithProviders(
        <ProductsScreen navigation={mockNavigation} />
      )

      const searchInput = getByPlaceholderText('Boutique, ville, type')
      fireEvent.changeText(searchInput, 'Boulangerie')

      await waitFor(() => {
        expect(getByText('Boulangerie Martin')).toBeTruthy()
        expect(queryByText('Fruits Bio Nature')).toBeFalsy()
      })
    })

    it('filters merchants by city', async () => {
      const { getByPlaceholderText, getByText, queryByText } = renderWithProviders(
        <ProductsScreen navigation={mockNavigation} />
      )

      const searchInput = getByPlaceholderText('Boutique, ville, type')
      fireEvent.changeText(searchInput, 'Lomé')

      await waitFor(() => {
        expect(getByText('Boulangerie Martin')).toBeTruthy()
        expect(queryByText('Fruits Bio Nature')).toBeFalsy()
        expect(queryByText('Boucherie Moderne')).toBeFalsy()
      })
    })

    it('filters products by product name in products mode', async () => {
      const { getByPlaceholderText, getByText, queryByText } = renderWithProviders(
        <ProductsScreen navigation={mockNavigation} />
      )

      fireEvent.press(getByText('Produits'))

      const searchInput = getByPlaceholderText('Boutique, ville, type')
      fireEvent.changeText(searchInput, 'Pain')

      await waitFor(() => {
        expect(getByText('Pain complet artisanal')).toBeTruthy()
        expect(queryByText('Bananes mûres')).toBeFalsy()
      })
    })

    it('shows empty state when search returns no results', async () => {
      const { getByPlaceholderText, getByText } = renderWithProviders(
        <ProductsScreen navigation={mockNavigation} />
      )

      const searchInput = getByPlaceholderText('Boutique, ville, type')
      fireEvent.changeText(searchInput, 'NonExistentMerchant')

      await waitFor(() => {
        expect(getByText('Aucune boutique trouvée')).toBeTruthy()
      })
    })
  })

  describe('Category Filtering', () => {
    it('renders category chips including "Tous"', () => {
      const { getByText } = renderWithProviders(
        <ProductsScreen navigation={mockNavigation} />
      )

      expect(getByText('Tous')).toBeTruthy()
      expect(getByText('Boulangerie')).toBeTruthy()
      expect(getByText('Fruits et légumes')).toBeTruthy()
      expect(getByText('Viande')).toBeTruthy()
    })

    it('filters products by category when chip is pressed', async () => {
      const { getByText, queryByText } = renderWithProviders(
        <ProductsScreen navigation={mockNavigation} />
      )

      // Switch to products mode
      fireEvent.press(getByText('Produits'))

      await waitFor(() => {
        expect(getByText('Pain complet artisanal')).toBeTruthy()
      })

      // Click on Boulangerie category
      const boulangerieChip = getByText('Boulangerie')
      fireEvent.press(boulangerieChip)

      await waitFor(() => {
        expect(getByText('Pain complet artisanal')).toBeTruthy()
        expect(queryByText('Bananes mûres')).toBeFalsy()
        expect(queryByText('Poulet fermier')).toBeFalsy()
      })
    })

    it('shows all items when "Tous" category is selected', async () => {
      const { getByText } = renderWithProviders(
        <ProductsScreen navigation={mockNavigation} />
      )

      fireEvent.press(getByText('Produits'))

      // First filter by category
      fireEvent.press(getByText('Boulangerie'))

      await waitFor(() => {
        expect(getByText('Pain complet artisanal')).toBeTruthy()
      })

      // Then click "Tous"
      fireEvent.press(getByText('Tous'))

      await waitFor(() => {
        expect(getByText('Pain complet artisanal')).toBeTruthy()
        expect(getByText('Bananes mûres')).toBeTruthy()
        expect(getByText('Poulet fermier')).toBeTruthy()
      })
    })

    it('filters merchants by category approximation', async () => {
      const { getByText, queryByText } = renderWithProviders(
        <ProductsScreen navigation={mockNavigation} />
      )

      // In merchants mode, filter by Boulangerie
      fireEvent.press(getByText('Boulangerie'))

      await waitFor(() => {
        expect(getByText('Boulangerie Martin')).toBeTruthy()
        expect(queryByText('Fruits Bio Nature')).toBeFalsy()
      })
    })
  })

  describe('Results Counter', () => {
    it('displays merchant count in merchants mode', async () => {
      const { getByText } = renderWithProviders(
        <ProductsScreen navigation={mockNavigation} />
      )

      await waitFor(() => {
        expect(getByText('3 boutiques trouvées')).toBeTruthy()
      })
    })

    it('displays product count in products mode', async () => {
      const { getByText } = renderWithProviders(
        <ProductsScreen navigation={mockNavigation} />
      )

      fireEvent.press(getByText('Produits'))

      await waitFor(() => {
        expect(getByText('3 produits trouvés')).toBeTruthy()
      })
    })

    it('updates count when filtering', async () => {
      const { getByText, getByPlaceholderText } = renderWithProviders(
        <ProductsScreen navigation={mockNavigation} />
      )

      const searchInput = getByPlaceholderText('Boutique, ville, type')
      fireEvent.changeText(searchInput, 'Boulangerie')

      await waitFor(() => {
        expect(getByText('1 boutique trouvée')).toBeTruthy()
      })
    })
  })

  describe('Reset Filters', () => {
    it('shows reset button when filters are active', async () => {
      const { getByText, getByPlaceholderText } = renderWithProviders(
        <ProductsScreen navigation={mockNavigation} />
      )

      const searchInput = getByPlaceholderText('Boutique, ville, type')
      fireEvent.changeText(searchInput, 'Test')

      await waitFor(() => {
        expect(getByText('Réinitialiser')).toBeTruthy()
      })
    })

    it('resets all filters when reset button is pressed', async () => {
      const { getByText, getByPlaceholderText } = renderWithProviders(
        <ProductsScreen navigation={mockNavigation} />
      )

      // Apply filters
      const searchInput = getByPlaceholderText('Boutique, ville, type')
      fireEvent.changeText(searchInput, 'Boulangerie')
      fireEvent.press(getByText('Boulangerie')) // Category filter

      await waitFor(() => {
        expect(getByText('Réinitialiser')).toBeTruthy()
      })

      // Reset filters
      fireEvent.press(getByText('Réinitialiser'))

      await waitFor(() => {
        expect(getByText('3 boutiques trouvées')).toBeTruthy()
      })
    })
  })

  describe('Navigation - Merchants Mode', () => {
    it('navigates to MerchantDetail when merchant card is pressed', async () => {
      const { getByText } = renderWithProviders(
        <ProductsScreen navigation={mockNavigation} />
      )

      const merchantCard = getByText('Boulangerie Martin')
      fireEvent.press(merchantCard)

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('MerchantDetail', { merchantId: 1 })
      })
    })
  })

  describe('Navigation - Products Mode', () => {
    it('navigates to ProductDetails when product card is pressed', async () => {
      const { getByText } = renderWithProviders(
        <ProductsScreen navigation={mockNavigation} />
      )

      fireEvent.press(getByText('Produits'))

      await waitFor(() => {
        const productCard = getByText('Pain complet artisanal')
        fireEvent.press(productCard)
      })

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('ProductDetails', { productId: 1 })
      })
    })
  })

  describe('Empty States', () => {
    it('shows empty state when no merchants match filters', async () => {
      const store = createTestStore({ merchants: [] })
      const { getByText } = renderWithProviders(
        <ProductsScreen navigation={mockNavigation} />,
        store
      )

      await waitFor(() => {
        expect(getByText('Aucune boutique trouvée')).toBeTruthy()
      })
    })

    it('shows empty state when no products match filters', async () => {
      const store = createTestStore({ products: [] })
      const { getByText } = renderWithProviders(
        <ProductsScreen navigation={mockNavigation} />,
        store
      )

      fireEvent.press(getByText('Produits'))

      await waitFor(() => {
        expect(getByText('Aucun produit trouvé')).toBeTruthy()
      })
    })

    it('shows reset button in empty state when filters active', async () => {
      const { getByText, getByPlaceholderText } = renderWithProviders(
        <ProductsScreen navigation={mockNavigation} />
      )

      const searchInput = getByPlaceholderText('Boutique, ville, type')
      fireEvent.changeText(searchInput, 'NonExistent')

      await waitFor(() => {
        expect(getByText('Réinitialiser les filtres')).toBeTruthy()
      })
    })
  })

  describe('Product Filtering - Stock', () => {
    it('only shows products with available stock', async () => {
      const productsWithoutStock = [
        ...mockProducts,
        {
          id: 4,
          name: 'Out of Stock Product',
          original_price: '100',
          discounted_price: '50',
          quantity_available: 0,
          category: { id: 1, name: 'Boulangerie' },
          merchant: { id: 1, business_name: 'Test', city: 'Test' },
        },
      ]

      const store = createTestStore({ products: productsWithoutStock })
      const { getByText, queryByText } = renderWithProviders(
        <ProductsScreen navigation={mockNavigation} />,
        store
      )

      fireEvent.press(getByText('Produits'))

      await waitFor(() => {
        expect(queryByText('Out of Stock Product')).toBeFalsy()
      })
    })
  })
})
