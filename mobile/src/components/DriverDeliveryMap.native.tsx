import React, { forwardRef, useImperativeHandle, useRef } from 'react'
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps'
import type { DriverDeliveryMapProps, DriverDeliveryMapRef, DriverMapCoordinate } from './DriverDeliveryMap'

const DriverDeliveryMap = forwardRef<DriverDeliveryMapRef, DriverDeliveryMapProps>(
  ({ delivery, userLocation, theme, onMapReady }, ref) => {
    const mapRef = useRef<MapView>(null)

    useImperativeHandle(ref, () => ({
      fitToCoordinates: (coordinates: DriverMapCoordinate[], options?: unknown) => {
        mapRef.current?.fitToCoordinates(coordinates, options as any)
      },
    }))

    return (
      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        provider={PROVIDER_GOOGLE}
        showsUserLocation
        showsMyLocationButton
        initialRegion={{
          latitude: userLocation?.latitude || 6.1725,
          longitude: userLocation?.longitude || 1.2314,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        onMapReady={onMapReady}
      >
        {delivery && (
          <Marker
            coordinate={{
              latitude: delivery.pickup_latitude,
              longitude: delivery.pickup_longitude,
            }}
            title="Récupération"
            description={delivery.pickup_address}
            pinColor={theme.colors.primary[500]}
          />
        )}

        {delivery && (
          <Marker
            coordinate={{
              latitude: delivery.delivery_latitude,
              longitude: delivery.delivery_longitude,
            }}
            title="Livraison"
            description={delivery.delivery_address}
            pinColor={theme.colors.success}
          />
        )}

        {delivery && (
          <Polyline
            coordinates={[
              { latitude: delivery.pickup_latitude, longitude: delivery.pickup_longitude },
              { latitude: delivery.delivery_latitude, longitude: delivery.delivery_longitude },
            ]}
            strokeColor={theme.colors.primary[500]}
            strokeWidth={3}
            lineDashPattern={[10, 5]}
          />
        )}
      </MapView>
    )
  }
)

DriverDeliveryMap.displayName = 'DriverDeliveryMap'

export default DriverDeliveryMap
