/**
 * Delivery Service - Consumer-side delivery operations
 *
 * Handles:
 * - Delivery zone information
 * - Delivery fee estimation
 * - Requesting delivery for reservations
 * - Tracking deliveries
 * - Rating completed deliveries
 */

import api from './api'
import {
  DeliveryZone,
  Delivery,
  DeliveryEstimate,
  DeliveryTrackingData,
  DeliveryRequestPayload,
  DeliveryRatingPayload,
  ApiResponse,
} from '../types'

// ============ ZONES ============

/**
 * Get all active delivery zones
 */
export const getZones = async (city?: string): Promise<ApiResponse<DeliveryZone[]>> => {
  const params = city ? { city } : {}
  const response = await api.get('/delivery-zones', { params })
  return response.data
}

/**
 * Get zone details
 */
export const getZone = async (zoneId: number): Promise<ApiResponse<DeliveryZone>> => {
  const response = await api.get(`/delivery-zones/${zoneId}`)
  return response.data
}

/**
 * Check if delivery is available at coordinates
 */
export const checkAvailability = async (
  latitude: number,
  longitude: number
): Promise<ApiResponse<{ available: boolean; zones: DeliveryZone[] }>> => {
  const response = await api.post('/delivery-zones/check-availability', {
    latitude,
    longitude,
  })
  return response.data
}

// ============ ESTIMATES ============

/**
 * Estimate delivery fee before requesting
 */
export const estimateFee = async (
  pickupLatitude: number,
  pickupLongitude: number,
  deliveryLatitude: number,
  deliveryLongitude: number,
  orderAmount?: number
): Promise<ApiResponse<DeliveryEstimate>> => {
  const response = await api.post('/delivery-zones/estimate', {
    pickup_latitude: pickupLatitude,
    pickup_longitude: pickupLongitude,
    delivery_latitude: deliveryLatitude,
    delivery_longitude: deliveryLongitude,
    order_amount: orderAmount,
  })
  return response.data
}

/**
 * Estimate delivery fee for a specific reservation
 * The backend will get pickup coordinates from the merchant
 */
export const estimateForReservation = async (
  reservationId: number,
  deliveryLatitude: number,
  deliveryLongitude: number
): Promise<ApiResponse<DeliveryEstimate>> => {
  const response = await api.post(`/deliveries/estimate/${reservationId}`, {
    delivery_latitude: deliveryLatitude,
    delivery_longitude: deliveryLongitude,
  })
  return response.data
}

// ============ DELIVERIES ============

/**
 * Request delivery for a reservation
 */
export const requestDelivery = async (
  reservationId: number,
  data: DeliveryRequestPayload
): Promise<ApiResponse<Delivery>> => {
  const response = await api.post(`/deliveries/request/${reservationId}`, data)
  return response.data
}

/**
 * Get delivery details
 */
export const getDelivery = async (deliveryId: number): Promise<ApiResponse<Delivery>> => {
  const response = await api.get(`/deliveries/${deliveryId}`)
  return response.data
}

/**
 * Track delivery in real-time
 */
export const trackDelivery = async (deliveryId: number): Promise<ApiResponse<DeliveryTrackingData>> => {
  const response = await api.get(`/deliveries/${deliveryId}/track`)
  return response.data
}

/**
 * Cancel delivery
 */
export const cancelDelivery = async (
  deliveryId: number,
  reason: string
): Promise<ApiResponse<Delivery>> => {
  const response = await api.post(`/deliveries/${deliveryId}/cancel`, { reason })
  return response.data
}

/**
 * Rate completed delivery
 */
export const rateDelivery = async (
  deliveryId: number,
  data: DeliveryRatingPayload
): Promise<ApiResponse<Delivery>> => {
  const response = await api.post(`/deliveries/${deliveryId}/rate`, data)
  return response.data
}

/**
 * Get delivery history
 */
export const getHistory = async (
  page: number = 1,
  perPage: number = 15
): Promise<ApiResponse<{ data: Delivery[]; current_page: number; last_page: number; total: number }>> => {
  const response = await api.get('/deliveries/history', {
    params: { page, per_page: perPage },
  })
  return response.data
}

// ============ EXPORT ============

export const deliveryService = {
  // Zones
  getZones,
  getZone,
  checkAvailability,

  // Estimates
  estimateFee,
  estimateForReservation,

  // Deliveries
  requestDelivery,
  getDelivery,
  trackDelivery,
  cancelDelivery,
  rateDelivery,
  getHistory,
}
