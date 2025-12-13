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

// Mock the WebSocket hook to avoid connection attempts in tests
jest.mock('../../../hooks/useWebSocket', () => ({
  __esModule: true,
  default: () => ({
    isConnected: false,
    connect: jest.fn(),
    disconnect: jest.fn(),
    joinConversation: jest.fn(),
    leaveConversation: jest.fn(),
    sendTypingIndicator: jest.fn(),
  }),
}))

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
      messaging: {
        conversations: [],
        activeConversationId: null,
        messages: {},
        typingUsers: {},
        onlineUserIds: [],
        unreadCount: 0,
        loading: false,
        conversationsLoading: false,
        messagesLoading: false,
        sendingMessage: false,
        error: null,
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

    // Wait for initial load
    await waitFor(() => {
      expect(getByPlaceholderText('Écrivez votre message...')).toBeTruthy()
    })

    const input = getByPlaceholderText('Écrivez votre message...')
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

  it('affiche l\'état vide quand pas de messages', async () => {
    const conversation = createTestConversation({ id: 30, messages_count: 0 })

    messagingService.ensureConversation.mockResolvedValue({
      success: true,
      data: {
        conversation,
        messages: [],
      },
    })

    const { findByText } = renderWithProviders(
      <MerchantMessagingScreen route={defaultRoute} navigation={navigation} />,
      { store: buildStore() }
    )

    expect(await findByText('Démarrez la conversation')).toBeTruthy()
  })

  it('affiche le titre du commerçant depuis les params de route', async () => {
    const conversation = createTestConversation({ id: 40 })

    messagingService.ensureConversation.mockResolvedValue({
      success: true,
      data: {
        conversation,
        messages: [],
      },
    })

    const { findByText } = renderWithProviders(
      <MerchantMessagingScreen route={defaultRoute} navigation={navigation} />,
      { store: buildStore() }
    )

    expect(await findByText('Boulangerie Martin')).toBeTruthy()
  })

  it('navigue en arrière quand on appuie sur le bouton retour', async () => {
    const conversation = createTestConversation({ id: 50 })

    messagingService.ensureConversation.mockResolvedValue({
      success: true,
      data: {
        conversation,
        messages: [],
      },
    })

    const { findAllByRole } = renderWithProviders(
      <MerchantMessagingScreen route={defaultRoute} navigation={navigation} />,
      { store: buildStore() }
    )

    // First button is the back button in the header
    const buttons = await findAllByRole('button')
    const backButton = buttons[0]
    fireEvent.press(backButton)

    expect(navigation.goBack).toHaveBeenCalled()
  })
})
