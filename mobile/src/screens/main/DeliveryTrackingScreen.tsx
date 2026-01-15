import React, { useEffect, useCallback, useState, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Platform,
  Alert,
  Animated,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation, useRoute } from '@react-navigation/native'
import { useDispatch, useSelector } from 'react-redux'
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps'
import { useTheme } from '../../theme'
import { useHaptics } from '../../hooks/useHaptics'
import { RootState, AppDispatch } from '../../store'
import { fetchDeliveryTracking, cancelDelivery, clearDeliveryError } from '../../store/slices/deliverySlice'
import LoadingSpinner from '../../components/LoadingSpinner'

const DeliveryTrackingScreen: React.FC = () => {
  const theme = useTheme()
  const haptics = useHaptics()
  const navigation = useNavigation<any>()
  const route = useRoute<any>()
  const dispatch = useDispatch<AppDispatch>()
  const mapRef = useRef<MapView>(null)
  const pulseAnim = useRef(new Animated.Value(1)).current

  const { deliveryId } = route.params || {}

  const { trackingData, trackingLoading, error } = useSelector(
    (state: RootState) => state.delivery
  )

  const [refreshing, setRefreshing] = useState(false)

  // Pulse animation for driver marker
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.3,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    )
    pulse.start()
    return () => pulse.stop()
  }, [pulseAnim])

  const loadData = useCallback(async () => {
    if (deliveryId) {
      await dispatch(fetchDeliveryTracking(deliveryId))
    }
  }, [dispatch, deliveryId])

  useEffect(() => {
    loadData()
    // Refresh every 10 seconds
    const interval = setInterval(loadData, 10000)
    return () => clearInterval(interval)
  }, [loadData])

  useEffect(() => {
    if (error) {
      Alert.alert('Erreur', error)
      dispatch(clearDeliveryError())
    }
  }, [error, dispatch])

  const handleCancel = () => {
    Alert.alert(
      'Annuler la livraison',
      'Êtes-vous sûr de vouloir annuler cette livraison?',
      [
        { text: 'Non', style: 'cancel' },
        {
          text: 'Oui, annuler',
          style: 'destructive',
          onPress: async () => {
            haptics.mediumTap()
            try {
              await dispatch(cancelDelivery(deliveryId)).unwrap()
              haptics.success()
              Alert.alert('Livraison annulée', 'Votre demande de livraison a été annulée.', [
                { text: 'OK', onPress: () => navigation.goBack() },
              ])
            } catch (err: any) {
              haptics.error()
              Alert.alert('Erreur', err || "Impossible d'annuler la livraison")
            }
          },
        },
      ]
    )
  }

  const callDriver = () => {
    // Driver phone might be on driver directly or via user relation
    const driverPhone = trackingData?.delivery.driver?.phone || trackingData?.delivery.driver?.user?.phone
    if (driverPhone) {
      Linking.openURL(`tel:${driverPhone}`)
    }
  }

  const fitToMarkers = () => {
    if (!mapRef.current || !trackingData) return

    const coordinates = [
      {
        latitude: trackingData.delivery.delivery_latitude,
        longitude: trackingData.delivery.delivery_longitude,
      },
    ]

    if (trackingData.driver_position) {
      coordinates.push({
        latitude: trackingData.driver_position.latitude,
        longitude: trackingData.driver_position.longitude,
      })
    }

    if (trackingData.delivery.pickup_latitude && trackingData.delivery.pickup_longitude) {
      coordinates.push({
        latitude: trackingData.delivery.pickup_latitude,
        longitude: trackingData.delivery.pickup_longitude,
      })
    }

    mapRef.current.fitToCoordinates(coordinates, {
      edgePadding: { top: 100, right: 50, bottom: 200, left: 50 },
      animated: true,
    })
  }

  const getStatusInfo = (status: string) => {
    const statusMap: Record<string, { label: string; icon: string; color: string }> = {
      pending: {
        label: 'En attente',
        icon: 'time',
        color: theme.colors.warning,
      },
      searching: {
        label: 'Recherche de livreur',
        icon: 'search',
        color: theme.colors.info,
      },
      assigned: {
        label: 'Livreur assigné',
        icon: 'person',
        color: theme.colors.info,
      },
      picking_up: {
        label: 'En route vers le commerce',
        icon: 'bicycle',
        color: theme.colors.primary[500],
      },
      picked_up: {
        label: 'Commande récupérée',
        icon: 'bag-check',
        color: theme.colors.primary[500],
      },
      delivering: {
        label: 'En cours de livraison',
        icon: 'bicycle',
        color: theme.colors.success,
      },
      delivered: {
        label: 'Livré',
        icon: 'checkmark-circle',
        color: theme.colors.success,
      },
      cancelled: {
        label: 'Annulé',
        icon: 'close-circle',
        color: theme.colors.error,
      },
      failed: {
        label: 'Échec',
        icon: 'alert-circle',
        color: theme.colors.error,
      },
    }
    return statusMap[status] || { label: status, icon: 'help', color: theme.colors.neutral[400] }
  }

  if (trackingLoading && !trackingData) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <LoadingSpinner />
      </SafeAreaView>
    )
  }

  if (!trackingData) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color={theme.colors.error} />
          <Text style={[styles.errorText, { color: theme.colors.text }]}>
            Impossible de charger les informations de livraison
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: theme.colors.primary[500] }]}
            onPress={loadData}
          >
            <Text style={styles.retryButtonText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  const statusInfo = getStatusInfo(trackingData.delivery.status)
  const canCancel = ['pending', 'searching', 'assigned'].includes(trackingData.delivery.status)
  const isDelivered = trackingData.delivery.status === 'delivered'

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.cardBackground }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          Suivi de livraison
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
        initialRegion={{
          latitude: trackingData.delivery.delivery_latitude,
          longitude: trackingData.delivery.delivery_longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        onMapReady={fitToMarkers}
      >
        {/* Delivery destination marker */}
        <Marker
          coordinate={{
            latitude: trackingData.delivery.delivery_latitude,
            longitude: trackingData.delivery.delivery_longitude,
          }}
          title="Votre adresse"
          description={trackingData.delivery.delivery_address}
          pinColor={theme.colors.success}
        />

        {/* Pickup marker */}
        {trackingData.delivery.pickup_latitude && trackingData.delivery.pickup_longitude && (
          <Marker
            coordinate={{
              latitude: trackingData.delivery.pickup_latitude,
              longitude: trackingData.delivery.pickup_longitude,
            }}
            title="Commerce"
            description={trackingData.delivery.pickup_address}
            pinColor={theme.colors.primary[500]}
          />
        )}

        {/* Driver marker */}
        {trackingData.driver_position && (
          <Marker
            coordinate={{
              latitude: trackingData.driver_position.latitude,
              longitude: trackingData.driver_position.longitude,
            }}
            title="Livreur"
          >
            <View style={styles.driverMarker}>
              <Ionicons name="bicycle" size={24} color={theme.colors.primary[500]} />
            </View>
          </Marker>
        )}

        {/* Route line */}
        {trackingData.driver_position && (
          <Polyline
            coordinates={[
              {
                latitude: trackingData.driver_position.latitude,
                longitude: trackingData.driver_position.longitude,
              },
              {
                latitude: trackingData.delivery.delivery_latitude,
                longitude: trackingData.delivery.delivery_longitude,
              },
            ]}
            strokeColor={theme.colors.primary[500]}
            strokeWidth={3}
            lineDashPattern={[10, 5]}
          />
        )}
      </MapView>

      {/* Bottom panel */}
      <View style={[styles.bottomPanel, { backgroundColor: theme.colors.cardBackground }]}>
        {/* Status badge */}
        <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + '20' }]}>
          <Ionicons name={statusInfo.icon as any} size={20} color={statusInfo.color} />
          <Text style={[styles.statusText, { color: statusInfo.color }]}>
            {statusInfo.label}
          </Text>
        </View>

        {/* ETA - shows estimated time from delivery if available */}
        {trackingData.delivery.estimated_duration && trackingData.delivery.status !== 'delivered' && (
          <View style={styles.etaContainer}>
            <Text style={[styles.etaLabel, { color: theme.colors.textSecondary }]}>
              Temps estimé
            </Text>
            <Text style={[styles.etaValue, { color: theme.colors.text }]}>
              {Math.ceil(trackingData.delivery.estimated_duration / 60)} min
            </Text>
          </View>
        )}

        {/* Driver info */}
        {trackingData.delivery.driver && (
          <View style={[styles.driverCard, { backgroundColor: theme.colors.background }]}>
            <View style={[styles.driverAvatar, { backgroundColor: theme.colors.primary[100] }]}>
              <Text style={[styles.driverAvatarText, { color: theme.colors.primary[500] }]}>
                {trackingData.delivery.driver.first_name?.charAt(0) || 'L'}
              </Text>
            </View>
            <View style={styles.driverInfo}>
              <Text style={[styles.driverName, { color: theme.colors.text }]}>
                {trackingData.delivery.driver.first_name} {trackingData.delivery.driver.last_name}
              </Text>
              <View style={styles.driverRating}>
                <Ionicons name="star" size={14} color={theme.colors.warning} />
                <Text style={[styles.driverRatingText, { color: theme.colors.textSecondary }]}>
                  {trackingData.delivery.driver.rating?.toFixed(1) || 'Nouveau'}
                </Text>
              </View>
            </View>
            {(trackingData.delivery.driver.phone || trackingData.delivery.driver.user?.phone) && (
              <TouchableOpacity
                style={[styles.callButton, { backgroundColor: theme.colors.success }]}
                onPress={callDriver}
              >
                <Ionicons name="call" size={20} color="white" />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Delivery address */}
        <View style={styles.addressContainer}>
          <Ionicons name="location" size={16} color={theme.colors.textSecondary} />
          <Text style={[styles.addressText, { color: theme.colors.textSecondary }]} numberOfLines={2}>
            {trackingData.delivery.delivery_address}
          </Text>
        </View>

        {/* Actions */}
        <View style={styles.actionsRow}>
          {canCancel && (
            <TouchableOpacity
              style={[styles.cancelButton, { borderColor: theme.colors.error }]}
              onPress={handleCancel}
            >
              <Ionicons name="close" size={18} color={theme.colors.error} />
              <Text style={[styles.cancelButtonText, { color: theme.colors.error }]}>
                Annuler
              </Text>
            </TouchableOpacity>
          )}

          {isDelivered && (
            <TouchableOpacity
              style={[styles.rateButton, { backgroundColor: theme.colors.primary[500] }]}
              onPress={() => navigation.navigate('DeliveryRating', { deliveryId })}
            >
              <Ionicons name="star" size={18} color="white" />
              <Text style={styles.rateButtonText}>Noter le livreur</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
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
  driverMarker: {
    backgroundColor: 'white',
    padding: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
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
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 12,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  etaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  etaLabel: {
    fontSize: 14,
  },
  etaValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  driverCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  driverAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverAvatarText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  driverInfo: {
    flex: 1,
    marginLeft: 12,
  },
  driverName: {
    fontSize: 16,
    fontWeight: '600',
  },
  driverRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  driverRatingText: {
    fontSize: 13,
    marginLeft: 4,
  },
  callButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  addressText: {
    flex: 1,
    fontSize: 13,
    marginLeft: 8,
    lineHeight: 18,
  },
  actionsRow: {
    flexDirection: 'row',
  },
  cancelButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginRight: 8,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  rateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 10,
  },
  rateButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
})

export default DeliveryTrackingScreen
