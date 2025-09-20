<template>
  <div class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
    <!-- En-tête -->
    <div class="bg-white shadow rounded-lg p-6 mb-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Gestion des Utilisateurs</h1>
          <p class="mt-1 text-sm text-gray-500">Gérez les consommateurs et commerçants de la plateforme</p>
        </div>
        <div class="flex items-center space-x-3">
          <button
            @click="refreshData"
            class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center"
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
            Actualiser
          </button>
        </div>
      </div>
    </div>

    <!-- Statistiques utilisateurs -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      <div class="bg-white overflow-hidden shadow rounded-lg">
        <div class="p-5">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <svg class="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path>
              </svg>
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="text-sm font-medium text-gray-500 truncate">Total Utilisateurs</dt>
                <dd class="text-lg font-medium text-gray-900">{{ stats.totalUsers }}</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white overflow-hidden shadow rounded-lg">
        <div class="p-5">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <svg class="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
              </svg>
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="text-sm font-medium text-gray-500 truncate">Consommateurs</dt>
                <dd class="text-lg font-medium text-gray-900">{{ stats.consumers }}</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white overflow-hidden shadow rounded-lg">
        <div class="p-5">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <svg class="h-6 w-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
              </svg>
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="text-sm font-medium text-gray-500 truncate">Commerçants</dt>
                <dd class="text-lg font-medium text-gray-900">{{ stats.merchants }}</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white overflow-hidden shadow rounded-lg">
        <div class="p-5">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <svg class="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L5.636 5.636"></path>
              </svg>
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="text-sm font-medium text-gray-500 truncate">Comptes Suspendus</dt>
                <dd class="text-lg font-medium text-gray-900">{{ stats.suspended }}</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Filtres et recherche -->
    <div class="bg-white shadow rounded-lg p-6 mb-6">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Recherche</label>
          <input
            v-model="filters.search"
            type="text"
            placeholder="Nom, email, téléphone..."
            class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-green-500 focus:border-green-500"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Rôle</label>
          <select
            v-model="filters.role"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-green-500 focus:border-green-500"
          >
            <option value="">Tous les rôles</option>
            <option value="consumer">Consommateur</option>
            <option value="merchant">Commerçant</option>
            <option value="admin">Administrateur</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Statut</label>
          <select
            v-model="filters.status"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-green-500 focus:border-green-500"
          >
            <option value="">Tous les statuts</option>
            <option value="active">Actif</option>
            <option value="suspended">Suspendu</option>
            <option value="pending">En attente</option>
          </select>
        </div>
        <div class="flex items-end">
          <button
            @click="applyFilters"
            class="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
          >
            Filtrer
          </button>
        </div>
      </div>
    </div>

    <!-- Liste des utilisateurs -->
    <div class="bg-white shadow overflow-hidden rounded-lg">
      <div class="px-6 py-4 border-b border-gray-200">
        <h3 class="text-lg font-medium text-gray-900">Liste des Utilisateurs</h3>
      </div>

      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Utilisateur
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rôle
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Statut
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Inscription
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Dernière Activité
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="user in paginatedUsers" :key="user.id">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div class="h-10 w-10 flex-shrink-0">
                    <img class="h-10 w-10 rounded-full" :src="user.avatar" :alt="user.name" />
                  </div>
                  <div class="ml-4">
                    <div class="text-sm font-medium text-gray-900">{{ user.name }}</div>
                    <div class="text-sm text-gray-500">{{ user.email }}</div>
                    <div class="text-sm text-gray-400">{{ user.phone }}</div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span :class="{
                  'bg-green-100 text-green-800': user.role === 'consumer',
                  'bg-orange-100 text-orange-800': user.role === 'merchant',
                  'bg-purple-100 text-purple-800': user.role === 'admin'
                }" class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full">
                  {{ getRoleLabel(user.role) }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span :class="{
                  'bg-green-100 text-green-800': user.status === 'active',
                  'bg-red-100 text-red-800': user.status === 'suspended',
                  'bg-yellow-100 text-yellow-800': user.status === 'pending'
                }" class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full">
                  {{ getStatusLabel(user.status) }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ formatDate(user.created_at) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ formatDate(user.last_activity) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                <button
                  @click="viewUser(user)"
                  class="text-green-600 hover:text-green-900"
                >
                  Voir
                </button>
                <button
                  v-if="user.status !== 'suspended'"
                  @click="suspendUser(user)"
                  class="text-red-600 hover:text-red-900"
                >
                  Suspendre
                </button>
                <button
                  v-else
                  @click="unsuspendUser(user)"
                  class="text-green-600 hover:text-green-900"
                >
                  Réactiver
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
        <div class="flex-1 flex justify-between sm:hidden">
          <button
            @click="previousPage"
            :disabled="currentPage === 1"
            class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            Précédent
          </button>
          <button
            @click="nextPage"
            :disabled="currentPage === totalPages"
            class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            Suivant
          </button>
        </div>
        <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p class="text-sm text-gray-700">
              Affichage de <span class="font-medium">{{ startItem }}</span> à <span class="font-medium">{{ endItem }}</span> sur <span class="font-medium">{{ totalUsers }}</span> utilisateurs
            </p>
          </div>
          <div>
            <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
              <button
                @click="previousPage"
                :disabled="currentPage === 1"
                class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
              >
                Précédent
              </button>
              <button
                v-for="page in displayPages"
                :key="page"
                @click="goToPage(page)"
                :class="{
                  'bg-green-50 border-green-500 text-green-600': page === currentPage,
                  'bg-white border-gray-300 text-gray-500 hover:bg-gray-50': page !== currentPage
                }"
                class="relative inline-flex items-center px-4 py-2 border text-sm font-medium"
              >
                {{ page }}
              </button>
              <button
                @click="nextPage"
                :disabled="currentPage === totalPages"
                class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
              >
                Suivant
              </button>
            </nav>
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
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import ConfirmModal from '@/components/ui/ConfirmModal.vue'
import NotificationToast from '@/components/ui/NotificationToast.vue'

