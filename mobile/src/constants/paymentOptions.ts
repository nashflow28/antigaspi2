import { Ionicons } from '@expo/vector-icons'

import { PaymentMethod } from '../types'

export type PaymentOption = {
  value: PaymentMethod
  label: string
  description: string
  icon: keyof typeof Ionicons.glyphMap
}

export const PAYMENT_OPTIONS: PaymentOption[] = [
  {
    value: 'wallet',
    label: 'Portefeuille GÊLADAL',
    description: 'Payez avec votre solde GÊLADAL. Rapide et sécurisé.',
    icon: 'wallet',
  },
  {
    value: 'flooz',
    label: 'Flooz (Moov)',
    description: 'Paiement Mobile Money via Flooz de Moov Africa.',
    icon: 'phone-portrait',
  },
  {
    value: 'tmoney',
    label: 'Mixx by Yas',
    description: 'Paiement Mobile Money via Mixx by Yas (ex-TMoney).',
    icon: 'phone-portrait',
  },
  // Carte bancaire - à activer ultérieurement
  // {
  //   value: 'paystack',
  //   label: 'Carte bancaire',
  //   description: 'Paiement sécurisé par carte (Visa, Mastercard).',
  //   icon: 'card',
  // },
]

// Helper to check if a payment method is Mobile Money
export const isMobileMoneyPayment = (method: PaymentMethod): boolean => {
  return ['flooz', 'tmoney'].includes(method)
}
