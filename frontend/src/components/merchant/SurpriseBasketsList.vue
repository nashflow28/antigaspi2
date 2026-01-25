<template>
  <div class="surprise-baskets-list">
    <!-- Header -->
    <div class="flex items-center justify-start sm:justify-between mt-4">
      <div>
        <h2 class="text-xl font-semibold text-neutral-900">Mes Paniers Surprise</h2>
        <p class="text-neutral-700 mt-1">Gérez vos paniers surprise et maximisez vos ventes</p>
      </div>
      <button
        class="px-3 py-3 bg-primary-600 text-white rounded hover:transition-colors"
        @click="$emit('create')"
      >
        <Plus class="h-4 w-4 inline mr-2" />
        Nouveau panier
      </button>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-3 sm:gap-6 mt-4 sm:mb-3xl">
      <div class="bg-white rounded border border-neutral-200 p-6">
        <div class="flex items-center">
          <div class="p-3 bg-primary-100 rounded">
            <Package class="h-6 w-6 text-primary-600" />
          </div>
          <div class="ml-6">
            <p class="text-sm font-medium text-neutral-700">Total</p>
            <p class="text-xl font-semibold text-neutral-900">{{ basketStats.total }}</p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded border border-neutral-200 p-6">
        <div class="flex items-center">
          <div class="p-3 bg-green-100 rounded">
            <CheckCircle class="h-6 w-6 text-green-600" />
          </div>
          <div class="ml-6">
            <p class="text-sm font-medium text-neutral-700">Actifs</p>
            <p class="text-xl font-semibold text-neutral-900">{{ basketStats.active }}</p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded border border-neutral-200 p-6">
        <div class="flex items-center">
          <div class="p-3 bg-primary-100 rounded">
            <DollarSign class="h-6 w-6 text-info" />
          </div>
          <div class="ml-6">
            <p class="text-sm font-medium text-neutral-700">Revenus potentiels</p>
            <p class="text-xl font-semibold text-neutral-900">{{ formatCurrency(basketStats.totalRevenue) }}</p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded border border-neutral-200 p-6">
        <div class="flex items-center">
          <div class="p-3 bg-yellow-100 rounded">
            <TrendingUp class="h-6 w-6 text-primary-600" />
          </div>
          <div class="ml-6">
            <p class="text-sm font-medium text-neutral-700">Économies clients</p>
            <p class="text-xl font-semibold text-neutral-900">{{ formatCurrency(basketStats.totalSavings) }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="bg-white rounded border border-neutral-200 p-4 sm:p-6 lg:p-12 text-left sm:text-center">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mt-3" />
      <p class="text-neutral-700">Chargement de vos paniers surprise...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="!hasMerchantBaskets" class="bg-white rounded border border-neutral-200 p-6 sm:p-12 lg:p-12 text-left sm:text-center">
      <Package class="w-12 h-10 mx-auto mt-3 text-neutral-500" />
      <h3 class="text-lg font-medium text-neutral-900 mt-2">Aucun panier surprise</h3>
      <p class="text-neutral-700 mt-4">
        Créez votre premier panier surprise pour valoriser vos invendus et attirer de nouveaux clients
      </p>
      <button
        class="px-4 py-3 bg-primary-600 text-white rounded hover:transition-colors"
        @click="$emit('create')"
      >
        <Plus class="h-4 w-4 inline mr-2" />
        Créer mon premier panier
      </button>
    </div>

    <!-- Baskets Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
      <div
        v-for="basket in merchantBaskets"
        :key="basket.id"
        class="bg-white rounded border border-neutral-200 hover:transition-all duration-200 overflow-hidden sm:block"
      >
        <!-- Image -->
        <div class="relative h-8xl bg-neutral-100">
          <img
            v-if="basket.image_url"
            :src="basket.image_url"
            :alt="basket.name"
            class="w-full h-full object-cover"
          >
          <div v-else class="w-full h-full flex items-center justify-center">
            <Package class="w-12 h-10 text-neutral-400" />
          </div>

          <!-- Status Badge -->
          <div class="relative sm:absolute top-3 left-3">
            <span
              class="px-3 py-3 text-xs font-medium rounded-full"
              :class="basket.is_active
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'"
            >
              {{ basket.is_active ? 'Actif' : 'Inactif' }}
            </span>
          </div>

          <!-- Quantity Badge -->
          <div class="relative sm:absolute top-3 right-3">
            <span class="px-3 py-3 text-xs font-medium bg-primary-100 text-primary-800 rounded-full">
              {{ basket.quantity_available }} disponible(s)
            </span>
          </div>
        </div>

        <!-- Content -->
        <div class="p-6">
          <div class="flex items-stretch sm:items-start justify-start sm:justify-between mt-2">
            <h3 class="text-lg font-semibold text-neutral-900 line-clamp-1">{{ basket.name }}</h3>
            <div class="relative">
              <button
                class="p-1 hover:transition-colors"
                @click="toggleDropdown(basket.id)"
              >
                <MoreVertical class="h-4 w-4 text-neutral-500" />
              </button>

              <!-- Dropdown Menu -->
              <div
                v-if="openDropdown === basket.id"
                class="relative sm:absolute right-0 top-full mt-1 bg-white border border-neutral-200 rounded shadow-lg z-10 py-3 w-8xl"
              >
                <button
                  class="w-full px-3 py-3 text-left text-sm text-neutral-800 hover:bg-neutral-50 flex items-center"
                  @click="editBasket(basket)"
                >
                  <Edit class="h-4 w-4 mr-2" />
                  Modifier
                </button>
                <button
                  class="w-full px-3 py-3 text-left text-sm text-neutral-800 hover:bg-neutral-50 flex items-center"
                  @click="toggleBasketStatus(basket)"
                >
                  <component :is="basket.is_active ? EyeOff : Eye" class="h-4 w-4 mr-2" />
                  {{ basket.is_active ? 'Désactiver' : 'Activer' }}
                </button>
                <button
                  class="w-full px-3 py-3 text-left text-sm text-neutral-800 hover:bg-neutral-50 flex items-center"
                  @click="viewBasket(basket)"
                >
                  <Eye class="h-4 w-4 mr-2" />
                  Voir les détails
                </button>
                <hr class="my-xs">
                <button
                  class="w-full px-3 py-3 text-left text-sm text-red-600 hover:bg-red-50 flex items-center"
                  @click="confirmDelete(basket)"
                >
                  <Trash2 class="h-4 w-4 mr-2" />
                  Supprimer
                </button>
              </div>
            </div>
          </div>

          <p v-if="basket.surprise_description" class="text-sm text-neutral-700 mb-4 line-clamp-2">
            {{ basket.surprise_description }}
          </p>

          <!-- Price and Savings -->
          <div class="flex items-center justify-start sm:justify-between mb-4">
            <div>
              <span class="text-lg font-semibold text-primary-600">{{ formatCurrency(basket.discounted_price) }}</span>
              <span v-if="basket.total_original_value" class="text-sm text-neutral-400 ml-2 line-through">
                {{ formatCurrency(basket.total_original_value) }}
              </span>
            </div>
            <div v-if="basket.basket_discount_percentage" class="text-sm font-medium text-green-600">
              -{{ basket.basket_discount_percentage }}%
            </div>
          </div>

          <!-- Items Info -->
          <div class="flex items-center justify-start sm:justify-between text-sm text-neutral-500 mt-3">
            <span>{{ basket.basket_items_count }} article(s)</span>
            <span v-if="basket.expiration_date">
              Expire le {{ formatDate(basket.expiration_date) }}
            </span>
          </div>

          <!-- Category -->
          <div v-if="basket.category" class="mt-3">
            <span class="inline-flex items-center px-3 py-3 text-xs font-medium bg-neutral-100 text-neutral-800 rounded-full">
              {{ basket.category.name }}
            </span>
          </div>

          <!-- Actions -->
          <div class="flex items-center space-y-4 sm:space-x-2">
            <button
              class="flex-1 px-3 py-3 text-sm font-medium text-neutral-800 bg-neutral-100 hover:transition-colors"
              @click="editBasket(basket)"
            >
              Modifier
            </button>
            <button
              class="flex-1 px-3 py-3 text-sm font-medium text-white bg-primary-600 hover:transition-colors"
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
