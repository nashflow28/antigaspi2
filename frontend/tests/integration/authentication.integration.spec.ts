import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'

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

// Mock API
vi.mock('@/services/api', () => ({
  apiService: {
    login: vi.fn(),
    register: vi.fn(),
    getCurrentUser: vi.fn(),
    logout: vi.fn().mockResolvedValue(null)
  }
}))

// Mock device service
vi.mock('@/services/deviceService', () => ({
  deviceService: {
    logout: vi.fn().mockResolvedValue(null)
  }
}))

// Mock notifications
vi.mock('@/composables/useNotifications', () => ({
  notify: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn()
  }
}))

describe('Authentication Integration', () => {
  let authStore: ReturnType<typeof useAuthStore>

  beforeEach(() => {
    localStorageMock.clear()
    vi.clearAllMocks()
    setActivePinia(createPinia())
    authStore = useAuthStore()
  })

  it('should handle complete login flow', async () => {
    const mockUser = {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
      role: 'consumer' as const
    }

    const { apiService } = await import('@/services/api')
    vi.mocked(apiService.login).mockResolvedValue({
      data: {
        token: 'mock-token',
        user: mockUser
      }
    })

    // Test login action
    const result = await authStore.login({
      email: 'john@example.com',
      password: 'password123'
    })

    expect(result.success).toBe(true)
    expect(authStore.isAuthenticated).toBe(true)
    expect(authStore.user).toEqual(mockUser)
    expect(authStore.isConsumer).toBe(true)
  })

  it('should handle authentication state changes', () => {
    // Initially not authenticated
    expect(authStore.isAuthenticated).toBe(false)
    expect(authStore.user).toBeNull()

    // Set user and token using setAuth method (proper way)
    authStore.setAuth('test-token', {
      id: 1,
      name: 'Test User',
      email: 'test@example.com',
      role: 'merchant'
    } as any)

    // Should be authenticated
    expect(authStore.isAuthenticated).toBe(true)
    expect(authStore.isMerchant).toBe(true)
    expect(authStore.isConsumer).toBe(false)
  })

  it('should handle logout flow', async () => {
    // Set initial authenticated state using setAuth
    authStore.setAuth('test-token', {
      id: 1,
      name: 'Test User',
      email: 'test@example.com',
      role: 'consumer'
    } as any)

    expect(authStore.isAuthenticated).toBe(true)

    // Logout
    await authStore.logout()

    // Should be logged out
    expect(authStore.isAuthenticated).toBe(false)
    expect(authStore.user).toBeNull()
    expect(authStore.token).toBeNull()
  })

  it('should handle registration flow', async () => {
    const mockUser = {
      id: 2,
      name: 'Jane Doe',
      email: 'jane@example.com',
      role: 'merchant' as const
    }

    const { apiService } = await import('@/services/api')
    vi.mocked(apiService.register).mockResolvedValue({
      data: {
        token: 'new-token',
        user: mockUser
      }
    })

    const result = await authStore.register({
      name: 'Jane Doe',
      email: 'jane@example.com',
      password: 'password123',
      role: 'merchant'
    })

    expect(result.success).toBe(true)
    expect(authStore.isAuthenticated).toBe(true)
    expect(authStore.user).toEqual(mockUser)
    expect(authStore.isMerchant).toBe(true)
  })

  it('should handle authentication errors', async () => {
    const { apiService } = await import('@/services/api')
    vi.mocked(apiService.login).mockRejectedValue(new Error('Invalid credentials'))

    const result = await authStore.login({
      email: 'wrong@example.com',
      password: 'wrongpassword'
    })

    expect(result.success).toBe(false)
    expect(result.error).toBe('Invalid credentials')
    expect(authStore.isAuthenticated).toBe(false)
  })

  it('should handle session initialization', async () => {
    const mockUser = {
      id: 1,
      name: 'Test User',
      email: 'test@example.com',
      role: 'consumer' as const
    }

    // Set token in localStorage (simulating page refresh with stored token)
    localStorageMock.setItem('auth_token', 'existing-token')

    // Recreate store to pick up token from localStorage
    setActivePinia(createPinia())
    authStore = useAuthStore()

    const { apiService } = await import('@/services/api')
    vi.mocked(apiService.getCurrentUser).mockResolvedValue({
      data: mockUser
    })

    await authStore.initAuth()

    expect(authStore.user).toEqual(mockUser)
    expect(authStore.isAuthenticated).toBe(true)
  })
})
