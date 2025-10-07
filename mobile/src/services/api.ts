import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'
import Constants from 'expo-constants'
import { Alert } from 'react-native'
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
  MobileMoneyPaymentPayload
} from '../types'

// Configuration dynamique de l'API via app.json
const getApiBaseUrl = (): string => {
  const configUrl = Constants.expoConfig?.extra?.apiUrl
  if (configUrl && typeof configUrl === 'string') {
    return configUrl
  }
  // Fallback pour développement local
  return 'http://localhost:8000/api'
}

// Export pour utilisation dans d'autres services (ex: imageHelpers)
export const API_BASE_URL = getApiBaseUrl()

class ApiService {
  private api: AxiosInstance
  private baseURL: string

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

          // ✅ Afficher message de session expirée
          Alert.alert(
            'Session expirée',
            'Votre session a expiré. Veuillez vous reconnecter.',
            [
              {
                text: 'OK',
                onPress: () => {
                  console.log('Session expirée - Redirection manuelle nécessaire')
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

  // === AUTHENTIFICATION ===

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('POST', '/auth/login', credentials)

    if (response.success && response.data.token) {
      // Sauvegarder le token et les données utilisateur
      await AsyncStorage.setItem('auth_token', response.data.token)
      await AsyncStorage.setItem('user_data', JSON.stringify(response.data.user))
    }

    return response
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('POST', '/auth/register', data)

    if (response.success && response.data.token) {
      await AsyncStorage.setItem('auth_token', response.data.token)
      await AsyncStorage.setItem('user_data', JSON.stringify(response.data.user))
    }

    return response
  }

  async logout(): Promise<void> {
    try {
      await this.request('POST', '/auth/logout')
    } catch (error) {
      // Continuer même si l'API échoue
      console.error('Logout API error:', error)
    } finally {
      // Toujours nettoyer le stockage local
      await AsyncStorage.multiRemove(['auth_token', 'user_data'])
    }
  }

  async getProfile(): Promise<ApiResponse<User>> {
    return this.request<ApiResponse<User>>('GET', '/auth/profile')
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

  async getMerchants(): Promise<ApiResponse<any[]>> {
    return this.request<ApiResponse<any[]>>('GET', '/merchants')
  }

  // === RÉSERVATIONS ===

  async createReservation(payload: ReservationCreationPayload): Promise<ReservationCreationResponse> {
    return this.request<ReservationCreationResponse>('POST', '/reservations', payload)
  }

  async initiateMobileMoneyPayment(payload: MobileMoneyPaymentPayload): Promise<PaymentInitiationResponse> {
    return this.request<PaymentInitiationResponse>('POST', '/payments/mobile-money', {
      reservation_id: payload.reservationId,
      provider: payload.provider,
      customer_phone: payload.customerPhone,
      customer_email: payload.customerEmail,
      currency: payload.currency,
      notes: payload.notes,
      reference: payload.reference,
    })
  }

  async getPayment(paymentId: number): Promise<ApiResponse<Payment>> {
    return this.request<ApiResponse<Payment>>('GET', `/payments/${paymentId}`)
  }

  async getMyReservations(): Promise<ApiResponse<Reservation[]>> {
    return this.request<ApiResponse<Reservation[]>>('GET', '/reservations/my')
  }

  async getReservation(id: number): Promise<ApiResponse<Reservation>> {
    return this.request<ApiResponse<Reservation>>('GET', `/reservations/${id}`)
  }

  async cancelReservation(id: number): Promise<ApiResponse<Reservation>> {
    return this.request<ApiResponse<Reservation>>('POST', `/reservations/${id}/cancel`)
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
