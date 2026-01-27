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
  writable: true,
  configurable: true
})

describe('useGeolocation Composable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset geolocation mock
    Object.defineProperty(global.navigator, 'geolocation', {
      value: mockGeolocation,
      writable: true,
      configurable: true
    })
  })

  it('should initialize with default values', () => {
    const { position, error, isSupported, isLoading } = useGeolocation()

    expect(position.value).toBeNull()
    expect(error.value).toBeNull()
    expect(isSupported).toBe(true) // navigator.geolocation is mocked - plain boolean
    expect(isLoading.value).toBe(false)
  })

  it('should detect if geolocation is not supported', () => {
    // Temporarily remove geolocation support entirely (not just set to undefined)
    // We need to delete it because 'geolocation' in navigator checks property existence
    const originalGeolocation = global.navigator.geolocation
    delete (global.navigator as any).geolocation

    const { isSupported } = useGeolocation()
    expect(isSupported).toBe(false)

    // Restore geolocation
    Object.defineProperty(global.navigator, 'geolocation', {
      value: originalGeolocation,
      writable: true,
      configurable: true
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

    const { position, getCurrentPosition, isLoading } = useGeolocation()

    const result = await getCurrentPosition()

    expect(isLoading.value).toBe(false)
    expect(position.value).toEqual({
      latitude: mockPosition.coords.latitude,
      longitude: mockPosition.coords.longitude,
      accuracy: mockPosition.coords.accuracy,
      timestamp: mockPosition.timestamp
    })
    expect(result?.latitude).toBe(mockPosition.coords.latitude)
  })

  it('should handle geolocation errors', async () => {
    const mockError = {
      code: 1,
      message: 'User denied the request for Geolocation.',
      PERMISSION_DENIED: 1,
      POSITION_UNAVAILABLE: 2,
      TIMEOUT: 3
    }

    mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
      error(mockError)
    })

    const { error, getCurrentPosition, isLoading } = useGeolocation()

    try {
      await getCurrentPosition()
    } catch (err: any) {
      expect(isLoading.value).toBe(false)
      expect(error.value).toBeTruthy()
      expect(error.value?.code).toBe(1)
      expect(error.value?.type).toBe('PERMISSION_DENIED')
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

    // Distance between Paris and Lyon (approx 392km by Haversine)
    const paris = { latitude: 48.8566, longitude: 2.3522 }
    const lyon = { latitude: 45.7640, longitude: 4.8357 }

    const distance = calculateDistance(paris, lyon)

    // Haversine formula gives ~392km for this route
    expect(distance).toBeGreaterThan(380)
    expect(distance).toBeLessThan(420)
  })

  it('should handle position options correctly', async () => {
    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000
    }

    mockGeolocation.getCurrentPosition.mockImplementation((success) => {
      success({
        coords: { latitude: 0, longitude: 0, accuracy: 10 },
        timestamp: Date.now()
      })
    })

    const { getCurrentPosition } = useGeolocation()

    await getCurrentPosition(options)

    expect(mockGeolocation.getCurrentPosition).toHaveBeenCalledWith(
      expect.any(Function),
      expect.any(Function),
      expect.objectContaining(options)
    )
  })

  it('should format distance correctly', () => {
    const { formatDistance } = useGeolocation()

    // Less than 1km - should show in meters
    expect(formatDistance(0.5)).toBe('500 m')

    // Between 1-10km - should show with 1 decimal
    expect(formatDistance(5.5)).toBe('5.5 km')

    // More than 10km - should show rounded
    expect(formatDistance(15.7)).toBe('16 km')
  })

  it('should determine if coordinates are within radius', () => {
    const { isWithinRadius } = useGeolocation()

    const center = { latitude: 48.8566, longitude: 2.3522 } // Paris
    const nearPoint = { latitude: 48.8600, longitude: 2.3550 } // ~500m away
    const farPoint = { latitude: 45.7640, longitude: 4.8357 } // Lyon, ~390km away

    // Near point should be within 1km radius
    expect(isWithinRadius(center, nearPoint, 1)).toBe(true)

    // Far point should not be within 1km radius
    expect(isWithinRadius(center, farPoint, 1)).toBe(false)

    // Far point should be within 500km radius
    expect(isWithinRadius(center, farPoint, 500)).toBe(true)
  })
})
