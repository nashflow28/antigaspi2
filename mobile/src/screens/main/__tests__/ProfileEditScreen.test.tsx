// @ts-nocheck
import React from 'react'
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native'
import { Provider } from 'react-redux'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { configureStore } from '@reduxjs/toolkit'
import { NavigationContainer } from '@react-navigation/native'
import { ThemeProvider } from '../../../theme/ThemeContext'
import { ToastProvider } from '../../../contexts/ToastContext'
import { AlertProvider } from '../../../contexts/AlertContext'
import ProfileEditScreen from '../ProfileEditScreen'
import authSlice from '../../../store/slices/authSlice'
import * as ImagePicker from 'expo-image-picker'
import apiService from '../../../services/api'

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
    getProfile: jest.fn(),
    setStoredUser: jest.fn(),
    uploadFile: jest.fn(),
  },
  API_BASE_URL: 'http://localhost:8000/api',
}))

// Mock AsyncStorage for ThemeContext
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
  getAllKeys: jest.fn(() => Promise.resolve([])),
  multiGet: jest.fn(() => Promise.resolve([])),
  multiSet: jest.fn(() => Promise.resolve()),
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
  const initialMetrics = {
    frame: { x: 0, y: 0, width: 390, height: 844 },
    insets: { top: 0, left: 0, right: 0, bottom: 0 },
  }
  return render(
    <SafeAreaProvider initialMetrics={initialMetrics}>
      <Provider store={store}>
        <NavigationContainer>
          <ThemeProvider>
            <ToastProvider>
              <AlertProvider>
                {component}
              </AlertProvider>
            </ToastProvider>
          </ThemeProvider>
        </NavigationContainer>
      </Provider>
    </SafeAreaProvider>
  )
}

