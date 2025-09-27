<template>
  <div class="create-surprise-basket">
    <!-- Header -->
    <div class="mb-6">
      <h2 class="text-responsive-xl font-semibold text-neutral-900 mb-2">
        Créer un Panier Surprise
      </h2>
      <p class="text-neutral-600">
        Créez des paniers surprise avec vos produits invendus pour maximiser vos ventes
      </p>
    </div>

    <!-- Form -->
    <form class="space-y-6" @submit.prevent="handleSubmit">
      <!-- Basic Information -->
      <div class="bg-white rounded-xl border border-neutral-200 p-6">
        <h3 class="text-responsive-lg font-semibold text-neutral-900 mb-4">Informations générales</h3>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Name -->
          <div>
            <label for="name" class="block text-responsive-sm font-medium text-neutral-700 mb-2">
              Nom du panier surprise *
            </label>
            <input
              id="name"
              v-model="form.name"
              type="text"
              required
              class="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Ex: Panier Boulangerie du jour"
            >
          </div>

          <!-- Category -->
          <div>
            <label for="category" class="block text-responsive-sm font-medium text-neutral-700 mb-2">
              Catégorie
            </label>
            <select
              id="category"
              v-model="form.category_id"
              class="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Sélectionnez une catégorie</option>
              <option v-for="category in categories" :key="category.id" :value="category.id">
                {{ category.name }}
              </option>
            </select>
          </div>

          <!-- Price -->
          <div>
            <label for="price" class="block text-responsive-sm font-medium text-neutral-700 mb-2">
              Prix du panier (XOF) *
            </label>
            <input
              id="price"
              v-model.number="form.discounted_price"
              type="number"
              min="0"
              step="0.01"
              required
              class="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="2000"
            >
          </div>

          <!-- Quantity -->
          <div>
            <label for="quantity" class="block text-responsive-sm font-medium text-neutral-700 mb-2">
              Nombre de paniers disponibles *
            </label>
            <input
              id="quantity"
              v-model.number="form.quantity_available"
              type="number"
              min="1"
              required
              class="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="5"
            >
          </div>
        </div>

        <!-- Description -->
        <div class="mt-6">
          <label for="description" class="block text-responsive-sm font-medium text-neutral-700 mb-2">
            Description générale
          </label>
          <textarea
            id="description"
            v-model="form.description"
            rows="3"
            class="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="Décrivez brièvement ce panier surprise..."
          />
        </div>

        <!-- Surprise Description -->
        <div class="mt-6">
          <label for="surprise-description" class="block text-responsive-sm font-medium text-neutral-700 mb-2">
            Description mystère (visible par les clients)
          </label>
          <textarea
            id="surprise-description"
            v-model="form.surprise_description"
            rows="2"
            class="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="Ex: Un assortiment de viennoiseries fraîches du jour..."
          />
          <p class="text-responsive-sm text-neutral-500 mt-1">
            Cette description sera visible par les clients sans révéler le contenu exact
          </p>
        </div>
      </div>

      <!-- Products Selection -->
      <div class="bg-white rounded-xl border border-neutral-200 p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-responsive-lg font-semibold text-neutral-900">Produits inclus</h3>
          <button
            type="button"
            class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            @click="showProductSelector = true"
          >
            <Plus class="w-4 h-4 inline mr-2" />
            Ajouter des produits
          </button>
        </div>

        <!-- Selected Products -->
        <div v-if="selectedProducts.length === 0" class="text-center py-8 text-neutral-500">
          <Package class="w-12 h-12 mx-auto mb-3 text-neutral-300" />
          <p>Aucun produit sélectionné</p>
          <p class="text-responsive-sm">Ajoutez des produits pour créer votre panier surprise</p>
        </div>

        <div v-else class="space-y-4">
          <div
            v-for="item in selectedProducts"
            :key="item.product.id"
            class="flex items-center justify-between p-4 bg-neutral-50 rounded-lg"
          >
            <div class="flex items-center space-x-3">
              <img
                v-if="item.product.image_url"
                :src="item.product.image_url"
                :alt="item.product.name"
                class="w-12 h-12 object-cover rounded-lg"
              >
              <div
                v-else
                class="w-12 h-12 bg-neutral-200 rounded-lg flex items-center justify-center"
              >
                <Package class="w-6 h-6 text-neutral-400" />
              </div>
              <div>
                <h4 class="font-medium text-neutral-900">{{ item.product.name }}</h4>
                <p class="text-responsive-sm text-neutral-500">{{ item.product.original_price }} XOF l'unité</p>
              </div>
            </div>
            <div class="flex items-center space-x-3">
              <div class="flex items-center space-x-2">
                <button
                  type="button"
                  :disabled="item.quantity <= 1"
                  class="w-8 h-8 rounded-full border border-neutral-300 flex items-center justify-center hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  @click="updateProductQuantity(item.product.id, item.quantity - 1)"
                >
                  <Minus class="w-4 h-4" />
                </button>
                <span class="font-medium text-neutral-900 w-8 text-center">{{ item.quantity }}</span>
                <button
                  type="button"
                  class="w-8 h-8 rounded-full border border-neutral-300 flex items-center justify-center hover:bg-neutral-100"
                  @click="updateProductQuantity(item.product.id, item.quantity + 1)"
                >
                  <Plus class="w-4 h-4" />
                </button>
              </div>
              <button
                type="button"
                class="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                @click="removeProduct(item.product.id)"
              >
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>

          <!-- Summary -->
          <div class="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div class="flex justify-between items-center text-responsive-sm">
              <span class="text-green-700">Valeur totale des produits:</span>
              <span class="font-semibold text-green-900">{{ totalOriginalValue }} XOF</span>
            </div>
            <div class="flex justify-between items-center text-responsive-sm mt-1">
              <span class="text-green-700">Prix du panier:</span>
              <span class="font-semibold text-green-900">{{ form.discounted_price || 0 }} XOF</span>
            </div>
            <div class="flex justify-between items-center text-responsive-sm mt-1">
              <span class="text-green-700">Économies pour le client:</span>
              <span class="font-semibold text-green-900">{{ totalSavings }} XOF ({{ discountPercentage }}%)</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Additional Options -->
      <div class="bg-white rounded-xl border border-neutral-200 p-6">
        <h3 class="text-responsive-lg font-semibold text-neutral-900 mb-4">Options avancées</h3>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Min Items -->
          <div>
            <label for="min-items" class="block text-responsive-sm font-medium text-neutral-700 mb-2">
              Nombre minimum d'articles
            </label>
            <input
              id="min-items"
              v-model.number="form.min_items"
              type="number"
              min="1"
              class="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="3"
            >
          </div>

          <!-- Max Items -->
          <div>
            <label for="max-items" class="block text-responsive-sm font-medium text-neutral-700 mb-2">
              Nombre maximum d'articles
            </label>
            <input
              id="max-items"
              v-model.number="form.max_items"
              type="number"
              min="1"
              class="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="8"
            >
          </div>

          <!-- Expiration Date -->
          <div>
            <label for="expiration" class="block text-responsive-sm font-medium text-neutral-700 mb-2">
              Date d'expiration
            </label>
            <input
              id="expiration"
              v-model="form.expiration_date"
              type="date"
              :min="tomorrow"
              class="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
          </div>

          <!-- Image URL -->
          <div>
            <label for="image" class="block text-responsive-sm font-medium text-neutral-700 mb-2">
              URL de l'image
            </label>
            <input
              id="image"
              v-model="form.image_url"
              type="url"
              class="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="https://example.com/image.jpg"
            >
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex items-center justify-end space-x-4 pt-6">
        <button
          type="button"
          class="px-6 py-3 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors"
          @click="$emit('cancel')"
        >
          Annuler
        </button>
        <button
          type="submit"
          :disabled="!canSubmit || creating"
          class="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <div v-if="creating" class="flex items-center">
            <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
            Création...
          </div>
          <span v-else>Créer le panier surprise</span>
        </button>
      </div>
    </form>

    <!-- Product Selector Modal -->
    <ProductSelectorModal
      v-if="showProductSelector"
      :selected-products="selectedProducts.map(item => ({ id: item.product.id, quantity: item.quantity }))"
      @close="showProductSelector = false"
      @select="handleProductSelection"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Plus, Minus, Trash2, Package } from 'lucide-vue-next'
