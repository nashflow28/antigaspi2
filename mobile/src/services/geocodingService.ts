/**
 * Service de géocodage
 * Convertit les adresses en coordonnées et vice versa
 */
import apiService from './api'

export interface GeocodingResult {
  lat: number
  lng: number
  display_name: string
  address_details?: Record<string, string>
}

export interface ReverseGeocodingResult {
  display_name: string
  address: Record<string, string>
  street: string | null
  city: string | null
  country: string | null
  country_code: string | null
}

export interface AddressSuggestion {
  display_name: string
  lat: number
  lng: number
  address: Record<string, string>
  type: string
}

class GeocodingService {
  /**
   * Rechercher des suggestions d'adresses
   * @param query Le texte de recherche
   * @param country Code pays (défaut: TG pour Togo)
   * @param limit Nombre max de résultats
   */
  async searchAddresses(
    query: string,
    country: string = 'TG',
    limit: number = 5
  ): Promise<AddressSuggestion[]> {
    if (query.length < 3) {
      return []
    }

    try {
      const response = await apiService.get<{
        success: boolean
        data: AddressSuggestion[]
      }>(`/geocoding/search?query=${encodeURIComponent(query)}&country=${country}&limit=${limit}`)

      if (response.success && response.data) {
        return response.data
      }
    } catch (error) {
      console.error('Error searching addresses:', error)
    }

    return []
  }

  /**
   * Convertir une adresse en coordonnées
   * @param address L'adresse à géocoder
   * @param city Ville optionnelle pour plus de précision
   * @param country Code pays
   */
  async geocode(
    address: string,
    city?: string,
    country: string = 'TG'
  ): Promise<GeocodingResult | null> {
    try {
      const response = await apiService.post<{
        success: boolean
        data: GeocodingResult
        message?: string
      }>('/geocoding/geocode', {
        address,
        city,
        country,
      })

      if (response.success && response.data) {
        return response.data
      }
    } catch (error) {
      console.error('Error geocoding address:', error)
    }

    return null
  }

  /**
   * Convertir des coordonnées en adresse
   * @param latitude Latitude
   * @param longitude Longitude
   */
  async reverseGeocode(
    latitude: number,
    longitude: number
  ): Promise<ReverseGeocodingResult | null> {
    try {
      const response = await apiService.post<{
        success: boolean
        data: ReverseGeocodingResult
        message?: string
      }>('/geocoding/reverse', {
        latitude,
        longitude,
      })

      if (response.success && response.data) {
        return response.data
      }
    } catch (error) {
      console.error('Error reverse geocoding:', error)
    }

    return null
  }

  /**
   * Formater une adresse pour affichage
   */
  formatAddress(result: ReverseGeocodingResult): string {
    const parts = []

    if (result.street) {
      parts.push(result.street)
    }

    if (result.city) {
      parts.push(result.city)
    }

    if (result.country && result.country !== result.city) {
      parts.push(result.country)
    }

    return parts.length > 0 ? parts.join(', ') : result.display_name
  }
}

export const geocodingService = new GeocodingService()
export default geocodingService
