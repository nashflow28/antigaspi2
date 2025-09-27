import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { walletService } from '@/services/walletService'
import type {
  Wallet,
  WalletTransaction,
  WalletStats,
  TransactionFilters,
  PaginatedResponse
} from '@/types/wallet'

export const useWalletStore = defineStore('wallet', () => {
  // State
  const wallet = ref<Wallet | null>(null)
  const transactions = ref<WalletTransaction[]>([])
  const transactionsPagination = ref<any>(null)
  const stats = ref<WalletStats | null>(null)
  const loading = ref(false)
  const transactionsLoading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const hasWallet = computed(() => wallet.value !== null)
  const isActive = computed(() => wallet.value?.is_active ?? false)
  const hasPin = computed(() => wallet.value?.has_pin ?? false)
  const balance = computed(() => wallet.value?.balance ?? 0)
  const formattedBalance = computed(() => wallet.value?.formatted_balance ?? '0 XOF')
  const dailyLimit = computed(() => wallet.value?.daily_limit ?? 0)
  const remainingDailyLimit = computed(() => wallet.value?.remaining_daily_limit ?? 0)
  const currency = computed(() => wallet.value?.currency ?? 'XOF')

  const canPay = computed(() => (amount: number) => {
    if (!wallet.value || !wallet.value.is_active) return false
    if (balance.value < amount) return false
    if ((dailyLimit.value - remainingDailyLimit.value + amount) > dailyLimit.value) return false
    return hasPin.value
  })

  const dailySpent = computed(() => {
    return dailyLimit.value - remainingDailyLimit.value
  })

  const dailyLimitUsagePercentage = computed(() => {
    if (dailyLimit.value === 0) return 0
    return (dailySpent.value / dailyLimit.value) * 100
  })

  // Actions
  const fetchWallet = async (): Promise<void> => {
    loading.value = true
    error.value = null

    try {
      const response = await walletService.getWallet()
      if (response.success) {
        wallet.value = response.data.wallet
      } else {
        throw new Error(response.message || 'Erreur lors de la récupération du portefeuille')
      }
    } catch (err: any) {
      error.value = err.message || 'Erreur lors de la récupération du portefeuille'
      console.error('Fetch wallet error:', err)
    } finally {
      loading.value = false
    }
  }

  const processPayment = async (amount: number, pin: string, description?: string): Promise<boolean> => {
    loading.value = true
    error.value = null

    try {
      const response = await walletService.processPayment({
        amount,
        pin,
        description: description || `Paiement de ${amount} XOF`
      })

      if (response.success) {
        // Refresh wallet after successful payment
        await fetchWallet()
        return true
      } else {
        throw new Error(response.message || 'Erreur lors du paiement')
      }
    } catch (err: any) {
      error.value = err.message || 'Erreur lors du paiement'
      console.error('Payment error:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  const rechargeWallet = async (amount: number, paymentMethod: string, phone?: string): Promise<boolean> => {
    loading.value = true
    error.value = null

    try {
      const response = await walletService.rechargeWallet({
        amount,
        payment_method: paymentMethod,
        phone
      })

      if (response.success) {
        // For now, just refresh wallet as recharge is not fully implemented
        await fetchWallet()
        return true
      } else {
        throw new Error(response.message || 'Erreur lors de la recharge')
      }
    } catch (err: any) {
      error.value = err.message || 'Erreur lors de la recharge'
      console.error('Recharge error:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  const setPin = async (pin: string): Promise<boolean> => {
    loading.value = true
    error.value = null

    try {
      const response = await walletService.setPin({ pin })

      if (response.success) {
        // Refresh wallet to update has_pin status
        await fetchWallet()
        return true
      } else {
        throw new Error(response.message || 'Erreur lors de la configuration du PIN')
      }
    } catch (err: any) {
      error.value = err.message || 'Erreur lors de la configuration du PIN'
      console.error('Set PIN error:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  const changePin = async (currentPin: string, newPin: string): Promise<boolean> => {
    loading.value = true
    error.value = null

    try {
      const response = await walletService.changePin({
        current_pin: currentPin,
        new_pin: newPin
      })

      if (response.success) {
        return true
      } else {
        throw new Error(response.message || 'Erreur lors de la modification du PIN')
      }
    } catch (err: any) {
      error.value = err.message || 'Erreur lors de la modification du PIN'
      console.error('Change PIN error:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  const toggleWalletStatus = async (isActive: boolean): Promise<boolean> => {
    loading.value = true
    error.value = null

    try {
      const response = await walletService.toggleStatus({ is_active: isActive })

      if (response.success) {
        // Update wallet status immediately
        if (wallet.value) {
          wallet.value.is_active = isActive
        }
        return true
      } else {
        throw new Error(response.message || 'Erreur lors de la modification du statut')
      }
    } catch (err: any) {
      error.value = err.message || 'Erreur lors de la modification du statut'
      console.error('Toggle status error:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  const updateDailyLimit = async (dailyLimit: number): Promise<boolean> => {
    loading.value = true
    error.value = null

    try {
      const response = await walletService.updateDailyLimit({ daily_limit: dailyLimit })

      if (response.success) {
        // Update wallet daily limit immediately
        if (wallet.value) {
          wallet.value.daily_limit = dailyLimit
          wallet.value.remaining_daily_limit = response.data.wallet.remaining_daily_limit
        }
        return true
      } else {
        throw new Error(response.message || 'Erreur lors de la modification de la limite')
      }
    } catch (err: any) {
      error.value = err.message || 'Erreur lors de la modification de la limite'
      console.error('Update daily limit error:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  const fetchTransactions = async (filters: TransactionFilters = {}, page: number = 1): Promise<void> => {
    transactionsLoading.value = true
    error.value = null

    try {
      const response = await walletService.getTransactions(filters, page)

      if (response.success) {
        transactions.value = response.data.transactions
        transactionsPagination.value = response.data.pagination
      } else {
        throw new Error(response.message || 'Erreur lors de la récupération des transactions')
      }
    } catch (err: any) {
      error.value = err.message || 'Erreur lors de la récupération des transactions'
      console.error('Fetch transactions error:', err)
    } finally {
      transactionsLoading.value = false
    }
  }

  const fetchStats = async (period: string = 'month'): Promise<void> => {
    loading.value = true
    error.value = null

    try {
      const response = await walletService.getStats(period)

      if (response.success) {
        stats.value = response.data
      } else {
        throw new Error(response.message || 'Erreur lors de la récupération des statistiques')
      }
    } catch (err: any) {
      error.value = err.message || 'Erreur lors de la récupération des statistiques'
      console.error('Fetch stats error:', err)
    } finally {
      loading.value = false
    }
  }

  const transferToUser = async (receiverId: number, amount: number, pin: string, description?: string): Promise<boolean> => {
    loading.value = true
    error.value = null

    try {
      const response = await walletService.transferToUser({
        receiver_id: receiverId,
        amount,
        pin,
        description: description || `Transfert de ${amount} XOF`
      })

      if (response.success) {
        // Refresh wallet after successful transfer
        await fetchWallet()
        return true
      } else {
        throw new Error(response.message || 'Erreur lors du transfert')
      }
    } catch (err: any) {
      error.value = err.message || 'Erreur lors du transfert'
      console.error('Transfer error:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  const clearError = (): void => {
    error.value = null
  }

  const resetStore = (): void => {
    wallet.value = null
    transactions.value = []
    transactionsPagination.value = null
    stats.value = null
    loading.value = false
    transactionsLoading.value = false
    error.value = null
  }

  // Format helpers
  const formatAmount = (amount: number): string => {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatCurrency = (amount: number, showCurrency: boolean = true): string => {
    const formatted = formatAmount(amount)
    return showCurrency ? `${formatted} ${currency.value}` : formatted
  }

  return {
    // State
    wallet,
    transactions,
    transactionsPagination,
    stats,
    loading,
    transactionsLoading,
    error,

    // Getters
    hasWallet,
    isActive,
    hasPin,
    balance,
    formattedBalance,
    dailyLimit,
    remainingDailyLimit,
    currency,
    canPay,
    dailySpent,
    dailyLimitUsagePercentage,

    // Actions
    fetchWallet,
    processPayment,
    rechargeWallet,
    setPin,
    changePin,
    toggleWalletStatus,
    updateDailyLimit,
    fetchTransactions,
    fetchStats,
    transferToUser,
    clearError,
    resetStore,

    // Helpers
    formatAmount,
    formatCurrency
  }
})
