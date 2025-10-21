import type {
  AuthResponse,
  ApiResponse,
  LoginCredentials,
  RegisterData,
  User,
  Product,
  ProductFilters,
  Reservation,
  ReservationFilters,
  Category,
  PaymentMethod,
  ReservationCreationPayload,
  ReservationCreationResponse,
  PaymentApiResponse,
  AdminDashboardData,
  AdminSystemHealthService,
  LoyaltyPointsSummary,
  LoyaltyRedemptionPayload,
  LoyaltyRedemptionData,
  LoyaltyAwardPayload,
  LoyaltyParticipantSummary,
  LoyaltyPoint,
  AnalyticsStatsResponse,
  Review,
  ReviewStats,
  MerchantLocation
} from '@/types'

type QueryParams = Record<string, string | number | boolean | null | undefined>

export interface AdminUsersStats {
  totalUsers: number
  consumers: number
  merchants: number
  suspended: number
}

export interface AdminUsersPayload {
  users: User[]
  stats?: AdminUsersStats
  [key: string]: unknown
}

export interface AdminModerationStats {
  activeMerchants: number
  pendingMerchants: number
  totalProducts: number
  totalReservations: number
}

export interface AdminPendingMerchant {
  id: number
  business_name?: string
  owner_name?: string
  email?: string
  phone?: string
  address?: string
  business_type?: string
  description?: string
  created_at?: string
  [key: string]: unknown
}

export interface AdminModerationProduct {
  id: number
  name?: string
  merchant_name?: string
  price?: number
  image_url?: string
  description?: string
  category?: string
  [key: string]: unknown
}

export interface AdminModerationReservation {
  id: number
  product_name?: string
  customer_name?: string
  merchant_name?: string
  total_price?: number
  flag_reason?: string
  created_at?: string
  [key: string]: unknown
}

export interface AdminModerationPayload {
  stats: AdminModerationStats
  pendingMerchants: AdminPendingMerchant[]
  productsToModerate: AdminModerationProduct[]
  flaggedReservations: AdminModerationReservation[]
  [key: string]: unknown
}

export interface AdminCategoryStats {
  total_categories: number
  active_categories: number
  categories_with_products: number
  top_categories: Array<{ id: number; name?: string; products_count: number }>
}

export type AdminCategory = Category & {
  is_active?: boolean
  icon?: string
  products_count?: number
  [key: string]: unknown
}

export interface MerchantReviewProductSummary {
  id: number
  name: string
  review_count: number
}

