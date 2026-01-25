<template>
  <DashboardLayout
    :sidebar="sidebar"
    :header="header"
    class="bg-gradient-to-br from-surface-light via-surface-light to-primary-50 dark:from-surface-dark dark:via-surface-darker dark:to-primary-950"
  >
    <div class="mx-auto w-full max-w-5xl space-y-8 px-3 py-6 sm:px-6 sm:py-8">
      <DashboardHeader
        eyebrow="Commerçant"
        title="Horaires d'ouverture"
        subtitle="Gérez les horaires d'ouverture de votre commerce"
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
            Enregistrer les horaires
          </Button>
        </template>
      </DashboardHeader>

      <!-- Info Banner -->
      <Card variant="bordered" class="border-l-4 border-l-primary-500">
        <div class="flex items-start gap-4">
          <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500/10">
            <Info class="h-5 w-5 text-primary-600" />
          </div>
          <div class="flex-1">
            <h3 class="text-base font-semibold text-neutral-900 dark:text-neutral-50">
              Informations importantes
            </h3>
            <p class="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
              Vos horaires d'ouverture seront affichés sur votre page commerçant. Les clients pourront planifier leurs visites en fonction de vos disponibilités.
            </p>
          </div>
        </div>
      </Card>

      <!-- Opening Hours Cards -->
      <div class="space-y-4">
        <Card
          v-for="day in weekDays"
          :key="day.key"
          :data-testid="`hours-card-${day.key}`"
        >
          <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <!-- Day Name and Toggle -->
            <div class="flex items-center gap-4">
              <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-500/10">
                <Calendar class="h-6 w-6 text-primary-600" />
              </div>
              <div class="flex-1">
                <h3 class="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
                  {{ day.label }}
                </h3>
                <p class="text-sm text-neutral-500 dark:text-neutral-400">
                  {{ getHoursDisplay(day.key) }}
                </p>
              </div>
            </div>

            <!-- Toggle Open/Closed -->
            <div class="flex items-center gap-3">
              <label class="relative inline-flex cursor-pointer items-center">
                <input
                  v-model="openingHours[day.key].is_open"
                  type="checkbox"
                  class="peer sr-only"
                  :data-testid="`toggle-${day.key}`"
                >
                <div class="peer h-6 w-11 rounded-full bg-neutral-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-neutral-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:border-neutral-600 dark:bg-neutral-700 dark:peer-focus:ring-primary-800" />
                <span class="ml-3 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  {{ openingHours[day.key].is_open ? 'Ouvert' : 'Fermé' }}
                </span>
              </label>
            </div>
          </div>

          <!-- Time Inputs (shown only when open) -->
          <div
            v-if="openingHours[day.key].is_open"
            class="mt-6 grid gap-4 sm:grid-cols-2"
          >
            <div>
              <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Heure d'ouverture
              </label>
              <input
                v-model="openingHours[day.key].open_time"
                type="time"
                class="w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-50"
                :data-testid="`open-time-${day.key}`"
              >
            </div>

            <div>
              <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Heure de fermeture
              </label>
              <input
                v-model="openingHours[day.key].close_time"
                type="time"
                class="w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-50"
                :data-testid="`close-time-${day.key}`"
              >
            </div>
          </div>
        </Card>
      </div>

      <!-- Quick Actions Card -->
      <Card variant="bordered">
        <div class="flex items-start gap-4">
          <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
            <Zap class="h-5 w-5 text-amber-600" />
          </div>
          <div class="flex-1">
            <h3 class="text-base font-semibold text-neutral-900 dark:text-neutral-50">
              Actions rapides
            </h3>
            <div class="mt-4 flex flex-wrap gap-3">
              <Button
                variant="outline"
                size="sm"
                :disabled="isSaving"
                @click="applyToAllWeekdays"
              >
                Appliquer aux jours ouvrables
              </Button>
              <Button
                variant="outline"
                size="sm"
                :disabled="isSaving"
                @click="closeAllDays"
              >
                Tout fermer
              </Button>
              <Button
                variant="outline"
                size="sm"
                :disabled="isSaving"
                @click="setDefaultHours"
              >
                Horaires par défaut
              </Button>
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
import { Calendar, Info, Zap } from 'lucide-vue-next'
import DashboardLayout from '@/components/ui/DashboardLayout.vue'
import DashboardHeader from '@/components/dashboard/2025/DashboardHeader.vue'
import Card from '@/components/ui/2025/Card.vue'
import Button from '@/components/ui/2025/Button.vue'
import { merchantService } from '@/services/merchantService'
import { useAuthStore } from '@/stores/auth'
import { notify } from '@/composables/useNotifications'
import { useDashboardLayout } from '@/composables/useDashboardLayout'

const router = useRouter()
const authStore = useAuthStore()
const user = computed(() => authStore.user)

