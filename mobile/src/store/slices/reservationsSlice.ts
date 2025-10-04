import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { ReservationsState, Reservation, ReservationCreationPayload, ReservationCreationResponse } from '../../types'
import apiService from '../../services/api'
// import offlineService from '../../services/offlineService' // Désactivé temporairement pour le web

const initialState: ReservationsState = {
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
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    addOfflineReservation: (state, action: PayloadAction<Reservation>) => {
      state.reservations.unshift(action.payload)
    },
    markReservationSyncPending: (
      state,
      action: PayloadAction<{ id: number; pendingAction: 'create' | 'update' | 'delete' }>
    ) => {
      const reservation = state.reservations.find(r => r.id === action.payload.id)
      if (reservation) {
        reservation.pendingSync = true
        reservation.pendingAction = action.payload.pendingAction
      }
    },
    clearPendingReservations: (state) => {
      state.reservations = state.reservations.filter(reservation => !reservation.pendingSync)
    },
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
        state.reservations.unshift(action.payload.data)
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
          state.reservations[index] = action.payload
          state.reservations[index].pendingSync = false
          delete state.reservations[index].pendingAction
        }
      })
  },
})

export const {
  clearError,
  addOfflineReservation,
  markReservationSyncPending,
  clearPendingReservations,
  updateReservation,
} = reservationsSlice.actions
export default reservationsSlice.reducer