export interface ReviewResponsePayload {
  response: string
}

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
      const error = new Error(message)
      ;(error as any).status = response.status

      if (data && typeof data === 'object') {
        ;(error as any).response = {
          status: response.status,
          data
        }
      }

      throw error
    }

    return data
  }

  private buildQueryString(params?: QueryParams): string {
    if (!params) {
      return ''
    }

    const searchParams = new URLSearchParams()

    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') {
        return
      }
      searchParams.append(key, String(value))
    })

    const query = searchParams.toString()
    return query ? `?${query}` : ''
  }

  private toNumber(value: unknown, fallback = 0): number {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value
    }

    if (typeof value === 'string' && value.trim() !== '') {
      const parsed = Number(value)
      if (!Number.isNaN(parsed)) {
        return parsed
      }
    }

    return fallback
  }

  private ensureArray<T>(value: unknown): T[] {
    if (Array.isArray(value)) {
      return value as T[]
    }
    return []
  }

  private normalizeAdminUsersStats(raw?: Record<string, unknown>): AdminUsersStats | undefined {
    if (!raw) {
      return undefined
    }

    return {
      totalUsers: this.toNumber(raw.totalUsers ?? raw.total_users ?? raw.total),
      consumers: this.toNumber(raw.consumers ?? raw.consumer ?? raw.consumers_count ?? raw.total_consumers),
      merchants: this.toNumber(raw.merchants ?? raw.merchant ?? raw.merchants_count ?? raw.total_merchants),
      suspended: this.toNumber(raw.suspended ?? raw.suspended_count ?? raw.total_suspended)
    }
  }

  private normalizeModerationStats(raw?: Record<string, unknown>): AdminModerationStats {
    return {
      activeMerchants: this.toNumber(raw?.activeMerchants ?? raw?.active_merchants),
      pendingMerchants: this.toNumber(raw?.pendingMerchants ?? raw?.pending_merchants),
      totalProducts: this.toNumber(raw?.totalProducts ?? raw?.total_products),
      totalReservations: this.toNumber(raw?.totalReservations ?? raw?.total_reservations)
    }
  }

  private normalizeCategoryStats(raw?: Record<string, unknown>): AdminCategoryStats {
    const topCategoriesRaw = raw?.top_categories ?? raw?.topCategories
    const topCategories = this.ensureArray<{ id: number; name?: string; products_count?: number; productsCount?: number }>(topCategoriesRaw)
      .map(category => ({
        id: category.id,
        name: category.name,
        products_count: this.toNumber(category.products_count ?? category.productsCount)
      }))

    return {
      total_categories: this.toNumber(raw?.total_categories ?? raw?.totalCategories),
      active_categories: this.toNumber(raw?.active_categories ?? raw?.activeCategories),
      categories_with_products: this.toNumber(raw?.categories_with_products ?? raw?.categoriesWithProducts),
      top_categories: topCategories
    }
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

  // Reviews
  async getMerchantReviewProducts(): Promise<ApiResponse<MerchantReviewProductSummary[]>> {
    return this.get<ApiResponse<MerchantReviewProductSummary[]>>('/merchants/reviews/products', true)
  }

  async getMerchantReviewsDashboard<T = unknown>(): Promise<ApiResponse<T>> {
    return this.get<ApiResponse<T>>('/merchants/reviews/dashboard', true)
  }

  async getMerchantReviews(params: Record<string, string | number | boolean | null | undefined> = {}): Promise<ApiResponse<Review[]>> {
    const searchParams = new URLSearchParams()

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value))
      }
    })

    const query = searchParams.toString()
    const endpoint = query ? `/merchants/reviews/list?${query}` : '/merchants/reviews/list'

    return this.get<ApiResponse<Review[]>>(endpoint, true)
  }

  async createReview(data: {
    merchant_id: number
    product_id?: number | null
    rating: number
    title?: string | null
    comment?: string | null
  }): Promise<ApiResponse<Review>> {
    return this.post<ApiResponse<Review>>('/reviews', data, true)
  }

  async updateReview(reviewId: number, data: {
    rating: number
    title?: string | null
    comment?: string | null
  }): Promise<ApiResponse<Review>> {
    return this.put<ApiResponse<Review>>(`/reviews/${reviewId}`, data, true)
  }

  async respondToReview(reviewId: number, payload: ReviewResponsePayload, { update = false } = {}): Promise<ApiResponse<Review>> {
    if (update) {
      return this.put<ApiResponse<Review>>(`/merchants/reviews/${reviewId}/response`, payload, true)
    }

    return this.post<ApiResponse<Review>>(`/merchants/reviews/${reviewId}/respond`, payload, true)
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

  async getMerchantProducts(
    params?: Record<string, string | number | boolean | null | undefined>
  ): Promise<ApiResponse<Product[]>> {
    let query = ''

    if (params) {
      const searchParams = new URLSearchParams()

      Object.entries(params).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') {
          return
        }
        searchParams.append(key, String(value))
      })

      const serializedParams = searchParams.toString()
      if (serializedParams) {
        query = `?${serializedParams}`
      }
    }

    return this.request<ApiResponse<Product[]>>(`/products/merchant${query}`, {}, true)
  }

  async getProduct(id: number): Promise<ApiResponse<Product>> {
    return this.request<ApiResponse<Product>>(`/products/${id}`)
  }

  async getMerchantProduct(id: number): Promise<ApiResponse<Product>> {
    return this.request<ApiResponse<Product>>(`/products/merchant/${id}`, {}, true)
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
  async getReservations(
    params?: (ReservationFilters & { page?: number; per_page?: number }) | undefined
  ): Promise<ApiResponse<Reservation[]>> {
    let query = ''

    if (params) {
      const searchParams = new URLSearchParams()

      Object.entries(params).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') return
        searchParams.append(key, String(value))
      })

      const serializedParams = searchParams.toString()
      if (serializedParams) {
        query = `?${serializedParams}`
      }
    }

    return this.request<ApiResponse<Reservation[]>>(`/reservations${query}`, {}, true)
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

  async getMerchantReservations(
    params?: Record<string, string | number | boolean | null | undefined>
  ): Promise<ApiResponse<Reservation[]>> {
    let query = ''

    if (params) {
      const searchParams = new URLSearchParams()

      Object.entries(params).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') {
          return
        }
        searchParams.append(key, String(value))
      })

      const serializedParams = searchParams.toString()
      if (serializedParams) {
        query = `?${serializedParams}`
      }
    }

    return this.request<ApiResponse<Reservation[]>>(`/reservations/merchant/list${query}`, {}, true)
  }

  async confirmReservation(id: number): Promise<ApiResponse<Reservation>> {
    return this.request<ApiResponse<Reservation>>(`/reservations/${id}/confirm`, {
      method: 'POST'
    }, true)
  }

  async completeReservation(id: number): Promise<ApiResponse<Reservation>> {
    return this.request<ApiResponse<Reservation>>(`/reservations/${id}/complete`, {
      method: 'POST'
    }, true)
  }

  async markReservationReady(id: number): Promise<ApiResponse<Reservation>> {
    return this.request<ApiResponse<Reservation>>(`/reservations/${id}/ready`, {
      method: 'POST'
    }, true)
  }

  async getMerchantLocation(): Promise<ApiResponse<MerchantLocation>> {
    return this.get<ApiResponse<MerchantLocation>>('/merchants/location', true)
  }

  async updateMerchantLocation(payload: { latitude: number; longitude: number }): Promise<ApiResponse<MerchantLocation>> {
    return this.put<ApiResponse<MerchantLocation>>('/merchants/location', payload, true)
  }

  // Reviews
  async getReviewStats(params: { merchant_id: number; product_id?: number }): Promise<ApiResponse<ReviewStats>> {
    const searchParams = new URLSearchParams()

    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') {
        return
      }
      searchParams.append(key, String(value))
    })

    const query = searchParams.toString()
    const endpoint = query ? `/reviews/stats?${query}` : '/reviews/stats'

    return this.get<ApiResponse<ReviewStats>>(endpoint, false)
  }

  async getReviewsList(params: {
    merchant_id: number
    product_id?: number
    rating?: number | string
    page?: number
    per_page?: number
  }): Promise<ApiResponse<Review[]>> {
    const searchParams = new URLSearchParams()

    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') {
        return
      }
      searchParams.append(key, String(value))
    })

    const query = searchParams.toString()
    const endpoint = query ? `/reviews?${query}` : '/reviews'

    return this.get<ApiResponse<Review[]>>(endpoint, false)
  }

  async reportReview(reviewId: number, reason: string): Promise<ApiResponse<null>> {
    return this.post<ApiResponse<null>>('/reviews/report', {
      review_id: reviewId,
      reason
    }, true)
  }

  async replyToReview(reviewId: number, reply: string): Promise<ApiResponse<Review>> {
    return this.post<ApiResponse<Review>>('/reviews/reply', {
      review_id: reviewId,
      reply
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
    const isMobileMoney = ['flooz', 'tmoney', 'orange_money', 'mtn_momo'].includes(payload.paymentMethod)

    if (isMobileMoney) {
      const body = {
        reservation_id: payload.reservationId,
        provider: payload.paymentMethod,
        customer_phone: payload.customerPhone ?? undefined,
        customer_email: payload.customerEmail ?? undefined,
        notes: payload.notes ?? undefined,
        currency: payload.currency ?? undefined
      }

      return this.request<PaymentApiResponse>('/payments/mobile-money', {
        method: 'POST',
        body: JSON.stringify(body)
      }, true)
    }

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

  async getAdminDashboard(): Promise<ApiResponse<AdminDashboardData>> {
    return this.request<ApiResponse<AdminDashboardData>>('/admin/dashboard', {}, true)
  }

  async getAdminSystemHealth(): Promise<ApiResponse<AdminSystemHealthService[]>> {
    return this.request<ApiResponse<AdminSystemHealthService[]>>('/admin/system-health', {}, true)
  }

  async getPendingReviews(params?: { page?: number; perPage?: number }): Promise<ApiResponse<Review[]>> {
    const searchParams = new URLSearchParams()

    if (params?.page) {
      searchParams.append('page', String(params.page))
    }

    if (params?.perPage) {
      searchParams.append('per_page', String(params.perPage))
    }

    const query = searchParams.toString()
    const endpoint = `/admin/reviews/pending${query ? `?${query}` : ''}`

    return this.request<ApiResponse<Review[]>>(endpoint, {}, true)
  }

  async getReportedReviews(params?: {
    page?: number
    perPage?: number
    status?: string
    reason?: string
  }): Promise<ApiResponse<any>> {
    const searchParams = new URLSearchParams()

    if (params?.page) {
      searchParams.append('page', String(params.page))
    }

    if (params?.perPage) {
      searchParams.append('per_page', String(params.perPage))
    }

    if (params?.status) {
      searchParams.append('status', params.status)
    }

    if (params?.reason) {
      searchParams.append('reason', params.reason)
    }

    const query = searchParams.toString()
    const endpoint = `/admin/reviews/reported${query ? `?${query}` : ''}`

    return this.request<ApiResponse<any>>(endpoint, {}, true)
  }

  async approveReview(reviewId: number): Promise<ApiResponse<Review>> {
    return this.request<ApiResponse<Review>>(`/admin/reviews/${reviewId}/approve`, {
      method: 'POST'
    }, true)
  }

  async rejectReview(
    reviewId: number,
    payload?: { reason?: string }
  ): Promise<ApiResponse<Review>> {
    return this.request<ApiResponse<Review>>(`/admin/reviews/${reviewId}/reject`, {
      method: 'POST',
      body: JSON.stringify(payload ?? {})
    }, true)
  }

  async resolveReviewReport(
    reportId: number,
    payload: { action: 'dismiss' | 'remove_review' | 'warn_user'; notes?: string }
  ): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>(`/admin/reviews/reports/${reportId}/resolve`, {
      method: 'POST',
      body: JSON.stringify(payload)
    }, true)
  }

  async getAnalyticsStats(params?: {
    startDate?: string
    endDate?: string
    merchantId?: number | string
  }): Promise<AnalyticsStatsResponse> {
    const searchParams = new URLSearchParams()

    if (params?.startDate) {
      searchParams.append('start_date', params.startDate)
    }

    if (params?.endDate) {
      searchParams.append('end_date', params.endDate)
    }

    if (params?.merchantId !== undefined && params?.merchantId !== null) {
      searchParams.append('merchant_id', String(params.merchantId))
    }

    const query = searchParams.toString()
    const endpoint = `/analytics/stats${query ? `?${query}` : ''}`

    return this.request<AnalyticsStatsResponse>(endpoint, {}, true)
  }

  // Admin - Users
  async getAdminUsers(params?: QueryParams): Promise<ApiResponse<AdminUsersPayload>> {
    const query = this.buildQueryString(params)
    const response = await this.get<ApiResponse<User[] | Record<string, unknown>> & { stats?: Record<string, unknown> }>(`/admin/users${query}`, true)

    const rawData = response.data
    const users = Array.isArray(rawData)
      ? (rawData as User[])
      : this.ensureArray<User>((rawData as Record<string, unknown> | undefined)?.users)

    const additionalData = Array.isArray(rawData) ? {} : (rawData as Record<string, unknown> | undefined) ?? {}
    const extraData: Record<string, unknown> = { ...additionalData }
    delete extraData.users
    delete extraData.stats

    const stats = this.normalizeAdminUsersStats((additionalData.stats as Record<string, unknown> | undefined) ?? response.stats)

    return {
      success: response.success,
      message: response.message,
      data: {
        ...extraData,
        users,
        stats
      },
      pagination: response.pagination
    }
  }

  async suspendAdminUser(userId: number): Promise<ApiResponse<User>> {
    return this.patch<ApiResponse<User>>(`/admin/users/${userId}/suspend`, {}, true)
  }

  async unsuspendAdminUser(userId: number): Promise<ApiResponse<User>> {
    return this.patch<ApiResponse<User>>(`/admin/users/${userId}/unsuspend`, {}, true)
  }

  // Admin - Merchants & moderation
  async getAdminMerchants(params?: QueryParams): Promise<ApiResponse<Record<string, unknown>>> {
    const query = this.buildQueryString(params)
    return this.get<ApiResponse<Record<string, unknown>>>(`/admin/merchants${query}`, true)
  }

  async getAdminModerationData(params?: QueryParams): Promise<ApiResponse<AdminModerationPayload>> {
    const query = this.buildQueryString(params)
    const response = await this.get<ApiResponse<Record<string, unknown>> & Record<string, unknown>>(`/admin/moderation${query}`, true)

    const rawData = ((response.data ?? {}) as Record<string, unknown>) || {}
    const stats = this.normalizeModerationStats(
      (rawData.stats as Record<string, unknown> | undefined) ?? (response.stats as Record<string, unknown> | undefined)
    )
    const pendingMerchants = this.ensureArray<AdminPendingMerchant>(
      rawData.pendingMerchants ?? rawData.pending_merchants ?? (response as Record<string, unknown>).pendingMerchants
    )
    const productsToModerate = this.ensureArray<AdminModerationProduct>(
      rawData.productsToModerate ?? rawData.products_to_moderate ?? (response as Record<string, unknown>).productsToModerate
    )
    const flaggedReservations = this.ensureArray<AdminModerationReservation>(
      rawData.flaggedReservations ?? rawData.flagged_reservations ?? (response as Record<string, unknown>).flaggedReservations
    )

    const extraData: Record<string, unknown> = { ...rawData }
    delete extraData.stats
    delete extraData.pendingMerchants
    delete extraData.pending_merchants
    delete extraData.productsToModerate
    delete extraData.products_to_moderate
    delete extraData.flaggedReservations
    delete extraData.flagged_reservations

    return {
      success: response.success,
      message: response.message,
      data: {
        ...extraData,
        stats,
        pendingMerchants,
        productsToModerate,
        flaggedReservations
      },
      pagination: response.pagination
    }
  }

  async approveMerchant(merchantId: number): Promise<ApiResponse<Record<string, unknown>>> {
    return this.post<ApiResponse<Record<string, unknown>>>(`/admin/merchants/${merchantId}/approve`, {}, true)
  }

  async rejectMerchant(merchantId: number, payload: Record<string, unknown> = {}): Promise<ApiResponse<Record<string, unknown>>> {
    return this.post<ApiResponse<Record<string, unknown>>>(`/admin/merchants/${merchantId}/reject`, payload, true)
  }

  async approveProduct(productId: number): Promise<ApiResponse<Record<string, unknown>>> {
    return this.post<ApiResponse<Record<string, unknown>>>(`/admin/products/${productId}/approve`, {}, true)
  }

  async rejectProduct(productId: number, payload: Record<string, unknown> = {}): Promise<ApiResponse<Record<string, unknown>>> {
    return this.post<ApiResponse<Record<string, unknown>>>(`/admin/products/${productId}/reject`, payload, true)
  }

  async resolveReservationFlag(reservationId: number, payload: Record<string, unknown> = {}): Promise<ApiResponse<Record<string, unknown>>> {
    return this.post<ApiResponse<Record<string, unknown>>>(`/admin/reservations/${reservationId}/resolve`, payload, true)
  }

  // Admin - Categories
  async getAdminCategories(params?: QueryParams): Promise<ApiResponse<AdminCategory[]>> {
    const query = this.buildQueryString(params)
    const response = await this.get<ApiResponse<unknown>>(`/admin/categories${query}`, true)

    const rawData = response.data as Record<string, unknown> | AdminCategory[] | undefined
    const categoriesSource = Array.isArray(rawData) ? rawData : (rawData?.categories as unknown) ?? rawData
    const categories = this.ensureArray<Record<string, unknown>>(categoriesSource).map(item => {
      const category = { ...(item as AdminCategory) }
      const isActive = typeof category.is_active === 'boolean'
        ? category.is_active
        : typeof (category as Record<string, unknown>).isActive === 'boolean'
          ? Boolean((category as Record<string, unknown>).isActive)
          : true

      return {
        ...category,
        description: typeof category.description === 'string' ? category.description : '',
        is_active: isActive
      } as AdminCategory
    })

    return {
      success: response.success,
      message: response.message,
      data: categories,
      pagination: response.pagination
    }
  }

  async getAdminCategoryStats(): Promise<ApiResponse<AdminCategoryStats>> {
    const response = await this.get<ApiResponse<Record<string, unknown>>>('/admin/categories/stats', true)
    const stats = this.normalizeCategoryStats(response.data as Record<string, unknown>)

    return {
      success: response.success,
      message: response.message,
      data: stats,
      pagination: response.pagination
    }
  }

  async createAdminCategory(payload: Partial<Category> & { is_active?: boolean }): Promise<ApiResponse<AdminCategory>> {
    return this.post<ApiResponse<AdminCategory>>('/admin/categories', payload, true)
  }

  async updateAdminCategory(categoryId: number, payload: Partial<Category> & { is_active?: boolean }): Promise<ApiResponse<AdminCategory>> {
    return this.put<ApiResponse<AdminCategory>>(`/admin/categories/${categoryId}`, payload, true)
  }

  async deleteAdminCategory(categoryId: number): Promise<ApiResponse<null>> {
    return this.delete<ApiResponse<null>>(`/admin/categories/${categoryId}`, true)
  }

  async toggleCategory(categoryId: number): Promise<ApiResponse<AdminCategory>> {
    return this.patch<ApiResponse<AdminCategory>>(`/admin/categories/${categoryId}/toggle`, {}, true)
  }

  // Loyalty points
  async getLoyaltyPoints(): Promise<ApiResponse<LoyaltyPointsSummary>> {
    return this.request<ApiResponse<LoyaltyPointsSummary>>('/loyalty/my-points', {}, true)
  }

  async redeemLoyaltyPoints(payload: LoyaltyRedemptionPayload): Promise<ApiResponse<LoyaltyRedemptionData>> {
    return this.request<ApiResponse<LoyaltyRedemptionData>>('/loyalty/redeem', {
      method: 'POST',
      body: JSON.stringify(payload)
    }, true)
  }

  async awardLoyaltyPoints(payload: LoyaltyAwardPayload, scope: 'merchant' | 'admin' = 'merchant'): Promise<ApiResponse<LoyaltyPoint>> {
    const endpoint = scope === 'admin' ? '/admin/loyalty/award' : '/merchants/loyalty/award'
    return this.request<ApiResponse<LoyaltyPoint>>(endpoint, {
      method: 'POST',
      body: JSON.stringify(payload)
    }, true)
  }

  async getLoyaltyParticipants(scope: 'merchant' | 'admin' = 'merchant'): Promise<ApiResponse<LoyaltyParticipantSummary[]>> {
    const endpoint = scope === 'admin' ? '/admin/loyalty/users' : '/merchants/loyalty/customers'
    return this.request<ApiResponse<LoyaltyParticipantSummary[]>>(endpoint, {}, true)
  }
}

export const apiService = new ApiService()
export default apiService
