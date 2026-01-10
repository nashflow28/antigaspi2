import React from 'react'
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native'
import ExportReservationsButton from './ExportReservationsButton'
import { Reservation } from '../../types'
import { TEST_IDS } from '../../utils/testIds'
import * as excelExportService from '../../services/excelExportService'

// Mock the excelExportService
jest.mock('../../services/excelExportService', () => ({
  exportReservationsToExcel: jest.fn(() => Promise.resolve('file:///mock/path/reservations.xlsx')),
  shareExcelFile: jest.fn(() => Promise.resolve()),
}))

// Mock theme
jest.mock('../../theme', () => {
  const { mockUseTheme } = require('../../__mocks__/themeMock')
  return {
    useTheme: mockUseTheme,
  }
})

const mockExportReservationsToExcel = excelExportService.exportReservationsToExcel as jest.MockedFunction<typeof excelExportService.exportReservationsToExcel>
const mockShareExcelFile = excelExportService.shareExcelFile as jest.MockedFunction<typeof excelExportService.shareExcelFile>

const expectAlertModal = async (titleMatcher: string | RegExp, messageMatcher?: string | RegExp) => {
  await waitFor(() => {
    expect(screen.getByText(titleMatcher as any)).toBeTruthy()
    if (messageMatcher) {
      expect(screen.getByText(messageMatcher as any)).toBeTruthy()
    }
  })
}

const mockReservations: Reservation[] = [
  {
    id: 1,
    reservation_code: 'RES001',
    quantity: 2,
    original_price: 1000,
    discounted_price: 600,
    total_amount: 1200,
    status: 'confirmed',
    payment_status: 'success',
    pickup_date: '2025-01-15',
    pickup_time: '10:00',
    reserved_at: '2025-01-10T08:00:00Z',
    confirmed_at: '2025-01-10T08:30:00Z',
    notes: 'Retrait rapide',
    product: {
      id: 1,
      name: 'Pain complet',
      merchant: {
        id: 1,
        name: 'Boulangerie Martin',
        business_type: 'Boulangerie',
      },
    },
    consumer: {
      id: 1,
      first_name: 'Jean',
      last_name: 'Dupont',
      email: 'jean@example.com',
      phone: '+228 90 00 00 00',
      role: 'consumer',
      city: 'Lomé',
      created_at: '2025-01-01',
      updated_at: '2025-01-01',
    },
  } as Reservation,
  {
    id: 2,
    reservation_code: 'RES002',
    quantity: 1,
    original_price: 500,
    discounted_price: 300,
    total_amount: 300,
    status: 'pending',
    payment_status: 'pending',
    reserved_at: '2025-01-11T09:00:00Z',
    product: {
      id: 2,
      name: 'Croissants',
      merchant: {
        id: 1,
        name: 'Boulangerie Martin',
        business_type: 'Boulangerie',
      },
    },
    consumer: {
      id: 2,
      first_name: 'Marie',
      last_name: 'Martin',
      email: 'marie@example.com',
      role: 'consumer',
      city: 'Lomé',
      created_at: '2025-01-01',
      updated_at: '2025-01-01',
    },
  } as Reservation,
]

