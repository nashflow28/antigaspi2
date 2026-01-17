/**
 * Sentry Error Tracking Initialization
 *
 * This module initializes Sentry for crash reporting and error tracking.
 * It provides a production-safe wrapper that handles missing DSN gracefully.
 *
 * Usage:
 * - Call initSentry() at app startup (before any other code)
 * - Use captureException() to manually report errors
 * - Use setUser() to associate errors with the current user
 */

import * as Sentry from '@sentry/react-native'
import Constants from 'expo-constants'

// Get Sentry DSN from environment or app config
const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN || Constants.expoConfig?.extra?.sentryDsn

// Guard against double initialization (module-level flag)
let isInitialized = false

/**
 * Initialize Sentry SDK
 * Safe to call even if DSN is not configured - will log warning and continue
 * Safe to call multiple times - subsequent calls are no-ops
 */
export const initSentry = (): void => {
  // Prevent double initialization
  if (isInitialized) {
    if (__DEV__) {
      console.log('[Sentry] Already initialized - skipping')
    }
    return
  }

  if (!SENTRY_DSN) {
    if (__DEV__) {
      console.log('[Sentry] DSN not configured - crash reporting disabled')
    }
    return
  }

  try {
    Sentry.init({
      dsn: SENTRY_DSN,
      environment: __DEV__ ? 'development' : 'production',

      // Performance monitoring
      tracesSampleRate: __DEV__ ? 1.0 : 0.2, // 100% in dev, 20% in prod

      // Enable native crash handling
      enableNative: true,

      // Auto session tracking
      enableAutoSessionTracking: true,
      sessionTrackingIntervalMillis: 30000,

      // Enable automatic instrumentation
      enableAutoPerformanceTracing: true,

      // Debug mode in development
      debug: __DEV__,

      // Attach stack traces to messages
      attachStacktrace: true,

      // Filter events before sending
      beforeSend: (event, _hint) => {
        // Don't send events in development unless explicitly enabled
        if (__DEV__ && !process.env.EXPO_PUBLIC_SENTRY_DEBUG) {
          console.log('[Sentry] Event captured (not sent in dev):', event.message || event.exception?.values?.[0]?.value)
          return null
        }

        // Filter out known benign errors
        const errorMessage = event.message || event.exception?.values?.[0]?.value || ''
        const ignoredPatterns = [
          'Network request failed',
          'Failed to fetch',
          'AbortError',
          'timeout',
          'cancelled',
        ]

        if (ignoredPatterns.some(pattern => errorMessage.toLowerCase().includes(pattern.toLowerCase()))) {
          return null
        }

        return event
      },

      // Integration configuration
      integrations: (integrations) => {
        return integrations.filter(_integration => {
          // Keep all default integrations
          return true
        })
      },
    })

    // Mark as initialized to prevent double init
    isInitialized = true

    if (__DEV__) {
      console.log('[Sentry] Initialized successfully')
    }
  } catch (error) {
    console.error('[Sentry] Failed to initialize:', error)
  }
}

/**
 * Capture an exception and send to Sentry
 * Safe to call even if Sentry is not initialized
 *
 * @param error - The error to capture
 * @param context - Optional additional context
 */
export const captureException = (
  error: Error | unknown,
  context?: Record<string, unknown>
): void => {
  // Always log the error in development
  if (__DEV__) {
    console.error('[Error]', error, context)
  }

  // Only send to Sentry if initialized
  if (SENTRY_DSN) {
    try {
      if (context) {
        Sentry.withScope((scope) => {
          scope.setExtras(context)
          Sentry.captureException(error)
        })
      } else {
        Sentry.captureException(error)
      }
    } catch (e) {
      console.error('[Sentry] Failed to capture exception:', e)
    }
  }
}

/**
 * Capture a message and send to Sentry
 *
 * @param message - The message to capture
 * @param level - Severity level (info, warning, error)
 */
export const captureMessage = (
  message: string,
  level: 'info' | 'warning' | 'error' = 'info'
): void => {
  if (__DEV__) {
    console.log(`[Sentry ${level}]`, message)
  }

  if (SENTRY_DSN) {
    try {
      Sentry.captureMessage(message, level)
    } catch (e) {
      console.error('[Sentry] Failed to capture message:', e)
    }
  }
}

/**
 * Set the current user for error tracking
 * Call this after login to associate errors with the user
 *
 * @param user - User information (id, email, role)
 */
export const setUser = (user: {
  id: number | string
  email?: string
  role?: string
} | null): void => {
  if (SENTRY_DSN) {
    try {
      if (user) {
        Sentry.setUser({
          id: String(user.id),
          email: user.email,
          segment: user.role, // Use segment for role/type
        })
      } else {
        Sentry.setUser(null)
      }
    } catch (e) {
      console.error('[Sentry] Failed to set user:', e)
    }
  }
}

/**
 * Add breadcrumb for debugging
 * Breadcrumbs help trace user actions leading to an error
 *
 * @param breadcrumb - Breadcrumb data
 */
export const addBreadcrumb = (breadcrumb: {
  category: string
  message: string
  level?: 'debug' | 'info' | 'warning' | 'error'
  data?: Record<string, unknown>
}): void => {
  if (SENTRY_DSN) {
    try {
      Sentry.addBreadcrumb({
        category: breadcrumb.category,
        message: breadcrumb.message,
        level: breadcrumb.level || 'info',
        data: breadcrumb.data,
      })
    } catch (e) {
      // BUG FIX #10: Log in dev mode instead of silent swallowing
      if (__DEV__) {
        console.debug('[Sentry] Failed to add breadcrumb:', e)
      }
    }
  }
}

/**
 * Set a tag for filtering errors
 *
 * @param key - Tag key
 * @param value - Tag value
 */
export const setTag = (key: string, value: string): void => {
  if (SENTRY_DSN) {
    try {
      Sentry.setTag(key, value)
    } catch (e) {
      // BUG FIX #10: Log in dev mode instead of silent swallowing
      if (__DEV__) {
        console.debug('[Sentry] Failed to set tag:', e)
      }
    }
  }
}

/**
 * Wrap the app component with Sentry error boundary
 * This enables automatic capture of React render errors
 */
export const wrapWithSentry = Sentry.wrap

// Re-export Sentry for advanced usage
export { Sentry }

export default {
  initSentry,
  captureException,
  captureMessage,
  setUser,
  addBreadcrumb,
  setTag,
  wrapWithSentry,
}
