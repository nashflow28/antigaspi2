import { useCallback, useMemo, useState } from 'react'
import * as ExpoLocation from 'expo-location'
import apiService from '../services/api'
import {
  formatCoordinate,
  isLatitudeValid,
  isLongitudeValid,
  parseCoordinateFromApi,
  parseCoordinateInput,
} from '../utils/location'

export type LocationStatusVariant = 'muted' | 'info' | 'success' | 'error'

interface LocationStatus {
  message: string
  variant: LocationStatusVariant
}

interface UseMerchantLocationResult {
  latitude: string
  longitude: string
  setLatitude: (value: string) => void
  setLongitude: (value: string) => void
  locationLoading: boolean
  hasLocation: boolean
  status: LocationStatus
  loadMerchantLocation: () => Promise<void>
  requestCurrentLocation: () => Promise<void>
  saveLocationIfNeeded: () => Promise<boolean>
}

export const useMerchantLocation = (): UseMerchantLocationResult => {
  const [latitude, setLatitude] = useState('')
  const [longitude, setLongitude] = useState('')
  const [initialLatitude, setInitialLatitude] = useState<number | null>(null)
  const [initialLongitude, setInitialLongitude] = useState<number | null>(null)
  const [hasLocation, setHasLocation] = useState(false)
  const [locationLoading, setLocationLoading] = useState(false)

  const loadMerchantLocation = useCallback(async () => {
    setLocationLoading(true)
    try {
      const response = await apiService.getMerchantLocation()

      if (response.data?.success) {
        const data = response.data.data
        const latValue = parseCoordinateFromApi(data?.latitude)
        const lngValue = parseCoordinateFromApi(data?.longitude)

        setInitialLatitude(latValue)
        setInitialLongitude(lngValue)
        setLatitude(formatCoordinate(latValue))
        setLongitude(formatCoordinate(lngValue))
        setHasLocation(Boolean(data?.has_location || (latValue !== null && lngValue !== null)))
      }
    } finally {
      setLocationLoading(false)
    }
  }, [])

  const requestCurrentLocation = useCallback(async () => {
    setLocationLoading(true)
    try {
      const { status } = await ExpoLocation.requestForegroundPermissionsAsync()

      if (status !== 'granted') {
        throw new Error('Permission de géolocalisation refusée')
      }

      const position = await ExpoLocation.getCurrentPositionAsync({
        accuracy: ExpoLocation.Accuracy.Balanced,
      })

      const newLatitude = Number(position.coords.latitude)
      const newLongitude = Number(position.coords.longitude)

      setLatitude(formatCoordinate(newLatitude))
      setLongitude(formatCoordinate(newLongitude))
    } finally {
      setLocationLoading(false)
    }
  }, [])

  const hasDraftCoordinates = useMemo(() => {
    return latitude.trim().length > 0 && longitude.trim().length > 0
  }, [latitude, longitude])

  const hasPartialCoordinates = useMemo(() => {
    const hasLat = latitude.trim().length > 0
    const hasLng = longitude.trim().length > 0
    return hasLat !== hasLng
  }, [latitude, longitude])

  const draftCoordinatesAreValid = useMemo(() => {
    if (!hasDraftCoordinates) {
      return false
    }

    const parsedLat = parseCoordinateInput(latitude)
    const parsedLng = parseCoordinateInput(longitude)

    if (parsedLat === null || parsedLng === null) {
      return false
    }

    return isLatitudeValid(parsedLat) && isLongitudeValid(parsedLng)
  }, [hasDraftCoordinates, latitude, longitude])

  const coordinatesChangedFromInitial = useMemo(() => {
    if (!hasDraftCoordinates) {
      return false
    }

    const parsedLat = parseCoordinateInput(latitude)
    const parsedLng = parseCoordinateInput(longitude)

    if (parsedLat === null || parsedLng === null) {
      return false
    }

    if (initialLatitude === null || initialLongitude === null) {
      return true
    }

    return (
      Math.abs(parsedLat - initialLatitude) > 0.000001 ||
      Math.abs(parsedLng - initialLongitude) > 0.000001
    )
  }, [hasDraftCoordinates, initialLatitude, initialLongitude, latitude, longitude])

  const status = useMemo<LocationStatus>(() => {
    if (locationLoading) {
      return {
        variant: 'info',
        message: 'Chargement de la localisation en cours…',
      }
    }

    if (hasPartialCoordinates) {
      return {
        variant: 'error',
        message: 'Renseignez la latitude et la longitude pour enregistrer la localisation.',
      }
    }

    if (hasDraftCoordinates && !draftCoordinatesAreValid) {
      return {
        variant: 'error',
        message: 'Veuillez saisir une latitude et une longitude valides.',
      }
    }

    if (hasDraftCoordinates && draftCoordinatesAreValid && coordinatesChangedFromInitial) {
      return {
        variant: 'info',
        message: 'Coordonnées prêtes à être enregistrées. Appuyez sur « Enregistrer » pour les sauvegarder.',
      }
    }

    if (hasDraftCoordinates && draftCoordinatesAreValid && !coordinatesChangedFromInitial) {
      return {
        variant: 'info',
        message: hasLocation
          ? 'Ces coordonnées correspondent déjà à la position enregistrée.'
          : 'Ces coordonnées sont prêtes à être enregistrées.',
      }
    }

    if (hasLocation) {
      return {
        variant: 'success',
        message: 'Coordonnées enregistrées. Appuyez sur « Enregistrer » après modification pour les mettre à jour.',
      }
    }

    return {
      variant: 'muted',
      message: 'Aucune localisation enregistrée pour le moment.',
    }
  }, [
    coordinatesChangedFromInitial,
    draftCoordinatesAreValid,
    hasDraftCoordinates,
    hasLocation,
    hasPartialCoordinates,
    locationLoading,
  ])

  const saveLocationIfNeeded = useCallback(async () => {
    const trimmedLatitude = latitude.trim()
    const trimmedLongitude = longitude.trim()
    const hasInput = trimmedLatitude.length > 0 || trimmedLongitude.length > 0

    if (!hasInput) {
      if (initialLatitude !== null || initialLongitude !== null) {
        setLatitude(formatCoordinate(initialLatitude))
        setLongitude(formatCoordinate(initialLongitude))
      }
      return false
    }

    const parsedLatitude = parseCoordinateInput(latitude)
    const parsedLongitude = parseCoordinateInput(longitude)

    if (parsedLatitude === null) {
      throw new Error('Latitude invalide. Utilisez un nombre entre -90 et 90.')
    }

    if (!isLatitudeValid(parsedLatitude)) {
      throw new Error('La latitude doit être comprise entre -90 et 90.')
    }

    if (parsedLongitude === null) {
      throw new Error('Longitude invalide. Utilisez un nombre entre -180 et 180.')
    }

    if (!isLongitudeValid(parsedLongitude)) {
      throw new Error('La longitude doit être comprise entre -180 et 180.')
    }

    const hasChanged =
      initialLatitude === null ||
      initialLongitude === null ||
      Math.abs(parsedLatitude - initialLatitude) > 0.000001 ||
      Math.abs(parsedLongitude - initialLongitude) > 0.000001

    if (!hasChanged) {
      return false
    }

    const response = await apiService.updateMerchantLocation({
      latitude: parsedLatitude,
      longitude: parsedLongitude,
    })

    if (!response.data?.success) {
      throw new Error(response.data?.message || 'Impossible de mettre à jour la localisation')
    }

    const savedLatValue = parseCoordinateFromApi(response.data.data?.latitude) ?? parsedLatitude
    const savedLngValue = parseCoordinateFromApi(response.data.data?.longitude) ?? parsedLongitude

    setLatitude(formatCoordinate(savedLatValue))
    setLongitude(formatCoordinate(savedLngValue))
    setInitialLatitude(savedLatValue)
    setInitialLongitude(savedLngValue)
    setHasLocation(
      Boolean(
        response.data.data?.has_location ?? (savedLatValue !== null && savedLngValue !== null)
      )
    )

    return true
  }, [initialLatitude, initialLongitude, latitude, longitude])

  return {
    latitude,
    longitude,
    setLatitude,
    setLongitude,
    locationLoading,
    hasLocation,
    status,
    loadMerchantLocation,
    requestCurrentLocation,
    saveLocationIfNeeded,
  }
}

export default useMerchantLocation
