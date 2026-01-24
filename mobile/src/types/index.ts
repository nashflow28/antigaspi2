// Types adaptés pour React Native depuis le frontend web

export interface User {
  id: number
  first_name: string
  last_name: string
  email?: string | null // Optional for phone-only auth
  role: 'consumer' | 'merchant' | 'admin' | 'driver'
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
  phone?: string  // Optional pour harmoniser avec User.phone
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
  // BUG FIX #M-004: Prices are now numbers (normalized from API which may return strings)
  original_price: number
  discounted_price: number
  quantity_available: number
  expiration_date: string
  image_url?: string
  discount_percentage: number
  savings: number
  days_until_expiration: number
  category?: Category  // Optional pour harmoniser avec SurpriseBasketItem
  merchant: Merchant
  created_at: string
  is_active?: boolean
  is_surprise_basket?: boolean  // true = panier surprise, false/undefined = produit individuel
  status?: string
  needs_approval?: boolean
  pickup_start?: string  // Heure de début de récupération (format HH:MM)
  pickup_end?: string    // Heure de fin de récupération (format HH:MM)
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

export type PaymentStatus = 'pending' | 'success' | 'failed' | 'on_site' | 'refunded' | 'cancelled' | 'expired'

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
  amount: number
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
    quantity_available?: number
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

export interface ConversationMessage {
  id: number
  conversation_id: number
  sender_id: number
  content: string
  read_at: string | null
  created_at: string
  updated_at: string
  sender?: Pick<User, 'id' | 'first_name' | 'last_name' | 'photo_url' | 'role'>
}

export interface Conversation {
  id: number
  consumer_id: number
  merchant_id: number
  archived_by_consumer: boolean
  archived_by_merchant: boolean
  last_message_at: string | null
  last_message_preview: string | null
  created_at: string
  updated_at: string
  consumer?: Pick<User, 'id' | 'first_name' | 'last_name' | 'photo_url' | 'phone' | 'role'>
  merchant?: Pick<User, 'id' | 'first_name' | 'last_name' | 'photo_url' | 'phone' | 'role'> & {
    merchant?: {
      business_name?: string | null
      business_type?: string | null
      photo_url?: string | null
    } | null
  }
  latestMessage?: ConversationMessage | null
  messages_count?: number
}

export interface ConversationListResponse {
  conversations: Conversation[]
}

export interface ConversationDetailResponse {
  conversation: Conversation
  messages: ConversationMessage[]
  // BUG FIX #13: Pagination metadata
  pagination?: {
    current_page: number
    per_page: number
    total: number
    last_page: number
    has_more_pages: boolean
  }
}

export interface ConversationMessageResponse {
  conversation: Conversation
  message: ConversationMessage
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
  category?: { id: number; name: string } | null
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
  email?: string
  password: string
  password_confirmation: string
  phone?: string
  city: string
  role: 'consumer' | 'merchant'
  business_name?: string
  business_type?: string
  pin?: string
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

// Broadcast Notifications types
export interface BroadcastNotification {
  title: string
  message: string
  channels: ('database' | 'mail' | 'sms' | 'push')[]
  roles?: ('consumer' | 'merchant' | 'admin')[]
  action_url?: string
  payload?: Record<string, any>
}

export interface BroadcastResponse {
  success: boolean
  sent_count: number
  message: string
}

// Admin Analytics types
export interface AdminAnalyticsFilters {
  start_date?: string
  end_date?: string
  period?: '7d' | '30d' | '90d' | 'custom'
}

export interface AdminAnalyticsData {
  summary: {
    total_revenue: number
    growth_rate: number
    total_transactions: number
    average_order_value: number
  }
  revenue_chart: {
    labels: string[]
    datasets: Array<{
      data: number[]
      color?: (opacity: number) => string
    }>
  }
  geographic_distribution: Array<{
    city: string
    reservations_count: number
    revenue: number
    percentage: number
  }>
  merchant_performance: Array<{
    merchant_id: number
    merchant_name: string
    reservations_count: number
    revenue: number
    average_order_value: number
    growth_rate: number
  }>
  daily_breakdown: Array<{
    date: string
    reservations: number
    revenue: number
    products_saved: number
    new_users: number
  }>
}

export interface AnalyticsExportResponse {
  success: boolean
  file_url?: string
  file_content?: string
  message: string
}

// ============ FEATURE 1: MERCHANT MAP TYPES ============

/**
 * Marker data for displaying merchants on the interactive map
 * Extends Merchant with additional fields for map display
 */
export interface MerchantMapMarker {
  id: number
  business_name: string
  business_type: string
  address?: string
  city: string
  latitude: number // Required for map display
  longitude: number // Required for map display
  is_verified: boolean
  phone: string
  active_products_count?: number
  distance?: number // Distance from user in km
}

/**
 * Map region for initial positioning and camera control
 * Used by react-native-maps for viewport management
 */
export interface MerchantMapRegion {
  latitude: number
  longitude: number
  latitudeDelta: number // Zoom level (vertical)
  longitudeDelta: number // Zoom level (horizontal)
}

/**
 * Response from getMerchantsLocations API endpoint
 */
export interface MerchantsMapResponse {
  success: boolean
  data: MerchantMapMarker[]
  user_location?: {
    latitude: number
    longitude: number
  }
  message?: string
}

// ============ FEATURE 2: CSV EXPORT TYPES ============

/**
 * Reservation data formatted for CSV export
 * Flattened structure for easy CSV generation
 */
export interface ReservationCSVData {
  id: number
  reservation_code: string
  client_name: string // Consumer's full name
  client_phone?: string
  product_name: string
  quantity: number
  original_price: number
  discounted_price: number
  total_amount: number
  status: string
  payment_status: string
  pickup_date?: string
  pickup_time?: string
  reserved_at: string
  confirmed_at?: string
  completed_at?: string
  cancelled_at?: string
  notes?: string
}

/**
 * Response from CSV export operation
 */
export interface CSVExportResponse {
  success: boolean
  file_uri: string // Local file path
  filename: string
  rows_exported: number
  message?: string
}

// === ORDERS (COMMANDES) ===

export interface Order {
  id: number
  user_id: number
  order_number: string
  total_amount: number
  status: 'pending' | 'confirmed' | 'ready' | 'completed' | 'cancelled'
  payment_status: 'pending' | 'success' | 'failed' | 'on_site' | 'refunded'
  confirmed_at: string | null
  completed_at: string | null
  cancelled_at: string | null
  notes: string | null
  reservations?: Reservation[]
  created_at: string
  updated_at: string
}

export interface OrderCreationPayload {
  items: Array<{ product_id: number; quantity: number }>
  payment_method?: PaymentMethod
  wallet_pin?: string
  customer_phone?: string
  customer_email?: string
  pickup_date?: string
  pickup_time?: string
  notes?: string
}

export interface OrderCreationResponse {
  success: boolean
  message: string
  data: {
    order: Order
    order_id: number
    order_number: string
    total_amount: number
    items_count: number
    payment_status: PaymentStatus
    // For Mobile Money payments
    payment?: {
      id: number
      status: string
      reference: string
      provider: string
      amount: number
    }
    requires_payment_confirmation?: boolean
  }
}

// ============ DELIVERY FEATURE TYPES ============

export type DeliveryStatus =
  | 'pending'
  | 'searching'
  | 'assigned'
  | 'picking_up'
  | 'picked_up'
  | 'delivering'
  | 'delivered'
  | 'cancelled'
  | 'failed'

export type VehicleType = 'moto' | 'velo' | 'voiture' | 'pied'

export type DriverEarningType = 'delivery' | 'bonus' | 'tip' | 'adjustment' | 'withdrawal'

export interface DeliveryZone {
  id: number
  name: string
  city: string
  is_active: boolean
  base_fee: number
  per_km_fee: number
  min_fee: number
  max_fee: number
  center_latitude: number
  center_longitude: number
  polygon_coordinates?: string | null
  created_at: string
  updated_at: string
}

export interface DeliveryDriver {
  id: number
  user_id: number
  delivery_zone_id?: number | null
  vehicle_type: VehicleType
  vehicle_plate?: string | null
  license_number?: string | null
  id_card_url?: string | null
  license_url?: string | null
  photo_url?: string | null
  is_verified: boolean
  is_active: boolean
  is_available: boolean
  is_online: boolean
  current_latitude?: number | null
  current_longitude?: number | null
  last_location_update?: string | null
  rating: number
  total_deliveries: number
  total_earnings: number
  created_at: string
  updated_at: string
  // Relations
  user?: User
  zone?: DeliveryZone | null
}

export interface Delivery {
  id: number
  reservation_id: number
  driver_id?: number | null
  delivery_zone_id?: number | null
  delivery_code: string
  status: DeliveryStatus
  // Pickup location (merchant)
  pickup_address: string
  pickup_latitude: number
  pickup_longitude: number
  // Delivery location (consumer)
  delivery_address: string
  delivery_latitude: number
  delivery_longitude: number
  delivery_instructions?: string | null
  // Recipient
  recipient_name: string
  recipient_phone: string
  // Pricing
  delivery_fee: number
  driver_commission: number
  platform_commission: number
  // Route info
  estimated_distance?: number | null
  estimated_duration?: number | null
  actual_distance?: number | null
  actual_duration?: number | null
  // Timestamps
  assigned_at?: string | null
  picked_up_at?: string | null
  delivered_at?: string | null
  cancelled_at?: string | null
  failed_at?: string | null
  // Proof
  delivery_photo_url?: string | null
  signature_url?: string | null
  // Rating
  consumer_rating?: number | null
  consumer_feedback?: string | null
  // Notes
  cancellation_reason?: string | null
  failure_reason?: string | null
  driver_notes?: string | null
  created_at: string
  updated_at: string
  // Relations
  reservation?: Reservation
  driver?: DeliveryDriver | null
  zone?: DeliveryZone | null
}

export interface DeliveryTracking {
  id: number
  delivery_id: number
  latitude: number
  longitude: number
  speed?: number | null
  heading?: number | null
  recorded_at: string
}

export interface DriverEarning {
  id: number
  driver_id: number
  delivery_id?: number | null
  type: DriverEarningType
  amount: number
  description?: string | null
  status: 'pending' | 'completed' | 'failed'
  processed_at?: string | null
  created_at: string
}

// API Request/Response Types

export interface DeliveryEstimate {
  delivery_fee: number
  driver_commission: number
  platform_commission: number
  distance_km: number
  free_delivery: boolean
  free_delivery_message?: string | null
  zone?: {
    id: number
    name: string
    city: string
  } | null
  estimated_time_minutes: number
  estimated_time_text: string
  is_available: boolean
  unavailable_message?: string | null
}

export interface DeliveryRequestPayload {
  delivery_address: string
  delivery_latitude: number
  delivery_longitude: number
  delivery_instructions?: string | null
  recipient_name: string
  recipient_phone: string
}

export interface DeliveryTrackingData {
  delivery: Delivery
  driver_position?: {
    latitude: number
    longitude: number
    updated_at: string
  } | null
  tracking_history: DeliveryTracking[]
  pickup_location: {
    latitude: number
    longitude: number
    address: string
  }
  delivery_location: {
    latitude: number
    longitude: number
    address: string
  }
  // Route data from routing service (Google-encoded polyline)
  route_polyline?: string | null
  route_distance_meters?: number | null
  route_duration_seconds?: number | null
}

export interface DriverRegistrationPayload {
  vehicle_type: VehicleType
  vehicle_plate?: string | null
  license_number?: string | null
  delivery_zone_id?: number | null
  id_card_url?: string | null
  license_url?: string | null
  photo_url?: string | null
}

export interface DriverProfileUpdatePayload {
  vehicle_type?: VehicleType
  vehicle_plate?: string | null
  license_number?: string | null
  delivery_zone_id?: number | null
  photo_url?: string | null
}

export interface DriverLocationPayload {
  latitude: number
  longitude: number
  speed?: number | null
  heading?: number | null
  accuracy?: number | null
}

export interface DriverStats {
  overview: {
    total_deliveries: number
    total_earnings: number
    rating: number
    member_since: string
  }
  daily_stats: Array<{
    date: string
    count: number
    earnings: number
  }>
  rating_breakdown: Record<number, number> // { 5: 10, 4: 5, ... }
  current_status: {
    is_available: boolean
    is_online: boolean
    active_delivery?: Delivery | null
  }
}

export interface DriverEarningsResponse {
  earnings: {
    data: DriverEarning[]
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
  summary: {
    total: number
    deliveries: number
    bonuses: number
    tips: number
    withdrawals: number
  }
}

export interface DeliveryCompletionPayload {
  photo_url?: string | null
  signature_url?: string | null
  notes?: string | null
}

export interface DeliveryRatingPayload {
  consumer_rating: number
  consumer_feedback?: string | null
}

// Redux State Types

export interface DeliveryState {
  // Consumer deliveries
  activeDelivery: Delivery | null
  deliveryHistory: Delivery[]
  tracking: DeliveryTrackingData | null

  // Estimates
  currentEstimate: DeliveryEstimate | null

  // Loading states
  loading: boolean
  trackingLoading: boolean
  estimateLoading: boolean

  // Errors
  error: string | null
}

export interface DriverState {
  // Profile
  profile: DeliveryDriver | null
  isDriver: boolean

  // Deliveries
  availableDeliveries: Delivery[]
  activeDelivery: Delivery | null
  deliveryHistory: Delivery[]

  // Stats & Earnings
  stats: DriverStats | null
  earnings: DriverEarningsResponse | null

  // Zones
  zones: DeliveryZone[]

  // Loading states
  loading: boolean
  profileLoading: boolean
  statsLoading: boolean
  earningsLoading: boolean
  deliveriesLoading: boolean

  // Errors
  error: string | null

  // Location tracking
  isTrackingLocation: boolean
}
