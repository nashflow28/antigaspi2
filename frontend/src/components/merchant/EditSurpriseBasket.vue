<template>
  <div class="edit-surprise-basket">
    <!-- Header -->
    <div class="mb-6">
      <h2 class="text-2xl font-bold text-neutral-900 mb-2">
        Modifier le Panier Surprise
      </h2>
      <p class="text-neutral-600">
        Modifiez les informations de votre panier surprise
      </p>
    </div>

    <!-- Form -->
    <form class="space-y-6" @submit.prevent="handleSubmit">
      <!-- Basic Information -->
      <div class="bg-white rounded-xl border border-neutral-200 p-6">
        <h3 class="text-lg font-semibold text-neutral-900 mb-4">Informations générales</h3>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Name -->
          <div>
            <label for="name" class="block text-sm font-medium text-neutral-700 mb-2">
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
            <label for="category" class="block text-sm font-medium text-neutral-700 mb-2">
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
            <label for="price" class="block text-sm font-medium text-neutral-700 mb-2">
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
            <label for="quantity" class="block text-sm font-medium text-neutral-700 mb-2">
              Nombre de paniers disponibles *
            </label>
            <input
              id="quantity"
              v-model.number="form.quantity_available"
              type="number"
              min="0"
              required
              class="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="5"
            >
          </div>
        </div>

        <!-- Description -->
        <div class="mt-6">
          <label for="description" class="block text-sm font-medium text-neutral-700 mb-2">
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
          <label for="surprise-description" class="block text-sm font-medium text-neutral-700 mb-2">
            Description mystère (visible par les clients)
          </label>
          <textarea
            id="surprise-description"
            v-model="form.surprise_description"
            rows="2"
            class="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="Ex: Un assortiment de viennoiseries fraîches du jour..."
          />
          <p class="text-sm text-neutral-500 mt-1">
            Cette description sera visible par les clients sans révéler le contenu exact
          </p>
        </div>
      </div>

      <!-- Status -->
      <div class="bg-white rounded-xl border border-neutral-200 p-6">
        <h3 class="text-lg font-semibold text-neutral-900 mb-4">Statut</h3>

        <div class="flex items-center">
          <input
            id="is-active"
            v-model="form.is_active"
            type="checkbox"
            class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
          >
          <label for="is-active" class="ml-2 block text-sm text-neutral-900">
            Panier actif et visible par les clients
          </label>
        </div>
        <p class="text-sm text-neutral-500 mt-1">
          Décochez pour désactiver temporairement ce panier surprise
        </p>
      </div>

      <!-- Additional Options -->
      <div class="bg-white rounded-xl border border-neutral-200 p-6">
        <h3 class="text-lg font-semibold text-neutral-900 mb-4">Options avancées</h3>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Min Items -->
          <div>
            <label for="min-items" class="block text-sm font-medium text-neutral-700 mb-2">
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
            <label for="max-items" class="block text-sm font-medium text-neutral-700 mb-2">
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
            <label for="expiration" class="block text-sm font-medium text-neutral-700 mb-2">
              Date d'expiration
            </label>
            <input
              id="expiration"
              v-model="form.expiration_date"
              type="date"
              class="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
          </div>

          <!-- Image URL -->
          <div>
            <label for="image" class="block text-sm font-medium text-neutral-700 mb-2">
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

      <!-- Current Products -->
      <div class="bg-white rounded-xl border border-neutral-200 p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-neutral-900">Produits inclus</h3>
          <p class="text-sm text-neutral-500">
            {{ basket.basket_items_count }} produit(s) • Valeur: {{ formatCurrency(basket.total_original_value || 0) }}
          </p>
        </div>

        <div v-if="basket.surprise_basket_items && basket.surprise_basket_items.length > 0" class="space-y-3">
          <div
            v-for="item in basket.surprise_basket_items"
            :key="item.id"
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
                <p class="text-sm text-neutral-500">
                  {{ item.quantity }} × {{ formatCurrency(item.unit_price) }} = {{ formatCurrency(item.total_price) }}
                </p>
              </div>
            </div>
            <button
              type="button"
              :disabled="removing"
              class="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
              @click="removeProductFromBasket(item.product.id)"
            >
              <Trash2 class="w-4 h-4" />
            </button>
          </div>
        </div>

        <div v-else class="text-center py-8 text-neutral-500">
          <Package class="w-12 h-12 mx-auto mb-3 text-neutral-300" />
          <p>Aucun produit dans ce panier</p>
        </div>

        <!-- Add Product Button -->
        <div class="mt-4 pt-4 border-t border-neutral-200">
          <button
            type="button"
            class="w-full px-4 py-3 border-2 border-dashed border-neutral-300 text-neutral-600 rounded-lg hover:border-primary-400 hover:text-primary-600 transition-colors"
            @click="showProductSelector = true"
          >
            <Plus class="w-4 h-4 inline mr-2" />
            Ajouter des produits
          </button>
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
          :disabled="!canSubmit || updating"
          class="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <div v-if="updating" class="flex items-center">
            <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
            Mise à jour...
          </div>
          <span v-else>Mettre à jour le panier</span>
        </button>
      </div>
    </form>

    <!-- Product Selector Modal -->
    <ProductSelectorModal
      v-if="showProductSelector"
      :selected-products="currentProducts"
      @close="showProductSelector = false"
      @select="handleProductSelection"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Plus, Trash2, Package } from 'lucide-vue-next'
