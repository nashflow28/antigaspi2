import * as Location from 'expo-location'
import { Platform } from 'react-native'

/**
 * Types pour le service de géolocalisation
 */
export interface UserLocation {
  latitude: number
  longitude: number
  accuracy?: number | null
  timestamp: number
}

export interface DistanceResult {
  distance: number // Distance en kilomètres
  formatted: string // Distance formatée (ex: "2.3 km")
}

/**
 * Service de géolocalisation utilisant expo-location
 * Gère les permissions, la localisation actuelle et le calcul de distance
 */
class LocationService {
  private watchSubscription: Location.LocationSubscription | null = null

  /**
   * Demande les permissions de localisation à l'utilisateur
   * @returns {Promise<boolean>} true si permission accordée, false sinon
   */
  async requestLocationPermission(): Promise<boolean> {
    try {
      const { status: existingStatus } = await Location.getForegroundPermissionsAsync()

      if (existingStatus === 'granted') {
        return true
      }

      const { status } = await Location.requestForegroundPermissionsAsync()

      if (status !== 'granted') {
        console.warn('Permission de localisation refusée par l\'utilisateur')
        return false
      }

      return true
    } catch (error) {
      console.error('Erreur lors de la demande de permission de localisation:', error)
      return false
    }
  }

  /**
   * Vérifie si les permissions de localisation sont accordées
   * @returns {Promise<boolean>} true si permission accordée
   */
  async hasLocationPermission(): Promise<boolean> {
    try {
      const { status } = await Location.getForegroundPermissionsAsync()
      return status === 'granted'
    } catch (error) {
      console.error('Erreur lors de la vérification des permissions:', error)
      return false
    }
  }

  /**
   * Récupère la position actuelle de l'utilisateur
   * @returns {Promise<UserLocation | null>} Position actuelle ou null en cas d'erreur
   */
  async getCurrentPosition(): Promise<UserLocation | null> {
    try {
      const hasPermission = await this.hasLocationPermission()

      if (!hasPermission) {
        console.warn('Permission de localisation non accordée')
        return null
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      })

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        timestamp: location.timestamp,
      }
    } catch (error) {
      console.error('Erreur lors de la récupération de la position:', error)
      return null
    }
  }

  /**
   * Démarre la surveillance de la position en temps réel
   * @param callback Fonction appelée à chaque changement de position
   * @returns {Promise<boolean>} true si surveillance démarrée avec succès
   */
  async startWatchingPosition(
    callback: (location: UserLocation) => void
  ): Promise<boolean> {
    try {
      const hasPermission = await this.hasLocationPermission()

      if (!hasPermission) {
        console.warn('Permission de localisation non accordée')
        return false
      }

      // Arrêter la surveillance précédente si elle existe
      if (this.watchSubscription) {
        this.stopWatchingPosition()
      }

      this.watchSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 10000, // Mise à jour toutes les 10 secondes
          distanceInterval: 100, // Ou tous les 100 mètres
        },
        (location) => {
          callback({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy,
            timestamp: location.timestamp,
          })
        }
      )

      return true
    } catch (error) {
      console.error('Erreur lors du démarrage de la surveillance:', error)
      return false
    }
  }

  /**
   * Arrête la surveillance de la position
   */
  stopWatchingPosition(): void {
    if (this.watchSubscription) {
      this.watchSubscription.remove()
      this.watchSubscription = null
    }
  }

  /**
   * Calcule la distance entre deux points GPS en utilisant la formule de Haversine
   * @param lat1 Latitude du point 1
   * @param lon1 Longitude du point 1
   * @param lat2 Latitude du point 2
   * @param lon2 Longitude du point 2
   * @returns {DistanceResult} Distance en kilomètres et formatée
   */
  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): DistanceResult {
    const R = 6371 // Rayon de la Terre en kilomètres

    const dLat = this.toRadians(lat2 - lat1)
    const dLon = this.toRadians(lon2 - lon1)

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2)

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    const distance = R * c // Distance en kilomètres

    return {
      distance,
      formatted: this.formatDistance(distance),
    }
  }

  /**
   * Convertit des degrés en radians
   * @param degrees Angle en degrés
   * @returns Angle en radians
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180)
  }

  /**
   * Formate une distance pour l'affichage
   * @param distanceKm Distance en kilomètres
   * @returns Distance formatée (ex: "2.3 km" ou "850 m")
   */
  private formatDistance(distanceKm: number): string {
    if (distanceKm < 1) {
      const meters = Math.round(distanceKm * 1000)
      return `${meters} m`
    }

    return `${distanceKm.toFixed(1)} km`
  }

  /**
   * Vérifie si les services de localisation sont activés sur l'appareil
   * @returns {Promise<boolean>} true si les services sont activés
   */
  async isLocationEnabled(): Promise<boolean> {
    try {
      return await Location.hasServicesEnabledAsync()
    } catch (error) {
      console.error('Erreur lors de la vérification des services de localisation:', error)
      return false
    }
  }

  /**
   * Calcule la distance entre la position de l'utilisateur et un point
   * @param userLocation Position de l'utilisateur
   * @param targetLat Latitude du point cible
   * @param targetLon Longitude du point cible
   * @returns {DistanceResult | null} Distance calculée ou null si position utilisateur manquante
   */
  calculateDistanceFromUser(
    userLocation: UserLocation | null,
    targetLat: number | null,
    targetLon: number | null
  ): DistanceResult | null {
    if (!userLocation || targetLat === null || targetLon === null) {
      return null
    }

    return this.calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      targetLat,
      targetLon
    )
  }
}

// Export singleton
export const locationService = new LocationService()
export default locationService
