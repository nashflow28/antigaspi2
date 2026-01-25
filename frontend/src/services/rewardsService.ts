import { apiService } from '@/services/api'
import type { ApiResponse, Reward, RewardRedemption } from '@/types'

export interface RewardsQuery {
  per_page?: number
  page?: number
  featured?: boolean
}

class RewardsService {
  private readonly baseUrl = '/rewards'

  async getRewards(query?: RewardsQuery): Promise<ApiResponse<Reward[]>> {
    if (!query || Object.keys(query).length === 0) {
      return apiService.get<ApiResponse<Reward[]>>(this.baseUrl)
    }

    const params = new URLSearchParams()
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value))
      }
    })

    const suffix = params.toString() ? `?${params.toString()}` : ''
    return apiService.get<ApiResponse<Reward[]>>(`${this.baseUrl}${suffix}`)
  }

  async getFeaturedRewards(): Promise<ApiResponse<Reward[]>> {
    return apiService.get<ApiResponse<Reward[]>>(`${this.baseUrl}/featured`)
  }

  async getReward(id: number): Promise<ApiResponse<Reward>> {
    return apiService.get<ApiResponse<Reward>>(`${this.baseUrl}/${id}`)
  }

  async redeemReward(id: number): Promise<ApiResponse<RewardRedemption>> {
    return apiService.post<ApiResponse<RewardRedemption>>(`${this.baseUrl}/${id}/redeem`, {})
  }

  async getMyRedemptions(): Promise<ApiResponse<RewardRedemption[]>> {
    return apiService.get<ApiResponse<RewardRedemption[]>>(`${this.baseUrl}/my-redemptions`)
  }
}

export const rewardsService = new RewardsService()
export default rewardsService
