import { apiService } from '@/services/api'
import type {
  ApiResponse,
  Conversation,
  ConversationListPayload,
  ConversationDetailPayload,
  ConversationMessagePayload
} from '@/types'

class MessagingService {
  private readonly baseUrl = '/messaging'

  async listConversations(includeArchived = false): Promise<ApiResponse<ConversationListPayload>> {
    const query = includeArchived ? '?include_archived=1' : ''
    return apiService.get<ApiResponse<ConversationListPayload>>(
      `${this.baseUrl}/conversations${query}`,
      true
    )
  }

  async createConversation(payload: { merchantId?: number; consumerId?: number }): Promise<ApiResponse<{ conversation: Conversation }>> {
    return apiService.post<ApiResponse<{ conversation: Conversation }>>(
      `${this.baseUrl}/conversations`,
      payload,
      true
    )
  }

  async getConversation(
    conversationId: number,
    options: { perPage?: number; page?: number } = {}
  ): Promise<ApiResponse<ConversationDetailPayload>> {
    const params = new URLSearchParams()

    if (options.perPage) {
      params.append('per_page', options.perPage.toString())
    }

    if (options.page && options.page > 1) {
      params.append('page', options.page.toString())
    }

    const query = params.toString()

    return apiService.get<ApiResponse<ConversationDetailPayload>>(
      `${this.baseUrl}/conversations/${conversationId}${query ? `?${query}` : ''}`,
      true
    )
  }

  async updateConversation(
    conversationId: number,
    payload: { archived?: boolean }
  ): Promise<ApiResponse<{ conversation: Conversation }>> {
    return apiService.put<ApiResponse<{ conversation: Conversation }>>(
      `${this.baseUrl}/conversations/${conversationId}`,
      payload,
      true
    )
  }

  async deleteConversation(conversationId: number): Promise<ApiResponse<{ conversation_id: number }>> {
    return apiService.delete<ApiResponse<{ conversation_id: number }>>(
      `${this.baseUrl}/conversations/${conversationId}`,
      true
    )
  }

  async sendMessage(
    conversationId: number,
    content: string
  ): Promise<ApiResponse<ConversationMessagePayload>> {
    return apiService.post<ApiResponse<ConversationMessagePayload>>(
      `${this.baseUrl}/conversations/${conversationId}/messages`,
      { content },
      true
    )
  }

  async updateMessage(
    messageId: number,
    content: string
  ): Promise<ApiResponse<{ message: ConversationMessagePayload['message'] }>> {
    return apiService.put<ApiResponse<{ message: ConversationMessagePayload['message'] }>>(
      `${this.baseUrl}/messages/${messageId}`,
      { content },
      true
    )
  }

  async deleteMessage(messageId: number): Promise<ApiResponse<{ message_id: number }>> {
    return apiService.delete<ApiResponse<{ message_id: number }>>(
      `${this.baseUrl}/messages/${messageId}`,
      true
    )
  }
}

export const messagingService = new MessagingService()
export default messagingService
