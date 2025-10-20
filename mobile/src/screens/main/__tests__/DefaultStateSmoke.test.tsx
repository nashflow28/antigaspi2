import React from 'react'
import { render, createTestStore } from '@test-utils'

import ProductsScreen from '../ProductsScreen'
import MerchantDetailScreen from '../MerchantDetailScreen'

const createNavigationMock = () => ({
  navigate: jest.fn(),
  goBack: jest.fn(),
  setOptions: jest.fn(),
})

describe('Default state smoke tests', () => {
  it('renders ProductsScreen and MerchantDetailScreen with default store', () => {
    const productsStore = createTestStore()
    productsStore.dispatch = jest.fn(() => Promise.resolve())

    expect(() =>
      render(<ProductsScreen navigation={createNavigationMock()} />, { store: productsStore })
    ).not.toThrow()

    const merchantStore = createTestStore()
    merchantStore.dispatch = jest.fn(() => Promise.resolve())

    expect(() =>
      render(
        <MerchantDetailScreen
          navigation={createNavigationMock()}
          route={{ params: { merchantId: 1 } }}
        />,
        { store: merchantStore }
      )
    ).not.toThrow()
  })
})
