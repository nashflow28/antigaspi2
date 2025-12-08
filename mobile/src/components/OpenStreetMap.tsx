/**
 * OpenStreetMap Component using Leaflet.js via WebView
 * Displays merchants on an interactive map
 */

import React, { useMemo } from 'react'
import { View, StyleSheet, Platform, ActivityIndicator } from 'react-native'
import { WebView } from 'react-native-webview'
import { useTheme } from '../theme'
import { Typography } from './2025'
import { Ionicons } from '@expo/vector-icons'

export interface MapMarker {
  id: number
  latitude: number
  longitude: number
  title: string
  subtitle?: string
  emoji?: string
}

interface OpenStreetMapProps {
  markers: MapMarker[]
  initialRegion?: {
    latitude: number
    longitude: number
    zoom?: number
  }
  height?: number
  onMarkerPress?: (markerId: number) => void
}

const OpenStreetMap: React.FC<OpenStreetMapProps> = ({
  markers,
  initialRegion,
  height = 360,
  onMarkerPress,
}) => {
  const theme = useTheme()

  // Calculate center from markers if no initialRegion provided
  const mapCenter = useMemo(() => {
    if (initialRegion) {
      return initialRegion
    }

    if (markers.length === 0) {
      // Default to Lomé, Togo
      return { latitude: 6.1319, longitude: 1.2228, zoom: 12 }
    }

    const lats = markers.map(m => m.latitude)
    const lngs = markers.map(m => m.longitude)

    const minLat = Math.min(...lats)
    const maxLat = Math.max(...lats)
    const minLng = Math.min(...lngs)
    const maxLng = Math.max(...lngs)

    // Calculate zoom based on bounds
    const latDiff = maxLat - minLat
    const lngDiff = maxLng - minLng
    const maxDiff = Math.max(latDiff, lngDiff)

    let zoom = 13
    if (maxDiff > 0.5) zoom = 10
    else if (maxDiff > 0.2) zoom = 11
    else if (maxDiff > 0.1) zoom = 12
    else if (maxDiff > 0.05) zoom = 13
    else zoom = 14

    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      zoom,
    }
  }, [markers, initialRegion])

  // Generate HTML for Leaflet map
  const mapHtml = useMemo(() => {
    const markersJson = JSON.stringify(markers)

    return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { height: 100%; width: 100%; overflow: hidden; }
    #map { height: 100%; width: 100%; }
    .custom-marker {
      background: white;
      border-radius: 50%;
      border: 3px solid #10B981;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    }
    .leaflet-popup-content-wrapper {
      border-radius: 12px;
      padding: 0;
    }
    .leaflet-popup-content {
      margin: 12px 16px;
      min-width: 150px;
    }
    .popup-title {
      font-weight: 600;
      font-size: 14px;
      color: #1f2937;
      margin-bottom: 4px;
    }
    .popup-subtitle {
      font-size: 12px;
      color: #6b7280;
    }
    .popup-btn {
      display: block;
      margin-top: 8px;
      padding: 8px 12px;
      background: #10B981;
      color: white;
      text-align: center;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 600;
      text-decoration: none;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    const markers = ${markersJson};
    const center = [${mapCenter.latitude}, ${mapCenter.longitude}];
    const zoom = ${mapCenter.zoom || 13};

    // Initialize map
    const map = L.map('map', {
      zoomControl: true,
      attributionControl: true
    }).setView(center, zoom);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19
    }).addTo(map);

    // Custom icon function
    function createCustomIcon(emoji) {
      return L.divIcon({
        html: '<div class="custom-marker">' + (emoji || '🏪') + '</div>',
        className: '',
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        popupAnchor: [0, -40]
      });
    }

    // Add markers
    markers.forEach(function(m) {
      const icon = createCustomIcon(m.emoji);
      const marker = L.marker([m.latitude, m.longitude], { icon: icon }).addTo(map);

      const popupContent =
        '<div class="popup-title">' + m.title + '</div>' +
        (m.subtitle ? '<div class="popup-subtitle">' + m.subtitle + '</div>' : '') +
        '<div class="popup-btn" onclick="window.ReactNativeWebView.postMessage(JSON.stringify({type:\\'markerPress\\',id:' + m.id + '}))">Voir la boutique</div>';

      marker.bindPopup(popupContent);
    });

    // Fit bounds if multiple markers
    if (markers.length > 1) {
      const group = L.featureGroup(markers.map(m => L.marker([m.latitude, m.longitude])));
      map.fitBounds(group.getBounds().pad(0.1));
    }
  </script>
</body>
</html>
    `
  }, [markers, mapCenter])

  // Handle messages from WebView
  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data)
      if (data.type === 'markerPress' && onMarkerPress) {
        onMarkerPress(data.id)
      }
    } catch (e) {
      console.warn('Error parsing WebView message:', e)
    }
  }

  // Web platform fallback
  if (Platform.OS === 'web') {
    return (
      <View style={[styles.fallback, { height, backgroundColor: theme.colors.surface.light }]}>
        <Ionicons name="map" size={48} color={theme.colors.primary[500]} />
        <Typography variant="body" weight="semibold" style={{ marginTop: 12, textAlign: 'center' }}>
          Carte disponible sur l'application mobile
        </Typography>
      </View>
    )
  }

  return (
    <View style={[styles.container, { height }]}>
      <WebView
        source={{ html: mapHtml }}
        style={styles.webview}
        originWhitelist={['*']}
        onMessage={handleMessage}
        scrollEnabled={false}
        bounces={false}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={[styles.loading, { backgroundColor: theme.colors.background }]}>
            <ActivityIndicator size="large" color={theme.colors.primary[500]} />
            <Typography variant="caption" color="secondary" style={{ marginTop: 8 }}>
              Chargement de la carte...
            </Typography>
          </View>
        )}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  webview: {
    flex: 1,
  },
  loading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallback: {
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
})

export default OpenStreetMap
