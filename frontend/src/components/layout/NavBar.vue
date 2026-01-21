<template>
  <Navigation2025
    v-model:mobile-open="isMobileMenuOpen"
    :brand="brand"
    :main-links="mainNavigation"
    :auth-cta="authCta"
    :aria-label="'Navigation principale'"
    @cta-click="handleCtaClick"
  >
    <template #brand>
      <RouterLink
        to="/"
        class="group inline-flex items-center gap-3 rounded-full px-3 py-2 text-neutral-900 transition-all duration-300 ease-spring-out focus-2025 hover:-translate-y-0.5 hover:text-primary-900 dark:text-dark-50"
        aria-label="Antigaspi - Retour à l'accueil"
        :aria-current="route.path === '/' ? 'page' : undefined"
      >
        <span class="grid h-9 w-9 place-items-center rounded-2xl bg-gradient-to-br from-primary-500 via-accent-blue/70 to-accent-blue text-white shadow-lg shadow-primary-500/30 transition-transform duration-500 group-hover:scale-105">
          🌱
        </span>
        <span class="flex flex-col text-left">
          <span class="text-base font-semibold tracking-tight text-neutral-900 dark:text-dark-50">Antigaspi</span>
          <span class="text-xs font-medium text-neutral-500 transition-colors duration-300 group-hover:text-neutral-700 dark:text-dark-300">
            Sauvons ensemble
          </span>
        </span>
      </RouterLink>
    </template>

    <template #utilities>
      <!-- Cart Badge -->
      <RouterLink
        v-if="authStore.isAuthenticated"
        to="/cart"
        class="relative inline-flex items-center justify-center rounded-full p-2 text-neutral-700 transition-all duration-300 ease-spring-out focus-2025 hover:bg-neutral-100 hover:text-primary-900 dark:text-dark-100 dark:hover:bg-dark-700"
        aria-label="Voir mon panier"
      >
        <ShoppingCart class="h-5 w-5" />
        <Badge
          v-if="cartStore.itemsCount > 0"
          variant="primary"
          size="xs"
          class="absolute -top-1 -right-1 min-w-[20px] h-5 flex items-center justify-center"
        >
          {{ cartStore.itemsCount }}
        </Badge>
      </RouterLink>

      <ThemeToggle aria-label="Basculer le thème" />
    </template>

    <template #secondary>
      <ThemeToggle aria-label="Basculer le thème" />

      <template v-if="!authStore.isAuthenticated">
        <RouterLink
          :to="authCta?.login?.to ?? '/login'"
          class="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-neutral-700 transition-all duration-300 ease-spring-out focus-2025 hover:text-primary-900 dark:text-dark-100"
          data-testid="nav-login"
          :aria-label="authCta?.login?.ariaLabel ?? 'Se connecter à son compte'"
          :aria-current="route.path === (authCta?.login?.to ?? '/login') ? 'page' : undefined"
        >
          <component :is="authCta?.login?.icon ?? LogIn" class="h-4 w-4" aria-hidden="true" />
          {{ authCta?.login?.label ?? 'Connexion' }}
        </RouterLink>
        <Button
          tag="router-link"
          :to="authCta?.primary?.to ?? '/register'"
          size="sm"
          :variant="authCta?.primary?.variant ?? 'primary'"
          class="shadow-lg shadow-primary-500/20"
          data-testid="nav-register"
          :aria-label="authCta?.primary?.ariaLabel ?? 'Créer un nouveau compte'"
        >
          <component :is="authCta?.primary?.icon ?? UserPlus" class="h-4 w-4" aria-hidden="true" />
          {{ authCta?.primary?.label ?? "S'inscrire" }}
        </Button>
      </template>

      <template v-else>
        <div ref="userMenuRef" class="relative">
          <button
            :id="userMenuButtonId"
            class="group inline-flex items-center gap-3 rounded-full border border-white/50 bg-white/80 px-3 py-2 text-sm font-semibold text-neutral-800 shadow-sm transition-all duration-300 ease-spring-out focus-2025 hover:-translate-y-0.5 hover:bg-white dark:border-dark-600/60 dark:bg-dark-800/80 dark:text-dark-100"
            :aria-expanded="showUserMenu"
            aria-haspopup="menu"
            :aria-label="`Menu utilisateur - ${authStore.user?.first_name ?? ''} ${authStore.user?.last_name ?? ''}`"
            @click="toggleUserMenu"
            @keydown="handleMenuKeydown"
          >
            <span class="grid h-9 w-9 place-items-center rounded-2xl bg-gradient-to-br from-primary-500 via-accent-blue/70 to-accent-blue text-white shadow-lg shadow-primary-500/30">
              {{ userInitials }}
            </span>
            <span class="flex flex-col text-left">
              <span class="text-sm font-semibold leading-tight text-neutral-900 transition-colors duration-300 group-hover:text-primary-900 dark:text-dark-50">
                {{ authStore.user?.first_name }}
              </span>
              <span class="text-xs text-neutral-500 dark:text-dark-300">
                {{ getRoleLabel(authStore.user?.role) }}
              </span>
            </span>
          </button>
        </div>

        <!-- Desktop Navigation - Design moderne -->
        <div class="hidden sm:block md:flex items-center space-y-8 sm:space-x-8 animate-fade-in">
          <ul class="flex items-center space-y-8 sm:space-x-8" role="menubar" aria-label="Menu principal">
            <!-- Navigation Links avec design moderne -->
            <li role="none">
              <RouterLink
                to="/products"
                class="nav-link relative group"
                active-class="nav-link-active"
                role="menuitem"
                :aria-current="$route.path === '/products' ? 'page' : undefined"
                aria-label="Parcourir les produits disponibles"
              >
                <span class="relative z-10">Produits</span>
                <div class="relative sm:absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-700 opacity-0 group-hover:transition-opacity duration-200" />
              </RouterLink>
            </li>

            <li role="none">
              <RouterLink
                to="/surprise-baskets"
                class="nav-link relative group"
                active-class="nav-link-active"
                role="menuitem"
                :aria-current="$route.path.startsWith('/surprise-baskets') ? 'page' : undefined"
                aria-label="Explorer les paniers surprise disponibles"
              >
                <span class="relative z-10">Paniers surprise</span>
                <div class="relative sm:absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-700 opacity-0 group-hover:transition-opacity duration-200" />
              </RouterLink>
            </li>

            <li role="none">
              <RouterLink
                to="/merchants/map"
                class="nav-link relative group"
                active-class="nav-link-active"
                role="menuitem"
                :aria-current="$route.path === '/merchants/map' ? 'page' : undefined"
                aria-label="Voir la carte des commerçants"
              >
                <span class="relative z-10">Carte</span>
                <div class="relative sm:absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-700 opacity-0 group-hover:transition-opacity duration-200" />
              </RouterLink>
            </li>

            <li role="none">
              <RouterLink
                to="/reviews"
                class="nav-link relative group"
                active-class="nav-link-active"
                role="menuitem"
                :aria-current="$route.path === '/reviews' ? 'page' : undefined"
                aria-label="Consulter les avis clients"
              >
                <span class="relative z-10">Avis</span>
                <div class="relative sm:absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-700 opacity-0 group-hover:transition-opacity duration-200" />
              </RouterLink>
            </li>

            <!-- Theme Toggle -->
            <li role="none">
              <ThemeToggle />
            </li>

            <template v-if="!authStore.isAuthenticated">
              <li role="none">
                <RouterLink
                  to="/login"
                  data-testid="nav-login"
                  class="nav-link relative group"
                >
                  <span>Connexion</span>
                </RouterLink>
              </li>
              <li role="none">
                <RouterLink
                  to="/register"
                  data-testid="nav-register"
                  class="nav-link relative group"
                >
                  <span>Inscription</span>
                </RouterLink>
              </li>
            </template>

            <template v-else>
              <!-- User menu with dropdown -->
              <li role="none">
                <button
                  class="nav-link relative group flex items-center gap-2"
                  @click="toggleUserMenu"
                >
                  <span>{{ authStore.user?.first_name }}</span>
                  <ChevronDown
                    class="h-4 w-4 text-neutral-500 transition-transform duration-300 group-hover:text-primary-600"
                    :class="{ 'rotate-180': showUserMenu }"
                    aria-hidden="true"
                  />
                </button>

                <transition
                  enter-active-class="transition duration-200 ease-spring-out"
                  enter-from-class="translate-y-1 opacity-0"
                  enter-to-class="translate-y-0 opacity-100"
                  leave-active-class="transition duration-150 ease-in"
                  leave-from-class="translate-y-0 opacity-100"
                  leave-to-class="translate-y-1 opacity-0"
                >
                  <div
                    v-show="showUserMenu"
                    ref="dropdownMenuRef"
                    class="absolute right-0 z-[140] mt-4 w-80 overflow-hidden rounded-2xl border border-white/40 bg-white/95 shadow-xl shadow-primary-500/10 backdrop-blur-2xl dark:border-dark-700/60 dark:bg-dark-900/95"
                    role="menu"
                    :aria-labelledby="userMenuButtonId"
                    @keydown="handleDropdownKeydown"
                  >
                    <div class="border-b border-white/40 bg-white/60 px-4 py-4 dark:border-dark-700/60 dark:bg-dark-800/60">
                      <div class="flex items-center gap-3">
                        <span class="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-primary-500 via-accent-blue/70 to-accent-blue text-white shadow-lg shadow-primary-500/30">
                          {{ userInitials }}
                        </span>
                        <div class="flex flex-col">
                          <span class="text-sm font-semibold text-neutral-900 dark:text-dark-50">
                            {{ authStore.user?.first_name }} {{ authStore.user?.last_name }}
                          </span>
                          <span class="text-xs text-neutral-500 dark:text-dark-300">
                            {{ authStore.user?.email }}
                          </span>
                          <Badge variant="primary" size="sm" class="mt-2 w-fit">
                            {{ getRoleLabel(authStore.user?.role) }}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <nav class="max-h-80 space-y-1 overflow-y-auto px-2 py-3" aria-label="Navigation utilisateur">
                      <RouterLink
                        v-for="item in userMenuLinks"
                        :key="item.to"
                        :to="item.to"
                        class="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-neutral-700 transition-all duration-300 ease-spring-out hover:bg-primary-500/10 hover:text-primary-700 focus-2025 dark:text-dark-100 dark:hover:bg-dark-700/60"
                        role="menuitem"
                        @click="closeUserMenu"
                        @keydown="handleMenuItemKeydown"
                      >
                        <component :is="item.icon" class="h-4 w-4" aria-hidden="true" />
                        <span>{{ item.label }}</span>
                      </RouterLink>
                    </nav>

                    <div class="border-t border-white/30 bg-white/50 px-3 py-3 dark:border-dark-700/60 dark:bg-dark-800/40">
                      <Button
                        variant="ghost"
                        class="w-full justify-start gap-3 text-accent-red hover:bg-accent-red/10 hover:text-accent-red"
                        @click="handleLogout()"
                      >
                        <LogOut class="h-4 w-4" aria-hidden="true" />
                        Se déconnecter
                      </Button>
                    </div>
                  </div>
                </transition>
              </li>
            </template>
          </ul>
        </div>
      </template>
    </template>

    <template #mobile-secondary="{ closeMobile }">
      <div class="flex items-center justify-between rounded-3xl border border-white/60 bg-white/60 px-4 py-3 text-sm font-medium text-neutral-700 shadow-sm dark:border-dark-600/60 dark:bg-dark-800/70 dark:text-dark-100">
        <span>Thème</span>
        <ThemeToggle aria-label="Basculer le thème" />
      </div>

      <template v-if="!authStore.isAuthenticated">
        <RouterLink
          :to="authCta?.login?.to ?? '/login'"
          class="flex items-center justify-center rounded-full border border-primary-500/40 bg-primary-50/60 px-4 py-3 text-sm font-semibold text-primary-700 transition-all duration-300 ease-spring-out focus-2025 hover:bg-primary-100"
          data-testid="nav-login-mobile"
          @click="closeMobile()"
        >
          <component :is="authCta?.login?.icon ?? LogIn" class="h-4 w-4" aria-hidden="true" />
          {{ authCta?.login?.label ?? 'Connexion' }}
        </RouterLink>
        <Button
          tag="router-link"
          :to="authCta?.primary?.to ?? '/register'"
          size="lg"
          class="w-full"
          data-testid="nav-register-mobile"
          @click="closeMobile()"
        >
          <component :is="authCta?.primary?.icon ?? UserPlus" class="h-4 w-4" aria-hidden="true" />
          {{ authCta?.primary?.label ?? "S'inscrire" }}
        </Button>
      </template>

      <template v-else>
        <div class="rounded-3xl border border-white/50 bg-white/70 p-4 dark:border-dark-600/60 dark:bg-dark-800/70">
          <div class="flex items-center gap-3">
            <span class="grid h-12 w-12 place-items-center rounded-3xl bg-gradient-to-br from-primary-500 via-accent-blue/70 to-accent-blue text-white shadow-lg shadow-primary-500/30">
              {{ userInitials }}
            </span>
            <div class="flex flex-col">
              <span class="text-sm font-semibold text-neutral-900 dark:text-dark-50">
                {{ authStore.user?.first_name }} {{ authStore.user?.last_name }}
              </span>
              <span class="text-xs text-neutral-500 dark:text-dark-300">
                {{ authStore.user?.email }}
              </span>
              <Badge variant="primary" size="sm" class="mt-2 w-fit">
                {{ getRoleLabel(authStore.user?.role) }}
              </Badge>
            </div>
          </div>
        </div>

        <div class="grid gap-2">
          <RouterLink
            v-for="item in userMenuLinks"
            :key="`mobile-${item.to}`"
            :to="item.to"
            class="flex items-center gap-3 rounded-2xl border border-white/60 bg-white/60 px-4 py-3 text-sm font-medium text-neutral-700 transition-all duration-300 ease-spring-out focus-2025 hover:bg-white dark:border-dark-600/60 dark:bg-dark-800/70 dark:text-dark-100"
            role="menuitem"
            @click="closeMobile(); closeUserMenu()"
          >
            <component :is="item.icon" class="h-4 w-4" aria-hidden="true" />
            <span>{{ item.label }}</span>
          </RouterLink>
        </div>

        <Button
          variant="ghost"
          class="mt-2 w-full justify-start gap-3 text-accent-red hover:bg-accent-red/10 hover:text-accent-red"
          @click="() => handleLogout(closeMobile)"
        >
          <LogOut class="h-4 w-4" aria-hidden="true" />
          Se déconnecter
        </Button>
      </template>
    </template>
  </Navigation2025>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch, type Component } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import {
  LogIn,
  UserPlus,
  User,
  Settings,
  LogOut,
  ChevronDown,
  Package,
  ShoppingBag,
  ShoppingCart,
  MessageCircle,
  MessageSquare,
  Star,
  Gift,
  Wallet,
  MapPin,
  Bell
} from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { useCartStore } from '@/stores/cart'
import { useAccessibility } from '@/composables/useAccessibility'
import { Button, Badge, ThemeToggle } from '@/components/ui/2025'
import Navigation2025, { type NavigationBrand, type NavigationCta, type NavigationLink } from '@/components/ui/2025/Navigation.vue'

