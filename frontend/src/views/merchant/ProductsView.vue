<template>
  <DashboardLayout
    :sidebar="sidebar"
    :header="header"
    class="bg-gradient-to-br from-green-50 to-blue-50"
  >
    <div class="p-6">
    <!-- Header -->
    <div class="mb-8">
      <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div>
          <h1 class="text-3xl lg:text-4xl font-bold text-neutral-900 mb-2">
            Mes Produits
          </h1>
          <p class="text-neutral-600 text-lg">
            Gérez vos produits et réduisez le gaspillage
          </p>
        </div>

        <div class="flex flex-col sm:flex-row gap-4">
          <button
            @click="showAddProductModal = true"
            class="btn btn-primary glow-effect"
          >
            <PlusIcon class="w-5 h-5 mr-2" />
            Ajouter un produit
          </button>

          <div class="relative">
            <MagnifyingGlassIcon class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Rechercher des produits..."
              class="input pl-10 w-full sm:w-80"
            />
          </div>
        </div>
      </div>

      <!-- Quick stats -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
        <div class="card bg-gradient-to-r from-primary-500 to-primary-600 text-white">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-primary-100 text-sm font-medium">Total Produits</p>
              <p class="text-3xl font-bold">{{ products.length }}</p>
            </div>
            <div class="p-3 bg-white/20 rounded-xl">
              <ShoppingBagIcon class="w-6 h-6" />
            </div>
          </div>
        </div>

        <div class="card bg-gradient-to-r from-primary-500 to-primary-600 text-white">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-primary-100 text-sm font-medium">Produits Actifs</p>
              <p class="text-3xl font-bold">{{ activeProducts.length }}</p>
            </div>
            <div class="p-3 bg-white/20 rounded-xl">
              <CheckCircleIcon class="w-6 h-6" />
            </div>
          </div>
        </div>

        <div class="card bg-gradient-to-r from-accent-orange to-accent-orange/90 text-white">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-accent-orange/70 text-sm font-medium">Stock Faible</p>
              <p class="text-3xl font-bold">{{ lowStockProducts.length }}</p>
            </div>
            <div class="p-3 bg-white/20 rounded-xl">
              <ExclamationTriangleIcon class="w-6 h-6" />
            </div>
          </div>
        </div>

        <div class="card bg-gradient-to-r from-accent-red to-accent-red/90 text-white">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-accent-red/60 text-sm font-medium">Expire Bientôt</p>
              <p class="text-3xl font-bold">{{ expiringSoonProducts.length }}</p>
            </div>
            <div class="p-3 bg-white/20 rounded-xl">
              <ClockIcon class="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Filters and Controls -->
    <div class="card mb-6">
      <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div class="flex flex-wrap gap-2">
          <button
            v-for="filter in filters"
            :key="filter.key"
            @click="activeFilter = filter.key"
            :class="[
              'px-4 py-2 rounded-lg font-medium transition-colors',
              activeFilter === filter.key
                ? 'bg-primary-100 text-primary-700 border-2 border-primary-200'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            ]"
          >
            {{ filter.label }}
            <span v-if="filter.count !== null" class="ml-2 text-sm">
              ({{ filter.count }})
            </span>
          </button>
        </div>

        <div class="flex items-center gap-4">
          <select v-model="sortBy" class="input">
            <option value="created_at">Plus récent</option>
            <option value="name">Nom A-Z</option>
            <option value="expiration_date">Date d'expiration</option>
            <option value="discount_percentage">Remise %</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Products Grid -->
    <div v-if="filteredProducts.length > 0" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      <div
        v-for="product in filteredProducts"
        :key="product.id"
        class="card card-interactive glow-effect"
      >
        <!-- Product Image -->
        <div class="relative mb-4">
          <img
            :src="product.image_url || '/images/placeholder.jpg'"
            :alt="product.name"
            class="w-full h-48 object-cover rounded-lg"
          />
          <div class="absolute top-2 left-2 flex flex-wrap gap-2">
            <span
              v-if="!product.is_active"
              class="px-2 py-1 bg-neutral-500 text-white text-xs rounded-full"
            >
              Inactif
            </span>
            <span
              v-if="product.quantity_available <= 5"
              class="px-2 py-1 bg-accent-orange text-white text-xs rounded-full"
            >
              Stock faible
            </span>
            <span
              v-if="isExpiringSoon(product)"
              class="px-2 py-1 bg-accent-red/100 text-white text-xs rounded-full"
            >
              Expire bientôt
            </span>
          </div>

          <div class="absolute top-2 right-2">
            <div class="bg-primary-500 text-white px-2 py-1 rounded-full text-sm font-bold">
              -{{ product.discount_percentage }}%
            </div>
          </div>
        </div>

        <!-- Product Info -->
        <div class="mb-4">
          <h3 class="font-semibold text-lg text-neutral-900 mb-2">{{ product.name }}</h3>
          <p class="text-neutral-600 text-sm mb-3 line-clamp-2">{{ product.description }}</p>

          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-2">
              <span class="text-2xl font-bold text-primary-600">
                {{ Math.round(product.discounted_price).toLocaleString('fr-FR') }} F CFA
              </span>
              <span class="text-neutral-400 line-through text-sm">
                {{ Math.round(product.original_price).toLocaleString('fr-FR') }} F CFA
              </span>
            </div>

            <div class="text-right">
              <p class="text-sm text-neutral-600">Stock: {{ product.quantity_available }}</p>
            </div>
          </div>

          <div class="flex items-center justify-between text-sm text-neutral-600 mb-4">
            <span>Expire: {{ formatDate(product.expiration_date) }}</span>
            <span :class="getStatusColor(product)">{{ getStatusText(product) }}</span>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex gap-2">
          <button
            @click="editProduct(product)"
            class="btn btn-outline flex-1"
          >
            <PencilIcon class="w-4 h-4 mr-1" />
            Modifier
          </button>

          <button
            @click="toggleProductStatus(product)"
            :class="[
              'btn flex-1',
              product.is_active
                ? 'btn-warning'
                : 'btn-success'
            ]"
          >
            <span v-if="product.is_active">
              <EyeSlashIcon class="w-4 h-4 mr-1" />
              Désactiver
            </span>
            <span v-else>
              <EyeIcon class="w-4 h-4 mr-1" />
              Activer
            </span>
          </button>

          <button
            @click="deleteProduct(product)"
            class="btn btn-error"
          >
            <TrashIcon class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="text-center py-12">
      <ShoppingBagIcon class="w-16 h-16 text-neutral-300 mx-auto mb-4" />
      <h3 class="text-xl font-semibold text-neutral-900 mb-2">Aucun produit trouvé</h3>
      <p class="text-neutral-600 mb-6">
        {{ searchQuery ? 'Aucun produit ne correspond à votre recherche.' : 'Commencez par ajouter votre premier produit.' }}
      </p>
      <button
        @click="showAddProductModal = true"
        class="btn btn-primary"
      >
        <PlusIcon class="w-5 h-5 mr-2" />
        Ajouter un produit
      </button>
    </div>

    <!-- Add/Edit Product Modal -->
    <div
      v-if="showAddProductModal || showEditProductModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[120]"
      @click.self="closeModals"
    >
      <div class="card max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-2xl font-bold text-neutral-900">
            {{ showAddProductModal ? 'Ajouter un produit' : 'Modifier le produit' }}
          </h2>
          <button @click="closeModals" class="text-neutral-400 hover:text-neutral-600">
            <XMarkIcon class="w-6 h-6" />
          </button>
        </div>

        <form @submit.prevent="saveProduct" class="space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="label">Nom du produit *</label>
              <input
                v-model="productForm.name"
                type="text"
                class="input w-full"
                required
              />
            </div>

            <div>
              <label class="label">Catégorie</label>
              <select v-model="productForm.category_id" class="input w-full">
                <option value="">Sélectionner une catégorie</option>
                <option v-for="category in categories" :key="category.id" :value="category.id">
                  {{ category.name }}
                </option>
              </select>
            </div>
          </div>

          <div>
            <label class="label">Description</label>
            <textarea
              v-model="productForm.description"
              class="input w-full"
              rows="3"
              placeholder="Décrivez votre produit..."
            ></textarea>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label class="label">Prix original (F CFA) *</label>
              <input
                v-model.number="productForm.original_price"
                type="number"
                step="0.01"
                class="input w-full"
                required
              />
            </div>

            <div>
              <label class="label">Remise (%) *</label>
              <input
                v-model.number="productForm.discount_percentage"
                type="number"
                min="1"
                max="90"
                class="input w-full"
                required
              />
            </div>

            <div>
              <label class="label">Prix final (F CFA)</label>
              <input
                :value="calculatedDiscountedPrice"
                type="text"
                class="input w-full bg-neutral-100"
                disabled
              />
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="label">Quantité disponible *</label>
              <input
                v-model.number="productForm.quantity_available"
                type="number"
                min="1"
                class="input w-full"
                required
              />
            </div>

            <div>
              <label class="label">Date d'expiration *</label>
              <input
                v-model="productForm.expiration_date"
                type="date"
                class="input w-full"
                required
              />
            </div>
          </div>

          <div>
            <label class="label">Image du produit</label>
            <input
              type="file"
              @change="handleImageUpload"
              accept="image/*"
              class="input w-full"
            />
            <div v-if="productForm.image_url" class="mt-3">
              <p class="text-sm text-neutral-600 mb-2">Aperçu :</p>
              <img
                :src="productForm.image_url"
                alt="Aperçu du produit"
                class="w-32 h-32 object-cover rounded-lg border"
              />
            </div>
          </div>

          <div class="flex items-center gap-3">
            <input
              v-model="productForm.is_active"
              id="is_active"
              type="checkbox"
              class="w-5 h-5"
            />
            <label for="is_active" class="label mb-0">Produit actif</label>
          </div>

          <div class="flex gap-4 pt-4">
            <button type="button" @click="closeModals" class="btn btn-outline flex-1">
              Annuler
            </button>
            <button type="submit" class="btn btn-primary flex-1" :disabled="isSubmitting">
              <span v-if="isSubmitting">Enregistrement...</span>
              <span v-else>{{ showAddProductModal ? 'Ajouter' : 'Mettre à jour' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div
      v-if="showDeleteConfirmModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-[120] p-4"
      @click="cancelDelete"
    >
      <div
        class="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl transform transition-all scale-100 hover:scale-105"
        @click.stop
      >
        <div class="text-center">
          <!-- Icon -->
          <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <svg class="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>

          <!-- Title -->
          <h3 class="text-lg font-semibold text-gray-900 mb-2">
            Supprimer le produit
          </h3>

          <!-- Message -->
          <p class="text-gray-600 mb-6">
            Êtes-vous sûr de vouloir supprimer
            <span class="font-semibold text-gray-900">"{{ productToDelete?.name }}"</span> ?
            Cette action est irréversible.
          </p>

          <!-- Buttons -->
          <div class="flex space-x-3">
            <button
              @click="cancelDelete"
              class="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
            >
              Annuler
            </button>
            <button
              @click="confirmDelete"
              class="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors duration-200 focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Supprimer
            </button>
          </div>
        </div>
      </div>
    </div>
  </DashboardLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRoute } from 'vue-router'
import { notify } from '@/composables/useNotifications'
import { apiService } from '@/services/api'
import DashboardLayout from '@/components/ui/DashboardLayout.vue'
import { useDashboardLayout } from '@/composables/useDashboardLayout'
import {
  PlusIcon,
  MagnifyingGlassIcon,
  ShoppingBagIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  PencilIcon,
  EyeIcon,
  EyeSlashIcon,
  TrashIcon,
  XMarkIcon
} from '@heroicons/vue/24/outline'

// Reactive data
const products = ref<any[]>([])
const categories = ref<any[]>([])
const searchQuery = ref('')
const activeFilter = ref('all')
const sortBy = ref('created_at')
const showAddProductModal = ref(false)
const showEditProductModal = ref(false)
const showDeleteConfirmModal = ref(false)
const productToDelete = ref<any>(null)
const isSubmitting = ref(false)

const { sidebar, header } = useDashboardLayout('merchant')

// Product form
const productForm = ref({
  id: null,
  name: '',
  description: '',
  original_price: 0,
  discount_percentage: 0,
  quantity_available: 1,
  expiration_date: '',
  category_id: '',
  is_active: true,
  image: null as File | null,
  image_url: ''
})

// Filters
const filters = computed(() => [
  { key: 'all', label: 'Tous', count: products.value.length },
  { key: 'active', label: 'Actifs', count: activeProducts.value.length },
  { key: 'inactive', label: 'Inactifs', count: products.value.filter(p => !p.is_active).length },
  { key: 'low_stock', label: 'Stock faible', count: lowStockProducts.value.length },
  { key: 'expiring', label: 'Expire bientôt', count: expiringSoonProducts.value.length }
])

// Computed properties
const activeProducts = computed(() =>
  products.value.filter(p => p.is_active)
)

const lowStockProducts = computed(() =>
  products.value.filter(p => p.quantity_available <= 5)
)

const expiringSoonProducts = computed(() =>
  products.value.filter(p => isExpiringSoon(p))
)

const filteredProducts = computed(() => {
  let filtered = products.value

  // Apply search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(p =>
      p.name.toLowerCase().includes(query) ||
      p.description?.toLowerCase().includes(query)
    )
  }

  // Apply status filter
  switch (activeFilter.value) {
    case 'active':
      filtered = filtered.filter(p => p.is_active)
      break
    case 'inactive':
      filtered = filtered.filter(p => !p.is_active)
      break
    case 'low_stock':
      filtered = filtered.filter(p => p.quantity_available <= 5)
      break
    case 'expiring':
      filtered = filtered.filter(p => isExpiringSoon(p))
      break
  }

  // Apply sorting
  filtered.sort((a, b) => {
    switch (sortBy.value) {
      case 'name':
        return a.name.localeCompare(b.name)
      case 'expiration_date':
        return new Date(a.expiration_date).getTime() - new Date(b.expiration_date).getTime()
      case 'discount_percentage':
        return b.discount_percentage - a.discount_percentage
      default:
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    }
  })

  return filtered
})

