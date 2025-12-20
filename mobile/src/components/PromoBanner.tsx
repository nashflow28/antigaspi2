import React, { useRef, useState, useEffect, useCallback } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native'
import { Image } from 'expo-image'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../theme'
import { Typography } from './2025'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const BANNER_WIDTH = SCREEN_WIDTH - 32 // 16px padding on each side
const BANNER_HEIGHT = 140

export interface PromoBannerItem {
  id: string
  title: string
  subtitle?: string
  imageUrl?: string
  backgroundColor?: string
  textColor?: string
  icon?: keyof typeof Ionicons.glyphMap
  onPress?: () => void
  // For sponsored merchants
  merchantId?: number
  merchantName?: string
  // For external ads
  isAd?: boolean
  adType?: 'sponsored' | 'external'
}

interface PromoBannerProps {
  items: PromoBannerItem[]
  autoPlayInterval?: number // in ms, 0 to disable
  onItemPress?: (item: PromoBannerItem) => void
}

const PromoBanner: React.FC<PromoBannerProps> = ({
  items,
  autoPlayInterval = 5000,
  onItemPress,
}) => {
  const theme = useTheme()
  const scrollViewRef = useRef<ScrollView>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null)

  // Auto-play carousel
  useEffect(() => {
    if (autoPlayInterval > 0 && items.length > 1) {
      autoPlayRef.current = setInterval(() => {
        setActiveIndex((prev) => {
          const nextIndex = (prev + 1) % items.length
          scrollViewRef.current?.scrollTo({
            x: nextIndex * (BANNER_WIDTH + 12),
            animated: true,
          })
          return nextIndex
        })
      }, autoPlayInterval)

      return () => {
        if (autoPlayRef.current) {
          clearInterval(autoPlayRef.current)
        }
      }
    }
  }, [autoPlayInterval, items.length])

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetX = event.nativeEvent.contentOffset.x
      const index = Math.round(offsetX / (BANNER_WIDTH + 12))
      if (index !== activeIndex && index >= 0 && index < items.length) {
        setActiveIndex(index)
      }
    },
    [activeIndex, items.length]
  )

  const handleItemPress = useCallback(
    (item: PromoBannerItem) => {
      if (item.onPress) {
        item.onPress()
      } else if (onItemPress) {
        onItemPress(item)
      }
    },
    [onItemPress]
  )

  if (items.length === 0) {
    return null
  }

  const styles = createStyles(theme)

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled={false}
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={BANNER_WIDTH + 12}
        snapToAlignment="start"
        contentContainerStyle={styles.scrollContent}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {items.map((item, index) => (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.bannerItem,
              { backgroundColor: item.backgroundColor || theme.colors.primary[500] },
            ]}
            onPress={() => handleItemPress(item)}
            activeOpacity={0.9}
            accessibilityRole="button"
            accessibilityLabel={item.title}
          >
            {/* Background Image (optional) */}
            {item.imageUrl && (
              <Image
                source={{ uri: item.imageUrl }}
                style={styles.bannerImage}
                contentFit="cover"
              />
            )}

            {/* Overlay for better text readability */}
            <View style={styles.overlay} />

            {/* Content */}
            <View style={styles.bannerContent}>
              {item.icon && (
                <View style={styles.iconContainer}>
                  <Ionicons
                    name={item.icon}
                    size={28}
                    color={item.textColor || '#FFFFFF'}
                  />
                </View>
              )}

              <View style={styles.textContainer}>
                {item.isAd && (
                  <View style={styles.sponsoredBadge}>
                    <Typography
                      variant="caption"
                      weight="medium"
                      style={{ color: 'rgba(255,255,255,0.8)', fontSize: 10 }}
                    >
                      Sponsorisé
                    </Typography>
                  </View>
                )}
                <Typography
                  variant="h3"
                  weight="bold"
                  style={[styles.title, { color: item.textColor || '#FFFFFF' }]}
                  numberOfLines={2}
                >
                  {item.title}
                </Typography>
                {item.subtitle && (
                  <Typography
                    variant="body"
                    style={[styles.subtitle, { color: item.textColor || '#FFFFFF' }]}
                    numberOfLines={2}
                  >
                    {item.subtitle}
                  </Typography>
                )}
              </View>

              {/* CTA Arrow */}
              <View style={styles.ctaContainer}>
                <Ionicons
                  name="arrow-forward-circle"
                  size={32}
                  color={item.textColor || '#FFFFFF'}
                />
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Pagination Dots */}
      {items.length > 1 && (
        <View style={styles.pagination}>
          {items.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                {
                  backgroundColor:
                    index === activeIndex
                      ? theme.colors.primary[500]
                      : theme.colors.neutral[300],
                  width: index === activeIndex ? 20 : 8,
                },
              ]}
            />
          ))}
        </View>
      )}
    </View>
  )
}

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    container: {
      marginBottom: theme.spacing.md,
    },
    scrollContent: {
      paddingHorizontal: 16,
      gap: 12,
    },
    bannerItem: {
      width: BANNER_WIDTH,
      height: BANNER_HEIGHT,
      borderRadius: theme.radius.xl,
      overflow: 'hidden',
      position: 'relative',
    },
    bannerImage: {
      ...StyleSheet.absoluteFillObject,
    },
    overlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
    },
    bannerContent: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      padding: theme.spacing.lg,
      gap: theme.spacing.md,
    },
    iconContainer: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    textContainer: {
      flex: 1,
    },
    sponsoredBadge: {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 4,
      alignSelf: 'flex-start',
      marginBottom: 4,
    },
    title: {
      fontSize: 18,
      lineHeight: 24,
    },
    subtitle: {
      marginTop: 4,
      opacity: 0.9,
      fontSize: 14,
      lineHeight: 20,
    },
    ctaContainer: {
      opacity: 0.8,
    },
    pagination: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: theme.spacing.sm,
      gap: 6,
    },
    dot: {
      height: 8,
      borderRadius: 4,
    },
  })

export default PromoBanner
