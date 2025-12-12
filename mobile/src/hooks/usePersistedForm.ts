import { useState, useEffect, useCallback, useRef } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import isEqual from 'lodash/isEqual'
import { createLogger } from '../utils/logger'

const formLogger = createLogger('FormCache')
const FORM_CACHE_PREFIX = '@form_cache_'
const DEBOUNCE_DELAY = 500 // ms

interface UsePersistedFormOptions<T> {
  /** Unique key for this form */
  formKey: string
  /** Initial/default values */
  initialValues: T
  /** Time in ms before cache expires (default: 24 hours) */
  expiresIn?: number
  /** Called when cached data is restored */
  onRestore?: (data: T) => void
}

interface CachedFormData<T> {
  data: T
  timestamp: number
  expiresAt: number
}

/**
 * Hook to persist form data in AsyncStorage
 * Automatically saves on change and restores on mount
 */
export function usePersistedForm<T extends Record<string, any>>({
  formKey,
  initialValues,
  expiresIn = 24 * 60 * 60 * 1000, // 24 hours default
  onRestore,
}: UsePersistedFormOptions<T>) {
  const [formData, setFormData] = useState<T>(initialValues)
  const [isRestored, setIsRestored] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const debounceTimer = useRef<NodeJS.Timeout | null>(null)
  const storageKey = `${FORM_CACHE_PREFIX}${formKey}`

  // Load cached data on mount
  useEffect(() => {
    const loadCachedData = async () => {
      try {
        const cached = await AsyncStorage.getItem(storageKey)
        if (cached) {
          const parsedCache: CachedFormData<T> = JSON.parse(cached)

          // Check if cache is still valid
          if (parsedCache.expiresAt > Date.now()) {
            setFormData(parsedCache.data)
            setHasUnsavedChanges(true)
            onRestore?.(parsedCache.data)
            formLogger.log(`Restored form data for: ${formKey}`)
          } else {
            // Cache expired, remove it
            await AsyncStorage.removeItem(storageKey)
            formLogger.log(`Expired cache removed for: ${formKey}`)
          }
        }
      } catch (error) {
        formLogger.error(`Error loading cache for ${formKey}:`, error)
      } finally {
        setIsRestored(true)
      }
    }

    loadCachedData()
  }, [formKey, storageKey])

  // Save to cache with debounce
  const saveToCache = useCallback(async (data: T) => {
    try {
      const cacheData: CachedFormData<T> = {
        data,
        timestamp: Date.now(),
        expiresAt: Date.now() + expiresIn,
      }
      await AsyncStorage.setItem(storageKey, JSON.stringify(cacheData))
      formLogger.debug(`Saved form data for: ${formKey}`)
    } catch (error) {
      formLogger.error(`Error saving cache for ${formKey}:`, error)
    }
  }, [formKey, storageKey, expiresIn])

  // Update form data with auto-save
  const updateFormData = useCallback((updates: Partial<T> | ((prev: T) => T)) => {
    setFormData(prev => {
      const newData = typeof updates === 'function' ? updates(prev) : { ...prev, ...updates }

      // Debounced save to cache
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
      debounceTimer.current = setTimeout(() => {
        saveToCache(newData)
      }, DEBOUNCE_DELAY)

      setHasUnsavedChanges(true)
      return newData
    })
  }, [saveToCache])

  // Set a single field
  const setField = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    updateFormData(prev => ({ ...prev, [field]: value }))
  }, [updateFormData])

  // Clear cache (call on successful submission)
  const clearCache = useCallback(async () => {
    try {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
      await AsyncStorage.removeItem(storageKey)
      setHasUnsavedChanges(false)
      formLogger.debug(`Cleared cache for: ${formKey}`)
    } catch (error) {
      formLogger.error(`Error clearing cache for ${formKey}:`, error)
    }
  }, [formKey, storageKey])

  // Reset form to initial values and clear cache
  const resetForm = useCallback(async () => {
    setFormData(initialValues)
    await clearCache()
  }, [initialValues, clearCache])

  // Check if form has been modified from initial values
  // BUG FIX #M-003: Use lodash isEqual instead of JSON.stringify for efficient deep comparison
  const isDirty = useCallback(() => {
    return !isEqual(formData, initialValues)
  }, [formData, initialValues])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
    }
  }, [])

  return {
    formData,
    setFormData: updateFormData,
    setField,
    clearCache,
    resetForm,
    isRestored,
    hasUnsavedChanges,
    isDirty,
  }
}

/**
 * Utility to clear all form caches (e.g., on logout)
 */
export async function clearAllFormCaches(): Promise<void> {
  try {
    const allKeys = await AsyncStorage.getAllKeys()
    const formCacheKeys = allKeys.filter(key => key.startsWith(FORM_CACHE_PREFIX))
    if (formCacheKeys.length > 0) {
      await AsyncStorage.multiRemove(formCacheKeys)
      formLogger.log(`Cleared ${formCacheKeys.length} form caches`)
    }
  } catch (error) {
    formLogger.error('Error clearing all caches:', error)
  }
}

export default usePersistedForm
