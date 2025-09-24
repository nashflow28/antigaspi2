import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { usePreferredDark } from '@vueuse/core'

type ThemePreference = 'light' | 'dark' | null

export const useThemeStore = defineStore('theme', () => {
  const preferredDark = usePreferredDark()
  const isDarkInternal = ref(false)
  const hasHydrated = ref(false)
  const userPreference = ref<ThemePreference>(null)

  const applyTheme = (value: boolean) => {
    if (typeof document === 'undefined') {
      return
    }

    document.documentElement.classList.toggle('dark', value)
  }

  const setTheme = (value: boolean) => {
    isDarkInternal.value = value
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', value ? 'dark' : 'light')
      userPreference.value = value ? 'dark' : 'light'
    }

    applyTheme(value)
  }

  const setFromSystem = (value: boolean) => {
    isDarkInternal.value = value
    if (typeof window !== 'undefined') {
      userPreference.value = null
    }

    applyTheme(value)
  }

  const toggleTheme = () => {
    setTheme(!isDarkInternal.value)
  }

  const hydrate = () => {
    if (hasHydrated.value || typeof window === 'undefined') {
      return
    }

    const savedPreference = localStorage.getItem('theme')
    if (savedPreference === 'dark' || savedPreference === 'light') {
      setTheme(savedPreference === 'dark')
    } else {
      setFromSystem(preferredDark.value)
    }

    hasHydrated.value = true
  }

  const clearPreference = () => {
    if (typeof window === 'undefined') {
      return
    }

    localStorage.removeItem('theme')
    userPreference.value = null
    setFromSystem(preferredDark.value)
  }

  watch(
    preferredDark,
    (value) => {
      if (typeof window === 'undefined') {
        return
      }

      if (!hasHydrated.value) {
        return
      }

      if (!userPreference.value) {
        setFromSystem(value)
      }
    },
    { immediate: false },
  )

  const isDark = computed(() => isDarkInternal.value)

  return {
    isDark,
    toggleTheme,
    setTheme,
    hydrate,
    clearPreference,
    hasHydrated,
  }
})
