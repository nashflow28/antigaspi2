// @ts-nocheck
import React from 'react'
import HomeScreen from '../HomeScreen'
import {
  renderWithProviders,
  fireEvent,
  waitFor,
  createTestStore,
  buildProductsState,
  resetFixtures,
  makeMerchant,
  makeProduct,
} from '@test-utils'
import { fetchProducts, fetchCategories } from '../../../store/slices/productsSlice'

jest.mock('../../../store/slices/productsSlice', () => {
  const actual = jest.requireActual('../../../store/slices/productsSlice')
  return {
    ...actual,
    fetchProducts: jest.fn(() => ({ type: 'products/fetchProducts' })),
    fetchCategories: jest.fn(() => ({ type: 'products/fetchCategories' })),
  }
})

const mockNavigate = jest.fn()
const mockNavigation = {
  navigate: mockNavigate,
  goBack: jest.fn(),
  setOptions: jest.fn(),
}

const merchantMartin = makeMerchant({ id: 1, business_name: 'Boulangerie Martin' })
const merchantMarcheBio = makeMerchant({ id: 2, business_name: 'Marché Bio' })

const mockProducts = [
  makeProduct({
    id: 1,
    name: 'Pain complet artisanal',
    discounted_price: '250.00',
    original_price: '500.00',
    quantity_available: 15,
    days_until_expiration: 4,
    discount_percentage: 50,
    savings: 250,
    category: { id: 1, name: 'Boulangerie', description: 'Produits de boulangerie' },
    merchant: merchantMartin,
  }),
  makeProduct({
    id: 2,
    name: 'Bananes mûres',
    discounted_price: '150.00',
    original_price: '300.00',
    quantity_available: 10,
    days_until_expiration: 2,
    discount_percentage: 50,
    savings: 150,
    category: { id: 2, name: 'Fruits et Légumes', description: 'Fruits et légumes frais' },
    merchant: merchantMarcheBio,
  }),
]

const mockCategories = [
  { id: 1, name: 'Boulangerie', description: 'Produits de boulangerie' },
  { id: 2, name: 'Fruits et Légumes', description: 'Fruits et légumes frais' },
]

const buildStore = (productsStateOverrides = {}) =>
  createTestStore({
    products: buildProductsState({
      products: mockProducts,
      categories: mockCategories,
      loading: false,
      loadingMore: false,
      error: null,
      hasMore: false,
      ...productsStateOverrides,
    }),
  })

const renderScreen = ({ productsState, store }: { productsState?: object; store?: ReturnType<typeof createTestStore> } = {}) => {
  const resolvedStore = store ?? buildStore(productsState)
  const utils = renderWithProviders(<HomeScreen navigation={mockNavigation} />, { store: resolvedStore })
  return { store: resolvedStore, ...utils }
}

describe('HomeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    resetFixtures()
  })

  describe('Rendering', () => {
    it('dispatches initial product and category fetches on mount', async () => {
      const store = buildStore()
      const dispatchSpy = jest.spyOn(store, 'dispatch')
      const { getByText } = renderScreen({ store })

      expect(getByText(/Tous/i)).toBeTruthy()

      await waitFor(() => {
        expect(fetchProducts).toHaveBeenCalledWith({ per_page: 100 })
        expect(fetchCategories).toHaveBeenCalled()
        expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({ type: 'products/fetchProducts' }))
      })

      dispatchSpy.mockRestore()
    })

    it('displays products with merchant details and pricing information', () => {
      const { getByText, getAllByText } = renderScreen()

      expect(getByText('Pain complet artisanal')).toBeTruthy()
      expect(getByText('Boulangerie Martin')).toBeTruthy()
      expect(getByText('Bananes mûres')).toBeTruthy()
      expect(getByText('Marché Bio')).toBeTruthy()
      expect(getAllByText(/F CFA/i).length).toBeGreaterThan(0)
      expect(getAllByText(/-50%/i).length).toBeGreaterThan(0)
    })

    it('shows "Tous" category by default with the product count', () => {
      const { getByText } = renderScreen()

      expect(getByText(/Tous \(\d+\)/i)).toBeTruthy()
    })
  })

  describe('Navigation', () => {
    it('navigates to ProductDetails when a product is pressed', async () => {
      const { getByText } = renderScreen()

      fireEvent.press(getByText('Pain complet artisanal'))

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('ProductDetails', { productId: 1 })
      })
    })
  })

  describe('Category Filtering', () => {
    it('filters products by category when a category chip is pressed', async () => {
      const { getByText, queryByText } = renderScreen()

      fireEvent.press(getByText(/Boulangerie \(/i))

      await waitFor(() => {
        expect(getByText('Pain complet artisanal')).toBeTruthy()
        expect(queryByText('Bananes mûres')).toBeNull()
      })
    })

    it('shows all products again when the "Tous" chip is pressed', async () => {
      const { getByText } = renderScreen()

      fireEvent.press(getByText(/Boulangerie \(/i))
      fireEvent.press(getByText(/Tous \(\d+\)/i))

      await waitFor(() => {
        expect(getByText('Pain complet artisanal')).toBeTruthy()
        expect(getByText('Bananes mûres')).toBeTruthy()
      })
    })
  })

  describe('Empty and Loading States', () => {
    it('shows empty state when no products are available', () => {
      const { getByText } = renderScreen({ productsState: { products: [] } })

      expect(getByText('Aucun produit disponible')).toBeTruthy()
    })

    it('shows empty category guidance when a category has no products', async () => {
      const extraCategory = { id: 3, name: 'Poissons', description: 'Produits de la mer' }
      const { getByText } = renderScreen({
        productsState: {
          categories: [...mockCategories, extraCategory],
        },
      })

      fireEvent.press(getByText(/Poissons \(0\)/i))

      await waitFor(() => {
        expect(getByText('Aucun produit dans cette catégorie')).toBeTruthy()
        expect(getByText('Voir tous les produits')).toBeTruthy()
      })
    })

    it('surfaces API errors through the toast handler', async () => {
      const showError = jest.fn()
      const toastModule = require('../../../contexts/ToastContext')
      const toastSpy = jest.spyOn(toastModule, 'useToast').mockReturnValue({ showError })

      fetchProducts.mockImplementationOnce(() => () => Promise.reject(new Error('network')))

      const store = buildStore()
      renderScreen({ store })

      await waitFor(() => {
        expect(showError).toHaveBeenCalledWith(expect.stringMatching(/Impossible de charger/i))
      })

      toastSpy.mockRestore()
    })
  })

  describe('Product Information Display', () => {
    it('shows time slots alongside original and discounted pricing', () => {
      const { getAllByText, getByText } = renderScreen()

      expect(getAllByText(/Aujourd'hui entre/i).length).toBeGreaterThan(0)
      expect(getByText('500 F CFA')).toBeTruthy()
      expect(getByText('300 F CFA')).toBeTruthy()
    })

    it('shows merchant location for each product', () => {
      const { getAllByText } = renderScreen()

      expect(getAllByText(/Lomé/).length).toBeGreaterThan(0)
    })
  })
})
