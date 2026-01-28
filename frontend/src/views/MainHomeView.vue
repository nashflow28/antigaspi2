<template>
  <div class="min-h-screen bg-surface-light dark:bg-surface-dark">
    <header class="sticky top-0 z-40 border-b border-neutral-200/70 dark:border-neutral-700/70 bg-surface-light/80 dark:bg-surface-dark/80 backdrop-blur-xl">
      <div class="mx-auto flex max-w-5xl items-center justify-between px-4 py-6">
        <div class="flex items-center gap-3">
          <div class="flex h-14 w-14 items-center justify-center rounded bg-gradient-to-r from-primary-600 to-primary-700 text-surface-light shadow-lg">
            <span class="text-h2 font-semibold">🌱</span>
          </div>
          <div class="space-y-4">
            <p class="text-sm font-medium text-neutral-500 dark:text-neutral-400">Bienvenue</p>
            <h1 class="text-h2 font-semibold text-neutral-900 dark:text-white">GÊLADAL</h1>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            class="text-neutral-500 dark:text-neutral-400 hover:text-primary-600"
            aria-label="Rechercher"
            @click="handleSearch"
          >
            <span aria-hidden="true">🔍</span>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            class="relative text-neutral-500 hover:text-primary-600"
            aria-label="Notifications"
            @click="handleNotifications"
          >
            <span aria-hidden="true">🔔</span>
            <span
              v-if="notificationsCount > 0"
              class="relative sm:absolute -right-1 -top-1 flex h-4 min-w-[18px] items-center justify-center rounded-full bg-accent-red px-1 text-xs font-semibold text-surface-light shadow-lg"
            >
              {{ notificationsCount }}
            </span>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            class="relative text-neutral-500 hover:text-primary-600"
            aria-label="Panier"
            @click="handleCart"
          >
            <span aria-hidden="true">🛒</span>
            <span
              v-if="cartItems > 0"
              class="relative sm:absolute -right-1 -top-1 flex h-4 min-w-[18px] items-center justify-center rounded-full bg-primary-500 px-1 text-xs font-semibold text-surface-light shadow-lg"
            >
              {{ cartItems }}
            </span>
          </Button>

          <Button
            variant="secondary"
            size="icon"
            class="text-primary-900"
            aria-label="Profil"
            @click="handleProfile"
          >
            <span aria-hidden="true">👤</span>
          </Button>
        </div>
      </div>
    </header>

    <main class="space-y-20 pb-spacing-30 pt-spacing-22">
      <section class="relative overflow-hidden sm:block bg-gradient-to-r from-primary-600 to-primary-700 text-surface-light">
        <div class="mx-auto flex max-w-5xl flex-col gap-3 sm:gap-6 px-4 py-20 lg:flex-row lg:items-center lg:justify-between">
          <div class="space-y-4">
            <p class="text-sm uppercase tracking-wide text-surface-light/80">Luttons contre le gaspillage</p>
            <h2 class="text-3xl font-semibold leading-relaxed">Découvrez les paniers solidaires près de chez vous</h2>
            <p class="max-w-xl text-surface-light/80">
              Parcourez une sélection de produits sauvés des invendus et soutenez les commerçants locaux.
            </p>
            <div class="flex flex-wrap items-center gap-3">
              <span class="rounded-full border border-surface-light/30 bg-surface-light/10 px-3 py-3 text-sm font-medium shadow-lg">🇹🇬 Togo</span>
              <span class="rounded-full border border-surface-light/30 bg-surface-light/10 px-3 py-3 text-sm font-medium shadow-lg">
                {{ totalProducts }} produits disponibles
              </span>
              <Button
                variant="secondary"
                size="sm"
                class="bg-surface-light/90 text-primary-900 hover:bg-surface-light"
                @click="refreshProducts"
              >
                Explorer les nouveautés
              </Button>
            </div>
          </div>
          <Card variant="glass" padding="lg" class="w-full max-w-sm text-left text-surface-light">
            <template #header>
              <p class="text-sm uppercase tracking-wide text-surface-light/70">Votre impact</p>
              <h3 class="text-h2 font-semibold">Vous avez déjà sauvé 24 kg</h3>
            </template>
            <div class="space-y-2 text-surface-light/90">
              <p>Continuez à réserver les paniers pour soutenir les producteurs et réduire le gaspillage alimentaire.</p>
              <Button variant="promo" class="w-full" @click="handleProfile">Voir mon profil</Button>
            </div>
          </Card>
        </div>
      </section>

      <section class="mx-auto max-w-5xl px-4">
        <Card padding="lg" class="space-y-8">
          <template #header>
            <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h3 class="text-lg font-semibold text-neutral-900 dark:text-white">Catégories populaires</h3>
              <Button
                variant="ghost"
                size="sm"
                class="text-primary-600"
                @click="viewAllCategories"
              >
                Voir toutes les catégories
              </Button>
            </div>
          </template>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 md:grid-cols-4">
            <Card
              v-for="category in categories"
              :key="category.id"
              padding="sm"
              hover="subtle"
              class="flex cursor-pointer flex-col items-center gap-3 text-left sm:text-center"
              @click="selectCategory(category)"
            >
              <span class="text-3xl" aria-hidden="true">{{ category.emoji }}</span>
              <p class="text-sm font-medium text-neutral-800 dark:text-neutral-100">{{ category.name }}</p>
            </Card>
          </div>
        </Card>
      </section>

      <section class="mx-auto max-w-5xl px-4">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 class="text-lg font-semibold text-neutral-900 dark:text-white">Produits disponibles</h3>
          <Button
            variant="ghost"
            size="sm"
            class="text-primary-600"
            @click="refreshProducts"
          >
            Actualiser
          </Button>
        </div>

        <div v-if="loading" class="mt-8 grid grid-cols-1 gap-3 sm:gap-6 md:grid-cols-3 xl:grid-cols-4">
          <Card
            v-for="index in 6"
            :key="index"
            padding="sm"
            class="space-y-4"
          >
            <Skeleton class="aspect-square w-full" />
            <div class="space-y-4">
              <Skeleton class="h-4 w-3/4" />
              <Skeleton class="h-3 w-1/2" />
              <Skeleton class="h-4 w-full" />
            </div>
          </Card>
        </div>

        <EmptyState
          v-else-if="!hasProducts"
          class="mt-8"
          title="Pas encore de produits"
          description="Revenez un peu plus tard ou découvrez d'autres commerçants à proximité."
          action-label="Découvrir les commerçants"
          icon="🛍️"
          @action="goToDiscover"
        />

        <div
          v-else
          data-test="main-home-products"
          class="mt-8 grid grid-cols-1 gap-3 sm:gap-6 md:grid-cols-3 xl:grid-cols-4"
        >
          <Card
            v-for="product in displayProducts"
            :key="product.id"
            padding="sm"
            hover="glow"
            class="flex cursor-pointer flex-col"
            @click="viewProduct(product)"
          >
            <div class="flex aspect-square items-center justify-center rounded bg-neutral-100 dark:bg-neutral-800 text-3xl">
              <span aria-hidden="true">{{ product.emoji }}</span>
            </div>
            <div class="mt-4 space-y-4">
              <h4 class="text-h4 font-semibold text-neutral-900 dark:text-white">{{ product.name }}</h4>
              <p class="text-sm text-neutral-500 dark:text-neutral-400">{{ product.merchant }}</p>
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2 text-primary-600">
                  <span class="text-h4 font-semibold">{{ product.price }} XOF</span>
                  <span v-if="product.originalPrice" class="text-xs text-neutral-500 line-through">{{ product.originalPrice }} XOF</span>
                </div>
                <span class="rounded-full bg-primary-100 px-3 py-3 text-xs font-medium text-primary-900">-{{ product.discount }}%</span>
              </div>
            </div>
          </Card>
        </div>

        <div v-if="hasProducts" class="spacing-xs0 flex justify-center">
          <Button
            variant="primary"
            size="lg"
            class="px-10"
            @click="loadMore"
          >
            Voir plus de produits
          </Button>
        </div>
      </section>
    </main>

    <nav class="fixed bottom-0 left-0 right-0 border-t border-neutral-200/70 dark:border-neutral-700/70 bg-surface-light/90 dark:bg-surface-dark/90 backdrop-blur-lg">
      <div class="mx-auto flex max-w-5xl items-center justify-around px-4 py-4">
        <Button variant="ghost" class="flex h-full flex-col items-center gap-2 text-primary-600" @click="goToHome">
          <span aria-hidden="true" class="text-lg">🏠</span>
          <span class="text-xs font-medium">Accueil</span>
        </Button>
        <Button variant="ghost" class="flex h-full flex-col items-center gap-2 text-neutral-500" @click="goToDiscover">
          <span aria-hidden="true" class="text-lg">🔍</span>
          <span class="text-xs">Découvrir</span>
        </Button>
        <Button variant="ghost" class="flex h-full flex-col items-center gap-2 text-neutral-500" @click="goToFavorites">
          <span aria-hidden="true" class="text-lg">❤️</span>
          <span class="text-xs">Favoris</span>
        </Button>
        <Button variant="ghost" class="flex h-full flex-col items-center gap-2 text-neutral-500" @click="goToProfile">
          <span aria-hidden="true" class="text-lg">👤</span>
          <span class="text-xs">Profil</span>
        </Button>
      </div>
    </nav>

    <Teleport to="body">
      <div v-if="toast.open" class="fixed top-4 right-4 z-[110]">
        <Alert
          :variant="toast.tone === 'warning' ? 'warning' : toast.tone === 'info' ? 'info' : 'success'"
          :title="toast.title"
          :description="toast.description"
          dismissible
          @dismiss="closeToast"
        />
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Button, Card, EmptyState, Alert, Skeleton } from '@/components/ui/2025'
import { useCartStore } from '@/stores/cart'

