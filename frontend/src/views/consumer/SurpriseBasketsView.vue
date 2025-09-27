<template>
  <div class="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100">
    <header class="border-b border-neutral-200 bg-white/80 backdrop-blur-sm">
      <div class="container mx-auto px-4 py-8">
        <div class="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <nav class="text-responsive-sm text-neutral-500" aria-label="Fil d'Ariane">
              <ol class="flex items-center gap-2">
                <li>
                  <router-link to="/" class="hover:text-neutral-700">Accueil</router-link>
                </li>
                <li class="text-neutral-400">/</li>
                <li class="font-medium text-neutral-700">Paniers surprise</li>
              </ol>
            </nav>
            <h1 class="mt-4 text-responsive-xl font-semibold text-neutral-900">Paniers surprise disponibles</h1>
            <p class="mt-2 text-neutral-600">
              {{ totalResults }} panier{{ totalResults > 1 ? 's' : '' }} disponible{{ totalResults > 1 ? 's' : '' }} près de chez vous
            </p>
          </div>

          <div class="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              size="md"
              :left-icon="Filter"
              @click="showFilters = !showFilters"
            >
              Filtres
              <Badge
                v-if="activeFiltersCount"
                variant="outline"
                size="xs"
                rounded
                class="ml-2"
              >
                {{ activeFiltersCount }}
              </Badge>
            </Button>
            <Card
              variant="elevated"
              :no-padding="true"
              class="flex items-center gap-3 rounded-xl px-4 py-3 shadow-primary-500/10"
            >
              <Package class="h-10 w-10 text-primary-500" />
              <div>
                <p class="text-responsive-xs uppercase tracking-wide text-neutral-500">Impact</p>
                <p class="text-responsive-sm font-semibold text-neutral-900">{{ totalResults }} commerçant{{ totalResults > 1 ? 's' : '' }}</p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </header>

    <main id="main-content" class="container mx-auto grid grid-cols-1 gap-8 px-4 py-10 lg:grid-cols-[320px_1fr]">
      <div v-if="showFilters" class="space-y-6">
        <SurpriseBasketFilters v-model="filters" :categories="availableCategories" @reset="handleFiltersReset" />
      </div>

      <section class="space-y-6">
        <div
          v-if="loading"
          class="flex min-h-[200px] items-center justify-center rounded-2xl border border-dashed border-neutral-200 bg-white"
        >
          <div class="flex items-center gap-3 text-neutral-600">
            <span class="inline-flex h-10 w-10 animate-spin rounded-full border-2 border-neutral-200 border-t-primary-500" />
            Chargement des paniers surprise...
          </div>
        </div>

        <Card
          v-else-if="surpriseBaskets.length === 0"
          :no-padding="true"
          class="flex flex-col items-center gap-3 px-8 py-16 text-center"
        >
          <div class="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100">
            <Package class="h-10 w-10 text-neutral-400" />
          </div>
          <h2 class="text-responsive-xl font-semibold text-neutral-800">Aucun panier ne correspond à vos filtres</h2>
          <p class="mt-2 text-neutral-500">
            Ajustez vos critères pour découvrir d'autres paniers surprise disponibles.
          </p>
          <Button
            v-if="activeFiltersCount"
            type="button"
            class="mt-6"
            @click="resetFilters"
          >
            Réinitialiser les filtres
          </Button>
        </Card>

        <div
          v-else
          class="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3"
        >
          <SurpriseBasketCard
            v-for="basket in surpriseBaskets"
            :key="basket.id"
            :basket="basket"
            @view="goToBasketDetail"
            @reserve="goToBasketDetail"
          />
        </div>

        <Card
          v-if="pagination.lastPage > 1"
          :no-padding="true"
          class="flex items-center justify-between gap-4 rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-responsive-sm text-neutral-600"
        >
          <Button
            type="button"
            variant="ghost"
            size="sm"
            :left-icon="ChevronLeft"
            :disabled="currentPage === 1"
            @click="currentPage = Math.max(1, currentPage - 1)"
          >
            Précédent
          </Button>
          <p>Page {{ currentPage }} sur {{ pagination.lastPage }}</p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            :right-icon="ChevronRight"
            :disabled="currentPage >= pagination.lastPage"
            @click="currentPage = Math.min(pagination.lastPage, currentPage + 1)"
          >
            Suivant
          </Button>
        </Card>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Filter, Package, ChevronLeft, ChevronRight } from 'lucide-vue-next'
import SurpriseBasketCard from '@/components/product/SurpriseBasketCard.vue'
import SurpriseBasketFilters, { type SurpriseBasketFilterModel } from '@/components/product/SurpriseBasketFilters.vue'
import { useSurpriseBaskets } from '@/composables/useSurpriseBaskets'
import type { SurpriseBasket } from '@/services/surpriseBasketService'
import Button from '@/components/ui/2025/Button.vue'
import Badge from '@/components/ui/2025/Badge.vue'
import Card from '@/components/ui/2025/Card.vue'

const router = useRouter()
const { surpriseBaskets, pagination, loading, loadSurpriseBaskets } = useSurpriseBaskets()

const filters = ref<SurpriseBasketFilterModel>({ categoryId: null, minPrice: null, maxPrice: null })
const showFilters = ref(true)
const currentPage = ref(1)
const perPage = 12

const surpriseBasketsState = computed(() => surpriseBaskets.value as SurpriseBasket[])

const availableCategories = computed(() => {
  const categoriesMap = new Map<number, string>()
  surpriseBasketsState.value.forEach(basket => {
    if (basket.category) {
      categoriesMap.set(basket.category.id, basket.category.name)
    }
  })
  return Array.from(categoriesMap.entries()).map(([id, name]) => ({ id, name }))
})

const totalResults = computed(() => pagination.value.total)

const activeFiltersCount = computed(() => {
  let count = 0
  if (filters.value.categoryId) count += 1
  if (filters.value.minPrice) count += 1
  if (filters.value.maxPrice) count += 1
  return count
})

const resetFilters = () => {
  filters.value = { categoryId: null, minPrice: null, maxPrice: null }
}

const handleFiltersReset = () => {
  currentPage.value = 1
}

const goToBasketDetail = (basket: SurpriseBasket) => {
  router.push({ name: 'surprise-basket-reserve', params: { id: basket.id } })
}

const fetchBaskets = async () => {
  await loadSurpriseBaskets({
    category_id: filters.value.categoryId ?? undefined,
    min_price: filters.value.minPrice ?? undefined,
    max_price: filters.value.maxPrice ?? undefined,
    page: currentPage.value,
    per_page: perPage
  })
}

watch(filters, () => {
  currentPage.value = 1
  fetchBaskets()
}, { deep: true })

watch(currentPage, () => {
  fetchBaskets()
})

onMounted(() => {
  fetchBaskets()
})
</script>
