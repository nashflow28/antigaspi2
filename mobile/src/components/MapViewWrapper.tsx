/**
 * MapViewWrapper - Wrapper pour react-native-maps compatible Expo Go
 *
 * Ce composant détecte automatiquement si l'app tourne dans Expo Go
 * et affiche un fallback au lieu de react-native-maps (qui nécessite un build natif).
 *
 * En mode Development Build ou Production, il utilise react-native-maps normalement.
 */

import React from 'react'
import { View, Text, StyleSheet, Platform } from 'react-native'
import Constants from 'expo-constants'
import { Ionicons } from '@expo/vector-icons'

// Détecte si on est dans Expo Go (pas de support pour modules natifs custom)
const isExpoGo = Constants.appOwnership === 'expo'

// Import conditionnel de react-native-maps
let MapView: any = null
let Marker: any = null
let Callout: any = null
let UrlTile: any = null

console.log('[MapViewWrapper] isExpoGo:', isExpoGo, 'appOwnership:', Constants.appOwnership)

if (!isExpoGo) {
  try {
    console.log('[MapViewWrapper] Attempting to load react-native-maps...')
    const Maps = require('react-native-maps')
    MapView = Maps.default
    Marker = Maps.Marker
    Callout = Maps.Callout
    UrlTile = Maps.UrlTile
    console.log('[MapViewWrapper] react-native-maps loaded successfully:', {
      hasMapView: !!MapView,
      hasMarker: !!Marker,
      hasUrlTile: !!UrlTile,
    })
  } catch (error) {
    console.error('[MapViewWrapper] Failed to load react-native-maps:', error)
  }
} else {
  console.log('[MapViewWrapper] Skipping react-native-maps (Expo Go mode)')
}

// Props types (reprend les props de react-native-maps)
interface MapViewWrapperProps {
  style?: any
  initialRegion?: {
    latitude: number
    longitude: number
    latitudeDelta: number
    longitudeDelta: number
  }
  region?: {
    latitude: number
    longitude: number
    latitudeDelta: number
    longitudeDelta: number
  }
  showsUserLocation?: boolean
  showsMyLocationButton?: boolean
  showsCompass?: boolean
  mapType?: 'standard' | 'satellite' | 'hybrid' | 'terrain' | 'none'
  onRegionChangeComplete?: (region: any) => void
  onPress?: (event: any) => void
  children?: React.ReactNode
  testID?: string
  ref?: any
}

interface FallbackProps {
  style?: any
  message?: string
}

// Composant Fallback pour Expo Go
const MapFallback: React.FC<FallbackProps> = ({
  style,
  message = 'La carte nécessite un build natif.\nUtilisez un Development Build ou un APK pour voir la carte.',
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

// Composant wrapper principal
const MapViewWrapper = React.forwardRef<any, MapViewWrapperProps>((props, ref) => {
  const { style, children, ...restProps } = props

  console.log('[MapViewWrapper] Render called, isExpoGo:', isExpoGo, 'hasMapView:', !!MapView)

  // En mode Expo Go, afficher le fallback
  if (isExpoGo || !MapView) {
    console.log('[MapViewWrapper] Using fallback (no MapView available)')
    return <MapFallback style={style} />
  }

  console.log('[MapViewWrapper] Rendering native MapView...')

  // Sinon, utiliser react-native-maps normalement
  try {
    return (
      <MapView ref={ref} style={style} {...restProps}>
        {children}
      </MapView>
    )
  } catch (error) {
    console.error('[MapViewWrapper] Error rendering MapView:', error)
    return <MapFallback style={style} message={`Erreur carte: ${error}`} />
  }
})

MapViewWrapper.displayName = 'MapViewWrapper'

// Export des composants
export { MapViewWrapper as default, Marker, Callout, UrlTile, isExpoGo, MapFallback }

// Export du type Region pour compatibilité
export type { MapViewWrapperProps }

const styles = StyleSheet.create({
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
})
