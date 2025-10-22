/**
 * Mock implementation of apiService for testing
 */

const mockApiService = {
  // Auth methods
  login: jest.fn(() => Promise.resolve({ data: {} })),
  register: jest.fn(() => Promise.resolve({ data: {} })),
  logout: jest.fn(() => Promise.resolve({ data: {} })),
  getCurrentUser: jest.fn(() => Promise.resolve({ data: {} })),

  // Products methods
  getProducts: jest.fn(() => Promise.resolve({ data: [] })),
  getProduct: jest.fn(() => Promise.resolve({ data: {} })),
  searchProducts: jest.fn(() => Promise.resolve({ data: [] })),

  // Merchants methods
  getMerchants: jest.fn(() => Promise.resolve({ data: [] })),
  getMerchant: jest.fn(() => Promise.resolve({ data: {} })),

  // Reservations methods
  getReservations: jest.fn(() => Promise.resolve({ data: [] })),
  getReservation: jest.fn(() => Promise.resolve({ data: {} })),
  createReservation: jest.fn(() => Promise.resolve({ data: {} })),
  cancelReservation: jest.fn(() => Promise.resolve({ data: {} })),

  // Categories methods
  getCategories: jest.fn(() => Promise.resolve({ data: [] })),

  // Reviews methods
  getReviews: jest.fn(() => Promise.resolve({ data: [] })),
  createReview: jest.fn(() => Promise.resolve({ data: {} })),

  // Cart methods
  getCart: jest.fn(() => Promise.resolve({ data: {} })),
  addToCart: jest.fn(() => Promise.resolve({ data: {} })),
  updateCartItem: jest.fn(() => Promise.resolve({ data: {} })),
  removeFromCart: jest.fn(() => Promise.resolve({ data: {} })),
  clearCart: jest.fn(() => Promise.resolve({ data: {} })),
  checkout: jest.fn(() => Promise.resolve({ data: {} })),

  // Wallet methods
  getWallet: jest.fn(() => Promise.resolve({ data: {} })),
  getWalletTransactions: jest.fn(() => Promise.resolve({ data: [] })),
  rechargeWallet: jest.fn(() => Promise.resolve({ data: {} })),

  // Surprise Baskets methods
  getSurpriseBaskets: jest.fn(() => Promise.resolve({ data: [] })),
  getSurpriseBasket: jest.fn(() => Promise.resolve({ data: {} })),

  // Favorites methods
  getFavorites: jest.fn(() => Promise.resolve({ data: [] })),
  addFavorite: jest.fn(() => Promise.resolve({ data: {} })),
  removeFavorite: jest.fn(() => Promise.resolve({ data: {} })),

  // Generic request methods
  get: jest.fn(() => Promise.resolve({ data: {} })),
  post: jest.fn(() => Promise.resolve({ data: {} })),
  put: jest.fn(() => Promise.resolve({ data: {} })),
  delete: jest.fn(() => Promise.resolve({ data: {} })),
  request: jest.fn(() => Promise.resolve({ data: {} })),
}

export default mockApiService
