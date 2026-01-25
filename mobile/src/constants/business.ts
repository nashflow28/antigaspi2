/**
 * Business Constants
 *
 * Centralized business logic constants for the GÊLADAL application.
 * All magic numbers should be defined here with documentation.
 */

/**
 * Pickup time offsets by merchant category
 * Different merchant types have different product freshness requirements
 */
export const PICKUP_OFFSET_DAYS = {
  /** Supermarkets - products with +48h shelf life */
  SUPERMARKET: 2,

  /** Restaurants - prepared meals with quick expiration */
  RESTAURANT: 1,

  /** Bakeries - same-day sales */
  BAKERY: 1,

  /** Default for unspecified categories */
  DEFAULT: 1,
} as const

/**
 * Product quantity and pricing limits
 */
export const PRODUCT_LIMITS = {
  /** Maximum quantity per order */
  MAX_QUANTITY_PER_ORDER: 10,

  /** Minimum price in XOF */
  MIN_PRICE_XOF: 100,

  /** Maximum price in XOF */
  MAX_PRICE_XOF: 100000,

  /** Minimum discount percentage for anti-waste products */
  MIN_DISCOUNT_PERCENT: 20,

  /** Maximum discount percentage */
  MAX_DISCOUNT_PERCENT: 80,

  /** Default quantity available for new products */
  DEFAULT_QUANTITY: 1,
} as const

/**
 * UI timing constants
 */
export const UI_CONSTANTS = {
  /** Debounce delay for search inputs (ms) */
  DEBOUNCE_MS: 300,

  /** Standard animation duration (ms) */
  ANIMATION_DURATION_MS: 200,

  /** Toast notification display time (ms) */
  TOAST_DURATION_MS: 3000,

  /** Long press threshold (ms) */
  LONG_PRESS_DELAY_MS: 500,

  /** Pull-to-refresh threshold (pixels) */
  PULL_REFRESH_THRESHOLD: 80,

  /** Skeleton loading placeholder count */
  SKELETON_COUNT: 4,
} as const

/**
 * Distance and location constants
 */
export const LOCATION_CONSTANTS = {
  /** Default search radius in km */
  DEFAULT_RADIUS_KM: 10,

  /** Maximum search radius in km */
  MAX_RADIUS_KM: 50,

  /** Minimum distance to show in display (m) */
  MIN_DISPLAY_DISTANCE_M: 100,

  /** Distance threshold to switch from meters to km display */
  KM_THRESHOLD_M: 1000,
} as const

/**
 * Reservation status constants
 */
export const RESERVATION_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  READY: 'ready',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired',
} as const

/**
 * Expiration warning thresholds
 */
export const EXPIRATION_THRESHOLDS = {
  /** Days before expiration to show "expiring soon" warning */
  SOON_DAYS: 3,

  /** Days before expiration to show "urgent" warning */
  URGENT_DAYS: 1,

  /** Hours before pickup deadline to show warning */
  PICKUP_WARNING_HOURS: 2,
} as const

/**
 * Wallet and payment constants
 */
export const WALLET_CONSTANTS = {
  /** Default daily spending limit in XOF */
  DEFAULT_DAILY_LIMIT_XOF: 50000,

  /** Maximum daily limit in XOF */
  MAX_DAILY_LIMIT_XOF: 500000,

  /** Minimum recharge amount in XOF */
  MIN_RECHARGE_XOF: 500,

  /** Maximum recharge amount in XOF */
  MAX_RECHARGE_XOF: 1000000,

  /** PIN code length */
  PIN_LENGTH: 4,
} as const

/**
 * Loyalty program constants
 */
export const LOYALTY_CONSTANTS = {
  /** Points earned per 100 XOF spent */
  POINTS_PER_100_XOF: 1,

  /** XOF value of one loyalty point */
  XOF_PER_POINT: 10,

  /** Minimum points for redemption */
  MIN_REDEMPTION_POINTS: 100,
} as const

/**
 * Image and media constants
 */
export const MEDIA_CONSTANTS = {
  /** Maximum image size in bytes (5MB) */
  MAX_IMAGE_SIZE_BYTES: 5 * 1024 * 1024,

  /** Thumbnail width in pixels */
  THUMBNAIL_WIDTH: 150,

  /** Product image width in pixels */
  PRODUCT_IMAGE_WIDTH: 400,

  /** Supported image formats */
  SUPPORTED_FORMATS: ['image/jpeg', 'image/png', 'image/webp'] as const,
} as const

export default {
  PICKUP_OFFSET_DAYS,
  PRODUCT_LIMITS,
  UI_CONSTANTS,
  LOCATION_CONSTANTS,
  RESERVATION_STATUS,
  EXPIRATION_THRESHOLDS,
  WALLET_CONSTANTS,
  LOYALTY_CONSTANTS,
  MEDIA_CONSTANTS,
}
