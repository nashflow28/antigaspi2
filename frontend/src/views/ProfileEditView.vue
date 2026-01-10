<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 px-4 py-10 sm:px-6 lg:px-8">
    <div class="mx-auto flex max-w-5xl flex-col gap-6">
      <div class="flex flex-col gap-2">
        <Button
          variant="ghost"
          size="sm"
          class="w-fit -ml-2"
          tag="router-link"
          to="/profile"
          :left-icon="ArrowLeft"
        >
          Retour à mon profil
        </Button>
        <h1 class="text-3xl font-semibold text-neutral-900">Modifier mon profil</h1>
        <p class="max-w-2xl text-sm text-neutral-600">
          Mettez à jour vos informations personnelles pour synchroniser vos préférences sur tous vos appareils Antigaspi.
        </p>
      </div>

      <Card variant="elevated" class="overflow-hidden">
        <div class="bg-gradient-to-r from-blue-600/90 to-indigo-600/90 px-6 py-8 text-white sm:px-8 sm:py-10">
          <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p class="text-xs font-semibold uppercase tracking-wide text-blue-100">Informations du compte</p>
              <h2 class="mt-2 text-2xl font-semibold">Profil personnel</h2>
              <p class="mt-2 text-sm text-blue-100/90">
                Ajoutez un maximum d'informations pour recevoir des recommandations personnalisées et faciliter vos réservations.
              </p>
            </div>
            <div class="flex flex-col items-center gap-3">
              <div class="relative">
                <div class="flex h-28 w-28 items-center justify-center overflow-hidden rounded-[2rem] bg-gradient-to-br from-blue-200 via-white to-blue-500/80 shadow-2xl shadow-blue-900/20">
                  <img
                    v-if="hasAvatarImage"
                    :src="avatarImage"
                    :alt="`Avatar de ${profileForm.first_name}`"
                    class="h-full w-full object-cover"
                  >
                  <span v-else class="text-3xl font-semibold text-blue-700">{{ userInitials }}</span>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="xs"
                  class="absolute -bottom-3 left-1/2 -translate-x-1/2 rounded-full px-3"
                  :left-icon="Camera"
                  :loading="isUploadingPhoto"
                  :disabled="isUploadingPhoto"
                  @click="triggerFileDialog"
                >
                  Changer
                </Button>
              </div>
              <p class="text-xs text-blue-100/80">Formats acceptés : JPEG ou PNG - 5&nbsp;Mo max.</p>
            </div>
          </div>
        </div>

        <form class="px-6 pb-10 pt-8 sm:px-10 sm:pb-12 sm:pt-10" @submit.prevent="handleSubmit">
          <div class="grid gap-6 lg:grid-cols-2">
            <Input
              v-model="profileForm.first_name"
              label="Prénom"
              placeholder="Prénom"
              autocomplete="given-name"
              required
              :error="formErrors.first_name"
            />
            <Input
              v-model="profileForm.last_name"
              label="Nom"
              placeholder="Nom"
              autocomplete="family-name"
              required
              :error="formErrors.last_name"
            />
            <Input
              v-model="profileForm.email"
              type="email"
              label="Adresse e-mail"
              placeholder="vous@example.com"
              autocomplete="email"
              required
              :error="formErrors.email"
            />
            <Input
              v-model="profileForm.phone"
              label="Téléphone"
              placeholder="+228 00 00 00 00"
              autocomplete="tel"
              :error="formErrors.phone"
            />
            <Input
              v-model="profileForm.address"
              label="Adresse"
              placeholder="Adresse complète"
              autocomplete="street-address"
              :error="formErrors.address"
            />
            <Input
              v-model="profileForm.city"
              label="Ville"
              placeholder="Ville principale"
              autocomplete="address-level2"
              :error="formErrors.city"
            />
          </div>

          <div class="mt-8 grid gap-6 lg:grid-cols-[2fr_1fr]">
            <div class="space-y-4 rounded-2xl bg-blue-50/70 p-5 text-sm text-blue-900">
              <div class="flex items-start gap-3">
                <CheckCircle2 class="mt-1 h-5 w-5 text-blue-600" aria-hidden="true" />
                <p>
                  Ces informations seront utilisées pour préremplir vos réservations, personnaliser vos alertes et vous proposer des paniers adaptés.
                </p>
              </div>
              <div class="flex items-start gap-3">
                <Mail class="mt-1 h-5 w-5 text-blue-600" aria-hidden="true" />
                <p>Mise à jour instantanée sur tous vos appareils connectés.</p>
              </div>
            </div>

            <div class="space-y-2 rounded-2xl border border-blue-100 bg-white p-5 text-sm text-neutral-600">
              <p class="font-medium text-neutral-900">Dernières synchronisations</p>
              <p class="flex items-center gap-2">
                <CalendarClock class="h-4 w-4 text-blue-500" aria-hidden="true" />
                Dernière mise à jour :
                <span class="font-semibold text-neutral-900">{{ lastUpdatedLabel }}</span>
              </p>
              <p class="flex items-center gap-2">
                <ShieldCheck class="h-4 w-4 text-blue-500" aria-hidden="true" />
                Données sécurisées et chiffrées
              </p>
            </div>
          </div>

          <div class="mt-10 flex flex-col gap-3 border-t border-neutral-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p class="text-xs text-neutral-500">
              Besoin de gérer vos préférences de communication ?
              <RouterLink class="font-medium text-blue-600 hover:underline" to="/notifications/settings">
                Rendez-vous sur la page notifications
              </RouterLink>
            </p>
            <div class="flex flex-col gap-3 sm:flex-row">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                :disabled="isSaving"
                @click="resetForm"
              >
                Réinitialiser
              </Button>
              <Button type="submit" size="md" :loading="isSaving">
                Enregistrer les modifications
              </Button>
            </div>
          </div>
        </form>
      </Card>
    </div>

    <input
      ref="fileInputRef"
      type="file"
      class="hidden"
      accept="image/png,image/jpeg"
      @change="handleAvatarChange"
    >
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { ArrowLeft, CalendarClock, Camera, CheckCircle2, Mail, ShieldCheck } from 'lucide-vue-next'
import Button from '@/components/ui/2025/Button.vue'
import Card from '@/components/ui/2025/Card.vue'
import Input from '@/components/ui/2025/Input.vue'
import { useAuthStore } from '@/stores/auth'
import { notify } from '@/composables/useNotifications'
import { updateConsumerProfile, uploadConsumerPhoto, type ConsumerProfileUpdatePayload } from '@/services/profileService'

