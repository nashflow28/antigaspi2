<template>
  <div class="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-primary-50 px-4 py-10 sm:px-6 lg:px-8">
    <div class="mx-auto flex max-w-6xl flex-col gap-6">
      <div class="flex flex-col gap-2">
        <Button
          variant="ghost"
          size="sm"
          class="w-fit -ml-2"
          tag="router-link"
          to="/profile"
          :left-icon="ArrowLeft"
        >
          Retour à l&apos;espace commerçant
        </Button>
        <h1 class="text-3xl font-semibold text-neutral-900">Horaires d&apos;ouverture</h1>
        <p class="max-w-3xl text-sm text-neutral-600">
          Configurez vos horaires pour informer les consommateurs des périodes de retrait disponibles. Les modifications sont visibles instantanément sur votre fiche commerçant.
        </p>
      </div>

      <Card variant="elevated" class="overflow-hidden">
        <div class="bg-gradient-to-r from-indigo-600/95 to-primary-600/90 px-6 py-8 text-white sm:px-8 sm:py-10">
          <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p class="text-xs font-semibold uppercase tracking-wide text-primary-100/90">Planification</p>
              <h2 class="text-2xl font-semibold">Disponibilités hebdomadaires</h2>
              <p class="mt-2 max-w-2xl text-sm text-primary-100/80">
                Activez les créneaux souhaités et précisez les horaires de matinée et d&apos;après-midi. Vous pouvez copier un jour sur tous les autres en un clic.
              </p>
            </div>
            <div class="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm">
              <p class="flex items-center gap-2">
                <Clock class="h-4 w-4" aria-hidden="true" />
                Dernière mise à jour :
              </p>
              <p class="mt-1 text-base font-semibold">{{ lastUpdatedLabel }}</p>
            </div>
          </div>
        </div>

        <div class="px-6 pb-10 pt-8 sm:px-10 sm:pb-12 sm:pt-10">
          <Loading v-if="isLoading" type="skeleton" :skeleton-lines="8" />

          <template v-else>
            <div class="space-y-4">
              <div
                v-for="(day, index) in schedule"
                :key="day.day"
                class="rounded-3xl border border-neutral-200 bg-white/80 p-5 shadow-sm shadow-neutral-200/40 transition-colors duration-150 hover:border-primary-200"
              >
                <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div class="flex items-center gap-3">
                    <div class="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary-50 text-primary-600">
                      <Calendar class="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div>
                      <p class="text-base font-semibold text-neutral-900">{{ day.label }}</p>
                      <p class="text-xs text-neutral-500">{{ day.is_open ? 'Jour ouvert' : 'Jour fermé' }}</p>
                    </div>
                  </div>
                  <label class="flex cursor-pointer items-center gap-3 text-sm font-medium text-neutral-700">
                    <input
                      type="checkbox"
                      class="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                      :checked="day.is_open"
                      @change="toggleDay(index)"
                    >
                    {{ day.is_open ? 'Ouvert' : 'Fermé' }}
                  </label>
                </div>

                <div class="mt-4 grid gap-4 sm:grid-cols-2">
                  <div class="space-y-2 rounded-2xl border border-neutral-200 bg-neutral-50/70 p-4">
                    <p class="text-sm font-semibold text-neutral-800">Matinée</p>
                    <div class="grid grid-cols-2 gap-3">
                      <label class="space-y-1 text-xs font-medium text-neutral-600">
                        Début
                        <input
                          type="time"
                          class="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200 disabled:cursor-not-allowed disabled:bg-neutral-100"
                          :value="day.morning_start || '08:00'"
                          :disabled="!day.is_open"
                          @input="updateTime(index, 'morning_start', ($event.target as HTMLInputElement).value || '')"
                        >
                      </label>
                      <label class="space-y-1 text-xs font-medium text-neutral-600">
                        Fin
                        <input
                          type="time"
                          class="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200 disabled:cursor-not-allowed disabled:bg-neutral-100"
                          :value="day.morning_end || '12:00'"
                          :disabled="!day.is_open"
                          @input="updateTime(index, 'morning_end', ($event.target as HTMLInputElement).value || '')"
                        >
                      </label>
                    </div>
                  </div>

                  <div class="space-y-2 rounded-2xl border border-neutral-200 bg-neutral-50/70 p-4">
                    <p class="text-sm font-semibold text-neutral-800">Après-midi</p>
                    <div class="grid grid-cols-2 gap-3">
                      <label class="space-y-1 text-xs font-medium text-neutral-600">
                        Début
                        <input
                          type="time"
                          class="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200 disabled:cursor-not-allowed disabled:bg-neutral-100"
                          :value="day.afternoon_start || '14:00'"
                          :disabled="!day.is_open"
                          @input="updateTime(index, 'afternoon_start', ($event.target as HTMLInputElement).value || '')"
                        >
                      </label>
                      <label class="space-y-1 text-xs font-medium text-neutral-600">
                        Fin
                        <input
                          type="time"
                          class="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200 disabled:cursor-not-allowed disabled:bg-neutral-100"
                          :value="day.afternoon_end || '18:00'"
                          :disabled="!day.is_open"
                          @input="updateTime(index, 'afternoon_end', ($event.target as HTMLInputElement).value || '')"
                        >
                      </label>
                    </div>
                  </div>
                </div>

                <div class="mt-4 flex flex-wrap items-center gap-3">
                  <Button
                    variant="ghost"
                    size="xs"
                    :left-icon="Copy"
                    :disabled="!day.is_open"
                    @click="copyToAll(index)"
                  >
                    Copier sur toute la semaine
                  </Button>
                  <p v-if="dayErrors(day.day)" class="flex items-center gap-2 text-xs font-medium text-amber-600">
                    <AlertTriangle class="h-4 w-4" aria-hidden="true" />
                    {{ dayErrors(day.day) }}
                  </p>
                </div>
              </div>
            </div>

            <div class="mt-8 grid gap-4 lg:grid-cols-[2fr_1fr]">
              <div class="space-y-3 rounded-3xl border border-primary-100 bg-primary-50/70 p-5 text-sm text-primary-900">
                <p class="font-semibold">Conseils d&apos;optimisation</p>
                <ul class="space-y-2">
                  <li class="flex items-start gap-2">
                    <Check class="mt-1 h-4 w-4 text-primary-600" aria-hidden="true" />
                    Indiquez vos horaires réels de retrait pour éviter les clients déçus.
                  </li>
                  <li class="flex items-start gap-2">
                    <Check class="mt-1 h-4 w-4 text-primary-600" aria-hidden="true" />
                    Ajustez les créneaux selon vos périodes de forte affluence.
                  </li>
                  <li class="flex items-start gap-2">
                    <Check class="mt-1 h-4 w-4 text-primary-600" aria-hidden="true" />
                    Fermez les jours fériés via la désactivation du jour concerné.
                  </li>
                </ul>
              </div>

              <div class="rounded-3xl border border-neutral-200 bg-white p-5 text-sm text-neutral-600">
                <p class="font-semibold text-neutral-900">Raccourcis</p>
                <div class="mt-3 flex flex-col gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    :left-icon="RefreshCw"
                    @click="resetSchedule"
                  >
                    Annuler les modifications
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    :left-icon="Wand"
                    @click="applyDefaultSchedule"
                  >
                    Appliquer les horaires recommandés
                  </Button>
                </div>
              </div>
            </div>

            <div class="mt-8 flex flex-col gap-3 border-t border-neutral-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <p class="text-xs text-neutral-500">
                Vos horaires sont utilisés sur votre fiche publique et dans les rappels envoyés aux clients.
              </p>
              <div class="flex flex-col gap-3 sm:flex-row">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  :disabled="isSaving || (!hasChanges && !hasValidationErrors)"
                  @click="resetSchedule"
                >
                  Réinitialiser
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  :loading="isSaving"
                  :disabled="isSaving || hasValidationErrors || !hasChanges"
                  :left-icon="Save"
                  @click="handleSave"
                >
                  Enregistrer les horaires
                </Button>
              </div>
            </div>
          </template>
        </div>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { ArrowLeft, AlertTriangle, Calendar, Check, Clock, Copy, RefreshCw, Save, Wand } from 'lucide-vue-next'
