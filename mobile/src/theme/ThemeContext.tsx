/**
 * Theme Context et Provider pour le Design System 2025
 * Gestion du thème (light/dark) et accessibilité
 */

import React, { createContext, useState, useEffect, ReactNode } from 'react'
import { useColorScheme, Appearance } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  colors as baseColors,
  designSystem2025,
  withOpacity,
} from './designSystem2025'

// Types
export type ThemeMode = 'light' | 'dark' | 'auto'

export interface AccessibilitySettings {
  fontSizeMultiplier: number
  highContrast: boolean
  reduceMotion: boolean
  boldText: boolean
}

export interface ThemeColors {
  // Primary colors
  primary: typeof baseColors.primary
  neutral: typeof baseColors.neutral
  gray: typeof baseColors.neutral
  accent: typeof baseColors.accent
  semantic: typeof baseColors.semantic

  // Surface colors
  surface: typeof baseColors.surface

  // Dynamic theme colors
  background: string
  backgroundSecondary: string
  backgroundTertiary: string
  text: string
  textSecondary: string
  textTertiary: string
  textInverse: string
  border: string
  borderLight: string
  divider: string

  // Component colors
  cardBackground: string
  cardBorder: string
  inputBackground: string
  inputBorder: string
  inputBorderFocus: string

  // Status colors
  success: string
  warning: string
  error: string
  info: string

  // Overlay
  overlay: string
  overlayLight: string
}

export interface Theme {
  mode: ThemeMode
  isDark: boolean
  colors: ThemeColors
  accessibility: AccessibilitySettings
  gradients: typeof designSystem2025.gradients
  typography: typeof designSystem2025.typography
  spacing: typeof designSystem2025.spacing
  radius: typeof designSystem2025.radius
  shadows: typeof designSystem2025.shadows
  animations: typeof designSystem2025.animations
  breakpoints: typeof designSystem2025.breakpoints
  zIndex: typeof designSystem2025.zIndex
  opacity: typeof designSystem2025.opacity
}

export interface ThemeContextValue {
  theme: Theme
  setThemeMode: (mode: ThemeMode) => Promise<void>
  toggleTheme: () => Promise<void>
  updateAccessibility: (settings: Partial<AccessibilitySettings>) => Promise<void>
  resetTheme: () => Promise<void>
}

// Storage keys
const STORAGE_KEYS = {
  THEME_MODE: '@antigaspi:theme_mode',
  ACCESSIBILITY: '@antigaspi:accessibility',
}

// Default accessibility settings
const defaultAccessibility: AccessibilitySettings = {
  fontSizeMultiplier: 1,
  highContrast: false,
  reduceMotion: false,
  boldText: false,
}

// Create context
export const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

