<template>
  <div class="min-h-screen bg-gradient-to-br from-surface-light via-surface-light to-primary-50/15 dark:from-surface-dark dark:via-surface-dark dark:to-surface-darker">
    <!-- Location Permission Modal -->
    <LocationPermissionModal
      v-model="showLocationModal"
      :loading="locationLoading"
      @authorize="handleLocationAuthorization"
      @close="showLocationModal = false"
    />

    <header
      class="sticky top-0 z-40 border-b border-white/50 bg-surface-light/80 dark:bg-surface-dark/70 backdrop-blur-2xl shadow-[0_18px_40px_-24px_rgba(4,120,87,0.35)]"
    >
      <div class="container px-3 sm:px-4 lg:px-6 py-12">
        <div class="flex flex-col gap-4 sm:gap-8 lg:flex-row lg:items-start lg:justify-between">
          <!-- Enhanced Hero Section -->
          <div class="space-y-5 max-w-full lg:max-w-xl">
            <div class="flex flex-wrap items-center gap-3">
              <Badge
                variant="primary"
                size="sm"
                rounded
                class="w-max px-3 py-3 shadow-sm shadow-primary-200/40"
              >
                Catalogue 2025
              </Badge>

              <!-- Impact Summary Badge -->
              <Badge
                v-if="userImpactData"
                variant="success"
                size="sm"
                rounded
                class="w-max px-3 py-3 shadow-sm"
              >
                <span class="flex items-center gap-2">
                  <TrendingUp class="h-4 w-4" />
                  {{ userImpactData.baskets_saved }} panier{{ userImpactData.baskets_saved > 1 ? 's sauvés' : ' sauvé' }} ce mois
                </span>
              </Badge>
            </div>

            <div class="space-y-2">
              <h1 class="font-display text-3xl lg:text-3xl font-semibold text-neutral-900 dark:text-neutral-100 leading-relaxed">
                Produits responsables à portée de main
              </h1>
              <p class="text-neutral-600 dark:text-neutral-300">
                {{ filteredProducts.length }} produit{{ filteredProducts.length > 1 ? 's' : '' }} disponible{{
                  filteredProducts.length > 1 ? 's' : ''
                }}
              </p>

              <!-- Location badge when active -->
              <div v-if="userLocation && filters.radius" class="flex items-center gap-2 text-sm text-primary-600 dark:text-primary-400">
                <MapPinned class="h-4 w-4" />
                <span>Produits dans un rayon de {{ filters.radius }} km</span>
              </div>
            </div>

            <div class="flex flex-col gap-3">
              <p class="text-sm text-neutral-500 dark:text-neutral-400">
                Explorez nos paniers anti-gaspi triés par impact, localisation et économies garanties.
              </p>

              <!-- Secondary CTAs -->
              <div class="flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  :left-icon="Map"
                  tag="router-link"
                  to="/merchants/map"
                >
                  Explorer sur la carte
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  :left-icon="Sparkles"
                  @click="scrollToFeatured"
                >
                  Surprises du jour
                </Button>
              </div>
            </div>
          </div>

          <!-- Search & Filters Card -->
          <Card variant="glass" class="w-full max-w-xl shadow-lg animate-fade-in-up">
            <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Input
                v-model="searchQuery"
                :left-icon="Search"
                size="lg"
                variant="filled"
                clearable
                placeholder="Rechercher un produit ou une boutique..."
                class="flex-1"
                @clear="searchQuery = ''"
              />
              <Button
                variant="secondary"
                size="md"
                :left-icon="Filter"
                class="w-full justify-between text-primary-900 dark:text-primary-100 sm:w-auto"
                @click="showFilters = !showFilters"
              >
                <span class="flex items-center gap-2">
                  <span>Filtres</span>
                  <Badge
                    variant="primary"
                    size="sm"
                    rounded
                    class="border border-primary-200/70 bg-primary-50 dark:bg-primary-500/10 text-primary-900 dark:text-primary-100"
                  >
                    {{ activeFiltersCount }}
                  </Badge>
                </span>
              </Button>
            </div>

            <!-- Active Filters -->
            <div v-if="activeFilterLabels.length" class="mt-4 flex flex-wrap gap-2">
              <Badge
                v-for="label in activeFilterLabels"
                :key="label"
                variant="outline"
                size="sm"
                rounded
                class="border-primary-200/70 bg-primary-50 dark:bg-primary-500/10 text-primary-900 dark:text-primary-100"
              >
                {{ label }}
              </Badge>

              <!-- Position badge -->
              <Badge
                v-if="userLocation"
                variant="success"
                size="sm"
                rounded
                class="border-emerald-200/70 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-900 dark:text-emerald-100"
              >
                <span class="flex items-center gap-1.5">
                  <MapPinned class="h-3.5 w-3.5" />
                  Basé sur votre position
                </span>
              </Badge>
            </div>
          </Card>
        </div>
      </div>
    </header>

    <main class="container px-3 sm:px-4 lg:px-6 space-y-12 py-12">
      <!-- Filters Panel -->
      <Transition name="fade">
        <Card
          v-if="showFilters"
          variant="glass"
          class="animate-fade-in-up shadow-lg"
        >
          <template #header>
            <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div class="space-y-4">
                <h2 class="text-xl font-heading font-semibold text-neutral-900 dark:text-neutral-100 leading-relaxed">
                  Affiner votre recherche
                </h2>
                <p class="text-sm text-neutral-500 dark:text-neutral-400">
                  Combinez nos filtres intelligents pour trouver le panier idéal.
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                class="text-primary-600 dark:text-primary-400 hover:text-primary-900 dark:hover:text-primary-200"
                @click="showFilters = false"
              >
                Fermer
              </Button>
            </div>
          </template>

          <div class="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-4">
            <label class="flex flex-col gap-2">
              <span class="text-sm font-medium text-neutral-600 dark:text-neutral-300">Catégorie</span>
              <select
                v-model="filters.category"
                class="w-full rounded-modern border border-neutral-200/80 dark:border-neutral-700/60 bg-surface-light/80 dark:bg-surface-dark/70 px-3 py-3 text-neutral-600 dark:text-neutral-300 shadow-sm transition focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200"
              >
                <option value="">Toutes les catégories</option>
                <option
                  v-for="category in categoryOptions"
                  :key="category.slug"
                  :value="category.slug"
                >
                  {{ category.label }}
                </option>
              </select>
            </label>

            <div class="flex flex-col gap-2">
              <span class="text-sm font-medium text-neutral-600 dark:text-neutral-300">Distance</span>
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
                v-model="filters.radius"
                class="w-full rounded-modern border border-neutral-200/80 dark:border-neutral-700/60 bg-surface-light/80 dark:bg-surface-dark/70 px-3 py-3 text-neutral-600 dark:text-neutral-300 shadow-sm transition focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200 disabled:cursor-not-allowed disabled:opacity-60"
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
              <span class="text-sm font-medium text-neutral-600 dark:text-neutral-300">Prix maximum</span>
              <select
                v-model="filters.maxPrice"
                class="w-full rounded-modern border border-neutral-200/80 dark:border-neutral-700/60 bg-surface-light/80 dark:bg-surface-dark/70 px-3 py-3 text-neutral-600 dark:text-neutral-300 shadow-sm transition focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200"
              >
                <option value="">Tous les prix</option>
                <option value="500">Moins de 500 F CFA</option>
                <option value="1000">Moins de 1000 F CFA</option>
                <option value="2000">Moins de 2000 F CFA</option>
                <option value="5000">Moins de 5000 F CFA</option>
              </select>
            </label>

            <label class="flex flex-col gap-2">
              <span class="text-sm font-medium text-neutral-600 dark:text-neutral-300">Réduction minimum</span>
              <select
                v-model="filters.minDiscount"
                class="w-full rounded-modern border border-neutral-200/80 dark:border-neutral-700/60 bg-surface-light/80 dark:bg-surface-dark/70 px-3 py-3 text-neutral-600 dark:text-neutral-300 shadow-sm transition focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200"
              >
                <option value="">Toutes réductions</option>
                <option value="20">20% et plus</option>
                <option value="30">30% et plus</option>
                <option value="50">50% et plus</option>
                <option value="70">70% et plus</option>
              </select>
            </label>
          </div>

          <div class="mt-8 flex flex-col gap-3 border-t border-neutral-200 dark:border-neutral-700/70 padding-t-xl sm:flex-row sm:items-center sm:justify-between">
            <Button
              variant="ghost"
              size="sm"
              class="text-neutral-600 dark:text-neutral-300 hover:text-primary-900 dark:hover:text-primary-200"
              :disabled="activeFiltersCount === 0 && !searchQuery"
              @click="clearFilters"
            >
              Réinitialiser
            </Button>
            <Button
              variant="primary"
              size="sm"
              class="sm:w-auto"
              @click="applyFilters"
            >
              Appliquer les filtres
            </Button>
          </div>
        </Card>
      </Transition>

      <!-- Editorial Collections -->
      <section v-if="!loading && collections.length > 0" class="space-y-6">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">
              Collections
            </h2>
            <p class="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              Des sélections pensées pour vous
            </p>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          <CollectionCard
            v-for="collection in collections"
            :key="collection.id"
            :title="collection.title"
            :description="collection.description"
            :icon="collection.icon"
            :icon-color="collection.iconColor"
            :gradient="collection.gradient"
            :badge="collection.badge"
            @click="applyCollection(collection)"
          />
        </div>
      </section>

      <!-- Featured Products Carousel (À l'affiche) -->
      <section
        v-if="!loading && featuredProducts.length > 0"
        ref="featuredSectionRef"
        class="space-y-6"
      >
        <div class="flex items-center gap-3">
          <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/10 to-amber-600/20">
            <Sparkles class="h-6 w-6 text-amber-600" />
          </div>
          <div>
            <h2 class="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">
              À l'affiche
            </h2>
            <p class="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              Les meilleures réductions du moment
            </p>
          </div>
        </div>

        <div class="relative">
          <div class="overflow-x-auto pb-4 scrollbar-hide">
            <div class="flex gap-4" style="width: max-content;">
              <div
                v-for="product in featuredProducts"
                :key="product.id"
                class="w-[280px] md:w-[320px]"
              >
                <ProductCard
                  :image="product.image_url || defaultProductImage"
                  :name="product.name"
                  :merchant="formatMerchant(product)"
                  :merchant-rating="product.merchant.rating"
                  :price="formatPrice(product.discounted_price)"
                  :original-price="formatPrice(product.original_price)"
                  :discount="formatDiscount(product.discount)"
                  :savings="formatSavings(product)"
                  :quantity="formatQuantity(product)"
                  :tags="getProductTags(product)"
                  :stock-badges="getStockBadges(product)"
                  :reserve-loading="quickReserveLoadingId === product.id"
                  :reserve-disabled="isProductSoldOut(product)"
                  :disabled="isProductSoldOut(product) || quickReserveLoadingId === product.id"
                  :featured="true"
                  class="h-full"
                  @reserve="() => onReserve(product)"
                  @click="() => viewProduct(product)"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Products Grid -->
      <section class="space-y-6">
        <div v-if="!loading && filteredProducts.length > 0" class="flex items-center justify-between">
          <h2 class="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">
            Tous les produits
          </h2>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
          <Card
            v-for="index in 8"
            :key="index"
            variant="glass"
            :no-padding="true"
            class="product-card-skeleton"
          >
            <div class="flex h-full flex-col">
              <div class="product-card-skeleton-image" />
              <div class="flex flex-col gap-4 p-6">
                <Loading
                  type="skeleton"
                  :skeleton-lines="3"
                  class="product-card-skeleton-lines"
                />
              </div>
            </div>
          </Card>
        </div>

        <!-- Empty State with Enhanced CTAs -->
        <EmptyState
          v-else-if="filteredProducts.length === 0"
          title="Aucun produit trouvé"
          :description="getEmptyStateDescription()"
          :icon="PackageSearch"
          :primary-action="{
            text: hasActiveFilters ? 'Réinitialiser les filtres' : 'Activer les alertes',
            variant: 'primary',
            onClick: hasActiveFilters ? clearFilters : () => router.push('/notifications')
          }"
          :secondary-action="getEmptyStateSecondaryAction()"
          variant="illustration"
        />

        <!-- Products Grid -->
        <div
          v-else
          data-test="products-grid"
          data-testid="product-list"
          class="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4"
        >
          <ProductCard
            v-for="product in filteredProducts"
            :key="product.id"
            :image="product.image_url || defaultProductImage"
            :name="product.name"
            :merchant="formatMerchant(product)"
            :merchant-rating="product.merchant.rating"
            :price="formatPrice(product.discounted_price)"
            :original-price="formatPrice(product.original_price)"
            :discount="formatDiscount(product.discount)"
            :savings="formatSavings(product)"
            :quantity="formatQuantity(product)"
            :tags="getProductTags(product)"
            :stock-badges="getStockBadges(product)"
            :reserve-loading="quickReserveLoadingId === product.id"
            :reserve-disabled="isProductSoldOut(product)"
            :disabled="isProductSoldOut(product) || quickReserveLoadingId === product.id"
            :aria-label="`Réserver ${product.name}`"
            data-testid="product-card"
            class="h-full"
            @reserve="() => onReserve(product)"
            @click="() => viewProduct(product)"
          />
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  Search, Filter, MapPin, MapPinned, PackageSearch, Map, Sparkles,
  TrendingUp, Coffee, Salad, UtensilsCrossed, ShoppingBag, Leaf
} from 'lucide-vue-next'
import Button from '@/components/ui/2025/Button.vue'
import Card from '@/components/ui/2025/Card.vue'
import Input from '@/components/ui/2025/Input.vue'
import Badge from '@/components/ui/2025/Badge.vue'
import EmptyState from '@/components/ui/2025/EmptyState.vue'
import Loading from '@/components/ui/2025/Loading.vue'
import ProductCard from '@/components/ui/2025/ProductCard.vue'
import LocationPermissionModal from '@/components/ui/2025/LocationPermissionModal.vue'
import CollectionCard from '@/components/ui/2025/CollectionCard.vue'
import { notify } from '@/composables/useNotifications'
import { useAuthStore } from '@/stores/auth'
import { useReservationsStore } from '@/stores/reservations'
import { usePaymentsStore } from '@/stores/payments'
import { apiService } from '@/services/api'
import type { ProductFilters } from '@/types'
import { normalizeProduct, getCategoryKey, type NormalizedProduct } from '@/utils/productNormalizer'

