// @ts-nocheck
import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { Alert } from 'react-native'
import AdminCategoriesScreen from '../AdminCategoriesScreen'
import authSlice from '../../../store/slices/authSlice'
import { ThemeProvider } from '../../../theme/ThemeContext'
import apiService from '../../../services/api'

// Mock navigation
const mockNavigate = jest.fn()
const mockNavigation = {
  navigate: mockNavigate,
  goBack: jest.fn(),
  setOptions: jest.fn(),
}

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => mockNavigation,
}))

// Mock Alert
jest.spyOn(Alert, 'alert')

// Mock categories data
const mockCategories = [
  {
    id: 1,
    name: 'Boulangerie',
    description: 'Pains, viennoiseries et pâtisseries',
    products_count: 5,
    active_products: 3,
  },
  {
    id: 2,
    name: 'Fruits & Légumes',
    description: 'Produits frais de saison',
    products_count: 0,
    active_products: 0,
  },
]

jest.mock('../../../services/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}))

// Create test store
const createTestStore = () => {
  return configureStore({
    reducer: {
      auth: authSlice,
    },
    preloadedState: {
      auth: {
        user: {
          id: 1,
          first_name: 'Admin',
          last_name: 'User',
          email: 'admin@antigaspi.com',
          role: 'admin',
          city: 'Lomé',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
        },
        token: 'admin-token',
        isAuthenticated: true,
        loading: false,
        error: null,
      },
    },
  })
}

// Helper to render with providers
const renderWithProviders = (component: React.ReactElement, store: any) => {
  return render(
    <Provider store={store}>
      <ThemeProvider>{component}</ThemeProvider>
    </Provider>
  )
}

describe('AdminCategoriesScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    apiService.get.mockResolvedValue({
      data: mockCategories,
    })
  })

  describe('Data Loading', () => {
    it('loads categories from /admin/categories endpoint on mount', async () => {
      const store = createTestStore()
      renderWithProviders(<AdminCategoriesScreen />, store)

      await waitFor(() => {
        expect(apiService.get).toHaveBeenCalledWith('/admin/categories')
      })
    })

    it('displays loading state initially', () => {
      const store = createTestStore()
      const { getByText } = renderWithProviders(<AdminCategoriesScreen />, store)

      expect(getByText('Chargement des catégories...')).toBeTruthy()
    })

    it('displays categories after loading', async () => {
      const store = createTestStore()
      const { getByText } = renderWithProviders(<AdminCategoriesScreen />, store)

      await waitFor(() => {
        expect(getByText('Boulangerie')).toBeTruthy()
        expect(getByText('Fruits & Légumes')).toBeTruthy()
      })
    })

    it('shows empty state when no categories', async () => {
      apiService.get.mockResolvedValueOnce({
        data: [],
      })

      const store = createTestStore()
      const { getByText } = renderWithProviders(<AdminCategoriesScreen />, store)

      await waitFor(() => {
        expect(getByText('Aucune catégorie')).toBeTruthy()
        expect(getByText('Créez votre première catégorie pour commencer')).toBeTruthy()
      })
    })

    it('handles API error gracefully', async () => {
      apiService.get.mockRejectedValueOnce(new Error('Network error'))

      const store = createTestStore()
      renderWithProviders(<AdminCategoriesScreen />, store)

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Erreur', 'Impossible de charger les catégories')
      })
    })
  })

  describe('Create Category', () => {
    it('opens create modal when add button is pressed', async () => {
      const store = createTestStore()
      const { getByText, getAllByTestId } = renderWithProviders(
        <AdminCategoriesScreen />,
        store
      )

      await waitFor(() => {
        expect(getByText('Boulangerie')).toBeTruthy()
      })

      // Find and press the add button (Ionicons add-circle)
      const addIcons = getAllByTestId(/ionicons/i)
      const addButton = addIcons.find((icon) => icon.props.name === 'add-circle')
      if (addButton) {
        fireEvent.press(addButton)
      }

      await waitFor(() => {
        expect(getByText('Nouvelle catégorie')).toBeTruthy()
      })
    })

    it('creates category with valid name (min 3 chars)', async () => {
      apiService.post.mockResolvedValueOnce({
        data: {
          id: 3,
          name: 'Viandes',
          description: 'Produits carnés frais',
          products_count: 0,
          active_products: 0,
        },
      })

      const store = createTestStore()
      const { getByText, getByPlaceholderText, getAllByTestId } = renderWithProviders(
        <AdminCategoriesScreen />,
        store
      )

      await waitFor(() => {
        expect(getByText('Boulangerie')).toBeTruthy()
      })

      // Open create modal
      const addIcons = getAllByTestId(/ionicons/i)
      const addButton = addIcons.find((icon) => icon.props.name === 'add-circle')
      if (addButton) {
        fireEvent.press(addButton)
      }

      await waitFor(() => {
        expect(getByText('Nouvelle catégorie')).toBeTruthy()
      })

      // Fill form
      const nameInput = getByPlaceholderText('Ex: Boulangerie, Fruits & Légumes')
      const descriptionInput = getByPlaceholderText('Description de la catégorie...')

      fireEvent.changeText(nameInput, 'Viandes')
      fireEvent.changeText(descriptionInput, 'Produits carnés frais')

      // Submit
      const createButton = getByText('Créer')
      fireEvent.press(createButton)

      await waitFor(() => {
        expect(apiService.post).toHaveBeenCalledWith('/admin/categories', {
          name: 'Viandes',
          description: 'Produits carnés frais',
        })
        expect(Alert.alert).toHaveBeenCalledWith('Succès', 'Catégorie créée avec succès')
      })
    })

    it('rejects category creation if name < 3 chars', async () => {
      const store = createTestStore()
      const { getByText, getByPlaceholderText, getAllByTestId } = renderWithProviders(
        <AdminCategoriesScreen />,
        store
      )

      await waitFor(() => {
        expect(getByText('Boulangerie')).toBeTruthy()
      })

      // Open create modal
      const addIcons = getAllByTestId(/ionicons/i)
      const addButton = addIcons.find((icon) => icon.props.name === 'add-circle')
      if (addButton) {
        fireEvent.press(addButton)
      }

      await waitFor(() => {
        expect(getByText('Nouvelle catégorie')).toBeTruthy()
      })

      // Fill form with invalid name
      const nameInput = getByPlaceholderText('Ex: Boulangerie, Fruits & Légumes')
      fireEvent.changeText(nameInput, 'AB')

      // Submit
      const createButton = getByText('Créer')
      fireEvent.press(createButton)

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Erreur',
          'Le nom doit contenir au moins 3 caractères'
        )
        expect(apiService.post).not.toHaveBeenCalled()
      })
    })

    it('handles server error when response.data is null', async () => {
      apiService.post.mockResolvedValueOnce({
        data: null,
      })

      const store = createTestStore()
      const { getByText, getByPlaceholderText, getAllByTestId } = renderWithProviders(
        <AdminCategoriesScreen />,
        store
      )

      await waitFor(() => {
        expect(getByText('Boulangerie')).toBeTruthy()
      })

      // Open create modal
      const addIcons = getAllByTestId(/ionicons/i)
      const addButton = addIcons.find((icon) => icon.props.name === 'add-circle')
      if (addButton) {
        fireEvent.press(addButton)
      }

      await waitFor(() => {
        expect(getByText('Nouvelle catégorie')).toBeTruthy()
      })

      // Fill form
      const nameInput = getByPlaceholderText('Ex: Boulangerie, Fruits & Légumes')
      fireEvent.changeText(nameInput, 'Test Category')

      // Submit
      const createButton = getByText('Créer')
      fireEvent.press(createButton)

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Erreur', 'Réponse invalide du serveur')
      })
    })
  })

  describe('Edit Category', () => {
    it('opens edit modal with prefilled data when edit button is pressed', async () => {
      const store = createTestStore()
      const { getByText, getAllByTestId, getByDisplayValue } = renderWithProviders(
        <AdminCategoriesScreen />,
        store
      )

      await waitFor(() => {
        expect(getByText('Boulangerie')).toBeTruthy()
      })

      // Find and press edit button (Ionicons pencil)
      const editIcons = getAllByTestId(/ionicons/i)
      const editButton = editIcons.find((icon) => icon.props.name === 'pencil')
      if (editButton) {
        fireEvent.press(editButton)
      }

      await waitFor(() => {
        expect(getByText('Modifier la catégorie')).toBeTruthy()
        expect(getByDisplayValue('Boulangerie')).toBeTruthy()
        expect(getByDisplayValue('Pains, viennoiseries et pâtisseries')).toBeTruthy()
      })
    })

    it('updates category successfully', async () => {
      apiService.put.mockResolvedValueOnce({
        data: {
          id: 1,
          name: 'Boulangerie Artisanale',
          description: 'Pains et viennoiseries artisanales',
        },
      })

      const store = createTestStore()
      const { getByText, getAllByTestId, getByDisplayValue } = renderWithProviders(
        <AdminCategoriesScreen />,
        store
      )

      await waitFor(() => {
        expect(getByText('Boulangerie')).toBeTruthy()
      })

      // Open edit modal
      const editIcons = getAllByTestId(/ionicons/i)
      const editButton = editIcons.find((icon) => icon.props.name === 'pencil')
      if (editButton) {
        fireEvent.press(editButton)
      }

      await waitFor(() => {
        expect(getByText('Modifier la catégorie')).toBeTruthy()
      })

      // Update name
      const nameInput = getByDisplayValue('Boulangerie')
      fireEvent.changeText(nameInput, 'Boulangerie Artisanale')

      // Submit
      const updateButton = getByText('Mettre à jour')
      fireEvent.press(updateButton)

      await waitFor(() => {
        expect(apiService.put).toHaveBeenCalledWith('/admin/categories/1', {
          name: 'Boulangerie Artisanale',
          description: 'Pains, viennoiseries et pâtisseries',
        })
        expect(Alert.alert).toHaveBeenCalledWith('Succès', 'Catégorie mise à jour avec succès')
      })
    })
  })

  describe('Delete Category', () => {
    it('deletes category with confirmation', async () => {
      apiService.delete.mockResolvedValueOnce({ data: { success: true } })

      Alert.alert.mockImplementation((title, message, buttons) => {
        const deleteButton = buttons?.find((b) => b.text === 'Supprimer')
        if (deleteButton) {
          deleteButton.onPress()
        }
      })

      const store = createTestStore()
      const { getByText, getAllByTestId } = renderWithProviders(
        <AdminCategoriesScreen />,
        store
      )

      await waitFor(() => {
        expect(getByText('Boulangerie')).toBeTruthy()
      })

      // Find and press delete button (Ionicons trash-outline)
      const trashIcons = getAllByTestId(/ionicons/i)
      const deleteButton = trashIcons.find((icon) => icon.props.name === 'trash-outline')
      if (deleteButton) {
        fireEvent.press(deleteButton)
      }

      await waitFor(() => {
        expect(apiService.delete).toHaveBeenCalledWith('/admin/categories/1')
        expect(Alert.alert).toHaveBeenCalledWith('Succès', 'Catégorie supprimée avec succès')
      })
    })

    it('shows warning when deleting category with products', async () => {
      const store = createTestStore()
      const { getByText, getAllByTestId } = renderWithProviders(
        <AdminCategoriesScreen />,
        store
      )

      await waitFor(() => {
        expect(getByText('Boulangerie')).toBeTruthy()
      })

      // Find and press delete button
      const trashIcons = getAllByTestId(/ionicons/i)
      const deleteButton = trashIcons.find((icon) => icon.props.name === 'trash-outline')
      if (deleteButton) {
        fireEvent.press(deleteButton)
      }

      await waitFor(() => {
        // Check that Alert.alert was called with warning message
        expect(Alert.alert).toHaveBeenCalledWith(
          'Supprimer la catégorie',
          expect.stringContaining('5 produit(s) sont associés à cette catégorie'),
          expect.any(Array)
        )
      })
    })

    it('handles delete API error', async () => {
      apiService.delete.mockRejectedValueOnce({
        response: {
          data: {
            message: 'Impossible de supprimer la catégorie',
          },
        },
      })

      Alert.alert.mockImplementation((title, message, buttons) => {
        const deleteButton = buttons?.find((b) => b.text === 'Supprimer')
        if (deleteButton) {
          deleteButton.onPress()
        }
      })

      const store = createTestStore()
      const { getByText, getAllByTestId } = renderWithProviders(
        <AdminCategoriesScreen />,
        store
      )

      await waitFor(() => {
        expect(getByText('Fruits & Légumes')).toBeTruthy()
      })

      // Find second delete button (for Fruits & Légumes which has 0 products)
      const trashIcons = getAllByTestId(/ionicons/i)
      const deleteButtons = trashIcons.filter((icon) => icon.props.name === 'trash-outline')
      if (deleteButtons[1]) {
        fireEvent.press(deleteButtons[1])
      }

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Erreur',
          'Impossible de supprimer la catégorie'
        )
      })
    })
  })

  describe('Modal Interactions', () => {
    it('closes modal when cancel button is pressed', async () => {
      const store = createTestStore()
      const { getByText, getAllByTestId, queryByText } = renderWithProviders(
        <AdminCategoriesScreen />,
        store
      )

      await waitFor(() => {
        expect(getByText('Boulangerie')).toBeTruthy()
      })

      // Open create modal
      const addIcons = getAllByTestId(/ionicons/i)
      const addButton = addIcons.find((icon) => icon.props.name === 'add-circle')
      if (addButton) {
        fireEvent.press(addButton)
      }

      await waitFor(() => {
        expect(getByText('Nouvelle catégorie')).toBeTruthy()
      })

      // Press cancel
      const cancelButton = getByText('Annuler')
      fireEvent.press(cancelButton)

      await waitFor(() => {
        expect(queryByText('Nouvelle catégorie')).toBeNull()
      })
    })

    it('closes modal when close icon is pressed', async () => {
      const store = createTestStore()
      const { getByText, getAllByTestId, queryByText } = renderWithProviders(
        <AdminCategoriesScreen />,
        store
      )

      await waitFor(() => {
        expect(getByText('Boulangerie')).toBeTruthy()
      })

      // Open create modal
      const addIcons = getAllByTestId(/ionicons/i)
      const addButton = addIcons.find((icon) => icon.props.name === 'add-circle')
      if (addButton) {
        fireEvent.press(addButton)
      }

      await waitFor(() => {
        expect(getByText('Nouvelle catégorie')).toBeTruthy()
      })

      // Find and press close icon
      const closeIcons = getAllByTestId(/ionicons/i)
      const closeButton = closeIcons.find((icon) => icon.props.name === 'close')
      if (closeButton) {
        fireEvent.press(closeButton)
      }

      await waitFor(() => {
        expect(queryByText('Nouvelle catégorie')).toBeNull()
      })
    })
  })

  describe('Character Counter', () => {
    it('displays character counter for name field', async () => {
      const store = createTestStore()
      const { getByText, getByPlaceholderText, getAllByTestId } = renderWithProviders(
        <AdminCategoriesScreen />,
        store
      )

      await waitFor(() => {
        expect(getByText('Boulangerie')).toBeTruthy()
      })

      // Open create modal
      const addIcons = getAllByTestId(/ionicons/i)
      const addButton = addIcons.find((icon) => icon.props.name === 'add-circle')
      if (addButton) {
        fireEvent.press(addButton)
      }

      await waitFor(() => {
        expect(getByText('0/50 caractères')).toBeTruthy()
      })

      const nameInput = getByPlaceholderText('Ex: Boulangerie, Fruits & Légumes')
      fireEvent.changeText(nameInput, 'Viandes')

      await waitFor(() => {
        expect(getByText('7/50 caractères')).toBeTruthy()
      })
    })

    it('displays character counter for description field', async () => {
      const store = createTestStore()
      const { getByText, getByPlaceholderText, getAllByTestId } = renderWithProviders(
        <AdminCategoriesScreen />,
        store
      )

      await waitFor(() => {
        expect(getByText('Boulangerie')).toBeTruthy()
      })

      // Open create modal
      const addIcons = getAllByTestId(/ionicons/i)
      const addButton = addIcons.find((icon) => icon.props.name === 'add-circle')
      if (addButton) {
        fireEvent.press(addButton)
      }

      await waitFor(() => {
        expect(getByText('0/200 caractères')).toBeTruthy()
      })

      const descriptionInput = getByPlaceholderText('Description de la catégorie...')
      fireEvent.changeText(descriptionInput, 'Test description')

      await waitFor(() => {
        expect(getByText('16/200 caractères')).toBeTruthy()
      })
    })
  })
})
