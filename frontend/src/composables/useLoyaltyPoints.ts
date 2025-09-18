import { ref, computed } from 'vue'
import axios from 'axios'
import { notify } from '@/composables/useNotifications'

// Types
interface LoyaltyPoint {
  id: number
  user_id: number
  points: number
  earned_from: 'purchase' | 'review' | 'referral' | 'bonus' | 'redemption'
  reference_id?: number
  description: string
  expires_at?: string
  created_at: string
}

interface PointsBreakdown {
  earned_from: string
  total: string
}

interface LoyaltyPointsData {
  total_points: number
  expiring_soon: number
  breakdown: PointsBreakdown[]
  recent_history: LoyaltyPoint[]
}

interface UserPointsSummary {
  id: number
  name: string
  email: string
  total_points: number
  last_activity: string
}

export const useLoyaltyPoints = () => {
  // State
  const points = ref<LoyaltyPointsData | null>(null)
  const allUsersPoints = ref<UserPointsSummary[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Computed
  const totalPoints = computed(() => points.value?.total_points || 0)
  const expiringPoints = computed(() => points.value?.expiring_soon || 0)
  const recentHistory = computed(() => points.value?.recent_history || [])
  const pointsBreakdown = computed(() => points.value?.breakdown || [])

  // Methods
  const fetchMyPoints = async (): Promise<void> => {
    loading.value = true
    error.value = null

    try {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        throw new Error('Token d\'authentification manquant')
      }

      const response = await axios.get('/api/loyalty/my-points', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.data.success) {
        points.value = response.data.data
      } else {
        throw new Error('Erreur lors de la récupération des points')
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || err.message
      notify.error('Erreur lors de la récupération des points')
    } finally {
      loading.value = false
    }
  }

  const awardPoints = async (data: {
    user_id: number
    points: number
    earned_from: 'purchase' | 'review' | 'referral' | 'bonus'
    reference_id?: number
    description: string
    expires_at?: string
  }): Promise<boolean> => {
    loading.value = true
    error.value = null

    try {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        throw new Error('Token d\'authentification manquant')
      }

      const response = await axios.post('/api/admin/loyalty/award', data, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.data.success) {
        notify.success('Points attribués avec succès')
        return true
      } else {
        throw new Error('Erreur lors de l\'attribution des points')
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || err.message
      notify.error('Erreur lors de l\'attribution des points')
      return false
    } finally {
      loading.value = false
    }
  }

  const redeemPoints = async (data: {
    points: number
    description: string
  }): Promise<boolean> => {
    loading.value = true
    error.value = null

    try {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        throw new Error('Token d\'authentification manquant')
      }

      const response = await axios.post('/api/loyalty/redeem', data, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.data.success) {
        notify.success('Points échangés avec succès')
        // Refresh points after redemption
        await fetchMyPoints()
        return true
      } else {
        throw new Error(response.data.message || 'Erreur lors de l\'échange des points')
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || err.message
      notify.error(error.value)
      return false
    } finally {
      loading.value = false
    }
  }

  const fetchAllUsersPoints = async (): Promise<void> => {
    loading.value = true
    error.value = null

    try {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        throw new Error('Token d\'authentification manquant')
      }

      const response = await axios.get('/api/admin/loyalty/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.data.success) {
        allUsersPoints.value = response.data.data
      } else {
        throw new Error('Erreur lors de la récupération des points')
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || err.message
      notify.error('Erreur lors de la récupération des points')
    } finally {
      loading.value = false
    }
  }

  // Helper functions
  const formatPoints = (points: number): string => {
    return new Intl.NumberFormat('fr-FR').format(points)
  }

  const getPointTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      'purchase': 'Achat',
      'review': 'Avis',
      'referral': 'Parrainage',
      'bonus': 'Bonus',
      'redemption': 'Échange'
    }
    return labels[type] || type
  }

  const getPointTypeColor = (type: string): string => {
    const colors: Record<string, string> = {
      'purchase': 'text-green-600',
      'review': 'text-blue-600',
      'referral': 'text-purple-600',
      'bonus': 'text-yellow-600',
      'redemption': 'text-red-600'
    }
    return colors[type] || 'text-gray-600'
  }

  const canRedeem = (pointsToRedeem: number): boolean => {
    return totalPoints.value >= pointsToRedeem && pointsToRedeem > 0
  }

  return {
    // State
    points,
    allUsersPoints,
    loading,
    error,

    // Computed
    totalPoints,
    expiringPoints,
    recentHistory,
    pointsBreakdown,

    // Methods
    fetchMyPoints,
    awardPoints,
    redeemPoints,
    fetchAllUsersPoints,

    // Helpers
    formatPoints,
    getPointTypeLabel,
    getPointTypeColor,
    canRedeem
  }
}