<template>
  <div class="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-primary-50 px-4 py-8 sm:px-6 lg:px-8">
    <div class="mx-auto flex max-w-6xl flex-col gap-6">
      <div class="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card variant="elevated" class="overflow-hidden">
          <div class="bg-gradient-to-r from-indigo-600/90 to-primary-600/90 px-6 py-8 text-white sm:px-8 sm:py-10">
            <p class="text-sm font-semibold uppercase tracking-wide text-primary-100">Centre de notifications</p>
            <h1 class="mt-2 text-2xl font-semibold">Tous vos messages importants</h1>
            <p class="mt-2 max-w-3xl text-sm text-primary-100/90">
              Retrouvez l&apos;historique complet de vos alertes GÊLADAL, suivez vos réservations et ajustez vos préférences de communication.
            </p>
            <div class="mt-6 flex flex-wrap items-center gap-4 text-xs text-primary-50/80">
              <span class="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5">
                <Sparkles class="h-4 w-4" aria-hidden="true" />
                {{ unreadCount }} notification<span v-if="unreadCount > 1">s</span> non lue<span v-if="unreadCount > 1">s</span>
              </span>
              <span class="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5">
                <Clock class="h-4 w-4" aria-hidden="true" />
                Dernière actualisation : {{ lastRefreshLabel }}
              </span>
            </div>
          </div>

          <div class="px-6 pb-8 pt-6 sm:px-8 sm:pb-10 sm:pt-8">
            <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <Tabs
                v-model="activeTab"
                :tabs="tabs"
                class="flex-1"
                @tab-change="handleTabChange"
              />

              <div class="flex flex-wrap items-center gap-2 sm:justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  :left-icon="RefreshCw"
                  :loading="isReloading"
                  @click="refreshNotifications"
                >
                  Actualiser
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  :disabled="!unreadCount || notificationStore.loading"
                  :left-icon="CheckCircle2"
                  @click="handleMarkAllAsRead"
                >
                  Tout marquer comme lu
                </Button>
              </div>
            </div>

            <div class="mt-6 space-y-4">
              <Loading
                v-if="notificationStore.loading && !notifications.length"
                type="skeleton"
                :skeleton-lines="4"
              />

              <template v-else-if="!notifications.length">
                <EmptyState
                  variant="illustration"
                  title="Aucune notification pour le moment"
                  description="Revenez plus tard pour découvrir de nouvelles alertes. Vous pouvez gérer vos préférences sur la droite."
                  :primary-action="{
                    text: 'Actualiser',
                    variant: 'primary',
                    loading: isReloading,
                    onClick: refreshNotifications
                  }"
                >
                  <template #icon>
                    <Inbox class="h-12 w-12 text-primary-500" aria-hidden="true" />
                  </template>
                </EmptyState>
              </template>

              <div v-else class="space-y-4">
                <article
                  v-for="notification in notifications"
                  :key="notification.id"
                  :class="[
                    'rounded-2xl border p-5 transition-shadow duration-200',
                    notification.is_read
                      ? 'bg-white border-neutral-200 hover:shadow-lg'
                      : 'border-primary-200/80 bg-primary-50/70 shadow-primary-200/40 hover:shadow-xl'
                  ]"
                >
                  <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div class="space-y-3">
                      <div class="flex items-start gap-3">
                        <span class="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-indigo-500 text-white shadow-lg shadow-primary-500/30">
                          <component :is="typeIcon(notification.type)" class="h-5 w-5" aria-hidden="true" />
                        </span>
                        <div class="space-y-1">
                          <h2 class="text-base font-semibold text-neutral-900">
                            {{ formatTypeLabel(notification.title || notification.type) }}
                          </h2>
                          <p class="text-sm leading-relaxed text-neutral-600">
                            {{ notification.message }}
                          </p>
                        </div>
                      </div>

                      <div class="flex flex-wrap items-center gap-4 text-xs text-neutral-500">
                        <div class="flex items-center gap-2">
                          <Clock class="h-4 w-4" aria-hidden="true" />
                          <span>{{ formatAbsoluteDate(notification.sent_at || notification.created_at) }}</span>
                          <span class="text-neutral-400">•</span>
                          <span>{{ formatRelativeTime(notification.sent_at || notification.created_at) }}</span>
                        </div>
                        <div class="flex items-center gap-2">
                          <component :is="channelIcon(notification.sent_via)" class="h-4 w-4 text-primary-500" aria-hidden="true" />
                          <span>{{ formatChannelLabel(notification.sent_via) }}</span>
                        </div>
                      </div>
                    </div>

                    <div class="flex items-center gap-2">
                      <Badge v-if="!notification.is_read" variant="primary" size="sm">Nouveau</Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        :disabled="notification.is_read || markAsReadLoadingId === notification.id"
                        :loading="markAsReadLoadingId === notification.id"
                        @click="handleMarkAsRead(notification)"
                      >
                        Marquer comme lu
                      </Button>
                    </div>
                  </div>
                </article>

                <Pagination
                  v-if="pagination.total > pagination.perPage"
                  :current-page="pagination.currentPage"
                  :total-pages="pagination.lastPage"
                  :total="pagination.total"
                  :page-size="pagination.perPage"
                  :show-page-size="false"
                  @page-change="handlePageChange"
                />
              </div>
            </div>
          </div>
        </Card>

        <div class="space-y-6">
          <Card class="p-6">
            <div class="flex items-start gap-3">
              <Settings2 class="h-5 w-5 text-primary-600" aria-hidden="true" />
              <div>
                <h2 class="text-lg font-semibold text-neutral-900">Mes préférences</h2>
                <p class="mt-1 text-sm text-neutral-500">
                  Choisissez comment vous souhaitez être averti des nouveaux paniers, rappels et alertes importantes.
                </p>
              </div>
            </div>

            <div class="mt-6 space-y-4">
              <label
                v-for="channel in preferenceOptions"
                :key="channel.key"
                class="flex cursor-pointer items-start gap-3 rounded-2xl border border-neutral-200 bg-white px-4 py-3 transition hover:border-primary-300 hover:shadow-md"
              >
                <input
                  v-model="localPreferences[channel.key]"
                  type="checkbox"
                  class="mt-1 h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                  :disabled="channel.key === 'push' && pushNotSupported"
                >
                <div class="space-y-1">
                  <div class="flex items-center gap-2">
                    <component :is="channel.icon" class="h-4 w-4 text-primary-500" aria-hidden="true" />
                    <p class="text-sm font-semibold text-neutral-800">{{ channel.label }}</p>
                    <Badge
                      v-if="channel.key === 'push' && !pushSupported"
                      variant="warning"
                      size="xs"
                    >
                      Navigateur non compatible
                    </Badge>
                    <Badge
                      v-else-if="channel.key === 'push' && pushPermission === 'denied'"
                      variant="error"
                      size="xs"
                    >
                      Autorisation refusée
                    </Badge>
                  </div>
                  <p class="text-xs leading-relaxed text-neutral-500">{{ channel.description }}</p>
                </div>
              </label>
            </div>

            <div class="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p class="text-xs text-neutral-500">
                Les modifications sont sauvegardées pour votre compte GÊLADAL et synchronisées sur tous vos appareils.
              </p>
              <Button
                variant="primary"
                size="sm"
                :loading="savingPreferences"
                :disabled="!preferencesDirty || savingPreferences"
                @click="handleSavePreferences"
              >
                Enregistrer les préférences
              </Button>
            </div>
          </Card>

          <Card variant="bordered" class="p-6">
            <div class="flex items-start gap-3">
              <BellRing class="h-5 w-5 text-primary-600" aria-hidden="true" />
              <div>
                <h3 class="text-base font-semibold text-neutral-900">Notifications push</h3>
                <p class="mt-1 text-sm text-neutral-500">
                  Recevez une alerte instantanée dès qu&apos;un panier correspond à vos préférences ou lorsqu&apos;une réservation est mise à jour.
                </p>
              </div>
            </div>

            <div class="mt-5 space-y-3 text-sm text-neutral-600">
              <p class="flex items-center gap-2">
                <component
                  :is="pushSupported ? (pushPermission === 'granted' ? CheckCircle2 : AlertCircle) : BellOff"
                  class="h-4 w-4"
                  :class="pushSupported ? (pushPermission === 'granted' ? 'text-emerald-500' : 'text-amber-500') : 'text-neutral-400'"
                  aria-hidden="true"
                />
                {{ pushStatusMessage }}
              </p>
              <p v-if="pushPermission === 'denied'" class="flex items-center gap-2 text-xs text-amber-600">
                <AlertCircle class="h-4 w-4" aria-hidden="true" />
                Activez les notifications dans les paramètres de votre navigateur pour recevoir des alertes push.
              </p>
              <p v-else class="flex items-center gap-2 text-xs text-neutral-500">
                <Wifi class="h-4 w-4 text-primary-400" aria-hidden="true" />
                Les notifications push nécessitent un service worker actif et une connexion Internet.
              </p>
            </div>

            <div class="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Button
                variant="outline"
                size="sm"
                :left-icon="Smartphone"
                :disabled="!pushSupported || pushPermission === 'denied'"
                :loading="testPushLoading"
                @click="testPushSubscription"
              >
                Tester l&apos;inscription push
              </Button>
              <p class="text-xs text-neutral-500">
                Cette action vérifie que votre navigateur est bien enregistré pour les alertes en temps réel.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import {
  AlertCircle,
  Bell,
  BellOff,
  BellRing,
  CheckCircle2,
  Clock,
  Inbox,
  Mail,
  Megaphone,
  MessageSquare,
  Phone,
  RefreshCw,
  Settings2,
  Smartphone,
  Sparkles,
  Wifi
} from 'lucide-vue-next'
import Card from '@/components/ui/2025/Card.vue'
import Button from '@/components/ui/2025/Button.vue'
import Tabs, { type Tab } from '@/components/ui/2025/Tabs.vue'
import Badge from '@/components/ui/2025/Badge.vue'
import Pagination from '@/components/ui/2025/Pagination.vue'
import Loading from '@/components/ui/2025/Loading.vue'
import EmptyState from '@/components/ui/2025/EmptyState.vue'
import { useNotificationStore } from '@/stores/notification'
import { notify } from '@/composables/useNotifications'
import type { ServerNotification } from '@/services/notificationService'

