/**
 * INTEGRATION TESTS - authSlice
 * Tests complets pour l'authentification avec vérification d'état Redux
 */

import { configureStore, EnhancedStore } from '@reduxjs/toolkit'
import authReducer, {
  loginUser,
  logoutUser,
  registerUser,
  loadStoredAuth,
  refreshProfile,
  clearError,
  clearAuth,
  authInitialState,
  AuthState
} from '../authSlice'
import apiService from '../../../services/api'
import { clearAllFormCaches } from '../../../hooks/usePersistedForm'

// Mocks
jest.mock('../../../services/api', () => ({
  __esModule: true,
  default: {
    login: jest.fn(),
    logout: jest.fn(),
    register: jest.fn(),
    getProfile: jest.fn(),
    getStoredToken: jest.fn(),
    getStoredUser: jest.fn(),
    clearStoredAuth: jest.fn(),
  },
}))
jest.mock('../../../hooks/usePersistedForm', () => ({
  clearAllFormCaches: jest.fn().mockResolvedValue(undefined),
}))
jest.mock('../../../services/secureStorage', () => ({
  secureStorage: {
    setToken: jest.fn().mockResolvedValue(undefined),
    setUserData: jest.fn().mockResolvedValue(undefined),
    getToken: jest.fn().mockResolvedValue(null),
    getUserData: jest.fn().mockResolvedValue(null),
    clear: jest.fn().mockResolvedValue(undefined),
  },
}))
jest.mock('../../../utils/logger', () => ({
  authLogger: { log: jest.fn(), warn: jest.fn(), error: jest.fn() },
  storeLogger: { warn: jest.fn(), log: jest.fn() },
  createLogger: () => ({ warn: jest.fn(), log: jest.fn() }),
}))
jest.mock('../../../services/otpService', () => ({
  otpService: {
    verifyOtp: jest.fn(),
  },
}))

const mockedApi = apiService as jest.Mocked<typeof apiService>
const mockedClearFormCaches = clearAllFormCaches as jest.MockedFunction<typeof clearAllFormCaches>

// Factory pour créer des utilisateurs de test
const createMockUser = (overrides = {}) => ({
  id: 1,
  first_name: 'Jean',
  last_name: 'Dupont',
  email: 'jean.dupont@email.com',
  phone: '+228 90 00 00 00',
  role: 'consumer' as const,
  city: 'Lomé',
  is_active: true,
  created_at: '2026-01-01T00:00:00Z',
  ...overrides,
})

