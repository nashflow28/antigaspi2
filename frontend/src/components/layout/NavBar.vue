<template>
  <!-- Skip Links -->
  <div class="sr-only focus-within:not-sr-only">
    <a
      href="#main-content"
      class="relative sm:absolute top-4 left-4 bg-blue-600 text-white px-3 py-3 rounded z-[60] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
    >
      Aller au contenu principal
    </a>
    <a
      href="#main-nav"
      class="relative sm:absolute top-4 left-32 bg-blue-600 text-white px-3 py-3 rounded z-[60] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
    >
      Aller à la navigation
    </a>
  </div>

  <nav
    id="main-nav"
    :class="navWrapperClasses"
    role="navigation"
    aria-label="Navigation principale"
  >
    <div :class="navContainerClasses">
      <div class="flex h-12 w-full items-center justify-start sm:justify-between">
        <!-- Logo and brand - Modernisé avec gradient et animation -->
        <div class="flex items-center animate-fade-in-right">
          <router-link
            to="/"
            class="flex items-center space-y-2 sm:space-x-3 p-2 rounded transition-all duration-300 ease-spring hover:scale-105 hover:shadow-xl group"
            aria-label="Antigaspi - Retour à l'accueil"
            :aria-current="$route.path === '/' ? 'page' : undefined"
          >
            <div class="h-6 w-6 bg-gradient-to-r from-blue-600 to-blue-700 rounded flex items-center justify-center shadow-lg group-hover:transition-all duration-300">
              <span class="text-white text-xl">🌱</span>
            </div>
            <div class="flex flex-col">
              <span class="text-xl font-semibold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent font-display">
                Antigaspi
              </span>
              <span class="text-xs text-gray-500 font-medium -mt-1 font-heading">
                Sauvons ensemble
              </span>
            </div>
          </router-link>
        </div>

        <!-- Desktop Navigation - Design moderne -->
        <div class="hidden sm:block md:flex items-center space-y-8 sm:space-x-8 animate-fade-in">
          <ul class="flex items-center space-y-8 sm:space-x-8" role="menubar" aria-label="Menu principal">
            <!-- Navigation Links avec design moderne -->
            <li role="none">
              <router-link
                to="/products"
                class="nav-link relative group"
                active-class="nav-link-active"
                role="menuitem"
                :aria-current="$route.path === '/products' ? 'page' : undefined"
                aria-label="Parcourir les produits disponibles"
              >
                <span class="relative z-10">Produits</span>
                <div class="relative sm:absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-700 opacity-0 group-hover:transition-opacity duration-200" />
              </router-link>
            </li>

            <li role="none">
              <router-link
                to="/surprise-baskets"
                class="nav-link relative group"
                active-class="nav-link-active"
                role="menuitem"
                :aria-current="$route.path.startsWith('/surprise-baskets') ? 'page' : undefined"
                aria-label="Explorer les paniers surprise disponibles"
              >
                <span class="relative z-10">Paniers surprise</span>
                <div class="relative sm:absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-700 opacity-0 group-hover:transition-opacity duration-200" />
              </router-link>
            </li>

            <li role="none">
              <router-link
                to="/merchants/map"
                class="nav-link relative group"
                active-class="nav-link-active"
                role="menuitem"
                :aria-current="$route.path === '/merchants/map' ? 'page' : undefined"
                aria-label="Voir la carte des commerçants"
              >
                <span class="relative z-10">Carte</span>
                <div class="relative sm:absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-700 opacity-0 group-hover:transition-opacity duration-200" />
              </router-link>
            </li>

            <li role="none">
              <router-link
                to="/reviews"
                class="nav-link relative group"
                active-class="nav-link-active"
                role="menuitem"
                :aria-current="$route.path === '/reviews' ? 'page' : undefined"
                aria-label="Consulter les avis clients"
              >
                <span class="relative z-10">Avis</span>
                <div class="relative sm:absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-700 opacity-0 group-hover:transition-opacity duration-200" />
              </router-link>
            </li>

            <!-- Theme Toggle -->
            <li role="none">
              <ThemeToggle />
            </li>

            <template v-if="!authStore.isAuthenticated">
              <li role="none">
                <router-link
                  to="/login"
                  data-testid="nav-login"
                  class="nav-link relative group"
                  role="menuitem"
                  :aria-current="$route.path === '/login' ? 'page' : undefined"
                  aria-label="Se connecter à son compte"
                >
                  <span class="relative z-10 flex items-center gap-2">
                    <LogIn class="h-4 w-4" aria-hidden="true" />
                    Connexion
                  </span>
                  <div class="relative sm:absolute inset-0 bg-gradient-to-r from-blue-500 to-blue-500/90 opacity-0 group-hover:transition-opacity duration-200" />
                </router-link>
              </li>
              <li role="none">
                <Button
                  tag="router-link"
                  :to="'/register'"
                  data-testid="nav-register"
                  size="sm"
                  variant="primary"
                  class="animate-pulse-glow"
                  role="menuitem"
                  :aria-current="$route.path === '/register' ? 'page' : undefined"
                  aria-label="Créer un nouveau compte"
                >
                  <span class="flex items-center gap-2">
                    <UserPlus class="h-4 w-4" aria-hidden="true" />
                    S'inscrire
                  </span>
                </Button>
              </li>
            </template>

            <template v-else>
              <!-- User menu - Design moderne avec glassmorphism -->
              <li role="none">
                <div ref="userMenuRef" class="relative">
                  <button
                    class="flex items-center space-y-2 sm:space-x-3 px-3 py-3 rounded transition-all duration-200 ease-out hover:bg-gradient-to-r from-blue-600 to-blue-700 hover:text-white hover:shadow-xl group"
                    :aria-expanded="showUserMenu"
                    aria-haspopup="menu"
                    :aria-label="`Menu utilisateur - ${authStore.user?.first_name} ${authStore.user?.last_name}`"
                    @click="showUserMenu = !showUserMenu"
                    @keydown="handleMenuKeydown"
                  >
                    <div class="relative">
                      <div class="h-6 w-6 bg-gradient-to-r from-blue-600 to-blue-700 rounded flex items-center justify-center shadow-lg group-hover:transition-all duration-300">
                        <span class="text-white font-semibold text-sm">
                          {{ userInitials }}
                        </span>
                      </div>
                      <div class="relative sm:absolute -bottom-1 -right-1 h-4 w-4 bg-blue-500 rounded-full border-2 border-white shadow-lg" />
                    </div>
                    <div class="flex flex-col text-left">
                      <span class="font-semibold text-sm group-hover:transition-colors">
                        {{ authStore.user?.first_name }}
                      </span>
                      <span class="text-xs text-gray-400 group-hover:transition-colors">
                        {{ authStore.user?.role }}
                      </span>
                    </div>
                    <ChevronDown
                      class="h-4 w-4 transition-transform duration-200 group-hover:text-white"
                      :class="{ 'rotate-180': showUserMenu }"
                      aria-hidden="true"
                    />
                  </button>

                  <!-- Dropdown menu - Design moderne avec glassmorphism -->
                  <transition
                    enter-active-class="transition duration-200 ease-out"
                    enter-from-class="transform scale-95 opacity-0"
                    enter-to-class="transform scale-100 opacity-100"
                    leave-active-class="transition duration-75 ease-in"
                    leave-from-class="transform scale-100 opacity-100"
                    leave-to-class="transform scale-95 opacity-0"
                  >
                    <Card
                      v-show="showUserMenu"
                      ref="dropdownMenuRef"
                      variant="glass"
                      rounded="xl"
                      no-padding
                      class="relative sm:absolute right-0 z-[200] mt-3 w-96 border border-white/30 py-3 shadow-xl shadow-primary-500/10 animate-fade-in-down"
                      role="menu"
                      :aria-labelledby="userMenuButtonId"
                      @keydown="handleDropdownKeydown"
                    >
                      <!-- User Info Header -->
                      <div class="px-3 py-3 border-b border-white/10">
                        <div class="flex items-center space-y-2 sm:space-x-3">
                          <div class="w-12 h-10 bg-gradient-to-r from-blue-600 to-blue-700 rounded flex items-center justify-center shadow-lg">
                            <span class="text-white font-semibold">{{ userInitials }}</span>
                          </div>
                          <div>
                            <p class="font-semibold text-gray-900">{{ authStore.user?.first_name }} {{ authStore.user?.last_name }}</p>
                            <p class="text-sm text-gray-500">{{ authStore.user?.email }}</p>
                            <Badge variant="primary" size="sm" class="mt-1">{{ getRoleLabel(authStore.user?.role) }}</Badge>
                          </div>
                        </div>
                      </div>

                      <!-- Menu Items -->
                      <div class="py-3" role="group" aria-label="Navigation utilisateur">
                        <router-link
                          :to="getDashboardRoute()"
                          class="flex items-center px-3 py-3 text-sm text-gray-800 hover:bg-gradient-to-r from-blue-600 to-blue-700 hover:transition-all duration-200 group"
                          role="menuitem"
                          @click="showUserMenu = false"
                          @keydown="handleMenuItemKeydown"
                        >
                          <User class="h-4 w-4 mr-4 group-hover:text-white" aria-hidden="true" />
                          <span>Tableau de bord</span>
                        </router-link>
                        <router-link
                          to="/profile"
                          class="flex items-center px-3 py-3 text-sm text-gray-800 hover:bg-gradient-to-r from-blue-500 to-blue-500/90 hover:transition-all duration-200 group"
                          @click="showUserMenu = false"
                        >
                          <Settings class="h-4 w-4 mr-4 group-hover:text-white" />
                          <span>Mon profil</span>
                        </router-link>

                        <template v-if="authStore.isConsumer">
                          <router-link
                            to="/surprise-baskets"
                            class="flex items-center px-3 py-3 text-sm text-gray-800 hover:bg-gradient-to-r from-blue-600 to-blue-700 hover:transition-all duration-200 group"
                            @click="showUserMenu = false"
                          >
                            <Gift class="h-4 w-4 mr-4 group-hover:text-white" />
                            <span>Paniers surprise</span>
                          </router-link>
                          <router-link
                            to="/reservations"
                            class="flex items-center px-3 py-3 text-sm text-gray-800 hover:bg-gradient-to-r from-blue-600 to-blue-700 hover:transition-all duration-200 group"
                            @click="showUserMenu = false"
                          >
                            <ShoppingBag class="h-4 w-4 mr-4 group-hover:text-white" />
                            <span>Mes réservations</span>
                          </router-link>
                          <router-link
                            to="/wallet"
                            class="flex items-center px-3 py-3 text-sm text-gray-800 hover:bg-gradient-to-r from-blue-500 to-blue-500/90 hover:transition-all duration-200 group"
                            @click="showUserMenu = false"
                          >
                            <Wallet class="h-4 w-4 mr-4 group-hover:text-white" />
                            <span>Mon portefeuille</span>
                          </router-link>
                          <router-link
                            to="/loyalty"
                            class="flex items-center px-3 py-3 text-sm text-gray-800 hover:bg-gradient-to-r from-blue-600 to-blue-700 hover:transition-all duration-200 group"
                            @click="showUserMenu = false"
                          >
                            <Star class="h-4 w-4 mr-4 group-hover:text-white" />
                            <span>Points de fidélité</span>
                          </router-link>
                        </template>

                        <template v-if="authStore.isMerchant">
                          <router-link
                            to="/merchant/products"
                            class="flex items-center px-3 py-3 text-sm text-gray-800 hover:bg-gradient-to-r from-blue-600 to-blue-700 hover:transition-all duration-200 group"
                            @click="showUserMenu = false"
                          >
                            <Package class="h-4 w-4 mr-4 group-hover:text-white" />
                            <span>Mes produits</span>
                          </router-link>
                          <router-link
                            to="/merchant/reservations"
                            class="flex items-center px-3 py-3 text-sm text-gray-800 hover:bg-gradient-to-r from-blue-600 to-blue-700 hover:transition-all duration-200 group"
                            @click="showUserMenu = false"
                          >
                            <ShoppingBag class="h-4 w-4 mr-4 group-hover:text-white" />
                            <span>Réservations reçues</span>
                          </router-link>
                          <router-link
                            to="/merchant/reviews/dashboard"
                            class="flex items-center px-3 py-3 text-sm text-gray-800 hover:bg-gradient-to-r from-blue-600 to-blue-700 hover:transition-all duration-200 group"
                            @click="showUserMenu = false"
                          >
                            <MessageSquare class="h-4 w-4 mr-4 group-hover:text-white" />
                            <span>Mes avis</span>
                          </router-link>
                          <router-link
                            to="/merchant/loyalty"
                            class="flex items-center px-3 py-3 text-sm text-gray-800 hover:bg-gradient-to-r from-blue-600 to-blue-700 hover:transition-all duration-200 group"
                            @click="showUserMenu = false"
                          >
                            <Star class="h-4 w-4 mr-4 group-hover:text-white" />
                            <span>Points de fidélité</span>
                          </router-link>
                        </template>

                        <template v-if="authStore.isAdmin">
                          <router-link
                            to="/admin/users"
                            class="flex items-center px-3 py-3 text-sm text-gray-800 hover:bg-gradient-to-r from-blue-600 to-blue-700 hover:transition-all duration-200 group"
                            @click="showUserMenu = false"
                          >
                            <User class="h-4 w-4 mr-4 group-hover:text-white" />
                            <span>Utilisateurs</span>
                          </router-link>
                          <router-link
                            to="/admin/merchants"
                            class="flex items-center px-3 py-3 text-sm text-gray-800 hover:bg-gradient-to-r from-blue-600 to-blue-700 hover:transition-all duration-200 group"
                            @click="showUserMenu = false"
                          >
                            <ShoppingBag class="h-4 w-4 mr-4 group-hover:text-white" />
                            <span>Commerçants</span>
                          </router-link>
                          <router-link
                            to="/admin/categories"
                            class="flex items-center px-3 py-3 text-sm text-gray-800 hover:bg-gradient-to-r from-blue-600 to-blue-700 hover:transition-all duration-200 group"
                            @click="showUserMenu = false"
                          >
                            <Package class="h-4 w-4 mr-4 group-hover:text-white" />
                            <span>Catégories</span>
                          </router-link>
                          <router-link
                            to="/admin/reviews"
                            class="flex items-center px-3 py-3 text-sm text-gray-800 hover:bg-gradient-to-r from-blue-600 to-blue-700 hover:transition-all duration-200 group"
                            @click="showUserMenu = false"
                          >
                            <MessageSquare class="h-4 w-4 mr-4 group-hover:text-white" />
                            <span>Modération avis</span>
                          </router-link>
                        </template>
                      </div>

                      <!-- Logout Section -->
                      <div class="border-t border-white/10 padding-t-sm mt-2">
                        <Button
                          variant="ghost"
                          class="mx-sm flex w-[calc(100%-1rem)] items-center justify-start gap-3 px-3 py-3 text-sm text-red-600 transition-all duration-200 hover:bg-red-600/10 hover:text-red-600/90"
                          @click="handleLogout"
                        >
                          <LogOut class="h-4 w-4" />
                          <span>Se déconnecter</span>
                        </Button>
                      </div>
                    </Card>
                  </transition>
                </div>
              </li>
            </template>
          </ul>
        </div>

        <!-- Mobile Navigation -->
        <div class="md:hidden sm:block flex items-center">
          <MobileNav />
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { LogIn, UserPlus, User, Settings, LogOut, ChevronDown, Package, ShoppingBag, MessageSquare, Star, Gift, Wallet } from 'lucide-vue-next'
import MobileNav from '@/components/layout/MobileNav.vue'
import { useAccessibility } from '@/composables/useAccessibility'
import { Button, Badge, Card, ThemeToggle } from '@/components/ui/2025'

