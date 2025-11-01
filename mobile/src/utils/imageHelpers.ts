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

  // 🔧 FIX: If it's an Unsplash URL (external), replace with placeholder
  // because emulator has no internet connectivity
  if (imageUrl.includes('unsplash.com') || imageUrl.includes('picsum.photos')) {
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
 * Get placeholder image for a category (using data URI for offline support)
 * @param categoryName - Category name
 * @returns Placeholder data URI with category emoji
 */
export const getCategoryPlaceholder = (categoryName?: string): string => {
  // Map category to emoji
  const categoryEmojis: Record<string, string> = {
    boulangerie: '🥐',
    'fruits & légumes': '🥕',
    viandes: '🥩',
    laitier: '🥛',
    épicerie: '🥫',
  }

  const key = categoryName?.toLowerCase() || ''
  const emoji = categoryEmojis[key] || '🛍️'

  // Create a simple SVG with the emoji (works offline)
  const svg = `<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg"><rect width="400" height="400" fill="#10B981" opacity="0.1"/><text x="50%" y="50%" font-size="120" text-anchor="middle" dy=".3em">${emoji}</text></svg>`

  // Return as data URI using encodeURIComponent (React Native compatible, no btoa needed)
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}
