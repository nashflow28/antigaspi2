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
    label: 'Portefeuille Antigaspi',
    description: 'Payez avec votre solde Antigaspi. Rapide et sécurisé.',
    icon: 'wallet',
  },
  {
    value: 'flooz',
    label: 'Mobile Money',
    description: 'Payez instantanément via Flooz/TMoney.',
    icon: 'phone-portrait',
  },
  {
    value: 'paystack',
    label: 'Carte bancaire',
    description: 'Paiement sécurisé par carte (Visa, Mastercard).',
    icon: 'card',
  },
]
