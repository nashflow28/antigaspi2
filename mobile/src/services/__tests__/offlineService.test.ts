// @ts-nocheck
/**
 * Tests unitaires pour OfflineService
 * Teste cache (avec cacheManager), sync queue, Promise lock, LRU eviction, connectivity
 */

import AsyncStorage from '@react-native-async-storage/async-storage'
import NetInfo from '@react-native-community/netinfo'
import offlineService, { CacheConfig, SyncQueue } from '../offlineService'
import apiService from '../api'
import cacheManager from '../../utils/cacheManager'

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  multiRemove: jest.fn(),
  getAllKeys: jest.fn(),
}))

// Mock NetInfo
jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(),
  fetch: jest.fn(),
}))

// Mock apiService
jest.mock('../api', () => ({
  __esModule: true,
  default: {
    createReservation: jest.fn(),
    cancelReservation: jest.fn(),
  },
}))

// Mock cacheManager module (mocks created inside factory to avoid hoisting issues)
jest.mock('../../utils/cacheManager', () => {
  // Create fresh jest.fn() instances inside the factory
  return {
    __esModule: true,
    default: {
      set: jest.fn(),
      get: jest.fn(),
      remove: jest.fn(),
      clear: jest.fn(),
      getStats: jest.fn(),
    },
  }
})

// Get typed references to mocked functions AFTER imports (Jest hoists mocks before imports)
const mockCreateReservation = apiService.createReservation as jest.MockedFunction<typeof apiService.createReservation>
const mockCancelReservation = apiService.cancelReservation as jest.MockedFunction<typeof apiService.cancelReservation>

// Get references to cacheManager mocked functions
const mockCacheManagerSet = cacheManager.set as jest.Mock
const mockCacheManagerGet = cacheManager.get as jest.Mock
const mockCacheManagerRemove = cacheManager.remove as jest.Mock
const mockCacheManagerClear = cacheManager.clear as jest.Mock
const mockCacheManagerGetStats = cacheManager.getStats as jest.Mock

