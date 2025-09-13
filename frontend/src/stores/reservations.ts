import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Reservation } from '@/types'
import { apiService } from '@/services/api'

export const useReservationsStore = defineStore('reservations', () => {
  const reservations = ref<Reservation[]>([])
  const merchantReservations = ref<Reservation[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const pendingReservations = computed(() =>
    reservations.value.filter(r => r.status === 'pending')
  )

  const confirmedReservations = computed(() =>
    reservations.value.filter(r => r.status === 'confirmed')
  )

  const completedReservations = computed(() =>
    reservations.value.filter(r => r.status === 'completed')
  )

  const cancelledReservations = computed(() =>
    reservations.value.filter(r => r.status === 'cancelled')
  )

  const totalSavings = computed(() =>
    completedReservations.value.reduce((total, reservation) => {
      const originalPrice = parseFloat(reservation.product.original_price)
      const discountedPrice = parseFloat(reservation.product.discounted_price)
      const savings = (originalPrice - discountedPrice) * reservation.quantity_reserved
      return total + savings
    }, 0)
  )

  const pendingMerchantReservations = computed(() =>
    merchantReservations.value.filter(r => r.status === 'pending')
  )

  const confirmedMerchantReservations = computed(() =>
    merchantReservations.value.filter(r => r.status === 'confirmed')
  )

  const setError = (message: string) => {
    error.value = message
    setTimeout(() => {
      error.value = null
    }, 5000)
  }

  const clearError = () => {
    error.value = null
  }

  const fetchReservations = async () => {
    try {
      loading.value = true
      clearError()

      const response = await apiService.getReservations()
      reservations.value = response.data

      return { success: true }
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des réservations')
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  const createReservation = async (productId: number, quantity: number) => {
    try {
      loading.value = true
      clearError()

      const response = await apiService.createReservation(productId, quantity)

      // Add new reservation to the list
      reservations.value.unshift(response.data)

      return { success: true, data: response.data }
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la réservation')
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  const cancelReservation = async (id: number) => {
    try {
      loading.value = true
      clearError()

      await apiService.cancelReservation(id)

      // Update reservation status in the list
      const reservation = reservations.value.find(r => r.id === id)
      if (reservation) {
        reservation.status = 'cancelled'
        reservation.cancelled_at = new Date().toISOString()
      }

      return { success: true }
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'annulation')
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  const fetchMerchantReservations = async () => {
    try {
      loading.value = true
      clearError()

      const response = await apiService.getMerchantReservations()
      merchantReservations.value = response.data

      return { success: true }
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des réservations')
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  const confirmReservation = async (id: number) => {
    try {
      loading.value = true
      clearError()

      const response = await apiService.confirmReservation(id)

      // Update reservation in the list
      const index = merchantReservations.value.findIndex(r => r.id === id)
      if (index !== -1) {
        merchantReservations.value[index] = response.data
      }

      return { success: true, data: response.data }
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la confirmation')
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  const getReservationById = (id: number): Reservation | undefined => {
    return reservations.value.find(r => r.id === id) ||
           merchantReservations.value.find(r => r.id === id)
  }

  const clearReservations = () => {
    reservations.value = []
    merchantReservations.value = []
  }

  return {
    // State
    reservations,
    merchantReservations,
    loading,
    error,

    // Getters
    pendingReservations,
    confirmedReservations,
    completedReservations,
    cancelledReservations,
    totalSavings,
    pendingMerchantReservations,
    confirmedMerchantReservations,

    // Actions
    fetchReservations,
    createReservation,
    cancelReservation,
    fetchMerchantReservations,
    confirmReservation,
    getReservationById,
    clearReservations,
    setError,
    clearError
  }
})