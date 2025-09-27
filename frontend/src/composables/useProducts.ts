import { ref } from 'vue'
import { apiService } from '@/services/api'
import type { Product } from '@/types'

const merchantProducts = ref<Product[]>([])
const loading = ref(false)

export const useProducts = () => {
  const loadMerchantProducts = async () => {
    loading.value = true
    try {
      const response = await apiService.getMerchantProducts()
      if (response.success && response.data) {
        merchantProducts.value = response.data
      }
    } catch (error) {
      console.error('Error loading merchant products:', error)
    } finally {
      loading.value = false
    }
  }

  return {
    merchantProducts,
    loading,
    loadMerchantProducts
  }
}
