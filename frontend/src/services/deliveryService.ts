import { apiService } from '@/services/api'
import type {
  ApiResponse,
  Delivery,
  DeliveryTrackingResponse,
  DeliveryZone
} from '@/types'

interface DeliveryEstimateResult {
  delivery_fee: number
  driver_commission?: number
  platform_commission?: number
  estimated_time?: string | null
  distance_km?: number
  surge_multiplier?: number
  free_delivery?: boolean
  free_delivery_message?: string
}

class DeliveryService {
  private readonly baseUrl = '/deliveries'
  private readonly zonesUrl = '/delivery-zones'

  async getZones(): Promise<ApiResponse<DeliveryZone[]>> {
    return apiService.get<ApiResponse<DeliveryZone[]>>(this.zonesUrl)
  }

  async checkAvailability(payload: { delivery_latitude: number; delivery_longitude: number }): Promise<ApiResponse<{ available: boolean }>> {
    return apiService.post<ApiResponse<{ available: boolean }>>(`${this.zonesUrl}/check-availability`, payload)
  }

  async estimate(reservationId: number, payload: { delivery_latitude: number; delivery_longitude: number }): Promise<ApiResponse<DeliveryEstimateResult>> {
    return apiService.post<ApiResponse<DeliveryEstimateResult>>(`${this.baseUrl}/estimate/${reservationId}`, payload)
  }

  async requestDelivery(
    reservationId: number,
    payload: {
      delivery_address: string
      delivery_latitude: number
      delivery_longitude: number
      delivery_notes?: string
      delivery_instructions?: string
      recipient_name?: string
      recipient_phone?: string
    }
  ): Promise<ApiResponse<Delivery>> {
    return apiService.post<ApiResponse<Delivery>>(`${this.baseUrl}/request/${reservationId}`, payload)
  }

  async getDelivery(deliveryId: number): Promise<ApiResponse<Delivery>> {
    return apiService.get<ApiResponse<Delivery>>(`${this.baseUrl}/${deliveryId}`)
  }

  async trackDelivery(deliveryId: number): Promise<ApiResponse<DeliveryTrackingResponse>> {
    return apiService.get<ApiResponse<DeliveryTrackingResponse>>(`${this.baseUrl}/${deliveryId}/track`)
  }

  async cancelDelivery(deliveryId: number, reason: string): Promise<ApiResponse<Delivery>> {
    return apiService.post<ApiResponse<Delivery>>(`${this.baseUrl}/${deliveryId}/cancel`, { reason })
  }

  async rateDelivery(deliveryId: number, rating: number, feedback?: string): Promise<ApiResponse<Delivery>> {
    return apiService.post<ApiResponse<Delivery>>(`${this.baseUrl}/${deliveryId}/rate`, { rating, feedback })
  }

  async getHistory(): Promise<ApiResponse<Delivery[]>> {
    return apiService.get<ApiResponse<Delivery[]>>(`${this.baseUrl}/history`)
  }
}

export const deliveryService = new DeliveryService()
export default deliveryService
