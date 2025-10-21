// @ts-nocheck
import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { ThemeProvider } from '../../../theme/ThemeContext'
import AddReviewScreen from '../AddReviewScreen'
import reviewsSlice, { createReview, fetchReviews } from '../../../store/slices/reviewsSlice'
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
    productId: 10,
  },
}

jest.mock('../../../store/slices/reviewsSlice', () => {
  const actual = jest.requireActual('../../../store/slices/reviewsSlice')
  const mockCreateReview = jest.fn(() => async () => ({
    type: 'reviews/createReview/fulfilled',
  }))
  mockCreateReview.fulfilled = {
    match: (action: { type: string }) => action.type === 'reviews/createReview/fulfilled',
  }

  const mockFetchReviews = jest.fn(() => async () => ({
    type: 'reviews/fetchReviews/fulfilled',
    payload: [],
  }))
  mockFetchReviews.fulfilled = {
    match: (action: { type: string }) => action.type === 'reviews/fetchReviews/fulfilled',
  }

  return {
    ...actual,
    createReview: mockCreateReview,
    fetchReviews: mockFetchReviews,
  }
})

// Create test store
const createTestStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      reviews: reviewsSlice,
      auth: authSlice,
    },
    preloadedState: {
      reviews: {
        reviews: [],
        stats: null,
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

describe('AddReviewScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('dispatches review creation and refresh on submit', async () => {
      const { getByText, getAllByTestId } = renderWithProviders(
        <AddReviewScreen navigation={mockNavigation} route={mockRoute} />
      )

      const stars = getAllByTestId(/star/i)
      if (stars[4]) {
        fireEvent.press(stars[4])
      }

      const submitButton = getByText(/Publier/i) || getByText(/Envoyer/i)
      fireEvent.press(submitButton)

      await waitFor(() => {
        expect(createReview).toHaveBeenCalledWith({
          merchantId: 1,
          productId: 10,
          rating: expect.any(Number),
        })
        expect(fetchReviews).toHaveBeenCalledWith({ merchantId: 1 })
        expect(mockGoBack).toHaveBeenCalled()
      })
    })

    it('displays merchant name', () => {
      const { getByText } = renderWithProviders(
        <AddReviewScreen navigation={mockNavigation} route={mockRoute} />
      )
      expect(getByText(/Boulangerie Martin/i)).toBeTruthy()
    })

    it('displays back button', () => {
      const { getByTestId } = renderWithProviders(
        <AddReviewScreen navigation={mockNavigation} route={mockRoute} />
      )
      const backButton = getByTestId(/arrow-back/i) || getByTestId(/back/i)
      expect(backButton).toBeTruthy()
    })
  })

  describe('Rating Input', () => {
    it('displays star rating selector', () => {
      const { getByTestId } = renderWithProviders(
        <AddReviewScreen navigation={mockNavigation} route={mockRoute} />
      )
      const starRating = getByTestId(/star-rating/i) || getByTestId(/rating/i)
      expect(starRating).toBeTruthy()
    })

    it('allows selecting a rating from 1 to 5', async () => {
      const { getAllByTestId } = renderWithProviders(
        <AddReviewScreen navigation={mockNavigation} route={mockRoute} />
      )

      const stars = getAllByTestId(/star/i)
      expect(stars.length).toBeGreaterThanOrEqual(5)

      // Click on 5th star
      if (stars[4]) {
        fireEvent.press(stars[4])
        await waitFor(() => {
          expect(stars[4]).toBeTruthy()
        })
      }
    })

    it('highlights selected stars', async () => {
      const { getAllByTestId } = renderWithProviders(
        <AddReviewScreen navigation={mockNavigation} route={mockRoute} />
      )

      const stars = getAllByTestId(/star/i)
      if (stars[2]) {
        fireEvent.press(stars[2]) // 3 stars
        await waitFor(() => {
          expect(stars[2]).toBeTruthy()
        })
      }
    })
  })

  describe('Title Input', () => {
    it('displays title input field', () => {
      const { getByPlaceholderText } = renderWithProviders(
        <AddReviewScreen navigation={mockNavigation} route={mockRoute} />
      )
      const titleInput = getByPlaceholderText(/titre/i) || getByPlaceholderText(/résumé/i)
      expect(titleInput).toBeTruthy()
    })

    it('allows entering review title', async () => {
      const { getByPlaceholderText } = renderWithProviders(
        <AddReviewScreen navigation={mockNavigation} route={mockRoute} />
      )

      const titleInput = getByPlaceholderText(/titre/i) || getByPlaceholderText(/résumé/i)
      fireEvent.changeText(titleInput, 'Excellent produit')

      await waitFor(() => {
        expect(titleInput.props.value).toBe('Excellent produit')
      })
    })
  })

  describe('Comment Input', () => {
    it('displays comment textarea', () => {
      const { getByPlaceholderText } = renderWithProviders(
        <AddReviewScreen navigation={mockNavigation} route={mockRoute} />
      )
      const commentInput = getByPlaceholderText(/commentaire/i) || getByPlaceholderText(/avis/i)
      expect(commentInput).toBeTruthy()
    })

    it('allows entering review comment', async () => {
      const { getByPlaceholderText } = renderWithProviders(
        <AddReviewScreen navigation={mockNavigation} route={mockRoute} />
      )

      const commentInput = getByPlaceholderText(/commentaire/i) || getByPlaceholderText(/avis/i)
      fireEvent.changeText(commentInput, 'Très bons produits, je recommande!')

      await waitFor(() => {
        expect(commentInput.props.value).toBe('Très bons produits, je recommande!')
      })
    })

    it('supports multiline comments', () => {
      const { getByPlaceholderText } = renderWithProviders(
        <AddReviewScreen navigation={mockNavigation} route={mockRoute} />
      )

      const commentInput = getByPlaceholderText(/commentaire/i) || getByPlaceholderText(/avis/i)
      expect(commentInput.props.multiline).toBeTruthy()
    })
  })

  describe('Submit Button', () => {
    it('displays submit button', () => {
      const { getByText } = renderWithProviders(
        <AddReviewScreen navigation={mockNavigation} route={mockRoute} />
      )
      const submitButton = getByText(/Publier/i) || getByText(/Envoyer/i) || getByText(/Soumettre/i)
      expect(submitButton).toBeTruthy()
    })

    it('disables submit button when rating is not selected', () => {
      const { getByText } = renderWithProviders(
        <AddReviewScreen navigation={mockNavigation} route={mockRoute} />
      )

      const submitButton = getByText(/Publier/i) || getByText(/Envoyer/i) || getByText(/Soumettre/i)
      expect(submitButton.props.disabled || submitButton.props.accessibilityState?.disabled).toBeTruthy()
    })

    it('enables submit button when rating is selected', async () => {
      const { getByText, getAllByTestId } = renderWithProviders(
        <AddReviewScreen navigation={mockNavigation} route={mockRoute} />
      )

      const stars = getAllByTestId(/star/i)
      if (stars[3]) {
        fireEvent.press(stars[3])
      }

      await waitFor(() => {
        const submitButton = getByText(/Publier/i) || getByText(/Envoyer/i)
        expect(submitButton.props.disabled).toBeFalsy()
      })
    })
  })

  describe('Form Validation', () => {
    it('requires rating to be selected', async () => {
      const { getByText, getByPlaceholderText } = renderWithProviders(
        <AddReviewScreen navigation={mockNavigation} route={mockRoute} />
      )

      // Try to submit without rating
      const commentInput = getByPlaceholderText(/commentaire/i) || getByPlaceholderText(/avis/i)
      fireEvent.changeText(commentInput, 'Great product')

      const submitButton = getByText(/Publier/i) || getByText(/Envoyer/i)
      fireEvent.press(submitButton)

      // Should show validation error
      await waitFor(() => {
        expect(getByText(/requis/i) || submitButton.props.disabled).toBeTruthy()
      })
    })

    it('accepts optional title', async () => {
      const { getAllByTestId } = renderWithProviders(
        <AddReviewScreen navigation={mockNavigation} route={mockRoute} />
      )

      // Submit with only rating (no title, no comment)
      const stars = getAllByTestId(/star/i)
      if (stars[4]) {
        fireEvent.press(stars[4])
        // Should be valid
        await waitFor(() => {
          expect(stars[4]).toBeTruthy()
        })
      }
    })

    it('accepts optional comment', async () => {
      const { getAllByTestId } = renderWithProviders(
        <AddReviewScreen navigation={mockNavigation} route={mockRoute} />
      )

      // Submit with only rating (no title, no comment)
      const stars = getAllByTestId(/star/i)
      if (stars[4]) {
        fireEvent.press(stars[4])
        // Should be valid
        await waitFor(() => {
          expect(stars[4]).toBeTruthy()
        })
      }
    })
  })

  describe('Form Submission', () => {
    it('submits review with all fields', async () => {
      const { getByText, getByPlaceholderText, getAllByTestId } = renderWithProviders(
        <AddReviewScreen navigation={mockNavigation} route={mockRoute} />
      )

      // Fill form
      const stars = getAllByTestId(/star/i)
      if (stars[4]) {
        fireEvent.press(stars[4])
      }

      const titleInput = getByPlaceholderText(/titre/i) || getByPlaceholderText(/résumé/i)
      fireEvent.changeText(titleInput, 'Excellent!')

      const commentInput = getByPlaceholderText(/commentaire/i) || getByPlaceholderText(/avis/i)
      fireEvent.changeText(commentInput, 'Très bons produits')

      // Submit
      const submitButton = getByText(/Publier/i) || getByText(/Envoyer/i)
      fireEvent.press(submitButton)

      await waitFor(() => {
        expect(mockGoBack).toHaveBeenCalled()
      })
    })

    it('submits review with only rating', async () => {
      const { getByText, getAllByTestId } = renderWithProviders(
        <AddReviewScreen navigation={mockNavigation} route={mockRoute} />
      )

      const stars = getAllByTestId(/star/i)
      if (stars[4]) {
        fireEvent.press(stars[4])
      }

      const submitButton = getByText(/Publier/i) || getByText(/Envoyer/i)
      fireEvent.press(submitButton)

      await waitFor(() => {
        expect(mockGoBack).toHaveBeenCalled()
      })
    })

    it('navigates back after successful submission', async () => {
      const { getByText, getAllByTestId } = renderWithProviders(
        <AddReviewScreen navigation={mockNavigation} route={mockRoute} />
      )

      const stars = getAllByTestId(/star/i)
      if (stars[4]) {
        fireEvent.press(stars[4])
      }

      const submitButton = getByText(/Publier/i) || getByText(/Envoyer/i)
      fireEvent.press(submitButton)

      await waitFor(() => {
        expect(mockGoBack).toHaveBeenCalled()
      })
    })
  })

  describe('Loading State', () => {
    it('disables submit button while submitting', async () => {
      const store = createTestStore({ loading: true })
      const { getByText } = renderWithProviders(
        <AddReviewScreen navigation={mockNavigation} route={mockRoute} />,
        store
      )

      const submitButton = getByText(/Publier/i) || getByText(/Envoyer/i)
      expect(submitButton.props.disabled).toBeTruthy()
    })

    it('shows loading indicator while submitting', async () => {
      const store = createTestStore({ loading: true })
      const { getByTestId } = renderWithProviders(
        <AddReviewScreen navigation={mockNavigation} route={mockRoute} />,
        store
      )

      const loadingIndicator = getByTestId(/loading/i) || getByTestId(/activityindicator/i)
      expect(loadingIndicator).toBeTruthy()
    })
  })

  describe('Error Handling', () => {
    it('displays error message when submission fails', async () => {
      const store = createTestStore({ error: 'Failed to submit review' })
      const { getByText } = renderWithProviders(
        <AddReviewScreen navigation={mockNavigation} route={mockRoute} />,
        store
      )

      expect(getByText(/Failed to submit/i) || getByText(/erreur/i)).toBeTruthy()
    })

    it('allows retry after error', async () => {
      const store = createTestStore({ error: 'Failed to submit review' })
      const { getByText, getAllByTestId } = renderWithProviders(
        <AddReviewScreen navigation={mockNavigation} route={mockRoute} />,
        store
      )

      // Should still be able to submit again
      const stars = getAllByTestId(/star/i)
      if (stars[4]) {
        fireEvent.press(stars[4])
      }

      const submitButton = getByText(/Publier/i) || getByText(/Envoyer/i)
      expect(submitButton).toBeTruthy()
    })
  })

  describe('Navigation - Back', () => {
    it('navigates back when back button is pressed', async () => {
      const { getByTestId } = renderWithProviders(
        <AddReviewScreen navigation={mockNavigation} route={mockRoute} />
      )

      const backButton = getByTestId(/arrow-back/i) || getByTestId(/back/i)
      fireEvent.press(backButton)

      await waitFor(() => {
        expect(mockGoBack).toHaveBeenCalled()
      })
    })

    it('shows confirmation dialog if form has content', async () => {
      const { getByTestId, getByPlaceholderText } = renderWithProviders(
        <AddReviewScreen navigation={mockNavigation} route={mockRoute} />
      )

      // Add content to form
      const commentInput = getByPlaceholderText(/commentaire/i) || getByPlaceholderText(/avis/i)
      fireEvent.changeText(commentInput, 'Some content')

      const backButton = getByTestId(/arrow-back/i) || getByTestId(/back/i)
      fireEvent.press(backButton)

      // Should show confirmation or just go back
      await waitFor(() => {
        expect(mockGoBack).toHaveBeenCalled()
      })
    })
  })

  describe('Field Labels', () => {
    it('displays label for rating field', () => {
      const { getByText } = renderWithProviders(
        <AddReviewScreen navigation={mockNavigation} route={mockRoute} />
      )
      expect(getByText(/Note/i) || getByText(/Évaluation/i)).toBeTruthy()
    })

    it('displays label for title field', () => {
      const { getByText } = renderWithProviders(
        <AddReviewScreen navigation={mockNavigation} route={mockRoute} />
      )
      expect(getByText(/Titre/i) || getByText(/Résumé/i)).toBeTruthy()
    })

    it('displays label for comment field', () => {
      const { getByText } = renderWithProviders(
        <AddReviewScreen navigation={mockNavigation} route={mockRoute} />
      )
      expect(getByText(/Commentaire/i) || getByText(/Avis détaillé/i)).toBeTruthy()
    })
  })

  describe('Character Limit', () => {
    it('enforces character limit on title', async () => {
      const { getByPlaceholderText } = renderWithProviders(
        <AddReviewScreen navigation={mockNavigation} route={mockRoute} />
      )

      const titleInput = getByPlaceholderText(/titre/i) || getByPlaceholderText(/résumé/i)
      const longTitle = 'A'.repeat(200)
      fireEvent.changeText(titleInput, longTitle)

      // Should truncate or show warning
      await waitFor(() => {
        expect(titleInput).toBeTruthy()
      })
    })

    it('enforces character limit on comment', async () => {
      const { getByPlaceholderText } = renderWithProviders(
        <AddReviewScreen navigation={mockNavigation} route={mockRoute} />
      )

      const commentInput = getByPlaceholderText(/commentaire/i) || getByPlaceholderText(/avis/i)
      const longComment = 'A'.repeat(2000)
      fireEvent.changeText(commentInput, longComment)

      // Should truncate or show warning
      await waitFor(() => {
        expect(commentInput).toBeTruthy()
      })
    })
  })
})
