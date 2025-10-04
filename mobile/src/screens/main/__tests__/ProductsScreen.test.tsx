import React from 'react'
import { render, waitFor } from '@testing-library/react-native'
import { useDispatch, useSelector } from 'react-redux'

import ProductsScreen from '../ProductsScreen'
import { ThemeProvider } from '../../../theme/ThemeContext'

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}))

jest.mock('expo-image', () => ({
  Image: 'Image',
}))

jest.mock('../../../services/analyticsService', () => ({
  trackError: jest.fn(),
  track: jest.fn(),
}))

jest.mock('../../../utils/errorHandling', () => ({
  showErrorAlert: jest.fn(),
}))

jest.mock('../../../utils/imageHelpers', () => ({
  getImageUrl: jest.fn((url: string) => url),
}))

jest.mock('../../../store/slices/productsSlice', () => ({
  fetchProducts: jest.fn(() => ({ type: 'products/fetch' })),
  fetchCategories: jest.fn(() => ({ type: 'products/fetchCategories' })),
  setFilters: jest.fn((filters: unknown) => ({ type: 'products/setFilters', payload: filters })),
  clearFilters: jest.fn(() => ({ type: 'products/clearFilters' })),
  fetchMoreProducts: jest.fn(() => ({ type: 'products/fetchMore' })),
  resetProducts: jest.fn(() => ({ type: 'products/reset' })),
}))

jest.mock('react-redux', () => ({
  useDispatch: jest.fn(),
  useSelector: jest.fn(),
}))

describe('ProductsScreen filters', () => {
  const mockNavigation = { navigate: jest.fn() }

  const renderScreen = () =>
    render(
      <ThemeProvider>
        <ProductsScreen navigation={mockNavigation} />
      </ThemeProvider>
    )

  beforeEach(() => {
    jest.clearAllMocks()

    const dispatchMock = jest.fn(() => Promise.resolve())
    ;(useDispatch as jest.Mock).mockReturnValue(dispatchMock)

    const mockProductsState = {
      products: [],
      categories: [],
      loading: false,
      loadingMore: false,
      filters: {},
      currentPage: 1,
      hasMore: false,
    }

    ;(useSelector as jest.Mock).mockImplementation((selector: (state: unknown) => unknown) =>
      selector({ products: mockProductsState })
    )
  })

  it('does not render filter badge when no active filters are applied', async () => {
    const { queryByTestId } = renderScreen()

    await waitFor(() => {
      expect(queryByTestId('active-filter-badge')).toBeNull()
    })
  })
})
