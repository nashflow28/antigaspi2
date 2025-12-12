/**
 * API Configuration
 *
 * Centralized configuration for API timeouts and settings.
 * Optimized for West African network conditions.
 */

export const API_CONFIG = {
  /**
   * Timeout settings (in milliseconds)
   * Optimized for West African mobile networks which may have higher latency
   */
  TIMEOUT: {
    /** Default timeout for most API requests - 15s for slower connections */
    DEFAULT: 15000,

    /** File upload timeout - 60s for large files on slow connections */
    UPLOAD: 60000,

    /** Search requests - 10s should be enough for searches */
    SEARCH: 10000,

    /** Authentication requests - 20s for login/register */
    AUTH: 20000,

    /** Quick operations like favorites toggle */
    QUICK: 5000,

    /** Long operations like report generation */
    LONG: 120000,
  },

  /**
   * Retry configuration
   */
  RETRY: {
    /** Number of retry attempts for failed requests */
    MAX_ATTEMPTS: 3,

    /** Initial delay between retries (ms) */
    INITIAL_DELAY: 1000,

    /** Multiplier for exponential backoff */
    BACKOFF_MULTIPLIER: 2,
  },

  /**
   * Cache settings
   */
  CACHE: {
    /** How long to cache product listings (ms) */
    PRODUCTS_TTL: 5 * 60 * 1000, // 5 minutes

    /** How long to cache categories (ms) */
    CATEGORIES_TTL: 30 * 60 * 1000, // 30 minutes

    /** How long to cache user profile (ms) */
    PROFILE_TTL: 10 * 60 * 1000, // 10 minutes
  },

  /**
   * Pagination defaults
   */
  PAGINATION: {
    /** Default items per page */
    DEFAULT_PER_PAGE: 20,

    /** Maximum items per page */
    MAX_PER_PAGE: 100,
  },
} as const

export default API_CONFIG
