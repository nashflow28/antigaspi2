<template>
  <div class="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-primary-50">
    <div class="border-b border-neutral-200/70 bg-white/80 backdrop-blur">
      <div class="container mx-auto px-6 py-10">
        <nav class="mb-6 text-responsive-sm text-neutral-500" aria-label="Fil d'Ariane">
          <ol class="flex items-center gap-2">
            <li><router-link to="/" class="hover:text-neutral-700">Accueil</router-link></li>
            <li class="text-neutral-400">/</li>
            <li><router-link to="/discover" class="hover:text-neutral-700">Découvrir</router-link></li>
            <li class="text-neutral-400">/</li>
            <li class="font-medium text-neutral-700">{{ merchantName }}</li>
          </ol>
        </nav>
        <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p class="inline-flex items-center gap-2 rounded-full bg-primary-100/70 px-4 py-3 text-responsive-sm font-medium text-primary-700">
              <Store class="h-5 w-5" />
              Profil commerçant
            </p>
            <h1 class="mt-3 text-display-sm font-semibold tracking-tight text-neutral-900">{{ merchantName }}</h1>
            <p class="mt-2 max-w-3xl text-neutral-600">{{ merchantDescription }}</p>
          </div>
          <Button
            variant="secondary"
            class="w-full max-w-xs"
            @click="toggleFavorite"
          >
            <Heart :class="isFavorite ? 'fill-primary-500 text-primary-500' : 'text-primary-600'" class="h-5 w-5" />
            <span class="ml-2">{{ isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris' }}</span>
          </Button>
        </div>
      </div>
    </div>

    <main class="container mx-auto grid gap-8 px-6 py-12 lg:grid-cols-[2fr_1fr]">
      <section class="space-y-6">
        <Card class="bg-white/90">
          <template #header>
            <h2 class="text-responsive-xl font-semibold text-neutral-900">Informations principales</h2>
          </template>

          <div v-if="loading" class="space-y-4">
            <Skeleton class="h-10 w-2/3" />
            <Skeleton class="h-5 w-1/2" />
            <Skeleton class="h-5 w-1/3" />
          </div>

          <div v-else class="space-y-4 text-responsive-sm text-neutral-600">
            <div class="grid gap-4 md:grid-cols-2">
              <p class="flex items-center gap-3">
                <BadgeInfo class="h-5 w-5 text-primary-500" />
                {{ merchantBusinessType }}
              </p>
              <p class="flex items-center gap-3">
                <MapPin class="h-5 w-5 text-primary-500" />
                {{ merchantAddress }}
              </p>
              <p v-if="merchantPhone" class="flex items-center gap-3">
                <Phone class="h-5 w-5 text-primary-500" />
                {{ merchantPhone }}
              </p>
              <p v-if="merchantDistance" class="flex items-center gap-3">
                <Navigation class="h-5 w-5 text-primary-500" />
                À {{ merchantDistance }} km de vous
              </p>
            </div>
            <div v-if="openingHours.length" class="rounded-3xl bg-neutral-50 p-6">
              <h3 class="text-responsive-base font-semibold text-neutral-800">Horaires d'ouverture</h3>
              <ul class="mt-3 grid gap-2 sm:grid-cols-2">
                <li v-for="entry in openingHours" :key="entry.day" class="flex items-center justify-between text-responsive-sm">
                  <span class="font-medium text-neutral-700">{{ entry.day }}</span>
                  <span class="text-neutral-500">{{ entry.hours }}</span>
                </li>
              </ul>
            </div>
          </div>
        </Card>

        <Card class="bg-white/90">
          <template #header>
            <div class="flex items-center justify-between">
              <h2 class="text-responsive-xl font-semibold text-neutral-900">Paniers proposés</h2>
              <span class="text-responsive-sm text-neutral-500">{{ merchantProductsCount }} disponible{{ merchantProductsCount > 1 ? 's' : '' }}</span>
            </div>
          </template>

          <div v-if="!productsPreview.length" class="rounded-3xl border border-dashed border-neutral-300 bg-white/70 p-10 text-center">
            <Package class="mx-auto h-12 w-12 text-neutral-300" />
            <h3 class="mt-3 text-responsive-lg font-semibold text-neutral-800">Pas de panier actif pour le moment</h3>
            <p class="mt-2 text-neutral-500">Ajoutez ce commerçant à vos favoris pour être prévenu dès qu'un panier sera mis en ligne.</p>
          </div>

          <ul v-else class="grid gap-4 md:grid-cols-2">
            <li
              v-for="product in productsPreview"
              :key="product.id"
              class="rounded-3xl border border-neutral-200 bg-white p-4 shadow-sm"
            >
              <p class="text-responsive-sm font-semibold text-neutral-800">{{ product.name }}</p>
              <p class="mt-1 text-responsive-xs text-neutral-500">{{ product.description }}</p>
              <p class="mt-2 text-responsive-sm font-semibold text-primary-600">{{ formatPrice(product.discounted_price) }}</p>
            </li>
          </ul>
        </Card>
      </section>

      <aside class="space-y-6">
        <Card class="bg-white/90">
          <template #header>
            <h2 class="text-responsive-xl font-semibold text-neutral-900">Confiance & impact</h2>
          </template>
          <div class="space-y-3 text-responsive-sm text-neutral-600">
            <p v-if="merchantRating" class="flex items-center gap-2">
              <Star class="h-5 w-5 text-amber-400" />
              {{ merchantRating }} / 5 — {{ merchantReviews }} avis
            </p>
            <p class="flex items-center gap-2">
              <Leaf class="h-5 w-5 text-primary-500" />
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

        <Card class="bg-primary-500/95 text-white">
          <template #header>
            <h2 class="text-responsive-lg font-semibold">Conseil AntiGaspi</h2>
          </template>
          <p class="text-responsive-sm text-primary-50">
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
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import Button from '@/components/ui/Button.vue'
import Card from '@/components/ui/Card.vue'
import Skeleton from '@/components/ui/Skeleton.vue'
import { useMerchantsStore } from '@/stores/merchants'
import { useFavoritesStore } from '@/stores/favorites'
import { notify } from '@/composables/useNotifications'
import { formatPrice } from '@/utils/currency'
import { Store, Heart, BadgeInfo, MapPin, Phone, Navigation, Package, Star, Leaf } from 'lucide-vue-next'
import { sanitizeRouteId, logXssAttempt } from '@/utils/sanitization'
import type { MerchantDetail } from '@/services/merchantService'

const route = useRoute()
const router = useRouter()
const merchantsStore = useMerchantsStore()
const favoritesStore = useFavoritesStore()
const { currentMerchant, detailLoading } = storeToRefs(merchantsStore)

const fallbackMerchant = ref<MerchantDetail | null>(null)

// SECURITY FIX: Sanitize route parameters to prevent XSS
const merchantId = computed(() => {
  const rawId = route.params.id as string
  logXssAttempt(rawId || '', 'MerchantDetailView route param')
  const sanitizedId = sanitizeRouteId(rawId)
  return sanitizedId || 0
})
const activeMerchant = computed<MerchantDetail | null>(() => currentMerchant.value ?? fallbackMerchant.value)

const merchantName = computed(() => activeMerchant.value?.business_name ?? 'Commerçant AntiGaspi')
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
const merchantImpact = computed(() => (activeMerchant.value as any)?.saved_weight ?? 35)

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

const loading = computed(() => detailLoading.value && !fallbackMerchant.value)
const isFavorite = computed(() => favoritesStore.isFavorite(merchantId.value, 'merchant'))

const toggleFavorite = () => {
  if (!activeMerchant.value) {
    return
  }

  favoritesStore.toggleFavorite({
    id: activeMerchant.value.id,
    type: 'merchant',
    name: activeMerchant.value.business_name,
    description: activeMerchant.value.business_type,
    merchant: activeMerchant.value
  })
}

const fetchMerchant = async () => {
  if (!merchantId.value) {
    notify.error('Commerçant introuvable.', 'Commerçants')
    router.push({ name: 'discover' })
    return
  }

  const result = await merchantsStore.fetchMerchantDetail(merchantId.value)
  if (!result.success && !activeMerchant.value) {
    fallbackMerchant.value = {
      id: merchantId.value,
      business_name: 'Commerçant engagé',
      business_type: 'Primeur responsable',
      city: 'Lomé',
      address: 'Adresse communiquée après réservation',
      phone: '+228 90 00 00 00',
      is_verified: true,
      latitude: null,
      longitude: null,
      distance_km: 2.4,
      products_count: 3,
      description: 'Nous sauvons les invendus des maraîchers locaux pour composer des paniers de saison.',
      rating: 4.7,
      total_reviews: 54,
      opening_hours: {
        Lundi: '08h00 - 18h00',
        Mardi: '08h00 - 18h00',
        Mercredi: '08h00 - 18h00',
        Jeudi: '08h00 - 18h00',
        Vendredi: '08h00 - 19h00'
      },
      surprise_baskets: [],
      featured_products: [
        { id: 1, name: 'Panier légumes du jour', description: "Assortiment d'une dizaine de légumes", discounted_price: 3200 },
        { id: 2, name: 'Panier brunch', description: 'Viennoiseries, fruits, boissons locales', discounted_price: 4500 }
      ],
      user: { city: 'Lomé', address: 'Quartier Tokoin', phone: '+228 90 00 00 00' }
    } as MerchantDetail

    notify.info("Affichage d'une fiche commerçant de démonstration.", 'Commerçants')
  } else if (!result.success && result.error) {
    notify.error(result.error, 'Commerçants')
  }
}

onMounted(() => {
  favoritesStore.hydrateFromStorage()
  fetchMerchant()
})
</script>
