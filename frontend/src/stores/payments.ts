import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { apiService } from '@/services/api'
import type { Payment, PaymentStatus, PaymentMethod } from '@/types'

const FINAL_STATUSES: PaymentStatus[] = ['success', 'failed', 'on_site', 'refunded']

const isFinalStatus = (status?: PaymentStatus | null) => {
  if (!status) return false
  return FINAL_STATUSES.includes(status)
}

export const usePaymentsStore = defineStore('payments', () => {
  const currentPayment = ref<Payment | null>(null)
  const paymentsByReservation = ref<Record<number, Payment>>({})
  const loading = ref(false)
  const error = ref<string | null>(null)
  const pollingInterval = ref<ReturnType<typeof setInterval> | null>(null)
  const pollingPaymentId = ref<number | null>(null)

  const clearError = () => {
    error.value = null
  }

  const setError = (message: string) => {
    error.value = message
  }

  const recordPayment = (payment: Payment | null) => {
    currentPayment.value = payment

    if (payment) {
      paymentsByReservation.value[payment.reservation_id] = payment

      if (isFinalStatus(payment.status)) {
        stopPolling()
      }
    }
  }

  const stopPolling = () => {
    if (pollingInterval.value) {
      clearInterval(pollingInterval.value)
      pollingInterval.value = null
    }
    pollingPaymentId.value = null
  }

  const refreshPayment = async (paymentId: number) => {
    try {
      loading.value = true
      clearError()

      const response = await apiService.getPayment(paymentId)
      if (!response?.data) {
        throw new Error('Réponse de paiement invalide')
      }

      recordPayment(response.data)

      return { success: true as const, data: response.data }
    } catch (err: any) {
      const message = err?.message || 'Impossible de récupérer le statut du paiement'
      setError(message)
      return { success: false as const, error: message }
    } finally {
      loading.value = false
    }
  }

  const startPolling = (paymentId: number, intervalMs = 5000) => {
    if (pollingPaymentId.value === paymentId && pollingInterval.value) {
      return
    }

    stopPolling()
    pollingPaymentId.value = paymentId

    pollingInterval.value = setInterval(async () => {
      const result = await refreshPayment(paymentId)
      if (result.success && isFinalStatus(result.data.status)) {
        stopPolling()
      }
    }, intervalMs)
  }

  const cancelPayment = async (paymentId: number, reason?: string) => {
    try {
      loading.value = true
      clearError()

      const response = await apiService.cancelPayment(paymentId, reason)
      recordPayment(response.data)

      return { success: true as const, data: response.data }
    } catch (err: any) {
      const message = err?.message || 'Impossible d\'annuler le paiement'
      setError(message)
      return { success: false as const, error: message }
    } finally {
      loading.value = false
    }
  }

  const initiatePayment = async (params: {
    reservationId: number
    paymentMethod: PaymentMethod
    customerPhone?: string
    customerEmail?: string
    notes?: string
    currency?: string
  }) => {
    try {
      loading.value = true
      clearError()

      const response = await apiService.initiatePayment(params)
      recordPayment(response.data)

      return { success: true as const, data: response.data }
    } catch (err: any) {
      const message = err?.message || 'Impossible d\'initialiser le paiement'
      setError(message)
      return { success: false as const, error: message }
    } finally {
      loading.value = false
    }
  }

  const getPaymentForReservation = (reservationId: number) => {
    return paymentsByReservation.value[reservationId] ?? null
  }

  const clearPayment = () => {
    currentPayment.value = null
  }

  const isProcessing = computed(() => loading.value)
  const hasError = computed(() => Boolean(error.value))

  return {
    currentPayment,
    paymentsByReservation,
    loading,
    error,
    pollingPaymentId,
    isProcessing,
    hasError,
    recordPayment,
    clearPayment,
    getPaymentForReservation,
    refreshPayment,
    startPolling,
    stopPolling,
    cancelPayment,
    initiatePayment
  }
})

export { isFinalStatus }
