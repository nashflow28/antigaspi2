import React, { useState, useEffect, useCallback, useMemo } from 'react'
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
import LeafletMapPicker from './LeafletMapPicker'
import { createLogger } from '../utils/logger'

const log = createLogger('MapLocationPicker')

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

  const initialLocation = useMemo(
    () => ({
      latitude: withFallback(initialLatitude, DEFAULT_LOCATION.latitude),
      longitude: withFallback(initialLongitude, DEFAULT_LOCATION.longitude),
    }),
    [initialLatitude, initialLongitude]
  )

  const [selectedLocation, setSelectedLocation] = useState(initialLocation)
  const [locationPermissionGranted, setLocationPermissionGranted] = useState(false)
  const [permissionChecked, setPermissionChecked] = useState(false)
  const [mapReady, setMapReady] = useState(false)
  const [isLoadingGPS, setIsLoadingGPS] = useState(false)

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
          log.debug(' Permission déjà accordée')
        } else {
          const { status: newStatus } = await Location.requestForegroundPermissionsAsync()
          setLocationPermissionGranted(newStatus === 'granted')
          log.debug(' Permission demandée:', newStatus)
        }
      } catch (error) {
        log.error(' Erreur permission:', error)
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
    setMapReady(true)

    log.debug(' Initialized with:', newLocation)
  }, [visible, initialLatitude, initialLongitude])

  // Gérer la sélection sur la carte (depuis Leaflet WebView)
  const handleLocationSelect = useCallback((latitude: number, longitude: number) => {
    log.debug(' Location selected:', { latitude, longitude })
    setSelectedLocation({ latitude, longitude })
  }, [])

  const handleConfirm = () => {
    log.debug(' Confirming:', selectedLocation)
    onSelectLocation(selectedLocation.latitude, selectedLocation.longitude)
    onClose()
  }

  const handleReset = useCallback(() => {
    const baseLocation = {
      latitude: withFallback(initialLatitude, DEFAULT_LOCATION.latitude),
      longitude: withFallback(initialLongitude, DEFAULT_LOCATION.longitude),
    }
    setSelectedLocation(baseLocation)
    // Note: Le composant Leaflet sera recréé avec les nouvelles coordonnées
    setMapReady(false)
    setTimeout(() => setMapReady(true), 100)
  }, [initialLatitude, initialLongitude])

  // Utiliser la position GPS actuelle
  const handleUseCurrentLocation = useCallback(async () => {
    if (!locationPermissionGranted) {
      log.debug(' Permission not granted')
      return
    }

    setIsLoadingGPS(true)
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      })
      const { latitude, longitude } = location.coords
      log.debug(' GPS location:', { latitude, longitude })
      setSelectedLocation({ latitude, longitude })
      // Recréer la carte avec la nouvelle position
      setMapReady(false)
      setTimeout(() => setMapReady(true), 100)
    } catch (error) {
      log.error(' Erreur GPS:', error)
    } finally {
      setIsLoadingGPS(false)
    }
  }, [locationPermissionGranted])

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
            Appuyez sur la carte ou glissez le marqueur
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
              <LeafletMapPicker
                initialLatitude={selectedLocation.latitude}
                initialLongitude={selectedLocation.longitude}
                zoom={15}
                onLocationSelect={handleLocationSelect}
                style={styles.map}
              />

              {/* Bouton GPS */}
              {locationPermissionGranted && (
                <TouchableOpacity
                  style={[styles.gpsButton, { backgroundColor: theme.colors.background }]}
                  onPress={handleUseCurrentLocation}
                  disabled={isLoadingGPS}
                >
                  {isLoadingGPS ? (
                    <ActivityIndicator size="small" color={theme.colors.primary[500]} />
                  ) : (
                    <Ionicons name="locate" size={24} color={theme.colors.primary[500]} />
                  )}
                </TouchableOpacity>
              )}
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
  gpsButton: {
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
