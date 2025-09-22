import React, { useEffect } from 'react'
import { View } from 'react-native'
import { Provider, useDispatch, useSelector } from 'react-redux'
import AppNavigator from './src/navigation/AppNavigator'
import { store, AppDispatch, RootState } from './src/store'
import offlineService from './src/services/offlineService'
import ConnectivityBanner from './src/components/ConnectivityBanner'
import {
  setConnectivity,
  setSyncQueueSize,
  setSyncStatus,
  setSyncError,
} from './src/store/slices/connectivitySlice'
import {
  clearPendingReservations,
  fetchMyReservations,
} from './src/store/slices/reservationsSlice'

const AppContent: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>()
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated)

  useEffect(() => {
    let mounted = true

    const initialize = async () => {
      const status = await offlineService.checkConnectivity()
      if (mounted) {
        dispatch(setConnectivity(status))
        dispatch(setSyncQueueSize(offlineService.getSyncQueueLength()))
      }
    }

    initialize()

    const handleConnectivityChange = (status: boolean) => {
      dispatch(setConnectivity(status))
      if (status) {
        offlineService.processSyncQueue()
      }
    }

    const handleQueueUpdate = (size: number) => {
      dispatch(setSyncQueueSize(size))
    }

    const handleSyncStart = (length: number) => {
      dispatch(setSyncStatus({ isSyncing: true }))
      dispatch(setSyncQueueSize(length))
    }

    const handleSyncError = ({ error }: { error?: Error }) => {
      dispatch(setSyncStatus({ isSyncing: false }))
      dispatch(setSyncError(error?.message || 'Synchronisation impossible'))
    }

    const handleSyncComplete = ({ success, remaining }: { success: boolean; remaining: number }) => {
      dispatch(setSyncStatus({ isSyncing: false }))
      dispatch(setSyncQueueSize(remaining))
      if (success) {
        dispatch(setSyncError(null))
        if (isAuthenticated) {
          dispatch(clearPendingReservations())
          dispatch(fetchMyReservations())
        }
      }
    }

    offlineService.on('connectivity-change', handleConnectivityChange)
    offlineService.on('sync-queue-updated', handleQueueUpdate)
    offlineService.on('sync-start', handleSyncStart)
    offlineService.on('sync-error', handleSyncError)
    offlineService.on('sync-complete', handleSyncComplete)

    return () => {
      mounted = false
      offlineService.off('connectivity-change', handleConnectivityChange)
      offlineService.off('sync-queue-updated', handleQueueUpdate)
      offlineService.off('sync-start', handleSyncStart)
      offlineService.off('sync-error', handleSyncError)
      offlineService.off('sync-complete', handleSyncComplete)
    }
  }, [dispatch, isAuthenticated])

  return (
    <View style={{ flex: 1 }}>
      <ConnectivityBanner />
      <AppNavigator />
    </View>
  )
}

export default function App() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  )
}
