import { useState, useCallback, useEffect, useRef } from 'react'
import geocodingService, { AddressSuggestion, GeocodingResult } from '../services/geocodingService'

interface UseAddressSearchOptions {
  debounceMs?: number
  minLength?: number
  country?: string
  limit?: number
}

interface UseAddressSearchReturn {
  query: string
  setQuery: (query: string) => void
  suggestions: AddressSuggestion[]
  loading: boolean
  error: string | null
  selectedAddress: AddressSuggestion | null
  selectAddress: (address: AddressSuggestion) => void
  clearSelection: () => void
}

/**
 * Hook pour la recherche d'adresses avec autocomplétion
 */
export const useAddressSearch = (
  options: UseAddressSearchOptions = {}
): UseAddressSearchReturn => {
  const {
    debounceMs = 300,
    minLength = 3,
    country = 'TG',
    limit = 5,
  } = options

  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedAddress, setSelectedAddress] = useState<AddressSuggestion | null>(null)

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Search for addresses
  const searchAddresses = useCallback(
    async (searchQuery: string) => {
      if (searchQuery.length < minLength) {
        setSuggestions([])
        return
      }

      setLoading(true)
      setError(null)

      try {
        const results = await geocodingService.searchAddresses(
          searchQuery,
          country,
          limit
        )
        setSuggestions(results)
      } catch (err: any) {
        setError(err.message || 'Erreur lors de la recherche')
        setSuggestions([])
      } finally {
        setLoading(false)
      }
    },
    [country, limit, minLength]
  )

  // Debounced search effect
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    if (query.length >= minLength) {
      debounceTimerRef.current = setTimeout(() => {
        searchAddresses(query)
      }, debounceMs)
    } else {
      setSuggestions([])
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [query, debounceMs, minLength, searchAddresses])

  // Select an address
  const selectAddress = useCallback((address: AddressSuggestion) => {
    setSelectedAddress(address)
    setQuery(address.display_name)
    setSuggestions([])
  }, [])

  // Clear selection
  const clearSelection = useCallback(() => {
    setSelectedAddress(null)
    setQuery('')
    setSuggestions([])
  }, [])

  return {
    query,
    setQuery,
    suggestions,
    loading,
    error,
    selectedAddress,
    selectAddress,
    clearSelection,
  }
}

/**
 * Hook pour obtenir l'adresse à partir des coordonnées actuelles
 */
export const useCurrentLocationAddress = () => {
  const [address, setAddress] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAddressFromCoordinates = useCallback(
    async (latitude: number, longitude: number) => {
      setLoading(true)
      setError(null)

      try {
        const result = await geocodingService.reverseGeocode(latitude, longitude)
        if (result) {
          const formattedAddress = geocodingService.formatAddress(result)
          setAddress(formattedAddress)
          return formattedAddress
        } else {
          setError('Adresse non trouvée')
          return null
        }
      } catch (err: any) {
        setError(err.message || 'Erreur lors de la récupération de l\'adresse')
        return null
      } finally {
        setLoading(false)
      }
    },
    []
  )

  return {
    address,
    loading,
    error,
    fetchAddressFromCoordinates,
  }
}

export default useAddressSearch
