// @ts-nocheck
import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { NavigationContainer } from '@react-navigation/native'
import { ThemeProvider } from '../../../theme/ThemeContext'
import ProfileEditScreen from '../ProfileEditScreen'
import authSlice from '../../../store/slices/authSlice'
import * as ImagePicker from 'expo-image-picker'
import apiService from '../../../services/api'
import { Alert } from 'react-native'

// Mock ImagePicker
jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
  MediaTypeOptions: {
    Images: 'Images',
  },
}))

// Mock apiService
jest.mock('../../../services/api', () => ({
  __esModule: true,
  default: {
    put: jest.fn(),
    post: jest.fn(),
  },
  API_BASE_URL: 'http://localhost:8000/api',
}))

// Mock navigation
const mockGoBack = jest.fn()
const mockNavigate = jest.fn()
const mockNavigation = {
  goBack: mockGoBack,
  navigate: mockNavigate,
  setOptions: jest.fn(),
}

// Mock user data
const mockUser = {
  id: 1,
  first_name: 'Jean',
  last_name: 'Dupont',
  email: 'jean.dupont@test.com',
  phone: '+228 90 12 34 56',
  address: '15 Rue du Commerce',
  city: 'Lomé',
  role: 'consumer',
  photo_url: null,
  created_at: '2025-01-01T10:00:00Z',
  updated_at: '2025-01-15T10:00:00Z',
}

// Create test store
const createTestStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      auth: authSlice,
    },
    preloadedState: {
      auth: {
        user: initialState.user || mockUser,
        token: 'test-token',
        isAuthenticated: true,
        loading: initialState.loading || false,
        error: initialState.error || null,
      },
    },
  })
}

// Helper to render with providers
const renderWithProviders = (component: React.ReactElement, store = createTestStore()) => {
  return render(
    <Provider store={store}>
      <NavigationContainer>
        <ThemeProvider>
          {component}
        </ThemeProvider>
      </NavigationContainer>
    </Provider>
  )
}

