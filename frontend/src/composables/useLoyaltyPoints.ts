import { ref, computed } from 'vue'
import { notify } from '@/composables/useNotifications'
import apiService from '@/services/api'
import type {
  LoyaltyPointsSummary,
  LoyaltyParticipantSummary,
  LoyaltyAwardPayload,
  LoyaltyRedemptionPayload
} from '@/types'

export const useLoyaltyPoints = () => {
  // State
  const points = ref<LoyaltyPointsSummary | null>(null)
  const allUsersPoints = ref<LoyaltyParticipantSummary[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Computed
  const totalPoints = computed(() => points.value?.total_points || 0)
  const expiringPoints = computed(() => points.value?.expiring_soon || 0)
  const recentHistory = computed(() => points.value?.recent_history || [])
  const pointsBreakdown = computed(() => points.value?.breakdown || [])

  const getErrorMessage = (err: unknown, fallback: string): string => {
    if (err instanceof Error && err.message) {
      return err.message
    }

    if (typeof err === 'string' && err.length > 0) {
      return err
    }

    if (err && typeof err === 'object' && 'message' in err && typeof (err as any).message === 'string') {
      return (err as { message: string }).message
    }

    return fallback
  }

  const reportError = (err: unknown, fallback: string, title?: string) => {
    const message = getErrorMessage(err, fallback)
    error.value = message
    notify.error(message, title)
  }

  // Methods
  const fetchMyPoints = async (): Promise<void> => {
    loading.value = true
    error.value = null

    try {
      const response = await apiService.getLoyaltyPoints()
      points.value = response.data
    } catch (err) {
      reportError(err, 'Erreur lors de la récupération des points')
    } finally {
      loading.value = false
    }
  }

  const awardPoints = async (
    data: LoyaltyAwardPayload,
    scope: 'merchant' | 'admin' = 'merchant'
  ): Promise<boolean> => {
    loading.value = true
    error.value = null

    try {
      const response = await apiService.awardLoyaltyPoints(data, scope)
      notify.success(response.message || 'Points attribués avec succès')
      return true
    } catch (err) {
      reportError(err, 'Erreur lors de l\'attribution des points')
      return false
    } finally {
      loading.value = false
    }
  }

  const redeemPoints = async (data: LoyaltyRedemptionPayload): Promise<boolean> => {
    loading.value = true
    error.value = null

    try {
      const response = await apiService.redeemLoyaltyPoints(data)
      notify.success(response.message || 'Points échangés avec succès')
      await fetchMyPoints()
      return true
    } catch (err) {
      reportError(
        err,
        'Impossible d\'échanger vos points. Vérifiez que vous avez suffisamment de points.',
        'Erreur d\'échange'
      )
      return false
    } finally {
      loading.value = false
    }
  }

  const fetchAllUsersPoints = async (scope: 'merchant' | 'admin' = 'merchant'): Promise<void> => {
    loading.value = true
    error.value = null

    try {
      const response = await apiService.getLoyaltyParticipants(scope)
      allUsersPoints.value = response.data
    } catch (err) {
      reportError(err, 'Erreur lors de la récupération des points')
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
      'purchase': 'text-success',
      'review': 'text-info',
      'referral': 'text-purple-600',
      'bonus': 'text-warning',
      'redemption': 'text-error'
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
