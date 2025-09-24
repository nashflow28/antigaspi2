<template>
  <div class="min-h-screen bg-gray-50">
    <!-- TopBar avec Palette Antigaspi -->
    <header class="fixed top-0 left-0 right-0 bg-gray-50 border-b border-gray-200 z-40 backdrop-blur-md" role="banner">
      <div class="max-w-md mx-auto px-4">
        <div class="flex items-center justify-between h-16">
          <!-- Logo et titre -->
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-xl flex items-center justify-center shadow-sm">
              <span class="text-white text-lg font-bold">🌱</span>
            </div>
            <div class="flex flex-col">
              <h1 class="text-lg font-bold text-gray-800">
                Antigaspi
              </h1>
              <p class="text-xs text-emerald-700">
                Sauvons ensemble !
              </p>
            </div>
          </div>

          <!-- Actions à droite -->
          <div class="flex items-center gap-2">
            <button
              @click="handleSearch"
              class="p-2 rounded-xl text-gray-500 hover:text-emerald-700 hover:bg-emerald-200 transition-all duration-200"
              aria-label="Rechercher"
            >
              🔍
            </button>

            <button
              @click="handleNotifications"
              class="relative p-2 rounded-xl text-gray-500 hover:text-emerald-700 hover:bg-emerald-200 transition-all duration-200"
              aria-label="Notifications"
            >
              🔔
              <div
                v-if="notificationsCount > 0"
                class="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 shadow-sm"
              >
                {{ notificationsCount }}
              </div>
            </button>

            <button
              @click="handleCart"
              class="relative p-2 rounded-xl text-gray-500 hover:text-emerald-700 hover:bg-emerald-200 transition-all duration-200"
              aria-label="Panier"
            >
              🛒
              <div
                v-if="cartItems > 0"
                class="absolute -top-1 -right-1 bg-emerald-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 shadow-sm"
              >
                {{ cartItems }}
              </div>
            </button>

            <button
              @click="handleProfile"
              class="p-1 rounded-xl hover:bg-emerald-200 transition-all duration-200"
            >
              <div class="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-lg flex items-center justify-center shadow-sm">
                <span class="text-white text-sm font-medium">👤</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- Main content avec padding pour TopBar -->
    <main class="pt-16 pb-20">
      <!-- Hero Section avec Palette Antigaspi -->
      <div class="bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-700 text-white p-6 shadow-lg">
        <div class="max-w-md mx-auto">
          <h2 class="text-2xl font-bold mb-2">Bienvenue sur Antigaspi</h2>
          <p class="text-emerald-100 mb-4">Découvrez des produits frais à prix réduits et luttez contre le gaspillage alimentaire.</p>
          <div class="flex gap-2">
            <span class="bg-white bg-opacity-20 backdrop-blur-sm px-3 py-1 rounded-full text-sm border border-white border-opacity-20">🇹🇬 Togo</span>
            <span class="bg-emerald-200 bg-opacity-20 backdrop-blur-sm px-3 py-1 rounded-full text-sm border border-emerald-200 border-opacity-30">{{ totalProducts }} produits</span>
          </div>
        </div>
      </div>

      <!-- Categories Quick Access -->
      <div class="p-4">
        <h3 class="text-lg font-semibold text-gray-900 mb-3">Catégories populaires</h3>
        <div class="grid grid-cols-4 gap-3">
          <button
            v-for="category in categories"
            :key="category.id"
            @click="selectCategory(category)"
            class="flex flex-col items-center p-3 bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow"
          >
            <span class="text-2xl mb-1">{{ category.emoji }}</span>
            <span class="text-xs text-gray-600 text-center">{{ category.name }}</span>
          </button>
        </div>
      </div>

      <!-- Products Section -->
      <div class="p-4">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-gray-900">Produits disponibles</h3>
          <button
            @click="refreshProducts"
            class="text-green-600 hover:text-green-700 font-medium text-sm"
          >
            Actualiser
          </button>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="grid grid-cols-2 gap-4">
          <div v-for="n in 4" :key="n" class="bg-white rounded-lg shadow-sm border overflow-hidden animate-pulse">
            <div class="aspect-square bg-gray-200"></div>
            <div class="p-3 space-y-2">
              <div class="h-4 bg-gray-200 rounded w-3/4"></div>
              <div class="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>

        <!-- Products Grid -->
        <div v-else class="grid grid-cols-2 gap-4">
          <div
            v-for="product in displayProducts"
            :key="product.id"
            @click="viewProduct(product)"
            class="bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
          >
            <div class="aspect-square bg-gray-100 flex items-center justify-center">
              <span class="text-4xl">{{ product.emoji }}</span>
            </div>
            <div class="p-3">
              <h4 class="font-medium text-gray-900 text-sm mb-1">{{ product.name }}</h4>
              <p class="text-xs text-gray-500 mb-2">{{ product.merchant }}</p>
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-1">
                  <span class="font-bold text-green-600 text-sm">{{ product.price }}€</span>
                  <span v-if="product.originalPrice" class="text-xs text-gray-400 line-through">{{ product.originalPrice }}€</span>
                </div>
                <span class="text-xs text-orange-600 font-medium">{{ product.discount }}% off</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Load More -->
        <div class="text-center mt-6">
          <button
            @click="loadMore"
            class="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Voir plus de produits
          </button>
        </div>
      </div>
    </main>

    <!-- Bottom Navigation -->
    <nav class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
      <div class="max-w-md mx-auto px-4">
        <div class="flex items-center justify-around h-16">
          <button
            @click="goToHome"
            class="flex flex-col items-center gap-1 p-2 text-green-600"
          >
            <span class="text-lg">🏠</span>
            <span class="text-xs font-medium">Accueil</span>
          </button>
          <button
            @click="goToDiscover"
            class="flex flex-col items-center gap-1 p-2 text-gray-400"
          >
            <span class="text-lg">🔍</span>
            <span class="text-xs">Découvrir</span>
          </button>
          <button
            @click="goToFavorites"
            class="flex flex-col items-center gap-1 p-2 text-gray-400"
          >
            <span class="text-lg">❤️</span>
            <span class="text-xs">Favoris</span>
          </button>
          <button
            @click="goToProfile"
            class="flex flex-col items-center gap-1 p-2 text-gray-400"
          >
            <span class="text-lg">👤</span>
            <span class="text-xs">Profil</span>
          </button>
        </div>
      </div>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useCartStore } from '@/stores/cart'

