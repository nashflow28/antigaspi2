import React, { useEffect, useState, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Platform,
  Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation, useRoute } from '@react-navigation/native'
import { useSelector } from 'react-redux'
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps'
import * as Location from 'expo-location'
import { useTheme } from '../../theme'
import { RootState } from '../../store'
import LoadingSpinner from '../../components/LoadingSpinner'

const DeliveryMapScreen: React.FC = () => {
  const theme = useTheme()
  const navigation = useNavigation<any>()
  const route = useRoute<any>()
  const mapRef = useRef<MapView>(null)

  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null)
  const [loading, setLoading] = useState(true)

  const { activeDelivery } = useSelector((state: RootState) => state.driver)
  const delivery = activeDelivery

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync()
        if (status !== 'granted') {
          Alert.alert('Permission refusée', 'L\'accès à la localisation est requis')
          setLoading(false)
          return
        }

        const location = await Location.getCurrentPositionAsync({})
        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        })
      } catch (error) {
        console.error('Location error:', error)
      }
      setLoading(false)
    })()
  }, [])

  const openNavigation = (latitude: number, longitude: number) => {
    const url = Platform.select({
      ios: `maps:?daddr=${latitude},${longitude}&dirflg=d`,
      android: `google.navigation:q=${latitude},${longitude}`,
    })
    Linking.openURL(url || `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`)
  }

  const fitToMarkers = () => {
    if (!mapRef.current || !delivery) return

    const coordinates = [
      { latitude: delivery.pickup_latitude, longitude: delivery.pickup_longitude },
      { latitude: delivery.delivery_latitude, longitude: delivery.delivery_longitude },
    ]

    if (userLocation) {
      coordinates.push(userLocation)
    }

    mapRef.current.fitToCoordinates(coordinates, {
      edgePadding: { top: 100, right: 50, bottom: 100, left: 50 },
      animated: true,
    })
  }

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <LoadingSpinner />
      </SafeAreaView>
    )
  }

  const isPickupPhase = delivery && ['assigned', 'picking_up'].includes(delivery.status)

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.cardBackground }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          Carte de livraison
        </Text>
        <TouchableOpacity onPress={fitToMarkers}>
          <Ionicons name="expand" size={24} color={theme.colors.primary[500]} />
        </TouchableOpacity>
      </View>

      {/* Map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        showsUserLocation
        showsMyLocationButton
        initialRegion={{
          latitude: userLocation?.latitude || 6.1725,
          longitude: userLocation?.longitude || 1.2314,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        onMapReady={fitToMarkers}
      >
        {/* Pickup marker */}
        {delivery && (
          <Marker
            coordinate={{
              latitude: delivery.pickup_latitude,
              longitude: delivery.pickup_longitude,
            }}
            title="Récupération"
            description={delivery.pickup_address}
            pinColor={theme.colors.primary[500]}
          />
        )}

        {/* Delivery marker */}
        {delivery && (
          <Marker
            coordinate={{
              latitude: delivery.delivery_latitude,
              longitude: delivery.delivery_longitude,
            }}
            title="Livraison"
            description={delivery.delivery_address}
            pinColor={theme.colors.success}
          />
        )}

        {/* Route line */}
        {delivery && (
          <Polyline
            coordinates={[
              { latitude: delivery.pickup_latitude, longitude: delivery.pickup_longitude },
              { latitude: delivery.delivery_latitude, longitude: delivery.delivery_longitude },
            ]}
            strokeColor={theme.colors.primary[500]}
            strokeWidth={3}
            lineDashPattern={[10, 5]}
          />
        )}
      </MapView>

      {/* Bottom panel */}
      {delivery && (
        <View style={[styles.bottomPanel, { backgroundColor: theme.colors.cardBackground }]}>
          <View style={styles.destinationInfo}>
            <View style={[styles.destinationDot, { backgroundColor: isPickupPhase ? theme.colors.primary[500] : theme.colors.success }]} />
            <View style={styles.destinationText}>
              <Text style={[styles.destinationLabel, { color: theme.colors.textSecondary }]}>
                {isPickupPhase ? 'Récupération' : 'Livraison'}
              </Text>
              <Text style={[styles.destinationAddress, { color: theme.colors.text }]} numberOfLines={2}>
                {isPickupPhase ? delivery.pickup_address : delivery.delivery_address}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.navigateButton, { backgroundColor: theme.colors.primary[500] }]}
            onPress={() => openNavigation(
              isPickupPhase ? delivery.pickup_latitude : delivery.delivery_latitude,
              isPickupPhase ? delivery.pickup_longitude : delivery.delivery_longitude
            )}
          >
            <Ionicons name="navigate" size={20} color="white" />
            <Text style={styles.navigateButtonText}>Naviguer</Text>
          </TouchableOpacity>
        </View>
      )}

      {!delivery && (
        <View style={[styles.noDeliveryPanel, { backgroundColor: theme.colors.cardBackground }]}>
          <Text style={[styles.noDeliveryText, { color: theme.colors.textSecondary }]}>
            Aucune livraison active
          </Text>
        </View>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  map: {
    flex: 1,
  },
  bottomPanel: {
    padding: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  destinationInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  destinationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
  },
  destinationText: {
    flex: 1,
    marginLeft: 12,
  },
  destinationLabel: {
    fontSize: 12,
  },
  destinationAddress: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 2,
  },
  navigateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 10,
  },
  navigateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  noDeliveryPanel: {
    padding: 24,
    alignItems: 'center',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  noDeliveryText: {
    fontSize: 16,
  },
})

export default DeliveryMapScreen
