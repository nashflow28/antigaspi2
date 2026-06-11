import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { Alert } from 'react-native'
import * as NavigationRef from '../navigation/NavigationRef'
import { getGlobalAlert } from '../contexts/AlertContext'
import { API_CONFIG } from '../config/api.config'
import { apiLogger } from '../utils/logger'
// BUG FIX #C-006: Use SecureStore for sensitive authentication data
import { secureStorage } from './secureStorage'
import {
  ApiResponse,
  AuthResponse,
  LoginCredentials,
  RegisterData,
  Product,
  ProductFilters,
  Category,
  Reservation,
  ReservationCreationPayload,
  ReservationCreationResponse,
  User,
  Payment,
  PaymentInitiationResponse,
  MobileMoneyPaymentPayload,
  Review,
  ReviewStats,
  MerchantLocation,
  CartResponse,
  CartItemPayload,
  CartUpdatePayload,
  CartCheckoutPayload,
  CartCheckoutResponse,
  SurpriseBasket,
  SurpriseBasketFilters,
  PaginatedSurpriseBaskets,
  Wallet,
  WalletTransaction,
  WalletStats,
  WalletTransactionsResponse,
  WalletTransactionFilters,
  WalletRechargePayload,
  WalletPinPayload,
  WalletChangePinPayload,
  WalletStatusPayload,
  LoyaltyPointsSummary,
  LoyaltyRedemptionPayload,
  LoyaltyRedemptionData,
  BroadcastNotification,
  BroadcastResponse,
  AdminAnalyticsFilters,
  AdminAnalyticsData,
  AnalyticsExportResponse,
  Conversation,
  ConversationDetailResponse,
  ConversationListResponse,
  ConversationMessage,
  ConversationMessageResponse,
  Order,
  OrderCreationPayload,
  OrderCreationResponse,
  MerchantPaymentsResponse,
} from '../types'
import { getExpoExtraValue } from '../utils/expoConfig'

// Configuration dynamique de l'API (web/native) avec overrides propres
const getApiBaseUrl = (): string => {
  // 1) WEB (Expo Web / navigateur):
  //    - Priorité à EXPO_PUBLIC_API_URL (configurée via env)
  //    - Sinon auto-déduction depuis le hostname en gérant localhost vs LAN
  try {
    const { Platform } = require('react-native')
    if (Platform.OS === 'web') {
      // a) Variable d'env publique Expo si fournie
      const envUrl = (process.env.EXPO_PUBLIC_API_URL as string | undefined)?.trim()
      if (envUrl) {
        apiLogger.log('URL (EXPO_PUBLIC_API_URL):', envUrl)
        return envUrl
      }

      // b) Déduction depuis l'hôte courant (utile si ouvert depuis un téléphone)
      if (typeof window !== 'undefined' && window.location?.hostname) {
        const host = window.location.hostname
        // Si localhost/127 -> forcer 127 (évite IPv6 ::1 et soucis DNS)
        if (host === 'localhost' || host === '127.0.0.1' || host === '::1') {
          const url = 'http://127.0.0.1:8000/api'
          apiLogger.log('URL (web localhost):', url)
          return url
        }
        // Sinon, utiliser l'IP/host courant (accès LAN)
        const url = `http://${host}:8000/api`
        apiLogger.log('URL (web from current host):', url)
        return url
      }

      // c) Fallback ultime web
      const url = 'http://127.0.0.1:8000/api'
      apiLogger.log('URL (web fallback):', url)
      return url
    }
  } catch (error) {
    // BUG FIX #10: Non-critique: on continue vers les branches natives, mais log en dev
    if (__DEV__) {
      apiLogger.debug('Web platform check error (expected on native):', error)
    }
  }

  // 2) NATIVE (Android/iOS): priorité à app.json -> extra.apiUrl
  const configUrl = getExpoExtraValue<string>('apiUrl')?.trim()
  if (configUrl) {
    apiLogger.log('URL (from Expo extra):', configUrl)
    return configUrl
  }

  // 3) Émulateur Android (localhost côté hôte)
  const url = 'http://10.0.2.2:8000/api'
  apiLogger.log('URL (android emulator fallback):', url)
  return url
}

// Export pour utilisation dans d'autres services (ex: imageHelpers)
export const API_BASE_URL = getApiBaseUrl()

// SECURITY: Warn when using unencrypted HTTP in non-local contexts
if (API_BASE_URL.startsWith('http://') && !API_BASE_URL.includes('localhost') && !API_BASE_URL.includes('127.0.0.1') && !API_BASE_URL.includes('10.0.2.2')) {
  apiLogger.warn('[SECURITY] Using unencrypted HTTP connection:', API_BASE_URL)
}