// Theme Provider Component
export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme()
  const [themeMode, setThemeModeState] = useState<ThemeMode>('auto')
  const [accessibility, setAccessibility] = useState<AccessibilitySettings>(defaultAccessibility)

  // Determine if dark mode is active
  const isDark = themeMode === 'dark' || (themeMode === 'auto' && systemColorScheme === 'dark')

  // Generate theme colors based on mode
  const getThemeColors = (): ThemeColors => {
    const base = baseColors

    if (isDark) {
      return {
        // Keep base colors
        primary: base.primary,
        neutral: base.neutral,
        gray: base.neutral,
        accent: base.accent,
        semantic: base.semantic,
        surface: base.surface,

        // Dark mode specific
        background: base.surface.darker,
        backgroundSecondary: base.surface.dark,
        backgroundTertiary: base.neutral[800],
        text: base.neutral[50],
        textSecondary: base.neutral[300],
        textTertiary: base.neutral[400],
        textInverse: base.neutral[900],
        border: base.neutral[700],
        borderLight: base.neutral[800],
        divider: withOpacity(base.neutral[700], 0.5),

        // Components
        cardBackground: base.neutral[800],
        cardBorder: base.neutral[700],
        inputBackground: base.neutral[900],
        inputBorder: base.neutral[700],
        inputBorderFocus: base.primary[500],

        // Status
        success: base.semantic.success,
        warning: base.semantic.warning,
        error: base.semantic.error,
        info: base.semantic.info,

        // Overlay
        overlay: 'rgba(0, 0, 0, 0.8)',
        overlayLight: 'rgba(0, 0, 0, 0.4)',
      }
    }

    // Light mode
    return {
      // Keep base colors
      primary: base.primary,
      neutral: base.neutral,
      gray: base.neutral,
      accent: base.accent,
      semantic: base.semantic,
      surface: base.surface,

      // Light mode specific
      background: base.surface.light,
      backgroundSecondary: base.surface.muted,
      backgroundTertiary: base.neutral[100],
      text: base.neutral[900],
      textSecondary: base.neutral[600],
      textTertiary: base.neutral[500],
      textInverse: base.neutral[50],
      border: base.neutral[200],
      borderLight: base.neutral[100],
      divider: withOpacity(base.neutral[200], 0.8),

      // Components
      cardBackground: base.surface.light,
      cardBorder: base.neutral[200],
      inputBackground: base.surface.light,
      inputBorder: base.neutral[300],
      inputBorderFocus: base.primary[500],

      // Status
      success: base.semantic.success,
      warning: base.semantic.warning,
      error: base.semantic.error,
      info: base.semantic.info,

      // Overlay
      overlay: 'rgba(15, 23, 42, 0.6)',
      overlayLight: 'rgba(15, 23, 42, 0.3)',
    }
  }

  // Build complete theme object
  const theme: Theme = {
    mode: themeMode,
    isDark,
    colors: getThemeColors(),
    accessibility,
    gradients: designSystem2025.gradients,
    typography: designSystem2025.typography,
    spacing: designSystem2025.spacing,
    radius: designSystem2025.radius,
    shadows: isDark
      ? {
          ...designSystem2025.shadows,
          // Adjust shadows for dark mode
          card: {
            ...designSystem2025.shadows.card,
            shadowColor: 'rgba(16, 185, 129, 0.2)',
          },
          glow: {
            ...designSystem2025.shadows.glow,
            shadowColor: 'rgba(16, 185, 129, 0.3)',
          },
        }
      : designSystem2025.shadows,
    animations: accessibility.reduceMotion
      ? {
          ...designSystem2025.animations,
          duration: {
            instant: 0,
            fast: 0,
            normal: 0,
            slow: 0,
            verySlow: 0,
          },
        }
      : designSystem2025.animations,
    zIndex: designSystem2025.zIndex,
    breakpoints: designSystem2025.breakpoints,
    opacity: designSystem2025.opacity,
  }

  // Load saved preferences on mount
  useEffect(() => {
    loadSavedPreferences()

    // Listen to system theme changes
    const subscription = Appearance.addChangeListener(() => {
      // Only react if in auto mode
      if (themeMode === 'auto') {
        // Force re-render with system change
        setThemeModeState('auto')
      }
    })

    return () => subscription.remove()
  }, [])

  const loadSavedPreferences = async () => {
    try {
      const [savedMode, savedAccessibility] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.THEME_MODE),
        AsyncStorage.getItem(STORAGE_KEYS.ACCESSIBILITY),
      ])

      if (savedMode) {
        setThemeModeState(savedMode as ThemeMode)
      }

      if (savedAccessibility) {
        setAccessibility(JSON.parse(savedAccessibility))
      }
    } catch (error) {
      console.error('Error loading theme preferences:', error)
    }
  }

  const setThemeMode = async (mode: ThemeMode) => {
    try {
      setThemeModeState(mode)
      await AsyncStorage.setItem(STORAGE_KEYS.THEME_MODE, mode)
    } catch (error) {
      console.error('Error saving theme mode:', error)
    }
  }

  const toggleTheme = async () => {
    const newMode: ThemeMode =
      themeMode === 'light' ? 'dark' :
      themeMode === 'dark' ? 'auto' :
      'light'

    await setThemeMode(newMode)
  }

  const updateAccessibility = async (settings: Partial<AccessibilitySettings>) => {
    try {
      const newSettings = { ...accessibility, ...settings }
      setAccessibility(newSettings)
      await AsyncStorage.setItem(STORAGE_KEYS.ACCESSIBILITY, JSON.stringify(newSettings))
    } catch (error) {
      console.error('Error saving accessibility settings:', error)
    }
  }

  const resetTheme = async () => {
    try {
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.THEME_MODE),
        AsyncStorage.removeItem(STORAGE_KEYS.ACCESSIBILITY),
      ])
      setThemeModeState('auto')
      setAccessibility(defaultAccessibility)
    } catch (error) {
      console.error('Error resetting theme:', error)
    }
  }

  const contextValue: ThemeContextValue = {
    theme,
    setThemeMode,
    toggleTheme,
    updateAccessibility,
    resetTheme,
  }

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  )
}