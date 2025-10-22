<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 px-4 py-10 sm:px-6 lg:px-8">
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
          Retour à mon espace
        </Button>
        <h1 class="text-3xl font-semibold text-neutral-900">Mes notifications</h1>
        <p class="max-w-3xl text-sm text-neutral-600">
          Retrouvez l&apos;ensemble de vos alertes Antigaspi : réservations, rappels de retrait, offres personnalisées et messages importants.
        </p>
      </div>

      <Card variant="elevated" class="overflow-hidden">
        <div class="bg-gradient-to-r from-blue-600/95 to-indigo-600/90 px-6 py-8 text-white sm:px-8 sm:py-10">
          <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p class="text-xs font-semibold uppercase tracking-wide text-blue-100">Centre d&apos;alertes</p>
              <h2 class="text-2xl font-semibold">Historique et rappels</h2>
              <p class="mt-2 max-w-2xl text-sm text-blue-100/85">
                Filtrez vos messages, marquez-les comme lus et gérez vos préférences de contact depuis une interface dédiée.
              </p>
            </div>
            <div class="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm">
              <p class="flex items-center gap-2">
                <Clock class="h-4 w-4" aria-hidden="true" />
                Dernière actualisation
              </p>
              <p class="mt-1 text-base font-semibold">{{ lastRefreshLabel }}</p>
            </div>
          </div>
        </div>

        <div class="px-6 pb-10 pt-8 sm:px-10 sm:pb-12 sm:pt-10">
          <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Tabs
              v-model="activeTab"
              :tabs="tabs"
              class="flex-1"
              @tab-change="handleTabChange"
            />

            <div class="flex flex-wrap items-center gap-2">
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
              <Button
                variant="ghost"
                size="sm"
                tag="router-link"
                to="/notifications/settings"
              >
                Préférences
              </Button>
            </div>
          </div>

          <div class="mt-6 space-y-4">
            <Loading v-if="notificationStore.loading && !notifications.length" type="skeleton" :skeleton-lines="4" />

            <template v-else-if="!notifications.length">
              <EmptyState
                variant="illustration"
                title="Aucune notification ici"
                description="Vous serez averti dès qu&apos;une nouvelle activité survient. Pensez à vérifier vos préférences pour ne rien manquer."
                :primary-action="{
                  text: 'Actualiser',
                  variant: 'primary',
                  loading: isReloading,
                  onClick: refreshNotifications
                }"
              >
                <template #icon>
                  <BellOff class="h-12 w-12 text-blue-500" aria-hidden="true" />
                </template>
              </EmptyState>
            </template>

            <div v-else class="space-y-4">
              <article
                v-for="notification in notifications"
                :key="notification.id"
                :class="[
                  'rounded-3xl border p-5 transition-shadow duration-200',
                  notification.is_read
                    ? 'bg-white border-neutral-200 hover:shadow-lg'
                    : 'border-blue-200/70 bg-blue-50/70 shadow-blue-200/40 hover:shadow-xl'
                ]"
              >
                <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div class="space-y-3">
                    <div class="flex items-start gap-3">
                      <span class="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/30">
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
                        <component :is="channelIcon(notification.sent_via)" class="h-4 w-4 text-blue-500" aria-hidden="true" />
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
  ArrowLeft,
  Bell,
  BellOff,
  CheckCircle2,
  Clock,
  Inbox,
  Mail,
  Megaphone,
  MessageSquare,
  RefreshCw,
  Smartphone,
  Sparkles
} from 'lucide-vue-next'
import Button from '@/components/ui/2025/Button.vue'
import Card from '@/components/ui/2025/Card.vue'
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
const markAsReadLoadingId = ref<number | null>(null)
const lastRefresh = ref<Date | null>(null)

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

const lastRefreshLabel = computed(() => {
  if (!lastRefresh.value) {
    return 'Non actualisé'
  }

  return lastRefresh.value.toLocaleString('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short'
  })
})

const formatTypeLabel = (value?: string | null) => {
  if (!value) return 'Notification Antigaspi'
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

onMounted(async () => {
  if (!notifications.value.length) {
    await loadNotifications()
  } else {
    lastRefresh.value = new Date()
  }
})
</script>
