/**
 * LeafletMapPicker - Sélecteur de position basé sur WebView + Leaflet
 *
 * Solution de contournement pour le bug MapLibre React Native + New Architecture
 * 100% fiable sur Android réel
 */

import React, { useRef, useCallback, useEffect } from 'react'
import { View, StyleSheet, Platform } from 'react-native'
import { WebView } from 'react-native-webview'

interface LeafletMapPickerProps {
  initialLatitude: number
  initialLongitude: number
  zoom?: number
  onLocationSelect: (latitude: number, longitude: number) => void
  style?: any
}

const LeafletMapPicker: React.FC<LeafletMapPickerProps> = ({
  initialLatitude,
  initialLongitude,
  zoom = 15,
  onLocationSelect,
  style,
}) => {
  const webViewRef = useRef<WebView>(null)

  // HTML avec Leaflet intégré
  const leafletHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <title>Sélectionner la position</title>

  <!-- Leaflet CSS -->
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
    integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin="" />

  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; overflow: hidden; }
    #map { width: 100%; height: 100%; }

    .custom-marker {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .marker-pin {
      width: 30px;
      height: 30px;
      border-radius: 50% 50% 50% 0;
      background: #10B981;
      position: absolute;
      transform: rotate(-45deg);
      left: 50%;
      top: 50%;
      margin: -15px 0 0 -15px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.3);
    }

    .marker-pin::after {
      content: '';
      width: 14px;
      height: 14px;
      margin: 8px 0 0 8px;
      background: #fff;
      position: absolute;
      border-radius: 50%;
    }

    .leaflet-control-attribution {
      font-size: 10px !important;
      background: rgba(255,255,255,0.8) !important;
    }
  </style>
</head>
<body>
  <div id="map"></div>

  <!-- Leaflet JS -->
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
    integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""></script>

  <script>
    // Initialisation de la carte
    const initialLat = ${initialLatitude};
    const initialLng = ${initialLongitude};
    const initialZoom = ${zoom};

    // Créer la carte
    const map = L.map('map', {
      zoomControl: true,
      attributionControl: true
    }).setView([initialLat, initialLng], initialZoom);

    // Ajouter les tuiles CARTO (même style que MapLibre)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '© CARTO © OSM',
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(map);

    // Icône personnalisée
    const customIcon = L.divIcon({
      className: 'custom-marker',
      html: '<div class="marker-pin"></div>',
      iconSize: [30, 42],
      iconAnchor: [15, 42]
    });

    // Créer le marker
    let marker = L.marker([initialLat, initialLng], {
      icon: customIcon,
      draggable: true
    }).addTo(map);

    // Fonction pour envoyer les coordonnées à React Native
    function sendCoordinates(lat, lng) {
      const message = JSON.stringify({
        type: 'locationSelected',
        latitude: lat,
        longitude: lng
      });

      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(message);
      }
    }

    // Envoyer la position initiale
    sendCoordinates(initialLat, initialLng);

    // Gestionnaire de clic sur la carte
    map.on('click', function(e) {
      const lat = e.latlng.lat;
      const lng = e.latlng.lng;

      // Déplacer le marker
      marker.setLatLng([lat, lng]);

      // Envoyer les nouvelles coordonnées
      sendCoordinates(lat, lng);
    });

    // Gestionnaire de drag du marker
    marker.on('dragend', function(e) {
      const position = marker.getLatLng();
      sendCoordinates(position.lat, position.lng);
    });

    // Recevoir des messages de React Native
    window.addEventListener('message', function(event) {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'setLocation') {
          marker.setLatLng([data.latitude, data.longitude]);
          map.setView([data.latitude, data.longitude], map.getZoom());
        }

        if (data.type === 'centerOnLocation') {
          map.setView([data.latitude, data.longitude], data.zoom || map.getZoom());
        }
      } catch (e) {
        console.error('Error parsing message:', e);
      }
    });

    // Forcer le redimensionnement après chargement
    setTimeout(function() {
      map.invalidateSize();
    }, 100);
  </script>
</body>
</html>
  `

  // Gérer les messages de la WebView
  const handleMessage = useCallback((event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data)

      if (data.type === 'locationSelected') {
        console.log('[LeafletMapPicker] Location selected:', data.latitude, data.longitude)
        onLocationSelect(data.latitude, data.longitude)
      }
    } catch (error) {
      console.error('[LeafletMapPicker] Error parsing message:', error)
    }
  }, [onLocationSelect])

  // Centrer sur une position
  const centerOnLocation = useCallback((latitude: number, longitude: number, newZoom?: number) => {
    const message = JSON.stringify({
      type: 'centerOnLocation',
      latitude,
      longitude,
      zoom: newZoom,
    })
    webViewRef.current?.postMessage(message)
  }, [])

  // Définir une nouvelle position
  const setLocation = useCallback((latitude: number, longitude: number) => {
    const message = JSON.stringify({
      type: 'setLocation',
      latitude,
      longitude,
    })
    webViewRef.current?.postMessage(message)
  }, [])

  return (
    <View style={[styles.container, style]}>
      <WebView
        ref={webViewRef}
        source={{ html: leafletHTML }}
        style={styles.webview}
        onMessage={handleMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={false}
        scalesPageToFit={true}
        scrollEnabled={false}
        bounces={false}
        overScrollMode="never"
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        originWhitelist={['*']}
        mixedContentMode="compatibility"
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent
          console.error('[LeafletMapPicker] WebView error:', nativeEvent)
        }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  webview: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
})

export default LeafletMapPicker
