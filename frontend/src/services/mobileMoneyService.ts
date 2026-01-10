/**
 * Mobile Money Service
 * Handles Flooz, TMoney, and other mobile money payments for web
 */

import { apiService } from '@/services/api'

// API Response types
interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

interface ProvidersResponse {
  providers: MobileMoneyConfig[]
}

interface PaymentInitResponse {
  transaction_id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  requires_otp?: boolean
  external_ref?: string
}

interface PaymentStatusResponse {
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
  amount?: number
  provider?: MobileMoneyProvider
  completed_at?: string
}

interface WithdrawalResponse {
  transaction_id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  estimated_time?: string
}

interface FeesResponse {
  fees: number
  total: number
  breakdown: { fixed: number; percentage: number }
}

interface TransactionHistoryResponse {
  transactions: TransactionRecord[]
  total: number
  page: number
  pages: number
}

interface TransactionRecord {
  id: string
  amount: number
  provider: MobileMoneyProvider
  status: string
  created_at: string
}

export type MobileMoneyProvider = 'flooz' | 'tmoney' | 'orange_money' | 'mtn_momo'

export interface MobileMoneyConfig {
  provider: MobileMoneyProvider
  name: string
  icon: string
  color: string
  phonePrefix: string[]
  minAmount: number
  maxAmount: number
  fees: {
    fixed: number
    percentage: number
  }
  enabled: boolean
}

export interface PaymentRequest {
  amount: number
  provider: MobileMoneyProvider
  phone: string
  purpose: 'wallet_topup' | 'order_payment' | 'subscription'
  reference?: string
  metadata?: Record<string, any>
}

export interface PaymentResult {
  success: boolean
  transactionId?: string
  status?: 'pending' | 'processing' | 'completed' | 'failed'
  message?: string
  error?: string
  requiresOTP?: boolean
  externalRef?: string
}

export interface PaymentStatusResult {
  success: boolean
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
  amount?: number
  provider?: MobileMoneyProvider
  completedAt?: string
  message?: string
  error?: string
}

export interface WithdrawalRequest {
  amount: number
  provider: MobileMoneyProvider
  phone: string
  pin: string
}

export interface WithdrawalResult {
  success: boolean
  transactionId?: string
  status?: 'pending' | 'processing' | 'completed' | 'failed'
  message?: string
  error?: string
  estimatedTime?: string
}

class MobileMoneyService {
  private readonly baseUrl = '/payments/mobile-money'

  /**
   * Get available mobile money providers
   */
  async getProviders(): Promise<MobileMoneyConfig[]> {
    try {
      const response = await apiService.get<ApiResponse<ProvidersResponse>>(`${this.baseUrl}/providers`)
      return response.data?.providers || this.getDefaultProviders()
    } catch (error) {
      console.error('Failed to fetch providers:', error)
      return this.getDefaultProviders()
    }
  }

  /**
   * Default providers configuration (fallback)
   */
  private getDefaultProviders(): MobileMoneyConfig[] {
    return [
      {
        provider: 'flooz',
        name: 'Flooz (Moov)',
        icon: 'flooz',
        color: '#00A651',
        phonePrefix: ['90', '91', '92', '93'],
        minAmount: 100,
        maxAmount: 500000,
        fees: { fixed: 0, percentage: 1.5 },
        enabled: true
      },
      {
        provider: 'tmoney',
        name: 'T-Money (Togocom)',
        icon: 'tmoney',
        color: '#E30613',
        phonePrefix: ['70', '71', '79'],
        minAmount: 100,
        maxAmount: 500000,
        fees: { fixed: 0, percentage: 1.5 },
        enabled: true
      },
      {
        provider: 'orange_money',
        name: 'Orange Money',
        icon: 'orange',
        color: '#FF7900',
        phonePrefix: ['96', '97'],
        minAmount: 100,
        maxAmount: 300000,
        fees: { fixed: 50, percentage: 1 },
        enabled: false
      },
      {
        provider: 'mtn_momo',
        name: 'MTN MoMo',
        icon: 'mtn',
        color: '#FFCC00',
        phonePrefix: ['95', '99'],
        minAmount: 100,
        maxAmount: 500000,
        fees: { fixed: 0, percentage: 1.5 },
        enabled: false
      }
    ]
  }

