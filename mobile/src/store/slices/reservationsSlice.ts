import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { ReservationsState, Reservation, ReservationCreationPayload, ReservationCreationResponse } from '../../types'
import apiService from '../../services/api'
// NOTE: offlineService retiré - Service offline désactivé pour compatibilité web

export const reservationsInitialState: ReservationsState = {
  reservations: [],
  loading: false,
  error: null,
}

// Actions asynchrones
export const createReservation = createAsyncThunk(
  'reservations/create',
  async (payload: ReservationCreationPayload, { rejectWithValue }) => {
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
    try {
      const response = await apiService.getMyReservations()
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.message)
    }
  }
)

export const fetchReservation = createAsyncThunk(
  'reservations/fetch',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await apiService.getReservation(id)
      return response.data
    } catch (error: any) {
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
  },
})

export const {
  clearError,
  updateReservation,
} = reservationsSlice.actions
export const reservationsReducer = reservationsSlice.reducer
export default reservationsReducer
