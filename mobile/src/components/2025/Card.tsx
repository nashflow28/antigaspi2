/**
 * Card 2025 - Composant carte avec Design System 2025
 * Variantes: elevated, flat, glass, outline
 * Support: header, footer, pressable, custom styles
 */

import React, { useMemo } from 'react'
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native'
import { useTheme } from '../../theme'

export type CardVariant = 'elevated' | 'flat' | 'glass' | 'outline'

export interface CardProps {
  // Content
  children: React.ReactNode
  header?: React.ReactNode
  footer?: React.ReactNode

  // Appearance
  variant?: CardVariant
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl'

  // Behavior
  pressable?: boolean
  onPress?: () => void

  // Accessibility
  accessibilityLabel?: string
  accessibilityHint?: string
  testID?: string

  // Style overrides
  style?: ViewStyle
  contentStyle?: ViewStyle
  headerStyle?: ViewStyle
  footerStyle?: ViewStyle
}

export const Card: React.FC<CardProps> = ({
  children,
  header,
  footer,
  variant = 'elevated',
  rounded = 'xl',
  pressable = false,
  onPress,
  accessibilityLabel,
  accessibilityHint,
  testID,
  style,
  contentStyle,
  headerStyle,
  footerStyle,
}) => {
  const theme = useTheme()

  // Get border radius
  const borderRadius = useMemo(() => theme.radius[rounded], [theme.radius, rounded])

  // Variant styles
  const getVariantStyles = useMemo((): ViewStyle => {
    switch (variant) {
      case 'elevated':
        return {
          backgroundColor: theme.colors.cardBackground,
          ...theme.shadows.card,
          borderWidth: 1,
          borderColor: theme.colors.cardBorder,
        }

      case 'flat':
        return {
          backgroundColor: theme.colors.cardBackground,
          borderWidth: 1,
          borderColor: theme.colors.cardBorder,
        }

      case 'glass':
        return {
          backgroundColor: theme.isDark
            ? theme.withOpacity(theme.colors.surface.light, 0.1)
            : theme.withOpacity(theme.colors.surface.light, 0.8),
          borderWidth: 1,
          borderColor: theme.isDark
            ? theme.withOpacity(theme.colors.surface.light, 0.2)
            : theme.withOpacity(theme.colors.surface.light, 0.5),
          ...theme.shadows.sm,
        }

      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderWidth: 2,
          borderColor: theme.colors.border,
        }

      default:
        return {}
    }
  }, [variant, theme])

  const containerStyle: ViewStyle = useMemo(() => ({
    borderRadius,
    overflow: 'hidden',
    ...getVariantStyles,
    ...style,
  }), [borderRadius, getVariantStyles, style])

  const contentPadding: ViewStyle = useMemo(() => ({
    padding: theme.spacing.md,
    ...contentStyle,
  }), [theme.spacing.md, contentStyle])

  const headerContainerStyle: ViewStyle = useMemo(() => ({
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.divider,
    ...headerStyle,
  }), [theme.spacing.md, theme.colors.divider, headerStyle])

  const footerContainerStyle: ViewStyle = useMemo(() => ({
    padding: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.divider,
    ...footerStyle,
  }), [theme.spacing.md, theme.colors.divider, footerStyle])

  const renderCard = () => (
    <View style={containerStyle} testID={pressable ? undefined : testID}>
      {header && <View style={headerContainerStyle}>{header}</View>}
      <View style={contentPadding}>{children}</View>
      {footer && <View style={footerContainerStyle}>{footer}</View>}
    </View>
  )

  // Only make pressable if pressable prop is explicitly true AND onPress exists
  const shouldBePressable = pressable === true && onPress !== undefined

  if (shouldBePressable) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        style={styles.touchable}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        accessible={true}
        testID={testID}
      >
        {renderCard()}
      </TouchableOpacity>
    )
  }

  return renderCard()
}

const styles = StyleSheet.create({
  touchable: {
    // Ensure TouchableOpacity doesn't add extra styling
  },
})

export default Card
