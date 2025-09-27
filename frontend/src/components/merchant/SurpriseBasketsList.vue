<template>
  <div class="surprise-baskets-list">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="text-2xl font-bold text-gray-900">Mes Paniers Surprise</h2>
        <p class="text-gray-600 mt-1">Gérez vos paniers surprise et maximisez vos ventes</p>
      </div>
      <button
        class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        @click="$emit('create')"
      >
        <Plus class="w-4 h-4 inline mr-2" />
        Nouveau panier
      </button>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <div class="bg-white rounded-xl border border-gray-200 p-6">
        <div class="flex items-center">
          <div class="p-3 bg-primary-100 rounded-lg">
            <Package class="w-6 h-6 text-primary-600" />
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600">Total</p>
            <p class="text-2xl font-bold text-gray-900">{{ basketStats.total }}</p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl border border-gray-200 p-6">
        <div class="flex items-center">
          <div class="p-3 bg-green-100 rounded-lg">
            <CheckCircle class="w-6 h-6 text-green-600" />
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600">Actifs</p>
            <p class="text-2xl font-bold text-gray-900">{{ basketStats.active }}</p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl border border-gray-200 p-6">
        <div class="flex items-center">
          <div class="p-3 bg-blue-100 rounded-lg">
            <DollarSign class="w-6 h-6 text-blue-600" />
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600">Revenus potentiels</p>
            <p class="text-2xl font-bold text-gray-900">{{ formatCurrency(basketStats.totalRevenue) }}</p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl border border-gray-200 p-6">
        <div class="flex items-center">
          <div class="p-3 bg-orange-100 rounded-lg">
            <TrendingUp class="w-6 h-6 text-orange-600" />
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600">Économies clients</p>
            <p class="text-2xl font-bold text-gray-900">{{ formatCurrency(basketStats.totalSavings) }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="bg-white rounded-xl border border-gray-200 p-8 text-center">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4" />
      <p class="text-gray-600">Chargement de vos paniers surprise...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="!hasMerchantBaskets" class="bg-white rounded-xl border border-gray-200 p-12 text-center">
      <Package class="w-16 h-16 mx-auto mb-4 text-gray-300" />
      <h3 class="text-lg font-medium text-gray-900 mb-2">Aucun panier surprise</h3>
      <p class="text-gray-600 mb-6">
        Créez votre premier panier surprise pour valoriser vos invendus et attirer de nouveaux clients
      </p>
      <button
        class="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        @click="$emit('create')"
      >
        <Plus class="w-4 h-4 inline mr-2" />
        Créer mon premier panier
      </button>
    </div>

    <!-- Baskets Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="basket in merchantBaskets"
        :key="basket.id"
        class="bg-white rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-200 overflow-hidden"
      >
        <!-- Image -->
        <div class="relative h-48 bg-gray-100">
          <img
            v-if="basket.image_url"
            :src="basket.image_url"
            :alt="basket.name"
            class="w-full h-full object-cover"
          >
          <div v-else class="w-full h-full flex items-center justify-center">
            <Package class="w-12 h-12 text-gray-400" />
          </div>

          <!-- Status Badge -->
          <div class="absolute top-3 left-3">
            <span
              class="px-2 py-1 text-xs font-medium rounded-full"
              :class="basket.is_active
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'"
            >
              {{ basket.is_active ? 'Actif' : 'Inactif' }}
            </span>
          </div>

          <!-- Quantity Badge -->
          <div class="absolute top-3 right-3">
            <span class="px-2 py-1 text-xs font-medium bg-primary-100 text-primary-800 rounded-full">
              {{ basket.quantity_available }} disponible(s)
            </span>
          </div>
        </div>

        <!-- Content -->
        <div class="p-6">
          <div class="flex items-start justify-between mb-2">
            <h3 class="text-lg font-semibold text-gray-900 line-clamp-1">{{ basket.name }}</h3>
            <div class="relative">
              <button
                class="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                @click="toggleDropdown(basket.id)"
              >
                <MoreVertical class="w-4 h-4 text-gray-500" />
              </button>

              <!-- Dropdown Menu -->
              <div
                v-if="openDropdown === basket.id"
                class="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 py-1 w-48"
              >
                <button
                  class="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                  @click="editBasket(basket)"
                >
                  <Edit class="w-4 h-4 mr-2" />
                  Modifier
                </button>
                <button
                  class="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                  @click="toggleBasketStatus(basket)"
                >
                  <component :is="basket.is_active ? EyeOff : Eye" class="w-4 h-4 mr-2" />
                  {{ basket.is_active ? 'Désactiver' : 'Activer' }}
                </button>
                <button
                  class="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                  @click="viewBasket(basket)"
                >
                  <Eye class="w-4 h-4 mr-2" />
                  Voir les détails
                </button>
                <hr class="my-1">
                <button
                  class="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center"
                  @click="confirmDelete(basket)"
                >
                  <Trash2 class="w-4 h-4 mr-2" />
                  Supprimer
                </button>
              </div>
            </div>
          </div>

          <p v-if="basket.surprise_description" class="text-sm text-gray-600 mb-3 line-clamp-2">
            {{ basket.surprise_description }}
          </p>

          <!-- Price and Savings -->
          <div class="flex items-center justify-between mb-3">
            <div>
              <span class="text-lg font-bold text-primary-600">{{ formatCurrency(basket.discounted_price) }}</span>
              <span v-if="basket.total_original_value" class="text-sm text-gray-400 ml-2 line-through">
                {{ formatCurrency(basket.total_original_value) }}
              </span>
            </div>
            <div v-if="basket.basket_discount_percentage" class="text-sm font-medium text-green-600">
              -{{ basket.basket_discount_percentage }}%
            </div>
          </div>

          <!-- Items Info -->
          <div class="flex items-center justify-between text-sm text-gray-500 mb-4">
            <span>{{ basket.basket_items_count }} article(s)</span>
            <span v-if="basket.expiration_date">
              Expire le {{ formatDate(basket.expiration_date) }}
            </span>
          </div>

          <!-- Category -->
          <div v-if="basket.category" class="mb-4">
            <span class="inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
              {{ basket.category.name }}
            </span>
          </div>

          <!-- Actions -->
          <div class="flex items-center space-x-2">
            <button
              class="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              @click="editBasket(basket)"
            >
              Modifier
            </button>
            <button
              class="flex-1 px-3 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
              @click="viewBasket(basket)"
            >
              Détails
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Click outside to close dropdown -->
  <div
    v-if="openDropdown"
    class="fixed inset-0 z-5"
    @click="openDropdown = null"
  />
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import {
  Plus, Package, CheckCircle, DollarSign, TrendingUp,
  MoreVertical, Edit, Eye, EyeOff, Trash2
} from 'lucide-vue-next'
import { useSurpriseBaskets } from '@/composables/useSurpriseBaskets'

const emit = defineEmits<{
  create: []
  edit: [basket: any]
  view: [basket: any]
}>()

const {
  merchantBaskets,
  loading,
  hasMerchantBaskets,
  basketStats,
  loadMerchantBaskets,
  updateBasket,
  deleteBasket
} = useSurpriseBaskets()

const openDropdown = ref<number | null>(null)

// Methods
const toggleDropdown = (basketId: number) => {
  openDropdown.value = openDropdown.value === basketId ? null : basketId
}

const editBasket = (basket: any) => {
  openDropdown.value = null
  emit('edit', basket)
}

const viewBasket = (basket: any) => {
  openDropdown.value = null
  emit('view', basket)
}

const toggleBasketStatus = async (basket: any) => {
  openDropdown.value = null
  await updateBasket(basket.id, { is_active: !basket.is_active })
}

const confirmDelete = (basket: any) => {
  openDropdown.value = null

  if (confirm(`Êtes-vous sûr de vouloir supprimer le panier "${basket.name}" ? Cette action est irréversible.`)) {
    deleteBasket(basket.id)
  }
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('fr-FR').format(amount) + ' XOF'
}

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('fr-FR')
}

// Close dropdown when clicking outside
const handleClickOutside = (event: Event) => {
  const target = event.target as HTMLElement
  if (!target.closest('.relative')) {
    openDropdown.value = null
  }
}

onMounted(async () => {
  await loadMerchantBaskets()
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
