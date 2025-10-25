/**
 * 🐛 BUG FIX #MOB-L-002: Centralized environment detection
 *
 * Consolidates isTestEnv and isTestMode into single utility
 * to avoid confusion and duplication across the codebase
 */

import Constants from 'expo-constants'

/**
 * Check if running in test environment (Jest/automated tests)
 * Use this to suppress console logs and other test-only behaviors
 */
export const isTestEnv = (): boolean => {
  return process.env.NODE_ENV === 'test'
}

/**
 * Check if Expo testMode flag is enabled
 * Use this for test-specific UI behaviors (skip animations, etc.)
 */
export const isTestMode = (): boolean => {
  const expoConfig = Constants?.expoConfig as { extra?: { testMode?: boolean } } | undefined
  return Boolean(expoConfig?.extra?.testMode)
}

/**
 * Check if in any kind of test context (Jest OR Expo testMode)
 * Use this when you want to detect both environments
 */
export const isAnyTestMode = (): boolean => {
  return isTestEnv() || isTestMode()
}

/**
 * Check if running in development mode
 * Use this to enable dev-only features
 */
export const isDevelopment = (): boolean => {
  return __DEV__
}
