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
  reservation_code: 'RES-001',
  quantity: 1,
  original_price: 500,
  discounted_price: 250,
  total_amount: 250,
  status: 'pending',
  notes: null,
  created_at: '2025-01-01T00:00:00Z',
  confirmed_at: undefined,
  completed_at: undefined,
  cancelled_at: undefined,
  product: {
    id: 1,
    name: 'Pain complet artisanal',
    description: 'Pain bio fait maison',
    image_url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff',
    original_price: 500,
    discounted_price: 250,
    discount_percentage: 50,
    expiration_date: '2025-10-21',
    merchant: {
      name: 'Boulangerie Martin',
      business_type: 'Boulangerie',
      address: '123 Rue du Commerce',
      city: 'Lomé',
      phone: '+228 90 00 00 00',
    },
    category: createTestCategory(),
  },
  consumer: createTestUser(),
  latest_payment: undefined,
  ...overrides,
})
