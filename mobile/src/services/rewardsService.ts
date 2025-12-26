/**
 * Service pour la gestion des récompenses
 */
import apiService from './api'

export interface Reward {
  id: number
  name: string
  description: string
  image_url: string | null
  points_required: number
  type: 'discount' | 'product' | 'voucher' | 'experience'
  value: number | null
  value_type: 'fixed' | 'percentage'
  quantity_available: number | null
  quantity_redeemed: number
  valid_from: string | null
  valid_until: string | null
  tier_required: 'bronze' | 'silver' | 'gold' | 'platinum' | null
  is_active: boolean
  is_featured: boolean
  merchant_id: number | null
  merchant?: {
    id: number
    business_name: string
  }
  remaining_quantity: number | null
  formatted_value: string
  can_redeem?: boolean
  points_needed?: number
}

export interface RewardRedemption {
  id: number
  user_id: number
  reward_id: number
  points_spent: number
  redemption_code: string
  status: 'pending' | 'used' | 'expired' | 'cancelled'
  used_at: string | null
  expires_at: string | null
  created_at: string
  reward?: Reward
}

export interface RewardFilters {
  type?: string
  merchant_id?: number
  affordable_only?: boolean
  featured_first?: boolean
  per_page?: number
  page?: number
}

export interface RewardsResponse {
  success: boolean
  data: Reward[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
  user_context: {
    current_points: number
    loyalty_tier: string
  }
}

export interface RedemptionResponse {
  success: boolean
  message: string
  data?: {
    redemption: RewardRedemption
    remaining_points: number
  }
}

class RewardsService {
  /**
   * Récupérer le catalogue des récompenses
   */
  async getRewards(filters: RewardFilters = {}): Promise<RewardsResponse> {
    const params = new URLSearchParams()

    if (filters.type) params.append('type', filters.type)
    if (filters.merchant_id) params.append('merchant_id', String(filters.merchant_id))
    if (filters.affordable_only) params.append('affordable_only', '1')
    if (filters.featured_first !== undefined) params.append('featured_first', filters.featured_first ? '1' : '0')
    if (filters.per_page) params.append('per_page', String(filters.per_page))
    if (filters.page) params.append('page', String(filters.page))

    const queryString = params.toString()
    const url = queryString ? `/rewards?${queryString}` : '/rewards'

    return apiService.get<RewardsResponse>(url)
  }

  /**
   * Récupérer les récompenses en vedette
   */
  async getFeaturedRewards(): Promise<{ success: boolean; data: Reward[] }> {
    return apiService.get('/rewards/featured')
  }

  /**
   * Récupérer une récompense spécifique
   */
  async getReward(id: number): Promise<{ success: boolean; data: Reward }> {
    return apiService.get(`/rewards/${id}`)
  }

  /**
   * Échanger une récompense
   */
  async redeemReward(rewardId: number): Promise<RedemptionResponse> {
    return apiService.post(`/rewards/${rewardId}/redeem`)
  }

  /**
   * Récupérer mes échanges de récompenses
   */
  async getMyRedemptions(filters: { status?: string; per_page?: number; page?: number } = {}): Promise<{
    success: boolean
    data: RewardRedemption[]
    meta: {
      current_page: number
      last_page: number
      per_page: number
      total: number
    }
  }> {
    const params = new URLSearchParams()

    if (filters.status) params.append('status', filters.status)
    if (filters.per_page) params.append('per_page', String(filters.per_page))
    if (filters.page) params.append('page', String(filters.page))

    const queryString = params.toString()
    const url = queryString ? `/rewards/my-redemptions?${queryString}` : '/rewards/my-redemptions'

    return apiService.get(url)
  }

  /**
   * Récupérer le détail d'un échange
   */
  async getRedemption(id: number): Promise<{ success: boolean; data: RewardRedemption }> {
    return apiService.get(`/rewards/redemptions/${id}`)
  }

  /**
   * Valider un code de récompense (pour commerçants)
   */
  async useRedemptionCode(code: string): Promise<{
    success: boolean
    message: string
    data?: {
      redemption: RewardRedemption
      customer_name: string
      reward_name: string
      reward_value: string
    }
  }> {
    return apiService.post(`/rewards/use-code/${code}`)
  }

  /**
   * Créer une récompense (pour commerçants/admin)
   */
  async createReward(data: Partial<Reward>): Promise<{ success: boolean; data: Reward; message: string }> {
    return apiService.post('/rewards', data)
  }

  /**
   * Mettre à jour une récompense
   */
  async updateReward(id: number, data: Partial<Reward>): Promise<{ success: boolean; data: Reward; message: string }> {
    return apiService.put(`/rewards/${id}`, data)
  }

  /**
   * Supprimer une récompense
   */
  async deleteReward(id: number): Promise<{ success: boolean; message: string }> {
    return apiService.delete(`/rewards/${id}`)
  }
}

export const rewardsService = new RewardsService()
export default rewardsService
