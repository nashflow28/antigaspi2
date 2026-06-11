import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useWalletStore } from '@/stores/wallet'
import { walletService } from '@/services/walletService'
import type { Wallet, WalletStats, WalletTransaction } from '@/types/wallet'

vi.mock('@/services/walletService', () => ({
  walletService: {
    getWallet: vi.fn(),
    processPayment: vi.fn(),
    rechargeWallet: vi.fn(),
    setPin: vi.fn(),
    changePin: vi.fn(),
    toggleStatus: vi.fn(),
    updateDailyLimit: vi.fn(),
    getTransactions: vi.fn(),
    getStats: vi.fn(),
    transferToUser: vi.fn()
  }
}))

const mockedService = vi.mocked(walletService)

const buildWallet = (overrides: Partial<Wallet> = {}): Wallet => ({
  id: 1,
  balance: 10000,
  formatted_balance: '10 000 XOF',
  currency: 'XOF',
  daily_limit: 50000,
  remaining_daily_limit: 50000,
  is_active: true,
  has_pin: true,
  last_transaction_at: null,
  ...overrides
})

const mockWalletFetch = (wallet: Wallet = buildWallet()) => {
  mockedService.getWallet.mockResolvedValue({
    success: true,
    message: 'OK',
    data: { wallet }
  })
}

