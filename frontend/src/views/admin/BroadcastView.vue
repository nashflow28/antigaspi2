<template>
  <DashboardLayout
    :sidebar="sidebar"
    :header="header"
    class="bg-gradient-to-br from-surface-light via-surface-light to-primary-50 dark:from-surface-dark dark:via-surface-darker dark:to-primary-950"
  >
    <div class="mx-auto w-full max-w-4xl space-y-6 px-3 py-6 sm:px-6 sm:py-8">
      <!-- Header -->
      <div class="flex items-start gap-4">
        <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-500 shadow-lg">
          <MegaphoneIcon class="h-7 w-7 text-white" />
        </div>
        <div class="flex-1">
          <h1 class="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">
            Notification Broadcast
          </h1>
          <p class="text-neutral-600 dark:text-neutral-300">
            Envoyer une notification à tous les utilisateurs ou à un groupe spécifique
          </p>
        </div>
      </div>

      <!-- Success Alert -->
      <Alert
        v-if="showSuccess"
        variant="success"
        data-testid="broadcast-success-alert"
        @dismiss="showSuccess = false"
      >
        <template #title>Notification envoyée</template>
        <template #description>
          {{ successMessage }}
        </template>
      </Alert>

      <!-- Form Card -->
      <Card class="p-6">
        <form class="space-y-6" @submit.prevent="handleSubmit">
          <!-- Title Input -->
          <div>
            <Label for="title" required>Titre de la notification</Label>
            <Input
              id="title"
              v-model="form.title"
              type="text"
              placeholder="Ex: Nouveaux produits disponibles"
              :maxlength="120"
              :error="errors.title"
              data-testid="broadcast-title-input"
            />
            <p class="mt-1 text-right text-sm text-neutral-500 dark:text-neutral-400">
              {{ form.title.length }}/120 caractères
            </p>
          </div>

          <!-- Message Textarea -->
          <div>
            <Label for="message" required>Message</Label>
            <Textarea
              id="message"
              v-model="form.message"
              placeholder="Rédigez votre message ici..."
              :maxlength="1000"
              :rows="6"
              :error="errors.message"
              data-testid="broadcast-message-input"
            />
            <p class="mt-1 text-right text-sm text-neutral-500 dark:text-neutral-400">
              {{ form.message.length }}/1000 caractères
            </p>
          </div>

          <!-- Channels Selection -->
          <div>
            <Label required>Canaux de notification</Label>
            <p class="mb-3 text-sm text-neutral-600 dark:text-neutral-300">
              Sélectionnez les canaux par lesquels envoyer la notification
            </p>
            <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div
                v-for="channel in channelOptions"
                :key="channel.value"
                class="cursor-pointer rounded-lg border-2 p-4 transition-all hover:shadow-md"
                :class="[
                  form.channels.includes(channel.value)
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-950'
                    : 'border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-800',
                ]"
                :data-testid="`channel-${channel.value}`"
                @click="toggleChannel(channel.value)"
              >
                <component
                  :is="channel.icon"
                  class="mx-auto h-6 w-6"
                  :class="[
                    form.channels.includes(channel.value)
                      ? 'text-primary-600 dark:text-primary-400'
                      : 'text-neutral-400 dark:text-neutral-500',
                  ]"
                />
                <p
                  class="mt-2 text-center text-sm font-medium"
                  :class="[
                    form.channels.includes(channel.value)
                      ? 'text-primary-700 dark:text-primary-300'
                      : 'text-neutral-600 dark:text-neutral-400',
                  ]"
                >
                  {{ channel.label }}
                </p>
              </div>
            </div>
            <p v-if="errors.channels" class="mt-1 text-sm text-error-600 dark:text-error-400">
              {{ errors.channels }}
            </p>
          </div>

          <!-- Roles Selection -->
          <div>
            <Label>Rôles cibles</Label>
            <p class="mb-3 text-sm text-neutral-600 dark:text-neutral-300">
              Laisser vide pour notifier tous les utilisateurs
            </p>
            <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div
                v-for="role in roleOptions"
                :key="role.value"
                class="cursor-pointer rounded-lg border-2 p-4 transition-all hover:shadow-md"
                :class="[
                  form.roles.includes(role.value)
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-950'
                    : 'border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-800',
                ]"
                :data-testid="`role-${role.value}`"
                @click="toggleRole(role.value)"
              >
                <component
                  :is="role.icon"
                  class="mx-auto h-6 w-6"
                  :class="[
                    form.roles.includes(role.value)
                      ? 'text-primary-600 dark:text-primary-400'
                      : 'text-neutral-400 dark:text-neutral-500',
                  ]"
                />
                <p
                  class="mt-2 text-center text-sm font-medium"
                  :class="[
                    form.roles.includes(role.value)
                      ? 'text-primary-700 dark:text-primary-300'
                      : 'text-neutral-600 dark:text-neutral-400',
                  ]"
                >
                  {{ role.label }}
                </p>
              </div>
            </div>
          </div>

          <!-- Action URL (Optional) -->
          <div>
            <Label for="action_url">URL d'action (optionnel)</Label>
            <Input
              id="action_url"
              v-model="form.action_url"
              type="url"
              placeholder="https://example.com/promo"
              :error="errors.action_url"
              data-testid="broadcast-action-url-input"
            />
            <p class="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              Lien vers lequel rediriger l'utilisateur
            </p>
          </div>

          <!-- Submit Button -->
          <div class="flex gap-3 pt-4">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              :loading="isLoading"
              :disabled="isLoading || !form.title.trim() || !form.message.trim() || form.channels.length === 0"
              class="flex-1"
              data-testid="broadcast-send-button"
            >
              <PaperAirplaneIcon class="h-5 w-5" />
              <span>Envoyer la notification</span>
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="lg"
              :disabled="isLoading"
              data-testid="broadcast-reset-button"
              @click="resetForm"
            >
              <XMarkIcon class="h-5 w-5" />
              <span>Réinitialiser</span>
            </Button>
          </div>
        </form>
      </Card>

      <!-- Info Card -->
      <Card variant="bordered" class="p-5">
        <div class="flex gap-3">
          <InformationCircleIcon class="h-6 w-6 flex-shrink-0 text-primary-600 dark:text-primary-400" />
          <div class="space-y-2 text-sm text-neutral-700 dark:text-neutral-300">
            <p class="font-semibold text-neutral-900 dark:text-neutral-50">
              Informations importantes
            </p>
            <ul class="list-inside list-disc space-y-1">
              <li>Les notifications sont envoyées immédiatement et ne peuvent pas être annulées</li>
              <li>Le canal "Base de données" est toujours inclus par défaut</li>
              <li>Les utilisateurs inactifs ne reçoivent pas les notifications</li>
              <li>L'envoi est limité à 500 utilisateurs par batch pour performance</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  </DashboardLayout>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import DashboardLayout from '@/layouts/DashboardLayout.vue'