interface UserMenuLink {
  to: string
  label: string
  icon: Component
}

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const cartStore = useCartStore()

const brand = computed<NavigationBrand>(() => ({
  name: 'Antigaspi',
  tagline: 'Sauvons ensemble',
  to: '/'
}))

const mainNavigation = computed<NavigationLink[]>(() => {
  const links: NavigationLink[] = [
    {
      id: 'products',
      label: 'Produits',
      to: '/products',
      icon: Package,
      active: route.path === '/products',
      ariaLabel: 'Parcourir les produits disponibles'
    },
    {
      id: 'surprise-baskets',
      label: 'Paniers surprise',
      to: '/surprise-baskets',
      icon: Gift,
      active: route.path.startsWith('/surprise-baskets'),
      ariaLabel: 'Explorer les paniers surprise disponibles'
    },
    {
      id: 'map',
      label: 'Carte',
      to: '/merchants/map',
      icon: MapPin,
      active: route.path === '/merchants/map',
      ariaLabel: 'Voir la carte des commerçants'
    },
    {
      id: 'reviews',
      label: 'Avis',
      to: '/reviews',
      icon: MessageSquare,
      active: route.path === '/reviews',
      ariaLabel: 'Consulter les avis clients'
    }
  ]

  if (authStore.user?.role === 'consumer') {
    links.push({
      id: 'messaging',
      label: 'Messagerie',
      to: '/messaging',
      icon: MessageCircle,
      active: route.path.startsWith('/messaging'),
      ariaLabel: 'Accéder à la messagerie commerçant'
    })
  }

  return links
})

