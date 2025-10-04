import { getCategoryEmoji } from './categoryEmojis'

describe('getCategoryEmoji', () => {
  it('returns the baguette emoji for boulangerie categories', () => {
    expect(getCategoryEmoji('Boulangerie')).toBe('🥖')
    expect(getCategoryEmoji('boulangerie')).toBe('🥖')
  })

  it('returns the default emoji when category is unknown', () => {
    expect(getCategoryEmoji('Inconnue')).toBe('🛍️')
  })
})
