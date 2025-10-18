/**
 * Test Data Factories
 * Crée des objets de test complets avec tous les champs requis
 */

import { User, Product, Category, Merchant, Reservation } from '../types'

export const createTestUser = (overrides?: Partial<User>): User => ({
  id: 1,
  email: 'test@example.com',
  role: 'consumer',
  first_name: 'Test',
  last_name: 'User',
  city: 'Lomé',
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
  ...overrides,
})

export const createTestCategory = (overrides?: Partial<Category>): Category => ({
  id: 1,
  name: 'Boulangerie',
  description: 'Pains et viennoiseries',
  ...overrides,
})

export const createTestMerchant = (overrides?: Partial<Merchant>): Merchant => ({
  id: 1,
  business_name: 'Boulangerie Martin',
  business_type: 'Boulangerie',
  city: 'Lomé',
  phone: '+228 90 00 00 00',
  is_verified: false,
  address: '123 Rue du Commerce',
  latitude: null,
  longitude: null,
  ...overrides,
})

export const createTestProduct = (overrides?: Partial<Product>): Product => ({
  id: 1,
  name: 'Pain complet artisanal',
  description: 'Pain bio fait maison',
  original_price: '500',
  discounted_price: '250',
  quantity_available: 10,
  expiration_date: '2025-10-21',
  image_url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff',
  discount_percentage: 50,
  savings: 250,
  days_until_expiration: 3,
  created_at: '2025-01-01T00:00:00Z',
  is_active: true,
  category: createTestCategory(),
  merchant: createTestMerchant(),
  ...overrides,
})

export const createTestReservation = (overrides?: Partial<Reservation>): Reservation => ({
  id: 1,
  user_id: 1,
  product_id: 1,
  merchant_id: 1,
  quantity: 1,
  total_price: 250,
  status: 'pending',
  payment_method: 'on_site',
  notes: null,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
  confirmed_at: null,
  ready_at: null,
  completed_at: null,
  cancelled_at: null,
  product: createTestProduct(),
  user: createTestUser(),
  latest_payment: null,
  ...overrides,
})
