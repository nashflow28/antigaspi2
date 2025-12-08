import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../theme'
import * as Location from 'expo-location'
import MapLibreWrapper, { getMapLibreGL, isExpoGo, MapLibreRef } from './MapLibreWrapper'

interface MapLocationPickerProps {
  visible: boolean
  onClose: () => void
  onSelectLocation: (latitude: number, longitude: number) => void
  initialLatitude?: number | null
  initialLongitude?: number | null
}

const DEFAULT_LOCATION = {
  latitude: 6.1319,
  longitude: 1.2228, // Lomé, Togo
}

const withFallback = (value: number | null | undefined, fallback: number) =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback

const MapLocationPicker: React.FC<MapLocationPickerProps> = ({
  visible,
  onClose,
  onSelectLocation,
  initialLatitude,
  initialLongitude,
}) => {
  const theme = useTheme()
  const mapRef = useRef<MapLibreRef>(null)

  const initialLocation = useMemo(
    () => ({
      latitude: withFallback(initialLatitude, DEFAULT_LOCATION.latitude),
      longitude: withFallback(initialLongitude, DEFAULT_LOCATION.longitude),
    }),
    [initialLatitude, initialLongitude]
  )

  const [selectedLocation, setSelectedLocation] = useState(initialLocation)
  const [mapCenter, setMapCenter] = useState<[number, number]>([
    initialLocation.longitude,
    initialLocation.latitude,
  ])
  const [zoom, setZoom] = useState(15)
  const [locationPermissionGranted, setLocationPermissionGranted] = useState(false)
  const [permissionChecked, setPermissionChecked] = useState(false)
  const [mapReady, setMapReady] = useState(false)

  // Vérifier la permission de localisation
  useEffect(() => {
    if (!visible) {
      setPermissionChecked(false)
      setLocationPermissionGranted(false)
      setMapReady(false)
      return
    }

    const checkPermission = async () => {
      try {
        const { status } = await Location.getForegroundPermissionsAsync()
        if (status === 'granted') {
          setLocationPermissionGranted(true)
          console.log('[MapLocationPicker] Permission déjà accordée')
        } else {
          const { status: newStatus } = await Location.requestForegroundPermissionsAsync()
          setLocationPermissionGranted(newStatus === 'granted')
          console.log('[MapLocationPicker] Permission demandée:', newStatus)
        }
      } catch (error) {
        console.error('[MapLocationPicker] Erreur permission:', error)
        setLocationPermissionGranted(false)
      }
      setPermissionChecked(true)
    }

    checkPermission()
  }, [visible])

  // Reset quand le modal s'ouvre
  useEffect(() => {
    if (!visible) return

    const newLocation = {
      latitude: withFallback(initialLatitude, DEFAULT_LOCATION.latitude),
      longitude: withFallback(initialLongitude, DEFAULT_LOCATION.longitude),
    }

    setSelectedLocation(newLocation)
    setMapCenter([newLocation.longitude, newLocation.latitude])
    setMapReady(true)

    console.log('[MapLocationPicker] Initialized with:', newLocation)
  }, [visible, initialLatitude, initialLongitude])

  // Gérer le tap sur la carte
  const handleMapPress = useCallback((event: { latitude: number; longitude: number }) => {
    console.log('[MapLocationPicker] Map pressed:', event)
    setSelectedLocation({ latitude: event.latitude, longitude: event.longitude })
    setMapCenter([event.longitude, event.latitude])
  }, [])

  const handleConfirm = () => {
    console.log('[MapLocationPicker] Confirming:', selectedLocation)
    onSelectLocation(selectedLocation.latitude, selectedLocation.longitude)
    onClose()
  }

  const handleReset = useCallback(() => {
    const baseLocation = {
      latitude: withFallback(initialLatitude, DEFAULT_LOCATION.latitude),
      longitude: withFallback(initialLongitude, DEFAULT_LOCATION.longitude),
    }
    setSelectedLocation(baseLocation)
    setMapCenter([baseLocation.longitude, baseLocation.latitude])
  }, [initialLatitude, initialLongitude])

  const handleCenterOnMarker = () => {
    setMapCenter([selectedLocation.longitude, selectedLocation.latitude])
  }

  // Web fallback
  if (Platform.OS === 'web') {
    return (
      <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
          <View style={[styles.header, { backgroundColor: theme.colors.primary[500] }]}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Sélectionner la position</Text>
            <View style={{ width: 40 }} />
          </View>
          <View style={styles.webFallback}>
            <Ionicons name="map-outline" size={64} color={theme.colors.neutral[400]} />
            <Text style={[styles.webFallbackText, { color: theme.colors.textSecondary }]}>
              La carte n'est pas disponible sur le web.
            </Text>
          </View>
        </View>
      </Modal>
    )
  }

  const MapLibreGL = getMapLibreGL()

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme.isDark ? '#0F1622' : theme.colors.primary[500] }]}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Sélectionner la position</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Instructions */}
        <View style={[styles.instructions, { backgroundColor: theme.colors.info }]}>
          <Ionicons name="information-circle" size={20} color={theme.colors.primary[500]} />
          <Text style={[styles.instructionsText, { color: theme.colors.text }]}>
            Appuyez sur la carte pour choisir la position
          </Text>
        </View>

        {/* Map */}
        <View style={styles.mapContainer}>
          {!permissionChecked && (
            <View style={styles.permissionLoader}>
              <ActivityIndicator size="large" color={theme.colors.primary[500]} />
              <Text style={[styles.permissionLoaderText, { color: theme.colors.text }]}>
                Chargement...
              </Text>
            </View>
          )}

          {permissionChecked && mapReady && (
            <>
              <MapLibreWrapper
                ref={mapRef}
                style={styles.map}
                center={mapCenter}
                zoom={zoom}
                onPress={handleMapPress}
                showsUserLocation={locationPermissionGranted}
              >
                {/* Marker pour la position sélectionnée */}
                {!isExpoGo && MapLibreGL && selectedLocation && (
                  <MapLibreGL.PointAnnotation
                    id="selected-location"
                    coordinate={[selectedLocation.longitude, selectedLocation.latitude]}
                  >
                    <View style={styles.markerContainer}>
                      <Ionicons name="location" size={40} color="#10B981" />
                    </View>
                  </MapLibreGL.PointAnnotation>
                )}
              </MapLibreWrapper>

              {/* Center button */}
              <TouchableOpacity
                style={[styles.centerButton, { backgroundColor: theme.colors.background }]}
                onPress={handleCenterOnMarker}
              >
                <Ionicons name="locate" size={24} color={theme.colors.primary[500]} />
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Coordinates display */}
        <View
          style={[
            styles.coordinatesDisplay,
            { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.cardBorder },
          ]}
        >
          <View style={styles.coordinateRow}>
            <Text style={[styles.coordinateLabel, { color: theme.colors.textSecondary }]}>Latitude:</Text>
            <Text style={[styles.coordinateValue, { color: theme.colors.text }]}>
              {selectedLocation.latitude.toFixed(6)}
            </Text>
          </View>
          <View style={styles.coordinateRow}>
            <Text style={[styles.coordinateLabel, { color: theme.colors.textSecondary }]}>Longitude:</Text>
            <Text style={[styles.coordinateValue, { color: theme.colors.text }]}>
              {selectedLocation.longitude.toFixed(6)}
            </Text>
          </View>
        </View>

        {/* Action buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.resetButton, { borderColor: theme.colors.neutral[300] }]}
            onPress={handleReset}
          >
            <Ionicons name="refresh" size={20} color={theme.colors.textSecondary} />
            <Text style={[styles.resetButtonText, { color: theme.colors.textSecondary }]}>
              Réinitialiser
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.confirmButton,
              {
                backgroundColor: theme.isDark ? '#10B981' : theme.colors.primary[500],
              },
            ]}
            onPress={handleConfirm}
          >
            <Ionicons name="checkmark-circle" size={20} color="white" />
            <Text style={styles.confirmButtonText}>Confirmer</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  instructions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  instructionsText: {
    fontSize: 14,
    flex: 1,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  permissionLoader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  permissionLoaderText: {
    marginTop: 12,
    fontSize: 14,
  },
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerButton: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  coordinatesDisplay: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  coordinateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  coordinateLabel: {
    fontSize: 14,
  },
  coordinateValue: {
    fontSize: 14,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  resetButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  webFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  webFallbackText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 24,
  },
})

export default MapLocationPicker
