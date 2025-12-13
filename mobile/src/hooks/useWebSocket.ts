/**
 * useWebSocket Hook
 *
 * Manages WebSocket connection lifecycle for real-time messaging
 * Features:
 * - Auto-connect when authenticated
 * - Auto-disconnect on logout
 * - Reconnect on app foreground
 * - Dispatch Redux actions for real-time updates
 */

import { useEffect, useCallback, useRef } from 'react'
import { AppState, AppStateStatus, Platform } from 'react-native'
import { useDispatch } from 'react-redux'
import { useAppSelector } from '../store/hooks'
import { webSocketService, MessageEvent, TypingEvent, OnlineStatusEvent, ConversationUpdatedEvent, MessageReadEvent } from '../services/webSocketService'
import {
  addMessage,
  setTypingStatus,
  setUserOnlineStatus,
  markMessagesReadLocally,
  updateConversation,
} from '../store/slices/messagingSlice'
import { addBreadcrumb } from '../utils/sentryInit'

interface UseWebSocketOptions {
  /** Whether to auto-connect when authenticated (default: true) */
  autoConnect?: boolean
  /** Enable debug logging (default: false) */
  debug?: boolean
}

interface UseWebSocketReturn {
  /** Whether the WebSocket is currently connected */
  isConnected: boolean
  /** Manually connect to WebSocket */
  connect: () => Promise<void>
  /** Manually disconnect from WebSocket */
  disconnect: () => void
  /** Join a conversation room to receive updates */
  joinConversation: (conversationId: number) => void
  /** Leave a conversation room */
  leaveConversation: (conversationId: number) => void
  /** Send a typing indicator */
  sendTypingIndicator: (conversationId: number, isTyping: boolean) => void
}

