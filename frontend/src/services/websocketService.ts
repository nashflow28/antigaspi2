/**
 * WebSocket Service
 * Handles real-time communication for messaging, notifications, and live updates
 */

import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

export type WebSocketStatus = 'disconnected' | 'connecting' | 'connected' | 'error' | 'reconnecting'

export interface WebSocketMessage {
  type: string
  channel?: string
  data?: any
  timestamp?: string
}

export interface ChannelSubscription {
  channel: string
  callback: (data: any) => void
}

class WebSocketService {
  private socket: WebSocket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null
  private subscriptions: Map<string, Set<(data: any) => void>> = new Map()

  public status = ref<WebSocketStatus>('disconnected')
  public isConnected = computed(() => this.status.value === 'connected')
  public lastError = ref<string | null>(null)

  private wsUrl: string

  constructor() {
    // Determine WebSocket URL based on environment
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'
    const wsProtocol = apiUrl.startsWith('https') ? 'wss' : 'ws'
    const wsHost = apiUrl.replace(/^https?:\/\//, '').replace(/\/api$/, '')
    this.wsUrl = `${wsProtocol}://${wsHost}/ws`
  }

  /**
   * Connect to WebSocket server
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket?.readyState === WebSocket.OPEN) {
        resolve()
        return
      }

      const authStore = useAuthStore()
      if (!authStore.token) {
        this.lastError.value = 'Authentication required'
        reject(new Error('Authentication required'))
        return
      }

      this.status.value = 'connecting'
      this.lastError.value = null

      try {
        // Include token in connection
        const url = `${this.wsUrl}?token=${encodeURIComponent(authStore.token)}`
        this.socket = new WebSocket(url)

        this.socket.onopen = () => {
          this.status.value = 'connected'
          this.reconnectAttempts = 0
          this.startHeartbeat()
          this.resubscribeAll()
          resolve()
        }

        this.socket.onmessage = (event) => {
          this.handleMessage(event.data)
        }

        this.socket.onerror = (error) => {
          console.error('WebSocket error:', error)
          this.status.value = 'error'
          this.lastError.value = 'Connection error'
        }

        this.socket.onclose = (event) => {
          this.stopHeartbeat()
          this.status.value = 'disconnected'

          if (!event.wasClean && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect()
          }
        }
      } catch (error) {
        this.status.value = 'error'
        this.lastError.value = 'Failed to create WebSocket connection'
        reject(error)
      }
    })
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    this.stopHeartbeat()

    if (this.socket) {
      this.socket.close(1000, 'Client disconnect')
      this.socket = null
    }

    this.status.value = 'disconnected'
    this.reconnectAttempts = 0
  }

  /**
   * Send a message through WebSocket
   */
  send(type: string, data?: any, channel?: string): boolean {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket not connected, cannot send message')
      return false
    }

    const message: WebSocketMessage = {
      type,
      channel,
      data,
      timestamp: new Date().toISOString()
    }

    try {
      this.socket.send(JSON.stringify(message))
      return true
    } catch (error) {
      console.error('Failed to send WebSocket message:', error)
      return false
    }
  }

  /**
   * Subscribe to a channel
   */
  subscribe(channel: string, callback: (data: any) => void): () => void {
    if (!this.subscriptions.has(channel)) {
      this.subscriptions.set(channel, new Set())
    }

    this.subscriptions.get(channel)!.add(callback)

    // Send subscription request to server
    if (this.isConnected.value) {
      this.send('subscribe', { channel })
    }

    // Return unsubscribe function
    return () => {
      this.unsubscribe(channel, callback)
    }
  }

  /**
   * Unsubscribe from a channel
   */
  unsubscribe(channel: string, callback: (data: any) => void): void {
    const callbacks = this.subscriptions.get(channel)
    if (callbacks) {
      callbacks.delete(callback)

      if (callbacks.size === 0) {
        this.subscriptions.delete(channel)
        // Notify server
        if (this.isConnected.value) {
          this.send('unsubscribe', { channel })
        }
      }
    }
  }

  /**
   * Subscribe to user-specific channel
   */
  subscribeToUser(userId: number, callback: (data: any) => void): () => void {
    return this.subscribe(`user.${userId}`, callback)
  }