const calculatedDiscountedPrice = computed(() => {
  const original = productForm.value.original_price || 0
  const discount = productForm.value.discount_percentage || 0
  const discounted = original * (1 - discount / 100)
  return discounted.toFixed(2)
})

// Methods
const isExpiringSoon = (product: any): boolean => {
  const today = new Date()
  const expirationDate = new Date(product.expiration_date)
  const diffTime = expirationDate.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays <= 3 && diffDays >= 0
}


const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('fr-FR')
}

const getStatusColor = (product: any): string => {
  if (!product.is_active) return 'text-neutral-500'
  if (isExpiringSoon(product)) return 'text-accent-red'
  if (product.quantity_available <= 5) return 'text-accent-orange'
  return 'text-primary-600'
}

const getStatusText = (product: any): string => {
  if (!product.is_active) return 'Inactif'
  if (isExpiringSoon(product)) return 'Expire bientôt'
  if (product.quantity_available <= 5) return 'Stock faible'
  return 'Actif'
}

const editProduct = (product: any) => {
  productForm.value = {
    id: product.id,
    name: product.name,
    description: product.description,
    original_price: parseFloat(product.original_price),
    discount_percentage: Math.round((1 - parseFloat(product.discounted_price) / parseFloat(product.original_price)) * 100),
    quantity_available: product.quantity_available,
    expiration_date: product.expiration_date.split('T')[0], // Format pour input date
    category_id: product.category.id, // Récupérer l'id de la catégorie
    is_active: product.is_active !== undefined ? product.is_active : true,
    image: null,
    image_url: product.image_url || ''
  }
  showEditProductModal.value = true
}

