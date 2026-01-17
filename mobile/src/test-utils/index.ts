export { render, renderWithProviders } from './test-utils'

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
  buildCartState,
} from './setupStore'

export {
  createTestUser,
  createTestProduct,
  createTestCategory,
  createTestMerchant,
  createTestReservation,
  createTestConversation,
  createTestConversationMessage,
} from './factories'

export { makeMerchant, makeProduct, makeCategory, resetFixtures } from './fixtures'

export {
  createMockNavigation,
  createMockRoute,
  expectNavigationCalled,
  resetNavigationMocks,
} from './navigation'

export type { MockNavigation, MockRoute } from './navigation'

export {
  fireEvent,
  waitFor,
  within,
  screen,
  act,
  cleanup,
} from '@testing-library/react-native'
