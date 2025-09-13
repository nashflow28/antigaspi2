<template>
  <div class="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100">
    <!-- Header -->
    <div class="bg-white/80 backdrop-blur-sm border-b border-neutral-200 sticky top-0 z-10">
      <div class="container mx-auto px-4 py-6">
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 class="text-3xl font-bold text-neutral-900">Catalogue des produits</h1>
            <p class="text-neutral-600 mt-1">
              {{ filteredProducts.length }} produit{{ filteredProducts.length > 1 ? 's' : '' }} disponible{{ filteredProducts.length > 1 ? 's' : '' }}
            </p>
          </div>

          <!-- Search -->
          <div class="flex flex-col sm:flex-row gap-3 lg:min-w-96">
            <div class="relative flex-1">
              <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Rechercher des produits..."
                class="input pl-10 w-full"
              />
            </div>
            <button
              @click="showFilters = !showFilters"
              class="btn btn-ghost flex items-center gap-2"
            >
              <Filter class="w-5 h-5" />
              Filtres
              <span class="bg-primary-500 text-white text-xs px-2 py-1 rounded-full">{{ activeFiltersCount }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Filters Panel -->
    <div
      v-if="showFilters"
      class="bg-white border-b border-neutral-200 shadow-sm"
    >
      <div class="container mx-auto px-4 py-6">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- Category Filter -->
          <div>
            <label class="block text-sm font-medium text-neutral-700 mb-2">Catégorie</label>
            <select v-model="filters.category" class="select w-full">
              <option value="">Toutes les catégories</option>
              <option value="bakery">Boulangerie</option>
              <option value="dairy">Produits laitiers</option>
              <option value="meat">Viandes</option>
              <option value="produce">Fruits & Légumes</option>
              <option value="prepared">Plats préparés</option>
            </select>
          </div>

          <!-- Distance Filter -->
          <div>
            <label class="block text-sm font-medium text-neutral-700 mb-2">Distance max (km)</label>
            <select v-model="filters.maxDistance" class="select w-full">
              <option value="">Toutes distances</option>
              <option value="1">1 km</option>
              <option value="2">2 km</option>
              <option value="5">5 km</option>
              <option value="10">10 km</option>
            </select>
          </div>

          <!-- Price Range -->
          <div>
            <label class="block text-sm font-medium text-neutral-700 mb-2">Prix maximum</label>
            <select v-model="filters.maxPrice" class="select w-full">
              <option value="">Tous les prix</option>
              <option value="5">Moins de 5€</option>
              <option value="10">Moins de 10€</option>
              <option value="20">Moins de 20€</option>
              <option value="50">Moins de 50€</option>
            </select>
          </div>

          <!-- Discount Filter -->
          <div>
            <label class="block text-sm font-medium text-neutral-700 mb-2">Réduction min</label>
            <select v-model="filters.minDiscount" class="select w-full">
              <option value="">Toutes réductions</option>
              <option value="20">20% et plus</option>
              <option value="30">30% et plus</option>
              <option value="50">50% et plus</option>
              <option value="70">70% et plus</option>
            </select>
          </div>
        </div>

        <!-- Filter Actions -->
        <div class="flex justify-between items-center mt-4 pt-4 border-t border-neutral-200">
          <button
            @click="clearFilters"
            class="btn btn-ghost"
            :disabled="activeFiltersCount === 0"
          >
            Effacer les filtres
          </button>
          <button
            @click="showFilters = false"
            class="btn btn-primary"
          >
            Appliquer les filtres
          </button>
        </div>
      </div>
    </div>

    <!-- Products Grid -->
    <div class="container mx-auto px-4 py-8">
      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center items-center min-h-64">
        <div class="flex items-center gap-3">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <span class="text-neutral-600">Chargement des produits...</span>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredProducts.length === 0" class="text-center py-16">
        <Package class="w-24 h-24 text-neutral-300 mx-auto mb-4" />
        <h3 class="text-xl font-bold text-neutral-700 mb-2">Aucun produit trouvé</h3>
        <p class="text-neutral-500 mb-6">
          Essayez de modifier vos critères de recherche ou vos filtres.
        </p>
        <button
          @click="clearFilters"
          class="btn btn-primary"
          v-if="activeFiltersCount > 0"
        >
          Effacer les filtres
        </button>
      </div>

      <!-- Products Grid -->
      <div
        v-else
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
      >
        <ProductCard
          v-for="product in filteredProducts"
          :key="product.id"
          :product="product"
          @view="viewProduct"
          @reserve="reserveProduct"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import ProductCard from '@/components/product/ProductCard.vue'
import { Search, Filter, Package } from 'lucide-vue-next'

interface Product {
  id: number
  name: string
  description: string
  original_price: number
  discounted_price: number
  discount: number
  merchant: {
    name: string
    address: string
    distance: number
  }
  expires_at: Date
  available_quantity: number
  reserved_quantity: number
  category?: string
}

const router = useRouter()

// State
const products = ref<Product[]>([])
const loading = ref(true)
const searchQuery = ref('')
const showFilters = ref(false)

const filters = ref({
  category: '',
  maxDistance: '',
  maxPrice: '',
  minDiscount: ''
})

// Computed
const activeFiltersCount = computed(() => {
  return Object.values(filters.value).filter(value => value !== '').length
})

const filteredProducts = computed(() => {
  let result = products.value

  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(product =>
      product.name.toLowerCase().includes(query) ||
      product.description.toLowerCase().includes(query) ||
      product.merchant.name.toLowerCase().includes(query)
    )
  }

  // Category filter
  if (filters.value.category) {
    result = result.filter(product => product.category === filters.value.category)
  }

  // Distance filter
  if (filters.value.maxDistance) {
    const maxDist = parseFloat(filters.value.maxDistance)
    result = result.filter(product => product.merchant.distance <= maxDist)
  }

  // Price filter
  if (filters.value.maxPrice) {
    const maxPrice = parseFloat(filters.value.maxPrice)
    result = result.filter(product => product.discounted_price <= maxPrice)
  }

  // Discount filter
  if (filters.value.minDiscount) {
    const minDiscount = parseFloat(filters.value.minDiscount)
    result = result.filter(product => product.discount >= minDiscount)
  }

  return result
})

