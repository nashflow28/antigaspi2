import { describe, it, expect, beforeEach, vi } from 'vitest'

// Create hoisted mock function to ensure it's the same reference everywhere
const mockGetMerchantProducts = vi.hoisted(() => vi.fn())

vi.mock('@/services/api', () => ({
  apiService: {
    getMerchantProducts: mockGetMerchantProducts
  }
}))

// Import after mocking
import { useProducts } from '@/composables/useProducts'

describe('useProducts Composable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetMerchantProducts.mockReset()
    // Clear the module-level merchantProducts ref to reset state between tests
    const { merchantProducts } = useProducts()
    merchantProducts.value = []
  })

  it('should initialize with correct default values', () => {
    const { merchantProducts, loading } = useProducts()

    expect(merchantProducts.value).toEqual([])
    expect(loading.value).toBe(false)
  })

  it('should load merchant products successfully', async () => {
    const mockProducts = [
      { id: 1, name: 'Product 1', price: 100 },
      { id: 2, name: 'Product 2', price: 200 }
    ]

    mockGetMerchantProducts.mockResolvedValue({
      success: true,
      data: mockProducts
    })

    const { merchantProducts, loading, loadMerchantProducts } = useProducts()

    await loadMerchantProducts()

    expect(loading.value).toBe(false)
    expect(merchantProducts.value).toEqual(mockProducts)
  })

  it('should handle API errors gracefully', async () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    mockGetMerchantProducts.mockRejectedValue(new Error('API Error'))

    const { merchantProducts, loading, loadMerchantProducts } = useProducts()

    await loadMerchantProducts()

    // Verify error is handled gracefully: loading stops and products remain empty
    expect(loading.value).toBe(false)
    expect(merchantProducts.value).toEqual([])

    consoleSpy.mockRestore()
  })

  it('should set loading state correctly during API call', async () => {
    let resolvePromise: (value: unknown) => void
    const apiPromise = new Promise(resolve => {
      resolvePromise = resolve
    })

    mockGetMerchantProducts.mockReturnValue(apiPromise)

    const { loading, loadMerchantProducts } = useProducts()

    const loadPromise = loadMerchantProducts()

    expect(loading.value).toBe(true)

    resolvePromise!({ success: true, data: [] })
    await loadPromise

    expect(loading.value).toBe(false)
  })
})
