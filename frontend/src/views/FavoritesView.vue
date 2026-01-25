<template>
  <div class="min-h-screen bg-gradient-to-br from-surface-light via-neutral-50 to-neutral-100 dark:from-surface-dark dark:via-neutral-900 dark:to-surface-darker">
    <div class="border-b border-neutral-200 dark:border-neutral-700/70 bg-white/80 backdrop-blur">
      <div class="container px-3 sm:px-4 lg:px-6 mx-auto px-4 py-12">
        <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p class="inline-flex items-center gap-2 rounded-full bg-primary-100/70 dark:bg-primary-500/20 px-3 py-3 text-sm font-medium text-primary-900 dark:text-primary-100">
              <Heart class="h-4 w-4" />
              Mes coups de cœur GÊLADAL
            </p>
            <h1 class="mt-3 text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">Vos commerçants & paniers favoris</h1>
            <p class="mt-2 max-w-full sm:max-w-80 text-neutral-700 dark:text-neutral-300">
              Organisez vos découvertes, activez les notifications prioritaires et préparez vos prochaines réservations en un coup d'œil.
            </p>
          </div>
          <div class="flex flex-wrap gap-2">
            <Button
              v-for="option in filters"
              :key="option.value"
              :variant="filter === option.value ? 'primary' : 'ghost'"
              size="sm"
              @click="filter = option.value"
            >
              {{ option.label }}
            </Button>
            <Button
              v-if="hasFavorites"
              variant="ghost"
              size="sm"
              class="text-neutral-500 dark:text-neutral-400"
              :disabled="loading"
              @click="clearAll"
            >
              Effacer tout
            </Button>
          </div>
        </div>
      </div>
    </div>

    <main class="container px-3 sm:px-4 lg:px-6 mx-auto grid gap-6 sm:gap-8 px-4 py-8 sm:py-12 lg:py-16 lg:grid-cols-[2fr_1fr]">
      <section>
        <div v-if="loading && !hasFavorites" class="rounded border border-neutral-200 dark:border-neutral-700 bg-white/80 p-6 text-center text-neutral-600 dark:text-neutral-400">
          Chargement de vos favoris...
        </div>

        <div v-if="!hasFavorites" class="rounded border border-dashed border-neutral-300 dark:border-neutral-600 bg-white/70 p-6 sm:p-12 lg:p-12 text-left sm:text-center shadow-sm">
          <Heart class="mx-auto h-6 w-6 text-neutral-500 dark:text-neutral-400" />
          <h2 class="mt-4 text-xl font-semibold text-neutral-800 dark:text-neutral-100">Ajoutez vos premiers favoris</h2>
          <p class="mt-2 text-neutral-500 dark:text-neutral-400">
            Depuis un panier ou un commerçant, cliquez sur l'icône cœur pour les retrouver ici et recevoir leurs alertes.
          </p>
          <div class="mt-6 flex justify-center gap-3">
            <Button @click="router.push({ name: 'discover' })">Découvrir des commerçants</Button>
            <Button variant="ghost" @click="router.push({ name: 'products' })">Explorer les paniers</Button>
          </div>
        </div>

        <div v-else class="grid gap-3 sm:gap-6 md:grid-cols-2 xl:grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <Card
            v-for="favorite in filteredFavorites"
            :key="`${favorite.type}-${favorite.id}`"
            class="bg-white/90"
          >
            <template #header>
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-xs font-medium uppercase tracking-wide text-primary-600 dark:text-primary-400">{{ favorite.type === 'merchant' ? 'Commerçant' : 'Panier' }}</p>
                  <h3 class="text-lg font-semibold text-neutral-900 dark:text-neutral-50">{{ favorite.name }}</h3>
                  <p v-if="favorite.description" class="text-sm text-neutral-500 dark:text-neutral-400">{{ favorite.description }}</p>
                </div>
                <button
                  type="button"
                  class="rounded-full bg-primary-50 dark:bg-primary-500/20 p-2 text-primary-600 dark:text-primary-400 transition hover:bg-primary-100 dark:hover:bg-primary-500/30"
                  aria-label="Retirer des favoris"
                  @click="removeFavorite(favorite)"
                >
                  <HeartOff class="h-4 w-4" />
                </button>
              </div>
            </template>

            <div class="space-y-2 text-sm text-neutral-700 dark:text-neutral-300">
              <p v-if="favorite.type === 'merchant' && favorite.merchant?.city" class="flex items-center gap-2">
                <MapPin class="h-4 w-4 text-primary-500" />
                {{ favorite.merchant.city }}
              </p>
              <p class="text-xs text-neutral-400">Ajouté le {{ formatDate(favorite.addedAt) }}</p>
            </div>

            <template #footer>
              <div class="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  class="text-neutral-500 dark:text-neutral-400"
                  @click="goToDetail(favorite)"
                >
                  Voir les détails
                </Button>
                <Button
                  v-if="favorite.type === 'product'"
                  size="sm"
                  @click="router.push({ name: 'product-detail', params: { id: favorite.id } })"
                >
                  Réserver à nouveau
                </Button>
                <Button
                  v-else
                  size="sm"
                  @click="router.push({ name: 'merchant-detail', params: { id: favorite.id } })"
                >
                  Voir le profil
                </Button>
              </div>
            </template>
          </Card>
        </div>
      </section>

      <aside class="space-y-6">
        <Card class="bg-white/90">
          <template #header>
            <h2 class="text-xl font-semibold text-neutral-900 dark:text-neutral-50">Notifications prioritaires</h2>
          </template>
          <p class="text-sm text-neutral-700 dark:text-neutral-300">
            Activez les alertes pour recevoir un message dès qu'un panier similaire est publié par vos commerçants favoris.
          </p>
          <Button
            variant="secondary"
            class="mt-4 w-full"
            @click="notify.success('Vous recevrez désormais les alertes pertinentes.', 'Favoris')"
          >
            Activer les alertes
          </Button>
        </Card>

        <Card class="bg-primary-500 dark:bg-primary-600 text-white">
          <template #header>
            <h2 class="text-lg font-semibold">Astuce GÊLADAL</h2>
          </template>
          <p class="text-sm text-primary-50">
            Combinez vos favoris avec le portefeuille GÊLADAL pour réserver encore plus rapidement lors des publications flash.
          </p>
          <Button
            variant="secondary"
            class="mt-4 w-full border-white/40 bg-white/20 text-white hover:bg-white/30"
            @click="router.push({ name: 'wallet' })"
          >
            Voir mon portefeuille
          </Button>
        </Card>
      </aside>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { Button, Card } from '@/components/ui/2025'