import Button from '@/components/ui/2025/Button.vue'
import Card from '@/components/ui/2025/Card.vue'
import Loading from '@/components/ui/2025/Loading.vue'
import { notify } from '@/composables/useNotifications'
import { fetchOpeningHours, updateOpeningHours, type OpeningHourEntry } from '@/services/openingHoursService'

interface DaySchedule extends OpeningHourEntry {
  label: string
}

const DAYS: Array<{ key: OpeningHourEntry['day']; label: string }> = [
  { key: 'monday', label: 'Lundi' },
  { key: 'tuesday', label: 'Mardi' },
  { key: 'wednesday', label: 'Mercredi' },
  { key: 'thursday', label: 'Jeudi' },
  { key: 'friday', label: 'Vendredi' },
  { key: 'saturday', label: 'Samedi' },
  { key: 'sunday', label: 'Dimanche' }
]

const createDefaultEntry = (day: (typeof DAYS)[number]) => ({
  day: day.key,
  label: day.label,
  is_open: true,
  morning_start: '08:00',
  morning_end: '12:00',
  afternoon_start: '14:00',
  afternoon_end: '18:00'
})

const schedule = reactive<DaySchedule[]>(DAYS.map(createDefaultEntry))
const originalSchedule = ref<OpeningHourEntry[]>([])
const isLoading = ref(true)
const isSaving = ref(false)
const lastUpdated = ref<string | null>(null)
const validationMap = reactive<Record<string, string | null>>({})

