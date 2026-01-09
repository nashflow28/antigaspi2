/**
 * Service de Paiement Mobile Money pour l'Afrique de l'Ouest
 * Supporte Flooz (Moov) et TMoney (Togocom) via PayGate Global
 *
 * PayGate API Documentation: https://paygateglobal.com/guide
 * - Flooz (Moov Togo)
 * - TMoney (Togocom)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from './api';
import {
  MobileMoneyProvider,
  MobileMoneyPaymentPayload,
  PaymentInitiationResponse,
  Payment
} from '../types';
import { formatCurrency as formatCurrencyUtil } from '../utils/currencyHelpers';
import { createLogger } from '../utils/logger'

const paymentLogger = createLogger('PaymentService')

// PayGate status codes (for reference)
const PAYGATE_STATUS = {
  PENDING: 'pending',
  SUCCESS: 'success',
  FAILED: 'failed',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled',
} as const

// Polling configuration
const POLLING_CONFIG = {
  INITIAL_DELAY: 5000,     // Wait 5s before first poll (give user time to validate on phone)
  INTERVAL: 4000,          // Poll every 4 seconds
  MAX_DURATION: 180000,    // Max 3 minutes of polling
  MAX_ATTEMPTS: 45,        // Max 45 attempts (3 min / 4s)
}

export interface PaymentProvider {
  id: string;
  name: string;
  logo: string;
  colors: {
    primary: string;
    secondary: string;
  };
  ussdCode: string;
  supportedCountries: string[];
}

export interface MobileMoneyInitiationRequest extends MobileMoneyPaymentPayload {
  amount: number;
  description?: string;
}

export interface MobileMoneyInitiationResult extends PaymentInitiationResponse {
  ussdString?: string;
}

export interface TransactionHistory {
  id: string;
  amount: number;
  currency: string;
  provider: string;
  status: string;
  date: Date;
  reference: string;
  description?: string;
}

class PaymentService {
  private providers: PaymentProvider[] = [
    {
      id: 'flooz',
      name: 'Flooz (Moov)',
      logo: '💳',
      colors: {
        primary: '#0066CC',
        secondary: '#004C99'
      },
      ussdCode: '*155#',
      supportedCountries: ['TG', 'BF', 'BJ', 'CI', 'ML', 'NE']
    },
    {
      id: 'tmoney',
      name: 'T-Money (Togocom)',
      logo: '💰',
      colors: {
        primary: '#FFCC00',
        secondary: '#FFB300'
      },
      ussdCode: '*145#',
      supportedCountries: ['TG']
    },
    {
      id: 'orange_money',
      name: 'Orange Money',
      logo: '🟠',
      colors: {
        primary: '#FF7900',
        secondary: '#FF6200'
      },
      ussdCode: '*144#',
      supportedCountries: ['SN', 'CI', 'ML', 'BF', 'GN']
    },
    {
      id: 'mtn_momo',
      name: 'MTN MoMo',
      logo: '🟡',
      colors: {
        primary: '#FFCB05',
        secondary: '#FDB913'
      },
      ussdCode: '*170#',
      supportedCountries: ['GH', 'CI', 'CM', 'BJ']
    }
  ];

  /**
   * Obtenir les providers disponibles
   */
  getAvailableProviders(countryCode?: string): PaymentProvider[] {
    if (countryCode) {
      return this.providers.filter(provider =>
        provider.supportedCountries.includes(countryCode)
      );
    }
    return this.providers;
  }

  getProviderById(providerId: MobileMoneyProvider): PaymentProvider | undefined {
    return this.providers.find(provider => provider.id === providerId);
  }

  /**
   * Initier un paiement Mobile Money
   */
  async initiateMobileMoneyPayment(request: MobileMoneyInitiationRequest): Promise<MobileMoneyInitiationResult> {
    try {
      if (!this.validatePhoneNumber(request.customerPhone, request.provider)) {
        throw new Error('Numéro de téléphone invalide pour ce provider');
      }

      if (!isFinite(request.amount) || isNaN(request.amount) || request.amount < 100) {
        throw new Error('Le montant minimum est de 100 XOF');
      }

      // 🐛 FIX: Include amount and enforce XOF currency in payload
      const response = await apiService.initiateMobileMoneyPayment({
        reservationId: request.reservationId,
        provider: request.provider,
        customerPhone: request.customerPhone,
        customerEmail: request.customerEmail,
        amount: request.amount,
        currency: request.currency || 'XOF',
        notes: request.notes,
        reference: request.reference
      });

      const payment = response.data;
      const reference = payment?.reference || request.reference || '';

      if (payment) {
        await this.saveToHistory({
          id: payment.id.toString(),
          amount: payment.amount,
          currency: payment.currency,
          provider: request.provider,
          status: payment.status,
          date: new Date(),
          reference,
          description: request.description
        });
      }

      const ussdString = payment
        ? this.generateUSSDString(request.provider, reference, payment.amount)
        : undefined;

      return {
        ...response,
        ussdString
      };
    } catch (error: any) {
      paymentLogger.error('Payment initiation error:', error);
      return {
        success: false,
        message: error?.message || 'Erreur lors du paiement',
        data: null,
      };
    }
  }

  /**
   * Vérifier le statut d'un paiement (single check)
   */
  async checkPaymentStatus(paymentId: number): Promise<{ success: boolean; payment?: Payment; message?: string }> {
    try {
      const response = await apiService.getPayment(paymentId);
      return {
        success: response.success,
        payment: response.data,
        message: response.message
      };
    } catch (error: any) {
      return {
        success: false,
        message: error?.message || 'Erreur lors de la vérification'
      };
    }
  }

  /**
   * Poll payment status until completion or timeout
   * Used for PayGate payments where status is updated via webhook
   *
   * @param paymentId The payment ID to monitor
   * @param onStatusChange Callback when status changes
   * @param onTimeout Callback when polling times out
   * @returns Cleanup function to stop polling
   */
  pollPaymentStatus(
    paymentId: number,
    onStatusChange: (payment: Payment, isComplete: boolean) => void,
    onTimeout?: () => void,
    onError?: (error: string) => void
  ): () => void {
    let isPolling = true
    let attemptCount = 0
    let timeoutId: NodeJS.Timeout | null = null
    let lastStatus: string | null = null

    const poll = async () => {
      if (!isPolling) return

      attemptCount++
      paymentLogger.debug(`Polling payment ${paymentId}, attempt ${attemptCount}`)

      try {
        const result = await this.checkPaymentStatus(paymentId)

        if (!isPolling) return // Check again after async call

        if (result.success && result.payment) {
          const payment = result.payment
          const currentStatus = payment.status

          // Notify on status change
          if (currentStatus !== lastStatus) {
            lastStatus = currentStatus
            const isComplete = currentStatus === PAYGATE_STATUS.SUCCESS ||
                               currentStatus === PAYGATE_STATUS.FAILED ||
                               currentStatus === PAYGATE_STATUS.EXPIRED ||
                               currentStatus === PAYGATE_STATUS.CANCELLED

            onStatusChange(payment, isComplete)

            // Stop polling if payment is complete
            if (isComplete) {
              paymentLogger.info(`Payment ${paymentId} completed with status: ${currentStatus}`)
              isPolling = false
              return
            }
          }
        }

        // Continue polling if not complete and under limits
        if (attemptCount < POLLING_CONFIG.MAX_ATTEMPTS && isPolling) {
          timeoutId = setTimeout(poll, POLLING_CONFIG.INTERVAL)
        } else if (attemptCount >= POLLING_CONFIG.MAX_ATTEMPTS && isPolling) {
          paymentLogger.warn(`Payment ${paymentId} polling timeout after ${attemptCount} attempts`)
          isPolling = false
          onTimeout?.()
        }
      } catch (error: any) {
        paymentLogger.error(`Error polling payment ${paymentId}:`, error)
        if (isPolling) {
          onError?.(error?.message || 'Erreur de vérification')
          // Continue polling despite error
          if (attemptCount < POLLING_CONFIG.MAX_ATTEMPTS) {
            timeoutId = setTimeout(poll, POLLING_CONFIG.INTERVAL)
          }
        }
      }
    }

    // Start polling after initial delay
    paymentLogger.info(`Starting payment polling for ${paymentId}`)
    timeoutId = setTimeout(poll, POLLING_CONFIG.INITIAL_DELAY)

    // Return cleanup function
    return () => {
      paymentLogger.debug(`Stopping payment polling for ${paymentId}`)
      isPolling = false
      if (timeoutId) {
        clearTimeout(timeoutId)
        timeoutId = null
      }
    }
  }

  /**
   * Check if a payment method uses PayGate (requires polling)
   */
  isPayGateMethod(provider: MobileMoneyProvider): boolean {
    return provider === 'flooz' || provider === 'tmoney'
  }

  /**
   * Get user-friendly instructions for PayGate payment
   */
  getPaymentInstructions(provider: MobileMoneyProvider, amount: number): string[] {
    const formattedAmount = this.formatCurrency(amount)

    if (provider === 'flooz') {
      return [
        `Un prompt USSD va s'afficher sur votre téléphone`,
        `Entrez votre code PIN Flooz pour valider le paiement de ${formattedAmount}`,
        `Gardez votre téléphone à portée de main`,
        `Le paiement sera confirmé automatiquement`,
      ]
    }

    if (provider === 'tmoney') {
      return [
        `Une demande de paiement arrive sur votre téléphone`,
        `Validez avec votre code PIN TMoney pour payer ${formattedAmount}`,
        `Ne fermez pas cette fenêtre`,
        `La confirmation sera automatique`,
      ]
    }

    return [
      `Suivez les instructions sur votre téléphone`,
      `Validez le paiement de ${formattedAmount}`,
      `La confirmation sera automatique`,
    ]
  }

  /**
   * Simuler un paiement (pour les tests)
   */
  async simulatePayment(request: MobileMoneyInitiationRequest): Promise<MobileMoneyInitiationResult> {
    return new Promise((resolve) => {
      // Simuler un délai de traitement
      setTimeout(() => {
        const success = Math.random() > 0.2; // 80% de succès

        resolve({
          success,
          message: success
            ? 'Paiement simulé avec succès'
            : 'Échec du paiement simulé',
          data: {
            id: Date.now(),
            reservation_id: request.reservationId,
            amount: request.amount,
            currency: request.currency || 'XOF',
            payment_method: request.provider,
            status: success ? 'success' : 'failed',
            provider: request.provider,
            checkout_url: null,
            customer_phone: request.customerPhone,
            reference: request.reference,
            transaction_id: `SIM-${Date.now()}`,
            payload: null,
            paid_at: success ? new Date().toISOString() : null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          } as Payment,
          ussdString: this.generateUSSDString(
            request.provider,
            request.reference || '',
            request.amount
          ),
        });
      }, 2000);
    });
  }

  /**
   * Valider un numéro de téléphone selon le provider
   */
  validatePhoneNumber(phone: string, provider: MobileMoneyProvider): boolean {
    const patterns: Record<MobileMoneyProvider, RegExp> = {
      flooz: /^(\+?228)?(90|93|96|97)\d{6}$/,     // Togo: 90/93/96/97 + 6 digits
      tmoney: /^(\+?228)?(91|92|98|99)\d{6}$/,    // Togo: 91/92/98/99 + 6 digits
      orange_money: /^(\+?225|\+?221|\+?223|\+?226|\+?224)?[0-9]{8,10}$/,
      mtn_momo: /^(\+?233|\+?225|\+?237|\+?229)?[0-9]{8,10}$/
    };

    const cleanPhone = phone.replace(/[\s\-\(\)+]/g, '');
    return patterns[provider]?.test(cleanPhone) || false;
  }

  /**
   * Générer le string USSD pour paiement manuel
   */
  generateUSSDString(providerId: MobileMoneyProvider, reference: string, amount: number): string {
    const provider = this.providers.find(p => p.id === providerId);
    if (!provider) return '';

    // Format spécifique selon le provider
    switch (providerId) {
      case 'flooz':
        return `${provider.ussdCode} > Payer > Marchand > ${reference} > ${amount}`;
      case 'tmoney':
        return `${provider.ussdCode} > Transfert > ${reference} > ${amount}`;
      case 'orange_money':
        return `${provider.ussdCode} > Transfert d'argent > ${reference} > ${amount}`;
      case 'mtn_momo':
        return `${provider.ussdCode} > Send Money > ${reference} > ${amount}`;
      default:
        return provider.ussdCode;
    }
  }

  /**
   * Obtenir l'historique des transactions
   */
  async getTransactionHistory(): Promise<TransactionHistory[]> {
    try {
      const history = await AsyncStorage.getItem('payment_history');
      return history ? JSON.parse(history) : [];
    } catch (error) {
      paymentLogger.error('Error getting transaction history:', error);
      return [];
    }
  }

  async recordPayment(payment: Payment, provider: MobileMoneyProvider, description?: string): Promise<void> {
    try {
      await this.saveToHistory({
        id: payment.id.toString(),
        amount: payment.amount,
        currency: payment.currency,
        provider,
        status: payment.status,
        date: payment.created_at ? new Date(payment.created_at) : new Date(),
        reference: payment.reference || '',
        description,
      });
    } catch (error) {
      paymentLogger.error('Error recording payment history:', error);
    }
  }

  /**
   * Sauvegarder une transaction dans l'historique
   */
  private async saveToHistory(transaction: TransactionHistory): Promise<void> {
    try {
      const history = await this.getTransactionHistory();
      history.unshift(transaction);
      // Garder seulement les 50 dernières transactions
      const limited = history.slice(0, 50);
      await AsyncStorage.setItem('payment_history', JSON.stringify(limited));
    } catch (error) {
      paymentLogger.error('Error saving to history:', error);
    }
  }

  /**
   * Effacer l'historique des transactions
   */
  async clearHistory(): Promise<void> {
    try {
      await AsyncStorage.removeItem('payment_history');
    } catch (error) {
      paymentLogger.error('Error clearing history:', error);
    }
  }

  /**
   * Obtenir les frais de transaction
   */
  calculateFees(amount: number, provider: MobileMoneyProvider): number {
    const feeRates: Record<MobileMoneyProvider, number> = {
      flooz: 0.015,      // 1.5%
      tmoney: 0.015,     // 1.5%
      orange_money: 0.02, // 2%
      mtn_momo: 0.015    // 1.5%
    };

    const rate = feeRates[provider] || 0.02;
    const fees = Math.ceil(amount * rate);

    // Frais minimum de 25 XOF
    return Math.max(fees, 25);
  }

  /**
   * Formater un montant en devise locale
   * Utilise l'utilitaire centralisé pour cohérence dans toute l'app
   */
  formatCurrency(amount: number, currency: string = 'XOF'): string {
    return formatCurrencyUtil(amount);
  }
}

export default new PaymentService();