import { Card } from '@/components/2025/Card'
import { Button } from '@/components/2025/Button'
import { Input } from '@/components/2025/Input'
import { Textarea } from '@/components/2025/Textarea'
import { Label } from '@/components/2025/Label'
import { Alert } from '@/components/2025/Alert'
import {
  MegaphoneIcon,
  ServerStackIcon,
  BellIcon,
  EnvelopeIcon,
  ChatBubbleLeftRightIcon,
  UserIcon,
  BuildingStorefrontIcon,
  ShieldCheckIcon,
  PaperAirplaneIcon,
  XMarkIcon,
  InformationCircleIcon
} from '@heroicons/vue/24/outline'
import api from '@/services/api'
import { notify } from '@/composables/useNotifications'
import { useSidebarAdmin } from '@/composables/useSidebarAdmin'
import { useHeader } from '@/composables/useHeader'

interface BroadcastResponse {
  data: {
    recipient_count: number
    channels: string[]
  }
}
const { sidebar } = useSidebarAdmin()
const { header } = useHeader('Broadcast Notifications')

// Form state
interface BroadcastForm {
  title: string
  message: string
  channels: string[]
  roles: string[]
  action_url: string
}

const form = ref<BroadcastForm>({
  title: '',
  message: '',
  channels: ['database', 'push'],
  roles: [],
  action_url: ''
})

