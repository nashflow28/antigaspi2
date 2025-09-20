import { ref } from 'vue'
import { apiService } from '@/services/api'
import type { Category } from '@/types'

const categories = ref<Category[]>([])
const loading = ref(false)

export const useCategories = () => {
  const loadCategories = async () => {
    if (categories.value.length > 0) {
      return // Already loaded
    }

    loading.value = true
    try {
      const response = await apiService.getCategories()
      if (response.success && response.data) {
        categories.value = response.data
      }
    } catch (error) {
      console.error('Error loading categories:', error)
    } finally {
      loading.value = false
    }
  }

  return {
    categories,
    loading,
    loadCategories
  }
}