const closeModals = () => {
  showAddProductModal.value = false
  showEditProductModal.value = false
  resetForm()
}

const resetForm = () => {
  productForm.value = {
    id: null,
    name: '',
    description: '',
    original_price: 0,
    discount_percentage: 0,
    quantity_available: 1,
    expiration_date: '',
    category_id: '',
    is_active: true,
    image: null,
    image_url: ''
  }
}

const handleImageUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    const file = target.files[0]

    // Vérifier la taille du fichier (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      notify.warning('L\'image est trop volumineuse. Veuillez choisir une image de moins de 2MB.')
      return
    }

    productForm.value.image = file

    // Créer une version redimensionnée de l'image
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      // Calculer les nouvelles dimensions (max 400x300 pour réduire la taille)
      let { width, height } = img
      const maxWidth = 400
      const maxHeight = 300

      if (width > maxWidth) {
        height = (height * maxWidth) / width
        width = maxWidth
      }
      if (height > maxHeight) {
        width = (width * maxHeight) / height
        height = maxHeight
      }

      // Redimensionner
      canvas.width = width
      canvas.height = height
      ctx?.drawImage(img, 0, 0, width, height)

      // Convertir en base64 avec compression plus élevée
      const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.5)
      productForm.value.image_url = compressedDataUrl

    }

    img.src = URL.createObjectURL(file)
  }
}

