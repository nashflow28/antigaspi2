<template>
  <div class="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-primary-50 px-4 py-10 sm:px-6 lg:px-8">
    <div class="mx-auto flex max-w-4xl flex-col gap-6">
      <div class="flex flex-col gap-2">
        <Button
          variant="ghost"
          size="sm"
          class="w-fit -ml-2"
          tag="router-link"
          to="/notifications/inbox"
          :left-icon="ArrowLeft"
        >
          Retour aux notifications
        </Button>
        <h1 class="text-3xl font-semibold text-neutral-900">Paramètres de notification</h1>
        <p class="max-w-2xl text-sm text-neutral-600">
          Choisissez comment vous souhaitez être averti des réservations, rappels et offres GÊLADAL. Les préférences sont synchronisées sur tous vos appareils.
        </p>
      </div>

      <Card variant="elevated" class="overflow-hidden">
        <div class="bg-gradient-to-r from-indigo-600/90 to-primary-600/90 px-6 py-8 text-white sm:px-8 sm:py-10">
          <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p class="text-xs font-semibold uppercase tracking-wide text-primary-100/80">Gestion des alertes</p>
              <h2 class="text-2xl font-semibold">Canaux de communication</h2>
              <p class="mt-2 max-w-2xl text-sm text-primary-100/80">
                Activez les canaux adaptés à vos habitudes : récapitulatifs e-mail, rappels SMS ou notifications push instantanées.
              </p>
            </div>
            <div class="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm">
              <p class="flex items-center gap-2">
                <ShieldCheck class="h-4 w-4" aria-hidden="true" />
                Dernière synchronisation
              </p>
              <p class="mt-1 text-base font-semibold">{{ lastUpdatedLabel }}</p>
            </div>
          </div>
        </div>

        <div class="px-6 pb-10 pt-8 sm:px-10 sm:pb-12 sm:pt-10">
          <div class="grid gap-6 lg:grid-cols-[2fr_1fr]">
            <div class="space-y-4">
              <label
                v-for="channel in preferenceOptions"
                :key="channel.key"
                class="flex cursor-pointer items-start gap-3 rounded-3xl border border-neutral-200 bg-white/90 px-5 py-4 transition hover:border-primary-300 hover:shadow-lg"
              >
                <input
                  v-model="localPreferences[channel.key]"
                  type="checkbox"
                  class="mt-1 h-5 w-5 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                  :disabled="channel.key === 'push' && pushNotSupported"
                  @change="handleChannelToggle(channel.key)"
                >
                <div class="space-y-1">
                  <div class="flex flex-wrap items-center gap-2">
                    <component :is="channel.icon" class="h-4 w-4 text-primary-500" aria-hidden="true" />
                    <p class="text-sm font-semibold text-neutral-900">{{ channel.label }}</p>
                    <Badge v-if="channel.key === 'push' && pushNotSupported" variant="warning" size="xs">
                      Navigateur non compatible
                    </Badge>
                    <Badge v-else-if="channel.key === 'push' && pushPermission === 'denied'" variant="error" size="xs">
                      Autorisation refusée
                    </Badge>
                  </div>
                  <p class="text-xs leading-relaxed text-neutral-600">{{ channel.description }}</p>
                </div>
              </label>
            </div>

            <div class="space-y-4">
              <div class="rounded-3xl border border-primary-100 bg-primary-50/80 p-5 text-sm text-primary-900">
                <p class="flex items-center gap-2 font-semibold">
                  <Bell class="h-4 w-4" aria-hidden="true" />
                  Statut des notifications push
                </p>
                <p class="mt-2 leading-relaxed">{{ pushStatusMessage }}</p>
                <div class="mt-4 flex flex-col gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    :left-icon="Smartphone"
                    :disabled="pushNotSupported"
                    :loading="pushActionLoading"
                    @click="handlePushSetup"
                  >
                    {{ pushPermission === 'granted' ? 'Rafraîchir la connexion push' : 'Activer les notifications push' }}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    :left-icon="Wifi"
                    :disabled="pushPermission !== 'granted'"
                    @click="notify.info('Une notification test sera envoyée prochainement.', 'Notifications push')"
                  >
                    Envoyer une notification test
                  </Button>
                </div>
              </div>

              <div class="rounded-3xl border border-neutral-200 bg-white p-5 text-sm text-neutral-600">
                <p class="font-semibold text-neutral-900">Bonnes pratiques</p>
                <ul class="mt-3 space-y-2">
                  <li class="flex items-start gap-2">
                    <Check class="mt-1 h-4 w-4 text-primary-600" aria-hidden="true" />
                    Les e-mails contiennent un récapitulatif détaillé de vos réservations.
                  </li>
                  <li class="flex items-start gap-2">
                    <Check class="mt-1 h-4 w-4 text-primary-600" aria-hidden="true" />
                    Les SMS sont idéals pour ne pas oublier le retrait le jour J.
                  </li>
                  <li class="flex items-start gap-2">
                    <Check class="mt-1 h-4 w-4 text-primary-600" aria-hidden="true" />
                    Les push offrent une réaction instantanée aux nouvelles offres.
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div class="mt-10 flex flex-col gap-3 border-t border-neutral-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p class="text-xs text-neutral-500">
              Besoin d&apos;ajuster votre profil ? Rendez-vous sur la
              <RouterLink class="font-medium text-primary-600 hover:underline" to="/profile/edit">page de modification du profil</RouterLink>.
            </p>
            <div class="flex flex-col gap-3 sm:flex-row">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                :disabled="saving || !preferencesDirty"
                @click="resetPreferences"
              >
                Réinitialiser
              </Button>
              <Button
                type="button"
                size="md"
                :loading="saving"
                :disabled="saving || !preferencesDirty"
                :left-icon="Save"
                @click="handleSave"
              >
                Enregistrer les préférences
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { RouterLink } from 'vue-router'
import {
  ArrowLeft,
  Bell,
  Check,
  Mail,
  MessageSquare,
  Save,
  ShieldCheck,
  Smartphone,
  Wifi
} from 'lucide-vue-next'
import Button from '@/components/ui/2025/Button.vue'
import Card from '@/components/ui/2025/Card.vue'
import Badge from '@/components/ui/2025/Badge.vue'
import { useNotificationStore } from '@/stores/notification'
import { notify } from '@/composables/useNotifications'

