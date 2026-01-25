import React, { useMemo } from 'react'
import { useWindowDimensions, TextStyle } from 'react-native'
import { Typography } from './2025'
import type { TypographyProps } from './2025/Typography'

const THEME_COLOR_VARIANTS: TypographyProps['color'][] = [
  'default',
  'secondary',
  'tertiary',
  'inverse',
  'primary',
  'success',
  'warning',
  'error',
]

export interface BrandLogoProps extends Omit<TypographyProps, 'children' | 'variant' | 'color' | 'align'> {
  /**
   * Couleur personnalisée du logo
   */
  color?: TypographyProps['color'] | string
  /**
   * Alignement du texte du logo
   */
  align?: TypographyProps['align']
  /**
   * Styles supplémentaires pour le texte
   */
  style?: TextStyle
  /**
   * Contenu du logo (par défaut : "🌱 GÊLADAL")
   */
  text?: string
}

const BrandLogo: React.FC<BrandLogoProps> = ({
  color,
  align = 'center',
  style,
  weight = 'bold',
  text = '🌱 GÊLADAL',
  ...rest
}) => {
  const { width } = useWindowDimensions()

  const fontSize = useMemo(() => {
    const dynamicSize = Math.min(width * 0.12, 48)
    return Math.max(dynamicSize, 32)
  }, [width])

  const { typographyColor, customColorStyle } = useMemo(() => {
    if (!color) {
      return { typographyColor: undefined, customColorStyle: null as TextStyle | null }
    }

    if (THEME_COLOR_VARIANTS.includes(color as TypographyProps['color'])) {
      return {
        typographyColor: color as TypographyProps['color'],
        customColorStyle: null as TextStyle | null,
      }
    }

    return {
      typographyColor: undefined,
      customColorStyle: { color } as TextStyle,
    }
  }, [color])

  const combinedStyle = useMemo(
    () => [
      { fontSize } as TextStyle,
      customColorStyle,
      style,
    ] as TextStyle | TextStyle[],
    [fontSize, customColorStyle, style]
  )

  return (
    <Typography variant="displayXl" weight={weight} align={align} color={typographyColor} style={combinedStyle as any} {...rest}>
      {text}
    </Typography>
  )
}

export default BrandLogo
