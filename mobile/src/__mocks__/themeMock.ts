/**
 * Shared Theme Mock for Jest Tests
 *
 * This mock provides a complete theme object with all necessary properties
 * to prevent "theme.getTypography is not a function" errors in tests.
 */

export const mockTheme = {
  colors: {
    background: '#FFFFFF',
    primary: { 50: '#ECFDF5', 100: '#D1FAE5', 200: '#A7F3D0', 500: '#10B981' },
    neutral: { 400: '#9CA3AF', 900: '#111827' },
    semantic: { success: '#10B981', warning: '#F59E0B', error: '#EF4444' },
    surface: { light: '#F9FAFB' },
    border: '#E5E7EB',
    text: '#111827',
    accent: { orange: '#F59E0B' },
  },
  typography: {
    fontWeight: {
      regular: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
    fontSize: {
      h1: 32,
      h2: 28,
      h3: 24,
      h4: 20,
      body: 16,
      small: 14,
      caption: 12,
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    '2xl': 48,
    '3xl': 64,
  },
  radius: {
    none: 0,
    sm: 2,
    md: 4,
    lg: 8,
    xl: 12,
    '2xl': 16,
    '3xl': 24,
    full: 9999,
  },
  shadows: {
    none: {
      shadowColor: 'transparent',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    card: {
      shadowColor: 'rgba(16, 185, 129, 0.35)',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.3,
      shadowRadius: 20,
      elevation: 5,
    },
  },
  getTypography: (variant: string) => ({
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400' as const,
    letterSpacing: 0,
  }),
  withOpacity: (color: string, opacity: number) => {
    // Simple mock implementation
    if (!color) return 'transparent'
    if (typeof color === 'string' && color.startsWith('#')) {
      // Convert hex to rgba
      const r = parseInt(color.slice(1, 3), 16)
      const g = parseInt(color.slice(3, 5), 16)
      const b = parseInt(color.slice(5, 7), 16)
      return `rgba(${r}, ${g}, ${b}, ${opacity})`
    }
    return color
  },
}

export const mockUseTheme = () => mockTheme
