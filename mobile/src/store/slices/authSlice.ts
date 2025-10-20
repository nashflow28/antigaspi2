import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { AuthState, User, LoginCredentials, RegisterData, AuthResponse } from '../../types'
import apiService from '../../services/api'

export const authInitialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: true, // ⚠️ TEST 6: Forcer SplashScreen pour identifier si c'est lui qui freeze
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
      return rejectWithValue(error.message)
    }
  }
)

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await apiService.logout()
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  }
)

export const loadStoredAuth = createAsyncThunk(
  'auth/loadStored',
  async (_, { rejectWithValue }) => {
    try {
      const [token, user] = await Promise.all([
        apiService.getStoredToken(),
        apiService.getStoredUser(),
      ])

      if (token && user) {
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
        state.error = action.payload as string
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
      // ✅ FIX: Déconnexion locale même si l'appel API échoue (offline/network error)
      .addCase(logoutUser.rejected, (state) => {
        state.user = null
        state.token = null
        state.isAuthenticated = false
        state.loading = false
        state.error = null
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
  },
})

export const { clearError, clearAuth } = authSlice.actions
export const authReducer = authSlice.reducer
export default authReducer