import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { ReservationsState, Reservation, ReservationCreationPayload, ReservationCreationResponse } from '../../types'
import apiService from '../../services/api'
// import offlineService from '../../services/offlineService' // Désactivé temporairement pour le web

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
        const pendingReservations = state.reservations.filter(reservation => reservation.pendingSync)
        const remoteReservations = action.payload.filter(reservation =>
          !pendingReservations.some(pending => pending.id === reservation.id)
        )
        state.reservations = [...pendingReservations, ...remoteReservations]
        state.error = null
      })
      .addCase(fetchMyReservations.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })

      // Fetch single reservation
      .addCase(fetchReservation.fulfilled, (state, action: PayloadAction<Reservation>) => {
        const existingIndex = state.reservations.findIndex(r => r.id === action.payload.id)
        if (existingIndex !== -1) {
          state.reservations[existingIndex] = action.payload
        } else {
          state.reservations.push(action.payload)
        }
      })

      // Cancel reservation
      .addCase(cancelReservation.fulfilled, (state, action: PayloadAction<Reservation>) => {
        const index = state.reservations.findIndex(r => r.id === action.payload.id)
        if (index !== -1) {
          // Utiliser spread operator au lieu de delete pour l'immutabilité Redux
          state.reservations[index] = {
            ...action.payload,
            pendingSync: false,
            pendingAction: undefined
          }
        }
      })
  },
})

export const {
  clearError,
  updateReservation,
} = reservationsSlice.actions
export const reservationsReducer = reservationsSlice.reducer
export default reservationsReducer