const saveProduct = async () => {
  isSubmitting.value = true
  try {
    const authStore = useAuthStore()

    // Vérifier que l'utilisateur est connecté
    if (!authStore.token) {
      notify.error('Vous devez être connecté pour ajouter un produit.', 'Authentification requise')
      return
    }

    const productPayload = {
      name: productForm.value.name,
      description: productForm.value.description,
      category_id: productForm.value.category_id,
      original_price: productForm.value.original_price.toString(),
      discounted_price: parseFloat(calculatedDiscountedPrice.value).toString(),
      quantity_available: productForm.value.quantity_available,
      expiration_date: productForm.value.expiration_date,
      image_url: productForm.value.image_url || null
    }

    if (showAddProductModal.value) {
      await apiService.createProduct(productPayload)
      notify.success('Produit ajouté avec succès.', 'Succès')
    } else if (productForm.value.id) {
      await apiService.updateProduct(productForm.value.id, {
        ...productPayload,
        is_active: productForm.value.is_active
      })
      notify.success('Produit mis à jour avec succès.', 'Succès')
    }

    await loadProducts()
    closeModals()
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)

    if (errorMessage.includes('Authentication')) {
      notify.error('Session expirée. Veuillez vous reconnecter.', 'Authentification requise')
    } else if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
      notify.error('Erreur de connexion au serveur. Vérifiez que le serveur backend fonctionne.', 'Erreur réseau')
    } else {
      notify.error('Erreur lors de l\'enregistrement du produit.')
    }
  } finally {
    isSubmitting.value = false
  }
}

