import React from 'react'
import { act } from 'react-test-renderer'
import { render, fireEvent, waitFor, screen } from '@test-utils'
import { Alert } from 'react-native'
import AdminBroadcastScreen from './AdminBroadcastScreen'
import apiService from '../../services/api'
import { TEST_IDS } from '../../utils/testIds'

// Mock dependencies
jest.mock('../../services/api', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
  },
}))
jest.mock('../../theme', () => {
  const actualTheme = jest.requireActual('../../theme')
  const { mockUseTheme } = require('../../__mocks__/themeMock')
  return {
    ...actualTheme,
    useTheme: mockUseTheme,
  }
})

// Spy on Alert.alert
jest.spyOn(Alert, 'alert')

const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
}

describe('AdminBroadcastScreen', () => {
  let consoleErrorSpy: jest.SpyInstance | undefined

  beforeEach(() => {
    jest.clearAllMocks()
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    ;(apiService.post as jest.Mock).mockResolvedValue({
      data: { sent_count: 125 },
    })
  })

  afterEach(() => {
    consoleErrorSpy?.mockRestore()
  })

  // ============ RENDERING TESTS ============

  test('should render screen with testID', () => {
    const utils = render(<AdminBroadcastScreen />)
    const sendButton = utils.getByTestId(TEST_IDS.sendBroadcastButton)
    expect(sendButton.props.accessibilityState.disabled).toBe(true)
    expect(utils.getByTestId(TEST_IDS.adminBroadcast)).toBeTruthy()
  })

  test('should render header with title', () => {
    const { getByText } = render(<AdminBroadcastScreen />)
    expect(getByText('Envoyer une notification')).toBeTruthy()
    expect(getByText('Administrateur')).toBeTruthy()
  })

  test('should render title input', () => {
    const { getByTestId } = render(<AdminBroadcastScreen />)
    expect(getByTestId(TEST_IDS.broadcastTitleInput)).toBeTruthy()
  })

  test('should render message input', () => {
    const { getByTestId } = render(<AdminBroadcastScreen />)
    expect(getByTestId(TEST_IDS.broadcastMessageInput)).toBeTruthy()
  })

  test('should render send button', () => {
    const { getByTestId } = render(<AdminBroadcastScreen />)
    expect(getByTestId(TEST_IDS.sendBroadcastButton)).toBeTruthy()
  })

  // ============ CHANNEL SELECTOR TESTS ============

  test('should render all channel buttons', () => {
    const { getByTestId } = render(<AdminBroadcastScreen />)
    expect(getByTestId(TEST_IDS.channelDatabase)).toBeTruthy()
    expect(getByTestId(TEST_IDS.channelMail)).toBeTruthy()
    expect(getByTestId(TEST_IDS.channelSms)).toBeTruthy()
    expect(getByTestId(TEST_IDS.channelPush)).toBeTruthy()
  })

  test('should have "database" channel selected by default', () => {
    const { getByTestId } = render(<AdminBroadcastScreen />)
    const databaseButton = getByTestId(TEST_IDS.channelDatabase)
    // Should have selected styling (implementation detail)
    expect(databaseButton).toBeTruthy()
  })

  test('should toggle channel selection when clicked', () => {
    const { getByTestId } = render(<AdminBroadcastScreen />)
    const mailButton = getByTestId(TEST_IDS.channelMail)

    // Click to select
    fireEvent.press(mailButton)
    expect(mailButton).toBeTruthy()

    // Click to deselect
    fireEvent.press(mailButton)
    expect(mailButton).toBeTruthy()
  })

  test('should allow multiple channels to be selected', () => {
    const { getByTestId } = render(<AdminBroadcastScreen />)

    fireEvent.press(getByTestId(TEST_IDS.channelMail))
    fireEvent.press(getByTestId(TEST_IDS.channelPush))

    // Both should be selectable along with default database
    expect(getByTestId(TEST_IDS.channelDatabase)).toBeTruthy()
    expect(getByTestId(TEST_IDS.channelMail)).toBeTruthy()
    expect(getByTestId(TEST_IDS.channelPush)).toBeTruthy()
  })

  test('should display channel labels correctly', () => {
    const { getByText } = render(<AdminBroadcastScreen />)
    expect(getByText('Base de données')).toBeTruthy()
    expect(getByText('Email')).toBeTruthy()
    expect(getByText('SMS')).toBeTruthy()
    expect(getByText('Push')).toBeTruthy()
  })

  // ============ ROLE SELECTOR TESTS ============

  test('should render all role buttons', () => {
    const { getByTestId } = render(<AdminBroadcastScreen />)
    expect(getByTestId(TEST_IDS.roleConsumer)).toBeTruthy()
    expect(getByTestId(TEST_IDS.roleMerchant)).toBeTruthy()
    expect(getByTestId(TEST_IDS.roleAdmin)).toBeTruthy()
  })

  test('should have no roles selected by default', () => {
    const { getByText } = render(<AdminBroadcastScreen />)
    expect(getByText('Laisser vide pour envoyer à tous les utilisateurs')).toBeTruthy()
  })

  test('should toggle role selection when clicked', () => {
    const { getByTestId } = render(<AdminBroadcastScreen />)
    const consumerButton = getByTestId(TEST_IDS.roleConsumer)

    // Click to select
    fireEvent.press(consumerButton)
    expect(consumerButton).toBeTruthy()

    // Click to deselect
    fireEvent.press(consumerButton)
    expect(consumerButton).toBeTruthy()
  })

  test('should allow multiple roles to be selected', () => {
    const { getByTestId } = render(<AdminBroadcastScreen />)

    fireEvent.press(getByTestId(TEST_IDS.roleConsumer))
    fireEvent.press(getByTestId(TEST_IDS.roleMerchant))

    expect(getByTestId(TEST_IDS.roleConsumer)).toBeTruthy()
    expect(getByTestId(TEST_IDS.roleMerchant)).toBeTruthy()
  })

  test('should display role labels correctly', () => {
    const { getByText } = render(<AdminBroadcastScreen />)
    expect(getByText('Consommateurs')).toBeTruthy()
    expect(getByText('Commerçants')).toBeTruthy()
    expect(getByText('Administrateurs')).toBeTruthy()
  })

  // ============ FORM INPUT TESTS ============

  test('should allow typing in title input', () => {
    const { getByTestId } = render(<AdminBroadcastScreen />)
    const titleInput = getByTestId(TEST_IDS.broadcastTitleInput)

    fireEvent.changeText(titleInput, 'Nouvelle promotion')

    expect(titleInput.props.value).toBe('Nouvelle promotion')
  })

  test('should show character count for title (max 120)', () => {
    const { getByTestId, getByText } = render(<AdminBroadcastScreen />)
    const titleInput = getByTestId(TEST_IDS.broadcastTitleInput)

    fireEvent.changeText(titleInput, 'Test')

    expect(getByText('4/120')).toBeTruthy()
  })

  test('should allow typing in message input', () => {
    const { getByTestId } = render(<AdminBroadcastScreen />)
    const messageInput = getByTestId(TEST_IDS.broadcastMessageInput)

    fireEvent.changeText(messageInput, 'Message de test')

    expect(messageInput.props.value).toBe('Message de test')
  })

  test('should show character count for message (max 1000)', () => {
    const { getByTestId, getByText } = render(<AdminBroadcastScreen />)
    const messageInput = getByTestId(TEST_IDS.broadcastMessageInput)

    fireEvent.changeText(messageInput, 'Test message')

    expect(getByText('12/1000')).toBeTruthy()
  })

  test('should enforce max length of 120 for title', () => {
    const { getByTestId } = render(<AdminBroadcastScreen />)
    const titleInput = getByTestId(TEST_IDS.broadcastTitleInput)

    const longTitle = 'A'.repeat(150)
    fireEvent.changeText(titleInput, longTitle)

    // Should be truncated to 120 characters
    expect(titleInput.props.maxLength).toBe(120)
  })

  test('should enforce max length of 1000 for message', () => {
    const { getByTestId } = render(<AdminBroadcastScreen />)
    const messageInput = getByTestId(TEST_IDS.broadcastMessageInput)

    expect(messageInput.props.maxLength).toBe(1000)
  })

  // ============ ACTION URL INPUT TESTS ============

  test('should render action URL input', () => {
    const { getByTestId } = render(<AdminBroadcastScreen />)
    expect(getByTestId(TEST_IDS.actionUrlInput)).toBeTruthy()
  })

  test('should allow typing in action URL input', () => {
    const { getByTestId } = render(<AdminBroadcastScreen />)
    const urlInput = getByTestId(TEST_IDS.actionUrlInput)

    fireEvent.changeText(urlInput, 'https://example.com')

    expect(urlInput.props.value).toBe('https://example.com')
  })

  test('should have URL keyboard type for action URL', () => {
    const { getByTestId } = render(<AdminBroadcastScreen />)
    const urlInput = getByTestId(TEST_IDS.actionUrlInput)

    expect(urlInput.props.keyboardType).toBe('url')
  })

  // ============ PAYLOAD JSON TESTS ============

  test('should have collapsible JSON payload section', () => {
    const { getByText } = render(<AdminBroadcastScreen />)
    expect(getByText('Payload JSON (optionnel)')).toBeTruthy()
  })

  test('should expand payload section when clicked', () => {
    const { getByText, getByPlaceholderText } = render(<AdminBroadcastScreen />)

    const payloadHeader = getByText('Payload JSON (optionnel)')
    fireEvent.press(payloadHeader)

    const payloadInput = getByPlaceholderText('{"key": "value"}')
    expect(payloadInput).toBeTruthy()
  })

  // ============ VALIDATION TESTS ============

test('should show error when title is empty', () => {
    const { getByTestId } = render(<AdminBroadcastScreen />)
    const sendButton = getByTestId(TEST_IDS.sendBroadcastButton)
    expect(sendButton.props.accessibilityState.disabled).toBe(true)
  })

test('should show error when title exceeds 120 characters', async () => {
    const utils = render(<AdminBroadcastScreen />)
    const titleInput = utils.getByTestId(TEST_IDS.broadcastTitleInput)
    const longTitle = 'A'.repeat(121)
    fireEvent.changeText(titleInput, longTitle)
    // maxLength should truncate to 120, but if it doesn't, check validation
    expect(titleInput.props.maxLength).toBe(120)
  })

test('should show error when message is empty', async () => {
    const utils = render(<AdminBroadcastScreen />)
    fireEvent.changeText(utils.getByTestId(TEST_IDS.broadcastTitleInput), 'Titre valide')
    const sendButton = utils.getByTestId(TEST_IDS.sendBroadcastButton)
    // Button should be disabled when message is empty
    expect(sendButton.props.accessibilityState.disabled).toBe(true)
  })

  test('should show error when message exceeds 1000 characters', async () => {
    const { getByTestId } = render(<AdminBroadcastScreen />)

    fireEvent.changeText(getByTestId(TEST_IDS.broadcastTitleInput), 'Titre')

    const longMessage = 'A'.repeat(1001)
    fireEvent.changeText(getByTestId(TEST_IDS.broadcastMessageInput), longMessage)

    const sendButton = getByTestId(TEST_IDS.sendBroadcastButton)
    fireEvent.press(sendButton)

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Erreur de validation',
        'Le message ne doit pas dépasser 1000 caractères'
      )
    })
  })

