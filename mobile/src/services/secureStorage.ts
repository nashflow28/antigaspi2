/**
 * Secure Storage Service
 *
 * Uses expo-secure-store for sensitive data like authentication tokens.
 * This is more secure than AsyncStorage as data is encrypted on device.
 *
 * BUG FIX #C-006: Migration from AsyncStorage to SecureStore for sensitive data
 */

import * as SecureStore from 'expo-secure-store'
import { Platform } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { authLogger } from '../utils/logger'

// Storage keys
const KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_DATA: 'user_data',
  REFRESH_TOKEN: 'refresh_token',
  PIN_CODE: 'wallet_pin',
} as const

/**
 * Check if SecureStore is available on this platform
 * SecureStore is not available on web
 */
const isSecureStoreAvailable = (): boolean => {
  return Platform.OS !== 'web'
}

/**
 * Secure Storage Service
 *
 * Provides methods for securely storing and retrieving sensitive data.
 * Falls back to AsyncStorage on web platform.
 */
export const secureStorage = {
  /**
   * Store the authentication token securely
   */
  async setToken(token: string): Promise<void> {
    try {
      if (isSecureStoreAvailable()) {
        await SecureStore.setItemAsync(KEYS.AUTH_TOKEN, token)
        authLogger.debug('Token stored securely')
      } else {
        // Fallback for web
        await AsyncStorage.setItem(KEYS.AUTH_TOKEN, token)
        authLogger.debug('Token stored (AsyncStorage fallback)')
      }
    } catch (error) {
      authLogger.error('Failed to store token:', error)
      throw error
    }
  },

  /**
   * Retrieve the authentication token
   */
  async getToken(): Promise<string | null> {
    try {
      if (isSecureStoreAvailable()) {
        return await SecureStore.getItemAsync(KEYS.AUTH_TOKEN)
      } else {
        return await AsyncStorage.getItem(KEYS.AUTH_TOKEN)
      }
    } catch (error) {
      authLogger.error('Failed to retrieve token:', error)
      return null
    }
  },

  /**
   * Remove the authentication token
   */
  async removeToken(): Promise<void> {
    try {
      if (isSecureStoreAvailable()) {
        await SecureStore.deleteItemAsync(KEYS.AUTH_TOKEN)
      } else {
        await AsyncStorage.removeItem(KEYS.AUTH_TOKEN)
      }
      authLogger.debug('Token removed')
    } catch (error) {
      authLogger.error('Failed to remove token:', error)
    }
  },

  /**
   * Store user data securely
   */
  async setUserData(data: object): Promise<void> {
    try {
      const jsonData = JSON.stringify(data)
      if (isSecureStoreAvailable()) {
        await SecureStore.setItemAsync(KEYS.USER_DATA, jsonData)
      } else {
        await AsyncStorage.setItem(KEYS.USER_DATA, jsonData)
      }
      authLogger.debug('User data stored')
    } catch (error) {
      authLogger.error('Failed to store user data:', error)
      throw error
    }
  },

  /**
   * Retrieve user data
   */
  async getUserData<T = object>(): Promise<T | null> {
    try {
      let data: string | null
      if (isSecureStoreAvailable()) {
        data = await SecureStore.getItemAsync(KEYS.USER_DATA)
      } else {
        data = await AsyncStorage.getItem(KEYS.USER_DATA)
      }
      return data ? JSON.parse(data) : null
    } catch (error) {
      authLogger.error('Failed to retrieve user data:', error)
      return null
    }
  },

  /**
   * Remove user data
   */
  async removeUserData(): Promise<void> {
    try {
      if (isSecureStoreAvailable()) {
        await SecureStore.deleteItemAsync(KEYS.USER_DATA)
      } else {
        await AsyncStorage.removeItem(KEYS.USER_DATA)
      }
    } catch (error) {
      authLogger.error('Failed to remove user data:', error)
    }
  },

  /**
   * Store wallet PIN securely
   */
  async setPin(pin: string): Promise<void> {
    try {
      if (isSecureStoreAvailable()) {
        await SecureStore.setItemAsync(KEYS.PIN_CODE, pin)
        authLogger.debug('PIN stored securely')
      } else {
        // For web, we should warn that this is less secure
        authLogger.warn('Storing PIN with AsyncStorage (less secure)')
        await AsyncStorage.setItem(KEYS.PIN_CODE, pin)
      }
    } catch (error) {
      authLogger.error('Failed to store PIN:', error)
      throw error
    }
  },

  /**
   * Retrieve wallet PIN
   */
  async getPin(): Promise<string | null> {
    try {
      if (isSecureStoreAvailable()) {
        return await SecureStore.getItemAsync(KEYS.PIN_CODE)
      } else {
        return await AsyncStorage.getItem(KEYS.PIN_CODE)
      }
    } catch (error) {
      authLogger.error('Failed to retrieve PIN:', error)
      return null
    }
  },

  /**
   * Remove wallet PIN
   */
  async removePin(): Promise<void> {
    try {
      if (isSecureStoreAvailable()) {
        await SecureStore.deleteItemAsync(KEYS.PIN_CODE)
      } else {
        await AsyncStorage.removeItem(KEYS.PIN_CODE)
      }
    } catch (error) {
      authLogger.error('Failed to remove PIN:', error)
    }
  },

  /**
   * Clear all authentication data
   */
  async clearAll(): Promise<void> {
    try {
      await Promise.all([
        this.removeToken(),
        this.removeUserData(),
        this.removePin(),
      ])
      authLogger.log('All secure storage cleared')
    } catch (error) {
      authLogger.error('Failed to clear secure storage:', error)
    }
  },

  /**
   * Migrate data from AsyncStorage to SecureStore
   * Call this once during app upgrade to migrate existing data
   */
  async migrateFromAsyncStorage(): Promise<void> {
    if (!isSecureStoreAvailable()) {
      authLogger.info('SecureStore not available, skipping migration')
      return
    }

    try {
      // Check if migration is needed
      const existingToken = await AsyncStorage.getItem(KEYS.AUTH_TOKEN)
      if (existingToken) {
        // Migrate token
        await SecureStore.setItemAsync(KEYS.AUTH_TOKEN, existingToken)
        await AsyncStorage.removeItem(KEYS.AUTH_TOKEN)
        authLogger.log('Migrated token to SecureStore')
      }

      const existingUserData = await AsyncStorage.getItem(KEYS.USER_DATA)
      if (existingUserData) {
        // Migrate user data
        await SecureStore.setItemAsync(KEYS.USER_DATA, existingUserData)
        await AsyncStorage.removeItem(KEYS.USER_DATA)
        authLogger.log('Migrated user data to SecureStore')
      }

      authLogger.log('Migration from AsyncStorage completed')
    } catch (error) {
      authLogger.error('Migration failed:', error)
      // Don't throw - migration failure shouldn't break the app
    }
  },
}

export default secureStorage
