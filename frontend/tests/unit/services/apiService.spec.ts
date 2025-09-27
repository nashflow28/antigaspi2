import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { apiService } from '@/services/api'

// Mock fetch
global.fetch = vi.fn()

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      store = {}
    })
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

describe('API Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('Authentication API', () => {
    it('should make login request with correct parameters', async () => {
      const mockResponse = {
        data: {
          token: 'mock-token',
          user: { id: 1, name: 'John', email: 'john@test.com', role: 'consumer' }
        }
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockResponse
      } as Response)

      const credentials = { email: 'john@test.com', password: 'password' }
      const result = await apiService.login(credentials)

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/auth/login',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }),
          body: JSON.stringify(credentials)
        })
      )

      expect(result).toEqual(mockResponse)
    })

    it('should include authorization header when token exists', async () => {
      const mockToken = 'mock-jwt-token'
      localStorageMock.getItem.mockReturnValue(mockToken)

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ data: { id: 1, name: 'John' } })
      } as Response)

      await apiService.getCurrentUser()

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/auth/me',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': `Bearer ${mockToken}`
          })
        })
      )
    })
  })

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))

      await expect(apiService.login({ email: 'test@test.com', password: 'password' }))
        .rejects.toThrow('Network error')
    })

    it('should handle responses with no content', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        status: 204,
        headers: new Headers(),
        json: async () => null
      } as Response)

      const result = await apiService.logout()
      expect(result).toBeNull()
    })
  })

  describe('API Structure', () => {
    it('should have required authentication methods', () => {
      expect(typeof apiService.login).toBe('function')
      expect(typeof apiService.register).toBe('function')
      expect(typeof apiService.logout).toBe('function')
      expect(typeof apiService.getCurrentUser).toBe('function')
    })

    it('should have product management methods', () => {
      expect(typeof apiService.getProducts).toBe('function')
    })
  })
})
