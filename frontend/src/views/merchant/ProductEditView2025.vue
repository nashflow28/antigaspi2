<template>
  <DashboardLayout
    :sidebar="sidebar"
    :header="header"
    class="bg-gradient-to-br from-primary-50 to-accent-blue/10"
  >
    <div class="container px-3 sm:px-4 lg:px-6 py-6">
      <!-- Header -->
      <div class="mt-4 sm:mb-3xl">
        <div class="flex items-center gap-3 mt-3">
          <router-link
            to="/merchant/products"
            class="flex items-center text-neutral-600 hover:transition-colors"
          >
            <ArrowLeftIcon class="h-4 w-4 mr-2" />
            Retour aux produits
          </router-link>
        </div>

        <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 sm:gap-6">
          <div>
            <h1 class="text-xl lg:text-3xl font-semibold text-neutral-900 mt-2">
              {{ product ? 'Modifier le produit' : 'Chargement...' }}
            </h1>
            <p class="text-neutral-600 text-lg">
              {{ product ? product.name : 'Veuillez patienter...' }}
            </p>
          </div>

          <div v-if="product" class="flex gap-3">
            <Button
              variant="destructive"
              :disabled="loading"
              @click="deleteProduct"
            >
              <TrashIcon class="h-4 w-4 mr-2" />
              Supprimer
            </Button>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <Card v-if="!product && !error">
        <div class="flex items-center justify-center py-8 sm:py-12 lg:py-16">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
          <span class="ml-4 text-neutral-600">Chargement du produit...</span>
        </div>
      </Card>

      <!-- Error State -->
      <Card v-if="error" variant="bordered" class="bg-accent-red/10 border-accent-red/40">
        <div class="flex items-center justify-center py-6 sm:py-8">
          <AlertCircleIcon class="h-6 w-6 text-accent-red mr-4" />
          <div>
            <h3 class="text-lg font-semibold text-accent-red mb-1">Erreur de chargement</h3>
            <p class="text-accent-red">{{ error }}</p>
          </div>
        </div>
      </Card>

      <!-- Main Form -->
      <form v-if="product && !error" @submit.prevent="saveProduct">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          <!-- Main Form -->
          <div class="lg:col-span-2 space-y-6">
            <Card>
              <template #header>
                <h3 class="text-xl font-semibold text-neutral-900">Informations générales</h3>
              </template>

              <div class="space-y-6">
                <!-- Product Name -->
                <div>
                  <label for="name" class="block text-sm font-medium text-neutral-800 mt-2">
                    Nom du produit <span class="text-accent-red">*</span>
                  </label>
                  <Input
                    id="name"
                    v-model="product.name"
                    :error="errors.name"
                    placeholder="Ex: Pain complet artisanal"
                    required
                  />
                </div>

                <!-- Description -->
                <div>
                  <label for="description" class="block text-sm font-medium text-neutral-800 mt-2">
                    Description
                  </label>
                  <textarea
                    id="description"
                    v-model="product.description"
                    rows="4"
                    class="w-full px-3 py-3 text-neutral-900 bg-white border border-neutral-200 rounded shadow-sm placeholder:text-neutral-400 transition-all duration-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    :class="{ 'border-accent-red/60 bg-accent-red/10 focus:ring-accent-red focus:border-accent-red': errors.description }"
                    placeholder="Décrivez votre produit..."
                  />
                  <p v-if="errors.description" class="mt-2 text-sm text-accent-red">{{ errors.description }}</p>
                </div>

                <!-- Category -->
                <div>
                  <label for="category" class="block text-sm font-medium text-neutral-800 mt-2">
                    Catégorie <span class="text-accent-red">*</span>
                  </label>
                  <select
                    id="category"
                    v-model="product.category_id"
                    class="w-full px-3 py-3 text-neutral-900 bg-white border border-neutral-200 rounded shadow-sm transition-all duration-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    :class="{ 'border-accent-red/60 bg-accent-red/10 focus:ring-accent-red focus:border-accent-red': errors.category_id }"
                    required
                  >
                    <option value="">Sélectionner une catégorie</option>
                    <option v-for="category in categories" :key="category.id" :value="category.id">
                      {{ category.name }}
                    </option>
                  </select>
                  <p v-if="errors.category_id" class="mt-2 text-sm text-accent-red">{{ errors.category_id }}</p>
                </div>
              </div>
            </Card>

            <Card>
              <template #header>
                <h3 class="text-xl font-semibold text-neutral-900">Prix et disponibilité</h3>
              </template>

              <div class="space-y-6">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <!-- Original Price -->
                  <div>
                    <label for="original_price" class="block text-sm font-medium text-neutral-800 mt-2">
                      Prix original (XOF) <span class="text-accent-red">*</span>
                    </label>
                    <Input
                      id="original_price"
                      v-model="product.original_price"
                      type="number"
                      :error="errors.original_price"
                      placeholder="0"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>

                  <!-- Discounted Price -->
                  <div>
                    <label for="discounted_price" class="block text-sm font-medium text-neutral-800 mt-2">
                      Prix réduit (XOF) <span class="text-accent-red">*</span>
                    </label>
                    <Input
                      id="discounted_price"
                      v-model="product.discounted_price"
                      type="number"
                      :error="errors.discounted_price"
                      placeholder="0"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                </div>

                <!-- Quantity -->
                <div>
                  <label for="quantity_available" class="block text-sm font-medium text-neutral-800 mt-2">
                    Quantité disponible <span class="text-accent-red">*</span>
                  </label>
                  <Input
                    id="quantity_available"
                    v-model="product.quantity_available"
                    type="number"
                    :error="errors.quantity_available"
                    placeholder="0"
                    min="0"
                    required
                  />
                </div>

                <!-- Expiry Date -->
                <div>
                  <label for="expires_at" class="block text-sm font-medium text-neutral-800 mt-2">
                    Date d'expiration
                  </label>
                  <Input
                    id="expires_at"
                    v-model="product.expires_at"
                    type="datetime-local"
                    :error="errors.expires_at"
                  />
                </div>
              </div>
            </Card>

            <Card>
              <template #header>
                <h3 class="text-xl font-semibold text-neutral-900">Image du produit</h3>
              </template>

              <div class="space-y-4">
                <!-- Image Preview -->
                <div v-if="product.image_url" class="flex items-center gap-3">
                  <img :src="product.image_url" :alt="product.name" class="w-6xl h-6xl object-cover rounded">
                  <Button
                    variant="outline"
                    size="sm"
                    @click="removeImage"
                  >
                    <TrashIcon class="h-4 w-4 mr-2" />
                    Supprimer l'image
                  </Button>
                </div>

                <!-- Image Upload -->
                <div class="border-2 border-dashed border-neutral-300 rounded p-6 text-left sm:text-center hover:transition-colors">
                  <input
                    ref="imageInput"
                    type="file"
                    accept="image/*"
                    class="hidden sm:block"
                    @change="handleImageUpload"
                  >
                  <Button
                    variant="ghost"
                    class="w-full"
                    @click="$refs.imageInput.click()"
                  >
                    <CloudUploadIcon class="h-4 w-4 mr-2" />
                    {{ product.image_url ? 'Changer l\'image' : 'Ajouter une image' }}
                  </Button>
                  <p class="text-sm text-neutral-500 mt-2">PNG, JPG jusqu'à 2MB</p>
                </div>
              </div>
            </Card>

            <!-- Actions -->
            <Card>
              <div class="flex flex-col sm:flex-row gap-3 justify-center sm:justify-end">
                <Button
                  variant="ghost"
                  :disabled="saving"
                  @click="$router.push('/merchant/products')"
                >
                  Annuler
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  :disabled="saving"
                  :loading="saving"
                >
                  {{ saving ? 'Enregistrement...' : 'Enregistrer les modifications' }}
                </Button>
              </div>
            </Card>
          </div>

          <!-- Sidebar -->
          <div class="space-y-6">
            <Card>
              <template #header>
                <h3 class="text-lg font-semibold text-neutral-900">Status</h3>
              </template>

              <div class="space-y-4">
                <div class="flex items-center justify-between">
                  <span class="text-sm font-medium text-neutral-800">Statut</span>
                  <Badge :variant="product.status === 'active' ? 'success' : 'secondary'">
                    {{ product.status === 'active' ? 'Actif' : 'Inactif' }}
                  </Badge>
                </div>

                <div class="flex items-center justify-between">
                  <span class="text-sm font-medium text-neutral-800">Réduction</span>
                  <Badge variant="warning">
                    -{{ Math.round(((product.original_price - product.discounted_price) / product.original_price) * 100) }}%
                  </Badge>
                </div>

                <div class="flex items-center justify-between">
                  <span class="text-sm font-medium text-neutral-800">Créé le</span>
                  <span class="text-sm text-neutral-500">{{ formatDate(product.created_at) }}</span>
                </div>

                <div class="flex items-center justify-between">
                  <span class="text-sm font-medium text-neutral-800">Modifié le</span>
                  <span class="text-sm text-neutral-500">{{ formatDate(product.updated_at) }}</span>
                </div>
              </div>
            </Card>

            <Card>
              <template #header>
                <h3 class="text-lg font-semibold text-neutral-900">Statistiques</h3>
              </template>

                <div class="space-y-4">
                <div class="flex items-center justify-between">
                  <span class="text-sm font-medium text-neutral-800">Vues</span>
                  <span class="text-sm font-semibold text-neutral-900">{{ product.views || 0 }}</span>
                </div>

                <div class="flex items-center justify-between">
                  <span class="text-sm font-medium text-neutral-800">Réservations</span>
                  <span class="text-sm font-semibold text-neutral-900">{{ product.reservations_count || 0 }}</span>
                </div>

                <div class="flex items-center justify-between">
                  <span class="text-sm font-medium text-neutral-800">Revenus</span>
                  <span class="text-sm font-semibold text-primary-600">
                    {{ formatPrice((product.reservations_count || 0) * product.discounted_price) }}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </form>
    </div>
  </DashboardLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDashboardLayout } from '@/composables/useDashboardLayout'
