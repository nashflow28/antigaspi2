import { useNetworkError } from '@/composables/useNetworkError'
import { useAuthStore } from '@/stores/auth'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

interface ApiConfig {
  timeout?: number
  retries?: number
  requiresAuth?: boolean
}

const defaultConfig: ApiConfig = {
  timeout: 30000,
  retries: 3,
  requiresAuth: true
}

export class ApiClient {
  private baseURL: string
  private networkError = useNetworkError()

  constructor(baseURL: string = BASE_URL) {
    this.baseURL = baseURL
  }

  private getAuthHeaders(): Record<string, string> {
    const authStore = useAuthStore()
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }

    if (authStore.token) {
      headers.Authorization = `Bearer ${authStore.token}`
    }

    return headers
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {},
    config: ApiConfig = {}
  ): Promise<T> {
    const finalConfig = { ...defaultConfig, ...config }

    const url = `${this.baseURL}${endpoint}`

    const requestOptions: RequestInit = {
      ...options,
      headers: {
        ...this.getAuthHeaders(),
        ...options.headers
      }
    }

    // Créer un AbortController pour le timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), finalConfig.timeout)

    try {
      const response = await this.networkError.fetchWithRetry(
        url,
        {
          ...requestOptions,
          signal: controller.signal
        },
        {
          maxRetries: finalConfig.retries
        }
      )

      clearTimeout(timeoutId)

      // Gérer les erreurs d'authentification
      if (response.status === 401 && finalConfig.requiresAuth) {
        const authStore = useAuthStore()
        await authStore.logout()
        throw new Error('Session expirée')
      }

      // Gérer les autres erreurs HTTP
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const error = new Error(errorData.message || `HTTP ${response.status}`)
        ;(error as any).status = response.status
        ;(error as any).data = errorData
        throw error
      }

      return await response.json()

    } catch (error) {
      clearTimeout(timeoutId)

      // Gestion spéciale pour AbortError (timeout)
      if ((error as any)?.name === 'AbortError') {
        const timeoutError = new Error('Délai de connexion dépassé')
        ;(timeoutError as any).code = 'TIMEOUT'
        throw timeoutError
      }

      throw error
    }
  }

  // Méthodes HTTP principales
  async get<T>(endpoint: string, config?: ApiConfig): Promise<T> {
    return this.makeRequest<T>(endpoint, { method: 'GET' }, config)
  }

  async post<T>(endpoint: string, data?: any, config?: ApiConfig): Promise<T> {
    return this.makeRequest<T>(
      endpoint,
      {
        method: 'POST',
        body: data ? JSON.stringify(data) : undefined
      },
      config
    )
  }

  async put<T>(endpoint: string, data?: any, config?: ApiConfig): Promise<T> {
    return this.makeRequest<T>(
      endpoint,
      {
        method: 'PUT',
        body: data ? JSON.stringify(data) : undefined
      },
      config
    )
  }

  async patch<T>(endpoint: string, data?: any, config?: ApiConfig): Promise<T> {
    return this.makeRequest<T>(
      endpoint,
      {
        method: 'PATCH',
        body: data ? JSON.stringify(data) : undefined
      },
      config
    )
  }

  async delete<T>(endpoint: string, config?: ApiConfig): Promise<T> {
    return this.makeRequest<T>(endpoint, { method: 'DELETE' }, config)
  }

  // Méthodes spécialisées pour l'app
  async uploadFile<T>(endpoint: string, file: File, config?: ApiConfig): Promise<T> {
    const formData = new FormData()
    formData.append('file', file)

    const requestOptions: RequestInit = {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': this.getAuthHeaders().Authorization || ''
      }
    }

    return this.makeRequest<T>(endpoint, requestOptions, config)
  }

  // Health check sans authentification
  async healthCheck(): Promise<{ status: string }> {
    return this.get('/health', { requiresAuth: false, retries: 1, timeout: 5000 })
  }
}

// Instance globale
export const api = new ApiClient()

// Helpers pour les endpoints courants
export const apiEndpoints = {
  // Auth
  login: '/auth/login',
  register: '/auth/register',
  logout: '/auth/logout',
  me: '/auth/me',

  // Products
  products: '/products',
  product: (id: number) => `/products/${id}`,

  // Reservations
  reservations: '/reservations',
  reservation: (id: number) => `/reservations/${id}`,

  // Merchants
  merchants: '/merchants',
  merchantsWithLocation: '/merchants/all-with-location',
  merchant: (id: number) => `/merchants/${id}`,

  // Reviews
  reviews: '/reviews',
  review: (id: number) => `/reviews/${id}`,

  // Admin
  adminUsers: '/admin/users',
  adminMerchants: '/admin/merchants',
  adminCategories: '/admin/categories',
  adminReviews: '/admin/reviews',

  // Notifications
  notifications: '/notifications',
  notificationRead: (id: number) => `/notifications/${id}/read`,
  notificationsReadAll: '/notifications/read-all',
  notificationSubscriptions: '/notifications/subscriptions',
  notificationPreferences: '/notifications/preferences',

  // Health
  health: '/health'
}

// Types pour les réponses API
export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  current_page: number
  per_page: number
  total: number
  last_page: number
}

export interface ApiError {
  message: string
  errors?: Record<string, string[]>
  status?: number
}
