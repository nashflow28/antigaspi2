// @ts-nocheck
import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import { Alert } from 'react-native'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { ThemeProvider } from '../../../theme/ThemeContext'
import ReservationDetailsScreen from '../ReservationDetailsScreen'
import reservationsSlice, { fetchReservation, cancelReservation } from '../../../store/slices/reservationsSlice'
import authSlice from '../../../store/slices/authSlice'

// Mock navigation
const mockNavigate = jest.fn()
const mockGoBack = jest.fn()
const mockNavigation = {
  navigate: mockNavigate,
  goBack: mockGoBack,
  setOptions: jest.fn(),
}

// Mock route params
const mockRoute = {
  params: {
    reservationId: 1,
  },
}

jest.mock('../../../store/slices/reservationsSlice', () => {
  const actual = jest.requireActual('../../../store/slices/reservationsSlice')
  const mockFetchReservation = jest.fn(() => async () => ({
    type: 'reservations/fetchReservation/fulfilled',
    payload: createReservationFixture(),
  }))
  mockFetchReservation.fulfilled = {
    match: (action: { type: string }) => action.type === 'reservations/fetchReservation/fulfilled',
  }

  const mockCancelReservation = jest.fn(() => async () => ({
    type: 'reservations/cancelReservation/fulfilled',
  }))
  mockCancelReservation.fulfilled = {
    match: (action: { type: string }) => action.type === 'reservations/cancelReservation/fulfilled',
  }

  return {
    ...actual,
    fetchReservation: mockFetchReservation,
    cancelReservation: mockCancelReservation,
  }
})

// Mock reservation data (matching Reservation type from types/index.ts)
const createReservationFixture = () => ({
  id: 1,
  reservation_code: 'ABC123',
  quantity: 2,
  quantity_reserved: 2,
  original_price: 1000,
  discounted_price: 250,
  total_amount: 500,
  status: 'confirmed',
  payment_status: 'paid',
  notes: null,
  reserved_at: '2025-01-15T10:00:00Z',
  confirmed_at: '2025-01-15T10:30:00Z',
  pickup_date: '2025-01-20',
  pickup_time: '18:00',
  created_at: '2025-01-15T10:00:00Z',
  product: {
    id: 10,
    name: 'Pain complet artisanal',
    description: 'Pain frais du jour',
    image_url: 'pain.jpg',
    original_price: 500,
    discounted_price: 250,
    discount_percentage: 50,
    expiration_date: '2025-01-21T23:59:59Z',
    merchant: {
      id: 2,
      name: 'Boulangerie Martin',
      business_type: 'boulangerie',
      address: '15 Rue du Commerce',
      city: 'Lomé',
      phone: '+228 90 12 34 56',
      distance: 1.2,
    },
    category: {
      id: 1,
      name: 'Boulangerie',
    },
  },
  consumer: {
    id: 1,
    first_name: 'Jean',
    last_name: 'Dupont',
    email: 'jean.dupont@test.com',
    role: 'consumer',
    city: 'Lomé',
    created_at: '2025-01-01T10:00:00Z',
    updated_at: '2025-01-15T10:00:00Z',
  },
})

const mockReservation = createReservationFixture()

// Create test store
const createTestStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      reservations: reservationsSlice,
      auth: authSlice,
    },
    preloadedState: {
      reservations: {
        reservations: initialState.reservations || [mockReservation],
        currentReservation: initialState.currentReservation || mockReservation,
        loading: initialState.loading || false,
        error: initialState.error || null,
      },
      auth: {
        user: { id: 1, name: 'Test User', role: 'consumer' },
        token: 'test-token',
        isAuthenticated: true,
      },
    },
  })
}

// Helper to render with providers
const renderWithProviders = (component: React.ReactElement, store = createTestStore()) => {
  return render(
    <Provider store={store}>
      <ThemeProvider>
        {component}
      </ThemeProvider>
    </Provider>
  )
}

