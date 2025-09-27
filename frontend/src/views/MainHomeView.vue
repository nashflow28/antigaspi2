<template>
  <div class="min-h-screen bg-neutral-50">
    <header class="sticky top-0 z-40 border-b border-neutral-200/70 bg-surface-light/80 backdrop-blur-xl">
      <div class="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <div class="flex items-center gap-4">
          <div class="flex h-14 w-14 items-center justify-center rounded-3xl bg-nav-gradient text-white shadow-card">
            <span class="text-h2 font-semibold">🌱</span>
          </div>
          <div class="space-y-2">
            <p class="text-small font-medium text-muted">Bienvenue</p>
            <h1 class="text-h2 font-semibold text-heading">Antigaspi</h1>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            class="text-muted hover:text-primary"
            aria-label="Rechercher"
            @click="handleSearch"
          >
            <span aria-hidden="true">🔍</span>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            class="relative text-muted hover:text-primary"
            aria-label="Notifications"
            @click="handleNotifications"
          >
            <span aria-hidden="true">🔔</span>
            <span
              v-if="notificationsCount > 0"
              class="relative sm:absolute -right-1 -top-1 flex h-5 min-w-[18px] items-center justify-center rounded-full bg-accent-red px-1 text-caption font-semibold text-white shadow-card"
            >
              {{ notificationsCount }}
            </span>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            class="relative text-muted hover:text-primary"
            aria-label="Panier"
            @click="handleCart"
          >
            <span aria-hidden="true">🛒</span>
            <span
              v-if="cartItems > 0"
              class="relative sm:absolute -right-1 -top-1 flex h-5 min-w-[18px] items-center justify-center rounded-full bg-primary-500 px-1 text-caption font-semibold text-white shadow-card"
            >
              {{ cartItems }}
            </span>
          </Button>

          <Button
            variant="secondary"
            size="icon"
            class="text-primary-emphasis"
            aria-label="Profil"
            @click="handleProfile"
          >
            <span aria-hidden="true">👤</span>
          </Button>
        </div>
      </div>
    </header>

    <main class="space-y-spacing-22 pb-spacing-30 pt-spacing-22">
      <section class="relative overflow-hidden sm:block bg-nav-gradient text-white">
        <div class="mx-auto flex max-w-5xl flex-col gap-4 sm:gap-6 px-6 py-spacing-22 lg:flex-row lg:items-center lg:justify-between">
          <div class="space-y-4">
            <p class="text-small uppercase tracking-wide text-white/80">Luttons contre le gaspillage</p>
            <h2 class="text-display-sm font-semibold leading-relaxed">Découvrez les paniers solidaires près de chez vous</h2>
            <p class="max-w-full sm:max-w-xl text-body text-white/80">
              Parcourez une sélection de produits sauvés des invendus et soutenez les commerçants locaux.
            </p>
            <div class="flex flex-wrap items-center gap-3">
              <span class="rounded-full border border-white/30 bg-white/10 px-4 py-3 text-small font-medium shadow-card">🇹🇬 Togo</span>
              <span class="rounded-full border border-white/30 bg-white/10 px-4 py-3 text-small font-medium shadow-card">
                {{ totalProducts }} produits disponibles
              </span>
              <Button
                variant="secondary"
                size="sm"
                class="bg-white/90 text-primary-emphasis hover:bg-white"
                @click="refreshProducts"
              >
                Explorer les nouveautés
              </Button>
            </div>
          </div>
          <Card variant="glass" padding="lg" class="w-full max-w-sm text-left text-white">
            <template #header>
              <p class="text-small uppercase tracking-wide text-white/70">Votre impact</p>
              <h3 class="text-h2 font-semibold">Vous avez déjà sauvé 24 kg</h3>
            </template>
            <div class="space-y-3 text-white/90">
              <p>Continuez à réserver les paniers pour soutenir les producteurs et réduire le gaspillage alimentaire.</p>
              <Button variant="promo" class="w-full" @click="handleProfile">Voir mon profil</Button>
            </div>
          </Card>
        </div>
      </section>

      <section class="mx-auto max-w-5xl px-6">
        <Card padding="lg" class="space-y-8">
          <template #header>
            <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <h3 class="text-h3 font-semibold text-heading">Catégories populaires</h3>
              <Button
                variant="ghost"
                size="sm"
                class="text-primary"
                @click="viewAllCategories"
              >
                Voir toutes les catégories
              </Button>
            </div>
          </template>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 md:grid-cols-4">
            <Card
              v-for="category in categories"
              :key="category.id"
              padding="sm"
              hover="subtle"
              class="flex cursor-pointer flex-col items-center gap-3 text-left sm:text-center"
              @click="selectCategory(category)"
            >
              <span class="text-display-sm" aria-hidden="true">{{ category.emoji }}</span>
              <p class="text-small font-medium text-body-emphasis">{{ category.name }}</p>
            </Card>
          </div>
        </Card>
      </section>

      <section class="mx-auto max-w-5xl px-6">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h3 class="text-h3 font-semibold text-heading">Produits disponibles</h3>
          <Button
            variant="ghost"
            size="sm"
            class="text-primary"
            @click="refreshProducts"
          >
            Actualiser
          </Button>
        </div>

        <div v-if="loading" class="mt-8 grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-3 xl:grid-cols-4">
          <Card
            v-for="index in 6"
            :key="index"
            padding="sm"
            class="space-y-4"
          >
            <Skeleton class="aspect-square w-full" />
            <div class="space-y-2">
              <Skeleton class="h-5 w-3/4" />
              <Skeleton class="h-3 w-1/2" />
              <Skeleton class="h-5 w-full" />
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
          class="mt-8 grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-3 xl:grid-cols-4"
        >
          <Card
            v-for="product in displayProducts"
            :key="product.id"
            padding="sm"
            hover="glow"
            class="flex cursor-pointer flex-col"
            @click="viewProduct(product)"
          >
            <div class="flex aspect-square items-center justify-center rounded-2xl bg-neutral-100 text-display-sm">
              <span aria-hidden="true">{{ product.emoji }}</span>
            </div>
            <div class="mt-4 space-y-2">
              <h4 class="text-h4 font-semibold text-heading">{{ product.name }}</h4>
              <p class="text-small text-muted">{{ product.merchant }}</p>
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2 text-primary">
                  <span class="text-h4 font-semibold">{{ product.price }} XOF</span>
                  <span v-if="product.originalPrice" class="text-caption text-muted line-through">{{ product.originalPrice }} XOF</span>
                </div>
                <span class="rounded-full bg-primary-100 px-4 py-3 text-caption font-medium text-primary-emphasis">-{{ product.discount }}%</span>
              </div>
            </div>
          </Card>
        </div>

        <div v-if="hasProducts" class="mt-10 flex justify-center">
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

    <nav class="fixed bottom-0 left-0 right-0 border-t border-neutral-200/70 bg-surface-light/90 backdrop-blur-lg">
      <div class="mx-auto flex max-w-5xl items-center justify-around px-6 py-4">
        <Button variant="ghost" class="flex h-full flex-col items-center gap-2 text-primary" @click="goToHome">
          <span aria-hidden="true" class="text-responsive-lg">🏠</span>
          <span class="text-caption font-medium">Accueil</span>
        </Button>
        <Button variant="ghost" class="flex h-full flex-col items-center gap-2 text-muted" @click="goToDiscover">
          <span aria-hidden="true" class="text-responsive-lg">🔍</span>
          <span class="text-caption">Découvrir</span>
        </Button>
        <Button variant="ghost" class="flex h-full flex-col items-center gap-2 text-muted" @click="goToFavorites">
          <span aria-hidden="true" class="text-responsive-lg">❤️</span>
          <span class="text-caption">Favoris</span>
        </Button>
        <Button variant="ghost" class="flex h-full flex-col items-center gap-2 text-muted" @click="goToProfile">
          <span aria-hidden="true" class="text-responsive-lg">👤</span>
          <span class="text-caption">Profil</span>
        </Button>
      </div>
    </nav>

    <Toast
      :is-open="toast.open"
      :tone="toast.tone"
      :title="toast.title"
      :description="toast.description"
      :on-close="closeToast"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import Button from '@/components/ui/Button.vue'
import Card from '@/components/ui/Card.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import Skeleton from '@/components/ui/Skeleton.vue'
import Toast from '@/components/ui/Toast.vue'
import { useCartStore } from '@/stores/cart'

const router = useRouter()
const cartStore = useCartStore()

const loading = ref(false)
const notificationsCount = ref(3)
const totalProducts = ref(156)
const toast = reactive({
  open: false,
  tone: 'success' as const,
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
