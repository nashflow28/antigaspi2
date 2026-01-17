import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import {
  DriverState,
  DeliveryDriver,
  Delivery,
  DriverStats,
  DriverEarningsResponse,
  DeliveryZone,
  DriverRegistrationPayload,
  DriverProfileUpdatePayload,
  DriverLocationPayload,
  DeliveryCompletionPayload,
} from '../../types'
import { driverService } from '../../services/driverService'

const initialState: DriverState = {
  profile: null,
  isDriver: false,
  availableDeliveries: [],
  activeDelivery: null,
  deliveryHistory: [],
  stats: null,
  earnings: null,
  zones: [],
  loading: false,
  profileLoading: false,
  statsLoading: false,
  earningsLoading: false,
  deliveriesLoading: false,
  error: null,
  isTrackingLocation: false,
}

// ============ ASYNC THUNKS ============

// === PROFILE ===

export const fetchDriverProfile = createAsyncThunk<
  { driver: DeliveryDriver; stats: any },
  void,
  { rejectValue: string }
>('driver/fetchProfile', async (_, { rejectWithValue }) => {
  try {
    const response = await driverService.getProfile()
    return response.data
  } catch (error: any) {
    if (error.response?.status === 404) {
      // Not a driver yet
      return rejectWithValue('NOT_A_DRIVER')
    }
    return rejectWithValue(error.response?.data?.message || 'Erreur lors de la récupération du profil')
  }
})

export const registerAsDriver = createAsyncThunk<
  DeliveryDriver,
  DriverRegistrationPayload,
  { rejectValue: string }
>('driver/register', async (data, { rejectWithValue }) => {
  try {
    const response = await driverService.register(data)
    return response.data
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Erreur lors de l\'inscription')
  }
})

export const updateDriverProfile = createAsyncThunk<
  DeliveryDriver,
  DriverProfileUpdatePayload,
  { rejectValue: string }
>('driver/updateProfile', async (data, { rejectWithValue }) => {
  try {
    const response = await driverService.updateProfile(data)
    return response.data
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Erreur lors de la mise à jour')
  }
})

// === AVAILABILITY ===

export const toggleDriverAvailability = createAsyncThunk<
  { is_available: boolean },
  void,
  { rejectValue: string }
>('driver/toggleAvailability', async (_, { rejectWithValue }) => {
  try {
    const response = await driverService.toggleAvailability()
    return response.data
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Erreur')
  }
})

export const updateDriverLocation = createAsyncThunk<
  { latitude: number; longitude: number; updated_at: string },
  DriverLocationPayload,
  { rejectValue: string }
>('driver/updateLocation', async (data, { rejectWithValue }) => {
  try {
    const response = await driverService.updateLocation(data)
    return response.data
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Erreur de localisation')
  }
})

// === STATS & EARNINGS ===

export const fetchDriverStats = createAsyncThunk<
  DriverStats,
  void,
  { rejectValue: string }
>('driver/fetchStats', async (_, { rejectWithValue }) => {
  try {
    const response = await driverService.getStats()
    return response.data
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Erreur')
  }
})

export const fetchDriverEarnings = createAsyncThunk<
  DriverEarningsResponse,
  { period?: string; page?: number; perPage?: number },
  { rejectValue: string }
>('driver/fetchEarnings', async (params, { rejectWithValue }) => {
  try {
    const response = await driverService.getEarnings(params.period, params.page, params.perPage)
    return response.data
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Erreur')
  }
})

// === DELIVERIES ===

export const fetchAvailableDeliveries = createAsyncThunk<
  Delivery[],
  void,
  { rejectValue: string }
>('driver/fetchAvailable', async (_, { rejectWithValue }) => {
  try {
    const response = await driverService.getAvailableDeliveries()
    return response.data
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Erreur')
  }
})

export const fetchActiveDelivery = createAsyncThunk<
  Delivery | null,
  void,
  { rejectValue: string }
>('driver/fetchActive', async (_, { rejectWithValue }) => {
  try {
    const response = await driverService.getActiveDelivery()
    return response.data
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Erreur')
  }
})

export const fetchDriverDeliveryHistory = createAsyncThunk<
  Delivery[],
  { page?: number; perPage?: number },
  { rejectValue: string }
>('driver/fetchHistory', async (params, { rejectWithValue }) => {
  try {
    const response = await driverService.getDeliveryHistory(params.page, params.perPage)
    return response.data.data // Paginated
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Erreur')
  }
})

// === DELIVERY ACTIONS ===

export const acceptDelivery = createAsyncThunk<
  Delivery,
  number,
  { rejectValue: string }
>('driver/acceptDelivery', async (deliveryId, { rejectWithValue }) => {
  try {
    const response = await driverService.acceptDelivery(deliveryId)
    return response.data
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Erreur')
  }
})

export const rejectDeliveryOffer = createAsyncThunk<
  void,
  { deliveryId: number; reason?: string },
  { rejectValue: string }
