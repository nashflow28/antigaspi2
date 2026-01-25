<template>
  <DashboardLayout
    :sidebar="sidebar"
    :header="header"
    class="bg-gradient-to-br from-surface-light via-surface-light to-primary-50 dark:from-surface-dark dark:via-surface-darker dark:to-primary-950"
  >
    <div class="mx-auto w-full max-w-5xl space-y-8 px-3 py-6 sm:px-6 sm:py-8">
      <DashboardHeader
        eyebrow="Commerçant"
        title="Modifier mon profil"
        subtitle="Mettez à jour les informations de votre commerce"
      >
        <template #actions>
          <Button
            variant="ghost"
            size="md"
            :disabled="isSaving"
            @click="handleCancel"
          >
            Annuler
          </Button>
          <Button
            variant="primary"
            size="md"
            :loading="isSaving"
            :disabled="isSaving"
            @click="handleSubmit"
          >
            Enregistrer les modifications
          </Button>
        </template>
      </DashboardHeader>

      <!-- Business Information Card -->
      <Card data-testid="business-info-card">
        <template #header>
          <div class="flex items-center gap-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500/10">
              <Store class="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <h2 class="text-xl font-semibold text-neutral-900 dark:text-neutral-50">
                Informations du commerce
              </h2>
              <p class="text-sm text-neutral-500 dark:text-neutral-400">
                Nom, type et description de votre établissement
              </p>
            </div>
          </div>
        </template>

        <div class="space-y-6">
          <div class="grid gap-6 md:grid-cols-2">
            <Input
              v-model="formData.business_name"
              label="Nom du commerce"
              placeholder="Ex: Boulangerie Martin"
              required
              :error="formErrors.business_name"
              data-testid="business-name-input"
            />
            <Input
              v-model="formData.business_type"
              label="Type de commerce"
              placeholder="Ex: Boulangerie, Épicerie, Restaurant"
              :error="formErrors.business_type"
              data-testid="business-type-input"
            />
            <Input
              v-model="formData.siret"
              label="Numéro SIRET"
              placeholder="14 chiffres"
              :error="formErrors.siret"
              help-text="Numéro d'identification de votre entreprise"
              data-testid="siret-input"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Description
            </label>
            <textarea
              v-model="formData.description"
              rows="4"
              class="w-full rounded-xl border border-neutral-200 px-4 py-3 text-neutral-900 placeholder-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-50"
              placeholder="Décrivez votre commerce, vos spécialités, votre engagement contre le gaspillage..."
              :class="{ 'border-red-500': formErrors.description }"
              data-testid="description-textarea"
            />
            <p v-if="formErrors.description" class="mt-1 text-sm text-red-600">
              {{ formErrors.description }}
            </p>
            <p class="mt-1 text-xs text-neutral-500">
              Maximum 1000 caractères
            </p>
          </div>
        </div>
      </Card>

      <!-- Contact Information Card -->
      <Card data-testid="contact-info-card">
        <template #header>
          <div class="flex items-center gap-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
              <Phone class="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <h2 class="text-xl font-semibold text-neutral-900 dark:text-neutral-50">
                Coordonnées de contact
              </h2>
              <p class="text-sm text-neutral-500 dark:text-neutral-400">
                Informations pour que les clients puissent vous joindre
              </p>
            </div>
          </div>
        </template>

        <div class="space-y-6">
          <div class="grid gap-6 md:grid-cols-2">
            <Input
              v-model="formData.phone"
              type="tel"
              label="Téléphone"
              placeholder="+228 00 00 00 00"
              :error="formErrors.phone"
              help-text="Format recommandé : +228 12 34 56 78"
              data-testid="phone-input"
            />
            <Input
              v-model="formData.city"
              label="Ville"
              placeholder="Ex: Lomé, Kara, Sokodé"
              :error="formErrors.city"
              data-testid="city-input"
            />
          </div>

          <Input
            v-model="formData.address"
            label="Adresse complète"
            placeholder="Numéro, rue, quartier"
            :error="formErrors.address"
            data-testid="address-input"
          />
        </div>
      </Card>

      <!-- Profile Summary Card -->
      <Card variant="bordered" data-testid="profile-summary-card">
        <div class="flex items-start gap-4">
          <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-500/10">
            <ShieldCheck class="h-6 w-6 text-primary-600" />
          </div>
          <div class="flex-1">
            <h3 class="text-base font-semibold text-neutral-900 dark:text-neutral-50">
              Statut de vérification
            </h3>
            <p class="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
              {{ verificationStatus }}
            </p>
            <div v-if="merchant?.is_verified" class="mt-4 flex items-center gap-2 text-sm text-emerald-600">
              <CheckCircle2 class="h-4 w-4" />
              <span class="font-medium">Compte vérifié</span>
            </div>
            <div v-else class="mt-4 space-y-2 text-sm text-neutral-600">
              <p class="flex items-center gap-2">
                <Clock class="h-4 w-4 text-amber-500" />
                En attente de vérification
              </p>
              <p class="text-xs text-neutral-500">
                Votre compte sera vérifié par notre équipe sous 48h
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  </DashboardLayout>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Store, Phone, ShieldCheck, CheckCircle2, Clock } from 'lucide-vue-next'
import DashboardLayout from '@/components/ui/DashboardLayout.vue'
import DashboardHeader from '@/components/dashboard/2025/DashboardHeader.vue'
import Card from '@/components/ui/2025/Card.vue'
import Button from '@/components/ui/2025/Button.vue'
import Input from '@/components/ui/2025/Input.vue'
import { merchantService } from '@/services/merchantService'
import { useAuthStore } from '@/stores/auth'
import { notify } from '@/composables/useNotifications'
import { useDashboardLayout } from '@/composables/useDashboardLayout'