const useWebSocket = (options: UseWebSocketOptions = {}): UseWebSocketReturn => {
  const { autoConnect = true, debug = false } = options
  const dispatch = useDispatch()
  const { isAuthenticated, user } = useAppSelector((state) => state.auth)
  const isConnectedRef = useRef<boolean>(false)
  const appStateRef = useRef<AppStateStatus>(AppState.currentState)

  // Refs to store stable references to functions (avoids cleanup issues)
  const connectRef = useRef<() => Promise<void>>(() => Promise.resolve())
  const disconnectRef = useRef<() => void>(() => {})

  const log = useCallback(
    (message: string, data?: any) => {
      if (debug) {
        console.log(`[useWebSocket] ${message}`, data ?? '')
      }
    },
    [debug]
  )

  // Connect to WebSocket
  const connect = useCallback(async () => {
    if (!user?.id) {
      log('Cannot connect: No user ID')
      return
    }

    if (isConnectedRef.current) {
      log('Already connected')
      return
    }

    try {
      log('Connecting...', { userId: user.id })
      await webSocketService.connect(user.id)
      isConnectedRef.current = true

      addBreadcrumb({
        category: 'websocket',
        message: 'WebSocket connected via hook',
        level: 'info',
        data: { userId: user.id },
      })
    } catch (error) {
      log('Connection failed', error)
      isConnectedRef.current = false
    }
  }, [user?.id, log])

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    log('Disconnecting...')
    webSocketService.disconnect()
    isConnectedRef.current = false

    addBreadcrumb({
      category: 'websocket',
      message: 'WebSocket disconnected via hook',
      level: 'info',
    })
  }, [log])

  // Keep refs updated with latest function references
  connectRef.current = connect
  disconnectRef.current = disconnect

  // Join a conversation room
  const joinConversation = useCallback(
    (conversationId: number) => {
      log('Joining conversation', { conversationId })
      webSocketService.joinConversation(conversationId)
    },
    [log]
  )

  // Leave a conversation room
  const leaveConversation = useCallback(
    (conversationId: number) => {
      log('Leaving conversation', { conversationId })
      webSocketService.leaveConversation(conversationId)
    },
    [log]
  )

  // Send typing indicator
  const sendTypingIndicator = useCallback(
    (conversationId: number, isTyping: boolean) => {
      webSocketService.sendTypingIndicator(conversationId, isTyping)
    },
    []
  )

  // Setup WebSocket event handlers
  useEffect(() => {
    if (!isAuthenticated || Platform.OS === 'web') {
      return
    }

    // Message received handler
    const handleMessageReceived = (event: MessageEvent) => {
      log('Message received', event)
      dispatch(
        addMessage({
          conversationId: event.conversationId,
          message: event.message,
        })
      )
    }

    // Typing indicator handler
    const handleTyping = (event: TypingEvent) => {
      log('Typing event', event)
      dispatch(
        setTypingStatus({
          conversationId: event.conversationId,
          userId: event.userId,
          isTyping: event.isTyping,
        })
      )
    }

    // Online status handler
    const handleOnlineStatus = (event: OnlineStatusEvent) => {
      log('Online status', event)
      dispatch(
        setUserOnlineStatus({
          userId: event.userId,
          isOnline: event.isOnline,
        })
      )
    }

    // Conversation updated handler
    const handleConversationUpdated = (event: ConversationUpdatedEvent) => {
      log('Conversation updated', event)
      dispatch(
        updateConversation({
          conversationId: event.conversationId,
          lastMessageAt: event.lastMessageAt,
          lastMessagePreview: event.lastMessagePreview,
        })
      )
    }

    // Message read handler
    const handleMessageRead = (event: MessageReadEvent) => {
      log('Messages read', event)
      dispatch(
        markMessagesReadLocally({
          conversationId: event.conversationId,
          messageIds: event.messageIds,
          readAt: event.readAt,
        })
      )
    }

    // Connection status handlers
    const handleConnected = () => {
      log('Connected')
      isConnectedRef.current = true
    }

    const handleDisconnected = () => {
      log('Disconnected')
      isConnectedRef.current = false
    }

    const handleError = (error: Error) => {
      log('Error', error)
    }

    // Register event handlers
    webSocketService.on('message-received', handleMessageReceived)
    webSocketService.on('typing', handleTyping)
    webSocketService.on('online-status', handleOnlineStatus)
    webSocketService.on('conversation-updated', handleConversationUpdated)
    webSocketService.on('message-read', handleMessageRead)
    webSocketService.on('connected', handleConnected)
    webSocketService.on('disconnected', handleDisconnected)
    webSocketService.on('error', handleError)

    // Cleanup
    return () => {
      webSocketService.off('message-received', handleMessageReceived)
      webSocketService.off('typing', handleTyping)
      webSocketService.off('online-status', handleOnlineStatus)
      webSocketService.off('conversation-updated', handleConversationUpdated)
      webSocketService.off('message-read', handleMessageRead)
      webSocketService.off('connected', handleConnected)
      webSocketService.off('disconnected', handleDisconnected)
      webSocketService.off('error', handleError)
    }
  }, [isAuthenticated, dispatch, log])

  // Auto-connect when authenticated
  // Uses refs to avoid function recreation issues in cleanup
  useEffect(() => {
    if (!autoConnect || !isAuthenticated || !user?.id || Platform.OS === 'web') {
      return
    }

    // Use ref to get current function without adding to dependencies
    connectRef.current()

    return () => {
      // Cleanup uses ref to ensure we call the latest disconnect function
      disconnectRef.current()
    }
  }, [autoConnect, isAuthenticated, user?.id])

  // Handle app state changes (foreground/background)
  // Uses refs to avoid function recreation issues
  useEffect(() => {
    if (!isAuthenticated || Platform.OS === 'web') {
      return
    }

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      const previousState = appStateRef.current
      appStateRef.current = nextAppState

      // App came to foreground
      if (previousState.match(/inactive|background/) && nextAppState === 'active') {
        if (!isConnectedRef.current && user?.id) {
          // Use ref to call current connect function
          connectRef.current()
        }
      }

      // App went to background
      if (previousState === 'active' && nextAppState.match(/inactive|background/)) {
        // Keep connection alive for a while in background
        // Socket.IO will handle disconnection if needed
      }
    }

    const subscription = AppState.addEventListener('change', handleAppStateChange)

    return () => {
      subscription.remove()
    }
  }, [isAuthenticated, user?.id])

  return {
    isConnected: isConnectedRef.current,
    connect,
    disconnect,
    joinConversation,
    leaveConversation,
    sendTypingIndicator,
  }
}

export default useWebSocket
