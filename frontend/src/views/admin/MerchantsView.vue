<template>
  <DashboardLayout
    :sidebar="sidebar"
    :header="header"
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
          data-testid="merchants-tabs"
          v-model="activeTab"
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
              cols="1"
              colsMd="2"
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
              cols="1"
              colsMd="2"
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

    <ConfirmModal
      :is-open="confirmModal.value.isOpen"
      :type="confirmModal.value.type"
      :title="confirmModal.value.title"
      :message="confirmModal.value.message"
      :confirm-text="confirmModal.value.confirmText"
      :cancel-text="confirmModal.value.cancelText"
      @confirm="confirmModal.value.onConfirm"
      @cancel="closeConfirmModal"
    />

    <div class="fixed top-4 right-4 z-[110] space-y-3">
      <NotificationToast
        v-for="notification in notifications"
        :key="notification.id"
        :type="notification.type"
        :title="notification.title"
        :message="notification.message"
        @close="removeNotification(notification.id)"
      />
    </div>
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
import ConfirmModal from '@/components/ui/ConfirmModal.vue'
import NotificationToast from '@/components/ui/NotificationToast.vue'
import DashboardLayout from '@/components/ui/DashboardLayout.vue'
import { Button, Card, Badge, EmptyState, Grid, Loading } from '@/components/ui/2025'
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

const stats = ref<ModerationStats>({
  activeMerchants: 0,
  pendingMerchants: 0,
  totalProducts: 0,
  totalReservations: 0
})

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

const { sidebar, header } = useDashboardLayout('admin')

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

