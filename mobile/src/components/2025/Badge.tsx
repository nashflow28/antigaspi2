/**
 * Badge 2025 - Composant badge avec Design System 2025
 * Variantes: primary, secondary, promo, success, warning, error, info
 * Tailles: sm, md, lg
 * Support: dot indicator, custom colors
 */

import React, { useMemo } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native'
import { useTheme } from '../../theme'

export type BadgeVariant =
  | 'primary'
  | 'secondary'
  | 'promo'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'neutral'

export type BadgeSize = 'sm' | 'md' | 'lg'

export interface BadgeProps {
  // Content
  children: React.ReactNode

  // Appearance
  variant?: BadgeVariant
  size?: BadgeSize
  dot?: boolean
  outline?: boolean

  // Style overrides
  style?: ViewStyle
  textStyle?: TextStyle
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  dot = false,
  outline = false,
  style,
  textStyle,
}) => {
  const theme = useTheme()

  // Sizes configuration
  const sizes = {
    sm: {
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: 2,
      fontSize: theme.typography.fontSize.caption.size,
      dotSize: 6,
    },
    md: {
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.xs,
      fontSize: theme.typography.fontSize.small.size,
      dotSize: 8,
    },
    lg: {
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.sm,
      fontSize: theme.typography.fontSize.body.size,
      dotSize: 10,
    },
  }

  const currentSize = useMemo(() => sizes[size], [size])

  // Variant styles
  const getVariantStyles = useMemo((): { container: ViewStyle; text: TextStyle } => {
    const variants = {
      primary: {
        bg: theme.colors.primary[500],
        bgLight: theme.withOpacity(theme.colors.primary[500], 0.1),
        border: theme.colors.primary[500],
        text: theme.colors.textInverse,
        textOutline: theme.colors.primary[500],
      },
      secondary: {
        bg: theme.colors.accent.orange,
        bgLight: theme.withOpacity(theme.colors.accent.orange, 0.1),
        border: theme.colors.accent.orange,
        text: theme.colors.textInverse,
        textOutline: theme.colors.accent.orange,
      },
      promo: {
        bg: theme.colors.accent.red,
        bgLight: theme.withOpacity(theme.colors.accent.red, 0.1),
        border: theme.colors.accent.red,
        text: theme.colors.textInverse,
        textOutline: theme.colors.accent.red,
      },
      success: {
        bg: theme.colors.success,
        bgLight: theme.withOpacity(theme.colors.success, 0.1),
        border: theme.colors.success,
        text: theme.colors.textInverse,
        textOutline: theme.colors.success,
      },
      warning: {
        bg: theme.colors.warning,
        bgLight: theme.withOpacity(theme.colors.warning, 0.1),
        border: theme.colors.warning,
        text: theme.colors.textInverse,
        textOutline: theme.colors.warning,
      },
      error: {
        bg: theme.colors.error,
        bgLight: theme.withOpacity(theme.colors.error, 0.1),
        border: theme.colors.error,
        text: theme.colors.textInverse,
        textOutline: theme.colors.error,
      },
      info: {
        bg: theme.colors.info,
        bgLight: theme.withOpacity(theme.colors.info, 0.1),
        border: theme.colors.info,
        text: theme.colors.textInverse,
        textOutline: theme.colors.info,
      },
      neutral: {
        bg: theme.colors.neutral[600],
        bgLight: theme.withOpacity(theme.colors.neutral[600], 0.1),
        border: theme.colors.neutral[600],
        text: theme.colors.textInverse,
        textOutline: theme.colors.neutral[600],
      },
    }

    const colors = variants[variant]

    if (outline) {
      return {
        container: {
          backgroundColor: colors.bgLight,
          borderWidth: 1,
          borderColor: colors.border,
        },
        text: {
          color: colors.textOutline,
        },
      }
    }

    return {
      container: {
        backgroundColor: colors.bg,
      },
      text: {
        color: colors.text,
      },
    }
  }, [variant, outline, theme])

  const containerStyle: ViewStyle = useMemo(() => ({
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: currentSize.paddingHorizontal,
    paddingVertical: currentSize.paddingVertical,
    borderRadius: theme.radius.full,
    alignSelf: 'flex-start',
    gap: dot ? theme.spacing.xs : 0,
    ...getVariantStyles.container,
    ...style,
  }), [currentSize, theme.radius.full, dot, theme.spacing.xs, getVariantStyles.container, style])

  const textStyleComputed: TextStyle = useMemo(() => ({
    fontSize: currentSize.fontSize,
    fontWeight: '600',
    ...getVariantStyles.text,
    ...textStyle,
  }), [currentSize.fontSize, getVariantStyles.text, textStyle])

  const dotStyle: ViewStyle = useMemo(() => ({
    width: currentSize.dotSize,
    height: currentSize.dotSize,
    borderRadius: currentSize.dotSize / 2,
    backgroundColor: getVariantStyles.text.color,
  }), [currentSize.dotSize, getVariantStyles.text.color])

  return (
    <View style={containerStyle}>
      {dot && <View style={dotStyle} />}
      <Text style={textStyleComputed}>{children}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  // Reserved for future use
})

export default Badge