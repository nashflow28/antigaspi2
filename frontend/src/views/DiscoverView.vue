<template>
  <div class="min-h-screen bg-gradient-to-b from-neutral-50 via-white to-primary-50">
    <div class="border-b border-neutral-200/70 bg-white/80 backdrop-blur">
      <div class="container mx-auto px-6 py-10">
        <div class="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div class="max-w-2xl">
            <p class="inline-flex items-center gap-2 rounded-full bg-primary-100/70 px-4 py-1 text-sm font-medium text-primary-700">
              <Compass class="h-4 w-4" />
              Explorer les commerçants solidaires
            </p>
            <h1 class="mt-3 text-4xl font-bold tracking-tight text-neutral-900">
              Trouvez des paniers surprise près de chez vous
            </h1>
            <p class="mt-3 text-lg text-neutral-600">
              Filtrez par catégorie, distance ou ambiance pour découvrir de nouveaux partenaires AntiGaspi et suivre vos coups de cœur.
            </p>
          </div>
          <Card class="w-full max-w-md bg-white/90">
            <template #header>
              <h2 class="text-xl font-semibold text-neutral-900">Recherche intelligente</h2>
              <p class="text-sm text-neutral-500">Affinez vos résultats en direct grâce aux filtres dynamiques.</p>
            </template>
            <div class="space-y-4">
              <div class="relative">
                <Search class="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" />
                <input
                  v-model="searchQuery"
                  type="text"
                  placeholder="Ex : Boulangerie, Lomé, petit-déjeuner"
                  class="w-full rounded-2xl border border-neutral-200 bg-white px-11 py-3 text-sm shadow-inner focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200"
                >
              </div>
              <div class="grid gap-3 md:grid-cols-2">
                <select
                  v-model="selectedCategory"
                  class="rounded-2xl border border-neutral-200 px-4 py-3 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200"
                >
                  <option value="">Toutes les catégories</option>
                  <option
                    v-for="category in availableCategories"
                    :key="category"
                    :value="category"
                  >
                    {{ category }}
                  </option>
                </select>
                <select
                  v-model="selectedCity"
                  class="rounded-2xl border border-neutral-200 px-4 py-3 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200"
                >
                  <option value="">Toutes les villes</option>
                  <option
                    v-for="city in availableCities"
                    :key="city"
                    :value="city"
                  >
                    {{ city }}
                  </option>
                </select>
              </div>
            </div>
            <template #footer>
              <div class="flex items-center justify-between text-sm text-neutral-500">
                <span>{{ filteredMerchants.length }} commerçant{{ filteredMerchants.length > 1 ? 's' : '' }} trouvés</span>
                <Button
                  variant="ghost"
                  size="sm"
                  class="text-primary-600"
                  @click="resetFilters"
                >
                  Réinitialiser
                </Button>
              </div>
            </template>
          </Card>
        </div>
      </div>
    </div>

    <main class="container mx-auto px-6 py-12">
      <div class="grid gap-10 xl:grid-cols-[2fr_1fr]">
        <section class="space-y-6">
          <div class="flex items-center justify-between">
            <h2 class="text-2xl font-semibold text-neutral-900">
              Commerçants à découvrir
            </h2>
            <span class="text-sm text-neutral-500">Actualisé toutes les 5 minutes</span>
          </div>

          <div v-if="merchantsLoading" class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Card v-for="n in 6" :key="n" class="bg-white/80">
              <Skeleton class="h-48 w-full rounded-2xl" />
              <div class="mt-4 space-y-2">
                <Skeleton class="h-4 w-3/4" />
                <Skeleton class="h-3 w-1/2" />
                <Skeleton class="h-3 w-1/3" />
              </div>
            </Card>
          </div>

          <div v-else-if="filteredMerchants.length === 0" class="rounded-3xl border border-dashed border-neutral-300 bg-white/70 p-12 text-center shadow-sm">
            <Compass class="mx-auto h-12 w-12 text-neutral-300" />
            <h3 class="mt-4 text-xl font-semibold text-neutral-800">Aucun résultat pour le moment</h3>
            <p class="mt-2 text-neutral-500">Essayez d'élargir vos filtres ou consultez les suggestions à droite.</p>
          </div>

          <div v-else class="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            <Card
              v-for="merchant in filteredMerchants"
              :key="merchant.id"
              class="bg-white/80"
            >
              <template #header>
                <div class="flex items-center justify-between">
                  <div>
                    <h3 class="text-lg font-semibold text-neutral-900">{{ merchant.business_name }}</h3>
                    <p class="text-sm text-neutral-500">{{ merchant.business_type }}</p>
                  </div>
                  <span v-if="merchant.distance_km" class="rounded-full bg-primary-100/70 px-3 py-1 text-xs font-semibold text-primary-700">
                    {{ merchant.distance_km.toFixed(1) }} km
                  </span>
                </div>
              </template>

              <ul class="space-y-2 text-sm text-neutral-600">
                <li class="flex items-center gap-2">
                  <MapPin class="h-4 w-4 text-primary-500" />
                  <span>{{ merchant.address || merchant.city }}</span>
                </li>
                <li v-if="merchant.products_count" class="flex items-center gap-2">
                  <Package class="h-4 w-4 text-primary-500" />
                  <span>{{ merchant.products_count }} panier{{ merchant.products_count > 1 ? 's' : '' }} disponibles</span>
                </li>
              </ul>

              <template #footer>
                <div class="flex items-center justify-between">
                  <Button
                    variant="ghost"
                    size="sm"
                    class="text-neutral-600"
                    @click="toggleFavoriteMerchant(merchant)"
                  >
                    <Heart
                      class="h-4 w-4"
                      :class="isMerchantFavorite(merchant.id) ? 'fill-primary-500 text-primary-500' : 'text-neutral-400'"
                    />
                    <span class="ml-1">{{ isMerchantFavorite(merchant.id) ? 'Retirer' : 'Ajouter' }}</span>
                  </Button>
                  <Button
                    size="sm"
                    @click="goToMerchant(merchant.id)"
                  >
                    Voir le profil
                  </Button>
                </div>
              </template>
            </Card>
          </div>
        </section>

        <aside class="space-y-8">
          <Card class="bg-white/90">
            <template #header>
              <h2 class="text-xl font-semibold text-neutral-900">Tendances de la semaine</h2>
              <p class="text-sm text-neutral-500">Basées sur les paniers les plus réservés.</p>
            </template>
            <ul class="space-y-4">
              <li
                v-for="product in topProducts"
                :key="product.id"
                class="flex items-start gap-3 rounded-2xl bg-neutral-50 p-4"
              >
                <div class="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary-100 text-primary-600">
                  <Package class="h-5 w-5" />
                </div>
                <div>
                  <p class="font-semibold text-neutral-800">{{ product.name }}</p>
                  <p class="text-sm text-neutral-500">{{ product.merchant.business_name }}</p>
                  <p class="text-xs text-primary-600">{{ product.discount_percentage }}% d'économie</p>
                </div>
              </li>
            </ul>
          </Card>

          <Card class="bg-gradient-to-br from-primary-500/90 to-blue-500/90 text-white">
            <template #header>
              <h2 class="text-xl font-semibold">Astuce communauté</h2>
              <p class="text-sm text-primary-50">
                Ajoutez vos commerçants préférés pour être prévenu en priorité lorsqu'ils publient un panier.
              </p>
            </template>
            <Button
              variant="secondary"
              class="w-full border-white/60 bg-white/15 text-white hover:bg-white/25"
              @click="router.push({ name: 'favorites' })"
            >
              Voir mes favoris
            </Button>
          </Card>
        </aside>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import Button from '@/components/ui/Button.vue'
