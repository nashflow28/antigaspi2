// Types adaptés pour React Native depuis le frontend web

export interface User {
  id: number
  first_name: string
  last_name: string
  email: string
  role: 'consumer' | 'merchant' | 'admin'
  city: string
  phone?: string
  address?: string
  photo_url?: string | null
  created_at: string
  updated_at: string
  prefers_email_notifications?: boolean
  prefers_sms_notifications?: boolean
  prefers_push_notifications?: boolean
  merchant?: {
    business_name?: string
    business_type?: string
    description?: string
    siret?: string
    photo_url?: string
  }
}

export interface Merchant {
  id: number
  business_name: string
  business_type: string
  city: string
  address?: string
  phone: string
  is_verified: boolean
  latitude?: number | null
  longitude?: number | null
}

export interface Category {
  id: number
  name: string
  description?: string
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
  is_active?: boolean
}

export type MobileMoneyProvider = 'flooz' | 'tmoney' | 'orange_money' | 'mtn_momo'

export type PaymentMethod =
  | MobileMoneyProvider
  | 'paystack'
  | 'on_site'
  | 'wallet'

export type PaymentStatus = 'pending' | 'success' | 'failed' | 'on_site' | 'refunded'

export interface Payment {
  id: number
  reservation_id: number
  amount: number
  currency: string
  payment_method: PaymentMethod
  status: PaymentStatus
  provider: string | null
  checkout_url: string | null
  customer_phone: string | null
  reference: string | null
  transaction_id?: string | null
  payload?: Record<string, unknown> | null
  paid_at?: string | null
  created_at: string
  updated_at: string
}

export interface ReservationCreationResponse {
  success: boolean
  message?: string
  data: Reservation
  payment?: Payment | null
}

export interface MobileMoneyPaymentPayload {
  reservationId: number
  provider: MobileMoneyProvider
  customerPhone: string
  customerEmail?: string
  currency?: string
  notes?: string | null
  reference?: string | null
}

export interface PaymentInitiationResponse {
  success: boolean
  message?: string
  data?: Payment | null
}

export interface Reservation {
  id: number
  reservation_code: string
  quantity: number
  quantity_reserved?: number
  original_price: number
  discounted_price: number
  total_amount?: number
  status: 'pending' | 'confirmed' | 'ready' | 'completed' | 'cancelled' | 'expired'
  payment_status?: PaymentStatus | null
  notes?: string | null
  reserved_at?: string
  confirmed_at?: string
  completed_at?: string
  cancelled_at?: string
  expires_at?: string
  pickup_date?: string
  pickup_time?: string
  pickup_notes?: string | null
  created_at?: string
  product: {
    id: number
    name: string
    description?: string
    image_url?: string | null
    original_price?: number
    discounted_price?: number
    discount_percentage?: number
    expiration_date?: string
    merchant: {
      id?: number
      name: string
      business_type?: string
      address?: string
      city?: string
      phone?: string
      distance?: number
    }
    category?: Category | null
  }
  consumer?: User
  latest_payment?: Payment | null
  pendingSync?: boolean
  pendingAction?: 'create' | 'update' | 'delete'
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

export interface ReservationCreationPayload {
  productId: number
  quantity: number
  paymentMethod: PaymentMethod
  customerPhone?: string
  customerEmail?: string
  notes?: string | null
  pickupDate?: string | null
  pickupTime?: string | null
  walletPin?: string
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
  category_id?: number
  merchant?: string
  max_price?: number
  max_expiry_days?: number
  radius?: number
  page?: number
  per_page?: number
}

// Navigation types for React Native
export type RootStackParamList = {
  Splash: undefined
  Auth: undefined
  Main: undefined
  Login: undefined
  Register: undefined
  Home: undefined
  ProductDetails: { productId: number }
  ReservationDetails: { reservationId: number }
  Profile: undefined
  ProductList: { categoryId?: number; merchantId?: number }
}

export type TabParamList = {
  Home: undefined
  Products: undefined
  Reservations: undefined
  Profile: undefined
}

// Redux types
export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  loading: boolean
  error: string | null
}

export interface ProductsState {
  products: Product[]
  categories: Category[]
  loading: boolean
  loadingMore: boolean
  error: string | null
  filters: ProductFilters
  currentPage: number
  hasMore: boolean
}

export interface ReservationsState {
  reservations: Reservation[]
  loading: boolean
  error: string | null
}

export interface FavoritesState {
  favoriteIds: number[] // IDs des produits favoris
  favorites: Product[] // Détails complets des favoris
  loading: boolean
  error: string | null
}

// Reviews types
export interface Review {
  id: number
  rating: number
  title?: string | null
  comment?: string | null
  stars: string // Visual representation "★★★★★"
  time_ago: string // "Il y a 2 jours"
  is_verified_purchase: boolean
  user: {
    id: number
    name: string // "Jean D."
  }
  product?: {
    id: number
    name: string
  } | null
  merchant_response?: string | null
  merchant_response_at?: string | null
  created_at: string
  updated_at?: string
}

export interface ReviewStats {
  total_reviews: number
  average_rating: number
  verified_reviews: number
  rating_distribution: Array<{
    rating: number // 1-5
    count: number
    percentage: number
  }>
}

export interface ReviewsState {
  reviews: Review[]
  stats: ReviewStats | null
  loading: boolean
  error: string | null
  currentPage: number
  totalPages: number
  hasMore: boolean
}

export interface RootState {
  auth: AuthState
  products: ProductsState
  reservations: ReservationsState
  favorites: FavoritesState
  reviews: ReviewsState
}
