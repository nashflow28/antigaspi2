<template>
  <DashboardLayout
    :sidebar="sidebar"
    :header="header"
    :mobile-nav="mobileNav"
    class="bg-gradient-to-br from-surface-light via-surface-light to-primary-50 dark:from-surface-dark dark:via-surface-darker dark:to-primary-950"
  >
    <div class="mx-auto w-full max-w-7xl space-y-8 px-3 py-6 sm:px-6 sm:py-8">
      <DashboardHeader
        data-testid="merchants-header"
        eyebrow="Administration"
        title="Modération des commerçants"
        subtitle="Gérez les demandes d'inscription et surveillez l'activité des commerçants"
      >
        <template #actions>
          <Button
            variant="secondary"
            size="lg"
            class="gap-2"
            :loading="loading"
            @click="refreshData"
          >
            <ArrowPathIcon class="h-5 w-5" />
            Actualiser
          </Button>
        </template>
      </DashboardHeader>

      <StatCardGrid
        data-testid="merchants-stats-grid"
        :columns="'grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4'"
      >
        <StatCard
          title="Commerçants actifs"
          :value="formatNumber(stats.activeMerchants)"
          description="Partenaires disponibles"
          :icon="BuildingStorefrontIcon"
          accent="success"
        />
        <StatCard
          title="En attente"
          :value="formatNumber(stats.pendingMerchants)"
          description="Demandes à valider"
          :icon="ClockIcon"
          accent="warning"
        />
        <StatCard
          title="Produits publiés"
          :value="formatNumber(stats.totalProducts)"
          description="Offres à modérer"
          :icon="CubeIcon"
          accent="info"
        />
        <StatCard
          title="Réservations"
          :value="formatNumber(stats.totalReservations)"
          description="Signalements reçus"
          :icon="TicketIcon"
          accent="primary"
        />
      </StatCardGrid>

      <section class="space-y-6" data-testid="merchants-moderation">
        <DashboardTabs
          v-model="activeTab"
          data-testid="merchants-tabs"
          :tabs="moderationTabs"
        />

        <Loading
          v-if="loading"
          text="Chargement des données de modération..."
          variant="primary"
          centered
        />

        <template v-else>
          <Card
            v-if="activeTab === 'pending'"
            data-testid="pending-merchants-section"
            variant="glass"
          >
            <template #header>
              <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 class="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
                    Demandes d'inscription en attente
                  </h3>
                  <p class="text-sm text-neutral-500 dark:text-neutral-400">
                    Vérifiez les informations avant d'activer un nouveau commerçant
                  </p>
                </div>
                <Badge variant="warning" size="sm" class="uppercase tracking-wide">
                  {{ formatNumber(pendingMerchants.length) }} en attente
                </Badge>
              </div>
            </template>

            <EmptyState
              v-if="pendingMerchants.length === 0"
              title="Aucune demande en attente"
              description="Les nouvelles demandes apparaîtront ici dès leur réception."
              :icon="UsersIcon"
            />

            <Grid
              v-else
              data-testid="pending-merchants-list"
              :cols="1"
              :cols-md="2"
              gap="lg"
            >
              <Card
                v-for="merchant in pendingMerchants"
                :key="merchant.id"
                variant="bordered"
                class="h-full"
              >
                <div class="flex flex-col gap-4">
                  <div class="flex flex-col gap-3">
                    <div class="flex items-center justify-between gap-3">
                      <div>
                        <h4 class="text-base font-semibold text-neutral-900 dark:text-neutral-50">
                          {{ merchant.business_name }}
                        </h4>
                        <p class="text-sm text-neutral-500 dark:text-neutral-400">
                          {{ merchant.business_type }}
                        </p>
                      </div>
                      <Badge variant="info" size="sm">{{ formatDate(merchant.created_at) }}</Badge>
                    </div>
                    <div class="space-y-2 text-sm text-neutral-600 dark:text-neutral-300">
                      <div class="flex items-center gap-2">
                        <UserIcon class="h-4 w-4 text-primary-500" />
                        <span>{{ merchant.owner_name }}</span>
                      </div>
                      <div class="flex items-center gap-2">
                        <EnvelopeIcon class="h-4 w-4 text-primary-500" />
                        <span>{{ merchant.email }}</span>
                      </div>
                      <div class="flex items-center gap-2">
                        <PhoneIcon class="h-4 w-4 text-primary-500" />
                        <span>{{ merchant.phone }}</span>
                      </div>
                      <div class="flex items-start gap-2">
                        <MapPinIcon class="mt-0.5 h-4 w-4 text-primary-500" />
                        <span>{{ merchant.address }}</span>
                      </div>
                    </div>
                    <p class="text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
                      {{ merchant.description }}
                    </p>
                  </div>

                  <div class="flex flex-col gap-2 sm:flex-row sm:justify-end">
                    <Button
                      variant="success"
                      size="sm"
                      class="gap-2"
                      @click="approveMerchant(merchant)"
                    >
                      <CheckCircleIcon class="h-4 w-4" />
                      Approuver
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      class="gap-2"
                      @click="rejectMerchant(merchant)"
                    >
                      <XCircleIcon class="h-4 w-4" />
                      Rejeter
                    </Button>
                  </div>
                </div>
              </Card>
            </Grid>
          </Card>

          <Card
            v-else-if="activeTab === 'products'"
            data-testid="products-moderation-section"
            variant="glass"
          >
            <template #header>
              <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 class="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
                    Produits à modérer
                  </h3>
                  <p class="text-sm text-neutral-500 dark:text-neutral-400">
                    Validez la conformité des offres et leur contenu
                  </p>
                </div>
                <Badge variant="info" size="sm" class="uppercase tracking-wide">
                  {{ formatNumber(productsToModerate.length) }} produits
                </Badge>
              </div>
            </template>

            <EmptyState
              v-if="productsToModerate.length === 0"
              title="Aucun produit à modérer"
              description="Tous les produits soumis ont déjà été traités."
              :icon="CubeIcon"
            />

            <Grid
              v-else
              data-testid="products-list"
              :cols="1"
              :cols-md="2"
              gap="lg"
            >
              <Card
                v-for="product in productsToModerate"
                :key="product.id"
                variant="bordered"
                class="h-full"
              >
                <div class="flex flex-col gap-4">
                  <div class="overflow-hidden rounded-2xl border border-neutral-200/60 dark:border-neutral-700/60">
                    <img
                      :src="product.image_url"
                      :alt="product.name"
                      class="h-40 w-full object-cover"
                      loading="lazy"
                    >
                  </div>
                  <div class="space-y-2">
                    <div class="flex items-center justify-between gap-3">
                      <div>
                        <h4 class="text-base font-semibold text-neutral-900 dark:text-neutral-50">
                          {{ product.name }}
                        </h4>
                        <p class="text-sm text-neutral-500 dark:text-neutral-400">
                          {{ product.merchant_name }}
                        </p>
                      </div>
                      <Badge variant="primary" size="sm">
                        {{ product.category }}
                      </Badge>
                    </div>
                    <p class="text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
                      {{ product.description }}
                    </p>
                    <p class="text-lg font-semibold text-primary-600 dark:text-primary-300">
                      {{ product.price ? formatPrice(product.price) : '0' }} F CFA
                    </p>
                  </div>
                  <div class="flex flex-col gap-2 sm:flex-row sm:justify-end">
                    <Button
                      variant="success"
                      size="sm"
                      class="gap-2"
                      @click="approveProduct(product)"
                    >
                      <CheckCircleIcon class="h-4 w-4" />
                      Publier
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      class="gap-2"
                      @click="rejectProduct(product)"
                    >
                      <XCircleIcon class="h-4 w-4" />
                      Rejeter
                    </Button>
                  </div>
                </div>
              </Card>
            </Grid>
          </Card>

          <Card
            v-else
            data-testid="reservations-moderation-section"
            variant="glass"
          >
            <template #header>
              <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 class="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
                    Réservations signalées
                  </h3>
                  <p class="text-sm text-neutral-500 dark:text-neutral-400">
                    Analysez les signalements des utilisateurs et prenez les mesures nécessaires
                  </p>
                </div>
                <Badge variant="error" size="sm" class="uppercase tracking-wide">
                  {{ formatNumber(flaggedReservations.length) }} signalements
                </Badge>
              </div>
            </template>

            <EmptyState
              v-if="flaggedReservations.length === 0"
              title="Aucun signalement actif"
              description="Continuez de surveiller les réservations pour maintenir un haut niveau de confiance."
              :icon="ShieldExclamationIcon"
            />

            <div
              v-else
              data-testid="reservations-list"
              class="space-y-4"
            >
              <Card
                v-for="reservation in flaggedReservations"
                :key="reservation.id"
                variant="bordered"
              >
                <div class="flex flex-col gap-3">
                  <div class="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h4 class="text-base font-semibold text-neutral-900 dark:text-neutral-50">
                        {{ reservation.product_name }}
                      </h4>
                      <p class="text-sm text-neutral-500 dark:text-neutral-400">
                        {{ reservation.customer_name }} • {{ reservation.merchant_name }}
                      </p>
                    </div>
                    <Badge variant="warning" size="sm">
                      {{ reservation.flag_reason }}
                    </Badge>
                  </div>
                  <div class="flex flex-wrap items-center gap-4 text-sm text-neutral-600 dark:text-neutral-300">
                    <div class="flex items-center gap-2">
                      <CreditCardIcon class="h-4 w-4 text-primary-500" />
                      <span>{{ reservation.total_price ? formatPrice(reservation.total_price) : '0' }} F CFA</span>
                    </div>
                    <div class="flex items-center gap-2">
                      <CalendarDaysIcon class="h-4 w-4 text-primary-500" />
                      <span>{{ formatDate(reservation.created_at) }}</span>
                    </div>
                  </div>
                  <div class="flex flex-col gap-2 sm:flex-row sm:justify-end">
                    <Button
                      variant="success"
                      size="sm"
                      class="gap-2"
                      @click="resolveReservation(reservation)"
                    >
                      <ShieldCheckIcon class="h-4 w-4" />
                      Résoudre
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      class="gap-2 text-neutral-600 hover:text-neutral-800 dark:text-neutral-300"
                      @click="dismissReservation(reservation)"
                    >
                      <ArrowUturnLeftIcon class="h-4 w-4" />
                      Ignorer
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </Card>
        </template>
      </section>
    </div>

    <ConfirmDialog
      :is-open="confirmModal.isOpen"
      :type="confirmModal.type"
      :title="confirmModal.title"
      :message="confirmModal.message"
      :confirm-text="confirmModal.confirmText"
      :cancel-text="confirmModal.cancelText"
      @confirm="confirmModal.onConfirm"
      @cancel="closeConfirmModal"
      @update:is-open="(v) => confirmModal.isOpen = v"
    />

    <Teleport to="body">
      <div class="fixed top-4 right-4 z-[110] space-y-3">
        <TransitionGroup name="toast">
          <Alert
            v-for="notification in notifications"
            :key="notification.id"
            :variant="notification.type"
            :title="notification.title"
            :description="notification.message"
            dismissible
            @dismiss="removeNotification(notification.id)"
          />
        </TransitionGroup>
      </div>
    </Teleport>
  </DashboardLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  ArrowPathIcon,
  BuildingStorefrontIcon,
  ClockIcon,
  CubeIcon,
  TicketIcon,
  UsersIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  CheckCircleIcon,
  XCircleIcon,
  ShieldExclamationIcon,
  ShieldCheckIcon,
  CalendarDaysIcon,
  CreditCardIcon,
  ArrowUturnLeftIcon
} from '@heroicons/vue/24/outline'
import apiService from '@/services/api'
import DashboardLayout from '@/components/ui/2025/DashboardLayout.vue'
import { Button, Card, Badge, EmptyState, Grid, Loading, ConfirmDialog, Alert } from '@/components/ui/2025'
import {
  DashboardHeader,
  StatCard,
  StatCardGrid,
  DashboardTabs
} from '@/components/dashboard/2025'
import type { DashboardTab } from '@/components/dashboard/2025/DashboardTabs.vue'
import { useDashboardLayout } from '@/composables/useDashboardLayout'

