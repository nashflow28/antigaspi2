import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

vi.mock('@/composables/useNotifications', () => {
  const success = vi.fn().mockReturnValue('success')
  const error = vi.fn().mockReturnValue('error')
  return {
    notify: {
      success,
      error
    }
  }
})

vi.mock('@/services/api', () => ({
  apiService: {
    getReservations: vi.fn(),
    getMerchantReservations: vi.fn(),
    createReservation: vi.fn(),
    cancelReservation: vi.fn(),
    confirmReservation: vi.fn(),
    updateReservationStatus: vi.fn()
  }
}))

import { useReservationsStore } from '@/stores/reservations'

const baseReservation = () => ({
  id: 1,
  status: 'pending',
  quantity: 1,
  original_price: 500,
  discounted_price: 250,
  product: { id: 1, name: 'Panier surprise' },
  merchant: { id: 2, name: 'Épicerie Verte' }
})

describe('Reservations store smoke tests', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('hydrates reservation list and exposes aggregates', async () => {
    const store = useReservationsStore()
    const { apiService } = await import('@/services/api')

    vi.mocked(apiService.getReservations).mockResolvedValue({
      data: [
        baseReservation(),
        { ...baseReservation(), id: 2, status: 'confirmed' }
      ],
      success: true
    } as any)

    await store.fetchReservations()

    expect(store.reservations).toHaveLength(2)
    expect(store.activeReservations).toHaveLength(2)
    expect(store.totalReservationValue).toBe(500)
  })

  it('updates reservation status through API bridge', async () => {
    const store = useReservationsStore()
    const { apiService } = await import('@/services/api')

    store.reservations = [{ ...baseReservation(), id: 3 } as any]

    vi.mocked(apiService.updateReservationStatus).mockResolvedValue({
      data: { ...store.reservations[0], status: 'confirmed' },
      success: true
    } as any)

    const result = await store.updateStatus(3, 'confirmed')

    expect(result.success).toBe(true)
    expect(store.reservations[0].status).toBe('confirmed')
  })

  it('creates, cancels and confirms reservations with notifications', async () => {
    const store = useReservationsStore()
    const { apiService } = await import('@/services/api')
    const { notify } = await import('@/composables/useNotifications')

    vi.mocked(apiService.createReservation).mockResolvedValue({
      data: { ...baseReservation(), id: 10 },
      payment: { id: 'PAY-1' }
    } as any)

    const creation = await store.createReservation({ productId: 1, quantity: 1 })
    expect(creation.success).toBe(true)
    expect(store.reservations[0].id).toBe(10)
    expect(notify.success).toHaveBeenCalledWith('Réservation créée avec succès', 'Réservations', expect.any(Object))

    vi.mocked(apiService.cancelReservation).mockResolvedValue({ success: true } as any)
    const cancelResult = await store.cancelReservation(10)
    expect(cancelResult.success).toBe(true)
    expect(store.reservations[0].status).toBe('cancelled')

    vi.mocked(apiService.getMerchantReservations).mockResolvedValue({
      data: [baseReservation(), { ...baseReservation(), id: 3, status: 'confirmed' }]
    } as any)
    await store.fetchMerchantReservations()
    expect(store.pendingMerchantReservations).toHaveLength(1)

    vi.mocked(apiService.confirmReservation).mockResolvedValue({
      data: { ...baseReservation(), id: 3, status: 'confirmed' }
    } as any)
    await store.confirmReservation(3)
    expect(notify.success).toHaveBeenCalledWith('Réservation confirmée', 'Réservations', expect.any(Object))
  })

  it('handles reservation API failures and validation', async () => {
    const store = useReservationsStore()
    const { apiService } = await import('@/services/api')
    const { notify } = await import('@/composables/useNotifications')

    vi.mocked(apiService.getReservations).mockRejectedValue(new Error('offline'))
    const fetchResult = await store.fetchReservations()
    expect(fetchResult.success).toBe(false)
    expect(notify.error).toHaveBeenCalled()
    await notify.error.mock.calls.at(-1)?.[2]?.action?.callback?.()

    vi.mocked(apiService.createReservation).mockRejectedValue(new Error('bad payload'))
    const createResult = await store.createReservation({ productId: 0, quantity: 0 })
    expect(createResult.success).toBe(false)
    await notify.error.mock.calls.at(-1)?.[2]?.action?.callback?.()

    const validPayload = store.validateReservationData({ productId: 1, quantity: 2, pickupDate: new Date().toISOString() })
    const invalidPayload = store.validateReservationData({ productId: 1, quantity: -1, pickupDate: 'invalid' as any })
    expect(validPayload).toBe(true)
    expect(invalidPayload).toBe(false)
  })

  it('computes aggregate metrics for reservations', async () => {
    const store = useReservationsStore()
    const { apiService } = await import('@/services/api')

    vi.mocked(apiService.getReservations).mockResolvedValue({
      data: [
        { ...baseReservation(), status: 'pending' },
        { ...baseReservation(), id: 2, status: 'completed', quantity: 2 }
      ],
      success: true
    } as any)

    await store.fetchReservations()

    expect(store.pendingReservations).toHaveLength(1)
    expect(store.completedReservations).toHaveLength(1)
    expect(store.totalReservationValue).toBeGreaterThan(0)
    expect(store.totalSavings).toBeGreaterThan(0)
  })

  it('updates status via cancellation fallback when API bridge is unavailable', async () => {
    const store = useReservationsStore()
    const { apiService } = await import('@/services/api')
    const { notify } = await import('@/composables/useNotifications')

    store.reservations = [{ ...baseReservation(), id: 5, status: 'confirmed' } as any]
    const originalUpdate = apiService.updateReservationStatus
    ;(apiService as any).updateReservationStatus = undefined
    vi.mocked(apiService.cancelReservation).mockResolvedValue({ success: true } as any)

    const result = await store.updateStatus(5, 'cancelled')
    expect(result.success).toBe(true)
    expect(store.reservations[0].status).toBe('cancelled')
    expect(notify.success).toHaveBeenCalledWith('Réservation annulée', 'Réservations', expect.any(Object))
    apiService.updateReservationStatus = originalUpdate
  })

  it('handles merchant reservations fetch failures gracefully', async () => {
    const store = useReservationsStore()
    const { apiService } = await import('@/services/api')
    const { notify } = await import('@/composables/useNotifications')

    vi.mocked(apiService.getMerchantReservations).mockRejectedValue(new Error('network'))
    const result = await store.fetchMerchantReservations()
    expect(result.success).toBe(false)
    expect(notify.error).toHaveBeenCalled()
    await notify.error.mock.calls.at(-1)?.[2]?.action?.callback?.()
  })
})
