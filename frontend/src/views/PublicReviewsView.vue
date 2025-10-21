<template>
  <div class="min-h-screen bg-gradient-to-b from-gray-50 via-white to-blue-50">
    <div class="border-b border-gray-200/70 bg-white/80 backdrop-blur">
      <div class="container px-3 sm:px-4 lg:px-6 mx-auto px-4 py-12">
        <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p class="inline-flex items-center gap-2 rounded-full bg-blue-100/70 px-3 py-3 text-sm font-medium text-blue-900">
              <Star class="h-4 w-4" />
              Avis vérifiés de la communauté
            </p>
            <h1 class="mt-3 text-3xl font-semibold tracking-tight text-gray-900">L'expérience AntiGaspi partagée</h1>
            <p class="mt-2 max-w-full sm:max-w-80 text-gray-700">
              Consultez les témoignages récents, filtrez par commerçant ou par note et découvrez les paniers plébiscités.
            </p>
          </div>
          <div class="flex flex-wrap gap-3">
            <select
              v-model="selectedMerchant"
              class="rounded border border-gray-200 px-3 py-3 text-sm shadow-inner focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              <option value="">Tous les commerçants</option>
              <option
                v-for="merchant in merchantOptions"
                :key="merchant.id"
                :value="String(merchant.id)"
              >
                {{ merchant.name }}
              </option>
            </select>
            <select
              v-model="selectedRating"
              class="rounded border border-gray-200 px-3 py-3 text-sm shadow-inner focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              <option value="">Toutes les notes</option>
              <option v-for="rating in [5,4,3,2,1]" :key="rating" :value="rating">
                {{ rating }} étoiles et plus
              </option>
            </select>
            <Button
              variant="ghost"
              size="sm"
              class="text-gray-500"
              @click="resetFilters"
            >
              Réinitialiser
            </Button>
          </div>
        </div>
      </div>
    </div>

    <main class="container px-3 sm:px-4 lg:px-6 mx-auto grid gap-6 sm:gap-8 px-4 py-8 sm:py-12 lg:py-16 lg:grid-cols-[2fr_1fr]">
      <section class="space-y-6">
        <Card class="bg-white/90">
          <template #header>
            <div class="flex items-center justify-between">
              <div>
                <h2 class="text-xl font-semibold text-gray-900">Derniers avis publiés</h2>
                <p class="text-sm text-gray-500">{{ filteredReviews.length }} avis affichés</p>
              </div>
              <div class="flex items-center gap-2 text-sm text-amber-500">
                <Star class="h-4 w-4 fill-amber-400" />
                <span>{{ averageRating.toFixed(1) }} / 5</span>
              </div>
            </div>
          </template>

          <div v-if="reviewsLoading" class="space-y-4">
            <Card v-for="n in 3" :key="n" class="bg-white/80">
              <Skeleton class="h-4 w-3/4" />
              <Skeleton class="h-4 w-full" />
              <Skeleton class="h-4 w-3/4" />
            </Card>
          </div>

          <div v-else-if="filteredReviews.length === 0" class="rounded border border-dashed border-gray-300 bg-white/70 p-6 sm:p-12 lg:p-12 text-left sm:text-center">
            <MessageSquare class="mx-auto h-6 w-6 text-gray-500" />
            <h3 class="mt-3 text-lg font-semibold text-gray-800">Aucun avis ne correspond à vos filtres</h3>
            <p class="mt-2 text-gray-500">Essayez une autre note ou découvrez un nouveau commerçant.</p>
          </div>

          <ul v-else class="space-y-4">
            <li
              v-for="review in filteredReviews"
              :key="review.id"
              class="rounded border border-gray-200 bg-white p-6 shadow-sm"
            >
              <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p class="text-sm font-semibold text-blue-600">{{ review.merchant?.business_name ?? 'Commerçant AntiGaspi' }}</p>
                  <p class="text-lg font-semibold text-gray-900">{{ review.title ?? 'Avis client' }}</p>
                  <p class="text-sm text-gray-500">{{ review.product?.name ?? 'Panier AntiGaspi' }}</p>
                </div>
                <div class="flex items-center gap-2">
                  <div class="flex items-center gap-2">
                    <Star
                      v-for="star in 5"
                      :key="star"
                      class="h-4 w-4"
                      :class="star <= review.rating ? 'text-yellow-400 fill-amber-400' : 'text-gray-500'"
                    />
                  </div>
                  <span class="text-xs text-gray-400">{{ review.time_ago ?? '' }}</span>
                </div>
              </div>
              <p class="mt-4 text-sm text-gray-800">{{ review.comment ?? 'Avis non renseigné.' }}</p>
              <div class="mt-4 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                <span v-if="review.is_verified_purchase" class="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-3 text-blue-600">
                  <ShieldCheck class="icon-xs" /> Achat vérifié
                </span>
              </div>
            </li>
          </ul>
        </Card>
      </section>

      <aside class="space-y-6">
        <Card class="bg-white/90">
          <template #header>
            <h2 class="text-xl font-semibold text-gray-900">Top commerçants</h2>
          </template>
          <ul class="space-y-2 text-sm text-gray-700">
            <li
              v-for="entry in topMerchants"
              :key="entry.id"
              class="flex items-center justify-between"
            >
              <div>
                <p class="font-semibold text-gray-800">{{ entry.name }}</p>
                <p class="text-xs text-gray-500">{{ entry.reviews }} avis</p>
              </div>
              <span class="rounded-full bg-blue-50 px-3 py-3 text-xs font-semibold text-blue-600">{{ entry.rating.toFixed(1) }}/5</span>
            </li>
          </ul>
        </Card>

        <Card class="bg-blue-500/95 text-white">
          <template #header>
            <h2 class="text-lg font-semibold">Partager votre expérience</h2>
          </template>
          <p class="text-sm text-blue-50">
            Après votre prochain retrait, laissez un avis pour aider la communauté à choisir ses paniers.
          </p>
          <Button
            variant="secondary"
            class="mt-4 w-full border-white/40 bg-white/20 text-white hover:bg-white/30"
            @click="router.push({ name: 'reviews' })"
          >
            Déposer un avis
          </Button>
        </Card>
      </aside>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import Button from '@/components/ui/Button.vue'
