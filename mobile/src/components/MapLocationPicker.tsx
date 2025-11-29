import React, { useState, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from 'react-native'
import MapView, { Marker, UrlTile, Region, MapPressEvent } from 'react-native-maps'
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

const MapLocationPicker: React.FC<MapLocationPickerProps> = ({
  visible,
  onClose,
  onSelectLocation,
  initialLatitude,
  initialLongitude,
}) => {
  const theme = useTheme()
  const mapRef = useRef<MapView>(null)

  const [selectedLocation, setSelectedLocation] = useState<{
    latitude: number
    longitude: number
  } | null>(
    initialLatitude != null && initialLongitude != null
      ? { latitude: initialLatitude, longitude: initialLongitude }
      : null
  )

  const [region, setRegion] = useState<Region>({
    latitude: initialLatitude ?? DEFAULT_REGION.latitude,
    longitude: initialLongitude ?? DEFAULT_REGION.longitude,
    latitudeDelta: DEFAULT_REGION.latitudeDelta,
    longitudeDelta: DEFAULT_REGION.longitudeDelta,
  })

  const handleMapPress = (event: MapPressEvent) => {
    const { latitude, longitude } = event.nativeEvent.coordinate
    setSelectedLocation({ latitude, longitude })
  }

  const handleConfirm = () => {
    if (selectedLocation) {
      onSelectLocation(selectedLocation.latitude, selectedLocation.longitude)
      onClose()
    }
  }

  const handleReset = () => {
    if (initialLatitude != null && initialLongitude != null) {
      setSelectedLocation({ latitude: initialLatitude, longitude: initialLongitude })
      mapRef.current?.animateToRegion({
        latitude: initialLatitude,
        longitude: initialLongitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      })
    } else {
      setSelectedLocation(null)
    }
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
            Appuyez sur la carte pour placer votre commerce
          </Text>
        </View>

        {/* Map */}
        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={region}
            onRegionChangeComplete={setRegion}
            onPress={handleMapPress}
            showsUserLocation={true}
            showsMyLocationButton={true}
            showsCompass={true}
            mapType={Platform.OS === 'android' ? 'none' : 'standard'}
          >
            {/* OpenStreetMap Tiles */}
            <UrlTile
              urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
              maximumZ={19}
              flipY={false}
              tileSize={256}
            />

            {/* Selected location marker */}
            {selectedLocation && (
              <Marker
                coordinate={selectedLocation}
                draggable
                onDragEnd={(e) => setSelectedLocation(e.nativeEvent.coordinate)}
              >
                <View style={styles.markerContainer}>
                  <View style={[styles.marker, { backgroundColor: theme.colors.primary[500] }]}>
                    <Ionicons name="storefront" size={20} color="white" />
                  </View>
                  <View style={[styles.markerTail, { borderTopColor: theme.colors.primary[500] }]} />
                </View>
              </Marker>
            )}
          </MapView>

          {/* OpenStreetMap Attribution */}
          <View style={styles.osmAttribution}>
            <Text style={styles.osmAttributionText}>© OpenStreetMap</Text>
          </View>
        </View>

        {/* Selected coordinates display */}
        {selectedLocation && (
          <View style={[styles.coordinatesDisplay, { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.cardBorder }]}>
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
        )}

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
                backgroundColor: selectedLocation
                  ? (theme.isDark ? '#10B981' : theme.colors.primary[500])
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
  markerContainer: {
    alignItems: 'center',
  },
  marker: {
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
    shadowRadius: 4,
    elevation: 5,
  },
  markerTail: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -2,
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
