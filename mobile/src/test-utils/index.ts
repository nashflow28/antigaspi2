/**
 * Test Utilities - Point d'entrée centralisé
 *
 * Usage:
 * ```typescript
 * import { render, createTestStore, createTestUser, createTestProduct } from '@test-utils'
 * ```
 */

// Helpers de rendu
export { render, renderWithProviders, createTestStore } from './test-utils'

// Factories de données
export {
  createTestUser,
  createTestProduct,
  createTestCategory,
  createTestMerchant,
  createTestReservation,
} from './factories'

// Re-export des utilitaires de testing-library pour cohérence
export {
  fireEvent,
  waitFor,
  within,
  screen,
  act,
  cleanup,
} from '@testing-library/react-native'