// Helper pour transformer camelCase en snake_case (Laravel attend snake_case)
const toSnakeCase = (obj: any): any => {
  if (obj === null || typeof obj !== 'object') {
    return obj
  }

  if (Array.isArray(obj)) {
    return obj.map(toSnakeCase)
  }

  return Object.keys(obj).reduce((result: any, key: string) => {
    const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase()
    result[snakeKey] = toSnakeCase(obj[key])
    return result
  }, {})
}

class ApiService {
  private api: AxiosInstance
  private baseURL: string
  private onUnauthorizedCallback?: () => void

  // BUG FIX #5: Token refresh queue to prevent race conditions
  private isRefreshing: boolean = false
  private refreshSubscribers: Array<(token: string | null) => void> = []

  constructor() {
    this.baseURL = getApiBaseUrl()

    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: API_CONFIG.TIMEOUT.DEFAULT,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    })

    this.setupInterceptors()
  }

  // Enregistrer un callback pour gérer les erreurs 401 (session expirée)
  setOnUnauthorizedCallback(callback: () => void) {
    this.onUnauthorizedCallback = callback
  }

  // BUG FIX #5: Helper methods for token refresh queue
  private subscribeToTokenRefresh(callback: (token: string | null) => void) {
    this.refreshSubscribers.push(callback)
  }

  private onTokenRefreshed(token: string | null) {
    this.refreshSubscribers.forEach(callback => callback(token))
    this.refreshSubscribers = []
  }

  private setupInterceptors() {
    // Request interceptor pour ajouter le token JWT
    // BUG FIX #C-006: Use SecureStore for token retrieval
    this.api.interceptors.request.use(
      async (config) => {
        const token = await secureStorage.getToken()
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
          apiLogger.debug('Token présent pour:', config.method?.toUpperCase(), config.url)
        } else {
          apiLogger.warn('Pas de token pour:', config.method?.toUpperCase(), config.url)
        }
        return config
      },
      (error) => Promise.reject(error)
    )

    // Response interceptor pour gérer les erreurs globalement
    // BUG FIX #5: Use queue to prevent race conditions on concurrent 401 responses
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config

        if (error.response?.status === 401) {
          // 🐛 BUG FIX #40: Distinguish between login failures and expired sessions
          const requestUrl = error.config?.url || ''
          const isLoginRequest = requestUrl.includes('/auth/login') || requestUrl.includes('/login')
          const isRegisterRequest = requestUrl.includes('/auth/register') || requestUrl.includes('/register')

          // If it's a login/register request, let the component handle the error
          // (incorrect credentials, not an expired session)
          if (isLoginRequest || isRegisterRequest) {
            apiLogger.log('Login/Register failed - Invalid credentials')
            return Promise.reject(error)
          }

          // BUG FIX #5: Prevent multiple logout dialogs from concurrent 401 responses
          // If already handling session expiry, queue this request
          if (this.isRefreshing) {
            return new Promise((resolve, reject) => {
              this.subscribeToTokenRefresh((token) => {
                if (token) {
                  // Token was somehow refreshed, retry the request
                  originalRequest.headers.Authorization = `Bearer ${token}`
                  resolve(this.api(originalRequest))
                } else {
                  // No token, reject the request
                  reject(error)
                }
              })
            })
          }

          // Mark as refreshing to prevent duplicate dialogs
          this.isRefreshing = true

          // ✅ Token expiré, déconnecter l'utilisateur
          // BUG FIX #C-006: Use SecureStore for clearing auth data
          await secureStorage.clearAll()

          // ✅ Notifier le Redux store pour mettre à jour l'état d'authentification
          if (this.onUnauthorizedCallback) {
            this.onUnauthorizedCallback()
          }

          // Notify all queued requests that there's no token
          this.onTokenRefreshed(null)
          this.isRefreshing = false

          // ✅ Afficher message de session expirée avec popup stylisée
          const globalAlert = getGlobalAlert()
          if (globalAlert) {
            globalAlert({
              title: 'Session expirée',
              message: 'Votre session a expiré. Veuillez vous reconnecter.',
              type: 'warning',
              buttons: [
                {
                  text: 'OK',
                  onPress: () => {
                    apiLogger.log('Session expirée - Redirection automatique vers login')
                    NavigationRef.navigate('Auth', { screen: 'Login' })
                  }
                }
              ],
            })
          } else {
            // Fallback to native Alert if styled alert not available
            Alert.alert(
              'Session expirée',
              'Votre session a expiré. Veuillez vous reconnecter.',
              [
                {
                  text: 'OK',
                  onPress: () => {
                    apiLogger.log('Session expirée - Redirection automatique vers login')
                    NavigationRef.navigate('Auth', { screen: 'Login' })
                  }
                }
              ]
            )
          }
        }
        return Promise.reject(error)
      }
    )
  }

  private async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    try {
      // 🐛 BUG FIX: Detect FormData and remove Content-Type header
      // Let axios set the correct multipart/form-data boundary automatically
      const isFormData = data instanceof FormData
      apiLogger.log(`${method} ${url}`, data ? `(avec données${isFormData ? ' FormData' : ''})` : '')

      const requestConfig: AxiosRequestConfig = {
        method,
        url,
        data,
        ...config,
      }

      // For FormData, remove Content-Type to let axios/fetch set it with correct boundary
      if (isFormData) {
        requestConfig.headers = {
          ...requestConfig.headers,
          'Content-Type': undefined, // Let axios handle it
        }
        // Also increase timeout for file uploads
        requestConfig.timeout = API_CONFIG.TIMEOUT.UPLOAD
      }

      const response: AxiosResponse<T> = await this.api.request(requestConfig)
      apiLogger.debug(`${method} ${url} - Status:`, response.status)
      apiLogger.debug('Response.data type:', typeof response.data)
      apiLogger.debug('Response.data keys:', Object.keys(response.data || {}))
      return response.data
    } catch (error: any) {
      apiLogger.error(`${method} ${url} - Erreur:`, error?.message || error)
      apiLogger.debug('Status:', error.response?.status)
      apiLogger.debug('Response data:', error.response?.data)

      // 🐛 BUG FIX #24: Preserve validation errors for better error handling
      if (error.response?.status === 422 && error.response?.data?.errors) {
        // Validation error with detailed field errors
        const validationError: any = new Error(error.response.data.message || 'Erreurs de validation')
        validationError.validationErrors = error.response.data.errors
        validationError.statusCode = 422
        throw validationError
      }
      if (error.response?.data?.message) {
        const apiError: any = new Error(error.response.data.message)
        apiError.statusCode = error.response.status
        throw apiError
      }
      throw new Error(error.message || 'Une erreur est survenue')
    }
  }

  // === MÉTHODES HTTP GÉNÉRIQUES ===

  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>('GET', url, undefined, config)
  }

  /**
   * POST request - automatically redirects FormData to uploadFile() for reliability
   * ⚠️ IMPORTANT: axios has known issues with FormData on React Native
   * This method auto-detects FormData and uses native fetch instead
   */
  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    // 🐛 SAFEGUARD: Auto-redirect FormData to uploadFile() which uses native fetch
    // This prevents the "Network Error" bug with axios + FormData on React Native
    if (data instanceof FormData) {
      apiLogger.warn('FormData detected in post() - auto-redirecting to uploadFile() for reliability')
      return this.uploadFile<T>(url, data)
    }
    return this.request<T>('POST', url, data, config)
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>('PUT', url, data, config)
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>('DELETE', url, undefined, config)
  }

  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>('PATCH', url, data, config)
  }

  /**
   * Upload file using native fetch (more reliable than axios for FormData on React Native)
   */
  async uploadFile<T = any>(url: string, formData: FormData): Promise<T> {
    try {
      // BUG FIX #C-006: Use SecureStore for token retrieval
      const token = await secureStorage.getToken()
      const fullUrl = `${this.baseURL}${url}`

      apiLogger.log(`UPLOAD ${url} (FormData avec fetch natif)`)

      const response = await fetch(fullUrl, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          // Note: Do NOT set Content-Type for FormData - fetch will set it with boundary
        },
        body: formData,
      })

      const data = await response.json()

      apiLogger.debug(`UPLOAD ${url} - Status:`, response.status)
      apiLogger.debug('Response:', JSON.stringify(data).substring(0, 200))

      if (!response.ok) {
        const error: any = new Error(data.message || 'Upload failed')
        error.statusCode = response.status
        error.validationErrors = data.errors
        throw error
      }

      return data as T
    } catch (error: any) {
      apiLogger.error(`UPLOAD ${url} - Erreur:`, error?.message || error)
      throw error
    }
  }

  // === AUTHENTIFICATION ===

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('POST', '/auth/login', credentials)

    if (response.success && response.data.token) {
      try {
        // BUG FIX #C-006: Use SecureStore for token storage
        await secureStorage.setToken(response.data.token)
      } catch (error) {
        // Ne pas échouer si le stockage échoue - juste continuer
        apiLogger.error('Failed to store token:', error)
      }

      await this.setStoredUser(response.data.user)
    }

    return response
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('POST', '/auth/register', data)

    if (response.success && response.data.token) {
      // BUG FIX #C-006: Use SecureStore for token storage
      await secureStorage.setToken(response.data.token)
      await this.setStoredUser(response.data.user)
    }

    return response
  }

  async logout(): Promise<void> {
    try {
      await this.request('POST', '/auth/logout')
    } catch (error) {
      // Continuer même si l'API échoue (log silencieux)
      apiLogger.info('Logout API call failed, proceeding with local cleanup')
    } finally {
      // BUG FIX #C-006: Use SecureStore for clearing auth data
      await secureStorage.clearAll()
      await this.setStoredUser(null)
    }
  }

  async getProfile(): Promise<ApiResponse<User>> {
    return this.request<ApiResponse<User>>('GET', '/auth/me')
  }

  async deleteAccount(): Promise<ApiResponse<{ deleted: boolean }>> {
    return this.request<ApiResponse<{ deleted: boolean }>>('DELETE', '/auth/account')
  }

  // === PHONE-BASED AUTHENTICATION (OTP) ===

  /**
   * Register with phone number (after OTP verification)
   * Phone is the primary identifier, email is optional
   */
  async registerWithPhone(data: {
    phone: string
    first_name: string
    last_name: string
    email?: string
    role: 'consumer' | 'merchant'
    city?: string
    business_name?: string
    business_type?: string
  }): Promise<AuthResponse> {
    const snakeCaseData = toSnakeCase(data)
    const response = await this.request<AuthResponse>('POST', '/auth/register-phone', snakeCaseData)

    if (response.success && response.data.token) {
      await secureStorage.setToken(response.data.token)
      await this.setStoredUser(response.data.user)
    }

    return response
  }

  /**
   * Login with phone number (after OTP verification)
   * For existing users who have verified their phone via OTP
   */
  async loginWithPhone(phone: string): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('POST', '/auth/login-phone', { phone })

    if (response.success && response.data.token) {
      await secureStorage.setToken(response.data.token)
      await this.setStoredUser(response.data.user)
    }

    return response
  }

  // === PRODUITS ===

  async getProducts(filters?: ProductFilters): Promise<ApiResponse<Product[]>> {
    const params = new URLSearchParams()

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString())
        }
      })
    }

    const url = `/products${params.toString() ? `?${params.toString()}` : ''}`
    return this.request<ApiResponse<Product[]>>('GET', url)
  }

  async getProduct(id: number): Promise<ApiResponse<Product>> {
    return this.request<ApiResponse<Product>>('GET', `/products/${id}`)
  }

  async getCategories(): Promise<ApiResponse<Category[]>> {
    return this.request<ApiResponse<Category[]>>('GET', '/categories')
  }

  async getSurpriseBaskets(
    filters?: (SurpriseBasketFilters & { page?: number; perPage?: number; per_page?: number }) | undefined
  ): Promise<ApiResponse<PaginatedSurpriseBaskets>> {
    const params = new URLSearchParams()

    if (filters) {
      const normalizedFilters = toSnakeCase(filters) as Record<string, unknown>

      Object.entries(normalizedFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString())
        }
      })
    }

    const url = `/surprise-baskets${params.toString() ? `?${params.toString()}` : ''}`
    return this.request<ApiResponse<PaginatedSurpriseBaskets>>('GET', url)
  }

  async getSurpriseBasket(id: number): Promise<ApiResponse<SurpriseBasket>> {
    return this.request<ApiResponse<SurpriseBasket>>('GET', `/surprise-baskets/${id}`)
  }

  async getMerchants(params?: {
    latitude?: number
    longitude?: number
    radius?: number
    sort_by?: string
    per_page?: number
  }): Promise<ApiResponse<any[]>> {
    const queryString = params ? '?' + new URLSearchParams(
      Object.entries(params)
        .filter(([_, v]) => v !== undefined)
        .map(([k, v]) => [k, String(v)])
    ).toString() : ''
    return this.request<ApiResponse<any[]>>('GET', `/merchants${queryString}`)
  }

  // === RÉSERVATIONS ===

  async createReservation(payload: ReservationCreationPayload): Promise<ReservationCreationResponse> {
    // Transformer camelCase → snake_case pour Laravel
    const snakeCasePayload = toSnakeCase(payload)
    apiLogger.debug('createReservation payload:', JSON.stringify(snakeCasePayload, null, 2))
    try {
      const response = await this.request<ReservationCreationResponse>('POST', '/reservations', snakeCasePayload)
      apiLogger.debug('createReservation response:', JSON.stringify(response, null, 2))
      return response
    } catch (error: any) {
      apiLogger.error('createReservation error:', error)
      apiLogger.debug('Error message:', error.message)
      apiLogger.debug('Error statusCode:', error.statusCode)
      apiLogger.debug('Error validationErrors:', error.validationErrors)
      throw error
    }
  }

  async initiateMobileMoneyPayment(payload: MobileMoneyPaymentPayload): Promise<PaymentInitiationResponse> {
    // Transformer camelCase → snake_case pour Laravel
    const snakeCasePayload = toSnakeCase(payload)
    return this.request<PaymentInitiationResponse>('POST', '/payments/mobile-money', snakeCasePayload)
  }

  async getPayment(paymentId: number): Promise<ApiResponse<Payment>> {
    return this.request<ApiResponse<Payment>>('GET', `/payments/${paymentId}`)
  }

  async getMyReservations(): Promise<ApiResponse<Reservation[]>> {
    apiLogger.debug('Fetching my reservations...')
    const response = await this.request<ApiResponse<Reservation[]>>('GET', '/reservations')
    apiLogger.debug('Reservations received:', {
      success: response.success,
      count: response.data?.length || 0,
      reservations: response.data?.map(r => ({ id: r.id, code: r.reservation_code, status: r.status }))
    })
    return response
  }

  async getReservation(id: number): Promise<ApiResponse<Reservation>> {
    return this.request<ApiResponse<Reservation>>('GET', `/reservations/${id}`)
  }

  async cancelReservation(id: number): Promise<ApiResponse<Reservation>> {
    return this.request<ApiResponse<Reservation>>('POST', `/reservations/${id}/cancel`)
  }

  async updateReservationQuantity(id: number, quantity: number): Promise<ApiResponse<Reservation>> {
    return this.request<ApiResponse<Reservation>>('PATCH', `/reservations/${id}`, { quantity })
  }

  // === ORDERS (COMMANDES) ===

  async createOrder(payload: OrderCreationPayload): Promise<OrderCreationResponse> {
    const snakeCasePayload = toSnakeCase(payload)
    apiLogger.debug('createOrder payload:', JSON.stringify(snakeCasePayload, null, 2))
    try {
      const response = await this.request<OrderCreationResponse>('POST', '/orders', snakeCasePayload)
      apiLogger.debug('createOrder response:', JSON.stringify(response, null, 2))
      return response
    } catch (error: any) {
      apiLogger.error('createOrder error:', error)
      apiLogger.debug('Error message:', error.message)
      apiLogger.debug('Error statusCode:', error.statusCode)
      throw error
    }
  }

  async getOrders(): Promise<ApiResponse<Order[]>> {
    return this.request<ApiResponse<Order[]>>('GET', '/orders')
  }

  async getOrder(id: number): Promise<ApiResponse<Order>> {
    return this.request<ApiResponse<Order>>('GET', `/orders/${id}`)
  }

  async cancelOrder(id: number): Promise<ApiResponse<Order>> {
    return this.request<ApiResponse<Order>>('POST', `/orders/${id}/cancel`)
  }

  // === PANIER ===

  async getCart(): Promise<CartResponse> {
    return this.request<CartResponse>('GET', '/cart')
  }

  async addCartItem(payload: CartItemPayload): Promise<CartResponse> {
    const snakeCasePayload = toSnakeCase(payload)
    return this.request<CartResponse>('POST', '/cart/items', snakeCasePayload)
  }

  async updateCartItem(itemId: number, payload: CartUpdatePayload): Promise<CartResponse> {
    const snakeCasePayload = toSnakeCase(payload)
    return this.request<CartResponse>('PUT', `/cart/items/${itemId}`, snakeCasePayload)
  }

  async removeCartItem(itemId: number): Promise<CartResponse> {
    return this.request<CartResponse>('DELETE', `/cart/items/${itemId}`)
  }

  async clearCart(): Promise<CartResponse> {
    return this.request<CartResponse>('DELETE', '/cart')
  }

  async checkoutCart(payload: CartCheckoutPayload): Promise<CartCheckoutResponse> {
    const snakeCasePayload = toSnakeCase(payload)
    return this.request<CartCheckoutResponse>('POST', '/cart/checkout', snakeCasePayload)
  }

  // === WALLET ===

  async getWallet(): Promise<ApiResponse<{ wallet: Wallet }>> {
    return this.request<ApiResponse<{ wallet: Wallet }>>('GET', '/wallet')
  }

  async getWalletTransactions(
    filters?: WalletTransactionFilters,
    page: number = 1
  ): Promise<ApiResponse<WalletTransactionsResponse>> {
    const params = new URLSearchParams()

    if (filters) {
      const normalizedFilters = toSnakeCase(filters) as Record<string, unknown>
      Object.entries(normalizedFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString())
        }
      })
    }

    if (page > 1) {
      params.append('page', page.toString())
    }

    const query = params.toString()
    return this.request<ApiResponse<WalletTransactionsResponse>>(
      'GET',
      `/wallet/transactions${query ? `?${query}` : ''}`
    )
  }

  async getWalletStats(period: string = 'month'): Promise<ApiResponse<WalletStats>> {
    return this.request<ApiResponse<WalletStats>>('GET', `/wallet/stats?period=${period}`)
  }

  // BUG FIX #22: Force currency: 'XOF' in wallet recharge to prevent currency mismatch errors
  async rechargeWallet(payload: WalletRechargePayload): Promise<ApiResponse<{ transaction?: WalletTransaction }>> {
    const normalizedPayload = { ...toSnakeCase(payload), currency: 'XOF' }
    return this.request<ApiResponse<{ transaction?: WalletTransaction }>>(
      'POST',
      '/wallet/recharge',
      normalizedPayload
    )
  }

  async setWalletPin(payload: WalletPinPayload): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>('POST', '/wallet/pin', payload)
  }

  async changeWalletPin(payload: WalletChangePinPayload): Promise<ApiResponse<any>> {
    const normalizedPayload = toSnakeCase(payload)
    return this.request<ApiResponse<any>>('PUT', '/wallet/pin', normalizedPayload)
  }

  async toggleWalletStatus(payload: WalletStatusPayload): Promise<ApiResponse<{ wallet: { is_active: boolean } }>> {
    const normalizedPayload = toSnakeCase(payload)
    return this.request<ApiResponse<{ wallet: { is_active: boolean } }>>(
      'PUT',
      '/wallet/status',
      normalizedPayload
    )
  }

  async updateWalletDailyLimit(
    dailyLimit: number
  ): Promise<ApiResponse<{ wallet: { daily_limit: number; remaining_daily_limit: number } }>> {
    const normalizedPayload = toSnakeCase({ dailyLimit })
    return this.request<ApiResponse<{ wallet: { daily_limit: number; remaining_daily_limit: number } }>>(
      'PUT',
      '/wallet/daily-limit',
      normalizedPayload
    )
  }

  /**
   * Test recharge - Development only
   * Allows testing wallet functionality without real payment APIs
   */
  async testRechargeWallet(
    amount: number
  ): Promise<ApiResponse<{ transaction: any; wallet: { balance: number } }>> {
    return this.request<ApiResponse<{ transaction: any; wallet: { balance: number } }>>(
      'POST',
      '/wallet/test-recharge',
      { amount }
    )
  }

  // ==================== Account PIN Management ====================

  /**
   * Change account authentication PIN
   * Requires current PIN verification
   */
  async changePin(payload: {
    current_pin: string
    new_pin: string
    new_pin_confirmation: string
  }): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>('POST', '/auth/device/change-pin', payload)
  }

  /**
   * Set account authentication PIN (for new users)
   */
  async setPin(payload: {
    pin: string
    pin_confirmation: string
  }): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>('POST', '/auth/device/set-pin', payload)
  }

  async getFavoriteIds(): Promise<ApiResponse<number[]>> {
    return this.request<ApiResponse<number[]>>('GET', '/favorites/batch-check')
  }

  async toggleFavorite(productId: number): Promise<{ success: boolean; message: string; is_favorite: boolean }> {
    return this.request<{ success: boolean; message: string; is_favorite: boolean }>(
      'POST',
      `/favorites/${productId}/toggle`
    )
  }

  async checkFavorite(productId: number): Promise<{ success: boolean; is_favorite: boolean }> {
    return this.request<{ success: boolean; is_favorite: boolean }>(
      'GET',
      `/favorites/check/${productId}`
    )
  }

  // 🐛 BUG FIX #MOB-C-001: Add missing getFavorites() method called by favoritesSlice
  async getFavorites(): Promise<ApiResponse<Product[]>> {
    return this.request<ApiResponse<Product[]>>('GET', '/favorites')
  }

  // === LOYALTY ===

  async getLoyaltyPoints(): Promise<ApiResponse<LoyaltyPointsSummary>> {
    return this.request<ApiResponse<LoyaltyPointsSummary>>('GET', '/loyalty/my-points')
  }

  async redeemLoyaltyPoints(
    payload: LoyaltyRedemptionPayload
  ): Promise<ApiResponse<LoyaltyRedemptionData>> {
    return this.request<ApiResponse<LoyaltyRedemptionData>>('POST', '/loyalty/redeem', payload)
  }

  // === REVIEWS (AVIS) ===

  async getReviews(params: {
    merchantId: number
    productId?: number
    rating?: number
    page?: number
    perPage?: number
  }): Promise<ApiResponse<Review[]>> {
    const queryParams = new URLSearchParams()
    queryParams.append('merchant_id', params.merchantId.toString())

    if (params.productId) queryParams.append('product_id', params.productId.toString())
    if (params.rating) queryParams.append('rating', params.rating.toString())
    if (params.page) queryParams.append('page', params.page.toString())
    if (params.perPage) queryParams.append('per_page', params.perPage.toString())

    return this.request<ApiResponse<Review[]>>('GET', `/reviews?${queryParams.toString()}`)
  }

  async getReviewStats(merchantId: number): Promise<ApiResponse<ReviewStats>> {
    return this.request<ApiResponse<ReviewStats>>('GET', `/reviews/stats?merchant_id=${merchantId}`)
  }

  async createReview(data: {
    merchantId: number
    productId?: number
    rating: number
    title?: string
    comment?: string
  }): Promise<ApiResponse<any>> {
    const snakeCaseData = toSnakeCase(data)
    return this.request<ApiResponse<any>>('POST', '/reviews', snakeCaseData)
  }

  async updateReview(
    reviewId: number,
    data: {
      rating: number
      title?: string
      comment?: string
    }
  ): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>('PUT', `/reviews/${reviewId}`, data)
  }

  async deleteReview(reviewId: number): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>('DELETE', `/reviews/${reviewId}`)
  }

  // === MERCHANTS ===

  async getMerchantLocation(): Promise<ApiResponse<MerchantLocation>> {
    return this.request<ApiResponse<MerchantLocation>>('GET', '/merchants/location')
  }

  async updateMerchantLocation(payload: { latitude: number; longitude: number }): Promise<ApiResponse<MerchantLocation>> {
    return this.request<ApiResponse<MerchantLocation>>('PUT', '/merchants/location', payload)
  }

  // === MERCHANT PAYMENTS ===

  async getMerchantPayments(params?: {
    page?: number
    per_page?: number
    status?: string
    method?: string
    date_from?: string
    date_to?: string
    min_amount?: number
    max_amount?: number
    search?: string
  }): Promise<ApiResponse<MerchantPaymentsResponse>> {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString())
    if (params?.status && params.status !== 'all') queryParams.append('status', params.status)
    if (params?.method && params.method !== 'all') queryParams.append('method', params.method)
    if (params?.date_from) queryParams.append('date_from', params.date_from)
    if (params?.date_to) queryParams.append('date_to', params.date_to)
    if (params?.min_amount) queryParams.append('min_amount', params.min_amount.toString())
    if (params?.max_amount) queryParams.append('max_amount', params.max_amount.toString())
    if (params?.search) queryParams.append('search', params.search)

    const query = queryParams.toString()
    return this.request<ApiResponse<MerchantPaymentsResponse>>(
      'GET',
      `/merchant/payments${query ? `?${query}` : ''}`
    )
  }

  // === ADMIN ANALYTICS ===

  async getAdminAnalytics(filters?: AdminAnalyticsFilters): Promise<AdminAnalyticsData> {
    const params = new URLSearchParams()
    if (filters?.period) params.append('period', filters.period)
    if (filters?.start_date) params.append('start_date', filters.start_date)
    if (filters?.end_date) params.append('end_date', filters.end_date)

    const response = await this.request<ApiResponse<AdminAnalyticsData>>(
      'GET',
      `/admin/analytics/stats?${params.toString()}`
    )
    return response.data
  }

  async exportAnalytics(
    format: 'csv' | 'pdf',
    filters?: AdminAnalyticsFilters
  ): Promise<AnalyticsExportResponse> {
    const params = new URLSearchParams()
    params.append('format', format)
    if (filters?.period) params.append('period', filters.period)
    if (filters?.start_date) params.append('start_date', filters.start_date)
    if (filters?.end_date) params.append('end_date', filters.end_date)

    const response = await this.request<ApiResponse<AnalyticsExportResponse>>(
      'POST',
      `/admin/analytics/export?${params.toString()}`
    )
    return response.data
  }

  // === ADMIN AUDIT LOGS ===

  async getAuditLogs(filters?: {
    action?: string
    entity_type?: string
    admin_id?: number
    start_date?: string
    end_date?: string
    search?: string
    per_page?: number
    page?: number
  }): Promise<ApiResponse<{
    data: Array<{
      id: number
      admin_id: number
      action: string
      entity_type: string
      entity_id?: number | null
      reason?: string | null
      old_values?: Record<string, unknown> | null
      new_values?: Record<string, unknown> | null
      ip_address?: string | null
      user_agent?: string | null
      created_at: string
      admin?: { id: number; first_name: string; last_name: string; email?: string | null } | null
    }>
    meta: { current_page: number; last_page: number; per_page: number; total: number }
  }>> {
    const params = new URLSearchParams()
    if (filters?.action) params.append('action', filters.action)
    if (filters?.entity_type) params.append('entity_type', filters.entity_type)
    if (filters?.admin_id) params.append('admin_id', filters.admin_id.toString())
    if (filters?.start_date) params.append('start_date', filters.start_date)
    if (filters?.end_date) params.append('end_date', filters.end_date)
    if (filters?.search) params.append('search', filters.search)
    if (filters?.per_page) params.append('per_page', filters.per_page.toString())
    if (filters?.page) params.append('page', filters.page.toString())

    return this.request('GET', `/admin/audit?${params.toString()}`)
  }

  async getAuditLogStats(period: string = 'week'): Promise<ApiResponse<{
    total_actions: number
    today_actions: number
    week_actions: number
    active_admins: number
    actions_by_type: Record<string, number>
    actions_by_entity: Record<string, number>
  }>> {
    return this.request('GET', `/admin/audit/stats?period=${period}`)
  }

  async getAuditLogDetail(id: number): Promise<ApiResponse<{
    id: number
    admin_id: number
    action: string
    entity_type: string
    entity_id?: number | null
    reason?: string | null
    old_values?: Record<string, unknown> | null
    new_values?: Record<string, unknown> | null
    ip_address?: string | null
    user_agent?: string | null
    created_at: string
    admin?: { id: number; first_name: string; last_name: string; email?: string | null } | null
  }>> {
    return this.request('GET', `/admin/audit/${id}`)
  }

  async getAuditLogActions(): Promise<ApiResponse<{
    actions: Array<{ value: string; label: string }>
    entity_types: Array<{ value: string; label: string }>
  }>> {
    return this.request('GET', '/admin/audit/actions')
  }

  // === BROADCAST NOTIFICATIONS ===

  async sendBroadcastNotification(data: BroadcastNotification): Promise<BroadcastResponse> {
    const response = await this.request<ApiResponse<BroadcastResponse>>(
      'POST',
      '/notifications/broadcast',
      data
    )
    return response.data
  }

  // === MESSAGERIE ===

  async getConversations(includeArchived = false): Promise<ApiResponse<ConversationListResponse>> {
    const query = includeArchived ? '?include_archived=1' : ''
    return this.request<ApiResponse<ConversationListResponse>>(
      'GET',
      `/messaging/conversations${query}`
    )
  }

  async createConversation(payload: { merchantId?: number; consumerId?: number }): Promise<ApiResponse<{ conversation: Conversation }>> {
    const normalized = toSnakeCase(payload)
    return this.request<ApiResponse<{ conversation: Conversation }>>(
      'POST',
      '/messaging/conversations',
      normalized
    )
  }

  async getConversation(
    conversationId: number,
    options: { perPage?: number; page?: number } = {}
  ): Promise<ApiResponse<ConversationDetailResponse>> {
    const params = new URLSearchParams()

    if (options.perPage) {
      params.append('per_page', options.perPage.toString())
    }

    if (options.page && options.page > 1) {
      params.append('page', options.page.toString())
    }

    const query = params.toString()

    return this.request<ApiResponse<ConversationDetailResponse>>(
      'GET',
      `/messaging/conversations/${conversationId}${query ? `?${query}` : ''}`
    )
  }

  async updateConversation(
    conversationId: number,
    payload: { archived?: boolean }
  ): Promise<ApiResponse<{ conversation: Conversation }>> {
    return this.request<ApiResponse<{ conversation: Conversation }>>(
      'PUT',
      `/messaging/conversations/${conversationId}`,
      payload
    )
  }

  async sendMessage(
    conversationId: number,
    content: string
  ): Promise<ApiResponse<ConversationMessageResponse>> {
    return this.request<ApiResponse<ConversationMessageResponse>>(
      'POST',
      `/messaging/conversations/${conversationId}/messages`,
      { content }
    )
  }

  async updateMessage(
    messageId: number,
    content: string
  ): Promise<ApiResponse<{ message: ConversationMessage }>> {
    return this.request<ApiResponse<{ message: ConversationMessage }>>(
      'PUT',
      `/messaging/messages/${messageId}`,
      { content }
    )
  }

  async deleteMessage(messageId: number): Promise<ApiResponse<{ message_id: number }>> {
    return this.request<ApiResponse<{ message_id: number }>>(
      'DELETE',
      `/messaging/messages/${messageId}`
    )
  }

  // === UTILITAIRES ===

  async checkConnection(): Promise<boolean> {
    try {
      await this.request('GET', '/health')
      return true
    } catch (error) {
      return false
    }
  }

  // BUG FIX #C-006: Use SecureStore for user data
  async setStoredUser(user: User | null): Promise<void> {
    try {
      if (user) {
        await secureStorage.setUserData(user)
      } else {
        await secureStorage.removeUserData()
      }
    } catch (error) {
      // Ignorer les erreurs de persistance pour éviter de casser le flux utilisateur
      apiLogger.error('Failed to store user data:', error)
    }
  }

  // Récupérer les données utilisateur depuis le stockage sécurisé
  async getStoredUser(): Promise<User | null> {
    try {
      return await secureStorage.getUserData<User>()
    } catch (error) {
      return null
    }
  }

  // Récupérer le token depuis le stockage sécurisé
  async getStoredToken(): Promise<string | null> {
    return await secureStorage.getToken()
  }

  // Nettoyer les données d'authentification stockées
  async clearStoredAuth(): Promise<void> {
    try {
      await secureStorage.clearAll()
      apiLogger.log('Données d\'authentification nettoyées')
    } catch (error) {
      apiLogger.error('Erreur lors du nettoyage des données d\'auth:', error)
    }
  }
}

export const apiService = new ApiService()
export default apiService
