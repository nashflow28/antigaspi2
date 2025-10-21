import { Merchant } from '../../types'

export interface MerchantFixture extends Merchant {
  products_count?: number
  user?: {
    city: string
    address: string
    phone: string
  }
}

let merchantSequence = 1

export const resetMerchantSequence = () => {
  merchantSequence = 1
}

export const makeMerchant = (overrides: Partial<MerchantFixture> = {}): MerchantFixture => {
  const id = overrides.id ?? merchantSequence++

  const base: MerchantFixture = {
    id,
    business_name: `Boutique ${id}`,
    business_type: 'Épicerie',
    city: 'Lomé',
    address: `Rue ${id}`,
    phone: '+228 90 00 00 00',
    is_verified: false,
    latitude: null,
    longitude: null,
    products_count: 0,
    user: {
      city: 'Lomé',
      address: `Rue ${id}`,
      phone: '+228 90 00 00 00',
    },
  }

  return {
    ...base,
    ...overrides,
    user: {
      ...base.user,
      ...overrides.user,
    },
  }
}
