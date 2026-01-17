/**
 * Hook useTheme pour accéder facilement au Design System 2025
 * Fournit des helpers et raccourcis pour l'utilisation des tokens
 */

import { useContext } from 'react'
import { TextStyle, ViewStyle } from 'react-native'
import { ThemeContext, Theme } from './ThemeContext'

// Type helpers
type SpacingKey = keyof Theme['spacing']
type RadiusKey = keyof Theme['radius']
type ShadowKey = keyof Theme['shadows']
type TypographyKey = keyof Theme['typography']['fontSize']
type AnimationDuration = keyof Theme['animations']['duration']

/**
 * Hook principal pour accéder au thème et aux helpers
 */
export const useTheme = () => {
  const context = useContext(ThemeContext)

  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }

  const { theme, setThemeMode, toggleTheme, updateAccessibility, resetTheme } = context

  // Helper functions
  const helpers = {
    /**
     * Get spacing value with multiplier support
     * @param key - Spacing key or multiplier
     * @example spacing('md') // 16
     * @example spacing(4) // 16 (4 * 4px base)
     */
    spacing: (key: SpacingKey | number): number => {
      if (typeof key === 'number') {
        return key * 4 // Base 4px system
      }
      return theme.spacing[key]
    },

    /**
     * Get border radius value
     * @param key - Radius key
     * @example radius('xl') // 12
     */
    radius: (key: RadiusKey): number => {
      return theme.radius[key]
    },

    /**
     * Get shadow style object
     * @param key - Shadow key
     * @example shadow('card')
     */
    shadow: (key: ShadowKey): ViewStyle => {
      return theme.shadows[key]
    },

    /**
     * Get typography styles with accessibility support
     * @param key - Typography key
     * @example typography('h1')
     */
    typography: (key: TypographyKey): TextStyle => {
      const baseStyle = theme.typography.fontSize[key]
      const multiplier = theme.accessibility.fontSizeMultiplier

      return {
        fontSize: baseStyle.size * multiplier,
        lineHeight: baseStyle.lineHeight * multiplier,
        fontWeight: theme.accessibility.boldText
          ? 'bold'
          : baseStyle.weight,
        letterSpacing: 'letterSpacing' in baseStyle
          ? baseStyle.letterSpacing
          : undefined,
      }
    },

    /**
     * Get animation duration with accessibility support
     * @param key - Animation duration key
     * @example duration('normal') // 300 (or 0 if reduceMotion is true)
     */
    duration: (key: AnimationDuration): number => {
      return theme.animations.duration[key]
    },

    /**
     * Create glassmorphism style
     * @param opacity - Glass opacity (0-1)
     * @example glass(0.8)
     */
    glass: (opacity = 0.8): ViewStyle => ({
      backgroundColor: theme.isDark
        ? `rgba(255, 255, 255, ${opacity * 0.1})`
        : `rgba(255, 255, 255, ${opacity})`,
      // @ts-ignore - backdropFilter is not in React Native ViewStyle but may be supported
      backdropFilter: 'blur(12px)',
      borderColor: theme.isDark
        ? `rgba(255, 255, 255, ${opacity * 0.2})`
        : `rgba(255, 255, 255, ${opacity * 0.5})`,
      borderWidth: 1,
    }),

    /**
     * Apply gradient background (React Native compatible)
     * Note: Requires react-native-linear-gradient
     * @param gradient - Gradient name from theme
     * @example gradient('navGradient')
     */
    gradient: (gradient: keyof Theme['gradients']) => {
      return {
        colors: theme.gradients[gradient],
        start: { x: 0, y: 0 },
        end: { x: 1, y: 1 },
      }
    },

    /**
     * Get color with opacity
     * @param color - Hex color
     * @param opacity - Opacity value (0-1)
     * @example withOpacity(theme.colors.primary[500], 0.5)
     */
    withOpacity: (color: string, opacity: number): string => {
      const hex = color.replace('#', '')
      const r = parseInt(hex.substring(0, 2), 16)
      const g = parseInt(hex.substring(2, 4), 16)
      const b = parseInt(hex.substring(4, 6), 16)
      return `rgba(${r}, ${g}, ${b}, ${opacity})`
    },

    /**
     * Get color based on product expiration status
     * @param daysUntilExpiration - Days until product expires
     * @example getExpirationStatusColor(2) // returns warning color
     */
    getExpirationStatusColor: (daysUntilExpiration?: number): string => {
      if (!daysUntilExpiration) return theme.colors.neutral[500]
      if (daysUntilExpiration <= 1) return theme.colors.semantic.error
      if (daysUntilExpiration <= 3) return theme.colors.semantic.warning
      return theme.colors.semantic.success
    },

    /**
     * Get color based on reservation status
     * @param status - Reservation status
     * @param pendingAction - Optional pending action (delete, update)
     * @example getReservationStatusColor('confirmed') // returns info color
     */
    getReservationStatusColor: (status: string, pendingAction?: string): string => {
      if (pendingAction) {
        return pendingAction === 'delete'
          ? theme.colors.semantic.warning
          : theme.colors.accent.blue
      }

      switch (status) {
        case 'pending':
          return theme.colors.semantic.warning
        case 'confirmed':
          return theme.colors.semantic.info
        case 'ready':
          return theme.colors.semantic.success
        case 'completed':
          return theme.colors.primary[600]
        case 'cancelled':
          return theme.colors.semantic.error
        case 'expired':
          return theme.colors.neutral[400]
        default:
          return theme.colors.neutral[500]
      }
    },

    /**
     * Get color based on payment status
     * @param status - Payment status
     * @example getPaymentStatusColor('success') // returns success color
     */
    getPaymentStatusColor: (status: string): string => {
      switch (status) {
        case 'pending':
          return theme.colors.semantic.warning
        case 'processing':
          return theme.colors.semantic.info
        case 'success':
          return theme.colors.semantic.success
        case 'failed':
          return theme.colors.semantic.error
        case 'refunded':
          return theme.colors.neutral[400]
        default:
          return theme.colors.neutral[500]
      }
    },

    /**
     * Create card style preset
     * @param elevated - Add elevation/shadow
     * @example cardStyle(true)
     */
    cardStyle: (elevated = true): ViewStyle => ({
      backgroundColor: theme.colors.cardBackground,
      borderRadius: theme.radius.xl,
      padding: theme.spacing.md,
      borderWidth: 1,
      borderColor: theme.colors.cardBorder,
      ...(elevated ? theme.shadows.card : {}),
    }),

    /**
     * Create input style preset
     * @param focused - Is input focused
     * @example inputStyle(false)
     */
    inputStyle: (focused = false): ViewStyle => ({
      backgroundColor: theme.colors.inputBackground,
      borderRadius: theme.radius.lg,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderWidth: 1,
      borderColor: focused
        ? theme.colors.inputBorderFocus
        : theme.colors.inputBorder,
      // @ts-ignore - fontSize is not in ViewStyle but is used for TextInput styleization
      fontSize: theme.typography.fontSize.body.size * theme.accessibility.fontSizeMultiplier,
    }),

    /**
     * Create button style preset
     * @param variant - Button variant
     * @param size - Button size
     * @example buttonStyle('primary', 'md')
     */
    buttonStyle: (
      variant: 'primary' | 'secondary' | 'ghost' | 'danger' = 'primary',
      size: 'sm' | 'md' | 'lg' = 'md'
    ): ViewStyle => {
      const sizes = {
        sm: { paddingHorizontal: 12, paddingVertical: 6, fontSize: 14 },
        md: { paddingHorizontal: 20, paddingVertical: 10, fontSize: 16 },
        lg: { paddingHorizontal: 28, paddingVertical: 14, fontSize: 18 },
      }

      const baseStyle: ViewStyle = {
        borderRadius: theme.radius.xl,
        ...sizes[size],
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
      }

      switch (variant) {
        case 'primary':
          return {
            ...baseStyle,
            backgroundColor: theme.colors.primary[500],
            ...theme.shadows.md,
          }
        case 'secondary':
          return {
            ...baseStyle,
            backgroundColor: theme.colors.accent.orange,
            ...theme.shadows.sm,
          }
        case 'ghost':
          return {
            ...baseStyle,
            backgroundColor: 'transparent',
            borderWidth: 1,
            borderColor: theme.colors.border,
          }
        case 'danger':
          return {
            ...baseStyle,
            backgroundColor: theme.colors.error,
            ...theme.shadows.sm,
          }
        default:
          return baseStyle
      }
    },

    /**
     * Get responsive value based on screen size
     * Note: Requires Dimensions API usage
     * @param values - Object with breakpoint values
     * @example responsive({ sm: 10, md: 20, lg: 30 })
     */
    responsive: <T,>(values: Partial<Record<'xs' | 'sm' | 'md' | 'lg' | 'xl', T>>): T | undefined => {
      // This would need actual screen width from Dimensions API
      // Simplified for now - would be enhanced in real implementation
      return values.sm
    },
  }

  // Extract conflicting helpers and rename them
  const {
    spacing: getSpacing,
    radius: getRadius,
    typography: getTypography,
    ...otherHelpers
  } = helpers

  return {
    // Theme object properties (direct access like theme.colors.primary[500])
    colors: theme.colors,
    spacing: theme.spacing, // Keep as object, not function
    radius: theme.radius, // Keep as object, not function
    shadows: theme.shadows,
    typography: theme.typography, // Keep as object, not function
    animations: theme.animations,
    gradients: theme.gradients,
    zIndex: theme.zIndex,
    opacity: theme.opacity,
    breakpoints: theme.breakpoints,
    isDark: theme.isDark,
    mode: theme.mode,
    accessibility: theme.accessibility,

    // Renamed helper functions (to avoid conflicts with theme properties)
    getSpacing, // Was spacing()
    getRadius, // Was radius()
    getTypography, // Was typography()

    // Other helper functions (call like theme.withOpacity(), theme.cardStyle())
    ...otherHelpers,

    // Theme control functions
    setThemeMode,
    toggleTheme,
    updateAccessibility,
    resetTheme,
  }
}

export default useTheme