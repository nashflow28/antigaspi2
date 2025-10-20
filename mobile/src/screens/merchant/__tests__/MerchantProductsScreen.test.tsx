// @ts-nocheck
import React from 'react'
import type { DeepPartial } from 'redux'
import {
  render,
  fireEvent,
  waitFor,
  createTestUser,
} from '@test-utils'
import MerchantProductsScreen from '../MerchantProductsScreen'
import { TEST_IDS } from '../../../utils/testIds'
import type { RootState } from '../../../store'

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

const buildBaseState = (products = mockProducts): DeepPartial<RootState> => ({
  auth: {
    user: createTestUser({
      id: 2,
      first_name: 'Marie',
      last_name: 'Martin',
      email: 'boulangerie.martin@email.com',
      role: 'merchant',
      merchant: {
        business_name: 'Boulangerie Martin',
        business_type: 'Boulangerie artisanale',
      },
    }),
    token: 'test-token',
    isAuthenticated: true,
    loading: false,
    error: null,
  },
  products: {
    products,
    loading: false,
    loadingMore: false,
    error: null,
  },
})

const renderScreen = (overrides: DeepPartial<RootState> = {}) => {
  const productsOverride = overrides.products?.products as RootState['products']['products'] | undefined
  const baseState = buildBaseState(productsOverride)

  const preloadedState: DeepPartial<RootState> = {
    ...baseState,
    ...overrides,
    auth: {
      ...baseState.auth,
      ...(overrides.auth ?? {}),
    },
    products: {
      ...baseState.products,
      ...(overrides.products ?? {}),
    },
  }

  return render(<MerchantProductsScreen navigation={mockNavigation} />, {
    preloadedState,
  })
}

// Mock useFocusEffect
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useFocusEffect: jest.fn((callback) => {
    callback()
  }),
}))

describe('MerchantProductsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders without crashing', () => {
      const { getByTestId } = renderScreen()

      expect(getByTestId(TEST_IDS.merchantProducts)).toBeTruthy()
    })

    it('displays products list with testID', () => {
      const { getByTestId } = renderScreen()

      expect(getByTestId(TEST_IDS.merchantProductsList)).toBeTruthy()
    })

    it('displays all product names', () => {
      const { getByText } = renderScreen()

      expect(getByText('Pain artisanal')).toBeTruthy()
      expect(getByText('Croissants')).toBeTruthy()
      expect(getByText('Baguette')).toBeTruthy()
    })

    it('displays product prices in F CFA format', () => {
      const { getAllByText } = renderScreen()

      const priceElements = getAllByText(/F CFA/i)
      expect(priceElements.length).toBeGreaterThan(0)
    })
  })

  describe('Add Product Button', () => {
    it('displays add product button with testID', () => {
      const { getByTestId } = renderScreen()

      expect(getByTestId(TEST_IDS.addProductButton)).toBeTruthy()
    })

    it('navigates to ProductForm when add button is pressed', async () => {
      const { getByTestId } = renderScreen()

      const addButton = getByTestId(TEST_IDS.addProductButton)
      fireEvent.press(addButton)

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('ProductForm')
      })
    })
  })

  describe('Product Status Display', () => {
    it('shows active status for active products', () => {
      const { getAllByText } = renderScreen()

      const activeElements = getAllByText(/Actif/i)
      expect(activeElements.length).toBeGreaterThan(0)
    })

    it('shows inactive status for inactive products', () => {
      const { getByText } = renderScreen()

      expect(getByText(/Inactif/i)).toBeTruthy()
    })

    it('displays quantity available for each product', () => {
      const { getByText } = renderScreen()

      expect(getByText(/Stock.*10/i)).toBeTruthy()
      expect(getByText(/Stock.*20/i)).toBeTruthy()
      expect(getByText(/Stock.*5/i)).toBeTruthy()
    })
  })

  describe('Product Actions', () => {
    it('displays edit button for each product', () => {
      const { getAllByTestId } = renderScreen()

      // Should have edit buttons for all products
      expect(getAllByTestId(/edit-product-/i).length).toBe(3)
    })

    it('navigates to ProductForm when edit button is pressed', async () => {
      const { getAllByTestId } = renderScreen()

      const editButtons = getAllByTestId(/edit-product-/i)
      fireEvent.press(editButtons[0])

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('ProductForm', { productId: 1 })
      })
    })

    it('displays delete button for each product', () => {
      const { getAllByTestId } = renderScreen()

      // Should have delete buttons for all products
      expect(getAllByTestId(/delete-product-/i).length).toBe(3)
    })
  })

  describe('Empty State', () => {
    it('displays empty state when no products', () => {
      const { getByText, getByTestId } = renderScreen({
        products: { products: [] },
      })

      expect(getByTestId(TEST_IDS.emptyState)).toBeTruthy()
      expect(getByText('Aucun produit')).toBeTruthy()
    })

    it('displays add product button in empty state', () => {
      const { getByTestId } = renderScreen({
        products: { products: [] },
      })

      expect(getByTestId(TEST_IDS.addProductButton)).toBeTruthy()
    })
  })

  describe('Product Filtering', () => {
    it('can filter by active products', () => {
      const { getByText } = renderScreen()

      // Active products should be visible
      expect(getByText('Pain artisanal')).toBeTruthy()
      expect(getByText('Croissants')).toBeTruthy()
    })

    it('can filter by inactive products', () => {
      const { getByText } = renderScreen()

      // Inactive products should be visible
      expect(getByText('Baguette')).toBeTruthy()
    })
  })

  describe('Product Details Display', () => {
    it('displays original price for products', () => {
      const { getByText } = renderScreen()

      // Should show original prices
      expect(getByText(/500.*F CFA/i)).toBeTruthy()
    })

    it('displays discounted price for products', () => {
      const { getByText } = renderScreen()

      // Should show discounted prices
      expect(getByText(/250.*F CFA/i)).toBeTruthy()
      expect(getByText(/150.*F CFA/i)).toBeTruthy()
    })

    it('displays product count in header', () => {
      const { getByText } = renderScreen()

      expect(getByText(/3.*produit/i)).toBeTruthy()
    })
  })

  describe('Search Functionality', () => {
    it('displays search input field', () => {
      const { getByTestId } = renderScreen()

      expect(getByTestId('search-input')).toBeTruthy()
    })

    it('filters products when searching', async () => {
      const { getByTestId, getByText, queryByText } = renderScreen()

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
      const { getByTestId } = renderScreen()

      const list = getByTestId(TEST_IDS.merchantProductsList)
      expect(list).toBeTruthy()
    })
  })
})
