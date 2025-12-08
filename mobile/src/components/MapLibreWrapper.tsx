/**
 * MapLibreWrapper - Wrapper pour @maplibre/maplibre-react-native
 *
 * 100% gratuit, open source, compatible OpenStreetMap
 * Pas besoin de clé API Google Maps !
 */

import React, { useRef, useImperativeHandle, forwardRef } from 'react'
import { View, Text, StyleSheet, Platform } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import Constants from 'expo-constants'

// Détecte si on est dans Expo Go
const isExpoGo = Constants.appOwnership === 'expo'

// Import conditionnel de MapLibre
let MapLibreGL: any = null

if (!isExpoGo) {
  try {
    MapLibreGL = require('@maplibre/maplibre-react-native')
    MapLibreGL.setAccessToken(null) // Pas besoin de token pour OSM
    console.log('[MapLibreWrapper] MapLibre loaded successfully')
  } catch (error) {
    console.error('[MapLibreWrapper] Failed to load MapLibre:', error)
  }
}

// Style OpenStreetMap gratuit (Protomaps ou autre)
const OSM_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty'

// Alternative: Style OSM basique
const OSM_RASTER_STYLE = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors',
    },
  },
  layers: [
    {
      id: 'osm',
      type: 'raster',
      source: 'osm',
      minzoom: 0,
      maxzoom: 19,
    },
  ],
}

interface MapLibreWrapperProps {
  style?: any
  center?: [number, number] // [longitude, latitude]
  zoom?: number
  onPress?: (event: { latitude: number; longitude: number }) => void
  onRegionChange?: (region: { latitude: number; longitude: number; zoom: number }) => void
  showsUserLocation?: boolean
  children?: React.ReactNode
}

export interface MapLibreRef {
  flyTo: (center: [number, number], zoom?: number) => void
  getCenter: () => [number, number] | null
}

interface FallbackProps {
  style?: any
  message?: string
}

// Composant Fallback pour Expo Go
const MapFallback: React.FC<FallbackProps> = ({
  style,
  message = 'La carte nécessite un build natif.\nUtilisez un Development Build ou un APK.',
}) => (
  <View style={[styles.fallback, style]}>
    <Ionicons name="map-outline" size={64} color="#9CA3AF" />
    <Text style={styles.fallbackTitle}>Carte non disponible</Text>
    <Text style={styles.fallbackMessage}>{message}</Text>
    <View style={styles.badge}>
      <Ionicons name="information-circle" size={16} color="#3B82F6" />
      <Text style={styles.badgeText}>Mode Expo Go</Text>
    </View>
  </View>
)

// Composant principal
const MapLibreWrapper = forwardRef<MapLibreRef, MapLibreWrapperProps>((props, ref) => {
  const {
    style,
    center = [1.2228, 6.1319], // Lomé, Togo [lon, lat]
    zoom = 13,
    onPress,
    onRegionChange,
    showsUserLocation = false,
    children,
  } = props

  const cameraRef = useRef<any>(null)
  const mapRef = useRef<any>(null)

  console.log('[MapLibreWrapper] Render, isExpoGo:', isExpoGo, 'hasMapLibre:', !!MapLibreGL)

  useImperativeHandle(ref, () => ({
    flyTo: (newCenter: [number, number], newZoom?: number) => {
      cameraRef.current?.flyTo(newCenter, newZoom || zoom)
    },
    getCenter: () => {
      return center
    },
  }))

  // En mode Expo Go ou si MapLibre n'est pas disponible
  if (isExpoGo || !MapLibreGL) {
    console.log('[MapLibreWrapper] Using fallback')
    return <MapFallback style={style} />
  }

  const handlePress = (event: any) => {
    if (onPress && event.geometry?.coordinates) {
      const [longitude, latitude] = event.geometry.coordinates
      onPress({ latitude, longitude })
    }
  }

  const handleRegionChange = () => {
    // MapLibre doesn't have a direct equivalent, we'll use onRegionDidChange
  }

  console.log('[MapLibreWrapper] Rendering MapLibre map...')

  return (
    <View style={[styles.container, style]}>
      <MapLibreGL.MapView
        ref={mapRef}
        style={styles.map}
        styleJSON={JSON.stringify(OSM_RASTER_STYLE)}
        onPress={handlePress}
        logoEnabled={false}
        attributionEnabled={true}
        attributionPosition={{ bottom: 8, right: 8 }}
      >
        <MapLibreGL.Camera
          ref={cameraRef}
          defaultSettings={{
            centerCoordinate: center,
            zoomLevel: zoom,
          }}
          centerCoordinate={center}
          zoomLevel={zoom}
        />

        {showsUserLocation && (
          <MapLibreGL.UserLocation visible={true} />
        )}

        {children}
      </MapLibreGL.MapView>

      {/* Attribution OSM */}
      <View style={styles.osmAttribution}>
        <Text style={styles.osmAttributionText}>© OpenStreetMap</Text>
      </View>
    </View>
  )
})

MapLibreWrapper.displayName = 'MapLibreWrapper'

// Export des composants MapLibre pour les markers etc.
export const getMapLibreGL = () => MapLibreGL
export { MapLibreWrapper as default, MapFallback, isExpoGo }

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  fallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    padding: 24,
  },
  fallbackTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  fallbackMessage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  badgeText: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '500',
  },
  osmAttribution: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  osmAttributionText: {
    fontSize: 10,
    color: '#666',
  },
})
