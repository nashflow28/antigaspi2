/**
 * Tests unitaires pour PaymentService
 * Teste validation phone, calcul fees, providers, historique transactions
 */

import AsyncStorage from '@react-native-async-storage/async-storage'
import paymentService from '../paymentService'
import { apiService } from '../api'
import {
  MobileMoneyProvider,
  Payment,
  ApiResponse,
  PaymentInitiationResponse,
} from '../../types'

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  multiRemove: jest.fn(),
}))

// Mock apiService
jest.mock('../api', () => ({
  apiService: {
    initiateMobileMoneyPayment: jest.fn(),
    getPayment: jest.fn(),
  },
}))

describe('PaymentService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getAvailableProviders', () => {
    it('should return all providers when no country code is provided', () => {
      const providers = paymentService.getAvailableProviders()

      expect(providers).toHaveLength(4)
      expect(providers.map((p) => p.id)).toEqual([
        'flooz',
        'tmoney',
        'orange_money',
        'mtn_momo',
      ])
    })

    it('should return only Togo providers when countryCode is TG', () => {
      const providers = paymentService.getAvailableProviders('TG')

      expect(providers).toHaveLength(2)
      expect(providers.map((p) => p.id)).toEqual(['flooz', 'tmoney'])
    })

    it('should return providers for Senegal (SN)', () => {
      const providers = paymentService.getAvailableProviders('SN')

      expect(providers).toHaveLength(1)
      expect(providers[0].id).toBe('orange_money')
    })

    it('should return empty array for unsupported country', () => {
      const providers = paymentService.getAvailableProviders('US')

      expect(providers).toHaveLength(0)
    })
  })

  describe('getProviderById', () => {
    it('should return provider by id', () => {
      const provider = paymentService.getProviderById('flooz')

      expect(provider).toBeDefined()
      expect(provider?.name).toBe('Flooz (Moov)')
      expect(provider?.ussdCode).toBe('*155#')
    })

    it('should return undefined for invalid provider id', () => {
      const provider = paymentService.getProviderById('invalid' as MobileMoneyProvider)

      expect(provider).toBeUndefined()
    })
  })

  describe('validatePhoneNumber', () => {
    describe('Flooz validation', () => {
      it('should validate correct Flooz numbers (90, 93, 96, 97)', () => {
        expect(paymentService.validatePhoneNumber('90123456', 'flooz')).toBe(true)
        expect(paymentService.validatePhoneNumber('93123456', 'flooz')).toBe(true)
        expect(paymentService.validatePhoneNumber('96123456', 'flooz')).toBe(true)
        expect(paymentService.validatePhoneNumber('97123456', 'flooz')).toBe(true)
      })

      it('should validate Flooz numbers with country code', () => {
        expect(paymentService.validatePhoneNumber('+228 90 12 34 56', 'flooz')).toBe(true)
        expect(paymentService.validatePhoneNumber('228 93 12 34 56', 'flooz')).toBe(true)
        expect(paymentService.validatePhoneNumber('+22896123456', 'flooz')).toBe(true)
      })

      it('should validate Flooz numbers with formatting', () => {
        expect(paymentService.validatePhoneNumber('90-12-34-56', 'flooz')).toBe(true)
        expect(paymentService.validatePhoneNumber('(90) 12 34 56', 'flooz')).toBe(true)
        expect(paymentService.validatePhoneNumber('+228 (93) 12-34-56', 'flooz')).toBe(true)
      })

      it('should reject invalid Flooz numbers', () => {
        expect(paymentService.validatePhoneNumber('91123456', 'flooz')).toBe(false) // TMoney prefix
        expect(paymentService.validatePhoneNumber('98123456', 'flooz')).toBe(false) // TMoney prefix
        expect(paymentService.validatePhoneNumber('9012345', 'flooz')).toBe(false) // Too short
        expect(paymentService.validatePhoneNumber('901234567', 'flooz')).toBe(false) // Too long
        expect(paymentService.validatePhoneNumber('12345678', 'flooz')).toBe(false) // Wrong prefix
      })
    })

    describe('TMoney validation', () => {
      it('should validate correct TMoney numbers (91, 92, 98, 99)', () => {
        expect(paymentService.validatePhoneNumber('91123456', 'tmoney')).toBe(true)
        expect(paymentService.validatePhoneNumber('92123456', 'tmoney')).toBe(true)
        expect(paymentService.validatePhoneNumber('98123456', 'tmoney')).toBe(true)
        expect(paymentService.validatePhoneNumber('99123456', 'tmoney')).toBe(true)
      })

      it('should validate TMoney numbers with country code', () => {
        expect(paymentService.validatePhoneNumber('+228 91 12 34 56', 'tmoney')).toBe(true)
        expect(paymentService.validatePhoneNumber('22892123456', 'tmoney')).toBe(true)
      })

      it('should reject invalid TMoney numbers', () => {
        expect(paymentService.validatePhoneNumber('90123456', 'tmoney')).toBe(false) // Flooz prefix
        expect(paymentService.validatePhoneNumber('93123456', 'tmoney')).toBe(false) // Flooz prefix
        expect(paymentService.validatePhoneNumber('9112345', 'tmoney')).toBe(false) // Too short
        expect(paymentService.validatePhoneNumber('911234567', 'tmoney')).toBe(false) // Too long
      })
    })

    describe('Orange Money validation', () => {
      it('should validate Orange Money numbers', () => {
        // Format général pour autres pays (Côte d'Ivoire, Sénégal, etc.)
        expect(paymentService.validatePhoneNumber('22507123456', 'orange_money')).toBe(true)
        expect(paymentService.validatePhoneNumber('221771234567', 'orange_money')).toBe(true)
      })
    })

    describe('MTN MoMo validation', () => {
      it('should validate MTN MoMo numbers', () => {
        // Format général pour Ghana, Cameroun, etc.
        expect(paymentService.validatePhoneNumber('233241234567', 'mtn_momo')).toBe(true)
        expect(paymentService.validatePhoneNumber('237671234567', 'mtn_momo')).toBe(true)
      })
    })
  })

  describe('calculateFees', () => {
    it('should calculate correct fees for Flooz (1.5%)', () => {
      expect(paymentService.calculateFees(1000, 'flooz')).toBe(25) // 1000 * 0.015 = 15, min 25
      expect(paymentService.calculateFees(10000, 'flooz')).toBe(150) // 10000 * 0.015 = 150
      expect(paymentService.calculateFees(5000, 'flooz')).toBe(75) // 5000 * 0.015 = 75
    })

    it('should calculate correct fees for TMoney (1.5%)', () => {
      expect(paymentService.calculateFees(2000, 'tmoney')).toBe(30) // 2000 * 0.015 = 30
      expect(paymentService.calculateFees(10000, 'tmoney')).toBe(150) // Same as Flooz
    })

    it('should calculate correct fees for Orange Money (2%)', () => {
      expect(paymentService.calculateFees(1000, 'orange_money')).toBe(25) // 1000 * 0.02 = 20, min 25
      expect(paymentService.calculateFees(10000, 'orange_money')).toBe(200) // 10000 * 0.02 = 200
      expect(paymentService.calculateFees(5000, 'orange_money')).toBe(100) // 5000 * 0.02 = 100
    })

    it('should apply minimum fee of 25 XOF', () => {
      expect(paymentService.calculateFees(100, 'flooz')).toBe(25) // 100 * 0.015 = 1.5 < 25
      expect(paymentService.calculateFees(500, 'flooz')).toBe(25) // 500 * 0.015 = 7.5 < 25
      expect(paymentService.calculateFees(1000, 'flooz')).toBe(25) // 1000 * 0.015 = 15 < 25
    })

    it('should round up fees', () => {
      expect(paymentService.calculateFees(3333, 'flooz')).toBe(50) // 3333 * 0.015 = 49.995 → 50
      expect(paymentService.calculateFees(6666, 'flooz')).toBe(100) // 6666 * 0.015 = 99.99 → 100
    })
  })

  describe('generateUSSDString', () => {
    it('should generate correct USSD string for Flooz', () => {
      const ussd = paymentService.generateUSSDString('flooz', 'REF-123', 5000)

      expect(ussd).toBe('*155# > Payer > Marchand > REF-123 > 5000')
    })

    it('should generate correct USSD string for TMoney', () => {
      const ussd = paymentService.generateUSSDString('tmoney', 'REF-456', 3000)

      expect(ussd).toBe('*145# > Transfert > REF-456 > 3000')
    })

    it('should generate correct USSD string for Orange Money', () => {
      const ussd = paymentService.generateUSSDString('orange_money', 'REF-789', 2000)

      expect(ussd).toBe("*144# > Transfert d'argent > REF-789 > 2000")
    })

    it('should generate correct USSD string for MTN MoMo', () => {
      const ussd = paymentService.generateUSSDString('mtn_momo', 'REF-999', 1000)

      expect(ussd).toBe('*170# > Send Money > REF-999 > 1000')
    })

    it('should return base USSD code for unknown provider', () => {
      const ussd = paymentService.generateUSSDString('unknown' as MobileMoneyProvider, 'REF', 1000)

      expect(ussd).toBe('')
    })
  })

  describe('formatCurrency', () => {
    it('should format XOF currency correctly', () => {
      const formatted = paymentService.formatCurrency(5000, 'XOF')

      // Format français pour le Togo: "5 000 F CFA"
      expect(formatted).toContain('5')
      expect(formatted).toContain('000')
    })

    it('should format without decimals', () => {
      const formatted = paymentService.formatCurrency(5000.75, 'XOF')

      // Should not contain decimals
      expect(formatted).not.toContain('.75')
      expect(formatted).not.toContain(',75')
    })

    it('should use XOF by default', () => {
      const formatted = paymentService.formatCurrency(1000)

      expect(formatted).toBeDefined()
    })
  })

  describe('Transaction History', () => {
    it('should get empty history when none exists', async () => {
      ;(AsyncStorage.getItem as jest.Mock).mockResolvedValue(null)

      const history = await paymentService.getTransactionHistory()

      expect(history).toEqual([])
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('payment_history')
    })

    it('should get transaction history from storage', async () => {
      const mockHistory = [
        {
          id: '1',
          amount: 5000,
          currency: 'XOF',
          provider: 'flooz',
          status: 'success',
          date: '2025-10-01T00:00:00.000Z', // Date as ISO string (JSON parse converts Date to string)
          reference: 'REF-123',
        },
      ]

      ;(AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockHistory))

      const history = await paymentService.getTransactionHistory()

      expect(history).toEqual(mockHistory)
    })

    it('should clear transaction history', async () => {
      await paymentService.clearHistory()

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('payment_history')
    })

    it('should record payment to history', async () => {
      const mockPayment: Payment = {
        id: 1,
        reservation_id: 10,
        amount: 5000,
        currency: 'XOF',
        payment_method: 'flooz',
        status: 'success',
        provider: 'flooz',
        checkout_url: null,
        customer_phone: '90123456',
        reference: 'REF-123',
        transaction_id: 'TXN-456',
        payload: null,
        paid_at: '2025-10-01',
        created_at: '2025-10-01',
        updated_at: '2025-10-01',
      }

      ;(AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify([]))

      await paymentService.recordPayment(mockPayment, 'flooz', 'Test payment')

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'payment_history',
        expect.stringContaining('REF-123')
      )
    })

    it('should limit history to 50 transactions', async () => {
      // Create 51 transactions
      const mockHistory = Array.from({ length: 51 }, (_, i) => ({
        id: `${i + 1}`,
        amount: 1000,
        currency: 'XOF',
        provider: 'flooz',
        status: 'success',
        date: new Date(),
        reference: `REF-${i + 1}`,
      }))

      ;(AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockHistory))

      const mockPayment: Payment = {
        id: 100,
        reservation_id: 1,
        amount: 5000,
        currency: 'XOF',
        payment_method: 'flooz',
        status: 'success',
        provider: 'flooz',
        checkout_url: null,
        customer_phone: '90123456',
        reference: 'NEW-REF',
        transaction_id: 'TXN-NEW',
        payload: null,
        paid_at: '2025-10-01',
        created_at: '2025-10-01',
        updated_at: '2025-10-01',
      }

      await paymentService.recordPayment(mockPayment, 'flooz')

      // Should save only 50 items (1 new + 49 old)
      const savedData = (AsyncStorage.setItem as jest.Mock).mock.calls[0][1]
      const savedHistory = JSON.parse(savedData)

      expect(savedHistory).toHaveLength(50)
      expect(savedHistory[0].reference).toBe('NEW-REF') // New transaction first
    })
  })

  describe('initiateMobileMoneyPayment', () => {
    it('should reject payment with invalid phone number', async () => {
      const request = {
        reservationId: 1,
        provider: 'flooz' as MobileMoneyProvider,
        customerPhone: '12345', // Invalid
        customerEmail: 'test@example.com',
        currency: 'XOF',
        amount: 5000,
      }

      const result = await paymentService.initiateMobileMoneyPayment(request)

      expect(result.success).toBe(false)
      expect(result.message).toContain('Numéro de téléphone invalide')
      expect(apiService.initiateMobileMoneyPayment).not.toHaveBeenCalled()
    })

    it('should reject payment below minimum amount', async () => {
      const request = {
        reservationId: 1,
        provider: 'flooz' as MobileMoneyProvider,
        customerPhone: '90123456',
        customerEmail: 'test@example.com',
        currency: 'XOF',
        amount: 50, // Below 100 XOF minimum
      }

      const result = await paymentService.initiateMobileMoneyPayment(request)

      expect(result.success).toBe(false)
      expect(result.message).toContain('montant minimum')
      expect(apiService.initiateMobileMoneyPayment).not.toHaveBeenCalled()
    })

    it('should initiate payment successfully', async () => {
      const request = {
        reservationId: 1,
        provider: 'flooz' as MobileMoneyProvider,
        customerPhone: '90123456',
        customerEmail: 'test@example.com',
        currency: 'XOF',
        amount: 5000,
        reference: 'REF-123',
      }

      const mockResponse: PaymentInitiationResponse = {
        success: true,
        message: 'Payment initiated',
        data: {
          id: 1,
          reservation_id: 1,
          amount: 5000,
          currency: 'XOF',
          payment_method: 'flooz',
          status: 'pending',
          provider: 'flooz',
          checkout_url: null,
          customer_phone: '90123456',
          reference: 'REF-123',
          transaction_id: 'TXN-456',
          payload: null,
          paid_at: null,
          created_at: '2025-10-01',
          updated_at: '2025-10-01',
        },
      }

      ;(apiService.initiateMobileMoneyPayment as jest.Mock).mockResolvedValue(mockResponse)
      ;(AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify([]))

      const result = await paymentService.initiateMobileMoneyPayment(request)

      expect(result.success).toBe(true)
      expect(result.ussdString).toContain('*155#')
      expect(result.ussdString).toContain('REF-123')
      expect(result.ussdString).toContain('5000')
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'payment_history',
        expect.any(String)
      )
    })
  })

  describe('checkPaymentStatus', () => {
    it('should check payment status successfully', async () => {
      const mockPayment: Payment = {
        id: 1,
        reservation_id: 1,
        amount: 5000,
        currency: 'XOF',
        payment_method: 'flooz',
        status: 'success',
        provider: 'flooz',
        checkout_url: null,
        customer_phone: '90123456',
        reference: 'REF-123',
        transaction_id: 'TXN-456',
        payload: null,
        paid_at: '2025-10-01',
        created_at: '2025-10-01',
        updated_at: '2025-10-01',
      }

      const mockResponse: ApiResponse<Payment> = {
        success: true,
        data: mockPayment,
        message: 'Payment retrieved',
      }

      ;(apiService.getPayment as jest.Mock).mockResolvedValue(mockResponse)

      const result = await paymentService.checkPaymentStatus(1)

      expect(result.success).toBe(true)
      expect(result.payment).toEqual(mockPayment)
      expect(apiService.getPayment).toHaveBeenCalledWith(1)
    })

    it('should handle payment status check error', async () => {
      ;(apiService.getPayment as jest.Mock).mockRejectedValue(new Error('Network error'))

      const result = await paymentService.checkPaymentStatus(1)

      expect(result.success).toBe(false)
      expect(result.message).toBeDefined()
      expect(typeof result.message).toBe('string')
    })
  })

  describe('simulatePayment', () => {
    it('should simulate payment with 80% success rate', async () => {
      // Mock Math.random to return success (> 0.2)
      jest.spyOn(Math, 'random').mockReturnValue(0.5)

      const request = {
        reservationId: 1,
        provider: 'flooz' as MobileMoneyProvider,
        customerPhone: '90123456',
        customerEmail: 'test@example.com',
        currency: 'XOF',
        amount: 5000,
        reference: 'REF-123',
      }

      const result = await paymentService.simulatePayment(request)

      expect(result.success).toBe(true)
      expect(result.data?.status).toBe('success')
      expect(result.data?.amount).toBe(5000)
      expect(result.ussdString).toContain('*155#')

      jest.spyOn(Math, 'random').mockRestore()
    }, 10000) // Increase timeout for async

    it('should simulate payment failure with 20% chance', async () => {
      // Mock Math.random to return failure (<= 0.2)
      jest.spyOn(Math, 'random').mockReturnValue(0.1)

      const request = {
        reservationId: 1,
        provider: 'tmoney' as MobileMoneyProvider,
        customerPhone: '91123456',
        customerEmail: 'test@example.com',
        currency: 'XOF',
        amount: 3000,
      }

      const result = await paymentService.simulatePayment(request)

      expect(result.success).toBe(false)
      expect(result.data?.status).toBe('failed')

      jest.spyOn(Math, 'random').mockRestore()
    }, 10000)
  })
})
