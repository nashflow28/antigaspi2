import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Product, ProductFilters } from '@/types'
import { apiService } from '@/services/api'
import { notify } from '@/composables/useNotifications'

export const useProductsStore = defineStore('products', () => {
  const products = ref<Product[]>([])
  const currentProduct = ref<Product | null>(null)
  const loading = ref(false)
  // error ref removed - using useNotifications composable
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

  // setError removed - using useNotifications composable

  // clearError removed - using useNotifications composable

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

      const filtersToUse = customFilters || filters.value
      const response = await apiService.getProducts(filtersToUse)

      products.value = response.data
      if (response.pagination) {
        pagination.value = response.pagination
      }

      return { success: true }
    } catch (err: any) {
      notify.error(err.message || 'Erreur lors du chargement des produits', 'Catalogue', {
        action: {
          label: 'Réessayer',
          callback: () => fetchProducts(customFilters)
        }
      })
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  const fetchProduct = async (id: number) => {
    try {
      loading.value = true

      const response = await apiService.getProduct(id)
      currentProduct.value = response.data

      return { success: true }
    } catch (err: any) {
      notify.error(err.message || 'Erreur lors du chargement du produit', 'Produit', {
        action: {
          label: 'Réessayer',
          callback: () => fetchProduct(id)
        }
      })
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  const createProduct = async (productData: Partial<Product>) => {
    try {
      loading.value = true

      const response = await apiService.createProduct(productData)

      // Add new product to the list
      products.value.unshift(response.data)
      notify.success('Produit créé avec succès', 'Catalogue', { duration: 3000 })

      return { success: true, data: response.data }
    } catch (err: any) {
      notify.error(err.message || 'Erreur lors de la création du produit', 'Catalogue', {
        action: {
          label: 'Réessayer',
          callback: () => createProduct(productData)
        }
      })
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  const updateProduct = async (id: number, productData: Partial<Product>) => {
    try {
      loading.value = true

      const response = await apiService.updateProduct(id, productData)

      // Update product in the list
      const index = products.value.findIndex(p => p.id === id)
      if (index !== -1) {
        products.value[index] = response.data
      }

      if (currentProduct.value?.id === id) {
        currentProduct.value = response.data
      }

      notify.success('Produit mis à jour avec succès', 'Catalogue', { duration: 3000 })
      return { success: true, data: response.data }
    } catch (err: any) {
      notify.error(err.message || 'Erreur lors de la mise à jour du produit', 'Catalogue', {
        action: {
          label: 'Réessayer',
          callback: () => updateProduct(id, productData)
        }
      })
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  const deleteProduct = async (id: number) => {
    try {
      loading.value = true

      await apiService.deleteProduct(id)

      // Remove product from the list
      products.value = products.value.filter(p => p.id !== id)

      if (currentProduct.value?.id === id) {
        currentProduct.value = null
      }

      notify.success('Produit supprimé avec succès', 'Catalogue', { duration: 3000 })
      return { success: true }
    } catch (err: any) {
      notify.error(err.message || 'Erreur lors de la suppression du produit', 'Catalogue', {
        action: {
          label: 'Réessayer',
          callback: () => deleteProduct(id)
        }
      })
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
    clearFilters
  }
})
