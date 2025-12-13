/**
 * Internationalization (i18n) Service
 *
 * BUG FIX #18: Centralized translation system for all UI strings
 *
 * Usage:
 * ```typescript
 * import { t, useTranslation } from '../i18n'
 *
 * // Direct usage
 * const text = t('auth.login') // 'Connexion'
 *
 * // With hook (re-renders on language change)
 * const { t, locale, setLocale } = useTranslation()
 * <Text>{t('common.loading')}</Text>
 * ```
 */

import { useState, useCallback, useMemo, useEffect } from 'react'
import * as Localization from 'expo-localization'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { fr, TranslationKeys } from './locales/fr'
import { en } from './locales/en'

// Supported locales
export type SupportedLocale = 'fr' | 'en'

// Translation mapping
const translations: Record<SupportedLocale, TranslationKeys> = {
  fr,
  en,
}

// Storage key for persisted locale preference
const LOCALE_STORAGE_KEY = 'app_locale'

// Default locale
const DEFAULT_LOCALE: SupportedLocale = 'fr'

// Current locale state (singleton)
let currentLocale: SupportedLocale = DEFAULT_LOCALE
let localeListeners: Array<(locale: SupportedLocale) => void> = []

/**
 * Get device locale and map to supported locale
 */
const getDeviceLocale = (): SupportedLocale => {
  try {
    const deviceLocale = Localization.getLocales()[0]?.languageCode
    if (deviceLocale && deviceLocale in translations) {
      return deviceLocale as SupportedLocale
    }
  } catch {
    // Fallback to default
  }
  return DEFAULT_LOCALE
}

/**
 * Initialize i18n with persisted or device locale
 */
export const initI18n = async (): Promise<void> => {
  try {
    const storedLocale = await AsyncStorage.getItem(LOCALE_STORAGE_KEY)
    if (storedLocale && storedLocale in translations) {
      currentLocale = storedLocale as SupportedLocale
    } else {
      currentLocale = getDeviceLocale()
    }
  } catch {
    currentLocale = getDeviceLocale()
  }
}

/**
 * Get the current locale
 */
export const getLocale = (): SupportedLocale => currentLocale

/**
 * Set the current locale
 */
export const setLocale = async (locale: SupportedLocale): Promise<void> => {
  if (locale === currentLocale) return

  currentLocale = locale

  try {
    await AsyncStorage.setItem(LOCALE_STORAGE_KEY, locale)
  } catch {
    // Continue without persisting
  }

  // Notify listeners
  localeListeners.forEach((listener) => listener(locale))
}

/**
 * Subscribe to locale changes
 */
export const subscribeToLocale = (
  listener: (locale: SupportedLocale) => void
): (() => void) => {
  localeListeners.push(listener)
  return () => {
    localeListeners = localeListeners.filter((l) => l !== listener)
  }
}

/**
 * Type-safe path accessor for nested translation keys
 */
type PathKeys<T, Prefix extends string = ''> = T extends object
  ? {
      [K in keyof T]: K extends string
        ? T[K] extends object
          ? PathKeys<T[K], `${Prefix}${K}.`>
          : `${Prefix}${K}`
        : never
    }[keyof T]
  : never

export type TranslationKey = PathKeys<TranslationKeys>

/**
 * Get translation by dot-notation key path
 */
const getNestedValue = (obj: any, path: string): string => {
  const keys = path.split('.')
  let value = obj

  for (const key of keys) {
    if (value === undefined || value === null) {
      return path // Return key if not found
    }
    value = value[key]
  }

  return typeof value === 'string' ? value : path
}

/**
 * Translate a key to the current locale
 *
 * @param key - Dot-notation path to translation (e.g., 'auth.login')
 * @param params - Optional parameters for interpolation
 * @returns Translated string
 */
export function t(key: string, params?: Record<string, string | number>): string {
  const translation = getNestedValue(translations[currentLocale], key)

  if (!params) {
    return translation
  }

  // Simple interpolation: {{name}} -> value
  return Object.entries(params).reduce(
    (str, [paramKey, paramValue]) =>
      str.replace(new RegExp(`{{${paramKey}}}`, 'g'), String(paramValue)),
    translation
  )
}

/**
 * React hook for translations with reactive locale changes
 */
export function useTranslation() {
  const [locale, setLocaleState] = useState<SupportedLocale>(currentLocale)

  useEffect(() => {
    // Subscribe to locale changes
    const unsubscribe = subscribeToLocale((newLocale) => {
      setLocaleState(newLocale)
    })

    return unsubscribe
  }, [])

  const translate = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      return t(key, params)
    },
    [locale] // Re-create when locale changes
  )

  const changeLocale = useCallback(async (newLocale: SupportedLocale) => {
    await setLocale(newLocale)
    setLocaleState(newLocale)
  }, [])

  const availableLocales = useMemo(
    () => Object.keys(translations) as SupportedLocale[],
    []
  )

  return {
    t: translate,
    locale,
    setLocale: changeLocale,
    availableLocales,
    isRTL: false, // French and English are LTR
  }
}

// Export locales for direct access if needed
export { fr, en }
export type { TranslationKeys }
