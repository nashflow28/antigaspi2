<template>
  <DashboardLayout
    :sidebar="sidebar"
    :header="header"
    class="bg-gradient-to-br from-surface-light via-surface-light to-primary-50 dark:from-surface-dark dark:via-surface-darker dark:to-primary-950"
  >
    <div class="mx-auto w-full max-w-7xl space-y-8 px-3 py-6 sm:px-6 sm:py-8">
      <DashboardHeader
        eyebrow="Administration"
        title="Gestion des catégories"
        subtitle="Gérez, filtrez et suivez les catégories produits de la plateforme"
      >
        <template #actions>
          <Button
            variant="primary"
            size="lg"
            class="gap-2"
            @click="openCreateModal"
          >
            <PlusIcon class="h-5 w-5" />
            Nouvelle catégorie
          </Button>
        </template>
      </DashboardHeader>

      <StatCardGrid :columns="'grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4'">
        <StatCard
          title="Total"
          :value="formatCount(stats.total_categories)"
          description="Catégories référencées"
          :icon="TagIcon"
          accent="primary"
        />
        <StatCard
          title="Actives"
          :value="formatCount(stats.active_categories)"
          description="Disponibles à la réservation"
          :icon="CheckCircleIcon"
          accent="success"
          :trend="activationTrend"
        />
        <StatCard
          title="Avec produits"
          :value="formatCount(stats.categories_with_products)"
          description="Catégories reliées à des offres"
          :icon="CubeIcon"
          accent="info"
        />
        <StatCard
          title="Top catégorie"
          :value="topCategoryName"
          :description="topCategoryDescription"
          :icon="ChartBarIcon"
          accent="warning"
        />
      </StatCardGrid>

      <DataTableCard
        title="Liste des catégories"
        description="Surveillez l'état des catégories et accédez rapidement aux actions de gestion"
        :columns="categoryTableColumns"
        :rows="filteredCategories"
        :loading="loading"
        loading-text="Chargement des catégories..."
        empty-title="Aucune catégorie"
        empty-description="Créez votre première catégorie pour alimenter le catalogue"
      >
        <template #filters>
          <DashboardFilterBar
            v-model:search="searchQuery"
            :filters="categoryFilters"
            placeholder="Rechercher une catégorie..."
            @filter-change="handleFilterChange"
          >
            <template #actions>
              <Button
                variant="secondary"
                size="sm"
                class="whitespace-nowrap"
                @click="refreshCategories"
              >
                Actualiser
              </Button>
            </template>
          </DashboardFilterBar>
        </template>

        <template #cell-name="{ row }">
          <div class="flex items-center gap-4">
            <span class="text-2xl">{{ row.icon || '📦' }}</span>
            <div class="space-y-1">
              <p class="text-sm font-semibold text-neutral-900 dark:text-neutral-50">{{ row.name }}</p>
              <p class="text-xs text-neutral-500 dark:text-neutral-400">ID : {{ row.id }}</p>
            </div>
          </div>
        </template>

        <template #cell-description="{ row }">
          <p class="text-sm text-neutral-600 dark:text-neutral-300">
            {{ row.description }}
          </p>
        </template>

        <template #cell-products_count="{ row }">
          <p class="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            {{ formatCount(row.products_count ?? 0) }}
            <span class="font-normal text-neutral-500 dark:text-neutral-400">produit(s)</span>
          </p>
        </template>

        <template #cell-is_active="{ row }">
          <Button
            variant="ghost"
            size="sm"
            class="rounded-full px-4 py-1.5 text-xs font-semibold transition-colors"
            :class="row.is_active
              ? 'bg-primary-500/10 text-primary-600 hover:bg-primary-500/15 dark:text-primary-300'
              : 'bg-accent-red/10 text-accent-red hover:bg-accent-red/15'"
            @click="toggleCategoryStatus(row)"
          >
            {{ row.is_active ? 'Active' : 'Inactive' }}
          </Button>
        </template>

        <template #cell-actions="{ row }">
          <div class="flex items-center justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              class="text-primary-600 hover:text-primary-700 dark:text-primary-300"
              @click="viewCategory(row)"
            >
              <EyeIcon class="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              class="text-neutral-600 hover:text-neutral-800 dark:text-neutral-300"
              @click="editCategory(row)"
            >
              <PencilIcon class="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              class="text-accent-red hover:text-accent-red/80"
              :disabled="(row.products_count ?? 0) > 0"
              :class="{ 'opacity-40 cursor-not-allowed': (row.products_count ?? 0) > 0 }"
              @click="deleteCategory(row)"
            >
              <TrashIcon class="h-4 w-4" />
            </Button>
          </div>
        </template>
      </DataTableCard>
    </div>

    <!-- Create/Edit Modal Form -->
    <div v-if="modal.show && modal.type === 'form'" class="fixed inset-0 z-[120] overflow-y-auto">
      <!-- Backdrop -->
      <div
        class="fixed inset-0 bg-overlay/90 backdrop-blur-2xl transition-opacity"
        @click="closeModal"
      />

      <!-- Modal -->
      <div class="flex min-h-screen items-center justify-center p-4">
        <div
          class="relative w-full max-w-xl overflow-hidden rounded-3xl border border-neutral-200/70 bg-surface-light shadow-glow transition-all dark:border-neutral-700/60 dark:bg-surface-dark"
          @click.stop
        >
          <!-- Header -->
          <div class="border-b border-neutral-200/70 bg-surface-light/80 px-6 py-5 dark:border-neutral-700/60 dark:bg-surface-dark/80">
            <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div class="flex items-center gap-3">
                <div class="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-500/10 text-primary-600 dark:text-primary-300">
                  <component :is="modal.icon" class="h-6 w-6" />
                </div>
                <h3 class="text-xl font-semibold text-neutral-900 dark:text-neutral-50">{{ modal.title }}</h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                class="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
                @click="closeModal"
              >
                <XMarkIcon class="h-4 w-4" />
              </Button>
            </div>
          </div>

          <!-- Form Content -->
          <div class="px-6 py-6">
            <form class="space-y-6" @submit.prevent="saveCategory">
              <div>
                <label for="name" class="mt-2 block text-sm font-medium text-neutral-700 dark:text-neutral-200">
                  Nom de la catégorie *
                </label>
                <input
                  id="name"
                  v-model="form.name"
                  type="text"
                  required
                  maxlength="100"
                  class="mt-2 w-full rounded-xl border border-neutral-200/70 bg-surface-light px-4 py-3 text-neutral-900 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500 dark:border-neutral-700/60 dark:bg-surface-dark dark:text-neutral-100"
                  placeholder="Ex: Fruits et Légumes"
                >
              </div>

              <div>
                <label for="description" class="mt-2 block text-sm font-medium text-neutral-700 dark:text-neutral-200">
                  Description *
                </label>
                <textarea
                  id="description"
                  v-model="form.description"
                  required
                  maxlength="500"
                  rows="3"
                  class="mt-2 w-full rounded-xl border border-neutral-200/70 bg-surface-light px-4 py-3 text-neutral-900 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500 dark:border-neutral-700/60 dark:bg-surface-dark dark:text-neutral-100"
                  placeholder="Description de la catégorie..."
                />
              </div>

              <div>
                <label for="icon" class="mt-2 block text-sm font-medium text-neutral-700 dark:text-neutral-200">
                  Icône (emoji)
                </label>
                <input
                  id="icon"
                  v-model="form.icon"
                  type="text"
                  maxlength="10"
                  class="mt-2 w-full rounded-xl border border-neutral-200/70 bg-surface-light px-4 py-3 text-neutral-900 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500 dark:border-neutral-700/60 dark:bg-surface-dark dark:text-neutral-100"
                  placeholder="🥬"
                >
              </div>

              <div v-if="editingCategory">
                <label class="flex items-center gap-3 text-sm text-neutral-600 dark:text-neutral-300">
                  <input
                    v-model="form.is_active"
                    type="checkbox"
                    class="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                  >
                  <span>Catégorie active</span>
                </label>
              </div>

              <div class="flex flex-col-reverse gap-3 pt-6 sm:flex-row sm:justify-end">
                <Button
                  variant="ghost"
                  size="md"
                  class="justify-center text-neutral-600 hover:text-neutral-800 dark:text-neutral-300"
                  @click="closeModal"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  :loading="saving"
                >
                  {{ saving ? 'Enregistrement...' : editingCategory ? 'Modifier' : 'Créer' }}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>

    <!-- Other Modals -->
    <AdminModal
      v-if="modal.show && modal.type !== 'form'"
      :show="modal.show"
      :title="modal.title"
      :content="modal.content"
      :icon="modal.icon"
      :type="modal.type"
      :action-button="modal.actionButton"
      @close="closeModal"
      @action="handleModalAction"
    />

    <!-- Notifications are handled by the NotificationToast component -->
  </DashboardLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { notify } from '@/composables/useNotifications'
