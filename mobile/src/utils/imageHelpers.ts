import { API_BASE_URL } from '../services/api'

/**
 * Build full image URL from relative path with category-aware fallback
 * @param imageUrl - Relative or absolute image URL
 * @param categoryName - Optional category name for smart placeholder
 * @returns Full image URL or category-specific placeholder
 */
export const getImageUrl = (
  imageUrl: string | null | undefined,
  categoryName?: string
): string => {
  // If no image, return category-specific placeholder
  if (!imageUrl) {
    return getCategoryPlaceholder(categoryName)
  }

  // If already a full URL, return as is
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl
  }

  // Build full URL from API base. Only strip a trailing /api segment so that
  // API hosts like https://api.antigaspi.com/api keep the subdomain intact.
  const baseUrl = API_BASE_URL.replace(/\/api\/?$/, '')

  // Ensure we don't end up with double slashes when the relative path already
  // starts with one (e.g. `/storage/products/foo.jpg`).
  const normalizedPath = imageUrl.replace(/^\/+/, '')

  return `${baseUrl}/${normalizedPath}`
}

/**
 * Get placeholder image for a category
 * @param categoryName - Category name
 * @returns Placeholder URL for the category
 */
export const getCategoryPlaceholder = (categoryName?: string): string => {
  const placeholders: Record<string, string> = {
    boulangerie: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400',
    'fruits & légumes': 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=400',
    viandes: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=400',
    laitier: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=400',
    épicerie: 'https://images.unsplash.com/photo-1534483509719-3feaee7c30da?w=400',
  }

  const key = categoryName?.toLowerCase() || ''
  return placeholders[key] || 'https://via.placeholder.com/400'
}
