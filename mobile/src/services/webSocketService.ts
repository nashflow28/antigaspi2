/**
 * WebSocket Service for Real-Time Messaging
 *
 * Provides real-time communication capabilities using Socket.IO
 * Features:
 * - Auto-reconnect with exponential backoff
 * - Event-based message handling
 * - Typing indicators
 * - Online status tracking
 * - Integration with secure token storage
 */

import { io, Socket } from 'socket.io-client'
import { secureStorage } from './secureStorage'
import { captureException, addBreadcrumb } from '../utils/sentryInit'
import { getExpoExtraValue } from '../utils/expoConfig'

// Get WebSocket URL from config (uses same base as API)
const getWebSocketUrl = (): string => {
  const apiUrl = getExpoExtraValue<string>('apiUrl')?.trim()
  if (apiUrl) {
    // Convert https://api.example.com/api to wss://api.example.com
    return apiUrl.replace('/api', '').replace('https://', 'wss://').replace('http://', 'ws://')
  }
  // Default for development (Android emulator)
  return 'ws://10.0.2.2:8000'
}

// Event types
export interface MessageEvent {
  conversationId: number
  message: {
    id: number
    conversation_id: number
    sender_id: number
    content: string
    read_at: string | null
    created_at: string
    updated_at: string
    sender?: {
      id: number
      first_name: string
      last_name: string
      photo_url?: string
      role: 'consumer' | 'merchant' | 'admin'
    }
  }
}

export interface TypingEvent {
  conversationId: number
  userId: number
  isTyping: boolean
}

export interface OnlineStatusEvent {
  userId: number
  isOnline: boolean
  lastSeen?: string
}

export interface ConversationUpdatedEvent {
  conversationId: number
  lastMessageAt: string
  lastMessagePreview: string
}

export interface MessageReadEvent {
  conversationId: number
  messageIds: number[]
  readAt: string
}

type WebSocketEventMap = {
  'message-received': MessageEvent
  'typing': TypingEvent
  'online-status': OnlineStatusEvent
  'conversation-updated': ConversationUpdatedEvent
  'message-read': MessageReadEvent
  'connected': void
  'disconnected': void
  'error': Error
}

type WebSocketEventName = keyof WebSocketEventMap

type ListenerCallback<T> = (payload: T) => void

class WebSocketService {
  private socket: Socket | null = null
  private isConnected: boolean = false
  private reconnectAttempts: number = 0
  private maxReconnectAttempts: number = 10
  private reconnectDelay: number = 1000 // Start with 1 second
  private maxReconnectDelay: number = 30000 // Max 30 seconds
  private reconnectTimeout: NodeJS.Timeout | null = null
  private listeners: Map<WebSocketEventName, Set<ListenerCallback<any>>> = new Map()
  private currentUserId: number | null = null
  private activeConversations: Set<number> = new Set()

  /**
   * Connect to the WebSocket server
   * @param userId - Current user ID for authentication
   */
  async connect(userId: number): Promise<void> {
    if (this.socket?.connected && this.currentUserId === userId) {
      return // Already connected as same user
    }

    // Clear any pending reconnect timeout
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }

    // Disconnect existing connection if different user
    if (this.socket) {
      this.disconnect()
    }

    this.currentUserId = userId

