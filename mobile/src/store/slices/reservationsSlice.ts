import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { ReservationsState, Reservation, ReservationCreationPayload, ReservationCreationResponse } from '../../types'
import apiService from '../../services/api'

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
        state.reservations = action.payload
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
        }
      })
  },
})

export const { clearError, updateReservation } = reservationsSlice.actions
export default reservationsSlice.reducer