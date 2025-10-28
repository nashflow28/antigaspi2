import React from 'react'
import ProductDetailsScreen from '../ProductDetailsScreen'
import {
  render,
  waitFor,
  fireEvent,
  createTestStore,
  createTestProduct,
  createTestUser,
  createMockNavigation,
  createMockRoute,
} from '@test-utils'
import { TEST_IDS } from '../../../utils/testIds'
import { fetchProduct } from '../../../store/slices/productsSlice'

const mockProduct = createTestProduct({
  id: 42,
  name: 'Pain complet artisanal',
  discounted_price: '250',
  original_price: '500',
  quantity_available: 5,
  merchant: {
    id: 12,
    business_name: 'Boulangerie Martin',
    business_type: 'Boulangerie',
    city: 'Lomé',
    phone: '+228 90 98 76 54',
    is_verified: true,
    address: '456 Avenue du Commerce',
  },
})

jest.mock('../../../store/slices/productsSlice', () => {
  const actual = jest.requireActual('../../../store/slices/productsSlice')
  const mockFetchProduct: any = jest.fn((productId: number) => async () => ({
    type: 'products/fetchProduct/fulfilled',
    payload: mockProduct,
    meta: { arg: productId },
  }))

  mockFetchProduct.fulfilled = {
    match: (action: { type: string }) => action.type === 'products/fetchProduct/fulfilled',
  }
  mockFetchProduct.rejected = {
    match: (action: { type: string }) => action.type === 'products/fetchProduct/rejected',
  }

  return {
    __esModule: true,
    ...actual,
    fetchProduct: mockFetchProduct,
  }
})

jest.mock('../../../store/slices/reviewsSlice', () => {
  const actual = jest.requireActual('../../../store/slices/reviewsSlice')

  return {
    __esModule: true,
    ...actual,
    fetchReviewStats: jest.fn(() => ({ type: 'reviews/fetchStats/fulfilled' })),
  }
})

const renderScreen = (options: {
  product?: typeof mockProduct
  productInStore?: boolean
  loading?: boolean
  reviewsStats?: { average_rating: number; total_reviews: number; verified_reviews: number; rating_distribution: Array<{ rating: number; count: number; percentage: number }> } | null
  cartItemsCount?: number
  cartUpdating?: boolean
  isAuthenticated?: boolean
  navigation?: ReturnType<typeof createMockNavigation>
} = {}) => {
  const {
    product = mockProduct,
    productInStore = true,
    loading = false,
    reviewsStats = { average_rating: 4.7, total_reviews: 12, verified_reviews: 8, rating_distribution: [] },
    cartItemsCount = 0,
    cartUpdating = false,
    isAuthenticated = false,
    navigation = createMockNavigation(),
  } = options

  const store = createTestStore({
    products: {
      products: productInStore ? [product] : [],
      loading,
      loadingMore: false,
      hasMore: false,
      error: null,
      filters: {},
      currentPage: 1,
    },
    reviews: {
      stats: reviewsStats,
    },
    cart: {
      cart:
        cartItemsCount > 0
          ? {
              id: 1,
              total_amount: Number(product.discounted_price) * cartItemsCount,
              items_count: cartItemsCount,
              items: [],
            }
          : null,
      updating: cartUpdating,
    },
    auth: isAuthenticated
      ? {
          user: createTestUser({ id: 77 }),
          token: 'token',
          isAuthenticated: true,
          loading: false,
          error: null,
        }
      : undefined,
  })

  const route = createMockRoute({ productId: product.id })

  const rendered = render(
    <ProductDetailsScreen navigation={navigation} route={route} />,
    { store }
  )

  return { ...rendered, store, navigation, route, product }
}

describe('ProductDetailsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('loads product data when it is missing locally', async () => {
    const { getByText } = renderScreen({ productInStore: false })

    await waitFor(() => {
      expect(fetchProduct).toHaveBeenCalledWith(mockProduct.id)
    })

    await waitFor(() => {
      expect(getByText('Pain complet artisanal')).toBeTruthy()
    })
  })

  it('displays core product information and pricing', async () => {
    const { getByText } = renderScreen()

    await waitFor(() => {
      expect(getByText('Pain complet artisanal')).toBeTruthy()
      expect(getByText(/Boulangerie Martin/i)).toBeTruthy()
      expect(getByText(/Lomé/i)).toBeTruthy()
      expect(getByText('250 F CFA × 1')).toBeTruthy()
      expect(getByText('-50%')).toBeTruthy()
      expect(getByText('500 F CFA')).toBeTruthy()
    })
  })

  it('shows payment options and switches selection', () => {
    const { getByText, getAllByText, queryByText } = renderScreen()

    expect(getByText('Sur place')).toBeTruthy()
    expect(getByText(/Total à payer/i)).toBeTruthy()

    fireEvent.press(getByText('Mobile Money'))
    expect(getByText(/opérateur mobile/i)).toBeTruthy()

    fireEvent.press(getByText('Carte bancaire'))
    expect(getAllByText(/Paystack/i).length).toBeGreaterThan(0)
    expect(queryByText(/opérateur mobile/i)).toBeNull()
  })

  it('updates quantity within available bounds', () => {
    const { getByTestId, getByText } = renderScreen()

    expect(getByTestId(TEST_IDS.quantityValue).props.children).toBe(1)
    fireEvent.press(getByTestId(TEST_IDS.increaseQuantityButton))
    expect(getByTestId(TEST_IDS.quantityValue).props.children).toBe(2)
    expect(getByText('250 F CFA × 2')).toBeTruthy()

    fireEvent.press(getByTestId(TEST_IDS.decreaseQuantityButton))
    expect(getByTestId(TEST_IDS.quantityValue).props.children).toBe(1)
  })

  it('shows cart badge when items are present', () => {
    const navigation = createMockNavigation()
    const { getByText } = renderScreen({ cartItemsCount: 3, navigation })

    expect(getByText('3')).toBeTruthy()
  })

  it('navigates to cart when cart icon is pressed', () => {
    const navigation = createMockNavigation()
    const { getByLabelText } = renderScreen({ navigation })

    fireEvent.press(getByLabelText('Voir mon panier'))
    expect(navigation.navigate).toHaveBeenCalledWith('Orders')
  })

  it('renders favorite button when user is authenticated', () => {
    const { getByTestId } = renderScreen({ isAuthenticated: true })

    expect(getByTestId(TEST_IDS.favoriteButton)).toBeTruthy()
  })

  it('disables actions when product is out of stock', () => {
    const soldOutProduct = createTestProduct({ quantity_available: 0 })
    const { getAllByText, getByTestId } = renderScreen({ product: soldOutProduct })

    expect(getAllByText('Rupture de stock').length).toBeGreaterThan(0)
    expect(getByTestId(TEST_IDS.addToCartButton).props.accessibilityState?.disabled).toBe(true)
    expect(getByTestId(TEST_IDS.reserveButton).props.accessibilityState?.disabled).toBe(true)
  })

  it('shows loading state while fetching', () => {
    const navigation = createMockNavigation()
    const { getByText, getByTestId } = renderScreen({
      productInStore: false,
      loading: true,
      navigation,
    })

    expect(getByTestId(TEST_IDS.loadingSpinner)).toBeTruthy()
    expect(getByText('Chargement...')).toBeTruthy()
  })
})