interface ModerationStats {
  activeMerchants: number
  pendingMerchants: number
  totalProducts: number
  totalReservations: number
}

interface PendingMerchant {
  id: number
  business_name: string
  owner_name: string
  email: string
  phone: string
  address: string
  business_type: string
  description: string
  created_at: string
}

interface ProductToModerate {
  id: number
  name: string
  merchant_name: string
  price: number
  image_url: string
  description: string
  category: string
}

interface FlaggedReservation {
  id: number
  product_name: string
  customer_name: string
  merchant_name: string
  total_price: number
  flag_reason: string
  created_at: string
}

interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
}

interface ConfirmModalData {
  isOpen: boolean
  type: 'danger' | 'success' | 'warning'
  title: string
  message: string
  confirmText: string
  cancelText: string
  onConfirm: () => void
}

const defaultModerationStats: ModerationStats = {
  activeMerchants: 0,
  pendingMerchants: 0,
  totalProducts: 0,
  totalReservations: 0
}

const stats = ref<ModerationStats>({ ...defaultModerationStats })

const activeTab = ref('pending')
const loading = ref(false)

const notifications = ref<Notification[]>([])

const confirmModal = ref<ConfirmModalData>({
  isOpen: false,
  type: 'warning',
  title: '',
  message: '',
  confirmText: 'Confirmer',
  cancelText: 'Annuler',
  onConfirm: () => {}
})