const router = useRouter()
const cartStore = useCartStore()

const loading = ref(false)
const notificationsCount = ref(3)
const totalProducts = ref(156)
const toast = reactive({
  open: false,
  tone: 'success' as 'success' | 'info' | 'warning',
  title: '',
  description: ''
})
let toastTimer: number | undefined

const cartItems = computed(() => Number(cartStore.itemsCount ?? 0))

const categories = ref([
  { id: 1, name: 'Boulangerie', emoji: '🥖' },
  { id: 2, name: 'Fruits', emoji: '🍎' },
  { id: 3, name: 'Légumes', emoji: '🥕' },
  { id: 4, name: 'Épicerie', emoji: '🛒' }
])

const displayProducts = ref([
  {
    id: 1,
    name: 'Pain artisanal',
    merchant: 'Boulangerie Martin',
    price: 2.5,
    originalPrice: 4,
    discount: 38,
    emoji: '🥖'
  },
  {
    id: 2,
    name: 'Bananes bio',
    merchant: 'Marché Central',
    price: 1.2,
    originalPrice: 2,
    discount: 40,
    emoji: '🍌'
  },
  {
    id: 3,
    name: 'Yaourts nature',
    merchant: 'Laiterie du Sud',
    price: 3.5,
    originalPrice: 5,
    discount: 30,
    emoji: '🥛'
  },
  {
    id: 4,
    name: 'Croissants',
    merchant: 'Café Central',
    price: 1.8,
    originalPrice: 3,
    discount: 40,
    emoji: '🥐'
  }
])