import Card from '@/components/ui/Card.vue'
import Skeleton from '@/components/ui/Skeleton.vue'
import { useMerchantsStore } from '@/stores/merchants'
import { useProductsStore } from '@/stores/products'
import { useFavoritesStore } from '@/stores/favorites'
import { notify } from '@/composables/useNotifications'
import { Compass, Search, MapPin, Package, Heart } from 'lucide-vue-next'
import type { Product } from '@/types'
import type { MerchantWithLocation } from '@/services/merchantService'

const router = useRouter()
const merchantsStore = useMerchantsStore()
const productsStore = useProductsStore()
const favoritesStore = useFavoritesStore()

const { merchants, loading: merchantsLoading } = storeToRefs(merchantsStore)
const { products, loading: productsLoading } = storeToRefs(productsStore)

const searchQuery = ref('')
const selectedCategory = ref('')
const selectedCity = ref('')

const fallbackMerchants = ref<MerchantWithLocation[]>([
  {
    id: 1,
    business_name: 'Boulangerie du Soleil',
    business_type: 'Boulangerie',
    city: 'Lomé',
    address: 'Avenue de la Paix',
    phone: '+228 90 00 00 00',
    is_verified: true,
    latitude: null,
    longitude: null,
    distance_km: 1.2,
    products_count: 4,
    user: { city: 'Lomé', address: 'Avenue de la Paix', phone: '+228 90 00 00 00' }
  },
  {
    id: 2,
    business_name: 'Marché des Saveurs',
    business_type: 'Primeur',
    city: 'Lomé',
    address: 'Boulevard du Mono',
    phone: '+228 90 10 10 10',
    is_verified: true,
    latitude: null,
    longitude: null,
    distance_km: 2.8,
    products_count: 6,
    user: { city: 'Lomé', address: 'Boulevard du Mono', phone: '+228 90 10 10 10' }
  },
  {
    id: 3,
    business_name: 'Café Green Spirit',
    business_type: 'Café & brunch',
    city: 'Kpalimé',
    address: 'Rue des Arts',
    phone: '+228 90 11 22 33',
    is_verified: false,
    latitude: null,
    longitude: null,
    distance_km: 5.1,
    products_count: 2,
    user: { city: 'Kpalimé', address: 'Rue des Arts', phone: '+228 90 11 22 33' }
  }
])