>('driver/rejectDelivery', async ({ deliveryId, reason }, { rejectWithValue }) => {
  try {
    await driverService.rejectDelivery(deliveryId, reason)
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Erreur')
  }
})

export const startPickup = createAsyncThunk<
  Delivery,
  number,
  { rejectValue: string }
>('driver/startPickup', async (deliveryId, { rejectWithValue }) => {
  try {
    const response = await driverService.startPickup(deliveryId)
    return response.data
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Erreur')
  }
})

export const confirmPickup = createAsyncThunk<
  Delivery,
  number,
  { rejectValue: string }
>('driver/confirmPickup', async (deliveryId, { rejectWithValue }) => {
  try {
    const response = await driverService.confirmPickup(deliveryId)
    return response.data
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Erreur')
  }
})

export const startDeliveryTrip = createAsyncThunk<
  Delivery,
  number,
  { rejectValue: string }
>('driver/startDelivery', async (deliveryId, { rejectWithValue }) => {
  try {
    const response = await driverService.startDelivery(deliveryId)
    return response.data
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Erreur')
  }
})

export const completeDelivery = createAsyncThunk<
  Delivery,
  { deliveryId: number; data: DeliveryCompletionPayload },
  { rejectValue: string }
>('driver/completeDelivery', async ({ deliveryId, data }, { rejectWithValue }) => {
  try {
    const response = await driverService.completeDelivery(deliveryId, data)
    return response.data
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Erreur')
  }
})

export const reportDeliveryFailure = createAsyncThunk<
  Delivery,
  { deliveryId: number; reason: string },
  { rejectValue: string }
>('driver/reportFailure', async ({ deliveryId, reason }, { rejectWithValue }) => {
  try {
    const response = await driverService.reportFailure(deliveryId, reason)
    return response.data
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Erreur')
  }
})

export const cancelDriverDelivery = createAsyncThunk<
  void,
  { deliveryId: number; reason: string },
  { rejectValue: string }
>('driver/cancelDelivery', async ({ deliveryId, reason }, { rejectWithValue }) => {
  try {
    await driverService.cancelDelivery(deliveryId, reason)
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Erreur')
  }
})

export const updateDeliveryLocation = createAsyncThunk<
  void,
  { deliveryId: number; data: DriverLocationPayload },
  { rejectValue: string }
>('driver/updateDeliveryLocation', async ({ deliveryId, data }, { rejectWithValue }) => {
  try {
    await driverService.updateDeliveryLocation(deliveryId, data)
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Erreur')
  }
})

// === ZONES ===

export const fetchDeliveryZones = createAsyncThunk<
  DeliveryZone[],
  string | undefined,
  { rejectValue: string }
>('driver/fetchZones', async (city, { rejectWithValue }) => {
  try {
    const response = await driverService.getZones(city)
    return response.data
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Erreur')
  }
})

// ============ SLICE ============

