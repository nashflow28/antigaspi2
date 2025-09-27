<template>
  <div class="min-h-screen bg-gradient-to-b from-neutral-50 via-white to-primary-50">
    <div class="border-b border-neutral-200/70 bg-white/80 backdrop-blur">
      <div class="container px-4 sm:px-6 lg:px-8 mx-auto px-6 py-10">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p class="inline-flex items-center gap-2 rounded-full bg-primary-100/70 px-4 py-3 text-responsive-sm font-medium text-primary-emphasis">
              <Star class="h-5 w-5" />
              Avis vérifiés de la communauté
            </p>
            <h1 class="mt-3 text-display-sm font-semibold tracking-tight text-heading">L'expérience AntiGaspi partagée</h1>
            <p class="mt-2 max-w-full sm:max-w-2xl text-body">
              Consultez les témoignages récents, filtrez par commerçant ou par note et découvrez les paniers plébiscités.
            </p>
          </div>
          <div class="flex flex-wrap gap-3">
            <select
              v-model="selectedMerchant"
              class="rounded-2xl border border-neutral-200 px-4 py-3 text-responsive-sm shadow-inner focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200"
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
              class="rounded-2xl border border-neutral-200 px-4 py-3 text-responsive-sm shadow-inner focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200"
            >
              <option value="">Toutes les notes</option>
              <option v-for="rating in [5,4,3,2,1]" :key="rating" :value="rating">
                {{ rating }} étoiles et plus
              </option>
            </select>
            <Button
              variant="ghost"
              size="sm"
              class="text-muted"
              @click="resetFilters"
            >
              Réinitialiser
            </Button>
          </div>
        </div>
      </div>
    </div>

    <main class="container px-4 sm:px-6 lg:px-8 mx-auto grid gap-6 sm:gap-8 px-6 py-8 sm:py-10 lg:py-12 lg:grid-cols-[2fr_1fr]">
      <section class="space-y-6">
        <Card class="bg-white/90">
          <template #header>
            <div class="flex items-center justify-between">
              <div>
                <h2 class="text-responsive-xl font-semibold text-heading">Derniers avis publiés</h2>
                <p class="text-responsive-sm text-muted">{{ filteredReviews.length }} avis affichés</p>
              </div>
              <div class="flex items-center gap-2 text-responsive-sm text-amber-500">
                <Star class="h-5 w-5 fill-amber-400" />
                <span>{{ averageRating.toFixed(1) }} / 5</span>
              </div>
            </div>
          </template>

          <div v-if="reviewsLoading" class="space-y-4">
            <Card v-for="n in 3" :key="n" class="bg-white/80">
              <Skeleton class="h-5 w-1/4" />
              <Skeleton class="h-5 w-full" />
              <Skeleton class="h-5 w-3/4" />
            </Card>
          </div>

          <div v-else-if="filteredReviews.length === 0" class="rounded-3xl border border-dashed border-neutral-300 bg-white/70 p-6 sm:p-8 lg:p-12 text-left sm:text-center">
            <MessageSquare class="mx-auto h-12 w-12 text-neutral-300" />
            <h3 class="mt-3 text-responsive-lg font-semibold text-heading-secondary">Aucun avis ne correspond à vos filtres</h3>
            <p class="mt-2 text-muted">Essayez une autre note ou découvrez un nouveau commerçant.</p>
          </div>

          <ul v-else class="space-y-4">
            <li
              v-for="review in filteredReviews"
              :key="review.id"
              class="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm"
            >
              <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p class="text-responsive-sm font-semibold text-primary">{{ review.merchantName }}</p>
                  <p class="text-responsive-lg font-semibold text-heading">{{ review.title }}</p>
                  <p class="text-responsive-sm text-muted">{{ review.productName }}</p>
                </div>
                <div class="flex items-center gap-2">
                  <div class="flex items-center gap-2">
                    <Star
                      v-for="star in 5"
                      :key="star"
                      class="h-5 w-5"
                      :class="star <= review.rating ? 'text-amber-400 fill-amber-400' : 'text-neutral-300'"
                    />
                  </div>
                  <span class="text-responsive-xs text-placeholder">{{ review.timeAgo }}</span>
                </div>
              </div>
              <p class="mt-4 text-responsive-sm text-body-emphasis">{{ review.comment }}</p>
              <div class="mt-4 flex flex-wrap items-center gap-3 text-responsive-xs text-muted">
                <span class="inline-flex items-center gap-2 rounded-full bg-primary-50 px-4 py-3 text-primary">
                  <Leaf class="h-3 w-3" /> {{ review.impact }} kg sauvés
                </span>
                <span v-if="review.isVerified" class="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-3 text-emerald-600">
                  <ShieldCheck class="h-3 w-3" /> Achat vérifié
                </span>
              </div>
            </li>
          </ul>
        </Card>
      </section>

      <aside class="space-y-6">
        <Card class="bg-white/90">
          <template #header>
            <h2 class="text-responsive-xl font-semibold text-heading">Top commerçants</h2>
          </template>
          <ul class="space-y-3 text-responsive-sm text-body">
            <li
              v-for="entry in topMerchants"
              :key="entry.id"
              class="flex items-center justify-between"
            >
              <div>
                <p class="font-semibold text-heading-secondary">{{ entry.name }}</p>
                <p class="text-responsive-xs text-muted">{{ entry.reviews }} avis</p>
              </div>
              <span class="rounded-full bg-primary-50 px-4 py-3 text-responsive-xs font-semibold text-primary">{{ entry.rating.toFixed(1) }}/5</span>
            </li>
          </ul>
        </Card>

        <Card class="bg-primary-500/95 text-white">
          <template #header>
            <h2 class="text-responsive-lg font-semibold">Partager votre expérience</h2>
          </template>
          <p class="text-responsive-sm text-primary-50">
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
import { computed, onMounted, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import Button from '@/components/ui/Button.vue'
import Card from '@/components/ui/Card.vue'
import Skeleton from '@/components/ui/Skeleton.vue'
import { useMerchantsStore } from '@/stores/merchants'
import { notify } from '@/composables/useNotifications'
import { Star, MessageSquare, Leaf, ShieldCheck } from 'lucide-vue-next'

interface PublicReview {
  id: number
  merchantId: number
  merchantName: string
  rating: number
  title: string
  comment: string
  productName: string
  timeAgo: string
  impact: number
  isVerified: boolean
}

const router = useRouter()
const route = useRoute()
const merchantsStore = useMerchantsStore()
const { merchants } = storeToRefs(merchantsStore)

const selectedMerchant = ref<string>('')
const selectedRating = ref<number | ''>('')
const reviewsLoading = ref(false)
const reviews = ref<PublicReview[]>([
  {
    id: 1,
    merchantId: 1,
    merchantName: 'Boulangerie du Soleil',
    rating: 5,
    title: 'Viennoiseries incroyables !',
    comment: 'Le panier surprise était généreux avec des croissants croustillants et un jus frais. À refaire !',
    productName: 'Panier petit-déjeuner',
    timeAgo: 'Il y a 2 heures',
    impact: 3,
    isVerified: true
  },
  {
    id: 2,
    merchantId: 2,
    merchantName: 'Marché des Saveurs',
    rating: 4,
    title: 'Fruits de saison au top',
    comment: 'Très bon panier de fruits locaux, quelques bananes un peu mûres mais parfait pour des smoothies.',
    productName: 'Panier vitaminé',
    timeAgo: 'Il y a 1 jour',
    impact: 5,
    isVerified: true
  },
  {
    id: 3,
    merchantId: 3,
    merchantName: 'Café Green Spirit',
    rating: 5,
    title: 'Brunch gourmand',
    comment: 'Portion très généreuse et découverte de nouvelles boissons locales. Merci !',
    productName: 'Panier brunch',
    timeAgo: 'Il y a 3 jours',
    impact: 2,
    isVerified: false
  },
  {
    id: 4,
    merchantId: 2,
    merchantName: 'Marché des Saveurs',
    rating: 3,
    title: 'Panier correct',
    comment: 'Quelques légumes étaient un peu abîmés mais le commerçant a ajouté des herbes fraîches en compensation.',
    productName: 'Panier maraîcher',
    timeAgo: 'Il y a 5 jours',
    impact: 4,
    isVerified: true
  }
])

const merchantOptions = computed(() => {
  if (merchants.value.length === 0) {
    return [
      { id: 1, name: 'Boulangerie du Soleil' },
      { id: 2, name: 'Marché des Saveurs' },
      { id: 3, name: 'Café Green Spirit' }
    ]
  }

  return merchants.value.map(merchant => ({ id: merchant.id, name: merchant.business_name }))
})

const filteredReviews = computed(() => {
  return reviews.value.filter(review => {
    const merchantFilter = !selectedMerchant.value || review.merchantId === Number(selectedMerchant.value)
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
    const entry = stats.get(review.merchantId)
    if (!entry) {
      stats.set(review.merchantId, { id: review.merchantId, name: review.merchantName, rating: review.rating, reviews: 1 })
    } else {
      entry.rating = (entry.rating * entry.reviews + review.rating) / (entry.reviews + 1)
      entry.reviews += 1
    }
  })
  return Array.from(stats.values()).sort((a, b) => b.rating - a.rating).slice(0, 4)
})

const resetFilters = () => {
  selectedMerchant.value = ''
  selectedRating.value = ''
}

const fetchMerchants = async () => {
  reviewsLoading.value = true
  const result = await merchantsStore.fetchMerchants().catch(() => ({ success: false }))
  if (!result?.success) {
    notify.info('Affichage des avis de démonstration.', 'Avis publics')
  }
  reviewsLoading.value = false
}

onMounted(() => {
  const merchantFromQuery = route.query.merchant as string | undefined
  if (merchantFromQuery) {
    selectedMerchant.value = merchantFromQuery
  }
  fetchMerchants()
})
</script>
