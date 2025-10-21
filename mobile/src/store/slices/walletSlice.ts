import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit'
import { WalletState, WalletSummary, WalletTransactionSummary } from '../../types'
import apiService from '../../services/api'
import offlineService from '../../services/offlineService'
import type { RootState } from '..'

const WALLET_SUMMARY_CACHE_KEY = 'wallet'
const WALLET_TRANSACTIONS_CACHE_KEY = 'walletTransactions'

type WalletSummaryCache = {
  summary: WalletSummary
  syncedAt: string
}

type WalletTransactionsCache = {
  transactions: WalletTransactionSummary[]
  pagination: Record<string, unknown> | null
  syncedAt: string
}

const initialState: WalletState = {
  summary: null,
  transactions: [],
  loading: false,
  transactionsLoading: false,
  error: null,
  lastSyncedAt: null,
  transactionsMeta: null,
  transactionsSyncedAt: null,
}

const saveSummaryCache = async (payload: WalletSummaryCache): Promise<void> => {
  try {
    await offlineService.setCache(WALLET_SUMMARY_CACHE_KEY, payload)
  } catch (error) {
    console.warn('Impossible de mettre en cache le portefeuille', error)
  }
}

const loadSummaryCache = async (): Promise<WalletSummaryCache | null> => {
  try {
    return await offlineService.getCache<WalletSummaryCache>(WALLET_SUMMARY_CACHE_KEY)
  } catch (error) {
    console.warn('Impossible de charger le cache portefeuille', error)
    return null
  }
}

const saveTransactionsCache = async (payload: WalletTransactionsCache): Promise<void> => {
  try {
    await offlineService.setCache(WALLET_TRANSACTIONS_CACHE_KEY, payload)
  } catch (error) {
    console.warn('Impossible de mettre en cache les transactions portefeuille', error)
  }
}

const loadTransactionsCache = async (): Promise<WalletTransactionsCache | null> => {
  try {
    return await offlineService.getCache<WalletTransactionsCache>(WALLET_TRANSACTIONS_CACHE_KEY)
  } catch (error) {
    console.warn('Impossible de charger le cache transactions portefeuille', error)
    return null
  }
}

export const fetchWalletSummary = createAsyncThunk<
  WalletSummaryCache,
  void,
  { rejectValue: string }
>('wallet/fetchSummary', async (_, { rejectWithValue }) => {
  const isOnline = await offlineService.checkConnectivity().catch(() => offlineService.getConnectivityStatus())

  if (!isOnline) {
    const cached = await loadSummaryCache()
    if (cached) {
      return cached
    }
  }

  try {
    const summary = await apiService.getWalletSummary()
    const payload: WalletSummaryCache = {
      summary,
      syncedAt: new Date().toISOString(),
    }
    await saveSummaryCache(payload)
    return payload
  } catch (error: any) {
    const cached = await loadSummaryCache()
    if (cached) {
      return cached
    }

    return rejectWithValue(error?.message || 'Impossible de récupérer le portefeuille')
  }
})

export const fetchWalletTransactions = createAsyncThunk<
  WalletTransactionsCache,
  { perPage?: number; type?: 'credit' | 'debit' } | undefined,
  { rejectValue: string }
>('wallet/fetchTransactions', async (params, { rejectWithValue }) => {
  const isOnline = await offlineService.checkConnectivity().catch(() => offlineService.getConnectivityStatus())

  if (!isOnline) {
    const cached = await loadTransactionsCache()
    if (cached) {
      return cached
    }
  }

  try {
    const response = await apiService.getWalletTransactions(params)
    const payload: WalletTransactionsCache = {
      transactions: response.transactions,
      pagination: response.pagination,
      syncedAt: new Date().toISOString(),
    }
    await saveTransactionsCache(payload)
    return payload
  } catch (error: any) {
    const cached = await loadTransactionsCache()
    if (cached) {
      return cached
    }

    return rejectWithValue(error?.message || 'Impossible de récupérer les transactions portefeuille')
  }
})

export const toggleWalletStatus = createAsyncThunk<
  boolean,
  boolean,
  { rejectValue: string }
>('wallet/toggleStatus', async (isActive, { rejectWithValue }) => {
  try {
    return await apiService.updateWalletStatus(isActive)
  } catch (error: any) {
    return rejectWithValue(error?.message || 'Impossible de mettre à jour le statut du portefeuille')
  }
})

export const updateWalletDailyLimit = createAsyncThunk<
  WalletSummary,
  number,
  { rejectValue: string; state: RootState }
