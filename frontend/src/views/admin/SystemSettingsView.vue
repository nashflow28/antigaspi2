<template>
  <DashboardLayout
    :sidebar="sidebar"
    :header="header"
    class="bg-gradient-to-br from-surface-light via-surface-light to-primary-50 dark:from-surface-dark dark:via-surface-darker dark:to-primary-950"
  >
    <div class="mx-auto w-full max-w-5xl space-y-8 px-3 py-6 sm:px-6 sm:py-8">
      <DashboardHeader
        data-testid="settings-header"
        eyebrow="Administration"
        title="Paramètres Système"
        subtitle="Configurez les paramètres globaux de la plateforme"
      >
        <template #actions>
          <Button
            data-testid="settings-refresh"
            variant="secondary"
            size="lg"
            class="gap-2"
            :loading="loading"
            @click="fetchSettings"
          >
            <ArrowPathIcon class="h-5 w-5" />
            Actualiser
          </Button>
        </template>
      </DashboardHeader>

      <Card
        v-if="loading && !settingsData"
        variant="glass"
        class="p-8"
      >
        <div class="flex items-center justify-center">
          <div class="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600"></div>
          <span class="ml-3 text-neutral-600 dark:text-neutral-300">Chargement des paramètres...</span>
        </div>
      </Card>

      <form v-else @submit.prevent="saveSettings">
        <div class="space-y-6">
          <!-- General Settings -->
          <Card
            v-if="settingsData?.general"
            data-testid="settings-general"
            variant="glass"
            class="overflow-hidden"
          >
            <div class="border-b border-neutral-200 bg-white/50 px-6 py-4 dark:border-neutral-700 dark:bg-neutral-800/50">
              <h3 class="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
                Paramètres Généraux
              </h3>
              <p class="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                Informations de base de la plateforme
              </p>
            </div>
            <div class="space-y-4 p-6">
              <div
                v-for="setting in settingsData.general"
                :key="setting.key"
                class="grid grid-cols-1 gap-4 sm:grid-cols-2"
              >
                <div>
                  <label class="label-2025" :for="setting.key">
                    {{ formatLabel(setting.key) }}
                  </label>
                  <p class="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                    {{ setting.description }}
                  </p>
                </div>
                <div>
                  <input
                    :id="setting.key"
                    v-model="formData[setting.key]"
                    type="text"
                    class="input-2025"
                    :placeholder="setting.description"
                  />
                </div>
              </div>
            </div>
          </Card>

          <!-- Commission Settings -->
          <Card
            v-if="settingsData?.commission"
            data-testid="settings-commission"
            variant="glass"
            class="overflow-hidden"
          >
            <div class="border-b border-neutral-200 bg-white/50 px-6 py-4 dark:border-neutral-700 dark:bg-neutral-800/50">
              <h3 class="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
                Paramètres de Commission
              </h3>
              <p class="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                Configuration des commissions et devise
              </p>
            </div>
            <div class="space-y-4 p-6">
              <div
                v-for="setting in settingsData.commission"
                :key="setting.key"
                class="grid grid-cols-1 gap-4 sm:grid-cols-2"
              >
                <div>
                  <label class="label-2025" :for="setting.key">
                    {{ formatLabel(setting.key) }}
                  </label>
                  <p class="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                    {{ setting.description }}
                  </p>
                </div>
                <div>
                  <input
                    :id="setting.key"
                    v-model="formData[setting.key]"
                    :type="setting.type === 'decimal' ? 'number' : 'text'"
                    :step="setting.type === 'decimal' ? '0.1' : undefined"
                    class="input-2025"
                    :placeholder="setting.description"
                  />
                </div>
              </div>
            </div>
          </Card>

          <!-- Reservation Settings -->
          <Card
            v-if="settingsData?.reservation"
            data-testid="settings-reservation"
            variant="glass"
            class="overflow-hidden"
          >
            <div class="border-b border-neutral-200 bg-white/50 px-6 py-4 dark:border-neutral-700 dark:bg-neutral-800/50">
              <h3 class="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
                Paramètres de Réservation
              </h3>
              <p class="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                Gestion des délais et annulations
              </p>
            </div>
            <div class="space-y-4 p-6">
              <div
                v-for="setting in settingsData.reservation"
                :key="setting.key"
                class="grid grid-cols-1 gap-4 sm:grid-cols-2"
              >
                <div>
                  <label class="label-2025" :for="setting.key">
                    {{ formatLabel(setting.key) }}
                  </label>
                  <p class="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                    {{ setting.description }}
                  </p>
                </div>
                <div>
                  <input
                    :id="setting.key"
                    v-model.number="formData[setting.key]"
                    type="number"
                    class="input-2025"
                    :placeholder="setting.description"
                  />
                </div>
              </div>
            </div>
          </Card>

          <!-- Notification Settings -->
          <Card
            v-if="settingsData?.notifications"
            data-testid="settings-notifications"
            variant="glass"
            class="overflow-hidden"
          >
            <div class="border-b border-neutral-200 bg-white/50 px-6 py-4 dark:border-neutral-700 dark:bg-neutral-800/50">
              <h3 class="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
                Paramètres de Notification
              </h3>
              <p class="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                Activation des canaux de notification
              </p>
            </div>
            <div class="space-y-4 p-6">
              <div
                v-for="setting in settingsData.notifications"
                :key="setting.key"
                class="flex items-center justify-between"
              >
                <div class="flex-1">
                  <label class="label-2025" :for="setting.key">
                    {{ formatLabel(setting.key) }}
                  </label>
                  <p class="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                    {{ setting.description }}
                  </p>
                </div>
                <div class="ml-4">
                  <label class="relative inline-flex cursor-pointer items-center">
                    <input
                      :id="setting.key"
                      v-model="formData[setting.key]"
                      type="checkbox"
                      class="peer sr-only"
                    />
                    <div class="peer h-6 w-11 rounded-full bg-neutral-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-neutral-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:border-neutral-600 dark:bg-neutral-700 dark:peer-focus:ring-primary-800"></div>
                  </label>
                </div>
              </div>
            </div>
          </Card>

          <!-- Maintenance Settings -->
          <Card
            v-if="settingsData?.maintenance"
            data-testid="settings-maintenance"
            variant="glass"
            class="overflow-hidden"
          >
            <div class="border-b border-neutral-200 bg-white/50 px-6 py-4 dark:border-neutral-700 dark:bg-neutral-800/50">
              <h3 class="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
                Paramètres de Maintenance
              </h3>
              <p class="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                Activation du mode maintenance
              </p>
            </div>
            <div class="space-y-4 p-6">
              <div
                v-for="setting in settingsData.maintenance"
                :key="setting.key"
              >
                <template v-if="setting.type === 'boolean'">
                  <div class="flex items-center justify-between">
                    <div class="flex-1">
                      <label class="label-2025" :for="setting.key">
                        {{ formatLabel(setting.key) }}
                      </label>
                      <p class="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                        {{ setting.description }}
                      </p>
                    </div>
                    <div class="ml-4">
                      <label class="relative inline-flex cursor-pointer items-center">
                        <input
                          :id="setting.key"
                          v-model="formData[setting.key]"
                          type="checkbox"
                          class="peer sr-only"
                        />
                        <div class="peer h-6 w-11 rounded-full bg-neutral-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-neutral-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:border-neutral-600 dark:bg-neutral-700 dark:peer-focus:ring-primary-800"></div>
                      </label>
                    </div>
                  </div>
                </template>
                <template v-else>
                  <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label class="label-2025" :for="setting.key">
                        {{ formatLabel(setting.key) }}
                      </label>
                      <p class="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                        {{ setting.description }}
                      </p>
                    </div>
                    <div>
                      <textarea
                        :id="setting.key"
                        v-model="formData[setting.key]"
                        rows="3"
                        class="input-2025"
                        :placeholder="setting.description"
                      ></textarea>
                    </div>
                  </div>
                </template>
              </div>
            </div>
          </Card>

          <!-- Limits Settings -->
          <Card
            v-if="settingsData?.limits"
            data-testid="settings-limits"
            variant="glass"
            class="overflow-hidden"
          >
            <div class="border-b border-neutral-200 bg-white/50 px-6 py-4 dark:border-neutral-700 dark:bg-neutral-800/50">
              <h3 class="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
                Limites Système
              </h3>
              <p class="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                Configuration des limites techniques
              </p>
            </div>
            <div class="space-y-4 p-6">
              <div
                v-for="setting in settingsData.limits"
                :key="setting.key"
                class="grid grid-cols-1 gap-4 sm:grid-cols-2"
              >
                <div>
                  <label class="label-2025" :for="setting.key">
                    {{ formatLabel(setting.key) }}
                  </label>
                  <p class="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                    {{ setting.description }}
                  </p>
                </div>
                <div>
                  <input
                    :id="setting.key"
                    v-model.number="formData[setting.key]"
                    type="number"
                    class="input-2025"
                    :placeholder="setting.description"
                  />
                </div>
              </div>
            </div>
          </Card>

          <!-- Save Button -->
          <Card variant="glass" class="sticky bottom-6 p-4">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                  Enregistrer les modifications
                </p>
                <p class="text-xs text-neutral-500 dark:text-neutral-400">
                  Les paramètres seront appliqués immédiatement
                </p>
              </div>
              <div class="flex gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  size="lg"
                  :disabled="loading || saving"
                  @click="fetchSettings"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  :loading="saving"
                  :disabled="loading"
                  class="gap-2"
                >
                  <CheckIcon class="h-5 w-5" />
                  Enregistrer
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </form>
    </div>

    <!-- Notifications -->
    <div class="fixed top-4 right-4 z-[110] space-y-3">
      <NotificationToast
        v-for="notification in notifications"
        :key="notification.id"
        :type="notification.type"
        :title="notification.title"
        :message="notification.message"
        @close="removeNotification(notification.id)"
      />
    </div>
  </DashboardLayout>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ArrowPathIcon, CheckIcon } from '@heroicons/vue/24/outline'
