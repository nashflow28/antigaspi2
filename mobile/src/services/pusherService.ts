/**
 * Service Pusher pour les notifications temps réel
 * Utilise Pusher pour les événements broadcast depuis Laravel
 */

import Pusher from 'pusher-js/react-native'
import { secureStorage } from './secureStorage'
import { API_BASE_URL } from './api'

// Types d'événements
export interface NotificationEvent {
  id: number
  type: string
  title: string
  message: string
  data: Record<string, any>
  created_at: string
}

export interface ReservationStatusEvent {
  reservation_id: number
  reservation_code: string
  old_status: string
  new_status: string
  product_name: string
  updated_at: string
}

type EventCallback<T> = (data: T) => void

class PusherService {
  private pusher: Pusher | null = null
  private userChannel: any = null
  private userId: number | null = null
  private isConnected: boolean = false

  // Event listeners
  private notificationListeners: EventCallback<NotificationEvent>[] = []
  private reservationListeners: EventCallback<ReservationStatusEvent>[] = []
  private connectionListeners: EventCallback<boolean>[] = []

  /**
   * Initialize Pusher with configuration
   * Call this early in the app lifecycle
   */
  async init(): Promise<void> {
    // Get Pusher config from environment or API
    const pusherKey = process.env.EXPO_PUBLIC_PUSHER_KEY || ''
    const pusherCluster = process.env.EXPO_PUBLIC_PUSHER_CLUSTER || 'eu'

    if (!pusherKey) {
      console.log('[Pusher] No Pusher key configured, skipping initialization')
      return
    }

    try {
      this.pusher = new Pusher(pusherKey, {
        cluster: pusherCluster,
        forceTLS: true,
        authEndpoint: `${API_BASE_URL}/broadcasting/auth`,
        auth: {
          headers: {
            Authorization: `Bearer ${await secureStorage.getToken()}`,
          },
        },
      })

      this.pusher.connection.bind('connected', () => {
        console.log('[Pusher] Connected')
        this.isConnected = true
        this.notifyConnectionListeners(true)
      })

      this.pusher.connection.bind('disconnected', () => {
        console.log('[Pusher] Disconnected')
        this.isConnected = false
        this.notifyConnectionListeners(false)
      })

      this.pusher.connection.bind('error', (error: any) => {
        console.error('[Pusher] Connection error:', error)
        this.isConnected = false
        this.notifyConnectionListeners(false)
      })
    } catch (error) {
      console.error('[Pusher] Failed to initialize:', error)
    }
  }

  /**
   * Subscribe to user-specific private channel
   */
  async subscribeToUserChannel(userId: number): Promise<void> {
    if (!this.pusher) {
      console.warn('[Pusher] Not initialized, cannot subscribe')
      return
    }

    // Unsubscribe from previous channel if any
    if (this.userChannel && this.userId !== userId) {
      this.unsubscribeFromUserChannel()
    }

    this.userId = userId
    const channelName = `private-user.${userId}`

    try {
      this.userChannel = this.pusher.subscribe(channelName)

      this.userChannel.bind('pusher:subscription_succeeded', () => {
        console.log(`[Pusher] Subscribed to ${channelName}`)
      })

      this.userChannel.bind('pusher:subscription_error', (error: any) => {
        console.error(`[Pusher] Failed to subscribe to ${channelName}:`, error)
      })

      // Bind to notification events
      this.userChannel.bind('notification.new', (data: NotificationEvent) => {
        console.log('[Pusher] New notification:', data)
        this.notifyNotificationListeners(data)
      })

      // Bind to reservation status events
      this.userChannel.bind(
        'reservation.status_changed',
        (data: ReservationStatusEvent) => {
          console.log('[Pusher] Reservation status changed:', data)
          this.notifyReservationListeners(data)
        }
      )
    } catch (error) {
      console.error('[Pusher] Error subscribing to channel:', error)
    }
  }

  /**
   * Unsubscribe from user channel
   */
  unsubscribeFromUserChannel(): void {
    if (this.userChannel && this.userId) {
      const channelName = `private-user.${this.userId}`
      this.pusher?.unsubscribe(channelName)
      this.userChannel = null
      this.userId = null
      console.log(`[Pusher] Unsubscribed from ${channelName}`)
    }
  }

  /**
   * Disconnect from Pusher
   */
  disconnect(): void {
    if (this.pusher) {
      this.unsubscribeFromUserChannel()
      this.pusher.disconnect()
      this.pusher = null
      this.isConnected = false
      console.log('[Pusher] Disconnected')
    }
  }

  /**
   * Check if connected
   */
  getConnectionStatus(): boolean {
    return this.isConnected
  }

  /**
   * Add notification listener
   */
  onNotification(callback: EventCallback<NotificationEvent>): () => void {
    this.notificationListeners.push(callback)
    return () => {
      this.notificationListeners = this.notificationListeners.filter(
        (cb) => cb !== callback
      )
    }
  }

  /**
   * Add reservation status listener
   */
  onReservationStatusChange(
    callback: EventCallback<ReservationStatusEvent>
  ): () => void {
    this.reservationListeners.push(callback)
    return () => {
      this.reservationListeners = this.reservationListeners.filter(
        (cb) => cb !== callback
      )
    }
  }

  /**
   * Add connection status listener
   */
  onConnectionChange(callback: EventCallback<boolean>): () => void {
    this.connectionListeners.push(callback)
    return () => {
      this.connectionListeners = this.connectionListeners.filter(
        (cb) => cb !== callback
      )
    }
  }

  // Private methods for notifying listeners
  private notifyNotificationListeners(data: NotificationEvent): void {
    this.notificationListeners.forEach((cb) => cb(data))
  }

  private notifyReservationListeners(data: ReservationStatusEvent): void {
    this.reservationListeners.forEach((cb) => cb(data))
  }

  private notifyConnectionListeners(connected: boolean): void {
    this.connectionListeners.forEach((cb) => cb(connected))
  }
}

export const pusherService = new PusherService()
export default pusherService