  /**
   * Initiate a mobile money payment
   */
  async initiatePayment(request: PaymentRequest): Promise<PaymentResult> {
    try {
      // Validate phone number
      const validation = this.validatePhone(request.phone, request.provider)
      if (!validation.valid) {
        return { success: false, error: validation.error }
      }

      // Validate amount
      const amountValidation = await this.validateAmount(request.amount, request.provider)
      if (!amountValidation.valid) {
        return { success: false, error: amountValidation.error }
      }

      const response = await apiService.post<ApiResponse<PaymentInitResponse>>(`${this.baseUrl}/initiate`, {
        amount: request.amount,
        provider: request.provider,
        phone: this.formatPhone(request.phone),
        purpose: request.purpose,
        reference: request.reference,
        metadata: request.metadata
      })

      if (response.success && response.data) {
        return {
          success: true,
          transactionId: response.data.transaction_id,
          status: response.data.status || 'pending',
          message: response.message || 'Paiement initié avec succès',
          requiresOTP: response.data.requires_otp,
          externalRef: response.data.external_ref
        }
      }

      return {
        success: false,
        error: response.message || 'Erreur lors de l\'initiation du paiement'
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Erreur de connexion'
      }
    }
  }

  /**
   * Confirm payment with OTP (if required)
   */
  async confirmPayment(transactionId: string, otp: string): Promise<PaymentResult> {
    try {
      const response = await apiService.post<ApiResponse<PaymentInitResponse>>(`${this.baseUrl}/confirm`, {
        transaction_id: transactionId,
        otp
      })

      if (response.success && response.data) {
        return {
          success: true,
          transactionId: response.data.transaction_id,
          status: response.data.status || 'completed',
          message: response.message || 'Paiement confirmé'
        }
      }

      return {
        success: false,
        error: response.message || 'Code incorrect'
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Erreur de confirmation'
      }
    }
  }

  /**
   * Check payment status
   */
  async checkStatus(transactionId: string): Promise<PaymentStatusResult> {
    try {
      const response = await apiService.get<ApiResponse<PaymentStatusResponse>>(`${this.baseUrl}/status/${transactionId}`)

      if (response.success && response.data) {
        return {
          success: true,
          status: response.data.status,
          amount: response.data.amount,
          provider: response.data.provider,
          completedAt: response.data.completed_at,
          message: response.message
        }
      }

      return {
        success: false,
        status: 'failed',
        error: response.message || 'Transaction non trouvée'
      }
    } catch (error: any) {
      return {
        success: false,
        status: 'failed',
        error: error.response?.data?.message || error.message || 'Erreur de vérification'
      }
    }
  }

  /**
   * Cancel a pending payment
   */
  async cancelPayment(transactionId: string): Promise<PaymentResult> {
    try {
      const response = await apiService.post<ApiResponse<void>>(`${this.baseUrl}/cancel`, {
        transaction_id: transactionId
      })

      if (response.success) {
        return {
          success: true,
          transactionId,
          status: 'failed',
          message: response.message || 'Paiement annulé'
        }
      }

      return {
        success: false,
        error: response.message || 'Impossible d\'annuler le paiement'
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Erreur d\'annulation'
      }
    }
  }

