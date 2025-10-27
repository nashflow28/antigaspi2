import React, { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
  Linking,
  TouchableOpacity,
} from 'react-native'
import MapView, { Marker, Callout, PROVIDER_GOOGLE, Region } from 'react-native-maps'
import { Ionicons } from '@expo/vector-icons'
import * as Location from 'expo-location'
import { useNavigation, NavigationProp } from '@react-navigation/native'
import { useTheme } from '../../theme'
import { MerchantMapMarker, MerchantMapRegion } from '../../types'
import apiService from '../../services/api'
import { TEST_IDS } from '../../utils/testIds'

// BUG-004 FIX: Define navigation types for MapStack
type MapStackParamList = {
  MapMain: undefined
  MerchantDetail: { merchantId: number }
  ProductDetails: { productId: number }
  ReservationDetails: { reservationId: number }
  ReviewsList: { merchantId: number }
  AddReview: { merchantId: number; productId?: number }
}

interface Props {
  testID?: string
}

/**
 * MerchantMapScreen - Carte interactive des commerçants
 *
 * Features:
 * - Affichage des commerçants avec latitude/longitude sur une carte
 * - Markers cliquables avec callout d'informations
 * - Centrage automatique sur localisation utilisateur (avec permission)
 * - Pull-to-refresh pour recharger les données
 * - Navigation vers la liste des produits du commerçant
 * - Gestion des états: loading, error, empty
 */