const notificationStore = useNotificationStore()

const localPreferences = reactive({
  email: true,
  sms: false,
  push: false
})
const saving = ref(false)
const pushActionLoading = ref(false)
const lastUpdated = ref<Date | null>(null)
const pushPermission = ref<NotificationPermission>('default')

const preferenceOptions = [
  {
    key: 'email' as const,
    label: 'E-mails intelligents',
    description: 'Recevez un récapitulatif des confirmations et des offres importantes.',
    icon: Mail
  },
  {
    key: 'sms' as const,
    label: 'SMS de rappel',
    description: 'Un message la veille et le jour J pour ne rien oublier.',
    icon: MessageSquare
  },
  {
    key: 'push' as const,
    label: 'Notifications push',
    description: 'Soyez alerté dès qu’un panier correspondant à vos goûts est disponible.',
    icon: Smartphone
  }
]

const pushSupported = computed(() =>
  typeof window !== 'undefined' &&
  typeof navigator !== 'undefined' &&
  'Notification' in window &&
  'serviceWorker' in navigator &&
  'PushManager' in window
)
const pushNotSupported = computed(() => !pushSupported.value)

const preferencesDirty = computed(() =>
  localPreferences.email !== notificationStore.preferences.email ||
  localPreferences.sms !== notificationStore.preferences.sms ||
  localPreferences.push !== notificationStore.preferences.push
)

const lastUpdatedLabel = computed(() => {
  if (!lastUpdated.value) {
    return 'Non synchronisé'
  }
  return lastUpdated.value.toLocaleString('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short'
  })
})

const pushStatusMessage = computed(() => {
  if (!pushSupported.value) {
    return 'Les notifications push ne sont pas disponibles sur ce navigateur.'
  }

  if (pushPermission.value === 'granted') {
    return 'Notifications push actives sur cet appareil.'
  }

  if (pushPermission.value === 'denied') {
    return 'Notifications push bloquées dans votre navigateur. Autorisez-les dans les paramètres.'
  }

  return 'Notifications push disponibles : autorisation demandée lors de l’activation.'
})

const updatePushPermission = () => {
  if (typeof window === 'undefined' || typeof Notification === 'undefined') {
    return
  }
  pushPermission.value = Notification.permission
}

const syncPreferences = () => {
  localPreferences.email = notificationStore.preferences.email
  localPreferences.sms = notificationStore.preferences.sms
  localPreferences.push = notificationStore.preferences.push
}

const resetPreferences = () => {
  syncPreferences()
}

const handleChannelToggle = (key: keyof typeof localPreferences) => {
  if (key !== 'push') {
    return
  }

  if (localPreferences.push && pushPermission.value === 'denied') {
    notify.error('Autorisez les notifications dans votre navigateur avant de réactiver le push.', 'Notifications')
    localPreferences.push = false
  }
}

const handleSave = async () => {
  if (saving.value || !preferencesDirty.value) {
    return
  }

  const payload = {
    email: localPreferences.email,
    sms: localPreferences.sms,
    push: localPreferences.push
  }

  if (payload.push && (!pushSupported.value || pushPermission.value === 'denied')) {
    notify.error('Impossible d’activer les notifications push sur cet appareil.', 'Notifications')
    payload.push = false
    localPreferences.push = false
  }

  saving.value = true
  try {
    const updated = await notificationStore.savePreferences(payload)
    syncPreferences()
    lastUpdated.value = new Date()
    notify.success('Préférences enregistrées.', 'Notifications')

    if (updated.push) {
      await notificationStore.ensurePushSubscription()
      updatePushPermission()
    }
  } catch (error: any) {
    notify.error(error?.message || 'Erreur lors de la sauvegarde des préférences.', 'Notifications')
  } finally {
    saving.value = false
  }
}

const handlePushSetup = async () => {
  if (!pushSupported.value) {
    return
  }

  pushActionLoading.value = true
  try {
    const subscription = await notificationStore.ensurePushSubscription()
    updatePushPermission()
    if (subscription) {
      localPreferences.push = true
      notify.success('Notifications push configurées avec succès.', 'Notifications')
    } else {
      notify.warning('Nous n’avons pas pu activer les notifications push sur cet appareil.', 'Notifications')
      localPreferences.push = false
    }
  } catch (error: any) {
    notify.error(error?.message || 'Impossible de configurer les notifications push.', 'Notifications')
  } finally {
    pushActionLoading.value = false
  }
}

onMounted(async () => {
  notificationStore.hydratePreferencesFromUser()
  syncPreferences()
  updatePushPermission()
  lastUpdated.value = new Date()
})
</script>
