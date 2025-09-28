import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

vi.mock('@/composables/useNotifications', () => {
  const success = vi.fn().mockReturnValue('success')
  const error = vi.fn().mockReturnValue('error')
  return {
    notify: {
      success,
      error,
      info: vi.fn()
    }
  }
})

vi.mock('@/services/api', () => ({
  apiService: {
    getProducts: vi.fn(),
    getProduct: vi.fn(),
    getProductById: vi.fn(),
    createProduct: vi.fn(),
    updateProduct: vi.fn(),
    deleteProduct: vi.fn()
  }
}))

import { useProductsStore } from '@/stores/products'

const sampleProduct = () => ({
  id: 1,
  name: 'Pain complet',
  description: 'Artisanal',
  category: { id: 5, name: 'Boulangerie' },
  merchant: { id: 2, business_name: 'Maison Dupont' },
  discounted_price: 200,
  original_price: 400,
  days_until_expiration: 1
})

describe('Products store smoke tests', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('loads catalog and exposes helpers', async () => {
    const store = useProductsStore()
    const { apiService } = await import('@/services/api')

    vi.mocked(apiService.getProducts).mockResolvedValue({
      data: [sampleProduct()],
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

  it('updates, deletes and searches products with notifications', async () => {
    const store = useProductsStore()
    const { apiService } = await import('@/services/api')
    const { notify } = await import('@/composables/useNotifications')

    store.products = [
      sampleProduct() as any,
      { ...sampleProduct(), id: 2, name: 'Panier gourmand', category: { id: 7, name: 'Épicerie' } },
      { ...sampleProduct(), id: 3, category: null, categoryId: 5 },
      {
        id: 4,
        name: 'Mini panier',
        description: 'Portion individuelle',
        price: 35,
        category: { id: 5, name: 'Boulangerie' },
        merchant: { id: 9, business_name: 'La Fabrique' },
        discounted_price: null,
        original_price: null,
        days_until_expiration: 1
      }
    ]

    vi.mocked(apiService.updateProduct).mockResolvedValue({
      data: { ...store.products[0], name: 'Pain BIO' }
    } as any)

    await store.updateProduct(1, { name: 'Pain BIO' })
    expect(store.products[0].name).toBe('Pain BIO')
    expect(notify.success).toHaveBeenCalledWith('Produit mis à jour avec succès', 'Catalogue', expect.any(Object))

    const createdProduct = {
      ...sampleProduct(),
      id: 99,
      name: 'Pack découverte',
      discounted_price: 1500,
      original_price: 2000,
      merchant: { id: 4, business_name: 'Supermarché Bleu' }
    }

    vi.mocked(apiService.createProduct).mockResolvedValue({ data: createdProduct } as any)
    await store.createProduct(createdProduct)
    expect(store.products[0].id).toBe(99)

    vi.mocked(apiService.deleteProduct).mockResolvedValue({ success: true } as any)
    await store.deleteProduct(1)
    expect(store.products).toHaveLength(4)

    const byCategory = store.getProductsByCategory(7)
    expect(byCategory).toHaveLength(1)
    const fallbackCategory = store.getProductsByCategory(5)
    expect(fallbackCategory).toHaveLength(3)

    const byRange = store.getProductsByPriceRange(0, 500)
    expect(byRange.map(product => product.id)).toEqual(expect.arrayContaining([2, 4]))

    const bySearch = store.searchProducts('panier')
    expect(bySearch.length).toBeGreaterThanOrEqual(2)

    vi.mocked(apiService.deleteProduct).mockRejectedValueOnce(new Error('failed'))
    const failedDeletion = await store.deleteProduct(999)
    expect(failedDeletion.success).toBe(false)
    expect(notify.error).toHaveBeenCalledWith(
      'failed',
      'Catalogue',
      expect.objectContaining({ action: expect.objectContaining({ label: 'Réessayer' }) })
    )
    await notify.error.mock.calls.at(-1)?.[2]?.action?.callback?.()
  })

  it('handles API failures gracefully and resets filters', async () => {
    const store = useProductsStore()
    const { apiService } = await import('@/services/api')
    const { notify } = await import('@/composables/useNotifications')

    vi.mocked(apiService.getProducts).mockRejectedValue(new Error('timeout'))
    const loadResult = await store.fetchProducts()
    expect(loadResult.success).toBe(false)
    expect(notify.error).toHaveBeenCalledWith(
      'timeout',
      'Catalogue',
      expect.objectContaining({
        action: expect.objectContaining({ label: 'Réessayer' })
      })
    )
    await notify.error.mock.calls.at(-1)?.[2]?.action?.callback?.()

    vi.mocked(apiService.getProductById).mockRejectedValue(new Error('missing'))
    const fetchResult = await store.fetchProduct(5)
    expect(fetchResult.success).toBe(false)
    expect(notify.error).toHaveBeenCalledWith(
      'missing',
      'Produit',
      expect.objectContaining({
        action: expect.objectContaining({ label: 'Réessayer' })
      })
    )
    await notify.error.mock.calls.at(-1)?.[2]?.action?.callback?.()

    vi.mocked(apiService.createProduct).mockRejectedValue(new Error('invalid'))
    const creation = await store.createProduct({ name: 'Fail' })
    expect(creation.success).toBe(false)
    expect(notify.error).toHaveBeenCalledWith(
      'invalid',
      'Catalogue',
      expect.objectContaining({
        action: expect.objectContaining({ label: 'Réessayer' })
      })
    )
    await notify.error.mock.calls.at(-1)?.[2]?.action?.callback?.()

    store.setFilters({ search: 'Pain', category: 'Boulangerie' })
    expect(store.filters.search).toBe('Pain')
    store.clearFilters()
    expect(store.filters.search).toBe('')
  })

  it('fetches product with legacy resolver when getProductById is unavailable', async () => {
    const store = useProductsStore()
    const { apiService } = await import('@/services/api')

    ;(apiService as any).getProductById = undefined

    vi.mocked(apiService.getProduct).mockResolvedValue({
      data: {
        id: 42,
        name: 'Pack terroir',
        description: 'Sélection locale',
        category: { id: 10, name: 'Terroir' },
        merchant: { id: 11, business_name: 'Circuit Court' },
        discounted_price: 3200,
        original_price: 6400,
        days_until_expiration: 2
      }
    } as any)

    const result = await store.fetchProduct(42)
    expect(result.success).toBe(true)
    expect(store.selectedProduct?.id).toBe(42)
  })
})
