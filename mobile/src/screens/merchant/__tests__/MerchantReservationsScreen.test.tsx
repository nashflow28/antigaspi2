import React from 'react';
import { render, mockStore } from '../../../__tests__/test-utils';
import MerchantReservationsScreen from '../MerchantReservationsScreen';
import { TEST_IDS } from '../../../utils/testIds';

describe('MerchantReservationsScreen', () => {
  let store: any;

  beforeEach(() => {
    store = mockStore({
      auth: {
        user: {
          id: 2,
          first_name: 'Marie',
          last_name: 'Martin',
          email: 'boulangerie.martin@email.com',
          role: 'merchant',
          merchant: {
            id: 1,
            business_name: 'Boulangerie Martin'
          }
        },
        token: 'test-token',
        isAuthenticated: true,
        loading: false,
        error: null
      },
      reservations: {
        reservations: [
          {
            id: 1,
            reservation_code: 'RES001',
            status: 'pending',
            product: {
              id: 1,
              name: 'Pain artisanal',
              merchant_id: 1
            },
            user: {
              id: 1,
              first_name: 'Jean',
              last_name: 'Dupont'
            },
            quantity: 2,
            total_amount: '500.00',
            created_at: '2025-10-18T10:00:00Z',
            merchant_id: 1
          },
          {
            id: 2,
            reservation_code: 'RES002',
            status: 'confirmed',
            product: {
              id: 2,
              name: 'Croissants',
              merchant_id: 1
            },
            user: {
              id: 3,
              first_name: 'Sophie',
              last_name: 'Dubois'
            },
            quantity: 5,
            total_amount: '750.00',
            created_at: '2025-10-18T11:00:00Z',
            merchant_id: 1
          },
          {
            id: 3,
            reservation_code: 'RES003',
            status: 'completed',
            product: {
              id: 1,
              name: 'Pain artisanal',
              merchant_id: 1
            },
            user: {
              id: 4,
              first_name: 'Pierre',
              last_name: 'Martin'
            },
            quantity: 1,
            total_amount: '250.00',
            created_at: '2025-10-17T14:00:00Z',
            merchant_id: 1
          }
        ],
        loading: false,
        error: null
      },
      products: {
        products: [],
        selectedProduct: null,
        loading: false,
        error: null
      },
      reviews: {
        reviews: [],
        stats: { averageRating: 0, totalReviews: 0 },
        loading: false,
        error: null
      },
      favorites: {
        favorites: [],
        loading: false,
        error: null
      },
      merchants: {
        merchants: [],
        selectedMerchant: null,
        loading: false,
        error: null
      },
      connectivity: {
        isOnline: true
      }
    });
  });

  it('should render merchant reservations screen', () => {
    const { getByText } = render(
      <MerchantReservationsScreen />,
      { store }
    );

    expect(getByText('Réservations')).toBeTruthy();
  });

  it('should display filter tabs', () => {
    const { getByText } = render(
      <MerchantReservationsScreen />,
      { store }
    );

    expect(getByText('Toutes')).toBeTruthy();
    expect(getByText('En attente')).toBeTruthy();
    expect(getByText('Confirmées')).toBeTruthy();
  });

  it('should show empty state when no reservations', () => {
    const emptyStore = mockStore({
      ...store.getState(),
      reservations: {
        reservations: [],
        loading: false,
        error: null
      }
    });

    const { getByText } = render(
      <MerchantReservationsScreen />,
      { store: emptyStore }
    );

    expect(getByText('Aucune réservation')).toBeTruthy();
  });
});
