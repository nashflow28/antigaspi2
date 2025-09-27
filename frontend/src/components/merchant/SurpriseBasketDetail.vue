<template>
  <div class="surprise-basket-detail">
    <!-- Header -->
    <div class="bg-white rounded-xl border border-gray-200 p-6 mb-6">
      <div class="flex items-start justify-between">
        <div class="flex-1">
          <div class="flex items-center space-x-3 mb-3">
            <h1 class="text-2xl font-bold text-gray-900">{{ basket.name }}</h1>
            <span
              class="px-3 py-1 text-sm font-medium rounded-full"
              :class="basket.is_active
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'"
            >
              {{ basket.is_active ? 'Actif' : 'Inactif' }}
            </span>
          </div>

          <p v-if="basket.description" class="text-gray-600 mb-4">
            {{ basket.description }}
          </p>

          <!-- Stats Row -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div class="bg-primary-50 rounded-lg p-3">
              <p class="text-sm text-primary-600 font-medium">Prix</p>
              <p class="text-lg font-bold text-primary-900">{{ formatCurrency(basket.discounted_price) }}</p>
            </div>
            <div class="bg-green-50 rounded-lg p-3">
              <p class="text-sm text-green-600 font-medium">Économies</p>
              <p class="text-lg font-bold text-green-900">{{ formatCurrency(basket.basket_savings || 0) }}</p>
            </div>
            <div class="bg-blue-50 rounded-lg p-3">
              <p class="text-sm text-blue-600 font-medium">Articles</p>
              <p class="text-lg font-bold text-blue-900">{{ basket.basket_items_count }}</p>
            </div>
            <div class="bg-orange-50 rounded-lg p-3">
              <p class="text-sm text-orange-600 font-medium">Stock</p>
              <p class="text-lg font-bold text-orange-900">{{ basket.quantity_available }}</p>
            </div>
          </div>
        </div>

        <div class="flex items-center space-x-3 ml-6">
          <button
            class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            @click="$emit('edit', basket)"
          >
            <Edit class="w-4 h-4 inline mr-2" />
            Modifier
          </button>
          <button
            class="p-2 text-gray-500 hover:text-gray-700 transition-colors"
            @click="$emit('close')"
          >
            <X class="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>

    <!-- Main Content Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Left Column - Products -->
      <div class="lg:col-span-2">
        <!-- Products in Basket -->
        <div class="bg-white rounded-xl border border-gray-200 p-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">Produits inclus</h2>

          <div v-if="basket.surprise_basket_items && basket.surprise_basket_items.length > 0" class="space-y-4">
            <div
              v-for="item in basket.surprise_basket_items"
              :key="item.id"
              class="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg"
            >
              <!-- Product Image -->
              <img
                v-if="item.product.image_url"
                :src="item.product.image_url"
                :alt="item.product.name"
                class="w-16 h-16 object-cover rounded-lg flex-shrink-0"
              >
              <div
                v-else
                class="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0"
              >
                <Package class="w-8 h-8 text-gray-400" />
              </div>

              <!-- Product Info -->
              <div class="flex-1 min-w-0">
                <h3 class="font-medium text-gray-900 truncate">{{ item.product.name }}</h3>
                <p v-if="item.product.description" class="text-sm text-gray-500 line-clamp-2">
                  {{ item.product.description }}
                </p>

                <div class="mt-2 flex items-center justify-between">
                  <div class="flex items-center space-x-2">
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
                  <span class="inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                    {{ item.product.category.name }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Total Summary -->
            <div class="border-t border-gray-200 pt-4">
              <div class="bg-green-50 border border-green-200 rounded-lg p-4">
                <div class="flex justify-between items-center text-sm mb-2">
                  <span class="text-green-700">Valeur totale des produits:</span>
                  <span class="font-semibold text-green-900">{{ formatCurrency(basket.total_original_value || 0) }}</span>
                </div>
                <div class="flex justify-between items-center text-sm mb-2">
                  <span class="text-green-700">Prix du panier:</span>
                  <span class="font-semibold text-green-900">{{ formatCurrency(basket.discounted_price) }}</span>
                </div>
                <div class="flex justify-between items-center text-lg border-t border-green-200 pt-2">
                  <span class="text-green-700 font-medium">Économies pour le client:</span>
                  <span class="font-bold text-green-900">
                    {{ formatCurrency(basket.basket_savings || 0) }}
                    ({{ basket.basket_discount_percentage || 0 }}%)
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="text-center py-12 text-gray-500">
            <Package class="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 class="text-lg font-medium text-gray-900 mb-2">Aucun produit</h3>
            <p class="text-gray-600 mb-4">
              Ce panier surprise ne contient aucun produit pour le moment
            </p>
            <button
              class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
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
        <div class="bg-white rounded-xl border border-gray-200 p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Informations</h3>

          <div class="space-y-4">
            <!-- Category -->
            <div v-if="basket.category">
              <p class="text-sm font-medium text-gray-600">Catégorie</p>
              <p class="text-gray-900">{{ basket.category.name }}</p>
            </div>

            <!-- Mystery Description -->
            <div v-if="basket.surprise_description">
              <p class="text-sm font-medium text-gray-600">Description mystère</p>
              <p class="text-gray-900">{{ basket.surprise_description }}</p>
            </div>

            <!-- Item Range -->
            <div v-if="basket.min_items || basket.max_items">
              <p class="text-sm font-medium text-gray-600">Nombre d'articles</p>
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
              <p class="text-sm font-medium text-gray-600">Date d'expiration</p>
              <p class="text-gray-900">{{ formatDate(basket.expiration_date) }}</p>
            </div>

            <!-- Creation Date -->
            <div>
              <p class="text-sm font-medium text-gray-600">Créé le</p>
              <p class="text-gray-900">{{ formatDateTime(basket.created_at) }}</p>
            </div>

            <!-- Last Update -->
            <div v-if="basket.updated_at !== basket.created_at">
              <p class="text-sm font-medium text-gray-600">Dernière modification</p>
              <p class="text-gray-900">{{ formatDateTime(basket.updated_at) }}</p>
            </div>
          </div>
        </div>

        <!-- Image Preview -->
        <div v-if="basket.image_url" class="bg-white rounded-xl border border-gray-200 p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Image</h3>
          <img
            :src="basket.image_url"
            :alt="basket.name"
            class="w-full h-48 object-cover rounded-lg"
          >
        </div>

        <!-- Quick Actions -->
        <div class="bg-white rounded-xl border border-gray-200 p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Actions</h3>

          <div class="space-y-3">
            <button
              class="w-full px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center"
              @click="$emit('edit', basket)"
            >
              <Edit class="w-4 h-4 mr-2" />
              Modifier le panier
            </button>

            <button
              :disabled="updating"
              class="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center disabled:opacity-50"
              @click="toggleStatus"
            >
              <component :is="basket.is_active ? EyeOff : Eye" class="w-4 h-4 mr-2" />
              {{ basket.is_active ? 'Désactiver' : 'Activer' }}
            </button>

            <button
              :disabled="deleting"
              class="w-full px-4 py-3 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors flex items-center justify-center disabled:opacity-50"
              @click="confirmDelete"
            >
              <Trash2 class="w-4 h-4 mr-2" />
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