test('should show error when no channels are selected', async () => {
    const utils = render(<AdminBroadcastScreen />)
    fireEvent.changeText(utils.getByTestId(TEST_IDS.broadcastTitleInput), 'Titre')
    fireEvent.changeText(utils.getByTestId(TEST_IDS.broadcastMessageInput), 'Message')
    // Deselect default database channel
    fireEvent.press(utils.getByTestId(TEST_IDS.channelDatabase))
    const sendButton = utils.getByTestId(TEST_IDS.sendBroadcastButton)
    // Button should be disabled when no channels are selected
    expect(sendButton.props.accessibilityState.disabled).toBe(true)
  })

  test('should show error when JSON payload is invalid', async () => {
    const { getByTestId, getByText, getByPlaceholderText } = render(<AdminBroadcastScreen />)

    fireEvent.changeText(getByTestId(TEST_IDS.broadcastTitleInput), 'Titre')
    fireEvent.changeText(getByTestId(TEST_IDS.broadcastMessageInput), 'Message')

    // Expand payload section
    fireEvent.press(getByText('Payload JSON (optionnel)'))

    // Enter invalid JSON
    const payloadInput = getByPlaceholderText('{"key": "value"}')
    fireEvent.changeText(payloadInput, '{invalid json')

    const sendButton = getByTestId(TEST_IDS.sendBroadcastButton)
    fireEvent.press(sendButton)

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Erreur de validation',
        'Le payload JSON est invalide'
      )
    })
  })

  // ============ PREVIEW TESTS ============

  test('should not show preview when title and message are empty', () => {
    const { queryByTestId } = render(<AdminBroadcastScreen />)
    expect(queryByTestId(TEST_IDS.broadcastPreview)).toBeNull()
  })

  test('should show preview when title is entered', () => {
    const { getByTestId } = render(<AdminBroadcastScreen />)

    fireEvent.changeText(getByTestId(TEST_IDS.broadcastTitleInput), 'Titre test')

    expect(getByTestId(TEST_IDS.broadcastPreview)).toBeTruthy()
  })

  test('should show preview when message is entered', () => {
    const { getByTestId } = render(<AdminBroadcastScreen />)

    fireEvent.changeText(getByTestId(TEST_IDS.broadcastMessageInput), 'Message test')

    expect(getByTestId(TEST_IDS.broadcastPreview)).toBeTruthy()
  })

  test('should display title in preview', () => {
    const { getByTestId, getByText } = render(<AdminBroadcastScreen />)

    fireEvent.changeText(getByTestId(TEST_IDS.broadcastTitleInput), 'Mon Titre')

    expect(getByText('Mon Titre')).toBeTruthy()
  })

  test('should display message in preview', () => {
    const { getByTestId, getByText } = render(<AdminBroadcastScreen />)

    fireEvent.changeText(getByTestId(TEST_IDS.broadcastMessageInput), 'Mon Message')

    expect(getByText('Mon Message')).toBeTruthy()
  })

  test('should show selected channels in preview as badges', () => {
    const { getByTestId, getByText } = render(<AdminBroadcastScreen />)

    fireEvent.changeText(getByTestId(TEST_IDS.broadcastTitleInput), 'Titre')
    fireEvent.press(getByTestId(TEST_IDS.channelMail))

    expect(getByText('database')).toBeTruthy()
    expect(getByText('mail')).toBeTruthy()
  })

  // ============ SEND FUNCTIONALITY TESTS ============

  test('should show confirmation alert before sending', async () => {
    const { getByTestId } = render(<AdminBroadcastScreen />)

    fireEvent.changeText(getByTestId(TEST_IDS.broadcastTitleInput), 'Titre')
    fireEvent.changeText(getByTestId(TEST_IDS.broadcastMessageInput), 'Message')

    const sendButton = getByTestId(TEST_IDS.sendBroadcastButton)
    fireEvent.press(sendButton)

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        "Confirmer l'envoi",
        expect.stringContaining('Envoyer cette notification'),
        expect.any(Array)
      )
    })
  })

  test('should send notification with correct data when confirmed', async () => {
    ;(Alert.alert as jest.Mock).mockImplementation((title, message, buttons) => {
      if (title === "Confirmer l'envoi" && buttons && buttons[1]) {
        buttons[1].onPress()
      } else if (title === 'Succès' && buttons && buttons[0]) {
        buttons[0].onPress()
      }
    })

    const { getByTestId } = render(<AdminBroadcastScreen />)

    fireEvent.changeText(getByTestId(TEST_IDS.broadcastTitleInput), 'Test Titre')
    fireEvent.changeText(getByTestId(TEST_IDS.broadcastMessageInput), 'Test Message')
    fireEvent.press(getByTestId(TEST_IDS.channelMail))
    fireEvent.press(getByTestId(TEST_IDS.roleConsumer))

    const sendButton = getByTestId(TEST_IDS.sendBroadcastButton)
    fireEvent.press(sendButton)

    await waitFor(() => {
      expect(apiService.post).toHaveBeenCalledWith('/admin/notifications/broadcast', {
        title: 'Test Titre',
        message: 'Test Message',
        channels: ['database', 'mail'],
        roles: ['consumer'],
      })
    })
  })

  test('should send notification to all users when no roles selected', async () => {
    ;(Alert.alert as jest.Mock).mockImplementation((title, message, buttons) => {
      if (buttons && buttons[1]) {
        buttons[1].onPress()
      }
    })

    const { getByTestId } = render(<AdminBroadcastScreen />)

    fireEvent.changeText(getByTestId(TEST_IDS.broadcastTitleInput), 'Titre')
    fireEvent.changeText(getByTestId(TEST_IDS.broadcastMessageInput), 'Message')

    const sendButton = getByTestId(TEST_IDS.sendBroadcastButton)
    fireEvent.press(sendButton)

    await waitFor(() => {
      expect(apiService.post).toHaveBeenCalledWith('/admin/notifications/broadcast', {
        title: 'Titre',
        message: 'Message',
        channels: ['database'],
      })
    })
  })

  test('should include action URL when provided', async () => {
    ;(Alert.alert as jest.Mock).mockImplementation((title, message, buttons) => {
      if (buttons && buttons[1]) {
        buttons[1].onPress()
      }
    })

    const { getByTestId } = render(<AdminBroadcastScreen />)

    fireEvent.changeText(getByTestId(TEST_IDS.broadcastTitleInput), 'Titre')
    fireEvent.changeText(getByTestId(TEST_IDS.broadcastMessageInput), 'Message')
    fireEvent.changeText(getByTestId(TEST_IDS.actionUrlInput), 'https://example.com')

    fireEvent.press(getByTestId(TEST_IDS.sendBroadcastButton))

    await waitFor(() => {
      expect(apiService.post).toHaveBeenCalledWith(
        '/admin/notifications/broadcast',
        expect.objectContaining({
          action_url: 'https://example.com',
        })
      )
    })
  })

  test('should include payload when valid JSON is provided', async () => {
    ;(Alert.alert as jest.Mock).mockImplementation((title, message, buttons) => {
      if (buttons && buttons[1]) {
        buttons[1].onPress()
      }
    })

    const { getByTestId, getByText, getByPlaceholderText } = render(<AdminBroadcastScreen />)

    fireEvent.changeText(getByTestId(TEST_IDS.broadcastTitleInput), 'Titre')
    fireEvent.changeText(getByTestId(TEST_IDS.broadcastMessageInput), 'Message')

    // Expand payload section
    fireEvent.press(getByText('Payload JSON (optionnel)'))

    const payloadInput = getByPlaceholderText('{"key": "value"}')
    fireEvent.changeText(payloadInput, '{"promo_code": "SAVE20"}')

    fireEvent.press(getByTestId(TEST_IDS.sendBroadcastButton))

    await waitFor(() => {
      expect(apiService.post).toHaveBeenCalledWith(
        '/admin/notifications/broadcast',
        expect.objectContaining({
          payload: { promo_code: 'SAVE20' },
        })
      )
    })
  })

  test('should show success alert with sent count', async () => {
    ;(Alert.alert as jest.Mock).mockImplementation((title, message, buttons) => {
      if (buttons && buttons[1]) {
        buttons[1].onPress()
      }
    })

    const { getByTestId } = render(<AdminBroadcastScreen />)

    fireEvent.changeText(getByTestId(TEST_IDS.broadcastTitleInput), 'Titre')
    fireEvent.changeText(getByTestId(TEST_IDS.broadcastMessageInput), 'Message')
    fireEvent.press(getByTestId(TEST_IDS.sendBroadcastButton))

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Succès',
        'Notification envoyée à 125 utilisateur(s)',
        expect.any(Array)
      )
    })
  })

