<template>
  <div id="app">
    <!-- TEMPORAIREMENT SIMPLE - POUR IDENTIFIER LE PROBLÈME -->
    <PageTransition>
      <router-view />
    </PageTransition>

    <!-- TEMPORARILY DISABLED - Global Notifications -->
    <!-- <NotificationContainer />
    <NotificationSystem /> -->

    <!-- TEMPORARILY DISABLED - Network Status -->
    <!-- <NetworkStatus /> -->

    <!-- TEMPORARILY DISABLED - PWA Prompts -->
    <!-- <PWAPrompt /> -->

    <!-- TEMPORARILY DISABLED - Dev Tools -->
    <!-- <OnboardingReset /> -->
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useProductsStore } from '@/stores/products'
import { useMerchantsStore } from '@/stores/merchants'
import { useCartStore } from '@/stores/cart'
import { useNotificationStore } from '@/stores/notification'
import MobileLayout from '@/components/layout/MobileLayout.vue'
import NotificationContainer from '@/components/ui/NotificationContainer.vue'
import NotificationSystem from '@/components/ui/NotificationSystem.vue'
import NetworkStatus from '@/components/ui/NetworkStatus.vue'
import PageTransition from '@/components/ui/PageTransition.vue'
import PWAPrompt from '@/components/ui/PWAPrompt.vue'
import OnboardingReset from '@/components/ui/OnboardingReset.vue'

// Initialize stores
const authStore = useAuthStore()
const productsStore = useProductsStore()
const merchantsStore = useMerchantsStore()
const cartStore = useCartStore()
const notificationStore = useNotificationStore()

// Router
const route = useRoute()
const router = useRouter()

// Computed properties for MobileLayout
const currentPageTitle = computed(() => {
  const routeMetaTitle = route.meta?.title as string
  if (routeMetaTitle) return routeMetaTitle

  switch (route.name) {
    case 'home': return 'Antigaspi'
    case 'discover': return 'Découvrir'
    case 'cart': return 'Mon panier'
    case 'favorites': return 'Mes favoris'
    case 'profile': return 'Mon profil'
    default: return 'Antigaspi'
  }
})

const currentPageSubtitle = computed(() => {
  const routeMetaSubtitle = route.meta?.subtitle as string
  if (routeMetaSubtitle) return routeMetaSubtitle

  switch (route.name) {
    case 'home': return 'Produits anti-gaspillage'
    case 'discover': return 'Commerçants près de vous'
    case 'cart': return `${cartItemsCount.value} article${cartItemsCount.value > 1 ? 's' : ''}`
    default: return undefined
  }
})

const currentPageShowSearch = computed(() => {
  return ['home', 'discover', 'products'].includes(route.name as string)
})

const cartItemsCount = computed(() => cartStore.itemsCount)
const notificationsCount = computed(() => notificationStore.unreadCount)
const isAuthenticated = computed(() => authStore.isAuthenticated)
const userName = computed(() => authStore.user?.first_name)
const userEmail = computed(() => authStore.user?.email)
const userAvatar = computed(() => authStore.user?.avatar_url)

// Event handlers
const handleSearchClick = () => {
  // Implémenter la recherche
  console.log('Search clicked')
}

const handleNotificationsClick = () => {
  router.push('/notifications')
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
    // Initialize authentication state first
    await authStore.initAuth()

    // Restore persisted cart before loading data
    cartStore.hydrateFromStorage()

    // Initialize data stores in parallel for better performance
    await Promise.allSettled([
      productsStore.fetchProducts(),
      merchantsStore.fetchMerchants()
    ])

    console.log('✅ Stores initialized successfully')
  } catch (error) {
    console.error('❌ Error initializing stores:', error)
  }
})
</script>