import AdminModal from '@/components/ui/AdminModal.vue'
import DashboardLayout from '@/components/ui/DashboardLayout.vue'
import Button from '@/components/ui/2025/Button.vue'
import {
  DashboardHeader,
  DashboardFilterBar,
  DataTableCard,
  StatCard,
  StatCardGrid
} from '@/components/dashboard/2025'
import type { DashboardFilter } from '@/components/dashboard/2025/DashboardFilterBar.vue'
import type { DataTableColumn } from '@/components/dashboard/2025/DataTableCard.vue'
import { useDashboardLayout } from '@/composables/useDashboardLayout'
import {
  PlusIcon,
  TagIcon,
  CheckCircleIcon,
  CubeIcon,
  ChartBarIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XMarkIcon
} from '@heroicons/vue/24/outline'

interface Category {
  id: number
  name: string
  description: string
  icon: string
  is_active: boolean
  products_count?: number
  created_at?: string
  updated_at?: string
}

interface CategoryStats {
  total_categories: number
  active_categories: number
  categories_with_products: number
  top_categories: Array<{
    id: number
    name: string
    products_count: number
  }>
}

const authStore = useAuthStore()
// Notification store removed - using useNotifications composable
const { sidebar, header } = useDashboardLayout('admin')

// State
const loading = ref(true)
const saving = ref(false)
const categories = ref<Category[]>([])
const stats = ref<CategoryStats>({
  total_categories: 0,
  active_categories: 0,
  categories_with_products: 0,
  top_categories: []
})

