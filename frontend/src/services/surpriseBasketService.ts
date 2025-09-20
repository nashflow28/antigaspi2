import { apiService } from './api'

export interface SurpriseBasketItem {
  id: number
  product_id: number
  quantity: number
  unit_price: number
  total_price: number
  product: {
    id: number
    name: string
    description: string
    original_price: number
    discounted_price: number
    image_url?: string
    category?: {
      id: number
      name: string
    }
  }
  created_at: string
  updated_at: string
}

export interface SurpriseBasket {
  id: number
  merchant_id: number
  category_id?: number
  name: string
  description?: string
  surprise_description?: string
  original_price: number
  discounted_price: number
  quantity_available: number
  min_items?: number
  max_items?: number
  total_original_value?: number
  expiration_date?: string
  image_url?: string
  is_active: boolean
  is_surprise_basket: boolean
  basket_items_count: number
  basket_total_value: number
  basket_savings: number
  basket_discount_percentage: number
  merchant: {
    id: number
    business_name: string
    description?: string
    address?: string
    phone?: string
    email?: string
  }
  category?: {
    id: number
    name: string
    description?: string
  }
  surprise_basket_items: SurpriseBasketItem[]
  created_at: string
  updated_at: string
}

export interface CreateSurpriseBasketData {
  name: string
  description?: string
  surprise_description?: string
  category_id?: number
  discounted_price: number
  quantity_available: number
  min_items?: number
  max_items?: number
  expiration_date?: string
  image_url?: string
  products: {
    id: number
    quantity: number
  }[]
}

export interface UpdateSurpriseBasketData {
  name?: string
  description?: string
  surprise_description?: string
  category_id?: number
  discounted_price?: number
  quantity_available?: number
  min_items?: number
  max_items?: number
  expiration_date?: string
  image_url?: string
  is_active?: boolean
}

export interface SurpriseBasketFilters {
  merchant_id?: number
  category_id?: number
  min_price?: number
  max_price?: number
  page?: number
  per_page?: number
}

class SurpriseBasketService {
  private baseUrl = '/surprise-baskets'

  /**
   * Get all surprise baskets (public)
   */
  async getAll(filters: SurpriseBasketFilters = {}) {
    const params = new URLSearchParams()

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString())
      }
    })

    const queryString = params.toString()
    const url = queryString ? `${this.baseUrl}?${queryString}` : this.baseUrl

    return apiService.get<{
      success: boolean
      data: {
        data: SurpriseBasket[]
        current_page: number
        last_page: number
        per_page: number
        total: number
      }
      message: string
    }>(url)
  }

  /**
   * Get merchant's surprise baskets
   */
  async getMerchantBaskets() {
    return apiService.get<{
      success: boolean
      data: {
        data: SurpriseBasket[]
        current_page: number
        last_page: number
        per_page: number
        total: number
      }
      message: string
    }>(`${this.baseUrl}/merchant/list`)
  }

  /**
   * Get a specific surprise basket
   */
  async getById(id: number) {
    return apiService.get<{
      success: boolean
      data: SurpriseBasket
      message: string
    }>(`${this.baseUrl}/${id}`)
  }

  /**
   * Create a new surprise basket
   */
  async create(data: CreateSurpriseBasketData) {
    return apiService.post<{
      success: boolean
      data: SurpriseBasket
      message: string
    }>(this.baseUrl, data)
  }

  /**
   * Update a surprise basket
   */
  async update(id: number, data: UpdateSurpriseBasketData) {
    return apiService.put<{
      success: boolean
      data: SurpriseBasket
      message: string
    }>(`${this.baseUrl}/${id}`, data)
  }

  /**
   * Delete a surprise basket
   */
  async delete(id: number) {
    return apiService.delete<{
      success: boolean
      message: string
    }>(`${this.baseUrl}/${id}`)
  }

  /**
   * Add product to surprise basket
   */
  async addProduct(basketId: number, productId: number, quantity: number) {
    return apiService.post<{
      success: boolean
      data: SurpriseBasket
      message: string
    }>(`${this.baseUrl}/${basketId}/products`, {
      product_id: productId,
      quantity
    })
  }

  /**
   * Remove product from surprise basket
   */
  async removeProduct(basketId: number, productId: number) {
    return apiService.delete<{
      success: boolean
      data: SurpriseBasket
      message: string
    }>(`${this.baseUrl}/${basketId}/products/${productId}`)
  }
}

export const surpriseBasketService = new SurpriseBasketService()