const toggleProductStatus = async (product: any) => {
  const newStatus = !product.is_active
  try {
    await apiService.updateProductStatus(product.id, newStatus)
    notify.success(
      newStatus ? 'Produit activé avec succès.' : 'Produit désactivé avec succès.',
      'Succès'
    )
    await loadProducts()
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    if (errorMessage.includes('Authentication')) {
      notify.error('Session expirée. Veuillez vous reconnecter.', 'Authentification requise')
    } else {
      notify.error('Impossible de mettre à jour le statut du produit.')
    }
    await loadProducts()
  }
}

const deleteProduct = async (product: any) => {
  productToDelete.value = product
  showDeleteConfirmModal.value = true
}

const confirmDelete = async () => {
  if (!productToDelete.value) {
    return
  }

  try {
    await apiService.deleteProduct(productToDelete.value.id)
    notify.success('Produit supprimé avec succès.', 'Succès')
    await loadProducts()
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    if (errorMessage.includes('Authentication')) {
      notify.error('Session expirée. Veuillez vous reconnecter.', 'Authentification requise')
    } else {
      notify.error('Erreur lors de la suppression du produit.')
    }
  } finally {
    showDeleteConfirmModal.value = false
    productToDelete.value = null
  }
}

const cancelDelete = () => {
  showDeleteConfirmModal.value = false
  productToDelete.value = null
}

const loadProducts = async () => {
  try {
    const response = await apiService.getMerchantProducts()
    products.value = response.data || []
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    if (errorMessage.includes('Authentication')) {
      notify.error('Session expirée. Veuillez vous reconnecter.', 'Authentification requise')
    } else {
      notify.error('Erreur lors du chargement des produits du commerçant.')
    }
    products.value = []
  }
}

const loadCategories = async () => {
  try {
    const response = await apiService.getCategories()
    categories.value = response.data || []
  } catch (error) {
    notify.error('Erreur lors du chargement des catégories.')
    // Fallback to hardcoded categories
    categories.value = [
      { id: 1, name: 'Fruits et Légumes' },
      { id: 2, name: 'Boulangerie' },
      { id: 3, name: 'Produits laitiers' },
      { id: 4, name: 'Viandes et poissons' },
      { id: 5, name: 'Plats préparés' }
    ]
  }
}

// Lifecycle
onMounted(() => {
  const route = useRoute()
  loadProducts()
  loadCategories()

  // Ouvrir la modale si on vient de /merchant/products/create
  if (route.query.action === 'create') {
    showAddProductModal.value = true
  }
})
</script>
