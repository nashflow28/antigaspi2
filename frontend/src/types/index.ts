export interface User {
  id: number
  first_name: string
  last_name: string
  email: string
  role: 'consumer' | 'merchant' | 'admin'
  city: string
  phone?: string
  created_at: string
  updated_at: string
}

export interface Merchant {
  id: number
  business_name: string
  business_type: string
  city: string
  address?: string
  phone: string
  is_verified: boolean
}

export interface Category {
  id: number
  name: string
  icon: string
}

export interface Product {
  id: number
  name: string
  description: string
  original_price: string
  discounted_price: string
  quantity_available: number
  expiration_date: string
  image_url?: string
  discount_percentage: number
  savings: number
  days_until_expiration: number
  category: Category
  merchant: Merchant
  created_at: string
}

export interface Reservation {
  id: number
  product_id?: number
  consumer_id?: number
  quantity_reserved?: number
  quantity: number
  total_amount?: string
  original_price: number
  discounted_price: number
  status: 'pending' | 'confirmed' | 'ready' | 'completed' | 'cancelled' | 'expired'
  reserved_at?: string
  confirmed_at?: string
  completed_at?: string
  cancelled_at?: string
  pickup_date: Date | string
  pickup_notes: string
  reservation_code: string
  created_at: Date | string
  product: {
    id: number
    name: string
    image_url?: string | null
    merchant: {
      name: string
      address: string
      phone: string
    }
  }
  consumer?: User
}

export interface AuthResponse {
  success: boolean
  data: {
    token: string
    token_type: 'Bearer'
    expires_in: number
    user: User
  }
  message: string
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
  pagination?: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  first_name: string
  last_name: string
  email: string
  password: string
  password_confirmation: string
  phone?: string
  city: string
  role: 'consumer' | 'merchant'
  business_name?: string
  business_type?: string
}

export interface ProductFilters {
  search?: string
  category?: string
  merchant?: string
  max_price?: number
  max_expiry_days?: number
  page?: number
  per_page?: number
}