import { useSurpriseBaskets } from '@/composables/useSurpriseBaskets'
import { useCategories } from '@/composables/useCategories'
import { useProducts } from '@/composables/useProducts'
import ProductSelectorModal from './ProductSelectorModal.vue'

interface SelectedProduct {
  product: {
    id: number
    name: string
    description: string
    original_price: string
    discounted_price: string
    image_url?: string
  }
  quantity: number
}

const emit = defineEmits<{
  cancel: []
  created: [basket: any]
}>()

const { createBasket, creating } = useSurpriseBaskets()
const { categories, loadCategories } = useCategories()
const { merchantProducts, loadMerchantProducts } = useProducts()

const showProductSelector = ref(false)
const selectedProducts = ref<SelectedProduct[]>([])

const form = ref({
  name: '',
  description: '',
  surprise_description: '',
  category_id: '',
  discounted_price: 0,
  quantity_available: 1,
  min_items: null as number | null,
  max_items: null as number | null,
  expiration_date: '',
  image_url: ''
})

// Computed values
const tomorrow = computed(() => {
  const date = new Date()
  date.setDate(date.getDate() + 1)
  return date.toISOString().split('T')[0]
})

const totalOriginalValue = computed(() => {
  return selectedProducts.value.reduce((total, item) => {
    return total + (Number(item.product.original_price) * item.quantity)
  }, 0)
})

