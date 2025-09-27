<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 z-[120] flex items-center justify-center p-4">
    <div class="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
      <!-- Header -->
      <div class="flex items-center justify-between p-6 border-b border-neutral-200">
        <h3 class="text-xl font-semibold text-neutral-900">Sélectionner des produits</h3>
        <button
          class="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          @click="$emit('close')"
        >
          <X class="w-5 h-5 text-neutral-500" />
        </button>
      </div>

      <!-- Search and Filters -->
      <div class="p-6 border-b border-neutral-200 bg-neutral-50">
        <div class="flex flex-col sm:flex-row gap-4">
          <!-- Search -->
          <div class="flex-1">
            <div class="relative">
              <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Rechercher un produit..."
                class="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
            </div>
          </div>

          <!-- Category Filter -->
          <div class="sm:w-48">
            <select
              v-model="selectedCategory"
              class="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Toutes les catégories</option>
              <option v-for="category in categories" :key="category.id" :value="category.id">
                {{ category.name }}
              </option>
            </select>
          </div>
        </div>
      </div>

      <!-- Products List -->
      <div class="flex-1 overflow-y-auto max-h-96">
        <div v-if="loading" class="p-8 text-center">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2" />
          <p class="text-neutral-600">Chargement des produits...</p>
        </div>

        <div v-else-if="filteredProducts.length === 0" class="p-8 text-center text-neutral-500">
          <Package class="w-12 h-12 mx-auto mb-3 text-neutral-300" />
          <p>Aucun produit trouvé</p>
          <p class="text-sm">Essayez de modifier vos critères de recherche</p>
        </div>

        <div v-else class="p-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              v-for="product in filteredProducts"
              :key="product.id"
              class="border border-neutral-200 rounded-lg p-4 hover:bg-neutral-50 transition-colors"
              :class="{ 'bg-primary-50 border-primary-200': isSelected(product.id) }"
            >
              <div class="flex items-start space-x-3">
                <!-- Product Image -->
                <img
                  v-if="product.image_url"
                  :src="product.image_url"
                  :alt="product.name"
                  class="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                >
                <div
                  v-else
                  class="w-16 h-16 bg-neutral-200 rounded-lg flex items-center justify-center flex-shrink-0"
                >
                  <Package class="w-8 h-8 text-neutral-400" />
                </div>

                <!-- Product Info -->
                <div class="flex-1 min-w-0">
                  <h4 class="font-medium text-neutral-900 truncate">{{ product.name }}</h4>
                  <p class="text-sm text-neutral-500 line-clamp-2">{{ product.description }}</p>

                  <div class="mt-2 flex items-center justify-between">
                    <div class="flex items-center space-x-2">
                      <span class="text-sm font-medium text-green-600">
                        {{ product.discounted_price }} XOF
                      </span>
                      <span class="text-sm text-neutral-400 line-through">
                        {{ product.original_price }} XOF
                      </span>
                    </div>
                    <span class="text-xs text-neutral-500">
                      Stock: {{ product.quantity_available }}
                    </span>
                  </div>

                  <!-- Quantity Selector -->
                  <div class="mt-3 flex items-center justify-between">
                    <div class="flex items-center space-x-2">
                      <label class="text-sm text-neutral-700">Quantité:</label>
                      <div class="flex items-center space-x-1">
                        <button
                          type="button"
                          :disabled="getQuantity(product.id) <= 0"
                          class="w-7 h-7 rounded-full border border-neutral-300 flex items-center justify-center hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                          @click="updateQuantity(product.id, getQuantity(product.id) - 1)"
                        >
                          <Minus class="w-3 h-3" />
                        </button>
                        <input
                          :value="getQuantity(product.id)"
                          type="number"
                          min="0"
                          :max="product.quantity_available"
                          class="w-12 text-center text-sm border border-neutral-300 rounded py-1"
                          @input="updateQuantity(product.id, parseInt(($event.target as HTMLInputElement).value) || 0)"
                        >
                        <button
                          type="button"
                          :disabled="getQuantity(product.id) >= product.quantity_available"
                          class="w-7 h-7 rounded-full border border-neutral-300 flex items-center justify-center hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                          @click="updateQuantity(product.id, getQuantity(product.id) + 1)"
                        >
                          <Plus class="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <!-- Toggle Button -->
                    <button
                      type="button"
                      class="px-3 py-1 text-sm rounded-lg transition-colors"
                      :class="isSelected(product.id)
                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                        : 'bg-primary-100 text-primary-700 hover:bg-primary-200'"
                      @click="toggleProduct(product)"
                    >
                      {{ isSelected(product.id) ? 'Retirer' : 'Ajouter' }}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="p-6 border-t border-neutral-200 bg-neutral-50">
        <div class="flex items-center justify-between">
          <div class="text-sm text-neutral-600">
            {{ selectedProductsList.length }} produit(s) sélectionné(s)
          </div>
          <div class="flex items-center space-x-3">
            <button
              class="px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors"
              @click="$emit('close')"
            >
              Annuler
            </button>
            <button
              :disabled="selectedProductsList.length === 0"
              class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              @click="confirmSelection"
            >
              Confirmer la sélection
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { X, Search, Package, Plus, Minus } from 'lucide-vue-next'
import { useProducts } from '@/composables/useProducts'
import { useCategories } from '@/composables/useCategories'

