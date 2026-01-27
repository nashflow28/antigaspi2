import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useReservationsStore } from '@/stores/reservations'

// Mock API
vi.mock('@/services/api', () => ({
  apiService: {
    getReservations: vi.fn(),
    createReservation: vi.fn(),
    updateReservationStatus: vi.fn(),
    cancelReservation: vi.fn()
  }
}))

// Mock notifications
vi.mock('@/composables/useNotifications', () => ({
  notify: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn()
  }
}))

describe('Reservations Store', () => {
  let reservationsStore: ReturnType<typeof useReservationsStore>

  const mockReservation = {
    id: 1,
    userId: 1,
    productId: 1,
    merchantId: 1,
    quantity: 2,
    quantity_reserved: 2,
    totalPrice: 500,
    discounted_price: 250,
    original_price: 500,
    status: 'pending' as const,
    pickupDate: '2025-01-02T10:00:00Z',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
    latest_payment: null,
    product: {
      id: 1,
      name: 'Pain artisanal',
      price: 250,
      imageUrl: '/images/pain.jpg'
    },
    merchant: {
      id: 1,
      name: 'Boulangerie Martin',
      address: '123 rue de la Paix'
    }
  }

  beforeEach(() => {
    setActivePinia(createPinia())
    reservationsStore = useReservationsStore()
    vi.clearAllMocks()
  })

  describe('Initial State', () => {
    it('should initialize with empty reservations', () => {
      expect(reservationsStore.reservations).toEqual([])
      expect(reservationsStore.loading).toBe(false)
      expect(reservationsStore.selectedReservation).toBeNull()
    })

    it('should have required methods', () => {
      expect(typeof reservationsStore.fetchReservations).toBe('function')
      expect(typeof reservationsStore.createReservation).toBe('function')
      expect(typeof reservationsStore.updateStatus).toBe('function')
    })
  })

  describe('Reservations Loading', () => {
    it('should fetch reservations successfully', async () => {
      const mockReservations = [mockReservation]

      const { apiService } = await import('@/services/api')
      vi.mocked(apiService.getReservations).mockResolvedValue({
        data: mockReservations,
        success: true
      })

      await reservationsStore.fetchReservations()

      expect(reservationsStore.reservations).toEqual(mockReservations)
      expect(reservationsStore.loading).toBe(false)
    })

    it('should handle fetch error', async () => {
      const { apiService } = await import('@/services/api')
      vi.mocked(apiService.getReservations).mockRejectedValue(new Error('Network error'))

      await reservationsStore.fetchReservations()

      expect(reservationsStore.reservations).toEqual([])
      expect(reservationsStore.loading).toBe(false)
    })
  })

  describe('Reservation Management', () => {
    it('should create reservation successfully', async () => {
      const reservationData = {
        productId: 1,
        quantity: 2,
        pickupDate: '2025-01-02T10:00:00Z'
      }

      const { apiService } = await import('@/services/api')
      vi.mocked(apiService.createReservation).mockResolvedValue({
        data: mockReservation,
        success: true
      })

      const result = await reservationsStore.createReservation(reservationData)

      expect(result.success).toBe(true)
      // Check that reservation was added (normalized with extra fields)
      expect(reservationsStore.reservations).toHaveLength(1)
      expect(reservationsStore.reservations[0].id).toBe(mockReservation.id)
      expect(reservationsStore.reservations[0].status).toBe(mockReservation.status)
    })

    it('should update reservation status', async () => {
      reservationsStore.reservations = [mockReservation]

      const { apiService } = await import('@/services/api')
      vi.mocked(apiService.updateReservationStatus).mockResolvedValue({
        data: { ...mockReservation, status: 'confirmed' },
        success: true
      })

      await reservationsStore.updateStatus(1, 'confirmed')

      expect(reservationsStore.reservations[0].status).toBe('confirmed')
    })

    it('should cancel reservation', async () => {
      reservationsStore.reservations = [mockReservation]

      const { apiService } = await import('@/services/api')
      vi.mocked(apiService.cancelReservation).mockResolvedValue({
        success: true
      })

      await reservationsStore.cancelReservation(1)

      // cancelReservation changes status to 'cancelled' instead of removing
      expect(reservationsStore.reservations).toHaveLength(1)
      expect(reservationsStore.reservations[0].status).toBe('cancelled')
    })
  })

  describe('Reservation Filtering', () => {
    beforeEach(() => {
      // Use array mutation instead of assignment for reactive updates
      reservationsStore.reservations.length = 0
      reservationsStore.reservations.push(
        { ...mockReservation, status: 'pending' },
        { ...mockReservation, id: 2, status: 'confirmed' },
        { ...mockReservation, id: 3, status: 'completed' },
        { ...mockReservation, id: 4, status: 'cancelled' }
      )
    })

    it('should get pending reservations', () => {
      const pending = reservationsStore.pendingReservations
      expect(pending).toHaveLength(1)
      expect(pending[0].status).toBe('pending')
    })

    it('should get active reservations', () => {
      const active = reservationsStore.activeReservations
      expect(active).toHaveLength(2) // pending + confirmed
      expect(active.every(r => ['pending', 'confirmed'].includes(r.status))).toBe(true)
    })

    it('should get completed reservations', () => {
      const completed = reservationsStore.completedReservations
      expect(completed).toHaveLength(1)
      expect(completed[0].status).toBe('completed')
    })

    it('should calculate total value', () => {
      const totalValue = reservationsStore.totalReservationValue
      expect(totalValue).toBe(2000) // 4 reservations × 500 each
    })
  })

  describe('Reservation Validation', () => {
    it('should validate reservation data', () => {
      const validData = {
        productId: 1,
        quantity: 2,
        pickupDate: '2025-01-02T10:00:00Z'
      }

      const isValid = reservationsStore.validateReservationData(validData)
      expect(isValid).toBe(true)
    })

    it('should reject invalid reservation data', () => {
      const invalidData = {
        productId: 0,
        quantity: -1,
        pickupDate: 'invalid-date'
      }

      const isValid = reservationsStore.validateReservationData(invalidData)
      expect(isValid).toBe(false)
    })
  })
})
