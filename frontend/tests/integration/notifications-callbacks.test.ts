import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useNotifications } from '@/composables/useNotifications'

describe('Notifications Callbacks - Integration Tests', () => {
  let notifications: ReturnType<typeof useNotifications>

  beforeEach(() => {
    setActivePinia(createPinia())
    notifications = useNotifications()
    // Clear any existing notifications
    notifications.clearAll()
  })

  afterEach(() => {
    // Cleanup any remaining notifications to prevent memory leaks
    notifications.clearAll()
  })

  describe('Callback Execution', () => {
    it('should execute onAction callback when action is triggered', async () => {
      const mockCallback = vi.fn()

      const id = notifications.error('Test error', 'Test Title', {
        action: {
          label: 'Retry',
          callback: mockCallback
        }
      })

      // Trigger the action
      notifications.handleAction(id)

      expect(mockCallback).toHaveBeenCalledOnce()
    })

    it('should execute onClose callback when notification is removed', async () => {
      const mockOnClose = vi.fn()

      const id = notifications.info('Test info', 'Test Title', {
        onClose: mockOnClose
      })

      // Remove the notification
      notifications.removeNotification(id)

      expect(mockOnClose).toHaveBeenCalledOnce()
    })

    it('should auto-remove notification after duration and call onClose', async () => {
      const mockOnClose = vi.fn()

      notifications.success('Auto-close test', 'Test', {
        duration: 50, // Very short duration for test
        onClose: mockOnClose
      })

      // Wait for auto-close
      await new Promise(resolve => setTimeout(resolve, 100))

      expect(mockOnClose).toHaveBeenCalledOnce()
      expect(notifications.notifications.value).toHaveLength(0)
    })
  })

  describe('Double Close Prevention', () => {
    it('should not execute onClose callback multiple times', async () => {
      const mockOnClose = vi.fn()

      const id = notifications.warning('Double close test', 'Test', {
        autoClose: false,
        onClose: mockOnClose
      })

      // Remove multiple times
      notifications.removeNotification(id)
      notifications.removeNotification(id)
      notifications.removeNotification(id)

      expect(mockOnClose).toHaveBeenCalledOnce()
    })
  })

  describe('Action + Close Interaction', () => {
    it('should call onClose after action is executed', async () => {
      const mockAction = vi.fn()
      const mockOnClose = vi.fn()

      const id = notifications.error('Action + Close test', 'Test', {
        action: {
          label: 'Action',
          callback: mockAction
        },
        onClose: mockOnClose
      })

      // Trigger action (which should also close the notification)
      notifications.handleAction(id)

      expect(mockAction).toHaveBeenCalledOnce()
      expect(mockOnClose).toHaveBeenCalledOnce()
      expect(notifications.notifications.value).toHaveLength(0)
    })
  })

  describe('Async Callback Handling', () => {
    it('should handle async callbacks without blocking', async () => {
      const asyncCallback = vi.fn().mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 50))
        return 'async-result'
      })

      const id = notifications.error('Async test', 'Test', {
        action: {
          label: 'Async Action',
          callback: asyncCallback
        }
      })

      // Trigger async action
      const actionPromise = notifications.handleAction(id)

      // Should not block
      expect(asyncCallback).toHaveBeenCalledOnce()

      // Wait for completion
      await actionPromise
    })

    it('should handle callback exceptions gracefully', async () => {
      const faultyCallback = vi.fn().mockImplementation(() => {
        throw new Error('Callback error')
      })

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const id = notifications.error('Faulty callback test', 'Test', {
        action: {
          label: 'Faulty Action',
          callback: faultyCallback
        }
      })

      // Should not throw
      expect(() => notifications.handleAction(id)).not.toThrow()

      expect(faultyCallback).toHaveBeenCalledOnce()
      consoleSpy.mockRestore()
    })
  })

  describe('Memory Leak Prevention', () => {
    it('should clear timers when notifications are manually removed', () => {
      const clearIntervalSpy = vi.spyOn(global, 'clearInterval')

      const id = notifications.info('Timer test', 'Test', {
        duration: 5000
      })

      // Manually remove before auto-close
      notifications.removeNotification(id)

      expect(clearIntervalSpy).toHaveBeenCalled()
      clearIntervalSpy.mockRestore()
    })

    it('should clear all timers when clearAll is called', () => {
      const clearIntervalSpy = vi.spyOn(global, 'clearInterval')

      // Create multiple notifications with timers
      notifications.info('Timer 1', 'Test', { duration: 5000 })
      notifications.success('Timer 2', 'Test', { duration: 3000 })
      notifications.warning('Timer 3', 'Test', { duration: 4000 })

      notifications.clearAll()

      expect(clearIntervalSpy).toHaveBeenCalledTimes(3)
      expect(notifications.notifications.value).toHaveLength(0)
      clearIntervalSpy.mockRestore()
    })
  })

  describe('Notification Types Behavior', () => {
    it('should respect error notifications not auto-closing by default', () => {
      const id = notifications.error('Persistent error', 'Error')

      // Get the actual notification
      const notification = notifications.notifications.value.find(n => n.id === id)

      expect(notification?.autoClose).toBe(false)
      expect(notification?.timer).toBeUndefined()
    })

    it('should auto-close success notifications by default', () => {
      const id = notifications.success('Auto success', 'Success')

      const notification = notifications.notifications.value.find(n => n.id === id)

      expect(notification?.autoClose).toBe(true)
      expect(notification?.timer).toBeDefined()
    })

    it('should allow overriding default behavior', () => {
      // Force error to auto-close
      const errorId = notifications.error('Auto error', 'Error', {
        autoClose: true,
        duration: 100
      })

      // Force success to not auto-close
      const successId = notifications.success('Manual success', 'Success', {
        autoClose: false
      })

      const errorNotif = notifications.notifications.value.find(n => n.id === errorId)
      const successNotif = notifications.notifications.value.find(n => n.id === successId)

      expect(errorNotif?.autoClose).toBe(true)
      expect(errorNotif?.timer).toBeDefined()

      expect(successNotif?.autoClose).toBe(false)
      expect(successNotif?.timer).toBeUndefined()
    })
  })

  describe('Progress Animation', () => {
    it('should update progress during auto-close countdown', async () => {
      const id = notifications.info('Progress test', 'Test', {
        duration: 100
      })

      const notification = notifications.notifications.value.find(n => n.id === id)
      const initialProgress = notification?.progress

      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 30))

      const midProgress = notifications.notifications.value.find(n => n.id === id)?.progress

      expect(initialProgress).toBe(100)
      expect(midProgress).toBeLessThan(100)
      expect(midProgress).toBeGreaterThan(0)
    })
  })
})