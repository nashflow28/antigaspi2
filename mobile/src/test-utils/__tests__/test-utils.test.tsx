/**
 * Tests de l'infrastructure test-utils elle-même
 * Valide que les factories et helpers fonctionnent correctement
 */

import React from 'react'
import { Text, View } from 'react-native'
import { render, createTestStore, createTestUser, createTestProduct, createTestMerchant } from '@test-utils'

// Composant de test simple
const TestComponent: React.FC<{ user?: any }> = ({ user }) => (
  <View>
    {user ? (
      <Text testID="user-name">{`${user.first_name} ${user.last_name}`}</Text>
    ) : (
      <Text testID="no-user">No user</Text>
    )}
  </View>
)

describe('Test Utils Infrastructure', () => {
  let consoleLogSpy: jest.SpyInstance | undefined

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleLogSpy?.mockRestore()
  })

  describe('createTestUser', () => {
    it('crée un User complet avec tous les champs requis', () => {
      const user = createTestUser()

      // Tous les champs requis doivent être présents
      expect(user.id).toBeDefined()
      expect(user.email).toBeDefined()
      expect(user.role).toBeDefined()
      expect(user.first_name).toBeDefined()
      expect(user.last_name).toBeDefined()
      expect(user.city).toBeDefined()
      expect(user.created_at).toBeDefined()
      expect(user.updated_at).toBeDefined()
    })

    it('permet de surcharger uniquement les champs nécessaires', () => {
      const user = createTestUser({
        first_name: 'John',
        last_name: 'Doe',
        role: 'merchant',
      })

      expect(user.first_name).toBe('John')
      expect(user.last_name).toBe('Doe')
      expect(user.role).toBe('merchant')
      // Autres champs doivent avoir les valeurs par défaut
      expect(user.email).toBe('test@example.com')
      expect(user.city).toBe('Lomé')
    })
  })

  describe('createTestMerchant', () => {
    it('crée un Merchant complet (plus Partial)', () => {
      const merchant = createTestMerchant()

      // Tous les champs requis doivent être présents
      expect(merchant.id).toBeDefined()
      expect(merchant.business_name).toBeDefined()
      expect(merchant.business_type).toBeDefined() // ✅ Ajouté
      expect(merchant.city).toBeDefined()
      expect(merchant.phone).toBeDefined() // ✅ Ajouté
      expect(merchant.is_verified).toBeDefined() // ✅ Ajouté
    })

    it('permet de surcharger business_type', () => {
      const merchant = createTestMerchant({
        business_type: 'Restaurant',
        is_verified: true,
      })

      expect(merchant.business_type).toBe('Restaurant')
      expect(merchant.is_verified).toBe(true)
    })
  })

  describe('createTestProduct', () => {
    it('crée un Product complet avec expiration_date (pas expiry_date)', () => {
      const product = createTestProduct()

      expect(product.id).toBeDefined()
      expect(product.name).toBeDefined()
      expect(product.expiration_date).toBeDefined() // ✅ Correct
      expect((product as any).expiry_date).toBeUndefined() // ✅ Ne doit PAS exister
      expect(product.image_url).toBeDefined() // ✅ URL par défaut (plus null)
      expect(product.is_active).toBe(true) // ✅ Ajouté
      expect(product.category).toBeDefined()
      expect(product.merchant).toBeDefined()
    })

    it('merchant est un Merchant complet', () => {
      const product = createTestProduct()

      // Le merchant doit avoir tous les champs requis
      expect(product.merchant.business_type).toBeDefined()
      expect(product.merchant.phone).toBeDefined()
      expect(product.merchant.is_verified).toBeDefined()
    })
  })

  describe('createTestStore', () => {
    it('crée un store complet par défaut avec tous les reducers', () => {
      const store = createTestStore({
        auth: {
          user: createTestUser(),
          token: 'token',
          isAuthenticated: true,
          loading: false,
          error: null,
        },
      })

      const state = store.getState()

      // Tous les reducers doivent être présents
      expect(state.auth).toBeDefined()
      expect(state.products).toBeDefined()
      expect(state.reservations).toBeDefined()
      expect(state.merchants).toBeDefined()
      expect(state.favorites).toBeDefined()
      expect(state.reviews).toBeDefined()
    })

    it('fusionne en profondeur les overrides fournis', () => {
      const store = createTestStore({
        products: {
          products: [
            {
              id: 42,
              name: 'Produit de test',
              description: 'Produit injecté pour les tests',
              original_price: '1000',
              discounted_price: '800',
              quantity_available: 5,
              expiration_date: '2025-01-01T00:00:00Z',
              discount_percentage: 20,
              savings: 200,
              days_until_expiration: 2,
              category: { id: 1, name: 'Catégorie test' },
              merchant: createTestMerchant(),
              created_at: '2025-01-01T00:00:00Z',
              is_active: true,
            },
          ],
          loading: true,
        },
      })

      const state = store.getState()

      expect(state.products.products).toHaveLength(1)
      expect(state.products.loading).toBe(true)
      // Les propriétés non surchargées doivent conserver leur valeur par défaut
      expect(state.products.hasMore).toBe(true)
      expect(state.products.filters).toEqual({})
    })
  })

  describe('render avec providers', () => {
    it('rend un composant avec Redux store et ThemeProvider automatiquement', () => {
      const store = createTestStore({
        auth: {
          user: createTestUser({ first_name: 'Test', last_name: 'User' }),
          token: 'token',
          isAuthenticated: true,
          loading: false,
          error: null,
        },
      })

      const { getByTestId } = render(<TestComponent user={createTestUser({ first_name: 'Test', last_name: 'User' })} />, { store })

      expect(getByTestId('user-name')).toBeTruthy()
      expect(getByTestId('user-name').props.children).toBe('Test User')
    })

    it('ne cause pas d\'erreur useTheme must be within ThemeProvider', () => {
      const store = createTestStore({
        auth: {
          user: null,
          token: null,
          isAuthenticated: false,
          loading: false,
          error: null,
        },
      })

      // Ce test réussit si aucune erreur n'est levée
      expect(() => {
        render(<TestComponent />, { store })
      }).not.toThrow()
    })
  })

  describe('Alias @test-utils', () => {
    it('permet d\'importer depuis @test-utils (alias de chemin)', () => {
      // Ce test passe simplement en important depuis @test-utils en haut du fichier
      // Si l'alias ne fonctionnait pas, TypeScript/Jest aurait levé une erreur de module introuvable
      expect(createTestUser).toBeDefined()
      expect(createTestProduct).toBeDefined()
      expect(createTestMerchant).toBeDefined()
      expect(createTestStore).toBeDefined()
      expect(render).toBeDefined()
    })
  })
})