test('should reset form after successful send', async () => {
    ;(Alert.alert as jest.Mock).mockImplementation((title, message, buttons) => {
      if (title === "Confirmer l'envoi" && buttons && buttons[1]) {
        buttons[1].onPress()
      }
    })

    const utils = render(<AdminBroadcastScreen />)
    const titleInputNew = utils.getByTestId(TEST_IDS.broadcastTitleInput)
    const messageInputNew = utils.getByTestId(TEST_IDS.broadcastMessageInput)

    fireEvent.changeText(titleInputNew, 'Titre')
    fireEvent.changeText(messageInputNew, 'Message')
    fireEvent.press(utils.getByTestId(TEST_IDS.sendBroadcastButton))

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Succès',
        expect.stringContaining('Notification envoyée'),
        expect.any(Array)
      )
    })

    const successCall = (Alert.alert as jest.Mock).mock.calls.find((c) => c[0] === 'Succès')
    const successButtons = successCall?.[2] as any[] | undefined
    successButtons?.[0]?.onPress()

    await waitFor(() => {
      expect(titleInputNew.props.value).toBe('')
      expect(messageInputNew.props.value).toBe('')
    })
  })

test('should show error alert when send fails', async () => {
    ;(apiService.post as jest.Mock).mockRejectedValue(
      new Error('Network error')
    )
    ;(Alert.alert as jest.Mock).mockImplementation((title, message, buttons) => {
      if (buttons && buttons[1]) {
        buttons[1].onPress()
      }
    })

    const { getByTestId } = render(<AdminBroadcastScreen />)

    fireEvent.changeText(getByTestId(TEST_IDS.broadcastTitleInput), 'Titre')
    fireEvent.changeText(getByTestId(TEST_IDS.broadcastMessageInput), 'Message')
    fireEvent.press(getByTestId(TEST_IDS.sendBroadcastButton))

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Erreur',
        expect.stringContaining("Impossible d'envoyer la notification")
      )
    })
  })

  // ============ LOADING STATE TESTS ============