import { useFavoritesStore, type FavoriteItem } from '@/stores/favorites'
import { notify } from '@/composables/useNotifications'
import { Heart, HeartOff, MapPin } from 'lucide-vue-next'

const router = useRouter()
const favoritesStore = useFavoritesStore()
const { items, hasFavorites, loading } = storeToRefs(favoritesStore)
const filters = [
  { value: 'all' as const, label: 'Tous' },
  { value: 'merchant' as const, label: 'Commerçants' },
  { value: 'product' as const, label: 'Paniers' }
]
const filter = ref<'all' | 'merchant' | 'product'>('all')

const filteredFavorites = computed(() => {
  const list = items.value
  if (filter.value === 'all') {
    return list
  }
  return list.filter(item => item.type === filter.value)
})

const formatDate = (date: string) => {
  try {
    return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(date))
  } catch {
    return date
  }
}

const removeFavorite = async (favorite: FavoriteItem) => {
  await favoritesStore.removeFavorite(favorite.id, favorite.type)
}

const clearAll = async () => {
  await favoritesStore.clearFavorites()
}

const goToDetail = (favorite: FavoriteItem) => {
  if (favorite.type === 'merchant') {
    router.push({ name: 'merchant-detail', params: { id: favorite.id } })
  } else {
    router.push({ name: 'product-detail', params: { id: favorite.id } })
  }
}

onMounted(() => {
  void favoritesStore.initialize()
})
</script>
