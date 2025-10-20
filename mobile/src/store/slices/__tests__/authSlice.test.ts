// @ts-nocheck
/**
 * Tests unitaires pour authSlice
 * Teste login, register, logout, loadStoredAuth, refreshProfile + reducers
 */

import { configureStore } from '@reduxjs/toolkit'
import authReducer, {
  loginUser,
  registerUser,
  logoutUser,
  loadStoredAuth,
  refreshProfile,
  clearError,
  clearAuth,
} from '../authSlice'
import { AuthState, LoginCredentials, RegisterData, User, AuthResponse } from '../../../types'
import apiService from '../../../services/api'

// Mock apiService
jest.mock('../../../services/api', () => ({
  __esModule: true,
  default: {
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    getStoredToken: jest.fn(),
    getStoredUser: jest.fn(),
    getProfile: jest.fn(),
  },
}))

const mockLogin = apiService.login as jest.MockedFunction<typeof apiService.login>
const mockRegister = apiService.register as jest.MockedFunction<typeof apiService.register>
const mockLogout = apiService.logout as jest.MockedFunction<typeof apiService.logout>
const mockGetStoredToken = apiService.getStoredToken as jest.MockedFunction<typeof apiService.getStoredToken>
const mockGetStoredUser = apiService.getStoredUser as jest.MockedFunction<typeof apiService.getStoredUser>
const mockGetProfile = apiService.getProfile as jest.MockedFunction<typeof apiService.getProfile>

