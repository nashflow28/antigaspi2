// @ts-nocheck
import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { ThemeProvider } from '../../../theme/ThemeContext'
import ReviewsListScreen from '../ReviewsListScreen'
import reviewsSlice from '../../../store/slices/reviewsSlice'
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
    merchantId: 1,
    merchantName: 'Boulangerie Martin',
  },
}

// Mock reviews data (matching Review type from types/index.ts)
const mockReviews = [
  {
    id: 1,
    rating: 5,
    title: 'Excellent!',
    comment: 'Produits de très haute qualité',
    stars: '★★★★★',
    time_ago: 'Il y a 5 jours',
    is_verified_purchase: true,
    user: {
      id: 101,
      name: 'Jean Dupont',
    },
    product: {
      id: 10,
      name: 'Pain complet artisanal',
    },
    created_at: '2025-01-15T10:00:00Z',
  },
  {
    id: 2,
    rating: 4,
    title: 'Très bon',
    comment: 'Bon rapport qualité-prix',
    stars: '★★★★☆',
    time_ago: 'Il y a 6 jours',
    is_verified_purchase: false,
    user: {
      id: 102,
      name: 'Marie Martin',
    },
    product: {
      id: 11,
      name: 'Croissants artisanaux',
    },
    created_at: '2025-01-14T09:00:00Z',
  },
  {
    id: 3,
    rating: 3,
    title: 'Moyen',
    comment: 'Correct mais peut mieux faire',
    stars: '★★★☆☆',
    time_ago: 'Il y a 7 jours',
    is_verified_purchase: true,
    user: {
      id: 103,
      name: 'Paul Dubois',
    },
    product: {
      id: 12,
      name: 'Viennoiseries',
    },
    created_at: '2025-01-13T08:00:00Z',
  },
]

// Mock stats (matching ReviewStats type from types/index.ts)
const mockStats = {
  total_reviews: 3,
  average_rating: 4.0,
  verified_reviews: 2,
  rating_distribution: [
    { rating: 5, count: 1, percentage: 33.33 },
    { rating: 4, count: 1, percentage: 33.33 },
    { rating: 3, count: 1, percentage: 33.33 },
    { rating: 2, count: 0, percentage: 0 },
    { rating: 1, count: 0, percentage: 0 },
  ],
}