interface User {
  id: number
  name: string
  email: string
  phone: string
  role: 'consumer' | 'merchant' | 'admin'
  status: 'active' | 'suspended' | 'pending'
  avatar: string
  created_at: string
  last_activity: string
}

interface UserStats {
  totalUsers: number
  consumers: number
  merchants: number
  suspended: number
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

const stats = ref<UserStats>({
  totalUsers: 0,
  consumers: 0,
  merchants: 0,
  suspended: 0
})

const users = ref<User[]>([])
const loading = ref(false)

// Notification system
const notifications = ref<Notification[]>([])

// Confirm modal
const confirmModal = reactive<ConfirmModalData>({
  isOpen: false,
  type: 'warning',
  title: '',
  message: '',
  confirmText: 'Confirmer',
  cancelText: 'Annuler',
  onConfirm: () => {}
})

const filters = reactive({
  search: '',
  role: '',
  status: ''
})

const currentPage = ref(1)
const itemsPerPage = 10

const totalUsers = computed(() => filteredUsers.value.length)
const totalPages = computed(() => Math.ceil(totalUsers.value / itemsPerPage))
const startItem = computed(() => (currentPage.value - 1) * itemsPerPage + 1)
const endItem = computed(() => Math.min(currentPage.value * itemsPerPage, totalUsers.value))

const filteredUsers = computed(() => {
  return users.value.filter(user => {
    const matchesSearch = !filters.search ||
      user.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      user.email.toLowerCase().includes(filters.search.toLowerCase()) ||
      user.phone.includes(filters.search)

    const matchesRole = !filters.role || user.role === filters.role
    const matchesStatus = !filters.status || user.status === filters.status

    return matchesSearch && matchesRole && matchesStatus
  })
})

const paginatedUsers = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredUsers.value.slice(start, end)
})

const displayPages = computed(() => {
  const pages = []
  const maxDisplayPages = 5
  const startPage = Math.max(1, currentPage.value - Math.floor(maxDisplayPages / 2))
  const endPage = Math.min(totalPages.value, startPage + maxDisplayPages - 1)

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i)
  }

  return pages
})

const loadUsers = async () => {
  loading.value = true
  try {
    const response = await fetch('http://localhost:8000/api/admin/users', {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      }
    })
    const data = await response.json()

    if (data.success) {
      users.value = data.data
      stats.value = data.stats
    } else {
      throw new Error(data.message || 'Erreur API')
    }
  } catch (error) {
    console.error('Erreur lors du chargement des utilisateurs:', error)
    showNotification('error', 'Erreur de chargement', 'Impossible de charger les données. Utilisation des données de démo.')
    loadDemoUsers()
  } finally {
    loading.value = false
  }
}

