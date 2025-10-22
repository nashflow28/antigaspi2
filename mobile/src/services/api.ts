import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'
import Constants from 'expo-constants'
import { Alert } from 'react-native'
import * as NavigationRef from '../navigation/NavigationRef'
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
} from '../types'

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
        console.log('🔗 API URL (EXPO_PUBLIC_API_URL):', envUrl)
        return envUrl
      }

      // b) Déduction depuis l'hôte courant (utile si ouvert depuis un téléphone)
      if (typeof window !== 'undefined' && window.location?.hostname) {
        const host = window.location.hostname
        // Si localhost/127 -> forcer 127 (évite IPv6 ::1 et soucis DNS)
        if (host === 'localhost' || host === '127.0.0.1' || host === '::1') {
          const url = 'http://127.0.0.1:8000/api'
          console.log('🔗 API URL (web localhost):', url)
          return url
        }
        // Sinon, utiliser l’IP/host courant (accès LAN)
        const url = `http://${host}:8000/api`
        console.log('🔗 API URL (web from current host):', url)
        return url
      }

      // c) Fallback ultime web
      const url = 'http://127.0.0.1:8000/api'
      console.log('🔗 API URL (web fallback):', url)
      return url
    }
  } catch (_) {
    // Non-critique: on continue vers les branches natives
  }

  // 2) NATIVE (Android/iOS): priorité à app.json -> extra.apiUrl
  const configUrl = Constants.expoConfig?.extra?.apiUrl
  if (configUrl && typeof configUrl === 'string') {
    console.log('🔗 API URL (from app.json extra):', configUrl)
    return configUrl
  }

  // 3) Émulateur Android (localhost côté hôte)
  const url = 'http://10.0.2.2:8000/api'
  console.log('🔗 API URL (android emulator fallback):', url)
  return url
}

// Export pour utilisation dans d'autres services (ex: imageHelpers)
export const API_BASE_URL = getApiBaseUrl()

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

  constructor() {
    this.baseURL = getApiBaseUrl()

    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
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

  private setupInterceptors() {
    // Request interceptor pour ajouter le token JWT
    this.api.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem('auth_token')
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => Promise.reject(error)
    )

    // Response interceptor pour gérer les erreurs globalement
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // ✅ Token expiré, déconnecter l'utilisateur
          await AsyncStorage.multiRemove(['auth_token', 'user_data'])

          // ✅ Notifier le Redux store pour mettre à jour l'état d'authentification
          if (this.onUnauthorizedCallback) {
            this.onUnauthorizedCallback()
          }

          // ✅ Afficher message de session expirée
          Alert.alert(
            'Session expirée',
            'Votre session a expiré. Veuillez vous reconnecter.',
            [
              {
                text: 'OK',
                onPress: () => {
                  console.log('Session expirée - Redirection automatique vers login')
                  NavigationRef.navigate('Login')
                }
              }
            ]
          )
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
      const response: AxiosResponse<T> = await this.api.request({
        method,
        url,
        data,
        ...config,
      })
      return response.data
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message)
      }
      throw new Error(error.message || 'Une erreur est survenue')
    }
  }

  // === MÉTHODES HTTP GÉNÉRIQUES ===

  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>('GET', url, undefined, config)
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
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

  // === AUTHENTIFICATION ===

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('POST', '/auth/login', credentials)

    if (response.success && response.data.token) {
      try {
        // Sauvegarder le token et les données utilisateur
        await AsyncStorage.setItem('auth_token', response.data.token)
      } catch (error) {
        // Ne pas échouer si AsyncStorage échoue - juste en continuer
      }

      await this.setStoredUser(response.data.user)
    }

    return response
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('POST', '/auth/register', data)

    if (response.success && response.data.token) {
      await AsyncStorage.setItem('auth_token', response.data.token)
      await this.setStoredUser(response.data.user)
    }

    return response
  }

  async logout(): Promise<void> {
    try {
      await this.request('POST', '/auth/logout')
    } catch (error) {
      // Continuer même si l'API échoue (log silencieux)
      console.log('Info: Logout API call failed, proceeding with local cleanup')
    } finally {
      // Toujours nettoyer le stockage local
      await AsyncStorage.multiRemove(['auth_token', 'user_data'])
      await this.setStoredUser(null)
    }
  }

  async getProfile(): Promise<ApiResponse<User>> {
    return this.request<ApiResponse<User>>('GET', '/auth/me')
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

  async getMerchants(): Promise<ApiResponse<any[]>> {
    return this.request<ApiResponse<any[]>>('GET', '/merchants')
  }

  // === RÉSERVATIONS ===

  async createReservation(payload: ReservationCreationPayload): Promise<ReservationCreationResponse> {
    // Transformer camelCase → snake_case pour Laravel
    const snakeCasePayload = toSnakeCase(payload)
    return this.request<ReservationCreationResponse>('POST', '/reservations', snakeCasePayload)
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
    return this.request<ApiResponse<Reservation[]>>('GET', '/reservations')
  }

  async getReservation(id: number): Promise<ApiResponse<Reservation>> {
    return this.request<ApiResponse<Reservation>>('GET', `/reservations/${id}`)
  }

  async cancelReservation(id: number): Promise<ApiResponse<Reservation>> {
    return this.request<ApiResponse<Reservation>>('POST', `/reservations/${id}/cancel`)
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

  async rechargeWallet(payload: WalletRechargePayload): Promise<ApiResponse<{ transaction?: WalletTransaction }>> {
    const normalizedPayload = toSnakeCase(payload)
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

  // === FAVORIS ===

  async getFavorites(): Promise<ApiResponse<Product[]>> {
    return this.request<ApiResponse<Product[]>>('GET', '/favorites')
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

  // === BROADCAST NOTIFICATIONS ===

  async sendBroadcastNotification(data: BroadcastNotification): Promise<BroadcastResponse> {
    const response = await this.request<ApiResponse<BroadcastResponse>>(
      'POST',
      '/notifications/broadcast',
      data
    )
    return response.data
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

  async setStoredUser(user: User | null): Promise<void> {
    try {
      if (user) {
        await AsyncStorage.setItem('user_data', JSON.stringify(user))
      } else {
        await AsyncStorage.removeItem('user_data')
      }
    } catch (error) {
      // Ignorer les erreurs de persistance pour éviter de casser le flux utilisateur
    }
  }

  // Récupérer les données utilisateur depuis le stockage local
  async getStoredUser(): Promise<User | null> {
    try {
      const userData = await AsyncStorage.getItem('user_data')
      return userData ? JSON.parse(userData) : null
    } catch (error) {
      return null
    }
  }

  // Récupérer le token depuis le stockage local
  async getStoredToken(): Promise<string | null> {
    return await AsyncStorage.getItem('auth_token')
  }
}

export const apiService = new ApiService()
export default apiService
