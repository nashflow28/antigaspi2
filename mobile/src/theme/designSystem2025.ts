/**
 * Design System 2025 - Tokens et configuration
 * Unifié avec le design system web pour cohérence visuelle
 */

import { Platform } from 'react-native'

// Palette de couleurs principale
export const colors = {
  // Primary - Vieil or (élégant, vintage)
  primary: {
    50: '#FBF8F0',
    100: '#F7F0E0',
    200: '#F0E3C2',
    300: '#E8D49A',
    400: '#E0C374',
    500: '#DCB253', // Main brand color - Vieil or
    600: '#C4963A',
    700: '#A67B28',
    800: '#88631C',
    900: '#6B4E15',
  },

  // Neutral - Gray scale
  neutral: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },

  // Accent colors
  accent: {
    blue: '#3B82F6',
    orange: '#FB923C', // Secondary - économies
    red: '#EF4444',
    yellow: '#FCD34D',
    purple: '#A78BFA',
  },

  // Surface colors
  surface: {
    light: '#FFFFFF',
    muted: '#F3F4F6',
    dark: '#111827',
    darker: '#0B1120',
  },

  // Semantic colors
  semantic: {
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
  },

  // Overlay colors
  overlay: {
    light: 'rgba(255, 255, 255, 0.9)',
    medium: 'rgba(15, 23, 42, 0.6)',
    dark: 'rgba(0, 0, 0, 0.8)',
  },
}

// Gradients
export const gradients = {
  navGradient: ['#DCB253', '#A67B28'], // 120deg equivalent
  emeraldGlass: ['rgba(220, 178, 83, 0.1)', 'rgba(220, 178, 83, 0.04)'],
  cardGradient: ['#DCB253', '#C4963A'],
  promoGradient: ['#F59E0B', '#DC2626'],
  glassMorphism: ['rgba(255, 255, 255, 0.15)', 'rgba(255, 255, 255, 0.05)'],
}

// Typography
export const typography = {
  // Font families
  fontFamily: {
    sans: Platform.select({
      ios: 'System',
      android: 'Roboto',
      default: 'System',
    }),
    display: Platform.select({
      ios: 'System', // Will use SF Pro on iOS
      android: 'Roboto',
      default: 'System',
    }),
    heading: Platform.select({
      ios: 'System',
      android: 'Roboto',
      default: 'System',
    }),
    mono: Platform.select({
      ios: 'Menlo',
      android: 'monospace',
      default: 'monospace',
    }),
  },

  // Font sizes and line heights
  fontSize: {
    caption: { size: 12, lineHeight: 16, weight: '400' as const },
    small: { size: 14, lineHeight: 20, weight: '400' as const },
    body: { size: 16, lineHeight: 26, weight: '400' as const },
    h4: { size: 18, lineHeight: 26, weight: '500' as const },
    h3: { size: 20, lineHeight: 26, weight: '600' as const },
    h2: { size: 24, lineHeight: 30, weight: '600' as const },
    h1: { size: 32, lineHeight: 38, weight: '700' as const },
    displaySm: { size: 48, lineHeight: 58, weight: '700' as const, letterSpacing: -0.96 },
    displayMd: { size: 64, lineHeight: 70, weight: '700' as const, letterSpacing: -1.28 },
    displayLg: { size: 80, lineHeight: 80, weight: '700' as const, letterSpacing: -1.6 },
    displayXl: { size: 96, lineHeight: 96, weight: '700' as const, letterSpacing: -1.92 },
  },

  // Font weights
  fontWeight: {
    thin: '100' as const,
    light: '300' as const,
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    black: '900' as const,
  },
}

// Spacing system (4px base)
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
  '4xl': 96,
  '5xl': 128,
}

// Border radius
export const radius = {
  none: 0,
  sm: 2,
  md: 4,
  lg: 8,
  xl: 12,
  '2xl': 16,
  '3xl': 24,
  '4xl': 32,
  full: 9999,
}

// Shadows (React Native format)
export const shadows = {
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
  glow: {
    shadowColor: 'rgba(16, 185, 129, 0.45)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  toast: {
    shadowColor: 'rgba(15, 23, 42, 0.45)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
}

// Animation durations
export const animations = {
  duration: {
    instant: 100,
    fast: 200,
    normal: 300,
    slow: 600,
    verySlow: 800,
  },
  // React Native compatible easing functions
  easing: {
    linear: { x1: 0, y1: 0, x2: 1, y2: 1 },
    easeIn: { x1: 0.42, y1: 0, x2: 1, y2: 1 },
    easeOut: { x1: 0, y1: 0, x2: 0.58, y2: 1 },
    easeInOut: { x1: 0.42, y1: 0, x2: 0.58, y2: 1 },
    springOut: { x1: 0.16, y1: 1, x2: 0.3, y2: 1 },
  },
}

// Z-index layers
export const zIndex = {
  base: 0,
  dropdown: 10,
  sticky: 20,
  fixed: 30,
  modalBackdrop: 40,
  modal: 50,
  popover: 60,
  tooltip: 70,
  notification: 80,
}

// Screen breakpoints (for responsive design reference)
export const breakpoints = {
  xs: 320,
  sm: 375,
  md: 414, // Large phones
  lg: 768, // Tablets
  xl: 1024, // Large tablets
}

// Opacity levels
export const opacity = {
  transparent: 0,
  subtle: 0.05,
  light: 0.1,
  medium: 0.3,
  heavy: 0.6,
  solid: 0.9,
  opaque: 1,
}

// Export theme object for easy access
export const designSystem2025 = {
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
}

// Helper function to get spacing value
export const getSpacing = (multiplier: number): number => {
  return multiplier * 4 // Base 4px system
}

// Helper function to get color with opacity
export const withOpacity = (color: string, opacity: number): string => {
  // Convert hex to rgba
  const hex = color.replace('#', '')
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${opacity})`
}

export default designSystem2025