const loadDemoUsers = () => {
  const demoUsers: User[] = [
    {
      id: 1,
      name: 'Djamila Koné',
      email: 'djamila.kone@email.com',
      phone: '+225 07 45 67 89 12',
      role: 'consumer',
      status: 'active',
      avatar: 'https://ui-avatars.com/api/?name=Djamila+Kone&background=10B981&color=fff',
      created_at: '2024-08-20T09:15:00Z',
      last_activity: '2024-09-15T10:30:00Z'
    },
    {
      id: 2,
      name: 'Amadou Traoré',
      email: 'amadou.traore@email.com',
      phone: '+225 07 12 34 56 78',
      role: 'consumer',
      status: 'active',
      avatar: 'https://ui-avatars.com/api/?name=Amadou+Traore&background=10B981&color=fff',
      created_at: '2024-01-15T10:30:00Z',
      last_activity: '2024-09-14T16:45:00Z'
    },
    {
      id: 3,
      name: 'Fatou Coulibaly',
      email: 'fatou.coulibaly@email.com',
      phone: '+225 05 87 65 43 21',
      role: 'merchant',
      status: 'active',
      avatar: 'https://ui-avatars.com/api/?name=Fatou+Coulibaly&background=F59E0B&color=fff',
      created_at: '2024-02-20T14:15:00Z',
      last_activity: '2024-09-15T09:20:00Z'
    },
    {
      id: 4,
      name: 'Jean Dupont',
      email: 'jean.dupont@email.com',
      phone: '+225 01 23 45 67 89',
      role: 'consumer',
      status: 'active',
      avatar: 'https://ui-avatars.com/api/?name=Jean+Dupont&background=10B981&color=fff',
      created_at: '2024-01-10T08:45:00Z',
      last_activity: '2024-09-13T18:30:00Z'
    },
    {
      id: 5,
      name: 'Boulangerie Martin',
      email: 'boulangerie.martin@email.com',
      phone: '+225 02 34 56 78 90',
      role: 'merchant',
      status: 'active',
      avatar: 'https://ui-avatars.com/api/?name=Boulangerie+Martin&background=F59E0B&color=fff',
      created_at: '2024-03-05T11:20:00Z',
      last_activity: '2024-09-14T14:15:00Z'
    },
    {
      id: 6,
      name: 'Koffi Asante',
      email: 'koffi.asante@email.com',
      phone: '+225 09 87 65 43 21',
      role: 'consumer',
      status: 'suspended',
      avatar: 'https://ui-avatars.com/api/?name=Koffi+Asante&background=EF4444&color=fff',
      created_at: '2024-02-28T16:00:00Z',
      last_activity: '2024-08-15T12:00:00Z'
    },
    {
      id: 7,
      name: 'Aicha Diabaté',
      email: 'aicha.diabate@email.com',
      phone: '+225 06 11 22 33 44',
      role: 'consumer',
      status: 'active',
      avatar: 'https://ui-avatars.com/api/?name=Aicha+Diabate&background=10B981&color=fff',
      created_at: '2024-04-12T09:30:00Z',
      last_activity: '2024-09-15T11:45:00Z'
    },
    {
      id: 8,
      name: 'Mariam Ouattara',
      email: 'mariam.ouattara@email.com',
      phone: '+225 08 33 44 55 66',
      role: 'consumer',
      status: 'active',
      avatar: 'https://ui-avatars.com/api/?name=Mariam+Ouattara&background=10B981&color=fff',
      created_at: '2024-06-18T14:20:00Z',
      last_activity: '2024-09-14T20:10:00Z'
    },
    {
      id: 9,
      name: 'Épicerie Moderne',
      email: 'epicerie.moderne@email.com',
      phone: '+225 27 45 67 89 01',
      role: 'merchant',
      status: 'active',
      avatar: 'https://ui-avatars.com/api/?name=Epicerie+Moderne&background=F59E0B&color=fff',
      created_at: '2024-05-10T11:30:00Z',
      last_activity: '2024-09-15T08:45:00Z'
    },
    {
      id: 10,
      name: 'Supermarché Plateau',
      email: 'supermarche.plateau@email.com',
      phone: '+225 27 20 30 40 50',
      role: 'merchant',
      status: 'pending',
      avatar: 'https://ui-avatars.com/api/?name=Supermarche+Plateau&background=F59E0B&color=fff',
      created_at: '2024-09-10T13:20:00Z',
      last_activity: '2024-09-10T13:20:00Z'
    },
    {
      id: 11,
      name: 'Youssouf Bamba',
      email: 'youssouf.bamba@email.com',
      phone: '+225 09 11 22 33 44',
      role: 'consumer',
      status: 'active',
      avatar: 'https://ui-avatars.com/api/?name=Youssouf+Bamba&background=10B981&color=fff',
      created_at: '2024-07-05T16:40:00Z',
      last_activity: '2024-09-15T12:20:00Z'
    },
    {
      id: 12,
      name: 'Admin Système',
      email: 'admin@antigaspi.com',
      phone: '+225 01 00 00 00 00',
      role: 'admin',
      status: 'active',
      avatar: 'https://ui-avatars.com/api/?name=Admin+Systeme&background=8B5CF6&color=fff',
      created_at: '2024-01-01T00:00:00Z',
      last_activity: '2024-09-15T12:00:00Z'
    }
  ]

  users.value = demoUsers
  updateStats()
}