  /**
   * Subscribe to conversation messages
   */
  subscribeToConversation(conversationId: number, callback: (data: any) => void): () => void {
    return this.subscribe(`conversation.${conversationId}`, callback)
  }

  /**
   * Subscribe to notifications
   */
  subscribeToNotifications(callback: (data: any) => void): () => void {
    const authStore = useAuthStore()
    if (!authStore.user?.id) {
      console.warn('User not authenticated, cannot subscribe to notifications')
      return () => {}
    }
    return this.subscribe(`notifications.${authStore.user.id}`, callback)
  }

  /**
   * Subscribe to order/reservation updates
   */
  subscribeToReservation(reservationId: number, callback: (data: any) => void): () => void {
    return this.subscribe(`reservation.${reservationId}`, callback)
  }

  /**
   * Subscribe to wallet updates
   */
  subscribeToWallet(callback: (data: any) => void): () => void {
    const authStore = useAuthStore()
    if (!authStore.user?.id) {
      console.warn('User not authenticated, cannot subscribe to wallet')
      return () => {}
    }
    return this.subscribe(`wallet.${authStore.user.id}`, callback)
  }

  /**
   * Handle incoming WebSocket message
   */
  private handleMessage(rawData: string): void {
    try {
      const message: WebSocketMessage = JSON.parse(rawData)

      // Handle system messages
      if (message.type === 'ping') {
        this.send('pong')
        return
      }

      if (message.type === 'error') {
        console.error('WebSocket server error:', message.data)
        return
      }

      // Route message to channel subscribers
      if (message.channel && message.type === 'message') {
        const callbacks = this.subscriptions.get(message.channel)
        if (callbacks) {
          callbacks.forEach(callback => {
            try {
              callback(message.data)
            } catch (error) {
              console.error('Error in WebSocket callback:', error)
            }
          })
        }
      }

      // Emit generic event
      this.emitEvent(message.type, message.data)
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error)
    }
  }

  /**
   * Emit event to all listeners
   */
  private eventListeners: Map<string, Set<(data: any) => void>> = new Map()

  on(event: string, callback: (data: any) => void): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set())
    }

    this.eventListeners.get(event)!.add(callback)

    return () => {
      this.off(event, callback)
    }
  }

  off(event: string, callback: (data: any) => void): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      listeners.delete(callback)
    }
  }

  private emitEvent(event: string, data: any): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error)
        }
      })
    }
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect(): void {
    this.status.value = 'reconnecting'
    this.reconnectAttempts++

    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)
    console.log(`WebSocket reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`)

    setTimeout(() => {
      if (this.status.value === 'reconnecting') {
        this.connect().catch(error => {
          console.error('Reconnection failed:', error)
        })
      }
    }, delay)
  }

  /**
   * Resubscribe to all channels after reconnection
   */
  private resubscribeAll(): void {
    for (const channel of this.subscriptions.keys()) {
      this.send('subscribe', { channel })
    }
  }

  /**
   * Start heartbeat to keep connection alive
   */
  private startHeartbeat(): void {
    this.stopHeartbeat()
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected.value) {
        this.send('ping')
      }
    }, 30000) // Every 30 seconds
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }

  /**
   * Get connection status
   */
  getStatus(): WebSocketStatus {
    return this.status.value
  }

  /**
   * Check if connected
   */
  isReady(): boolean {
    return this.isConnected.value
  }
}

// Export singleton instance
export const websocketService = new WebSocketService()

// Vue composable for using WebSocket in components
export function useWebSocket() {
  const connect = () => websocketService.connect()
  const disconnect = () => websocketService.disconnect()
  const send = (type: string, data?: any, channel?: string) => websocketService.send(type, data, channel)
  const subscribe = (channel: string, callback: (data: any) => void) => websocketService.subscribe(channel, callback)
  const on = (event: string, callback: (data: any) => void) => websocketService.on(event, callback)

  return {
    status: websocketService.status,
    isConnected: websocketService.isConnected,
    lastError: websocketService.lastError,
    connect,
    disconnect,
    send,
    subscribe,
    on,
    subscribeToConversation: websocketService.subscribeToConversation.bind(websocketService),
    subscribeToNotifications: websocketService.subscribeToNotifications.bind(websocketService),
    subscribeToReservation: websocketService.subscribeToReservation.bind(websocketService),
    subscribeToWallet: websocketService.subscribeToWallet.bind(websocketService)
  }
}