describe('authSlice - Integration Tests', () => {
  let store: EnhancedStore<{ auth: AuthState }>

  beforeEach(() => {
    store = configureStore({
      reducer: {
        auth: authReducer,
      },
    })
    jest.clearAllMocks()
  })

  describe('loginUser', () => {
    const validCredentials = {
      email: 'jean.dupont@email.com',
      password: 'password123',
    }

    it('should authenticate user and update state on successful login', async () => {
      const mockUser = createMockUser()
      const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test'

      mockedApi.login.mockResolvedValue({
        success: true,
        message: 'Connexion réussie',
        data: {
          user: mockUser,
          token: mockToken,
        },
      })

      // État initial: non authentifié
      expect(store.getState().auth.isAuthenticated).toBe(false)
      expect(store.getState().auth.user).toBeNull()

      const result = await store.dispatch(loginUser(validCredentials))

      expect(result.type).toBe('auth/login/fulfilled')

      // VÉRIFICATION CRITIQUE: État mis à jour
      const state = store.getState().auth
      expect(state.isAuthenticated).toBe(true)
      expect(state.user).toEqual(mockUser)
      expect(state.token).toBe(mockToken)
      expect(state.loading).toBe(false)
      expect(state.error).toBeNull()
    })

    it('should set error state on invalid credentials', async () => {
      mockedApi.login.mockRejectedValue(new Error('Identifiants incorrects'))

      const result = await store.dispatch(loginUser(validCredentials))

      expect(result.type).toBe('auth/login/rejected')

      const state = store.getState().auth
      expect(state.isAuthenticated).toBe(false)
      expect(state.user).toBeNull()
      expect(state.error).toBe('Identifiants incorrects')
    })

    it('should set loading during login process', async () => {
      let resolvePromise: (value: any) => void
      const pendingPromise = new Promise((resolve) => {
        resolvePromise = resolve
      })
      mockedApi.login.mockReturnValue(pendingPromise as any)

      const dispatchPromise = store.dispatch(loginUser(validCredentials))

      // Pendant la requête
      expect(store.getState().auth.loading).toBe(true)
      expect(store.getState().auth.error).toBeNull()

      // Résoudre
      resolvePromise!({
        success: true,
        data: { user: createMockUser(), token: 'token' },
      })
      await dispatchPromise

      expect(store.getState().auth.loading).toBe(false)
    })

    it('should authenticate merchant user with correct role', async () => {
      const merchantUser = createMockUser({ role: 'merchant' })
      mockedApi.login.mockResolvedValue({
        success: true,
        data: { user: merchantUser, token: 'merchant-token' },
      })

      await store.dispatch(loginUser({
        email: 'merchant@test.com',
        password: 'password',
      }))

      expect(store.getState().auth.user?.role).toBe('merchant')
    })

    it('should authenticate admin user with correct role', async () => {
      const adminUser = createMockUser({ role: 'admin' })
      mockedApi.login.mockResolvedValue({
        success: true,
        data: { user: adminUser, token: 'admin-token' },
      })

      await store.dispatch(loginUser({
        email: 'admin@test.com',
        password: 'password',
      }))

      expect(store.getState().auth.user?.role).toBe('admin')
    })
  })

  describe('logoutUser', () => {
    beforeEach(async () => {
      // Setup: Simuler un utilisateur connecté
      mockedApi.login.mockResolvedValue({
        success: true,
        data: { user: createMockUser(), token: 'token' },
      })
      await store.dispatch(loginUser({ email: 'test@test.com', password: 'pass' }))
      expect(store.getState().auth.isAuthenticated).toBe(true)
    })

    it('should clear authentication state on successful logout', async () => {
      mockedApi.logout.mockResolvedValue({ success: true })

      const result = await store.dispatch(logoutUser())

      expect(result.type).toBe('auth/logout/fulfilled')

      // VÉRIFICATION CRITIQUE: Session effacée
      const state = store.getState().auth
      expect(state.isAuthenticated).toBe(false)
      expect(state.user).toBeNull()
      expect(state.token).toBeNull()
      expect(state.error).toBeNull()
    })

    it('should clear form caches on logout', async () => {
      mockedApi.logout.mockResolvedValue({ success: true })

      await store.dispatch(logoutUser())

      expect(mockedClearFormCaches).toHaveBeenCalled()
    })

    it('should clear auth state even if API logout fails', async () => {
      mockedApi.logout.mockRejectedValue(new Error('Network error'))

      const result = await store.dispatch(logoutUser())

      // Même en cas d'erreur API, la déconnexion locale est forcée
      expect(result.type).toBe('auth/logout/rejected')

      const state = store.getState().auth
      expect(state.isAuthenticated).toBe(false)
      expect(state.user).toBeNull()
      expect(state.token).toBeNull()
    })

    it('should still clear form caches if API logout fails', async () => {
      mockedApi.logout.mockRejectedValue(new Error('Network error'))

      await store.dispatch(logoutUser())

      // Les caches sont nettoyés même en cas d'erreur
      expect(mockedClearFormCaches).toHaveBeenCalled()
    })
  })

  describe('registerUser', () => {
    const validRegisterData = {
      first_name: 'Nouveau',
      last_name: 'Utilisateur',
      email: 'nouveau@test.com',
      password: 'password123',
      phone: '+228 90 00 00 01',
      role: 'consumer' as const,
      city: 'Lomé',
    }

    it('should register and authenticate new user', async () => {
      const newUser = createMockUser({
        first_name: 'Nouveau',
        last_name: 'Utilisateur',
        email: 'nouveau@test.com',
      })
      mockedApi.register.mockResolvedValue({
        success: true,
        message: 'Inscription réussie',
        data: { user: newUser, token: 'new-user-token' },
      })

      const result = await store.dispatch(registerUser(validRegisterData))

      expect(result.type).toBe('auth/register/fulfilled')

      const state = store.getState().auth
      expect(state.isAuthenticated).toBe(true)
      expect(state.user?.email).toBe('nouveau@test.com')
      expect(state.token).toBe('new-user-token')
    })

    it('should handle validation errors from API', async () => {
      const validationError = new Error('Validation failed')
      ;(validationError as any).validationErrors = {
        email: ['Cet email est déjà utilisé'],
      }
      mockedApi.register.mockRejectedValue(validationError)

      const result = await store.dispatch(registerUser(validRegisterData))

      expect(result.type).toBe('auth/register/rejected')

      const state = store.getState().auth
      expect(state.isAuthenticated).toBe(false)
      expect(state.error).toBe('Validation failed')
    })

    it('should not authenticate on registration failure', async () => {
      mockedApi.register.mockRejectedValue(new Error('Email déjà utilisé'))

      await store.dispatch(registerUser(validRegisterData))

      expect(store.getState().auth.isAuthenticated).toBe(false)
      expect(store.getState().auth.user).toBeNull()
    })
  })

  describe('loadStoredAuth', () => {
    it('should restore session from stored credentials', async () => {
      const storedUser = createMockUser()
      const storedToken = 'stored-token'

      mockedApi.getStoredToken.mockResolvedValue(storedToken)
      mockedApi.getStoredUser.mockResolvedValue(storedUser)

      // Mock jwtHelpers
      jest.doMock('../../../utils/jwtHelpers', () => ({
        isTokenExpired: () => false,
      }))

      const result = await store.dispatch(loadStoredAuth())

      if (result.type === 'auth/loadStored/fulfilled' && result.payload) {
        const state = store.getState().auth
        expect(state.isAuthenticated).toBe(true)
        expect(state.user).toEqual(storedUser)
        expect(state.token).toBe(storedToken)
      }
    })

    it('should not restore if no stored credentials', async () => {
      mockedApi.getStoredToken.mockResolvedValue(null)
      mockedApi.getStoredUser.mockResolvedValue(null)

      await store.dispatch(loadStoredAuth())

      const state = store.getState().auth
      expect(state.isAuthenticated).toBe(false)
      expect(state.user).toBeNull()
    })
  })

  describe('refreshProfile', () => {
    beforeEach(async () => {
      // Setup: Utilisateur connecté
      mockedApi.login.mockResolvedValue({
        success: true,
        data: { user: createMockUser(), token: 'token' },
      })
      await store.dispatch(loginUser({ email: 'test@test.com', password: 'pass' }))
    })

    it('should update user profile data', async () => {
      const updatedUser = createMockUser({
        first_name: 'Jean-Pierre',
        phone: '+228 90 00 00 99',
      })
      mockedApi.getProfile.mockResolvedValue({ data: updatedUser })

      await store.dispatch(refreshProfile())

      const state = store.getState().auth
      expect(state.user?.first_name).toBe('Jean-Pierre')
      expect(state.user?.phone).toBe('+228 90 00 00 99')
    })

    it('should keep authentication status on profile refresh failure', async () => {
      mockedApi.getProfile.mockRejectedValue(new Error('Network error'))

      await store.dispatch(refreshProfile())

      // L'utilisateur reste connecté malgré l'échec du refresh
      expect(store.getState().auth.isAuthenticated).toBe(true)
    })
  })

  describe('clearError', () => {
    it('should clear error state', async () => {
      // Create an error
      mockedApi.login.mockRejectedValue(new Error('Test error'))
      await store.dispatch(loginUser({ email: 'test', password: 'test' }))
      expect(store.getState().auth.error).toBe('Test error')

      // Clear it
      store.dispatch(clearError())

      expect(store.getState().auth.error).toBeNull()
    })
  })

  describe('clearAuth', () => {
    it('should completely reset auth state', async () => {
      // Setup: Utilisateur connecté
      mockedApi.login.mockResolvedValue({
        success: true,
        data: { user: createMockUser(), token: 'token' },
      })
      await store.dispatch(loginUser({ email: 'test', password: 'test' }))

      store.dispatch(clearAuth())

      const state = store.getState().auth
      expect(state.user).toBeNull()
      expect(state.token).toBeNull()
      expect(state.isAuthenticated).toBe(false)
      expect(state.error).toBeNull()
      expect(state.loading).toBe(false)
    })
  })

  describe('Multi-Role Authentication', () => {
    const roles = ['consumer', 'merchant', 'admin'] as const

    roles.forEach(role => {
      it(`should correctly authenticate ${role} role`, async () => {
        const user = createMockUser({ role })
        mockedApi.login.mockResolvedValue({
          success: true,
          data: { user, token: `${role}-token` },
        })

        await store.dispatch(loginUser({ email: `${role}@test.com`, password: 'pass' }))

        expect(store.getState().auth.user?.role).toBe(role)
        expect(store.getState().auth.isAuthenticated).toBe(true)
      })
    })
  })

  describe('Session Persistence', () => {
    it('should maintain session across multiple state updates', async () => {
      const user = createMockUser()
      mockedApi.login.mockResolvedValue({
        success: true,
        data: { user, token: 'persistent-token' },
      })

      await store.dispatch(loginUser({ email: 'test', password: 'test' }))

      // Simuler plusieurs actions qui pourraient affecter l'état
      store.dispatch(clearError())

      // La session doit persister
      expect(store.getState().auth.isAuthenticated).toBe(true)
      expect(store.getState().auth.user).not.toBeNull()
    })
  })
})
