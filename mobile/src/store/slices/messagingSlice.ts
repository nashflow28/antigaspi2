/**
 * Messaging Redux Slice
 *
 * Manages real-time messaging state with WebSocket integration
 * Features:
 * - Conversations list management
 * - Messages per conversation
 * - Typing indicators
 * - Online status tracking
 * - Unread count management
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import type { Conversation, ConversationMessage } from '../../types'
import messagingService from '../../services/messagingService'
import { captureException } from '../../utils/sentryInit'

// State types
export interface MessagePagination {
  currentPage: number
  hasMore: boolean
  totalMessages: number
}

export interface MessagingState {
  /** List of all conversations */
  conversations: Conversation[]
  /** Currently active conversation ID */
  activeConversationId: number | null
  /** Messages indexed by conversation ID */
  messages: Record<number, ConversationMessage[]>
  /** BUG FIX #13: Pagination state per conversation */
  messagePagination: Record<number, MessagePagination>
  /** Users currently typing, indexed by conversation ID */
  typingUsers: Record<number, number[]>
  /** Online user IDs (stored as array for serialization) */
  onlineUserIds: number[]
  /** Total unread messages count */
  unreadCount: number
  /** Loading states */
  loading: boolean
  conversationsLoading: boolean
  messagesLoading: boolean
  sendingMessage: boolean
  loadingMoreMessages: boolean
  /** Error state */
  error: string | null
}

export const messagingInitialState: MessagingState = {
  conversations: [],
  activeConversationId: null,
  messages: {},
  messagePagination: {},
  typingUsers: {},
  onlineUserIds: [],
  unreadCount: 0,
  loading: false,
  conversationsLoading: false,
  messagesLoading: false,
  sendingMessage: false,
  loadingMoreMessages: false,
  error: null,
}

// Async thunks

/**
 * Fetch all conversations for the current user
 */
export const fetchConversations = createAsyncThunk(
  'messaging/fetchConversations',
  async (_, { rejectWithValue }) => {
    try {
      const response = await messagingService.fetchConversations()
      return response.data.conversations
    } catch (error: any) {
      captureException(error, { context: 'fetchConversations' })
      return rejectWithValue(error.message || 'Failed to fetch conversations')
    }
  }
)

/**
 * Fetch or create a conversation with a merchant
 */
export const ensureConversation = createAsyncThunk(
  'messaging/ensureConversation',
  async (
    params: { conversationId?: number; merchantId?: number; perPage?: number },
    { rejectWithValue }
  ) => {
    try {
      const response = await messagingService.ensureConversation(params)
      return response.data
    } catch (error: any) {
      captureException(error, { context: 'ensureConversation', params })
      return rejectWithValue(error.message || 'Failed to load conversation')
    }
  }
)

/**
 * Fetch messages for a specific conversation
 * BUG FIX #13: Added pagination support
 */
export const fetchMessages = createAsyncThunk(
  'messaging/fetchMessages',
  async (
    { conversationId, page = 1, perPage = 50 }: { conversationId: number; page?: number; perPage?: number },
    { rejectWithValue }
  ) => {
    try {
      const response = await messagingService.fetchConversation(conversationId, { page, perPage })
      return {
        conversationId,
        messages: response.data.messages,
        conversation: response.data.conversation,
        pagination: response.data.pagination,
        page,
        perPage,
      }
    } catch (error: any) {
      captureException(error, { context: 'fetchMessages', conversationId })
      return rejectWithValue(error.message || 'Failed to fetch messages')
    }
  }
)

/**
 * BUG FIX #13: Load more messages for infinite scroll
 */
export const loadMoreMessages = createAsyncThunk(
  'messaging/loadMoreMessages',
  async (
    { conversationId }: { conversationId: number },
    { getState, rejectWithValue }
  ) => {
    try {
      const state = getState() as { messaging: MessagingState }
      const pagination = state.messaging.messagePagination[conversationId]

      // Don't load if no more pages
      if (pagination && !pagination.hasMore) {
        return { conversationId, messages: [], hasMore: false }
      }

      const nextPage = pagination ? pagination.currentPage + 1 : 2
      const response = await messagingService.fetchConversation(conversationId, { page: nextPage, perPage: 50 })

      return {
        conversationId,
        messages: response.data.messages,
        pagination: response.data.pagination,
        page: nextPage,
      }
    } catch (error: any) {
      captureException(error, { context: 'loadMoreMessages', conversationId })
      return rejectWithValue(error.message || 'Failed to load more messages')
    }
  }
)

