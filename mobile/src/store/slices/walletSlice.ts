import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit'

import apiService from '../../services/api'
import type {
  Wallet,
  WalletTransaction,
  WalletStats,
  WalletTransactionsPagination,
  WalletTransactionsResponse,
  WalletTransactionFilters,
  WalletRechargePayload,
  WalletPinPayload,
  WalletChangePinPayload,
} from '../../types'

export interface WalletState {
  wallet: Wallet | null
  transactions: WalletTransaction[]
  pagination: WalletTransactionsPagination | null
  stats: WalletStats | null
  statsPeriod: string
  filters?: WalletTransactionFilters
  loading: boolean
  transactionsLoading: boolean
  statsLoading: boolean
  rechargeLoading: boolean
  pinLoading: boolean
  statusLoading: boolean
  dailyLimitLoading: boolean
  error: string | null
}

const initialState: WalletState = {
  wallet: null,
  transactions: [],
  pagination: null,
  stats: null,
  statsPeriod: 'month',
  filters: undefined,
  loading: false,
  transactionsLoading: false,
  statsLoading: false,
  rechargeLoading: false,
  pinLoading: false,
  statusLoading: false,
  dailyLimitLoading: false,
  error: null,
}

interface FetchTransactionsArgs {
  filters?: WalletTransactionFilters
  page?: number
}

export const fetchWallet = createAsyncThunk(
  'wallet/fetchWallet',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiService.getWallet()
      if (response.success && response.data?.wallet) {
        return response.data.wallet
      }
      return rejectWithValue(response.message ?? "Impossible de récupérer le portefeuille")
    } catch (error: any) {
      return rejectWithValue(error?.message ?? "Impossible de récupérer le portefeuille")
    }
  }
)

export const fetchWalletTransactions = createAsyncThunk(
  'wallet/fetchTransactions',
  async (args: FetchTransactionsArgs = {}, { rejectWithValue }) => {
    try {
      const response = await apiService.getWalletTransactions(args.filters, args.page ?? 1)
      if (response.success && response.data) {
        return response.data
      }
      return rejectWithValue(response.message ?? 'Impossible de charger les transactions du portefeuille')
    } catch (error: any) {
      return rejectWithValue(error?.message ?? 'Impossible de charger les transactions du portefeuille')
    }
  }
)

export const fetchWalletStats = createAsyncThunk(
  'wallet/fetchStats',
  async (period: string | undefined, { rejectWithValue }) => {
    try {
      const effectivePeriod = period ?? 'month'
      const response = await apiService.getWalletStats(effectivePeriod)
      if (response.success && response.data) {
        return { stats: response.data, period: effectivePeriod }
      }
      return rejectWithValue(response.message ?? 'Impossible de charger les statistiques du portefeuille')
    } catch (error: any) {
      return rejectWithValue(error?.message ?? 'Impossible de charger les statistiques du portefeuille')
    }
  }
)

export const rechargeWallet = createAsyncThunk(
  'wallet/recharge',
  async (payload: WalletRechargePayload, thunkAPI) => {
    try {
      const response = await apiService.rechargeWallet(payload)
      if (!response.success) {
        return thunkAPI.rejectWithValue(response.message ?? 'Erreur lors de la recharge du portefeuille')
      }

      await thunkAPI.dispatch(fetchWallet())
      const state = thunkAPI.getState() as { wallet: WalletState }
      const currentFilters = state.wallet.filters
      const currentPeriod = state.wallet.statsPeriod

      await thunkAPI.dispatch(fetchWalletTransactions({ filters: currentFilters, page: 1 }))
      await thunkAPI.dispatch(fetchWalletStats(currentPeriod))

      return response.message ?? 'Recharge initiée avec succès'
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error?.message ?? 'Erreur lors de la recharge du portefeuille')
    }
  }
)

export const setWalletPin = createAsyncThunk(
  'wallet/setPin',
  async (payload: WalletPinPayload, thunkAPI) => {
    try {
      const response = await apiService.setWalletPin(payload)
      if (!response.success) {
        return thunkAPI.rejectWithValue(response.message ?? 'Impossible de configurer le PIN')
      }
      await thunkAPI.dispatch(fetchWallet())
      return response.message ?? 'PIN configuré avec succès'
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error?.message ?? 'Impossible de configurer le PIN')
    }
  }
)

export const changeWalletPin = createAsyncThunk(
  'wallet/changePin',
  async (payload: WalletChangePinPayload, thunkAPI) => {
    try {
      const response = await apiService.changeWalletPin(payload)
      if (!response.success) {
        return thunkAPI.rejectWithValue(response.message ?? 'Impossible de mettre à jour le PIN')
      }
      await thunkAPI.dispatch(fetchWallet())
      return response.message ?? 'PIN mis à jour avec succès'
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error?.message ?? 'Impossible de mettre à jour le PIN')
    }
  }
)

