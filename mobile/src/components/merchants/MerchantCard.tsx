/**
 * MerchantCard - Composant carte marchand avec design vertical
 * Affiche: image 16:9, nom (bold), note/avis, ville + distance, nombre d'offres
 * Design: ombre douce (iOS), rayonné 16px, tap ouvre fiche marchand
 */

import React, { useMemo } from 'react'
import {
  View,
  Pressable,
  StyleSheet,
  ViewStyle,
} from 'react-native'
import { Image } from 'expo-image'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../../theme'
import { Typography, Badge } from '../2025'

export interface MerchantCardProps {
  merchant: {
    id: number
    business_name: string
    business_type: string
    is_verified: boolean
    products_count: number
    latitude?: number | null
    longitude?: number | null
    photo_url?: string | null
    user?: {
      city: string
      address?: string | null
      phone?: string
    }
    reviews_count?: number
    average_rating?: number
  }
  onPress: () => void
  distance?: string
  style?: ViewStyle
}

const MerchantCard: React.FC<MerchantCardProps> = ({
  merchant,
  onPress,
  distance,
  style,
}) => {
  const theme = useTheme()

  // Emoji du type de commerce
  const getMerchantEmoji = (businessType: string) => {
    const type = businessType.toLowerCase()
    if (type.includes('boulang')) return '🥐'
    if (type.includes('fruit') || type.includes('legume') || type.includes('bio')) return '🥕'
    if (type.includes('viande') || type.includes('boucher')) return '🥩'
    if (type.includes('poisson')) return '🐟'
    if (type.includes('fromage')) return '🧀'
    if (type.includes('restaurant')) return '🍽️'
    if (type.includes('supermarche') || type.includes('epicerie')) return '🏪'
    return '🛍️'
  }

  // Déterminer si une image existe (photo_url du marchand)
  const hasImage = !!merchant.photo_url
  const containerStyles = useMemo(() => styles(theme), [theme])

  const ratingDisplay = merchant.average_rating ? `${merchant.average_rating.toFixed(1)}★` : null

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        containerStyles.cardContainer,
        pressed && { opacity: 0.85 },
        style,
      ]}
    >
      {/* Container avec ombre (iOS style) */}
      <View style={containerStyles.shadowContainer}>
        <View
          style={[
            containerStyles.card,
            {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 16,
              elevation: 8,
            },
          ]}
        >
          {/* Image 16:9 */}
          <View style={containerStyles.imageContainer}>
            {hasImage && merchant.photo_url ? (
              <Image
                source={{ uri: merchant.photo_url }}
                style={containerStyles.merchantImage}
                contentFit="cover"
                transition={200}
              />
            ) : (
              // Placeholder avec emoji
              <View style={[containerStyles.imagePlaceholder, { backgroundColor: theme.colors.primary[100] }]}>
                <Typography
                  variant="h2"
                  style={{ fontSize: 48 }}
                >
                  {getMerchantEmoji(merchant.business_type)}
                </Typography>
              </View>
            )}

            {/* Badge nombre d'offres (coin haut-gauche) */}
            {merchant.products_count > 0 && (
              <View style={containerStyles.badgeContainer}>
                <Badge
                  variant="primary"
                  size="sm"
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <Ionicons
                    name="basket"
                    size={14}
                    color={theme.colors.textInverse}
                  />
                  <Typography
                    variant="caption"
                    weight="bold"
                    style={{ color: theme.colors.textInverse }}
                  >
                    {merchant.products_count}
                  </Typography>
                </Badge>
              </View>
            )}

            {/* Badge vérifié (coin haut-droit) */}
            {merchant.is_verified && (
              <View style={containerStyles.verifiedBadge}>
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={theme.colors.success[500]}
                />
              </View>
            )}
          </View>

          {/* Informations du marchand */}
          <View style={containerStyles.infoContainer}>
            {/* Nom du marchand (bold) */}
            <Typography
              variant="body"
              weight="semibold"
              numberOfLines={1}
              style={{ marginBottom: theme.spacing.xs }}
            >
              {merchant.business_name}
            </Typography>

            {/* Note + avis / type de commerce */}
            <View style={containerStyles.ratingRow}>
              {ratingDisplay ? (
                <>
                  <Typography
                    variant="caption"
                    weight="medium"
                    color="primary"
                    style={{ marginRight: 4 }}
                  >
                    {ratingDisplay}
                  </Typography>
                  {merchant.reviews_count && (
                    <Typography
                      variant="caption"
                      color="secondary"
                    >
                      ({merchant.reviews_count} avis)
                    </Typography>
                  )}
                </>
              ) : (
                <Typography
                  variant="caption"
                  color="secondary"
                  numberOfLines={1}
                >
                  {merchant.business_type}
                </Typography>
              )}
            </View>

            {/* Ville + distance */}
            <View style={containerStyles.locationRow}>
              <Ionicons
                name="location"
                size={12}
                color={theme.colors.textSecondary}
              />
              <Typography
                variant="caption"
                color="secondary"
                numberOfLines={1}
                style={{ marginLeft: 4, flex: 1 }}
              >
                {merchant.user?.city}
                {distance && ` · ${distance}`}
              </Typography>
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  )
}

const styles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    cardContainer: {
      marginBottom: 20,
    },
    shadowContainer: {
      borderRadius: 16,
      overflow: 'hidden',
    },
    card: {
      backgroundColor: theme.colors.surface.light,
      borderRadius: 16,
      overflow: 'hidden',
    },
    imageContainer: {
      position: 'relative',
      width: '100%',
      aspectRatio: 16 / 9,
      backgroundColor: theme.colors.neutral[100],
    },
    merchantImage: {
      width: '100%',
      height: '100%',
    },
    imagePlaceholder: {
      width: '100%',
      height: '100%',
      justifyContent: 'center',
      alignItems: 'center',
    },
    badgeContainer: {
      position: 'absolute',
      top: 12,
      left: 12,
      zIndex: 2,
    },
    verifiedBadge: {
      position: 'absolute',
      top: 12,
      right: 12,
      backgroundColor: theme.colors.surface.light,
      borderRadius: 20,
      padding: 4,
      zIndex: 2,
    },
    infoContainer: {
      padding: 16,
      paddingTop: 12,
    },
    ratingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    locationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
  })

export default MerchantCard