const normalizeEntry = (entry: OpeningHourEntry | null | undefined) => ({
  is_open: entry?.is_open ?? true,
  morning_start: entry?.morning_start || '08:00',
  morning_end: entry?.morning_end || '12:00',
  afternoon_start: entry?.afternoon_start || '14:00',
  afternoon_end: entry?.afternoon_end || '18:00'
})

const loadOpeningHours = async () => {
  isLoading.value = true
  try {
    const response = await fetchOpeningHours()
    const entries = response.data.opening_hours || []
    lastUpdated.value = response.data.updated_at ?? null

    DAYS.forEach((day, index) => {
      const existing = entries.find(item => item.day === day.key)
      const normalized = normalizeEntry(existing)
      schedule[index].day = day.key
      schedule[index].label = day.label
      schedule[index].is_open = normalized.is_open
      schedule[index].morning_start = normalized.morning_start
      schedule[index].morning_end = normalized.morning_end
      schedule[index].afternoon_start = normalized.afternoon_start
      schedule[index].afternoon_end = normalized.afternoon_end
    })

    originalSchedule.value = schedule.map(({ label, ...rest }) => ({ ...rest }))
    validateSchedule()
  } catch (error: any) {
    notify.error(error?.message || 'Impossible de charger les horaires.', 'Horaires commerçant')
  } finally {
    isLoading.value = false
  }
}

const lastUpdatedLabel = computed(() => {
  if (!lastUpdated.value) {
    return 'Jamais synchronisé'
  }

  return new Date(lastUpdated.value).toLocaleString('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short'
  })
})

const toggleDay = (index: number) => {
  schedule[index].is_open = !schedule[index].is_open
  validateSchedule()
}

const updateTime = (index: number, field: keyof OpeningHourEntry, value: string) => {
  ;(schedule[index] as any)[field] = value || null
  validateSchedule()
}