  /**
   * Initiate a withdrawal to mobile money
   */
  async initiateWithdrawal(request: WithdrawalRequest): Promise<WithdrawalResult> {
    try {
      // Validate phone
      const phoneValidation = this.validatePhone(request.phone, request.provider)
      if (!phoneValidation.valid) {
        return { success: false, error: phoneValidation.error }
      }

      const response = await apiService.post<ApiResponse<WithdrawalResponse>>(`${this.baseUrl}/withdraw`, {
        amount: request.amount,
        provider: request.provider,
        phone: this.formatPhone(request.phone),
        pin: request.pin
      })

      if (response.success && response.data) {
        return {
          success: true,
          transactionId: response.data.transaction_id,
          status: response.data.status || 'pending',
          message: response.message || 'Retrait initié avec succès',
          estimatedTime: response.data.estimated_time
        }
      }

      return {
        success: false,
        error: response.message || 'Erreur lors du retrait'
      }
    } catch (error: any) {
      // Handle specific error codes
      if (error.response?.status === 403) {
        return { success: false, error: 'Code PIN incorrect' }
      }
      if (error.response?.status === 400) {
        return { success: false, error: error.response?.data?.message || 'Données invalides' }
      }

      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Erreur de connexion'
      }
    }
  }

  /**
   * Calculate fees for a transaction
   */
  async calculateFees(amount: number, provider: MobileMoneyProvider): Promise<{
    fees: number
    total: number
    breakdown: { fixed: number; percentage: number }
  }> {
    try {
      const response = await apiService.post<ApiResponse<FeesResponse>>(`${this.baseUrl}/calculate-fees`, {
        amount,
        provider
      })

      if (response.success && response.data) {
        return response.data
      }
    } catch {
      // Fall back to local calculation
    }

    // Local calculation as fallback
    const providers = await this.getProviders()
    const config = providers.find(p => p.provider === provider)

    if (!config) {
      return { fees: 0, total: amount, breakdown: { fixed: 0, percentage: 0 } }
    }

    const percentageFee = Math.round(amount * config.fees.percentage / 100)
    const totalFees = config.fees.fixed + percentageFee

    return {
      fees: totalFees,
      total: amount + totalFees,
      breakdown: {
        fixed: config.fees.fixed,
        percentage: percentageFee
      }
    }
  }

  /**
   * Validate phone number for a specific provider
   */
  validatePhone(phone: string, provider: MobileMoneyProvider): { valid: boolean; error?: string } {
    const cleaned = phone.replace(/[\s\-()]/g, '')

    // Remove country code if present
    let localNumber = cleaned
    if (cleaned.startsWith('+228')) {
      localNumber = cleaned.substring(4)
    } else if (cleaned.startsWith('228')) {
      localNumber = cleaned.substring(3)
    }

    if (localNumber.length !== 8) {
      return { valid: false, error: 'Le numéro doit contenir 8 chiffres' }
    }

    if (!/^\d+$/.test(localNumber)) {
      return { valid: false, error: 'Le numéro ne doit contenir que des chiffres' }
    }

    // Check provider prefix
    const providers = this.getDefaultProviders()
    const config = providers.find(p => p.provider === provider)

    if (config) {
      const prefix = localNumber.substring(0, 2)
      if (!config.phonePrefix.includes(prefix)) {
        return {
          valid: false,
          error: `Ce numéro ne correspond pas à ${config.name}. Préfixes valides : ${config.phonePrefix.join(', ')}`
        }
      }
    }

    return { valid: true }
  }

  /**
   * Validate amount for a provider
   */
  async validateAmount(amount: number, provider: MobileMoneyProvider): Promise<{ valid: boolean; error?: string }> {
    if (amount <= 0) {
      return { valid: false, error: 'Le montant doit être supérieur à 0' }
    }

    const providers = await this.getProviders()
    const config = providers.find(p => p.provider === provider)

    if (!config) {
      return { valid: false, error: 'Fournisseur non trouvé' }
    }

    if (amount < config.minAmount) {
      return { valid: false, error: `Le montant minimum est de ${config.minAmount} XOF` }
    }

    if (amount > config.maxAmount) {
      return { valid: false, error: `Le montant maximum est de ${config.maxAmount} XOF` }
    }

    return { valid: true }
  }

  /**
   * Format phone number to standard format
   */
  formatPhone(phone: string): string {
    let cleaned = phone.replace(/[\s\-()]/g, '')

    // Ensure it starts with country code
    if (!cleaned.startsWith('+')) {
      if (cleaned.startsWith('00')) {
        cleaned = '+' + cleaned.substring(2)
      } else if (cleaned.length === 8) {
        cleaned = '+228' + cleaned
      } else if (!cleaned.startsWith('228')) {
        cleaned = '+228' + cleaned
      } else {
        cleaned = '+' + cleaned
      }
    }

    return cleaned
  }

  /**
   * Detect provider from phone number
   */
  detectProvider(phone: string): MobileMoneyProvider | null {
    const cleaned = phone.replace(/[\s\-()]/g, '')

    let localNumber = cleaned
    if (cleaned.startsWith('+228')) {
      localNumber = cleaned.substring(4)
    } else if (cleaned.startsWith('228')) {
      localNumber = cleaned.substring(3)
    }

    if (localNumber.length < 2) return null

    const prefix = localNumber.substring(0, 2)
    const providers = this.getDefaultProviders()

    for (const provider of providers) {
      if (provider.phonePrefix.includes(prefix)) {
        return provider.provider
      }
    }

    return null
  }

  /**
   * Get transaction history
   */
  async getTransactionHistory(filters?: {
    provider?: MobileMoneyProvider
    status?: string
    dateFrom?: string
    dateTo?: string
    limit?: number
    page?: number
  }): Promise<{
    transactions: TransactionRecord[]
    total: number
    page: number
    pages: number
  }> {
    try {
      // Build query string from filters
      let queryString = ''
      if (filters) {
        const params = new URLSearchParams()
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            params.append(key, String(value))
          }
        })
        const serialized = params.toString()
        if (serialized) {
          queryString = `?${serialized}`
        }
      }

      const response = await apiService.get<ApiResponse<TransactionHistoryResponse>>(`${this.baseUrl}/transactions${queryString}`)

      if (response.success && response.data) {
        return {
          transactions: response.data.transactions || [],
          total: response.data.total || 0,
          page: response.data.page || 1,
          pages: response.data.pages || 1
        }
      }
    } catch (error) {
      console.error('Failed to fetch transaction history:', error)
    }

    return { transactions: [], total: 0, page: 1, pages: 1 }
  }
}

export const mobileMoneyService = new MobileMoneyService()
