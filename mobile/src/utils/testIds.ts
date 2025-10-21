/**
 * Centralized Test IDs for E2E Testing
 * Single Source of Truth for MCP/Automation selectors
 */
export const TEST_IDS = {
  // ============ AUTH SCREENS ============
  // Login
  loginScreen: 'login-screen',
  loginEmail: 'email-input',
  loginPassword: 'password-input',
  loginSubmit: 'login-button',
  loginConsumerQuick: 'consumer-login-button',
  loginMerchantQuick: 'merchant-login-button',

  // Register
  registerScreen: 'register-screen',
  registerFirstName: 'first-name-input',
  registerLastName: 'last-name-input',
  registerEmail: 'register-email-input',
  registerPassword: 'register-password-input',
  registerPhone: 'phone-input',
  registerAddress: 'address-input',
  registerCity: 'city-input',
  registerSubmit: 'register-button',

  // ============ CONSUMER SCREENS ============
  // Home
  homeScreen: 'home-screen',
  productList: 'product-list',
  productCard: (index: number) => `product-card-${index}`,
  productCardById: (id: number) => `product-card-id-${id}`,
  categoryChip: (category: string) => `category-chip-${category}`,
  searchInput: 'search-input',

  // Product Details
  productDetailsScreen: 'product-details-screen',
  productImage: 'product-image',
  productName: 'product-name',
  productPrice: 'product-price',
  reserveButton: 'reserve-button',
  favoriteButton: 'favorite-button',
  addToCartButton: 'add-to-cart-button',
  increaseQuantityButton: 'increase-quantity-button',
  decreaseQuantityButton: 'decrease-quantity-button',
  quantityValue: 'quantity-value',

  // Cart
  cartScreen: 'cart-screen',
  cartItem: (id: number) => `cart-item-${id}`,
  cartCheckoutButton: 'cart-checkout-button',
  cartClearButton: 'cart-clear-button',
  cartReservationsButton: 'cart-reservations-button',

  // Wallet
  walletScreen: 'wallet-screen',
  walletBalanceCard: 'wallet-balance-card',
  walletRechargeButton: 'wallet-recharge-button',
  walletTransactionsList: 'wallet-transactions-list',
  walletPinButton: 'wallet-pin-button',

  // Surprise Baskets
  surpriseBasketsScreen: 'surprise-baskets-screen',
  surpriseBasketsList: 'surprise-baskets-list',
  surpriseBasketCard: (id: number) => `surprise-basket-card-${id}`,

  // Reservations
  reservationsScreen: 'reservations-screen',
  reservationsList: 'reservations-list',
  reservationCard: (index: number) => `reservation-card-${index}`,
  reservationCardById: (id: number) => `reservation-card-id-${id}`,
  cancelReservationButton: (id: number) => `cancel-reservation-${id}`,

  // Profile
  profileScreen: 'profile-screen',
  profileName: 'profile-name',
  profileEmail: 'profile-email',
  editProfileButton: 'edit-profile-button',
  logoutButton: 'logout-button',

  // ============ MERCHANT SCREENS ============
  // Dashboard
  merchantDashboard: 'merchant-dashboard-screen',
  totalSalesCard: 'total-sales-card',
  activeProductsCard: 'active-products-card',

  // Products
  merchantProducts: 'merchant-products-screen',
  merchantProductsList: 'merchant-products-list',
  addProductButton: 'add-product-button',
  merchantProductCard: (index: number) => `merchant-product-card-${index}`,
  editProductButton: (id: number) => `edit-product-${id}`,
  deleteProductButton: (id: number) => `delete-product-${id}`,

  // Product Form
  productFormScreen: 'product-form-screen',
  productNameInput: 'product-name-input',
  productDescriptionInput: 'product-description-input',
  originalPriceInput: 'original-price-input',
  discountedPriceInput: 'discounted-price-input',
  quantityInput: 'quantity-input',
  expirationDateInput: 'expiration-date-input',
  imagePickerButton: 'image-picker-button',
  submitProductButton: 'submit-product-button',

  // Merchant Reservations
  merchantReservations: 'merchant-reservations-screen',
  merchantReservationsList: 'merchant-reservations-list',
  merchantReservationCard: (index: number) => `merchant-reservation-card-${index}`,
  acceptReservationButton: (id: number) => `accept-reservation-${id}`,
  rejectReservationButton: (id: number) => `reject-reservation-${id}`,

  // ============ MODALS & DIALOGS ============
  reservationModal: 'reservation-modal',
  confirmButton: 'confirm-button',
  cancelButton: 'cancel-button',
  deleteConfirmModal: 'delete-confirm-modal',
  successModal: 'success-modal',
  successMessage: 'success-message',
  errorMessage: 'error-message',
  closeModalButton: 'close-modal-button',

  // ============ NAVIGATION ============
  tabBar: 'tab-bar',
  homeTab: 'home-tab',
  reservationsTab: 'reservations-tab',
  profileTab: 'profile-tab',
  walletTab: 'wallet-tab',
  backButton: 'back-button',

  // ============ COMMON ============
  loadingSpinner: 'loading-spinner',
  emptyState: 'empty-state',
  errorState: 'error-state',
} as const

export type TestIdKey = keyof typeof TEST_IDS

