import { ref, readonly } from 'vue'

export interface GeolocationCoords {
  latitude: number
  longitude: number
  accuracy?: number
  timestamp?: number
}

export interface GeolocationError {
  code: number
  message: string
  type: 'PERMISSION_DENIED' | 'POSITION_UNAVAILABLE' | 'TIMEOUT' | 'UNSUPPORTED'
}

export interface GeolocationOptions {
  enableHighAccuracy?: boolean
  timeout?: number
  maximumAge?: number
}

export const useGeolocation = () => {
  const position = ref<GeolocationCoords | null>(null)
  const error = ref<GeolocationError | null>(null)
  const isLoading = ref(false)
  const isSupported = 'geolocation' in navigator

  // Default options
  const defaultOptions: GeolocationOptions = {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 300000 // 5 minutes
  }

  /**
   * Get current position
   */
  const getCurrentPosition = async (options: GeolocationOptions = {}): Promise<GeolocationCoords | null> => {
    if (!isSupported) {
      const err: GeolocationError = {
        code: 0,
        message: 'Géolocalisation non supportée par ce navigateur',
        type: 'UNSUPPORTED'
      }
      error.value = err
      throw err
    }

    isLoading.value = true
    error.value = null

    const finalOptions = { ...defaultOptions, ...options }

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords: GeolocationCoords = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            timestamp: pos.timestamp
          }

          position.value = coords
          isLoading.value = false
          resolve(coords)
        },
        (err) => {
          isLoading.value = false

          let errorType: GeolocationError['type']
          let message: string

          switch (err.code) {
            case err.PERMISSION_DENIED:
              errorType = 'PERMISSION_DENIED'
              message = 'Autorisation de géolocalisation refusée'
              break
            case err.POSITION_UNAVAILABLE:
              errorType = 'POSITION_UNAVAILABLE'
              message = 'Position non disponible'
              break
            case err.TIMEOUT:
              errorType = 'TIMEOUT'
              message = 'Délai de géolocalisation dépassé'
              break
            default:
              errorType = 'POSITION_UNAVAILABLE'
              message = 'Erreur de géolocalisation inconnue'
              break
          }

          const geolocationError: GeolocationError = {
            code: err.code,
            message,
            type: errorType
          }

          error.value = geolocationError
          reject(geolocationError)
        },
        finalOptions
      )
    })
  }

  /**
   * Watch position changes
   */
  const watchPosition = (options: GeolocationOptions = {}) => {
    if (!isSupported) {
      console.warn('Géolocalisation non supportée')
      return null
    }

    const finalOptions = { ...defaultOptions, ...options }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        position.value = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          timestamp: pos.timestamp
        }
        error.value = null
      },
      (err) => {
        let errorType: GeolocationError['type']
        let message: string

        switch (err.code) {
          case err.PERMISSION_DENIED:
            errorType = 'PERMISSION_DENIED'
            message = 'Autorisation de géolocalisation refusée'
            break
          case err.POSITION_UNAVAILABLE:
            errorType = 'POSITION_UNAVAILABLE'
            message = 'Position non disponible'
            break
          case err.TIMEOUT:
            errorType = 'TIMEOUT'
            message = 'Délai de géolocalisation dépassé'
            break
          default:
            errorType = 'POSITION_UNAVAILABLE'
            message = 'Erreur de géolocalisation inconnue'
            break
        }

        error.value = {
          code: err.code,
          message,
          type: errorType
        }
      },
      finalOptions
    )

    return watchId
  }

  /**
   * Stop watching position
   */
  const clearWatch = (watchId: number) => {
    if (isSupported) {
      navigator.geolocation.clearWatch(watchId)
    }
  }

  /**
   * Calculate distance between two points (Haversine formula)
   */
  const calculateDistance = (
    pos1: GeolocationCoords,
    pos2: GeolocationCoords
  ): number => {
    const R = 6371 // Earth's radius in kilometers
    const dLat = toRadians(pos2.latitude - pos1.latitude)
    const dLon = toRadians(pos2.longitude - pos1.longitude)

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRadians(pos1.latitude)) *
      Math.cos(toRadians(pos2.latitude)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2)

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return R * c
  }

  /**
   * Convert degrees to radians
   */
  const toRadians = (degrees: number): number => {
    return degrees * (Math.PI / 180)
  }

  /**
   * Check if coordinates are within a certain radius
   */
  const isWithinRadius = (
    center: GeolocationCoords,
    point: GeolocationCoords,
    radiusKm: number
  ): boolean => {
    const distance = calculateDistance(center, point)
    return distance <= radiusKm
  }

  /**
   * Get human-readable distance string
   */
  const formatDistance = (distanceKm: number): string => {
    if (distanceKm < 1) {
      return `${Math.round(distanceKm * 1000)} m`
    } else if (distanceKm < 10) {
      return `${distanceKm.toFixed(1)} km`
    } else {
      return `${Math.round(distanceKm)} km`
    }
  }

  /**
   * Get location name from coordinates (reverse geocoding)
   * Note: This would require an external service like Google Maps or OpenStreetMap
   */
  const getLocationName = async (coords: GeolocationCoords): Promise<string | null> => {
    try {
      // Using OpenStreetMap Nominatim service (free)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${coords.latitude}&lon=${coords.longitude}&format=json&accept-language=fr`
      )

      if (!response.ok) throw new Error('Reverse geocoding failed')

      const data = await response.json()

      if (data.display_name) {
        return data.display_name
      }

      return null
    } catch (err) {
      console.warn('Reverse geocoding failed:', err)
      return null
    }
  }

  /**
   * Reset state
   */
  const reset = () => {
    position.value = null
    error.value = null
    isLoading.value = false
  }

  return {
    // State (readonly)
    position: readonly(position),
    error: readonly(error),
    isLoading: readonly(isLoading),
    isSupported,

    // Methods
    getCurrentPosition,
    watchPosition,
    clearWatch,
    calculateDistance,
    isWithinRadius,
    formatDistance,
    getLocationName,
    reset
  }
}

export default useGeolocation