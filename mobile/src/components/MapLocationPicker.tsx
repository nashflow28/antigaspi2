import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Platform,
} from 'react-native'
import MapView, {
  Marker,
  Region,
  MapPressEvent,
  MarkerDragStartEndEvent,
  UrlTile,
} from 'react-native-maps'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../theme'

interface MapLocationPickerProps {
  visible: boolean
  onClose: () => void
  onSelectLocation: (latitude: number, longitude: number) => void
  initialLatitude?: number | null
  initialLongitude?: number | null
}

const DEFAULT_REGION = {
  latitude: 6.1319,
  longitude: 1.2228,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
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
  const mapRef = useRef<MapView>(null)

  const initialLocation = useMemo(
    () => ({
      latitude: withFallback(initialLatitude, DEFAULT_REGION.latitude),
      longitude: withFallback(initialLongitude, DEFAULT_REGION.longitude),
    }),
    [initialLatitude, initialLongitude]
  )

  const [selectedLocation, setSelectedLocation] = useState<{ latitude: number; longitude: number }>(initialLocation)
  const [region, setRegion] = useState<Region>({
    latitude: initialLocation.latitude,
    longitude: initialLocation.longitude,
    latitudeDelta: DEFAULT_REGION.latitudeDelta,
    longitudeDelta: DEFAULT_REGION.longitudeDelta,
  })

  // Reset state when modal opens or initial coordinates change
  useEffect(() => {
    if (!visible) return

    const baseLocation = {
      latitude: withFallback(initialLatitude, DEFAULT_REGION.latitude),
      longitude: withFallback(initialLongitude, DEFAULT_REGION.longitude),
    }

    const nextRegion = {
      ...baseLocation,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    }

    setSelectedLocation(baseLocation)
    setRegion(nextRegion)

    requestAnimationFrame(() => {
      mapRef.current?.animateToRegion(nextRegion, 500)
    })

    console.log('[MapLocationPicker] Initialized with:', nextRegion)
  }, [visible, initialLatitude, initialLongitude])

  const centerOnLocation = useCallback((latitude: number, longitude: number) => {
    setRegion((prev) => {
      const nextRegion = {
        ...prev,
        latitude,
        longitude,
      }
      mapRef.current?.animateToRegion(nextRegion, 250)
      return nextRegion
    })
  }, [])

  // Handle tap on map to place marker
  const handleMapPress = useCallback(
    (event: MapPressEvent) => {
      const { latitude, longitude } = event.nativeEvent.coordinate
      setSelectedLocation({ latitude, longitude })
      centerOnLocation(latitude, longitude)
      console.log('[MapLocationPicker] Map pressed at:', { latitude, longitude })
    },
    [centerOnLocation]
  )

  // Handle marker drag end
  const handleMarkerDragEnd = useCallback(
    (event: MarkerDragStartEndEvent) => {
      const { latitude, longitude } = event.nativeEvent.coordinate
      setSelectedLocation({ latitude, longitude })
      centerOnLocation(latitude, longitude)
      console.log('[MapLocationPicker] Marker dragged to:', { latitude, longitude })
    },
    [centerOnLocation]
  )

  // Handle marker drag (real-time updates)
  const handleMarkerDrag = useCallback((event: MarkerDragStartEndEvent) => {
    const { latitude, longitude } = event.nativeEvent.coordinate
    setSelectedLocation({ latitude, longitude })
  }, [])

  const handleConfirm = () => {
    if (!selectedLocation) return

    console.log('[MapLocationPicker] Confirming location:', selectedLocation)
    onSelectLocation(selectedLocation.latitude, selectedLocation.longitude)
    onClose()
  }

  const handleReset = useCallback(() => {
    const baseLocation =
      initialLatitude != null && initialLongitude != null
        ? { latitude: initialLatitude, longitude: initialLongitude }
        : { latitude: DEFAULT_REGION.latitude, longitude: DEFAULT_REGION.longitude }

    setSelectedLocation(baseLocation)
    centerOnLocation(baseLocation.latitude, baseLocation.longitude)
  }, [centerOnLocation, initialLatitude, initialLongitude])

  // Center map on marker
  const handleCenterOnMarker = () => {
    if (!selectedLocation) return

    const nextRegion = {
      latitude: selectedLocation.latitude,
      longitude: selectedLocation.longitude,
      latitudeDelta: region.latitudeDelta,
      longitudeDelta: region.longitudeDelta,
    }

    mapRef.current?.animateToRegion(nextRegion, 500)
    setRegion(nextRegion)
  }

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
              La carte n'est pas disponible sur le web.{'\n'}
              Utilisez le bouton "Ma position" ou entrez les coordonnées manuellement.
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
            Déplacez le marqueur ou appuyez sur la carte pour choisir la position
          </Text>
        </View>

        {/* Map */}
        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            style={styles.map}
            region={region}
            onRegionChangeComplete={setRegion}
            onPress={handleMapPress}
            showsUserLocation={true}
            showsMyLocationButton={true}
            showsCompass={true}
            mapType={Platform.OS === 'android' ? 'none' : 'standard'}
          >
            {/* OpenStreetMap Tiles - 100% gratuit, pas de clé API */}
            <UrlTile
              urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
              maximumZ={19}
              flipY={false}
              tileSize={256}
            />

            {/* Draggable Marker */}
            {selectedLocation && (
              <Marker
                coordinate={selectedLocation}
                draggable={true}
                onDrag={handleMarkerDrag}
                onDragEnd={handleMarkerDragEnd}
                pinColor="#10B981"
                title="Position du commerce"
                description="Déplacez-moi pour changer la position"
              />
            )}
          </MapView>

          {/* OpenStreetMap Attribution */}
          <View style={styles.osmAttribution}>
            <Text style={styles.osmAttributionText}>© OpenStreetMap</Text>
          </View>

          {/* Center on marker button */}
          {selectedLocation && (
            <TouchableOpacity
              style={[styles.centerButton, { backgroundColor: theme.colors.background }]}
              onPress={handleCenterOnMarker}
            >
              <Ionicons name="locate" size={24} color={theme.colors.primary[500]} />
            </TouchableOpacity>
          )}
        </View>

        {/* Selected coordinates display */}
        {selectedLocation && (
          <View
            style={[
              styles.coordinatesDisplay,
              { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.cardBorder },
            ]}
          >
            <View style={styles.coordinateRow}>
              <Text style={[styles.coordinateLabel, { color: theme.colors.textSecondary }]}>Latitude:</Text>
              <Text style={[styles.coordinateValue, { color: theme.colors.text }]}>{selectedLocation.latitude.toFixed(6)}</Text>
            </View>
            <View style={styles.coordinateRow}>
              <Text style={[styles.coordinateLabel, { color: theme.colors.textSecondary }]}>Longitude:</Text>
              <Text style={[styles.coordinateValue, { color: theme.colors.text }]}>{selectedLocation.longitude.toFixed(6)}</Text>
            </View>
          </View>
        )}

        {/* Action buttons */}
        <View style={styles.actions}>
          <TouchableOpacity style={[styles.resetButton, { borderColor: theme.colors.neutral[300] }]} onPress={handleReset}>
            <Ionicons name="refresh" size={20} color={theme.colors.textSecondary} />
            <Text style={[styles.resetButtonText, { color: theme.colors.textSecondary }]}>Réinitialiser</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.confirmButton,
              {
                backgroundColor: selectedLocation
                  ? theme.isDark
                    ? '#10B981'
                    : theme.colors.primary[500]
                  : theme.colors.neutral[300],
              },
            ]}
            onPress={handleConfirm}
            disabled={!selectedLocation}
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
  osmAttribution: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  osmAttributionText: {
    fontSize: 10,
    color: '#666',
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