const authCta = computed(() => {
  if (authStore.isAuthenticated) {
    return null
  }

  const primary: NavigationCta = {
    label: 'Inscription',
    to: '/register',
    icon: UserPlus,
    variant: 'primary',
    ariaLabel: 'Créer un nouveau compte'
  }

  const login: NavigationLink = {
    id: 'login',
    label: 'Connexion',
    to: '/login',
    icon: LogIn,
    ariaLabel: 'Se connecter à son compte'
  }

  return { primary, login }
})

const userMenuLinks = computed<UserMenuLink[]>(() => {
  if (!authStore.user) {
    return []
  }

  const base: UserMenuLink[] = [
    {
      to: getDashboardRoute(),
      label: 'Tableau de bord',
      icon: User
    },
    {
      to: '/profile',
      label: 'Mon profil',
      icon: Settings
    },
    {
      to: '/notifications',
      label: 'Notifications',
      icon: Bell
    }
  ]

  const roleLinks: Record<string, UserMenuLink[]> = {
    consumer: [
      { to: '/messaging', label: 'Messagerie commerçant', icon: MessageCircle },
      { to: '/surprise-baskets', label: 'Paniers surprise', icon: Gift },
      { to: '/reservations', label: 'Mes réservations', icon: ShoppingBag },
      { to: '/wallet', label: 'Mon portefeuille', icon: Wallet },
      { to: '/loyalty', label: 'Points de fidélité', icon: Star }
    ],
    merchant: [
      { to: '/merchant/products', label: 'Mes produits', icon: Package },
      { to: '/merchant/reservations', label: 'Réservations reçues', icon: ShoppingBag },
      { to: '/merchant/payments', label: 'Paiements & Portefeuille', icon: Wallet },
      { to: '/merchant/reviews/dashboard', label: 'Mes avis', icon: MessageSquare },
      { to: '/merchant/loyalty', label: 'Points de fidélité', icon: Star }
    ],
    admin: [
      { to: '/admin/users', label: 'Utilisateurs', icon: User },
      { to: '/admin/merchants', label: 'Commerçants', icon: ShoppingBag },
      { to: '/admin/categories', label: 'Catégories', icon: Package },
      { to: '/admin/reviews', label: 'Modération avis', icon: MessageSquare }
    ]
  }

  return [...base, ...(roleLinks[authStore.user.role] ?? [])]
})

