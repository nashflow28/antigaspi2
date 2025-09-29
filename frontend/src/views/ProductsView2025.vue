<template>
  <div class="min-h-screen bg-gradient-to-br from-surface-light via-surface-light to-primary-50/15 dark:from-surface-dark dark:via-surface-dark dark:to-surface-darker">
    <header
      class="sticky top-0 z-40 border-b border-white/50 bg-surface-light/80 dark:bg-surface-dark/70 backdrop-blur-2xl shadow-[0_18px_40px_-24px_rgba(4,120,87,0.35)]"
    >
      <div class="container px-3 sm:px-4 lg:px-6 py-12">
        <div class="flex flex-col gap-4 sm:gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div class="space-y-5 max-w-full sm:max-w-80">
            <Badge
              variant="primary"
              size="sm"
              rounded
              class="w-max px-3 py-3 shadow-sm shadow-primary-200/40"
            >
              Catalogue 2025
            </Badge>
            <div class="space-y-2">
              <h1 class="font-display text-3xl lg:text-3xl font-semibold text-neutral-900 dark:text-neutral-100 leading-relaxed">
                Produits responsables à portée de main
              </h1>
              <p class="text-neutral-600 dark:text-neutral-300">
                {{ filteredProducts.length }} produit{{ filteredProducts.length > 1 ? 's' : '' }} disponible{{
                  filteredProducts.length > 1 ? 's' : ''
                }}
              </p>
            </div>
            <p class="text-sm text-neutral-500 dark:text-neutral-400">
              Explorez nos paniers anti-gaspi triés par impact, localisation et économies garanties.
            </p>
          </div>
          <Card variant="glass" class="w-full max-w-xl shadow-lg animate-fade-in-up">
            <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
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
            </div>
          </Card>
        </div>
      </div>
    </header>

    <main class="container px-3 sm:px-4 lg:px-6 space-y-20 py-20">
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

      <section>
        <div v-if="loading" class="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
          <Card
            v-for="index in 8"
            :key="index"
            variant="glass"
            :no-padding="true"
            class="space-y-4 p-4"
          >
            <Skeleton class="aspect-square w-full rounded-modern" />
            <div class="space-y-4">
              <Skeleton class="h-4 w-4/3 rounded-full" />
              <Skeleton class="h-3 w-1/2 rounded-full" />
              <Skeleton class="h-4 w-full rounded" />
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
          class="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4"
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
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
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
      throw new Error(response?.message || 'Réponse inattendue de l’API')
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

const formatQuantity = (product: NormalizedProduct) => {
  const available = getAvailableQuantity(product)
  if (available === 0) return 'Complet'
  if (available === 1) return '1 restant'
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
    // console.error('Erreur lors de la réservation rapide:', error)
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
      resetPagination()
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
  loadCategories()
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
</style>
