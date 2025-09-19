import type {
  AuthResponse,
  ApiResponse,
  LoginCredentials,
  RegisterData,
  User,
  Product,
  ProductFilters,
  Reservation,
  Category
} from '@/types'

const API_BASE_URL = '/api'

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

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`

    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.getHeaders(false),
        ...options.headers
      }
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`)
    }

    return data
  }

  private async authenticatedRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`

    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.getHeaders(true),
        ...options.headers
      }
    })

    const data = await response.json()

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('auth_token')
        window.location.href = '/login'
        return Promise.reject(new Error('Authentication failed'))
      }
      throw new Error(data.message || `HTTP error! status: ${response.status}`)
    }

    return data
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
    return this.authenticatedRequest<ApiResponse<User>>('/auth/me')
  }

  async logout(): Promise<ApiResponse<null>> {
    return this.authenticatedRequest<ApiResponse<null>>('/auth/logout', {
      method: 'POST'
    })
  }

  // Products
  async getProducts(filters?: ProductFilters): Promise<ApiResponse<Product[]>> {
    const params = new URLSearchParams()

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString())
        }
      })
    }

    const queryString = params.toString()
    const endpoint = queryString ? `/products?${queryString}` : '/products'

    return this.request<ApiResponse<Product[]>>(endpoint)
  }

  async getProduct(id: number): Promise<ApiResponse<Product>> {
    return this.request<ApiResponse<Product>>(`/products/${id}`)
  }

  async createProduct(product: Partial<Product>): Promise<ApiResponse<Product>> {
    return this.authenticatedRequest<ApiResponse<Product>>('/products', {
      method: 'POST',
      body: JSON.stringify(product)
    })
  }

  async updateProduct(id: number, product: Partial<Product>): Promise<ApiResponse<Product>> {
    return this.authenticatedRequest<ApiResponse<Product>>(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(product)
    })
  }

  async deleteProduct(id: number): Promise<ApiResponse<null>> {
    return this.authenticatedRequest<ApiResponse<null>>(`/products/${id}`, {
      method: 'DELETE'
    })
  }

  async getCategories(): Promise<ApiResponse<Category[]>> {
    return this.request<ApiResponse<Category[]>>('/categories')
  }

  // Reservations
  async getReservations(): Promise<ApiResponse<Reservation[]>> {
    return this.authenticatedRequest<ApiResponse<Reservation[]>>('/reservations')
  }

  async createReservation(productId: number, quantity: number): Promise<ApiResponse<Reservation>> {
    return this.authenticatedRequest<ApiResponse<Reservation>>('/reservations', {
      method: 'POST',
      body: JSON.stringify({
        product_id: productId,
        quantity_reserved: quantity
      })
    })
  }

  async cancelReservation(id: number): Promise<ApiResponse<null>> {
    return this.authenticatedRequest<ApiResponse<null>>(`/reservations/${id}/cancel`, {
      method: 'POST'
    })
  }

  async getMerchantReservations(): Promise<ApiResponse<Reservation[]>> {
    return this.authenticatedRequest<ApiResponse<Reservation[]>>('/reservations/merchant/list')
  }

  async confirmReservation(id: number): Promise<ApiResponse<Reservation>> {
    return this.authenticatedRequest<ApiResponse<Reservation>>(`/reservations/${id}/confirm`, {
      method: 'POST'
    })
  }
}

export const apiService = new ApiService()
export default apiService