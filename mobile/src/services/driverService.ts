/**
 * Driver Service - Delivery driver operations
 *
 * Handles:
 * - Driver registration and profile
 * - Availability toggle (online/offline)
 * - Location updates
 * - Available deliveries
 * - Delivery workflow (accept, pickup, deliver, complete)
 * - Earnings and statistics
 */

import api from './api'
import {
  DeliveryDriver,
  Delivery,
  DeliveryZone,
  DriverStats,
  DriverEarningsResponse,
  DriverRegistrationPayload,
  DriverProfileUpdatePayload,
  DriverLocationPayload,
  DeliveryCompletionPayload,
  ApiResponse,
} from '../types'

// ============ PROFILE ============

/**
 * Get driver profile with stats
 */
export const getProfile = async (): Promise<ApiResponse<{ driver: DeliveryDriver; stats: any }>> => {
  const response = await api.get('/driver/profile')
  return response.data
}

/**
 * Register as delivery driver
 */
export const register = async (data: DriverRegistrationPayload): Promise<ApiResponse<DeliveryDriver>> => {
  const response = await api.post('/driver/register', data)
  return response.data
}

/**
 * Update driver profile
 */
export const updateProfile = async (data: DriverProfileUpdatePayload): Promise<ApiResponse<DeliveryDriver>> => {
  const response = await api.put('/driver/profile', data)
  return response.data
}

// ============ AVAILABILITY ============

/**
 * Toggle online/offline status
 */
export const toggleAvailability = async (): Promise<ApiResponse<{ is_available: boolean }>> => {
  const response = await api.post('/driver/toggle-availability')
  return response.data
}

/**
 * Update current location
 */
export const updateLocation = async (
  data: DriverLocationPayload
): Promise<ApiResponse<{ latitude: number; longitude: number; updated_at: string }>> => {
  const response = await api.post('/driver/location', data)
  return response.data
}

// ============ STATS & EARNINGS ============

/**
 * Get driver statistics
 */
export const getStats = async (): Promise<ApiResponse<DriverStats>> => {
  const response = await api.get('/driver/stats')
  return response.data
}

/**
 * Get earnings with breakdown
 */
export const getEarnings = async (
  period: string = 'month',
  page: number = 1,
  perPage: number = 20
): Promise<ApiResponse<DriverEarningsResponse>> => {
  const response = await api.get('/driver/earnings', {
    params: { period, page, per_page: perPage },
  })
  return response.data
}

// ============ DELIVERIES - QUERIES ============

/**
 * Get available deliveries nearby
 */
export const getAvailableDeliveries = async (): Promise<ApiResponse<Delivery[]>> => {
  const response = await api.get('/driver/deliveries/available')
  return response.data
}

/**
 * Get current active delivery
 */
export const getActiveDelivery = async (): Promise<ApiResponse<Delivery | null>> => {
  const response = await api.get('/driver/deliveries/active')
  return response.data
}

/**
 * Get delivery history
 */
export const getDeliveryHistory = async (
  page: number = 1,
  perPage: number = 15
): Promise<ApiResponse<{ data: Delivery[]; current_page: number; last_page: number; total: number }>> => {
  const response = await api.get('/driver/deliveries/history', {
    params: { page, per_page: perPage },
  })
  return response.data
}

// ============ DELIVERIES - ACTIONS ============

/**
 * Accept a delivery offer
 */
export const acceptDelivery = async (deliveryId: number): Promise<ApiResponse<Delivery>> => {
  const response = await api.post(`/driver/deliveries/${deliveryId}/accept`)
  return response.data
}

/**
 * Reject a delivery offer
 */
export const rejectDelivery = async (deliveryId: number, reason?: string): Promise<ApiResponse<void>> => {
  const response = await api.post(`/driver/deliveries/${deliveryId}/reject`, { reason })
  return response.data
}

/**
 * Start pickup (on the way to merchant)
 */
export const startPickup = async (deliveryId: number): Promise<ApiResponse<Delivery>> => {
  const response = await api.post(`/driver/deliveries/${deliveryId}/start-pickup`)
  return response.data
}

/**
 * Confirm pickup (got the package)
 */
export const confirmPickup = async (deliveryId: number): Promise<ApiResponse<Delivery>> => {
  const response = await api.post(`/driver/deliveries/${deliveryId}/confirm-pickup`)
  return response.data
}

/**
 * Start delivery (on the way to customer)
 */
export const startDelivery = async (deliveryId: number): Promise<ApiResponse<Delivery>> => {
  const response = await api.post(`/driver/deliveries/${deliveryId}/start-delivery`)
  return response.data
}

/**
 * Complete delivery
 */
export const completeDelivery = async (
  deliveryId: number,
  data: DeliveryCompletionPayload
): Promise<ApiResponse<Delivery>> => {
  const response = await api.post(`/driver/deliveries/${deliveryId}/complete`, data)
  return response.data
}

/**
 * Report delivery failure
 */
export const reportFailure = async (deliveryId: number, reason: string): Promise<ApiResponse<Delivery>> => {
  const response = await api.post(`/driver/deliveries/${deliveryId}/report-failure`, { reason })
  return response.data
}

/**
 * Update delivery location (for tracking)
 */
export const updateDeliveryLocation = async (
  deliveryId: number,
  data: DriverLocationPayload
): Promise<ApiResponse<void>> => {
  const response = await api.post(`/driver/deliveries/${deliveryId}/update-location`, data)
  return response.data
}

/**
 * Cancel delivery (before pickup only)
 */
export const cancelDelivery = async (deliveryId: number, reason: string): Promise<ApiResponse<void>> => {
  const response = await api.post(`/driver/deliveries/${deliveryId}/cancel`, { reason })
  return response.data
}

// ============ ZONES ============

/**
 * Get available delivery zones
 */
export const getZones = async (city?: string): Promise<ApiResponse<DeliveryZone[]>> => {
  const params = city ? { city } : {}
  const response = await api.get('/delivery-zones', { params })
  return response.data
}

// ============ EXPORT ============

export const driverService = {
  // Profile
  getProfile,
  register,
  updateProfile,

  // Availability
  toggleAvailability,
  updateLocation,

  // Stats & Earnings
  getStats,
  getEarnings,

  // Deliveries - Queries
  getAvailableDeliveries,
  getActiveDelivery,
  getDeliveryHistory,

  // Deliveries - Actions
  acceptDelivery,
  rejectDelivery,
  startPickup,
  confirmPickup,
  startDelivery,
  completeDelivery,
  reportFailure,
  updateDeliveryLocation,
  cancelDelivery,

  // Zones
  getZones,
}