const hasProducts = computed(() => displayProducts.value.length > 0)

const openToast = (tone: 'success' | 'info' | 'warning', title: string, description: string) => {
  toast.open = true
  toast.tone = tone
  toast.title = title
  toast.description = description
  if (toastTimer) {
    window.clearTimeout(toastTimer)
  }
  toastTimer = window.setTimeout(() => {
    toast.open = false
  }, 2600)
}

const closeToast = () => {
  toast.open = false
  if (toastTimer) {
    window.clearTimeout(toastTimer)
    toastTimer = undefined
  }
}

const handleSearch = () => {
  openToast('info', 'Recherche', 'La fonctionnalité de recherche arrive très bientôt.')
}

const handleNotifications = () => {
  notificationsCount.value = 0
  openToast('success', 'Notifications', 'Toutes vos notifications sont à jour.')
}

const handleCart = () => {
  router.push('/cart')
}

const handleProfile = () => {
  router.push('/profile')
}

const selectCategory = (category: { id: number; name: string }) => {
  openToast('info', category.name, 'Les produits seront bientôt filtrés par catégorie.')
}

const viewAllCategories = () => {
  router.push('/discover')
}

const viewProduct = (product: { id: number; name: string }) => {
  router.push(`/products/${product.id}`)
}

const refreshProducts = () => {
  loading.value = true
  window.setTimeout(() => {
    loading.value = false
    openToast('success', 'Liste mise à jour', 'Les derniers paniers disponibles ont été chargés.')
  }, 900)
}

const loadMore = () => {
  openToast('info', 'Encore un peu de patience', 'De nouvelles offres arrivent très bientôt dans votre zone.')
}

const goToHome = () => router.push('/')
const goToDiscover = () => router.push('/discover')
const goToFavorites = () => router.push('/favorites')
const goToProfile = () => router.push('/profile')

onMounted(() => {
  cartStore.hydrateFromStorage()
})
</script>