const searchQuery = ref('')
const filterStatus = ref('')

const numberFormatter = new Intl.NumberFormat('fr-FR')
const formatCount = (value?: number) => numberFormatter.format(value ?? 0)

const categoryTableColumns: DataTableColumn[] = [
  { key: 'name', title: 'Catégorie' },
  { key: 'description', title: 'Description' },
  { key: 'products_count', title: 'Produits', align: 'center' },
  { key: 'is_active', title: 'Statut', align: 'center' },
  { key: 'actions', title: 'Actions', align: 'right' }
]

const categoryFilters = computed<DashboardFilter[]>(() => [
  {
    id: 'status',
    label: 'Statut',
    value: filterStatus.value,
    options: [
      { label: 'Tous', value: '' },
      { label: 'Actives', value: 'active' },
      { label: 'Inactives', value: 'inactive' }
    ]
  }
])

const topCategory = computed(() => stats.value.top_categories?.[0] ?? null)
const topCategoryName = computed(() => topCategory.value?.name ?? 'Aucune')
const topCategoryDescription = computed(() =>
  topCategory.value
    ? `${formatCount(topCategory.value.products_count)} produits`
    : 'Aucune donnée récente'
)

const activationRate = computed(() => {
  if (!stats.value.total_categories) {
    return 0
  }
  return Math.round((stats.value.active_categories / stats.value.total_categories) * 100)
})

const activationTrend = computed(() => {
  if (!stats.value.total_categories) {
    return null
  }

  return {
    value: `${activationRate.value}%`,
    label: 'actives',
    tone: 'positive' as const
  }
})

// Modal state
const modal = ref({
  show: false,
  title: '',
  content: '',
  icon: InformationCircleIcon,
  type: 'info' as 'info' | 'success' | 'warning' | 'error' | 'form',
  actionButton: '',
  action: null as (() => void) | null
})

// Form state
const editingCategory = ref<Category | null>(null)
const form = ref({
  name: '',
  description: '',
  icon: '',
  is_active: true
})

// Computed
const filteredCategories = computed(() => {
  let filtered = categories.value

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(category =>
      category.name.toLowerCase().includes(query) ||
      category.description.toLowerCase().includes(query)
    )
  }

  if (filterStatus.value) {
    filtered = filtered.filter(category => {
      if (filterStatus.value === 'active') return category.is_active
      if (filterStatus.value === 'inactive') return !category.is_active
      return true
    })
  }

  return filtered
})

const handleFilterChange = ({ id, value }: { id: string; value: string }) => {
  if (id === 'status') {
    filterStatus.value = value
  }
}

// Methods
const loadCategories = async () => {
  try {
    loading.value = true
    const token = authStore.token

    const response = await fetch('http://localhost:8000/api/admin/categories', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    })

    const data = await response.json()

    if (data.success) {
      categories.value = data.data
      // Les products_count viennent maintenant de l'API
    } else {
      throw new Error(data.message || 'Erreur lors du chargement')
    }
  } catch (error) {
    // console.error('Error loading categories:', error)
    notify.error('Impossible de charger les catégories', 'Erreur')
  } finally {
    loading.value = false
  }
}

