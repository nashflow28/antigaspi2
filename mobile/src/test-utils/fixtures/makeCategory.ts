import { Category } from '../../types'

export type CategoryFixture = Category

let categorySequence = 1

export const resetCategorySequence = () => {
  categorySequence = 1
}

/**
 * Factory function to create Category test fixtures
 *
 * @param overrides - Partial Category object to override defaults
 * @returns Complete Category object with test data
 *
 * @example
 * ```typescript
 * const category = makeCategory({ name: 'Boulangerie' })
 * // { id: 1, name: 'Boulangerie', description: 'Catégorie de test' }
 * ```
 */
export const makeCategory = (overrides: Partial<CategoryFixture> = {}): CategoryFixture => {
  const id = overrides.id ?? categorySequence++

  return {
    id,
    name: overrides.name ?? `Catégorie ${id}`,
    description: overrides.description ?? `Description de la catégorie ${id}`,
    ...overrides,
  }
}
