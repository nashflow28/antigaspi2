import React, { useCallback } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'

import { useTheme } from '../theme'
import { Typography, Card, Badge } from './2025'
import { useNearbyMerchants, NearbyMerchant } from '../hooks/useNearbyMerchants'
import { getImageUrl } from '../utils/imageHelpers'

interface Props {
  onMerchantPress: (merchantId: number) => void
  onSeeAllPress?: () => void
  maxMerchants?: number
  radiusKm?: number
}

/**
 * Section horizontale affichant les commerces proches de l'utilisateur
 * Utilise le hook useNearbyMerchants pour récupérer les données
 */
const NearbyMerchantsSection: React.FC<Props> = ({
  onMerchantPress,
  onSeeAllPress,
  maxMerchants = 5,
  radiusKm = 10,
}) => {
  const theme = useTheme()
  const {
    merchants,
    loading,
    error,
    hasLocationPermission,
    requestLocationPermission,
    refresh,
  } = useNearbyMerchants({ radiusKm, autoFetch: true })

  const displayedMerchants = merchants.slice(0, maxMerchants)

  const handleRequestPermission = useCallback(async () => {
    const granted = await requestLocationPermission()
    if (granted) {
      refresh()
    }
  }, [requestLocationPermission, refresh])

  // Formatage de la distance
  const formatDistance = (distanceKm?: number): string => {
    if (distanceKm === undefined || distanceKm === null) return ''
    if (distanceKm < 1) {
      return `${Math.round(distanceKm * 1000)} m`
    }
    return `${distanceKm.toFixed(1)} km`
  }

  // Si pas de permission, afficher un CTA pour demander la permission
  if (!hasLocationPermission && !loading) {
    return (
      <View style={styles.section}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Ionicons name="location" size={20} color={theme.colors.primary[500]} />
            <Typography variant="h3" weight="bold" style={{ marginLeft: 8 }}>
              Commerces proches
            </Typography>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.permissionCard, { backgroundColor: theme.colors.primary[50] }]}
          onPress={handleRequestPermission}
          activeOpacity={0.8}
        >
          <Ionicons name="navigate-circle-outline" size={40} color={theme.colors.primary[500]} />
          <Typography variant="body" weight="semibold" style={{ marginTop: 12, textAlign: 'center' }}>
            Activer la localisation
          </Typography>
          <Typography variant="caption" color="secondary" style={{ textAlign: 'center', marginTop: 4 }}>
            Pour voir les commerces autour de vous
          </Typography>
        </TouchableOpacity>
      </View>
    )
  }

  // Chargement
  if (loading) {
    return (
      <View style={styles.section}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Ionicons name="location" size={20} color={theme.colors.primary[500]} />
            <Typography variant="h3" weight="bold" style={{ marginLeft: 8 }}>
              Commerces proches
            </Typography>
          </View>
        </View>

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={theme.colors.primary[500]} />
          <Typography variant="caption" color="secondary" style={{ marginTop: 8 }}>
            Recherche des commerces...
          </Typography>
        </View>
      </View>
    )
  }

  // Erreur
  if (error) {
    return (
      <View style={styles.section}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Ionicons name="location" size={20} color={theme.colors.primary[500]} />
            <Typography variant="h3" weight="bold" style={{ marginLeft: 8 }}>
              Commerces proches
            </Typography>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.errorCard, { backgroundColor: theme.colors.error + '15' }]}
          onPress={refresh}
          activeOpacity={0.8}
        >
          <Ionicons name="refresh-circle" size={32} color={theme.colors.error} />
          <Typography variant="caption" color="secondary" style={{ marginTop: 8, textAlign: 'center' }}>
            {error}
          </Typography>
          <Typography variant="caption" weight="semibold" color="primary" style={{ marginTop: 4 }}>
            Appuyer pour reyessayer
          </Typography>
        </TouchableOpacity>
      </View>
    )
  }

  // Aucun commerce trouvé
  if (displayedMerchants.length === 0) {
    return (
      <View style={styles.section}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Ionicons name="location" size={20} color={theme.colors.primary[500]} />
            <Typography variant="h3" weight="bold" style={{ marginLeft: 8 }}>
              Commerces proches
            </Typography>
          </View>
        </View>

        <View style={[styles.emptyCard, { backgroundColor: theme.colors.neutral[100] }]}>
          <Ionicons name="storefront-outline" size={32} color={theme.colors.neutral[400]} />
          <Typography variant="caption" color="secondary" style={{ marginTop: 8, textAlign: 'center' }}>
            Aucun commerce dans un rayon de {radiusKm} km
          </Typography>
        </View>
      </View>
    )
  }

  // Affichage des commerces
  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons name="location" size={20} color={theme.colors.primary[500]} />
          <Typography variant="h3" weight="bold" style={{ marginLeft: 8 }}>
            Commerces proches
          </Typography>
        </View>
        {onSeeAllPress && merchants.length > maxMerchants && (
          <TouchableOpacity onPress={onSeeAllPress} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Typography variant="caption" weight="semibold" color="primary">
              Voir tout ({merchants.length})
            </Typography>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {displayedMerchants.map((merchant) => (
          <TouchableOpacity
            key={merchant.id}
            onPress={() => onMerchantPress(merchant.id)}
            activeOpacity={0.9}
          >
            <Card variant="elevated" style={styles.merchantCard}>
              {/* Image du commerce */}
              <View style={styles.imageContainer}>
                <Image
                  source={{ uri: getImageUrl(merchant.photo_url || merchant.user?.photo_url, 'store') }}
                  style={styles.merchantImage}
                  contentFit="cover"
                  transition={200}
                />
                {/* Badge distance */}
                {merchant.distance_km !== undefined && (
                  <View style={[styles.distanceBadge, { backgroundColor: theme.colors.badgeBackgroundStrong }]}>
                    <Ionicons name="navigate" size={10} color={theme.colors.badgeText} />
                    <Typography
                      variant="caption"
                      weight="bold"
                      style={{ marginLeft: 3, color: theme.colors.badgeText, fontSize: 10 }}
                    >
                      {formatDistance(merchant.distance_km)}
                    </Typography>
                  </View>
                )}
                {/* Badge verifie */}
                {merchant.is_verified && (
                  <View style={[styles.verifiedBadge, { backgroundColor: theme.colors.success }]}>
                    <Ionicons name="checkmark-circle" size={12} color="white" />
                  </View>
                )}
              </View>

              {/* Info du commerce */}
              <View style={styles.merchantInfo}>
                <Typography variant="body" weight="semibold" numberOfLines={1} style={{ marginBottom: 2 }}>
                  {merchant.business_name}
                </Typography>
                <Typography variant="caption" color="secondary" numberOfLines={1}>
                  {merchant.business_type || merchant.user?.city || 'Commerce'}
                </Typography>

                {/* Stats */}
                <View style={styles.statsRow}>
                  {merchant.average_rating && (
                    <View style={styles.statItem}>
                      <Ionicons name="star" size={12} color={theme.colors.warning} />
                      <Typography variant="caption" weight="semibold" style={{ marginLeft: 3 }}>
                        {merchant.average_rating.toFixed(1)}
                      </Typography>
                    </View>
                  )}
                  {merchant.products_count > 0 && (
                    <View style={styles.statItem}>
                      <Ionicons name="basket" size={12} color={theme.colors.primary[500]} />
                      <Typography variant="caption" weight="medium" style={{ marginLeft: 3 }}>
                        {merchant.products_count} produit{merchant.products_count > 1 ? 's' : ''}
                      </Typography>
                    </View>
                  )}
                </View>
              </View>
            </Card>
          </TouchableOpacity>
        ))}

        {/* Voir tous bouton si plus de merchants */}
        {onSeeAllPress && merchants.length > maxMerchants && (
          <TouchableOpacity
            onPress={onSeeAllPress}
            style={[styles.seeAllCard, { backgroundColor: theme.colors.primary[50] }]}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-forward-circle" size={32} color={theme.colors.primary[500]} />
            <Typography variant="caption" weight="semibold" color="primary" style={{ marginTop: 8 }}>
              Voir tout
            </Typography>
            <Typography variant="caption" color="secondary">
              {merchants.length - maxMerchants}+ autres
            </Typography>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  section: {
    marginTop: 8,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  merchantCard: {
    width: 160,
    marginRight: 12,
    overflow: 'hidden',
  },
  imageContainer: {
    width: '100%',
    height: 100,
    position: 'relative',
  },
  merchantImage: {
    width: '100%',
    height: '100%',
  },
  distanceBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
  },
  verifiedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  merchantInfo: {
    padding: 10,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 10,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  permissionCard: {
    marginHorizontal: 16,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    marginHorizontal: 16,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorCard: {
    marginHorizontal: 16,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCard: {
    marginHorizontal: 16,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  seeAllCard: {
    width: 100,
    height: 160,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
})

export default NearbyMerchantsSection
