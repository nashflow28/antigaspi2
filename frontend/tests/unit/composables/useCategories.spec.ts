import { describe, it, expect, beforeEach, vi } from 'vitest'

// Create hoisted mock function to ensure it's the same reference everywhere
const mockGetCategories = vi.hoisted(() => vi.fn())

vi.mock('@/services/api', () => ({
  apiService: {
    getCategories: mockGetCategories
  }
}))

// Import after mocking
import { useCategories } from '@/composables/useCategories'

describe('useCategories Composable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetCategories.mockReset()
    // Clear the module-level categories ref to reset state between tests
    const { categories } = useCategories()
    categories.value = []
  })

  it('should initialize with correct default values', () => {
    const { categories, loading } = useCategories()

    expect(categories.value).toEqual([])
    expect(loading.value).toBe(false)
  })

  it('should load categories successfully', async () => {
    const mockCategories = [
      { id: 1, name: 'Boulangerie', slug: 'bakery' },
      { id: 2, name: 'Fruits et Légumes', slug: 'fruits-vegetables' }
    ]

    mockGetCategories.mockResolvedValue({
      data: mockCategories,
      success: true
    })

    const { categories, loading, loadCategories } = useCategories()

    await loadCategories()

    expect(loading.value).toBe(false)
    expect(categories.value).toEqual(mockCategories)
  })

  it('should handle API errors gracefully', async () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    mockGetCategories.mockRejectedValue(new Error('API Error'))

    const { categories, loading, loadCategories } = useCategories()

    await loadCategories()

    // Verify error is handled gracefully: loading stops and categories remain empty
    expect(loading.value).toBe(false)
    expect(categories.value).toEqual([])

    consoleSpy.mockRestore()
  })

  it('should set loading state correctly', async () => {
    let resolvePromise: (value: any) => void
    const apiPromise = new Promise(resolve => {
      resolvePromise = resolve
    })

    mockGetCategories.mockReturnValue(apiPromise)

    const { loading, loadCategories } = useCategories()

    const loadPromise = loadCategories()

    expect(loading.value).toBe(true)

    resolvePromise!({ data: [], success: true })
    await loadPromise

    expect(loading.value).toBe(false)
  })

  it('should find category by ID using categories ref', () => {
    const { categories } = useCategories()

    categories.value = [
      { id: 1, name: 'Boulangerie', slug: 'bakery' },
      { id: 2, name: 'Fruits', slug: 'fruits' }
    ]

    const category = categories.value.find(c => c.id === 1)
    expect(category).toEqual({ id: 1, name: 'Boulangerie', slug: 'bakery' })

    const notFound = categories.value.find(c => c.id === 999)
    expect(notFound).toBeUndefined()
  })

  it('should find category by slug using categories ref', () => {
    const { categories } = useCategories()

    categories.value = [
      { id: 1, name: 'Boulangerie', slug: 'bakery' },
      { id: 2, name: 'Fruits', slug: 'fruits' }
    ]

    const category = categories.value.find(c => c.slug === 'fruits')
    expect(category).toEqual({ id: 2, name: 'Fruits', slug: 'fruits' })

    const notFound = categories.value.find(c => c.slug === 'nonexistent')
    expect(notFound).toBeUndefined()
  })
})