const loadStats = async () => {
  try {
    const token = authStore.token

    const response = await fetch('http://localhost:8000/api/admin/categories/stats', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    })

    const data = await response.json()

    if (data.success) {
      stats.value = data.data
    }
  } catch (error) {
    // console.error('Error loading stats:', error)
  }
}

const refreshCategories = async () => {
  await Promise.all([loadCategories(), loadStats()])
}

const openCreateModal = () => {
  editingCategory.value = null
  form.value = {
    name: '',
    description: '',
    icon: '',
    is_active: true
  }
  modal.value = {
    show: true,
    title: 'Nouvelle Catégorie',
    content: '',
    icon: TagIcon,
    type: 'form',
    actionButton: '',
    action: null
  }
}

const editCategory = (category: Category) => {
  editingCategory.value = category
  form.value = {
    name: category.name,
    description: category.description,
    icon: category.icon,
    is_active: category.is_active
  }
  modal.value = {
    show: true,
    title: 'Modifier Catégorie',
    content: '',
    icon: PencilIcon,
    type: 'form',
    actionButton: '',
    action: null
  }
}

const saveCategory = async () => {
  try {
    saving.value = true
    const token = authStore.token

    const url = editingCategory.value
      ? `http://localhost:8000/api/admin/categories/${editingCategory.value.id}`
      : 'http://localhost:8000/api/admin/categories'

    const method = editingCategory.value ? 'PUT' : 'POST'

    const response = await fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(form.value)
    })

    const data = await response.json()

    if (data.success) {
      notify.success(data.message, 'Succès')
      closeModal()
      await loadCategories()
      await loadStats()
    } else {
      throw new Error(data.message || 'Erreur lors de l\'enregistrement')
    }
  } catch (error) {
    // console.error('Error saving category:', error)
    notify.error(error instanceof Error ? error.message : 'Erreur inconnue', 'Erreur')
  } finally {
    saving.value = false
  }
}

const deleteCategory = async (category: Category) => {
  if ((category.products_count ?? 0) > 0) {
    notify.warning('Impossible de supprimer une catégorie qui contient des produits', 'Attention')
    return
  }

  modal.value = {
    show: true,
    title: 'Confirmer la suppression',
    content: `Êtes-vous sûr de vouloir supprimer la catégorie "${category.name}" ?\n\nCette action est irréversible.`,
    icon: ExclamationTriangleIcon,
    type: 'warning',
    actionButton: 'Supprimer',
    action: null
  }

  modal.value.action = async () => {
    try {
      const token = authStore.token

      const response = await fetch(`http://localhost:8000/api/admin/categories/${category.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      })

      const data = await response.json()

      if (data.success) {
        notify.success(data.message, 'Succès')
        await loadCategories()
        await loadStats()
      } else {
        throw new Error(data.message || 'Erreur lors de la suppression')
      }
    } catch (error) {
      // console.error('Error deleting category:', error)
      notify.error(error instanceof Error ? error.message : 'Erreur inconnue', 'Erreur')
    }
  }
}

const toggleCategoryStatus = async (category: Category) => {
  try {
    const token = authStore.token

    const response = await fetch(`http://localhost:8000/api/admin/categories/${category.id}/toggle`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    })

    const data = await response.json()

    if (data.success) {
      notify.success(data.message, 'Succès')
      category.is_active = !category.is_active
      await loadStats()
    } else {
      throw new Error(data.message || 'Erreur lors du changement de statut')
    }
  } catch (error) {
    // console.error('Error toggling status:', error)
    notify.error(error instanceof Error ? error.message : 'Erreur inconnue', 'Erreur')
  }
}

const viewCategory = (category: Category) => {
  modal.value = {
    show: true,
    title: `Détails - ${category.name}`,
    content: '📊 Informations de la catégorie\n\n' +
      `• Nom: ${category.name}\n` +
      `• Description: ${category.description}\n` +
      `• Icône: ${category.icon || 'Aucune'}\n` +
      `• Statut: ${category.is_active ? 'Active' : 'Inactive'}\n` +
      `• Produits: ${category.products_count || 0}\n` +
      `• Créée le: ${category.created_at ? new Date(category.created_at).toLocaleDateString('fr-FR') : 'Inconnue'}`,
    icon: InformationCircleIcon,
    type: 'info',
    actionButton: '',
    action: null
  }
}

const closeModal = () => {
  modal.value.show = false
  editingCategory.value = null
}

const handleModalAction = () => {
  if (modal.value.action) {
    modal.value.action()
  }
  closeModal()
}

// Lifecycle
onMounted(async () => {
  await refreshCategories()
})
</script>
