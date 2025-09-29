import type {
  AuthResponse,
  ApiResponse,
  LoginCredentials,
  RegisterData,
  User,
  Product,
  ProductFilters,
  Reservation,
  Category,
  PaymentMethod,
  ReservationCreationPayload,
  ReservationCreationResponse,
  PaymentApiResponse
} from '@/types'

const DEFAULT_API_BASE_URL = 'http://localhost:8000/api'
const API_BASE_URL = (import.meta?.env?.VITE_API_BASE_URL as string | undefined) || DEFAULT_API_BASE_URL

class ApiService {
  private getHeaders(withAuth = false): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }

    if (withAuth) {
      const token = localStorage.getItem('auth_token')
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
    }

    return headers
  }

  private async parseResponse<T>(response: Response): Promise<T> {
    if (response.status === 204) {
      return null as T
    }

    const contentType = response.headers.get('content-type')

    if (contentType && contentType.includes('application/json')) {
      return response.json() as Promise<T>
    }

    const text = await response.text()
    try {
      return JSON.parse(text) as T
    } catch (error) {
      return text as unknown as T
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    withAuth = false
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`

    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.getHeaders(withAuth),
        ...options.headers
      }
    })

    const data = await this.parseResponse<T>(response)

    if (!response.ok) {
      if (withAuth && response.status === 401) {
        localStorage.removeItem('auth_token')
        const currentPath = window.location.pathname + window.location.search + window.location.hash
        window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`
        return Promise.reject(new Error('Authentication failed'))
      }

      const message = (data as ApiResponse<unknown>)?.message || `HTTP error! status: ${response.status}`
      throw new Error(message)
    }

    return data
  }

  // Generic HTTP methods
  async get<T>(url: string, withAuth = true): Promise<T> {
    return this.request<T>(url, { method: 'GET' }, withAuth)
  }

  async post<T>(url: string, data?: any, withAuth = true): Promise<T> {
    return this.request<T>(url, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined
    }, withAuth)
  }

  async put<T>(url: string, data?: any, withAuth = true): Promise<T> {
    return this.request<T>(url, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined
    }, withAuth)
  }

  async patch<T>(url: string, data?: any, withAuth = true): Promise<T> {
    return this.request<T>(url, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined
    }, withAuth)
  }

  async delete<T>(url: string, withAuth = true): Promise<T> {
    return this.request<T>(url, { method: 'DELETE' }, withAuth)
  }

  async postFormData<T>(url: string, formData: FormData, withAuth = true): Promise<T> {
    const headers: HeadersInit = {
      'Accept': 'application/json'
    }

    if (withAuth) {
      const token = localStorage.getItem('auth_token')
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
    }

    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'POST',
      headers,
      body: formData
    })

    if (!response.ok) {
      const errorText = await response.text()
      let errorData
      try {
        errorData = JSON.parse(errorText)
      } catch {
        errorData = { message: `HTTP ${response.status}: ${response.statusText}` }
      }
      throw { response: { data: errorData } }
    }

    return this.parseResponse<T>(response)
  }

  // Health check
  async healthCheck(): Promise<any> {
    return this.request('/health')
  }

  // Authentication
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    })
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  async getCurrentUser(): Promise<ApiResponse<User>> {
    return this.request<ApiResponse<User>>('/auth/me', {}, true)
  }

  async logout(): Promise<ApiResponse<null>> {
    return this.request<ApiResponse<null>>('/auth/logout', {
      method: 'POST'
    }, true)
  }

  // Products
  async getProducts(filters?: ProductFilters): Promise<ApiResponse<Product[]>> {
    const params = new URLSearchParams()

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          const paramKey = key === 'max_distance' ? 'radius' : key
          params.append(paramKey, value.toString())
        }
      })
    }

    const queryString = params.toString()
    const endpoint = queryString ? `/products?${queryString}` : '/products'

    return this.request<ApiResponse<Product[]>>(endpoint)
  }

  async getMerchantProducts(): Promise<ApiResponse<Product[]>> {
    return this.request<ApiResponse<Product[]>>('/products/merchant', {}, true)
  }

  async getProduct(id: number): Promise<ApiResponse<Product>> {
    return this.request<ApiResponse<Product>>(`/products/${id}`)
  }

  async getProductById(id: number): Promise<ApiResponse<Product>> {
    return this.getProduct(id)
  }

  async createProduct(product: Partial<Product>): Promise<ApiResponse<Product>> {
    return this.request<ApiResponse<Product>>('/products', {
      method: 'POST',
      body: JSON.stringify(product)
    }, true)
  }

  async updateProduct(id: number, product: Partial<Product>): Promise<ApiResponse<Product>> {
    return this.request<ApiResponse<Product>>(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(product)
    }, true)
  }

  async updateProductStatus(id: number, isActive: boolean): Promise<ApiResponse<Product>> {
    return this.request<ApiResponse<Product>>(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        is_active: isActive
      })
    }, true)
  }

  async deleteProduct(id: number): Promise<ApiResponse<null>> {
    return this.request<ApiResponse<null>>(`/products/${id}`, {
      method: 'DELETE'
    }, true)
  }

  async getCategories(): Promise<ApiResponse<Category[]>> {
    return this.request<ApiResponse<Category[]>>('/categories')
  }

  // Reservations
  async getReservations(): Promise<ApiResponse<Reservation[]>> {
    return this.request<ApiResponse<Reservation[]>>('/reservations', {}, true)
  }

  async getReservation(id: number): Promise<ApiResponse<Reservation>> {
    return this.request<ApiResponse<Reservation>>(`/reservations/${id}`, {}, true)
  }

  async createReservation(payload: ReservationCreationPayload): Promise<ReservationCreationResponse> {
    const body = {
      product_id: payload.productId,
      quantity: payload.quantity,
      payment_method: payload.paymentMethod,
      customer_phone: payload.customerPhone ?? undefined,
      customer_email: payload.customerEmail ?? undefined,
      notes: payload.notes ?? undefined,
      pickup_date: payload.pickupDate ?? undefined,
      pickup_time: payload.pickupTime ?? undefined,
      wallet_pin: payload.walletPin ?? undefined
    }

    return this.request<ReservationCreationResponse>('/reservations', {
      method: 'POST',
      body: JSON.stringify(body)
    }, true)
  }

  async cancelReservation(id: number): Promise<ApiResponse<null>> {
    return this.request<ApiResponse<null>>(`/reservations/${id}/cancel`, {
      method: 'POST'
    }, true)
  }

  async updateReservationStatus(id: number, status: Reservation['status']): Promise<ApiResponse<Reservation>> {
    return this.request<ApiResponse<Reservation>>(`/reservations/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    }, true)
  }

  async getMerchantReservations(): Promise<ApiResponse<Reservation[]>> {
    return this.request<ApiResponse<Reservation[]>>('/reservations/merchant/list', {}, true)
  }

  async confirmReservation(id: number): Promise<ApiResponse<Reservation>> {
    return this.request<ApiResponse<Reservation>>(`/reservations/${id}/confirm`, {
      method: 'POST'
    }, true)
  }

  // Payments
  async getPayment(paymentId: number): Promise<PaymentApiResponse> {
    return this.request<PaymentApiResponse>(`/payments/${paymentId}`, { method: 'GET' }, true)
  }

  async cancelPayment(paymentId: number, reason?: string): Promise<PaymentApiResponse> {
    return this.request<PaymentApiResponse>(`/payments/${paymentId}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    }, true)
  }

  async initiatePayment(payload: {
    reservationId: number
    paymentMethod: PaymentMethod
    customerPhone?: string
    customerEmail?: string
    notes?: string
    currency?: string
  }): Promise<PaymentApiResponse> {
    const body = {
      reservation_id: payload.reservationId,
      payment_method: payload.paymentMethod,
      customer_phone: payload.customerPhone ?? undefined,
      customer_email: payload.customerEmail ?? undefined,
      notes: payload.notes ?? undefined,
      currency: payload.currency ?? undefined
    }

    return this.request<PaymentApiResponse>('/payments', {
      method: 'POST',
      body: JSON.stringify(body)
    }, true)
  }
}

export const apiService = new ApiService()
export default apiService