interface Props {
  selectedProducts?: { id: number; quantity: number }[]
}

const props = withDefaults(defineProps<Props>(), {
  selectedProducts: () => []
})

const emit = defineEmits<{
  close: []
  select: [products: { id: number; quantity: number }[]]
}>()

const { merchantProducts, loadMerchantProducts, loading } = useProducts()
const { categories, loadCategories } = useCategories()

const searchQuery = ref('')
const selectedCategory = ref('')
const selectedProductsList = ref<{ id: number; quantity: number }[]>([...props.selectedProducts])

// Computed
const filteredProducts = computed(() => {
  let products = merchantProducts.value.filter(product =>
    product.is_active &&
    product.quantity_available > 0
    // Don't include other surprise baskets if the property exists
  )

  // Filter by search query
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    products = products.filter(product =>
      product.name.toLowerCase().includes(query) ||
      product.description?.toLowerCase().includes(query)
    )
  }

  // Filter by category
  if (selectedCategory.value) {
    products = products.filter(product =>
      product.category?.id?.toString() === selectedCategory.value
    )
  }

  return products
})

// Methods
const isSelected = (productId: number): boolean => {
  return selectedProductsList.value.some(item => item.id === productId)
}

const getQuantity = (productId: number): number => {
  const item = selectedProductsList.value.find(item => item.id === productId)
  return item?.quantity || 0
}

const updateQuantity = (productId: number, quantity: number) => {
  const product = merchantProducts.value.find(p => p.id === productId)
  if (!product) return

  // Clamp quantity to valid range
  quantity = Math.max(0, Math.min(quantity, product.quantity_available))

  const existingIndex = selectedProductsList.value.findIndex(item => item.id === productId)

  if (quantity === 0) {
    // Remove from selection
    if (existingIndex !== -1) {
      selectedProductsList.value.splice(existingIndex, 1)
    }
  } else {
    // Add or update selection
    if (existingIndex !== -1) {
      selectedProductsList.value[existingIndex].quantity = quantity
    } else {
      selectedProductsList.value.push({ id: productId, quantity })
    }
  }
}

const toggleProduct = (product: any) => {
  if (isSelected(product.id)) {
    // Remove from selection
    selectedProductsList.value = selectedProductsList.value.filter(item => item.id !== product.id)
  } else {
    // Add to selection with quantity 1
    selectedProductsList.value.push({ id: product.id, quantity: 1 })
  }
}

const confirmSelection = () => {
  emit('select', selectedProductsList.value)
  emit('close')
}

// Watch for changes in props to update local state
watch(() => props.selectedProducts, (newSelection) => {
  selectedProductsList.value = [...newSelection]
}, { immediate: true })

onMounted(async () => {
  await Promise.all([
    loadMerchantProducts(),
    loadCategories()
  ])
})
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