import apiService from '@/services/api'
import NotificationToast from '@/components/ui/NotificationToast.vue'
import DashboardLayout from '@/components/ui/DashboardLayout.vue'
import { Button, Card } from '@/components/ui/2025'
import { DashboardHeader } from '@/components/ui/dashboard'

// Types
interface Setting {
  key: string
  value: any
  type: string
  description: string
}

interface SettingsData {
  general?: Setting[]
  commission?: Setting[]
  reservation?: Setting[]
  notifications?: Setting[]
  maintenance?: Setting[]
  limits?: Setting[]
}

interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
}

// State
const loading = ref(false)
const saving = ref(false)
const settingsData = ref<SettingsData | null>(null)
const formData = reactive<Record<string, any>>({})
const notifications = ref<Notification[]>([])

// Sidebar and Header config
const sidebar = {
  title: 'Antigaspi Admin',
  items: []
}

const header = {
  title: 'Paramètres Système',
  user: null
}

// Methods
const fetchSettings = async () => {
  loading.value = true
  try {
    const response = await apiService.get<{
      success: boolean
      data: SettingsData
    }>('/admin/settings')

    if (response.success) {
      settingsData.value = response.data

      // Populate form data
      Object.keys(response.data).forEach(group => {
        const groupSettings = response.data[group as keyof SettingsData]
        if (groupSettings) {
          groupSettings.forEach((setting: Setting) => {
            formData[setting.key] = setting.value
          })
        }
      })

      addNotification({
        type: 'success',
        title: 'Paramètres chargés',
        message: 'Les paramètres ont été chargés avec succès'
      })
    }
  } catch (error: any) {
    console.error('Error fetching settings:', error)
    addNotification({
      type: 'error',
      title: 'Erreur',
      message: error.response?.data?.message || 'Impossible de charger les paramètres'
    })
  } finally {
    loading.value = false
  }
}