const fallbackProducts = ref<Product[]>([
  {
    id: 101,
    name: 'Panier petit-déjeuner',
    description: 'Viennoiseries, jus frais et confiture artisanale',
    original_price: '12000',
    discounted_price: '4500',
    quantity_available: 5,
    expiration_date: new Date().toISOString(),
    image_url: '',
    discount_percentage: 60,
    savings: 7500,
    days_until_expiration: 1,
    category: { id: 1, name: 'Boulangerie' },
    merchant: {
      id: 1,
      business_name: 'Boulangerie du Soleil',
      business_type: 'Boulangerie',
      city: 'Lomé',
      address: 'Avenue de la Paix',
      phone: '+228 90 00 00 00',
      is_verified: true
    },
    created_at: new Date().toISOString(),
    is_active: true
  },
  {
    id: 102,
    name: 'Panier vitaminé',
    description: 'Fruits locaux de saison et jus frais',
    original_price: '10000',
    discounted_price: '3500',
    quantity_available: 8,
    expiration_date: new Date().toISOString(),
    image_url: '',
    discount_percentage: 65,
    savings: 6500,
    days_until_expiration: 1,
    category: { id: 2, name: 'Fruits & légumes' },
    merchant: {
      id: 2,
      business_name: 'Marché des Saveurs',
      business_type: 'Primeur',
      city: 'Lomé',
      address: 'Boulevard du Mono',
      phone: '+228 90 10 10 10',
      is_verified: true
    },
    created_at: new Date().toISOString(),
    is_active: true
  }
])

const baseMerchants = computed(() => (merchants.value.length ? merchants.value : fallbackMerchants.value))
const baseProducts = computed(() => (products.value.length ? products.value : fallbackProducts.value))

const availableCategories = computed(() => {
  const categories = new Set<string>()
  baseProducts.value.forEach(product => categories.add(product.category.name))
  return Array.from(categories.values()).sort()
})

const availableCities = computed(() => {
  const cities = new Set<string>()
  baseMerchants.value.forEach(merchant => {
    if (merchant.city) {
      cities.add(merchant.city)
    }
  })
  return Array.from(cities.values()).sort()
})

const filteredMerchants = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  return baseMerchants.value.filter(merchant => {
    const matchesQuery = !query || [merchant.business_name, merchant.business_type, merchant.city]
      .map(value => (value ?? '').toLowerCase())
      .some(value => value.includes(query))

    const matchesCategory = !selectedCategory.value || baseProducts.value.some(product => {
      return product.merchant.id === merchant.id && product.category.name === selectedCategory.value
    })

    const matchesCity = !selectedCity.value || merchant.city === selectedCity.value

    return matchesQuery && matchesCategory && matchesCity
  })
})

const topProducts = computed(() => baseProducts.value.slice(0, 4))

const resetFilters = () => {
  searchQuery.value = ''
  selectedCategory.value = ''
  selectedCity.value = ''
}

const goToMerchant = (merchantId: number) => {
  router.push({ name: 'merchant-detail', params: { id: merchantId } })
}

const toggleFavoriteMerchant = (merchant: MerchantWithLocation) => {
  favoritesStore.toggleFavorite({
    id: merchant.id,
    type: 'merchant',
    name: merchant.business_name,
    description: merchant.business_type,
    merchant
  })
}

const isMerchantFavorite = (id: number) => favoritesStore.isFavorite(id, 'merchant')

const fetchData = async () => {
  const [merchantResult, productResult] = await Promise.all([
    merchantsStore.fetchMerchants({ withLocation: true }).catch(() => ({ success: false })),
    productsStore.fetchProducts().catch(() => ({ success: false }))
  ])

  if (!merchantResult?.success) {
    notify.info('Affichage des commerçants de démonstration', 'Exploration')
  }

  if (!productResult?.success) {
    notify.info('Affichage des paniers tendances simulés', 'Exploration')
  }
}

onMounted(() => {
  favoritesStore.hydrateFromStorage()
  fetchData()
})
</script>