const router = useRouter()
const authStore = useAuthStore()
const reservationsStore = useReservationsStore()
const paymentsStore = usePaymentsStore()

const products = ref<NormalizedProduct[]>([])
const loading = ref(true)
const searchQuery = ref('')
const showFilters = ref(false)
const quickReserveLoadingId = ref<number | null>(null)
const showLocationModal = ref(false)
const featuredSectionRef = ref<HTMLElement | null>(null)

// User impact data (mock for now, would come from API)
const userImpactData = ref<{ baskets_saved: number } | null>(null)

// Editorial collections
const collections = computed(() => [
  {
    id: 'breakfast',
    title: 'Petit-déjeuner',
    description: '15 produits',
    icon: Coffee,
    iconColor: 'text-amber-600',
    gradient: 'linear-gradient(135deg, #FEF3C7 0%, #FCD34D 100%)',
    badge: 'Populaire',
    filter: { category: 'bakery' }
  },
  {
    id: 'fresh',
    title: 'Fruits & Légumes',
    description: '23 produits',
    icon: Salad,
    iconColor: 'text-emerald-600',
    gradient: 'linear-gradient(135deg, #D1FAE5 0%, #10B981 100%)',
    badge: 'Frais',
    filter: { category: 'produce' }
  },
  {
    id: 'prepared',
    title: 'Plats préparés',
    description: '12 produits',
    icon: UtensilsCrossed,
    iconColor: 'text-orange-600',
    gradient: 'linear-gradient(135deg, #FED7AA 0%, #F97316 100%)',
    badge: 'Prêt à manger',
    filter: { category: 'prepared' }
  },
  {
    id: 'discount',
    title: 'Super promos',
    description: '30+ produits',
    icon: Sparkles,
    iconColor: 'text-purple-600',
    gradient: 'linear-gradient(135deg, #E9D5FF 0%, #A855F7 100%)',
    badge: '-50%',
    filter: { minDiscount: '50' }
  }
])

