/**
 * User fixtures for E2E testing
 * Matching backend/database/seeders/UserSeeder.php accounts
 */

export interface TestUser {
  email: string
  password: string
  role: 'consumer' | 'merchant' | 'admin'
  name: string
  expectedDashboard?: string
}

export const testUsers = {
  consumer: {
    email: 'jean.dupont@email.com',
    password: 'password',
    role: 'consumer' as const,
    name: 'Jean Dupont',
  },

  merchant: {
    email: 'boulangerie.martin@email.com',
    password: 'password',
    role: 'merchant' as const,
    name: 'Marie Martin',
    expectedDashboard: 'Tableau de bord commerçant',
  },

  admin: {
    email: 'admin@antigaspi.com',
    password: 'password',
    role: 'admin' as const,
    name: 'Admin Antigaspi',
    expectedDashboard: 'Administration',
  },

  // Additional test users
  consumer2: {
    email: 'marie.dubois@email.com',
    password: 'password',
    role: 'consumer' as const,
    name: 'Marie Dubois',
  },

  merchant2: {
    email: 'supermarche.legrand@email.com',
    password: 'password',
    role: 'merchant' as const,
    name: 'Pierre Legrand',
  },
}

export const testProducts = {
  painComplet: {
    id: 1,
    name: 'Pain complet artisanal',
    price: 250,
    originalPrice: 500,
    category: 'Boulangerie',
  },
  croissants: {
    id: 2,
    name: 'Croissants artisanaux',
    price: 100,
    originalPrice: 200,
    category: 'Boulangerie',
  },
  bananes: {
    id: 3,
    name: 'Bananes mûres',
    price: 150,
    originalPrice: 300,
    category: 'Fruits & Légumes',
  },
}

export const apiEndpoints = {
  login: 'http://localhost:8000/api/auth/login',
  register: 'http://localhost:8000/api/auth/register',
  products: 'http://localhost:8000/api/products',
  reservations: 'http://localhost:8000/api/reservations',
  profile: 'http://localhost:8000/api/auth/profile',
}