// Methods
const fetchProducts = async () => {
  try {
    loading.value = true

    // Mock data for now - replace with actual API call
    await new Promise(resolve => setTimeout(resolve, 1000))

    products.value = [
      {
        id: 1,
        name: "Pain de campagne artisanal",
        description: "Pain traditionnel fait maison, cuit au four à bois. Parfait pour vos repas de famille.",
        original_price: 4.50,
        discounted_price: 2.25,
        discount: 50,
        category: "bakery",
        merchant: {
          name: "Boulangerie Martin",
          address: "12 Rue de la Paix, Paris",
          distance: 0.8
        },
        expires_at: new Date(Date.now() + 4 * 60 * 60 * 1000),
        available_quantity: 5,
        reserved_quantity: 2
      },
      {
        id: 2,
        name: "Plateau de fromages",
        description: "Assortiment de fromages français: camembert, roquefort, chèvre cendré. Idéal pour l'apéritif.",
        original_price: 15.90,
        discounted_price: 7.95,
        discount: 50,
        category: "dairy",
        merchant: {
          name: "Fromagerie Dubois",
          address: "45 Avenue Victor Hugo, Paris",
          distance: 1.2
        },
        expires_at: new Date(Date.now() + 2 * 60 * 60 * 1000),
        available_quantity: 3,
        reserved_quantity: 0
      },
      {
        id: 3,
        name: "Salade César préparée",
        description: "Salade fraîche avec poulet grillé, parmesan, croûtons et sauce César maison.",
        original_price: 8.90,
        discounted_price: 4.45,
        discount: 50,
        category: "prepared",
        merchant: {
          name: "Fresh & Co",
          address: "23 Boulevard Saint-Germain, Paris",
          distance: 2.1
        },
        expires_at: new Date(Date.now() + 6 * 60 * 60 * 1000),
        available_quantity: 8,
        reserved_quantity: 3
      },
      {
        id: 4,
        name: "Panier de fruits de saison",
        description: "Pommes, poires, oranges et kiwis. Fruits mûrs parfaits pour jus ou consommation immédiate.",
        original_price: 12.00,
        discounted_price: 6.00,
        discount: 50,
        category: "produce",
        merchant: {
          name: "Primeur Bio Plus",
          address: "8 Rue Montorgueil, Paris",
          distance: 1.5
        },
        expires_at: new Date(Date.now() + 12 * 60 * 60 * 1000),
        available_quantity: 4,
        reserved_quantity: 1
      },
      {
        id: 5,
        name: "Escalopes de porc marinées",
        description: "Escalopes fraîches marinées aux herbes de Provence. Prêtes à cuire.",
        original_price: 18.50,
        discounted_price: 9.25,
        discount: 50,
        category: "meat",
        merchant: {
          name: "Boucherie Moderne",
          address: "67 Rue de Rivoli, Paris",
          distance: 0.9
        },
        expires_at: new Date(Date.now() + 8 * 60 * 60 * 1000),
        available_quantity: 6,
        reserved_quantity: 2
      },
      {
        id: 6,
        name: "Pâtisseries du jour",
        description: "Assortiment de pâtisseries fraîches: éclairs, millefeuilles, tartelettes aux fruits.",
        original_price: 24.00,
        discounted_price: 12.00,
        discount: 50,
        category: "bakery",
        merchant: {
          name: "Pâtisserie Delacroix",
          address: "34 Place Vendôme, Paris",
          distance: 2.3
        },
        expires_at: new Date(Date.now() + 3 * 60 * 60 * 1000),
        available_quantity: 2,
        reserved_quantity: 0
      }
    ]
  } catch (error) {
    console.error('Erreur lors du chargement des produits:', error)
  } finally {
    loading.value = false
  }
}

const clearFilters = () => {
  filters.value = {
    category: '',
    maxDistance: '',
    maxPrice: '',
    minDiscount: ''
  }
  searchQuery.value = ''
}

const viewProduct = (product: Product) => {
  router.push(`/products/${product.id}`)
}

const reserveProduct = (product: Product) => {
  router.push(`/products/${product.id}/reserve`)
}

// Lifecycle
onMounted(() => {
  fetchProducts()
})
</script>