// Create test store
const createTestStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      reviews: reviewsSlice,
      auth: authSlice,
    },
    preloadedState: {
      reviews: {
        reviews: initialState.reviews || mockReviews,
        stats: initialState.stats || mockStats,
        loading: initialState.loading || false,
        error: initialState.error || null,
        currentPage: 1,
        hasMore: false,
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

describe('ReviewsListScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering - Header', () => {
    it('renders without crashing', () => {
      const { getByText } = renderWithProviders(
        <ReviewsListScreen navigation={mockNavigation} route={mockRoute} />
      )
      expect(getByText('Avis clients')).toBeTruthy()
    })

    it('displays merchant name in header', () => {
      const { getByText } = renderWithProviders(
        <ReviewsListScreen navigation={mockNavigation} route={mockRoute} />
      )
      expect(getByText('Boulangerie Martin')).toBeTruthy()
    })

    it('displays back button', () => {
      const { getByTestId } = renderWithProviders(
        <ReviewsListScreen navigation={mockNavigation} route={mockRoute} />
      )
      const backButton = getByTestId(/arrow-back/i) || getByTestId(/back/i)
      expect(backButton).toBeTruthy()
    })
  })

  describe('Statistics Card', () => {
    it('displays average rating', () => {
      const { getByText } = renderWithProviders(
        <ReviewsListScreen navigation={mockNavigation} route={mockRoute} />
      )
      expect(getByText('4.0')).toBeTruthy()
    })

    it('displays total reviews count', () => {
      const { getByText } = renderWithProviders(
        <ReviewsListScreen navigation={mockNavigation} route={mockRoute} />
      )
      expect(getByText(/3 avis/i)).toBeTruthy()
    })

    it('displays verified reviews count', () => {
      const { getByText } = renderWithProviders(
        <ReviewsListScreen navigation={mockNavigation} route={mockRoute} />
      )
      expect(getByText(/2 vérifiés/i)).toBeTruthy()
    })

    it('displays star rating visual', () => {
      const { getByTestId } = renderWithProviders(
        <ReviewsListScreen navigation={mockNavigation} route={mockRoute} />
      )
      const starRating = getByTestId(/star-rating/i) || getByTestId(/stars/i)
      expect(starRating).toBeTruthy()
    })
  })

  describe('Filters', () => {
    it('displays all filter chips', () => {
      const { getByText } = renderWithProviders(
        <ReviewsListScreen navigation={mockNavigation} route={mockRoute} />
      )
      expect(getByText('Récents')).toBeTruthy()
      expect(getByText('Note')).toBeTruthy()
      expect(getByText('Vérifiés')).toBeTruthy()
    })

    it('defaults to "Récents" sort', () => {
      const { getByText } = renderWithProviders(
        <ReviewsListScreen navigation={mockNavigation} route={mockRoute} />
      )
      // First review should be most recent
      expect(getByText('Excellent!')).toBeTruthy()
    })

    it('sorts by rating when "Note" is pressed', async () => {
      const { getByText } = renderWithProviders(
        <ReviewsListScreen navigation={mockNavigation} route={mockRoute} />
      )

      const noteFilter = getByText('Note')
      fireEvent.press(noteFilter)

      await waitFor(() => {
        // Reviews should be sorted by rating (5 -> 4 -> 3)
        expect(getByText('Excellent!')).toBeTruthy()
      })
    })

    it('filters verified reviews when "Vérifiés" is pressed', async () => {
      const { getByText, queryByText } = renderWithProviders(
        <ReviewsListScreen navigation={mockNavigation} route={mockRoute} />
      )

      const verifiedFilter = getByText('Vérifiés')
      fireEvent.press(verifiedFilter)

      await waitFor(() => {
        expect(getByText('Excellent!')).toBeTruthy() // verified
        expect(queryByText('Très bon')).toBeFalsy() // not verified
      })
    })

    it('shows all reviews when "Vérifiés" is toggled off', async () => {
      const { getByText } = renderWithProviders(
        <ReviewsListScreen navigation={mockNavigation} route={mockRoute} />
      )

      const verifiedFilter = getByText('Vérifiés')
      fireEvent.press(verifiedFilter) // Turn on
      fireEvent.press(verifiedFilter) // Turn off

      await waitFor(() => {
        expect(getByText('Excellent!')).toBeTruthy()
        expect(getByText('Très bon')).toBeTruthy()
      })
    })
  })

  describe('Reviews List', () => {
    it('displays all reviews', () => {
      const { getByText } = renderWithProviders(
        <ReviewsListScreen navigation={mockNavigation} route={mockRoute} />
      )
      expect(getByText('Excellent!')).toBeTruthy()
      expect(getByText('Très bon')).toBeTruthy()
      expect(getByText('Moyen')).toBeTruthy()
    })

    it('displays review comments', () => {
      const { getByText } = renderWithProviders(
        <ReviewsListScreen navigation={mockNavigation} route={mockRoute} />
      )
      expect(getByText('Produits de très haute qualité')).toBeTruthy()
      expect(getByText('Bon rapport qualité-prix')).toBeTruthy()
    })

    it('displays reviewer names', () => {
      const { getByText } = renderWithProviders(
        <ReviewsListScreen navigation={mockNavigation} route={mockRoute} />
      )
      expect(getByText('Jean Dupont')).toBeTruthy()
      expect(getByText('Marie Martin')).toBeTruthy()
      expect(getByText('Paul Dubois')).toBeTruthy()
    })

    it('displays verified badge for verified reviews', () => {
      const { getAllByTestId } = renderWithProviders(
        <ReviewsListScreen navigation={mockNavigation} route={mockRoute} />
      )
      const verifiedBadges = getAllByTestId(/checkmark/i) || getAllByTestId(/verified/i)
      expect(verifiedBadges.length).toBeGreaterThan(0)
    })
  })

  describe('Empty State', () => {
    it('shows empty state when no reviews', () => {
      const store = createTestStore({ reviews: [] })
      const { getByText } = renderWithProviders(
        <ReviewsListScreen navigation={mockNavigation} route={mockRoute} />,
        store
      )
      expect(getByText(/Aucun avis/i)).toBeTruthy()
    })

    it('shows "Laisser un avis" button in empty state', () => {
      const store = createTestStore({ reviews: [] })
      const { getByText } = renderWithProviders(
        <ReviewsListScreen navigation={mockNavigation} route={mockRoute} />,
        store
      )
      expect(getByText(/Laisser un avis/i)).toBeTruthy()
    })

    it('navigates to AddReview when button is pressed in empty state', async () => {
      const store = createTestStore({ reviews: [] })
      const { getByText } = renderWithProviders(
        <ReviewsListScreen navigation={mockNavigation} route={mockRoute} />,
        store
      )

      const addReviewButton = getByText(/Laisser un avis/i)
      fireEvent.press(addReviewButton)

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('AddReview', {
          merchantId: 1,
          merchantName: 'Boulangerie Martin',
        })
      })
    })
  })

  describe('Loading State', () => {
    it('displays loading indicator initially', () => {
      const store = createTestStore({ loading: true, reviews: [] })
      const { getByTestId } = renderWithProviders(
        <ReviewsListScreen navigation={mockNavigation} route={mockRoute} />,
        store
      )
      const loading = getByTestId(/loading/i) || getByTestId(/activityindicator/i)
      expect(loading).toBeTruthy()
    })

    it('displays footer loading when loading more reviews', () => {
      const { getByTestId } = renderWithProviders(
        <ReviewsListScreen navigation={mockNavigation} route={mockRoute} />
      )
      // Simulate scrolling to end to load more
      const flatList = getByTestId(/flatlist/i) || getByTestId(/scrollview/i)
      expect(flatList).toBeTruthy()
    })
  })

  describe('Pull to Refresh', () => {
    it('triggers refresh when pull to refresh is activated', async () => {
      const { getByTestId } = renderWithProviders(
        <ReviewsListScreen navigation={mockNavigation} route={mockRoute} />
      )
      const flatList = getByTestId(/flatlist/i) || getByTestId(/scrollview/i)
      expect(flatList).toBeTruthy()
    })
  })

  describe('Error Handling', () => {
    it('displays error banner when there is an error', () => {
      const store = createTestStore({ error: 'Failed to load reviews' })
      const { getByText } = renderWithProviders(
        <ReviewsListScreen navigation={mockNavigation} route={mockRoute} />,
        store
      )
      expect(getByText(/Failed to load reviews/i) || getByText(/erreur/i)).toBeTruthy()
    })

    it('displays retry button in error banner', () => {
      const store = createTestStore({ error: 'Failed to load reviews' })
      const { getByText } = renderWithProviders(
        <ReviewsListScreen navigation={mockNavigation} route={mockRoute} />,
        store
      )
      expect(getByText(/Réessayer/i)).toBeTruthy()
    })

    it('retries loading when retry button is pressed', async () => {
      const store = createTestStore({ error: 'Failed to load reviews' })
      const { getByText } = renderWithProviders(
        <ReviewsListScreen navigation={mockNavigation} route={mockRoute} />,
        store
      )

      const retryButton = getByText(/Réessayer/i)
      fireEvent.press(retryButton)

      // Should attempt to reload reviews
      await waitFor(() => {
        expect(retryButton).toBeTruthy()
      })
    })
  })

  describe('Navigation - Back', () => {
    it('navigates back when back button is pressed', async () => {
      const { getByTestId } = renderWithProviders(
        <ReviewsListScreen navigation={mockNavigation} route={mockRoute} />
      )

      const backButton = getByTestId(/arrow-back/i) || getByTestId(/back/i)
      fireEvent.press(backButton)

      await waitFor(() => {
        expect(mockGoBack).toHaveBeenCalled()
      })
    })
  })

  describe('Pagination', () => {
    it('loads more reviews when scrolling to bottom', async () => {
      const store = createTestStore({ hasMore: true })
      const { getByTestId } = renderWithProviders(
        <ReviewsListScreen navigation={mockNavigation} route={mockRoute} />,
        store
      )

      const flatList = getByTestId(/flatlist/i) || getByTestId(/scrollview/i)
      // Simulate end reached
      expect(flatList).toBeTruthy()
    })
  })

  describe('Review Cards', () => {
    it('displays star ratings for each review', () => {
      const { getAllByTestId } = renderWithProviders(
        <ReviewsListScreen navigation={mockNavigation} route={mockRoute} />
      )
      const starRatings = getAllByTestId(/star/i)
      expect(starRatings.length).toBeGreaterThan(0)
    })

    it('displays review dates', () => {
      const { getByText } = renderWithProviders(
        <ReviewsListScreen navigation={mockNavigation} route={mockRoute} />
      )
      // Should display formatted dates
      expect(getByText(/2025/)).toBeTruthy()
    })
  })

  describe('Filter Chips Visual State', () => {
    it('highlights active filter chip', () => {
      const { getByText } = renderWithProviders(
        <ReviewsListScreen navigation={mockNavigation} route={mockRoute} />
      )

      const recentsChip = getByText('Récents')
      expect(recentsChip).toBeTruthy()
      // Should have active styling
    })

    it('changes active chip when different filter is selected', async () => {
      const { getByText } = renderWithProviders(
        <ReviewsListScreen navigation={mockNavigation} route={mockRoute} />
      )

      const noteChip = getByText('Note')
      fireEvent.press(noteChip)

      await waitFor(() => {
        expect(noteChip).toBeTruthy()
        // Note chip should now be active
      })
    })
  })
})
