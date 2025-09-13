import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Product, ProductFilters } from '@/types'
import { apiService } from '@/services/api'

export const useProductsStore = defineStore('products', () => {
  const products = ref<Product[]>([])
  const currentProduct = ref<Product | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const filters = ref<ProductFilters>({
    search: '',
    category: '',
    merchant: '',
    max_price: undefined,
    max_expiry_days: undefined,
    page: 1,
    per_page: 12
  })
  const pagination = ref({
    current_page: 1,
    last_page: 1,
    per_page: 12,
    total: 0
  })

  const filteredProducts = computed(() => {
    return products.value.filter(product => {
      const matchesSearch = !filters.value.search ||
        product.name.toLowerCase().includes(filters.value.search.toLowerCase()) ||
        product.description.toLowerCase().includes(filters.value.search.toLowerCase())

      const matchesCategory = !filters.value.category ||
        product.category.name.toLowerCase() === filters.value.category.toLowerCase()

      const matchesMerchant = !filters.value.merchant ||
        product.merchant.business_name.toLowerCase().includes(filters.value.merchant.toLowerCase())

      const matchesPrice = !filters.value.max_price ||
        parseFloat(product.discounted_price) <= filters.value.max_price

      const matchesExpiry = filters.value.max_expiry_days === undefined ||
        product.days_until_expiration <= filters.value.max_expiry_days

      return matchesSearch && matchesCategory && matchesMerchant && matchesPrice && matchesExpiry
    })
  })

  const categories = computed(() => {
    const uniqueCategories = new Map()
    products.value.forEach(product => {
      if (!uniqueCategories.has(product.category.id)) {
        uniqueCategories.set(product.category.id, product.category)
      }
    })
    return Array.from(uniqueCategories.values())
  })

  const merchants = computed(() => {
    const uniqueMerchants = new Map()
    products.value.forEach(product => {
      if (!uniqueMerchants.has(product.merchant.id)) {
        uniqueMerchants.set(product.merchant.id, product.merchant)
      }
    })
    return Array.from(uniqueMerchants.values())
  })

  const setError = (message: string) => {
    error.value = message
    setTimeout(() => {
      error.value = null
    }, 5000)
  }

  const clearError = () => {
    error.value = null
  }

  const setFilters = (newFilters: Partial<ProductFilters>) => {
    filters.value = { ...filters.value, ...newFilters }
  }

  const clearFilters = () => {
    filters.value = {
      search: '',
      category: '',
      merchant: '',
      max_price: undefined,
      max_expiry_days: undefined,
      page: 1,
      per_page: 12
    }
  }

  const fetchProducts = async (customFilters?: ProductFilters) => {
    try {
      loading.value = true
      clearError()

      const filtersToUse = customFilters || filters.value
      const response = await apiService.getProducts(filtersToUse)

      products.value = response.data
      if (response.pagination) {
        pagination.value = response.pagination
      }

      return { success: true }
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des produits')
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  const fetchProduct = async (id: number) => {
    try {
      loading.value = true
      clearError()

      const response = await apiService.getProduct(id)
      currentProduct.value = response.data

      return { success: true }
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement du produit')
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  const createProduct = async (productData: Partial<Product>) => {
    try {
      loading.value = true
      clearError()

      const response = await apiService.createProduct(productData)

      // Add new product to the list
      products.value.unshift(response.data)

      return { success: true, data: response.data }
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la création du produit')
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  const updateProduct = async (id: number, productData: Partial<Product>) => {
    try {
      loading.value = true
      clearError()

      const response = await apiService.updateProduct(id, productData)

      // Update product in the list
      const index = products.value.findIndex(p => p.id === id)
      if (index !== -1) {
        products.value[index] = response.data
      }

      if (currentProduct.value?.id === id) {
        currentProduct.value = response.data
      }

      return { success: true, data: response.data }
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la mise à jour du produit')
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  const deleteProduct = async (id: number) => {
    try {
      loading.value = true
      clearError()

      await apiService.deleteProduct(id)

      // Remove product from the list
      products.value = products.value.filter(p => p.id !== id)

      if (currentProduct.value?.id === id) {
        currentProduct.value = null
      }

      return { success: true }
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la suppression du produit')
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  return {
    // State
    products,
    currentProduct,
    loading,
    error,
    filters,
    pagination,

    // Getters
    filteredProducts,
    categories,
    merchants,

    // Actions
    fetchProducts,
    fetchProduct,
    createProduct,
    updateProduct,
    deleteProduct,
    setFilters,
    clearFilters,
    setError,
    clearError
  }
})