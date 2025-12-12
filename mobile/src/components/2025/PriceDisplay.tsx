/**
 * PriceDisplay - Formatted price display with discount
 *
 * Shows prices in XOF (Franc CFA) format with:
 * - Discounted price highlighted
 * - Original price struck through
 * - Discount percentage badge
 *
 * Sizes: sm, md, lg
 */

import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { useTheme } from '../../theme'

type PriceSize = 'sm' | 'md' | 'lg'

interface PriceDisplayProps {
  originalPrice: number
  discountedPrice: number
  currency?: string
  showDiscount?: boolean
  showOriginal?: boolean
  size?: PriceSize
  align?: 'left' | 'center' | 'right'
}

const SIZE_CONFIG = {
  sm: {
    discountedSize: 14,
    originalSize: 11,
    currencySize: 10,
    badgeSize: 10,
    badgePadding: 4,
    gap: 4,
  },
  md: {
    discountedSize: 18,
    originalSize: 13,
    currencySize: 12,
    badgeSize: 11,
    badgePadding: 6,
    gap: 6,
  },
  lg: {
    discountedSize: 24,
    originalSize: 16,
    currencySize: 14,
    badgeSize: 12,
    badgePadding: 8,
    gap: 8,
  },
}

/**
 * Format number as XOF currency
 * 1500 -> "1 500"
 */
const formatXOF = (amount: number): string => {
  return amount.toLocaleString('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
}

/**
 * Calculate discount percentage
 */
const calculateDiscount = (original: number, discounted: number): number => {
  if (original <= 0) return 0
  return Math.round(((original - discounted) / original) * 100)
}

const PriceDisplay: React.FC<PriceDisplayProps> = ({
  originalPrice,
  discountedPrice,
  currency = 'XOF',
  showDiscount = true,
  showOriginal = true,
  size = 'md',
  align = 'left',
}) => {
  const theme = useTheme()
  const config = SIZE_CONFIG[size]
  const discount = calculateDiscount(originalPrice, discountedPrice)
  const hasDiscount = discount > 0 && showOriginal

  const alignStyle = {
    left: 'flex-start',
    center: 'center',
    right: 'flex-end',
  }[align] as 'flex-start' | 'center' | 'flex-end'

  return (
    <View style={[styles.container, { alignItems: alignStyle }]}>
      {/* Discount badge */}
      {hasDiscount && showDiscount && (
        <View
          style={[
            styles.discountBadge,
            {
              backgroundColor: theme.colors.error,
              paddingHorizontal: config.badgePadding,
              paddingVertical: config.badgePadding / 2,
              marginBottom: config.gap / 2,
            },
          ]}
        >
          <Text
            style={[
              styles.discountText,
              { fontSize: config.badgeSize },
            ]}
          >
            -{discount}%
          </Text>
        </View>
      )}

      {/* Price row */}
      <View style={[styles.priceRow, { gap: config.gap }]}>
        {/* Discounted price */}
        <View style={styles.mainPrice}>
          <Text
            style={[
              styles.discountedPrice,
              {
                fontSize: config.discountedSize,
                color: hasDiscount ? theme.colors.primary[600] : theme.colors.text,
              },
            ]}
          >
            {formatXOF(discountedPrice)}
          </Text>
          <Text
            style={[
              styles.currency,
              {
                fontSize: config.currencySize,
                color: hasDiscount ? theme.colors.primary[600] : theme.colors.text,
              },
            ]}
          >
            {currency}
          </Text>
        </View>

        {/* Original price (struck through) */}
        {hasDiscount && (
          <Text
            style={[
              styles.originalPrice,
              {
                fontSize: config.originalSize,
                color: theme.colors.textSecondary,
              },
            ]}
          >
            {formatXOF(originalPrice)} {currency}
          </Text>
        )}
      </View>
    </View>
  )
}

/**
 * Compact price for list items (single line)
 */
export const PriceInline: React.FC<{
  originalPrice: number
  discountedPrice: number
  currency?: string
  size?: 'sm' | 'md'
}> = ({ originalPrice, discountedPrice, currency = 'XOF', size = 'sm' }) => {
  const theme = useTheme()
  const discount = calculateDiscount(originalPrice, discountedPrice)
  const hasDiscount = discount > 0

  const fontSize = size === 'sm' ? 13 : 15
  const badgeFontSize = size === 'sm' ? 10 : 11

  return (
    <View style={styles.inlineContainer}>
      {/* Discount badge */}
      {hasDiscount && (
        <View
          style={[
            styles.inlineBadge,
            { backgroundColor: theme.colors.error },
          ]}
        >
          <Text style={[styles.discountText, { fontSize: badgeFontSize }]}>
            -{discount}%
          </Text>
        </View>
      )}

      {/* Discounted price */}
      <Text
        style={[
          styles.inlineDiscountedPrice,
          {
            fontSize,
            color: hasDiscount ? theme.colors.primary[600] : theme.colors.text,
          },
        ]}
      >
        {formatXOF(discountedPrice)} {currency}
      </Text>

      {/* Original price */}
      {hasDiscount && (
        <Text
          style={[
            styles.inlineOriginalPrice,
            {
              fontSize: fontSize - 2,
              color: theme.colors.textSecondary,
            },
          ]}
        >
          {formatXOF(originalPrice)}
        </Text>
      )}
    </View>
  )
}

/**
 * Price tag variant (for cards)
 */
export const PriceTag: React.FC<{
  originalPrice: number
  discountedPrice: number
  currency?: string
}> = ({ originalPrice, discountedPrice, currency = 'XOF' }) => {
  const theme = useTheme()
  const discount = calculateDiscount(originalPrice, discountedPrice)
  const hasDiscount = discount > 0

  return (
    <View style={styles.tagContainer}>
      {/* Discount tag */}
      {hasDiscount && (
        <View
          style={[
            styles.tag,
            { backgroundColor: theme.colors.error },
          ]}
        >
          <Text style={styles.tagText}>-{discount}%</Text>
        </View>
      )}

      {/* Price tag */}
      <View
        style={[
          styles.tag,
          {
            backgroundColor: hasDiscount
              ? theme.colors.primary[500]
              : theme.isDark
                ? '#374151'
                : '#F3F4F6',
          },
        ]}
      >
        <Text
          style={[
            styles.tagText,
            {
              color: hasDiscount ? '#FFFFFF' : theme.colors.text,
            },
          ]}
        >
          {formatXOF(discountedPrice)} {currency}
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    // alignItems set dynamically
  },
  discountBadge: {
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  discountText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
  },
  mainPrice: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  discountedPrice: {
    fontWeight: '700',
  },
  currency: {
    fontWeight: '600',
  },
  originalPrice: {
    textDecorationLine: 'line-through',
    fontWeight: '400',
  },

  // Inline styles
  inlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  inlineBadge: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 3,
  },
  inlineDiscountedPrice: {
    fontWeight: '700',
  },
  inlineOriginalPrice: {
    textDecorationLine: 'line-through',
    fontWeight: '400',
  },

  // Tag styles
  tagContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
})

export default PriceDisplay
