<template>
  <div
    id="app"
    class="min-h-screen bg-surface-light text-neutral-900 antialiased transition-colors duration-300 dark:bg-surface-dark dark:text-neutral-50"
  >
    <Navigation
      :brand="navigationBrand"
      :items="navigationItems"
      :show-theme-toggle="true"
      @item-click="handleNavItemClick"
      @toggle="handleNavigationToggle"
    >
      <template #actions>
        <div class="flex items-center gap-2">
          <Button
            variant="ghost"
            class="relative hidden sm:block md:inline-flex"
            @click="handleCartClick"
          >
            <span>Mon panier</span>
            <Badge
              v-if="cartItemsCount > 0"
              variant="primary"
              size="xs"
              class="relative sm:absolute -top-2 -right-2 min-w-4 justify-center px-2 py-0.5 text-[10px]"
            >
              {{ cartItemsCount > 99 ? '99+' : cartItemsCount }}
            </Badge>
          </Button>

          <template v-if="isAuthenticated">
            <Button
              variant="ghost"
              @click="goToDashboard"
            >
              Mon espace
            </Button>
            <Button
              variant="primary"
              @click="handleLogout"
            >
              Se déconnecter
            </Button>
          </template>
          <template v-else>
            <Button
              variant="ghost"
              @click="handleLoginClick"
            >
              Se connecter
            </Button>
            <Button
              variant="primary"
              @click="handleRegisterClick"
            >
              Créer un compte
            </Button>
          </template>
        </div>
      </template>

      <template #mobile-actions>
        <div class="flex flex-col gap-2">
          <Button
            variant="ghost"
            class="relative justify-start sm:justify-between"
            @click="handleCartClick"
          >
            <span>Mon panier</span>
            <Badge
              v-if="cartItemsCount > 0"
              variant="primary"
              size="sm"
              class="flex min-w-[1.5rem] justify-center px-3"
            >
              {{ cartItemsCount > 99 ? '99+' : cartItemsCount }}
            </Badge>
          </Button>

          <template v-if="isAuthenticated">
            <Button
              variant="ghost"
              @click="goToDashboard"
            >
              Mon espace
            </Button>
            <Button
              variant="primary"
              @click="handleLogout"
            >
              Se déconnecter
            </Button>
          </template>
          <template v-else>
            <Button
              variant="ghost"
              @click="handleLoginClick"
            >
              Se connecter
            </Button>
            <Button
              variant="primary"
              @click="handleRegisterClick"
            >
              Créer un compte
            </Button>
          </template>
        </div>
      </template>
    </Navigation>

    <main class="pt-24 sm:pt-32">
      <router-view v-slot="{ Component: CurrentComponent }">
        <PageTransition>
          <component :is="CurrentComponent" />
        </PageTransition>
      </router-view>
    </main>

    <Footer class="border-t border-primary-500/10 bg-primary-800 text-neutral-50" />

    <NotificationContainer />
    <NotificationSystem />

    <!-- TEMPORARILY DISABLED - Network Status -->
    <!-- <NetworkStatus /> -->

    <!-- TEMPORARILY DISABLED - PWA Prompts -->
    <!-- <PWAPrompt /> -->

    <!-- TEMPORARILY DISABLED - Dev Tools -->
    <!-- <OnboardingReset /> -->
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, type Component } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  HomeIcon,
  MapIcon,
  Squares2X2Icon,
  ChatBubbleLeftRightIcon,
  ChartBarIcon
} from '@heroicons/vue/24/outline'
import { useAuthStore } from '@/stores/auth'
import { useProductsStore } from '@/stores/products'
import { useMerchantsStore } from '@/stores/merchants'
import { useCartStore } from '@/stores/cart'
import Navigation from '@/components/ui/Navigation.vue'
import Footer from '@/components/ui/Footer.vue'
import PageTransition from '@/components/ui/PageTransition.vue'
import NotificationContainer from '@/components/ui/NotificationContainer.vue'
import NotificationSystem from '@/components/ui/NotificationSystem.vue'
import Button from '@/components/ui/Button.vue'
import Badge from '@/components/ui/2025/Badge.vue'

const authStore = useAuthStore()
const productsStore = useProductsStore()
const merchantsStore = useMerchantsStore()
const cartStore = useCartStore()
const route = useRoute()
const router = useRouter()

interface NavigationEntry {
  label: string
  href: string
  icon?: Component
  routes: string[]
}

const navigationBrand = computed(() => ({
  name: 'Antigaspi',
  href: '/'
}))

const dashboardTarget = computed(() => {
  const role = authStore.user?.role
  switch (role) {
    case 'admin':
      return '/admin/dashboard'
    case 'merchant':
      return '/merchant/dashboard'
    case 'consumer':
    default:
      return '/dashboard'
  }
})

const dashboardRouteNames = computed(() => {
  const role = authStore.user?.role
  if (role === 'admin') {
    return ['admin-dashboard', 'admin-users', 'admin-merchants', 'admin-categories', 'admin-reviews']
  }
  if (role === 'merchant') {
    return [
      'merchant-dashboard',
      'merchant-products',
      'merchant-product-create',
      'merchant-product-edit',
      'merchant-reservations',
      'merchant-reviews-dashboard',
      'merchant-reviews',
      'merchant-surprise-baskets',
      'merchant-loyalty'
    ]
  }
  return ['dashboard', 'wallet', 'reservations', 'reservation-detail', 'consumer-loyalty']
})

const baseNavigation = computed<NavigationEntry[]>(() => {
  const entries: NavigationEntry[] = [
    { label: 'Accueil', href: '/', icon: HomeIcon, routes: ['home'] },
    {
      label: 'Découvrir',
      href: '/discover',
      icon: MapIcon,
      routes: ['discover', 'surprise-baskets', 'surprise-basket-reserve', 'merchant-detail', 'merchants-map']
    },
    {
      label: 'Produits',
      href: '/products',
      icon: Squares2X2Icon,
      routes: ['products', 'product-detail', 'product-reserve']
    },
    {
      label: 'Avis',
      href: '/reviews',
      icon: ChatBubbleLeftRightIcon,
      routes: ['reviews', 'public-reviews']
    }
  ]

  if (isAuthenticated.value) {
    entries.push({
      label: 'Tableau de bord',
      href: dashboardTarget.value,
      icon: ChartBarIcon,
      routes: dashboardRouteNames.value
    })
  }

  return entries
})

const navigationItems = computed(() => {
  const currentName = route.name?.toString()

  return baseNavigation.value.map((item) => ({
    label: item.label,
    href: item.href,
    icon: item.icon,
    active: currentName ? item.routes.includes(currentName) : false
  }))
})

const cartItemsCount = computed(() => cartStore.itemsCount)
const isAuthenticated = computed(() => authStore.isAuthenticated)

const handleNavItemClick = (item: { href: string }) => {
  if (item.href) {
    router.push(item.href)
  }
}

const handleNavigationToggle = () => {
  /* emitted for analytics or future integrations */
}

const handleCartClick = () => {
  router.push('/cart')
}

const handleLoginClick = () => {
  router.push('/login')
}

const handleRegisterClick = () => {
  router.push('/register')
}

const goToDashboard = () => {
  router.push(dashboardTarget.value)
}

const handleLogout = async () => {
  await authStore.logout()
  router.push('/login')
}

onMounted(async () => {
  try {
    await authStore.initAuth()
    cartStore.hydrateFromStorage()

    await Promise.allSettled([
      productsStore.fetchProducts(),
      merchantsStore.fetchMerchants()
    ])

    // Stores initialized successfully
  } catch {
    // Error initializing stores
  }
})
</script>