/**
 * Send a message to a conversation
 */
export const sendMessage = createAsyncThunk(
  'messaging/sendMessage',
  async (
    { conversationId, content }: { conversationId: number; content: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await messagingService.sendMessage(conversationId, content)
      return {
        conversationId,
        message: response.data.message,
        conversation: response.data.conversation,
      }
    } catch (error: any) {
      captureException(error, { context: 'sendMessage', conversationId })
      return rejectWithValue(error.message || 'Failed to send message')
    }
  }
)

/**
 * Mark messages as read (handled locally - backend sync via WebSocket)
 * Note: The backend doesn't have a REST endpoint for this yet,
 * so we handle it optimistically and let WebSocket sync the state
 */
export const markMessagesAsRead = createAsyncThunk(
  'messaging/markAsRead',
  async (
    { conversationId, messageIds }: { conversationId: number; messageIds: number[] },
    { rejectWithValue }
  ) => {
    try {
      // For now, just return the payload for optimistic update
      // WebSocket will handle the actual backend sync
      return { conversationId, messageIds }
    } catch (error: any) {
      captureException(error, { context: 'markMessagesAsRead', conversationId })
      return rejectWithValue(error.message || 'Failed to mark messages as read')
    }
  }
)

const messagingSlice = createSlice({
  name: 'messaging',
  initialState: messagingInitialState,
  reducers: {
    /**
     * Clear error state
     */
    clearError: (state) => {
      state.error = null
    },

    /**
     * Set active conversation
     */
    setActiveConversation: (state, action: PayloadAction<number | null>) => {
      state.activeConversationId = action.payload
    },

    /**
     * Add a new message from WebSocket
     */
    addMessage: (state, action: PayloadAction<{ conversationId: number; message: ConversationMessage }>) => {
      const { conversationId, message } = action.payload

      // Initialize messages array if needed
      if (!state.messages[conversationId]) {
        state.messages[conversationId] = []
      }

      // Avoid duplicates
      const exists = state.messages[conversationId].some(m => m.id === message.id)
      if (!exists) {
        state.messages[conversationId].push(message)
      }

      // Update conversation preview
      const conversationIndex = state.conversations.findIndex(c => c.id === conversationId)
      if (conversationIndex !== -1) {
        state.conversations[conversationIndex] = {
          ...state.conversations[conversationIndex],
          last_message_at: message.created_at,
          last_message_preview: message.content.substring(0, 100),
          latestMessage: message,
        }

        // Move conversation to top of list
        const [conversation] = state.conversations.splice(conversationIndex, 1)
        state.conversations.unshift(conversation)
      }

      // Increment unread if not active conversation
      if (state.activeConversationId !== conversationId) {
        state.unreadCount += 1
      }
    },

    /**
     * Update typing status from WebSocket
     */
    setTypingStatus: (state, action: PayloadAction<{ conversationId: number; userId: number; isTyping: boolean }>) => {
      const { conversationId, userId, isTyping } = action.payload

      if (!state.typingUsers[conversationId]) {
        state.typingUsers[conversationId] = []
      }

      if (isTyping) {
        if (!state.typingUsers[conversationId].includes(userId)) {
          state.typingUsers[conversationId].push(userId)
        }
      } else {
        state.typingUsers[conversationId] = state.typingUsers[conversationId].filter(id => id !== userId)
      }
    },

    /**
     * Update user online status from WebSocket
     */
    setUserOnlineStatus: (state, action: PayloadAction<{ userId: number; isOnline: boolean }>) => {
      const { userId, isOnline } = action.payload

      if (isOnline) {
        if (!state.onlineUserIds.includes(userId)) {
          state.onlineUserIds.push(userId)
        }
      } else {
        state.onlineUserIds = state.onlineUserIds.filter(id => id !== userId)
      }
    },

    /**
     * Mark messages as read locally
     */
    markMessagesReadLocally: (state, action: PayloadAction<{ conversationId: number; messageIds: number[]; readAt: string }>) => {
      const { conversationId, messageIds, readAt } = action.payload

      let markedCount = 0
      if (state.messages[conversationId]) {
        state.messages[conversationId] = state.messages[conversationId].map(message => {
          if (messageIds.includes(message.id) && !message.read_at) {
            markedCount++
            return { ...message, read_at: readAt }
          }
          return message
        })
      }

      // Decrement unread count by the number of messages marked as read
      state.unreadCount = Math.max(0, state.unreadCount - markedCount)
    },

    /**
     * Update conversation from WebSocket event
     */
    updateConversation: (state, action: PayloadAction<{ conversationId: number; lastMessageAt: string; lastMessagePreview: string }>) => {
      const { conversationId, lastMessageAt, lastMessagePreview } = action.payload

      const index = state.conversations.findIndex(c => c.id === conversationId)
      if (index !== -1) {
        state.conversations[index] = {
          ...state.conversations[index],
          last_message_at: lastMessageAt,
          last_message_preview: lastMessagePreview,
        }
      }
    },

    /**
     * Reset unread count for a conversation
     */
    resetUnreadCount: (state) => {
      state.unreadCount = 0
    },

    /**
     * Clear all messaging state (on logout)
     */
    clearMessagingState: (state) => {
      state.conversations = []
      state.activeConversationId = null
      state.messages = {}
      state.typingUsers = {}
      state.onlineUserIds = []
      state.unreadCount = 0
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch conversations
      .addCase(fetchConversations.pending, (state) => {
        state.conversationsLoading = true
        state.error = null
      })
      .addCase(fetchConversations.fulfilled, (state, action: PayloadAction<Conversation[]>) => {
        state.conversationsLoading = false
        state.conversations = action.payload
        state.error = null
      })
      .addCase(fetchConversations.rejected, (state, action) => {
        state.conversationsLoading = false
        state.error = action.payload as string
      })

      // Ensure conversation (get or create)
      .addCase(ensureConversation.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(ensureConversation.fulfilled, (state, action) => {
        state.loading = false
        const { conversation, messages } = action.payload

        // Update or add conversation
        const existingIndex = state.conversations.findIndex(c => c.id === conversation.id)
        if (existingIndex !== -1) {
          state.conversations[existingIndex] = conversation
        } else {
          state.conversations.unshift(conversation)
        }

        // Set messages for this conversation
        state.messages[conversation.id] = messages
        state.activeConversationId = conversation.id
        state.error = null
      })
      .addCase(ensureConversation.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })

      // Fetch messages
      .addCase(fetchMessages.pending, (state) => {
        state.messagesLoading = true
        state.error = null
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.messagesLoading = false
        const { conversationId, messages, conversation, pagination, page, perPage } = action.payload

        // Set messages
        state.messages[conversationId] = messages

        // BUG FIX #13: Update pagination state
        state.messagePagination[conversationId] = {
          currentPage: page || 1,
          hasMore: pagination?.has_more_pages ?? (messages.length >= (perPage || 50)),
          totalMessages: pagination?.total ?? messages.length,
        }

        // Update conversation if provided
        if (conversation) {
          const index = state.conversations.findIndex(c => c.id === conversationId)
          if (index !== -1) {
            state.conversations[index] = conversation
          }
        }

        state.error = null
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.messagesLoading = false
        state.error = action.payload as string
      })

      // BUG FIX #13: Load more messages for infinite scroll
      .addCase(loadMoreMessages.pending, (state) => {
        state.loadingMoreMessages = true
      })
      .addCase(loadMoreMessages.fulfilled, (state, action) => {
        state.loadingMoreMessages = false
        const { conversationId, messages, pagination, page } = action.payload

        // Prepend older messages to existing list
        if (messages.length > 0) {
          const existingMessages = state.messages[conversationId] || []
          state.messages[conversationId] = [...messages, ...existingMessages]
        }

        // Update pagination state
        if (page !== undefined) {
          state.messagePagination[conversationId] = {
            currentPage: page,
            hasMore: pagination?.has_more_pages ?? messages.length > 0,
            totalMessages: pagination?.total ?? (state.messages[conversationId]?.length || 0),
          }
        }
      })
      .addCase(loadMoreMessages.rejected, (state, action) => {
        state.loadingMoreMessages = false
        state.error = action.payload as string
      })

      // Send message
      .addCase(sendMessage.pending, (state) => {
        state.sendingMessage = true
        state.error = null
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.sendingMessage = false
        const { conversationId, message, conversation } = action.payload

        // Add message to list
        if (!state.messages[conversationId]) {
          state.messages[conversationId] = []
        }

        // Avoid duplicates
        const exists = state.messages[conversationId].some(m => m.id === message.id)
        if (!exists) {
          state.messages[conversationId].push(message)
        }

        // Update conversation
        if (conversation) {
          const index = state.conversations.findIndex(c => c.id === conversationId)
          if (index !== -1) {
            state.conversations[index] = conversation
            // Move to top
            const [conv] = state.conversations.splice(index, 1)
            state.conversations.unshift(conv)
          }
        }

        state.error = null
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.sendingMessage = false
        state.error = action.payload as string
      })

      // Mark as read
      .addCase(markMessagesAsRead.fulfilled, (state, action) => {
        const { conversationId, messageIds } = action.payload
        const now = new Date().toISOString()

        if (state.messages[conversationId]) {
          state.messages[conversationId] = state.messages[conversationId].map(message => {
            if (messageIds.includes(message.id) && !message.read_at) {
              return { ...message, read_at: now }
            }
            return message
          })
        }
      })
  },
})

// Export actions
export const {
  clearError,
  setActiveConversation,
  addMessage,
  setTypingStatus,
  setUserOnlineStatus,
  markMessagesReadLocally,
  updateConversation,
  resetUnreadCount,
  clearMessagingState,
} = messagingSlice.actions

// Selectors
const EMPTY_MESSAGES: ConversationMessage[] = []
const EMPTY_TYPING_USERS: number[] = []
const DEFAULT_MESSAGE_PAGINATION: MessagePagination = { currentPage: 1, hasMore: true, totalMessages: 0 }

export const selectConversations = (state: { messaging: MessagingState }) => state.messaging.conversations
export const selectActiveConversationId = (state: { messaging: MessagingState }) => state.messaging.activeConversationId
export const selectMessages = (conversationId: number) => (state: { messaging: MessagingState }) =>
  state.messaging.messages[conversationId] || EMPTY_MESSAGES
export const selectTypingUsers = (conversationId: number) => (state: { messaging: MessagingState }) =>
  state.messaging.typingUsers[conversationId] || EMPTY_TYPING_USERS
export const selectIsUserOnline = (userId: number) => (state: { messaging: MessagingState }) =>
  state.messaging.onlineUserIds.includes(userId)
export const selectUnreadCount = (state: { messaging: MessagingState }) => state.messaging.unreadCount
export const selectMessagingLoading = (state: { messaging: MessagingState }) => state.messaging.loading
export const selectSendingMessage = (state: { messaging: MessagingState }) => state.messaging.sendingMessage
export const selectMessagingError = (state: { messaging: MessagingState }) => state.messaging.error
// BUG FIX #13: Pagination selectors
export const selectLoadingMoreMessages = (state: { messaging: MessagingState }) => state.messaging.loadingMoreMessages
export const selectMessagePagination = (conversationId: number) => (state: { messaging: MessagingState }) =>
  state.messaging.messagePagination[conversationId] || DEFAULT_MESSAGE_PAGINATION
export const selectHasMoreMessages = (conversationId: number) => (state: { messaging: MessagingState }) =>
  state.messaging.messagePagination[conversationId]?.hasMore ?? true

// Export reducer
export const messagingReducer = messagingSlice.reducer
export default messagingReducer