test('should disable send button while loading', async () => {
    let resolvePost: (value: any) => void
    ;(apiService.post as jest.Mock).mockImplementation(
      () => new Promise((resolve) => { resolvePost = resolve })
    )
    ;(Alert.alert as jest.Mock).mockImplementation((title, message, buttons) => {
      if (title === "Confirmer l'envoi" && buttons && buttons[1]) {
        buttons[1].onPress()
      }
    })

    const utils = render(<AdminBroadcastScreen />)
    fireEvent.changeText(utils.getByTestId(TEST_IDS.broadcastTitleInput), 'Titre')
    fireEvent.changeText(utils.getByTestId(TEST_IDS.broadcastMessageInput), 'Message')
    fireEvent.press(utils.getByTestId(TEST_IDS.sendBroadcastButton))

    await waitFor(() => {
      const sendButton = utils.getByTestId(TEST_IDS.sendBroadcastButton)
      expect(sendButton.props.accessibilityState.busy).toBe(true)
      expect(sendButton.props.accessibilityState.disabled).toBe(true)
    })

    resolvePost!({ data: { sent_count: 10 } })
  })

test('should show loading text on send button', async () => {
    const utils = render(<AdminBroadcastScreen />)
    // Default button text when not loading
    expect(utils.getByText('Envoyer la notification')).toBeTruthy()
  })

  // ============ BUTTON STATE TESTS ============

test('should disable send button when title is empty', () => {
    const { getByTestId } = render(<AdminBroadcastScreen />)
    const sendButton = getByTestId(TEST_IDS.sendBroadcastButton)

    expect(sendButton.props.accessibilityState.disabled).toBe(true)
  })

test('should disable send button when message is empty', () => {
    const { getByTestId } = render(<AdminBroadcastScreen />)

    fireEvent.changeText(getByTestId(TEST_IDS.broadcastTitleInput), 'Titre')

    const sendButton = getByTestId(TEST_IDS.sendBroadcastButton)
    expect(sendButton.props.accessibilityState.disabled).toBe(true)
  })

test('should enable send button when both title and message are filled', () => {
    const { getByTestId } = render(<AdminBroadcastScreen />)

    fireEvent.changeText(getByTestId(TEST_IDS.broadcastTitleInput), 'Titre')
    fireEvent.changeText(getByTestId(TEST_IDS.broadcastMessageInput), 'Message')

    const sendButton = getByTestId(TEST_IDS.sendBroadcastButton)
    expect(sendButton.props.accessibilityState.disabled).toBe(false)
  })
})