describe('OfflineService', () => {
  let consoleErrorSpy: jest.SpyInstance | undefined

  beforeEach(() => {
    jest.clearAllMocks()
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    // Clear internal sync queue (singleton state cleanup)
    ;(offlineService as any).syncQueue = []

    // Reset cacheManager mocks to default behavior
    mockCacheManagerSet.mockResolvedValue(undefined)
    mockCacheManagerGet.mockResolvedValue(null)
    mockCacheManagerRemove.mockResolvedValue(undefined)
    mockCacheManagerClear.mockResolvedValue(undefined)
    mockCacheManagerGetStats.mockResolvedValue({
      totalSize: 0,
      totalSizeFormatted: '0 B',
      maxSize: 50 * 1024 * 1024,
      maxSizeFormatted: '50 MB',
      usagePercent: 0,
      entryCount: 0,
      oldestEntry: null,
      newestEntry: null,
    })

	    // Reset apiService mocks
	    mockCreateReservation.mockResolvedValue({ id: 1, success: true } as any)
	    mockCancelReservation.mockResolvedValue({ success: true } as any)
	  })

	  afterEach(() => {
	    consoleErrorSpy?.mockRestore()
	  })

	  describe('Connectivity Management', () => {
    it('should check connectivity status', async () => {
      ;(NetInfo.fetch as jest.Mock).mockResolvedValue({
        isConnected: true,
        isInternetReachable: true,
      })

      const status = await offlineService.checkConnectivity()

      expect(status).toBe(true)
      expect(NetInfo.fetch).toHaveBeenCalled()
    })

    it('should return false when offline', async () => {
      ;(NetInfo.fetch as jest.Mock).mockResolvedValue({
        isConnected: false,
        isInternetReachable: false,
      })

      const status = await offlineService.checkConnectivity()

      expect(status).toBe(false)
    })

    it('should get current connectivity status', () => {
      const status = offlineService.getConnectivityStatus()

      expect(typeof status).toBe('boolean')
    })
  })

  describe('Cache Management with CacheManager', () => {
    describe('setCache', () => {
      it('should set cache using cacheManager', async () => {
        const testData = { id: 1, name: 'Test Product' }
        mockCacheManagerSet.mockResolvedValue(undefined)
        ;(AsyncStorage.getItem as jest.Mock).mockResolvedValue(null)
        ;(AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined)

        await offlineService.setCache('products', testData)

        // Should use cacheManager.set
        expect(mockCacheManagerSet).toHaveBeenCalled()
        const cacheManagerCall = mockCacheManagerSet.mock.calls[0]
        expect(cacheManagerCall[0]).toBe('cache_products')

        // Should save cache entry with timestamp and version
        const cacheEntryString = cacheManagerCall[1]
        const cacheEntry = JSON.parse(cacheEntryString)
        expect(cacheEntry.data).toEqual(testData)
        expect(cacheEntry.timestamp).toBeDefined()
        expect(cacheEntry.version).toBe(1)
      })

      it('should use custom TTL when provided', async () => {
        const testData = { test: 'data' }
        mockCacheManagerSet.mockResolvedValue(undefined)
        ;(AsyncStorage.getItem as jest.Mock).mockResolvedValue(null)
        ;(AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined)

        await offlineService.setCache('products', testData, 60) // 60 minutes

        expect(mockCacheManagerSet).toHaveBeenCalled()
        expect(AsyncStorage.setItem).toHaveBeenCalledWith(
          'cache_index',
          expect.any(String)
        )
      })

      it('should handle cache set errors gracefully', async () => {
        mockCacheManagerSet.mockRejectedValue(new Error('Storage full'))

        // Should not throw
        await expect(offlineService.setCache('products', { test: 'data' })).resolves.toBeUndefined()
      })
    })

    describe('getCache', () => {
      it('should get cache using cacheManager', async () => {
        const mockData = { id: 1, name: 'Cached Product' }
        const cacheEntry = {
          data: mockData,
          timestamp: Date.now(),
          version: 1,
        }

        mockCacheManagerGet.mockResolvedValue(JSON.stringify(cacheEntry))

        const result = await offlineService.getCache('products')

        expect(result).toEqual(mockData)
        expect(mockCacheManagerGet).toHaveBeenCalledWith('cache_products')
      })

      it('should return null when cache does not exist', async () => {
        mockCacheManagerGet.mockResolvedValue(null)

        const result = await offlineService.getCache('products')

        expect(result).toBeNull()
      })

      it('should return null when cache is expired', async () => {
        const expiredTimestamp = Date.now() - (31 * 60 * 1000) // 31 minutes ago (TTL is 30 min)
        const cacheEntry = {
          data: { test: 'data' },
          timestamp: expiredTimestamp,
          version: 1,
        }

        mockCacheManagerGet.mockResolvedValue(JSON.stringify(cacheEntry))
        mockCacheManagerRemove.mockResolvedValue(undefined)
        ;(AsyncStorage.getItem as jest.Mock).mockResolvedValue(null)
        ;(AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined)

        const result = await offlineService.getCache('products')

        expect(result).toBeNull()
        expect(mockCacheManagerRemove).toHaveBeenCalledWith('cache_products')
      })

      it('should return null when cache version mismatch', async () => {
        const cacheEntry = {
          data: { test: 'data' },
          timestamp: Date.now(),
          version: 0, // Old version
        }

        mockCacheManagerGet.mockResolvedValue(JSON.stringify(cacheEntry))
        mockCacheManagerRemove.mockResolvedValue(undefined)
        ;(AsyncStorage.getItem as jest.Mock).mockResolvedValue(null)
        ;(AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined)

        const result = await offlineService.getCache('products')

        expect(result).toBeNull()
        expect(mockCacheManagerRemove).toHaveBeenCalled()
      })

      it('should handle get cache errors gracefully', async () => {
        mockCacheManagerGet.mockRejectedValue(new Error('Read error'))

        const result = await offlineService.getCache('products')

        expect(result).toBeNull()
      })
    })

    describe('removeCache', () => {
      it('should remove cache using cacheManager', async () => {
        mockCacheManagerRemove.mockResolvedValue(undefined)
        ;(AsyncStorage.getItem as jest.Mock).mockResolvedValue(null)
        ;(AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined)

        await offlineService.removeCache('products')

        expect(mockCacheManagerRemove).toHaveBeenCalledWith('cache_products')
      })
    })

    describe('clearAllCache', () => {
      it('should clear all cache using cacheManager', async () => {
        mockCacheManagerClear.mockResolvedValue(undefined)
        ;(AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined)

        await offlineService.clearAllCache()

        expect(mockCacheManagerClear).toHaveBeenCalled()
        expect(AsyncStorage.removeItem).toHaveBeenCalledWith('cache_index')
      })
    })

    describe('cleanExpiredCache', () => {
      it('should remove expired cache entries', async () => {
        const now = Date.now()
        const cacheIndex = {
          cache_products: now + 10000, // Not expired
          cache_categories: now - 10000, // Expired
          cache_user: now + 50000, // Not expired
        }

        ;(AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(cacheIndex))
        ;(AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined)
        ;(AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined)

        await offlineService.cleanExpiredCache()

        // Should remove expired entry
        expect(AsyncStorage.removeItem).toHaveBeenCalledWith('cache_categories')

        // Should update index
        expect(AsyncStorage.setItem).toHaveBeenCalledWith(
          'cache_index',
          expect.stringContaining('cache_products')
        )
        expect(AsyncStorage.setItem).toHaveBeenCalledWith(
          'cache_index',
          expect.not.stringContaining('cache_categories')
        )
      })

      it('should handle empty cache index', async () => {
        ;(AsyncStorage.getItem as jest.Mock).mockResolvedValue(null)

        // Should not throw
        await expect(offlineService.cleanExpiredCache()).resolves.toBeUndefined()
      })
    })
  })

  describe('Sync Queue Management', () => {
    describe('queueSyncAction', () => {
      it('should add action to sync queue', async () => {
        ;(NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: false })
        ;(AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined)

        const queueItem = await offlineService.queueSyncAction(
          'create',
          '/reservations',
          { product_id: 1, quantity: 2 }
        )

        expect(queueItem).toBeDefined()
        expect(queueItem.type).toBe('create')
        expect(queueItem.endpoint).toBe('/reservations')
        expect(queueItem.data).toEqual({ product_id: 1, quantity: 2 })
        expect(queueItem.id).toContain('sync_')
        expect(queueItem.retries).toBe(0)
        expect(AsyncStorage.setItem).toHaveBeenCalledWith('sync_queue', expect.any(String))
      })

      it('should not process queue immediately when offline', async () => {
        ;(NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: false })
        ;(AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined)

        const processSyncQueueSpy = jest.spyOn(offlineService as any, 'processSyncQueue')

        await offlineService.queueSyncAction('create', '/test', {})

        expect(processSyncQueueSpy).not.toHaveBeenCalled()
      })
    })

    describe('processSyncQueue - Promise Lock', () => {
      it('should use Promise lock to prevent concurrent processing', async () => {
        // Queue an action to populate internal syncQueue
        ;(NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: false })
        ;(AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined)

        await offlineService.queueSyncAction('create', '/reservations', {
          action: 'createReservation',
          payload: { product_id: 1, quantity: 2 },
        })

        // Verify item was queued
        expect(offlineService.getSyncQueueLength()).toBe(1)

        // Mock API response
        mockCreateReservation.mockResolvedValue({ success: true })

        // Start first process (should acquire lock)
        const promise1 = offlineService.processSyncQueue()

        // Start second process (should return immediately, lock held)
        const promise2 = offlineService.processSyncQueue()

        // Both should complete without conflict
        await Promise.all([promise1, promise2])

        // API should be called only once (lock prevents double processing)
        expect(mockCreateReservation).toHaveBeenCalledTimes(1)

        // Queue should be empty after successful processing
        expect(offlineService.getSyncQueueLength()).toBe(0)
      })

      it('should release lock after processing completes', async () => {
        ;(AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify([]))
        ;(AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined)

        await offlineService.processSyncQueue()

        // Lock should be released (null)
        expect((offlineService as any).syncLock).toBeNull()
      })

      it('should release lock even if processing fails', async () => {
        ;(AsyncStorage.getItem as jest.Mock).mockRejectedValue(new Error('Storage error'))

        try {
          await offlineService.processSyncQueue()
        } catch (error) {
          // Expected
        }

        // Lock should still be released
        expect((offlineService as any).syncLock).toBeNull()
      })
    })

    describe('processSyncItem', () => {
      it('should process createReservation action', async () => {
        const item: SyncQueue = {
          id: 'sync_1',
          type: 'create',
          endpoint: '/reservations',
          data: {
            action: 'createReservation',
            payload: { product_id: 1, quantity: 2 },
          },
          timestamp: Date.now(),
          retries: 0,
        }

        mockCreateReservation.mockResolvedValue({ success: true })

        await (offlineService as any).processSyncItem(item)

        expect(mockCreateReservation).toHaveBeenCalledWith(item.data.payload)
      })

      it('should process cancelReservation action', async () => {
        const item: SyncQueue = {
          id: 'sync_2',
          type: 'delete',
          endpoint: '/reservations/1/cancel',
          data: {
            action: 'cancelReservation',
            reservationId: 1,
          },
          timestamp: Date.now(),
          retries: 0,
        }

        mockCancelReservation.mockResolvedValue({ success: true })

        await (offlineService as any).processSyncItem(item)

        expect(mockCancelReservation).toHaveBeenCalledWith(1)
      })
    })

    describe('getSyncQueueLength', () => {
      it('should return current queue length', () => {
        const length = offlineService.getSyncQueueLength()

        expect(typeof length).toBe('number')
        expect(length).toBeGreaterThanOrEqual(0)
      })
    })
  })

  describe('getCacheStats', () => {
    it('should return cache statistics', async () => {
      const mockKeys = ['cache_products', 'cache_categories', 'cache_user', 'other_key']
      const mockCacheData = {
        timestamp: Date.now() - 10000,
        version: 1,
        data: { test: 'data' },
      }

      ;(AsyncStorage.getAllKeys as jest.Mock).mockResolvedValue(mockKeys)
      ;(AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockCacheData))

      const stats = await offlineService.getCacheStats()

      expect(stats.itemCount).toBeGreaterThan(0)
      expect(stats.totalSize).toBeGreaterThan(0)
      expect(stats.oldestItem).toBeLessThan(Date.now())
    })

    it('should handle empty cache', async () => {
      ;(AsyncStorage.getAllKeys as jest.Mock).mockResolvedValue([])

      const stats = await offlineService.getCacheStats()

      expect(stats.itemCount).toBe(0)
      expect(stats.totalSize).toBe(0)
    })

    it('should handle errors gracefully', async () => {
      ;(AsyncStorage.getAllKeys as jest.Mock).mockRejectedValue(new Error('Storage error'))

      const stats = await offlineService.getCacheStats()

      expect(stats.itemCount).toBe(0)
      expect(stats.totalSize).toBe(0)
    })
  })

  describe('Event System', () => {
    it('should register and call event listeners', () => {
      const callback = jest.fn()

      offlineService.on('test-event', callback)
      ;(offlineService as any).emit('test-event', { data: 'test' })

      expect(callback).toHaveBeenCalledWith({ data: 'test' })
    })

    it('should support multiple listeners for same event', () => {
      const callback1 = jest.fn()
      const callback2 = jest.fn()

      offlineService.on('test-event', callback1)
      offlineService.on('test-event', callback2)
      ;(offlineService as any).emit('test-event', 'data')

      expect(callback1).toHaveBeenCalledWith('data')
      expect(callback2).toHaveBeenCalledWith('data')
    })

    it('should remove specific listener', () => {
      const callback1 = jest.fn()
      const callback2 = jest.fn()

      offlineService.on('test-event', callback1)
      offlineService.on('test-event', callback2)
      offlineService.off('test-event', callback1)
      ;(offlineService as any).emit('test-event', 'data')

      expect(callback1).not.toHaveBeenCalled()
      expect(callback2).toHaveBeenCalledWith('data')
    })

    it('should handle off for non-existent event', () => {
      const callback = jest.fn()

      // Should not throw
      offlineService.off('non-existent', callback)
    })
  })

  describe('Integration Tests', () => {
    it('should cache data and retrieve it before expiration', async () => {
      const testData = { id: 1, name: 'Test Product', price: 5000 }
      const cacheEntry = {
        data: testData,
        timestamp: Date.now(),
        version: 1,
      }

      mockCacheManagerSet.mockResolvedValue(undefined)
      mockCacheManagerGet.mockResolvedValue(JSON.stringify(cacheEntry))
      ;(AsyncStorage.getItem as jest.Mock).mockResolvedValue(null)
      ;(AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined)

      // Set cache
      await offlineService.setCache('products', testData)

      // Get cache (should be valid)
      const retrieved = await offlineService.getCache('products')

      expect(retrieved).toEqual(testData)
      expect(mockCacheManagerSet).toHaveBeenCalled()
      expect(mockCacheManagerGet).toHaveBeenCalled()
    })

    it('should queue action when offline and process when online', async () => {
      // Start offline
      ;(NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: false })
      ;(AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined)
      ;(AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify([]))

      // Queue action
      await offlineService.queueSyncAction('create', '/reservations', {
        action: 'createReservation',
        payload: { product_id: 1 },
      })

      // Verify queued
      expect(offlineService.getSyncQueueLength()).toBeGreaterThan(0)

      // Go online
      ;(NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: true })
      mockCreateReservation.mockResolvedValue({ success: true })

      // Process queue
      await offlineService.processSyncQueue()

      // Verify processed
      expect(mockCreateReservation).toHaveBeenCalled()
    })
  })
})