const router = useRouter()
const authStore = useAuthStore()
const user = computed(() => authStore.user)
const merchant = ref<any>(null)

// Sidebar et header from composable
const { sidebar, header } = useDashboardLayout('merchant')

interface FormData {
  business_name: string
  business_type: string
  description: string
  siret: string
  phone: string
  address: string
  city: string
}

const formData = reactive<FormData>({
  business_name: '',
  business_type: '',
  description: '',
  siret: '',
  phone: '',
  address: '',
  city: ''
})

const initialData = reactive<FormData>({ ...formData })
const formErrors = reactive<Record<string, string>>({})
const isSaving = ref(false)

const verificationStatus = computed(() => {
  if (!merchant.value) return 'Chargement...'
  return merchant.value.is_verified
    ? `Vérifié le ${new Date(merchant.value.verification_date).toLocaleDateString('fr-FR')}`
    : 'En attente de vérification par notre équipe'
})

const clearErrors = () => {
  Object.keys(formErrors).forEach(key => {
    delete formErrors[key]
  })
}

const validateForm = (): boolean => {
  clearErrors()

  if (!formData.business_name.trim()) {
    formErrors.business_name = 'Le nom du commerce est requis'
    return false
  }

  if (formData.business_name.trim().length < 3) {
    formErrors.business_name = 'Le nom doit contenir au moins 3 caractères'
    return false
  }

  if (formData.description && formData.description.length > 1000) {
    formErrors.description = 'La description ne peut pas dépasser 1000 caractères'
    return false
  }

  if (formData.siret && formData.siret.length !== 14) {
    formErrors.siret = 'Le SIRET doit contenir exactement 14 chiffres'
    return false
  }

  return true
}

const loadMerchantProfile = async () => {
  try {
    void await merchantService.getStats()

    // Get merchant data from auth store if available
    if ((user.value as any)?.merchant) {
      merchant.value = (user.value as any).merchant

      // Populate form with current data
      formData.business_name = merchant.value.business_name || ''
      formData.business_type = merchant.value.business_type || ''
      formData.description = merchant.value.description || ''
      formData.siret = merchant.value.siret || ''
      formData.phone = user.value?.phone || ''
      formData.address = user.value?.address || ''
      formData.city = user.value?.city || ''

      // Save initial state
      Object.assign(initialData, formData)
    }
  } catch (error: any) {
    notify.error('Erreur lors du chargement du profil', 'Profil')
  }
}

const handleSubmit = async () => {
  if (isSaving.value) return

  if (!validateForm()) {
    notify.error('Merci de corriger les champs mis en évidence', 'Profil')
    return
  }

  isSaving.value = true

  try {
    const payload: any = {}

    // Only send changed fields
    if (formData.business_name !== initialData.business_name) {
      payload.business_name = formData.business_name
    }
    if (formData.business_type !== initialData.business_type) {
      payload.business_type = formData.business_type
    }
    if (formData.description !== initialData.description) {
      payload.description = formData.description
    }
    if (formData.siret !== initialData.siret) {
      payload.siret = formData.siret
    }
    if (formData.phone !== initialData.phone) {
      payload.phone = formData.phone
    }
    if (formData.address !== initialData.address) {
      payload.address = formData.address
    }
    if (formData.city !== initialData.city) {
      payload.city = formData.city
    }

    const response = await merchantService.updateMerchantProfile(payload)

    if (response.success) {
      // Update initial data
      Object.assign(initialData, formData)

      notify.success('Profil mis à jour avec succès', 'Profil')

      // Optionally redirect to dashboard
      setTimeout(() => {
        router.push('/merchant/dashboard')
      }, 1500)
    } else {
      notify.error(response.message || 'Erreur lors de la mise à jour', 'Profil')
    }
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
      notify.error('Veuillez corriger les erreurs signalées', 'Profil')
    } else {
      notify.error(error?.message || 'Erreur lors de la mise à jour du profil', 'Profil')
    }
  } finally {
    isSaving.value = false
  }
}

const handleCancel = () => {
  router.push('/merchant/dashboard')
}

onMounted(() => {
  loadMerchantProfile()
})
</script>