import Card from '@/components/ui/Card.vue'
import Skeleton from '@/components/ui/Skeleton.vue'
import { useMerchantsStore } from '@/stores/merchants'
import { notify } from '@/composables/useNotifications'
import { apiService } from '@/services/api'
import type { PublicReviewEntry } from '@/types'
import { Star, MessageSquare, ShieldCheck } from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()
const merchantsStore = useMerchantsStore()
const { merchants } = storeToRefs(merchantsStore)

const selectedMerchant = ref<string>('')
const selectedRating = ref<number | ''>('')
const reviewsLoading = ref(false)
const reviews = ref<PublicReviewEntry[]>([])
const filtersReady = ref(false)

const merchantOptions = computed(() => {
  if (merchants.value.length > 0) {
    return merchants.value.map(merchant => ({ id: merchant.id, name: merchant.business_name }))
  }

  const fromReviews = new Map<number, string>()
  reviews.value.forEach(review => {
    const merchantId = review.merchant?.id
    const name = review.merchant?.business_name
    if (merchantId && name && !fromReviews.has(merchantId)) {
      fromReviews.set(merchantId, name)
    }
  })

  return Array.from(fromReviews.entries()).map(([id, name]) => ({ id, name }))
})

const filteredReviews = computed(() => {
  return reviews.value.filter(review => {
    const merchantFilter = !selectedMerchant.value || review.merchant?.id === Number(selectedMerchant.value)
    const ratingFilter = !selectedRating.value || review.rating >= Number(selectedRating.value)
    return merchantFilter && ratingFilter
  })
})

const averageRating = computed(() => {
  if (filteredReviews.value.length === 0) {
    return 0
  }
  const total = filteredReviews.value.reduce((sum, review) => sum + review.rating, 0)
  return total / filteredReviews.value.length
})

const topMerchants = computed(() => {
  const stats = new Map<number, { id: number; name: string; rating: number; reviews: number }>()
  reviews.value.forEach(review => {
    const merchantId = review.merchant?.id
    if (!merchantId) {
      return
    }

    const entry = stats.get(merchantId)
    if (!entry) {
      stats.set(merchantId, {
        id: merchantId,
        name: review.merchant?.business_name ?? 'Commerçant AntiGaspi',
        rating: review.rating,
        reviews: 1
      })
    } else {
      entry.rating = (entry.rating * entry.reviews + review.rating) / (entry.reviews + 1)
      entry.reviews += 1
    }
  })

  return Array.from(stats.values()).sort((a, b) => b.rating - a.rating).slice(0, 4)
})

const resetFilters = () => {
  if (!filtersReady.value) {
    selectedMerchant.value = ''
    selectedRating.value = ''
    return
  }

  filtersReady.value = false
  selectedMerchant.value = ''
  selectedRating.value = ''
  filtersReady.value = true
  void fetchReviews()
}

const fetchMerchants = async () => {
  await merchantsStore.fetchMerchants().catch(() => ({ success: false }))
}

const fetchReviews = async () => {
  try {
    reviewsLoading.value = true
    const params: Record<string, string | number | undefined> = {}
    if (selectedMerchant.value) {
      params.merchant_id = Number(selectedMerchant.value)
    }
    if (selectedRating.value) {
      params.rating = Number(selectedRating.value)
    }

    const response = await apiService.getPublicReviews(params)
    if (!response.success) {
      throw new Error(response.message || 'Erreur lors du chargement des avis')
    }

    reviews.value = Array.isArray(response.data) ? response.data : []
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors du chargement des avis publics'
    notify.error(message, 'Avis publics')
  } finally {
    reviewsLoading.value = false
  }
}

onMounted(async () => {
  const merchantFromQuery = route.query.merchant as string | undefined
  if (merchantFromQuery) {
    selectedMerchant.value = merchantFromQuery
  }

  await fetchMerchants()
  await fetchReviews()
  filtersReady.value = true
})

watch([selectedMerchant, selectedRating], () => {
  if (!filtersReady.value) {
    return
  }
  void fetchReviews()
})
</script>
