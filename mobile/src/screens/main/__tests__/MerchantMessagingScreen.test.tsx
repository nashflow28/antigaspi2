// @ts-nocheck
import React from 'react'
import MerchantMessagingScreen from '../MerchantMessagingScreen'
import {
  renderWithProviders,
  fireEvent,
  waitFor,
  createTestStore,
  createTestUser,
  createTestConversation,
  createTestConversationMessage,
} from '@test-utils'

import messagingService from '../../../services/messagingService'

jest.mock('../../../services/messagingService', () => ({
  ensureConversation: jest.fn(),
  sendMessage: jest.fn(),
  updateConversation: jest.fn(),
  updateMessage: jest.fn(),
  deleteMessage: jest.fn(),
  fetchConversations: jest.fn(),
  fetchConversation: jest.fn(),
  startConversation: jest.fn(),
}))

describe('MerchantMessagingScreen', () => {
  const navigation = {
    goBack: jest.fn(),
    navigate: jest.fn(),
  }

  const defaultRoute = {
    params: {
      merchantId: 2,
      merchantName: 'Boulangerie Martin',
    },
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  const buildStore = () =>
    createTestStore({
      auth: {
        user: createTestUser({ id: 1, role: 'consumer' }),
        token: 'token',
        isAuthenticated: true,
      },
    })

  it('affiche les messages existants après chargement', async () => {
    const conversation = createTestConversation({ id: 10 })
    const merchantMessage = createTestConversationMessage({
      id: 1,
      conversation_id: conversation.id,
      sender_id: conversation.merchant_id,
      content: 'Bonjour et bienvenue !',
      sender: {
        id: conversation.merchant_id,
        first_name: 'Jean',
        last_name: 'Dupont',
        photo_url: null,
        role: 'merchant',
      },
    })
    const consumerMessage = createTestConversationMessage({
      id: 2,
      conversation_id: conversation.id,
      sender_id: conversation.consumer_id,
      content: 'Merci pour votre réponse !',
      sender: {
        id: conversation.consumer_id,
        first_name: 'Test',
        last_name: 'User',
        photo_url: null,
        role: 'consumer',
      },
    })

    messagingService.ensureConversation.mockResolvedValue({
      success: true,
      data: {
        conversation,
        messages: [merchantMessage, consumerMessage],
      },
    })

    const { findByText } = renderWithProviders(
      <MerchantMessagingScreen route={defaultRoute} navigation={navigation} />,
      { store: buildStore() }
    )

    expect(await findByText('Bonjour et bienvenue !')).toBeTruthy()
    expect(await findByText('Merci pour votre réponse !')).toBeTruthy()
    expect(messagingService.ensureConversation).toHaveBeenCalledWith(
      expect.objectContaining({ merchantId: 2, perPage: 50 })
    )
  })

  it('envoie un nouveau message et l\'ajoute à la conversation', async () => {
    const conversation = createTestConversation({ id: 20, messages_count: 0 })

    messagingService.ensureConversation.mockResolvedValue({
      success: true,
      data: {
        conversation,
        messages: [],
      },
    })

    const newMessage = createTestConversationMessage({
      id: 5,
      conversation_id: conversation.id,
      sender_id: conversation.consumer_id,
      content: 'Pouvez-vous confirmer ma réservation ?',
      sender: {
        id: conversation.consumer_id,
        first_name: 'Test',
        last_name: 'User',
        photo_url: null,
        role: 'consumer',
      },
    })

    messagingService.sendMessage.mockResolvedValue({
      success: true,
      data: {
        conversation,
        message: newMessage,
      },
    })

    const { getByPlaceholderText, getByText, findByText } = renderWithProviders(
      <MerchantMessagingScreen route={defaultRoute} navigation={navigation} />,
      { store: buildStore() }
    )

    const input = await waitFor(() => getByPlaceholderText('Écrivez votre message…'))
    fireEvent.changeText(input, 'Pouvez-vous confirmer ma réservation ?')

    const sendButton = getByText('Envoyer')
    fireEvent.press(sendButton)

    await waitFor(() => {
      expect(messagingService.sendMessage).toHaveBeenCalledWith(
        conversation.id,
        'Pouvez-vous confirmer ma réservation ?'
      )
    })

    expect(await findByText('Pouvez-vous confirmer ma réservation ?')).toBeTruthy()
  })
})
