<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
    <div class="border-b border-gray-200/70 bg-white/80 backdrop-blur">
      <div class="container px-3 sm:px-4 lg:px-6 mx-auto px-4 py-12">
        <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p class="inline-flex items-center gap-2 rounded-full bg-blue-100/70 px-3 py-3 text-sm font-medium text-blue-900">
              <Heart class="h-4 w-4" />
              Mes coups de cœur AntiGaspi
            </p>
            <h1 class="mt-3 text-3xl font-semibold tracking-tight text-gray-900">Vos commerçants & paniers favoris</h1>
            <p class="mt-2 max-w-full sm:max-w-80 text-gray-700">
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
              class="text-gray-500"
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
        <div v-if="loading && !hasFavorites" class="rounded border border-gray-200 bg-white/80 p-6 text-center text-gray-600">
          Chargement de vos favoris...
        </div>

        <div v-if="!hasFavorites" class="rounded border border-dashed border-gray-300 bg-white/70 p-6 sm:p-12 lg:p-12 text-left sm:text-center shadow-sm">
          <Heart class="mx-auto h-6 w-6 text-gray-500" />
          <h2 class="mt-4 text-xl font-semibold text-gray-800">Ajoutez vos premiers favoris</h2>
          <p class="mt-2 text-gray-500">
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
                  <p class="text-xs font-medium uppercase tracking-wide text-blue-600">{{ favorite.type === 'merchant' ? 'Commerçant' : 'Panier' }}</p>
                  <h3 class="text-lg font-semibold text-gray-900">{{ favorite.name }}</h3>
                  <p v-if="favorite.description" class="text-sm text-gray-500">{{ favorite.description }}</p>
                </div>
                <button
                  type="button"
                  class="rounded-full bg-blue-50 p-2 text-blue-600 transition hover:bg-blue-100"
                  aria-label="Retirer des favoris"
                  @click="removeFavorite(favorite)"
                >
                  <HeartOff class="h-4 w-4" />
                </button>
              </div>
            </template>

            <div class="space-y-2 text-sm text-gray-700">
              <p v-if="favorite.type === 'merchant' && favorite.merchant?.city" class="flex items-center gap-2">
                <MapPin class="h-4 w-4 text-blue-500" />
                {{ favorite.merchant.city }}
              </p>
              <p class="text-xs text-gray-400">Ajouté le {{ formatDate(favorite.addedAt) }}</p>
            </div>

            <template #footer>
              <div class="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  class="text-gray-500"
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
            <h2 class="text-xl font-semibold text-gray-900">Notifications prioritaires</h2>
          </template>
          <p class="text-sm text-gray-700">
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

        <Card class="bg-blue-500/95 text-white">
          <template #header>
            <h2 class="text-lg font-semibold">Astuce AntiGaspi</h2>
          </template>
          <p class="text-sm text-blue-50">
            Combinez vos favoris avec le portefeuille AntiGaspi pour réserver encore plus rapidement lors des publications flash.
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
import Button from '@/components/ui/Button.vue'
import Card from '@/components/ui/Card.vue'
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
