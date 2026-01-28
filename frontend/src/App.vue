<template>
  <div
    id="app"
    class="min-h-screen bg-surface-light text-neutral-900 antialiased transition-colors duration-300 dark:bg-surface-dark dark:text-neutral-50"
  >
    <Navigation
      :brand="navigationBrand"
      :main-links="mainLinks"
      :secondary-links="secondaryLinks"
      :auth-cta="authCta"
      @link-click="handleLinkClick"
      @cta-click="handleCtaClick"
    >
      <template #utilities>
        <button
          type="button"
          class="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/50 bg-white/70 text-neutral-700 shadow-sm transition-all duration-300 focus-2025 hover:-translate-y-0.5 hover:bg-white dark:border-dark-600/60 dark:bg-dark-800/80 dark:text-dark-100"
          data-testid="cart-button"
          aria-label="Mon panier"
          @click="handleCartClick"
        >
          <ShoppingCartIcon class="h-5 w-5" />
          <span
            v-if="cartItemsCount > 0"
            class="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary-500 px-1.5 text-xs font-bold text-white"
            data-testid="cart-count"
          >
            {{ cartItemsCount > 99 ? '99+' : cartItemsCount }}
          </span>
        </button>
      </template>

      <template #mobile-footer>
        <div class="flex flex-col gap-2">
          <button
            type="button"
            class="flex items-center justify-between rounded-2xl border border-white/60 bg-white/60 px-4 py-3 text-sm font-medium text-neutral-800 transition-all duration-300 focus-2025 hover:bg-white dark:border-dark-600/60 dark:bg-dark-800/70 dark:text-dark-50"
            @click="handleCartClick"
          >
            <div class="flex items-center gap-3">
              <ShoppingCartIcon class="h-4 w-4 text-primary-500" />
              <span>Mon panier</span>
            </div>
            <span
              v-if="cartItemsCount > 0"
              class="rounded-full bg-primary-500/10 px-2 py-0.5 text-xs font-semibold text-primary-600"
            >
              {{ cartItemsCount > 99 ? '99+' : cartItemsCount }}
            </span>
          </button>
        </div>
      </template>
    </Navigation>

    <main id="main-content" class="pt-20 sm:pt-24">
      <router-view v-slot="{ Component: CurrentComponent }">
        <PageTransition>
          <component :is="CurrentComponent" />
        </PageTransition>
      </router-view>
    </main>

    <Footer
      :brand="footerBrand"
      :quick-links="footerLinks"
      :networks="socialNetworks"
    />

    <NotificationContainer />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  HomeIcon,
  MapIcon,
  Squares2X2Icon,
  ChatBubbleLeftRightIcon,
  ChartBarIcon,
  ShoppingCartIcon,
  UserCircleIcon,
  ArrowRightStartOnRectangleIcon
} from '@heroicons/vue/24/outline'
import { useAuthStore } from '@/stores/auth'
import { useProductsStore } from '@/stores/products'
import { useMerchantsStore } from '@/stores/merchants'
import { useCartStore } from '@/stores/cart'
import {
  Navigation,
  Footer,
  PageTransition,
  NotificationContainer,
  type NavigationLink,
  type NavigationCta,
  type FooterLink,
  type SocialNetwork
} from '@/components/ui/2025'

const authStore = useAuthStore()
const productsStore = useProductsStore()
const merchantsStore = useMerchantsStore()
const cartStore = useCartStore()
const route = useRoute()
const router = useRouter()

const navigationBrand = computed(() => ({
  name: 'GELADAL',
  to: '/',
  tagline: 'Anti-gaspillage'
}))

const footerBrand = computed(() => ({
  name: 'GELADAL',
  to: '/',
  tagline: 'Ton panier n\'attend que toi'
}))

const dashboardTarget = computed(() => {
  const role = authStore.user?.role
  switch (role) {
    case 'admin':
      return '/admin/dashboard'
    case 'merchant':
      return '/merchant/dashboard'
    case 'driver':
      return '/driver/dashboard'
    case 'consumer':
    default:
      return '/dashboard'
  }
})

