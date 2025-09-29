import type { Product as ApiProduct } from '@/types'

export interface NormalizedProduct {
  id: number
  name: string
  description: string
  original_price: number
  discounted_price: number
  discount: number
  merchant: {
    name: string
    address: string
    distance: number | null
  }
  expires_at: Date | null
  available_quantity: number
  reserved_quantity: number
  category?: string
  category_id?: number | null
  image_url?: string
}

const CATEGORY_KEY_MAP: Record<string, string> = {
  'Fruits et Légumes': 'produce',
  'Boulangerie': 'bakery',
  'Plats préparés': 'prepared',
  'Épicerie': 'dairy',
  'Produits laitiers': 'dairy',
  'Viandes': 'meat'
}

type CategoryInput =
  | string
  | null
  | undefined
  | { id?: number | null; name?: string | null }

const slugify = (value: string): string => {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

const getCategoryBaseSlug = (name?: string | null): string | undefined => {
  if (!name) {
    return undefined
  }

  const trimmedName = name.trim()

  if (!trimmedName) {
    return undefined
  }

  return CATEGORY_KEY_MAP[trimmedName] || slugify(trimmedName)
}

export const getCategoryKey = (category?: CategoryInput): string => {
  if (!category) {
    return 'other'
  }

  let id: number | null = null
  let name: string | null | undefined

  if (typeof category === 'string') {
    name = category
  } else if (typeof category === 'object') {
    id = typeof category.id === 'number' && Number.isFinite(category.id)
      ? category.id
      : null
    name = category.name
  }

  const baseSlug = getCategoryBaseSlug(name)

  if (id !== null) {
    if (baseSlug) {
      return `${baseSlug}-${id}`
    }

    return `category-${id}`
  }

  return baseSlug || 'other'
}

export const normalizeProduct = (product: ApiProduct): NormalizedProduct => {
  const originalPrice = typeof product.original_price === 'string'
    ? parseFloat(product.original_price)
    : Number(product.original_price)

  const discountedPrice = typeof product.discounted_price === 'string'
    ? parseFloat(product.discounted_price)
    : Number(product.discounted_price)

  const discountValue = typeof product.discount_percentage === 'string'
    ? parseFloat(product.discount_percentage)
    : Number(product.discount_percentage ?? 0)

  const merchantName = (product.merchant as any)?.business_name
    || product.merchant?.name
    || 'Commerçant inconnu'

  const merchantAddress = (product.merchant as any)?.address
    || product.merchant?.city
    || 'Adresse non renseignée'

  const rawMerchantDistance = (product.merchant as any)?.distance_km
    ?? (product.merchant as any)?.distance
    ?? null

  const merchantDistance = typeof rawMerchantDistance === 'string'
    ? parseFloat(rawMerchantDistance)
    : rawMerchantDistance

  const availableQuantity = Number((product as any).available_quantity ?? product.quantity_available ?? 0)

  return {
    id: product.id,
    name: product.name,
    description: product.description || '',
    original_price: Number.isFinite(originalPrice) ? originalPrice : 0,
    discounted_price: Number.isFinite(discountedPrice) ? discountedPrice : 0,
    discount: Number.isFinite(discountValue) ? discountValue : 0,
    merchant: {
      name: merchantName,
      address: merchantAddress,
      distance: typeof merchantDistance === 'number' && !Number.isNaN(merchantDistance)
        ? merchantDistance
        : null
    },
    expires_at: product.expiration_date ? new Date(product.expiration_date) : null,
    available_quantity: Number.isFinite(availableQuantity) ? availableQuantity : 0,
    reserved_quantity: 0,
    category: getCategoryKey(product.category),
    category_id: typeof product.category?.id === 'number' && Number.isFinite(product.category.id)
      ? product.category.id
      : null,
    image_url: product.image_url || undefined
  }
}
