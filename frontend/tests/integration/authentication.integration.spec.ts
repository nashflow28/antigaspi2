import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'

// Mock API
vi.mock('@/services/api', () => ({
  apiService: {
    login: vi.fn(),
    register: vi.fn(),
    getCurrentUser: vi.fn()
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
    setActivePinia(createPinia())
    authStore = useAuthStore()
    vi.clearAllMocks()
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

    // Set user and token
    authStore.user = {
      id: 1,
      name: 'Test User',
      email: 'test@example.com',
      role: 'merchant'
    }
    authStore.token = 'test-token'

    // Should be authenticated
    expect(authStore.isAuthenticated).toBe(true)
    expect(authStore.isMerchant).toBe(true)
    expect(authStore.isConsumer).toBe(false)
  })

  it('should handle logout flow', async () => {
    // Set initial authenticated state
    authStore.user = {
      id: 1,
      name: 'Test User',
      email: 'test@example.com',
      role: 'consumer'
    }
    authStore.token = 'test-token'

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

    // Set token but no user (simulating page refresh)
    authStore.token = 'existing-token'
    authStore.user = null

    const { apiService } = await import('@/services/api')
    vi.mocked(apiService.getCurrentUser).mockResolvedValue({
      data: mockUser
    })

    await authStore.initAuth()

    expect(authStore.user).toEqual(mockUser)
    expect(authStore.isAuthenticated).toBe(true)
  })
})