const saveSettings = async () => {
  saving.value = true
  try {
    const response = await apiService.put<{
      success: boolean
      message: string
      updated: string[]
      failed: string[]
    }>('/admin/settings', {
      settings: formData
    })

    if (response.success) {
      const updatedCount = response.updated.length
      const failedCount = response.failed.length

      if (updatedCount > 0) {
        addNotification({
          type: 'success',
          title: 'Paramètres enregistrés',
          message: `${updatedCount} paramètre(s) mis à jour avec succès${failedCount > 0 ? `. ${failedCount} échec(s).` : ''}`
        })
      }

      if (failedCount > 0 && updatedCount === 0) {
        addNotification({
          type: 'warning',
          title: 'Aucune mise à jour',
          message: `${failedCount} paramètre(s) non trouvé(s)`
        })
      }

      // Refresh settings
      await fetchSettings()
    }
  } catch (error: any) {
    console.error('Error saving settings:', error)
    addNotification({
      type: 'error',
      title: 'Erreur',
      message: error.response?.data?.message || 'Impossible de sauvegarder les paramètres'
    })
  } finally {
    saving.value = false
  }
}

const formatLabel = (key: string): string => {
  return key
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

const addNotification = (notification: Omit<Notification, 'id'>) => {
  const id = `notif-${Date.now()}-${Math.random()}`
  notifications.value.push({ ...notification, id })

  setTimeout(() => {
    removeNotification(id)
  }, 5000)
}

const removeNotification = (id: string) => {
  const index = notifications.value.findIndex(n => n.id === id)
  if (index !== -1) {
    notifications.value.splice(index, 1)
  }
}

// Lifecycle
onMounted(() => {
  fetchSettings()
})
</script>