const updateStats = () => {
  stats.value = {
    totalUsers: users.value.length,
    consumers: users.value.filter(u => u.role === 'consumer').length,
    merchants: users.value.filter(u => u.role === 'merchant').length,
    suspended: users.value.filter(u => u.status === 'suspended').length
  }
}

const getRoleLabel = (role: string): string => {
  const labels: Record<string, string> = {
    consumer: 'Consommateur',
    merchant: 'Commerçant',
    admin: 'Administrateur'
  }
  return labels[role] || role
}

const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    active: 'Actif',
    suspended: 'Suspendu',
    pending: 'En attente'
  }
  return labels[status] || status
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
  confirmModal.isOpen = true
  confirmModal.type = type
  confirmModal.title = title
  confirmModal.message = message
  confirmModal.confirmText = confirmText
  confirmModal.cancelText = cancelText
  confirmModal.onConfirm = () => {
    onConfirm()
    closeConfirmModal()
  }
}

const closeConfirmModal = () => {
  confirmModal.isOpen = false
}

const refreshData = async () => {
  showNotification('info', 'Actualisation', 'Chargement des données...')
  await loadUsers()
  showNotification('success', 'Actualisation terminée', 'Les données ont été rechargées avec succès.')
}

const applyFilters = () => {
  currentPage.value = 1
  // Force re-computation of filtered users
  // This is needed because the filters are reactive and should update automatically
}

const previousPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
  }
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
  }
}

const goToPage = (page: number) => {
  currentPage.value = page
}

const viewUser = (user: User) => {
  const userDetails = `Email: ${user.email}
Téléphone: ${user.phone}
Rôle: ${getRoleLabel(user.role)}
Statut: ${getStatusLabel(user.status)}
Inscription: ${formatDate(user.created_at)}
Dernière activité: ${formatDate(user.last_activity)}`

  showConfirmModal(
    'success',
    `Profil de ${user.name}`,
    userDetails,
    () => {}, // Pas d'action à confirmer, juste pour afficher les infos
    'Fermer',
    ''
  )
}

const suspendUser = async (user: User) => {
  showConfirmModal(
    'danger',
    'Suspendre l\'utilisateur',
    `Êtes-vous sûr de vouloir suspendre ${user.name} ? Cette action peut être annulée.`,
    async () => {
      try {
        const response = await fetch(`http://localhost:8000/api/admin/users/${user.id}/suspend`, {
          method: 'PATCH',
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
          user.status = 'suspended'
          updateStats()
          showNotification('success', 'Utilisateur suspendu', `${user.name} a été suspendu avec succès.`)
        } else {
          throw new Error(data.message || 'Erreur lors de la suspension')
        }
      } catch (error) {
        console.error('Erreur lors de la suspension:', error)
        showNotification('error', 'Erreur de suspension', `Impossible de suspendre ${user.name}. ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
      }
    },
    'Suspendre',
    'Annuler'
  )
}

const unsuspendUser = async (user: User) => {
  showConfirmModal(
    'success',
    'Réactiver l\'utilisateur',
    `Êtes-vous sûr de vouloir réactiver ${user.name} ?`,
    async () => {
      try {
        const response = await fetch(`http://localhost:8000/api/admin/users/${user.id}/unsuspend`, {
          method: 'PATCH',
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
          user.status = 'active'
          updateStats()
          showNotification('success', 'Utilisateur réactivé', `${user.name} a été réactivé avec succès.`)
        } else {
          throw new Error(data.message || 'Erreur lors de la réactivation')
        }
      } catch (error) {
        console.error('Erreur lors de la réactivation:', error)
        showNotification('error', 'Erreur de réactivation', `Impossible de réactiver ${user.name}. ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
      }
    },
    'Réactiver',
    'Annuler'
  )
}

onMounted(() => {
  loadUsers()
})
</script>
