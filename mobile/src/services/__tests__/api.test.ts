// @ts-nocheck
/**
 * Tests unitaires pour ApiService
 * Teste HTTP interceptors, error handling, 401 redirect, et toutes les méthodes API
 */

import MockAdapter from 'axios-mock-adapter'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Alert } from 'react-native'
import * as NavigationRef from '../../navigation/NavigationRef'
import { apiService } from '../api'
import {
  LoginCredentials,
  RegisterData,
  AuthResponse,
  ApiResponse,
  Product,
  Category,
  Reservation,
  User,
  ReservationCreationPayload,
  MobileMoneyPaymentPayload,
} from '../../types'

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  multiRemove: jest.fn(),
}))

// Mock Alert
jest.mock('react-native', () => ({
  Alert: {
    alert: jest.fn(),
  },
  Platform: {
    OS: 'ios',
  },
}))

// Mock NavigationRef
jest.mock('../../navigation/NavigationRef', () => ({
  navigate: jest.fn(),
  goBack: jest.fn(),
  reset: jest.fn(),
}))

// Mock expo-constants
jest.mock('expo-constants', () => ({
  default: {
    expoConfig: {
      extra: {
        apiUrl: 'http://test-api.com/api',
      },
    },
  },
}))

describe('ApiService', () => {
  let mockAxios: MockAdapter

  beforeAll(() => {
    // Create axios mock adapter
    mockAxios = new MockAdapter((apiService as any).api)
  })

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks()
    mockAxios.reset()
  })

  afterAll(() => {
    mockAxios.restore()
  })

  describe('Configuration', () => {
    it('should have baseURL configured', () => {
      // Note: Since apiService is instantiated before tests run,
      // expo-constants mock doesn't affect it. Just verify baseURL exists.
      expect((apiService as any).baseURL).toBeDefined()
      expect(typeof (apiService as any).baseURL).toBe('string')
    })

    it('should have correct default headers', () => {
      const headers = (apiService as any).api.defaults.headers
      expect(headers['Content-Type']).toBe('application/json')
      expect(headers['Accept']).toBe('application/json')
    })

    it('should have 10 second timeout', () => {
      expect((apiService as any).api.defaults.timeout).toBe(10000)
    })
  })

  describe('Request Interceptor', () => {
    it('should add Authorization header when token exists', async () => {
      const mockToken = 'test-jwt-token'
      ;(AsyncStorage.getItem as jest.Mock).mockResolvedValue(mockToken)

      mockAxios.onGet('/test').reply(200, { success: true })

      await (apiService as any).request('GET', '/test')

      const lastRequest = mockAxios.history.get[0]
      expect(lastRequest.headers?.Authorization).toBe(`Bearer ${mockToken}`)
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('auth_token')
    })

    it('should not add Authorization header when token does not exist', async () => {
      ;(AsyncStorage.getItem as jest.Mock).mockResolvedValue(null)

      mockAxios.onGet('/test').reply(200, { success: true })

      await (apiService as any).request('GET', '/test')

      const lastRequest = mockAxios.history.get[0]
      expect(lastRequest.headers?.Authorization).toBeUndefined()
    })
  })

  describe('Response Interceptor - 401 Handling', () => {
    it('should clear storage and navigate to Login on 401 error', async () => {
      mockAxios.onGet('/protected').reply(401, { message: 'Unauthorized' })

      try {
        await (apiService as any).request('GET', '/protected')
      } catch (error) {
        // Expected to throw
      }

      // Wait for async operations
      await new Promise((resolve) => setTimeout(resolve, 100))

      expect(AsyncStorage.multiRemove).toHaveBeenCalledWith(['auth_token', 'user_data'])
      expect(Alert.alert).toHaveBeenCalledWith(
        'Session expirée',
        'Votre session a expiré. Veuillez vous reconnecter.',
        expect.any(Array)
      )
    })

    it('should call navigate to Login when user presses OK on 401 alert', async () => {
      mockAxios.onGet('/protected').reply(401)

      // Mock Alert.alert to immediately call the onPress callback
      ;(Alert.alert as jest.Mock).mockImplementation((title, message, buttons) => {
        const okButton = buttons?.find((btn: any) => btn.text === 'OK')
        if (okButton?.onPress) {
          okButton.onPress()
        }
      })

      try {
        await (apiService as any).request('GET', '/protected')
      } catch (error) {
        // Expected
      }

      await new Promise((resolve) => setTimeout(resolve, 100))

      expect(NavigationRef.navigate).toHaveBeenCalledWith('Login')
    })
  })

  describe('Authentication - Login', () => {
    it('should login successfully and store token', async () => {
      const credentials: LoginCredentials = {
        email: 'test@example.com',
        password: 'password123',
      }

      const mockResponse: AuthResponse = {
        success: true,
        data: {
          user: {
            id: 1,
            name: 'Test User',
            email: 'test@example.com',
            role: 'consumer',
          },
          token: 'jwt-token-123',
        },
        message: 'Login successful',
      }

      mockAxios.onPost('/auth/login').reply(200, mockResponse)

      const result = await apiService.login(credentials)

      expect(result).toEqual(mockResponse)
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('auth_token', 'jwt-token-123')
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'user_data',
        JSON.stringify(mockResponse.data.user)
      )
    })

    it('should handle login failure', async () => {
      const credentials: LoginCredentials = {
        email: 'wrong@example.com',
        password: 'wrongpass',
      }

      mockAxios.onPost('/auth/login').reply(401, {
        message: 'Invalid credentials',
      })

      await expect(apiService.login(credentials)).rejects.toThrow('Invalid credentials')
      expect(AsyncStorage.setItem).not.toHaveBeenCalled()
    })
  })

  describe('Authentication - Register', () => {
    it('should register successfully and store token', async () => {
      const registerData: RegisterData = {
        name: 'New User',
        email: 'new@example.com',
        password: 'password123',
        password_confirmation: 'password123',
        phone: '90123456',
        city: 'Lomé',
        role: 'consumer',
      }

      const mockResponse: AuthResponse = {
        success: true,
        data: {
          user: {
            id: 2,
            name: 'New User',
            email: 'new@example.com',
            role: 'consumer',
          },
          token: 'jwt-token-456',
        },
        message: 'Registration successful',
      }

      mockAxios.onPost('/auth/register').reply(200, mockResponse)

      const result = await apiService.register(registerData)

      expect(result).toEqual(mockResponse)
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('auth_token', 'jwt-token-456')
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'user_data',
        JSON.stringify(mockResponse.data.user)
      )
    })

    it('should handle validation errors on register', async () => {
      const registerData: RegisterData = {
        name: 'Test',
        email: 'invalid-email',
        password: '123',
        password_confirmation: '456',
        phone: '123',
        city: '',
        role: 'consumer',
      }

      mockAxios.onPost('/auth/register').reply(422, {
        message: 'Validation failed',
      })

      await expect(apiService.register(registerData)).rejects.toThrow('Validation failed')
    })
  })

  describe('Authentication - Logout', () => {
    it('should logout and clear storage even if API fails', async () => {
      mockAxios.onPost('/auth/logout').reply(500, { message: 'Server error' })

      // Should not throw
      await apiService.logout()

      expect(AsyncStorage.multiRemove).toHaveBeenCalledWith(['auth_token', 'user_data'])
    })

    it('should logout successfully when API succeeds', async () => {
      mockAxios.onPost('/auth/logout').reply(200, { success: true })

      await apiService.logout()

      expect(AsyncStorage.multiRemove).toHaveBeenCalledWith(['auth_token', 'user_data'])
    })
  })

  describe('Authentication - Get Profile', () => {
    it('should get user profile', async () => {
      const mockUser: User = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        role: 'consumer',
        phone: '90123456',
        city: 'Lomé',
        created_at: '2025-01-01',
      }

      const mockResponse: ApiResponse<User> = {
        success: true,
        data: mockUser,
        message: 'Profile retrieved',
      }

      mockAxios.onGet('/auth/me').reply(200, mockResponse)

      const result = await apiService.getProfile()

      expect(result).toEqual(mockResponse)
    })
  })

  describe('Products - Get Products', () => {
    it('should get products without filters', async () => {
      const mockProducts: Product[] = [
        {
          id: 1,
          name: 'Test Product',
          description: 'Description',
          original_price: '1000',
          discounted_price: '500',
          discount_percentage: 50,
          quantity_available: 10,
          expiration_date: '2025-10-05',
          days_until_expiration: 4,
          image_url: 'https://example.com/image.jpg',
          category_id: 1,
          merchant_id: 1,
          is_active: true,
          merchant: {
            id: 1,
            business_name: 'Test Merchant',
            city: 'Lomé',
            phone: '90123456',
            business_type: 'Boulangerie',
            is_verified: true,
          },
          category: {
            id: 1,
            name: 'Pain',
            description: 'Produits de boulangerie',
            icon: 'bread',
          },
        },
      ]

      const mockResponse: ApiResponse<Product[]> = {
        success: true,
        data: mockProducts,
        message: 'Products retrieved',
      }

      mockAxios.onGet('/products').reply(200, mockResponse)

      const result = await apiService.getProducts()

      expect(result).toEqual(mockResponse)
    })

    it('should get products with filters', async () => {
      const filters = {
        search: 'pain',
        category: '1',
        max_price: 1000,
        page: 1,
        per_page: 20,
      }

      mockAxios.onGet(/\/products\?.*/).reply(200, {
        success: true,
        data: [],
      })

      await apiService.getProducts(filters)

      const lastRequest = mockAxios.history.get[0]
      expect(lastRequest.url).toContain('search=pain')
      expect(lastRequest.url).toContain('category=1')
      expect(lastRequest.url).toContain('max_price=1000')
      expect(lastRequest.url).toContain('page=1')
      expect(lastRequest.url).toContain('per_page=20')
    })

    it('should skip undefined/null filter values', async () => {
      const filters = {
        search: 'test',
        category: undefined,
        max_price: null as any,
        radius: '',
      }

      mockAxios.onGet(/\/products\?.*/).reply(200, {
        success: true,
        data: [],
      })

      await apiService.getProducts(filters)

      const lastRequest = mockAxios.history.get[0]
      expect(lastRequest.url).toContain('search=test')
      expect(lastRequest.url).not.toContain('category')
      expect(lastRequest.url).not.toContain('max_price')
      expect(lastRequest.url).not.toContain('radius')
    })
  })

  describe('Products - Get Single Product', () => {
    it('should get product by id', async () => {
      const mockProduct: Product = {
        id: 1,
        name: 'Test Product',
        description: 'Description',
        original_price: '1000',
        discounted_price: '500',
        discount_percentage: 50,
        quantity_available: 10,
        expiration_date: '2025-10-05',
        days_until_expiration: 4,
        image_url: 'https://example.com/image.jpg',
        category_id: 1,
        merchant_id: 1,
        is_active: true,
        merchant: {
          id: 1,
          business_name: 'Test Merchant',
          city: 'Lomé',
          phone: '90123456',
          business_type: 'Boulangerie',
          is_verified: true,
        },
        category: {
          id: 1,
          name: 'Pain',
          description: 'Produits de boulangerie',
          icon: 'bread',
        },
      }

      mockAxios.onGet('/products/1').reply(200, {
        success: true,
        data: mockProduct,
      })

      const result = await apiService.getProduct(1)

      expect(result.data).toEqual(mockProduct)
    })
  })

  describe('Products - Get Categories', () => {
    it('should get all categories', async () => {
      const mockCategories: Category[] = [
        { id: 1, name: 'Pain', description: 'Boulangerie', icon: 'bread' },
        { id: 2, name: 'Fruits', description: 'Fruits frais', icon: 'fruit' },
      ]

      mockAxios.onGet('/categories').reply(200, {
        success: true,
        data: mockCategories,
      })

      const result = await apiService.getCategories()

      expect(result.data).toEqual(mockCategories)
    })
  })

  describe('Reservations - Create', () => {
    it('should create reservation successfully', async () => {
      const payload: ReservationCreationPayload = {
        product_id: 1,
        quantity: 2,
        payment_method: 'on_site',
        notes: 'Test reservation',
      }

      const mockResponse = {
        success: true,
        data: {
          reservation_code: 'RES-123456',
          reservation: {
            id: 1,
            product_id: 1,
            quantity: 2,
            status: 'pending',
          },
        },
      }

      mockAxios.onPost('/reservations').reply(200, mockResponse)

      const result = await apiService.createReservation(payload)

      expect(result).toEqual(mockResponse)
      expect(mockAxios.history.post[0].data).toEqual(JSON.stringify(payload))
    })
  })

  describe('Reservations - Get My Reservations', () => {
    it('should get user reservations', async () => {
      const mockReservations: Reservation[] = [
        {
          id: 1,
          reservation_code: 'RES-123',
          product_id: 1,
          consumer_id: 1,
          quantity: 2,
          total_price: '1000',
          status: 'confirmed',
          payment_method: 'on_site',
          notes: 'Test',
          created_at: '2025-10-01',
          expires_at: '2025-10-02',
          product: {} as any,
        },
      ]

      mockAxios.onGet('/reservations').reply(200, {
        success: true,
        data: mockReservations,
      })

      const result = await apiService.getMyReservations()

      expect(result.data).toEqual(mockReservations)
    })
  })

  describe('Reservations - Cancel', () => {
    it('should cancel reservation', async () => {
      mockAxios.onPost('/reservations/1/cancel').reply(200, {
        success: true,
        data: { id: 1, status: 'cancelled' },
      })

      const result = await apiService.cancelReservation(1)

      expect(result.success).toBe(true)
      expect(result.data.status).toBe('cancelled')
    })
  })

  describe('Payments - Initiate Mobile Money', () => {
    it('should initiate mobile money payment', async () => {
      const payload: MobileMoneyPaymentPayload = {
        reservationId: 1,
        provider: 'flooz',
        customerPhone: '90123456',
        customerEmail: 'test@example.com',
        currency: 'XOF',
      }

      const mockResponse = {
        success: true,
        data: {
          payment_id: 1,
          transaction_id: 'TXN-123',
          status: 'pending',
          provider_reference: 'FLOOZ-456',
        },
      }

      mockAxios.onPost('/payments/mobile-money').reply(200, mockResponse)

      const result = await apiService.initiateMobileMoneyPayment(payload)

      expect(result).toEqual(mockResponse)
    })
  })

  describe('Utilities - Check Connection', () => {
    it('should return true when connection is healthy', async () => {
      mockAxios.onGet('/health').reply(200, { status: 'ok' })

      const result = await apiService.checkConnection()

      expect(result).toBe(true)
    })

    it('should return false when connection fails', async () => {
      mockAxios.onGet('/health').reply(500)

      const result = await apiService.checkConnection()

      expect(result).toBe(false)
    })
  })

  describe('Utilities - Get Stored User', () => {
    it('should get stored user from AsyncStorage', async () => {
      const mockUser = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        role: 'consumer',
      }

      ;(AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockUser))

      const result = await apiService.getStoredUser()

      expect(result).toEqual(mockUser)
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('user_data')
    })

    it('should return null when no user is stored', async () => {
      ;(AsyncStorage.getItem as jest.Mock).mockResolvedValue(null)

      const result = await apiService.getStoredUser()

      expect(result).toBeNull()
    })

    it('should return null when stored data is invalid JSON', async () => {
      ;(AsyncStorage.getItem as jest.Mock).mockResolvedValue('invalid-json')

      const result = await apiService.getStoredUser()

      expect(result).toBeNull()
    })
  })

  describe('Utilities - Get Stored Token', () => {
    it('should get stored token from AsyncStorage', async () => {
      const mockToken = 'jwt-token-123'
      ;(AsyncStorage.getItem as jest.Mock).mockResolvedValue(mockToken)

      const result = await apiService.getStoredToken()

      expect(result).toBe(mockToken)
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('auth_token')
    })

    it('should return null when no token is stored', async () => {
      ;(AsyncStorage.getItem as jest.Mock).mockResolvedValue(null)

      const result = await apiService.getStoredToken()

      expect(result).toBeNull()
    })
  })

  describe('Error Handling', () => {
    it('should extract error message from response data', async () => {
      mockAxios.onPost('/test').reply(400, {
        message: 'Custom error message',
      })

      await expect((apiService as any).request('POST', '/test')).rejects.toThrow(
        'Custom error message'
      )
    })

    it('should handle network errors', async () => {
      mockAxios.onPost('/test').networkError()

      await expect((apiService as any).request('POST', '/test')).rejects.toThrow()
    })
  })
})
