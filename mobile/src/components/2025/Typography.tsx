/**
 * Typography 2025 - Composants de texte avec Design System 2025
 * Variantes: heading, body, caption, display
 * Support: color variants, alignment, truncation
 */

import React, { useMemo } from 'react'
import {
  Text,
  TextProps as RNTextProps,
  TextStyle,
} from 'react-native'
import { useTheme } from '../../theme'

export type TypographyVariant =
  | 'displayXl'
  | 'displayLg'
  | 'displayMd'
  | 'displaySm'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'body'
  | 'small'
  | 'caption'

export type TypographyColor =
  | 'default'
  | 'secondary'
  | 'tertiary'
  | 'inverse'
  | 'primary'
  | 'success'
  | 'warning'
  | 'error'

export interface TypographyProps extends RNTextProps {
  // Content
  children: React.ReactNode

  // Appearance
  variant?: TypographyVariant
  color?: TypographyColor
  align?: 'left' | 'center' | 'right' | 'justify'
  weight?: 'thin' | 'light' | 'regular' | 'medium' | 'semibold' | 'bold' | 'black'

  // Behavior
  numberOfLines?: number

  // Style override
  style?: TextStyle
}

export const Typography: React.FC<TypographyProps> = ({
  children,
  variant = 'body',
  color = 'default',
  align = 'left',
  weight,
  numberOfLines,
  style,
  ...rest
}) => {
  const theme = useTheme()

  // Get base typography styles
  const baseStyle = useMemo(() => theme.getTypography(variant), [theme, variant])

  // Get color
  const getColor = useMemo((): string => {
    switch (color) {
      case 'default':
        return theme.colors.text
      case 'secondary':
        return theme.colors.textSecondary
      case 'tertiary':
        return theme.colors.textTertiary
      case 'inverse':
        return theme.colors.textInverse
      case 'primary':
        return theme.colors.primary[500]
      case 'success':
        return theme.colors.success
      case 'warning':
        return theme.colors.warning
      case 'error':
        return theme.colors.error
      default:
        return theme.colors.text
    }
  }, [color, theme.colors])

  const textStyle: TextStyle = useMemo(() => {
    // Flatten style if it's an array (React Native Web compatibility)
    const flatStyle = Array.isArray(style) ? Object.assign({}, ...style) : style

    return {
      ...baseStyle,
      color: getColor,
      textAlign: align,
      ...(weight && theme.typography.fontWeight && { fontWeight: theme.typography.fontWeight[weight] }),
      ...flatStyle,
    }
  }, [baseStyle, getColor, align, weight, theme.typography.fontWeight, style])

  return (
    <Text style={textStyle} numberOfLines={numberOfLines} {...rest}>
      {children}
    </Text>
  )
}

// Convenience components for common use cases
export const Heading1: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="h1" {...props} />
)

export const Heading2: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="h2" {...props} />
)

export const Heading3: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="h3" {...props} />
)

export const Heading4: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="h4" {...props} />
)

export const BodyText: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="body" {...props} />
)

export const SmallText: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="small" {...props} />
)

export const CaptionText: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="caption" {...props} />
)

export const Display: React.FC<Omit<TypographyProps, 'variant'> & { size?: 'sm' | 'md' | 'lg' | 'xl' }> = ({
  size = 'md',
  ...props
}) => {
  const variantMap = {
    sm: 'displaySm' as const,
    md: 'displayMd' as const,
    lg: 'displayLg' as const,
    xl: 'displayXl' as const,
  }
  return <Typography variant={variantMap[size]} {...props} />
}

export default Typography