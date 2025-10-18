/**
 * ProductsScreen - Test d'intégration REFACTORISÉ
 *
 * AMÉLIORATIONS vs version originale:
 * ✅ Utilise renderWithProviders (plus besoin de wrapper manuel)
 * ✅ Utilise les factories pour données complètes (pas d'erreurs TypeScript)
 * ✅ Store configuré automatiquement avec tous les reducers
 * ✅ Pas de duplication de configuration
 */

import React from 'react'
import { fireEvent, waitFor } from '@testing-library/react-native'

// 🎯 Import des utilitaires de test centralisés
import { render, createTestStore } from '../../test-utils/test-utils'
import {
  createTestUser,
  createTestProduct,
  createTestCategory,
  createTestMerchant
} from '../../test-utils/factories'

import ProductsScreen from './ProductsScreen'

// Mock expo-image pour capturer l'URI
jest.mock('expo-image', () => {
  const React = require('react')
  const { Text } = require('react-native')
  return {
    Image: ({ source }: any) => {
      const uri = source?.uri || ''
      return React.createElement(Text, { testID: 'product-image' }, uri)
    },
  }
})

// Mock API pour éviter requêtes réseau
jest.mock('../../services/api', () => ({
  API_BASE_URL: 'http://example.com/api',
  __esModule: true,
  default: {
    getProducts: jest.fn(),
    getCategories: jest.fn(),
    getMerchants: jest.fn(),
  },
}))

describe('ProductsScreen - Refactorisé avec test-utils', () => {
  it('affiche les catégories et utilise un placeholder image pour produits sans image', async () => {
    // ✅ AVANT: Configuration manuelle complexe avec types incomplets
    // ✅ APRÈS: Utilisation des factories avec types complets

    const store = createTestStore({
      auth: {
        user: createTestUser({ role: 'consumer' }), // Tous les champs requis automatiquement
        token: 't',
        isAuthenticated: true,
        loading: false,
        error: null,
      },
      products: {
        products: [
          createTestProduct({
            id: 101,
            name: 'Pain complet artisanal',
            image_url: null, // Force fallback image
            category: createTestCategory({ id: 1, name: 'Boulangerie' }),
            merchant: createTestMerchant({ id: 1, business_name: 'Boulangerie Martin' }) as any,
          }),
        ],
        categories: [
          createTestCategory({ id: 1, name: 'Boulangerie' }),
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
    })

    // ✅ AVANT: Wrapper manuel avec Provider + ThemeProvider
    // ✅ APRÈS: renderWithProviders fait tout automatiquement
    const { getByText, getAllByTestId } = render(
      <ProductsScreen navigation={{ navigate: jest.fn() }} />,
      { store }
    )

    // Passer en mode "Produits"
    fireEvent.press(getByText('Produits'))

    // Catégories visibles
    await waitFor(() => {
      expect(getByText('Boulangerie')).toBeTruthy()
    })

    // Image fallback (unsplash placeholder boulangerie)
    const images = getAllByTestId('product-image')
    const uriText = images[0].props.children as string
    expect(uriText).toContain('unsplash.com')
  })

  it('filtre les produits par catégorie sélectionnée', async () => {
    // 🆕 Test supplémentaire pour valider le filtrage
    const store = createTestStore({
      auth: {
        user: createTestUser(),
        token: 't',
        isAuthenticated: true,
        loading: false,
        error: null,
      },
      products: {
        products: [
          createTestProduct({
            id: 1,
            name: 'Pain complet',
            category: createTestCategory({ id: 1, name: 'Boulangerie' })
          }),
          createTestProduct({
            id: 2,
            name: 'Bananes mûres',
            category: createTestCategory({ id: 2, name: 'Fruits & Légumes' })
          }),
        ],
        categories: [
          createTestCategory({ id: 1, name: 'Boulangerie' }),
          createTestCategory({ id: 2, name: 'Fruits & Légumes' }),
        ],
        loading: false,
        loadingMore: false,
        error: null,
        filters: {},
        currentPage: 1,
        hasMore: false,
      },
      merchants: {
        merchants: [],
        loading: false,
        error: null,
      },
    })

    const { getByText, queryByText } = render(
      <ProductsScreen navigation={{ navigate: jest.fn() }} />,
      { store }
    )

    // Mode Produits
    fireEvent.press(getByText('Produits'))

    // Tous les produits visibles par défaut
    await waitFor(() => {
      expect(getByText('Pain complet')).toBeTruthy()
      expect(getByText('Bananes mûres')).toBeTruthy()
    })

    // Filtrer par Boulangerie
    fireEvent.press(getByText('Boulangerie'))

    await waitFor(() => {
      expect(getByText('Pain complet')).toBeTruthy()
      expect(queryByText('Bananes mûres')).toBeNull() // Filtré
    })

    // Retour à "Tous"
    fireEvent.press(getByText('Tous'))

    await waitFor(() => {
      expect(getByText('Pain complet')).toBeTruthy()
      expect(getByText('Bananes mûres')).toBeTruthy() // De nouveau visible
    })
  })
})
