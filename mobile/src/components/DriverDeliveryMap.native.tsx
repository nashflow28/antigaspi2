import React, { forwardRef, useImperativeHandle, useRef } from 'react'
import { StyleSheet, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import {
  getMapLibreGL,
  MapFallback,
  isExpoGo,
  OSM_RASTER_STYLE,
  fitCameraToCoordinates,
} from './MapLibreWrapper'
import type { DriverDeliveryMapProps, DriverDeliveryMapRef, DriverMapCoordinate } from './DriverDeliveryMap'

const MapLibreGL = getMapLibreGL()

const DriverDeliveryMap = forwardRef<DriverDeliveryMapRef, DriverDeliveryMapProps>(
  ({ delivery, userLocation, theme, onMapReady }, ref) => {
    const cameraRef = useRef<any>(null)

    useImperativeHandle(ref, () => ({
      fitToCoordinates: (coordinates: DriverMapCoordinate[], options?: unknown) => {
        fitCameraToCoordinates(cameraRef.current, coordinates, options)
      },
    }))

    if (isExpoGo || !MapLibreGL) {
      return <MapFallback style={styles.map} />
    }

    const routeShape = delivery
      ? {
          type: 'Feature' as const,
          properties: {},
          geometry: {
            type: 'LineString' as const,
            coordinates: [
              [delivery.pickup_longitude, delivery.pickup_latitude],
              [delivery.delivery_longitude, delivery.delivery_latitude],
            ],
          },
        }
      : null

    return (
      <MapLibreGL.MapView
        style={styles.map}
        mapStyle={OSM_RASTER_STYLE}
        logoEnabled={false}
        attributionEnabled={true}
        onDidFinishLoadingMap={onMapReady}
      >
        <MapLibreGL.Camera
          ref={cameraRef}
          defaultSettings={{
            centerCoordinate: [
              userLocation?.longitude || 1.2314,
              userLocation?.latitude || 6.1725,
            ],
            zoomLevel: 13,
          }}
        />

        <MapLibreGL.UserLocation visible={true} />

        {routeShape ? (
          <MapLibreGL.ShapeSource id="driver-route" shape={routeShape}>
            <MapLibreGL.LineLayer
              id="driver-route-line"
              style={{
                lineColor: theme.colors.primary[500],
                lineWidth: 3,
                lineCap: 'round',
                lineJoin: 'round',
                lineDasharray: [2, 1.5],
              }}
            />
          </MapLibreGL.ShapeSource>
        ) : null}

        {delivery ? (
          <MapLibreGL.MarkerView
            coordinate={[delivery.pickup_longitude, delivery.pickup_latitude]}
            anchor={{ x: 0.5, y: 1 }}
          >
            <View style={styles.pinMarker}>
              <Ionicons name="storefront" size={30} color={theme.colors.primary[500]} />
            </View>
          </MapLibreGL.MarkerView>
        ) : null}

        {delivery ? (
          <MapLibreGL.MarkerView
            coordinate={[delivery.delivery_longitude, delivery.delivery_latitude]}
            anchor={{ x: 0.5, y: 1 }}
          >
            <View style={styles.pinMarker}>
              <Ionicons name="location" size={36} color={theme.colors.success} />
            </View>
          </MapLibreGL.MarkerView>
        ) : null}
      </MapLibreGL.MapView>
    )
  }
)

DriverDeliveryMap.displayName = 'DriverDeliveryMap'

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
  pinMarker: {
    alignItems: 'center',
    justifyContent: 'center',
  },
})

export default DriverDeliveryMap