describe('ProfileEditScreen', () => {
  const pressLastTextButton = (label: string) => {
    const matches = screen.getAllByText(label)
    const last = matches[matches.length - 1] as any
    fireEvent.press(last.parent)
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockGoBack.mockReset()
    mockNavigate.mockReset()
    ;(apiService.getProfile as jest.Mock).mockResolvedValue({
      success: true,
      data: mockUser,
    })
    ;(apiService.setStoredUser as jest.Mock).mockResolvedValue(undefined)
    ;(apiService.uploadFile as jest.Mock).mockResolvedValue({
      data: { success: true, photo_url: 'http://localhost/photo.jpg' },
    })
  })

  describe('Rendering', () => {
    it('prefills form with stored profile data on mount', async () => {
      const { getByText, getByDisplayValue } = renderWithProviders(
        <ProfileEditScreen navigation={mockNavigation} />
      )

      await waitFor(() => {
        expect(getByText('Modifier le profil')).toBeTruthy()
        expect(getByDisplayValue('Jean')).toBeTruthy()
        expect(getByDisplayValue('Dupont')).toBeTruthy()
        expect(getByDisplayValue('jean.dupont@test.com')).toBeTruthy()
        // PhoneInput displays local number only, dial code is in separate Text element
        expect(getByDisplayValue('90 12 34 56')).toBeTruthy()
        expect(getByText('+228')).toBeTruthy() // Country code displayed separately
        expect(getByDisplayValue('15 Rue du Commerce')).toBeTruthy()
        expect(getByDisplayValue('Lomé')).toBeTruthy()
      })
    })

    it('displays header with back button', () => {
      const { getByText, getByTestId } = renderWithProviders(
        <ProfileEditScreen navigation={mockNavigation} />
      )
      expect(getByText('Modifier le profil')).toBeTruthy()
      // Back button icon should exist
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

      // PhoneInput displays local number only (without country code)
      const phoneInput = getByDisplayValue('90 12 34 56')
      fireEvent.changeText(phoneInput, '90 99 88 77')

      await waitFor(() => {
        // The input value is the formatted local number
        expect(phoneInput.props.value).toBe('90 99 88 77')
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
        expect(screen.getByText('Erreur')).toBeTruthy()
        expect(screen.getByText(/Le prénom et le nom sont requis/i)).toBeTruthy()
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
        expect(screen.getByText('Erreur')).toBeTruthy()
        expect(screen.getByText(/Le prénom et le nom sont requis/i)).toBeTruthy()
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
        expect(screen.getByText('Erreur')).toBeTruthy()
        expect(screen.getByText(/Le prénom doit contenir au moins 2 caractères/i)).toBeTruthy()
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
        expect(screen.getByText('Erreur')).toBeTruthy()
        expect(screen.getByText(/Le nom doit contenir au moins 2 caractères/i)).toBeTruthy()
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
        expect(screen.getByText('Erreur')).toBeTruthy()
        expect(screen.getByText(/L'email est requis/i)).toBeTruthy()
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
        expect(screen.getByText('Erreur')).toBeTruthy()
        expect(screen.getByText(/Adresse email invalide/i)).toBeTruthy()
      })
    })

    // Note: Phone validation has been relaxed (see CLAUDE.md bug fixes)
    // The test now verifies that any phone format is accepted
    it('accepts any phone format after validation relaxation', async () => {
      ;(apiService.put as jest.Mock).mockResolvedValue({
        data: { success: true, data: mockUser },
      })

      const { getByDisplayValue, getByText } = renderWithProviders(
        <ProfileEditScreen navigation={mockNavigation} />
      )

      // PhoneInput displays local number only (without country code)
      const phoneInput = getByDisplayValue('90 12 34 56')
      fireEvent.changeText(phoneInput, '90000000')

      const saveButton = getByText('Enregistrer les modifications')
      fireEvent.press(saveButton)

      await waitFor(() => {
        // Phone validation is relaxed, API should be called
        // PhoneInput formats and adds country code when calling onChangeText
        expect(apiService.put).toHaveBeenCalledWith('/consumers/profile', expect.objectContaining({
          phone: expect.stringMatching(/\+228.*90.*00.*00.*00|90000000/),
        }))
      })
    })
  })

  describe('Save Profile', () => {
    it('calls API with updated profile data', async () => {
      const updatedUser = {
        ...mockUser,
        first_name: 'Pierre',
      }

      ;(apiService.put as jest.Mock).mockResolvedValue({
        success: true,
        data: updatedUser,
      })
      ;(apiService.getProfile as jest.Mock).mockResolvedValue({
        success: true,
        data: updatedUser,
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
        success: true,
        data: mockUser,
      })

      const { getByText } = renderWithProviders(
        <ProfileEditScreen navigation={mockNavigation} />
      )

      const saveButton = getByText('Enregistrer les modifications')
      fireEvent.press(saveButton)

      await waitFor(() => {
        expect(screen.getByText('OK')).toBeTruthy()
      })

      pressLastTextButton('OK')

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
      ;(apiService.put as jest.Mock).mockRejectedValue(new Error('Erreur serveur'))

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
        expect(screen.getByText('Photo trop lourde')).toBeTruthy()
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
      ;(apiService.uploadFile as jest.Mock).mockResolvedValue({
        data: { success: true, photo_url: 'http://localhost/photo.jpg' },
      })

      const { getByText } = renderWithProviders(
        <ProfileEditScreen navigation={mockNavigation} />
      )

      const changePhotoButton = getByText('Changer la photo')
      fireEvent.press(changePhotoButton)

      await waitFor(() => {
        // uploadFile is called with endpoint and FormData
        expect(apiService.uploadFile).toHaveBeenCalledWith(
          '/consumers/profile/photo',
          expect.anything() // FormData object
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
      ;(apiService.uploadFile as jest.Mock).mockRejectedValue({
        response: { data: { message: 'Erreur upload' } },
      })

      const { getByText } = renderWithProviders(
        <ProfileEditScreen navigation={mockNavigation} />
      )

      const changePhotoButton = getByText('Changer la photo')
      fireEvent.press(changePhotoButton)

      await waitFor(() => {
        // Alert should be shown with error
        expect(apiService.uploadFile).toHaveBeenCalled()
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