const { sidebar, header, mobileNav } = useDashboardLayout('admin')

const pendingMerchants = ref<PendingMerchant[]>([])
const productsToModerate = ref<ProductToModerate[]>([])
const flaggedReservations = ref<FlaggedReservation[]>([])

const moderationTabs = computed<DashboardTab[]>(() => [
  {
    key: 'pending',
    label: 'Commerçants en attente',
    count: pendingMerchants.value.length,
    description: 'Examinez chaque demande avant de la rendre visible sur la plateforme'
  },
  {
    key: 'products',
    label: 'Produits à modérer',
    count: productsToModerate.value.length,
    description: 'Validez la qualité et la conformité des offres publiées'
  },
  {
    key: 'reservations',
    label: 'Réservations signalées',
    count: flaggedReservations.value.length,
    description: 'Analysez les signalements pour assurer une expérience fiable'
  }
])

const numberFormatter = new Intl.NumberFormat('fr-FR')
const formatNumber = (value: number) => numberFormatter.format(value)

const formatDate = (dateString?: string | null): string => {
  if (!dateString) {
    return '—'
  }
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) {
    return '—'
  }
  return date.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatPrice = (price: number): string => {
  return numberFormatter.format(price ?? 0)
}

const loadModerationData = async ({ notifyOnError = true }: { notifyOnError?: boolean } = {}) => {
  loading.value = true
  try {
    const response = await apiService.getAdminModerationData()

    if (!response.success) {
      throw new Error(response.message || 'Erreur lors du chargement des données de modération')
    }

    const payload = response.data ?? {
      stats: defaultModerationStats,
      pendingMerchants: [],
      productsToModerate: [],
      flaggedReservations: []
    }

    const statsData = payload.stats ?? defaultModerationStats
    stats.value = {
      activeMerchants: statsData.activeMerchants ?? defaultModerationStats.activeMerchants,
      pendingMerchants: statsData.pendingMerchants ?? defaultModerationStats.pendingMerchants,
      totalProducts: statsData.totalProducts ?? defaultModerationStats.totalProducts,
      totalReservations: statsData.totalReservations ?? defaultModerationStats.totalReservations
    }

    const pending = Array.isArray(payload.pendingMerchants)
      ? payload.pendingMerchants
      : Array.isArray((payload as Record<string, unknown>).pending_merchants)
        ? (payload as Record<string, unknown>).pending_merchants
        : []
    pendingMerchants.value = pending as PendingMerchant[]

    const products = Array.isArray(payload.productsToModerate)
      ? payload.productsToModerate
      : Array.isArray((payload as Record<string, unknown>).products_to_moderate)
        ? (payload as Record<string, unknown>).products_to_moderate
        : []
    productsToModerate.value = products as ProductToModerate[]

    const reservations = Array.isArray(payload.flaggedReservations)
      ? payload.flaggedReservations
      : Array.isArray((payload as Record<string, unknown>).flagged_reservations)
        ? (payload as Record<string, unknown>).flagged_reservations
        : []
    flaggedReservations.value = reservations as FlaggedReservation[]

    return response
  } catch (error) {
    if (notifyOnError) {
      const message = error instanceof Error
        ? error.message
        : 'Une erreur est survenue lors du chargement des données de modération.'
      showNotification('error', 'Erreur de chargement', message)
    }
    throw error
  } finally {
    loading.value = false
  }
}

