/**
 * Legacy theme export for backward compatibility
 * Use useTheme() hook from '../theme' for dynamic theme support
 */

import { colors, spacing } from '../theme/designSystem2025'

// Export a simplified theme object compatible with legacy code
const theme = {
  colors: {
    primary: colors.primary[500],
    primaryLight: colors.primary[100],
    secondary: colors.accent.gold,
    background: colors.surface.light,
    surface: colors.surface.light,
    text: colors.neutral[900],
    textSecondary: colors.neutral[600],
    textLight: colors.neutral[400],
    border: colors.neutral[200],
    error: colors.semantic.error,
    success: colors.semantic.success,
    warning: colors.semantic.warning,
  },
  spacing,
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
  },
}

export default theme
