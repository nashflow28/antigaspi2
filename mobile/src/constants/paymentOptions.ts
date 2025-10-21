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
    value: 'on_site',
    label: 'Sur place',
    description: 'Réglez au moment du retrait en boutique.',
    icon: 'storefront',
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
    description: 'Paiement sécurisé par carte (Paystack).',
    icon: 'card',
  },
  {
    value: 'wallet',
    label: 'Portefeuille',
    description: 'Utilisez votre portefeuille Antigaspi.',
    icon: 'wallet',
  },
]