const DEFAULT_PER_PAGE = 50

type PaginationState = {
  currentPage: number
  lastPage: number
  perPage: number
  total: number
}

const pagination = ref<PaginationState>({
  currentPage: 1,
  lastPage: 1,
  perPage: DEFAULT_PER_PAGE,
  total: 0
})

const currentPage = ref(1)
const isResettingFilters = ref(false)
let pendingReload = false
let isFetchingProducts = false
let searchDebounce: ReturnType<typeof setTimeout> | null = null

const defaultProductImage =
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80'

const DEFAULT_CATEGORY_LABELS: Record<string, string> = {
  bakery: 'Boulangerie',
  dairy: 'Produits laitiers',
  meat: 'Viandes',
  produce: 'Fruits & Légumes',
  prepared: 'Plats préparés',
  other: 'Autres'
}

const normalizeCategoryLabel = (label: string): string => {
  return label
    .toLowerCase()
    .normalize('NFKD')
    .replace(/&/g, ' et ')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const DEFAULT_NORMALIZED_LABEL_TO_SLUG: Record<string, string> = Object.entries(DEFAULT_CATEGORY_LABELS).reduce(
  (acc, [slug, label]) => {
    acc[normalizeCategoryLabel(label)] = slug
    return acc
  },
  {} as Record<string, string>
)

const CATEGORY_DISPLAY_ORDER = ['bakery', 'dairy', 'meat', 'produce', 'prepared', 'other'] as const
const CATEGORY_ORDER_MAP = new Map(CATEGORY_DISPLAY_ORDER.map((slug, index) => [slug, index]))

const categoryLabels = ref<Record<string, string>>({ ...DEFAULT_CATEGORY_LABELS })
const categorySlugToId = ref<Record<string, number>>({})

type CategoryMetadata = {
  slug: string
  label?: string
  id?: number | null
}

const mergeCategoryMetadata = (items: CategoryMetadata[]) => {
  if (!items.length) {
    return
  }

  const labelsToMerge: Record<string, string> = {}
  const idsToMerge: Record<string, number> = {}
  const fallbackSlugsToRemove = new Set<string>()
  const fallbackSlugToNormalizedSlug: Record<string, string> = {}
  const shortSlugToId: Record<string, number> = {}

  items.forEach(item => {
    if (!item.slug) {
      return
    }

    const hasValidId = typeof item.id === 'number' && Number.isFinite(item.id)
    if (!hasValidId) {
      return
    }

    const normalizedSlug = item.slug
    const categoryId = item.id as number
    idsToMerge[normalizedSlug] = categoryId

    const slugMatch = normalizedSlug.match(/^(.*)-(\d+)$/)
    if (slugMatch) {
      const baseSlug = slugMatch[1]
      shortSlugToId[baseSlug] = categoryId

      if (DEFAULT_CATEGORY_LABELS[baseSlug] && baseSlug !== 'other') {
        fallbackSlugsToRemove.add(baseSlug)
        fallbackSlugToNormalizedSlug[baseSlug] = normalizedSlug
      }
    }

    const trimmedLabel = typeof item.label === 'string' ? item.label.trim() : ''
    const normalizedDefaultSlug = trimmedLabel
      ? DEFAULT_NORMALIZED_LABEL_TO_SLUG[normalizeCategoryLabel(trimmedLabel)]
      : undefined

    if (normalizedDefaultSlug && normalizedDefaultSlug !== 'other') {
      fallbackSlugsToRemove.add(normalizedDefaultSlug)
      fallbackSlugToNormalizedSlug[normalizedDefaultSlug] = normalizedSlug
    }

    if (trimmedLabel) {
      labelsToMerge[normalizedSlug] = normalizedDefaultSlug
        ? DEFAULT_CATEGORY_LABELS[normalizedDefaultSlug]
        : trimmedLabel
    } else if (slugMatch && DEFAULT_CATEGORY_LABELS[slugMatch[1]]) {
      labelsToMerge[normalizedSlug] = DEFAULT_CATEGORY_LABELS[slugMatch[1]]
    }
  })

  if (Object.keys(idsToMerge).length > 0) {
    const updatedIds: Record<string, number> = { ...categorySlugToId.value }

    Object.entries(idsToMerge).forEach(([slug, id]) => {
      updatedIds[slug] = id
    })

    Object.entries(shortSlugToId).forEach(([slug, id]) => {
      updatedIds[slug] = id
    })

    categorySlugToId.value = updatedIds
  }

  if (Object.keys(labelsToMerge).length > 0) {
    const mergedLabels: Record<string, string> = { ...categoryLabels.value, ...labelsToMerge }

    fallbackSlugsToRemove.forEach(slug => {
      if (slug !== 'other') {
        delete mergedLabels[slug]
      }
    })

    const sanitizedLabels = Object.entries(mergedLabels).reduce((acc, [slug, label]) => {
      if (slug === 'other' || /-\d+$/.test(slug)) {
        acc[slug] = label
      }
      return acc
    }, {} as Record<string, string>)

    if (!('other' in sanitizedLabels)) {
      sanitizedLabels.other = DEFAULT_CATEGORY_LABELS.other
    }

    categoryLabels.value = sanitizedLabels
  }

  const currentCategory = filters.value.category
  if (currentCategory) {
    if (fallbackSlugToNormalizedSlug[currentCategory]) {
      filters.value.category = fallbackSlugToNormalizedSlug[currentCategory]
    } else if (!(currentCategory in categoryLabels.value)) {
      filters.value.category = ''
    }
  }
}

const categoryOptions = computed(() => {
  const entries = Object.entries(categoryLabels.value)
    .map(([slug, label]) => ({ slug, label }))

  const resolveOrderKey = (slug: string, label: string): number => {
    if (CATEGORY_ORDER_MAP.has(slug)) {
      return CATEGORY_ORDER_MAP.get(slug) as number
    }

    const matchedPrefix = slug.match(/^([a-z0-9-]+)-(\d+)$/)?.[1]
    if (matchedPrefix && CATEGORY_ORDER_MAP.has(matchedPrefix)) {
      return CATEGORY_ORDER_MAP.get(matchedPrefix) as number
    }

    const fallbackSlug = Object.entries(DEFAULT_CATEGORY_LABELS)
      .find(([, defaultLabel]) => defaultLabel === label)?.[0]

    if (fallbackSlug && CATEGORY_ORDER_MAP.has(fallbackSlug)) {
      return CATEGORY_ORDER_MAP.get(fallbackSlug) as number
    }

    return Number.POSITIVE_INFINITY
  }

  return entries
    .sort((a, b) => {
      const orderA = resolveOrderKey(a.slug, a.label)
      const orderB = resolveOrderKey(b.slug, b.label)

      if (orderA !== orderB) {
        return orderA - orderB
      }

      return a.label.localeCompare(b.label, 'fr')
    })
})

const filters = ref({
  category: '',
  radius: '',
  maxPrice: '',
  minDiscount: ''
})

const userLocation = ref<{ latitude: number; longitude: number } | null>(null)
const locationLoading = ref(false)

const hasActiveFilters = computed(() => activeFiltersCount.value > 0 || !!searchQuery.value)

const activeFiltersCount = computed(() => {
  return Object.values(filters.value).filter(value => value !== '').length
})

const activeFilterLabels = computed(() => {
  const labels: string[] = []

  if (filters.value.category) {
    labels.push(categoryLabels.value[filters.value.category] ?? filters.value.category)
  }

  if (filters.value.radius) {
    labels.push(`≤ ${filters.value.radius} km`)
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

  if (filters.value.radius) {
    const maxDist = parseFloat(filters.value.radius)
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

// Featured products (top 5 by discount)
const featuredProducts = computed(() => {
  return [...products.value]
    .sort((a, b) => b.discount - a.discount)
    .slice(0, 5)
})

const loadCategories = async () => {
  try {
    const response = await apiService.getCategories()

    if (!response?.success || !Array.isArray(response.data)) {
      return
    }

    const metadata: CategoryMetadata[] = response.data.map(category => ({
      slug: getCategoryKey(category),
      label: category.name,
      id: category.id
    }))

    mergeCategoryMetadata(metadata)
  } catch (error) {
    console.warn('Impossible de charger les catégories', error)
  }
}

const loadUserImpact = async () => {
  // Mock data - would come from API
  if (authStore.isAuthenticated) {
    userImpactData.value = {
      baskets_saved: 3
    }
  }
}

const resetPagination = () => {
  currentPage.value = 1
  pagination.value = {
    ...pagination.value,
    currentPage: 1,
    lastPage: 1,
    total: 0
  }
}

const fetchProducts = async () => {
  if (isFetchingProducts) {
    pendingReload = true
    return
  }

  isFetchingProducts = true
  loading.value = true

  try {
    const filtersPayload: ProductFilters = {
      page: currentPage.value,
      per_page: pagination.value.perPage || DEFAULT_PER_PAGE
    }

    if (filters.value.category) {
      const categoryId = categorySlugToId.value[filters.value.category]
      if (typeof categoryId === 'number') {
        filtersPayload.category_id = categoryId
      }
    }

    if (filters.value.maxPrice) {
      const maxPrice = Number(filters.value.maxPrice)
      if (!Number.isNaN(maxPrice)) {
        filtersPayload.max_price = maxPrice
      }
    }

    if (filters.value.minDiscount) {
      const minDiscount = Number(filters.value.minDiscount)
      if (!Number.isNaN(minDiscount)) {
        filtersPayload.min_discount = minDiscount
      }
    }

    if (filters.value.radius) {
      const radius = Number(filters.value.radius)
      if (!Number.isNaN(radius)) {
        filtersPayload.radius = radius
      }
    }

    if (userLocation.value) {
      filtersPayload.latitude = userLocation.value.latitude
      filtersPayload.longitude = userLocation.value.longitude
    }

    if (searchQuery.value.trim()) {
      filtersPayload.search = searchQuery.value.trim()
    }

    const response = await apiService.getProducts(filtersPayload)

    if (!response?.success || !Array.isArray(response.data)) {
      throw new Error(response?.message || 'Réponse inattendue de l'API')
    }

    const aggregatedProducts: NormalizedProduct[] = response.data.map(normalizeProduct)
    const aggregatedMetadata: CategoryMetadata[] = response.data.map(item => ({
      slug: getCategoryKey(item.category),
      label: item.category?.name,
      id: item.category?.id
    }))

    const paginationInfo = response.pagination

    if (paginationInfo) {
      const lastPage = Number(paginationInfo.last_page) || 1
      const currentApiPage = Number(paginationInfo.current_page) || currentPage.value

      pagination.value = {
        currentPage: currentApiPage,
        lastPage,
        perPage: Number(paginationInfo.per_page) || (filtersPayload.per_page ?? DEFAULT_PER_PAGE),
        total: Number(paginationInfo.total) || aggregatedProducts.length
      }

      if (lastPage > currentApiPage) {
        for (let page = currentApiPage + 1; page <= lastPage; page++) {
          try {
            const paginatedResponse = await apiService.getProducts({
              ...filtersPayload,
              page
            })

            if (!paginatedResponse?.success || !Array.isArray(paginatedResponse.data)) {
              break
            }

            aggregatedProducts.push(...paginatedResponse.data.map(normalizeProduct))
            aggregatedMetadata.push(
              ...paginatedResponse.data.map(item => ({
                slug: getCategoryKey(item.category),
                label: item.category?.name,
                id: item.category?.id
              }))
            )
          } catch (error) {
            console.warn('Impossible de récupérer une page supplémentaire de produits', error)
            break
          }
        }
      }
    } else {
      pagination.value = {
        currentPage: currentPage.value,
        lastPage: currentPage.value,
        perPage: filtersPayload.per_page ?? DEFAULT_PER_PAGE,
        total: aggregatedProducts.length
      }
    }

    products.value = aggregatedProducts

    if (aggregatedMetadata.length > 0) {
      mergeCategoryMetadata(aggregatedMetadata)
    }
  } catch (error: any) {
    const message = error?.message || 'Nous rencontrons un souci pour récupérer certains produits. Réessayez plus tard.'
    notify.warning(message, 'Chargement incomplet')
  } finally {
    isFetchingProducts = false
    loading.value = false

    if (pendingReload) {
      pendingReload = false
      fetchProducts()
    }
  }
}

const getAvailableQuantity = (product: NormalizedProduct) => {
  return Math.max(product.available_quantity - product.reserved_quantity, 0)
}

const isProductSoldOut = (product: NormalizedProduct) => {
  return getAvailableQuantity(product) <= 0
}

const formatPrice = (price: number) => {
  return `${Math.round(price).toLocaleString('fr-FR')} F CFA`
}

const formatDiscount = (discount: number) => {
  if (!discount) return undefined
  return `-${Math.round(discount)}%`
}

const formatSavings = (product: NormalizedProduct) => {
  const savings = product.original_price - product.discounted_price
  return `Économisez ${Math.round(savings).toLocaleString('fr-FR')} XOF`
}

const formatQuantity = (product: NormalizedProduct) => {
  const available = getAvailableQuantity(product)
  if (available === 0) return 'Complet'
  if (available === 1) return '1 restant'
  if (available <= 3) return `${available} restants • Quasi épuisé`
  return `${available} restants`
}

const formatMerchant = (product: NormalizedProduct) => {
  const distance = product.merchant.distance
  const distanceLabel =
    typeof distance === 'number' && !Number.isNaN(distance) ? ` • ${distance.toFixed(1)} km` : ''
  return `${product.merchant.name}${distanceLabel}`
}

const getProductTags = (product: NormalizedProduct) => {
  const tags: string[] = []

  if (product.category) {
    const label = categoryLabels.value[product.category] ?? product.category
    tags.push(label)
  }

  if (product.discount >= 40) {
    tags.push('Économies garanties')
  }

  return tags
}

const getStockBadges = (product: NormalizedProduct) => {
  const badges: { label: string; variant?: string }[] = []
  const available = getAvailableQuantity(product)

  if (available <= 0) {
    badges.push({ label: 'Rupture de stock', variant: 'error' })
  } else if (available <= 3) {
    badges.push({ label: 'Quasi épuisé', variant: 'warning' })
  } else {
    badges.push({ label: `${available} en stock`, variant: 'success' })
  }

  if (product.reserved_quantity > 0) {
    badges.push({ label: `${product.reserved_quantity} réservés`, variant: 'info' })
  }

  return badges
}

const getEmptyStateDescription = () => {
  if (filters.value.radius && !userLocation.value) {
    return 'Activez votre position pour voir les paniers à proximité.'
  }
  if (hasActiveFilters.value) {
    return 'Essayez de modifier votre recherche ou supprimez certains filtres pour découvrir d'autres paniers disponibles.'
  }
  return 'Aucun panier disponible pour le moment. Activez les alertes pour être notifié des nouvelles offres.'
}

const getEmptyStateSecondaryAction = () => {
  if (authStore.isAuthenticated) {
    return {
      text: 'Mes réservations passées',
      variant: 'outline' as const,
      onClick: () => router.push('/reservations')
    }
  }
  return {
    text: 'Comment ça marche ?',
    variant: 'outline' as const,
    onClick: () => router.push('/discover')
  }
}

const clearFilters = async () => {
  isResettingFilters.value = true

  filters.value = {
    category: '',
    radius: '',
    maxPrice: '',
    minDiscount: ''
  }
  searchQuery.value = ''

  await nextTick()

  isResettingFilters.value = false

  resetPagination()
  fetchProducts()

  notify.info('Tous les filtres ont été supprimés.', 'Filtres réinitialisés')
}

const applyFilters = () => {
  showFilters.value = false
  resetPagination()
  fetchProducts()
  notify.success('Affichage mis à jour selon vos préférences.', 'Filtres appliqués')
}

const applyCollection = (collection: any) => {
  // Apply collection filters
  if (collection.filter.category) {
    filters.value.category = collection.filter.category
  }
  if (collection.filter.minDiscount) {
    filters.value.minDiscount = collection.filter.minDiscount
  }

  resetPagination()
  fetchProducts()
  notify.success(`Collection "${collection.title}" appliquée`, 'Filtres')
}

const scrollToFeatured = () => {
  if (featuredSectionRef.value) {
    featuredSectionRef.value.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

const viewProduct = (product: NormalizedProduct) => {
  router.push(`/products/${product.id}`)
}

const onReserve = async (product: NormalizedProduct) => {
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
    const message = error?.message || 'Impossible d'initier la réservation rapide.'
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

  if (userLocation.value) {
    // Already have location, just show success
    notify.success('Position déjà activée', 'Géolocalisation')
    return
  }

  // Show modal instead of direct prompt
  showLocationModal.value = true
}

const handleLocationAuthorization = () => {
  locationLoading.value = true

  navigator.geolocation.getCurrentPosition(
    (position) => {
      userLocation.value = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      }
      locationLoading.value = false
      showLocationModal.value = false
      notify.success('Nous affinons les paniers en fonction de votre position.', 'Position activée')
      resetPagination()
      fetchProducts()
    },
    (error) => {
      locationLoading.value = false
      showLocationModal.value = false
      let message = 'Impossible d\'obtenir votre position'

      switch (error.code) {
        case error.PERMISSION_DENIED:
          message = 'Autorisation de géolocalisation refusée. Vous pouvez la réactiver dans les paramètres de votre navigateur.'
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
  loadCategories()
  loadUserImpact()
  fetchProducts()
})

const scheduleFiltersReload = () => {
  if (isResettingFilters.value) {
    return
  }

  resetPagination()
  fetchProducts()
}

watch(() => filters.value.category, scheduleFiltersReload)
watch(() => filters.value.radius, scheduleFiltersReload)
watch(() => filters.value.maxPrice, scheduleFiltersReload)
watch(() => filters.value.minDiscount, scheduleFiltersReload)

watch(searchQuery, () => {
  if (isResettingFilters.value) {
    return
  }

  if (searchDebounce) {
    clearTimeout(searchDebounce)
  }

  searchDebounce = setTimeout(() => {
    resetPagination()
    fetchProducts()
  }, 350)
})

onBeforeUnmount(() => {
  if (searchDebounce) {
    clearTimeout(searchDebounce)
    searchDebounce = null
  }
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

.product-card-skeleton {
  @apply overflow-hidden rounded-3xl border border-neutral-200/60 bg-surface-light/80 shadow-card dark:border-neutral-700/60 dark:bg-surface-dark/70;
}

.product-card-skeleton-image {
  @apply aspect-[4/3] w-full bg-gradient-to-br from-neutral-200/70 via-neutral-100/60 to-white dark:from-neutral-800/50 dark:via-neutral-700/40 dark:to-neutral-800/40;
}

.product-card-skeleton-lines :deep(.h-10) {
  @apply h-4 rounded-lg bg-neutral-200 dark:bg-neutral-700;
}

.product-card-skeleton-lines :deep(.last\:w-sm\/3) {
  @apply w-1/2;
}

.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
</style>