>('wallet/updateDailyLimit', async (dailyLimit, { rejectWithValue, getState }) => {
  try {
    const limitUpdate = await apiService.updateWalletDailyLimit(dailyLimit)
    const currentSummary = (getState() as RootState).wallet.summary

    if (currentSummary) {
      return {
        ...currentSummary,
        daily_limit: limitUpdate.daily_limit,
        remaining_daily_limit: limitUpdate.remaining_daily_limit,
      }
    }

    const refreshedSummary = await apiService.getWalletSummary()
    return {
      ...refreshedSummary,
      daily_limit: limitUpdate.daily_limit,
      remaining_daily_limit: limitUpdate.remaining_daily_limit,
    }
  } catch (error: any) {
    return rejectWithValue(error?.message || 'Impossible de mettre à jour la limite quotidienne')
  }
})

export const setWalletPin = createAsyncThunk<
  boolean,
  string,
  { rejectValue: string }
>('wallet/setPin', async (pin, { rejectWithValue }) => {
  try {
    return await apiService.setWalletPin(pin)
  } catch (error: any) {
    return rejectWithValue(error?.message || "Impossible d'activer le code PIN")
  }
})

export const changeWalletPin = createAsyncThunk<
  boolean,
  { currentPin: string; newPin: string },
  { rejectValue: string }
>('wallet/changePin', async ({ currentPin, newPin }, { rejectWithValue }) => {
  try {
    return await apiService.changeWalletPin(currentPin, newPin)
  } catch (error: any) {
    return rejectWithValue(error?.message || 'Impossible de modifier le code PIN')
  }
})

const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    resetWalletError: state => {
      state.error = null
    },
    hydrateWalletFromCache: (
      state,
      action: PayloadAction<{ summary?: WalletSummaryCache | null; transactions?: WalletTransactionsCache | null }>
    ) => {
      if (action.payload.summary) {
        state.summary = action.payload.summary.summary
        state.lastSyncedAt = action.payload.summary.syncedAt
      }

      if (action.payload.transactions) {
        state.transactions = action.payload.transactions.transactions
        state.transactionsMeta = action.payload.transactions.pagination ?? null
        state.transactionsSyncedAt = action.payload.transactions.syncedAt
      }
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchWalletSummary.pending, state => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchWalletSummary.fulfilled, (state, action) => {
        state.loading = false
        state.summary = action.payload.summary
        state.lastSyncedAt = action.payload.syncedAt
      })
      .addCase(fetchWalletSummary.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || 'Impossible de récupérer le portefeuille'
      })
      .addCase(fetchWalletTransactions.pending, state => {
        state.transactionsLoading = true
        state.error = null
      })
      .addCase(fetchWalletTransactions.fulfilled, (state, action) => {
        state.transactionsLoading = false
        state.transactions = action.payload.transactions
        state.transactionsMeta = action.payload.pagination ?? null
        state.transactionsSyncedAt = action.payload.syncedAt
      })
      .addCase(fetchWalletTransactions.rejected, (state, action) => {
        state.transactionsLoading = false
        state.error = action.payload || 'Impossible de récupérer les transactions portefeuille'
      })
      .addCase(toggleWalletStatus.fulfilled, (state, action) => {
        if (state.summary) {
          state.summary = {
            ...state.summary,
            is_active: action.payload,
          }
          saveSummaryCache({ summary: state.summary, syncedAt: new Date().toISOString() }).catch(() => null)
        }
      })
      .addCase(updateWalletDailyLimit.fulfilled, (state, action) => {
        state.summary = action.payload
        state.lastSyncedAt = new Date().toISOString()
        saveSummaryCache({ summary: state.summary, syncedAt: state.lastSyncedAt }).catch(() => null)
      })
      .addCase(setWalletPin.fulfilled, (state, action) => {
        if (state.summary && action.payload) {
          state.summary = {
            ...state.summary,
            has_pin: true,
          }
          saveSummaryCache({ summary: state.summary, syncedAt: new Date().toISOString() }).catch(() => null)
        }
      })
      .addCase(changeWalletPin.fulfilled, (state, action) => {
        if (state.summary && action.payload) {
          state.summary = {
            ...state.summary,
            has_pin: true,
          }
          saveSummaryCache({ summary: state.summary, syncedAt: new Date().toISOString() }).catch(() => null)
        }
      })
  },
})

export const { resetWalletError, hydrateWalletFromCache } = walletSlice.actions
export const walletReducer = walletSlice.reducer
export default walletReducer
