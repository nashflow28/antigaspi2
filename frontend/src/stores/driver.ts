import { defineStore } from 'pinia'
import { ref } from 'vue'
import { driverService } from '@/services/driverService'
import { notify } from '@/composables/useNotifications'
import type { Delivery, DeliveryDriverProfile, DriverStats, DriverEarning } from '@/types'

export const useDriverStore = defineStore('driver', () => {
  const profile = ref<DeliveryDriverProfile | null>(null)
  const stats = ref<DriverStats | null>(null)
  const availableDeliveries = ref<Delivery[]>([])
  const activeDelivery = ref<Delivery | null>(null)
  const history = ref<Delivery[]>([])
  const historyPagination = ref<Record<string, number> | null>(null)
  const earnings = ref<DriverEarning[]>([])
  const earningsSummary = ref<Record<string, number>>({})
  const earningsPagination = ref<Record<string, number> | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const setError = (message: string) => {
    error.value = message
  }

  const clearError = () => {
    error.value = null
  }

  const normalizePaginated = <T>(payload: any) => {
    if (Array.isArray(payload)) {
      return { items: payload as T[], meta: null }
    }

    const items = Array.isArray(payload?.data) ? (payload.data as T[]) : []
    const meta = payload && typeof payload === 'object'
      ? {
        current_page: payload.current_page ?? payload.currentPage,
        last_page: payload.last_page ?? payload.lastPage,
        per_page: payload.per_page ?? payload.perPage,
        total: payload.total
      }
      : null

    return { items, meta }
  }

  const fetchProfile = async () => {
    loading.value = true
    clearError()
    try {
      const response = await driverService.getProfile()
      profile.value = response.data.driver
      stats.value = response.data.stats
      return true
    } catch (err: any) {
      const message = err?.message || 'Impossible de charger le profil livreur'
      setError(message)
      notify.error(message)
      return false
    } finally {
      loading.value = false
    }
  }

  const toggleAvailability = async () => {
    loading.value = true
    clearError()
    try {
      const response = await driverService.toggleAvailability()
      if (profile.value) {
        profile.value.is_available = response.data.is_available
      }
      notify.success(response.message || 'Statut mis à jour')
      return response.data
    } catch (err: any) {
      const message = err?.message || 'Impossible de changer votre statut'
      setError(message)
      notify.error(message)
      return null
    } finally {
      loading.value = false
    }
  }

  const updateLocation = async (latitude: number, longitude: number) => {
    try {
      const response = await driverService.updateLocation({ latitude, longitude })
      if (profile.value) {
        profile.value.current_latitude = response.data.latitude
        profile.value.current_longitude = response.data.longitude
        profile.value.last_location_update = response.data.updated_at
      }
      return response.data
    } catch (err: any) {
      const message = err?.message || 'Impossible de mettre à jour la position'
      setError(message)
      return null
    }
  }

  const fetchAvailableDeliveries = async () => {
    loading.value = true
    clearError()
    try {
      const response = await driverService.getAvailableDeliveries()
      availableDeliveries.value = response.data || []
      return true
    } catch (err: any) {
      const message = err?.message || 'Impossible de charger les livraisons disponibles'
      setError(message)
      return false
    } finally {
      loading.value = false
    }
  }

  const fetchActiveDelivery = async () => {
    loading.value = true
    clearError()
    try {
      const response = await driverService.getActiveDelivery()
      activeDelivery.value = response.data || null
      return true
    } catch (err: any) {
      const message = err?.message || 'Impossible de charger la livraison en cours'
      setError(message)
      return false
    } finally {
      loading.value = false
    }
  }

  const fetchDeliveryById = async (deliveryId: number) => {
    loading.value = true
    clearError()
    try {
      const response = await driverService.getDeliveryById(deliveryId)
      return response.data
    } catch (err: any) {
      const message = err?.message || 'Impossible de charger les détails de la livraison'
      setError(message)
      notify.error(message)
      return null
    } finally {
      loading.value = false
    }
  }

  const fetchHistory = async () => {
    loading.value = true
    clearError()
    try {
      const response = await driverService.getDeliveryHistory()
      const { items, meta } = normalizePaginated<Delivery>(response.data)
      history.value = items
      historyPagination.value = meta
      return true
    } catch (err: any) {
      const message = err?.message || 'Impossible de charger l’historique'
      setError(message)
      return false
    } finally {
      loading.value = false
    }
  }

  const fetchEarnings = async (period = 'month') => {
    loading.value = true
    clearError()
    try {
      const response = await driverService.getEarnings({ period })
      const payload = response.data?.earnings ?? response.data
      const { items, meta } = normalizePaginated<DriverEarning>(payload)
      earnings.value = items
      earningsPagination.value = meta
      earningsSummary.value = response.data?.summary || {}
      return true
    } catch (err: any) {
      const message = err?.message || 'Impossible de charger les gains'
      setError(message)
      return false
    } finally {
      loading.value = false
    }
  }

  const acceptDelivery = async (deliveryId: number) => {
    loading.value = true
    clearError()
    try {
      const response = await driverService.acceptDelivery(deliveryId)
      activeDelivery.value = response.data
      await fetchAvailableDeliveries()
      notify.success('Livraison acceptée')
      return response.data
    } catch (err: any) {
      const message = err?.message || 'Impossible d’accepter la livraison'
      setError(message)
      notify.error(message)
      return null
    } finally {
      loading.value = false
    }
  }

  const rejectDelivery = async (deliveryId: number, reason?: string) => {
    loading.value = true
    clearError()
    try {
      const response = await driverService.rejectDelivery(deliveryId, reason)
      await fetchAvailableDeliveries()
      notify.info('Livraison refusée')
      return response.data
    } catch (err: any) {
      const message = err?.message || 'Impossible de refuser la livraison'
      setError(message)
      notify.error(message)
      return null
    } finally {
      loading.value = false
    }
  }

  const startPickup = async (deliveryId: number) => {
    return driverService.startPickup(deliveryId)
  }

  const confirmPickup = async (deliveryId: number) => {
    return driverService.confirmPickup(deliveryId)
  }

  const startDelivery = async (deliveryId: number) => {
    return driverService.startDelivery(deliveryId)
  }

  const completeDelivery = async (deliveryId: number, payload?: { notes?: string; photo_url?: string; signature_url?: string }) => {
    return driverService.completeDelivery(deliveryId, payload)
  }

  const reportFailure = async (deliveryId: number, reason: string) => {
    return driverService.reportFailure(deliveryId, reason)
  }

  const cancelDelivery = async (deliveryId: number, reason: string) => {
    return driverService.cancelDelivery(deliveryId, reason)
  }

  return {
    profile,
    stats,
    availableDeliveries,
    activeDelivery,
    history,
    historyPagination,
    earnings,
    earningsSummary,
    earningsPagination,
    loading,
    error,
    fetchProfile,
    toggleAvailability,
    updateLocation,
    fetchAvailableDeliveries,
    fetchActiveDelivery,
    fetchDeliveryById,
    fetchHistory,
    fetchEarnings,
    acceptDelivery,
    rejectDelivery,
    startPickup,
    confirmPickup,
    startDelivery,
    completeDelivery,
    reportFailure,
    cancelDelivery,
    cancelDeliveryDirect: cancelDelivery
  }
})
