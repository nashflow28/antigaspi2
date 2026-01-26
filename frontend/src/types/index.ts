export interface User {
  id: number
  first_name: string
  last_name: string
  email: string
  role: 'consumer' | 'merchant' | 'admin' | 'driver'
  city: string
  address?: string | null
  phone?: string
  photo_url?: string | null
  has_pin?: boolean
  created_at: string
  updated_at: string
  prefers_email_notifications?: boolean
  prefers_sms_notifications?: boolean
  prefers_push_notifications?: boolean
  wallet_balance?: number
}

export interface Merchant {
  id: number
  business_name: string
  business_type: string
  city: string
  address?: string
  phone: string
  is_verified: boolean
  // Optional properties used in some contexts
  name?: string
  distance?: number
  owner_name?: string
  latitude?: number
  longitude?: number
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

export interface AdminDashboardStats {
  totalUsers: number
  newUsersThisMonth: number
  activeMerchants: number
  merchantGrowthRate: number
  productsSaved: number
  kgFoodSaved: number
  totalRevenue: number
  revenueGrowth: number
  total_users?: number
  new_users_this_month?: number
  active_merchants?: number
  merchant_growth_rate?: number
  products_saved?: number
  kg_food_saved?: number
  total_revenue?: number
  revenue_growth?: number
}

export interface AdminDashboardMerchant {
  id: number | string
  name?: string
  business_name?: string
  revenue?: number
  productsSold?: number
  products_sold?: number
  location?: string
  [key: string]: unknown
}

export interface AdminDashboardCategory {
  id?: number | string
  name?: string
  icon?: string
  productCount?: number
  product_count?: number
  percentage?: number
  [key: string]: unknown
}

export interface AdminDashboardActivity {
  id: number | string
  title?: string
  description?: string
  timestamp?: string
  status?: string
  type?: string
  [key: string]: unknown
}

export interface AdminDashboardEnvironmentalImpact {
  co2Saved?: number
  co2_saved?: number
  waterSaved?: number
  water_saved?: number
  wasteSaved?: number
  waste_saved?: number
  treesEquivalent?: number
  trees_equivalent?: number
  [key: string]: unknown
}

export interface AdminDashboardUserDistributionEntry {
  id?: number | string
  label?: string
  role?: string
  value?: number
  count?: number
  total?: number
  [key: string]: unknown
}

export interface AdminDashboardData {
  stats?: AdminDashboardStats
  topMerchants?: AdminDashboardMerchant[]
  popularCategories?: AdminDashboardCategory[]
  recentActivities?: AdminDashboardActivity[]
  environmentalImpact?: AdminDashboardEnvironmentalImpact
  userDistribution?: AdminDashboardUserDistributionEntry[] | Record<string, unknown>
  [key: string]: unknown
}

export interface AnalyticsFilters {
  start_date?: string
  end_date?: string
  merchant_id?: number | string | null
  [key: string]: unknown
}

export interface AnalyticsDailyBreakdownEntry {
  date: string
  merchant_id?: number | null
  total_reservations?: number
  total_revenue?: number
  products_saved_from_waste?: number
  new_users?: number
  [key: string]: unknown
}

export interface AnalyticsSummary {
  total_reservations?: number
  total_revenue?: number
  products_saved_from_waste?: number
  new_users?: number
  event_count?: number
  [key: string]: unknown
}

export interface AnalyticsEventCount {
  name?: string
  category?: string
  count?: number
  [key: string]: unknown
}

export interface AnalyticsRecentEvent {
  id: number | string
  name?: string
  category?: string
  properties?: Record<string, unknown> | null
  occurred_at?: string | null
  [key: string]: unknown
}

export interface AnalyticsGeographicDistributionEntry {
  city?: string
  reservation_count?: number
  total_revenue?: number
  percentage?: number
  [key: string]: unknown
}

export interface AnalyticsMerchantPerformanceEntry {
  merchant_id?: number | string
  merchant_name?: string
  reservation_count?: number
  total_revenue?: number
  average_order_value?: number
  growth_rate?: number | null
  is_selected?: boolean
  [key: string]: unknown
}

export interface AnalyticsStatsResponse {
  success: boolean
  filters?: AnalyticsFilters
  summary?: AnalyticsSummary
  daily_breakdown?: AnalyticsDailyBreakdownEntry[]
  top_events?: AnalyticsEventCount[]
  events_by_category?: AnalyticsEventCount[]
  recent_events?: AnalyticsRecentEvent[]
  geographic_distribution?: AnalyticsGeographicDistributionEntry[] | Record<string, unknown>
  merchant_performance?: AnalyticsMerchantPerformanceEntry[] | Record<string, unknown>
  message?: string
  [key: string]: unknown
}

export interface AdminSystemHealthService {
  name?: string
  description?: string
  status?: string
  uptime?: string
  uptime_percentage?: string
  responseTime?: string
  response_time?: string
  [key: string]: unknown
}

export type PaymentMethod =
  | 'flooz'
  | 'tmoney'
  | 'orange_money'
  | 'mtn_momo'
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

export interface PaymentConsumerSummary {
  id: number
  name: string
  phone?: string | null
  email?: string | null
}

export interface PaymentReservationSummary {
  id: number
  reservation_code: string
  status: string
  payment_status?: PaymentStatus | string | null
  total_amount?: number | null
  pickup_date?: string | null
  created_at?: string | null
  product?: {
    id: number
    name: string
  } | null
  consumer?: PaymentConsumerSummary | null
}

export type PaymentWithRelations = Payment & {
  reservation?: PaymentReservationSummary | null
}

export interface PaymentSummaryBreakdown {
  count: number
  total_amount: number
}

export interface PaymentSummaryMeta {
  total_amount: number
  total_count: number
  status_breakdown: Record<string, PaymentSummaryBreakdown>
  method_breakdown: Record<string, PaymentSummaryBreakdown>
}

export interface MerchantPaymentsResponse {
  success: boolean
  data: PaymentWithRelations[]
  pagination?: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
  meta?: {
    summary?: PaymentSummaryMeta | null
    applied_filters?: Record<string, string | number>
  }
  message?: string
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
}

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

export interface DeliveryZone {
  id: number
  name: string
  description?: string | null
  base_fee?: number
  per_km_fee?: number
  min_fee?: number
  max_fee?: number
  is_active?: boolean
}

export interface DeliveryDriverProfile {
  id: number
  user_id: number
  vehicle_type: 'moto' | 'velo' | 'voiture' | 'pied'
  vehicle_plate?: string | null
  license_number?: string | null
  delivery_zone_id?: number | null
  is_verified?: boolean
  is_active?: boolean
  is_available?: boolean
  rating?: number | null
  current_latitude?: number | null
  current_longitude?: number | null
  last_location_update?: string | null
  zone?: DeliveryZone | null
  user?: User | null
  photo_url?: string | null
}

export interface DeliveryTrackingPoint {
  id?: number
  latitude: number
  longitude: number
  created_at?: string
}

export interface DeliveryLocation {
  latitude: number
  longitude: number
  address?: string | null
  updated_at?: string
}

export interface Delivery {
  id: number
  reservation_id: number
  delivery_code?: string
  status: DeliveryStatus
  pickup_address?: string | null
  pickup_latitude?: number | null
  pickup_longitude?: number | null
  delivery_address?: string | null
  delivery_latitude?: number | null
  delivery_longitude?: number | null
  delivery_instructions?: string | null
  delivery_notes?: string | null
  delivery_fee?: number
  driver_commission?: number
  estimated_delivery_at?: string | null
  cancelled_at?: string | null
  completed_at?: string | null
  can_cancel?: boolean
  consumer_rating?: number | null
  consumer_feedback?: string | null
  driver?: DeliveryDriverProfile | null
  zone?: DeliveryZone | null
  reservation?: Reservation | null
  created_at?: string
  updated_at?: string
}

export interface DeliveryTrackingResponse {
  delivery: Delivery
  driver_position?: DeliveryLocation | null
  tracking_history?: DeliveryTrackingPoint[]
  pickup_location?: DeliveryLocation
  delivery_location?: DeliveryLocation
}

export interface DriverStatsPeriod {
  deliveries: number
  earnings: number
}

export interface DriverStats {
  today: DriverStatsPeriod
  week: DriverStatsPeriod
  month: DriverStatsPeriod
  total: DriverStatsPeriod
}

export interface DriverEarning {
  id: number
  driver_id: number
  delivery_id?: number | null
  amount: number
  type: 'delivery' | 'bonus' | 'tip' | 'withdrawal'
  description?: string | null
  created_at?: string
}

export interface Reward {
  id: number
  name: string
  description?: string | null
  points_required: number
  image_url?: string | null
  type?: 'discount' | 'product' | 'voucher' | 'experience' | string
  value?: number | null
  value_type?: 'fixed' | 'percentage' | string
  quantity_available?: number | null
  quantity_redeemed?: number
  valid_from?: string | null
  valid_until?: string | null
  tier_required?: 'bronze' | 'silver' | 'gold' | 'platinum' | null
  is_active?: boolean
  is_featured?: boolean
  merchant_id?: number | null
  merchant?: {
    id: number
    business_name: string
  } | null
  remaining_quantity?: number | null
  formatted_value?: string
  can_redeem?: boolean
  points_needed?: number
  created_at?: string
}

export interface RewardRedemption {
  id: number
  reward_id: number
  points_used: number
  status?: string | null
  created_at?: string
  reward?: Reward | null
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

export interface ConversationListPayload {
  conversations: Conversation[]
}

export interface ConversationDetailPayload {
  conversation: Conversation
  messages: ConversationMessage[]
}

export interface ConversationMessagePayload {
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

export interface FavoriteProductSummary {
  id: number
  name: string
  description?: string | null
  original_price: number
  discounted_price: number
  discount_percentage?: number
  quantity_available: number
  expiration_date?: string | null
  image_url?: string | null
  is_active?: boolean
  favorited_at?: string
  category?: Partial<Category> | null
  merchant?: Partial<Merchant> | null
}

export interface FavoriteToggleResponse {
  success: boolean
  message?: string
  is_favorite: boolean
}

export type FavoriteListResponse = ApiResponse<FavoriteProductSummary[]> & {
  meta?: {
    total: number
  }
}

export interface PaymentMethodOptionResponse {
  value: PaymentMethod
  label: string
  description: string
  instructions: string
  provider: string
  requires_phone: boolean
  requires_pin: boolean
  is_wallet: boolean
  is_instant: boolean
  is_available: boolean
  wallet_balance?: number | null
  wallet_currency?: string | null
  wallet_has_pin?: boolean | null
}

export interface PublicReviewEntry {
  id: number
  merchant_id?: number | null
  rating: number
  title?: string | null
  comment?: string | null
  stars?: string
  time_ago?: string
  is_verified_purchase?: boolean
  merchant?: { id: number; business_name?: string | null } | null
  user?: { id: number; name?: string | null } | null
  product?: { id: number; name?: string | null } | null
  created_at?: string | null
}

export interface MerchantLocation {
  latitude: number | null
  longitude: number | null
  has_location?: boolean
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

export interface ReservationCreationResponse {
  success: boolean
  message?: string
  data: Reservation
  payment: Payment | null
}

export interface PaymentApiResponse {
  success: boolean
  message?: string
  data: Payment
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
  tier?: LoyaltyTierData
}

export interface LoyaltyTierBenefits {
  points_multiplier: number
  exclusive_rewards: boolean
  priority_support: boolean
  early_access: boolean
}

export interface LoyaltyTierInfo {
  key: string
  name: string
  threshold: number
  benefits: LoyaltyTierBenefits
}

export interface LoyaltyTierData {
  current_tier: string
  current_tier_name: string
  lifetime_points: number
  next_tier: string | null
  next_tier_name: string | null
  points_to_next_tier: number
  progress_percentage: number
  benefits: LoyaltyTierBenefits
  all_tiers: LoyaltyTierInfo[]
}

export interface LoyaltyParticipantSummary {
  id: number
  name: string
  email: string
  total_points: number
  last_activity: string | null
}

export interface LoyaltyAwardPayload {
  user_id: number
  points: number
  earned_from: Exclude<LoyaltyPointSource, 'redemption'>
  reference_id?: number
  description: string
  expires_at?: string
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

export interface LoginCredentials {
  email: string
  password: string
  remember?: boolean
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
  merchant_id?: number
  max_price?: number
  max_expiry_days?: number
  sort_by?: 'created_at' | 'discounted_price' | 'expiration_date' | 'name'
  sort_order?: 'asc' | 'desc'
  page?: number
  per_page?: number
  latitude?: number
  longitude?: number
  min_discount?: number
  radius?: number
}

export interface PaginatedResponse<T> {
  data: T[]
  current_page: number
  last_page: number
  per_page: number
  total: number
  from: number
  to: number
}

export interface ReviewUserSummary {
  id: number
  name: string
}

export interface ReviewProductSummary {
  id: number
  name: string
}

export interface ReviewReplySummary {
  id?: number
  reply: string
  created_at?: string
  updated_at?: string
  [key: string]: unknown
}

export interface Review {
  id: number
  rating: number
  title?: string | null
  comment?: string | null
  time_ago?: string
  is_verified_purchase?: boolean
  user: ReviewUserSummary
  product?: ReviewProductSummary
  reply?: ReviewReplySummary | null
  [key: string]: unknown
}

export interface ReviewRatingDistributionEntry {
  rating: number
  count: number
  percentage: number
}

export interface ReviewStats {
  total_reviews: number
  average_rating: number
  verified_reviews?: number
  rating_distribution: ReviewRatingDistributionEntry[]
  [key: string]: unknown
}

// Merchant-specific types
export interface MerchantStats {
  total_products: number
  active_products: number
  pending_reservations: number
  completed_reservations: number
  total_revenue: number
  monthly_revenue: number
  average_rating: number
  total_reviews: number
}

export interface ProductCreateData {
  name: string
  description: string
  original_price: number
  discounted_price: number
  quantity_available: number
  expiration_date: string
  category_id: number
  image?: File
  is_active?: boolean
}

export interface ProductUpdateData {
  name?: string
  description?: string
  original_price?: number
  discounted_price?: number
  quantity_available?: number
  expiration_date?: string
  category_id?: number
  image?: File
  is_active?: boolean
}

export interface SurpriseBasket {
  id: number
  name: string
  description: string
  original_price: number
  discounted_price: number
  quantity_available: number
  is_active: boolean
  products: Product[]
  created_at: string
  updated_at: string
}

export interface SurpriseBasketCreateData {
  name: string
  description: string
  original_price: number
  discounted_price: number
  quantity_available: number
  product_ids: number[]
  is_active?: boolean
}

export interface ReservationFilters {
  status?: string
  payment_status?: string
  from_date?: string
  to_date?: string
  product_id?: number
}

