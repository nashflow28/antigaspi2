<template>
  <DashboardLayout
    :sidebar="sidebar"
    :header="header"
    class="bg-neutral-50"
  >
    <div class="max-w-full sm:max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <!-- En-tête -->
      <div class="bg-white shadow rounded-lg p-6 mb-6">
        <div class="flex items-center justify-start sm:justify-between">
          <div>
            <h1 class="text-responsive-xl font-semibold text-heading">Modération des Commerçants</h1>
            <p class="mt-1 text-responsive-sm text-muted">Gérez les demandes d'inscription et surveiller l'activité des commerçants</p>
          </div>
          <div class="flex items-center space-y-3 sm:space-y-0 sm:space-x-3">
            <button
              class="bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg flex items-center"
              @click="refreshData"
            >
              <svg
                class="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Actualiser
            </button>
          </div>
        </div>
      </div>

      <!-- Statistiques modération -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6">
        <div class="bg-white overflow-hidden sm:block shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <svg
                  class="h-10 w-10 text-orange-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-responsive-sm font-medium text-muted truncate">Commerçants Actifs</dt>
                  <dd class="text-responsive-lg font-medium text-heading">{{ stats.activeMerchants }}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white overflow-hidden sm:block shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <svg
                  class="h-10 w-10 text-warning"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-responsive-sm font-medium text-muted truncate">En Attente</dt>
                  <dd class="text-responsive-lg font-medium text-heading">{{ stats.pendingMerchants }}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white overflow-hidden sm:block shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <svg
                  class="h-10 w-10 text-success"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-responsive-sm font-medium text-muted truncate">Produits Publiés</dt>
                  <dd class="text-responsive-lg font-medium text-heading">{{ stats.totalProducts }}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white overflow-hidden sm:block shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <svg
                  class="h-10 w-10 text-info"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-responsive-sm font-medium text-muted truncate">Réservations</dt>
                  <dd class="text-responsive-lg font-medium text-heading">{{ stats.totalReservations }}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Onglets de modération -->
      <div class="bg-white shadow rounded-lg mb-6">
        <div class="border-b border-neutral-200">
          <nav class="-mb-px flex space-y-8 sm:space-y-0 sm:space-x-8 px-6">
            <button
              v-for="tab in tabs"
              :key="tab.key"
              :class="{
                'border-green-500 text-success': activeTab === tab.key,
                'border-transparent text-muted hover:text-body-emphasis hover:border-neutral-300': activeTab !== tab.key
              }"
              class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-responsive-sm"
              @click="activeTab = tab.key"
            >
              {{ tab.label }}
              <span
                v-if="tab.count > 0"
                :class="{
                  'bg-green-100 text-success': activeTab === tab.key,
                  'bg-neutral-100 text-body': activeTab !== tab.key
                }"
                class="ml-2 inline-flex items-center px-4.5 py-0.5 rounded-full text-responsive-xs font-medium"
              >
                {{ tab.count }}
              </span>
            </button>
          </nav>
        </div>

        <div class="p-6">
          <!-- Demandes d'inscription en attente -->
          <div v-if="activeTab === 'pending'" class="space-y-6">
            <h3 class="text-responsive-lg font-medium text-heading">Demandes d'inscription en attente</h3>
            <div v-if="pendingMerchants.length === 0" class="text-left sm:text-center py-6 sm:py-8">
              <svg
                class="mx-auto h-12 w-12 text-placeholder"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
              <p class="mt-2 text-responsive-sm text-muted">Aucune demande en attente</p>
            </div>
            <div v-else class="space-y-4">
              <div v-for="merchant in pendingMerchants" :key="merchant.id" class="border border-neutral-200 rounded-lg p-6">
                <div class="flex items-stretch sm:items-start justify-start sm:justify-between">
                  <div class="flex-1">
                    <h4 class="text-responsive-lg font-medium text-heading">{{ merchant.business_name }}</h4>
                    <p class="text-responsive-sm text-muted mt-1">{{ merchant.owner_name }}</p>
                    <div class="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p class="text-responsive-sm text-body"><strong>Email:</strong> {{ merchant.email }}</p>
                        <p class="text-responsive-sm text-body"><strong>Téléphone:</strong> {{ merchant.phone }}</p>
                        <p class="text-responsive-sm text-body"><strong>Adresse:</strong> {{ merchant.address }}</p>
                      </div>
                      <div>
                        <p class="text-responsive-sm text-body"><strong>Type de commerce:</strong> {{ merchant.business_type }}</p>
                        <p class="text-responsive-sm text-body"><strong>Description:</strong> {{ merchant.description }}</p>
                        <p class="text-responsive-sm text-body"><strong>Demande:</strong> {{ formatDate(merchant.created_at) }}</p>
                      </div>
                    </div>
                  </div>
                  <div class="ml-6 flex flex-col space-y-2">
                    <button
                      class="bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg text-responsive-sm"
                      @click="approveMerchant(merchant)"
                    >
                      Approuver
                    </button>
                    <button
                      class="bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg text-responsive-sm"
                      @click="rejectMerchant(merchant)"
                    >
                      Rejeter
                    </button>
                    <button
                      class="bg-neutral-600 hover:bg-neutral-700 text-white px-4 py-3 rounded-lg text-responsive-sm"
                      @click="viewMerchantDetails(merchant)"
                    >
                      Détails
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Produits à modérer -->
          <div v-if="activeTab === 'products'" class="space-y-6">
            <h3 class="text-responsive-lg font-medium text-heading">Produits à modérer</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <div v-for="product in productsToModerate" :key="product.id" class="border border-neutral-200 rounded-lg overflow-hidden sm:block">
                <div class="aspect-w-16 aspect-h-9 bg-neutral-200">
                  <img
                    v-if="product.image_url"
                    :src="product.image_url"
                    :alt="product.name"
                    class="w-full h-48 object-cover"
                  >
                  <div v-else class="w-full h-48 bg-neutral-300 flex items-center justify-center">
                    <span class="text-muted">Pas d'image</span>
                  </div>
                </div>
                <div class="p-4">
                  <h4 class="font-medium text-heading truncate">{{ product.name || 'N/A' }}</h4>
                  <p class="text-responsive-sm text-muted mt-1">{{ product.merchant_name || 'N/A' }}</p>
                  <p class="text-responsive-lg font-semibold text-success mt-2">{{ product.price ? formatPrice(product.price) : '0' }} F CFA</p>
                  <div class="mt-4 flex space-y-2 sm:space-y-0 sm:space-x-2">
                    <button
                      class="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded text-responsive-sm"
                      @click="approveProduct(product)"
                    >
                      Approuver
                    </button>
                    <button
                      class="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded text-responsive-sm"
                      @click="rejectProduct(product)"
                    >
                      Rejeter
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Réservations signalées -->
          <div v-if="activeTab === 'reservations'" class="space-y-6">
            <h3 class="text-responsive-lg font-medium text-heading">Réservations signalées</h3>
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-neutral-200">
                <thead class="bg-neutral-50">
                  <tr>
                    <th class="px-6 py-3 text-left text-responsive-xs font-medium text-muted uppercase tracking-wider">
                      Réservation
                    </th>
                    <th class="px-6 py-3 text-left text-responsive-xs font-medium text-muted uppercase tracking-wider">
                      Client
                    </th>
                    <th class="px-6 py-3 text-left text-responsive-xs font-medium text-muted uppercase tracking-wider">
                      Commerçant
                    </th>
                    <th class="px-6 py-3 text-left text-responsive-xs font-medium text-muted uppercase tracking-wider">
                      Signalement
                    </th>
                    <th class="px-6 py-3 text-left text-responsive-xs font-medium text-muted uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-neutral-200">
                  <tr v-for="reservation in flaggedReservations" :key="reservation.id">
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="text-responsive-sm font-medium text-heading">{{ reservation.product_name || 'N/A' }}</div>
                      <div class="text-responsive-sm text-muted">{{ reservation.total_price ? formatPrice(reservation.total_price) : '0' }} F CFA</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-responsive-sm text-heading">
                      {{ reservation.customer_name || 'N/A' }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-responsive-sm text-heading">
                      {{ reservation.merchant_name || 'N/A' }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span class="px-4 inline-flex text-responsive-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                        {{ reservation.flag_reason || 'Non spécifié' }}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-responsive-sm font-medium space-y-2 sm:space-y-0 sm:space-x-2">
                      <button
                        class="text-success hover:text-green-900"
                        @click="resolveReservation(reservation)"
                      >
                        Résoudre
                      </button>
                      <button
                        class="text-info hover:text-blue-900"
                        @click="viewReservationDetails(reservation)"
                      >
                        Détails
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal de confirmation -->
      <ConfirmModal
        :is-open="confirmModal.isOpen"
        :type="confirmModal.type"
        :title="confirmModal.title"
        :message="confirmModal.message"
        :confirm-text="confirmModal.confirmText"
        :cancel-text="confirmModal.cancelText"
        @confirm="confirmModal.onConfirm"
        @cancel="closeConfirmModal"
      />

      <!-- Notifications toast -->
      <div class="fixed top-4 right-4 z-[110] space-y-4">
        <NotificationToast
          v-for="notification in notifications"
          :key="notification.id"
          :type="notification.type"
          :title="notification.title"
          :message="notification.message"
          @close="removeNotification(notification.id)"
        />
      </div>
    </div>
  </DashboardLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import ConfirmModal from '@/components/ui/ConfirmModal.vue'
import NotificationToast from '@/components/ui/NotificationToast.vue'
import DashboardLayout from '@/components/ui/DashboardLayout.vue'
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

// Notification system
const notifications = ref<Notification[]>([])

// Confirm modal
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

const tabs = computed(() => [
  {
    key: 'pending',
    label: 'Commerçants en attente',
    count: pendingMerchants.value.length
  },
  {
    key: 'products',
    label: 'Produits à modérer',
    count: productsToModerate.value.length
  },
  {
    key: 'reservations',
    label: 'Réservations signalées',
    count: flaggedReservations.value.length
  }
])

const loadModerationData = async () => {
  // console.log('🔄 loadModerationData appelée')
  loading.value = true
  try {
    // console.log('📡 Appel API vers http://localhost:8000/api/admin/moderation')
    const response = await fetch('http://localhost:8000/api/admin/moderation', {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      }
    })
    const data = await response.json()
    // console.log('📥 Réponse API:', data)

    if (data.success) {
      stats.value = data.stats
      pendingMerchants.value = data.pendingMerchants
      productsToModerate.value = data.productsToModerate
      flaggedReservations.value = data.flaggedReservations
      // console.log('✅ Données chargées avec succès:', {
      //   stats: stats.value,
      //   pendingMerchants: pendingMerchants.value.length,
      //   productsToModerate: productsToModerate.value.length,
      //   flaggedReservations: flaggedReservations.value.length
      // })
    } else {
      throw new Error(data.message || 'Erreur API')
    }
  } catch (error) {
    // console.error('❌ Erreur lors du chargement:', error)
    showNotification('error', 'Erreur de chargement', 'Impossible de charger les données. Utilisation des données de démonstration.')
    loadDemoData()
  } finally {
    loading.value = false
  }
}

const loadDemoData = () => {
  stats.value = {
    activeMerchants: 156,
    pendingMerchants: 3,
    totalProducts: 247,
    totalReservations: 1034
  }

  pendingMerchants.value = [
    {
      id: 1,
      business_name: 'Supermarché Plateau',
      owner_name: 'Mamadou Koné',
      email: 'supermarche.plateau@email.com',
      phone: '+225 27 20 30 40 50',
      address: 'Plateau, Abidjan',
      business_type: 'Supermarché',
      description: 'Supermarché généraliste avec section fruits et légumes',
      created_at: '2024-09-10T13:20:00Z'
    },
    {
      id: 2,
      business_name: 'Épicerie du Quartier',
      owner_name: 'Awa Traoré',
      email: 'epicerie.quartier@email.com',
      phone: '+225 05 66 77 88 99',
      address: 'Cocody, Abidjan',
      business_type: 'Épicerie',
      description: 'Petite épicerie de proximité',
      created_at: '2024-09-12T08:15:00Z'
    },
    {
      id: 3,
      business_name: 'Pâtisserie Moderne',
      owner_name: 'Jean-Claude Bamba',
      email: 'patisserie.moderne@email.com',
      phone: '+225 07 44 55 66 77',
      address: 'Marcory, Abidjan',
      business_type: 'Pâtisserie',
      description: 'Pâtisserie artisanale avec viennoiseries fraîches',
      created_at: '2024-09-14T16:30:00Z'
    }
  ]

  productsToModerate.value = [
    {
      id: 1,
      name: 'Lot de croissants artisanaux',
      merchant_name: 'Boulangerie Martin',
      price: 800,
      image_url: 'https://images.unsplash.com/photo-1555507036-ab794f4afe8c?w=400',
      description: 'Croissants frais du matin',
      category: 'Viennoiserie'
    },
    {
      id: 2,
      name: 'Légumes biologiques variés',
      merchant_name: 'Marché Bio',
      price: 1500,
      image_url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400',
      description: 'Assortiment de légumes bio de saison',
      category: 'Légumes'
    },
    {
      id: 3,
      name: 'Yaourts nature fermiers',
      merchant_name: 'Ferme Laitière',
      price: 600,
      image_url: 'https://images.unsplash.com/photo-1571212515416-ffa4c1b7b6c4?w=400',
      description: 'Yaourts nature faits maison',
      category: 'Produits laitiers'
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

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatPrice = (price: number): string => {
  return price.toLocaleString('fr-FR')
}

const refreshData = async () => {
  showNotification('info', 'Actualisation', 'Chargement des données...')
  await loadModerationData()
  showNotification('success', 'Actualisation terminée', 'Les données ont été rechargées avec succès.')
}

// Utility functions for notifications and modals
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

// Actions pour les commerçants
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
            'Accept': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
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
          throw new Error(data.message || 'Erreur lors de l\'approbation')
        }
      } catch (error) {
        // console.error('Erreur:', error)
        showNotification('error', 'Erreur d\'approbation', `Impossible d'approuver ${merchant.business_name}. ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
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
            'Accept': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          },
          body: JSON.stringify({ reason: 'Rejeté par l\'administrateur' })
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
        // console.error('Erreur:', error)
        showNotification('error', 'Erreur de rejet', `Impossible de rejeter ${merchant.business_name}. ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
      }
    },
    'Rejeter',
    'Annuler'
  )
}

