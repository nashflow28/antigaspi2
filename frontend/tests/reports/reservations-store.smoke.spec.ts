import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useReservationsStore } from '@/stores/reservations'

vi.mock('@/services/api', () => ({
  apiService: {
    getReservations: vi.fn(),
    createReservation: vi.fn(),
    cancelReservation: vi.fn(),
    updateReservationStatus: vi.fn()
  }
}))

describe('Reservations store smoke tests', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('hydrates reservation list and exposes aggregates', async () => {
    const store = useReservationsStore()
    const { apiService } = await import('@/services/api')

    const baseReservation = {
      id: 1,
      status: 'pending',
      quantity: 1,
      original_price: 500,
      discounted_price: 250,
      product: { id: 1, name: 'Panier surprise' },
      merchant: { id: 2, name: 'Épicerie Verte' }
    }

    vi.mocked(apiService.getReservations).mockResolvedValue({
      data: [
        baseReservation,
        { ...baseReservation, id: 2, status: 'confirmed' }
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

    store.reservations = [{
      id: 3,
      status: 'pending',
      quantity: 1,
      original_price: 500,
      discounted_price: 250,
      product: { id: 1, name: 'Panier surprise' },
      merchant: { id: 2, name: 'Épicerie Verte' }
    } as any]

    vi.mocked(apiService.updateReservationStatus).mockResolvedValue({
      data: { ...store.reservations[0], status: 'confirmed' },
      success: true
    } as any)

    const result = await store.updateStatus(3, 'confirmed')

    expect(result.success).toBe(true)
    expect(store.reservations[0].status).toBe('confirmed')
  })
})
