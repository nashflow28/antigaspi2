import React from 'react'
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native'
import ExportButton from './ExportButton'
import * as FileSystem from 'expo-file-system/legacy'
import * as Sharing from 'expo-sharing'
import apiService from '../../services/api'

jest.mock('expo-file-system/legacy')
jest.mock('expo-sharing')
jest.mock('../../services/api', () => ({
  __esModule: true,
  default: {
    exportAnalytics: jest.fn(),
  },
}))
jest.mock('../../theme', () => {
  const { mockUseTheme } = require('../../__mocks__/themeMock')
  return { useTheme: mockUseTheme }
})

const pressLastTextButton = (label: string) => {
  const matches = screen.getAllByText(label)
  const last = matches[matches.length - 1] as any
  fireEvent.press(last.parent)
}

const expectAlertModal = async (titleMatcher: string | RegExp, messageMatcher?: string | RegExp) => {
  await waitFor(() => {
    expect(screen.getByText(titleMatcher as any)).toBeTruthy()
    if (messageMatcher) {
      expect(screen.getByText(messageMatcher as any)).toBeTruthy()
    }
  })
}

describe('ExportButton', () => {
  const mockFilters = { period: '30d' as const }

  let consoleLogSpy: jest.SpyInstance | undefined
  let consoleErrorSpy: jest.SpyInstance | undefined

  beforeEach(() => {
    jest.clearAllMocks()
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {})
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    Object.defineProperty(FileSystem, 'documentDirectory', {
      value: 'file:///data/user/0/com.app/files/',
      writable: true,
    })

    ;(FileSystem.writeAsStringAsync as jest.Mock).mockResolvedValue(undefined)
    ;(FileSystem.downloadAsync as jest.Mock).mockResolvedValue({ status: 200 })
    ;(Sharing.isAvailableAsync as jest.Mock).mockResolvedValue(true)
    ;(Sharing.shareAsync as jest.Mock).mockResolvedValue(undefined)

    ;(apiService.exportAnalytics as jest.Mock).mockResolvedValue({
      file_content: 'base64content',
    })
  })

  afterEach(() => {
    consoleLogSpy?.mockRestore()
    consoleErrorSpy?.mockRestore()
  })

  test('renders CSV and PDF buttons', () => {
    render(
      <>
        <ExportButton format="csv" />
        <ExportButton format="pdf" />
      </>
    )
    expect(screen.getByText('CSV')).toBeTruthy()
    expect(screen.getByText('PDF')).toBeTruthy()
  })

  test('calls API with correct format and filters', async () => {
    render(<ExportButton format="csv" filters={mockFilters} />)
    fireEvent.press(screen.getByTestId('export-csv-button'))

    await waitFor(() => {
      expect(apiService.exportAnalytics).toHaveBeenCalledWith('csv', mockFilters)
    })
  })

  test('shows error when FileSystem.documentDirectory is null', async () => {
    Object.defineProperty(FileSystem, 'documentDirectory', { value: null, writable: true })

    render(<ExportButton format="csv" />)
    fireEvent.press(screen.getByTestId('export-csv-button'))

    await expectAlertModal(/Erreur d'export/i, /syst/i)
    expect(apiService.exportAnalytics).not.toHaveBeenCalled()
  })

  test('shows error when server returns no export data', async () => {
    ;(apiService.exportAnalytics as jest.Mock).mockResolvedValueOnce({})

    render(<ExportButton format="csv" />)
    fireEvent.press(screen.getByTestId('export-csv-button'))

    await expectAlertModal(/Erreur d'export/i, /No export data received/i)
  })

  test('downloads file when file_url is provided', async () => {
    ;(apiService.exportAnalytics as jest.Mock).mockResolvedValueOnce({
      file_url: 'https://example.com/analytics.csv',
    })

    render(<ExportButton format="csv" />)
    fireEvent.press(screen.getByTestId('export-csv-button'))

    await waitFor(() => {
      expect(FileSystem.downloadAsync).toHaveBeenCalled()
      expect(Sharing.shareAsync).toHaveBeenCalled()
    })
  })

  test('shows error when download fails', async () => {
    ;(apiService.exportAnalytics as jest.Mock).mockResolvedValueOnce({
      file_url: 'https://example.com/analytics.csv',
    })
    ;(FileSystem.downloadAsync as jest.Mock).mockResolvedValueOnce({ status: 500 })

    render(<ExportButton format="csv" />)
    fireEvent.press(screen.getByTestId('export-csv-button'))

    await expectAlertModal(/Erreur d'export/i, /download/i)
  })

  test('shows error when sharing is not available', async () => {
    ;(Sharing.isAvailableAsync as jest.Mock).mockResolvedValueOnce(false)

    render(<ExportButton format="csv" />)
    fireEvent.press(screen.getByTestId('export-csv-button'))

    await expectAlertModal(/Erreur/i, /partage de fichiers/i)
  })

  test('shows success modal after successful export', async () => {
    render(<ExportButton format="csv" />)
    fireEvent.press(screen.getByTestId('export-csv-button'))

    await expectAlertModal('Succès', /Rapport CSV/i)
  })

  test('calls callbacks on success and failure', async () => {
    const onExportStart = jest.fn()
    const onExportComplete = jest.fn()
    const onExportError = jest.fn()

    render(
      <ExportButton
        format="csv"
        onExportStart={onExportStart}
        onExportComplete={onExportComplete}
        onExportError={onExportError}
      />
    )

    fireEvent.press(screen.getByTestId('export-csv-button'))
    await waitFor(() => {
      expect(onExportStart).toHaveBeenCalled()
      expect(onExportComplete).toHaveBeenCalled()
    })
    pressLastTextButton('OK')

    ;(apiService.exportAnalytics as jest.Mock).mockRejectedValueOnce({
      response: { data: { message: 'Server error' } },
    })

    fireEvent.press(screen.getByTestId('export-csv-button'))
    await expectAlertModal(/Erreur d'export/i, 'Server error')
    await waitFor(() => {
      expect(onExportError).toHaveBeenCalledWith('Server error')
    })
  })
})
