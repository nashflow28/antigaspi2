<template>
  <div class="surprise-basket-detail">
    <!-- Header -->
    <div class="bg-white rounded border border-gray-200 p-6 mt-4">
      <div class="flex items-stretch sm:items-start justify-start sm:justify-between">
        <div class="flex-1">
          <div class="flex items-center space-y-2 sm:space-x-3 mb-4">
            <h1 class="text-xl font-semibold text-gray-900">{{ basket.name }}</h1>
            <span
              class="px-3 py-3 text-sm font-medium rounded-full"
              :class="basket.is_active
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'"
            >
              {{ basket.is_active ? 'Actif' : 'Inactif' }}
            </span>
          </div>

          <p v-if="basket.description" class="text-gray-700 mt-3">
            {{ basket.description }}
          </p>

          <!-- Stats Row -->
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div class="bg-blue-50 rounded p-3">
              <p class="text-sm text-blue-600 font-medium">Prix</p>
              <p class="text-lg font-semibold text-blue-900">{{ formatCurrency(basket.discounted_price) }}</p>
            </div>
            <div class="bg-green-50 rounded p-3">
              <p class="text-sm text-green-600 font-medium">Économies</p>
              <p class="text-lg font-semibold text-blue-900">{{ formatCurrency(basket.basket_savings || 0) }}</p>
            </div>
            <div class="bg-blue-50 rounded p-3">
              <p class="text-sm text-info font-medium">Articles</p>
              <p class="text-lg font-semibold text-secondary-900">{{ basket.basket_items_count }}</p>
            </div>
            <div class="bg-orange-50 rounded p-3">
              <p class="text-sm text-blue-600 font-medium">Stock</p>
              <p class="text-lg font-semibold text-orange-900">{{ basket.quantity_available }}</p>
            </div>
          </div>
        </div>

        <div class="flex items-center space-y-2 sm:space-x-3 ml-8">
          <button
            class="px-3 py-3 bg-blue-600 text-white rounded hover:transition-colors"
            @click="$emit('edit', basket)"
          >
            <Edit class="h-4 w-4 inline mr-2" />
            Modifier
          </button>
          <button
            class="p-2 text-gray-500 hover:transition-colors"
            @click="$emit('close')"
          >
            <X class="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>

    <!-- Main Content Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-6">
      <!-- Left Column - Products -->
      <div class="lg:col-span-2">
        <!-- Products in Basket -->
        <div class="bg-white rounded border border-gray-200 p-6">
          <h2 class="text-lg font-semibold text-gray-900 mt-3">Produits inclus</h2>

          <div v-if="basket.surprise_basket_items && basket.surprise_basket_items.length > 0" class="space-y-4">
            <div
              v-for="item in basket.surprise_basket_items"
              :key="item.id"
              class="flex items-center space-y-4 sm:space-x-4 p-4 bg-gray-50 rounded"
            >
              <!-- Product Image -->
              <img
                v-if="item.product.image_url"
                :src="item.product.image_url"
                :alt="item.product.name"
                class="w-12 h-10 object-cover rounded flex-shrink-0"
              >
              <div
                v-else
                class="w-12 h-10 bg-gray-200 rounded flex items-center justify-center flex-shrink-0"
              >
                <Package class="h-6 w-6 text-gray-400" />
              </div>

              <!-- Product Info -->
              <div class="flex-1 min-w-none">
                <h3 class="font-medium text-gray-900 truncate">{{ item.product.name }}</h3>
                <p v-if="item.product.description" class="text-sm text-gray-500 line-clamp-2">
                  {{ item.product.description }}
                </p>

                <div class="mt-2 flex items-center justify-start sm:justify-between">
                  <div class="flex items-center space-y-4 sm:space-x-2">
                    <span class="text-sm font-medium text-green-600">
                      {{ formatCurrency(item.unit_price) }} × {{ item.quantity }}
                    </span>
                    <span class="text-sm text-gray-400 line-through">
                      {{ formatCurrency(item.product.original_price) }}
                    </span>
                  </div>
                  <span class="text-sm font-medium text-gray-900">
                    = {{ formatCurrency(item.total_price) }}
                  </span>
                </div>

                <!-- Category Badge -->
                <div v-if="item.product.category" class="mt-2">
                  <span class="inline-flex items-center px-3 py-3 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                    {{ item.product.category.name }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Total Summary -->
            <div class="border-t border-gray-200 padding-t-lg">
              <div class="bg-green-50 border border-blue-200 rounded p-4">
                <div class="flex justify-start sm:justify-between items-center text-sm mt-2">
                  <span class="text-green-700">Valeur totale des produits:</span>
                  <span class="font-semibold text-blue-900">{{ formatCurrency(basket.total_original_value || 0) }}</span>
                </div>
                <div class="flex justify-start sm:justify-between items-center text-sm mt-2">
                  <span class="text-green-700">Prix du panier:</span>
                  <span class="font-semibold text-blue-900">{{ formatCurrency(basket.discounted_price) }}</span>
                </div>
                <div class="flex justify-start sm:justify-between items-center text-lg border-t border-blue-200 padding-t-sm">
                  <span class="text-green-700 font-medium">Économies pour le client:</span>
                  <span class="font-semibold text-blue-900">
                    {{ formatCurrency(basket.basket_savings || 0) }}
                    ({{ basket.basket_discount_percentage || 0 }}%)
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="text-left sm:text-center py-8 sm:py-12 lg:py-16 text-gray-500">
            <Package class="w-12 h-10 mx-auto mt-3 text-gray-500" />
            <h3 class="text-lg font-medium text-gray-900 mt-2">Aucun produit</h3>
            <p class="text-gray-700 mt-3">
              Ce panier surprise ne contient aucun produit pour le moment
            </p>
            <button
              class="px-3 py-3 bg-blue-600 text-white rounded hover:transition-colors"
              @click="$emit('edit', basket)"
            >
              Ajouter des produits
            </button>
          </div>
        </div>
      </div>

      <!-- Right Column - Details -->
      <div class="space-y-6">
        <!-- Basic Information -->
        <div class="bg-white rounded border border-gray-200 p-6">
          <h3 class="text-lg font-semibold text-gray-900 mt-3">Informations</h3>

          <div class="space-y-4">
            <!-- Category -->
            <div v-if="basket.category">
              <p class="text-sm font-medium text-gray-700">Catégorie</p>
              <p class="text-gray-900">{{ basket.category.name }}</p>
            </div>

            <!-- Mystery Description -->
            <div v-if="basket.surprise_description">
              <p class="text-sm font-medium text-gray-700">Description mystère</p>
              <p class="text-gray-900">{{ basket.surprise_description }}</p>
            </div>

            <!-- Item Range -->
            <div v-if="basket.min_items || basket.max_items">
              <p class="text-sm font-medium text-gray-700">Nombre d'articles</p>
              <p class="text-gray-900">
                <span v-if="basket.min_items && basket.max_items">
                  Entre {{ basket.min_items }} et {{ basket.max_items }} articles
                </span>
                <span v-else-if="basket.min_items">
                  Minimum {{ basket.min_items }} articles
                </span>
                <span v-else-if="basket.max_items">
                  Maximum {{ basket.max_items }} articles
                </span>
              </p>
            </div>

            <!-- Expiration -->
            <div v-if="basket.expiration_date">
              <p class="text-sm font-medium text-gray-700">Date d'expiration</p>
              <p class="text-gray-900">{{ formatDate(basket.expiration_date) }}</p>
            </div>

            <!-- Creation Date -->
            <div>
              <p class="text-sm font-medium text-gray-700">Créé le</p>
              <p class="text-gray-900">{{ formatDateTime(basket.created_at) }}</p>
            </div>

            <!-- Last Update -->
            <div v-if="basket.updated_at !== basket.created_at">
              <p class="text-sm font-medium text-gray-700">Dernière modification</p>
              <p class="text-gray-900">{{ formatDateTime(basket.updated_at) }}</p>
            </div>
          </div>
        </div>

        <!-- Image Preview -->
        <div v-if="basket.image_url" class="bg-white rounded border border-gray-200 p-6">
          <h3 class="text-lg font-semibold text-gray-900 mt-3">Image</h3>
          <img
            :src="basket.image_url"
            :alt="basket.name"
            class="w-full h-8xl object-cover rounded"
          >
        </div>

        <!-- Quick Actions -->
        <div class="bg-white rounded border border-gray-200 p-6">
          <h3 class="text-lg font-semibold text-gray-900 mt-3">Actions</h3>

          <div class="space-y-2">
            <button
              class="w-full px-3 py-3 bg-blue-600 text-white rounded hover:transition-colors flex items-center justify-center"
              @click="$emit('edit', basket)"
            >
              <Edit class="h-4 w-4 mr-2" />
              Modifier le panier
            </button>

            <button
              :disabled="updating"
              class="w-full px-3 py-3 border border-gray-300 text-gray-800 rounded hover:transition-colors flex items-center justify-center disabled:opacity-50"
              @click="toggleStatus"
            >
              <component :is="basket.is_active ? EyeOff : Eye" class="h-4 w-4 mr-2" />
              {{ basket.is_active ? 'Désactiver' : 'Activer' }}
            </button>

            <button
              :disabled="deleting"
              class="w-full px-3 py-3 border border-red-300 text-red-600 rounded hover:transition-colors flex items-center justify-center disabled:opacity-50"
              @click="confirmDelete"
            >
              <Trash2 class="h-4 w-4 mr-2" />
              Supprimer
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Edit, X, Package, Eye, EyeOff, Trash2 } from 'lucide-vue-next'
import { useSurpriseBaskets } from '@/composables/useSurpriseBaskets'

interface Props {
  basket: any
}

const props = defineProps<Props>()

const emit = defineEmits<{
  edit: [basket: any]
  close: []
}>()

const { updateBasket, deleteBasket, updating, deleting } = useSurpriseBaskets()

// Methods
const toggleStatus = async () => {
  await updateBasket(props.basket.id, { is_active: !props.basket.is_active })
}

const confirmDelete = () => {
  if (confirm(`Êtes-vous sûr de vouloir supprimer le panier "${props.basket.name}" ? Cette action est irréversible.`)) {
    deleteBasket(props.basket.id).then(success => {
      if (success) {
        emit('close')
      }
    })
  }
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('fr-FR').format(amount) + ' XOF'
}

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('fr-FR')
}

const formatDateTime = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