const dashboardRouteNames = computed(() => {
  const role = authStore.user?.role
  if (role === 'admin') {
    return [
      'admin-dashboard',
      'admin-analytics',
      'admin-users',
      'admin-merchants',
      'admin-categories',
      'admin-reviews',
      'admin-products',
      'admin-payments',
      'admin-settings',
      'admin-audit'
    ]
  }
  if (role === 'merchant') {
    return [
      'merchant-dashboard',
      'merchant-analytics',
      'merchant-products',
      'merchant-product-create',
      'merchant-product-edit',
      'merchant-reservations',
      'merchant-payments',
      'merchant-reviews-dashboard',
      'merchant-reviews',
      'merchant-surprise-baskets',
      'merchant-loyalty',
      'merchant-profile'
    ]
  }
  if (role === 'driver') {
    return [
      'driver-dashboard',
      'driver-deliveries-available',
      'driver-deliveries-active',
      'driver-history',
      'driver-earnings',
      'driver-profile',
      'driver-profile-edit'
    ]
  }
  return [
    'dashboard',
    'discover',
    'favorites',
    'wallet',
    'wallet-topup',
    'reservations',
    'reservation-detail',
    'consumer-loyalty',
    'notifications',
    'notifications-inbox',
    'notifications-settings',
    'profile',
    'profile-edit',
    'delivery-history',
    'delivery-tracking',
    'delivery-request',
    'delivery-rating'
  ]
})

const mainLinks = computed<NavigationLink[]>(() => {
  const currentName = route.name?.toString()

  const links: NavigationLink[] = [
    {
      id: 'home',
      label: 'Accueil',
      to: '/',
      icon: HomeIcon,
      active: currentName === 'home'
    },
    {
      id: 'discover',
      label: 'Decouvrir',
      to: '/discover',
      icon: MapIcon,
      active: ['discover', 'surprise-baskets', 'surprise-basket-reserve', 'merchant-detail', 'merchants-map'].includes(currentName || '')
    },
    {
      id: 'products',
      label: 'Produits',
      to: '/products',
      icon: Squares2X2Icon,
      active: ['products', 'product-detail', 'product-reserve'].includes(currentName || '')
    },
    {
      id: 'reviews',
      label: 'Avis',
      to: '/reviews',
      icon: ChatBubbleLeftRightIcon,
      active: ['reviews', 'public-reviews'].includes(currentName || '')
    }
  ]

  if (isAuthenticated.value) {
    links.push({
      id: 'dashboard',
      label: 'Tableau de bord',
      to: dashboardTarget.value,
      icon: ChartBarIcon,
      active: dashboardRouteNames.value.includes(currentName || '')
    })
  }

  return links
})

const secondaryLinks = computed<NavigationLink[]>(() => {
  if (!isAuthenticated.value) {
    return []
  }

  return [
    {
      id: 'profile',
      label: 'Mon espace',
      to: dashboardTarget.value,
      icon: UserCircleIcon
    }
  ]
})

const authCta = computed<{ login?: NavigationLink; primary?: NavigationCta } | null>(() => {
  if (isAuthenticated.value) {
    return {
      primary: {
        label: 'Deconnexion',
        icon: ArrowRightStartOnRectangleIcon,
        variant: 'outline'
      }
    }
  }

  return {
    login: {
      id: 'login',
      label: 'Connexion',
      to: '/login'
    },
    primary: {
      label: 'Inscription',
      to: '/register',
      variant: 'primary'
    }
  }
})

const footerLinks = computed<FooterLink[]>(() => [
  { id: 'products', label: 'Produits', to: '/products' },
  { id: 'discover', label: 'Decouvrir', to: '/discover' },
  { id: 'reviews', label: 'Avis', to: '/reviews' }
])

const socialNetworks = computed<SocialNetwork[]>(() => [
  { name: 'Twitter', href: 'https://twitter.com' },
  { name: 'Facebook', href: 'https://facebook.com' },
  { name: 'Instagram', href: 'https://instagram.com' }
])

const cartItemsCount = computed(() => cartStore.itemsCount)
const isAuthenticated = computed(() => authStore.isAuthenticated)

const handleLinkClick = (link: NavigationLink) => {
  if (link.to) {
    router.push(link.to)
  } else if (link.href) {
    window.location.href = link.href
  }
}

const handleCtaClick = (cta: NavigationCta) => {
  if (cta.label === 'Deconnexion') {
    handleLogout()
  } else if (cta.to) {
    router.push(cta.to)
  }
}

const handleCartClick = () => {
  router.push('/cart')
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
  } catch {
    // Error initializing stores - silent failure
  }
})
</script>
