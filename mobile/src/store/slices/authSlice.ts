import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { AuthState, User, LoginCredentials, RegisterData, AuthResponse, FirebaseLoginResponse, FirebaseRegisterData } from '../../types'
import apiService from '../../services/api'
import { clearAllFormCaches } from '../../hooks/usePersistedForm'
import { authLogger } from '../../utils/logger'

export const authInitialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  // Le SplashScreen est désormais piloté par AppNavigator (state `hydrated`).
  // Garder `loading` à false évite les régressions des tests Jest tout en
  // conservant l'affichage natif via le hook de navigation.
  loading: false,
  error: null,
}

// Actions asynchrones
export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials: LoginCredentials, { rejectWithValue }) => {
    try {
      const response = await apiService.login(credentials)
      return response
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  }
)

export const registerUser = createAsyncThunk(
  'auth/register',
  async (data: RegisterData, { rejectWithValue }) => {
    try {
      const response = await apiService.register(data)
      return response
    } catch (error: any) {
      // Preserve validation errors for detailed error display
      if (error.validationErrors) {
        return rejectWithValue({
          message: error.message,
          errors: error.validationErrors
        })
      }
      return rejectWithValue(error.message)
    }
  }
)

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await apiService.logout()
      // Clear all cached form data on logout for security
      await clearAllFormCaches()
    } catch (error: any) {
      // Still clear caches even if API logout fails
      await clearAllFormCaches()
      return rejectWithValue(error.message)
    }
  }
)

export const loadStoredAuth = createAsyncThunk(
  'auth/loadStored',
  async (_, { rejectWithValue }) => {
    try {
      // Importer au runtime pour éviter les dépendances circulaires
      const jwtModule: any = require('../../utils/jwtHelpers')
      const isTokenExpired = jwtModule?.isTokenExpired

      if (typeof isTokenExpired !== 'function') {
        throw new Error('jwtHelpers.isTokenExpired is not available')
      }

      const [token, user] = await Promise.all([
        apiService.getStoredToken(),
        apiService.getStoredUser(),
      ])

      if (token && user) {
        // Vérifier si le token est expiré AVANT de restaurer la session
        if (isTokenExpired(token)) {
          authLogger.warn('🔒 [Auth] Token expiré détecté au démarrage - nettoyage de la session')
          await apiService.clearStoredAuth()
          return null
        }

        authLogger.log('✅ [Auth] Session restaurée avec succès')
        return { token, user }
      }

      return null
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  }
)

export const refreshProfile = createAsyncThunk(
  'auth/refreshProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiService.getProfile()
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  }
)

// Firebase Phone Authentication - Login with Firebase ID token
export const loginWithFirebase = createAsyncThunk(
  'auth/loginWithFirebase',
  async (firebaseIdToken: string, { rejectWithValue }) => {
    try {
      const response = await apiService.firebaseLogin(firebaseIdToken)
      return response
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  }
)

// Firebase Phone Authentication - Register new user after phone verification
export const registerWithFirebase = createAsyncThunk(
  'auth/registerWithFirebase',
  async (data: FirebaseRegisterData, { rejectWithValue }) => {
    try {
      const response = await apiService.firebaseRegister(data)
      return response
    } catch (error: any) {
      if (error.validationErrors) {
        return rejectWithValue({
          message: error.message,
          errors: error.validationErrors
        })
      }
      return rejectWithValue(error.message)
    }
  }
)

const authSlice = createSlice({
  name: 'auth',
  initialState: authInitialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    clearAuth: (state) => {
      state.user = null
      state.token = null
      state.isAuthenticated = false
      state.error = null
      state.loading = false
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(loginUser.fulfilled, (state, action: PayloadAction<AuthResponse>) => {
        state.loading = false
        state.user = action.payload.data.user
        state.token = action.payload.data.token
        state.isAuthenticated = true
        state.error = null
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
        state.isAuthenticated = false
      })

      // Register
      .addCase(registerUser.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(registerUser.fulfilled, (state, action: PayloadAction<AuthResponse>) => {
        state.loading = false
        state.user = action.payload.data.user
        state.token = action.payload.data.token
        state.isAuthenticated = true
        state.error = null
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false
        // Ensure error is always a string to avoid React rendering issues
        const payload = action.payload
        if (typeof payload === 'string') {
          state.error = payload
        } else if (payload && typeof payload === 'object' && 'message' in payload) {
          state.error = (payload as any).message
        } else {
          state.error = 'Erreur lors de l\'inscription'
        }
        state.isAuthenticated = false
      })

      // Logout
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null
        state.token = null
        state.isAuthenticated = false
        state.loading = false
        state.error = null
      })
      // Forcer la déconnexion locale même en cas d'échec API pour la sécurité
      .addCase(logoutUser.rejected, (state, action) => {
        // Déconnexion locale forcée pour sécurité
        state.user = null
        state.token = null
        state.isAuthenticated = false
        state.loading = false
        state.error = (action.payload as string) ?? null
      })

      // Load stored auth
      // ✅ FIX: Activer le loading pendant la restauration pour éviter le flash de l'écran de connexion
      .addCase(loadStoredAuth.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(loadStoredAuth.fulfilled, (state, action) => {
        if (action.payload) {
          state.user = action.payload.user
          state.token = action.payload.token
          state.isAuthenticated = true
        }
        state.loading = false
      })
      .addCase(loadStoredAuth.rejected, (state) => {
        state.loading = false
        state.isAuthenticated = false
      })

      // Refresh profile
      .addCase(refreshProfile.fulfilled, (state, action: PayloadAction<User>) => {
        state.user = action.payload
      })

      // Firebase Login
      .addCase(loginWithFirebase.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(loginWithFirebase.fulfilled, (state, action) => {
        state.loading = false
        const payload = action.payload as FirebaseLoginResponse
        if (payload.status === 'success' && payload.user) {
          state.user = payload.user
          state.token = payload.token || null
          state.isAuthenticated = true
        }
        // If status is 'new_user', don't authenticate yet - let the screen handle navigation
        state.error = null
      })
      .addCase(loginWithFirebase.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
        state.isAuthenticated = false
      })

      // Firebase Register
      .addCase(registerWithFirebase.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(registerWithFirebase.fulfilled, (state, action) => {
        state.loading = false
        const payload = action.payload as FirebaseLoginResponse
        if (payload.status === 'success' && payload.user) {
          state.user = payload.user
          state.token = payload.token || null
          state.isAuthenticated = true
        }
        state.error = null
      })
      .addCase(registerWithFirebase.rejected, (state, action) => {
        state.loading = false
        const payload = action.payload
        if (typeof payload === 'string') {
          state.error = payload
        } else if (payload && typeof payload === 'object' && 'message' in payload) {
          state.error = (payload as any).message
        } else {
          state.error = 'Erreur lors de l\'inscription'
        }
        state.isAuthenticated = false
      })
  },
})

export const { clearError, clearAuth } = authSlice.actions
export const authReducer = authSlice.reducer
export default authReducer