const refreshData = async () => {
  showNotification('info', 'Actualisation', 'Chargement des données...')
  try {
    const response = await loadModerationData({ notifyOnError: false })
    const successMessage = response?.message || 'Les données ont été rechargées avec succès.'
    showNotification('success', 'Actualisation terminée', successMessage)
  } catch (error) {
    const message = error instanceof Error
      ? error.message
      : 'Une erreur est survenue lors de l’actualisation des données.'
    showNotification('error', 'Actualisation impossible', message)
  }
}

const showNotification = (type: Notification['type'], title: string, message: string) => {
  const notification: Notification = {
    id: Date.now().toString(),
    type,
    title,
    message
  }
  notifications.value.push(notification)
}

const removeNotification = (id: string) => {
  const index = notifications.value.findIndex(n => n.id === id)
  if (index > -1) {
    notifications.value.splice(index, 1)
  }
}

const showConfirmModal = (
  type: ConfirmModalData['type'],
  title: string,
  message: string,
  onConfirm: () => void,
  confirmText = 'Confirmer',
  cancelText = 'Annuler'
) => {
  confirmModal.value.isOpen = true
  confirmModal.value.type = type
  confirmModal.value.title = title
  confirmModal.value.message = message
  confirmModal.value.confirmText = confirmText
  confirmModal.value.cancelText = cancelText
  confirmModal.value.onConfirm = () => {
    onConfirm()
    closeConfirmModal()
  }
}

