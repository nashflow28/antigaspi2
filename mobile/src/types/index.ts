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
  is_suspended?: boolean
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

export interface MerchantLocation {
  latitude: number | null
  longitude: number | null
  has_location?: boolean
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
  status?: string
  needs_approval?: boolean
}

export interface SurpriseBasketItem {
  id: number
  product_id: number
  quantity: number
  unit_price: number
  total_price: number
  product: {
    id: number
    name: string
    description?: string
    original_price?: number
    discounted_price?: number
    image_url?: string | null
    category?: Category | null
  }
  created_at: string
  updated_at: string
}

export interface SurpriseBasket {
  id: number
  merchant_id: number
  category_id?: number | null
  name: string
  description?: string | null
  surprise_description?: string | null
  original_price: number
  discounted_price: number
  quantity_available: number
  min_items?: number | null
  max_items?: number | null
  total_original_value?: number | null
  expiration_date?: string | null
  image_url?: string | null
  is_active: boolean
  is_surprise_basket: boolean
  basket_items_count?: number
  basket_total_value?: number
  basket_savings?: number
  basket_discount_percentage?: number
  merchant?: Merchant
  category?: Category | null
  surprise_basket_items?: SurpriseBasketItem[]
  created_at: string
  updated_at: string
}

export interface SurpriseBasketFilters {
  merchantId?: number
  categoryId?: number
  minPrice?: number
  maxPrice?: number
  city?: string
  sort?: 'latest' | 'price_low_high' | 'price_high_low' | 'discount'
}

export interface PaginatedSurpriseBaskets {
  data: SurpriseBasket[]
  current_page: number
  last_page: number
  per_page: number
  total: number
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

export type WalletTransactionType = 'credit' | 'debit'

export interface Wallet {
  id: number
  balance: number
  formatted_balance: string
  currency: string
  daily_limit: number
  remaining_daily_limit: number
  is_active: boolean
  has_pin: boolean
  last_transaction_at: string | null
}

export interface WalletTransaction {
  id: number
  wallet_id: number
  payment_id: number | null
  type: WalletTransactionType
  amount: number
  formatted_amount: string
  description: string
  reference: string
  metadata: Record<string, unknown> | null
  created_at: string
  updated_at: string
  payment?: {
    id: number
    reference: string
    status: string
  } | null
}

export interface WalletStatsPeriod {
  total_credits: number
  total_debits: number
  transaction_count: number
  credit_count: number
  debit_count: number
}

export interface WalletStats {
  current_balance: number
  daily_limit: number
  remaining_daily_limit: number
  period: string
  period_stats: WalletStatsPeriod
}

export interface WalletTransactionsPagination {
  current_page: number
  last_page: number
  per_page: number
  total: number
  from: number
  to: number
}

export interface WalletTransactionsResponse {
  transactions: WalletTransaction[]
  pagination: WalletTransactionsPagination
}

export interface WalletTransactionFilters {
  type?: WalletTransactionType
  dateFrom?: string
  dateTo?: string
  amountMin?: number
  amountMax?: number
  perPage?: number
}

export interface WalletRechargePayload {
  amount: number
  paymentMethod: MobileMoneyProvider | 'paystack'
  phone?: string
}

export interface WalletPinPayload {
  pin: string
}

export interface WalletChangePinPayload {
  currentPin: string
  newPin: string
}

export interface WalletStatusPayload {
  isActive: boolean
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

export type LoyaltyPointSource = 'purchase' | 'review' | 'referral' | 'bonus' | 'redemption'

export interface LoyaltyPoint {
  id: number
  user_id: number
  points: number
  earned_from: LoyaltyPointSource
  reference_id?: number | null
  description: string
  expires_at?: string | null
  created_at: string
}

export interface LoyaltyPointsBreakdown {
  earned_from: string
  total: string | number
}

export interface LoyaltyPointsSummary {
  total_points: number
  expiring_soon: number
  breakdown: LoyaltyPointsBreakdown[]
  recent_history: LoyaltyPoint[]
}

export interface LoyaltyRedemptionPayload {
  points: number
  description: string
}

export interface LoyaltyRedemptionData {
  redeemed_points: number
  remaining_points: number
  redemption: LoyaltyPoint
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

export interface CartItemProduct {
  id: number
  name: string
  image_url?: string | null
  discounted_price: number
  available_quantity: number
}

export interface CartItem {
  id: number
  product_id: number
  quantity: number
  unit_price: number
  total_price: number
  product?: CartItemProduct | null
}

export interface CartMerchant {
  id: number
  name: string
  business_type: string
}

export interface Cart {
  id: number
  total_amount: number
  items_count: number
  merchant?: CartMerchant | null
  items: CartItem[]
}

export interface CartResponse {
  success: boolean
  message?: string
  data: Cart | null
}

export interface CartItemPayload {
  productId: number
  quantity: number
}

export interface CartUpdatePayload {
  quantity: number
}

export interface CartCheckoutPayload {
  paymentMethod: PaymentMethod
  pickupDate: string
  pickupTime: string
  notes?: string | null
  customerPhone?: string | null
  customerEmail?: string | null
  walletPin?: string
  currency?: string
}

export interface CartCheckoutResponse {
  success: boolean
  message?: string
  data: Reservation[]
  payments?: Payment[] | null
}

export interface CartCheckoutResult {
  reservations: Reservation[]
  payments: Payment[]
}

export interface CartState {
  cart: Cart | null
  loading: boolean
  updating: boolean
  checkoutLoading: boolean
  error: string | null
  checkoutError: string | null
  lastCheckoutResult: CartCheckoutResult | null
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

export interface SurpriseBasketsState {
  baskets: SurpriseBasket[]
  selectedBasket: SurpriseBasket | null
  loading: boolean
  loadingMore: boolean
  error: string | null
  filters: SurpriseBasketFilters
  currentPage: number
  lastPage: number
  hasMore: boolean
  total: number
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
  surpriseBaskets: SurpriseBasketsState
  reservations: ReservationsState
  favorites: FavoritesState
  reviews: ReviewsState
  cart: CartState
}
