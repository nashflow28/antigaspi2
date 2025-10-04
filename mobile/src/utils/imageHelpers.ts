import { API_BASE_URL } from '../services/api'

/**
 * Build full image URL from relative path
 * @param imageUrl - Relative or absolute image URL
 * @returns Full image URL or placeholder
 */
export const getImageUrl = (imageUrl: string | null | undefined): string => {
  if (!imageUrl) {
    return 'https://via.placeholder.com/400'
  }

  // If already a full URL, return as is
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl
  }

  // Build full URL from API base
  const baseUrl = API_BASE_URL.replace('/api', '')
  return `${baseUrl}/${imageUrl}`
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
