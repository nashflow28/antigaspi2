import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit'
import { ActivityItem, ActivityState } from '../../types'
import apiService from '../../services/api'
import offlineService from '../../services/offlineService'
import type { RootState } from '..'

const ACTIVITY_CACHE_KEY = 'activity'

interface FetchActivityParams {
  limit?: number
  types?: string[]
}

interface ActivityCachePayload {
  items: ActivityItem[]
  generatedAt: string
}

const initialState: ActivityState = {
  items: [],
  loading: false,
  error: null,
  lastSyncedAt: null,
  filters: {
    types: [],
  },
}

const saveCache = async (payload: ActivityCachePayload): Promise<void> => {
  try {
    await offlineService.setCache(ACTIVITY_CACHE_KEY, payload)
  } catch (error) {
    console.warn('Impossible de mettre en cache le flux activité', error)
  }
}

const loadCache = async (): Promise<ActivityCachePayload | null> => {
  try {
    return await offlineService.getCache<ActivityCachePayload>(ACTIVITY_CACHE_KEY)
  } catch (error) {
    console.warn('Impossible de charger le cache activité', error)
    return null
  }
}

export const fetchActivityFeed = createAsyncThunk<
  ActivityCachePayload,
  FetchActivityParams | undefined,
  { rejectValue: string }
>('activity/fetchFeed', async (params, { rejectWithValue }) => {
  const isOnline = await offlineService.checkConnectivity().catch(() => offlineService.getConnectivityStatus())

  if (!isOnline) {
    const cached = await loadCache()
    if (cached) {
      return cached
    }
  }

  try {
    const response = await apiService.getActivityFeed(params)
    const payload: ActivityCachePayload = {
      items: response.items,
      generatedAt: response.generated_at,
    }

    await saveCache(payload)
    return payload
  } catch (error: any) {
    const cached = await loadCache()
    if (cached) {
      return cached
    }

    return rejectWithValue(error?.message || "Impossible de récupérer l'activité")
  }
})

export const logActivityEvent = createAsyncThunk<
  ActivityCachePayload,
  {
    type: string
    title: string
    description?: string
    metadata?: Record<string, unknown>
    activity_at?: string
  },
  { rejectValue: string; state: RootState }
>('activity/logEvent', async (payload, { rejectWithValue, getState }) => {
  try {
    const response = await apiService.logCustomActivity(payload)
    const { activity } = getState() as RootState
    const updatedItems = upsertActivities(activity.items, [response])
    const generatedAt = new Date().toISOString()

    await saveCache({ items: updatedItems, generatedAt })

    return { items: updatedItems, generatedAt }
  } catch (error: any) {
    return rejectWithValue(error?.message || "Impossible d'enregistrer l'activité")
  }
})

export const markActivityRead = createAsyncThunk<
  ActivityCachePayload,
  number,
  { rejectValue: string; state: RootState }
>('activity/markRead', async (activityId, { rejectWithValue, getState }) => {
  try {
    const response = await apiService.markActivityAsRead(activityId)
    const { activity } = getState() as RootState
    const updatedItems = activity.items.map(item =>
      item.id === response.id
        ? { ...item, ...response, is_read: true, timestamp: response.timestamp || item.timestamp }
        : item
    )
    const generatedAt = activity.lastSyncedAt ?? new Date().toISOString()

    await saveCache({ items: updatedItems, generatedAt })

    return { items: updatedItems, generatedAt }
  } catch (error: any) {
    return rejectWithValue(error?.message || "Impossible de mettre à jour l'activité")
  }
})

const upsertActivities = (items: ActivityItem[], incoming: ActivityItem[]): ActivityItem[] => {
  const map = new Map<string, ActivityItem>()

  for (const item of items) {
    map.set(item.id, item)
  }

  for (const item of incoming) {
    map.set(item.id, item)
  }

  return Array.from(map.values()).sort((a, b) => b.timestamp.localeCompare(a.timestamp))
}

const activitySlice = createSlice({
  name: 'activity',
  initialState,
  reducers: {
    setActivityFilters: (state, action: PayloadAction<string[]>) => {
      state.filters.types = action.payload
    },
    hydrateFromCache: (state, action: PayloadAction<ActivityCachePayload>) => {
      state.items = action.payload.items
      state.lastSyncedAt = action.payload.generatedAt
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchActivityFeed.pending, state => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchActivityFeed.fulfilled, (state, action) => {
        state.loading = false
        state.items = action.payload.items
        state.lastSyncedAt = action.payload.generatedAt
        state.error = null
      })
      .addCase(fetchActivityFeed.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || "Impossible de récupérer l'activité"
      })
      .addCase(logActivityEvent.pending, state => {
        state.error = null
      })
      .addCase(logActivityEvent.fulfilled, (state, action) => {
        state.items = action.payload.items
        state.lastSyncedAt = action.payload.generatedAt
      })
      .addCase(logActivityEvent.rejected, (state, action) => {
        state.error = action.payload || "Impossible d'enregistrer l'activité"
      })
      .addCase(markActivityRead.pending, state => {
        state.error = null
      })
      .addCase(markActivityRead.fulfilled, (state, action) => {
        state.items = action.payload.items
        state.lastSyncedAt = action.payload.generatedAt
      })
      .addCase(markActivityRead.rejected, (state, action) => {
        state.error = action.payload || "Impossible de mettre à jour l'activité"
      })
  },
})

export const { setActivityFilters, hydrateFromCache } = activitySlice.actions
export const activityReducer = activitySlice.reducer
export default activityReducer
