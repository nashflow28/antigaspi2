import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useProducts } from '@/composables/useProducts'

// Mock API service
vi.mock('@/services/api', () => ({
  apiService: {
    getMerchantProducts: vi.fn()
  }
}))

describe('useProducts Composable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
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

    const { apiService } = await import('@/services/api')
    vi.mocked(apiService.getMerchantProducts).mockResolvedValue({
      success: true,
      data: mockProducts
    })

    const { merchantProducts, loading, loadMerchantProducts } = useProducts()

    await loadMerchantProducts()

    expect(loading.value).toBe(false)
    expect(merchantProducts.value).toEqual(mockProducts)
  })

  it('should handle API errors gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const { apiService } = await import('@/services/api')
    vi.mocked(apiService.getMerchantProducts).mockRejectedValue(new Error('API Error'))

    const { loading, loadMerchantProducts } = useProducts()

    await loadMerchantProducts()

    expect(loading.value).toBe(false)
    expect(consoleSpy).toHaveBeenCalledWith('Error loading merchant products:', expect.any(Error))

    consoleSpy.mockRestore()
  })

  it('should set loading state correctly during API call', async () => {
    // eslint-disable-next-line no-unused-vars
    let resolvePromise: (value: unknown) => void
    const apiPromise = new Promise(resolve => {
      resolvePromise = resolve
    })

    const { apiService } = await import('@/services/api')
    vi.mocked(apiService.getMerchantProducts).mockReturnValue(apiPromise as any)

    const { loading, loadMerchantProducts } = useProducts()

    const loadPromise = loadMerchantProducts()

    expect(loading.value).toBe(true)

    resolvePromise!({ success: true, data: [] })
    await loadPromise

    expect(loading.value).toBe(false)
  })
})
