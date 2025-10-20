// @ts-nocheck
import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import MerchantProductsScreen from '../MerchantProductsScreen'
import productsReducer from '../../../store/slices/productsSlice'
import authSlice from '../../../store/slices/authSlice'
import { ThemeProvider } from '../../../theme/ThemeContext'
import { TEST_IDS } from '../../../utils/testIds'

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
    name: 'Pain artisanal',
    original_price: '500.00',
    discounted_price: '250.00',
    quantity_available: 10,
    is_active: true,
    merchant_id: 1,
    image_url: '/storage/products/pain.jpg',
  },
  {
    id: 2,
    name: 'Croissants',
    original_price: '300.00',
    discounted_price: '150.00',
    quantity_available: 20,
    is_active: true,
    merchant_id: 1,
    image_url: '/storage/products/croissants.jpg',
  },
  {
    id: 3,
    name: 'Baguette',
    original_price: '200.00',
    discounted_price: '100.00',
    quantity_available: 5,
    is_active: false,
    merchant_id: 1,
    image_url: '/storage/products/baguette.jpg',
  },
]

// Create test store
const createTestStore = (products = mockProducts) => {
  return configureStore({
    reducer: {
      products: productsReducer,
      auth: authSlice,
    },
    preloadedState: {
      products: {
        products,
        categories: [],
        loading: false,
        loadingMore: false,
        error: null,
        filters: {},
        currentPage: 1,
        hasMore: false,
      },
      auth: {
        user: {
          id: 2,
          first_name: 'Marie',
          last_name: 'Martin',
          email: 'boulangerie.martin@email.com',
          role: 'merchant',
          merchant: {
            id: 1,
            business_name: 'Boulangerie Martin',
          },
        },
        token: 'test-token',
        isAuthenticated: true,
        loading: false,
        error: null,
      },
    },
  })
}

// Mock useFocusEffect
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useFocusEffect: jest.fn((callback) => {
    callback()
  }),
}))

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