const closeConfirmModal = () => {
  confirmModal.value.isOpen = false
}

const approveMerchant = async (merchant: PendingMerchant) => {
  showConfirmModal(
    'success',
    'Approuver le commerçant',
    `Êtes-vous sûr de vouloir approuver la demande d'inscription de ${merchant.business_name} ?`,
    async () => {
      try {
        const response = await apiService.approveMerchant(merchant.id)

        if (!response.success) {
          throw new Error(response.message || "Erreur lors de l'approbation")
        }

        pendingMerchants.value = pendingMerchants.value.filter(m => m.id !== merchant.id)
        stats.value.pendingMerchants = Math.max(0, stats.value.pendingMerchants - 1)
        stats.value.activeMerchants = Math.max(0, stats.value.activeMerchants + 1)
        showNotification('success', 'Commerçant approuvé', response.message ?? `${merchant.business_name} a été approuvé avec succès.`)
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Erreur inconnue'
        showNotification('error', "Erreur d'approbation", `Impossible d'approuver ${merchant.business_name}. ${message}`)
      }
    },
    'Approuver',
    'Annuler'
  )
}

const rejectMerchant = async (merchant: PendingMerchant) => {
  showConfirmModal(
    'danger',
    'Rejeter le commerçant',
    `Êtes-vous sûr de vouloir rejeter la demande d'inscription de ${merchant.business_name} ? Cette action peut être définitive.`,
    async () => {
      try {
        const response = await apiService.rejectMerchant(merchant.id, { reason: "Rejeté par l'administrateur" })

        if (!response.success) {
          throw new Error(response.message || 'Erreur lors du rejet')
        }

        pendingMerchants.value = pendingMerchants.value.filter(m => m.id !== merchant.id)
        stats.value.pendingMerchants = Math.max(0, stats.value.pendingMerchants - 1)
        showNotification('success', 'Commerçant rejeté', response.message ?? `${merchant.business_name} a été rejeté.`)
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Erreur inconnue'
        showNotification('error', 'Erreur de rejet', `Impossible de rejeter ${merchant.business_name}. ${message}`)
      }
    },
    'Rejeter',
    'Annuler'
  )
}

