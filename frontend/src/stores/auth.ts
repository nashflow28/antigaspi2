import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, LoginCredentials, RegisterData } from '@/types'
import { apiService } from '@/services/api'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(localStorage.getItem('auth_token'))
  const loading = ref(false)
  const error = ref<string | null>(null)

  const isAuthenticated = computed(() => !!token.value && !!user.value)
  const isConsumer = computed(() => user.value?.role === 'consumer')
  const isMerchant = computed(() => user.value?.role === 'merchant')
  const isAdmin = computed(() => user.value?.role === 'admin')

  const setError = (message: string) => {
    error.value = message
    setTimeout(() => {
      error.value = null
    }, 5000)
  }

  const clearError = () => {
    error.value = null
  }

  const setAuth = (authToken: string, userData: User) => {
    token.value = authToken
    user.value = userData
    localStorage.setItem('auth_token', authToken)
  }

  const clearAuth = () => {
    token.value = null
    user.value = null
    localStorage.removeItem('auth_token')
  }

  const login = async (credentials: LoginCredentials) => {
    try {
      loading.value = true
      clearError()

      const response = await apiService.login(credentials)

      setAuth(response.data.token, response.data.user)

      return { success: true }
    } catch (err: any) {
      setError(err.message || 'Erreur de connexion')
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  const register = async (data: RegisterData) => {
    try {
      loading.value = true
      clearError()

      const response = await apiService.register(data)

      setAuth(response.data.token, response.data.user)

      return { success: true }
    } catch (err: any) {
      setError(err.message || 'Erreur d\'inscription')
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  const logout = async () => {
    try {
      loading.value = true

      if (token.value) {
        await apiService.logout()
      }
    } catch (err: any) {
      console.warn('Logout API call failed:', err.message)
    } finally {
      clearAuth()
      loading.value = false
    }
  }

  const getCurrentUser = async () => {
    if (!token.value) return

    try {
      loading.value = true
      const response = await apiService.getCurrentUser()
      user.value = response.data
    } catch (err: any) {
      console.error('Failed to get current user:', err.message)
      clearAuth()
    } finally {
      loading.value = false
    }
  }

  const initAuth = async () => {
    if (token.value && !user.value) {
      await getCurrentUser()
    }
  }

  return {
    // State
    user,
    token,
    loading,
    error,

    // Getters
    isAuthenticated,
    isConsumer,
    isMerchant,
    isAdmin,

    // Actions
    login,
    register,
    logout,
    getCurrentUser,
    initAuth,
    setError,
    clearError
  }
})