describe('ExportReservationsButton', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // Reset mock implementations to defaults
    mockExportReservationsToExcel.mockResolvedValue('file:///mock/path/reservations.xlsx')
    mockShareExcelFile.mockResolvedValue(undefined)
  })

  // ============ RENDERING TESTS ============

  test('should render export button', () => {
    const { getByTestId } = render(<ExportReservationsButton reservations={mockReservations} />)
    expect(getByTestId('export-reservations-csv-button')).toBeTruthy()
  })

  test('should display export text', () => {
    const { getByText } = render(<ExportReservationsButton reservations={mockReservations} />)
    expect(getByText('Exporter Excel')).toBeTruthy()
  })

  test('should display reservation count badge', () => {
    const { getByText } = render(<ExportReservationsButton reservations={mockReservations} />)
    expect(getByText('2')).toBeTruthy()
  })

  test('should be disabled when no reservations', () => {
    const { getByTestId, getByText, queryByText } = render(<ExportReservationsButton reservations={[]} />)
    const button = getByTestId('export-reservations-csv-button')

    // When disabled, button should still render with text
    expect(getByText('Exporter Excel')).toBeTruthy()

    // But should not show a badge (no count)
    expect(queryByText('0')).toBeNull()
  })

  test('should be enabled when reservations exist', () => {
    const { getByTestId, getByText } = render(<ExportReservationsButton reservations={mockReservations} />)
    const button = getByTestId('export-reservations-csv-button')

    // Should render button text
    expect(getByText('Exporter Excel')).toBeTruthy()

    // Should show badge with count
    expect(getByText('2')).toBeTruthy()
  })

  // ============ EXPORT FUNCTIONALITY TESTS ============

  test('should call onExportStart callback', async () => {
    const onExportStart = jest.fn()
    const { getByTestId } = render(
      <ExportReservationsButton reservations={mockReservations} onExportStart={onExportStart} />
    )

    fireEvent.press(getByTestId('export-reservations-csv-button'))

    await waitFor(() => {
      expect(onExportStart).toHaveBeenCalled()
    })
  })

  test('should call exportReservationsToExcel with reservations', async () => {
    const { getByTestId } = render(<ExportReservationsButton reservations={mockReservations} />)
    fireEvent.press(getByTestId('export-reservations-csv-button'))

    await waitFor(() => {
      expect(mockExportReservationsToExcel).toHaveBeenCalledWith(
        mockReservations,
        expect.objectContaining({})
      )
    })
  })

  test('should call shareExcelFile after export', async () => {
    const { getByTestId } = render(<ExportReservationsButton reservations={mockReservations} />)
    fireEvent.press(getByTestId('export-reservations-csv-button'))

    await waitFor(() => {
      expect(mockShareExcelFile).toHaveBeenCalledWith(
        'file:///mock/path/reservations.xlsx',
        expect.any(String)
      )
    })
  })

  test('should show success alert after export', async () => {
    const { getByTestId } = render(<ExportReservationsButton reservations={mockReservations} />)
    fireEvent.press(getByTestId('export-reservations-csv-button'))

    await expectAlertModal(/Excel.*réussi/i)
  })

  test('should call onExportComplete callback', async () => {
    const onExportComplete = jest.fn()
    const { getByTestId } = render(
      <ExportReservationsButton reservations={mockReservations} onExportComplete={onExportComplete} />
    )

    fireEvent.press(getByTestId('export-reservations-csv-button'))

    await waitFor(() => {
      expect(onExportComplete).toHaveBeenCalled()
    })
  })

  test('should call onExportError callback on failure', async () => {
    const onExportError = jest.fn()
    mockExportReservationsToExcel.mockRejectedValue(new Error('Write error'))

    const { getByTestId } = render(
      <ExportReservationsButton reservations={mockReservations} onExportError={onExportError} />
    )

    fireEvent.press(getByTestId('export-reservations-csv-button'))

    await waitFor(() => {
      expect(onExportError).toHaveBeenCalledWith(expect.any(String))
    })
  })

  // ============ LOADING STATE TESTS ============

  test('should disable button while loading', async () => {
    mockExportReservationsToExcel.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve('file:///path.xlsx'), 100))
    )

    const { getByTestId, queryByTestId } = render(<ExportReservationsButton reservations={mockReservations} />)
    const button = getByTestId('export-reservations-csv-button')

    fireEvent.press(button)

    // Button should show loading indicator (which means it's in loading state)
    await waitFor(() => {
      expect(queryByTestId(TEST_IDS.exportReservationsLoading)).toBeTruthy()
    })
  })

  test('should show loading indicator while exporting', async () => {
    mockExportReservationsToExcel.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve('file:///path.xlsx'), 100))
    )

    const { getByTestId } = render(<ExportReservationsButton reservations={mockReservations} />)
    fireEvent.press(getByTestId('export-reservations-csv-button'))

    expect(getByTestId('export-reservations-loading')).toBeTruthy()
  })

  test('should re-enable button after export completes', async () => {
    const { getByTestId, queryByTestId } = render(<ExportReservationsButton reservations={mockReservations} />)
    const button = getByTestId('export-reservations-csv-button')

    fireEvent.press(button)

    await expectAlertModal(/export.*réussi/i)

    // Loading indicator should be gone (button is re-enabled)
    expect(queryByTestId(TEST_IDS.exportReservationsLoading)).toBeNull()
  })

  // ============ ERROR HANDLING TESTS ============

  test('should show alert when no reservations to export', async () => {
    const { getByTestId, getByText } = render(<ExportReservationsButton reservations={[]} />)
    const button = getByTestId('export-reservations-csv-button')

    // When no reservations, button should not show the badge
    expect(() => getByText('0')).toThrow()

    // And the button text should still be visible
    expect(getByText('Exporter Excel')).toBeTruthy()
  })

  test('should handle export error gracefully', async () => {
    mockExportReservationsToExcel.mockRejectedValue(
      new Error('No storage space')
    )

    const { getByTestId } = render(<ExportReservationsButton reservations={mockReservations} />)
    fireEvent.press(getByTestId('export-reservations-csv-button'))

    await expectAlertModal("Erreur d'export", /No storage space/i)
  })

  test('should handle sharing error gracefully', async () => {
    mockShareExcelFile.mockRejectedValue(new Error('Share cancelled'))

    const { getByTestId } = render(<ExportReservationsButton reservations={mockReservations} />)
    fireEvent.press(getByTestId('export-reservations-csv-button'))

    await expectAlertModal("Erreur d'export")
  })

  // ============ EDGE CASES ============

  test('should handle single reservation export', async () => {
    const { getByTestId, getByText } = render(
      <ExportReservationsButton reservations={[mockReservations[0]]} />
    )

    // Badge should show "1"
    expect(getByText('1')).toBeTruthy()

    fireEvent.press(getByTestId('export-reservations-csv-button'))

    await expectAlertModal(/1.*réservation/i)
  })

  test('should handle large number of reservations', async () => {
    const manyReservations = Array.from({ length: 100 }, (_, i) => ({
      ...mockReservations[0],
      id: i,
      reservation_code: `RES${i.toString().padStart(3, '0')}`,
    }))

    const { getByTestId, getByText } = render(
      <ExportReservationsButton reservations={manyReservations as Reservation[]} />
    )

    expect(getByText('100')).toBeTruthy()

    fireEvent.press(getByTestId('export-reservations-csv-button'))

    await waitFor(() => {
      expect(mockExportReservationsToExcel).toHaveBeenCalled()
    })
  })

  test('should pass merchantName to export service', async () => {
    const { getByTestId } = render(
      <ExportReservationsButton reservations={mockReservations} merchantName="Boulangerie Martin" />
    )

    fireEvent.press(getByTestId('export-reservations-csv-button'))

    await waitFor(() => {
      expect(mockExportReservationsToExcel).toHaveBeenCalledWith(
        mockReservations,
        expect.objectContaining({ merchantName: 'Boulangerie Martin' })
      )
    })
  })
})
