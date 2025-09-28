<template>
  <DashboardLayout
    :sidebar="sidebar"
    :header="header"
    class="bg-gradient-to-br from-surface-light via-surface-light to-primary-50 dark:from-surface-dark dark:via-surface-darker dark:to-primary-950"
  >
    <div class="mx-auto w-full max-w-7xl space-y-8 px-3 py-6 sm:px-6 sm:py-8">
      <DashboardHeader
        data-testid="users-header"
        eyebrow="Administration"
        title="Gestion des utilisateurs"
        subtitle="Gérez les consommateurs et commerçants de la plateforme"
      >
        <template #actions>
          <Button
            data-testid="users-refresh"
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
        data-testid="users-stats-grid"
        :columns="'grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4'"
      >
        <StatCard
          title="Total utilisateurs"
          :value="formatNumber(stats.totalUsers)"
          description="Profils actifs sur la plateforme"
          :icon="UserGroupIcon"
          accent="primary"
        />
        <StatCard
          title="Consommateurs"
          :value="formatNumber(stats.consumers)"
          description="Utilisateurs côté client"
          :icon="UserCircleIcon"
          accent="success"
        />
        <StatCard
          title="Commerçants"
          :value="formatNumber(stats.merchants)"
          description="Boutiques référencées"
          :icon="BuildingStorefrontIcon"
          accent="info"
        />
        <StatCard
          title="Comptes suspendus"
          :value="formatNumber(stats.suspended)"
          description="En attente d\'action"
          :icon="ShieldExclamationIcon"
          accent="warning"
        />
      </StatCardGrid>

      <DataTableCard
        data-testid="users-table"
        title="Liste des utilisateurs"
        description="Suivez les comptes actifs et intervenez rapidement en cas de problème"
        :columns="userTableColumns"
        :rows="paginatedUsers"
        :loading="loading"
        loading-text="Chargement des utilisateurs..."
        empty-title="Aucun utilisateur"
        empty-description="Aucun compte n\'a encore été enregistré."
        variant="glass"
      >
        <template #filters>
          <DashboardFilterBar
            data-testid="users-filters"
            v-model:search="searchQuery"
            :filters="dashboardFilters"
            placeholder="Rechercher un utilisateur..."
            @update:filters="handleFiltersUpdate"
            @search="applyFilters"
          >
            <template #actions>
              <Button
                variant="ghost"
                size="sm"
                class="whitespace-nowrap text-neutral-600 hover:text-primary-600 dark:text-neutral-300"
                @click="resetFilters"
              >
                Réinitialiser
              </Button>
              <Button
                variant="secondary"
                size="sm"
                class="gap-2 whitespace-nowrap"
                :loading="loading"
                @click="refreshData"
              >
                <ArrowPathIcon class="h-4 w-4" />
                Actualiser
              </Button>
            </template>
          </DashboardFilterBar>
        </template>

        <template #cell-profile="{ row }">
          <div class="flex items-center gap-4">
            <div class="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border border-primary-500/30 bg-primary-500/10">
              <img
                :src="row.avatar"
                :alt="row.name"
                class="h-full w-full object-cover"
                loading="lazy"
              >
            </div>
            <div class="space-y-1">
              <p class="text-sm font-semibold text-neutral-900 dark:text-neutral-50">{{ row.name }}</p>
              <p class="text-sm text-neutral-500 dark:text-neutral-400">{{ row.email }}</p>
              <p class="text-xs text-neutral-400 dark:text-neutral-500">{{ row.phone }}</p>
            </div>
          </div>
        </template>

        <template #cell-role="{ row }">
          <Badge
            :variant="getRoleBadgeVariant(row.role)"
            size="sm"
            class="uppercase tracking-wide"
          >
            {{ getRoleLabel(row.role) }}
          </Badge>
        </template>

        <template #cell-status="{ row }">
          <Badge
            :variant="getStatusBadgeVariant(row.status)"
            size="sm"
            class="uppercase tracking-wide"
          >
            {{ getStatusLabel(row.status) }}
          </Badge>
        </template>

        <template #cell-created_at="{ value }">
          <span class="text-sm text-neutral-600 dark:text-neutral-300">{{ formatDate(value) }}</span>
        </template>

        <template #cell-last_activity="{ value }">
          <span class="text-sm text-neutral-600 dark:text-neutral-300">{{ formatDate(value) }}</span>
        </template>

        <template #cell-actions="{ row }">
          <div class="flex items-center justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              class="text-primary-600 hover:text-primary-700 dark:text-primary-300"
              :aria-label="`Voir ${row.name}`"
              @click="viewUser(row)"
            >
              <EyeIcon class="h-4 w-4" />
              <span class="sr-only">Voir</span>
            </Button>
            <Button
              v-if="row.status !== 'suspended'"
              variant="ghost"
              size="sm"
              class="text-accent-red hover:text-accent-red/80"
              :aria-label="`Suspendre ${row.name}`"
              @click="suspendUser(row)"
            >
              <PauseCircleIcon class="h-4 w-4" />
              <span class="sr-only">Suspendre</span>
            </Button>
            <Button
              v-else
              variant="ghost"
              size="sm"
              class="text-primary-600 hover:text-primary-700 dark:text-primary-300"
              :aria-label="`Réactiver ${row.name}`"
              @click="unsuspendUser(row)"
            >
              <PlayCircleIcon class="h-4 w-4" />
              <span class="sr-only">Réactiver</span>
            </Button>
          </div>
        </template>

        <template #footer>
          <Pagination
            data-testid="users-pagination"
            :current-page="currentPage"
            :total-pages="totalPages"
            :total="totalUsers"
            :page-size="pageSize"
            @page-change="handlePageChange"
          />
        </template>
      </DataTableCard>
    </div>

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
import { ref, reactive, computed, onMounted, watch } from 'vue'
import {
  ArrowPathIcon,
  UserGroupIcon,
  UserCircleIcon,
  BuildingStorefrontIcon,
  ShieldExclamationIcon,
  EyeIcon,
  PauseCircleIcon,
  PlayCircleIcon
} from '@heroicons/vue/24/outline'
import ConfirmModal from '@/components/ui/ConfirmModal.vue'
import NotificationToast from '@/components/ui/NotificationToast.vue'
import DashboardLayout from '@/components/ui/DashboardLayout.vue'
import { Button, Badge, Pagination } from '@/components/ui/2025'
import {
  DashboardHeader,
  StatCard,
  StatCardGrid,
  DashboardFilterBar,
  DataTableCard
} from '@/components/dashboard/2025'
import type { DashboardFilter } from '@/components/dashboard/2025/DashboardFilterBar.vue'
import type { DataTableColumn } from '@/components/dashboard/2025/DataTableCard.vue'
import type { BadgeVariant } from '@/components/ui/2025/Badge.vue'
import { useDashboardLayout } from '@/composables/useDashboardLayout'

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