const viewMerchantDetails = (merchant: PendingMerchant) => {
  const details = `Propriétaire: ${merchant.owner_name || 'N/A'}
Email: ${merchant.email || 'N/A'}
Téléphone: ${merchant.phone || 'N/A'}
Adresse: ${merchant.address || 'N/A'}
Type: ${merchant.business_type || 'N/A'}
Description: ${merchant.description || 'N/A'}
Demande: ${merchant.created_at ? formatDate(merchant.created_at) : 'N/A'}`

  showConfirmModal(
    'success',
    `Détails de ${merchant.business_name || 'Marchand'}`,
    details,
    () => {}, // Pas d'action à confirmer, juste pour afficher les infos
    'Fermer',
    ''
  )
}

// Actions pour les produits
const approveProduct = async (product: ProductToModerate) => {
  showConfirmModal(
    'success',
    'Approuver le produit',
    `Êtes-vous sûr de vouloir approuver le produit "${product.name}" ?`,
    async () => {
      try {
        const response = await fetch(`http://localhost:8000/api/admin/products/${product.id}/approve`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()

        if (data.success) {
          productsToModerate.value = productsToModerate.value.filter(p => p.id !== product.id)
          showNotification('success', 'Produit approuvé', `"${product.name}" a été approuvé.`)
        } else {
          throw new Error(data.message || 'Erreur lors de l\'approbation')
        }
      } catch (error) {
        // console.error('Erreur:', error)
        showNotification('error', 'Erreur d\'approbation', `Impossible d'approuver "${product.name}". ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
      }
    },
    'Approuver',
    'Annuler'
  )
}

const rejectProduct = async (product: ProductToModerate) => {
  showConfirmModal(
    'danger',
    'Rejeter le produit',
    `Êtes-vous sûr de vouloir rejeter le produit "${product.name}" ? Cette action peut être définitive.`,
    async () => {
      try {
        const response = await fetch(`http://localhost:8000/api/admin/products/${product.id}/reject`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          },
          body: JSON.stringify({ reason: 'Rejeté par l\'administrateur' })
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()

        if (data.success) {
          productsToModerate.value = productsToModerate.value.filter(p => p.id !== product.id)
          showNotification('success', 'Produit rejeté', `"${product.name}" a été rejeté.`)
        } else {
          throw new Error(data.message || 'Erreur lors du rejet')
        }
      } catch (error) {
        // console.error('Erreur:', error)
        showNotification('error', 'Erreur de rejet', `Impossible de rejeter "${product.name}". ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
      }
    },
    'Rejeter',
    'Annuler'
  )
}

// Actions pour les réservations
const resolveReservation = async (reservation: FlaggedReservation) => {
  showConfirmModal(
    'success',
    'Résoudre le signalement',
    `Êtes-vous sûr de vouloir marquer le signalement de "${reservation.product_name}" comme résolu ?`,
    async () => {
      try {
        const response = await fetch(`http://localhost:8000/api/admin/reservations/${reservation.id}/resolve`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()

        if (data.success) {
          flaggedReservations.value = flaggedReservations.value.filter(r => r.id !== reservation.id)
          showNotification('success', 'Signalement résolu', 'Signalement marqué comme résolu.')
        } else {
          throw new Error(data.message || 'Erreur lors de la résolution')
        }
      } catch (error) {
        // console.error('Erreur:', error)
        showNotification('error', 'Erreur de résolution', `Impossible de résoudre le signalement. ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
      }
    },
    'Résoudre',
    'Annuler'
  )
}

const viewReservationDetails = (reservation: FlaggedReservation) => {
  const details = `Produit: ${reservation.product_name || 'N/A'}
Client: ${reservation.customer_name || 'N/A'}
Commerçant: ${reservation.merchant_name || 'N/A'}
Montant: ${reservation.total_price ? formatPrice(reservation.total_price) : '0'} F CFA
Motif: ${reservation.flag_reason || 'Non spécifié'}
Date: ${reservation.created_at ? formatDate(reservation.created_at) : 'N/A'}`

  showConfirmModal(
    'success',
    'Détails du signalement',
    details,
    () => {}, // Pas d'action à confirmer, juste pour afficher les infos
    'Fermer',
    ''
  )
}

onMounted(() => {
  // console.log('🚀 Composant MerchantsView monté')
  // console.log('📍 URL actuelle:', window.location.href)
  // console.log('🔑 Token localStorage:', localStorage.getItem('auth_token'))
  loadModerationData()
})
</script>
