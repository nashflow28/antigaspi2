import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Reservation, ReservationCreationPayload, Payment } from '@/types'
import { apiService } from '@/services/api'
import { notify } from '@/composables/useNotifications'

export const useReservationsStore = defineStore('reservations', () => {
  const reservations = ref<Reservation[]>([])
  const merchantReservations = ref<Reservation[]>([])
  const loading = ref(false)

  const normalizeReservation = (reservation: Reservation): Reservation => {
    const normalizedQuantity = reservation.quantity ?? reservation.quantity_reserved ?? 0
    const normalizedQuantityReserved = reservation.quantity_reserved ?? normalizedQuantity

    return {
      ...reservation,
      quantity: normalizedQuantity,
      quantity_reserved: normalizedQuantityReserved,
      latest_payment: reservation.latest_payment ?? null
    }
  }

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
      const savings = (reservation.original_price - reservation.discounted_price) * reservation.quantity
      return total + savings
    }, 0)
  )

  const pendingMerchantReservations = computed(() =>
    merchantReservations.value.filter(r => r.status === 'pending')
  )

  const confirmedMerchantReservations = computed(() =>
    merchantReservations.value.filter(r => r.status === 'confirmed')
  )

  const createRetryableNotification = (
    message: string,
    retryOperation: () => Promise<unknown>
  ) => {
    let hasClosed = false

    notify.error(message, 'Réservations', {
      action: {
        label: 'Réessayer',
        callback: async () => {
          if (loading.value) return

          try {
            await retryOperation()
          } catch (retryError) {
            console.error('Reservation retry failed:', retryError)
          }
        }
      },
      onClose: () => {
        if (hasClosed) return
        hasClosed = true
      }
    })
  }

  const fetchReservations = async () => {
    try {
      loading.value = true

      const response = await apiService.getReservations()
      reservations.value = response.data.map(normalizeReservation)

      return { success: true }
    } catch (err: any) {
      createRetryableNotification(
        err.message || 'Erreur lors du chargement des réservations',
        () => fetchReservations()
      )
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  const createReservation = async (payload: ReservationCreationPayload) => {
    try {
      loading.value = true

      const response = await apiService.createReservation(payload)

      // Add new reservation to the list
      const normalizedReservation = normalizeReservation(response.data)
      reservations.value.unshift(normalizedReservation)

      const payment: Payment | null = response.payment ?? null

      notify.success('Réservation créée avec succès', 'Réservations', { duration: 3000 })

      return { success: true, data: normalizedReservation, payment }
    } catch (err: any) {
      createRetryableNotification(
        err.message || 'Erreur lors de la réservation',
        () => createReservation(payload)
      )
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  const cancelReservation = async (id: number) => {
    try {
      loading.value = true

      await apiService.cancelReservation(id)

      // Update reservation status in the list
      const reservation = reservations.value.find(r => r.id === id)
      if (reservation) {
        reservation.status = 'cancelled'
        reservation.cancelled_at = new Date().toISOString()
      }

      notify.success('Réservation annulée', 'Réservations', { duration: 3000 })

      return { success: true }
    } catch (err: any) {
      createRetryableNotification(
        err.message || 'Erreur lors de l\'annulation',
        () => cancelReservation(id)
      )
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  const fetchMerchantReservations = async () => {
    try {
      loading.value = true

      const response = await apiService.getMerchantReservations()
      merchantReservations.value = response.data.map(normalizeReservation)

      return { success: true }
    } catch (err: any) {
      createRetryableNotification(
        err.message || 'Erreur lors du chargement des réservations',
        () => fetchMerchantReservations()
      )
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  const confirmReservation = async (id: number) => {
    try {
      loading.value = true

      const response = await apiService.confirmReservation(id)
      const normalizedReservation = normalizeReservation(response.data)

      // Update reservation in the list
      const index = merchantReservations.value.findIndex(r => r.id === id)
      if (index !== -1) {
        merchantReservations.value[index] = normalizedReservation
      }

      notify.success('Réservation confirmée', 'Réservations', { duration: 3000 })

      return { success: true, data: normalizedReservation }
    } catch (err: any) {
      createRetryableNotification(
        err.message || 'Erreur lors de la confirmation',
        () => confirmReservation(id)
      )
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
    clearReservations
  }
})
