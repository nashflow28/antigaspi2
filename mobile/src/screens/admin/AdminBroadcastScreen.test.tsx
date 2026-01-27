import React from 'react'
import { render, fireEvent, waitFor, screen } from '@test-utils'
import AdminBroadcastScreen from './AdminBroadcastScreen'
import apiService from '../../services/api'
import { TEST_IDS } from '../../utils/testIds'

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

const pressLastTextButton = (label: string) => {
  const matches = screen.getAllByText(label)
  const last = matches[matches.length - 1] as any
  fireEvent.press(last.parent)
}

describe('AdminBroadcastScreen', () => {
  let consoleErrorSpy: jest.SpyInstance | undefined

  beforeEach(() => {
    jest.clearAllMocks()
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    ;(apiService.post as jest.Mock).mockResolvedValue({ data: { sent_count: 125 } })
  })

  afterEach(() => {
    consoleErrorSpy?.mockRestore()
  })

  test('renders and disables send by default', () => {
    const { getByTestId } = render(<AdminBroadcastScreen />)
    expect(getByTestId(TEST_IDS.adminBroadcast)).toBeTruthy()
    expect(getByTestId(TEST_IDS.sendBroadcastButton).props.accessibilityState.disabled).toBe(true)
  })

  test('enables send when title and message are filled', () => {
    const { getByTestId } = render(<AdminBroadcastScreen />)

    fireEvent.changeText(getByTestId(TEST_IDS.broadcastTitleInput), 'Titre')
    fireEvent.changeText(getByTestId(TEST_IDS.broadcastMessageInput), 'Message')

    expect(getByTestId(TEST_IDS.sendBroadcastButton).props.accessibilityState.disabled).toBe(false)
  })

  test('shows validation modal when payload JSON is invalid', async () => {
    const { getByTestId, getByText, getByPlaceholderText } = render(<AdminBroadcastScreen />)

    fireEvent.changeText(getByTestId(TEST_IDS.broadcastTitleInput), 'Titre')
    fireEvent.changeText(getByTestId(TEST_IDS.broadcastMessageInput), 'Message')
    fireEvent.press(getByText('Payload JSON (optionnel)'))
    fireEvent.changeText(getByPlaceholderText('{"key": "value"}'), '{invalid json')

    fireEvent.press(getByTestId(TEST_IDS.sendBroadcastButton))

    await waitFor(() => {
      expect(screen.getByText('Erreur de validation')).toBeTruthy()
      expect(screen.getByText('Le payload JSON est invalide')).toBeTruthy()
    })
  })

  test('confirms send, posts expected payload, then resets form on OK', async () => {
    const { getByTestId, getByText, getByPlaceholderText } = render(<AdminBroadcastScreen />)

    fireEvent.changeText(getByTestId(TEST_IDS.broadcastTitleInput), 'Test Titre')
    fireEvent.changeText(getByTestId(TEST_IDS.broadcastMessageInput), 'Test Message')
    fireEvent.press(getByTestId(TEST_IDS.channelMail))
    fireEvent.press(getByTestId(TEST_IDS.roleConsumer))
    fireEvent.changeText(getByTestId(TEST_IDS.actionUrlInput), 'https://example.com')
    fireEvent.press(getByText('Payload JSON (optionnel)'))
    fireEvent.changeText(getByPlaceholderText('{"key": "value"}'), '{"promo_code": "SAVE20"}')

    fireEvent.press(getByTestId(TEST_IDS.sendBroadcastButton))

    await waitFor(() => {
      expect(screen.getByText("Confirmer l'envoi")).toBeTruthy()
    })
    pressLastTextButton('Envoyer')

    await waitFor(() => {
      expect(apiService.post).toHaveBeenCalledWith('/notifications/broadcast', {
        title: 'Test Titre',
        message: 'Test Message',
        channels: ['database', 'mail'],
        roles: ['consumer'],
        action_url: 'https://example.com',
        payload: { promo_code: 'SAVE20' },
      })
    })

    await waitFor(() => {
      expect(screen.getByText(/Notification envoy/i)).toBeTruthy()
    })
    pressLastTextButton('OK')

    await waitFor(() => {
      expect(getByTestId(TEST_IDS.broadcastTitleInput).props.value).toBe('')
      expect(getByTestId(TEST_IDS.broadcastMessageInput).props.value).toBe('')
      expect(getByTestId(TEST_IDS.sendBroadcastButton).props.accessibilityState.disabled).toBe(true)
    })
  })

  test('shows error modal when send fails', async () => {
    ;(apiService.post as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

    const { getByTestId } = render(<AdminBroadcastScreen />)

    fireEvent.changeText(getByTestId(TEST_IDS.broadcastTitleInput), 'Titre')
    fireEvent.changeText(getByTestId(TEST_IDS.broadcastMessageInput), 'Message')
    fireEvent.press(getByTestId(TEST_IDS.sendBroadcastButton))

    await waitFor(() => {
      expect(screen.getByText("Confirmer l'envoi")).toBeTruthy()
    })
    pressLastTextButton('Envoyer')

    await waitFor(() => {
      expect(screen.getByText('Erreur')).toBeTruthy()
      expect(screen.getByText(/Impossible d'envoyer la notification/i)).toBeTruthy()
    })
  })
})