const loadModerationData = async () => {
  loading.value = true
  try {
    const response = await fetch('http://localhost:8000/api/admin/moderation', {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${localStorage.getItem('auth_token')}`
      }
    })
    const data = await response.json()

    if (data.success) {
      stats.value = data.stats
      pendingMerchants.value = data.pendingMerchants
      productsToModerate.value = data.productsToModerate
      flaggedReservations.value = data.flaggedReservations
    } else {
      throw new Error(data.message || 'Erreur API')
    }
  } catch (error) {
    showNotification('error', 'Erreur de chargement', 'Impossible de charger les données. Utilisation des données de démonstration.')
    loadDemoData()
  } finally {
    loading.value = false
  }
}

const loadDemoData = () => {
  stats.value = {
    activeMerchants: 18,
    pendingMerchants: 3,
    totalProducts: 124,
    totalReservations: 12
  }

  pendingMerchants.value = [
    {
      id: 1,
      business_name: 'Boulangerie du Centre',
      owner_name: 'Kouamé Isabelle',
      email: 'isabelle@boulangerieducentre.ci',
      phone: '+225 07 23 45 67 89',
      address: 'Plateau, Abidjan',
      business_type: 'Boulangerie artisanale',
      description: 'Pains et viennoiseries artisanales préparées chaque matin avec des ingrédients locaux.',
      created_at: '2024-09-14T09:30:00Z'
    },
    {
      id: 2,
      business_name: 'Fruits & Fraîcheur',
      owner_name: 'Traoré Mamadou',
      email: 'contact@fruitsfraicheur.ci',
      phone: '+225 05 11 22 33 44',
      address: 'Yopougon, Abidjan',
      business_type: 'Primeur',
      description: 'Sélection de fruits et légumes de saison issus de producteurs locaux.',
      created_at: '2024-09-13T14:15:00Z'
    },
    {
      id: 3,
      business_name: 'Saveurs d\'Afrique',
      owner_name: 'Diabaté Aminata',
      email: 'hello@saveursdafrique.ci',
      phone: '+225 07 98 76 54 32',
      address: 'Cocody, Abidjan',
      business_type: 'Restaurant',
      description: 'Cuisine fusion africaine avec des menus anti-gaspillage créatifs.',
      created_at: '2024-09-12T11:20:00Z'
    }
  ]

  productsToModerate.value = [
    {
      id: 1,
      name: 'Assortiment de viennoiseries',
      merchant_name: 'Boulangerie du Centre',
      price: 2500,
      image_url: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=600&q=80',
      description: 'Lot de 6 viennoiseries du jour à récupérer avant 18h.',
      category: 'Boulangerie'
    },
    {
      id: 2,
      name: 'Panier de fruits de saison',
      merchant_name: 'Fruits & Fraîcheur',
      price: 3500,
      image_url: 'https://images.unsplash.com/photo-1582407947304-fd86f028f716?auto=format&fit=crop&w=600&q=80',
      description: 'Panier composé de fruits variés en fin de marché.',
      category: 'Primeur'
    }
  ]

  flaggedReservations.value = [
    {
      id: 1,
      product_name: 'Pain artisanal',
      customer_name: 'Kouassi Jean',
      merchant_name: 'Boulangerie du Centre',
      total_price: 500,
      flag_reason: 'Produit non conforme',
      created_at: '2024-09-13T14:20:00Z'
    },
    {
      id: 2,
      product_name: 'Fruits de saison',
      customer_name: 'Marie Ouattara',
      merchant_name: 'Marché Fruits',
      total_price: 1200,
      flag_reason: 'Problème de livraison',
      created_at: '2024-09-14T10:45:00Z'
    }
  ]
}

const refreshData = async () => {
  showNotification('info', 'Actualisation', 'Chargement des données...')
  await loadModerationData()
  showNotification('success', 'Actualisation terminée', 'Les données ont été rechargées avec succès.')
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
        const response = await fetch(`http://localhost:8000/api/admin/merchants/${merchant.id}/approve`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${localStorage.getItem('auth_token')}`
          }
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()

        if (data.success) {
          pendingMerchants.value = pendingMerchants.value.filter(m => m.id !== merchant.id)
          stats.value.pendingMerchants--
          stats.value.activeMerchants++
          showNotification('success', 'Commerçant approuvé', `${merchant.business_name} a été approuvé avec succès.`)
        } else {
          throw new Error(data.message || "Erreur lors de l'approbation")
        }
      } catch (error) {
        showNotification('error', "Erreur d'approbation", `Impossible d'approuver ${merchant.business_name}. ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
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
        const response = await fetch(`http://localhost:8000/api/admin/merchants/${merchant.id}/reject`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${localStorage.getItem('auth_token')}`
          },
          body: JSON.stringify({ reason: "Rejeté par l'administrateur" })
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()

        if (data.success) {
          pendingMerchants.value = pendingMerchants.value.filter(m => m.id !== merchant.id)
          stats.value.pendingMerchants--
          showNotification('success', 'Commerçant rejeté', `${merchant.business_name} a été rejeté.`)
        } else {
          throw new Error(data.message || 'Erreur lors du rejet')
        }
      } catch (error) {
        showNotification('error', 'Erreur de rejet', `Impossible de rejeter ${merchant.business_name}. ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
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
        const response = await fetch(`http://localhost:8000/api/admin/products/${product.id}/approve`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${localStorage.getItem('auth_token')}`
          }
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()

        if (data.success) {
          productsToModerate.value = productsToModerate.value.filter(p => p.id !== product.id)
          stats.value.totalProducts--
          showNotification('success', 'Produit approuvé', `${product.name} est désormais publié.`)
        } else {
          throw new Error(data.message || "Erreur lors de l'approbation")
        }
      } catch (error) {
        showNotification('error', "Erreur d'approbation", `Impossible d'approuver ${product.name}. ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
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
        const response = await fetch(`http://localhost:8000/api/admin/products/${product.id}/reject`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${localStorage.getItem('auth_token')}`
          },
          body: JSON.stringify({ reason: 'Produit non conforme' })
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()

        if (data.success) {
          productsToModerate.value = productsToModerate.value.filter(p => p.id !== product.id)
          stats.value.totalProducts--
          showNotification('success', 'Produit rejeté', `${product.name} a été retiré de la modération.`)
        } else {
          throw new Error(data.message || 'Erreur lors du rejet')
        }
      } catch (error) {
        showNotification('error', 'Erreur de rejet', `Impossible de rejeter ${product.name}. ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
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
        const response = await fetch(`http://localhost:8000/api/admin/reservations/${reservation.id}/resolve`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${localStorage.getItem('auth_token')}`
          }
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()

        if (data.success) {
          flaggedReservations.value = flaggedReservations.value.filter(r => r.id !== reservation.id)
          stats.value.totalReservations--
          showNotification('success', 'Signalement résolu', `${reservation.product_name} a été marqué comme résolu.`)
        } else {
          throw new Error(data.message || 'Erreur lors de la résolution')
        }
      } catch (error) {
        showNotification('error', 'Erreur de résolution', `Impossible de résoudre le signalement. ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
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
  await loadModerationData()
})
</script>
