<template>
  <DashboardLayout
    :sidebar="sidebar"
    :header="header"
    class="bg-neutral-50"
  >
    <!-- Header -->
    <div class="bg-white shadow-sm">
      <div class="max-w-full sm:max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-start sm:justify-between items-center py-6">
          <div>
            <h1 class="text-responsive-xl font-semibold text-heading">Gestion des Catégories</h1>
            <p class="mt-1 text-responsive-sm text-body">
              Gérer les catégories de produits de la plateforme
            </p>
          </div>
          <Button
            variant="primary"
            class="flex items-center gap-2"
            @click="openCreateModal"
          >
            <PlusIcon class="w-5 h-5" />
            Nouvelle Catégorie
          </Button>
        </div>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="max-w-full sm:max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <Card>
          <div class="flex items-center">
            <div class="p-3 rounded-lg bg-blue-100">
              <TagIcon class="w-10 h-10 text-info" />
            </div>
            <div class="ml-4">
              <p class="text-responsive-sm font-medium text-body">Total</p>
              <p class="text-responsive-xl font-semibold text-heading">{{ stats.total_categories || 0 }}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div class="flex items-center">
            <div class="p-3 rounded-lg bg-green-100">
              <CheckCircleIcon class="w-10 h-10 text-success" />
            </div>
            <div class="ml-4">
              <p class="text-responsive-sm font-medium text-body">Actives</p>
              <p class="text-responsive-xl font-semibold text-heading">{{ stats.active_categories || 0 }}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div class="flex items-center">
            <div class="p-3 rounded-lg bg-purple-100">
              <CubeIcon class="w-10 h-10 text-purple-600" />
            </div>
            <div class="ml-4">
              <p class="text-responsive-sm font-medium text-body">Avec Produits</p>
              <p class="text-responsive-xl font-semibold text-heading">{{ stats.categories_with_products || 0 }}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div class="flex items-center">
            <div class="p-3 rounded-lg bg-orange-100">
              <ChartBarIcon class="w-10 h-10 text-orange-600" />
            </div>
            <div class="ml-4">
              <p class="text-responsive-sm font-medium text-body">Top Catégorie</p>
              <p class="text-responsive-lg font-semibold text-heading">
                {{ stats.top_categories && stats.top_categories.length > 0 ? stats.top_categories[0].name : 'Aucune' }}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <!-- Categories Table -->
      <Card>
        <div class="px-6 py-4 border-b border-neutral-200">
          <div class="flex justify-start sm:justify-between items-center">
            <h3 class="text-responsive-lg font-medium text-heading">Liste des Catégories</h3>
            <div class="flex items-center gap-4">
              <!-- Search -->
              <div class="relative">
                <MagnifyingGlassIcon class="w-5 h-5 relative sm:absolute left-3 top-1/2 transform -translate-y-1/2 text-placeholder" />
                <input
                  v-model="searchQuery"
                  type="text"
                  placeholder="Rechercher..."
                  class="pl-10 pr-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
              </div>
              <!-- Filter -->
              <select
                v-model="filterStatus"
                class="border border-neutral-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Tous</option>
                <option value="active">Actives</option>
                <option value="inactive">Inactives</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="px-6 py-8 sm:py-10 lg:py-12 text-left sm:text-center">
          <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto mb-4" />
          <p class="text-muted">Chargement des catégories...</p>
        </div>

        <!-- Categories List -->
        <div v-else-if="filteredCategories.length > 0" class="overflow-x-auto">
          <table class="min-w-full divide-y divide-neutral-200">
            <thead class="bg-neutral-50">
              <tr>
                <th class="px-6 py-3 text-left text-responsive-xs font-medium text-muted uppercase tracking-wider">
                  Catégorie
                </th>
                <th class="px-6 py-3 text-left text-responsive-xs font-medium text-muted uppercase tracking-wider">
                  Description
                </th>
                <th class="px-6 py-3 text-left text-responsive-xs font-medium text-muted uppercase tracking-wider">
                  Produits
                </th>
                <th class="px-6 py-3 text-left text-responsive-xs font-medium text-muted uppercase tracking-wider">
                  Statut
                </th>
                <th class="px-6 py-3 text-left text-responsive-xs font-medium text-muted uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-neutral-200">
              <tr v-for="category in filteredCategories" :key="category.id" class="hover:bg-neutral-50">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <span class="text-responsive-xl mr-3">{{ category.icon || '📦' }}</span>
                    <div>
                      <div class="text-responsive-sm font-medium text-heading">{{ category.name }}</div>
                      <div class="text-responsive-sm text-muted">ID: {{ category.id }}</div>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4">
                  <div class="text-responsive-sm text-heading max-w-xs">{{ category.description }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-responsive-sm text-heading">{{ (category.products_count ?? 0) }} produit(s)</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <button
                    class="inline-flex items-center px-4.5 py-0.5 rounded-full text-responsive-xs font-medium"
                    :class="category.is_active
                      ? 'bg-green-100 text-green-800 hover:bg-green-200'
                      : 'bg-red-100 text-red-800 hover:bg-red-200'"
                    @click="toggleCategoryStatus(category)"
                  >
                    {{ category.is_active ? 'Active' : 'Inactive' }}
                  </button>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-responsive-sm font-medium">
                  <div class="flex items-center gap-2">
                    <button
                      class="text-info hover:text-blue-900"
                      title="Voir détails"
                      @click="viewCategory(category)"
                    >
                      <EyeIcon class="w-5 h-5" />
                    </button>
                    <button
                      class="text-indigo-600 hover:text-indigo-900"
                      title="Modifier"
                      @click="editCategory(category)"
                    >
                      <PencilIcon class="w-5 h-5" />
                    </button>
                    <button
                      class="text-error hover:text-red-900"
                      title="Supprimer"
                      :disabled="(category.products_count ?? 0) > 0"
                      :class="{ 'opacity-50 cursor-not-allowed': (category.products_count ?? 0) > 0 }"
                      @click="deleteCategory(category)"
                    >
                      <TrashIcon class="w-5 h-5" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Empty State -->
        <div v-else class="px-6 py-8 sm:py-10 lg:py-12 text-left sm:text-center">
          <TagIcon class="w-12 h-12 text-placeholder mx-auto mb-4" />
          <h3 class="text-responsive-lg font-medium text-heading mb-2">Aucune catégorie trouvée</h3>
          <p class="text-muted mb-6">
            {{ searchQuery ? 'Aucune catégorie ne correspond à votre recherche.' : 'Commencez par créer votre première catégorie.' }}
          </p>
          <Button
            v-if="!searchQuery"
            variant="primary"
            @click="openCreateModal"
          >
            Créer une catégorie
          </Button>
        </div>
      </Card>
    </div>

    <!-- Create/Edit Modal Form -->
    <div v-if="modal.show && modal.type === 'form'" class="fixed inset-0 z-[120] overflow-y-auto">
      <!-- Backdrop -->
      <div
        class="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity"
        @click="closeModal"
      />

      <!-- Modal -->
      <div class="flex min-h-full items-center justify-center p-4">
        <div
          class="relative w-full max-w-full sm:max-w-lg bg-white rounded-2xl shadow-2xl transform transition-all"
          @click.stop
        >
          <!-- Header -->
          <div class="px-6 py-4 border-b border-neutral-200">
            <div class="flex items-center justify-start sm:justify-between">
              <div class="flex items-center gap-3">
                <div class="p-2 rounded-xl bg-blue-100">
                  <component :is="modal.icon" class="w-10 h-10 text-info" />
                </div>
                <h3 class="text-responsive-xl font-semibold text-heading">{{ modal.title }}</h3>
              </div>
              <button
                class="p-2 hover:transition-colors"
                @click="closeModal"
              >
                <XMarkIcon class="w-5 h-5 text-placeholder" />
              </button>
            </div>
          </div>

          <!-- Form Content -->
          <div class="px-6 py-6">
            <form class="space-y-6" @submit.prevent="saveCategory">
              <div>
                <label for="name" class="block text-responsive-sm font-medium text-body-emphasis mb-2">
                  Nom de la catégorie *
                </label>
                <input
                  id="name"
                  v-model="form.name"
                  type="text"
                  required
                  maxlength="100"
                  class="w-full border border-neutral-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Ex: Fruits et Légumes"
                >
              </div>

              <div>
                <label for="description" class="block text-responsive-sm font-medium text-body-emphasis mb-2">
                  Description *
                </label>
                <textarea
                  id="description"
                  v-model="form.description"
                  required
                  maxlength="500"
                  rows="3"
                  class="w-full border border-neutral-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Description de la catégorie..."
                />
              </div>

              <div>
                <label for="icon" class="block text-responsive-sm font-medium text-body-emphasis mb-2">
                  Icône (emoji)
                </label>
                <input
                  id="icon"
                  v-model="form.icon"
                  type="text"
                  maxlength="10"
                  class="w-full border border-neutral-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="🥬"
                >
              </div>

              <div v-if="editingCategory">
                <label class="flex items-center">
                  <input
                    v-model="form.is_active"
                    type="checkbox"
                    class="rounded border-neutral-300 text-primary focus:ring-primary-500"
                  >
                  <span class="ml-2 text-responsive-sm text-body-emphasis">Catégorie active</span>
                </label>
              </div>

              <div class="flex justify-center sm:justify-end gap-3 pt-4">
                <button
                  type="button"
                  class="px-4 py-3 text-body hover:transition-colors"
                  @click="closeModal"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  :disabled="saving"
                  class="px-6 py-3 bg-primary-600 text-white rounded-lg hover:transition-colors disabled:opacity-50"
                >
                  {{ saving ? 'Enregistrement...' : (editingCategory ? 'Modifier' : 'Créer') }}
                </button>
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
import Card from '@/components/ui/2025/Card.vue'
import { useDashboardLayout } from '@/composables/useDashboardLayout'
import {
  PlusIcon,
  TagIcon,
  CheckCircleIcon,
  CubeIcon,
  ChartBarIcon,
  MagnifyingGlassIcon,
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
  await Promise.all([loadCategories(), loadStats()])
})
</script>