const notificationStore = useNotificationStore()

const activeTab = ref<'all' | 'unread'>('all')
const isReloading = ref(false)
const savingPreferences = ref(false)
const markAsReadLoadingId = ref<number | null>(null)
const testPushLoading = ref(false)
const lastRefresh = ref<Date | null>(null)

const localPreferences = reactive({
  email: true,
  sms: false,
  push: false
})

const pushPermission = ref<NotificationPermission>('default')

const notifications = computed(() => notificationStore.serverNotifications)
const pagination = computed(() => notificationStore.pagination)
const unreadCount = computed(() => notificationStore.unreadCount)

const tabs = computed<Tab[]>(() => [
  {
    key: 'all',
    label: `Toutes (${pagination.value.total})`,
    icon: Inbox
  },
  {
    key: 'unread',
    label: `Non lues (${unreadCount.value})`,
    icon: Bell
  }
])

const preferenceOptions = [
  {
    key: 'email' as const,
    label: 'E-mails intelligents',
    description: 'Recevez un récapitulatif des confirmations de réservation et alertes importantes.',
    icon: Mail
  },
  {
    key: 'sms' as const,
    label: 'SMS de rappel',
    description: 'Un rappel la veille et le jour J pour ne plus oublier vos retraits.',
    icon: Phone
  },
  {
    key: 'push' as const,
    label: 'Notifications push instantanées',
    description: 'Soyez alerté dès qu’un panier correspondant à vos préférences est disponible.',
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

const lastRefreshLabel = computed(() => {
  if (!lastRefresh.value) {
    return 'non disponible'
  }
  return lastRefresh.value.toLocaleString('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short'
  })
})

const pushStatusMessage = computed(() => {
  if (!pushSupported.value) {
    return 'Les notifications push ne sont pas disponibles sur ce navigateur.'
  }

  if (pushPermission.value === 'granted') {
    return 'Notifications push activées sur cet appareil.'
  }

  if (pushPermission.value === 'denied') {
    return 'Notifications push désactivées dans le navigateur.'
  }

  return 'Notifications push disponibles – demande d’autorisation lors de l’activation.'
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

const formatTypeLabel = (value?: string | null) => {
  if (!value) return 'Notification GÊLADAL'
  return value
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const formatChannelLabel = (channel?: string | null) => {
  const mapping: Record<string, string> = {
    email: 'E-mail',
    sms: 'SMS',
    push: 'Push',
    web: 'Web'
  }
  return mapping[channel ?? ''] ?? 'Système'
}

const channelIcon = (channel?: string | null) => {
  switch (channel) {
    case 'email':
      return Mail
    case 'sms':
      return MessageSquare
    case 'push':
      return Smartphone
    default:
      return Megaphone
  }
}

const typeIcon = (type?: string | null) => {
  if (!type) return Bell
  if (type.includes('reservation')) return CheckCircle2
  if (type.includes('panier') || type.includes('basket')) return Sparkles
  if (type.includes('payment') || type.includes('paiement')) return Megaphone
  return Bell
}

const formatAbsoluteDate = (value?: string | null) => {
  if (!value) return 'Date inconnue'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return 'Date inconnue'
  }
  return date.toLocaleString('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short'
  })
}

const formatRelativeTime = (value?: string | null) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ''
  }
  const diffMs = date.getTime() - Date.now()
  const diffSeconds = Math.round(diffMs / 1000)
  const rtf = new Intl.RelativeTimeFormat('fr', { numeric: 'auto' })

  const divisions: Array<[number, Intl.RelativeTimeFormatUnit]> = [
    [60, 'seconds'],
    [60, 'minutes'],
    [24, 'hours'],
    [7, 'days'],
    [4.34524, 'weeks'],
    [12, 'months'],
    [Number.POSITIVE_INFINITY, 'years']
  ]

  let duration = diffSeconds
  for (const [amount, unit] of divisions) {
    if (Math.abs(duration) < amount) {
      return rtf.format(duration, unit)
    }
    duration = Math.round(duration / amount)
  }
  return rtf.format(duration, 'years')
}

