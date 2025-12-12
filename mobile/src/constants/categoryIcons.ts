/**
 * Category Icons Mapping
 *
 * Replaces hardcoded emojis with Ionicons vector icons.
 * More consistent rendering and better accessibility.
 *
 * BUG FIX #L-001: Replace hardcoded emojis with vector icons
 */

import { Ionicons } from '@expo/vector-icons'

/**
 * Icon name type from Ionicons
 */
export type IoniconName = keyof typeof Ionicons.glyphMap

/**
 * Category to icon mapping
 * Keys are lowercase category identifiers
 */
export const CATEGORY_ICONS: Record<string, IoniconName> = {
  // Food categories
  boulangerie: 'restaurant-outline',
  bakery: 'restaurant-outline',
  pain: 'restaurant-outline',
  bread: 'restaurant-outline',

  fruits: 'nutrition-outline',
  fruit: 'nutrition-outline',

  legumes: 'leaf-outline',
  vegetables: 'leaf-outline',
  légumes: 'leaf-outline',

  viande: 'fish-outline',
  meat: 'fish-outline',
  poisson: 'fish-outline',
  fish: 'fish-outline',

  epicerie: 'basket-outline',
  grocery: 'basket-outline',
  épicerie: 'basket-outline',

  boissons: 'beer-outline',
  drinks: 'beer-outline',
  beverages: 'beer-outline',

  laitier: 'water-outline',
  dairy: 'water-outline',
  produits_laitiers: 'water-outline',

  plats_prepares: 'fast-food-outline',
  prepared: 'fast-food-outline',
  traiteur: 'fast-food-outline',

  bio: 'leaf-outline',
  organic: 'leaf-outline',

  surgeles: 'snow-outline',
  frozen: 'snow-outline',

  condiments: 'flask-outline',
  sauces: 'flask-outline',

  // Restaurant types
  restaurant: 'restaurant-outline',
  cafe: 'cafe-outline',
  café: 'cafe-outline',

  // Special categories
  promo: 'pricetag-outline',
  promotion: 'pricetag-outline',

  nouveau: 'sparkles-outline',
  new: 'sparkles-outline',

  populaire: 'flame-outline',
  popular: 'flame-outline',
  trending: 'trending-up-outline',

  surprise: 'gift-outline',
  panier_surprise: 'gift-outline',
  surprise_basket: 'gift-outline',

  // Default
  default: 'pricetag-outline',
  other: 'pricetag-outline',
  autres: 'pricetag-outline',
} as const

/**
 * Get the icon name for a category
 * @param categoryName - The category name or slug
 * @returns The Ionicon name for this category
 */
export const getCategoryIcon = (categoryName: string | null | undefined): IoniconName => {
  if (!categoryName) return CATEGORY_ICONS.default

  const normalizedName = categoryName.toLowerCase().trim()

  // Direct match
  if (normalizedName in CATEGORY_ICONS) {
    return CATEGORY_ICONS[normalizedName]
  }

  // Partial match - search for keywords
  for (const [key, icon] of Object.entries(CATEGORY_ICONS)) {
    if (normalizedName.includes(key) || key.includes(normalizedName)) {
      return icon
    }
  }

  return CATEGORY_ICONS.default
}

/**
 * Get icon color based on category type
 */
export const getCategoryIconColor = (categoryName: string | null | undefined): string => {
  if (!categoryName) return '#6B7280' // gray-500

  const normalizedName = categoryName.toLowerCase()

  // Fresh produce - green
  if (
    normalizedName.includes('fruit') ||
    normalizedName.includes('legume') ||
    normalizedName.includes('bio') ||
    normalizedName.includes('végétal')
  ) {
    return '#10B981' // green-500
  }

  // Bakery - amber/brown
  if (
    normalizedName.includes('boulangerie') ||
    normalizedName.includes('pain') ||
    normalizedName.includes('bakery')
  ) {
    return '#F59E0B' // amber-500
  }

  // Meat/Fish - red
  if (
    normalizedName.includes('viande') ||
    normalizedName.includes('poisson') ||
    normalizedName.includes('meat')
  ) {
    return '#EF4444' // red-500
  }

  // Dairy - blue
  if (
    normalizedName.includes('laitier') ||
    normalizedName.includes('dairy')
  ) {
    return '#3B82F6' // blue-500
  }

  // Promotions - orange
  if (
    normalizedName.includes('promo') ||
    normalizedName.includes('surprise')
  ) {
    return '#F97316' // orange-500
  }

  return '#6B7280' // gray-500 default
}

/**
 * Category icon with color configuration
 */
export interface CategoryIconConfig {
  name: IoniconName
  color: string
  backgroundColor?: string
}

/**
 * Get full icon configuration for a category
 */
export const getCategoryIconConfig = (
  categoryName: string | null | undefined
): CategoryIconConfig => {
  const iconName = getCategoryIcon(categoryName)
  const color = getCategoryIconColor(categoryName)

  // Light background based on color
  const backgroundMap: Record<string, string> = {
    '#10B981': '#D1FAE5', // green-100
    '#F59E0B': '#FEF3C7', // amber-100
    '#EF4444': '#FEE2E2', // red-100
    '#3B82F6': '#DBEAFE', // blue-100
    '#F97316': '#FFEDD5', // orange-100
    '#6B7280': '#F3F4F6', // gray-100
  }

  return {
    name: iconName,
    color,
    backgroundColor: backgroundMap[color] || '#F3F4F6',
  }
}

export default {
  CATEGORY_ICONS,
  getCategoryIcon,
  getCategoryIconColor,
  getCategoryIconConfig,
}
