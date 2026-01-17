import { configureStore } from '@reduxjs/toolkit'
import reservationsReducer, {
  createReservation,
  fetchMyReservations,
  fetchReservation,
  cancelReservation,
  updateReservationQuantity,
  clearError,
} from '../reservationsSlice'
import apiService from '../../../services/api'
import offlineService from '../../../services/offlineService'

jest.mock('../../../services/api', () => ({
  __esModule: true,
  default: {
    createReservation: jest.fn(),
    getMyReservations: jest.fn(),
    getReservation: jest.fn(),
    cancelReservation: jest.fn(),
    updateReservationQuantity: jest.fn(),
  },
}))

jest.mock('../../../services/offlineService', () => ({
  __esModule: true,
  default: {
    checkConnectivity: jest.fn(),
    getConnectivityStatus: jest.fn(),
    setCache: jest.fn(),
    getCache: jest.fn(),
  },
}))

jest.mock('../../../utils/logger', () => ({
  storeLogger: { warn: jest.fn(), log: jest.fn() },
  createLogger: () => ({ warn: jest.fn(), log: jest.fn() }),
}))

const mockedApi = apiService as jest.Mocked<typeof apiService>
const mockedOffline = offlineService as jest.Mocked<typeof offlineService>

type Reservation = import('../../../types').Reservation
type ReservationCreationPayload = import('../../../types').ReservationCreationPayload

function createReservationsTestStore() {
  return configureStore({ reducer: { reservations: reservationsReducer } })
}

type ReservationsTestStore = ReturnType<typeof createReservationsTestStore>

function createMockReservation(overrides: Partial<Reservation> = {}): Reservation {
  return {
    id: 1,
    reservation_code: 'RES-001',
    quantity: 2,
    original_price: 500,
    discounted_price: 250,
    status: 'pending',
    created_at: '2026-01-13T10:00:00Z',
    expires_at: '2026-01-14T10:00:00Z',
    product: {
      id: 1,
      name: 'Pain complet',
      original_price: 500,
      discounted_price: 250,
      quantity_available: 10,
      merchant: { id: 1, name: 'Boulangerie Test' },
    },
    ...overrides,
  }
}

