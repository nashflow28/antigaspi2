import { useState, useEffect, useCallback } from 'react'
import { locationService, UserLocation } from '../services/locationService'
import apiService from '../services/api'

export interface NearbyMerchant {
  id: number
  business_name: string
  business_type: string
  is_verified: boolean
  latitude: number | null
  longitude: number | null
  products_count: number
  average_rating: number | null
  reviews_count: number
  photo_url: string | null
  distance_km?: number
  user: {
    city: string | null
    address: string | null
    phone: string | null
    photo_url: string | null
  }
}

interface UseNearbyMerchantsOptions {
  radiusKm?: number
  autoFetch?: boolean
  sortBy?: 'distance' | 'rating' | 'products' | 'recent'
}

interface UseNearbyMerchantsReturn {
  merchants: NearbyMerchant[]
  loading: boolean
  error: string | null
  userLocation: UserLocation | null
  hasLocationPermission: boolean
  refresh: () => Promise<void>
  requestLocationPermission: () => Promise<boolean>
}

/**
 * Hook pour récupérer les commerçants proches de l'utilisateur
 * Utilise le service de géolocalisation et l'API backend
 */
export const useNearbyMerchants = (
  options: UseNearbyMerchantsOptions = {}
): UseNearbyMerchantsReturn => {
  const { radiusKm = 10, autoFetch = true, sortBy = 'distance' } = options

  const [merchants, setMerchants] = useState<NearbyMerchant[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null)
  const [hasLocationPermission, setHasLocationPermission] = useState(false)

  // Request location permission
  const requestLocationPermission = useCallback(async (): Promise<boolean> => {
    const granted = await locationService.requestLocationPermission()
    setHasLocationPermission(granted)
    return granted
  }, [])

  // Fetch nearby merchants
  const fetchNearbyMerchants = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // Check permission
      const hasPermission = await locationService.hasLocationPermission()
      setHasLocationPermission(hasPermission)

      if (!hasPermission) {
        setError('Permission de localisation non accordée')
        setLoading(false)
        return
      }

      // Get current position
      const position = await locationService.getCurrentPosition(true)
      if (!position) {
        setError('Impossible d\'obtenir votre position')
        setLoading(false)
        return
      }

      setUserLocation(position)

      // Fetch merchants with distance sorting
      const response = await apiService.getMerchants({
        latitude: position.latitude,
        longitude: position.longitude,
        radius: radiusKm,
        sort_by: sortBy,
        per_page: 50,
      })

      if (response.success && response.data) {
        // Add distance calculation for each merchant if not provided by API
        const merchantsWithDistance = response.data.map((merchant: NearbyMerchant) => {
          if (merchant.distance_km !== undefined) {
            return merchant
          }

          if (merchant.latitude && merchant.longitude) {
            const distanceResult = locationService.calculateDistanceFromUser(
              position,
              merchant.latitude,
              merchant.longitude
            )
            return {
              ...merchant,
              distance_km: distanceResult?.distance ?? undefined,
            }
          }

          return merchant
        })

        // Sort by distance if API didn't
        if (sortBy === 'distance') {
          merchantsWithDistance.sort((a: NearbyMerchant, b: NearbyMerchant) => {
            const distA = a.distance_km ?? Infinity
            const distB = b.distance_km ?? Infinity
            return distA - distB
          })
        }

        setMerchants(merchantsWithDistance)
      } else {
        setError(response.message || 'Erreur lors de la récupération des commerçants')
      }
    } catch (err: any) {
      setError(err.message || 'Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }, [radiusKm, sortBy])

  // Auto-fetch on mount if enabled
  useEffect(() => {
    if (autoFetch) {
      fetchNearbyMerchants()
    }
  }, [autoFetch, fetchNearbyMerchants])

  return {
    merchants,
    loading,
    error,
    userLocation,
    hasLocationPermission,
    refresh: fetchNearbyMerchants,
    requestLocationPermission,
  }
}

export default useNearbyMerchants
