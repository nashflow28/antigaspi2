import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit'
import {
  MerchantConversationSummary,
  MerchantMessageItem,
  MerchantMessagingState,
} from '../../types'
import apiService from '../../services/api'
import offlineService from '../../services/offlineService'

const CONVERSATIONS_CACHE_KEY = 'conversations'
const conversationMessagesCacheKey = (conversationId: number) => `messages_${conversationId}`

type ConversationsCache = {
  conversations: MerchantConversationSummary[]
  meta: Record<string, unknown> | null
  syncedAt: string
}

type MessagesCache = {
  messages: MerchantMessageItem[]
  meta: Record<string, unknown> | null
  syncedAt: string
}

const initialState: MerchantMessagingState = {
  conversations: [],
  messagesByConversation: {},
  loadingConversations: false,
  loadingMessages: {},
  sendingMessage: false,
  error: null,
  lastSyncedAt: null,
}

const saveConversationsCache = async (payload: ConversationsCache): Promise<void> => {
  try {
    await offlineService.setCache(CONVERSATIONS_CACHE_KEY, payload)
  } catch (error) {
    console.warn('Impossible de mettre en cache les conversations', error)
  }
}

const loadConversationsCache = async (): Promise<ConversationsCache | null> => {
  try {
    return await offlineService.getCache<ConversationsCache>(CONVERSATIONS_CACHE_KEY)
  } catch (error) {
    console.warn('Impossible de charger le cache conversations', error)
    return null
  }
}

const saveMessagesCache = async (conversationId: number, payload: MessagesCache): Promise<void> => {
  try {
    await offlineService.setCache(conversationMessagesCacheKey(conversationId), payload)
  } catch (error) {
    console.warn('Impossible de mettre en cache les messages', error)
  }
}

const loadMessagesCache = async (conversationId: number): Promise<MessagesCache | null> => {
  try {
    return await offlineService.getCache<MessagesCache>(conversationMessagesCacheKey(conversationId))
  } catch (error) {
    console.warn('Impossible de charger le cache messages', error)
    return null
  }
}

export const fetchConversations = createAsyncThunk<
  ConversationsCache,
  { perPage?: number } | undefined,
  { rejectValue: string }
>('messaging/fetchConversations', async (params, { rejectWithValue }) => {
  const isOnline = await offlineService.checkConnectivity().catch(() => offlineService.getConnectivityStatus())

  if (!isOnline) {
    const cached = await loadConversationsCache()
    if (cached) {
      return cached
    }
  }

  try {
    const response = await apiService.getMerchantConversations(params)
    const payload: ConversationsCache = {
      conversations: response.conversations,
      meta: response.meta,
      syncedAt: new Date().toISOString(),
    }

    await saveConversationsCache(payload)
    return payload
  } catch (error: any) {
    const cached = await loadConversationsCache()
    if (cached) {
      return cached
    }

    return rejectWithValue(error?.message || 'Impossible de récupérer les conversations')
  }
})

export const fetchConversationMessages = createAsyncThunk<
  { conversationId: number; cache: MessagesCache },
  { conversationId: number; perPage?: number } | undefined,
  { rejectValue: string }
>('messaging/fetchMessages', async (params, { rejectWithValue }) => {
  if (!params) {
    return rejectWithValue('Conversation inconnue')
  }

  const { conversationId, perPage } = params
  const isOnline = await offlineService.checkConnectivity().catch(() => offlineService.getConnectivityStatus())

  if (!isOnline) {
    const cached = await loadMessagesCache(conversationId)
    if (cached) {
      return { conversationId, cache: cached }
    }
  }

  try {
    const response = await apiService.getConversationMessages(conversationId, { perPage })
    const payload: MessagesCache = {
      messages: response.messages,
      meta: response.meta,
      syncedAt: new Date().toISOString(),
    }

    await saveMessagesCache(conversationId, payload)
    return { conversationId, cache: payload }
  } catch (error: any) {
    const cached = await loadMessagesCache(conversationId)
    if (cached) {
      return { conversationId, cache: cached }
    }

    return rejectWithValue(error?.message || 'Impossible de récupérer les messages')
  }
})

export const sendMerchantMessage = createAsyncThunk<
  MerchantMessageItem,
  {
    merchantId?: number
    merchantName?: string | null
    conversationId?: number
    message: string
    attachments?: Record<string, unknown>[]
  },
  { rejectValue: string }
>('messaging/sendMessage', async (payload, { rejectWithValue }) => {
  try {
    return await apiService.sendMerchantMessage({
      merchantId: payload.merchantId,
      conversationId: payload.conversationId,
      message: payload.message,
      attachments: payload.attachments,
    })
  } catch (error: any) {
    return rejectWithValue(error?.message || "Impossible d'envoyer le message")
  }
})

export const markConversationAsRead = createAsyncThunk<
  number,
  number,
  { rejectValue: string }
>('messaging/markConversationRead', async (conversationId, { rejectWithValue }) => {
  try {
    await apiService.markConversationAsRead(conversationId)
    return conversationId
  } catch (error: any) {
    return rejectWithValue(error?.message || 'Impossible de marquer la conversation comme lue')
  }
})

