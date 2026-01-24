/**
 * Navigation Routes
 *
 * Centralized route names for type-safe navigation.
 * Eliminates magic strings in navigation calls.
 *
 * BUG FIX #L-003: Centralize magic string navigation
 */

/**
 * Main app routes (consumer-facing)
 */
export const MAIN_ROUTES = {
  // Tab navigator routes
  HOME: 'Home',
  PRODUCTS: 'Products',
  CART: 'Cart',
  RESERVATIONS: 'Reservations',
  PROFILE: 'Profile',

  // Stack routes
  PRODUCT_DETAILS: 'ProductDetails',
  MERCHANT_DETAIL: 'MerchantDetail',
  MERCHANT_MAP: 'MerchantMap',
  FAVORITES: 'Favorites',
  SEARCH: 'Search',
  NOTIFICATIONS: 'Notifications',

  // Reservation routes
  RESERVATION_DETAILS: 'ReservationDetails',
  RESERVATION_CONFIRMATION: 'ReservationConfirmation',

  // Profile routes
  PROFILE_EDIT: 'ProfileEdit',
  WALLET: 'Wallet',
  WALLET_RECHARGE: 'WalletRecharge',
  LOYALTY: 'Loyalty',
  MONEY_SAVING_TIPS: 'MoneySavingTips',
  SETTINGS: 'Settings',

  // Surprise baskets
  SURPRISE_BASKETS: 'SurpriseBaskets',
  SURPRISE_BASKET_DETAILS: 'SurpriseBasketDetails',
} as const

/**
 * Authentication routes
 */
export const AUTH_ROUTES = {
  LOGIN: 'Login',
  REGISTER: 'Register',
  FORGOT_PASSWORD: 'ForgotPassword',
  RESET_PASSWORD: 'ResetPassword',
  VERIFY_EMAIL: 'VerifyEmail',
  ONBOARDING: 'Onboarding',
} as const

/**
 * Merchant dashboard routes
 */
export const MERCHANT_ROUTES = {
  DASHBOARD: 'MerchantDashboard',
  PRODUCTS: 'MerchantProducts',
  PRODUCT_FORM: 'ProductForm',
  RESERVATIONS: 'MerchantReservations',
  RESERVATION_DETAIL: 'MerchantReservationDetail',
  ANALYTICS: 'MerchantAnalytics',
  PROFILE: 'MerchantProfile',
  PROFILE_EDIT: 'MerchantProfileEdit',
  OPENING_HOURS: 'MerchantOpeningHours',
  NOTIFICATIONS: 'MerchantNotifications',
  SURPRISE_BASKETS: 'MerchantSurpriseBaskets',
  MESSAGING: 'MerchantMessaging',
} as const

/**
 * Admin dashboard routes
 */
export const ADMIN_ROUTES = {
  DASHBOARD: 'AdminDashboard',
  USERS: 'AdminUsers',
  MERCHANTS: 'AdminMerchants',
  PRODUCTS: 'AdminProducts',
  CATEGORIES: 'AdminCategories',
  RESERVATIONS: 'AdminReservations',
  ANALYTICS: 'AdminAnalytics',
  REVIEWS: 'AdminReviewModeration',
  BROADCAST: 'AdminBroadcast',
  SETTINGS: 'AdminSettings',
} as const

/**
 * Messaging routes
 */
export const MESSAGING_ROUTES = {
  CONVERSATIONS: 'Conversations',
  CHAT: 'Chat',
} as const

/**
 * All routes combined for easy access
 */
export const ROUTES = {
  ...MAIN_ROUTES,
  ...AUTH_ROUTES,
  ...MERCHANT_ROUTES,
  ...ADMIN_ROUTES,
  ...MESSAGING_ROUTES,
} as const

/**
 * Type definitions for route names
 */
export type MainRouteName = typeof MAIN_ROUTES[keyof typeof MAIN_ROUTES]
export type AuthRouteName = typeof AUTH_ROUTES[keyof typeof AUTH_ROUTES]
export type MerchantRouteName = typeof MERCHANT_ROUTES[keyof typeof MERCHANT_ROUTES]
export type AdminRouteName = typeof ADMIN_ROUTES[keyof typeof ADMIN_ROUTES]
export type MessagingRouteName = typeof MESSAGING_ROUTES[keyof typeof MESSAGING_ROUTES]
export type RouteName = typeof ROUTES[keyof typeof ROUTES]

/**
 * Route params type definitions
 * Add params for routes that require them
 */
export type RouteParams = {
  [ROUTES.PRODUCT_DETAILS]: { productId: number }
  [ROUTES.MERCHANT_DETAIL]: { merchantId: number }
  [ROUTES.RESERVATION_DETAILS]: { reservationId: number }
  [ROUTES.SURPRISE_BASKET_DETAILS]: { basketId: number }
  [ROUTES.CHAT]: { conversationId: number }
  [MERCHANT_ROUTES.PRODUCT_FORM]: { productId?: number } | undefined
  [MERCHANT_ROUTES.RESERVATION_DETAIL]: { reservationId: number }
  // Routes without params
  [ROUTES.HOME]: undefined
  [ROUTES.PRODUCTS]: undefined
  [ROUTES.CART]: undefined
  [ROUTES.PROFILE]: undefined
  [ROUTES.LOGIN]: undefined
  [ROUTES.REGISTER]: undefined
}

export default ROUTES
