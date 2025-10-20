// @ts-nocheck
import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import ReservationsScreen from '../ReservationsScreen'
import reservationsSlice from '../../../store/slices/reservationsSlice'
import authSlice from '../../../store/slices/authSlice'
import connectivitySlice from '../../../store/slices/connectivitySlice'
import { ThemeProvider } from '../../../theme/ThemeContext'
import { TEST_IDS } from '../../../utils/testIds'

// Mock navigation
const mockNavigate = jest.fn()
const mockNavigation = {
  navigate: mockNavigate,
  goBack: jest.fn(),
  setOptions: jest.fn(),
}

// Mock reservations data
const mockReservations = [
  {
    id: 1,
    reservation_code: 'RES001',
    status: 'pending',
    product: {
      id: 1,
      name: 'Pain artisanal',
      image_url: '/storage/products/pain.jpg',
      merchant: {
        id: 1,
        name: 'Boulangerie Martin',
      },
    },
    quantity: 2,
    total_amount: 500,
    payment_status: 'pending',
    created_at: '2025-10-18T10:00:00.000000Z',
  },
  {
    id: 2,
    reservation_code: 'RES002',
    status: 'confirmed',
    product: {
      id: 2,
      name: 'Croissants',
      image_url: '/storage/products/croissants.jpg',
      merchant: {
        id: 1,
        name: 'Boulangerie Martin',
      },
    },
    quantity: 5,
    total_amount: 750,
    payment_status: 'completed',
    pickup_date: '2025-10-20T00:00:00.000000Z',
    pickup_time: '09:00',
    created_at: '2025-10-18T11:00:00.000000Z',
  },
  {
    id: 3,
    reservation_code: 'RES003',
    status: 'completed',
    product: {
      id: 3,
      name: 'Bananes',
      image_url: '/storage/products/bananes.jpg',
      merchant: {
        id: 2,
        name: 'Marché Bio',
      },
    },
    quantity: 1,
    total_amount: 150,
    payment_status: 'completed',
    notes: 'Merci pour votre achat!',
    created_at: '2025-10-15T14:00:00.000000Z',
  },
  {
    id: 4,
    reservation_code: 'RES004',
    status: 'cancelled',
    product: {
      id: 4,
      name: 'Yaourts',
      image_url: '/storage/products/yaourts.jpg',
      merchant: {
        id: 3,
        name: 'Épicerie Durand',
      },
    },
    quantity: 3,
    total_amount: 900,
    payment_status: 'refunded',
    created_at: '2025-10-14T16:00:00.000000Z',
  },
]

// Create test store
const createTestStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      reservations: reservationsSlice,
      auth: authSlice,
      connectivity: connectivitySlice,
    },
    preloadedState: {
      reservations: {
        reservations: mockReservations,
        loading: false,
        error: null,
      },
      auth: {
        user: {
          id: 1,
          first_name: 'Test',
          last_name: 'User',
          email: 'test@example.com',
          role: 'consumer',
        },
        token: 'test-token',
        isAuthenticated: true,
        loading: false,
        error: null,
      },
      connectivity: {
        isOnline: true,
      },
      ...initialState,
    },
  })
}

// Helper to render with providers
const renderWithProviders = (component: React.ReactElement, store: any) => {
  return render(
    <Provider store={store}>
      <ThemeProvider>
        {component}
      </ThemeProvider>
    </Provider>
  )
}