const notifications = ref<Notification[]>([])

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

const searchQuery = ref('')

const dashboardFilters = ref<DashboardFilter[]>([
  {
    id: 'role',
    label: 'Rôle',
    value: '',
    options: [
      { label: 'Tous les rôles', value: '' },
      { label: 'Consommateur', value: 'consumer' },
      { label: 'Commerçant', value: 'merchant' },
      { label: 'Administrateur', value: 'admin' }
    ]
  },
  {
    id: 'status',
    label: 'Statut',
    value: '',
    options: [
      { label: 'Tous les statuts', value: '' },
      { label: 'Actif', value: 'active' },
      { label: 'Suspendu', value: 'suspended' },
      { label: 'En attente', value: 'pending' }
    ]
  }
])

const userTableColumns: DataTableColumn[] = [
  { key: 'profile', title: 'Utilisateur' },
  { key: 'role', title: 'Rôle', align: 'center' },
  { key: 'status', title: 'Statut', align: 'center' },
  { key: 'created_at', title: 'Inscription' },
  { key: 'last_activity', title: 'Dernière activité' },
  { key: 'actions', title: 'Actions', align: 'right', width: '140px' }
]

const { sidebar, header } = useDashboardLayout('admin')

const currentPage = ref(1)
const pageSize = ref(10)

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