const copyToAll = (index: number) => {
  const source = schedule[index]
  schedule.forEach((day, dayIndex) => {
    if (dayIndex === index) return
    day.is_open = source.is_open
    day.morning_start = source.morning_start
    day.morning_end = source.morning_end
    day.afternoon_start = source.afternoon_start
    day.afternoon_end = source.afternoon_end
  })
  validateSchedule()
  notify.info(`Horaires copiés depuis ${source.label}.`, 'Horaires commerçant')
}

const applyDefaultSchedule = () => {
  schedule.forEach((_, index) => {
    const defaults = createDefaultEntry(DAYS[index])
    schedule[index].is_open = defaults.is_open
    schedule[index].morning_start = defaults.morning_start
    schedule[index].morning_end = defaults.morning_end
    schedule[index].afternoon_start = defaults.afternoon_start
    schedule[index].afternoon_end = defaults.afternoon_end
  })
  validateSchedule()
  notify.info('Horaires recommandés appliqués.', 'Horaires commerçant')
}

const resetSchedule = () => {
  if (!originalSchedule.value.length) {
    applyDefaultSchedule()
    return
  }

  schedule.forEach((day, index) => {
    const reference = originalSchedule.value[index]
    day.is_open = reference?.is_open ?? true
    day.morning_start = reference?.morning_start || '08:00'
    day.morning_end = reference?.morning_end || '12:00'
    day.afternoon_start = reference?.afternoon_start || '14:00'
    day.afternoon_end = reference?.afternoon_end || '18:00'
  })
  validateSchedule()
}

const serializeSchedule = (entries: OpeningHourEntry[]) => JSON.stringify(entries)

const currentPayload = computed<OpeningHourEntry[]>(() =>
  schedule.map(({ label, ...rest }) => ({
    ...rest,
    morning_start: rest.is_open ? rest.morning_start : null,
    morning_end: rest.is_open ? rest.morning_end : null,
    afternoon_start: rest.is_open ? rest.afternoon_start : null,
    afternoon_end: rest.is_open ? rest.afternoon_end : null
  }))
)

const hasChanges = computed(() => serializeSchedule(currentPayload.value) !== serializeSchedule(originalSchedule.value))

const validateSchedule = () => {
  Object.keys(validationMap).forEach((key) => { validationMap[key] = null })

  schedule.forEach((day) => {
    if (!day.is_open) {
      validationMap[day.day] = null
      return
    }

    const slots: Array<{ start: string | null; end: string | null; label: string }> = [
      { start: day.morning_start, end: day.morning_end, label: 'Matinée' },
      { start: day.afternoon_start, end: day.afternoon_end, label: 'Après-midi' }
    ]

    const hasError = slots.some(slot => {
      if (!slot.start || !slot.end) {
        validationMap[day.day] = `${slot.label} : définissez un horaire de début et de fin.`
        return true
      }
      if (slot.start >= slot.end) {
        validationMap[day.day] = `${slot.label} : l'heure de fin doit être postérieure à l'heure de début.`
        return true
      }
      return false
    })

    if (!hasError) {
      validationMap[day.day] = null
    }
  })
}

const dayErrors = (dayKey: string) => validationMap[dayKey]

const hasValidationErrors = computed(() => Object.values(validationMap).some(Boolean))

const handleSave = async () => {
  if (isSaving.value || hasValidationErrors.value) {
    if (hasValidationErrors.value) {
      notify.error('Corrigez les horaires en surbrillance avant de sauvegarder.', 'Horaires commerçant')
    }
    return
  }

  isSaving.value = true
  try {
    const response = await updateOpeningHours({ opening_hours: currentPayload.value })
    originalSchedule.value = currentPayload.value.map(entry => ({ ...entry }))
    lastUpdated.value = response.data.updated_at ?? new Date().toISOString()
    notify.success(response.message || 'Horaires mis à jour avec succès.', 'Horaires commerçant')
  } catch (error: any) {
    notify.error(error?.message || 'Impossible de sauvegarder les horaires.', 'Horaires commerçant')
  } finally {
    isSaving.value = false
  }
}

loadOpeningHours()
</script>