const MerchantMapScreen: React.FC<Props> = ({ testID = TEST_IDS.merchantMapScreen }) => {
  const theme = useTheme()
  const navigation = useNavigation<NavigationProp<MapStackParamList>>()

  // State
  const [merchants, setMerchants] = useState<MerchantMapMarker[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null)
  const [region, setRegion] = useState<MerchantMapRegion>({
    latitude: 6.1256, // Lomé, Togo (default)
    longitude: 1.2225,
    latitudeDelta: 0.15,
    longitudeDelta: 0.15,
  })

  // Request location permission and get user location
  const requestLocationPermission = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()

      if (status !== 'granted') {
        console.log('Location permission denied')
        return
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      })

      const userCoords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      }

      setUserLocation(userCoords)

      // 🐛 BUG FIX: Ne PAS centrer automatiquement sur la position utilisateur
      // Garder la carte centrée sur Lomé (zone géographique cible)
      // La position de l'utilisateur sera affichée comme point bleu sur la carte
    } catch (err) {
      console.error('Error getting location:', err)
    }
  }, [])

  // Fetch merchants with locations from API
  const fetchMerchants = useCallback(async () => {
    try {
      setError(null)

      // TODO: Replace with actual API endpoint when backend implements it
      // For now, using getMerchants and filtering those with location
      const response = await apiService.getMerchants()

      // Filter merchants that have valid latitude/longitude
      const merchantsWithLocation = response.data
        .filter((merchant) =>
          merchant.latitude != null &&
          merchant.longitude != null &&
          !isNaN(merchant.latitude) &&
          !isNaN(merchant.longitude)
        )
        .map((merchant) => ({
          id: merchant.id,
          business_name: merchant.business_name,
          business_type: merchant.business_type,
          address: merchant.address,
          city: merchant.city,
          latitude: merchant.latitude as number,
          longitude: merchant.longitude as number,
          is_verified: merchant.is_verified,
          phone: merchant.phone,
          active_products_count: 0, // TODO: Get from API when available
        }))

      setMerchants(merchantsWithLocation)
    } catch (err: any) {
      console.error('Error fetching merchants:', err)
      setError(err.response?.data?.message || 'Impossible de charger les commerçants')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  // Initial load with cleanup
  useEffect(() => {
    let isMounted = true

    const loadData = async () => {
      await requestLocationPermission()
      if (isMounted) {
        await fetchMerchants()
      }
    }

    loadData()

    return () => {
      isMounted = false
    }
  }, [requestLocationPermission, fetchMerchants])

  // Pull to refresh handler
  const onRefresh = useCallback(() => {
    setRefreshing(true)
    fetchMerchants()
  }, [fetchMerchants])

  // Handle marker press
  const handleMarkerPress = useCallback((merchant: MerchantMapMarker) => {
    console.log('Marker pressed:', merchant.business_name)
  }, [])

  // Handle callout press - navigate to merchant products
  const handleCalloutPress = useCallback((merchant: MerchantMapMarker) => {
    navigation.navigate('MerchantDetail', { merchantId: merchant.id })
  }, [navigation])

  // Open phone dialer
  const handleCallMerchant = useCallback((phone: string | undefined) => {
    // BUG-003 FIX: Validate phone before attempting to call
    if (!phone || phone.trim() === '') {
      Alert.alert('Erreur', 'Numéro de téléphone non disponible')
      return
    }

    const phoneUrl = Platform.OS === 'ios' ? `telprompt:${phone}` : `tel:${phone}`

    Linking.canOpenURL(phoneUrl)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(phoneUrl)
        }
        Alert.alert('Erreur', 'Impossible d\'ouvrir le composeur téléphonique')
      })
      .catch((err) => console.error('Error opening phone:', err))
  }, [])

  // Open maps app with directions
  const handleGetDirections = useCallback((merchant: MerchantMapMarker) => {
    const scheme = Platform.select({
      ios: 'maps:0,0?q=',
      android: 'geo:0,0?q=',
    })
    const latLng = `${merchant.latitude},${merchant.longitude}`
    const label = encodeURIComponent(merchant.business_name)
    const url = Platform.select({
      ios: `${scheme}${label}@${latLng}`,
      android: `${scheme}${latLng}(${label})`,
    })

    if (url) {
      Linking.openURL(url).catch((err) => {
        console.error('Error opening maps:', err)
        Alert.alert('Erreur', 'Impossible d\'ouvrir l\'application de navigation')
      })
    }
  }, [])

  // Render marker callout content
  const renderCallout = (merchant: MerchantMapMarker) => (
    <Callout
      onPress={() => handleCalloutPress(merchant)}
      testID={`${TEST_IDS.merchantMapMarkerCallout}-${merchant.id}`}
      style={styles.callout}
    >
      <View style={styles.calloutContainer}>
        <View style={styles.calloutHeader}>
          <Text style={[styles.calloutTitle, { color: theme.colors.text }]}>
            {merchant.business_name}
          </Text>
          {merchant.is_verified && (
            <Ionicons
              name="checkmark-circle"
              size={16}
              color={theme.colors.semantic.success}
              testID={`${TEST_IDS.merchantMapVerifiedBadge}-${merchant.id}`}
            />
          )}
        </View>

        <Text style={[styles.calloutType, { color: theme.colors.neutral[600] }]}>
          {merchant.business_type}
        </Text>

        {merchant.address && (
          <View style={styles.calloutRow}>
            <Ionicons name="location-outline" size={14} color={theme.colors.neutral[500]} />
            <Text style={[styles.calloutAddress, { color: theme.colors.neutral[600] }]}>
              {merchant.address}
            </Text>
          </View>
        )}

        <View style={styles.calloutActions}>
          <TouchableOpacity
            onPress={() => handleCallMerchant(merchant.phone)}
            style={[styles.actionButton, { backgroundColor: theme.colors.primary[50] }]}
            testID={`${TEST_IDS.merchantMapCallButton}-${merchant.id}`}
          >
            <Ionicons name="call" size={16} color={theme.colors.primary[600]} />
            <Text style={[styles.actionText, { color: theme.colors.primary[600] }]}>
              Appeler
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleGetDirections(merchant)}
            style={[styles.actionButton, { backgroundColor: theme.colors.accent.orange + '15' }]}
            testID={`${TEST_IDS.merchantMapDirectionsButton}-${merchant.id}`}
          >
            <Ionicons name="navigate" size={16} color={theme.colors.accent.orange} />
            <Text style={[styles.actionText, { color: theme.colors.accent.orange }]}>
              Itinéraire
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.calloutTap, { color: theme.colors.neutral[400] }]}>
          Appuyez pour voir les produits
        </Text>
      </View>
    </Callout>
  )

  // Loading state
  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.colors.background }]} testID={TEST_IDS.merchantMapLoading}>
        <ActivityIndicator size="large" color={theme.colors.primary[500]} />
        <Text style={[styles.loadingText, { color: theme.colors.neutral[600] }]}>
          Chargement de la carte...
        </Text>
      </View>
    )
  }

  // Error state
  if (error) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.colors.background }]} testID={TEST_IDS.merchantMapError}>
        <Ionicons name="alert-circle-outline" size={48} color={theme.colors.semantic.error} />
        <Text style={[styles.errorTitle, { color: theme.colors.text }]}>
          Erreur de chargement
        </Text>
        <Text style={[styles.errorMessage, { color: theme.colors.neutral[600] }]}>
          {error}
        </Text>
        <TouchableOpacity
          onPress={fetchMerchants}
          style={[styles.retryButton, { backgroundColor: theme.colors.primary[500] }]}
          testID={TEST_IDS.merchantMapRetryButton}
        >
          <Text style={styles.retryButtonText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    )
  }

  // Empty state
  if (merchants.length === 0) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.colors.background }]} testID={TEST_IDS.merchantMapEmpty}>
        <Ionicons name="map-outline" size={64} color={theme.colors.neutral[300]} />
        <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
          Aucun commerçant à proximité
        </Text>
        <Text style={[styles.emptyMessage, { color: theme.colors.neutral[600] }]}>
          Les commerçants avec une localisation s'afficheront ici
        </Text>
        <TouchableOpacity
          onPress={onRefresh}
          style={[styles.refreshButton, { borderColor: theme.colors.primary[500] }]}
          testID={TEST_IDS.merchantMapRefreshButton}
        >
          <Ionicons name="refresh" size={20} color={theme.colors.primary[500]} />
          <Text style={[styles.refreshButtonText, { color: theme.colors.primary[500] }]}>
            Actualiser
          </Text>
        </TouchableOpacity>
      </View>
    )
  }

  // Main map view
  return (
    <View style={styles.container} testID={testID}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={region}
        showsUserLocation={userLocation !== null}
        showsMyLocationButton={true}
        showsCompass={true}
        testID={TEST_IDS.merchantMapView}
      >
        {merchants.map((merchant) => (
          <Marker
            key={merchant.id}
            coordinate={{
              latitude: merchant.latitude,
              longitude: merchant.longitude,
            }}
            title={merchant.business_name}
            description={merchant.business_type}
            onPress={() => handleMarkerPress(merchant)}
            testID={`${TEST_IDS.merchantMapMarker}-${merchant.id}`}
          >
            <View style={[styles.markerContainer, { backgroundColor: theme.colors.primary[500] }]}>
              <Ionicons
                name={merchant.is_verified ? 'storefront' : 'storefront-outline'}
                size={20}
                color="white"
              />
            </View>
            {renderCallout(merchant)}
          </Marker>
        ))}
      </MapView>

      {/* Merchant count badge */}
      <View style={[styles.badge, { backgroundColor: theme.colors.primary[500] }]} testID={TEST_IDS.merchantMapCountBadge}>
        <Ionicons name="business" size={16} color="white" />
        <Text style={styles.badgeText}>
          {merchants.length} commerçant{merchants.length > 1 ? 's' : ''}
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  refreshButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  markerContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 5,
  },
  callout: {
    width: 280,
  },
  calloutContainer: {
    padding: 12,
    width: 280,
  },
  calloutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  calloutTitle: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  calloutType: {
    fontSize: 13,
    marginBottom: 8,
  },
  calloutRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 4,
    marginBottom: 12,
  },
  calloutAddress: {
    fontSize: 12,
    flex: 1,
  },
  calloutActions: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  calloutTap: {
    fontSize: 11,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  badge: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 5,
  },
  badgeText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
})

export default MerchantMapScreen
