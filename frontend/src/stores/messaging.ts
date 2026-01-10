import { defineStore } from 'pinia'
import messagingService from '@/services/messagingService'
import { websocketService } from '@/services/websocketService'
import type { Conversation, ConversationMessage } from '@/types'

interface MessagingState {
  conversations: Conversation[]
  activeConversation: Conversation | null
  messages: ConversationMessage[]
  loading: boolean
  sending: boolean
  error: string | null
  wsConnected: boolean
  unsubscribe: (() => void) | null
}

export const useMessagingStore = defineStore('messaging', {
  state: (): MessagingState => ({
    conversations: [],
    activeConversation: null,
    messages: [],
    loading: false,
    sending: false,
    error: null,
    wsConnected: false,
    unsubscribe: null
  }),
  actions: {
    // WebSocket integration
    async connectWebSocket() {
      try {
        await websocketService.connect()
        this.wsConnected = true
        console.log('[Messaging] WebSocket connected')
      } catch (error) {
        console.warn('[Messaging] WebSocket connection failed, falling back to polling')
        this.wsConnected = false
      }
    },

    disconnectWebSocket() {
      if (this.unsubscribe) {
        this.unsubscribe()
        this.unsubscribe = null
      }
      this.wsConnected = false
    },

    subscribeToConversation(conversationId: number) {
      // Unsubscribe from previous conversation
      if (this.unsubscribe) {
        this.unsubscribe()
        this.unsubscribe = null
      }

      if (!this.wsConnected) {
        return
      }

      // Subscribe to new conversation
      this.unsubscribe = websocketService.subscribeToConversation(conversationId, (data) => {
        this.handleIncomingMessage(data)
      })
    },

    handleIncomingMessage(data: any) {
      if (!data) return

      // Handle new message
      if (data.type === 'new_message' && data.message) {
        const message = data.message as ConversationMessage

        // Add to messages if it's for active conversation
        if (this.activeConversation && message.conversation_id === this.activeConversation.id) {
          // Avoid duplicates
          const exists = this.messages.some(m => m.id === message.id)
          if (!exists) {
            this.messages.push(message)
          }
        }

        // Update conversation preview
        if (data.conversation) {
          this.upsertConversation(data.conversation)
        }
      }

      // Handle typing indicator
      if (data.type === 'typing') {
        // Could emit an event or update state for typing indicator
        console.log('[Messaging] User typing:', data.user_id)
      }

      // Handle read receipt
      if (data.type === 'read') {
        // Update message read status
        if (data.message_ids) {
          this.messages = this.messages.map(m => {
            if (data.message_ids.includes(m.id)) {
              return { ...m, read_at: data.read_at || new Date().toISOString() }
            }
            return m
          })
        }
      }
    },

    // Send typing indicator
    sendTypingIndicator() {
      if (!this.wsConnected || !this.activeConversation) return

      websocketService.send('typing', {
        conversation_id: this.activeConversation.id
      }, `conversation.${this.activeConversation.id}`)
    },

    setError(message: string | null) {
      this.error = message
    },

    upsertConversation(conversation: Conversation) {
      const index = this.conversations.findIndex(({ id }) => id === conversation.id)
      if (index >= 0) {
        this.conversations.splice(index, 1, conversation)
      } else {
        this.conversations.unshift(conversation)
      }
    },

    async fetchConversations(includeArchived = false) {
      this.loading = true
      this.error = null
      try {
        const response = await messagingService.listConversations(includeArchived)
        this.conversations = response.data.conversations
        return response
      } catch (error: any) {
        this.error = error?.message ?? 'Impossible de charger vos conversations.'
        throw error
      } finally {
        this.loading = false
      }
    },

    async loadConversation(
      conversationId: number,
      options: { perPage?: number; page?: number } = {}
    ) {
      this.loading = true
      this.error = null
      try {
        const response = await messagingService.getConversation(conversationId, options)
        this.activeConversation = response.data.conversation
        this.messages = response.data.messages
        this.upsertConversation(response.data.conversation)

        // Subscribe to WebSocket channel for real-time updates
        this.subscribeToConversation(conversationId)

        return response
      } catch (error: any) {
        this.error = error?.message ?? 'Impossible de charger la conversation sélectionnée.'
        throw error
      } finally {
        this.loading = false
      }
    },

    async ensureConversation(params: {
      conversationId?: number
      merchantId?: number
      consumerId?: number
    }) {
      this.loading = true
      this.error = null
      try {
        if (params.conversationId) {
          return await this.loadConversation(params.conversationId)
        }

        const creation = await messagingService.createConversation({
          merchantId: params.merchantId,
          consumerId: params.consumerId
        })

        const conversationId = creation.data.conversation.id
        this.upsertConversation(creation.data.conversation)

        const detail = await messagingService.getConversation(conversationId)
        this.activeConversation = detail.data.conversation
        this.messages = detail.data.messages
        this.upsertConversation(detail.data.conversation)
        return detail
      } catch (error: any) {
        this.error = error?.message ?? 'Impossible d\'ouvrir la messagerie.'
        throw error
      } finally {
        this.loading = false
      }
    },

    async sendMessage(content: string) {
      if (!this.activeConversation) {
        throw new Error('Aucune conversation active')
      }

      this.sending = true
      this.error = null
      try {
        const response = await messagingService.sendMessage(this.activeConversation.id, content)
        this.activeConversation = response.data.conversation
        this.messages = [...this.messages, response.data.message]
        this.upsertConversation(response.data.conversation)
        return response
      } catch (error: any) {
        this.error = error?.message ?? "Impossible d'envoyer le message."
        throw error
      } finally {
        this.sending = false
      }
    },

    async refreshConversationsList() {
      try {
        await this.fetchConversations()
      } catch (error) {
        // erreur déjà gérée dans fetchConversations
      }
    },

    clearActiveConversation() {
      this.activeConversation = null
      this.messages = []
    }
  }
})
