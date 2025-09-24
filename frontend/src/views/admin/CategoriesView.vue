<template>
  <DashboardLayout
    :sidebar="sidebar"
    :header="header"
    class="bg-gray-50"
  >
    <!-- Header -->
    <div class="bg-white shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center py-6">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">Gestion des Catégories</h1>
            <p class="mt-1 text-sm text-gray-600">
              Gérer les catégories de produits de la plateforme
            </p>
          </div>
          <button
            @click="openCreateModal"
            class="btn btn-primary flex items-center gap-2"
          >
            <PlusIcon class="w-5 h-5" />
            Nouvelle Catégorie
          </button>
        </div>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div class="card">
          <div class="flex items-center">
            <div class="p-3 rounded-lg bg-blue-100">
              <TagIcon class="w-6 h-6 text-blue-600" />
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600">Total</p>
              <p class="text-2xl font-bold text-gray-900">{{ stats.total_categories || 0 }}</p>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="flex items-center">
            <div class="p-3 rounded-lg bg-green-100">
              <CheckCircleIcon class="w-6 h-6 text-green-600" />
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600">Actives</p>
              <p class="text-2xl font-bold text-gray-900">{{ stats.active_categories || 0 }}</p>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="flex items-center">
            <div class="p-3 rounded-lg bg-purple-100">
              <CubeIcon class="w-6 h-6 text-purple-600" />
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600">Avec Produits</p>
              <p class="text-2xl font-bold text-gray-900">{{ stats.categories_with_products || 0 }}</p>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="flex items-center">
            <div class="p-3 rounded-lg bg-orange-100">
              <ChartBarIcon class="w-6 h-6 text-orange-600" />
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600">Top Catégorie</p>
              <p class="text-lg font-bold text-gray-900">
                {{ stats.top_categories && stats.top_categories.length > 0 ? stats.top_categories[0].name : 'Aucune' }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Categories Table -->
      <div class="card">
        <div class="px-6 py-4 border-b border-gray-200">
          <div class="flex justify-between items-center">
            <h3 class="text-lg font-medium text-gray-900">Liste des Catégories</h3>
            <div class="flex items-center gap-4">
              <!-- Search -->
              <div class="relative">
                <MagnifyingGlassIcon class="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  v-model="searchQuery"
                  type="text"
                  placeholder="Rechercher..."
                  class="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <!-- Filter -->
              <select
                v-model="filterStatus"
                class="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Tous</option>
                <option value="active">Actives</option>
                <option value="inactive">Inactives</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="px-6 py-12 text-center">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p class="text-gray-500">Chargement des catégories...</p>
        </div>

        <!-- Categories List -->
        <div v-else-if="filteredCategories.length > 0" class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Catégorie
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Produits
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="category in filteredCategories" :key="category.id" class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <span class="text-2xl mr-3">{{ category.icon || '📦' }}</span>
                    <div>
                      <div class="text-sm font-medium text-gray-900">{{ category.name }}</div>
                      <div class="text-sm text-gray-500">ID: {{ category.id }}</div>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4">
                  <div class="text-sm text-gray-900 max-w-xs">{{ category.description }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900">{{ (category.products_count ?? 0) }} produit(s)</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <button
                    @click="toggleCategoryStatus(category)"
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                    :class="category.is_active
                      ? 'bg-green-100 text-green-800 hover:bg-green-200'
                      : 'bg-red-100 text-red-800 hover:bg-red-200'"
                  >
                    {{ category.is_active ? 'Active' : 'Inactive' }}
                  </button>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div class="flex items-center gap-2">
                    <button
                      @click="viewCategory(category)"
                      class="text-blue-600 hover:text-blue-900"
                      title="Voir détails"
                    >
                      <EyeIcon class="w-4 h-4" />
                    </button>
                    <button
                      @click="editCategory(category)"
                      class="text-indigo-600 hover:text-indigo-900"
                      title="Modifier"
                    >
                      <PencilIcon class="w-4 h-4" />
                    </button>
                    <button
                      @click="deleteCategory(category)"
                      class="text-red-600 hover:text-red-900"
                      title="Supprimer"
                      :disabled="(category.products_count ?? 0) > 0"
                      :class="{ 'opacity-50 cursor-not-allowed': (category.products_count ?? 0) > 0 }"
                    >
                      <TrashIcon class="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Empty State -->
        <div v-else class="px-6 py-12 text-center">
          <TagIcon class="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 class="text-lg font-medium text-gray-900 mb-2">Aucune catégorie trouvée</h3>
          <p class="text-gray-500 mb-6">
            {{ searchQuery ? 'Aucune catégorie ne correspond à votre recherche.' : 'Commencez par créer votre première catégorie.' }}
          </p>
          <button
            v-if="!searchQuery"
            @click="openCreateModal"
            class="btn btn-primary"
          >
            Créer une catégorie
          </button>
        </div>
      </div>
    </div>

    <!-- Create/Edit Modal Form -->
    <div v-if="modal.show && modal.type === 'form'" class="fixed inset-0 z-[120] overflow-y-auto">
      <!-- Backdrop -->
      <div
        class="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity"
        @click="closeModal"
      ></div>

      <!-- Modal -->
      <div class="flex min-h-full items-center justify-center p-4">
        <div
          class="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl transform transition-all"
          @click.stop
        >
          <!-- Header -->
          <div class="px-6 py-4 border-b border-gray-200">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="p-2 rounded-xl bg-blue-100">
                  <component :is="modal.icon" class="w-6 h-6 text-blue-600" />
                </div>
                <h3 class="text-xl font-semibold text-gray-900">{{ modal.title }}</h3>
              </div>
              <button
                @click="closeModal"
                class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XMarkIcon class="w-5 h-5 text-gray-400" />
              </button>
            </div>
          </div>

          <!-- Form Content -->
          <div class="px-6 py-6">
        <form @submit.prevent="saveCategory" class="space-y-6">
          <div>
            <label for="name" class="block text-sm font-medium text-gray-700 mb-2">
              Nom de la catégorie *
            </label>
            <input
              id="name"
              v-model="form.name"
              type="text"
              required
              maxlength="100"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Ex: Fruits et Légumes"
            />
          </div>

          <div>
            <label for="description" class="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              id="description"
              v-model="form.description"
              required
              maxlength="500"
              rows="3"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Description de la catégorie..."
            ></textarea>
          </div>

          <div>
            <label for="icon" class="block text-sm font-medium text-gray-700 mb-2">
              Icône (emoji)
            </label>
            <input
              id="icon"
              v-model="form.icon"
              type="text"
              maxlength="10"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="🥬"
            />
          </div>

          <div v-if="editingCategory">
            <label class="flex items-center">
              <input
                v-model="form.is_active"
                type="checkbox"
                class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span class="ml-2 text-sm text-gray-700">Catégorie active</span>
            </label>
          </div>

          <div class="flex justify-end gap-3 pt-4">
            <button
              type="button"
              @click="closeModal"
              class="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              :disabled="saving"
              class="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium transition-colors disabled:opacity-50"
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

    <!-- Notification Container -->
    <div class="fixed top-4 right-4 z-[110] space-y-2">
      <div
        v-for="notification in notificationStore.notifications"
        :key="notification.id"
        class="max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden transform transition-all duration-300 ease-in-out"
      >
        <div class="p-4">
          <div class="flex items-start">
            <div class="flex-shrink-0">
              <svg class="h-6 w-6" :class="{
                'text-green-600': notification.type === 'success',
                'text-red-600': notification.type === 'error',
                'text-yellow-600': notification.type === 'warning',
                'text-blue-600': notification.type === 'info'
              }" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path v-if="notification.type === 'success'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                <path v-else-if="notification.type === 'error'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                <path v-else-if="notification.type === 'warning'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div class="ml-3 w-0 flex-1 pt-0.5">
              <p class="text-sm font-medium text-gray-900">{{ notification.title }}</p>
              <p class="mt-1 text-sm text-gray-500">{{ notification.message }}</p>
            </div>
            <div class="ml-4 flex-shrink-0 flex">
              <button
                class="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                @click="notificationStore.remove(notification.id)"
              >
                <span class="sr-only">Fermer</span>
                <XMarkIcon class="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </DashboardLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useNotificationStore } from '@/stores/notification'
import AdminModal from '@/components/ui/AdminModal.vue'
import DashboardLayout from '@/components/ui/DashboardLayout.vue'
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
const notificationStore = useNotificationStore()
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
    console.error('Error loading categories:', error)
    notificationStore.show('error', 'Erreur', 'Impossible de charger les catégories')
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
    console.error('Error loading stats:', error)
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
      notificationStore.show('success', 'Succès', data.message)
      closeModal()
      await loadCategories()
      await loadStats()
    } else {
      throw new Error(data.message || 'Erreur lors de l\'enregistrement')
    }
  } catch (error) {
    console.error('Error saving category:', error)
    notificationStore.show('error', 'Erreur', error instanceof Error ? error.message : 'Erreur inconnue')
  } finally {
    saving.value = false
  }
}

const deleteCategory = async (category: Category) => {
  if ((category.products_count ?? 0) > 0) {
    notificationStore.show('warning', 'Attention', 'Impossible de supprimer une catégorie qui contient des produits')
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
        notificationStore.show('success', 'Succès', data.message)
        await loadCategories()
        await loadStats()
      } else {
        throw new Error(data.message || 'Erreur lors de la suppression')
      }
    } catch (error) {
      console.error('Error deleting category:', error)
      notificationStore.show('error', 'Erreur', error instanceof Error ? error.message : 'Erreur inconnue')
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
      notificationStore.show('success', 'Succès', data.message)
      category.is_active = !category.is_active
      await loadStats()
    } else {
      throw new Error(data.message || 'Erreur lors du changement de statut')
    }
  } catch (error) {
    console.error('Error toggling status:', error)
    notificationStore.show('error', 'Erreur', error instanceof Error ? error.message : 'Erreur inconnue')
  }
}

const viewCategory = (category: Category) => {
  modal.value = {
    show: true,
    title: `Détails - ${category.name}`,
    content: `📊 Informations de la catégorie\n\n` +
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