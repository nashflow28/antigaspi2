import React, { forwardRef, useImperativeHandle, useRef } from 'react'
import { StyleSheet, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps'
import type { DeliveryTrackingMapProps, DeliveryTrackingMapRef, MapCoordinate } from './DeliveryTrackingMap'

const DeliveryTrackingMap = forwardRef<DeliveryTrackingMapRef, DeliveryTrackingMapProps>(
  ({ trackingData, routeCoordinates, theme, onMapReady }, ref) => {
    const mapRef = useRef<MapView>(null)

    useImperativeHandle(ref, () => ({
      fitToCoordinates: (coordinates: MapCoordinate[], options?: unknown) => {
        mapRef.current?.fitToCoordinates(coordinates, options as any)
      },
    }))

    return (
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          latitude: trackingData.delivery.delivery_latitude,
          longitude: trackingData.delivery.delivery_longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        onMapReady={onMapReady}
      >
        <Marker
          coordinate={{
            latitude: trackingData.delivery.delivery_latitude,
            longitude: trackingData.delivery.delivery_longitude,
          }}
          title="Votre adresse"
          description={trackingData.delivery.delivery_address}
          pinColor={theme.colors.success}
        />

        {trackingData.delivery.pickup_latitude && trackingData.delivery.pickup_longitude && (
          <Marker
            coordinate={{
              latitude: trackingData.delivery.pickup_latitude,
              longitude: trackingData.delivery.pickup_longitude,
            }}
            title="Commerce"
            description={trackingData.delivery.pickup_address}
            pinColor={theme.colors.primary[500]}
          />
        )}

        {trackingData.driver_position && (
          <Marker
            coordinate={{
              latitude: trackingData.driver_position.latitude,
              longitude: trackingData.driver_position.longitude,
            }}
            title="Livreur"
          >
            <View style={styles.driverMarker}>
              <Ionicons name="bicycle" size={24} color={theme.colors.primary[500]} />
            </View>
          </Marker>
        )}

        {routeCoordinates.length >= 2 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor={theme.colors.primary[500]}
            strokeWidth={4}
            lineDashPattern={trackingData.route_polyline ? undefined : [10, 5]}
          />
        )}
      </MapView>
    )
  }
)

DeliveryTrackingMap.displayName = 'DeliveryTrackingMap'

const styles = StyleSheet.create({
  map: {
    flex: 1,
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
