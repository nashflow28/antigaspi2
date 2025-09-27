import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useGeolocation } from '@/composables/useGeolocation'

// Mock geolocation API
const mockGeolocation = {
  getCurrentPosition: vi.fn(),
  watchPosition: vi.fn(),
  clearWatch: vi.fn()
}

Object.defineProperty(global.navigator, 'geolocation', {
  value: mockGeolocation,
  writable: true
})

describe('useGeolocation Composable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize with default values', () => {
    const { coords, error, isSupported, isLoading } = useGeolocation()

    expect(coords.value).toBeNull()
    expect(error.value).toBeNull()
    expect(isSupported.value).toBe(true) // navigator.geolocation is mocked
    expect(isLoading.value).toBe(false)
  })

  it('should detect if geolocation is not supported', () => {
    // Temporarily remove geolocation support
    const originalGeolocation = global.navigator.geolocation
    delete (global.navigator as any).geolocation

    const { isSupported } = useGeolocation()
    expect(isSupported.value).toBe(false)

    // Restore geolocation
    Object.defineProperty(global.navigator, 'geolocation', {
      value: originalGeolocation,
      writable: true
    })
  })

  it('should get current position successfully', async () => {
    const mockPosition = {
      coords: {
        latitude: 48.8566,
        longitude: 2.3522,
        accuracy: 10,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null
      },
      timestamp: Date.now()
    }

    mockGeolocation.getCurrentPosition.mockImplementation((success) => {
      success(mockPosition)
    })

    const { coords, getCurrentPosition, isLoading } = useGeolocation()

    const positionPromise = getCurrentPosition()
    expect(isLoading.value).toBe(true)

    const result = await positionPromise

    expect(isLoading.value).toBe(false)
    expect(coords.value).toEqual(mockPosition.coords)
    expect(result).toEqual(mockPosition.coords)
  })

  it('should handle geolocation errors', async () => {
    const mockError = {
      code: 1,
      message: 'User denied the request for Geolocation.'
    }

    mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
      error(mockError)
    })

    const { error, getCurrentPosition, isLoading } = useGeolocation()

    const positionPromise = getCurrentPosition()
    expect(isLoading.value).toBe(true)

    try {
      await positionPromise
    } catch (err) {
      expect(isLoading.value).toBe(false)
      expect(error.value).toEqual(mockError)
      expect(err).toEqual(mockError)
    }
  })

  it('should watch position changes', () => {
    const mockWatchId = 123
    mockGeolocation.watchPosition.mockReturnValue(mockWatchId)

    const { watchPosition } = useGeolocation()

    const watchId = watchPosition()

    expect(mockGeolocation.watchPosition).toHaveBeenCalled()
    expect(watchId).toBe(mockWatchId)
  })

  it('should clear position watch', () => {
    const watchId = 123

    const { clearWatch } = useGeolocation()

    clearWatch(watchId)

    expect(mockGeolocation.clearWatch).toHaveBeenCalledWith(watchId)
  })

  it('should calculate distance between coordinates', () => {
    const { calculateDistance } = useGeolocation()

    // Distance between Paris and Lyon (approx 463km)
    const paris = { latitude: 48.8566, longitude: 2.3522 }
    const lyon = { latitude: 45.7640, longitude: 4.8357 }

    const distance = calculateDistance(paris, lyon)

    // Should be approximately 463km (allow some tolerance)
    expect(distance).toBeGreaterThan(450)
    expect(distance).toBeLessThan(480)
  })

  it('should handle position options correctly', async () => {
    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000
    }

    mockGeolocation.getCurrentPosition.mockImplementation((success) => {
      success({
        coords: { latitude: 0, longitude: 0 },
        timestamp: Date.now()
      })
    })

    const { getCurrentPosition } = useGeolocation()

    await getCurrentPosition(options)

    expect(mockGeolocation.getCurrentPosition).toHaveBeenCalledWith(
      expect.any(Function),
      expect.any(Function),
      options
    )
  })

  it('should format coordinates correctly', () => {
    const { formatCoordinates } = useGeolocation()

    const coords = { latitude: 48.8566, longitude: 2.3522 }
    const formatted = formatCoordinates(coords)

    expect(formatted).toBe('48.8566, 2.3522')
  })

  it('should determine if coordinates are within bounds', () => {
    const { isWithinBounds } = useGeolocation()

    const coords = { latitude: 48.8566, longitude: 2.3522 }
    const bounds = {
      north: 49.0,
      south: 48.0,
      east: 3.0,
      west: 2.0
    }

    expect(isWithinBounds(coords, bounds)).toBe(true)

    const outsideCoords = { latitude: 50.0, longitude: 2.3522 }
    expect(isWithinBounds(outsideCoords, bounds)).toBe(false)
  })
})
