<template>
  <div class="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-6">
    <!-- Header -->
    <div class="mb-8">
      <div class="flex items-center gap-4 mb-4">
        <router-link
          to="/merchant/products"
          class="flex items-center text-neutral-600 hover:text-neutral-900 transition-colors"
        >
          <ArrowLeftIcon class="w-5 h-5 mr-2" />
          Retour aux produits
        </router-link>
      </div>

      <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div>
          <h1 class="text-3xl lg:text-4xl font-bold text-neutral-900 mb-2">
            {{ product ? 'Modifier le produit' : 'Chargement...' }}
          </h1>
          <p class="text-neutral-600 text-lg">
            {{ product ? product.name : 'Veuillez patienter...' }}
          </p>
        </div>

        <div class="flex gap-4" v-if="product">
          <button
            @click="deleteProduct"
            class="btn btn-error"
            :disabled="loading"
          >
            <TrashIcon class="w-5 h-5 mr-2" />
            Supprimer
          </button>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="!product && !error" class="card">
      <div class="flex items-center justify-center py-12">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <span class="ml-3 text-neutral-600">Chargement du produit...</span>
      </div>
    </div>

    <!-- Error State -->
    <div v-if="error" class="card bg-error-50 border-error-200">
      <div class="flex items-center justify-center py-12">
        <ExclamationTriangleIcon class="w-8 h-8 text-error-500 mr-3" />
        <div>
          <p class="text-error-700 font-medium">Erreur lors du chargement</p>
          <p class="text-error-600 text-sm">{{ error }}</p>
        </div>
      </div>
    </div>

    <!-- Edit Form -->
    <div v-if="product" class="grid lg:grid-cols-3 gap-8">
      <!-- Main Form -->
      <div class="lg:col-span-2 space-y-6">
        <form @submit.prevent="saveProduct">
          <!-- Informations générales -->
          <div class="card">
            <div class="card-header">
              <h3 class="text-xl font-bold text-neutral-900">Informations générales</h3>
            </div>
            <div class="card-body space-y-6">
              <!-- Nom du produit -->
              <div>
                <label for="name" class="form-label required">Nom du produit</label>
                <input
                  id="name"
                  v-model="form.name"
                  type="text"
                  class="input"
                  :class="{ 'input-error': errors.name }"
                  placeholder="Ex: Pain artisanal"
                  required
                />
                <p v-if="errors.name" class="form-error">{{ errors.name }}</p>
              </div>

              <!-- Description -->
              <div>
                <label for="description" class="form-label required">Description</label>
                <textarea
                  id="description"
                  v-model="form.description"
                  rows="4"
                  class="input"
                  :class="{ 'input-error': errors.description }"
                  placeholder="Décrivez votre produit..."
                  required
                ></textarea>
                <p v-if="errors.description" class="form-error">{{ errors.description }}</p>
              </div>

              <!-- Catégorie -->
              <div>
                <label for="category" class="form-label required">Catégorie</label>
                <select
                  id="category"
                  v-model="form.category_id"
                  class="input"
                  :class="{ 'input-error': errors.category_id }"
                  required
                >
                  <option value="">Sélectionner une catégorie</option>
                  <option
                    v-for="category in categories"
                    :key="category.id"
                    :value="category.id"
                  >
                    {{ category.name }}
                  </option>
                </select>
                <p v-if="errors.category_id" class="form-error">{{ errors.category_id }}</p>
              </div>
            </div>
          </div>

          <!-- Prix et stock -->
          <div class="card">
            <div class="card-header">
              <h3 class="text-xl font-bold text-neutral-900">Prix et stock</h3>
            </div>
            <div class="card-body">
              <div class="grid md:grid-cols-2 gap-6">
                <!-- Prix original -->
                <div>
                  <label for="original_price" class="form-label required">Prix original (XOF)</label>
                  <input
                    id="original_price"
                    v-model.number="form.original_price"
                    type="number"
                    min="0"
                    step="0.01"
                    class="input"
                    :class="{ 'input-error': errors.original_price }"
                    placeholder="1000"
                    required
                  />
                  <p v-if="errors.original_price" class="form-error">{{ errors.original_price }}</p>
                </div>

                <!-- Prix réduit -->
                <div>
                  <label for="discounted_price" class="form-label required">Prix réduit (XOF)</label>
                  <input
                    id="discounted_price"
                    v-model.number="form.discounted_price"
                    type="number"
                    min="0"
                    step="0.01"
                    class="input"
                    :class="{ 'input-error': errors.discounted_price }"
                    placeholder="750"
                    required
                  />
                  <p v-if="errors.discounted_price" class="form-error">{{ errors.discounted_price }}</p>
                </div>

                <!-- Quantité -->
                <div>
                  <label for="quantity" class="form-label required">Quantité disponible</label>
                  <input
                    id="quantity"
                    v-model.number="form.quantity_available"
                    type="number"
                    min="1"
                    class="input"
                    :class="{ 'input-error': errors.quantity_available }"
                    placeholder="10"
                    required
                  />
                  <p v-if="errors.quantity_available" class="form-error">{{ errors.quantity_available }}</p>
                </div>

                <!-- Date d'expiration -->
                <div>
                  <label for="expiration_date" class="form-label required">Date d'expiration</label>
                  <input
                    id="expiration_date"
                    v-model="form.expiration_date"
                    type="date"
                    class="input"
                    :class="{ 'input-error': errors.expiration_date }"
                    :min="today"
                    required
                  />
                  <p v-if="errors.expiration_date" class="form-error">{{ errors.expiration_date }}</p>
                </div>
              </div>

              <!-- Réduction calculée -->
              <div v-if="discountPercentage > 0" class="mt-4 p-4 bg-success-50 border border-success-200 rounded-lg">
                <div class="flex items-center">
                  <TagIcon class="w-5 h-5 text-success-500 mr-2" />
                  <span class="font-medium text-success-700">
                    Réduction de {{ discountPercentage }}% ({{ savings }} XOF d'économie)
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Image du produit -->
          <div class="card">
            <div class="card-header">
              <h3 class="text-xl font-bold text-neutral-900">Image du produit</h3>
            </div>
            <div class="card-body">
              <!-- Image actuelle -->
              <div v-if="product.image_url" class="mb-4">
                <p class="form-label">Image actuelle</p>
                <div class="relative inline-block">
                  <img
                    :src="product.image_url"
                    :alt="product.name"
                    class="w-32 h-32 object-cover rounded-lg border border-neutral-200"
                  />
                </div>
              </div>

              <!-- Upload nouvelle image -->
              <div>
                <label for="image" class="form-label">Nouvelle image (optionnel)</label>
                <div class="flex items-center gap-4">
                  <input
                    id="image"
                    ref="imageInput"
                    type="file"
                    accept="image/*"
                    @change="handleImageChange"
                    class="hidden"
                  />
                  <button
                    type="button"
                    @click="$refs.imageInput.click()"
                    class="btn btn-secondary"
                  >
                    <PhotoIcon class="w-5 h-5 mr-2" />
                    Choisir une image
                  </button>
                  <span v-if="form.image" class="text-sm text-neutral-600">
                    {{ form.image.name }}
                  </span>
                </div>
                <p class="form-help">Format JPG, PNG ou WebP. Taille max: 5 MB</p>
              </div>

              <!-- Prévisualisation nouvelle image -->
              <div v-if="imagePreview" class="mt-4">
                <p class="form-label">Aperçu</p>
                <img
                  :src="imagePreview"
                  alt="Aperçu"
                  class="w-32 h-32 object-cover rounded-lg border border-neutral-200"
                />
              </div>
            </div>
          </div>

          <!-- Statut -->
          <div class="card">
            <div class="card-header">
              <h3 class="text-xl font-bold text-neutral-900">Statut</h3>
            </div>
            <div class="card-body">
              <div class="flex items-center gap-3">
                <input
                  id="is_active"
                  v-model="form.is_active"
                  type="checkbox"
                  class="w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
                />
                <label for="is_active" class="text-neutral-700">
                  Produit actif (visible par les clients)
                </label>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex justify-end gap-4">
            <router-link to="/merchant/products" class="btn btn-ghost">
              Annuler
            </router-link>
            <button
              type="submit"
              class="btn btn-primary"
              :disabled="loading"
            >
              <template v-if="loading">
                <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Sauvegarde...
              </template>
              <template v-else>
                <CheckIcon class="w-5 h-5 mr-2" />
                Sauvegarder
              </template>
            </button>
          </div>
        </form>
      </div>

      <!-- Sidebar info -->
      <div class="space-y-6">
        <!-- Statistiques du produit -->
        <div class="card">
          <div class="card-header">
            <h3 class="text-lg font-bold text-neutral-900">Statistiques</h3>
          </div>
          <div class="card-body space-y-4">
            <div class="flex justify-between">
              <span class="text-neutral-600">Créé le:</span>
              <span class="font-medium">{{ formatDate(product.created_at) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-neutral-600">Statut:</span>
              <span :class="product.is_active ? 'text-success-600' : 'text-error-600'" class="font-medium">
                {{ product.is_active ? 'Actif' : 'Inactif' }}
              </span>
            </div>
            <div class="flex justify-between">
              <span class="text-neutral-600">Stock restant:</span>
              <span class="font-medium">{{ product.quantity_available }}</span>
            </div>
          </div>
        </div>

        <!-- Actions rapides -->
        <div class="card">
          <div class="card-header">
            <h3 class="text-lg font-bold text-neutral-900">Actions rapides</h3>
          </div>
          <div class="card-body space-y-3">
            <button
              @click="toggleStatus"
              class="btn w-full"
              :class="product.is_active ? 'btn-warning' : 'btn-success'"
              :disabled="loading"
            >
              <template v-if="product.is_active">
                <EyeSlashIcon class="w-4 h-4 mr-2" />
                Désactiver
              </template>
              <template v-else>
                <EyeIcon class="w-4 h-4 mr-2" />
                Activer
              </template>
            </button>

            <button
              @click="duplicateProduct"
              class="btn btn-ghost w-full"
              :disabled="loading"
            >
              <DocumentDuplicateIcon class="w-4 h-4 mr-2" />
              Dupliquer
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <ConfirmModal
      :is-open="showDeleteModal"
      type="danger"
      title="Supprimer le produit"
      :message="`Êtes-vous sûr de vouloir supprimer '${product?.name}' ? Cette action est irréversible.`"
      confirm-text="Oui, supprimer"
      cancel-text="Annuler"
      @confirm="confirmDelete"
      @cancel="showDeleteModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { merchantService } from '@/services/merchantService'
import type { Product, Category, ProductUpdateData } from '@/types'
import {
  ArrowLeftIcon,
  CheckIcon,
  TrashIcon,
  PhotoIcon,
  TagIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  EyeSlashIcon,
  DocumentDuplicateIcon
} from 'lucide-vue-next'
import ConfirmModal from '@/components/ui/ConfirmModal.vue'

const route = useRoute()
const router = useRouter()

// État
const product = ref<Product | null>(null)
const categories = ref<Category[]>([])
const loading = ref(false)
const error = ref('')
const showDeleteModal = ref(false)
const imagePreview = ref('')

// Formulaire
const form = reactive<ProductUpdateData>({
  name: '',
  description: '',
  original_price: 0,
  discounted_price: 0,
  quantity_available: 1,
  expiration_date: '',
  category_id: 0,
  is_active: true
})

const errors = reactive<Record<string, string>>({})

// Calculés
const today = computed(() => {
  const date = new Date()
  date.setDate(date.getDate() + 1) // Minimum demain
  return date.toISOString().split('T')[0]
})

const discountPercentage = computed(() => {
  if (form.original_price && form.discounted_price) {
    return Math.round(((form.original_price - form.discounted_price) / form.original_price) * 100)
  }
  return 0
})

const savings = computed(() => {
  if (form.original_price && form.discounted_price) {
    return form.original_price - form.discounted_price
  }
  return 0
})

// Méthodes
const loadProduct = async () => {
  try {
    loading.value = true
    error.value = ''

    const productId = parseInt(route.params.id as string)
    if (!productId) {
      throw new Error('ID produit invalide')
    }

    // Charger le produit et les catégories en parallèle
    const [productResponse, categoriesResponse] = await Promise.all([
      merchantService.getProducts(), // On récupère tous les produits et on filtre
      merchantService.getCategories()
    ])

    if (!productResponse.success) {
      throw new Error(productResponse.message || 'Erreur lors du chargement du produit')
    }

    if (!categoriesResponse.success) {
      throw new Error(categoriesResponse.message || 'Erreur lors du chargement des catégories')
    }

    // Trouver le produit spécifique
    const foundProduct = productResponse.data.products.find(p => p.id === productId)
    if (!foundProduct) {
      throw new Error('Produit non trouvé')
    }

    product.value = foundProduct
    categories.value = categoriesResponse.data.categories

    // Pré-remplir le formulaire
    form.name = foundProduct.name
    form.description = foundProduct.description
    form.original_price = parseFloat(foundProduct.original_price)
    form.discounted_price = parseFloat(foundProduct.discounted_price)
    form.quantity_available = foundProduct.quantity_available
    form.expiration_date = foundProduct.expiration_date.split('T')[0] // Format YYYY-MM-DD
    form.category_id = foundProduct.category.id
    form.is_active = foundProduct.is_active ?? true

  } catch (err: any) {
    error.value = err.message
    console.error('Erreur lors du chargement du produit:', err)
  } finally {
    loading.value = false
  }
}

const validateForm = (): boolean => {
  // Reset errors
  Object.keys(errors).forEach(key => delete errors[key])

  const validation = merchantService.validateProductData(form)

  if (!validation.isValid) {
    validation.errors.forEach((error, index) => {
      errors[`field_${index}`] = error
    })
    return false
  }

  return true
}

const saveProduct = async () => {
  if (!validateForm() || !product.value) return

  try {
    loading.value = true

    const response = await merchantService.updateProduct(product.value.id, form)

    if (!response.success) {
      throw new Error(response.message || 'Erreur lors de la sauvegarde')
    }

    // Mise à jour réussie
    product.value = response.data.product

    // Notification de succès (vous pouvez ajouter un toast ici)
    console.log('Produit mis à jour avec succès!')

    // Retour à la liste des produits
    router.push('/merchant/products')

  } catch (err: any) {
    error.value = err.message
    console.error('Erreur lors de la sauvegarde:', err)
  } finally {
    loading.value = false
  }
}

const handleImageChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (file) {
    // Validation de l'image
    const maxSize = 5 * 1024 * 1024 // 5 MB
    if (file.size > maxSize) {
      errors.image = 'La taille de l\'image ne doit pas dépasser 5 MB'
      return
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      errors.image = 'Format d\'image non supporté. Utilisez JPG, PNG ou WebP'
      return
    }

    form.image = file
    delete errors.image

    // Créer l'aperçu
    const reader = new FileReader()
    reader.onload = (e) => {
      imagePreview.value = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }
}

const toggleStatus = async () => {
  if (!product.value) return

  try {
    loading.value = true

    const newStatus = !product.value.is_active
    const response = await merchantService.toggleProductStatus(product.value.id, newStatus)

    if (!response.success) {
      throw new Error(response.message || 'Erreur lors du changement de statut')
    }

    product.value.is_active = newStatus
    form.is_active = newStatus

  } catch (err: any) {
    error.value = err.message
    console.error('Erreur lors du changement de statut:', err)
  } finally {
    loading.value = false
  }
}

const duplicateProduct = () => {
  // Rediriger vers la création avec les données pré-remplies
  const queryData = {
    name: `${form.name} (Copie)`,
    description: form.description,
    original_price: form.original_price,
    discounted_price: form.discounted_price,
    quantity_available: form.quantity_available,
    category_id: form.category_id
  }

  router.push({
    name: 'merchant-product-create',
    query: queryData
  })
}

const deleteProduct = () => {
  showDeleteModal.value = true
}

const confirmDelete = async () => {
  if (!product.value) return

  try {
    loading.value = true

    const response = await merchantService.deleteProduct(product.value.id)

    if (!response.success) {
      throw new Error(response.message || 'Erreur lors de la suppression')
    }

    // Redirection après suppression réussie
    router.push('/merchant/products')

  } catch (err: any) {
    error.value = err.message
    console.error('Erreur lors de la suppression:', err)
  } finally {
    loading.value = false
    showDeleteModal.value = false
  }
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// Watchers pour validation en temps réel
watch(() => form.original_price, () => {
  if (form.discounted_price >= form.original_price) {
    errors.discounted_price = 'Le prix réduit doit être inférieur au prix original'
  } else {
    delete errors.discounted_price
  }
})

watch(() => form.discounted_price, () => {
  if (form.discounted_price >= form.original_price) {
    errors.discounted_price = 'Le prix réduit doit être inférieur au prix original'
  } else {
    delete errors.discounted_price
  }
})

// Initialisation
onMounted(() => {
  loadProduct()
})
</script>