const driverSlice = createSlice({
  name: 'driver',
  initialState,
  reducers: {
    clearDriverError: (state) => {
      state.error = null
    },
    setIsTrackingLocation: (state, action: PayloadAction<boolean>) => {
      state.isTrackingLocation = action.payload
    },
    resetDriverState: (state) => {
      Object.assign(state, initialState)
    },
    // Update active delivery from WebSocket/push notification
    updateActiveDeliveryStatus: (state, action: PayloadAction<{ status: Delivery['status'] }>) => {
      if (state.activeDelivery) {
        state.activeDelivery.status = action.payload.status
      }
    },
    // Add new delivery offer to available list (from push)
    addDeliveryOffer: (state, action: PayloadAction<Delivery>) => {
      const exists = state.availableDeliveries.some(d => d.id === action.payload.id)
      if (!exists) {
        state.availableDeliveries.unshift(action.payload)
      }
    },
    // Remove delivery from available list
    removeDeliveryOffer: (state, action: PayloadAction<number>) => {
      state.availableDeliveries = state.availableDeliveries.filter(d => d.id !== action.payload)
    },
  },
  extraReducers: (builder) => {
    // Fetch profile
    builder
      .addCase(fetchDriverProfile.pending, (state) => {
        state.profileLoading = true
        state.error = null
      })
      .addCase(fetchDriverProfile.fulfilled, (state, action) => {
        state.profileLoading = false
        state.profile = action.payload.driver
        state.isDriver = true
      })
      .addCase(fetchDriverProfile.rejected, (state, action) => {
        state.profileLoading = false
        if (action.payload === 'NOT_A_DRIVER') {
          state.isDriver = false
          state.profile = null
        } else {
          state.error = action.payload || 'Erreur'
        }
      })

    // Register
    builder
      .addCase(registerAsDriver.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(registerAsDriver.fulfilled, (state, action) => {
        state.loading = false
        state.profile = action.payload
        state.isDriver = true
      })
      .addCase(registerAsDriver.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || 'Erreur'
      })

    // Update profile
    builder
      .addCase(updateDriverProfile.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(updateDriverProfile.fulfilled, (state, action) => {
        state.loading = false
        state.profile = action.payload
      })
      .addCase(updateDriverProfile.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || 'Erreur'
      })

    // Toggle availability
    builder
      .addCase(toggleDriverAvailability.fulfilled, (state, action) => {
        if (state.profile) {
          state.profile.is_available = action.payload.is_available
        }
      })

    // Update location
    builder
      .addCase(updateDriverLocation.fulfilled, (state, action) => {
        if (state.profile) {
          state.profile.current_latitude = action.payload.latitude
          state.profile.current_longitude = action.payload.longitude
          state.profile.last_location_update = action.payload.updated_at
        }
      })

    // Fetch stats
    builder
      .addCase(fetchDriverStats.pending, (state) => {
        state.statsLoading = true
      })
      .addCase(fetchDriverStats.fulfilled, (state, action) => {
        state.statsLoading = false
        state.stats = action.payload
      })
      .addCase(fetchDriverStats.rejected, (state, action) => {
        state.statsLoading = false
        state.error = action.payload || 'Erreur'
      })

    // Fetch earnings
    builder
      .addCase(fetchDriverEarnings.pending, (state) => {
        state.earningsLoading = true
      })
      .addCase(fetchDriverEarnings.fulfilled, (state, action) => {
        state.earningsLoading = false
        state.earnings = action.payload
      })
      .addCase(fetchDriverEarnings.rejected, (state, action) => {
        state.earningsLoading = false
        state.error = action.payload || 'Erreur'
      })

    // Fetch available deliveries
    builder
      .addCase(fetchAvailableDeliveries.pending, (state) => {
        state.deliveriesLoading = true
      })
      .addCase(fetchAvailableDeliveries.fulfilled, (state, action) => {
        state.deliveriesLoading = false
        state.availableDeliveries = action.payload
      })
      .addCase(fetchAvailableDeliveries.rejected, (state, action) => {
        state.deliveriesLoading = false
        state.error = action.payload || 'Erreur'
      })

    // Fetch active delivery
    builder
      .addCase(fetchActiveDelivery.pending, (state) => {
        state.deliveriesLoading = true
      })
      .addCase(fetchActiveDelivery.fulfilled, (state, action) => {
        state.deliveriesLoading = false
        state.activeDelivery = action.payload
      })
      .addCase(fetchActiveDelivery.rejected, (state, action) => {
        state.deliveriesLoading = false
        state.error = action.payload || 'Erreur'
      })

    // Fetch history
    builder
      .addCase(fetchDriverDeliveryHistory.pending, (state) => {
        state.deliveriesLoading = true
      })
      .addCase(fetchDriverDeliveryHistory.fulfilled, (state, action) => {
        state.deliveriesLoading = false
        state.deliveryHistory = action.payload
      })
      .addCase(fetchDriverDeliveryHistory.rejected, (state, action) => {
        state.deliveriesLoading = false
        state.error = action.payload || 'Erreur'
      })

    // Accept delivery
    builder
      .addCase(acceptDelivery.pending, (state) => {
        state.loading = true
      })
      .addCase(acceptDelivery.fulfilled, (state, action) => {
        state.loading = false
        state.activeDelivery = action.payload
        // Remove from available list
        state.availableDeliveries = state.availableDeliveries.filter(
          d => d.id !== action.payload.id
        )
      })
      .addCase(acceptDelivery.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || 'Erreur'
      })

    // Start pickup
    builder
      .addCase(startPickup.fulfilled, (state, action) => {
        state.activeDelivery = action.payload
      })

    // Confirm pickup
    builder
      .addCase(confirmPickup.fulfilled, (state, action) => {
        state.activeDelivery = action.payload
      })

    // Start delivery
    builder
      .addCase(startDeliveryTrip.fulfilled, (state, action) => {
        state.activeDelivery = action.payload
      })

    // Complete delivery
    builder
      .addCase(completeDelivery.pending, (state) => {
        state.loading = true
      })
      .addCase(completeDelivery.fulfilled, (state, action) => {
        state.loading = false
        state.activeDelivery = null
        // Add to history
        state.deliveryHistory.unshift(action.payload)
      })
      .addCase(completeDelivery.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || 'Erreur'
      })

    // Report failure
    builder
      .addCase(reportDeliveryFailure.fulfilled, (state, action) => {
        state.activeDelivery = null
        state.deliveryHistory.unshift(action.payload)
      })

    // Cancel delivery
    builder
      .addCase(cancelDriverDelivery.fulfilled, (state) => {
        state.activeDelivery = null
      })

    // Fetch zones
    builder
      .addCase(fetchDeliveryZones.fulfilled, (state, action) => {
        state.zones = action.payload
      })
  },
})

export const {
  clearDriverError,
  setIsTrackingLocation,
  resetDriverState,
  updateActiveDeliveryStatus,
  addDeliveryOffer,
  removeDeliveryOffer,
} = driverSlice.actions

export const driverReducer = driverSlice.reducer
export const driverInitialState = initialState