import { useSurpriseBaskets } from '@/composables/useSurpriseBaskets'
import { useCategories } from '@/composables/useCategories'
import ProductSelectorModal from './ProductSelectorModal.vue'

interface Props {
  basket: any
}

const props = defineProps<Props>()

const emit = defineEmits<{
  cancel: []
  updated: [basket: any]
}>()

const { updateBasket, updating, addProductToBasket, removeProductFromBasket: removeFromBasket } = useSurpriseBaskets()
const { categories, loadCategories } = useCategories()

const showProductSelector = ref(false)
const removing = ref(false)

const form = ref({
  name: props.basket.name || '',
  description: props.basket.description || '',
  surprise_description: props.basket.surprise_description || '',
  category_id: props.basket.category_id || '',
  discounted_price: props.basket.discounted_price || 0,
  quantity_available: props.basket.quantity_available || 0,
  min_items: props.basket.min_items || null,
  max_items: props.basket.max_items || null,
  expiration_date: props.basket.expiration_date || '',
  image_url: props.basket.image_url || '',
  is_active: props.basket.is_active !== false
})

// Computed values
const canSubmit = computed(() => {
  return form.value.name.trim() !== '' &&
         form.value.discounted_price > 0 &&
         form.value.quantity_available >= 0
})

const currentProducts = computed(() => {
  return props.basket.surprise_basket_items?.map((item: any) => ({
    id: item.product.id,
    quantity: item.quantity
  })) || []
})

// Methods
const handleSubmit = async () => {
  if (!canSubmit.value) return

  const updateData = {
    name: form.value.name,
    description: form.value.description || undefined,
    surprise_description: form.value.surprise_description || undefined,
    category_id: form.value.category_id || undefined,
    discounted_price: form.value.discounted_price,
    quantity_available: form.value.quantity_available,
    min_items: form.value.min_items || undefined,
    max_items: form.value.max_items || undefined,
    expiration_date: form.value.expiration_date || undefined,
    image_url: form.value.image_url || undefined,
    is_active: form.value.is_active
  }

  const result = await updateBasket(props.basket.id, updateData)
  if (result) {
    emit('updated', result)
  }
}

const handleProductSelection = async (products: { id: number; quantity: number }[]) => {
  // For simplicity, we'll handle adding/removing products one by one
  // In a more complex implementation, you might want batch operations

  const currentProductIds = currentProducts.value.map((p: { id: number; quantity: number }) => p.id)
  const newProductIds = products.map(p => p.id)

  // Add new products
  for (const product of products) {
    if (!currentProductIds.includes(product.id)) {
      await addProductToBasket(props.basket.id, product.id, product.quantity)
    }
  }

  // Remove products that are no longer selected
  for (const productId of currentProductIds) {
    if (!newProductIds.includes(productId)) {
      await removeFromBasket(props.basket.id, productId)
    }
  }

  showProductSelector.value = false
}

const removeProductFromBasket = async (productId: number) => {
  removing.value = true
  try {
    await removeFromBasket(props.basket.id, productId)
  } finally {
    removing.value = false
  }
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('fr-FR').format(amount) + ' XOF'
}

onMounted(async () => {
  await loadCategories()
})
</script>
