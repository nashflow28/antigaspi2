import React, { forwardRef, useImperativeHandle } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

export type MapCoordinate = {
  latitude: number
  longitude: number
}

export type DeliveryTrackingMapRef = {
  fitToCoordinates: (coordinates: MapCoordinate[], options?: unknown) => void
}

export interface DeliveryTrackingMapProps {
  trackingData: any
  routeCoordinates: MapCoordinate[]
  theme: any
  onMapReady: () => void
}

const DeliveryTrackingMap = forwardRef<DeliveryTrackingMapRef, DeliveryTrackingMapProps>(
  ({ trackingData, theme }, ref) => {
    useImperativeHandle(ref, () => ({
      fitToCoordinates: () => undefined,
    }))

    return (
      <View style={[styles.fallback, { backgroundColor: theme.colors.neutral[100] }]}>
        <Ionicons name="map-outline" size={56} color={theme.colors.primary[500]} />
        <Text style={[styles.title, { color: theme.colors.text }]}>Carte disponible sur mobile</Text>
        <Text style={[styles.address, { color: theme.colors.textSecondary }]} numberOfLines={2}>
          {trackingData.delivery.delivery_address}
        </Text>
      </View>
    )
  }
)

DeliveryTrackingMap.displayName = 'DeliveryTrackingMap'

const styles = StyleSheet.create({
  fallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 8,
  },
  address: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
})

export default DeliveryTrackingMap