const router = useRouter()
const authStore = useAuthStore()

const navWrapperClasses = computed(() =>
  [
    'sticky top-0 z-[100] w-full',
    'backdrop-blur-xl supports-[backdrop-filter]:bg-white/70 bg-white/90',
    'border-b border-white/30 shadow-[0_10px_30px_-15px_rgba(15,23,42,0.45)]',
    'animate-fade-in-down transition-colors duration-300'
  ].join(' ')
)

const navContainerClasses = 'mx-auto flex w-full max-w-7xl items-center justify-between px-3 sm:px-4 lg:px-6'

const {
  createAriaId,
  handleArrowNavigation,
  getFocusableElements,
  announce
} = useAccessibility()

const showUserMenu = ref(false)
const userMenuRef = ref<HTMLElement>()
const dropdownMenuRef = ref<HTMLElement>()
const userMenuButtonId = createAriaId('user-menu-button')

const userInitials = computed(() => {
  if (!authStore.user) return 'U'
  const firstName = authStore.user.first_name
  const lastName = authStore.user.last_name
  return `${firstName[0]}${lastName[0]}`.toUpperCase()
})

const handleLogout = async () => {
  showUserMenu.value = false
  await authStore.logout()
  announce('Vous avez été déconnecté avec succès')
  router.push('/')
}

