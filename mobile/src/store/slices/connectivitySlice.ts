import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface ConnectivityState {
  isOnline: boolean
  lastChangeAt: string | null
  isSyncing: boolean
  pendingActions: number
  lastSyncError: string | null
}

export const connectivityInitialState: ConnectivityState = {
  isOnline: true,
  lastChangeAt: null,
  isSyncing: false,
  pendingActions: 0,
  lastSyncError: null,
}

const connectivitySlice = createSlice({
  name: 'connectivity',
  initialState: connectivityInitialState,
  reducers: {
    setConnectivity: (state, action: PayloadAction<boolean>) => {
      state.isOnline = action.payload
      state.lastChangeAt = new Date().toISOString()
    },
    setSyncQueueSize: (state, action: PayloadAction<number>) => {
      state.pendingActions = action.payload
    },
    setSyncStatus: (state, action: PayloadAction<{ isSyncing: boolean }>) => {
      state.isSyncing = action.payload.isSyncing
      if (!action.payload.isSyncing) {
        state.lastSyncError = null
      }
    },
    setSyncError: (state, action: PayloadAction<string | null>) => {
      state.lastSyncError = action.payload
    },
  },
})

export const { setConnectivity, setSyncQueueSize, setSyncStatus, setSyncError } = connectivitySlice.actions
export const connectivityReducer = connectivitySlice.reducer
export default connectivityReducer
