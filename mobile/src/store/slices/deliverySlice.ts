import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import {
  Delivery,
  DeliveryEstimate,
  DeliveryTrackingData,
  DeliveryZone,
} from '../../types'
import { deliveryService } from '../../services/deliveryService'

interface ConsumerDeliveryState {
  // Active delivery
  activeDelivery: Delivery | null
  // Delivery history
  deliveryHistory: Delivery[]
  // Tracking data (includes driver position, ETA, etc.)
  trackingData: DeliveryTrackingData | null
  // Fee estimate
  estimate: DeliveryEstimate | null
  // Delivery zones
  zones: DeliveryZone[]
  // Loading states
  loading: boolean
  trackingLoading: boolean
  estimateLoading: boolean
  requestLoading: boolean
  historyLoading: boolean
  // Error
  error: string | null
}

const initialState: ConsumerDeliveryState = {
  activeDelivery: null,
  deliveryHistory: [],
  trackingData: null,
  estimate: null,
  zones: [],
  loading: false,
  trackingLoading: false,
  estimateLoading: false,
  requestLoading: false,
  historyLoading: false,
  error: null,
}

// ============ ASYNC THUNKS ============

// Get delivery zones
export const fetchDeliveryZones = createAsyncThunk<
  DeliveryZone[],
  string | undefined,
  { rejectValue: string }
>('delivery/fetchZones', async (city, { rejectWithValue }) => {
  try {
    const response = await deliveryService.getZones(city)
    return response.data
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Erreur lors de la récupération des zones')
  }
})

// Estimate delivery fee for a reservation
export const estimateDelivery = createAsyncThunk<
  DeliveryEstimate,
  {
    reservation_id: number
    delivery_latitude: number
    delivery_longitude: number
  },
  { rejectValue: string }
>('delivery/estimate', async (params, { rejectWithValue }) => {
  try {
    const response = await deliveryService.estimateForReservation(
      params.reservation_id,
      params.delivery_latitude,
      params.delivery_longitude
    )
    return response.data
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || "Erreur lors de l'estimation")
  }
})

// Request delivery for a reservation
export const requestDelivery = createAsyncThunk<
  Delivery,
  {
    reservation_id: number
    delivery_address: string
    delivery_latitude: number
    delivery_longitude: number
    delivery_instructions?: string
    recipient_name: string
    recipient_phone: string
  },
  { rejectValue: string }
>('delivery/request', async (data, { rejectWithValue }) => {
  try {
    const response = await deliveryService.requestDelivery(data.reservation_id, {
      delivery_address: data.delivery_address,
      delivery_latitude: data.delivery_latitude,
      delivery_longitude: data.delivery_longitude,
      delivery_instructions: data.delivery_instructions,
      recipient_name: data.recipient_name,
      recipient_phone: data.recipient_phone,
    })
    return response.data
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Erreur lors de la demande de livraison')
  }
})

// Get delivery details
export const fetchDeliveryDetails = createAsyncThunk<
  Delivery,
  number,
  { rejectValue: string }
>('delivery/fetchDetails', async (deliveryId, { rejectWithValue }) => {
  try {
    const response = await deliveryService.getDelivery(deliveryId)
    return response.data
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Erreur lors de la récupération')
  }
})

// Track delivery in real-time
export const fetchDeliveryTracking = createAsyncThunk<
  DeliveryTrackingData,
  number,
  { rejectValue: string }
>('delivery/track', async (deliveryId, { rejectWithValue }) => {
  try {
    const response = await deliveryService.trackDelivery(deliveryId)
    return response.data
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Erreur de suivi')
  }
})

// Cancel delivery
export const cancelDelivery = createAsyncThunk<
  Delivery,
  number,
  { rejectValue: string }
>('delivery/cancel', async (deliveryId, { rejectWithValue }) => {
  try {
    const response = await deliveryService.cancelDelivery(deliveryId, 'Annulation par le client')
    return response.data
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || "Erreur lors de l'annulation")
  }
})

// Rate delivery
export const rateDelivery = createAsyncThunk<
  Delivery,
  { deliveryId: number; rating: number; comment?: string },
  { rejectValue: string }
>('delivery/rate', async ({ deliveryId, rating, comment }, { rejectWithValue }) => {
  try {
    const response = await deliveryService.rateDelivery(deliveryId, {
      consumer_rating: rating,
      consumer_feedback: comment,
    })
    return response.data
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Erreur lors de la notation')
  }
})

// Fetch delivery history
export const fetchDeliveryHistory = createAsyncThunk<
  Delivery[],
  { page?: number; perPage?: number },
  { rejectValue: string }
>('delivery/fetchHistory', async (params, { rejectWithValue }) => {
  try {
    const response = await deliveryService.getHistory(params.page, params.perPage)
    return response.data.data // Paginated data
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || "Erreur lors de la récupération de l'historique")
  }
})