// Gestion de la navigation clavier pour le menu utilisateur
const handleMenuKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    showUserMenu.value = !showUserMenu.value

    if (showUserMenu.value) {
      nextTick(() => {
        // Focus sur le premier élément du menu
        const firstMenuItem = dropdownMenuRef.value?.querySelector('[role="menuitem"]') as HTMLElement
        firstMenuItem?.focus()
      })
    }
  } else if (event.key === 'Escape' && showUserMenu.value) {
    showUserMenu.value = false
  }
}

// Gestion de la navigation clavier dans le dropdown
const handleDropdownKeydown = (event: KeyboardEvent) => {
  if (!dropdownMenuRef.value) return

  const menuItems = getFocusableElements(dropdownMenuRef.value).filter(el =>
    el.getAttribute('role') === 'menuitem'
  )

  if (menuItems.length === 0) return

  if (handleArrowNavigation(event, menuItems)) {
    return
  }

  if (event.key === 'Escape') {
    event.preventDefault()
    showUserMenu.value = false
    // Redonner le focus au bouton du menu
    const menuButton = userMenuRef.value?.querySelector('button') as HTMLElement
    menuButton?.focus()
  }
}

// Gestion des éléments du menu
const handleMenuItemKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' || event.key === ' ') {
    // Laisser le comportement par défaut (clic sur le lien)
    showUserMenu.value = false
  }
}

// Ouvrir/fermer le menu avec annonce

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

const getRoleLabel = (role?: string): string => {
  if (!role) return ''
  const labels: Record<string, string> = {
    consumer: 'Consommateur',
    merchant: 'Commerçant',
    admin: 'Administrateur'
  }
  return labels[role] || role
}

// Close menus when clicking outside
const handleClickOutside = (event: Event) => {
  if (userMenuRef.value && !userMenuRef.value.contains(event.target as Element)) {
    showUserMenu.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>