import { notify } from '@/composables/useNotifications'
import { formatPrice } from '@/utils/currency'
import {
  ArrowLeftIcon,
  TrashIcon,
  AlertCircleIcon,
  CloudUploadIcon
} from 'lucide-vue-next'
import DashboardLayout from '@/components/ui/DashboardLayout.vue'

// Import 2025 Design System components
import Card from '@/components/ui/2025/Card.vue'
import Button from '@/components/ui/2025/Button.vue'
import Badge from '@/components/ui/2025/Badge.vue'
import Input from '@/components/ui/2025/Input.vue'

const route = useRoute()
const router = useRouter()
const { sidebar, header } = useDashboardLayout('merchant')

// State
const product = ref(null)
const categories = ref([])
const loading = ref(false)
const saving = ref(false)
const error = ref(null)
const errors = ref({})
const imageInput = ref(null)

// Methods
const loadProduct = async () => {
  loading.value = true
  try {
    // Mock product data - replace with actual API call
    product.value = {
      id: route.params.id,
      name: 'Pain complet artisanal',
      description: 'Pain frais du jour avec farine complète bio',
      category_id: 1,
      original_price: 500,
      discounted_price: 300,
      quantity_available: 10,
      expires_at: '2025-09-26T18:00',
      image_url: null,
      status: 'active',
      created_at: '2025-09-20T10:00:00Z',
      updated_at: '2025-09-25T15:30:00Z',
      views: 45,
      reservations_count: 3
    }
  } catch (err) {
    error.value = 'Erreur lors du chargement du produit'
  } finally {
    loading.value = false
  }
}

