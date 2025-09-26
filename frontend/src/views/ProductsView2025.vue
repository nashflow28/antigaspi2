<template>
  <div class="min-h-screen bg-gradient-to-br from-neutral-50 via-surface-light to-primary-50/15">
    <header
      class="sticky top-0 z-40 border-b border-white/50 bg-white/80 backdrop-blur-2xl shadow-[0_18px_40px_-24px_rgba(4,120,87,0.35)]"
    >
      <div class="container-2025 py-10">
        <div class="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div class="space-y-5 max-w-2xl">
            <Badge variant="primary" size="sm" rounded class="w-max px-4 py-1 shadow-sm shadow-primary-200/40">
              Catalogue 2025
            </Badge>
            <div class="space-y-3">
              <h1 class="font-display text-4xl lg:text-5xl font-semibold text-neutral-900 leading-tight">
                Produits responsables à portée de main
              </h1>
              <p class="text-body text-neutral-600">
                {{ filteredProducts.length }} produit{{ filteredProducts.length > 1 ? 's' : '' }} disponible{{
                  filteredProducts.length > 1 ? 's' : ''
                }}
              </p>
            </div>
            <p class="text-sm text-neutral-500">
              Explorez nos paniers anti-gaspi triés par impact, localisation et économies garanties.
            </p>
          </div>
          <Card variant="glass" class="w-full max-w-xl shadow-card animate-fade-in-up">
            <div class="flex flex-col gap-4 sm:flex-row sm:items-center">
              <Input
                v-model="searchQuery"
                :left-icon="Search"
                size="lg"
                variant="filled"
                clearable
                placeholder="Rechercher des produits responsables..."
                class="flex-1"
                @clear="searchQuery = ''"
              />
              <Button
                variant="secondary"
                size="md"
                :left-icon="Filter"
                class="w-full justify-between text-primary-700 sm:w-auto"
                @click="showFilters = !showFilters"
              >
                <span class="flex items-center gap-2">
                  <span>Filtres</span>
                  <Badge
                    variant="primary"
                    size="sm"
                    rounded
                    class="border border-primary-200/70 bg-primary-50/80 text-primary-700"
                  >
                    {{ activeFiltersCount }}
                  </Badge>
                </span>
              </Button>
            </div>
            <div v-if="activeFilterLabels.length" class="mt-4 flex flex-wrap gap-2">
              <Badge
                v-for="label in activeFilterLabels"
                :key="label"
                variant="outline"
                size="sm"
                rounded
                class="border-primary-200/70 bg-primary-50/60 text-primary-700"
              >
                {{ label }}
              </Badge>
            </div>
          </Card>
        </div>
      </div>
    </header>

    <main class="container-2025 space-y-spacing-22 py-spacing-22">
      <Transition name="fade">
        <Card
          v-if="showFilters"
          variant="glass"
          class="animate-fade-in-up shadow-card"
        >
          <template #header>
            <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div class="space-y-1">
                <h2 class="text-2xl font-heading font-semibold text-neutral-900 leading-tight">
                  Affiner votre recherche
                </h2>
                <p class="text-sm text-neutral-500">
                  Combinez nos filtres intelligents pour trouver le panier idéal.
                </p>
              </div>
              <Button variant="ghost" size="sm" class="text-primary-600 hover:text-primary-700" @click="showFilters = false">
                Fermer
              </Button>
            </div>
          </template>

          <div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            <label class="flex flex-col gap-2">
              <span class="text-small font-medium text-neutral-600">Catégorie</span>
              <select
                v-model="filters.category"
                class="w-full rounded-2xl border border-neutral-200/80 bg-white/80 px-4 py-3 text-body text-neutral-600 shadow-sm transition focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200"
              >
                <option value="">Toutes les catégories</option>
                <option value="bakery">Boulangerie</option>
                <option value="dairy">Produits laitiers</option>
                <option value="meat">Viandes</option>
                <option value="produce">Fruits &amp; Légumes</option>
                <option value="prepared">Plats préparés</option>
              </select>
            </label>

            <div class="flex flex-col gap-2">
              <span class="text-small font-medium text-neutral-600">Distance</span>
              <Button
                variant="secondary"
                size="sm"
                :left-icon="MapPin"
                :loading="locationLoading"
                :disabled="locationLoading"
                class="justify-center"
                @click="enableLocationFilter"
              >
                {{ locationLoading ? 'Localisation...' : userLocation ? 'Position activée' : 'Près de moi' }}
              </Button>
              <select
                v-model="filters.maxDistance"
                class="w-full rounded-2xl border border-neutral-200/80 bg-white/80 px-4 py-3 text-body text-neutral-600 shadow-sm transition focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200 disabled:cursor-not-allowed disabled:opacity-60"
                :disabled="!userLocation"
              >
                <option value="">{{ userLocation ? 'Toutes distances' : 'Activez votre position' }}</option>
                <option value="1">1 km</option>
                <option value="2">2 km</option>
                <option value="5">5 km</option>
                <option value="10">10 km</option>
                <option value="20">20 km</option>
              </select>
            </div>

            <label class="flex flex-col gap-2">
              <span class="text-small font-medium text-neutral-600">Prix maximum</span>
              <select
                v-model="filters.maxPrice"
                class="w-full rounded-2xl border border-neutral-200/80 bg-white/80 px-4 py-3 text-body text-neutral-600 shadow-sm transition focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200"
              >
                <option value="">Tous les prix</option>
                <option value="500">Moins de 500 F CFA</option>
                <option value="1000">Moins de 1000 F CFA</option>
                <option value="2000">Moins de 2000 F CFA</option>
                <option value="5000">Moins de 5000 F CFA</option>
              </select>
            </label>

            <label class="flex flex-col gap-2">
              <span class="text-small font-medium text-neutral-600">Réduction minimum</span>
              <select
                v-model="filters.minDiscount"
                class="w-full rounded-2xl border border-neutral-200/80 bg-white/80 px-4 py-3 text-body text-neutral-600 shadow-sm transition focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200"
              >
                <option value="">Toutes réductions</option>
                <option value="20">20% et plus</option>
                <option value="30">30% et plus</option>
                <option value="50">50% et plus</option>
                <option value="70">70% et plus</option>
              </select>
            </label>
          </div>

          <div class="mt-8 flex flex-col gap-3 border-t border-neutral-200/70 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <Button
              variant="ghost"
              size="sm"
              class="text-neutral-600 hover:text-primary-700"
              :disabled="activeFiltersCount === 0 && !searchQuery"
              @click="clearFilters"
            >
              Réinitialiser
            </Button>
            <Button variant="primary" size="sm" class="sm:w-auto" @click="applyFilters">
              Appliquer les filtres
            </Button>
          </div>
        </Card>
      </Transition>

      <section>
        <div v-if="loading" class="grid grid-cols-1 gap-6 md:grid-cols-3 xl:grid-cols-4">
          <Card
            v-for="index in 8"
            :key="index"
            variant="glass"
            :no-padding="true"
            class="space-y-4 p-4"
          >
            <Skeleton class="aspect-square w-full rounded-2xl" />
            <div class="space-y-2">
              <Skeleton class="h-4 w-2/3 rounded-full" />
              <Skeleton class="h-3 w-1/2 rounded-full" />
              <Skeleton class="h-5 w-full rounded-xl" />
            </div>
          </Card>
        </div>

        <EmptyState
          v-else-if="filteredProducts.length === 0"
          title="Aucun produit trouvé"
          description="Essayez de modifier votre recherche ou supprimez certains filtres pour découvrir d'autres paniers disponibles."
          action-label="Réinitialiser les filtres"
          icon="📦"
          @action="clearFilters"
        />

        <div
          v-else
          data-test="products-grid"
          class="grid grid-cols-1 gap-6 md:grid-cols-3 xl:grid-cols-4"
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
            class="h-full cursor-pointer transition-transform duration-300 hover:scale-[1.01]"
            @click="() => viewProduct(product)"
          />
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Search, Filter, MapPin } from 'lucide-vue-next'
import Button from '@/components/ui/2025/Button.vue'
import Card from '@/components/ui/2025/Card.vue'
import Input from '@/components/ui/2025/Input.vue'
import Badge from '@/components/ui/2025/Badge.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import Skeleton from '@/components/ui/Skeleton.vue'
import ProductCard from '@/components/ui/ProductCard.vue'
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

