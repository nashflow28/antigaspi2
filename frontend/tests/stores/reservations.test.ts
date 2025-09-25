import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

import { useReservationsStore } from '@/stores/reservations'
import { apiService } from '@/services/api'
import { notify } from '@/composables/useNotifications'

vi.mock('@/services/api')
vi.mock('@/composables/useNotifications')

const mockedApiService = vi.mocked(apiService)
const mockedNotify = vi.mocked(notify)

const baseReservation = {
  id: 1,
  reservation_code: 'ABC123',
  quantity: 1,
  original_price: 10,
  discounted_price: 5,
  status: 'pending' as const,
  product: {
    id: 1,
    name: 'Produit test'
  },
  latest_payment: null
}

describe('Reservations Store - Notifications & Callbacks', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('fetchReservations', () => {
    it('shows an error notification with retry callback on failure', async () => {
      mockedApiService.getReservations.mockRejectedValue(new Error('Network error'))

      const reservationsStore = useReservationsStore()
      await reservationsStore.fetchReservations()

      expect(mockedNotify.error).toHaveBeenCalledWith(
        'Network error',
        'Réservations',
        expect.objectContaining({
          action: expect.objectContaining({
            label: 'Réessayer',
            callback: expect.any(Function)
          })
        })
      )
    })

    it('retries the fetch when the notification action is executed', async () => {
      mockedApiService.getReservations
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ data: [baseReservation] })

      const reservationsStore = useReservationsStore()
      await reservationsStore.fetchReservations()

      const retryCallback = mockedNotify.error.mock.calls[0]?.[2]?.action?.callback
      expect(retryCallback).toBeDefined()

      await retryCallback?.()

      expect(mockedApiService.getReservations).toHaveBeenCalledTimes(2)
    })
  })

  describe('createReservation', () => {
    const payload = { productId: 1, quantity: 1, paymentMethod: 'card' as const }

    it('shows a success notification when the reservation is created', async () => {
      mockedApiService.createReservation.mockResolvedValue({
        data: baseReservation,
        payment: null
      })

      const reservationsStore = useReservationsStore()
      const result = await reservationsStore.createReservation(payload)

      expect(result.success).toBe(true)
      expect(mockedNotify.success).toHaveBeenCalledWith(
        'Réservation créée avec succès',
        'Réservations',
        { duration: 3000 }
      )
    })

    it('shows an error notification with retry callback on failure', async () => {
      mockedApiService.createReservation.mockRejectedValue(new Error('Server error'))

      const reservationsStore = useReservationsStore()
      await reservationsStore.createReservation(payload)

      expect(mockedNotify.error).toHaveBeenCalledWith(
        'Server error',
        'Réservations',
        expect.objectContaining({
          action: expect.objectContaining({
            label: 'Réessayer',
            callback: expect.any(Function)
          })
        })
      )
    })

    it('retries the creation when the notification action is executed', async () => {
      mockedApiService.createReservation
        .mockRejectedValueOnce(new Error('Server error'))
        .mockResolvedValueOnce({ data: baseReservation, payment: null })

      const reservationsStore = useReservationsStore()
      await reservationsStore.createReservation(payload)

      const retryCallback = mockedNotify.error.mock.calls[0]?.[2]?.action?.callback
      expect(retryCallback).toBeDefined()

      await retryCallback?.()

      expect(mockedApiService.createReservation).toHaveBeenCalledTimes(2)
      expect(mockedNotify.success).toHaveBeenCalledWith(
        'Réservation créée avec succès',
        'Réservations',
        { duration: 3000 }
      )
    })
  })

  describe('cancelReservation', () => {
    it('shows a success notification when cancellation succeeds', async () => {
      mockedApiService.cancelReservation.mockResolvedValue({})

      const reservationsStore = useReservationsStore()
      reservationsStore.reservations = [
        { ...baseReservation, status: 'confirmed' as const }
      ] as any

      const result = await reservationsStore.cancelReservation(1)

      expect(result.success).toBe(true)
      expect(mockedNotify.success).toHaveBeenCalledWith(
        'Réservation annulée',
        'Réservations',
        { duration: 3000 }
      )
    })

    it('shows an error notification with retry callback on failure', async () => {
      mockedApiService.cancelReservation.mockRejectedValue(new Error('Cancellation failed'))

      const reservationsStore = useReservationsStore()
      await reservationsStore.cancelReservation(1)

      expect(mockedNotify.error).toHaveBeenCalledWith(
        'Cancellation failed',
        'Réservations',
        expect.objectContaining({
          action: expect.objectContaining({
            label: 'Réessayer',
            callback: expect.any(Function)
          })
        })
      )
    })
  })

  describe('fetchMerchantReservations', () => {
    it('shows an error notification with retry callback on failure', async () => {
      mockedApiService.getMerchantReservations.mockRejectedValue(new Error('Merchant network error'))

      const reservationsStore = useReservationsStore()
      await reservationsStore.fetchMerchantReservations()

      expect(mockedNotify.error).toHaveBeenCalledWith(
        'Merchant network error',
        'Réservations',
        expect.objectContaining({
          action: expect.objectContaining({
            label: 'Réessayer',
            callback: expect.any(Function)
          })
        })
      )
    })
  })

  describe('confirmReservation', () => {
    it('shows a success notification when confirmation succeeds', async () => {
      mockedApiService.confirmReservation.mockResolvedValue({ data: { ...baseReservation, status: 'confirmed' as const } })

      const reservationsStore = useReservationsStore()
      reservationsStore.merchantReservations = [
        { ...baseReservation, status: 'pending' as const }
      ] as any

      const result = await reservationsStore.confirmReservation(1)

      expect(result.success).toBe(true)
      expect(mockedNotify.success).toHaveBeenCalledWith(
        'Réservation confirmée',
        'Réservations',
        { duration: 3000 }
      )
    })

    it('shows an error notification with retry callback on failure', async () => {
      mockedApiService.confirmReservation.mockRejectedValue(new Error('Confirmation failed'))

      const reservationsStore = useReservationsStore()
      await reservationsStore.confirmReservation(1)

      expect(mockedNotify.error).toHaveBeenCalledWith(
        'Confirmation failed',
        'Réservations',
        expect.objectContaining({
          action: expect.objectContaining({
            label: 'Réessayer',
            callback: expect.any(Function)
          })
        })
      )
    })
  })
})
