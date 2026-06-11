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
import type { DeliveryTrackingMapProps, DeliveryTrackingMapRef, MapCoordinate } from './DeliveryTrackingMap'

const MapLibreGL = getMapLibreGL()

const DeliveryTrackingMap = forwardRef<DeliveryTrackingMapRef, DeliveryTrackingMapProps>(
  ({ trackingData, routeCoordinates, theme, onMapReady }, ref) => {
    const cameraRef = useRef<any>(null)

    useImperativeHandle(ref, () => ({
      fitToCoordinates: (coordinates: MapCoordinate[], options?: unknown) => {
        fitCameraToCoordinates(cameraRef.current, coordinates, options)
      },
    }))

    if (isExpoGo || !MapLibreGL) {
      return <MapFallback style={styles.map} />
    }

    const routeShape = routeCoordinates.length >= 2
      ? {
          type: 'Feature' as const,
          properties: {},
          geometry: {
            type: 'LineString' as const,
            coordinates: routeCoordinates.map(c => [c.longitude, c.latitude]),
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
              trackingData.delivery.delivery_longitude,
              trackingData.delivery.delivery_latitude,
            ],
            zoomLevel: 13,
          }}
        />

        {routeShape ? (
          <MapLibreGL.ShapeSource id="delivery-route" shape={routeShape}>
            <MapLibreGL.LineLayer
              id="delivery-route-line"
              style={{
                lineColor: theme.colors.primary[500],
                lineWidth: 4,
                lineCap: 'round',
                lineJoin: 'round',
                ...(trackingData.route_polyline ? {} : { lineDasharray: [2, 1.5] }),
              }}
            />
          </MapLibreGL.ShapeSource>
        ) : null}

        <MapLibreGL.MarkerView
          coordinate={[
            trackingData.delivery.delivery_longitude,
            trackingData.delivery.delivery_latitude,
          ]}
          anchor={{ x: 0.5, y: 1 }}
        >
          <View style={styles.pinMarker}>
            <Ionicons name="location" size={36} color={theme.colors.success} />
          </View>
        </MapLibreGL.MarkerView>

        {trackingData.delivery.pickup_latitude && trackingData.delivery.pickup_longitude ? (
          <MapLibreGL.MarkerView
            coordinate={[
              trackingData.delivery.pickup_longitude,
              trackingData.delivery.pickup_latitude,
            ]}
            anchor={{ x: 0.5, y: 1 }}
          >
            <View style={styles.pinMarker}>
              <Ionicons name="storefront" size={30} color={theme.colors.primary[500]} />
            </View>
          </MapLibreGL.MarkerView>
        ) : null}

        {trackingData.driver_position ? (
          <MapLibreGL.MarkerView
            coordinate={[
              trackingData.driver_position.longitude,
              trackingData.driver_position.latitude,
            ]}
          >
            <View style={styles.driverMarker}>
              <Ionicons name="bicycle" size={24} color={theme.colors.primary[500]} />
            </View>
          </MapLibreGL.MarkerView>
        ) : null}
      </MapLibreGL.MapView>
    )
  }
)

DeliveryTrackingMap.displayName = 'DeliveryTrackingMap'

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
  pinMarker: {
    alignItems: 'center',
    justifyContent: 'center',
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
})

export default DeliveryTrackingMap