const errors = ref<Partial<Record<keyof BroadcastForm, string>>>({})
const isLoading = ref(false)
const showSuccess = ref(false)
const successMessage = ref('')

// Channel options
const channelOptions = [
  { value: 'database', label: 'Base de données', icon: ServerStackIcon },
  { value: 'push', label: 'Push', icon: BellIcon },
  { value: 'mail', label: 'Email', icon: EnvelopeIcon },
  { value: 'sms', label: 'SMS', icon: ChatBubbleLeftRightIcon }
]

// Role options
const roleOptions = [
  { value: 'consumer', label: 'Consommateurs', icon: UserIcon },
  { value: 'merchant', label: 'Commerçants', icon: BuildingStorefrontIcon },
  { value: 'admin', label: 'Administrateurs', icon: ShieldCheckIcon }
]

// Toggle channel selection
const toggleChannel = (channel: string) => {
  const index = form.value.channels.indexOf(channel)
  if (index > -1) {
    form.value.channels.splice(index, 1)
  } else {
    form.value.channels.push(channel)
  }
  // Clear error
  if (errors.value.channels) {
    errors.value.channels = undefined
  }
}

// Toggle role selection
const toggleRole = (role: string) => {
  const index = form.value.roles.indexOf(role)
  if (index > -1) {
    form.value.roles.splice(index, 1)
  } else {
    form.value.roles.push(role)
  }
}

// Validate form
const validateForm = (): boolean => {
  const newErrors: Partial<Record<keyof BroadcastForm, string>> = {}

  if (!form.value.title.trim()) {
    newErrors.title = 'Le titre est requis'
  } else if (form.value.title.length > 120) {
    newErrors.title = 'Le titre ne doit pas dépasser 120 caractères'
  }

  if (!form.value.message.trim()) {
    newErrors.message = 'Le message est requis'
  } else if (form.value.message.length > 1000) {
    newErrors.message = 'Le message ne doit pas dépasser 1000 caractères'
  }

  if (form.value.channels.length === 0) {
    newErrors.channels = 'Sélectionnez au moins un canal'
  }

  if (form.value.action_url && !isValidUrl(form.value.action_url)) {
    newErrors.action_url = 'URL invalide'
  }

  errors.value = newErrors
  return Object.keys(newErrors).length === 0
}

// Check if URL is valid
const isValidUrl = (url: string): boolean => {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

// Handle form submission
const handleSubmit = async () => {
  if (!validateForm()) {
    return
  }

  // Confirmation dialog
  const targetRoles = form.value.roles.length > 0
    ? form.value.roles.map(r => roleOptions.find(o => o.value === r)?.label).join(', ')
    : 'Tous les utilisateurs'

  const channelsDisplay = form.value.channels
    .map(c => channelOptions.find(o => o.value === c)?.label)
    .join(', ')

  const confirmed = confirm(
    'Vous allez envoyer cette notification à:\n\n' +
    `Cibles: ${targetRoles}\n` +
    `Canaux: ${channelsDisplay}\n\n` +
    'Cette action ne peut pas être annulée.'
  )

  if (!confirmed) {
    return
  }

  try {
    isLoading.value = true

    const payload: any = {
      title: form.value.title.trim(),
      message: form.value.message.trim(),
      channels: form.value.channels
    }

    if (form.value.roles.length > 0) {
      payload.roles = form.value.roles
    }

    if (form.value.action_url.trim()) {
      payload.action_url = form.value.action_url.trim()
    }

    const response = await api.post<BroadcastResponse>('/admin/notifications/broadcast', payload)

    successMessage.value = `${response.data.recipient_count} utilisateur(s) ont été notifiés via ${response.data.channels.length} canal(aux).`
    showSuccess.value = true

    // Reset form
    resetForm()

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' })
  } catch (error: unknown) {
    console.error('Error sending broadcast:', error)
    const err = error as { response?: { data?: { message?: string } } }
    notify.error(
      err.response?.data?.message || 'Impossible d\'envoyer la notification',
      'Erreur'
    )
  } finally {
    isLoading.value = false
  }
}

// Reset form
const resetForm = () => {
  form.value = {
    title: '',
    message: '',
    channels: ['database', 'push'],
    roles: [],
    action_url: ''
  }
  errors.value = {}
}
</script>
