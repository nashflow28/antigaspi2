/**
 * ProductsScreen - Intégration
 * Vérifie l’affichage des catégories et le fallback image produit
 */

import React from 'react'
import { Text } from 'react-native'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { render, fireEvent, waitFor } from '@testing-library/react-native'

import productsReducer from '../../store/slices/productsSlice'
import merchantsReducer from '../../store/slices/merchantsSlice'
import authReducer from '../../store/slices/authSlice'
import ProductsScreen from './ProductsScreen'
import { ThemeProvider } from '../../theme'

// Mock expo-image pour capturer l’URI
jest.mock('expo-image', () => ({
  Image: ({ source }: any) => {
    const uri = source?.uri || ''
    return React.createElement(Text as any, { testID: 'product-image' }, uri)
  },
}))

// Mock API_BASE_URL pour stabiliser les URLs si besoin
jest.mock('../../services/api', () => ({
  API_BASE_URL: 'http://example.com/api',
  __esModule: true,
  default: {
    // Éviter les requêtes réseau pendant le rendu (les thunks seront ignorés car nous préchargeons l’état)
    getProducts: jest.fn(),
    getCategories: jest.fn(),
    getMerchants: jest.fn(),
  },
}))

const makeStore = () =>
  configureStore({
    reducer: {
      auth: authReducer,
      products: productsReducer,
      merchants: merchantsReducer,
    },
    preloadedState: {
      auth: {
        user: {
          id: 1,
          email: 'u@test.com',
          role: 'consumer',
          first_name: 'Test',
          last_name: 'User',
          city: 'Lome',
          created_at: '2025-01-01',
          updated_at: '2025-01-01'
        },
        token: 't',
        isAuthenticated: true,
        loading: false,
        error: null,
      },
      products: {
        products: [
          {
            id: 101,
            name: 'Pain complet artisanal',
            description: 'Bio',
            original_price: '500',
            discounted_price: '250',
            quantity_available: 5,
            expiration_date: '2025-10-08',
            expiry_date: '2025-10-08',
            image_url: null, // force fallback
            discount_percentage: 50,
            savings: 250,
            days_until_expiration: 3,
            created_at: '2025-01-01',
            category: { id: 1, name: 'Boulangerie' },
            merchant: { id: 1, business_name: 'Boulangerie Martin', city: 'Lomé' },
          },
        ],
        categories: [
          { id: 1, name: 'Boulangerie' },
        ],
        loading: false,
        loadingMore: false,
        error: null,
        filters: {},
        currentPage: 1,
        hasMore: true,
      },
      merchants: {
        merchants: [],
        loading: false,
        error: null,
      },
    },
  })

describe('ProductsScreen - catégories & fallback image', () => {
  it('affiche les catégories et utilise un placeholder image pour produits sans image', async () => {
    const store = makeStore()
    const { getByText, getAllByTestId } = render(
      <Provider store={store}>
        <ThemeProvider>
          {/* Fournir une navigation minimale via un faux composant wrapper si nécessaire */}
          {/* Ici, ProductsScreen n’exige pas explicitement NavigationContainer pour le rendu de base */}
          <ProductsScreen navigation={{ navigate: jest.fn() }} />
        </ThemeProvider>
      </Provider>
    )

    // Passer en mode "Produits"
    fireEvent.press(getByText('Produits'))

    // Catégories visibles
    await waitFor(() => {
      expect(getByText('Boulangerie')).toBeTruthy()
    })

    // Image fallback (unsplash placeholder boulangerie)
    const images = getAllByTestId('product-image')
    // L’URI rendue doit contenir unsplash.com (placeholder boulangerie)
    const uriText = images[0].props.children as string
    expect(uriText).toContain('unsplash.com')
  })
})