describe('ReservationDetailsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('loads reservation details using route id', async () => {
      const { getByText } = renderWithProviders(
        <ReservationDetailsScreen navigation={mockNavigation} route={mockRoute} />
      )

      await waitFor(() => {
        expect(fetchReservation).toHaveBeenCalledWith(1)
        expect(getByText('Pain complet artisanal')).toBeTruthy()
      })
    })

    it('displays product name', () => {
      const { getByText } = renderWithProviders(
        <ReservationDetailsScreen navigation={mockNavigation} route={mockRoute} />
      )
      expect(getByText('Pain complet artisanal')).toBeTruthy()
    })

    it('displays merchant name', () => {
      const { getByText } = renderWithProviders(
        <ReservationDetailsScreen navigation={mockNavigation} route={mockRoute} />
      )
      expect(getByText('Boulangerie Martin')).toBeTruthy()
    })

    it('displays merchant city', () => {
      const { getByText } = renderWithProviders(
        <ReservationDetailsScreen navigation={mockNavigation} route={mockRoute} />
      )
      expect(getByText(/Lomé/i)).toBeTruthy()
    })

    it('displays reservation quantity', () => {
      const { getByText } = renderWithProviders(
        <ReservationDetailsScreen navigation={mockNavigation} route={mockRoute} />
      )
      expect(getByText(/2/)).toBeTruthy()
    })

    it('displays total price', () => {
      const { getByText } = renderWithProviders(
        <ReservationDetailsScreen navigation={mockNavigation} route={mockRoute} />
      )
      expect(getByText('500 F CFA')).toBeTruthy()
    })

    it('displays pickup code', () => {
      const { getByText } = renderWithProviders(
        <ReservationDetailsScreen navigation={mockNavigation} route={mockRoute} />
      )
      expect(getByText('ABC123')).toBeTruthy()
    })
  })

  describe('Status Badge', () => {
    it('displays confirmed status badge', () => {
      const { getByText } = renderWithProviders(
        <ReservationDetailsScreen navigation={mockNavigation} route={mockRoute} />
      )
      expect(getByText(/Confirmée/i)).toBeTruthy()
    })

    it('displays pending status badge for pending reservations', () => {
      const pendingReservation = { ...mockReservation, status: 'pending' }
      const store = createTestStore({ currentReservation: pendingReservation })

      const { getByText } = renderWithProviders(
        <ReservationDetailsScreen navigation={mockNavigation} route={mockRoute} />,
        store
      )
      expect(getByText(/En attente/i)).toBeTruthy()
    })

    it('displays picked up status badge', () => {
      const pickedUpReservation = { ...mockReservation, status: 'picked_up' }
      const store = createTestStore({ currentReservation: pickedUpReservation })

      const { getByText } = renderWithProviders(
        <ReservationDetailsScreen navigation={mockNavigation} route={mockRoute} />,
        store
      )
      expect(getByText(/Récupérée/i)).toBeTruthy()
    })

    it('displays cancelled status badge', () => {
      const cancelledReservation = { ...mockReservation, status: 'cancelled' }
      const store = createTestStore({ currentReservation: cancelledReservation })

      const { getByText } = renderWithProviders(
        <ReservationDetailsScreen navigation={mockNavigation} route={mockRoute} />,
        store
      )
      expect(getByText(/Annulée/i)).toBeTruthy()
    })
  })

  describe('Payment Status', () => {
    it('displays paid payment status', () => {
      const { getByText } = renderWithProviders(
        <ReservationDetailsScreen navigation={mockNavigation} route={mockRoute} />
      )
      expect(getByText(/Payé/i)).toBeTruthy()
    })

    it('displays pending payment status', () => {
      const pendingPayment = { ...mockReservation, payment_status: 'pending' }
      const store = createTestStore({ currentReservation: pendingPayment })

      const { getByText } = renderWithProviders(
        <ReservationDetailsScreen navigation={mockNavigation} route={mockRoute} />,
        store
      )
      expect(getByText(/En attente/i)).toBeTruthy()
    })

    it('displays refunded payment status', () => {
      const refundedPayment = { ...mockReservation, payment_status: 'refunded' }
      const store = createTestStore({ currentReservation: refundedPayment })

      const { getByText } = renderWithProviders(
        <ReservationDetailsScreen navigation={mockNavigation} route={mockRoute} />,
        store
      )
      expect(getByText(/Remboursé/i)).toBeTruthy()
    })
  })

  describe('QR Code', () => {
    it('displays QR code for confirmed reservations', () => {
      const { getByTestId } = renderWithProviders(
        <ReservationDetailsScreen navigation={mockNavigation} route={mockRoute} />
      )
      const qrCode = getByTestId(/qr-code/i) || getByTestId(/qrcode/i)
      expect(qrCode).toBeTruthy()
    })

    it('shows QR code button', () => {
      const { getByText } = renderWithProviders(
        <ReservationDetailsScreen navigation={mockNavigation} route={mockRoute} />
      )
      const qrButton = getByText(/QR Code/i) || getByText(/Afficher/i)
      expect(qrButton).toBeTruthy()
    })

    it('opens QR code modal when button is pressed', async () => {
      const { getByText } = renderWithProviders(
        <ReservationDetailsScreen navigation={mockNavigation} route={mockRoute} />
      )

      const qrButton = getByText(/QR Code/i) || getByText(/Afficher/i)
      fireEvent.press(qrButton)

      await waitFor(() => {
        expect(getByText(/Code de retrait/i)).toBeTruthy()
      })
    })

    it('displays pickup code in QR modal', async () => {
      const { getByText } = renderWithProviders(
        <ReservationDetailsScreen navigation={mockNavigation} route={mockRoute} />
      )

      const qrButton = getByText(/QR Code/i) || getByText(/Afficher/i)
      fireEvent.press(qrButton)

      await waitFor(() => {
        expect(getByText('ABC123')).toBeTruthy()
      })
    })

    it('closes QR modal when close button is pressed', async () => {
      const { getByText, queryByText } = renderWithProviders(
        <ReservationDetailsScreen navigation={mockNavigation} route={mockRoute} />
      )

      const qrButton = getByText(/QR Code/i) || getByText(/Afficher/i)
      fireEvent.press(qrButton)

      await waitFor(() => {
        const closeButton = getByText(/Fermer/i)
        fireEvent.press(closeButton)
      })

      await waitFor(() => {
        expect(queryByText(/Code de retrait/i)).toBeFalsy()
      })
    })
  })

  describe('Cancel Reservation', () => {
    it('displays cancel button for pending reservations', () => {
      const pendingReservation = { ...mockReservation, status: 'pending' }
      const store = createTestStore({ currentReservation: pendingReservation })

      const { getByText } = renderWithProviders(
        <ReservationDetailsScreen navigation={mockNavigation} route={mockRoute} />,
        store
      )
      expect(getByText(/Annuler/i)).toBeTruthy()
    })

    it('does not display cancel button for confirmed reservations', () => {
      const { queryByText } = renderWithProviders(
        <ReservationDetailsScreen navigation={mockNavigation} route={mockRoute} />
      )
      expect(queryByText(/Annuler la réservation/i)).toBeFalsy()
    })

    it('shows confirmation modal when cancel button is pressed', async () => {
      const pendingReservation = { ...mockReservation, status: 'pending' }
      const store = createTestStore({ currentReservation: pendingReservation })

      const { getByText } = renderWithProviders(
        <ReservationDetailsScreen navigation={mockNavigation} route={mockRoute} />,
        store
      )

      const cancelButton = getByText(/Annuler/i)
      fireEvent.press(cancelButton)

      await waitFor(() => {
        expect(getByText(/Êtes-vous sûr/i)).toBeTruthy()
      })
    })

    it('does not cancel when cancel confirmation is dismissed', async () => {
      const pendingReservation = { ...mockReservation, status: 'pending' }
      const store = createTestStore({ currentReservation: pendingReservation })

      const { getByText } = renderWithProviders(
        <ReservationDetailsScreen navigation={mockNavigation} route={mockRoute} />,
        store
      )

      fireEvent.press(getByText(/Annuler/i))

      await waitFor(() => {
        const dismissButton = getByText(/Non/i) || getByText(/Fermer/i)
        fireEvent.press(dismissButton)
      })

      // Reservation should still be visible
      expect(getByText('Pain complet artisanal')).toBeTruthy()
    })

    it('dispatches cancellation when confirmation is accepted', async () => {
      const pendingReservation = { ...mockReservation, status: 'pending' }
      const store = createTestStore({ currentReservation: pendingReservation })
      const alertSpy = jest
        .spyOn(Alert, 'alert')
        .mockImplementation((_title, _message, buttons) => {
          const confirm = buttons?.find(button => button.style === 'destructive')
          confirm?.onPress?.()
        })

      const { getByText } = renderWithProviders(
        <ReservationDetailsScreen navigation={mockNavigation} route={mockRoute} />,
        store
      )

      fireEvent.press(getByText(/Annuler/i))

      await waitFor(() => {
        expect(cancelReservation).toHaveBeenCalledWith(1)
        expect(mockGoBack).toHaveBeenCalled()
      })

      alertSpy.mockRestore()
    })
  })

  describe('Navigation', () => {
    it('navigates back when back button is pressed', async () => {
      const { getByTestId } = renderWithProviders(
        <ReservationDetailsScreen navigation={mockNavigation} route={mockRoute} />
      )

      const backButton = getByTestId(/arrow-back/i) || getByTestId(/back/i)
      fireEvent.press(backButton)

      await waitFor(() => {
        expect(mockGoBack).toHaveBeenCalled()
      })
    })

    it('navigates to MerchantDetail when merchant card is pressed', async () => {
      const { getByText } = renderWithProviders(
        <ReservationDetailsScreen navigation={mockNavigation} route={mockRoute} />
      )

      const merchantCard = getByText('Boulangerie Martin')
      fireEvent.press(merchantCard)

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('MerchantDetail', { merchantId: 2 })
      })
    })
  })

  describe('Loading State', () => {
    it('displays loading indicator when loading reservation', () => {
      const store = createTestStore({ loading: true, currentReservation: null })

      const { getByTestId } = renderWithProviders(
        <ReservationDetailsScreen navigation={mockNavigation} route={mockRoute} />,
        store
      )

      const loading = getByTestId(/loading/i) || getByTestId(/activityindicator/i)
      expect(loading).toBeTruthy()
    })
  })

  describe('Error Handling', () => {
    it('displays error message when there is an error', () => {
      const store = createTestStore({
        error: 'Failed to load reservation',
        currentReservation: null,
      })

      const { getByText } = renderWithProviders(
        <ReservationDetailsScreen navigation={mockNavigation} route={mockRoute} />,
        store
      )

      expect(getByText(/Failed to load/i) || getByText(/erreur/i)).toBeTruthy()
    })
  })

  describe('Dates Display', () => {
    it('displays reservation creation date', () => {
      const { getByText } = renderWithProviders(
        <ReservationDetailsScreen navigation={mockNavigation} route={mockRoute} />
      )
      expect(getByText(/2025/)).toBeTruthy()
    })

    it('displays pickup date', () => {
      const { getByText } = renderWithProviders(
        <ReservationDetailsScreen navigation={mockNavigation} route={mockRoute} />
      )
      expect(getByText(/20/)).toBeTruthy()
    })
  })

  describe('Product Image', () => {
    it('displays product image', () => {
      const { getByTestId } = renderWithProviders(
        <ReservationDetailsScreen navigation={mockNavigation} route={mockRoute} />
      )
      const image = getByTestId(/image/i) || getByTestId(/product-image/i)
      expect(image).toBeTruthy()
    })
  })

  describe('Reservation ID Display', () => {
    it('displays reservation ID', () => {
      const { getByText } = renderWithProviders(
        <ReservationDetailsScreen navigation={mockNavigation} route={mockRoute} />
      )
      expect(getByText(/#1/) || getByText(/ID: 1/)).toBeTruthy()
    })
  })
})
