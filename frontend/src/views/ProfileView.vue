<template>
  <div class="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-primary-50 px-4 py-8 sm:px-6 lg:px-8">
    <div class="mx-auto flex max-w-6xl flex-col gap-6">
      <div class="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <!-- Profile form -->
        <Card variant="elevated" class="overflow-hidden">
          <div class="bg-gradient-to-r from-primary-600/90 to-indigo-600/90 px-6 py-8 text-white sm:px-8 sm:py-10">
            <p class="text-sm font-semibold uppercase tracking-wide text-primary-100">Espace personnel</p>
            <h1 class="mt-2 text-2xl font-semibold">Mon profil</h1>
            <p class="mt-2 max-w-2xl text-sm text-primary-100/90">
              Mettez à jour vos informations pour recevoir des recommandations personnalisées et faciliter vos prochaines réservations.
            </p>
          </div>

          <form class="space-y-10 px-6 pb-8 pt-6 sm:px-8 sm:pb-10 sm:pt-8" @submit.prevent="handleSubmit">
            <div class="flex flex-col gap-6 lg:flex-row">
              <div class="flex flex-col items-center gap-4 lg:w-48">
                <div class="relative">
                  <div
                    class="flex h-32 w-32 items-center justify-center overflow-hidden rounded-3xl bg-gradient-to-br from-primary-100 via-white to-primary-200 shadow-lg shadow-primary-500/10"
                  >
                    <img
                      v-if="hasAvatarImage"
                      :src="avatarImage"
                      :alt="`Avatar de ${profileForm.first_name}`"
                      class="h-full w-full object-cover"
                    >
                    <span
                      v-else
                      class="text-3xl font-semibold text-primary-600"
                    >
                      {{ userInitials }}
                    </span>
                  </div>

                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    class="absolute -bottom-3 left-1/2 -translate-x-1/2 rounded-full px-4"
                    :loading="isUploadingPhoto"
                    :disabled="isUploadingPhoto"
                    :left-icon="Camera"
                    @click="triggerFileDialog"
                  >
                    Changer
                  </Button>
                </div>

                <p class="text-center text-xs text-neutral-500">
                  Formats acceptés : JPEG, PNG (max. 5&nbsp;Mo)
                </p>
              </div>

              <div class="flex-1 space-y-6">
                <div class="grid gap-6 md:grid-cols-2">
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
                    help-text="Format recommandé : +228 12 34 56 78"
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

                <div class="flex flex-col gap-3 rounded-2xl bg-primary-50/60 p-4 text-sm text-primary-900 md:flex-row md:items-center md:justify-between">
                  <div class="flex items-center gap-3">
                    <CheckCircle2 class="h-5 w-5 text-primary-500" aria-hidden="true" />
                    <p class="font-medium">Ces informations nous aident à personnaliser vos alertes et vos paniers recommandés.</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    :right-icon="ArrowRight"
                    class="text-primary-700"
                    tag="router-link"
                    to="/notifications/inbox"
                  >
                    Gérer mes notifications
                  </Button>
                </div>
              </div>
            </div>

            <div class="flex flex-col gap-3 border-t border-neutral-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <p class="text-sm text-neutral-500">
                Dernière mise à jour :
                <span class="font-medium text-neutral-800">{{ lastUpdatedLabel }}</span>
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
                <Button
                  type="submit"
                  size="md"
                  :loading="isSaving"
                >
                  Enregistrer les modifications
                </Button>
              </div>
            </div>
          </form>
        </Card>

        <!-- Side column -->
        <div class="space-y-6">
          <Card variant="bordered" class="p-6">
            <h2 class="text-lg font-semibold text-neutral-900">Résumé du compte</h2>
            <p class="mt-1 text-sm text-neutral-500">
              Gardez un œil sur vos informations principales.
            </p>

            <ul class="mt-6 space-y-4 text-sm text-neutral-600">
              <li class="flex items-start gap-3">
                <span class="flex h-8 w-8 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                  <User class="h-4 w-4" aria-hidden="true" />
                </span>
                <div>
                  <p class="font-medium text-neutral-800">Identité complète</p>
                  <p>{{ profileForm.first_name }} {{ profileForm.last_name }}</p>
                </div>
              </li>
              <li class="flex items-start gap-3">
                <span class="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <Mail class="h-4 w-4" aria-hidden="true" />
                </span>
                <div>
                  <p class="font-medium text-neutral-800">Adresse e-mail</p>
                  <p>{{ profileForm.email }}</p>
                </div>
              </li>
              <li class="flex items-start gap-3">
                <span class="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <Phone class="h-4 w-4" aria-hidden="true" />
                </span>
                <div>
                  <p class="font-medium text-neutral-800">Téléphone</p>
                  <p>{{ profileForm.phone || 'Non renseigné' }}</p>
                </div>
              </li>
              <li class="flex items-start gap-3">
                <span class="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <MapPin class="h-4 w-4" aria-hidden="true" />
                </span>
                <div>
                  <p class="font-medium text-neutral-800">Ville</p>
                  <p>{{ profileForm.city || 'Non renseignée' }}</p>
                </div>
              </li>
              <li class="flex items-start gap-3">
                <span class="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                  <CalendarClock class="h-4 w-4" aria-hidden="true" />
                </span>
                <div>
                  <p class="font-medium text-neutral-800">Compte créé</p>
                  <p>{{ createdAtLabel }}</p>
                </div>
              </li>
            </ul>
          </Card>

          <Card class="p-6">
            <div class="flex items-start gap-3">
              <ShieldCheck class="h-6 w-6 text-primary-600" aria-hidden="true" />
              <div>
                <h3 class="text-base font-semibold text-neutral-900">Sécurité et confidentialité</h3>
                <p class="mt-1 text-sm text-neutral-500">
                  Vos données personnelles sont chiffrées et ne sont utilisées que pour améliorer votre expérience GÊLADAL.
                </p>
              </div>
            </div>

            <div class="mt-5 space-y-3 text-sm text-neutral-600">
              <p class="flex items-center gap-2">
                <CheckCircle2 class="h-4 w-4 text-emerald-500" aria-hidden="true" />
                Authentification sécurisée par jeton JWT
              </p>
              <p class="flex items-center gap-2">
                <CheckCircle2 class="h-4 w-4 text-emerald-500" aria-hidden="true" />
                Possibilité d&apos;accéder à toutes vos données depuis «&nbsp;Mon profil&nbsp;»
              </p>
              <p class="flex items-center gap-2">
                <Bell class="h-4 w-4 text-emerald-500" aria-hidden="true" />
                Gérez vos alertes depuis le centre de notifications
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>

    <input
      ref="fileInputRef"
      type="file"
      accept="image/png, image/jpeg"
      class="hidden"
      @change="handleAvatarChange"
    >
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { ArrowRight, Bell, Camera, CalendarClock, CheckCircle2, Mail, MapPin, Phone, ShieldCheck, User } from 'lucide-vue-next'
import Card from '@/components/ui/2025/Card.vue'
import Button from '@/components/ui/2025/Button.vue'
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

const createdAtLabel = computed(() => {
  if (!user.value?.created_at) {
    return 'Date inconnue'
  }

  return new Date(user.value.created_at).toLocaleDateString('fr-FR', {
    dateStyle: 'long'
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
