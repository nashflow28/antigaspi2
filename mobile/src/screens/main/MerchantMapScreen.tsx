import React, { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Linking,
  TouchableOpacity,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as Location from 'expo-location'
import { useNavigation, NavigationProp } from '@react-navigation/native'
import { useTheme } from '../../theme'
import { MerchantMapMarker, MerchantMapRegion } from '../../types'
import apiService from '../../services/api'
import { TEST_IDS } from '../../utils/testIds'
import OpenStreetMap, { MapMarker } from '../../components/OpenStreetMap'
import AlertModal from '../../components/AlertModal'
import { useAlert } from '../../hooks/useAlert'

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
 * MerchantMapScreen - Carte interactive des commerçants avec MapLibre
 * 100% gratuit, utilise OpenStreetMap
 */
const MerchantMapScreen: React.FC<Props> = ({ testID = TEST_IDS.merchantMapScreen }) => {
  const theme = useTheme()
  const navigation = useNavigation<NavigationProp<MapStackParamList>>()
  const { alertProps, showError, hideAlert } = useAlert()

  // State
  const [merchants, setMerchants] = useState<MerchantMapMarker[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null)
  const [locationPermissionGranted, setLocationPermissionGranted] = useState(false)
  const [selectedMerchant, setSelectedMerchant] = useState<MerchantMapMarker | null>(null)
  const [mapCenter] = useState<[number, number]>([1.2225, 6.1256]) // Lomé [lon, lat]

  // Radius filter state
  const [selectedRadius, setSelectedRadius] = useState<number>(20) // Default 20 km
  const [showRadiusFilter, setShowRadiusFilter] = useState(false)
  const radiusOptions = [5, 10, 20, 50] // km options

  // Calculate distance between two coordinates using Haversine formula
  const calculateDistance = useCallback((lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371 // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }, [])

  // Filter merchants by radius
  const filteredMerchants = userLocation
    ? merchants.filter(merchant => {
        const distance = calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          merchant.latitude,
          merchant.longitude
        )
        return distance <= selectedRadius
      })
    : merchants

  // Request location permission and get user location
  const requestLocationPermission = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()

      if (status !== 'granted') {
        console.log('Location permission denied')
        setLocationPermissionGranted(false)
        return
      }

      setLocationPermissionGranted(true)

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      })

      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      })
    } catch (err) {
      console.error('Error getting location:', err)
      setLocationPermissionGranted(false)
    }
  }, [])

  // Fetch merchants with locations from API
  const fetchMerchants = useCallback(async () => {
    try {
      setError(null)
      const response = await apiService.getMerchants()

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
          active_products_count: 0,
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

  // Initial load
  useEffect(() => {
    let isMounted = true

    const loadData = async () => {
      await requestLocationPermission()
      if (isMounted) {
        await fetchMerchants()
      }
    }

    loadData()
    return () => { isMounted = false }
  }, [requestLocationPermission, fetchMerchants])

  // Pull to refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true)
    fetchMerchants()
  }, [fetchMerchants])

  // Handle marker press
  const handleMarkerPress = useCallback((merchant: MerchantMapMarker) => {
    console.log('Marker pressed:', merchant.business_name)
    setSelectedMerchant(merchant)
  }, [])

  // Navigate to merchant detail
  const handleViewMerchant = useCallback((merchant: MerchantMapMarker) => {
    navigation.navigate('MerchantDetail', { merchantId: merchant.id })
  }, [navigation])

  // Call merchant
  const handleCallMerchant = useCallback((phone: string | undefined) => {
    if (!phone || phone.trim() === '') {
      showError('Erreur', 'Numéro de téléphone non disponible')
      return
    }

    const phoneUrl = Platform.OS === 'ios' ? `telprompt:${phone}` : `tel:${phone}`

    Linking.canOpenURL(phoneUrl)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(phoneUrl)
        }
        showError('Erreur', 'Impossible d\'ouvrir le composeur téléphonique')
      })
      .catch((err) => console.error('Error opening phone:', err))
  }, [showError])

  // Get directions
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
        showError('Erreur', 'Impossible d\'ouvrir l\'application de navigation')
      })
    }
  }, [showError])

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
        <Text style={[styles.errorTitle, { color: theme.colors.text }]}>Erreur de chargement</Text>
        <Text style={[styles.errorMessage, { color: theme.colors.neutral[600] }]}>{error}</Text>
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
        <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>Aucun commerçant à proximité</Text>
        <Text style={[styles.emptyMessage, { color: theme.colors.neutral[600] }]}>
          Les commerçants avec une localisation s'afficheront ici
        </Text>
        <TouchableOpacity
          onPress={onRefresh}
          style={[styles.refreshButton, { borderColor: theme.colors.primary[500] }]}
          testID={TEST_IDS.merchantMapRefreshButton}
        >
          <Ionicons name="refresh" size={20} color={theme.colors.primary[500]} />
          <Text style={[styles.refreshButtonText, { color: theme.colors.primary[500] }]}>Actualiser</Text>
        </TouchableOpacity>
      </View>
    )
  }

  // Convert filtered merchants to MapMarker format for OpenStreetMap component
  const mapMarkers: MapMarker[] = filteredMerchants.map((merchant) => ({
    id: merchant.id,
    latitude: merchant.latitude,
    longitude: merchant.longitude,
    title: merchant.business_name,
    subtitle: merchant.business_type || merchant.city,
    emoji: merchant.is_verified ? '🏪' : '🛍️',
  }))

  // Handle marker press from OpenStreetMap
  const handleMapMarkerPress = (merchantId: number) => {
    const merchant = merchants.find(m => m.id === merchantId)
    if (merchant) {
      handleMarkerPress(merchant)
    }
  }

  // Main map view with Leaflet/OpenStreetMap
  return (
    <View style={styles.container} testID={testID}>
      <OpenStreetMap
        markers={mapMarkers}
        initialRegion={
          userLocation
            ? { latitude: userLocation.latitude, longitude: userLocation.longitude, zoom: 13 }
            : { latitude: 6.1256, longitude: 1.2225, zoom: 12 } // Lomé default
        }
        height={undefined} // Full height
        onMarkerPress={handleMapMarkerPress}
      />

      {/* Top controls row */}
      <View style={styles.topControls}>
        {/* Radius filter button */}
        <TouchableOpacity
          style={[styles.radiusFilterButton, { backgroundColor: theme.colors.cardBackground }]}
          onPress={() => setShowRadiusFilter(!showRadiusFilter)}
        >
          <Ionicons name="locate" size={18} color={theme.colors.primary[500]} />
          <Text style={[styles.radiusText, { color: theme.colors.text }]}>
            {userLocation ? `${selectedRadius} km` : 'Rayon'}
          </Text>
          <Ionicons
            name={showRadiusFilter ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={theme.colors.neutral[500]}
          />
        </TouchableOpacity>

        {/* Merchant count badge */}
        <View style={[styles.badge, { backgroundColor: theme.colors.primary[500] }]} testID={TEST_IDS.merchantMapCountBadge}>
          <Ionicons name="business" size={16} color="white" />
          <Text style={styles.badgeText}>
            {filteredMerchants.length} commerçant{filteredMerchants.length > 1 ? 's' : ''}
          </Text>
        </View>
      </View>

      {/* Radius filter dropdown */}
      {showRadiusFilter && (
        <View style={[styles.radiusDropdown, { backgroundColor: theme.colors.cardBackground }]}>
          {!userLocation && (
            <View style={styles.noLocationWarning}>
              <Ionicons name="warning" size={16} color={theme.colors.semantic.warning} />
              <Text style={[styles.noLocationText, { color: theme.colors.textSecondary }]}>
                Activez la localisation pour filtrer par distance
              </Text>
            </View>
          )}
          <View style={styles.radiusOptionsRow}>
            {radiusOptions.map((radius) => (
              <TouchableOpacity
                key={radius}
                style={[
                  styles.radiusOption,
                  {
                    backgroundColor: selectedRadius === radius
                      ? theme.colors.primary[500]
                      : theme.colors.interactiveSurface,
                    borderColor: selectedRadius === radius
                      ? theme.colors.primary[500]
                      : theme.colors.interactiveBorder,
                  },
                ]}
                onPress={() => {
                  setSelectedRadius(radius)
                  setShowRadiusFilter(false)
                }}
                disabled={!userLocation}
              >
                <Text
                  style={[
                    styles.radiusOptionText,
                    {
                      color: selectedRadius === radius
                        ? 'white'
                        : userLocation
                          ? theme.colors.text
                          : theme.colors.textTertiary,
                    },
                  ]}
                >
                  {radius} km
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {userLocation && filteredMerchants.length !== merchants.length && (
            <Text style={[styles.filterInfo, { color: theme.colors.textSecondary }]}>
              {filteredMerchants.length} sur {merchants.length} dans un rayon de {selectedRadius} km
            </Text>
          )}
        </View>
      )}

      {/* Selected merchant callout */}
      {selectedMerchant && (
        <View style={[styles.calloutOverlay, { backgroundColor: theme.colors.cardBackground }]}>
          <TouchableOpacity
            style={styles.closeCallout}
            onPress={() => setSelectedMerchant(null)}
          >
            <Ionicons name="close" size={24} color={theme.colors.neutral[500]} />
          </TouchableOpacity>

          <View style={styles.calloutHeader}>
            <Text style={[styles.calloutTitle, { color: theme.colors.text }]}>
              {selectedMerchant.business_name}
            </Text>
            {selectedMerchant.is_verified && (
              <Ionicons name="checkmark-circle" size={18} color={theme.colors.semantic.success} />
            )}
          </View>

          <Text style={[styles.calloutType, { color: theme.colors.neutral[600] }]}>
            {selectedMerchant.business_type}
          </Text>

          {selectedMerchant.address && (
            <View style={styles.calloutRow}>
              <Ionicons name="location-outline" size={16} color={theme.colors.neutral[500]} />
              <Text style={[styles.calloutAddress, { color: theme.colors.neutral[600] }]}>
                {selectedMerchant.address}
              </Text>
            </View>
          )}

          <View style={styles.calloutActions}>
            <TouchableOpacity
              onPress={() => handleCallMerchant(selectedMerchant.phone)}
              style={[styles.actionButton, { backgroundColor: theme.colors.primary[50] }]}
            >
              <Ionicons name="call" size={18} color={theme.colors.primary[600]} />
              <Text style={[styles.actionText, { color: theme.colors.primary[600] }]}>Appeler</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleGetDirections(selectedMerchant)}
              style={[styles.actionButton, { backgroundColor: theme.colors.accent.orange + '15' }]}
            >
              <Ionicons name="navigate" size={18} color={theme.colors.accent.orange} />
              <Text style={[styles.actionText, { color: theme.colors.accent.orange }]}>Itinéraire</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={() => handleViewMerchant(selectedMerchant)}
            style={[styles.viewButton, { backgroundColor: theme.colors.primary[500] }]}
          >
            <Text style={styles.viewButtonText}>Voir la boutique</Text>
            <Ionicons name="arrow-forward" size={18} color="white" />
          </TouchableOpacity>
        </View>
      )}

      <AlertModal {...alertProps} />
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
  // Top controls container
  topControls: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  radiusFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 4,
  },
  radiusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  badge: {
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
  // Radius dropdown
  radiusDropdown: {
    position: 'absolute',
    top: 64,
    left: 16,
    right: 16,
    padding: 12,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 20,
  },
  noLocationWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  noLocationText: {
    fontSize: 12,
    flex: 1,
  },
  radiusOptionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  radiusOption: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radiusOptionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  filterInfo: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 10,
  },
  badgeText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  calloutOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  closeCallout: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 4,
  },
  calloutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
    paddingRight: 32,
  },
  calloutTitle: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
  },
  calloutType: {
    fontSize: 14,
    marginBottom: 8,
  },
  calloutRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginBottom: 12,
  },
  calloutAddress: {
    fontSize: 13,
    flex: 1,
  },
  calloutActions: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 10,
  },
  viewButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
})

export default MerchantMapScreen
