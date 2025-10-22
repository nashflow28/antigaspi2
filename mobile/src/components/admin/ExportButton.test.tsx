import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import { Alert } from 'react-native'
import ExportButton from './ExportButton'
import * as FileSystem from 'expo-file-system/legacy'
import * as Sharing from 'expo-sharing'
import apiService from '../../services/api'

// Mock dependencies
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
  return {
    useTheme: mockUseTheme,
  }
})

// Spy on Alert.alert
jest.spyOn(Alert, 'alert')

describe('ExportButton', () => {
  const mockFilters = {
    period: '30d' as const,
  }

  beforeEach(() => {
    jest.clearAllMocks()

    // Mock FileSystem.documentDirectory
    Object.defineProperty(FileSystem, 'documentDirectory', {
      value: 'file:///data/user/0/com.app/files/',
      writable: true,
    })

    // Mock FileSystem methods
    ;(FileSystem.writeAsStringAsync as jest.Mock).mockResolvedValue(undefined)
    ;(FileSystem.downloadAsync as jest.Mock).mockResolvedValue({ status: 200 })

    // Mock Sharing methods
    ;(Sharing.isAvailableAsync as jest.Mock).mockResolvedValue(true)
    ;(Sharing.shareAsync as jest.Mock).mockResolvedValue(undefined)

    // Mock API responses
    ;(apiService.exportAnalytics as jest.Mock).mockResolvedValue({
      file_content: 'base64content',
    })
  })

  // ============ RENDERING TESTS ============

  test('should render CSV export button', () => {
    const { getByText } = render(<ExportButton format="csv" />)
    expect(getByText('CSV')).toBeTruthy()
  })

  test('should render PDF export button', () => {
    const { getByText } = render(<ExportButton format="pdf" />)
    expect(getByText('PDF')).toBeTruthy()
  })

  test('should render with correct testID for CSV', () => {
    const { getByTestId } = render(<ExportButton format="csv" />)
    expect(getByTestId('export-csv-button')).toBeTruthy()
  })

  test('should render with correct testID for PDF', () => {
    const { getByTestId } = render(<ExportButton format="pdf" />)
    expect(getByTestId('export-pdf-button')).toBeTruthy()
  })

  // ============ BUG-001 FIX VERIFICATION ============

  test('should handle null FileSystem.documentDirectory gracefully', async () => {
    // BUG-001: Test the fix for null documentDirectory
    Object.defineProperty(FileSystem, 'documentDirectory', {
      value: null,
      writable: true,
    })

    const { getByTestId } = render(<ExportButton format="csv" />)
    const button = getByTestId('export-csv-button')

    fireEvent.press(button)

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        "Erreur d'export",
        "Le système de fichiers n'est pas disponible sur cet appareil"
      )
    })

    // Ensure API was not called
    expect(apiService.exportAnalytics).not.toHaveBeenCalled()
  })

  test('should handle undefined FileSystem.documentDirectory gracefully', async () => {
    Object.defineProperty(FileSystem, 'documentDirectory', {
      value: undefined,
      writable: true,
    })

    const { getByTestId } = render(<ExportButton format="csv" />)
    fireEvent.press(getByTestId('export-csv-button'))

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        "Erreur d'export",
        expect.stringContaining("système de fichiers")
      )
    })
  })

  // ============ EXPORT FUNCTIONALITY TESTS ============

  test('should call API with correct format (CSV)', async () => {
    const { getByTestId } = render(<ExportButton format="csv" filters={mockFilters} />)
    const button = getByTestId('export-csv-button')

    fireEvent.press(button)

    await waitFor(() => {
      expect(apiService.exportAnalytics).toHaveBeenCalledWith('csv', mockFilters)
    })
  })

  test('should call API with correct format (PDF)', async () => {
    const { getByTestId } = render(<ExportButton format="pdf" filters={mockFilters} />)
    const button = getByTestId('export-pdf-button')

    fireEvent.press(button)

    await waitFor(() => {
      expect(apiService.exportAnalytics).toHaveBeenCalledWith('pdf', mockFilters)
    })
  })

  test('should handle base64 file content export', async () => {
    ;(apiService.exportAnalytics as jest.Mock).mockResolvedValue({
      file_content: 'base64encodedcontent',
    })

    const { getByTestId } = render(<ExportButton format="csv" />)
    fireEvent.press(getByTestId('export-csv-button'))

    await waitFor(() => {
      expect(FileSystem.writeAsStringAsync).toHaveBeenCalledWith(
        expect.stringContaining('analytics-'),
        'base64encodedcontent',
        { encoding: 'base64' }
      )
    })
  })

  test('should handle file URL export with download', async () => {
    ;(apiService.exportAnalytics as jest.Mock).mockResolvedValue({
      file_url: 'https://example.com/export.csv',
    })

    const { getByTestId } = render(<ExportButton format="csv" />)
    fireEvent.press(getByTestId('export-csv-button'))

    await waitFor(() => {
      expect(FileSystem.downloadAsync).toHaveBeenCalledWith(
        'https://example.com/export.csv',
        expect.stringContaining('analytics-')
      )
    })
  })

  test('should show error when no export data received', async () => {
    ;(apiService.exportAnalytics as jest.Mock).mockResolvedValue({
      // No file_content or file_url
    })

    const { getByTestId } = render(<ExportButton format="csv" />)
    fireEvent.press(getByTestId('export-csv-button'))

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        "Erreur d'export",
        'No export data received from server'
      )
    })
  })

  test('should show error when download fails', async () => {
    ;(apiService.exportAnalytics as jest.Mock).mockResolvedValue({
      file_url: 'https://example.com/export.csv',
    })
    ;(FileSystem.downloadAsync as jest.Mock).mockResolvedValue({ status: 404 })

    const { getByTestId } = render(<ExportButton format="csv" />)
    fireEvent.press(getByTestId('export-csv-button'))

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        "Erreur d'export",
        'Failed to download export file'
      )
    })
  })

  // ============ SHARING FUNCTIONALITY TESTS ============

  test('should check if sharing is available', async () => {
    const { getByTestId } = render(<ExportButton format="csv" />)
    fireEvent.press(getByTestId('export-csv-button'))

    await waitFor(() => {
      expect(Sharing.isAvailableAsync).toHaveBeenCalled()
    })
  })

  test('should show error when sharing is not available', async () => {
    ;(Sharing.isAvailableAsync as jest.Mock).mockResolvedValue(false)

    const { getByTestId } = render(<ExportButton format="csv" />)
    fireEvent.press(getByTestId('export-csv-button'))

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Erreur',
        "Le partage de fichiers n'est pas disponible sur cet appareil"
      )
    })
  })

  test('should share file with correct MIME type for CSV', async () => {
    const { getByTestId } = render(<ExportButton format="csv" />)
    fireEvent.press(getByTestId('export-csv-button'))

    await waitFor(() => {
      expect(Sharing.shareAsync).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          mimeType: 'text/csv',
          dialogTitle: 'Exporter les analytics (CSV)',
          UTI: 'public.comma-separated-values-text',
        })
      )
    })
  })

  test('should share file with correct MIME type for PDF', async () => {
    const { getByTestId } = render(<ExportButton format="pdf" />)
    fireEvent.press(getByTestId('export-pdf-button'))

    await waitFor(() => {
      expect(Sharing.shareAsync).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          mimeType: 'application/pdf',
          dialogTitle: 'Exporter les analytics (PDF)',
          UTI: 'com.adobe.pdf',
        })
      )
    })
  })

  test('should show success alert after successful export', async () => {
    const { getByTestId } = render(<ExportButton format="csv" />)
    fireEvent.press(getByTestId('export-csv-button'))

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Succès', 'Rapport CSV exporté avec succès')
    })
  })

  // ============ CALLBACK TESTS ============

  test('should call onExportStart callback', async () => {
    const onExportStart = jest.fn()
    const { getByTestId } = render(<ExportButton format="csv" onExportStart={onExportStart} />)

    fireEvent.press(getByTestId('export-csv-button'))

    await waitFor(() => {
      expect(onExportStart).toHaveBeenCalled()
    })
  })

  test('should call onExportComplete callback on success', async () => {
    const onExportComplete = jest.fn()
    const { getByTestId } = render(
      <ExportButton format="csv" onExportComplete={onExportComplete} />
    )

    fireEvent.press(getByTestId('export-csv-button'))

    await waitFor(() => {
      expect(onExportComplete).toHaveBeenCalled()
    })
  })

  test('should call onExportError callback on failure', async () => {
    const onExportError = jest.fn()
    ;(apiService.exportAnalytics as jest.Mock).mockRejectedValue(new Error('Network error'))

    const { getByTestId } = render(<ExportButton format="csv" onExportError={onExportError} />)

    fireEvent.press(getByTestId('export-csv-button'))

    await waitFor(() => {
      expect(onExportError).toHaveBeenCalledWith(expect.any(String))
    })
  })

  // ============ LOADING STATE TESTS ============

  test('should disable button while loading', async () => {
    ;(apiService.exportAnalytics as jest.Mock).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ file_content: 'test' }), 100))
    )

    const { getByTestId } = render(<ExportButton format="csv" />)
    const button = getByTestId('export-csv-button')

    fireEvent.press(button)

    // Button should be disabled during loading
    expect(button.props.disabled).toBe(true)
  })

  test('should re-enable button after export completes', async () => {
    const { getByTestId } = render(<ExportButton format="csv" />)
    const button = getByTestId('export-csv-button')

    fireEvent.press(button)

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Succès', expect.any(String))
    })

    // Button should be enabled again
    expect(button.props.disabled).toBe(false)
  })

  // ============ FILENAME GENERATION TESTS ============

  test('should generate filename with timestamp and CSV extension', async () => {
    const { getByTestId } = render(<ExportButton format="csv" />)
    fireEvent.press(getByTestId('export-csv-button'))

    await waitFor(() => {
      expect(FileSystem.writeAsStringAsync).toHaveBeenCalledWith(
        expect.stringMatching(/analytics-.*\.csv$/),
        expect.any(String),
        expect.any(Object)
      )
    })
  })

  test('should generate filename with timestamp and PDF extension', async () => {
    const { getByTestId } = render(<ExportButton format="pdf" />)
    fireEvent.press(getByTestId('export-pdf-button'))

    await waitFor(() => {
      expect(FileSystem.writeAsStringAsync).toHaveBeenCalledWith(
        expect.stringMatching(/analytics-.*\.pdf$/),
        expect.any(String),
        expect.any(Object)
      )
    })
  })

  // ============ ERROR HANDLING TESTS ============

  test('should handle API error gracefully', async () => {
    ;(apiService.exportAnalytics as jest.Mock).mockRejectedValue({
      response: { data: { message: 'Server error' } },
    })

    const { getByTestId } = render(<ExportButton format="csv" />)
    fireEvent.press(getByTestId('export-csv-button'))

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith("Erreur d'export", 'Server error')
    })
  })

  test('should show generic error message when no specific error', async () => {
    ;(apiService.exportAnalytics as jest.Mock).mockRejectedValue(new Error())

    const { getByTestId } = render(<ExportButton format="pdf" />)
    fireEvent.press(getByTestId('export-pdf-button'))

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        "Erreur d'export",
        "Impossible d'exporter en PDF"
      )
    })
  })
})