const authStore = useAuthStore()
const user = computed(() => authStore.user)

interface ProfileFormState {
  first_name: string
  last_name: string
  email: string
  phone: string
  address: string
  city: string
}

const profileForm = reactive<ProfileFormState>({
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  address: '',
  city: ''
})

const initialState = reactive<ProfileFormState>({ ...profileForm })
const formErrors = reactive<Record<string, string>>({})
const isSaving = ref(false)
const isUploadingPhoto = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)
const avatarPreview = ref<string | null>(null)

const cleanupPreview = () => {
  if (avatarPreview.value) {
    URL.revokeObjectURL(avatarPreview.value)
    avatarPreview.value = null
  }
}

onBeforeUnmount(() => {
  cleanupPreview()
})

watch(user, (value) => {
  if (!value) return

  profileForm.first_name = value.first_name ?? ''
  profileForm.last_name = value.last_name ?? ''
  profileForm.email = value.email ?? ''
  profileForm.phone = value.phone ?? ''
  profileForm.address = value.address ?? ''
  profileForm.city = value.city ?? ''

  initialState.first_name = profileForm.first_name
  initialState.last_name = profileForm.last_name
  initialState.email = profileForm.email
  initialState.phone = profileForm.phone
  initialState.address = profileForm.address
  initialState.city = profileForm.city
}, { immediate: true })

const hasAvatarImage = computed(() => Boolean(avatarPreview.value || user.value?.photo_url))
const avatarImage = computed(() => avatarPreview.value || user.value?.photo_url || '')
const userInitials = computed(() => {
  if (!user.value) return 'AU'
  const firstInitial = user.value.first_name?.charAt(0) ?? ''
  const lastInitial = user.value.last_name?.charAt(0) ?? ''
  return `${firstInitial}${lastInitial}`.toUpperCase() || 'AU'
})

const lastUpdatedLabel = computed(() => {
  if (!user.value?.updated_at) {
    return 'jamais'
  }

  return new Date(user.value.updated_at).toLocaleString('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short'
  })
})

