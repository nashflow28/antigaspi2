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
            <label class="block text-sm font-medium text-neutral-700 mb-2">Distance</label>
            <div class="space-y-2">
              <button
                @click="enableLocationFilter"
                :disabled="locationLoading"
                class="w-full flex items-center justify-center gap-2 py-2 px-3 text-sm border border-primary-300 text-primary-700 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors disabled:opacity-50"
              >
                <MapPin class="w-4 h-4" :class="{ 'animate-pulse': locationLoading }" />
                {{ locationLoading ? 'Localisation...' : (userLocation ? 'Position activée' : 'Près de moi') }}
              </button>
              <select v-model="filters.maxDistance" class="select w-full" :disabled="!userLocation">
                <option value="">{{ userLocation ? 'Toutes distances' : 'Activez votre position' }}</option>
                <option value="1">1 km</option>
                <option value="2">2 km</option>
                <option value="5">5 km</option>
                <option value="10">10 km</option>
                <option value="20">20 km</option>
              </select>
            </div>
          </div>

          <!-- Price Range -->
          <div>
            <label class="block text-sm font-medium text-neutral-700 mb-2">Prix maximum</label>
            <select v-model="filters.maxPrice" class="select w-full">
              <option value="">Tous les prix</option>
              <option value="500">Moins de 500 F CFA</option>
              <option value="1000">Moins de 1000 F CFA</option>
              <option value="2000">Moins de 2000 F CFA</option>
              <option value="5000">Moins de 5000 F CFA</option>
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
          :image="product.image_url || defaultProductImage"
          :name="product.name"
          :merchant="formatMerchant(product)"
          :price="formatPrice(product.discounted_price)"
          :original-price="formatPrice(product.original_price)"
          :discount="formatDiscount(product.discount)"
          :quantity="formatQuantity(product)"
          :tags="getProductTags(product)"
          :reserve-loading="quickReserveLoadingId === product.id"
          :reserve-disabled="isProductSoldOut(product) || quickReserveLoadingId === product.id"
          :on-reserve="() => onReserve(product)"
          class="cursor-pointer"
          @click="() => viewProduct(product)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import ProductCard from '@/components/ui/ProductCard.vue'
import { Search, Filter, Package, MapPin } from 'lucide-vue-next'
import { notify } from '@/composables/useNotifications'
import { useAuthStore } from '@/stores/auth'
import { useReservationsStore } from '@/stores/reservations'
import { usePaymentsStore } from '@/stores/payments'

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
    distance: number | null
  }
  expires_at: Date
  available_quantity: number
  reserved_quantity: number
  category?: string
  image_url?: string
}

const router = useRouter()
const authStore = useAuthStore()
const reservationsStore = useReservationsStore()
const paymentsStore = usePaymentsStore()

// State
const products = ref<Product[]>([])
const loading = ref(true)
const searchQuery = ref('')
const showFilters = ref(false)
const quickReserveLoadingId = ref<number | null>(null)

const defaultProductImage =
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80'

const CATEGORY_LABELS: Record<string, string> = {
  bakery: 'Boulangerie',
  dairy: 'Produits laitiers',
  meat: 'Viandes',
  produce: 'Fruits & Légumes',
  prepared: 'Plats préparés',
  other: 'Autres'
}

const filters = ref({
  category: '',
  maxDistance: '',
  maxPrice: '',
  minDiscount: ''
})

// Geolocation state
const userLocation = ref<{ latitude: number; longitude: number } | null>(null)
const locationLoading = ref(false)

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
    result = result.filter(product => {
      const distance = product.merchant.distance
      if (distance === null || Number.isNaN(distance)) {
        return true
      }
      return distance <= maxDist
    })
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

    // Build URL with location parameters if available
    let url = 'http://localhost:8000/api/products'
    const params = new URLSearchParams()

    if (userLocation.value) {
      params.append('latitude', userLocation.value.latitude.toString())
      params.append('longitude', userLocation.value.longitude.toString())
    }

    if (params.toString()) {
      url += '?' + params.toString()
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()

    if (data.success) {
      // Transform API data to match component interface
      products.value = data.data.map((product: any) => ({
        id: product.id,
        name: product.name,
        description: product.description,
        original_price: parseFloat(product.original_price),
        discounted_price: parseFloat(product.discounted_price),
        discount: product.discount_percentage,
        category: getCategoryKey(product.category?.name),
        merchant: {
          name: product.merchant?.business_name || 'Commerçant inconnu',
          address: product.merchant?.address || product.merchant?.city || 'Adresse non renseignée',
          distance: product.merchant?.distance_km ?? null
        },
        expires_at: new Date(product.expiration_date),
        available_quantity: product.quantity_available,
        reserved_quantity: 0, // Not available in current API
        image_url: product.image_url
      }))
    } else {
      console.error('API returned error:', data.message)
    }
  } catch (error) {
    console.error('Erreur lors du chargement des produits:', error)
  } finally {
    loading.value = false
  }
}

