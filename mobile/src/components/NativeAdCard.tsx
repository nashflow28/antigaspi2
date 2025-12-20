import React from 'react'
import { View, StyleSheet, TouchableOpacity } from 'react-native'
import { Image } from 'expo-image'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../theme'
import { Typography } from './2025'
import { Card } from './2025'

export interface NativeAdData {
  id: string
  headline: string
  body?: string
  imageUrl?: string
  iconUrl?: string
  ctaText?: string
  advertiser?: string
  onPress?: () => void
  // For tracking
  adType?: 'admob' | 'facebook' | 'custom' | 'sponsored_merchant'
  merchantId?: number
}

interface NativeAdCardProps {
  ad: NativeAdData
  onPress?: (ad: NativeAdData) => void
  variant?: 'compact' | 'full'
}

const NativeAdCard: React.FC<NativeAdCardProps> = ({
  ad,
  onPress,
  variant = 'compact',
}) => {
  const theme = useTheme()
  const styles = createStyles(theme, variant)

  const handlePress = () => {
    if (ad.onPress) {
      ad.onPress()
    } else if (onPress) {
      onPress(ad)
    }
  }

  if (variant === 'full') {
    return (
      <TouchableOpacity onPress={handlePress} activeOpacity={0.9}>
        <Card variant="elevated" style={styles.fullCard}>
          {/* Ad Badge */}
          <View style={styles.adBadge}>
            <Ionicons name="megaphone-outline" size={12} color={theme.colors.neutral[500]} />
            <Typography variant="caption" style={styles.adBadgeText}>
              Sponsorisé
            </Typography>
          </View>

          {/* Image */}
          {ad.imageUrl && (
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: ad.imageUrl }}
                style={styles.fullImage}
                contentFit="cover"
                transition={200}
              />
            </View>
          )}

          {/* Content */}
          <View style={styles.fullContent}>
            <View style={styles.headerRow}>
              {ad.iconUrl && (
                <Image
                  source={{ uri: ad.iconUrl }}
                  style={styles.advertiserIcon}
                  contentFit="cover"
                />
              )}
              <View style={{ flex: 1 }}>
                <Typography variant="body" weight="semibold" numberOfLines={2}>
                  {ad.headline}
                </Typography>
                {ad.advertiser && (
                  <Typography variant="caption" color="secondary" style={{ marginTop: 2 }}>
                    {ad.advertiser}
                  </Typography>
                )}
              </View>
            </View>

            {ad.body && (
              <Typography
                variant="caption"
                color="secondary"
                numberOfLines={2}
                style={{ marginTop: 8 }}
              >
                {ad.body}
              </Typography>
            )}

            {ad.ctaText && (
              <View style={[styles.ctaButton, { backgroundColor: theme.colors.primary[500] }]}>
                <Typography variant="caption" weight="semibold" style={{ color: '#FFFFFF' }}>
                  {ad.ctaText}
                </Typography>
              </View>
            )}
          </View>
        </Card>
      </TouchableOpacity>
    )
  }

  // Compact variant - inline with products
  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.9}>
      <Card variant="elevated" style={styles.compactCard}>
        <View style={styles.compactContent}>
          {/* Icon or Image */}
          {ad.iconUrl ? (
            <Image
              source={{ uri: ad.iconUrl }}
              style={styles.compactIcon}
              contentFit="cover"
            />
          ) : ad.imageUrl ? (
            <Image
              source={{ uri: ad.imageUrl }}
              style={styles.compactIcon}
              contentFit="cover"
            />
          ) : (
            <View style={[styles.compactIconPlaceholder, { backgroundColor: theme.colors.primary[100] }]}>
              <Ionicons name="storefront" size={24} color={theme.colors.primary[500]} />
            </View>
          )}

          {/* Text Content */}
          <View style={styles.compactTextContainer}>
            <View style={styles.compactAdBadge}>
              <Typography variant="caption" style={styles.compactAdBadgeText}>
                Sponsorisé
              </Typography>
            </View>
            <Typography variant="body" weight="semibold" numberOfLines={1}>
              {ad.headline}
            </Typography>
            {ad.body && (
              <Typography variant="caption" color="secondary" numberOfLines={1}>
                {ad.body}
              </Typography>
            )}
          </View>

          {/* CTA */}
          <View style={styles.compactCta}>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.primary[500]} />
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  )
}

const createStyles = (theme: ReturnType<typeof useTheme>, variant: 'compact' | 'full') =>
  StyleSheet.create({
    // Full variant styles
    fullCard: {
      marginBottom: theme.spacing.lg,
      overflow: 'hidden',
    },
    adBadge: {
      position: 'absolute',
      top: theme.spacing.sm,
      left: theme.spacing.sm,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 4,
      zIndex: 1,
      gap: 4,
    },
    adBadgeText: {
      fontSize: 10,
      color: theme.colors.neutral[500],
    },
    imageContainer: {
      width: '100%',
      height: 160,
    },
    fullImage: {
      width: '100%',
      height: '100%',
    },
    fullContent: {
      padding: theme.spacing.md,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    advertiserIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.neutral[100],
    },
    ctaButton: {
      marginTop: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.radius.md,
      alignSelf: 'flex-start',
    },

    // Compact variant styles
    compactCard: {
      marginBottom: theme.spacing.lg,
      borderWidth: 1,
      borderColor: theme.colors.primary[100],
      borderStyle: 'dashed',
    },
    compactContent: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: theme.spacing.md,
      gap: theme.spacing.md,
    },
    compactIcon: {
      width: 56,
      height: 56,
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.neutral[100],
    },
    compactIconPlaceholder: {
      width: 56,
      height: 56,
      borderRadius: theme.radius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    compactTextContainer: {
      flex: 1,
    },
    compactAdBadge: {
      backgroundColor: theme.colors.primary[50],
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      alignSelf: 'flex-start',
      marginBottom: 4,
    },
    compactAdBadgeText: {
      fontSize: 10,
      color: theme.colors.primary[600],
    },
    compactCta: {
      padding: theme.spacing.xs,
    },
  })

export default NativeAdCard