const clearErrors = () => {
  Object.keys(formErrors).forEach((key) => {
    delete formErrors[key]
  })
}

const validateForm = () => {
  clearErrors()

  if (!profileForm.first_name.trim()) {
    formErrors.first_name = 'Le prénom est requis.'
  }

  if (!profileForm.last_name.trim()) {
    formErrors.last_name = 'Le nom est requis.'
  }

  if (!profileForm.email.trim()) {
    formErrors.email = "L'adresse e-mail est requise."
  } else {
    const emailRegex = /[^@\s]+@[^@\s]+\.[^@\s]+/
    if (!emailRegex.test(profileForm.email.trim())) {
      formErrors.email = 'Adresse e-mail invalide.'
    }
  }

  return Object.keys(formErrors).length === 0
}

const buildPayload = (): ConsumerProfileUpdatePayload => ({
  first_name: profileForm.first_name.trim(),
  last_name: profileForm.last_name.trim(),
  email: profileForm.email.trim(),
  phone: profileForm.phone.trim() ? profileForm.phone.trim() : null,
  address: profileForm.address.trim() ? profileForm.address.trim() : null,
  city: profileForm.city.trim() ? profileForm.city.trim() : null
})

const resetForm = () => {
  profileForm.first_name = initialState.first_name
  profileForm.last_name = initialState.last_name
  profileForm.email = initialState.email
  profileForm.phone = initialState.phone
  profileForm.address = initialState.address
  profileForm.city = initialState.city
  clearErrors()
}

const handleSubmit = async () => {
  if (isSaving.value) return

  if (!validateForm()) {
    notify.error('Merci de corriger les champs mis en évidence.', 'Profil')
    return
  }

  isSaving.value = true

  try {
    const response = await updateConsumerProfile(buildPayload())
    authStore.updateStoredUser({
      first_name: response.data.first_name,
      last_name: response.data.last_name,
      email: response.data.email,
      phone: response.data.phone ?? undefined,
      address: response.data.address ?? undefined,
      city: response.data.city ?? undefined,
      photo_url: response.data.photo_url ?? user.value?.photo_url ?? null,
      updated_at: response.data.updated_at
    })

    initialState.first_name = response.data.first_name
    initialState.last_name = response.data.last_name
    initialState.email = response.data.email
    initialState.phone = response.data.phone ?? ''
    initialState.address = response.data.address ?? ''
    initialState.city = response.data.city ?? ''

    notify.success('Profil mis à jour avec succès.', 'Profil')
  } catch (error: any) {
    const validationErrors = error?.response?.data?.errors

    if (validationErrors && typeof validationErrors === 'object') {
      clearErrors()
      Object.entries(validationErrors).forEach(([field, messages]) => {
        const message = Array.isArray(messages) ? messages[0] : messages
        if (typeof message === 'string') {
          formErrors[field] = message
        }
      })
      notify.error('Veuillez corriger les erreurs signalées.', 'Profil')
    } else {
      notify.error(error?.message || 'Erreur lors de la mise à jour du profil.', 'Profil')
    }
  } finally {
    isSaving.value = false
  }
}

const triggerFileDialog = () => {
  fileInputRef.value?.click()
}

const handleAvatarChange = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (!file) {
    return
  }

  if (!['image/png', 'image/jpeg'].includes(file.type)) {
    notify.error('Format de fichier non pris en charge. Utilisez un JPEG ou PNG.', 'Photo de profil')
    target.value = ''
    return
  }

  if (file.size > 5 * 1024 * 1024) {
    notify.error('La photo ne peut pas dépasser 5 Mo.', 'Photo de profil')
    target.value = ''
    return
  }

  cleanupPreview()
  avatarPreview.value = URL.createObjectURL(file)
  isUploadingPhoto.value = true

  try {
    const response = await uploadConsumerPhoto(file)
    const newPhotoUrl = response.data.full_url || response.data.photo_url || null
    authStore.updateStoredUser({ photo_url: newPhotoUrl })
    notify.success('Votre photo de profil a été mise à jour.', 'Photo de profil')
  } catch (error: any) {
    notify.error(error?.message || "Échec de l'upload de la photo.", 'Photo de profil')
  } finally {
    isUploadingPhoto.value = false
    target.value = ''
    cleanupPreview()
  }
}
</script>
