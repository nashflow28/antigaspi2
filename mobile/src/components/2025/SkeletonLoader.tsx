/**
 * SkeletonLoader - Animated placeholder while content loads
 *
 * Replaces basic spinners with content-shaped placeholders
 * that pulse to indicate loading state.
 *
 * Variants:
 * - card: Product card placeholder
 * - list-item: List row placeholder
 * - avatar: Circular avatar placeholder
 * - text: Text line placeholder
 * - image: Image placeholder
 */

import React, { useEffect, useRef } from 'react'
import { View, StyleSheet, Animated, ViewStyle } from 'react-native'
import { useTheme } from '../../theme'

type SkeletonVariant = 'card' | 'list-item' | 'avatar' | 'text' | 'image'

interface SkeletonLoaderProps {
  variant: SkeletonVariant
  width?: number | string
  height?: number
  borderRadius?: number
  count?: number // Number of items to render
  style?: ViewStyle
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  variant,
  width,
  height,
  borderRadius,
  count = 1,
  style,
}) => {
  const theme = useTheme()
  const pulseAnim = useRef(new Animated.Value(0.3)).current

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    )
    pulse.start()
    return () => pulse.stop()
  }, [pulseAnim])

  const baseColor = theme.isDark ? '#2A3441' : '#E5E7EB'
  const highlightColor = theme.isDark ? '#374151' : '#F3F4F6'

  const renderSkeleton = () => {
    switch (variant) {
      case 'card':
        return (
          <View style={[styles.card, { backgroundColor: theme.colors.cardBackground }]}>
            {/* Image placeholder */}
            <Animated.View
              style={[
                styles.cardImage,
                { backgroundColor: baseColor, opacity: pulseAnim },
              ]}
            />
            {/* Content */}
            <View style={styles.cardContent}>
              {/* Title */}
              <Animated.View
                style={[
                  styles.textLine,
                  { width: '70%', height: 16, backgroundColor: baseColor, opacity: pulseAnim },
                ]}
              />
              {/* Subtitle */}
              <Animated.View
                style={[
                  styles.textLine,
                  { width: '50%', height: 12, backgroundColor: baseColor, opacity: pulseAnim, marginTop: 8 },
                ]}
              />
              {/* Price row */}
              <View style={styles.cardPriceRow}>
                <Animated.View
                  style={[
                    { width: 60, height: 20, borderRadius: 4, backgroundColor: baseColor, opacity: pulseAnim },
                  ]}
                />
                <Animated.View
                  style={[
                    { width: 40, height: 14, borderRadius: 4, backgroundColor: baseColor, opacity: pulseAnim },
                  ]}
                />
              </View>
            </View>
          </View>
        )

      case 'list-item':
        return (
          <View style={[styles.listItem, { backgroundColor: theme.colors.cardBackground }]}>
            {/* Avatar */}
            <Animated.View
              style={[
                styles.listItemAvatar,
                { backgroundColor: baseColor, opacity: pulseAnim },
              ]}
            />
            {/* Content */}
            <View style={styles.listItemContent}>
              <Animated.View
                style={[
                  styles.textLine,
                  { width: '60%', height: 14, backgroundColor: baseColor, opacity: pulseAnim },
                ]}
              />
              <Animated.View
                style={[
                  styles.textLine,
                  { width: '80%', height: 12, backgroundColor: baseColor, opacity: pulseAnim, marginTop: 6 },
                ]}
              />
              <Animated.View
                style={[
                  styles.textLine,
                  { width: '40%', height: 10, backgroundColor: baseColor, opacity: pulseAnim, marginTop: 6 },
                ]}
              />
            </View>
          </View>
        )

      case 'avatar':
        return (
          <Animated.View
            style={[
              {
                width: (width || 48) as number,
                height: height || 48,
                borderRadius: borderRadius || 24,
                backgroundColor: baseColor,
                opacity: pulseAnim as unknown as number,
              },
              style,
            ]}
          />
        )

      case 'text':
        return (
          <View style={style}>
            {Array.from({ length: count }).map((_, index) => (
              <Animated.View
                key={index}
                style={[
                  styles.textLine,
                  {
                    width: index === count - 1 ? '60%' : '100%',
                    height: height || 14,
                    backgroundColor: baseColor,
                    opacity: pulseAnim,
                    marginBottom: index < count - 1 ? 8 : 0,
                    borderRadius: borderRadius || 4,
                  },
                ]}
              />
            ))}
          </View>
        )

      case 'image':
        return (
          <Animated.View
            style={[
              {
                width: (width || '100%') as `${number}%` | number,
                height: height || 200,
                borderRadius: borderRadius || 12,
                backgroundColor: baseColor,
                opacity: pulseAnim as unknown as number,
              },
              style,
            ]}
          />
        )

      default:
        return null
    }
  }

  if (count > 1 && (variant === 'card' || variant === 'list-item')) {
    return (
      <View style={style}>
        {Array.from({ length: count }).map((_, index) => (
          <View key={index} style={{ marginBottom: 12 }}>
            {renderSkeleton()}
          </View>
        ))}
      </View>
    )
  }

  return renderSkeleton()
}

/**
 * Pre-configured skeleton for product cards grid
 */
export const ProductCardSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => {
  return (
    <View style={styles.productGrid}>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={styles.productGridItem}>
          <SkeletonLoader variant="card" />
        </View>
      ))}
    </View>
  )
}

/**
 * Pre-configured skeleton for reservation list
 */
export const ReservationListSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return <SkeletonLoader variant="list-item" count={count} />
}

/**
 * Pre-configured skeleton for product details
 */
export const ProductDetailsSkeleton: React.FC = () => {
  const theme = useTheme()
  const pulseAnim = useRef(new Animated.Value(0.3)).current

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    )
    pulse.start()
    return () => pulse.stop()
  }, [pulseAnim])

  const baseColor = theme.isDark ? '#2A3441' : '#E5E7EB'

  return (
    <View style={styles.productDetails}>
      {/* Image */}
      <SkeletonLoader variant="image" height={250} />

      {/* Content */}
      <View style={styles.productDetailsContent}>
        {/* Title */}
        <Animated.View
          style={[
            { width: '80%', height: 24, borderRadius: 4, backgroundColor: baseColor, opacity: pulseAnim },
          ]}
        />

        {/* Merchant */}
        <View style={styles.merchantRow}>
          <SkeletonLoader variant="avatar" width={32} height={32} />
          <Animated.View
            style={[
              { width: 120, height: 14, borderRadius: 4, backgroundColor: baseColor, opacity: pulseAnim, marginLeft: 12 },
            ]}
          />
        </View>

        {/* Price */}
        <View style={styles.priceRow}>
          <Animated.View
            style={[
              { width: 80, height: 28, borderRadius: 4, backgroundColor: baseColor, opacity: pulseAnim },
            ]}
          />
          <Animated.View
            style={[
              { width: 50, height: 16, borderRadius: 4, backgroundColor: baseColor, opacity: pulseAnim, marginLeft: 12 },
            ]}
          />
        </View>

        {/* Description */}
        <SkeletonLoader variant="text" count={3} style={{ marginTop: 16 }} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardImage: {
    width: '100%',
    height: 140,
  },
  cardContent: {
    padding: 12,
  },
  cardPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  listItem: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  listItemAvatar: {
    width: 56,
    height: 56,
    borderRadius: 8,
  },
  listItemContent: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  textLine: {
    borderRadius: 4,
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  productGridItem: {
    width: '50%',
    padding: 6,
  },
  productDetails: {
    flex: 1,
  },
  productDetailsContent: {
    padding: 16,
  },
  merchantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
})

export default SkeletonLoader
