import { Product, Category } from '../../types'
import { makeMerchant, MerchantFixture, resetMerchantSequence } from './makeMerchant'
import { resetCategorySequence } from './makeCategory'

export type ProductFixture = Product

let productSequence = 1

export const resetProductSequence = () => {
  productSequence = 1
}

const buildCategory = (overrides: Partial<Category> = {}): Category => {
  const id = overrides.id ?? productSequence
  return {
    id,
    name: overrides.name ?? `Catégorie ${id}`,
    description: overrides.description ?? 'Catégorie de test',
  }
}

export const makeProduct = (
  overrides: Partial<ProductFixture & { merchant: MerchantFixture }> = {}
): ProductFixture => {
  const id = overrides.id ?? productSequence++
  const category = overrides.category ?? buildCategory(overrides.category)
  const merchant = overrides.merchant ?? makeMerchant(overrides.merchant)

  const base: ProductFixture = {
    id,
    name: `Produit ${id}`,
    description: 'Produit de test',
    // BUG FIX #M-004: Prices are now numbers
    original_price: 1000,
    discounted_price: 800,
    quantity_available: 5,
    expiration_date: new Date().toISOString(),
    image_url: `https://example.com/product-${id}.jpg`,
    discount_percentage: 20,
    savings: 200,
    days_until_expiration: 2,
    category,
    merchant,
    created_at: new Date().toISOString(),
    is_active: true,
  }

  return {
    ...base,
    category,
    merchant,
    ...overrides,
  }
}

export const resetFixtures = () => {
  resetMerchantSequence()
  resetProductSequence()
  resetCategorySequence()
}