const approveProduct = async (product: ProductToModerate) => {
  showConfirmModal(
    'success',
    'Approuver le produit',
    `Valider la mise en ligne de ${product.name} ?`,
    async () => {
      try {
        const response = await apiService.approveProduct(product.id)

        if (!response.success) {
          throw new Error(response.message || "Erreur lors de l'approbation")
        }

        productsToModerate.value = productsToModerate.value.filter(p => p.id !== product.id)
        stats.value.totalProducts = Math.max(0, stats.value.totalProducts - 1)
        showNotification('success', 'Produit approuvé', response.message ?? `${product.name} est désormais publié.`)
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Erreur inconnue'
        showNotification('error', "Erreur d'approbation", `Impossible d'approuver ${product.name}. ${message}`)
      }
    },
    'Publier',
    'Annuler'
  )
}

const rejectProduct = async (product: ProductToModerate) => {
  showConfirmModal(
    'danger',
    'Rejeter le produit',
    `Êtes-vous sûr de vouloir rejeter ${product.name} ?`,
    async () => {
      try {
        const response = await apiService.rejectProduct(product.id, { reason: 'Produit non conforme' })

        if (!response.success) {
          throw new Error(response.message || 'Erreur lors du rejet')
        }

        productsToModerate.value = productsToModerate.value.filter(p => p.id !== product.id)
        stats.value.totalProducts = Math.max(0, stats.value.totalProducts - 1)
        showNotification('success', 'Produit rejeté', response.message ?? `${product.name} a été retiré de la modération.`)
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Erreur inconnue'
        showNotification('error', 'Erreur de rejet', `Impossible de rejeter ${product.name}. ${message}`)
      }
    },
    'Rejeter',
    'Annuler'
  )
}

const resolveReservation = async (reservation: FlaggedReservation) => {
  showConfirmModal(
    'success',
    'Résoudre le signalement',
    `Marquer le signalement pour ${reservation.product_name} comme résolu ?`,
    async () => {
      try {
        const response = await apiService.resolveReservationFlag(reservation.id)

        if (!response.success) {
          throw new Error(response.message || 'Erreur lors de la résolution')
        }

        flaggedReservations.value = flaggedReservations.value.filter(r => r.id !== reservation.id)
        stats.value.totalReservations = Math.max(0, stats.value.totalReservations - 1)
        showNotification('success', 'Signalement résolu', response.message ?? `${reservation.product_name} a été marqué comme résolu.`)
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Erreur inconnue'
        showNotification('error', 'Erreur de résolution', `Impossible de résoudre le signalement. ${message}`)
      }
    },
    'Résoudre',
    'Annuler'
  )
}

const dismissReservation = async (reservation: FlaggedReservation) => {
  showConfirmModal(
    'warning',
    'Ignorer le signalement',
    `Ignorer le signalement concernant ${reservation.product_name} ?`,
    async () => {
      flaggedReservations.value = flaggedReservations.value.filter(r => r.id !== reservation.id)
      stats.value.totalReservations--
      showNotification('info', 'Signalement ignoré', `${reservation.product_name} a été retiré de la liste des signalements.`)
    },
    'Ignorer',
    'Annuler'
  )
}

onMounted(async () => {
  try {
    await loadModerationData()
  } catch (error) {
    // Les erreurs sont déjà notifiées par loadModerationData
  }
})
</script>
