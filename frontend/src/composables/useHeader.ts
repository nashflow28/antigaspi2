// Header composable for dashboard pages
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

export const useHeader = (title?: string) => {
  const authStore = useAuthStore()

  const header = computed(() => {
    const user = authStore.user

    return {
      title: title || 'Dashboard',
      user: user ? {
        name: [user.first_name, user.last_name].filter(Boolean).join(' ').trim() || user.email,
        email: user.email
      } : {
        name: 'Invité',
        email: 'contact@antigaspi.com'
      }
    }
  })

  return { header }
}

export default useHeader
