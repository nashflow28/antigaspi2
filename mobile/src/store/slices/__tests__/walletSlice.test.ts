// @ts-nocheck
/**
 * Tests unitaires pour walletSlice
 * Teste fetchWallet, transactions, stats, recharge, PIN, toggle status, daily limit
 */

import { configureStore } from '@reduxjs/toolkit'
import {
  walletReducer,
  walletInitialState,
  fetchWallet,
  fetchWalletTransactions,
  fetchWalletStats,
  rechargeWallet,
  setWalletPin,
  changeWalletPin,
  toggleWalletStatus,
  updateWalletDailyLimit,
  resetWalletState,
} from '../walletSlice'
import type { Wallet, WalletTransaction, WalletStats } from '../../../types'
import apiService from '../../../services/api'

// Mock apiService
jest.mock('../../../services/api', () => ({
  __esModule: true,
  default: {
    getWallet: jest.fn(),
    getWalletTransactions: jest.fn(),
    getWalletStats: jest.fn(),
    rechargeWallet: jest.fn(),
    setWalletPin: jest.fn(),
    changeWalletPin: jest.fn(),
    toggleWalletStatus: jest.fn(),
    updateWalletDailyLimit: jest.fn(),
  },
}))

const mockGetWallet = apiService.getWallet as jest.MockedFunction<typeof apiService.getWallet>
const mockGetWalletTransactions = apiService.getWalletTransactions as jest.MockedFunction<typeof apiService.getWalletTransactions>
const mockGetWalletStats = apiService.getWalletStats as jest.MockedFunction<typeof apiService.getWalletStats>
const mockRechargeWallet = apiService.rechargeWallet as jest.MockedFunction<typeof apiService.rechargeWallet>
const mockSetWalletPin = apiService.setWalletPin as jest.MockedFunction<typeof apiService.setWalletPin>
const mockChangeWalletPin = apiService.changeWalletPin as jest.MockedFunction<typeof apiService.changeWalletPin>
const mockToggleWalletStatus = apiService.toggleWalletStatus as jest.MockedFunction<typeof apiService.toggleWalletStatus>
const mockUpdateWalletDailyLimit = apiService.updateWalletDailyLimit as jest.MockedFunction<typeof apiService.updateWalletDailyLimit>

// Mock wallet data
const mockWallet: Wallet = {
  id: 1,
  user_id: 1,
  balance: 5000,
  currency: 'XOF',
  is_active: true,
  has_pin: true,
  daily_limit: 50000,
  remaining_daily_limit: 45000,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-15T00:00:00Z',
}

const mockTransaction: WalletTransaction = {
  id: 1,
  wallet_id: 1,
  type: 'credit',
  amount: 1000,
  balance_before: 4000,
  balance_after: 5000,
  description: 'Recharge Mobile Money',
  reference: 'TXN-001',
  status: 'completed',
  created_at: '2024-01-15T00:00:00Z',
}

const mockStats: WalletStats = {
  total_credits: 10000,
  total_debits: 5000,
  transaction_count: 15,
  average_transaction: 1000,
}

