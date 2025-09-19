import { describe, it, expect, beforeEach, vi } from 'vitest'
import { shallowMount, flushPromises } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'

import ProfileView from '@/views/ProfileView.vue'
import { useAuthStore } from '@/stores/auth'

const apiServiceMock = vi.hoisted(() => ({
  updateProfile: vi.fn(),
  updatePassword: vi.fn(),
  updatePreferences: vi.fn(),
  getUserStats: vi.fn()
}))

vi.mock('@/services/api', () => ({
  apiService: apiServiceMock
}))

const baseUser = {
  id: 1,
  first_name: 'Jean',
  last_name: 'Dupont',
  email: 'jean.dupont@example.com',
  role: 'consumer' as const,
  city: 'Paris',
  phone: '0102030405',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-02T00:00:00Z',
  preferences: {
    email_notifications: true,
    product_notifications: true,
    max_distance: 15
  }
}

const baseStats = {
  total_reservations: 12,
  pending_reservations: 2,
  confirmed_reservations: 5,
  completed_reservations: 8,
  cancelled_reservations: 1,
  total_savings: 156.5,
  food_saved: 15.2,
  co2_saved: 38,
  this_month: {
    total_reservations: 3,
    completed_reservations: 2
  }
}

const mountComponent = () => {
  const pinia = createTestingPinia({
    initialState: {
      auth: {
        user: baseUser
      }
    },
    stubActions: false
  })

  return shallowMount(ProfileView, {
    global: {
      plugins: [pinia]
    }
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  apiServiceMock.updateProfile.mockResolvedValue({
    success: true,
    message: 'Profil mis à jour avec succès!',
    data: baseUser
  })
  apiServiceMock.updatePassword.mockResolvedValue({ success: true, data: null })
  apiServiceMock.updatePreferences.mockResolvedValue({ success: true, data: baseUser.preferences })
  apiServiceMock.getUserStats.mockResolvedValue({ success: true, data: baseStats })
})

describe('ProfileView', () => {
  it('met à jour le profil via le service API', async () => {
    const wrapper = mountComponent()
    const authStore = useAuthStore()
    const vm: any = wrapper.vm

    await flushPromises()

    vm.profileForm.first_name = 'Marie'
    apiServiceMock.updateProfile.mockResolvedValueOnce({
      success: true,
      message: 'Profil mis à jour avec succès!',
      data: {
        ...baseUser,
        first_name: 'Marie'
      }
    })

    await vm.updateProfile()
    await flushPromises()

    expect(apiServiceMock.updateProfile).toHaveBeenCalledWith(
      expect.objectContaining({ first_name: 'Marie' })
    )
    expect(authStore.user?.first_name).toBe('Marie')
    expect(vm.message).toBe('Profil mis à jour avec succès!')
  })

  it('charge les statistiques utilisateur réelles', async () => {
    const wrapper = mountComponent()
    const vm: any = wrapper.vm

    await flushPromises()

    expect(apiServiceMock.getUserStats).toHaveBeenCalledTimes(1)
    expect(vm.userStats.total_reservations).toBe(baseStats.total_reservations)
    expect(vm.userStats.total_savings).toBe(baseStats.total_savings)
    expect(vm.userStats.this_month.total_reservations).toBe(baseStats.this_month.total_reservations)
  })
})
