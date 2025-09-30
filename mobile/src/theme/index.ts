/**
 * Design System 2025 - Export centralisé
 * Point d'entrée unique pour tous les éléments du thème
 */

// Core exports
export { ThemeProvider } from './ThemeContext'
export { useTheme } from './useTheme'
export * from './designSystem2025'

// Re-export specific items for convenience
export {
  colors,
  gradients,
  typography,
  spacing,
  radius,
  shadows,
  animations,
  zIndex,
  breakpoints,
  opacity,
  designSystem2025,
  getSpacing,
  withOpacity,
} from './designSystem2025'

// Re-export types
export type {
  Theme,
  ThemeMode,
  ThemeColors,
  AccessibilitySettings,
  ThemeContextValue,
} from './ThemeContext'

// Default export for convenience
export { default } from './designSystem2025'