describe('useWalletStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setActivePinia(createPinia())
  })

  describe('état initial', () => {
    it('démarre sans portefeuille avec des valeurs par défaut', () => {
      const store = useWalletStore()

      expect(store.hasWallet).toBe(false)
      expect(store.balance).toBe(0)
      expect(store.formattedBalance).toBe('0 XOF')
      expect(store.currency).toBe('XOF')
      expect(store.dailyLimit).toBe(0)
      expect(store.loading).toBe(false)
      expect(store.error).toBeNull()
      expect(store.canPay(100)).toBe(false)
    })
  })

  describe('fetchWallet', () => {
    it('charge le portefeuille avec succès', async () => {
      mockWalletFetch(buildWallet({ balance: 25000 }))
      const store = useWalletStore()

      await store.fetchWallet()

      expect(store.hasWallet).toBe(true)
      expect(store.balance).toBe(25000)
      expect(store.isActive).toBe(true)
      expect(store.loading).toBe(false)
      expect(store.error).toBeNull()
    })

    it('enregistre le message d\'erreur quand l\'API répond en échec', async () => {
      mockedService.getWallet.mockResolvedValue({
        success: false,
        message: 'Portefeuille introuvable'
      })
      const store = useWalletStore()

      await store.fetchWallet()

      expect(store.hasWallet).toBe(false)
      expect(store.error).toBe('Portefeuille introuvable')
      expect(store.loading).toBe(false)
    })

    it('gère une erreur réseau (promesse rejetée)', async () => {
      mockedService.getWallet.mockRejectedValue(new Error('Network down'))
      const store = useWalletStore()

      await store.fetchWallet()

      expect(store.error).toBe('Network down')
      expect(store.loading).toBe(false)
    })
  })

  describe('canPay', () => {
    it('autorise le paiement quand toutes les conditions sont réunies', async () => {
      mockWalletFetch(buildWallet({ balance: 10000, remaining_daily_limit: 50000 }))
      const store = useWalletStore()
      await store.fetchWallet()

      expect(store.canPay(5000)).toBe(true)
    })

    it('refuse le paiement si le portefeuille est inactif', async () => {
      mockWalletFetch(buildWallet({ is_active: false }))
      const store = useWalletStore()
      await store.fetchWallet()

      expect(store.canPay(1000)).toBe(false)
    })

    it('refuse le paiement si le solde est insuffisant', async () => {
      mockWalletFetch(buildWallet({ balance: 500 }))
      const store = useWalletStore()
      await store.fetchWallet()

      expect(store.canPay(1000)).toBe(false)
    })

    it('refuse le paiement si la limite quotidienne restante est dépassée', async () => {
      mockWalletFetch(buildWallet({ balance: 100000, remaining_daily_limit: 2000 }))
      const store = useWalletStore()
      await store.fetchWallet()

      expect(store.canPay(5000)).toBe(false)
    })

    it('refuse le paiement si aucun PIN n\'est configuré', async () => {
      mockWalletFetch(buildWallet({ has_pin: false }))
      const store = useWalletStore()
      await store.fetchWallet()

      expect(store.canPay(1000)).toBe(false)
    })
  })

  describe('limites quotidiennes', () => {
    it('calcule le montant dépensé et le pourcentage d\'utilisation', async () => {
      mockWalletFetch(buildWallet({ daily_limit: 50000, remaining_daily_limit: 30000 }))
      const store = useWalletStore()
      await store.fetchWallet()

      expect(store.dailySpent).toBe(20000)
      expect(store.dailyLimitUsagePercentage).toBe(40)
    })

    it('retourne 0% d\'utilisation quand la limite quotidienne est nulle', () => {
      const store = useWalletStore()

      expect(store.dailyLimitUsagePercentage).toBe(0)
    })
  })

  describe('processPayment', () => {
    it('retourne true et rafraîchit le portefeuille après un paiement réussi', async () => {
      mockWalletFetch()
      mockedService.processPayment.mockResolvedValue({ success: true, message: 'OK' })
      const store = useWalletStore()

      const result = await store.processPayment(500, '1234')

      expect(result).toBe(true)
      expect(mockedService.processPayment).toHaveBeenCalledWith({
        amount: 500,
        pin: '1234',
        description: 'Paiement de 500 XOF'
      })
      expect(mockedService.getWallet).toHaveBeenCalledTimes(1)
      expect(store.error).toBeNull()
    })

    it('retourne false et enregistre l\'erreur quand le paiement échoue', async () => {
      mockedService.processPayment.mockResolvedValue({
        success: false,
        message: 'PIN incorrect'
      })
      const store = useWalletStore()

      const result = await store.processPayment(500, '0000')

      expect(result).toBe(false)
      expect(store.error).toBe('PIN incorrect')
      expect(mockedService.getWallet).not.toHaveBeenCalled()
    })
  })

  describe('rechargeWallet', () => {
    it('retourne true et rafraîchit le portefeuille après une recharge réussie', async () => {
      mockWalletFetch(buildWallet({ balance: 15000 }))
      mockedService.rechargeWallet.mockResolvedValue({ success: true, message: 'OK' })
      const store = useWalletStore()

      const result = await store.rechargeWallet(5000, 'tmoney', '+22890000000')

      expect(result).toBe(true)
      expect(mockedService.rechargeWallet).toHaveBeenCalledWith({
        amount: 5000,
        payment_method: 'tmoney',
        phone: '+22890000000'
      })
      expect(store.balance).toBe(15000)
    })

    it('retourne false et enregistre l\'erreur quand la recharge échoue', async () => {
      mockedService.rechargeWallet.mockResolvedValue({
        success: false,
        message: 'Montant minimum non atteint'
      })
      const store = useWalletStore()

      const result = await store.rechargeWallet(10, 'flooz')

      expect(result).toBe(false)
      expect(store.error).toBe('Montant minimum non atteint')
    })
  })

  describe('transactions et statistiques', () => {
    it('charge les transactions et la pagination', async () => {
      const transactions = [
        { id: 1, type: 'credit', amount: 5000 } as unknown as WalletTransaction
      ]
      const pagination = { current_page: 1, last_page: 2, per_page: 10, total: 12 }
      mockedService.getTransactions.mockResolvedValue({
        success: true,
        message: 'OK',
        data: { transactions, pagination }
      })
      const store = useWalletStore()

      await store.fetchTransactions({ type: 'credit' }, 1)

      expect(mockedService.getTransactions).toHaveBeenCalledWith({ type: 'credit' }, 1)
      expect(store.transactions).toEqual(transactions)
      expect(store.transactionsPagination).toEqual(pagination)
      expect(store.transactionsLoading).toBe(false)
    })

    it('enregistre l\'erreur quand le chargement des transactions échoue', async () => {
      mockedService.getTransactions.mockRejectedValue(new Error('Timeout'))
      const store = useWalletStore()

      await store.fetchTransactions()

      expect(store.error).toBe('Timeout')
      expect(store.transactions).toEqual([])
    })

    it('charge les statistiques du portefeuille', async () => {
      const stats = {
        current_balance: 10000,
        daily_limit: 50000,
        remaining_daily_limit: 45000,
        period: 'month',
        period_stats: {
          total_credits: 20000,
          total_debits: 10000,
          transaction_count: 8,
          credit_count: 3,
          debit_count: 5
        }
      } satisfies WalletStats
      mockedService.getStats.mockResolvedValue({ success: true, message: 'OK', data: stats })
      const store = useWalletStore()

      await store.fetchStats('month')

      expect(store.stats).toEqual(stats)
    })
  })

  describe('transferToUser', () => {
    it('retourne true et rafraîchit le portefeuille après un transfert réussi', async () => {
      mockWalletFetch()
      mockedService.transferToUser.mockResolvedValue({ success: true, message: 'OK' })
      const store = useWalletStore()

      const result = await store.transferToUser(9, 2000, '1234')

      expect(result).toBe(true)
      expect(mockedService.transferToUser).toHaveBeenCalledWith({
        receiver_id: 9,
        amount: 2000,
        pin: '1234',
        description: 'Transfert de 2000 XOF'
      })
      expect(mockedService.getWallet).toHaveBeenCalledTimes(1)
    })

    it('retourne false quand le transfert échoue', async () => {
      mockedService.transferToUser.mockResolvedValue({
        success: false,
        message: 'Destinataire introuvable'
      })
      const store = useWalletStore()

      const result = await store.transferToUser(999, 2000, '1234')

      expect(result).toBe(false)
      expect(store.error).toBe('Destinataire introuvable')
    })
  })

  describe('gestion du PIN et du statut', () => {
    it('configure le PIN puis rafraîchit le portefeuille', async () => {
      mockWalletFetch(buildWallet({ has_pin: true }))
      mockedService.setPin.mockResolvedValue({ success: true, message: 'OK' })
      const store = useWalletStore()

      const result = await store.setPin('1234')

      expect(result).toBe(true)
      expect(store.hasPin).toBe(true)
    })

    it('retourne false quand le changement de PIN échoue', async () => {
      mockedService.changePin.mockResolvedValue({
        success: false,
        message: 'PIN actuel incorrect'
      })
      const store = useWalletStore()

      const result = await store.changePin('0000', '5678')

      expect(result).toBe(false)
      expect(store.error).toBe('PIN actuel incorrect')
    })

    it('met à jour le statut localement après activation/désactivation', async () => {
      mockWalletFetch(buildWallet({ is_active: true }))
      mockedService.toggleStatus.mockResolvedValue({ success: true, message: 'OK' })
      const store = useWalletStore()
      await store.fetchWallet()

      const result = await store.toggleWalletStatus(false)

      expect(result).toBe(true)
      expect(store.isActive).toBe(false)
    })

    it('met à jour la limite quotidienne avec la réponse du serveur', async () => {
      mockWalletFetch(buildWallet({ daily_limit: 50000, remaining_daily_limit: 50000 }))
      mockedService.updateDailyLimit.mockResolvedValue({
        success: true,
        message: 'OK',
        data: { wallet: { daily_limit: 80000, remaining_daily_limit: 75000 } }
      })
      const store = useWalletStore()
      await store.fetchWallet()

      const result = await store.updateDailyLimit(80000)

      expect(result).toBe(true)
      expect(store.dailyLimit).toBe(80000)
      expect(store.remainingDailyLimit).toBe(75000)
    })
  })

  describe('utilitaires', () => {
    it('réinitialise complètement le store', async () => {
      mockWalletFetch()
      const store = useWalletStore()
      await store.fetchWallet()
      expect(store.hasWallet).toBe(true)

      store.resetStore()

      expect(store.wallet).toBeNull()
      expect(store.transactions).toEqual([])
      expect(store.stats).toBeNull()
      expect(store.error).toBeNull()
      expect(store.loading).toBe(false)
    })

    it('efface l\'erreur courante', async () => {
      mockedService.getWallet.mockRejectedValue(new Error('Erreur'))
      const store = useWalletStore()
      await store.fetchWallet()
      expect(store.error).toBe('Erreur')

      store.clearError()

      expect(store.error).toBeNull()
    })

    it('formate les montants en respectant la locale fr-FR', () => {
      const store = useWalletStore()
      const expected = new Intl.NumberFormat('fr-FR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(15000)

      expect(store.formatAmount(15000)).toBe(expected)
      expect(store.formatCurrency(15000)).toBe(`${expected} XOF`)
      expect(store.formatCurrency(15000, false)).toBe(expected)
    })
  })
})
