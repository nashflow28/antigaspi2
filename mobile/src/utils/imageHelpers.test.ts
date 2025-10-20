/**
 * Tests unitaires imageHelpers (URL complète + placeholders)
 */

// Mock de l'API_BASE_URL pour contrôle des URLs construites
jest.mock('../services/api', () => ({
  API_BASE_URL: 'http://example.com/api',
}))

import { getImageUrl, getCategoryPlaceholder } from './imageHelpers'

describe('imageHelpers', () => {
  it('retourne placeholder si image manquante', () => {
    const url = getImageUrl(null, 'Boulangerie')
    expect(url).toContain('unsplash.com')
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
    expect(ph).toContain('placeholder')
  })
})