    try {
      const token = await secureStorage.getToken()
      if (!token) {
        throw new Error('No auth token available')
      }

      const wsUrl = getWebSocketUrl()

      addBreadcrumb({
        category: 'websocket',
        message: 'Attempting WebSocket connection',
        level: 'info',
        data: { url: wsUrl, userId },
      })

      this.socket = io(wsUrl, {
        auth: {
          token: token,
        },
        transports: ['websocket'],
        reconnection: false, // We handle reconnection manually
        timeout: 10000,
        forceNew: true,
      })

      this.setupSocketListeners()
    } catch (error) {
      captureException(error, { context: 'websocket_connect', userId })
      throw error
    }
  }

  /**
   * Setup socket event listeners
   */
  private setupSocketListeners(): void {
    if (!this.socket) return

    // Remove any existing listeners to prevent duplicates on reconnection
    this.socket.removeAllListeners()

    this.socket.on('connect', () => {
      this.isConnected = true
      this.reconnectAttempts = 0
      this.reconnectDelay = 1000

      addBreadcrumb({
        category: 'websocket',
        message: 'WebSocket connected',
        level: 'info',
      })

      // Re-join active conversations
      this.activeConversations.forEach(conversationId => {
        this.joinConversation(conversationId)
      })

      this.emit('connected', undefined as any)
    })

    this.socket.on('disconnect', (reason) => {
      this.isConnected = false

      addBreadcrumb({
        category: 'websocket',
        message: `WebSocket disconnected: ${reason}`,
        level: 'warning',
      })

      this.emit('disconnected', undefined as any)

      // Attempt to reconnect unless intentionally disconnected
      if (reason !== 'io client disconnect') {
        this.scheduleReconnect()
      }
    })

    this.socket.on('connect_error', (error) => {
      captureException(error, { context: 'websocket_connect_error' })
      this.emit('error', error)
      this.scheduleReconnect()
    })

    // Message events
    this.socket.on('message:new', (data: MessageEvent) => {
      this.emit('message-received', data)
    })

    this.socket.on('message:read', (data: MessageReadEvent) => {
      this.emit('message-read', data)
    })

    this.socket.on('typing:start', (data: TypingEvent) => {
      this.emit('typing', { ...data, isTyping: true })
    })

    this.socket.on('typing:stop', (data: TypingEvent) => {
      this.emit('typing', { ...data, isTyping: false })
    })

    this.socket.on('user:online', (data: OnlineStatusEvent) => {
      this.emit('online-status', { ...data, isOnline: true })
    })

    this.socket.on('user:offline', (data: OnlineStatusEvent) => {
      this.emit('online-status', { ...data, isOnline: false })
    })

    this.socket.on('conversation:updated', (data: ConversationUpdatedEvent) => {
      this.emit('conversation-updated', data)
    })
  }

  /**
   * Schedule a reconnection attempt with exponential backoff
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      captureException(new Error('WebSocket max reconnect attempts reached'), {
        context: 'websocket_reconnect',
        attempts: this.reconnectAttempts,
      })
      return
    }

    this.reconnectAttempts++

    // Exponential backoff with jitter
    const jitter = Math.random() * 1000
    const delay = Math.min(
      this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1) + jitter,
      this.maxReconnectDelay
    )

    addBreadcrumb({
      category: 'websocket',
      message: `Scheduling reconnect attempt ${this.reconnectAttempts}`,
      level: 'info',
      data: { delay },
    })

    this.reconnectTimeout = setTimeout(async () => {
      if (this.currentUserId) {
        try {
          await this.connect(this.currentUserId)
        } catch (error) {
          // Will retry via scheduleReconnect
        }
      }
    }, delay)
  }

  /**
   * Disconnect from the WebSocket server
   */
  disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }

    if (this.socket) {
      // Remove all socket.io listeners before disconnecting
      this.socket.removeAllListeners()
      this.socket.disconnect()
      this.socket = null
    }

    // Reset ALL state to prevent data leakage between users
    this.isConnected = false
    this.currentUserId = null
    this.activeConversations.clear()
    this.listeners.clear() // Clear custom event listeners
    this.reconnectAttempts = 0
    this.reconnectDelay = 1000

    addBreadcrumb({
      category: 'websocket',
      message: 'WebSocket intentionally disconnected',
      level: 'info',
    })
  }

  /**
   * Check if connected
   */
  getConnectionStatus(): boolean {
    return this.isConnected
  }

  /**
   * Join a conversation room to receive real-time updates
   */
  joinConversation(conversationId: number): void {
    this.activeConversations.add(conversationId)

    if (this.socket?.connected) {
      this.socket.emit('conversation:join', { conversationId })
    }
  }

  /**
   * Leave a conversation room
   */
  leaveConversation(conversationId: number): void {
    this.activeConversations.delete(conversationId)

    if (this.socket?.connected) {
      this.socket.emit('conversation:leave', { conversationId })
    }
  }

  /**
   * Send a message
   */
  sendMessage(conversationId: number, content: string): void {
    if (!this.socket?.connected) {
      throw new Error('WebSocket not connected')
    }

    this.socket.emit('message:send', {
      conversationId,
      content,
    })
  }

  /**
   * Mark messages as read
   */
  markAsRead(conversationId: number, messageIds: number[]): void {
    if (!this.socket?.connected) return

    this.socket.emit('message:read', {
      conversationId,
      messageIds,
    })
  }

  /**
   * Send typing indicator
   */
  sendTypingIndicator(conversationId: number, isTyping: boolean): void {
    if (!this.socket?.connected) return

    this.socket.emit(isTyping ? 'typing:start' : 'typing:stop', {
      conversationId,
    })
  }

  /**
   * Subscribe to events
   */
  on<K extends WebSocketEventName>(
    event: K,
    callback: ListenerCallback<WebSocketEventMap[K]>
  ): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)?.add(callback as ListenerCallback<any>)
  }

  /**
   * Unsubscribe from events
   */
  off<K extends WebSocketEventName>(
    event: K,
    callback: ListenerCallback<WebSocketEventMap[K]>
  ): void {
    const callbacks = this.listeners.get(event)
    if (callbacks) {
      callbacks.delete(callback as ListenerCallback<any>)
    }
  }

  /**
   * Emit event to listeners
   */
  private emit<K extends WebSocketEventName>(
    event: K,
    data: WebSocketEventMap[K]
  ): void {
    const callbacks = this.listeners.get(event)
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          captureException(error, { context: 'websocket_event_handler', event })
        }
      })
    }
  }
}

// Export singleton instance
export const webSocketService = new WebSocketService()
export default webSocketService