const userLocation = ref<{ latitude: number; longitude: number } | null>(null)
const locationLoading = ref(false)

const activeFiltersCount = computed(() => {
  return Object.values(filters.value).filter(value => value !== '').length
})

const activeFilterLabels = computed(() => {
  const labels: string[] = []

  if (filters.value.category) {
    labels.push(CATEGORY_LABELS[filters.value.category] ?? filters.value.category)
  }

  if (filters.value.maxDistance) {
    labels.push(`≤ ${filters.value.maxDistance} km`)
  }

  if (filters.value.maxPrice) {
    const formattedPrice = Number(filters.value.maxPrice)
    labels.push(`≤ ${Number.isNaN(formattedPrice) ? filters.value.maxPrice : formattedPrice.toLocaleString('fr-FR')} F CFA`)
  }

  if (filters.value.minDiscount) {
    labels.push(`${filters.value.minDiscount}% minimum`)
  }

  return labels
})

const filteredProducts = computed(() => {
  let result = products.value

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(product =>
      product.name.toLowerCase().includes(query) ||
      product.description.toLowerCase().includes(query) ||
      product.merchant.name.toLowerCase().includes(query)
    )
  }

  if (filters.value.category) {
    result = result.filter(product => product.category === filters.value.category)
  }

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

  if (filters.value.maxPrice) {
    const maxPrice = parseFloat(filters.value.maxPrice)
    result = result.filter(product => product.discounted_price <= maxPrice)
  }

  if (filters.value.minDiscount) {
    const minDiscount = parseFloat(filters.value.minDiscount)
    result = result.filter(product => product.discount >= minDiscount)
  }

  return result
})

const fetchProducts = async () => {
  try {
    loading.value = true

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
        Accept: 'application/json',
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()

    if (data.success) {
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
        reserved_quantity: 0,
        image_url: product.image_url
      }))
    } else {
      throw new Error(data.message || 'Réponse inattendue de l’API')
    }
  } catch (error: any) {
    console.error('Erreur lors du chargement des produits:', error)
    notify.warning('Nous rencontrons un souci pour récupérer certains produits. Réessayez plus tard.', 'Chargement incomplet')
  } finally {
    loading.value = false
  }
}

const getCategoryKey = (categoryName: string) => {
  const categoryMap: Record<string, string> = {
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
  notify.info('Tous les filtres ont été supprimés.', 'Filtres réinitialisés')
}

const applyFilters = () => {
  showFilters.value = false
  notify.success('Affichage mis à jour selon vos préférences.', 'Filtres appliqués')
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
      notify.success('Nous affinons les paniers en fonction de votre position.', 'Position activée')
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
      maximumAge: 300000
    }
  )
}

onMounted(() => {
  fetchProducts()
})
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