describe('walletSlice', () => {
  let store: ReturnType<typeof configureStore>

  beforeEach(() => {
    store = configureStore({
      reducer: {
        wallet: walletReducer,
      },
    })
    jest.clearAllMocks()
  })

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = store.getState().wallet

      expect(state).toEqual({
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
      })
    })
  })

  describe('Synchronous Reducers', () => {
    describe('resetWalletState', () => {
      it('should reset wallet state to initial', () => {
        // Set up state with data
        store = configureStore({
          reducer: {
            wallet: walletReducer,
          },
          preloadedState: {
            wallet: {
              ...walletInitialState,
              wallet: mockWallet,
              transactions: [mockTransaction],
              error: 'Some error',
            },
          },
        })

        store.dispatch(resetWalletState())

        const state = store.getState().wallet
        expect(state.wallet).toBeNull()
        expect(state.transactions).toEqual([])
        expect(state.error).toBeNull()
      })
    })
  })

  describe('fetchWallet', () => {
    it('should set loading true when pending', () => {
      mockGetWallet.mockReturnValue(new Promise(() => {})) // Never resolves

      store.dispatch(fetchWallet())

      const state = store.getState().wallet
      expect(state.loading).toBe(true)
      expect(state.error).toBeNull()
    })

    it('should fetch wallet successfully', async () => {
      mockGetWallet.mockResolvedValueOnce({
        success: true,
        data: { wallet: mockWallet },
      })

      await store.dispatch(fetchWallet())

      const state = store.getState().wallet
      expect(state.loading).toBe(false)
      expect(state.wallet).toEqual(mockWallet)
      expect(state.error).toBeNull()
    })

    it('should handle fetch wallet failure', async () => {
      mockGetWallet.mockResolvedValueOnce({
        success: false,
        message: 'Wallet not found',
      })

      await store.dispatch(fetchWallet())

      const state = store.getState().wallet
      expect(state.loading).toBe(false)
      expect(state.wallet).toBeNull()
      expect(state.error).toBe('Wallet not found')
    })

    it('should handle network error', async () => {
      mockGetWallet.mockRejectedValueOnce(new Error('Network error'))

      await store.dispatch(fetchWallet())

      const state = store.getState().wallet
      expect(state.loading).toBe(false)
      expect(state.error).toBe('Network error')
    })
  })

  describe('fetchWalletTransactions', () => {
    it('should set transactionsLoading true when pending', () => {
      mockGetWalletTransactions.mockReturnValue(new Promise(() => {}))

      store.dispatch(fetchWalletTransactions({}))

      const state = store.getState().wallet
      expect(state.transactionsLoading).toBe(true)
    })

    it('should fetch transactions successfully', async () => {
      const mockPagination = {
        current_page: 1,
        last_page: 2,
        per_page: 10,
        total: 15,
      }

      mockGetWalletTransactions.mockResolvedValueOnce({
        success: true,
        data: {
          transactions: [mockTransaction],
          pagination: mockPagination,
        },
      })

      await store.dispatch(fetchWalletTransactions({ page: 1 }))

      const state = store.getState().wallet
      expect(state.transactionsLoading).toBe(false)
      expect(state.transactions).toEqual([mockTransaction])
      expect(state.pagination).toEqual(mockPagination)
    })

    it('should apply filters correctly', async () => {
      mockGetWalletTransactions.mockResolvedValueOnce({
        success: true,
        data: {
          transactions: [mockTransaction],
          pagination: { current_page: 1, last_page: 1, per_page: 10, total: 1 },
        },
      })

      const filters = { type: 'credit', date_from: '2024-01-01' }
      await store.dispatch(fetchWalletTransactions({ filters, page: 1 }))

      expect(mockGetWalletTransactions).toHaveBeenCalledWith(filters, 1)
      const state = store.getState().wallet
      expect(state.filters).toEqual(filters)
    })

    it('should handle transaction fetch failure', async () => {
      mockGetWalletTransactions.mockResolvedValueOnce({
        success: false,
        message: 'Failed to fetch transactions',
      })

      await store.dispatch(fetchWalletTransactions({}))

      const state = store.getState().wallet
      expect(state.transactionsLoading).toBe(false)
      expect(state.error).toBe('Failed to fetch transactions')
    })
  })

  describe('fetchWalletStats', () => {
    it('should set statsLoading true when pending', () => {
      mockGetWalletStats.mockReturnValue(new Promise(() => {}))

      store.dispatch(fetchWalletStats('month'))

      const state = store.getState().wallet
      expect(state.statsLoading).toBe(true)
    })

    it('should fetch stats successfully', async () => {
      mockGetWalletStats.mockResolvedValueOnce({
        success: true,
        data: mockStats,
      })

      await store.dispatch(fetchWalletStats('week'))

      const state = store.getState().wallet
      expect(state.statsLoading).toBe(false)
      expect(state.stats).toEqual(mockStats)
      expect(state.statsPeriod).toBe('week')
    })

    it('should default to month period', async () => {
      mockGetWalletStats.mockResolvedValueOnce({
        success: true,
        data: mockStats,
      })

      await store.dispatch(fetchWalletStats(undefined))

      expect(mockGetWalletStats).toHaveBeenCalledWith('month')
      const state = store.getState().wallet
      expect(state.statsPeriod).toBe('month')
    })

    it('should handle stats fetch failure', async () => {
      mockGetWalletStats.mockResolvedValueOnce({
        success: false,
        message: 'Failed to fetch stats',
      })

      await store.dispatch(fetchWalletStats('month'))

      const state = store.getState().wallet
      expect(state.statsLoading).toBe(false)
      expect(state.error).toBe('Failed to fetch stats')
    })
  })

  describe('rechargeWallet', () => {
    beforeEach(() => {
      // Setup initial wallet state
      store = configureStore({
        reducer: {
          wallet: walletReducer,
        },
        preloadedState: {
          wallet: {
            ...walletInitialState,
            wallet: mockWallet,
            statsPeriod: 'month',
          },
        },
      })
    })

    it('should set rechargeLoading true when pending', () => {
      mockRechargeWallet.mockReturnValue(new Promise(() => {}))

      store.dispatch(rechargeWallet({ amount: 5000, provider: 'flooz', phone: '+22890000000' }))

      const state = store.getState().wallet
      expect(state.rechargeLoading).toBe(true)
    })

    it('should recharge wallet and refresh data', async () => {
      mockRechargeWallet.mockResolvedValueOnce({
        success: true,
        message: 'Recharge initiated',
      })
      mockGetWallet.mockResolvedValueOnce({
        success: true,
        data: { wallet: { ...mockWallet, balance: 10000 } },
      })
      mockGetWalletTransactions.mockResolvedValueOnce({
        success: true,
        data: { transactions: [], pagination: null },
      })
      mockGetWalletStats.mockResolvedValueOnce({
        success: true,
        data: mockStats,
      })

      await store.dispatch(rechargeWallet({ amount: 5000, provider: 'flooz', phone: '+22890000000' }))

      const state = store.getState().wallet
      expect(state.rechargeLoading).toBe(false)
      expect(mockGetWallet).toHaveBeenCalled()
      expect(mockGetWalletTransactions).toHaveBeenCalled()
      expect(mockGetWalletStats).toHaveBeenCalled()
    })

    it('should handle recharge failure', async () => {
      mockRechargeWallet.mockResolvedValueOnce({
        success: false,
        message: 'Insufficient balance',
      })

      await store.dispatch(rechargeWallet({ amount: 5000, provider: 'flooz', phone: '+22890000000' }))

      const state = store.getState().wallet
      expect(state.rechargeLoading).toBe(false)
      expect(state.error).toBe('Insufficient balance')
    })
  })

  describe('setWalletPin', () => {
    it('should set pinLoading true when pending', () => {
      mockSetWalletPin.mockReturnValue(new Promise(() => {}))

      store.dispatch(setWalletPin({ pin: '1234', pin_confirmation: '1234' }))

      const state = store.getState().wallet
      expect(state.pinLoading).toBe(true)
    })

    it('should set PIN successfully', async () => {
      mockSetWalletPin.mockResolvedValueOnce({
        success: true,
        message: 'PIN configured',
      })
      mockGetWallet.mockResolvedValueOnce({
        success: true,
        data: { wallet: { ...mockWallet, has_pin: true } },
      })

      await store.dispatch(setWalletPin({ pin: '1234', pin_confirmation: '1234' }))

      const state = store.getState().wallet
      expect(state.pinLoading).toBe(false)
      expect(mockGetWallet).toHaveBeenCalled()
    })

    it('should handle PIN set failure', async () => {
      mockSetWalletPin.mockResolvedValueOnce({
        success: false,
        message: 'PIN too weak',
      })

      await store.dispatch(setWalletPin({ pin: '1111', pin_confirmation: '1111' }))

      const state = store.getState().wallet
      expect(state.pinLoading).toBe(false)
      expect(state.error).toBe('PIN too weak')
    })
  })

  describe('changeWalletPin', () => {
    it('should change PIN successfully', async () => {
      mockChangeWalletPin.mockResolvedValueOnce({
        success: true,
        message: 'PIN updated',
      })
      mockGetWallet.mockResolvedValueOnce({
        success: true,
        data: { wallet: mockWallet },
      })

      await store.dispatch(changeWalletPin({
        current_pin: '1234',
        new_pin: '5678',
        new_pin_confirmation: '5678',
      }))

      const state = store.getState().wallet
      expect(state.pinLoading).toBe(false)
      expect(mockGetWallet).toHaveBeenCalled()
    })

    it('should handle wrong current PIN', async () => {
      mockChangeWalletPin.mockResolvedValueOnce({
        success: false,
        message: 'Current PIN is incorrect',
      })

      await store.dispatch(changeWalletPin({
        current_pin: '0000',
        new_pin: '5678',
        new_pin_confirmation: '5678',
      }))

      const state = store.getState().wallet
      expect(state.error).toBe('Current PIN is incorrect')
    })
  })

  describe('toggleWalletStatus', () => {
    beforeEach(() => {
      store = configureStore({
        reducer: {
          wallet: walletReducer,
        },
        preloadedState: {
          wallet: {
            ...walletInitialState,
            wallet: mockWallet,
          },
        },
      })
    })

    it('should set statusLoading true when pending', () => {
      mockToggleWalletStatus.mockReturnValue(new Promise(() => {}))

      store.dispatch(toggleWalletStatus(false))

      const state = store.getState().wallet
      expect(state.statusLoading).toBe(true)
    })

    it('should deactivate wallet', async () => {
      mockToggleWalletStatus.mockResolvedValueOnce({
        success: true,
        data: { wallet: { ...mockWallet, is_active: false } },
      })

      await store.dispatch(toggleWalletStatus(false))

      const state = store.getState().wallet
      expect(state.statusLoading).toBe(false)
      expect(state.wallet?.is_active).toBe(false)
    })

    it('should activate wallet', async () => {
      // Start with inactive wallet
      store = configureStore({
        reducer: {
          wallet: walletReducer,
        },
        preloadedState: {
          wallet: {
            ...walletInitialState,
            wallet: { ...mockWallet, is_active: false },
          },
        },
      })

      mockToggleWalletStatus.mockResolvedValueOnce({
        success: true,
        data: { wallet: { ...mockWallet, is_active: true } },
      })

      await store.dispatch(toggleWalletStatus(true))

      const state = store.getState().wallet
      expect(state.wallet?.is_active).toBe(true)
    })

    it('should handle toggle failure', async () => {
      mockToggleWalletStatus.mockResolvedValueOnce({
        success: false,
        message: 'Cannot toggle status',
      })

      await store.dispatch(toggleWalletStatus(false))

      const state = store.getState().wallet
      expect(state.statusLoading).toBe(false)
      expect(state.error).toBe('Cannot toggle status')
    })
  })

  describe('updateWalletDailyLimit', () => {
    beforeEach(() => {
      store = configureStore({
        reducer: {
          wallet: walletReducer,
        },
        preloadedState: {
          wallet: {
            ...walletInitialState,
            wallet: mockWallet,
          },
        },
      })
    })

    it('should set dailyLimitLoading true when pending', () => {
      mockUpdateWalletDailyLimit.mockReturnValue(new Promise(() => {}))

      store.dispatch(updateWalletDailyLimit(100000))

      const state = store.getState().wallet
      expect(state.dailyLimitLoading).toBe(true)
    })

    it('should update daily limit successfully', async () => {
      const newLimit = 100000
      mockUpdateWalletDailyLimit.mockResolvedValueOnce({
        success: true,
        data: {
          wallet: {
            ...mockWallet,
            daily_limit: newLimit,
            remaining_daily_limit: newLimit,
          },
        },
      })

      await store.dispatch(updateWalletDailyLimit(newLimit))

      const state = store.getState().wallet
      expect(state.dailyLimitLoading).toBe(false)
      expect(state.wallet?.daily_limit).toBe(newLimit)
      expect(state.wallet?.remaining_daily_limit).toBe(newLimit)
    })

    it('should handle invalid limit', async () => {
      mockUpdateWalletDailyLimit.mockResolvedValueOnce({
        success: false,
        message: 'Daily limit must be positive',
      })

      await store.dispatch(updateWalletDailyLimit(-1000))

      const state = store.getState().wallet
      expect(state.dailyLimitLoading).toBe(false)
      expect(state.error).toBe('Daily limit must be positive')
    })
  })

  describe('Edge Cases', () => {
    it('should handle null wallet data gracefully', async () => {
      mockGetWallet.mockResolvedValueOnce({
        success: true,
        data: { wallet: null },
      })

      await store.dispatch(fetchWallet())

      const state = store.getState().wallet
      // Should reject because wallet is null
      expect(state.error).not.toBeNull()
    })

    it('should handle concurrent wallet operations', async () => {
      mockGetWallet.mockResolvedValue({
        success: true,
        data: { wallet: mockWallet },
      })
      mockGetWalletTransactions.mockResolvedValue({
        success: true,
        data: { transactions: [], pagination: null },
      })
      mockGetWalletStats.mockResolvedValue({
        success: true,
        data: mockStats,
      })

      // Dispatch multiple actions concurrently
      await Promise.all([
        store.dispatch(fetchWallet()),
        store.dispatch(fetchWalletTransactions({})),
        store.dispatch(fetchWalletStats('month')),
      ])

      const state = store.getState().wallet
      expect(state.wallet).toEqual(mockWallet)
      expect(state.stats).toEqual(mockStats)
    })

    it('should preserve wallet on partial update failure', async () => {
      store = configureStore({
        reducer: {
          wallet: walletReducer,
        },
        preloadedState: {
          wallet: {
            ...walletInitialState,
            wallet: mockWallet,
          },
        },
      })

      mockToggleWalletStatus.mockRejectedValueOnce(new Error('Network error'))

      await store.dispatch(toggleWalletStatus(false))

      const state = store.getState().wallet
      // Wallet should still have original is_active value
      expect(state.wallet?.is_active).toBe(true)
      expect(state.error).toBe('Network error')
    })
  })
})
