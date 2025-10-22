/**
 * Button 2025 - Composant bouton avec Design System 2025
 * Variantes: primary, secondary, promo, ghost, destructive
 * Tailles: sm, md, lg
 * Support: loading, disabled, icon, full-width
 */

import React, { useMemo } from 'react'
import {
  Pressable,
  Text,
  View,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native'
import { useTheme } from '../../theme'

export type ButtonVariant = 'primary' | 'secondary' | 'promo' | 'ghost' | 'destructive'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps {
  // Content
  children: React.ReactNode

  // Appearance
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean

  // State
  disabled?: boolean
  loading?: boolean

  // Icons
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode

  // Behavior
  onPress?: () => void

  // Accessibility
  accessibilityLabel?: string
  accessibilityHint?: string
  testID?: string

  // Style overrides
  style?: ViewStyle
  textStyle?: TextStyle
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  loading = false,
  leftIcon,
  rightIcon,
  onPress,
  accessibilityLabel,
  accessibilityHint,
  testID,
  style,
  textStyle,
}) => {
  const theme = useTheme()

  // Sizes configuration
  const sizes = {
    sm: {
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      fontSize: theme.typography.fontSize.small.size,
      iconSize: 16,
      gap: theme.spacing.xs,
    },
    md: {
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      fontSize: theme.typography.fontSize.body.size,
      iconSize: 20,
      gap: theme.spacing.sm,
    },
    lg: {
      paddingHorizontal: theme.spacing.xl,
      paddingVertical: theme.spacing.lg,
      fontSize: theme.typography.fontSize.h4.size,
      iconSize: 24,
      gap: theme.spacing.sm,
    },
  }

  const currentSize = useMemo(() => sizes[size], [size])

  // Variants configuration
  const getVariantStyles = useMemo((): { container: ViewStyle; text: TextStyle } => {
    switch (variant) {
      case 'primary':
        return {
          container: {
            backgroundColor: disabled
              ? theme.colors.disabledSurface
              : theme.colors.primary[500],
            ...theme.shadows.md,
          },
          text: {
            color: disabled ? theme.colors.disabledText : theme.colors.textInverse,
            fontWeight: '600',
          },
        }

      case 'secondary':
        return {
          container: {
            backgroundColor: disabled
              ? theme.colors.disabledSurface
              : theme.colors.accent.orange,
            ...theme.shadows.sm,
          },
          text: {
            color: disabled ? theme.colors.disabledText : theme.colors.textInverse,
            fontWeight: '600',
          },
        }

      case 'promo':
        return {
          container: {
            backgroundColor: disabled
              ? theme.colors.disabledSurface
              : theme.colors.accent.red,
            ...theme.shadows.glow,
          },
          text: {
            color: disabled ? theme.colors.disabledText : theme.colors.textInverse,
            fontWeight: '700',
          },
        }

      case 'ghost':
        return {
          container: {
            backgroundColor: 'transparent',
            borderWidth: 1,
            borderColor: disabled
              ? theme.colors.disabledBorder
              : theme.colors.border,
          },
          text: {
            color: disabled
              ? theme.colors.disabledText
              : theme.colors.text,
            fontWeight: '500',
          },
        }

      case 'destructive':
        return {
          container: {
            backgroundColor: disabled
              ? theme.colors.disabledSurface
              : theme.colors.error,
            ...theme.shadows.sm,
          },
          text: {
            color: disabled ? theme.colors.disabledText : theme.colors.textInverse,
            fontWeight: '600',
          },
        }

      default:
        return {
          container: {},
          text: {},
        }
    }
  }, [variant, disabled, theme])

  const containerStyle: ViewStyle = useMemo(() => ({
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: currentSize.paddingHorizontal,
    paddingVertical: currentSize.paddingVertical,
    borderRadius: theme.radius.xl,
    gap: currentSize.gap,
    opacity: disabled ? 0.6 : 1,
    ...(fullWidth && { width: '100%' }),
    ...getVariantStyles.container,
    ...style,
  }), [currentSize, disabled, fullWidth, getVariantStyles.container, style, theme.radius.xl])

  const textStyleComputed: TextStyle = useMemo(() => ({
    fontSize: currentSize.fontSize,
    ...getVariantStyles.text,
    ...textStyle,
  }), [currentSize.fontSize, getVariantStyles.text, textStyle])

  const renderContent = () => {
    if (loading) {
      return (
        <ActivityIndicator
          size="small"
          color={
            variant === 'ghost'
              ? theme.colors.primary[500]
              : theme.colors.textInverse
          }
        />
      )
    }

    return (
      <>
        {leftIcon && <View style={styles.icon}>{leftIcon}</View>}
        <Text style={textStyleComputed}>{children}</Text>
        {rightIcon && <View style={styles.icon}>{rightIcon}</View>}
      </>
    )
  }

  // Generate accessibility label from children if not provided
  const getAccessibilityLabel = (): string | undefined => {
    if (accessibilityLabel) return accessibilityLabel
    if (typeof children === 'string') return children
    return undefined
  }

  return (
    <Pressable
      style={({ pressed }) => [
        containerStyle,
        pressed && { opacity: 0.7 },
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={getAccessibilityLabel()}
      accessibilityHint={accessibilityHint}
      testID={testID}
      accessible={true}
      accessibilityState={{
        disabled: disabled || loading,
        busy: loading,
      }}
    >
      {renderContent()}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  icon: {
    justifyContent: 'center',
    alignItems: 'center',
  },
})

export default Button
