import { apiService } from '@/services/api'
import type {
  Wallet,
  WalletTransaction,
  WalletStats,
  TransactionFilters,
  WalletPaymentRequest,
  WalletRechargeRequest,
  WalletPinRequest,
  WalletChangePinRequest,
  WalletStatusRequest,
  WalletDailyLimitRequest,
  WalletTransferRequest,
  ApiResponse,
  PaginatedResponse
} from '@/types/wallet'

class WalletService {
  private readonly baseUrl = '/wallet'

  /**
   * Get wallet information
   */
  async getWallet(): Promise<ApiResponse<{ wallet: Wallet }>> {
    try {
      const response = await apiService.get(this.baseUrl)
      return response
    } catch (error: any) {
      return this.handleError(error)
    }
  }

  /**
   * Process a wallet payment
   */
  async processPayment(data: WalletPaymentRequest): Promise<ApiResponse<{ transaction: WalletTransaction }>> {
    try {
      const response = await apiService.post(`${this.baseUrl}/payment`, data)
      return response.data
    } catch (error: any) {
      return this.handleError(error)
    }
  }

  /**
   * Recharge wallet
   */
  async rechargeWallet(data: WalletRechargeRequest): Promise<ApiResponse> {
    try {
      const response = await apiService.post(`${this.baseUrl}/recharge`, data)
      return response.data
    } catch (error: any) {
      return this.handleError(error)
    }
  }

  /**
   * Set wallet PIN
   */
  async setPin(data: WalletPinRequest): Promise<ApiResponse> {
    try {
      const response = await apiService.post(`${this.baseUrl}/pin`, data)
      return response.data
    } catch (error: any) {
      return this.handleError(error)
    }
  }

  /**
   * Change wallet PIN
   */
  async changePin(data: WalletChangePinRequest): Promise<ApiResponse> {
    try {
      const response = await apiService.put(`${this.baseUrl}/pin`, data)
      return response.data
    } catch (error: any) {
      return this.handleError(error)
    }
  }

  /**
   * Toggle wallet status (active/inactive)
   */
  async toggleStatus(data: WalletStatusRequest): Promise<ApiResponse<{ wallet: { is_active: boolean } }>> {
    try {
      const response = await apiService.put(`${this.baseUrl}/status`, data)
      return response.data
    } catch (error: any) {
      return this.handleError(error)
    }
  }

  /**
   * Update daily spending limit
   */
  async updateDailyLimit(data: WalletDailyLimitRequest): Promise<ApiResponse<{ wallet: { daily_limit: number; remaining_daily_limit: number } }>> {
    try {
      const response = await apiService.put(`${this.baseUrl}/daily-limit`, data)
      return response.data
    } catch (error: any) {
      return this.handleError(error)
    }
  }

  /**
   * Get wallet transactions with filters and pagination
   */
  async getTransactions(filters: TransactionFilters = {}, page: number = 1): Promise<ApiResponse<{ transactions: WalletTransaction[]; pagination: any }>> {
    try {
      const params = new URLSearchParams()

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString())
        }
      })

      if (page > 1) {
        params.append('page', page.toString())
      }

      const queryString = params.toString()
      const url = queryString ? `${this.baseUrl}/transactions?${queryString}` : `${this.baseUrl}/transactions`

      const response = await apiService.get(url)
      return response.data
    } catch (error: any) {
      return this.handleError(error)
    }
  }

  /**
   * Get wallet statistics
   */
  async getStats(period: string = 'month'): Promise<ApiResponse<WalletStats>> {
    try {
      const response = await apiService.get(`${this.baseUrl}/stats?period=${period}`)
      return response.data
    } catch (error: any) {
      return this.handleError(error)
    }
  }

  /**
   * Transfer money to another user
   */
  async transferToUser(data: WalletTransferRequest): Promise<ApiResponse<{ transfer: any }>> {
    try {
      const response = await apiService.post(`${this.baseUrl}/transfer`, data)
      return response.data
    } catch (error: any) {
      return this.handleError(error)
    }
  }

  /**
   * Handle API errors consistently
   */
  private handleError(error: any): ApiResponse {
    if (error.response?.data) {
      return error.response.data
    }

    // Network or other errors
    return {
      success: false,
      message: error.message || 'Une erreur inattendue s\'est produite',
      errors: {}
    }
  }

  /**
   * Validate payment amount
   */
  validatePaymentAmount(amount: number, walletBalance: number, dailyLimit: number, dailySpent: number): { isValid: boolean; error?: string } {
    if (amount <= 0) {
      return { isValid: false, error: 'Le montant doit être supérieur à zéro' }
    }

    if (amount < 50) {
      return { isValid: false, error: 'Le montant minimum est de 50 XOF' }
    }

    if (amount > 500000) {
      return { isValid: false, error: 'Le montant maximum est de 500 000 XOF' }
    }

    if (amount > walletBalance) {
      return { isValid: false, error: 'Solde insuffisant' }
    }

    if ((dailySpent + amount) > dailyLimit) {
      return { isValid: false, error: 'Limite quotidienne dépassée' }
    }

    return { isValid: true }
  }

  /**
   * Validate PIN format
   */
  validatePin(pin: string): { isValid: boolean; error?: string } {
    if (!pin) {
      return { isValid: false, error: 'Le code PIN est requis' }
    }

    if (pin.length < 4) {
      return { isValid: false, error: 'Le code PIN doit contenir au moins 4 chiffres' }
    }

    if (pin.length > 6) {
      return { isValid: false, error: 'Le code PIN ne peut pas dépasser 6 chiffres' }
    }

    if (!/^\d+$/.test(pin)) {
      return { isValid: false, error: 'Le code PIN ne doit contenir que des chiffres' }
    }

    return { isValid: true }
  }

  /**
   * Validate recharge amount
   */
  validateRechargeAmount(amount: number): { isValid: boolean; error?: string } {
    if (amount <= 0) {
      return { isValid: false, error: 'Le montant doit être supérieur à zéro' }
    }

    if (amount < 100) {
      return { isValid: false, error: 'Le montant minimum de recharge est de 100 XOF' }
    }

    if (amount > 1000000) {
      return { isValid: false, error: 'Le montant maximum de recharge est de 1 000 000 XOF' }
    }

    return { isValid: true }
  }

  /**
   * Format amount for display
   */
  formatAmount(amount: number, currency: string = 'XOF'): string {
    const formatted = new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)

    return `${formatted} ${currency}`
  }

  /**
   * Parse amount from formatted string
   */
  parseAmount(formattedAmount: string): number {
    const cleanAmount = formattedAmount.replace(/[^\d]/g, '')
    return parseInt(cleanAmount, 10) || 0
  }

  /**
   * Get payment method display info
   */
  getPaymentMethodInfo(method: string): { name: string; description: string; requiresPhone: boolean } {
    const methods: Record<string, any> = {
      flooz: {
        name: 'Flooz',
        description: 'Paiement mobile Flooz',
        requiresPhone: true
      },
      tmoney: {
        name: 'T-Money',
        description: 'Paiement mobile T-Money',
        requiresPhone: true
      },
      paystack: {
        name: 'Carte bancaire',
        description: 'Visa, Mastercard via Paystack',
        requiresPhone: false
      },
      wallet: {
        name: 'Portefeuille électronique',
        description: 'Paiement via votre solde Antigaspi',
        requiresPhone: false
      }
    }

    return methods[method] || {
      name: 'Inconnu',
      description: 'Méthode de paiement inconnue',
      requiresPhone: false
    }
  }
}

export const walletService = new WalletService()