const loadCategories = async () => {
  try {
    // Mock categories - replace with actual API call
    categories.value = [
      { id: 1, name: 'Boulangerie' },
      { id: 2, name: 'Pâtisserie' },
      { id: 3, name: 'Fruits & Légumes' }
    ]
  } catch (err) {
    // console.error('Error loading categories:', err)
  }
}

const saveProduct = async () => {
  saving.value = true
  errors.value = {}

  try {
    // Mock save - replace with actual API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    notify.success('Produit mis à jour avec succès')
    router.push('/merchant/products')
  } catch (err) {
    notify.error('Erreur lors de la sauvegarde')
  } finally {
    saving.value = false
  }
}

const deleteProduct = async () => {
  if (!confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) return

  try {
    // Mock delete - replace with actual API call
    await new Promise(resolve => setTimeout(resolve, 500))
    notify.success('Produit supprimé avec succès')
    router.push('/merchant/products')
  } catch (err) {
    notify.error('Erreur lors de la suppression')
  }
}

const handleImageUpload = async (event) => {
  const file = event.target.files?.[0]
  if (!file) return

  try {
    // Mock upload - replace with actual API call
    const url = URL.createObjectURL(file)
    product.value.image_url = url
    notify.success('Image ajoutée avec succès')
  } catch (err) {
    notify.error('Erreur lors du téléchargement de l\'image')
  }
}

const removeImage = () => {
  product.value.image_url = null
  notify.success('Image supprimée')
}

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(dateString))
}

onMounted(() => {
  loadProduct()
  loadCategories()
})
</script>
