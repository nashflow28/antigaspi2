import { useState, useEffect, useCallback } from 'react'
import apiService from '../services/api'

export interface TierBenefits {
  points_multiplier: number
  exclusive_rewards: boolean
  priority_support: boolean
  early_access: boolean
}

export interface TierInfo {
  key: string
  name: string
  threshold: number
  benefits: TierBenefits
}

export interface LoyaltyTierData {
  current_tier: string
  current_tier_name: string
  lifetime_points: number
  next_tier: string | null
  next_tier_name: string | null
  points_to_next_tier: number
  progress_percentage: number
  benefits: TierBenefits
  all_tiers: TierInfo[]
}

export interface PointsBreakdown {
  earned_from: string
  total: number
}

export interface PointsHistory {
  id: number
  points: number
  earned_from: string
  description: string
  created_at: string
  expires_at: string | null
}

export interface LoyaltyData {
  total_points: number
  expiring_soon: number
  breakdown: PointsBreakdown[]
  recent_history: PointsHistory[]
  tier: LoyaltyTierData
}

export interface ReferralInfo {
  referral_code: string
  referral_link: string
  total_referrals: number
  successful_referrals: number
  points_earned: number
  points_per_referral: number
}

interface UseLoyaltyReturn {
  loyaltyData: LoyaltyData | null
  referralInfo: ReferralInfo | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  refreshReferral: () => Promise<void>
}

/**
 * Hook pour gérer les données de fidélité et les niveaux
 */
export const useLoyalty = (): UseLoyaltyReturn => {
  const [loyaltyData, setLoyaltyData] = useState<LoyaltyData | null>(null)
  const [referralInfo, setReferralInfo] = useState<ReferralInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchLoyaltyData = useCallback(async () => {
    try {
      setError(null)
      const response = await apiService.get<{ success: boolean; data: LoyaltyData }>(
        '/loyalty/my-points'
      )

      if (response.success && response.data) {
        setLoyaltyData(response.data)
      } else {
        setError('Erreur lors de la récupération des points')
      }
    } catch (err: any) {
      setError(err.message || 'Erreur de connexion')
    }
  }, [])

  const fetchReferralInfo = useCallback(async () => {
    try {
      const response = await apiService.get<{ success: boolean; data: ReferralInfo }>(
        '/loyalty/referral'
      )

      if (response.success && response.data) {
        setReferralInfo(response.data)
      }
    } catch (err: any) {
      console.error('Error fetching referral info:', err)
    }
  }, [])

  const refresh = useCallback(async () => {
    setLoading(true)
    await fetchLoyaltyData()
    setLoading(false)
  }, [fetchLoyaltyData])

  const refreshReferral = useCallback(async () => {
    await fetchReferralInfo()
  }, [fetchReferralInfo])

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([fetchLoyaltyData(), fetchReferralInfo()])
      setLoading(false)
    }
    loadData()
  }, [fetchLoyaltyData, fetchReferralInfo])

  return {
    loyaltyData,
    referralInfo,
    loading,
    error,
    refresh,
    refreshReferral,
  }
}

/**
 * Helper functions for tier display
 */
export const TIER_COLORS: Record<string, string> = {
  bronze: '#CD7F32',
  silver: '#C0C0C0',
  gold: '#F5C518',
  platinum: '#E5E4E2',
}

export const TIER_LABELS: Record<string, string> = {
  bronze: 'Bronze',
  silver: 'Argent',
  gold: 'Or',
  platinum: 'Platine',
}

export const TIER_ICONS: Record<string, string> = {
  bronze: 'medal-outline',
  silver: 'medal',
  gold: 'trophy',
  platinum: 'diamond',
}

export const formatPointsSource = (source: string): string => {
  const sources: Record<string, string> = {
    purchase: 'Achat',
    review: 'Avis',
    referral: 'Parrainage',
    bonus: 'Bonus',
    redemption: 'Échange',
  }
  return sources[source] || source
}

export default useLoyalty
