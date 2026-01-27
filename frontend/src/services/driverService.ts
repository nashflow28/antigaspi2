import { apiService } from '@/services/api'
import type {
  ApiResponse,
  Delivery,
  DeliveryDriverProfile,
  DriverStats,
  DriverEarning
} from '@/types'

interface DriverProfileResponse {
  driver: DeliveryDriverProfile
  stats: DriverStats
}

interface DriverEarningsPayload {
  earnings: {
    data: DriverEarning[]
    current_page?: number
    last_page?: number
    per_page?: number
    total?: number
  }
  summary: Record<string, number>
}

interface DriverRegisterPayload {
  vehicle_type: 'moto' | 'velo' | 'voiture' | 'pied'
  vehicle_plate?: string
  license_number?: string
  delivery_zone_id?: number
  id_card_url?: string
  license_url?: string
  photo_url?: string
}

interface DriverUpdatePayload {
  vehicle_type?: 'moto' | 'velo' | 'voiture' | 'pied'
  vehicle_plate?: string
  license_number?: string
  delivery_zone_id?: number
  photo_url?: string
}

class DriverService {
  private readonly baseUrl = '/driver'
  private readonly deliveriesUrl = '/driver/deliveries'

  async getProfile(): Promise<ApiResponse<DriverProfileResponse>> {
    return apiService.get<ApiResponse<DriverProfileResponse>>(`${this.baseUrl}/profile`)
  }

  async register(payload: DriverRegisterPayload): Promise<ApiResponse<DeliveryDriverProfile>> {
    return apiService.post<ApiResponse<DeliveryDriverProfile>>(`${this.baseUrl}/register`, payload)
  }

  async updateProfile(payload: DriverUpdatePayload): Promise<ApiResponse<DeliveryDriverProfile>> {
    return apiService.put<ApiResponse<DeliveryDriverProfile>>(`${this.baseUrl}/profile`, payload)
  }

  async toggleAvailability(): Promise<ApiResponse<{ is_available: boolean }>> {
    return apiService.post<ApiResponse<{ is_available: boolean }>>(`${this.baseUrl}/toggle-availability`, {})
  }

  async updateLocation(payload: { latitude: number; longitude: number }): Promise<ApiResponse<{ latitude: number; longitude: number; updated_at: string }>> {
    return apiService.post<ApiResponse<{ latitude: number; longitude: number; updated_at: string }>>(`${this.baseUrl}/location`, payload)
  }

  async getStats(): Promise<ApiResponse<{ stats: DriverStats }>> {
    return apiService.get<ApiResponse<{ stats: DriverStats }>>(`${this.baseUrl}/stats`)
  }

  async getEarnings(params?: { period?: string; per_page?: number }): Promise<ApiResponse<DriverEarningsPayload>> {
    const query = new URLSearchParams()
    if (params?.period) query.append('period', params.period)
    if (params?.per_page) query.append('per_page', String(params.per_page))
    const suffix = query.toString() ? `?${query.toString()}` : ''
    return apiService.get<ApiResponse<DriverEarningsPayload>>(`${this.baseUrl}/earnings${suffix}`)
  }

  async getAvailableDeliveries(): Promise<ApiResponse<Delivery[]>> {
    return apiService.get<ApiResponse<Delivery[]>>(`${this.deliveriesUrl}/available`)
  }

  async getActiveDelivery(): Promise<ApiResponse<Delivery | null>> {
    return apiService.get<ApiResponse<Delivery | null>>(`${this.deliveriesUrl}/active`)
  }

  async getDeliveryHistory(): Promise<ApiResponse<Delivery[]>> {
    return apiService.get<ApiResponse<Delivery[]>>(`${this.deliveriesUrl}/history`)
  }

  async getDeliveryById(deliveryId: number): Promise<ApiResponse<Delivery>> {
    return apiService.get<ApiResponse<Delivery>>(`${this.deliveriesUrl}/${deliveryId}`)
  }

  async acceptDelivery(deliveryId: number): Promise<ApiResponse<Delivery>> {
    return apiService.post<ApiResponse<Delivery>>(`${this.deliveriesUrl}/${deliveryId}/accept`, {})
  }

  async rejectDelivery(deliveryId: number, reason?: string): Promise<ApiResponse<Delivery>> {
    return apiService.post<ApiResponse<Delivery>>(`${this.deliveriesUrl}/${deliveryId}/reject`, { reason })
  }

  async startPickup(deliveryId: number): Promise<ApiResponse<Delivery>> {
    return apiService.post<ApiResponse<Delivery>>(`${this.deliveriesUrl}/${deliveryId}/start-pickup`, {})
  }

  async confirmPickup(deliveryId: number): Promise<ApiResponse<Delivery>> {
    return apiService.post<ApiResponse<Delivery>>(`${this.deliveriesUrl}/${deliveryId}/confirm-pickup`, {})
  }

  async startDelivery(deliveryId: number): Promise<ApiResponse<Delivery>> {
    return apiService.post<ApiResponse<Delivery>>(`${this.deliveriesUrl}/${deliveryId}/start-delivery`, {})
  }

  async completeDelivery(deliveryId: number, payload?: { notes?: string; photo_url?: string; signature_url?: string }): Promise<ApiResponse<Delivery>> {
    return apiService.post<ApiResponse<Delivery>>(`${this.deliveriesUrl}/${deliveryId}/complete`, payload || {})
  }

  async reportFailure(deliveryId: number, reason: string): Promise<ApiResponse<Delivery>> {
    return apiService.post<ApiResponse<Delivery>>(`${this.deliveriesUrl}/${deliveryId}/report-failure`, { reason })
  }

  async cancelDelivery(deliveryId: number, reason: string): Promise<ApiResponse<Delivery>> {
    return apiService.post<ApiResponse<Delivery>>(`${this.deliveriesUrl}/${deliveryId}/cancel`, { reason })
  }

  async updateDeliveryLocation(deliveryId: number, payload: { latitude: number; longitude: number }): Promise<ApiResponse<Delivery>> {
    return apiService.post<ApiResponse<Delivery>>(`${this.deliveriesUrl}/${deliveryId}/update-location`, payload)
  }
}

export const driverService = new DriverService()
export default driverService