// Helper function to map category names to keys
const getCategoryKey = (categoryName: string) => {
  const categoryMap: { [key: string]: string } = {
    'Fruits et Légumes': 'produce',
    'Boulangerie': 'bakery',
    'Plats préparés': 'prepared',
    'Épicerie': 'dairy',
    'Produits laitiers': 'dairy',
    'Viandes': 'meat'
  }
  return categoryMap[categoryName] || 'other'
}

const getAvailableQuantity = (product: Product) => {
  return Math.max(product.available_quantity - product.reserved_quantity, 0)
}

const isProductSoldOut = (product: Product) => {
  return getAvailableQuantity(product) <= 0
}

const formatPrice = (price: number) => {
  return `${Math.round(price).toLocaleString('fr-FR')} F CFA`
}

const formatDiscount = (discount: number) => {
  if (!discount) return undefined
  return `-${Math.round(discount)}%`
}

const formatQuantity = (product: Product) => {
  const available = getAvailableQuantity(product)
  if (available === 0) return 'Complet'
  if (available === 1) return '1 restant'
  return `${available} restants`
}

const formatMerchant = (product: Product) => {
  const distance = product.merchant.distance
  const distanceLabel =
    typeof distance === 'number' && !Number.isNaN(distance) ? ` • ${distance.toFixed(1)} km` : ''
  return `${product.merchant.name}${distanceLabel}`
}

const getProductTags = (product: Product) => {
  const tags: string[] = []

  if (product.category) {
    const label = CATEGORY_LABELS[product.category] ?? product.category
    tags.push(label)
  }

  if (product.discount >= 40) {
    tags.push('Économies garanties')
  }

  return tags
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

const onReserve = async (product: Product) => {
  if (isProductSoldOut(product)) {
    notify.info('Ce produit est complet pour le moment.', 'Réservation rapide')
    return
  }

  if (!authStore.isAuthenticated) {
    notify.info('Connectez-vous pour réserver ce produit instantanément.', 'Connexion requise')
    router.push({ name: 'login', query: { redirect: `/products/${product.id}` } })
    return
  }

  if (quickReserveLoadingId.value === product.id) {
    return
  }

  try {
    quickReserveLoadingId.value = product.id

    const result = await reservationsStore.createReservation({
      productId: product.id,
      quantity: 1,
      paymentMethod: 'paystack',
      customerPhone: authStore.user?.phone || undefined,
      customerEmail: authStore.user?.email || undefined
    })

    if (!result.success || !result.data) {
      throw new Error(result.error || 'Réservation rapide impossible')
    }

    if (result.payment) {
      paymentsStore.recordPayment(result.payment)

      if (result.payment.checkout_url) {
        window.open(result.payment.checkout_url, '_blank', 'noopener')
      }
    }

    const reservedProduct = products.value.find(item => item.id === product.id)
    if (reservedProduct) {
      reservedProduct.reserved_quantity = Math.min(
        reservedProduct.available_quantity,
        reservedProduct.reserved_quantity + 1
      )
    }

    notify.success(
      'Réservation rapide initiée ! Consultez vos paiements pour finaliser.',
      'Paiement rapide'
    )
  } catch (error: any) {
    console.error('Erreur lors de la réservation rapide:', error)
    const message = error?.message || 'Impossible d’initier la réservation rapide.'
    notify.error(message, 'Réservation rapide')
  } finally {
    quickReserveLoadingId.value = null
  }
}

const enableLocationFilter = () => {
  if (!navigator.geolocation) {
    notify.warning('La géolocalisation n\'est pas supportée par votre navigateur')
    return
  }

  locationLoading.value = true

  navigator.geolocation.getCurrentPosition(
    (position) => {
      userLocation.value = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      }
      locationLoading.value = false

      // Reload products with location for distance calculation
      fetchProducts()
    },
    (error) => {
      locationLoading.value = false
      let message = 'Impossible d\'obtenir votre position'

      switch (error.code) {
        case error.PERMISSION_DENIED:
          message = 'Autorisation de géolocalisation refusée'
          break
        case error.POSITION_UNAVAILABLE:
          message = 'Position non disponible'
          break
        case error.TIMEOUT:
          message = 'Délai de géolocalisation dépassé'
          break
      }

      notify.error(message, 'Erreur de géolocalisation')
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000 // 5 minutes
    }
  )
}

// Lifecycle
onMounted(() => {
  fetchProducts()
})
</script>