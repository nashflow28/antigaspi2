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
  loyaltyAccessButton: 'loyalty-access-button',
  loyaltyScreen: 'loyalty-screen',
  loyaltyRedeemButton: 'loyalty-redeem-button',

  // Merchant Map (Consumer)
  merchantMapScreen: 'merchant-map-screen',
  merchantMapView: 'merchant-map-view',
  merchantMapLoading: 'merchant-map-loading',
  merchantMapError: 'merchant-map-error',
  merchantMapEmpty: 'merchant-map-empty',
  merchantMapRetryButton: 'merchant-map-retry-button',
  merchantMapRefreshButton: 'merchant-map-refresh-button',
  merchantMapMarker: 'merchant-map-marker',
  merchantMapMarkerCallout: 'merchant-map-marker-callout',
  merchantMapVerifiedBadge: 'merchant-map-verified-badge',
  merchantMapCallButton: 'merchant-map-call-button',
  merchantMapDirectionsButton: 'merchant-map-directions-button',
  merchantMapCountBadge: 'merchant-map-count-badge',

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
  exportReservationsCsvButton: 'export-reservations-csv-button',
  exportReservationsLoading: 'export-reservations-loading',

  // Merchant Surprise Baskets
  merchantSurpriseBaskets: 'merchant-surprise-baskets-screen',
  surpriseBasketsStatsCard: 'surprise-baskets-stats-card',
  createBasketButton: 'create-basket-button',
  basketCard: (id: number) => `basket-card-${id}`,
  editBasketButton: (id: number) => `edit-basket-${id}`,
  deleteBasketButton: (id: number) => `delete-basket-${id}`,
  toggleBasketButton: (id: number) => `toggle-basket-${id}`,
  basketFormModal: 'basket-form-modal',
  basketNameInput: 'basket-name-input',
  basketDescriptionInput: 'basket-description-input',
  basketPriceInput: 'basket-price-input',
  basketQuantityInput: 'basket-quantity-input',
  submitBasketButton: 'submit-basket-button',

  // ============ ADMIN SCREENS ============
  // Admin Analytics
  adminAnalytics: 'admin-analytics-screen',
  periodSelector: 'period-selector',
  period7d: 'period-7d-button',
  period30d: 'period-30d-button',
  period90d: 'period-90d-button',
  periodCustom: 'period-custom-button',
  startDatePicker: 'start-date-picker',
  endDatePicker: 'end-date-picker',
  totalRevenueCard: 'total-revenue-card',
  totalTransactionsCard: 'total-transactions-card',
  averageOrderCard: 'average-order-card',
  exportCsvButton: 'export-csv-button',
  exportPdfButton: 'export-pdf-button',
  revenueTab: 'revenue-tab',
  geographyTab: 'geography-tab',
  merchantsTab: 'merchants-tab',
  revenueChart: 'revenue-chart',
  geographicChart: 'geographic-chart',
  merchantPerformanceList: 'merchant-performance-list',
  refreshButton: 'refresh-button',

  // Admin Broadcast Notifications
  adminBroadcast: 'admin-broadcast-screen',
  broadcastTitleInput: 'broadcast-title-input',
  broadcastMessageInput: 'broadcast-message-input',
  channelDatabase: 'channel-database',
  channelMail: 'channel-mail',
  channelSms: 'channel-sms',
  channelPush: 'channel-push',
  roleConsumer: 'role-consumer',
  roleMerchant: 'role-merchant',
  roleAdmin: 'role-admin',
  actionUrlInput: 'action-url-input',
  sendBroadcastButton: 'send-broadcast-button',
  broadcastPreview: 'broadcast-preview',

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

