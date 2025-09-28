import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useCategories } from '@/composables/useCategories'

// Mock API
vi.mock('@/services/api', () => ({
  apiService: {
    getCategories: vi.fn()
  }
}))

describe('useCategories Composable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
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

    const { apiService } = await import('@/services/api')
    vi.mocked(apiService.getCategories).mockResolvedValue({
      data: mockCategories,
      success: true
    })

    const { categories, loading, loadCategories } = useCategories()

    await loadCategories()

    expect(loading.value).toBe(false)
    expect(categories.value).toEqual(mockCategories)
  })

  it('should handle API errors gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const { apiService } = await import('@/services/api')
    vi.mocked(apiService.getCategories).mockRejectedValue(new Error('API Error'))

    const { categories, loading, loadCategories } = useCategories()

    await loadCategories()

    expect(loading.value).toBe(false)
    expect(categories.value).toEqual([])
    expect(consoleSpy).toHaveBeenCalled()

    consoleSpy.mockRestore()
  })

  it('should set loading state correctly', async () => {
    let resolvePromise: () => void
    const apiPromise = new Promise(resolve => {
      resolvePromise = resolve
    })

    const { apiService } = await import('@/services/api')
    vi.mocked(apiService.getCategories).mockReturnValue(apiPromise as any)

    const { loading, loadCategories } = useCategories()

    const loadPromise = loadCategories()

    expect(loading.value).toBe(true)

    resolvePromise!({ data: [], success: true })
    await loadPromise

    expect(loading.value).toBe(false)
  })

  it('should find category by ID', () => {
    const { categories, getCategoryById } = useCategories()

    categories.value = [
      { id: 1, name: 'Boulangerie', slug: 'bakery' },
      { id: 2, name: 'Fruits', slug: 'fruits' }
    ]

    const category = getCategoryById(1)
    expect(category).toEqual({ id: 1, name: 'Boulangerie', slug: 'bakery' })

    const notFound = getCategoryById(999)
    expect(notFound).toBeUndefined()
  })

  it('should find category by slug', () => {
    const { categories, getCategoryBySlug } = useCategories()

    categories.value = [
      { id: 1, name: 'Boulangerie', slug: 'bakery' },
      { id: 2, name: 'Fruits', slug: 'fruits' }
    ]

    const category = getCategoryBySlug('fruits')
    expect(category).toEqual({ id: 2, name: 'Fruits', slug: 'fruits' })

    const notFound = getCategoryBySlug('nonexistent')
    expect(notFound).toBeUndefined()
  })
})