describe('reservationsSlice - Integration Tests', () => {
  let store: ReservationsTestStore

  beforeEach(() => {
    store = createReservationsTestStore()
    jest.clearAllMocks()
    mockedOffline.checkConnectivity.mockResolvedValue(true)
    mockedOffline.getConnectivityStatus.mockReturnValue(true)
    mockedOffline.setCache.mockResolvedValue(undefined)
    mockedOffline.getCache.mockResolvedValue(null)
  })

  describe('createReservation', () => {
    const validPayload: ReservationCreationPayload = {
      productId: 1,
      quantity: 2,
      paymentMethod: 'on_site',
    }

    it('should add new reservation to state on success', async () => {
      const newReservation = createMockReservation({ id: 99 })
      mockedApi.createReservation.mockResolvedValue({
        success: true,
        data: newReservation,
        message: 'Réservation créée',
      })

      expect(store.getState().reservations.reservations).toHaveLength(0)

      const result = await store.dispatch(createReservation(validPayload))

      expect(result.type).toBe('reservations/create/fulfilled')
      const state = store.getState().reservations
      expect(state.reservations).toHaveLength(1)
      expect(state.reservations[0].id).toBe(99)
      expect(state.loading).toBe(false)
      expect(state.error).toBeNull()
    })

    it('should not duplicate reservation if already exists', async () => {
      const existingReservation = createMockReservation({ id: 1, quantity: 1 })
      mockedApi.getMyReservations.mockResolvedValue({ success: true, data: [existingReservation] })
      await store.dispatch(fetchMyReservations())
      expect(store.getState().reservations.reservations).toHaveLength(1)

      const updatedReservation = createMockReservation({ id: 1, quantity: 5 })
      mockedApi.createReservation.mockResolvedValue({
        success: true,
        data: updatedReservation,
        message: 'Réservation créée',
      })

      await store.dispatch(createReservation(validPayload))

      const state = store.getState().reservations
      expect(state.reservations).toHaveLength(1)
      expect(state.reservations[0].quantity).toBe(5)
    })

    it('should set error state on API failure', async () => {
      mockedApi.createReservation.mockRejectedValue(new Error('Stock insuffisant'))

      const result = await store.dispatch(createReservation(validPayload))

      expect(result.type).toBe('reservations/create/rejected')
      const state = store.getState().reservations
      expect(state.loading).toBe(false)
      expect(state.error).toBe('Stock insuffisant')
      expect(state.reservations).toHaveLength(0)
    })

    it('should extract validation errors from API response', async () => {
      const validationError = new Error('Validation failed')
      ;(validationError as any).validationErrors = {
        quantity: ['La quantité demandée dépasse le stock disponible'],
      }
      mockedApi.createReservation.mockRejectedValue(validationError)

      const result = await store.dispatch(createReservation(validPayload))

      const state = store.getState().reservations
      expect(state.error).toBe('La quantité demandée dépasse le stock disponible')
    })

    it('should set loading state during request', async () => {
      let resolvePromise: (value: any) => void
      const pendingPromise = new Promise((resolve) => { resolvePromise = resolve })
      mockedApi.createReservation.mockReturnValue(pendingPromise as any)

      const dispatchPromise = store.dispatch(createReservation(validPayload))

      expect(store.getState().reservations.loading).toBe(true)

      resolvePromise!({ success: true, data: createMockReservation(), message: 'OK' })
      await dispatchPromise

      expect(store.getState().reservations.loading).toBe(false)
    })
  })

  describe('cancelReservation', () => {
    it('should update reservation status to cancelled', async () => {
      const pendingReservation = createMockReservation({ id: 1, status: 'pending' })
      mockedApi.getMyReservations.mockResolvedValue({ success: true, data: [pendingReservation] })
      await store.dispatch(fetchMyReservations())
      expect(store.getState().reservations.reservations[0].status).toBe('pending')

      const cancelledReservation = { ...pendingReservation, status: 'cancelled' as const }
      mockedApi.cancelReservation.mockResolvedValue({ success: true, data: cancelledReservation })

      const result = await store.dispatch(cancelReservation(1))

      expect(result.type).toBe('reservations/cancel/fulfilled')
      const state = store.getState().reservations
      expect(state.reservations[0].status).toBe('cancelled')
      expect(state.loading).toBe(false)
    })

    it('should preserve other reservations when cancelling one', async () => {
      const reservations = [
        createMockReservation({ id: 1, status: 'pending' }),
        createMockReservation({ id: 2, status: 'confirmed' }),
        createMockReservation({ id: 3, status: 'pending' }),
      ]
      mockedApi.getMyReservations.mockResolvedValue({ success: true, data: reservations })
      await store.dispatch(fetchMyReservations())

      const cancelledRes = { ...reservations[0], status: 'cancelled' as const }
      mockedApi.cancelReservation.mockResolvedValue({ success: true, data: cancelledRes })

      await store.dispatch(cancelReservation(1))

      const state = store.getState().reservations
      expect(state.reservations).toHaveLength(3)
      expect(state.reservations.find(r => r.id === 1)?.status).toBe('cancelled')
      expect(state.reservations.find(r => r.id === 2)?.status).toBe('confirmed')
      expect(state.reservations.find(r => r.id === 3)?.status).toBe('pending')
    })

    it('should set error when cancellation fails', async () => {
      const reservation = createMockReservation({ id: 1, status: 'pending' })
      mockedApi.getMyReservations.mockResolvedValue({ success: true, data: [reservation] })
      await store.dispatch(fetchMyReservations())

      mockedApi.cancelReservation.mockRejectedValue(
        new Error('Cette réservation ne peut pas être annulée')
      )

      const result = await store.dispatch(cancelReservation(1))

      expect(result.type).toBe('reservations/cancel/rejected')
      const state = store.getState().reservations
      expect(state.error).toBe('Cette réservation ne peut pas être annulée')
      expect(state.reservations[0].status).toBe('pending')
    })

    it('should handle non-existent reservation ID gracefully', async () => {
      mockedApi.cancelReservation.mockRejectedValue(new Error('Réservation introuvable'))

      const result = await store.dispatch(cancelReservation(999))

      expect(result.type).toBe('reservations/cancel/rejected')
      expect(store.getState().reservations.error).toBe('Réservation introuvable')
    })
  })

  describe('updateReservationQuantity', () => {
    it('should update quantity in state', async () => {
      const reservation = createMockReservation({ id: 1, quantity: 2 })
      mockedApi.getMyReservations.mockResolvedValue({ success: true, data: [reservation] })
      await store.dispatch(fetchMyReservations())

      const updatedReservation = { ...reservation, quantity: 5 }
      mockedApi.updateReservationQuantity.mockResolvedValue({ success: true, data: updatedReservation })

      const result = await store.dispatch(updateReservationQuantity({ id: 1, quantity: 5 }))

      expect(result.type).toBe('reservations/updateQuantity/fulfilled')
      expect(store.getState().reservations.reservations[0].quantity).toBe(5)
    })

    it('should handle quantity update failure', async () => {
      const reservation = createMockReservation({ id: 1, quantity: 2 })
      mockedApi.getMyReservations.mockResolvedValue({ success: true, data: [reservation] })
      await store.dispatch(fetchMyReservations())

      mockedApi.updateReservationQuantity.mockRejectedValue(new Error('Quantité non disponible'))

      await store.dispatch(updateReservationQuantity({ id: 1, quantity: 100 }))

      const state = store.getState().reservations
      expect(state.error).toBe('Quantité non disponible')
      expect(state.reservations[0].quantity).toBe(2)
    })
  })

  describe('fetchMyReservations - Extended', () => {
    it('should replace all reservations with fresh data', async () => {
      mockedApi.getMyReservations.mockResolvedValue({
        success: true,
        data: [createMockReservation({ id: 1 }), createMockReservation({ id: 2 })],
      })
      await store.dispatch(fetchMyReservations())
      expect(store.getState().reservations.reservations).toHaveLength(2)

      mockedApi.getMyReservations.mockResolvedValue({
        success: true,
        data: [createMockReservation({ id: 3 })],
      })
      await store.dispatch(fetchMyReservations())

      const state = store.getState().reservations
      expect(state.reservations).toHaveLength(1)
      expect(state.reservations[0].id).toBe(3)
    })

    it('should handle empty reservation list', async () => {
      mockedApi.getMyReservations.mockResolvedValue({ success: true, data: [] })

      await store.dispatch(fetchMyReservations())

      const state = store.getState().reservations
      expect(state.reservations).toHaveLength(0)
      expect(state.loading).toBe(false)
      expect(state.error).toBeNull()
    })
  })

  describe('fetchReservation', () => {
    it('should add fetched reservation to state if not exists', async () => {
      const reservation = createMockReservation({ id: 5 })
      mockedApi.getReservation.mockResolvedValue({ success: true, data: reservation })

      await store.dispatch(fetchReservation(5))

      const state = store.getState().reservations
      expect(state.reservations).toHaveLength(1)
      expect(state.reservations[0].id).toBe(5)
    })

    it('should update existing reservation with fresh data', async () => {
      const staleReservation = createMockReservation({ id: 1, status: 'pending' })
      mockedApi.getMyReservations.mockResolvedValue({ success: true, data: [staleReservation] })
      await store.dispatch(fetchMyReservations())

      const freshReservation = createMockReservation({ id: 1, status: 'confirmed' })
      mockedApi.getReservation.mockResolvedValue({ success: true, data: freshReservation })
      await store.dispatch(fetchReservation(1))

      expect(store.getState().reservations.reservations[0].status).toBe('confirmed')
    })
  })

  describe('clearError', () => {
    it('should clear error state', async () => {
      mockedApi.createReservation.mockRejectedValue(new Error('Test error'))
      await store.dispatch(createReservation({ productId: 1, quantity: 1, paymentMethod: 'on_site' }))
      expect(store.getState().reservations.error).toBe('Test error')

      store.dispatch(clearError())

      expect(store.getState().reservations.error).toBeNull()
    })
  })

  describe('Offline Support', () => {
    it('should use cached data when offline', async () => {
      const cachedReservations = [createMockReservation({ id: 1 })]
      mockedOffline.checkConnectivity.mockResolvedValue(false)
      mockedOffline.getCache.mockResolvedValue(cachedReservations)

      await store.dispatch(fetchMyReservations())

      expect(mockedApi.getMyReservations).not.toHaveBeenCalled()
      expect(store.getState().reservations.reservations).toEqual(cachedReservations)
    })

    it('should fallback to cache when API fails', async () => {
      const cachedReservations = [createMockReservation({ id: 1 })]
      mockedOffline.checkConnectivity.mockResolvedValue(true)
      mockedApi.getMyReservations.mockRejectedValue(new Error('Network error'))
      mockedOffline.getCache.mockResolvedValue(cachedReservations)

      await store.dispatch(fetchMyReservations())

      expect(store.getState().reservations.reservations).toEqual(cachedReservations)
      expect(store.getState().reservations.error).toBeNull()
    })

    it('should cache data after successful API call', async () => {
      const reservations = [createMockReservation({ id: 1 })]
      mockedApi.getMyReservations.mockResolvedValue({ success: true, data: reservations })

      await store.dispatch(fetchMyReservations())

      expect(mockedOffline.setCache).toHaveBeenCalledWith(
        'reservations_list',
        expect.arrayContaining([expect.objectContaining({ id: 1 })])
      )
    })
  })

  describe('Concurrent Actions', () => {
    it('should handle multiple rapid cancellations correctly', async () => {
      const reservations = [
        createMockReservation({ id: 1, status: 'pending' }),
        createMockReservation({ id: 2, status: 'pending' }),
      ]
      mockedApi.getMyReservations.mockResolvedValue({ success: true, data: reservations })
      await store.dispatch(fetchMyReservations())

      mockedApi.cancelReservation
        .mockResolvedValueOnce({ success: true, data: { ...reservations[0], status: 'cancelled' as const } })
        .mockResolvedValueOnce({ success: true, data: { ...reservations[1], status: 'cancelled' as const } })

      await Promise.all([
        store.dispatch(cancelReservation(1)),
        store.dispatch(cancelReservation(2)),
      ])

      const state = store.getState().reservations
      expect(state.reservations.every(r => r.status === 'cancelled')).toBe(true)
    })
  })
})
