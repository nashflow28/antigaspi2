import { configureStore } from '@reduxjs/toolkit'
import reservationsReducer, {
  fetchMyReservations,
  fetchReservation,
  reservationsInitialState
} from '../reservationsSlice'
import apiService from '../../../services/api'
import offlineService from '../../../services/offlineService'

// Mocks
jest.mock('../../../services/api', () => ({
  getMyReservations: jest.fn(),
  getReservation: jest.fn(),
  createReservation: jest.fn(),
  cancelReservation: jest.fn(),
  updateReservationQuantity: jest.fn(),
}))
jest.mock('../../../services/offlineService')
jest.mock('../../../utils/logger', () => {
  const originalModule = jest.requireActual('../../../utils/logger');
  return {
    ...originalModule,
    storeLogger: { warn: jest.fn() },
    // Ensure createLogger is available if it's not a property of the default export
    createLogger: originalModule.createLogger || ((prefix: string) => ({ warn: jest.fn(), log: jest.fn() })),
  };
})

describe('reservationsSlice', () => {
  let store: any

  beforeEach(() => {
    store = configureStore({
      reducer: {
        reservations: reservationsReducer
      }
    })
    jest.clearAllMocks()
  })

  describe('fetchMyReservations', () => {
    it('should fetch from API and cache when online', async () => {
      // Setup
      const mockReservations = [{ id: 1, quantity: 2 }]
      ;(offlineService.checkConnectivity as jest.Mock).mockResolvedValue(true)
      ;(apiService.getMyReservations as jest.Mock).mockResolvedValue({ data: mockReservations })

      // Execute
      await store.dispatch(fetchMyReservations())

      // Verify
      expect(apiService.getMyReservations).toHaveBeenCalled()
      expect(offlineService.setCache).toHaveBeenCalledWith('reservations_list', mockReservations)
      expect(store.getState().reservations.reservations).toEqual(mockReservations)
    })

    it('should fetch from cache when offline', async () => {
      // Setup
      const mockCachedReservations = [{ id: 1, quantity: 2 }]
      ;(offlineService.checkConnectivity as jest.Mock).mockResolvedValue(false)
      ;(offlineService.getCache as jest.Mock).mockResolvedValue(mockCachedReservations)

      // Execute
      await store.dispatch(fetchMyReservations())

      // Verify
      expect(apiService.getMyReservations).not.toHaveBeenCalled()
      expect(offlineService.getCache).toHaveBeenCalledWith('reservations_list')
      expect(store.getState().reservations.reservations).toEqual(mockCachedReservations)
    })

    it('should use cache as fallback when API fails', async () => {
      // Setup
      const mockCachedReservations = [{ id: 1, quantity: 2 }]
      ;(offlineService.checkConnectivity as jest.Mock).mockResolvedValue(true)
      ;(apiService.getMyReservations as jest.Mock).mockRejectedValue(new Error('API Error'))
      ;(offlineService.getCache as jest.Mock).mockResolvedValue(mockCachedReservations)

      // Execute
      await store.dispatch(fetchMyReservations())

      // Verify
      expect(apiService.getMyReservations).toHaveBeenCalled()
      expect(offlineService.getCache).toHaveBeenCalledWith('reservations_list')
      expect(store.getState().reservations.reservations).toEqual(mockCachedReservations)
    })
  })

  describe('fetchReservation', () => {
    it('should fetch from API and cache when online', async () => {
      const mockReservation = { id: 1, quantity: 2 }
      ;(offlineService.checkConnectivity as jest.Mock).mockResolvedValue(true)
      ;(apiService.getReservation as jest.Mock).mockResolvedValue({ data: mockReservation })

      await store.dispatch(fetchReservation(1))

      expect(apiService.getReservation).toHaveBeenCalledWith(1)
      expect(offlineService.setCache).toHaveBeenCalledWith('reservation_1', mockReservation)
      expect(store.getState().reservations.reservations).toContainEqual(mockReservation)
    })
  })
})