const totalUsers = computed(() => filteredUsers.value.length)
const totalPages = computed(() => Math.max(1, Math.ceil(totalUsers.value / pageSize.value) || 1))

const paginatedUsers = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredUsers.value.slice(start, end)
})

const numberFormatter = new Intl.NumberFormat('fr-FR')
const formatNumber = (value: number) => numberFormatter.format(value)

const roleBadgeVariants: Record<User['role'], BadgeVariant> = {
  consumer: 'primary',
  merchant: 'info',
  admin: 'secondary'
}

const statusBadgeVariants: Record<User['status'], BadgeVariant> = {
  active: 'success',
  suspended: 'error',
  pending: 'warning'
}

const getRoleBadgeVariant = (role: User['role']) => roleBadgeVariants[role] ?? 'default'
const getStatusBadgeVariant = (status: User['status']) => statusBadgeVariants[status] ?? 'default'

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

const syncFilters = (filtersList: DashboardFilter[]) => {
  const role = filtersList.find(filter => filter.id === 'role')?.value ?? ''
  const status = filtersList.find(filter => filter.id === 'status')?.value ?? ''

  filters.role = role
  filters.status = status
  applyFilters()
}

const handleFiltersUpdate = (updated: DashboardFilter[]) => {
  dashboardFilters.value = updated
  syncFilters(updated)
}

const resetFilters = () => {
  searchQuery.value = ''
  dashboardFilters.value = dashboardFilters.value.map(filter => ({
    ...filter,
    value: ''
  }))
  syncFilters(dashboardFilters.value)
}

const applyFilters = () => {
  currentPage.value = 1
}

const handlePageChange = (page: number) => {
  currentPage.value = Math.min(Math.max(page, 1), totalPages.value)
}

watch(searchQuery, value => {
  filters.search = value
  applyFilters()
})

watch(filteredUsers, () => {
  if (totalUsers.value === 0) {
    currentPage.value = 1
    return
  }
  if (currentPage.value > totalPages.value) {
    currentPage.value = totalPages.value
  }
})

const loadUsers = async () => {
  loading.value = true
  try {
    const response = await fetch('http://localhost:8000/api/admin/users', {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${localStorage.getItem('auth_token')}`
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

const viewUser = (user: User) => {
  const userDetails = `Email: ${user.email}\nTéléphone: ${user.phone}\nRôle: ${getRoleLabel(user.role)}\nStatut: ${getStatusLabel(user.status)}\nInscription: ${formatDate(user.created_at)}\nDernière activité: ${formatDate(user.last_activity)}`

  showConfirmModal(
    'success',
    `Profil de ${user.name}`,
    userDetails,
    () => {},
    'Fermer',
    ''
  )
}

const suspendUser = async (user: User) => {
  showConfirmModal(
    'danger',
    "Suspendre l'utilisateur",
    `Êtes-vous sûr de vouloir suspendre ${user.name} ? Cette action peut être annulée.`,
    async () => {
      try {
        const response = await fetch(`http://localhost:8000/api/admin/users/${user.id}/suspend`, {
          method: 'PATCH',
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
          user.status = 'suspended'
          updateStats()
          showNotification('success', 'Utilisateur suspendu', `${user.name} a été suspendu avec succès.`)
        } else {
          throw new Error(data.message || 'Erreur lors de la suspension')
        }
      } catch (error) {
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
    "Réactiver l'utilisateur",
    `Êtes-vous sûr de vouloir réactiver ${user.name} ?`,
    async () => {
      try {
        const response = await fetch(`http://localhost:8000/api/admin/users/${user.id}/unsuspend`, {
          method: 'PATCH',
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
          user.status = 'active'
          updateStats()
          showNotification('success', 'Utilisateur réactivé', `${user.name} a été réactivé avec succès.`)
        } else {
          throw new Error(data.message || "Erreur lors de la réactivation")
        }
      } catch (error) {
        showNotification('error', 'Erreur de réactivation', `Impossible de réactiver ${user.name}. ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
      }
    },
    'Réactiver',
    'Annuler'
  )
}

onMounted(async () => {
  await loadUsers()
  syncFilters(dashboardFilters.value)
})
</script>