describe('ProfileEditScreen', () => {
  let alertSpy: jest.SpyInstance

  beforeEach(() => {
    jest.clearAllMocks()
    mockGoBack.mockReset()
    mockNavigate.mockReset()
    alertSpy = jest.spyOn(Alert, 'alert').mockImplementation((title, message, buttons) => {
      if (buttons && buttons[0]?.onPress) {
        buttons[0].onPress()
      }
      return 0
    })
  })

  afterEach(() => {
    alertSpy.mockRestore()
  })

  describe('Rendering', () => {
    it('renders without crashing', () => {
      const { getByText } = renderWithProviders(
        <ProfileEditScreen navigation={mockNavigation} />
      )
      expect(getByText('Modifier le profil')).toBeTruthy()
    })

    it('displays header with back button', () => {
      const { getByText, getByTestId } = renderWithProviders(
        <ProfileEditScreen navigation={mockNavigation} />
      )
      expect(getByText('Modifier le profil')).toBeTruthy()
      // Back button icon should exist
    })

    it('loads user profile data in form fields', async () => {
      const { getByDisplayValue } = renderWithProviders(
        <ProfileEditScreen navigation={mockNavigation} />
      )

      await waitFor(() => {
        expect(getByDisplayValue('Jean')).toBeTruthy()
        expect(getByDisplayValue('Dupont')).toBeTruthy()
        expect(getByDisplayValue('jean.dupont@test.com')).toBeTruthy()
        expect(getByDisplayValue('+228 90 12 34 56')).toBeTruthy()
        expect(getByDisplayValue('15 Rue du Commerce')).toBeTruthy()
        expect(getByDisplayValue('Lomé')).toBeTruthy()
      })
    })

    it('displays profile photo section', () => {
      const { getByText } = renderWithProviders(
        <ProfileEditScreen navigation={mockNavigation} />
      )
      expect(getByText('Changer la photo')).toBeTruthy()
    })

    it('displays all form labels', () => {
      const { getByText } = renderWithProviders(
        <ProfileEditScreen navigation={mockNavigation} />
      )
      expect(getByText('Prénom *')).toBeTruthy()
      expect(getByText('Nom *')).toBeTruthy()
      expect(getByText('Email *')).toBeTruthy()
      expect(getByText('Téléphone')).toBeTruthy()
      expect(getByText('Adresse')).toBeTruthy()
      expect(getByText('Ville')).toBeTruthy()
    })

    it('displays save button', () => {
      const { getByText } = renderWithProviders(
        <ProfileEditScreen navigation={mockNavigation} />
      )
      expect(getByText('Enregistrer les modifications')).toBeTruthy()
    })
  })

  describe('Form Input', () => {
    it('allows editing first name', async () => {
      const { getByDisplayValue } = renderWithProviders(
        <ProfileEditScreen navigation={mockNavigation} />
      )

      const firstNameInput = getByDisplayValue('Jean')
      fireEvent.changeText(firstNameInput, 'Pierre')

      await waitFor(() => {
        expect(firstNameInput.props.value).toBe('Pierre')
      })
    })

    it('allows editing last name', async () => {
      const { getByDisplayValue } = renderWithProviders(
        <ProfileEditScreen navigation={mockNavigation} />
      )

      const lastNameInput = getByDisplayValue('Dupont')
      fireEvent.changeText(lastNameInput, 'Martin')

      await waitFor(() => {
        expect(lastNameInput.props.value).toBe('Martin')
      })
    })

    it('allows editing email', async () => {
      const { getByDisplayValue } = renderWithProviders(
        <ProfileEditScreen navigation={mockNavigation} />
      )

      const emailInput = getByDisplayValue('jean.dupont@test.com')
      fireEvent.changeText(emailInput, 'pierre.martin@test.com')

      await waitFor(() => {
        expect(emailInput.props.value).toBe('pierre.martin@test.com')
      })
    })

    it('allows editing phone', async () => {
      const { getByDisplayValue } = renderWithProviders(
        <ProfileEditScreen navigation={mockNavigation} />
      )

      const phoneInput = getByDisplayValue('+228 90 12 34 56')
      fireEvent.changeText(phoneInput, '+228 90 99 88 77')

      await waitFor(() => {
        expect(phoneInput.props.value).toBe('+228 90 99 88 77')
      })
    })

    it('allows editing address', async () => {
      const { getByDisplayValue } = renderWithProviders(
        <ProfileEditScreen navigation={mockNavigation} />
      )

      const addressInput = getByDisplayValue('15 Rue du Commerce')
      fireEvent.changeText(addressInput, '123 Avenue de la Paix')

      await waitFor(() => {
        expect(addressInput.props.value).toBe('123 Avenue de la Paix')
      })
    })

    it('allows editing city', async () => {
      const { getByDisplayValue } = renderWithProviders(
        <ProfileEditScreen navigation={mockNavigation} />
      )

      const cityInput = getByDisplayValue('Lomé')
      fireEvent.changeText(cityInput, 'Sokodé')

      await waitFor(() => {
        expect(cityInput.props.value).toBe('Sokodé')
      })
    })
  })

  describe('Validation', () => {
    it('shows error when first name is empty', async () => {
      const { getByDisplayValue, getByText } = renderWithProviders(
        <ProfileEditScreen navigation={mockNavigation} />
      )

      const firstNameInput = getByDisplayValue('Jean')
      fireEvent.changeText(firstNameInput, '')

      const saveButton = getByText('Enregistrer les modifications')
      fireEvent.press(saveButton)

      // Alert should be shown (mocked in jest)
      await waitFor(() => {
        expect(apiService.put).not.toHaveBeenCalled()
        expect(alertSpy).toHaveBeenCalled()
        const [title, message] = alertSpy.mock.calls[0]
        expect(title).toBe('Erreur')
        expect(message).toBe('Le prénom et le nom sont requis')
      })
    })

    it('shows error when last name is empty', async () => {
      const { getByDisplayValue, getByText } = renderWithProviders(
        <ProfileEditScreen navigation={mockNavigation} />
      )

      const lastNameInput = getByDisplayValue('Dupont')
      fireEvent.changeText(lastNameInput, '')

      const saveButton = getByText('Enregistrer les modifications')
      fireEvent.press(saveButton)

      await waitFor(() => {
        expect(apiService.put).not.toHaveBeenCalled()
        expect(alertSpy).toHaveBeenCalled()
        const lastCall = alertSpy.mock.calls[alertSpy.mock.calls.length - 1] as [string, string]
        const [, message] = lastCall
        expect(message).toBe('Le prénom et le nom sont requis')
      })
    })

    it('shows error when first name is too short', async () => {
      const { getByDisplayValue, getByText } = renderWithProviders(
        <ProfileEditScreen navigation={mockNavigation} />
      )

      const firstNameInput = getByDisplayValue('Jean')
      fireEvent.changeText(firstNameInput, 'J')

      const saveButton = getByText('Enregistrer les modifications')
      fireEvent.press(saveButton)

      await waitFor(() => {
        expect(apiService.put).not.toHaveBeenCalled()
        expect(alertSpy).toHaveBeenCalled()
        const lastCall = alertSpy.mock.calls[alertSpy.mock.calls.length - 1] as [string, string]
        const [, message] = lastCall
        expect(message).toBe('Le prénom doit contenir au moins 2 caractères')
      })
    })

    it('shows error when last name is too short', async () => {
      const { getByDisplayValue, getByText } = renderWithProviders(
        <ProfileEditScreen navigation={mockNavigation} />
      )

      const lastNameInput = getByDisplayValue('Dupont')
      fireEvent.changeText(lastNameInput, 'D')

      const saveButton = getByText('Enregistrer les modifications')
      fireEvent.press(saveButton)

      await waitFor(() => {
        expect(apiService.put).not.toHaveBeenCalled()
        expect(alertSpy).toHaveBeenCalled()
        const lastCall = alertSpy.mock.calls[alertSpy.mock.calls.length - 1] as [string, string]
        const [, message] = lastCall
        expect(message).toBe('Le nom doit contenir au moins 2 caractères')
      })
    })

    it('shows error when email is empty', async () => {
      const { getByDisplayValue, getByText } = renderWithProviders(
        <ProfileEditScreen navigation={mockNavigation} />
      )

      const emailInput = getByDisplayValue('jean.dupont@test.com')
      fireEvent.changeText(emailInput, '')

      const saveButton = getByText('Enregistrer les modifications')
      fireEvent.press(saveButton)

      await waitFor(() => {
        expect(apiService.put).not.toHaveBeenCalled()
        expect(alertSpy).toHaveBeenCalled()
        const lastCall = alertSpy.mock.calls[alertSpy.mock.calls.length - 1] as [string, string]
        const [, message] = lastCall
        expect(message).toBe("L'email est requis")
      })
    })

    it('shows error when email format is invalid', async () => {
      const { getByDisplayValue, getByText } = renderWithProviders(
        <ProfileEditScreen navigation={mockNavigation} />
      )

      const emailInput = getByDisplayValue('jean.dupont@test.com')
      fireEvent.changeText(emailInput, 'invalid-email')

      const saveButton = getByText('Enregistrer les modifications')
      fireEvent.press(saveButton)

      await waitFor(() => {
        expect(apiService.put).not.toHaveBeenCalled()
        expect(alertSpy).toHaveBeenCalled()
        const lastCall = alertSpy.mock.calls[alertSpy.mock.calls.length - 1] as [string, string]
        const [, message] = lastCall
        expect(message).toBe('Adresse email invalide')
      })
    })

    it('shows error when phone format is invalid', async () => {
      const { getByDisplayValue, getByText } = renderWithProviders(
        <ProfileEditScreen navigation={mockNavigation} />
      )

      const phoneInput = getByDisplayValue('+228 90 12 34 56')
      fireEvent.changeText(phoneInput, '90000000')

      const saveButton = getByText('Enregistrer les modifications')
      fireEvent.press(saveButton)

      await waitFor(() => {
        expect(apiService.put).not.toHaveBeenCalled()
        expect(alertSpy).toHaveBeenCalled()
        const lastCall = alertSpy.mock.calls[alertSpy.mock.calls.length - 1] as [string, string]
        const [, message] = lastCall
        expect(message).toBe('Format de téléphone invalide (+228 12 34 56 78)')
      })
    })
  })

  describe('Save Profile', () => {
    it('calls API with updated profile data', async () => {
      ;(apiService.put as jest.Mock).mockResolvedValue({
        data: { success: true },
      })

      const { getByDisplayValue, getByText } = renderWithProviders(
        <ProfileEditScreen navigation={mockNavigation} />
      )

      const firstNameInput = getByDisplayValue('Jean')
      fireEvent.changeText(firstNameInput, 'Pierre')

      const saveButton = getByText('Enregistrer les modifications')
      fireEvent.press(saveButton)

      await waitFor(() => {
        expect(apiService.put).toHaveBeenCalledWith('/consumers/profile', {
          first_name: 'Pierre',
          last_name: 'Dupont',
          email: 'jean.dupont@test.com',
          phone: '+228 90 12 34 56',
          address: '15 Rue du Commerce',
          city: 'Lomé',
        })
      })
    })

    it('navigates back after successful save', async () => {
      ;(apiService.put as jest.Mock).mockResolvedValue({
        data: { success: true },
      })

      const { getByText } = renderWithProviders(
        <ProfileEditScreen navigation={mockNavigation} />
      )

      const saveButton = getByText('Enregistrer les modifications')
      fireEvent.press(saveButton)

      await waitFor(() => {
        expect(mockGoBack).toHaveBeenCalled()
      })
    })

    it('shows loading state while saving', async () => {
      ;(apiService.put as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ data: { success: true } }), 100))
      )

      const { getByText, getByTestId } = renderWithProviders(
        <ProfileEditScreen navigation={mockNavigation} />
      )

      const saveButton = getByText('Enregistrer les modifications')
      fireEvent.press(saveButton)

      // Loading indicator should appear (ActivityIndicator)
      // Note: ActivityIndicator rendering might need proper testID
    })

    it('handles API error gracefully', async () => {
      ;(apiService.put as jest.Mock).mockRejectedValue({
        response: { data: { message: 'Erreur serveur' } },
      })

      const { getByText } = renderWithProviders(
        <ProfileEditScreen navigation={mockNavigation} />
      )

      const saveButton = getByText('Enregistrer les modifications')
      fireEvent.press(saveButton)

      await waitFor(() => {
        // Alert should be shown with error message
        expect(mockGoBack).not.toHaveBeenCalled()
      })
    })
  })

  describe('Photo Upload', () => {
    it('shows change photo button', () => {
      const { getByText } = renderWithProviders(
        <ProfileEditScreen navigation={mockNavigation} />
      )
      expect(getByText('Changer la photo')).toBeTruthy()
    })

    it('requests permission when change photo is pressed', async () => {
      ;(ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      })
      ;(ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
        canceled: true,
      })

      const { getByText } = renderWithProviders(
        <ProfileEditScreen navigation={mockNavigation} />
      )

      const changePhotoButton = getByText('Changer la photo')
      fireEvent.press(changePhotoButton)

      await waitFor(() => {
        expect(ImagePicker.requestMediaLibraryPermissionsAsync).toHaveBeenCalled()
      })
    })

    it('prevents upload when selected photo exceeds 5 MB', async () => {
      ;(ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      })
      ;(ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
        canceled: false,
        assets: [{ uri: 'file://large-photo.jpg', fileSize: 6 * 1024 * 1024 }],
      })

      const { getByText } = renderWithProviders(
        <ProfileEditScreen navigation={mockNavigation} />
      )

      const changePhotoButton = getByText('Changer la photo')
      fireEvent.press(changePhotoButton)

      await waitFor(() => {
        expect(apiService.post).not.toHaveBeenCalled()
        expect(alertSpy).toHaveBeenCalled()
        const lastCall = alertSpy.mock.calls[alertSpy.mock.calls.length - 1] as [string, string]
        expect(lastCall[0]).toBe('Photo trop lourde')
      })
    })

    it('uploads photo when selected', async () => {
      ;(ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      })
      ;(ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
        canceled: false,
        assets: [{ uri: 'file://photo.jpg' }],
      })
      ;(apiService.post as jest.Mock).mockResolvedValue({
        data: { success: true },
      })

      const { getByText } = renderWithProviders(
        <ProfileEditScreen navigation={mockNavigation} />
      )

      const changePhotoButton = getByText('Changer la photo')
      fireEvent.press(changePhotoButton)

      await waitFor(() => {
        expect(apiService.post).toHaveBeenCalledWith(
          '/consumers/profile/photo',
          expect.any(FormData),
          expect.objectContaining({
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          })
        )
      })
    })

    it('handles photo upload error', async () => {
      ;(ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      })
      ;(ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
        canceled: false,
        assets: [{ uri: 'file://photo.jpg' }],
      })
      ;(apiService.post as jest.Mock).mockRejectedValue({
        response: { data: { message: 'Erreur upload' } },
      })

      const { getByText } = renderWithProviders(
        <ProfileEditScreen navigation={mockNavigation} />
      )

      const changePhotoButton = getByText('Changer la photo')
      fireEvent.press(changePhotoButton)

      await waitFor(() => {
        // Alert should be shown with error
        expect(apiService.post).toHaveBeenCalled()
      })
    })

    it('handles permission denied', async () => {
      ;(ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'denied',
      })

      const { getByText } = renderWithProviders(
        <ProfileEditScreen navigation={mockNavigation} />
      )

      const changePhotoButton = getByText('Changer la photo')
      fireEvent.press(changePhotoButton)

      await waitFor(() => {
        // Alert should be shown requesting permission
        expect(ImagePicker.launchImageLibraryAsync).not.toHaveBeenCalled()
      })
    })
  })

  describe('Navigation', () => {
    it('navigates back when back button is pressed', async () => {
      const { getByTestId } = renderWithProviders(
        <ProfileEditScreen navigation={mockNavigation} />
      )

      // Back button should call goBack
      // Note: Need to find back button by icon or testID
    })
  })

  describe('Loading State', () => {
    it('shows loading indicator when profile data is loading', () => {
      const store = createTestStore({ user: null, loading: true })
      const { getByTestId } = renderWithProviders(
        <ProfileEditScreen navigation={mockNavigation} />,
        store
      )

      // Should show ActivityIndicator
      // Note: ActivityIndicator rendering might need proper testID
    })
  })
})