// ============ SLICE ============

const deliverySlice = createSlice({
  name: 'delivery',
  initialState,
  reducers: {
    clearDeliveryError: (state) => {
      state.error = null
    },
    clearEstimate: (state) => {
      state.estimate = null
    },
    clearTrackingData: (state) => {
      state.trackingData = null
    },
    setActiveDelivery: (state, action: PayloadAction<Delivery | null>) => {
      state.activeDelivery = action.payload
    },
    updateDeliveryStatus: (state, action: PayloadAction<{ id: number; status: Delivery['status'] }>) => {
      const { id, status } = action.payload
      if (state.activeDelivery?.id === id) {
        state.activeDelivery.status = status
      }
      const historyIndex = state.deliveryHistory.findIndex((d) => d.id === id)
      if (historyIndex >= 0) {
        state.deliveryHistory[historyIndex].status = status
      }
    },
    // Real-time tracking update (from WebSocket/polling)
    updateDriverPosition: (
      state,
      action: PayloadAction<{ latitude: number; longitude: number; updated_at: string }>
    ) => {
      if (state.trackingData) {
        state.trackingData.driver_position = action.payload
      }
    },
  },
  extraReducers: (builder) => {
    // Fetch zones
    builder
      .addCase(fetchDeliveryZones.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchDeliveryZones.fulfilled, (state, action) => {
        state.loading = false
        state.zones = action.payload
      })
      .addCase(fetchDeliveryZones.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || 'Erreur'
      })

    // Estimate delivery
    builder
      .addCase(estimateDelivery.pending, (state) => {
        state.estimateLoading = true
        state.error = null
      })
      .addCase(estimateDelivery.fulfilled, (state, action) => {
        state.estimateLoading = false
        state.estimate = action.payload
      })
      .addCase(estimateDelivery.rejected, (state, action) => {
        state.estimateLoading = false
        state.error = action.payload || 'Erreur'
      })

    // Request delivery
    builder
      .addCase(requestDelivery.pending, (state) => {
        state.requestLoading = true
        state.error = null
      })
      .addCase(requestDelivery.fulfilled, (state, action) => {
        state.requestLoading = false
        state.activeDelivery = action.payload
      })
      .addCase(requestDelivery.rejected, (state, action) => {
        state.requestLoading = false
        state.error = action.payload || 'Erreur'
      })

    // Fetch details
    builder
      .addCase(fetchDeliveryDetails.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchDeliveryDetails.fulfilled, (state, action) => {
        state.loading = false
        state.activeDelivery = action.payload
      })
      .addCase(fetchDeliveryDetails.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || 'Erreur'
      })

    // Track delivery
    builder
      .addCase(fetchDeliveryTracking.pending, (state) => {
        state.trackingLoading = true
        state.error = null
      })
      .addCase(fetchDeliveryTracking.fulfilled, (state, action) => {
        state.trackingLoading = false
        state.trackingData = action.payload
        state.activeDelivery = action.payload.delivery
      })
      .addCase(fetchDeliveryTracking.rejected, (state, action) => {
        state.trackingLoading = false
        state.error = action.payload || 'Erreur'
      })

    // Cancel delivery
    builder
      .addCase(cancelDelivery.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(cancelDelivery.fulfilled, (state, action) => {
        state.loading = false
        state.activeDelivery = action.payload
      })
      .addCase(cancelDelivery.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || 'Erreur'
      })

    // Rate delivery
    builder
      .addCase(rateDelivery.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(rateDelivery.fulfilled, (state, action) => {
        state.loading = false
        if (state.activeDelivery?.id === action.payload.id) {
          state.activeDelivery = action.payload
        }
        // Update in history too
        const historyIndex = state.deliveryHistory.findIndex((d) => d.id === action.payload.id)
        if (historyIndex >= 0) {
          state.deliveryHistory[historyIndex] = action.payload
        }
      })
      .addCase(rateDelivery.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || 'Erreur'
      })

    // Fetch history
    builder
      .addCase(fetchDeliveryHistory.pending, (state) => {
        state.historyLoading = true
        state.error = null
      })
      .addCase(fetchDeliveryHistory.fulfilled, (state, action) => {
        state.historyLoading = false
        state.deliveryHistory = action.payload
      })
      .addCase(fetchDeliveryHistory.rejected, (state, action) => {
        state.historyLoading = false
        state.error = action.payload || 'Erreur'
      })
  },
})

export const {
  clearDeliveryError,
  clearEstimate,
  clearTrackingData,
  setActiveDelivery,
  updateDeliveryStatus,
  updateDriverPosition,
} = deliverySlice.actions

export const deliveryReducer = deliverySlice.reducer
export const deliveryInitialState = initialState
