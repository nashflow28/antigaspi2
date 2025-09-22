/**
 * Service de Paiement Mobile Money pour l'Afrique de l'Ouest
 * Supporte Flooz (Moov) et T-Money (Togocom)
 */

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

export interface PaymentRequest {
  amount: number;
  currency: string;
  phone: string;
  provider: 'flooz' | 'tmoney' | 'orange_money' | 'mtn_momo';
  reference: string;
  description?: string;
}

export interface PaymentResponse {
  success: boolean;
  transactionId?: string;
  reference?: string;
  status: 'pending' | 'processing' | 'success' | 'failed';
  message?: string;
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
  private baseURL: string;
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

  constructor() {
    this.baseURL = 'http://localhost:8000/api';
  }

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

  /**
   * Initier un paiement Mobile Money
   */
  async initiatePayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      // Validation locale
      if (!this.validatePhoneNumber(request.phone, request.provider)) {
        throw new Error('Numéro de téléphone invalide pour ce provider');
      }

      if (request.amount < 100) {
        throw new Error('Le montant minimum est de 100 XOF');
      }

      // Appel API backend
      const response = await axios.post(`${this.baseURL}/payments/mobile-money`, {
        amount: request.amount,
        currency: request.currency || 'XOF',
        phone: request.phone,
        provider: request.provider,
        reference: request.reference,
        description: request.description
      });

      // Sauvegarder dans l'historique local
      await this.saveToHistory({
        id: response.data.transactionId,
        amount: request.amount,
        currency: request.currency || 'XOF',
        provider: request.provider,
        status: response.data.status,
        date: new Date(),
        reference: request.reference,
        description: request.description
      });

      // Générer le string USSD si nécessaire
      const ussdString = this.generateUSSDString(request);

      return {
        success: true,
        transactionId: response.data.transactionId,
        reference: response.data.reference,
        status: response.data.status,
        message: response.data.message,
        ussdString
      };
    } catch (error: any) {
      console.error('Payment initiation error:', error);
      return {
        success: false,
        status: 'failed',
        message: error.response?.data?.message || error.message || 'Erreur lors du paiement'
      };
    }
  }

  /**
   * Vérifier le statut d'un paiement
   */
  async checkPaymentStatus(transactionId: string): Promise<PaymentResponse> {
    try {
      const response = await axios.get(`${this.baseURL}/payments/status/${transactionId}`);

      return {
        success: response.data.success,
        transactionId: response.data.transactionId,
        reference: response.data.reference,
        status: response.data.status,
        message: response.data.message
      };
    } catch (error: any) {
      return {
        success: false,
        status: 'failed',
        message: error.response?.data?.message || 'Erreur lors de la vérification'
      };
    }
  }

  /**
   * Simuler un paiement (pour les tests)
   */
  async simulatePayment(request: PaymentRequest): Promise<PaymentResponse> {
    return new Promise((resolve) => {
      // Simuler un délai de traitement
      setTimeout(() => {
        const success = Math.random() > 0.2; // 80% de succès

        resolve({
          success,
          transactionId: `SIM-${Date.now()}`,
          reference: request.reference,
          status: success ? 'success' : 'failed',
          message: success
            ? 'Paiement simulé avec succès'
            : 'Échec du paiement simulé',
          ussdString: this.generateUSSDString(request)
        });
      }, 2000);
    });
  }

  /**
   * Valider un numéro de téléphone selon le provider
   */
  private validatePhoneNumber(phone: string, provider: string): boolean {
    const patterns: Record<string, RegExp> = {
      flooz: /^(228)?[79]\d{7}$/,     // Togo: 7XXXXXXX ou 9XXXXXXX
      tmoney: /^(228)?[79]\d{7}$/,    // Togo: 7XXXXXXX ou 9XXXXXXX
      orange_money: /^(225|221|223|226|224)?[0-9]{8,10}$/,
      mtn_momo: /^(233|225|237|229)?[0-9]{8,10}$/
    };

    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    return patterns[provider]?.test(cleanPhone) || false;
  }

  /**
   * Générer le string USSD pour paiement manuel
   */
  private generateUSSDString(request: PaymentRequest): string {
    const provider = this.providers.find(p => p.id === request.provider);
    if (!provider) return '';

    // Format spécifique selon le provider
    switch (request.provider) {
      case 'flooz':
        return `${provider.ussdCode} > Payer > Marchand > ${request.reference} > ${request.amount}`;
      case 'tmoney':
        return `${provider.ussdCode} > Transfert > ${request.reference} > ${request.amount}`;
      case 'orange_money':
        return `${provider.ussdCode} > Transfert d'argent > ${request.reference} > ${request.amount}`;
      case 'mtn_momo':
        return `${provider.ussdCode} > Send Money > ${request.reference} > ${request.amount}`;
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
      console.error('Error getting transaction history:', error);
      return [];
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
      console.error('Error saving to history:', error);
    }
  }

  /**
   * Effacer l'historique des transactions
   */
  async clearHistory(): Promise<void> {
    try {
      await AsyncStorage.removeItem('payment_history');
    } catch (error) {
      console.error('Error clearing history:', error);
    }
  }

  /**
   * Obtenir les frais de transaction
   */
  calculateFees(amount: number, provider: string): number {
    const feeRates: Record<string, number> = {
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
   */
  formatCurrency(amount: number, currency: string = 'XOF'): string {
    return new Intl.NumberFormat('fr-TG', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }
}

export default new PaymentService();