const isMobileMenuOpen = ref(false)

const { createAriaId, handleArrowNavigation, getFocusableElements, announce } = useAccessibility()

const showUserMenu = ref(false)
const userMenuRef = ref<HTMLElement | null>(null)
const dropdownMenuRef = ref<HTMLElement | null>(null)
const userMenuButtonId = createAriaId('user-menu-button')

const userInitials = computed(() => {
  if (!authStore.user) return 'U'
  const firstName = authStore.user.first_name
  const lastName = authStore.user.last_name
  return `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase()
})

const toggleUserMenu = () => {
  showUserMenu.value = !showUserMenu.value

  if (showUserMenu.value) {
    nextTick(() => {
      const firstMenuItem = dropdownMenuRef.value?.querySelector('[role="menuitem"]') as HTMLElement | null
      firstMenuItem?.focus()
    })
  }
}

const closeUserMenu = () => {
  showUserMenu.value = false
}

const handleLogout = async (closeMobile?: () => void) => {
  closeMobile?.()
  closeUserMenu()
  await authStore.logout()
  announce('Vous avez été déconnecté avec succès')
  router.push('/')
}

const handleMenuKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    toggleUserMenu()
  } else if (event.key === 'Escape' && showUserMenu.value) {
    closeUserMenu()
  }
}

const handleDropdownKeydown = (event: KeyboardEvent) => {
  if (!dropdownMenuRef.value) return

  const menuItems = getFocusableElements(dropdownMenuRef.value).filter(element => element.getAttribute('role') === 'menuitem')
  if (!menuItems.length) return

  if (handleArrowNavigation(event, menuItems)) {
    return
  }

  if (event.key === 'Escape') {
    event.preventDefault()
    closeUserMenu()
    const menuButton = userMenuRef.value?.querySelector('button') as HTMLElement | null
    menuButton?.focus()
  }
}

const handleMenuItemKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' || event.key === ' ') {
    closeUserMenu()
  }
}

const handleClickOutside = (event: Event) => {
  if (userMenuRef.value && !userMenuRef.value.contains(event.target as Element)) {
    closeUserMenu()
  }
}

const handleCtaClick = (cta: NavigationCta) => {
  if (cta.to) {
    router.push(cta.to)
  } else if (cta.href) {
    window.open(cta.href, '_blank', 'noopener')
  }
}

const getDashboardRoute = () => {
  if (!authStore.user) return '/dashboard'

  switch (authStore.user.role) {
    case 'admin':
      return '/admin/dashboard'
    case 'merchant':
      return '/merchant/dashboard'
    case 'consumer':
    default:
      return '/dashboard'
  }
}

const getRoleLabel = (role?: string) => {
  if (!role) return ''
  const labels: Record<string, string> = {
    consumer: 'Consommateur',
    merchant: 'Commerçant',
    admin: 'Administrateur'
  }
  return labels[role] ?? role
}

watch(isMobileMenuOpen, value => {
  if (value) {
    closeUserMenu()
  }
})

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>
