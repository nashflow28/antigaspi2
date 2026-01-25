<template>
  <div class="min-h-screen bg-gradient-to-br from-surface-light via-neutral-50 to-neutral-100 dark:from-surface-dark dark:via-neutral-900 dark:to-surface-darker">
    <div class="border-b border-neutral-200 dark:border-neutral-700/70 bg-white/80 dark:bg-neutral-800/80 backdrop-blur">
      <div class="container px-3 sm:px-4 lg:px-6 mx-auto px-4 py-12">
        <nav class="mt-4 text-sm text-neutral-500 dark:text-neutral-400" aria-label="Fil d'Ariane">
          <ol class="flex items-center gap-2">
            <li><router-link to="/" class="hover:text-neutral-800 dark:hover:text-neutral-200">Accueil</router-link></li>
            <li class="text-neutral-400 dark:text-neutral-500">/</li>
            <li><router-link to="/discover" class="hover:text-neutral-800 dark:hover:text-neutral-200">Découvrir</router-link></li>
            <li class="text-neutral-400 dark:text-neutral-500">/</li>
            <li class="font-medium text-neutral-800 dark:text-neutral-100">{{ merchantName }}</li>
          </ol>
        </nav>
        <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p class="inline-flex items-center gap-2 rounded-full bg-primary-100/70 dark:bg-primary-500/20 px-3 py-3 text-sm font-medium text-primary-900 dark:text-primary-100">
              <Store class="w-4 h-4" />
              Profil commerçant
            </p>
            <h1 class="mt-3 text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">{{ merchantName }}</h1>
            <p class="mt-2 max-w-6xl text-neutral-700 dark:text-neutral-300">{{ merchantDescription }}</p>
          </div>
          <Button
            variant="secondary"
            class="w-full max-w-xs"
            @click="toggleFavorite"
          >
            <Heart :class="isFavorite ? 'fill-primary-500 text-primary-500' : 'text-primary-600 dark:text-primary-400'" class="w-4 h-4" />
            <span class="ml-2">{{ isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris' }}</span>
          </Button>
        </div>
      </div>
    </div>

    <main class="container px-3 sm:px-4 lg:px-6 mx-auto grid gap-6 sm:gap-8 px-4 py-8 sm:py-12 lg:py-16 lg:grid-cols-[2fr_1fr]">
      <section class="space-y-6">
        <Card class="bg-white/90 dark:bg-neutral-800/90">
          <template #header>
            <h2 class="text-xl font-semibold text-neutral-900 dark:text-neutral-50">Informations principales</h2>
          </template>

          <div v-if="loading" class="space-y-4">
            <Loading class="h-10 w-1/3" />
            <Loading class="h-4 w-1/2" />
            <Loading class="h-4 w-full" />
          </div>

          <div v-else class="space-y-4 text-sm text-neutral-700 dark:text-neutral-300">
            <div class="grid gap-3 md:grid-cols-2">
              <p class="flex items-center gap-3">
                <BadgeInfo class="w-4 h-4 text-primary-500" />
                {{ merchantBusinessType }}
              </p>
              <p class="flex items-center gap-3">
                <MapPin class="w-4 h-4 text-primary-500" />
                {{ merchantAddress }}
              </p>
              <p v-if="merchantPhone" class="flex items-center gap-3">
                <Phone class="w-4 h-4 text-primary-500" />
                {{ merchantPhone }}
              </p>
              <p v-if="merchantDistance" class="flex items-center gap-3">
                <Navigation class="w-4 h-4 text-primary-500" />
                À {{ merchantDistance }} km de vous
              </p>
            </div>
            <div v-if="openingHours.length" class="rounded bg-neutral-50 dark:bg-neutral-700/50 p-6">
              <h3 class="text-base font-semibold text-neutral-800 dark:text-neutral-100">Horaires d'ouverture</h3>
              <ul class="mt-3 grid gap-2 sm:grid-cols-2">
                <li v-for="entry in openingHours" :key="entry.day" class="flex items-center justify-between text-sm">
                  <span class="font-medium text-neutral-800 dark:text-neutral-200">{{ entry.day }}</span>
                  <span class="text-neutral-500 dark:text-neutral-400">{{ entry.hours }}</span>
                </li>
              </ul>
            </div>
          </div>
        </Card>

        <Card class="bg-white/90 dark:bg-neutral-800/90">
          <template #header>
            <div class="flex items-center justify-between">
              <h2 class="text-xl font-semibold text-neutral-900 dark:text-neutral-50">Paniers proposés</h2>
              <span class="text-sm text-neutral-500 dark:text-neutral-400">{{ merchantProductsCount }} disponible{{ merchantProductsCount > 1 ? 's' : '' }}</span>
            </div>
          </template>

          <div v-if="!productsPreview.length" class="rounded border border-dashed border-neutral-300 dark:border-neutral-600 bg-white/70 dark:bg-neutral-700/50 p-12 text-left sm:text-center">
            <Package class="mx-auto w-5 h-5 text-neutral-500 dark:text-neutral-400" />
            <h3 class="mt-3 text-lg font-semibold text-neutral-800 dark:text-neutral-100">Pas de panier actif pour le moment</h3>
            <p class="mt-2 text-neutral-500 dark:text-neutral-400">Ajoutez ce commerçant à vos favoris pour être prévenu dès qu'un panier sera mis en ligne.</p>
          </div>

          <ul v-else class="grid gap-3 md:grid-cols-2">
            <li
              v-for="product in productsPreview"
              :key="product.id"
              class="rounded border border-neutral-200 dark:border-neutral-600 bg-white dark:bg-neutral-800 p-4 shadow-sm"
            >
              <p class="text-sm font-semibold text-neutral-800 dark:text-neutral-100">{{ product.name }}</p>
              <p class="mt-1 text-xs text-neutral-500 dark:text-neutral-400">{{ product.description }}</p>
              <p class="mt-2 text-sm font-semibold text-primary-600 dark:text-primary-400">{{ formatPrice(product.discounted_price) }}</p>
            </li>
          </ul>
        </Card>
      </section>

      <aside class="space-y-6">
        <Card class="bg-white/90 dark:bg-neutral-800/90">
          <template #header>
            <h2 class="text-xl font-semibold text-neutral-900 dark:text-neutral-50">Confiance & impact</h2>
          </template>
          <div class="space-y-2 text-sm text-neutral-700 dark:text-neutral-300">
            <p v-if="merchantRating" class="flex items-center gap-2">
              <Star class="w-4 h-4 text-yellow-400" />
              {{ merchantRating }} / 5 — {{ merchantReviews }} avis
            </p>
            <p class="flex items-center gap-2">
              <Leaf class="w-4 h-4 text-primary-500" />
              {{ merchantImpact }} kg sauvés cette année
            </p>
            <Button
              size="sm"
              class="w-full"
              @click="router.push({ name: 'public-reviews', query: { merchant: merchantId } })"
            >
              Lire les avis clients
            </Button>
          </div>
        </Card>

        <Card class="bg-primary-500 dark:bg-primary-600 text-white">
          <template #header>
            <h2 class="text-lg font-semibold">Conseil GÊLADAL</h2>
          </template>
          <p class="text-sm text-primary-50">
            Réservez la veille pour bénéficier des paniers primeurs fraîchement préparés par {{ merchantName }}.
          </p>
          <Button
            variant="secondary"
            class="mt-4 w-full border-white/40 bg-white/20 text-white hover:bg-white/30"
            @click="router.push({ name: 'surprise-baskets' })"
          >
            Voir les paniers disponibles
          </Button>
        </Card>
      </aside>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { Button, Card, Loading } from '@/components/ui/2025'
import { useMerchantsStore } from '@/stores/merchants'
import { useFavoritesStore } from '@/stores/favorites'
import { notify } from '@/composables/useNotifications'
import { formatPrice } from '@/utils/currency'
import { Store, Heart, BadgeInfo, MapPin, Phone, Navigation, Package, Star, Leaf } from 'lucide-vue-next'
import { sanitizeRouteId, logXssAttempt } from '@/utils/sanitization'

const route = useRoute()
const router = useRouter()
const merchantsStore = useMerchantsStore()
const favoritesStore = useFavoritesStore()
const { currentMerchant, detailLoading } = storeToRefs(merchantsStore)

// SECURITY FIX: Sanitize route parameters to prevent XSS
const merchantId = computed(() => {
  const rawId = route.params.id as string
  logXssAttempt(rawId || '', 'MerchantDetailView route param')
  const sanitizedId = sanitizeRouteId(rawId)
  return sanitizedId || 0
})
const activeMerchant = computed(() => currentMerchant.value)

const merchantName = computed(() => activeMerchant.value?.business_name ?? 'Commerçant GÊLADAL')
const merchantDescription = computed(() => (
  typeof activeMerchant.value?.description === 'string'
    ? activeMerchant.value.description
    : 'Commerce engagé contre le gaspillage alimentaire.'
))
const merchantBusinessType = computed(() => activeMerchant.value?.business_type ?? 'Commerce local')
const merchantAddress = computed(() => activeMerchant.value?.address ?? activeMerchant.value?.user?.address ?? 'Adresse communiquée après réservation')
const merchantPhone = computed(() => activeMerchant.value?.phone ?? activeMerchant.value?.user?.phone ?? '')
const merchantDistance = computed(() => activeMerchant.value?.distance_km ? activeMerchant.value.distance_km.toFixed(1) : '')
const merchantProductsCount = computed(() => activeMerchant.value?.products_count ?? 0)
const merchantRating = computed(() => activeMerchant.value?.rating ?? null)
const merchantReviews = computed(() => activeMerchant.value?.total_reviews ?? 0)
const merchantImpact = computed(() => {
  const impact = (activeMerchant.value as any)?.saved_weight
  if (typeof impact === 'number' && Number.isFinite(impact)) {
    return Math.max(0, Math.round(impact))
  }
  return 0
})

const openingHours = computed(() => {
  const hours = activeMerchant.value?.opening_hours
  if (!hours) {
    return [] as Array<{ day: string; hours: string }>
  }

  if (Array.isArray(hours)) {
    return hours as Array<{ day: string; hours: string }>
  }

  if (typeof hours === 'object') {
    return Object.entries(hours).map(([day, value]) => ({ day, hours: String(value) }))
  }

  if (typeof hours === 'string') {
    return hours.split('\n').map((line, index) => ({ day: `Jour ${index + 1}`, hours: line }))
  }

  return []
})

const productsPreview = computed(() => {
  const products = (activeMerchant.value as any)?.featured_products
  if (Array.isArray(products)) {
    return products.slice(0, 4).map((product: any, index: number) => ({
      id: product.id ?? index,
      name: product.name ?? 'Panier surprise',
      description: product.description ?? 'Composition variable selon arrivage.',
      discounted_price: Number(product.discounted_price ?? 3500)
    }))
  }

  return [] as Array<{ id: number; name: string; description: string; discounted_price: number }>
})

const loading = computed(() => detailLoading.value && !activeMerchant.value)
const isFavorite = computed(() => favoritesStore.isFavorite(merchantId.value, 'merchant'))

const toggleFavorite = async () => {
  if (!activeMerchant.value) {
    return
  }

  await favoritesStore.toggleFavorite({
    id: activeMerchant.value.id,
    type: 'merchant',
    name: activeMerchant.value.business_name,
    description: activeMerchant.value.business_type,
    merchant: {
      ...activeMerchant.value,
      latitude: activeMerchant.value.latitude ?? undefined,
      longitude: activeMerchant.value.longitude ?? undefined
    }
  })
}

const fetchMerchant = async () => {
  if (!merchantId.value) {
    notify.error('Commerçant introuvable.', 'Commerçants')
    router.push({ name: 'discover' })
    return
  }

  const result = await merchantsStore.fetchMerchantDetail(merchantId.value)
  if (!result.success) {
    const errorMessage = result.error || 'Commerçant introuvable.'
    notify.error(errorMessage, 'Commerçants')
    if (!activeMerchant.value) {
      router.push({ name: 'discover' })
    }
  }
}

onMounted(() => {
  void favoritesStore.initialize()
  fetchMerchant()
})
</script>