const router = useRouter()
const cartStore = useCartStore()
const { itemsCount } = storeToRefs(cartStore)

// Reactive state
const loading = ref(false)
const notificationsCount = ref(3)
const totalProducts = ref(156)
const cartItems = computed(() => itemsCount.value)

// Categories
const categories = ref([
  { id: 1, name: 'Boulangerie', emoji: '🥖' },
  { id: 2, name: 'Fruits', emoji: '🍎' },
  { id: 3, name: 'Légumes', emoji: '🥕' },
  { id: 4, name: 'Épicerie', emoji: '🛒' }
])

// Mock products data
const displayProducts = ref([
  {
    id: 1,
    name: 'Pain artisanal',
    merchant: 'Boulangerie Martin',
    price: 2.50,
    originalPrice: 4.00,
    discount: 38,
    emoji: '🥖'
  },
  {
    id: 2,
    name: 'Bananes bio',
    merchant: 'Marché Central',
    price: 1.20,
    originalPrice: 2.00,
    discount: 40,
    emoji: '🍌'
  },
  {
    id: 3,
    name: 'Yaourts nature',
    merchant: 'Laiterie du Sud',
    price: 3.50,
    originalPrice: 5.00,
    discount: 30,
    emoji: '🥛'
  },
  {
    id: 4,
    name: 'Croissants',
    merchant: 'Café Central',
    price: 1.80,
    originalPrice: 3.00,
    discount: 40,
    emoji: '🥐'
  }
])

// Event handlers
const handleSearch = () => {
  console.log('🔍 Recherche')
  // Future: Open search modal
}

const handleNotifications = () => {
  console.log('🔔 Notifications')
  notificationsCount.value = 0
}

const handleCart = () => {
  console.log('🛒 Panier')
  router.push('/cart')
}

const handleProfile = () => {
  console.log('👤 Profil')
  router.push('/profile')
}

const selectCategory = (category: any) => {
  console.log('📂 Catégorie:', category.name)
  // Future: Filter products by category
}

const viewProduct = (product: any) => {
  console.log('👁️ Voir produit:', product.name)
  router.push(`/products/${product.id}`)
}

const refreshProducts = () => {
  loading.value = true
  setTimeout(() => {
    loading.value = false
    console.log('🔄 Produits actualisés')
  }, 1000)
}

const loadMore = () => {
  console.log('📄 Charger plus')
  // Future: Load more products from API
}

// Navigation
const goToHome = () => router.push('/')
const goToDiscover = () => router.push('/discover')
const goToFavorites = () => router.push('/favorites')
const goToProfile = () => router.push('/profile')

onMounted(() => {
  cartStore.hydrateFromStorage()
  console.log('🏠 MainHomeView loaded')
})
</script>