const loadNotifications = async (page = 1) => {
  try {
    await notificationStore.loadNotifications({
      unread: activeTab.value === 'unread',
      page
    })
    lastRefresh.value = new Date()
  } catch (error: any) {
    notify.error(error?.message || 'Impossible de charger les notifications.', 'Notifications')
  }
}

const refreshNotifications = async () => {
  isReloading.value = true
  try {
    await loadNotifications(pagination.value.currentPage)
    notify.info('Notifications mises à jour.', 'Notifications')
  } finally {
    isReloading.value = false
  }
}

const handleTabChange = async (tab: Tab) => {
  activeTab.value = (tab.key as 'all' | 'unread') ?? 'all'
  await loadNotifications(1)
}

const handlePageChange = async (page: number) => {
  await loadNotifications(page)
}

const handleMarkAsRead = async (notification: ServerNotification) => {
  if (notification.is_read) return
  markAsReadLoadingId.value = notification.id
  try {
    await notificationStore.markAsRead(notification.id)
    notify.success('Notification marquée comme lue.', 'Notifications')
  } catch (error: any) {
    notify.error(error?.message || 'Impossible de mettre à jour la notification.', 'Notifications')
  } finally {
    markAsReadLoadingId.value = null
  }
}

const handleMarkAllAsRead = async () => {
  if (!unreadCount.value) return
  try {
    await notificationStore.markAllAsRead()
    notify.success('Toutes les notifications ont été marquées comme lues.', 'Notifications')
  } catch (error: any) {
    notify.error(error?.message || 'Impossible de marquer toutes les notifications comme lues.', 'Notifications')
  }
}

