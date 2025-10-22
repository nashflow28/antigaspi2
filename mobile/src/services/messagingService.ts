import apiService from './api'
import type {
  ApiResponse,
  Conversation,
  ConversationDetailResponse,
  ConversationListResponse,
  ConversationMessage,
  ConversationMessageResponse,
} from '../types'

export interface ConversationBootstrapOptions {
  conversationId?: number
  merchantId?: number
  consumerId?: number
  perPage?: number
}

const messagingService = {
  async fetchConversations(includeArchived = false): Promise<ApiResponse<ConversationListResponse>> {
    return apiService.getConversations(includeArchived)
  },

  async startConversation(payload: {
    merchantId?: number
    consumerId?: number
  }): Promise<ApiResponse<{ conversation: Conversation }>> {
    return apiService.createConversation(payload)
  },

  async fetchConversation(
    conversationId: number,
    options: { perPage?: number; page?: number } = {}
  ): Promise<ApiResponse<ConversationDetailResponse>> {
    return apiService.getConversation(conversationId, options)
  },

  async ensureConversation(
    options: ConversationBootstrapOptions
  ): Promise<ApiResponse<ConversationDetailResponse>> {
    if (options.conversationId) {
      return apiService.getConversation(options.conversationId, {
        perPage: options.perPage,
      })
    }

    const creation = await apiService.createConversation({
      merchantId: options.merchantId,
      consumerId: options.consumerId,
    })

    const newConversationId = creation.data.conversation.id

    return apiService.getConversation(newConversationId, {
      perPage: options.perPage,
    })
  },

  async sendMessage(
    conversationId: number,
    content: string
  ): Promise<ApiResponse<ConversationMessageResponse>> {
    return apiService.sendMessage(conversationId, content)
  },

  async updateConversation(
    conversationId: number,
    payload: { archived?: boolean }
  ): Promise<ApiResponse<{ conversation: Conversation }>> {
    return apiService.updateConversation(conversationId, payload)
  },

  async updateMessage(
    messageId: number,
    content: string
  ): Promise<ApiResponse<{ message: ConversationMessage }>> {
    return apiService.updateMessage(messageId, content)
  },

  async deleteMessage(messageId: number): Promise<ApiResponse<{ message_id: number }>> {
    return apiService.deleteMessage(messageId)
  },
}

export default messagingService
