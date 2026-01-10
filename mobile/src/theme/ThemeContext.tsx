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
  interactiveSurface: string
  interactiveSurfaceActive: string
  interactiveBorder: string
  interactiveBorderActive: string
  interactiveText: string
  interactiveTextActive: string
  badgeBackground: string
  badgeBackgroundStrong: string
  badgeText: string
  controlSurface: string
  controlSurfaceActive: string
  controlIcon: string
  disabledSurface: string
  disabledBorder: string
  disabledText: string

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
    const neutralPalette = base.neutral

    if (isDark) {
      // 🎨 DARK MODE 2025 - Palette optimisée pour contraste
      return {
        // Keep base colors
        primary: base.primary,
        neutral: neutralPalette,
        gray: neutralPalette,
        accent: {
          ...base.accent,
          blue: '#2563EB', // Info color avec meilleur contraste
        },
        semantic: {
          success: '#10B981', // Vert optimisé pour dark
          warning: '#F59E0B', // Orange vif
          error: '#DC2626', // Rouge vif
          info: '#2563EB', // Bleu optimisé
        },
        surface: base.surface,

        // Dark mode specific - Palette 2025
        background: '#0A0F1A', // Fond page (plus sombre)
        backgroundSecondary: '#121823', // Surface 1
        backgroundTertiary: '#161E2C', // Surface 2
        text: '#E9EDF5', // Texte principal (meilleur contraste)
        textSecondary: '#A9B4C6', // Texte secondaire (moins pâle)
        textTertiary: '#6B7284', // Texte tertiaire/désactivé
        textInverse: base.neutral[900],
        border: '#1F2A3A', // Bordures/dividers
        borderLight: '#161E2C',
        divider: '#1F2A3A',

        // Components - Surfaces renforcées
        cardBackground: '#161E2C', // Cards opaques foncées
        cardBorder: '#1F2A3A',
        inputBackground: '#121823',
        inputBorder: '#1F2937',
        inputBorderFocus: '#10B981',
        interactiveSurface: '#1B2433', // Pills/filtres
        interactiveSurfaceActive: '#10B981',
        interactiveBorder: '#2E3A4D',
        interactiveBorderActive: '#10B981',
        interactiveText: '#E9EDF5',
        interactiveTextActive: '#0B140F', // Texte sur fond vert
        badgeBackground: '#1B2433',
        badgeBackgroundStrong: '#10B981', // Badges pleins
        badgeText: '#E9EDF5',
        controlSurface: '#1F2937', // Toggle track off
        controlSurfaceActive: '#10B981', // Toggle track on
        controlIcon: '#F8FAFF', // Thumb
        disabledSurface: '#1F2937',
        disabledBorder: '#2B3547',
        disabledText: '#4B5565', // Plus sombre que texte secondaire

        // Status colors - Renforcés
        success: '#10B981',
        warning: '#F59E0B',
        error: '#DC2626',
        info: '#2563EB',

        // Overlay
        overlay: 'rgba(0, 0, 0, 0.8)',
        overlayLight: 'rgba(0, 0, 0, 0.4)',
      }
    }

    // Light mode
    return {
      // Keep base colors
      primary: base.primary,
      neutral: neutralPalette,
      gray: neutralPalette,
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
      interactiveSurface: base.surface.light,
      interactiveSurfaceActive: base.primary[50],
      interactiveBorder: base.neutral[200],
      interactiveBorderActive: base.primary[200],
      interactiveText: base.neutral[700],
      interactiveTextActive: base.primary[700],
      badgeBackground: base.primary[50],
      badgeBackgroundStrong: base.primary[100],
      badgeText: base.primary[700],
      controlSurface: base.primary[50],
      controlSurfaceActive: base.primary[100],
      controlIcon: base.primary[600],
      disabledSurface: base.neutral[200],
      disabledBorder: base.neutral[300],
      disabledText: base.neutral[500],

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
    // ✅ RÉACTIVÉ: Freeze résolu après relance propre
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
      // Error loading theme preferences handled silently
    }
  }

  const setThemeMode = async (mode: ThemeMode) => {
    try {
      setThemeModeState(mode)
      await AsyncStorage.setItem(STORAGE_KEYS.THEME_MODE, mode)
    } catch (error) {
      // Error saving theme mode handled silently
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
      // Error saving accessibility settings handled silently
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
      // Error resetting theme handled silently
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