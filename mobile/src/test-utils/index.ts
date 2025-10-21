/**
 * Test Utilities - Point d'entrée centralisé
 *
 * Usage:
 * ```typescript
 * import { render, createTestStore, createTestUser, createTestProduct } from '@test-utils'
 * ```
 */

// Helpers de rendu
export { render, renderWithProviders } from './test-utils'

// Store helpers
export { createTestStore } from './store'

export {
  setupStore,
  buildProductsState,
  buildAuthState,
  buildConnectivityState,
  buildReservationsState,
  buildMerchantsState,
  buildFavoritesState,
  buildReviewsState,
} from './setupStore'

// Factories de données
export {
  createTestUser,
  createTestProduct,
  createTestCategory,
  createTestMerchant,
  createTestReservation,
} from './factories'

export { makeMerchant, makeProduct, resetFixtures } from './fixtures'

// Navigation mocks
export {
  createMockNavigation,
  createMockRoute,
  expectNavigationCalled,
  resetNavigationMocks,
} from './navigation'
export type { MockNavigation, MockRoute } from './navigation'

// Re-export des utilitaires de testing-library pour cohérence
export {
  fireEvent,
  waitFor,
  within,
  screen,
  act,
  cleanup,
} from '@testing-library/react-native'
