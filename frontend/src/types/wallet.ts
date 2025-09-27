export interface Wallet {
  id: number
  balance: number
  formatted_balance: string
  currency: string
  daily_limit: number
  remaining_daily_limit: number
  is_active: boolean
  has_pin: boolean
  last_transaction_at: string | null
}

export interface WalletTransaction {
  id: number
  wallet_id: number
  payment_id: number | null
  type: 'credit' | 'debit'
  amount: number
  formatted_amount: string
  description: string
  reference: string
  metadata: Record<string, any>
  created_at: string
  updated_at: string
  payment?: {
    id: number
    reference: string
    status: string
  }
}

export interface WalletStats {
  current_balance: number
  daily_limit: number
  remaining_daily_limit: number
  period: string
  period_stats: {
    total_credits: number
    total_debits: number
    transaction_count: number
    credit_count: number
    debit_count: number
  }
}

export interface TransactionFilters {
  type?: 'credit' | 'debit'
  date_from?: string
  date_to?: string
  amount_min?: number
  amount_max?: number
  per_page?: number
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    current_page: number
    last_page: number
    per_page: number
    total: number
    from: number
    to: number
  }
}

export interface WalletPaymentRequest {
  amount: number
  pin: string
  description?: string
}

export interface WalletRechargeRequest {
  amount: number
  payment_method: 'flooz' | 'tmoney' | 'paystack'
  phone?: string
}

export interface WalletPinRequest {
  pin: string
}

export interface WalletChangePinRequest {
  current_pin: string
  new_pin: string
}

export interface WalletStatusRequest {
  is_active: boolean
}

export interface WalletDailyLimitRequest {
  daily_limit: number
}

export interface WalletTransferRequest {
  receiver_id: number
  amount: number
  pin: string
  description?: string
}

export interface ApiResponse<T = any> {
  success: boolean
  message: string
  data?: T
  errors?: Record<string, string[]>
}