// Sidebar et header from composable
const { sidebar, header } = useDashboardLayout('merchant')

interface DayHours {
  is_open: boolean
  open_time: string
  close_time: string
}

interface OpeningHoursData {
  [key: string]: DayHours
}

const weekDays = [
  { key: 'monday', label: 'Lundi' },
  { key: 'tuesday', label: 'Mardi' },
  { key: 'wednesday', label: 'Mercredi' },
  { key: 'thursday', label: 'Jeudi' },
  { key: 'friday', label: 'Vendredi' },
  { key: 'saturday', label: 'Samedi' },
  { key: 'sunday', label: 'Dimanche' }
]

const openingHours = reactive<OpeningHoursData>({
  monday: { is_open: true, open_time: '08:00', close_time: '18:00' },
  tuesday: { is_open: true, open_time: '08:00', close_time: '18:00' },
  wednesday: { is_open: true, open_time: '08:00', close_time: '18:00' },
  thursday: { is_open: true, open_time: '08:00', close_time: '18:00' },
  friday: { is_open: true, open_time: '08:00', close_time: '18:00' },
  saturday: { is_open: true, open_time: '08:00', close_time: '13:00' },
  sunday: { is_open: false, open_time: '08:00', close_time: '12:00' }
})

const isSaving = ref(false)

const getHoursDisplay = (dayKey: string): string => {
  const day = openingHours[dayKey]
  if (!day.is_open) {
    return 'Fermé'
  }
  return `${day.open_time} - ${day.close_time}`
}

const loadOpeningHours = async () => {
  try {
    // Get merchant data from auth store
    if ((user.value as any)?.merchant?.opening_hours) {
      const savedHours = (user.value as any).merchant.opening_hours

      // Parse JSON if it's a string
      const hoursData = typeof savedHours === 'string' ? JSON.parse(savedHours) : savedHours

      // Update opening hours with saved data
      Object.keys(hoursData).forEach((key) => {
        if (openingHours[key]) {
          openingHours[key] = { ...hoursData[key] }
        }
      })
    }
  } catch (error: any) {
    console.error('Error loading opening hours:', error)
    notify.error('Erreur lors du chargement des horaires', 'Horaires')
  }
}

const applyToAllWeekdays = () => {
  const mondayHours = openingHours.monday
  const weekdayKeys = ['tuesday', 'wednesday', 'thursday', 'friday']

  weekdayKeys.forEach((key) => {
    openingHours[key] = { ...mondayHours }
  })

  notify.info('Horaires du lundi appliqués aux jours ouvrables', 'Horaires')
}

const closeAllDays = () => {
  Object.keys(openingHours).forEach((key) => {
    openingHours[key].is_open = false
  })

  notify.info('Tous les jours ont été fermés', 'Horaires')
}

const setDefaultHours = () => {
  const defaults: OpeningHoursData = {
    monday: { is_open: true, open_time: '08:00', close_time: '18:00' },
    tuesday: { is_open: true, open_time: '08:00', close_time: '18:00' },
    wednesday: { is_open: true, open_time: '08:00', close_time: '18:00' },
    thursday: { is_open: true, open_time: '08:00', close_time: '18:00' },
    friday: { is_open: true, open_time: '08:00', close_time: '18:00' },
    saturday: { is_open: true, open_time: '08:00', close_time: '13:00' },
    sunday: { is_open: false, open_time: '08:00', close_time: '12:00' }
  }

  Object.keys(defaults).forEach((key) => {
    openingHours[key] = { ...defaults[key] }
  })

  notify.info('Horaires par défaut appliqués', 'Horaires')
}

const handleSubmit = async () => {
  if (isSaving.value) return

  isSaving.value = true

  try {
    // Prepare opening hours data
    const hoursData: any = {}
    Object.keys(openingHours).forEach((key) => {
      hoursData[key] = { ...openingHours[key] }
    })

    // Since the backend doesn't have a dedicated endpoint for opening_hours,
    // we'll need to use the updateProfile endpoint (which we'll extend)
    // For now, we'll call the API with the opening_hours data
    const response = await merchantService.updateMerchantProfile({
      // @ts-ignore - opening_hours is not in the TypeScript type yet
      opening_hours: hoursData
    })

    if (response.success) {
      notify.success('Horaires mis à jour avec succès', 'Horaires')

      setTimeout(() => {
        router.push('/merchant/dashboard')
      }, 1500)
    } else {
      notify.error(response.message || 'Erreur lors de la mise à jour', 'Horaires')
    }
  } catch (error: any) {
    notify.error(error?.message || 'Erreur lors de la mise à jour des horaires', 'Horaires')
  } finally {
    isSaving.value = false
  }
}

const handleCancel = () => {
  router.push('/merchant/dashboard')
}

onMounted(() => {
  loadOpeningHours()
})
</script>