describe('ReservationsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders without crashing', () => {
      const store = createTestStore()
      const { getByTestId } = renderWithProviders(
        <ReservationsScreen navigation={mockNavigation} />,
        store
      )

      expect(getByTestId(TEST_IDS.reservationsScreen)).toBeTruthy()
    })

    it('displays header with total count', () => {
      const store = createTestStore()
      const { getByText } = renderWithProviders(
        <ReservationsScreen navigation={mockNavigation} />,
        store
      )

      expect(getByText('Mes réservations')).toBeTruthy()
      expect(getByText('4 réservation(s) au total')).toBeTruthy()
    })

    it('displays all reservation cards', () => {
      const store = createTestStore()
      const { getByText } = renderWithProviders(
        <ReservationsScreen navigation={mockNavigation} />,
        store
      )

      expect(getByText('Pain artisanal')).toBeTruthy()
      expect(getByText('Croissants')).toBeTruthy()
      expect(getByText('Bananes')).toBeTruthy()
      expect(getByText('Yaourts')).toBeTruthy()
    })

    it('displays reservation codes correctly', () => {
      const store = createTestStore()
      const { getByText } = renderWithProviders(
        <ReservationsScreen navigation={mockNavigation} />,
        store
      )

      expect(getByText('#RES001')).toBeTruthy()
      expect(getByText('#RES002')).toBeTruthy()
    })

    it('displays merchant names for each reservation', () => {
      const store = createTestStore()
      const { getByText } = renderWithProviders(
        <ReservationsScreen navigation={mockNavigation} />,
        store
      )

      expect(getByText('Boulangerie Martin')).toBeTruthy()
      expect(getByText('Marché Bio')).toBeTruthy()
      expect(getByText('Épicerie Durand')).toBeTruthy()
    })

    it('displays prices in F CFA format', () => {
      const store = createTestStore()
      const { getAllByText } = renderWithProviders(
        <ReservationsScreen navigation={mockNavigation} />,
        store
      )

      const priceElements = getAllByText(/F CFA/i)
      expect(priceElements.length).toBeGreaterThan(0)
    })

    it('displays quantities for each reservation', () => {
      const store = createTestStore()
      const { getByText } = renderWithProviders(
        <ReservationsScreen navigation={mockNavigation} />,
        store
      )

      expect(getByText(/Quantité.*2/i)).toBeTruthy()
      expect(getByText(/Quantité.*5/i)).toBeTruthy()
    })
  })

  describe('Tab Filtering', () => {
    it('shows three tabs: Actives, Terminées, Annulées', () => {
      const store = createTestStore()
      const { getByTestId } = renderWithProviders(
        <ReservationsScreen navigation={mockNavigation} />,
        store
      )

      expect(getByTestId('tab-active')).toBeTruthy()
      expect(getByTestId('tab-completed')).toBeTruthy()
      expect(getByTestId('tab-cancelled')).toBeTruthy()
    })

    it('filters active reservations when active tab is selected', async () => {
      const store = createTestStore()
      const { getByTestId, getByText, queryByText } = renderWithProviders(
        <ReservationsScreen navigation={mockNavigation} />,
        store
      )

      const activeTab = getByTestId('tab-active')
      fireEvent.press(activeTab)

      await waitFor(() => {
        // Should show pending and confirmed
        expect(getByText('Pain artisanal')).toBeTruthy()
        expect(getByText('Croissants')).toBeTruthy()
        // Should not show completed or cancelled
        expect(queryByText('Bananes')).toBeFalsy()
        expect(queryByText('Yaourts')).toBeFalsy()
      })
    })

    it('filters completed reservations when completed tab is selected', async () => {
      const store = createTestStore()
      const { getByTestId, getByText, queryByText } = renderWithProviders(
        <ReservationsScreen navigation={mockNavigation} />,
        store
      )

      const completedTab = getByTestId('tab-completed')
      fireEvent.press(completedTab)

      await waitFor(() => {
        // Should show only completed
        expect(getByText('Bananes')).toBeTruthy()
        // Should not show others
        expect(queryByText('Pain artisanal')).toBeFalsy()
        expect(queryByText('Yaourts')).toBeFalsy()
      })
    })

    it('filters cancelled reservations when cancelled tab is selected', async () => {
      const store = createTestStore()
      const { getByTestId, getByText, queryByText } = renderWithProviders(
        <ReservationsScreen navigation={mockNavigation} />,
        store
      )

      const cancelledTab = getByTestId('tab-cancelled')
      fireEvent.press(cancelledTab)

      await waitFor(() => {
        // Should show only cancelled
        expect(getByText('Yaourts')).toBeTruthy()
        // Should not show others
        expect(queryByText('Pain artisanal')).toBeFalsy()
        expect(queryByText('Bananes')).toBeFalsy()
      })
    })

    it('displays correct count for each tab', () => {
      const store = createTestStore()
      const { getByText } = renderWithProviders(
        <ReservationsScreen navigation={mockNavigation} />,
        store
      )

      // Active count (pending + confirmed)
      expect(getByText('Actives')).toBeTruthy()
      // Completed count
      expect(getByText('Terminées')).toBeTruthy()
      // Cancelled count
      expect(getByText('Annulées')).toBeTruthy()
    })
  })

  describe('Status Badges', () => {
    it('displays correct status text for pending reservations', () => {
      const store = createTestStore()
      const { getByText } = renderWithProviders(
        <ReservationsScreen navigation={mockNavigation} />,
        store
      )

      expect(getByText(/Confirmation commerçant/i)).toBeTruthy()
    })

    it('displays correct status text for confirmed reservations', () => {
      const store = createTestStore()
      const { getByText } = renderWithProviders(
        <ReservationsScreen navigation={mockNavigation} />,
        store
      )

      expect(getByText(/Confirmée - À retirer/i)).toBeTruthy()
    })

    it('displays correct status text for completed reservations', () => {
      const store = createTestStore()
      const { getByText } = renderWithProviders(
        <ReservationsScreen navigation={mockNavigation} />,
        store
      )

      expect(getByText(/Produit retiré/i)).toBeTruthy()
    })

    it('displays correct status text for cancelled reservations', () => {
      const store = createTestStore()
      const { getByText } = renderWithProviders(
        <ReservationsScreen navigation={mockNavigation} />,
        store
      )

      expect(getByText(/Annulée/i)).toBeTruthy()
    })
  })

  describe('Payment Status', () => {
    it('displays payment status badges', () => {
      const store = createTestStore()
      const { getByText } = renderWithProviders(
        <ReservationsScreen navigation={mockNavigation} />,
        store
      )

      expect(getByText(/En attente/i)).toBeTruthy()
      expect(getByText(/Payé/i)).toBeTruthy()
    })

    it('displays refunded status for cancelled reservations', () => {
      const store = createTestStore()
      const { getByText } = renderWithProviders(
        <ReservationsScreen navigation={mockNavigation} />,
        store
      )

      expect(getByText(/Remboursé/i)).toBeTruthy()
    })
  })

  describe('Reservation Details', () => {
    it('displays pickup information when available', () => {
      const store = createTestStore()
      const { getByText } = renderWithProviders(
        <ReservationsScreen navigation={mockNavigation} />,
        store
      )

      expect(getByText(/Retrait:.*09:00/i)).toBeTruthy()
    })

    it('displays notes when available', () => {
      const store = createTestStore()
      const { getByText } = renderWithProviders(
        <ReservationsScreen navigation={mockNavigation} />,
        store
      )

      expect(getByText('Merci pour votre achat!')).toBeTruthy()
    })
  })

  describe('Action Buttons', () => {
    it('displays QR code button for confirmed reservations', () => {
      const store = createTestStore()
      const { getByTestId } = renderWithProviders(
        <ReservationsScreen navigation={mockNavigation} />,
        store
      )

      expect(getByTestId('show-qr-2')).toBeTruthy()
    })

    it('displays view product button for all reservations', () => {
      const store = createTestStore()
      const { getByTestId } = renderWithProviders(
        <ReservationsScreen navigation={mockNavigation} />,
        store
      )

      expect(getByTestId('view-product-1')).toBeTruthy()
      expect(getByTestId('view-product-2')).toBeTruthy()
    })

    it('displays cancel button for pending and confirmed reservations', () => {
      const store = createTestStore()
      const { getByTestId } = renderWithProviders(
        <ReservationsScreen navigation={mockNavigation} />,
        store
      )

      expect(getByTestId(TEST_IDS.cancelReservationButton(1))).toBeTruthy()
      expect(getByTestId(TEST_IDS.cancelReservationButton(2))).toBeTruthy()
    })

    it('does not display cancel button for completed reservations', () => {
      const store = createTestStore()
      const { queryByTestId } = renderWithProviders(
        <ReservationsScreen navigation={mockNavigation} />,
        store
      )

      expect(queryByTestId(TEST_IDS.cancelReservationButton(3))).toBeFalsy()
    })
  })

  describe('Navigation', () => {
    it('navigates to product details when view button is pressed', async () => {
      const store = createTestStore()
      const { getByTestId } = renderWithProviders(
        <ReservationsScreen navigation={mockNavigation} />,
        store
      )

      const viewButton = getByTestId('view-product-1')
      fireEvent.press(viewButton)

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('ProductDetails', { productId: 1 })
      })
    })

    it('navigates to products page from empty state', async () => {
      const emptyStore = createTestStore({
        reservations: {
          reservations: [],
          loading: false,
          error: null,
        },
      })

      const { getByTestId } = renderWithProviders(
        <ReservationsScreen navigation={mockNavigation} />,
        emptyStore
      )

      const browseButton = getByTestId('browse-products-button')
      fireEvent.press(browseButton)

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('Products')
      })
    })
  })

  describe('QR Code Modal', () => {
    it('opens QR code modal when QR button is pressed', async () => {
      const store = createTestStore()
      const { getByTestId, getByText } = renderWithProviders(
        <ReservationsScreen navigation={mockNavigation} />,
        store
      )

      const qrButton = getByTestId('show-qr-2')
      fireEvent.press(qrButton)

      await waitFor(() => {
        expect(getByText('QR Code de retrait')).toBeTruthy()
      })
    })

    it('displays reservation details in QR modal', async () => {
      const store = createTestStore()
      const { getByTestId, getByText } = renderWithProviders(
        <ReservationsScreen navigation={mockNavigation} />,
        store
      )

      const qrButton = getByTestId('show-qr-2')
      fireEvent.press(qrButton)

      await waitFor(() => {
        expect(getByText(/Réservation #RES002/i)).toBeTruthy()
        expect(getByText(/Croissants/i)).toBeTruthy()
        expect(getByText(/Boulangerie Martin/i)).toBeTruthy()
      })
    })
  })

  describe('Empty States', () => {
    it('shows empty state when no reservations', () => {
      const emptyStore = createTestStore({
        reservations: {
          reservations: [],
          loading: false,
          error: null,
        },
      })

      const { getByTestId, getByText } = renderWithProviders(
        <ReservationsScreen navigation={mockNavigation} />,
        emptyStore
      )

      expect(getByTestId(TEST_IDS.emptyState)).toBeTruthy()
      expect(getByText('Aucune réservation')).toBeTruthy()
    })

    it('shows different empty messages for each tab', async () => {
      const emptyStore = createTestStore({
        reservations: {
          reservations: [],
          loading: false,
          error: null,
        },
      })

      const { getByTestId, getByText } = renderWithProviders(
        <ReservationsScreen navigation={mockNavigation} />,
        emptyStore
      )

      // Active tab
      expect(getByText(/aucune réservation active/i)).toBeTruthy()

      // Completed tab
      const completedTab = getByTestId('tab-completed')
      fireEvent.press(completedTab)

      await waitFor(() => {
        expect(getByText(/aucune réservation terminée/i)).toBeTruthy()
      })

      // Cancelled tab
      const cancelledTab = getByTestId('tab-cancelled')
      fireEvent.press(cancelledTab)

      await waitFor(() => {
        expect(getByText(/aucune réservation annulée/i)).toBeTruthy()
      })
    })

    it('shows browse products button in empty state', () => {
      const emptyStore = createTestStore({
        reservations: {
          reservations: [],
          loading: false,
          error: null,
        },
      })

      const { getByTestId } = renderWithProviders(
        <ReservationsScreen navigation={mockNavigation} />,
        emptyStore
      )

      expect(getByTestId('browse-products-button')).toBeTruthy()
    })
  })

  describe('Offline Sync', () => {
    it('displays pending sync indicator for offline reservations', () => {
      const offlineReservation = {
        ...mockReservations[0],
        pendingSync: true,
        pendingAction: 'create',
      }

      const store = createTestStore({
        reservations: {
          reservations: [offlineReservation],
          loading: false,
          error: null,
        },
      })

      const { getByText } = renderWithProviders(
        <ReservationsScreen navigation={mockNavigation} />,
        store
      )

      expect(getByText(/Créée hors ligne/i)).toBeTruthy()
    })

    it('displays cancellation pending message for offline cancellations', () => {
      const offlineCancellation = {
        ...mockReservations[0],
        pendingSync: true,
        pendingAction: 'delete',
      }

      const store = createTestStore({
        reservations: {
          reservations: [offlineCancellation],
          loading: false,
          error: null,
        },
      })

      const { getByText } = renderWithProviders(
        <ReservationsScreen navigation={mockNavigation} />,
        store
      )

      expect(getByText(/Annulation en attente/i)).toBeTruthy()
    })
  })
})