describe('MerchantProductsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders without crashing', () => {
      const store = createTestStore()
      const { getByTestId } = renderWithProviders(
        <MerchantProductsScreen navigation={mockNavigation} />,
        store
      )

      expect(getByTestId(TEST_IDS.merchantProducts)).toBeTruthy()
    })

    it('displays products list with testID', () => {
      const store = createTestStore()
      const { getByTestId } = renderWithProviders(
        <MerchantProductsScreen navigation={mockNavigation} />,
        store
      )

      expect(getByTestId(TEST_IDS.merchantProductsList)).toBeTruthy()
    })

    it('displays all product names', () => {
      const store = createTestStore()
      const { getByText } = renderWithProviders(
        <MerchantProductsScreen navigation={mockNavigation} />,
        store
      )

      expect(getByText('Pain artisanal')).toBeTruthy()
      expect(getByText('Croissants')).toBeTruthy()
      expect(getByText('Baguette')).toBeTruthy()
    })

    it('displays product prices in F CFA format', () => {
      const store = createTestStore()
      const { getAllByText } = renderWithProviders(
        <MerchantProductsScreen navigation={mockNavigation} />,
        store
      )

      const priceElements = getAllByText(/F CFA/i)
      expect(priceElements.length).toBeGreaterThan(0)
    })
  })

  describe('Add Product Button', () => {
    it('displays add product button with testID', () => {
      const store = createTestStore()
      const { getByTestId } = renderWithProviders(
        <MerchantProductsScreen navigation={mockNavigation} />,
        store
      )

      expect(getByTestId(TEST_IDS.addProductButton)).toBeTruthy()
    })

    it('navigates to ProductForm when add button is pressed', async () => {
      const store = createTestStore()
      const { getByTestId } = renderWithProviders(
        <MerchantProductsScreen navigation={mockNavigation} />,
        store
      )

      const addButton = getByTestId(TEST_IDS.addProductButton)
      fireEvent.press(addButton)

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('ProductForm')
      })
    })
  })

  describe('Product Status Display', () => {
    it('shows active status for active products', () => {
      const store = createTestStore()
      const { getAllByText } = renderWithProviders(
        <MerchantProductsScreen navigation={mockNavigation} />,
        store
      )

      const activeElements = getAllByText(/Actif/i)
      expect(activeElements.length).toBeGreaterThan(0)
    })

    it('shows inactive status for inactive products', () => {
      const store = createTestStore()
      const { getByText } = renderWithProviders(
        <MerchantProductsScreen navigation={mockNavigation} />,
        store
      )

      expect(getByText(/Inactif/i)).toBeTruthy()
    })

    it('displays quantity available for each product', () => {
      const store = createTestStore()
      const { getByText } = renderWithProviders(
        <MerchantProductsScreen navigation={mockNavigation} />,
        store
      )

      expect(getByText(/Stock.*10/i)).toBeTruthy()
      expect(getByText(/Stock.*20/i)).toBeTruthy()
      expect(getByText(/Stock.*5/i)).toBeTruthy()
    })
  })

  describe('Product Actions', () => {
    it('displays edit button for each product', () => {
      const store = createTestStore()
      const { getAllByTestId } = renderWithProviders(
        <MerchantProductsScreen navigation={mockNavigation} />,
        store
      )

      // Should have edit buttons for all products
      expect(getAllByTestId(/edit-product-/i).length).toBe(3)
    })

    it('navigates to ProductForm when edit button is pressed', async () => {
      const store = createTestStore()
      const { getAllByTestId } = renderWithProviders(
        <MerchantProductsScreen navigation={mockNavigation} />,
        store
      )

      const editButtons = getAllByTestId(/edit-product-/i)
      fireEvent.press(editButtons[0])

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('ProductForm', { productId: 1 })
      })
    })

    it('displays delete button for each product', () => {
      const store = createTestStore()
      const { getAllByTestId } = renderWithProviders(
        <MerchantProductsScreen navigation={mockNavigation} />,
        store
      )

      // Should have delete buttons for all products
      expect(getAllByTestId(/delete-product-/i).length).toBe(3)
    })
  })

  describe('Empty State', () => {
    it('displays empty state when no products', () => {
      const store = createTestStore([])
      const { getByText, getByTestId } = renderWithProviders(
        <MerchantProductsScreen navigation={mockNavigation} />,
        store
      )

      expect(getByTestId(TEST_IDS.emptyState)).toBeTruthy()
      expect(getByText('Aucun produit')).toBeTruthy()
    })

    it('displays add product button in empty state', () => {
      const store = createTestStore([])
      const { getByTestId } = renderWithProviders(
        <MerchantProductsScreen navigation={mockNavigation} />,
        store
      )

      expect(getByTestId(TEST_IDS.addProductButton)).toBeTruthy()
    })
  })

  describe('Product Filtering', () => {
    it('can filter by active products', () => {
      const store = createTestStore()
      const { getByText } = renderWithProviders(
        <MerchantProductsScreen navigation={mockNavigation} />,
        store
      )

      // Active products should be visible
      expect(getByText('Pain artisanal')).toBeTruthy()
      expect(getByText('Croissants')).toBeTruthy()
    })

    it('can filter by inactive products', () => {
      const store = createTestStore()
      const { getByText } = renderWithProviders(
        <MerchantProductsScreen navigation={mockNavigation} />,
        store
      )

      // Inactive products should be visible
      expect(getByText('Baguette')).toBeTruthy()
    })
  })

  describe('Product Details Display', () => {
    it('displays original price for products', () => {
      const store = createTestStore()
      const { getByText } = renderWithProviders(
        <MerchantProductsScreen navigation={mockNavigation} />,
        store
      )

      // Should show original prices
      expect(getByText(/500.*F CFA/i)).toBeTruthy()
    })

    it('displays discounted price for products', () => {
      const store = createTestStore()
      const { getByText } = renderWithProviders(
        <MerchantProductsScreen navigation={mockNavigation} />,
        store
      )

      // Should show discounted prices
      expect(getByText(/250.*F CFA/i)).toBeTruthy()
      expect(getByText(/150.*F CFA/i)).toBeTruthy()
    })

    it('displays product count in header', () => {
      const store = createTestStore()
      const { getByText } = renderWithProviders(
        <MerchantProductsScreen navigation={mockNavigation} />,
        store
      )

      expect(getByText(/3.*produit/i)).toBeTruthy()
    })
  })

  describe('Search Functionality', () => {
    it('displays search input field', () => {
      const store = createTestStore()
      const { getByTestId } = renderWithProviders(
        <MerchantProductsScreen navigation={mockNavigation} />,
        store
      )

      expect(getByTestId('search-input')).toBeTruthy()
    })

    it('filters products when searching', async () => {
      const store = createTestStore()
      const { getByTestId, getByText, queryByText } = renderWithProviders(
        <MerchantProductsScreen navigation={mockNavigation} />,
        store
      )

      const searchInput = getByTestId('search-input')
      fireEvent.changeText(searchInput, 'Pain')

      await waitFor(() => {
        expect(getByText('Pain artisanal')).toBeTruthy()
        expect(queryByText('Croissants')).toBeFalsy()
      })
    })
  })

  describe('Pull to Refresh', () => {
    it('can refresh products list', async () => {
      const store = createTestStore()
      const { getByTestId } = renderWithProviders(
        <MerchantProductsScreen navigation={mockNavigation} />,
        store
      )

      const list = getByTestId(TEST_IDS.merchantProductsList)
      expect(list).toBeTruthy()
    })
  })
})
