/**
 * Tests unitaires imageHelpers (URL complète + placeholders)
 */

// Mock de l'API_BASE_URL pour contrôle des URLs construites
jest.mock('../services/api', () => ({
  API_BASE_URL: 'http://example.com/api',
}))

import { getImageUrl, getCategoryPlaceholder } from './imageHelpers'

describe('imageHelpers', () => {
  it('retourne SVG data URI placeholder si image manquante', () => {
    const url = getImageUrl(null, 'Boulangerie')
    // New implementation returns SVG data URI with emoji (URL-encoded)
    expect(url).toMatch(/^data:image\/svg\+xml,/)
    // Check for croissant emoji (URL-encoded: %F0%9F%A5%90)
    expect(url).toContain('%F0%9F%A5%90')
  })

  it('retourne URL inchangée si absolue', () => {
    const abs = 'https://cdn.example.com/pic.jpg'
    expect(getImageUrl(abs)).toBe(abs)
  })

  it('préfixe correctement les URLs relatives via API_BASE_URL', () => {
    const rel = 'storage/products/pain.jpg'
    expect(getImageUrl(rel)).toBe('http://example.com/storage/products/pain.jpg')
  })

  it('placeholder générique si catégorie inconnue', () => {
    const ph = getCategoryPlaceholder('inconnue')
    // Returns SVG data URI with shopping bag emoji (URL-encoded)
    expect(ph).toMatch(/^data:image\/svg\+xml,/)
    // Check for shopping bag emoji (URL-encoded: %F0%9F%9B%8D)
    expect(ph).toContain('%F0%9F%9B%8D')
  })

  it('remplace URLs Unsplash par placeholder local', () => {
    const unsplashUrl = 'https://images.unsplash.com/photo-123'
    const result = getImageUrl(unsplashUrl, 'Boulangerie')
    // Should NOT return Unsplash URL, should return local SVG placeholder
    expect(result).not.toContain('unsplash.com')
    expect(result).toMatch(/^data:image\/svg\+xml,/)
  })
})

