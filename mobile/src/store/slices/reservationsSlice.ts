import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { ReservationsState, Reservation, ReservationCreationPayload, ReservationCreationResponse } from '../../types'
import apiService from '../../services/api'
import offlineService from '../../services/offlineService'
import { storeLogger } from '../../utils/logger'
import { validateSchema, ReservationSchema } from '../../utils/schemaValidator'

/**
 * BUG FIX #16: Validate and normalize reservation data from backend
 */
const validateReservation = (reservation: Reservation): Reservation => {
  // BUG FIX: Map quantity_reserved to quantity if missing (DB vs Model mismatch)
  const res: any = reservation
  if (res.quantity === undefined && res.quantity_reserved !== undefined) {
    res.quantity = res.quantity_reserved
  }

  if (__DEV__) {
    const validation = validateSchema(reservation, ReservationSchema)
    if (!validation.valid) {
      storeLogger.warn(
        `[Schema] Invalid reservation data (id: ${reservation?.id}):`,
        validation.errors.map((e) => `${e.field}: ${e.message}`).join(', ')
      )
    }
  }
  return reservation
}

const validateReservations = (reservations: Reservation[]): Reservation[] =>
  reservations.map(validateReservation)

export const reservationsInitialState: ReservationsState = {
  reservations: [],
  loading: false,
  error: null,
}

const RESERVATIONS_CACHE_KEY = 'reservations_list'
const reservationCacheKey = (id: number) => `reservation_${id}`

const safeSetCache = async <T>(key: string, value: T): Promise<void> => {
  try {
    await offlineService.setCache(key, value)
  } catch (error) {
    storeLogger.warn('Failed to set cache:', key, error)
  }
}

const safeGetCache = async <T>(key: string): Promise<T | null> => {
  try {
    return await offlineService.getCache<T>(key)
  } catch (error) {
    storeLogger.warn('Failed to get cache:', key, error)
    return null
  }
}

const isOffline = async (): Promise<boolean> => {
  try {
    return !(await offlineService.checkConnectivity())
  } catch {
    return !offlineService.getConnectivityStatus()
  }
}

// Actions asynchrones
export const createReservation = createAsyncThunk(
  'reservations/create',
  async (payload: ReservationCreationPayload, { rejectWithValue }) => {
    // Si offline, on pourrait queue l'action ici via offlineService
    // Pour l'instant on garde le comportement online-first par défaut
    // sauf si on veut supporter la création offline explicitement
    try {
      const response = await apiService.createReservation(payload)
      return response
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  }
)

export const fetchMyReservations = createAsyncThunk(
  'reservations/fetchMy',
  async (_, { rejectWithValue }) => {
    if (await isOffline()) {
      const cached = await safeGetCache<Reservation[]>(RESERVATIONS_CACHE_KEY)
      if (cached) {
        return cached
      }
    }

    try {
      const response = await apiService.getMyReservations()
      // BUG FIX #16: Validate backend data before processing
      const validated = validateReservations(response.data)
      await safeSetCache(RESERVATIONS_CACHE_KEY, validated)
      
      // Cache individual reservations too
      validated.forEach(res => {
        safeSetCache(reservationCacheKey(res.id), res)
      })
      
      return validated
    } catch (error: any) {
      const fallback = await safeGetCache<Reservation[]>(RESERVATIONS_CACHE_KEY)
      if (fallback) {
        return fallback
      }
      return rejectWithValue(error.message)
    }
  }
)

export const fetchReservation = createAsyncThunk(
  'reservations/fetch',
  async (id: number, { rejectWithValue }) => {
    const cacheKey = reservationCacheKey(id)

    if (await isOffline()) {
      const cached = await safeGetCache<Reservation>(cacheKey)
      if (cached) {
        return cached
      }
    }

    try {
      const response = await apiService.getReservation(id)
      // BUG FIX #16: Validate backend data before processing
      const validated = validateReservation(response.data)
      await safeSetCache(cacheKey, validated)
      return validated
    } catch (error: any) {
      const fallback = await safeGetCache<Reservation>(cacheKey)
      if (fallback) {
        return fallback
      }
      return rejectWithValue(error.message)
    }
  }
)

export const cancelReservation = createAsyncThunk(
  'reservations/cancel',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await apiService.cancelReservation(id)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  }
)

export const updateReservationQuantity = createAsyncThunk(
  'reservations/updateQuantity',
  async ({ id, quantity }: { id: number; quantity: number }, { rejectWithValue }) => {
    try {
      const response = await apiService.updateReservationQuantity(id, quantity)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  }
)

const reservationsSlice = createSlice({
  name: 'reservations',
  initialState: reservationsInitialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    // NOTE: Reducers offline retirés car offlineService désactivé pour compatibilité web
    // Si mode offline réimplémenté, ajouter: addOfflineReservation, markReservationSyncPending, clearPendingReservations
    updateReservation: (state, action: PayloadAction<Reservation>) => {
      const index = state.reservations.findIndex(r => r.id === action.payload.id)
      if (index !== -1) {
        state.reservations[index] = action.payload
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Create reservation
      .addCase(createReservation.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createReservation.fulfilled, (state, action: PayloadAction<ReservationCreationResponse>) => {
        state.loading = false
        const newReservation = action.payload.data
        // Éviter les doublons
        const existingIndex = state.reservations.findIndex(r => r.id === newReservation.id)
        if (existingIndex === -1) {
          state.reservations.unshift(newReservation)
        } else {
          state.reservations[existingIndex] = newReservation
        }
        state.error = null
      })
      .addCase(createReservation.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })

      // Fetch my reservations
      .addCase(fetchMyReservations.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchMyReservations.fulfilled, (state, action: PayloadAction<Reservation[]>) => {
        state.loading = false
        // Utiliser les données du serveur comme source de vérité
        // (pas de logique offline complexe puisque offlineService désactivé)
        state.reservations = action.payload
        state.error = null
      })
      .addCase(fetchMyReservations.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })

      // Fetch single reservation
      .addCase(fetchReservation.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchReservation.fulfilled, (state, action: PayloadAction<Reservation>) => {
        state.loading = false
        const existingIndex = state.reservations.findIndex(r => r.id === action.payload.id)
        if (existingIndex !== -1) {
          state.reservations[existingIndex] = action.payload
        } else {
          state.reservations.push(action.payload)
        }
        state.error = null
      })
      .addCase(fetchReservation.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })

      // Cancel reservation
      .addCase(cancelReservation.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(cancelReservation.fulfilled, (state, action: PayloadAction<Reservation>) => {
        state.loading = false
        const index = state.reservations.findIndex(r => r.id === action.payload.id)
        if (index !== -1) {
          // Utiliser spread operator au lieu de delete pour l'immutabilité Redux
          state.reservations[index] = {
            ...action.payload,
            pendingSync: false,
            pendingAction: undefined
          }
        }
        state.error = null
      })
      .addCase(cancelReservation.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })

      // Update reservation quantity
      .addCase(updateReservationQuantity.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(updateReservationQuantity.fulfilled, (state, action: PayloadAction<Reservation>) => {
        state.loading = false
        const index = state.reservations.findIndex(r => r.id === action.payload.id)
        if (index !== -1) {
          state.reservations[index] = action.payload
        }
        state.error = null
      })
      .addCase(updateReservationQuantity.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
  },
})

export const {
  clearError,
  updateReservation,
} = reservationsSlice.actions
export const reservationsReducer = reservationsSlice.reducer
export default reservationsReducer
