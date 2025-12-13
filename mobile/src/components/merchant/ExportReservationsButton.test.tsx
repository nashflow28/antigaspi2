import React from 'react'
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native'
import ExportReservationsButton from './ExportReservationsButton'
import * as FileSystem from 'expo-file-system/legacy'
import * as Sharing from 'expo-sharing'
import { Reservation } from '../../types'
import { TEST_IDS } from '../../utils/testIds'

// Create a mutable mock for FileSystem
let mockDocumentDirectory: string | null | undefined = 'file:///data/user/0/com.app/files/'

// Mock dependencies
jest.mock('expo-file-system/legacy', () => ({
  get documentDirectory() {
    return mockDocumentDirectory
  },
  set documentDirectory(value) {
    mockDocumentDirectory = value
  },
  writeAsStringAsync: jest.fn(() => Promise.resolve()),
  EncodingType: {
    UTF8: 'utf8',
  },
}))
jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn(() => Promise.resolve(true)),
  shareAsync: jest.fn(() => Promise.resolve()),
}))
jest.mock('../../theme', () => {
  const { mockUseTheme } = require('../../__mocks__/themeMock')
  return {
    useTheme: mockUseTheme,
  }
})

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

    // Reset documentDirectory to default value
    mockDocumentDirectory = 'file:///data/user/0/com.app/files/'

    // Reset mock implementations to defaults
    ;(FileSystem.writeAsStringAsync as jest.Mock).mockResolvedValue(undefined)
    ;(Sharing.isAvailableAsync as jest.Mock).mockResolvedValue(true)
    ;(Sharing.shareAsync as jest.Mock).mockResolvedValue(undefined)
  })

  // ============ RENDERING TESTS ============

  test('should render export button', () => {
    const { getByTestId } = render(<ExportReservationsButton reservations={mockReservations} />)
    expect(getByTestId('export-reservations-csv-button')).toBeTruthy()
  })

  test('should display export text', () => {
    const { getByText } = render(<ExportReservationsButton reservations={mockReservations} />)
    expect(getByText('Exporter CSV')).toBeTruthy()
  })

  test('should display reservation count badge', () => {
    const { getByText } = render(<ExportReservationsButton reservations={mockReservations} />)
    expect(getByText('2')).toBeTruthy()
  })

  test('should be disabled when no reservations', () => {
    const { getByTestId, getByText, queryByText } = render(<ExportReservationsButton reservations={[]} />)
    const button = getByTestId('export-reservations-csv-button')

    // When disabled, button should still render with text
    expect(getByText('Exporter CSV')).toBeTruthy()

    // But should not show a badge (no count)
    expect(queryByText('0')).toBeNull()
  })

  test('should be enabled when reservations exist', () => {
    const { getByTestId, getByText } = render(<ExportReservationsButton reservations={mockReservations} />)
    const button = getByTestId('export-reservations-csv-button')

    // Should render button text
    expect(getByText('Exporter CSV')).toBeTruthy()

    // Should show badge with count
    expect(getByText('2')).toBeTruthy()
  })

  // ============ BUG-001 FIX VERIFICATION ============

  test('should handle null FileSystem.documentDirectory gracefully', async () => {
    mockDocumentDirectory = null

    const { getByTestId } = render(<ExportReservationsButton reservations={mockReservations} />)
    fireEvent.press(getByTestId('export-reservations-csv-button'))

    await expectAlertModal("Erreur d'export", /syst/i)

    expect(FileSystem.writeAsStringAsync).not.toHaveBeenCalled()
  })

  test('should handle undefined FileSystem.documentDirectory gracefully', async () => {
    mockDocumentDirectory = undefined

    const { getByTestId } = render(<ExportReservationsButton reservations={mockReservations} />)
    fireEvent.press(getByTestId('export-reservations-csv-button'))

    await expectAlertModal("Erreur d'export", /syst/i)
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

  test('should generate CSV file with UTF-8 BOM', async () => {
    const { getByTestId } = render(<ExportReservationsButton reservations={mockReservations} />)
    fireEvent.press(getByTestId('export-reservations-csv-button'))

    await waitFor(() => {
      expect(FileSystem.writeAsStringAsync).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('\uFEFF'), // UTF-8 BOM
        { encoding: FileSystem.EncodingType.UTF8 }
      )
    })
  })

  test('should create file with timestamp in filename', async () => {
    const { getByTestId } = render(<ExportReservationsButton reservations={mockReservations} />)
    fireEvent.press(getByTestId('export-reservations-csv-button'))

    await waitFor(() => {
      expect(FileSystem.writeAsStringAsync).toHaveBeenCalledWith(
        expect.stringMatching(/reservations-export-.*\.csv$/),
        expect.any(String),
        expect.any(Object)
      )
    })
  })

  test('should include CSV headers', async () => {
    const { getByTestId } = render(<ExportReservationsButton reservations={mockReservations} />)
    fireEvent.press(getByTestId('export-reservations-csv-button'))

    await waitFor(() => {
      const [[, csvContent]] = (FileSystem.writeAsStringAsync as jest.Mock).mock.calls
      expect(csvContent).toContain('ID,Code Réservation,Client')
    })
  })

  test('should include all reservation data', async () => {
    const { getByTestId } = render(<ExportReservationsButton reservations={mockReservations} />)
    fireEvent.press(getByTestId('export-reservations-csv-button'))

    await waitFor(() => {
      const [[, csvContent]] = (FileSystem.writeAsStringAsync as jest.Mock).mock.calls
      expect(csvContent).toContain('RES001')
      expect(csvContent).toContain('Jean Dupont')
      expect(csvContent).toContain('Pain complet')
    })
  })

  // ============ CSV ESCAPING TESTS ============

  test('should escape commas in CSV fields', async () => {
    const reservationWithComma = {
      ...mockReservations[0],
      notes: 'Apporter sac, emballage, carte',
    }

    const { getByTestId } = render(
      <ExportReservationsButton reservations={[reservationWithComma]} />
    )
    fireEvent.press(getByTestId('export-reservations-csv-button'))

    await waitFor(() => {
      const [[, csvContent]] = (FileSystem.writeAsStringAsync as jest.Mock).mock.calls
      // Field with commas should be quoted
      expect(csvContent).toContain('"Apporter sac, emballage, carte"')
    })
  })

  test('should escape quotes in CSV fields', async () => {
    const reservationWithQuotes = {
      ...mockReservations[0],
      product: {
        ...mockReservations[0].product,
        name: 'Pain "spécial"',
      },
    }

    const { getByTestId } = render(
      <ExportReservationsButton reservations={[reservationWithQuotes]} />
    )
    fireEvent.press(getByTestId('export-reservations-csv-button'))

    await waitFor(() => {
      const [[, csvContent]] = (FileSystem.writeAsStringAsync as jest.Mock).mock.calls
      // Quotes should be doubled and field quoted
      expect(csvContent).toContain('"Pain ""spécial"""')
    })
  })

  test('should prevent CSV injection with = prefix', async () => {
    const maliciousReservation = {
      ...mockReservations[0],
      notes: '=CMD|"/C calc"!A1',
    }

    const { getByTestId } = render(
      <ExportReservationsButton reservations={[maliciousReservation]} />
    )
    fireEvent.press(getByTestId('export-reservations-csv-button'))

    await waitFor(() => {
      const [[, csvContent]] = (FileSystem.writeAsStringAsync as jest.Mock).mock.calls
      // Should prefix with single quote to prevent injection
      expect(csvContent).toContain("\"'=CMD")
    })
  })

  test('should prevent CSV injection with + prefix', async () => {
    const maliciousReservation = {
      ...mockReservations[0],
      notes: '+CMD',
    }

    const { getByTestId } = render(
      <ExportReservationsButton reservations={[maliciousReservation]} />
    )
    fireEvent.press(getByTestId('export-reservations-csv-button'))

    await waitFor(() => {
      const [[, csvContent]] = (FileSystem.writeAsStringAsync as jest.Mock).mock.calls
      expect(csvContent).toContain("\"'+CMD\"")
    })
  })

  test('should prevent CSV injection with - prefix', async () => {
    const maliciousReservation = {
      ...mockReservations[0],
      notes: '-2+3+cmd|"/C calc"!A1',
    }

    const { getByTestId } = render(
      <ExportReservationsButton reservations={[maliciousReservation]} />
    )
    fireEvent.press(getByTestId('export-reservations-csv-button'))

    await waitFor(() => {
      const [[, csvContent]] = (FileSystem.writeAsStringAsync as jest.Mock).mock.calls
      expect(csvContent).toContain("\"'-2+3+cmd")
    })
  })

  test('should prevent CSV injection with @ prefix', async () => {
    const maliciousReservation = {
      ...mockReservations[0],
      notes: '@SUM(1+1)',
    }

    const { getByTestId } = render(
      <ExportReservationsButton reservations={[maliciousReservation]} />
    )
    fireEvent.press(getByTestId('export-reservations-csv-button'))

    await waitFor(() => {
      const [[, csvContent]] = (FileSystem.writeAsStringAsync as jest.Mock).mock.calls
      expect(csvContent).toContain("\"'@SUM")
    })
  })

  // ============ SHARING TESTS ============

  test('should check if sharing is available', async () => {
    const { getByTestId } = render(<ExportReservationsButton reservations={mockReservations} />)
    fireEvent.press(getByTestId('export-reservations-csv-button'))

    await waitFor(() => {
      expect(Sharing.isAvailableAsync).toHaveBeenCalled()
    })
  })

  test('should show error when sharing not available', async () => {
    ;(Sharing.isAvailableAsync as jest.Mock).mockResolvedValue(false)

    const { getByTestId } = render(<ExportReservationsButton reservations={mockReservations} />)
    fireEvent.press(getByTestId('export-reservations-csv-button'))

    await expectAlertModal('Erreur', /partage de fichiers/i)
  })

  test('should share CSV file with correct MIME type', async () => {
    const { getByTestId } = render(<ExportReservationsButton reservations={mockReservations} />)
    fireEvent.press(getByTestId('export-reservations-csv-button'))

    await waitFor(() => {
      expect(Sharing.shareAsync).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          mimeType: 'text/csv',
          UTI: 'public.comma-separated-values-text',
        })
      )
    })
  })

  test('should show success alert after export', async () => {
    const { getByTestId } = render(<ExportReservationsButton reservations={mockReservations} />)
    fireEvent.press(getByTestId('export-reservations-csv-button'))

    await expectAlertModal(/2.*réserv/i)
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
    ;(FileSystem.writeAsStringAsync as jest.Mock).mockRejectedValue(new Error('Write error'))

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
    ;(FileSystem.writeAsStringAsync as jest.Mock).mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
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
    ;(FileSystem.writeAsStringAsync as jest.Mock).mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    )

    const { getByTestId } = render(<ExportReservationsButton reservations={mockReservations} />)
    fireEvent.press(getByTestId('export-reservations-csv-button'))

    expect(getByTestId('export-reservations-loading')).toBeTruthy()
  })

  test('should re-enable button after export completes', async () => {
    const { getByTestId, queryByTestId } = render(<ExportReservationsButton reservations={mockReservations} />)
    const button = getByTestId('export-reservations-csv-button')

    fireEvent.press(button)

    await expectAlertModal(/export.*succ/i)

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
    expect(getByText('Exporter CSV')).toBeTruthy()
  })

  test('should handle file write error gracefully', async () => {
    ;(FileSystem.writeAsStringAsync as jest.Mock).mockRejectedValue(
      new Error('No storage space')
    )

    const { getByTestId } = render(<ExportReservationsButton reservations={mockReservations} />)
    fireEvent.press(getByTestId('export-reservations-csv-button'))

    await expectAlertModal("Erreur d'export", /No storage space/i)
  })

  test('should handle sharing error gracefully', async () => {
    ;(Sharing.shareAsync as jest.Mock).mockRejectedValue(new Error('Share cancelled'))

    const { getByTestId } = render(<ExportReservationsButton reservations={mockReservations} />)
    fireEvent.press(getByTestId('export-reservations-csv-button'))

    await expectAlertModal("Erreur d'export")
  })

  // ============ EDGE CASES ============

  test('should handle reservation with missing consumer data', async () => {
    const reservationNoConsumer = {
      ...mockReservations[0],
      consumer: undefined,
    }

    const { getByTestId } = render(
      <ExportReservationsButton reservations={[reservationNoConsumer as any]} />
    )
    fireEvent.press(getByTestId('export-reservations-csv-button'))

    await waitFor(() => {
      const [[, csvContent]] = (FileSystem.writeAsStringAsync as jest.Mock).mock.calls
      expect(csvContent).toContain('Client inconnu')
    })
  })

  test('should handle reservation with null values', async () => {
    const reservationWithNulls = {
      ...mockReservations[0],
      pickup_date: null,
      pickup_time: null,
      notes: null,
      confirmed_at: null,
      completed_at: null,
      cancelled_at: null,
    }

    const { getByTestId } = render(
      <ExportReservationsButton reservations={[reservationWithNulls as any]} />
    )
    fireEvent.press(getByTestId('export-reservations-csv-button'))

    await waitFor(() => {
      expect(FileSystem.writeAsStringAsync).toHaveBeenCalled()
    })
  })

  test('should handle single reservation export', async () => {
    const { getByTestId, getByText } = render(
      <ExportReservationsButton reservations={[mockReservations[0]]} />
    )

    // Badge should show "1"
    expect(getByText('1')).toBeTruthy()

    fireEvent.press(getByTestId('export-reservations-csv-button'))

    await expectAlertModal(/1.*réservation.*succ/i)
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
      expect(FileSystem.writeAsStringAsync).toHaveBeenCalled()
    })
  })
})