const totalSavings = computed(() => {
  return Math.max(0, totalOriginalValue.value - (form.value.discounted_price || 0))
})

const discountPercentage = computed(() => {
  if (totalOriginalValue.value === 0) return 0
  return Math.round((totalSavings.value / totalOriginalValue.value) * 100)
})

const canSubmit = computed(() => {
  return form.value.name.trim() !== '' &&
         form.value.discounted_price > 0 &&
         form.value.quantity_available > 0 &&
         selectedProducts.value.length > 0
})

// Methods
const handleProductSelection = (products: { id: number; quantity: number }[]) => {
  // Update selected products with full product data
  selectedProducts.value = products.map(item => {
    const product = merchantProducts.value.find(p => p.id === item.id)
    return {
      product: product!,
      quantity: item.quantity
    }
  }).filter(item => item.product) // Filter out any missing products
}

const updateProductQuantity = (productId: number, newQuantity: number) => {
  if (newQuantity <= 0) {
    removeProduct(productId)
    return
  }

  const item = selectedProducts.value.find(item => item.product.id === productId)
  if (item) {
    item.quantity = newQuantity
  }
}

const removeProduct = (productId: number) => {
  selectedProducts.value = selectedProducts.value.filter(item => item.product.id !== productId)
}

const handleSubmit = async () => {
  if (!canSubmit.value) return

  const basketData = {
    name: form.value.name,
    description: form.value.description || undefined,
    surprise_description: form.value.surprise_description || undefined,
    category_id: form.value.category_id ? parseInt(form.value.category_id) : undefined,
    discounted_price: form.value.discounted_price,
    quantity_available: form.value.quantity_available,
    min_items: form.value.min_items || undefined,
    max_items: form.value.max_items || undefined,
    expiration_date: form.value.expiration_date || undefined,
    image_url: form.value.image_url || undefined,
    products: selectedProducts.value.map(item => ({
      id: item.product.id,
      quantity: item.quantity
    }))
  }

  const result = await createBasket(basketData)
  if (result) {
    // Reset form
    form.value = {
      name: '',
      description: '',
      surprise_description: '',
      category_id: '',
      discounted_price: 0,
      quantity_available: 1,
      min_items: null,
      max_items: null,
      expiration_date: '',
      image_url: ''
    }
    selectedProducts.value = []

    // Emit success
    emit('created', result)
  }
}

onMounted(async () => {
  await Promise.all([
    loadCategories(),
    loadMerchantProducts()
  ])
})
</script>
