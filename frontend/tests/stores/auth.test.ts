import { describe, it, expect, vi, beforeEach, type MockedFunction } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import { apiService } from '@/services/api'
import { notify } from '@/composables/useNotifications'

// Mock dependencies
vi.mock('@/services/api')
vi.mock('@/composables/useNotifications')

const mockedApiService = vi.mocked(apiService)
const mockedNotify = vi.mocked(notify)

describe('Auth Store - Notifications & Callbacks', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('Login Flow', () => {
    it('should show success notification on successful login', async () => {
      const mockCredentials = { email: 'test@test.com', password: 'password' }
      const mockResponse = {
        data: {
          token: 'test-token',
          user: { id: 1, email: 'test@test.com', role: 'consumer' }
        }
      }

      mockedApiService.login.mockResolvedValue(mockResponse)

      const authStore = useAuthStore()
      const result = await authStore.login(mockCredentials)

      expect(result.success).toBe(true)
      expect(mockedNotify.success).toHaveBeenCalledWith(
        'Connexion réussie',
        'Authentification'
      )
    })

    it('should show error notification with retry callback on failed login', async () => {
      const mockCredentials = { email: 'test@test.com', password: 'wrong' }
      const mockError = new Error('Invalid credentials')

      mockedApiService.login.mockRejectedValue(mockError)

      const authStore = useAuthStore()
      await authStore.login(mockCredentials)

      expect(mockedNotify.error).toHaveBeenCalledWith(
        'Invalid credentials',
        'Authentification',
        expect.objectContaining({
          action: expect.objectContaining({
            label: 'Réessayer',
            callback: expect.any(Function)
          })
        })
      )
    })

    it('should retry login when error notification callback is executed', async () => {
      const mockCredentials = { email: 'test@test.com', password: 'test' }

      // First call fails
      mockedApiService.login
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          data: {
            token: 'test-token',
            user: { id: 1, email: 'test@test.com', role: 'consumer' }
          }
        })

      const authStore = useAuthStore()
      await authStore.login(mockCredentials)

      // Get the retry callback from the error notification
      const errorCall = mockedNotify.error.mock.calls[0]
      const retryCallback = errorCall[2]?.action?.callback

      expect(retryCallback).toBeDefined()

      // Execute retry callback
      await retryCallback()

      // Verify retry was successful
      expect(mockedApiService.login).toHaveBeenCalledTimes(2)
      expect(mockedNotify.success).toHaveBeenCalledWith(
        'Connexion réussie',
        'Authentification'
      )
    })
  })

  describe('Register Flow', () => {
    it('should show success notification on successful registration', async () => {
      const mockData = {
        first_name: 'Test',
        last_name: 'User',
        email: 'test@test.com',
        password: 'password',
        role: 'consumer' as const
      }
      const mockResponse = {
        data: {
          token: 'test-token',
          user: { id: 1, ...mockData }
        }
      }

      mockedApiService.register.mockResolvedValue(mockResponse)

      const authStore = useAuthStore()
      const result = await authStore.register(mockData)

      expect(result.success).toBe(true)
      expect(mockedNotify.success).toHaveBeenCalledWith(
        'Inscription réussie',
        'Bienvenue !'
      )
    })

    it('should show error notification with retry callback on failed registration', async () => {
      const mockData = {
        first_name: 'Test',
        last_name: 'User',
        email: 'existing@test.com',
        password: 'password',
        role: 'consumer' as const
      }

      mockedApiService.register.mockRejectedValue(new Error('Email already exists'))

      const authStore = useAuthStore()
      await authStore.register(mockData)

      expect(mockedNotify.error).toHaveBeenCalledWith(
        'Email already exists',
        'Inscription',
        expect.objectContaining({
          action: expect.objectContaining({
            label: 'Réessayer',
            callback: expect.any(Function)
          })
        })
      )
    })
  })

  describe('Logout Flow', () => {
    it('should show info notification on logout', async () => {
      const authStore = useAuthStore()

      // Setup authenticated state
      authStore.token = 'test-token'
      authStore.user = { id: 1, email: 'test@test.com', role: 'consumer' }

      mockedApiService.logout.mockResolvedValue({})

      await authStore.logout()

      expect(mockedNotify.info).toHaveBeenCalledWith(
        'Vous avez été déconnecté',
        'Au revoir !'
      )
    })
  })

  describe('Session Management', () => {
    it('should show error notification on expired session', async () => {
      const authStore = useAuthStore()

      // Setup authenticated state
      authStore.token = 'expired-token'
      mockedApiService.getCurrentUser.mockRejectedValue(new Error('Token expired'))

      await authStore.getCurrentUser()

      expect(mockedNotify.error).toHaveBeenCalledWith(
        'Session expirée, veuillez vous reconnecter',
        'Authentification'
      )
    })
  })

  describe('Callback Edge Cases', () => {
    it('should handle retry callback exceptions gracefully', async () => {
      const mockCredentials = { email: 'test@test.com', password: 'test' }

      // Both calls fail
      mockedApiService.login
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Still failing'))

      const authStore = useAuthStore()
      await authStore.login(mockCredentials)

      // Get and execute retry callback
      const errorCall = mockedNotify.error.mock.calls[0]
      const retryCallback = errorCall[2]?.action?.callback

      // Should not throw when retry fails
      await expect(retryCallback()).resolves.toBeUndefined()
    })

    it('should prevent concurrent login attempts', async () => {
      const mockCredentials = { email: 'test@test.com', password: 'test' }

      // Slow API call
      mockedApiService.login.mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve({
          data: { token: 'test', user: { id: 1 } }
        }), 100))
      )

      const authStore = useAuthStore()

      // Start first login
      const firstLogin = authStore.login(mockCredentials)

      // Start second login immediately
      const secondLogin = authStore.login(mockCredentials)

      await Promise.all([firstLogin, secondLogin])

      // Should only make one API call due to loading guard
      expect(mockedApiService.login).toHaveBeenCalledTimes(1)
    })
  })
})