const handleSavePreferences = async () => {
  if (savingPreferences.value || !preferencesDirty.value) {
    return
  }

  const payload = {
    email: localPreferences.email,
    sms: localPreferences.sms,
    push: localPreferences.push
  }

  if (payload.push) {
    if (!pushSupported.value) {
      notify.warning('Votre navigateur ne supporte pas les notifications push.', 'Notifications')
      payload.push = false
      localPreferences.push = false
    } else if (pushPermission.value === 'denied') {
      notify.error('Veuillez autoriser les notifications dans votre navigateur avant d’activer le push.', 'Notifications')
      payload.push = false
      localPreferences.push = false
    }
  }

  savingPreferences.value = true
  try {
    const updated = await notificationStore.savePreferences(payload)
    localPreferences.email = updated.email
    localPreferences.sms = updated.sms
    localPreferences.push = updated.push
    notify.success('Préférences mises à jour.', 'Notifications')

    if (updated.push) {
      const subscription = await notificationStore.ensurePushSubscription()
      updatePushPermission()
      if (!subscription) {
        notify.warning('Impossible d’activer les notifications push sur ce navigateur.', 'Notifications')
        localPreferences.push = false
        await notificationStore.savePreferences({
          email: updated.email,
          sms: updated.sms,
          push: false
        })
        updatePushPermission()
      }
    }
  } catch (error: any) {
    notify.error(error?.message || 'Erreur lors de la sauvegarde des préférences.', 'Notifications')
  } finally {
    savingPreferences.value = false
  }
}

const testPushSubscription = async () => {
  if (!pushSupported.value || pushPermission.value === 'denied') {
    return
  }

  testPushLoading.value = true
  try {
    const subscription = await notificationStore.ensurePushSubscription()
    updatePushPermission()
    if (subscription) {
      notify.success('Votre navigateur est bien enregistré pour les notifications push.', 'Notifications')
    } else {
      notify.warning('Impossible de confirmer l’enregistrement push.', 'Notifications')
    }
  } catch (error: any) {
    notify.error(error?.message || 'Impossible de vérifier les notifications push.', 'Notifications')
  } finally {
    testPushLoading.value = false
  }
}

watch(
  () => ({
    email: notificationStore.preferences.email,
    sms: notificationStore.preferences.sms,
    push: notificationStore.preferences.push
  }),
  () => {
    syncPreferences()
  },
  { immediate: true }
)

onMounted(async () => {
  notificationStore.hydratePreferencesFromUser()
  syncPreferences()
  updatePushPermission()
  await loadNotifications()
})
</script>
