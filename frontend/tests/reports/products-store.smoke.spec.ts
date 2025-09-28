import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useProductsStore } from '@/stores/products'

vi.mock('@/services/api', () => ({
  apiService: {
    getProducts: vi.fn(),
    getProduct: vi.fn(),
    getProductById: vi.fn(),
    createProduct: vi.fn()
  }
}))

describe('Products store smoke tests', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('loads catalog and exposes helpers', async () => {
    const store = useProductsStore()
    const { apiService } = await import('@/services/api')

    vi.mocked(apiService.getProducts).mockResolvedValue({
      data: [
        {
          id: 1,
          name: 'Pain complet',
          description: 'Artisanal',
          category: { id: 5, name: 'Boulangerie' },
          merchant: { id: 2, business_name: 'Maison Dupont' },
          discounted_price: 200,
          original_price: 400,
          days_until_expiration: 1
        }
      ],
      success: true
    } as any)

    await store.fetchProducts()

    expect(store.products).toHaveLength(1)
    expect(store.filteredProducts).toHaveLength(1)
    expect(store.categories.map(category => category.name)).toContain('Boulangerie')
  })

  it('fetches single product and exposes selectedProduct alias', async () => {
    const store = useProductsStore()
    const { apiService } = await import('@/services/api')

    vi.mocked(apiService.getProductById).mockResolvedValue({
      data: {
        id: 9,
        name: 'Box anti-gaspi',
        description: '3 produits surprise',
        category: { id: 4, name: 'Surprise' },
        merchant: { id: 8, business_name: 'Épicerie Verte' },
        discounted_price: 1500,
        original_price: 3000,
        days_until_expiration: 2
      },
      success: true
    } as any)

    const result = await store.fetchProductById(9)

    expect(result.success).toBe(true)
    expect(store.selectedProduct?.name).toBe('Box anti-gaspi')
  })
})