export const archiveConversation = createAsyncThunk<
  { conversationId: number; archived: boolean },
  { conversationId: number; archived: boolean },
  { rejectValue: string }
>('messaging/archiveConversation', async ({ conversationId, archived }, { rejectWithValue }) => {
  try {
    const result = await apiService.archiveConversation(conversationId, archived)
    return { conversationId, archived: result }
  } catch (error: any) {
    return rejectWithValue(error?.message || 'Impossible de mettre à jour la conversation')
  }
})

const mergeConversationLists = (
  existing: MerchantConversationSummary[],
  updates: MerchantConversationSummary[]
): MerchantConversationSummary[] => {
  const map = new Map<number, MerchantConversationSummary>()

  for (const item of existing) {
    map.set(item.id, item)
  }

  for (const item of updates) {
    map.set(item.id, item)
  }

  return Array.from(map.values()).sort((a, b) => {
    const aDate = a.last_message_at || ''
    const bDate = b.last_message_at || ''
    return bDate.localeCompare(aDate)
  })
}

const messagingSlice = createSlice({
  name: 'messaging',
  initialState,
  reducers: {
    resetMessagingError: state => {
      state.error = null
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchConversations.pending, state => {
        state.loadingConversations = true
        state.error = null
      })
      .addCase(fetchConversations.fulfilled, (state, action) => {
        state.loadingConversations = false
        state.conversations = action.payload.conversations
        state.lastSyncedAt = action.payload.syncedAt
        saveConversationsCache(action.payload).catch(() => null)
      })
      .addCase(fetchConversations.rejected, (state, action) => {
        state.loadingConversations = false
        state.error = action.payload || 'Impossible de récupérer les conversations'
      })
      .addCase(fetchConversationMessages.pending, (state, action) => {
        if (action.meta.arg?.conversationId) {
          state.loadingMessages[action.meta.arg.conversationId] = true
        }
        state.error = null
      })
      .addCase(fetchConversationMessages.fulfilled, (state, action) => {
        const { conversationId, cache } = action.payload
        state.loadingMessages[conversationId] = false
        state.messagesByConversation[conversationId] = cache.messages
        saveMessagesCache(conversationId, cache).catch(() => null)
      })
      .addCase(fetchConversationMessages.rejected, (state, action) => {
        if (action.meta.arg?.conversationId) {
          state.loadingMessages[action.meta.arg.conversationId] = false
        }
        state.error = action.payload || 'Impossible de récupérer les messages'
      })
      .addCase(sendMerchantMessage.pending, state => {
        state.sendingMessage = true
        state.error = null
      })
      .addCase(sendMerchantMessage.fulfilled, (state, action) => {
        state.sendingMessage = false
        const conversationId = action.meta.arg?.conversationId ?? action.payload.conversation_id
        const existingMessages = state.messagesByConversation[conversationId] || []
        state.messagesByConversation[conversationId] = [action.payload, ...existingMessages]

        const existingConversation = state.conversations.find(conversation => conversation.id === conversationId)
        const updatedConversation: MerchantConversationSummary = existingConversation
          ? {
              ...existingConversation,
              last_message_preview: action.payload.message,
              last_message_at: action.payload.created_at,
            }
          : {
              id: conversationId,
              merchant_id: action.meta.arg?.merchantId ?? action.payload.recipient_id,
              merchant_name: action.meta.arg?.merchantName ?? null,
              consumer_id: action.payload.sender_id,
              last_message_preview: action.payload.message,
              last_message_at: action.payload.created_at,
              unread_count: 0,
              is_archived: false,
            }

        state.conversations = mergeConversationLists(state.conversations, [updatedConversation])

        saveMessagesCache(conversationId, {
          messages: state.messagesByConversation[conversationId],
          meta: null,
          syncedAt: new Date().toISOString(),
        }).catch(() => null)
      })
      .addCase(sendMerchantMessage.rejected, (state, action) => {
        state.sendingMessage = false
        state.error = action.payload || "Impossible d'envoyer le message"
      })
      .addCase(markConversationAsRead.fulfilled, (state, action) => {
        const conversationId = action.payload
        state.conversations = state.conversations.map(conversation =>
          conversation.id === conversationId
            ? { ...conversation, unread_count: 0 }
            : conversation
        )

        const messages = state.messagesByConversation[conversationId]
        if (messages) {
          state.messagesByConversation[conversationId] = messages.map(message => ({
            ...message,
            is_read: true,
            read_at: message.read_at || new Date().toISOString(),
          }))

          saveMessagesCache(conversationId, {
            messages: state.messagesByConversation[conversationId],
            meta: null,
            syncedAt: new Date().toISOString(),
          }).catch(() => null)
        }
      })
      .addCase(archiveConversation.fulfilled, (state, action) => {
        state.conversations = state.conversations.map(conversation =>
          conversation.id === action.payload.conversationId
            ? { ...conversation, is_archived: action.payload.archived }
            : conversation
        )
        saveConversationsCache({
          conversations: state.conversations,
          meta: null,
          syncedAt: new Date().toISOString(),
        }).catch(() => null)
      })
  },
})

export const { resetMessagingError } = messagingSlice.actions
export const messagingReducer = messagingSlice.reducer
export default messagingReducer