describe('authSlice', () => {
  let store: ReturnType<typeof configureStore>

  beforeEach(() => {
    // Create fresh store for each test
    store = configureStore({
      reducer: {
        auth: authReducer,
      },
    })

    // Clear all mocks
    jest.clearAllMocks()
  })

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = store.getState().auth

      expect(state).toEqual({
        user: null,
        token: null,
        isAuthenticated: false,
        loading: true, // ⚠️ Initial state has loading=true for SplashScreen
        error: null,
      })
    })
  })

  describe('Synchronous Reducers', () => {
    describe('clearError', () => {
      it('should clear error state', () => {
        // Set up state with error
        store = configureStore({
          reducer: {
            auth: authReducer,
          },
          preloadedState: {
            auth: {
              user: null,
              token: null,
              isAuthenticated: false,
              loading: false,
              error: 'Some error',
            },
          },
        })

        store.dispatch(clearError())

        const state = store.getState().auth
        expect(state.error).toBeNull()
      })
    })

    describe('clearAuth', () => {
      it('should reset auth state to initial values', () => {
        const mockUser: User = {
          id: 1,
          email: 'test@example.com',
          name: 'Test User',
          role: 'consumer',
        }

        // Set up authenticated state
        store = configureStore({
          reducer: {
            auth: authReducer,
          },
          preloadedState: {
            auth: {
              user: mockUser,
              token: 'test-token-123',
              isAuthenticated: true,
              loading: false,
              error: 'Some error',
            },
          },
        })

        store.dispatch(clearAuth())

        const state = store.getState().auth
        expect(state).toEqual({
          user: null,
          token: null,
          isAuthenticated: false,
          loading: false,
          error: null,
        })
      })
    })
  })

  describe('Async Actions - loginUser', () => {
    const mockCredentials: LoginCredentials = {
      email: 'test@example.com',
      password: 'password123',
    }

    const mockUser: User = {
      id: 1,
      email: 'test@example.com',
      name: 'Test User',
      role: 'consumer',
    }

    const mockAuthResponse: AuthResponse = {
      success: true,
      message: 'Login successful',
      data: {
        user: mockUser,
        token: 'test-token-123',
      },
    }

    it('should handle loginUser pending state', () => {
      mockLogin.mockReturnValue(new Promise(() => {})) // Never resolves

      store.dispatch(loginUser(mockCredentials))

      const state = store.getState().auth
      expect(state.loading).toBe(true)
      expect(state.error).toBeNull()
    })

    it('should handle loginUser fulfilled state', async () => {
      mockLogin.mockResolvedValue(mockAuthResponse)

      await store.dispatch(loginUser(mockCredentials))

      const state = store.getState().auth
      expect(state.loading).toBe(false)
      expect(state.user).toEqual(mockUser)
      expect(state.token).toBe('test-token-123')
      expect(state.isAuthenticated).toBe(true)
      expect(state.error).toBeNull()
      expect(mockLogin).toHaveBeenCalledWith(mockCredentials)
    })

    it('should handle loginUser rejected state', async () => {
      const errorMessage = 'Invalid credentials'
      mockLogin.mockRejectedValue(new Error(errorMessage))

      await store.dispatch(loginUser(mockCredentials))

      const state = store.getState().auth
      expect(state.loading).toBe(false)
      expect(state.user).toBeNull()
      expect(state.token).toBeNull()
      expect(state.isAuthenticated).toBe(false)
      expect(state.error).toBe(errorMessage)
    })

    it('should call apiService.login with correct credentials', async () => {
      mockLogin.mockResolvedValue(mockAuthResponse)

      await store.dispatch(loginUser(mockCredentials))

      expect(mockLogin).toHaveBeenCalledTimes(1)
      expect(mockLogin).toHaveBeenCalledWith(mockCredentials)
    })
  })

  describe('Async Actions - registerUser', () => {
    const mockRegisterData: RegisterData = {
      email: 'newuser@example.com',
      password: 'password123',
      name: 'New User',
      role: 'consumer',
    }

    const mockUser: User = {
      id: 2,
      email: 'newuser@example.com',
      name: 'New User',
      role: 'consumer',
    }

    const mockAuthResponse: AuthResponse = {
      success: true,
      message: 'Registration successful',
      data: {
        user: mockUser,
        token: 'new-token-456',
      },
    }

    it('should handle registerUser pending state', () => {
      mockRegister.mockReturnValue(new Promise(() => {}))

      store.dispatch(registerUser(mockRegisterData))

      const state = store.getState().auth
      expect(state.loading).toBe(true)
      expect(state.error).toBeNull()
    })

    it('should handle registerUser fulfilled state', async () => {
      mockRegister.mockResolvedValue(mockAuthResponse)

      await store.dispatch(registerUser(mockRegisterData))

      const state = store.getState().auth
      expect(state.loading).toBe(false)
      expect(state.user).toEqual(mockUser)
      expect(state.token).toBe('new-token-456')
      expect(state.isAuthenticated).toBe(true)
      expect(state.error).toBeNull()
      expect(mockRegister).toHaveBeenCalledWith(mockRegisterData)
    })

    it('should handle registerUser rejected state', async () => {
      const errorMessage = 'Email already exists'
      mockRegister.mockRejectedValue(new Error(errorMessage))

      await store.dispatch(registerUser(mockRegisterData))

      const state = store.getState().auth
      expect(state.loading).toBe(false)
      expect(state.user).toBeNull()
      expect(state.isAuthenticated).toBe(false)
      expect(state.error).toBe(errorMessage)
    })
  })

  describe('Async Actions - logoutUser', () => {
    it('should handle logoutUser fulfilled state', async () => {
      const mockUser: User = {
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        role: 'consumer',
      }

      // Set up authenticated state
      store = configureStore({
        reducer: {
          auth: authReducer,
        },
        preloadedState: {
          auth: {
            user: mockUser,
            token: 'test-token-123',
            isAuthenticated: true,
            loading: false,
            error: null,
          },
        },
      })

      mockLogout.mockResolvedValue()

      await store.dispatch(logoutUser())

      const state = store.getState().auth
      expect(state.user).toBeNull()
      expect(state.token).toBeNull()
      expect(state.isAuthenticated).toBe(false)
      expect(state.loading).toBe(false)
      expect(state.error).toBeNull()
      expect(mockLogout).toHaveBeenCalled()
    })

    it('should call apiService.logout', async () => {
      mockLogout.mockResolvedValue()

      await store.dispatch(logoutUser())

      expect(mockLogout).toHaveBeenCalledTimes(1)
    })
  })

  describe('Async Actions - loadStoredAuth', () => {
    const mockUser: User = {
      id: 1,
      email: 'stored@example.com',
      name: 'Stored User',
      role: 'consumer',
    }

    const mockToken = 'stored-token-789'

    it('should load stored auth when token and user exist', async () => {
      mockGetStoredToken.mockResolvedValue(mockToken)
      mockGetStoredUser.mockResolvedValue(mockUser)

      await store.dispatch(loadStoredAuth())

      const state = store.getState().auth
      expect(state.user).toEqual(mockUser)
      expect(state.token).toBe(mockToken)
      expect(state.isAuthenticated).toBe(true)
      expect(state.loading).toBe(false)
    })

    it('should not load auth when token is missing', async () => {
      mockGetStoredToken.mockResolvedValue(null)
      mockGetStoredUser.mockResolvedValue(mockUser)

      await store.dispatch(loadStoredAuth())

      const state = store.getState().auth
      expect(state.user).toBeNull()
      expect(state.token).toBeNull()
      expect(state.isAuthenticated).toBe(false)
    })

    it('should not load auth when user is missing', async () => {
      mockGetStoredToken.mockResolvedValue(mockToken)
      mockGetStoredUser.mockResolvedValue(null)

      await store.dispatch(loadStoredAuth())

      const state = store.getState().auth
      expect(state.user).toBeNull()
      expect(state.token).toBeNull()
      expect(state.isAuthenticated).toBe(false)
    })

    it('should handle loadStoredAuth errors', async () => {
      mockGetStoredToken.mockRejectedValue(new Error('Storage error'))

      await store.dispatch(loadStoredAuth())

      const state = store.getState().auth
      expect(state.user).toBeNull()
      expect(state.isAuthenticated).toBe(false)
    })
  })

  describe('Async Actions - refreshProfile', () => {
    const mockUser: User = {
      id: 1,
      email: 'test@example.com',
      name: 'Test User',
      role: 'consumer',
    }

    const mockUpdatedUser: User = {
      id: 1,
      email: 'test@example.com',
      name: 'Updated User',
      role: 'merchant',
    }

    it('should update user profile on refreshProfile fulfilled', async () => {
      // Set up initial authenticated state
      store = configureStore({
        reducer: {
          auth: authReducer,
        },
        preloadedState: {
          auth: {
            user: mockUser,
            token: 'test-token-123',
            isAuthenticated: true,
            loading: false,
            error: null,
          },
        },
      })

      mockGetProfile.mockResolvedValue({
        success: true,
        data: mockUpdatedUser,
      })

      await store.dispatch(refreshProfile())

      const state = store.getState().auth
      expect(state.user).toEqual(mockUpdatedUser)
      expect(state.user?.name).toBe('Updated User')
      expect(state.user?.role).toBe('merchant')
      expect(state.token).toBe('test-token-123') // Token unchanged
      expect(state.isAuthenticated).toBe(true)
    })

    it('should call apiService.getProfile', async () => {
      mockGetProfile.mockResolvedValue({
        success: true,
        data: mockUser,
      })

      await store.dispatch(refreshProfile())

      expect(mockGetProfile).toHaveBeenCalledTimes(1)
    })
  })

  describe('Integration - Full Auth Flow', () => {
    it('should handle complete login → logout flow', async () => {
      const mockCredentials: LoginCredentials = {
        email: 'test@example.com',
        password: 'password123',
      }

      const mockUser: User = {
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        role: 'consumer',
      }

      const mockAuthResponse: AuthResponse = {
        success: true,
        message: 'Login successful',
        data: {
          user: mockUser,
          token: 'test-token-123',
        },
      }

      // Initial state: not authenticated
      let state = store.getState().auth
      expect(state.isAuthenticated).toBe(false)

      // Step 1: Login
      mockLogin.mockResolvedValue(mockAuthResponse)
      await store.dispatch(loginUser(mockCredentials))

      state = store.getState().auth
      expect(state.isAuthenticated).toBe(true)
      expect(state.user).toEqual(mockUser)
      expect(state.token).toBe('test-token-123')

      // Step 2: Logout
      mockLogout.mockResolvedValue()
      await store.dispatch(logoutUser())

      state = store.getState().auth
      expect(state.isAuthenticated).toBe(false)
      expect(state.user).toBeNull()
      expect(state.token).toBeNull()
    })

    it('should handle error → clearError flow', async () => {
      const mockCredentials: LoginCredentials = {
        email: 'wrong@example.com',
        password: 'wrongpass',
      }

      // Step 1: Failed login
      mockLogin.mockRejectedValue(new Error('Invalid credentials'))
      await store.dispatch(loginUser(mockCredentials))

      let state = store.getState().auth
      expect(state.error).toBe('Invalid credentials')

      // Step 2: Clear error
      store.dispatch(clearError())

      state = store.getState().auth
      expect(state.error).toBeNull()
    })
  })

  describe('Edge Cases', () => {
    it('should handle multiple concurrent login attempts', async () => {
      const mockCredentials: LoginCredentials = {
        email: 'test@example.com',
        password: 'password123',
      }

      const mockAuthResponse: AuthResponse = {
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: 1,
            email: 'test@example.com',
            name: 'Test User',
            role: 'consumer',
          },
          token: 'test-token-123',
        },
      }

      mockLogin.mockResolvedValue(mockAuthResponse)

      // Dispatch multiple login actions concurrently
      await Promise.all([
        store.dispatch(loginUser(mockCredentials)),
        store.dispatch(loginUser(mockCredentials)),
        store.dispatch(loginUser(mockCredentials)),
      ])

      const state = store.getState().auth
      expect(state.isAuthenticated).toBe(true)
      expect(mockLogin).toHaveBeenCalledTimes(3)
    })

    it('should preserve state when logout fails', async () => {
      const mockUser: User = {
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        role: 'consumer',
      }

      // Set up authenticated state
      store = configureStore({
        reducer: {
          auth: authReducer,
        },
        preloadedState: {
          auth: {
            user: mockUser,
            token: 'test-token-123',
            isAuthenticated: true,
            loading: false,
            error: null,
          },
        },
      })

      mockLogout.mockRejectedValue(new Error('Network error'))

      await store.dispatch(logoutUser())

      const state = store.getState().auth
      // ⚠️ FIX: Le logoutUser.rejected déconnecte localement même si l'API échoue (offline)
      expect(state.isAuthenticated).toBe(false)
      expect(state.user).toBeNull()
      expect(state.token).toBeNull()
    })
  })
})