export const toggleWalletStatus = createAsyncThunk(
  'wallet/toggleStatus',
  async (isActive: boolean, thunkAPI) => {
    try {
      const response = await apiService.toggleWalletStatus({ isActive })
      if (!response.success || !response.data?.wallet) {
        return thunkAPI.rejectWithValue(response.message ?? 'Impossible de mettre à jour le statut du portefeuille')
      }
      return response.data.wallet.is_active
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error?.message ?? 'Impossible de mettre à jour le statut du portefeuille')
    }
  }
)

export const updateWalletDailyLimit = createAsyncThunk(
  'wallet/updateDailyLimit',
  async (dailyLimit: number, thunkAPI) => {
    try {
      const response = await apiService.updateWalletDailyLimit(dailyLimit)
      if (!response.success || !response.data?.wallet) {
        return thunkAPI.rejectWithValue(response.message ?? 'Impossible de mettre à jour la limite quotidienne')
      }
      return response.data.wallet
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error?.message ?? 'Impossible de mettre à jour la limite quotidienne')
    }
  }
)

const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    resetWalletState: () => ({ ...initialState }),
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWallet.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchWallet.fulfilled, (state, action: PayloadAction<Wallet>) => {
        state.loading = false
        state.wallet = action.payload
        state.error = null
      })
      .addCase(fetchWallet.rejected, (state, action) => {
        state.loading = false
        state.error = (action.payload as string) ?? action.error.message ?? null
      })

      .addCase(fetchWalletTransactions.pending, (state) => {
        state.transactionsLoading = true
        state.error = null
      })
      .addCase(fetchWalletTransactions.fulfilled, (state, action: PayloadAction<WalletTransactionsResponse>) => {
        state.transactionsLoading = false
        state.transactions = action.payload.transactions
        state.pagination = action.payload.pagination
        state.filters = action.meta.arg?.filters
        state.error = null
      })
      .addCase(fetchWalletTransactions.rejected, (state, action) => {
        state.transactionsLoading = false
        state.error = (action.payload as string) ?? action.error.message ?? null
      })

      .addCase(fetchWalletStats.pending, (state) => {
        state.statsLoading = true
        state.error = null
      })
      .addCase(fetchWalletStats.fulfilled, (state, action) => {
        state.statsLoading = false
        state.stats = action.payload.stats
        state.statsPeriod = action.payload.period
        state.error = null
      })
      .addCase(fetchWalletStats.rejected, (state, action) => {
        state.statsLoading = false
        state.error = (action.payload as string) ?? action.error.message ?? null
      })

      .addCase(rechargeWallet.pending, (state) => {
        state.rechargeLoading = true
        state.error = null
      })
      .addCase(rechargeWallet.fulfilled, (state) => {
        state.rechargeLoading = false
      })
      .addCase(rechargeWallet.rejected, (state, action) => {
        state.rechargeLoading = false
        state.error = (action.payload as string) ?? action.error.message ?? null
      })

      .addCase(setWalletPin.pending, (state) => {
        state.pinLoading = true
        state.error = null
      })
      .addCase(setWalletPin.fulfilled, (state) => {
        state.pinLoading = false
      })
      .addCase(setWalletPin.rejected, (state, action) => {
        state.pinLoading = false
        state.error = (action.payload as string) ?? action.error.message ?? null
      })

      .addCase(changeWalletPin.pending, (state) => {
        state.pinLoading = true
        state.error = null
      })
      .addCase(changeWalletPin.fulfilled, (state) => {
        state.pinLoading = false
      })
      .addCase(changeWalletPin.rejected, (state, action) => {
        state.pinLoading = false
        state.error = (action.payload as string) ?? action.error.message ?? null
      })

      .addCase(toggleWalletStatus.pending, (state) => {
        state.statusLoading = true
        state.error = null
      })
      .addCase(toggleWalletStatus.fulfilled, (state, action: PayloadAction<boolean>) => {
        state.statusLoading = false
        if (state.wallet) {
          state.wallet.is_active = action.payload
        }
        state.error = null
      })
      .addCase(toggleWalletStatus.rejected, (state, action) => {
        state.statusLoading = false
        state.error = (action.payload as string) ?? action.error.message ?? null
      })

      .addCase(updateWalletDailyLimit.pending, (state) => {
        state.dailyLimitLoading = true
        state.error = null
      })
      .addCase(updateWalletDailyLimit.fulfilled, (state, action) => {
        state.dailyLimitLoading = false
        if (state.wallet) {
          state.wallet.daily_limit = action.payload.daily_limit
          state.wallet.remaining_daily_limit = action.payload.remaining_daily_limit
        }
        state.error = null
      })
      .addCase(updateWalletDailyLimit.rejected, (state, action) => {
        state.dailyLimitLoading = false
        state.error = (action.payload as string) ?? action.error.message ?? null
      })
  },
})

export const { resetWalletState } = walletSlice.actions
export const walletReducer = walletSlice.reducer
export { initialState as walletInitialState }
