import { ref, computed } from 'vue'
import { surpriseBasketService, type SurpriseBasket, type CreateSurpriseBasketData, type UpdateSurpriseBasketData, type SurpriseBasketFilters } from '@/services/surpriseBasketService'
import { notify } from './useNotifications'

interface PaginationInfo {
  currentPage: number
  lastPage: number
  perPage: number
  total: number
}

const surpriseBaskets = ref<SurpriseBasket[]>([])
const merchantBaskets = ref<SurpriseBasket[]>([])
const currentBasket = ref<SurpriseBasket | null>(null)
const loading = ref(false)
const creating = ref(false)
const updating = ref(false)
const deleting = ref(false)
const pagination = ref<PaginationInfo>({
  currentPage: 1,
  lastPage: 1,
  perPage: 12,
  total: 0
})

export const useSurpriseBaskets = () => {

  /**
   * Load surprise baskets with filters
   */
  const loadSurpriseBaskets = async (filters: SurpriseBasketFilters = {}) => {
    loading.value = true
    try {
      const response = await surpriseBasketService.getAll(filters)

      if (response.data.success) {
        surpriseBaskets.value = response.data.data.data
        pagination.value = {
          currentPage: response.data.data.current_page,
          lastPage: response.data.data.last_page,
          perPage: response.data.data.per_page,
          total: response.data.data.total
        }
      } else {
        notify.error('Erreur lors du chargement des paniers surprise')
      }
    } catch (error) {
      console.error('Error loading surprise baskets:', error)
      notify.error('Erreur lors du chargement des paniers surprise')
    } finally {
      loading.value = false
    }
  }

  /**
   * Load merchant's surprise baskets
   */
  const loadMerchantBaskets = async () => {
    loading.value = true
    try {
      const response = await surpriseBasketService.getMerchantBaskets()

      if (response.data.success) {
        merchantBaskets.value = response.data.data.data
      } else {
        notify.error('Erreur lors du chargement de vos paniers surprise')
      }
    } catch (error) {
      console.error('Error loading merchant baskets:', error)
      notify.error('Erreur lors du chargement de vos paniers surprise')
    } finally {
      loading.value = false
    }
  }

  /**
   * Load a specific surprise basket
   */
  const loadBasket = async (id: number) => {
    loading.value = true
    try {
      const response = await surpriseBasketService.getById(id)

      if (response.data.success) {
        currentBasket.value = response.data.data
        return response.data.data
      } else {
        notify.error('Panier surprise non trouvé')
        return null
      }
    } catch (error) {
      console.error('Error loading surprise basket:', error)
      notify.error('Erreur lors du chargement du panier surprise')
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * Create a new surprise basket
   */
  const createBasket = async (data: CreateSurpriseBasketData) => {
    creating.value = true
    try {
      const response = await surpriseBasketService.create(data)

      if (response.data.success) {
        notify.success('Panier surprise créé avec succès')

        // Add to merchant baskets if we're viewing them
        if (merchantBaskets.value.length > 0) {
          merchantBaskets.value.unshift(response.data.data)
        }

        return response.data.data
      } else {
        notify.error('Erreur lors de la création du panier surprise')
        return null
      }
    } catch (error: any) {
      console.error('Error creating surprise basket:', error)

      if (error.response?.data?.errors) {
        const errors = Object.values(error.response.data.errors).flat()
        notify.error(errors[0] as string)
      } else {
        notify.error('Erreur lors de la création du panier surprise')
      }

      return null
    } finally {
      creating.value = false
    }
  }

  /**
   * Update a surprise basket
   */
  const updateBasket = async (id: number, data: UpdateSurpriseBasketData) => {
    updating.value = true
    try {
      const response = await surpriseBasketService.update(id, data)

      if (response.data.success) {
        notify.success('Panier surprise mis à jour avec succès')

        // Update in current basket
        if (currentBasket.value && currentBasket.value.id === id) {
          currentBasket.value = response.data.data
        }

        // Update in merchant baskets
        const index = merchantBaskets.value.findIndex(basket => basket.id === id)
        if (index !== -1) {
          merchantBaskets.value[index] = response.data.data
        }

        // Update in surprise baskets
        const publicIndex = surpriseBaskets.value.findIndex(basket => basket.id === id)
        if (publicIndex !== -1) {
          surpriseBaskets.value[publicIndex] = response.data.data
        }

        return response.data.data
      } else {
        notify.error('Erreur lors de la mise à jour du panier surprise')
        return null
      }
    } catch (error: any) {
      console.error('Error updating surprise basket:', error)

      if (error.response?.data?.errors) {
        const errors = Object.values(error.response.data.errors).flat()
        notify.error(errors[0] as string)
      } else {
        notify.error('Erreur lors de la mise à jour du panier surprise')
      }

      return null
    } finally {
      updating.value = false
    }
  }

  /**
   * Delete a surprise basket
   */
  const deleteBasket = async (id: number) => {
    deleting.value = true
    try {
      const response = await surpriseBasketService.delete(id)

      if (response.data.success) {
        notify.success('Panier surprise supprimé avec succès')

        // Remove from merchant baskets
        merchantBaskets.value = merchantBaskets.value.filter(basket => basket.id !== id)

        // Remove from surprise baskets
        surpriseBaskets.value = surpriseBaskets.value.filter(basket => basket.id !== id)

        // Clear current basket if it was deleted
        if (currentBasket.value && currentBasket.value.id === id) {
          currentBasket.value = null
        }

        return true
      } else {
        notify.error('Erreur lors de la suppression du panier surprise')
        return false
      }
    } catch (error) {
      console.error('Error deleting surprise basket:', error)
      notify.error('Erreur lors de la suppression du panier surprise')
      return false
    } finally {
      deleting.value = false
    }
  }

  /**
   * Add product to surprise basket
   */
  const addProductToBasket = async (basketId: number, productId: number, quantity: number = 1) => {
    try {
      const response = await surpriseBasketService.addProduct(basketId, productId, quantity)

      if (response.data.success) {
        notify.success('Produit ajouté au panier surprise')

        // Update current basket
        if (currentBasket.value && currentBasket.value.id === basketId) {
          currentBasket.value = response.data.data
        }

        // Update in merchant baskets
        const index = merchantBaskets.value.findIndex(basket => basket.id === basketId)
        if (index !== -1) {
          merchantBaskets.value[index] = response.data.data
        }

        return true
      } else {
        notify.error('Erreur lors de l\'ajout du produit')
        return false
      }
    } catch (error) {
      console.error('Error adding product to basket:', error)
      notify.error('Erreur lors de l\'ajout du produit')
      return false
    }
  }

  /**
   * Remove product from surprise basket
   */
  const removeProductFromBasket = async (basketId: number, productId: number) => {
    try {
      const response = await surpriseBasketService.removeProduct(basketId, productId)

      if (response.data.success) {
        notify.success('Produit retiré du panier surprise')

        // Update current basket
        if (currentBasket.value && currentBasket.value.id === basketId) {
          currentBasket.value = response.data.data
        }

        // Update in merchant baskets
        const index = merchantBaskets.value.findIndex(basket => basket.id === basketId)
        if (index !== -1) {
          merchantBaskets.value[index] = response.data.data
        }

        return true
      } else {
        notify.error('Erreur lors de la suppression du produit')
        return false
      }
    } catch (error) {
      console.error('Error removing product from basket:', error)
      notify.error('Erreur lors de la suppression du produit')
      return false
    }
  }

  /**
   * Clear current basket
   */
  const clearCurrentBasket = () => {
    currentBasket.value = null
  }

  /**
   * Get basket by ID from current lists
   */
  const getBasketById = (id: number): SurpriseBasket | null => {
    return merchantBaskets.value.find(basket => basket.id === id) ||
           surpriseBaskets.value.find(basket => basket.id === id) ||
           null
  }

  // Computed properties
  const hasBaskets = computed(() => surpriseBaskets.value.length > 0)
  const hasMerchantBaskets = computed(() => merchantBaskets.value.length > 0)
  const totalBaskets = computed(() => pagination.value.total)

  // Statistics
  const basketStats = computed(() => {
    if (merchantBaskets.value.length === 0) {
      return {
        total: 0,
        active: 0,
        inactive: 0,
        totalRevenue: 0,
        totalSavings: 0
      }
    }

    const active = merchantBaskets.value.filter(basket => basket.is_active).length
    const totalRevenue = merchantBaskets.value.reduce((sum, basket) => sum + (basket.discounted_price * basket.quantity_available), 0)
    const totalSavings = merchantBaskets.value.reduce((sum, basket) => sum + basket.basket_savings, 0)

    return {
      total: merchantBaskets.value.length,
      active,
      inactive: merchantBaskets.value.length - active,
      totalRevenue,
      totalSavings
    }
  })

  return {
    // State
    surpriseBaskets,
    merchantBaskets,
    currentBasket,
    pagination,

    // Loading states
    loading,
    creating,
    updating,
    deleting,

    // Computed
    hasBaskets,
    hasMerchantBaskets,
    totalBaskets,
    basketStats,

    // Actions
    loadSurpriseBaskets,
    loadMerchantBaskets,
    loadBasket,
    createBasket,
    updateBasket,
    deleteBasket,
    addProductToBasket,
    removeProductFromBasket,
    clearCurrentBasket,
    getBasketById
  }
}