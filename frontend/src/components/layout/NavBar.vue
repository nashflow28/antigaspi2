<template>
  <!-- Skip Links -->
  <div class="sr-only focus-within:not-sr-only">
    <a
      href="#main-content"
      class="absolute top-4 left-4 bg-primary-600 text-white px-4 py-2 rounded-lg z-[60] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
    >
      Aller au contenu principal
    </a>
    <a
      href="#main-nav"
      class="absolute top-4 left-32 bg-primary-600 text-white px-4 py-2 rounded-lg z-[60] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
    >
      Aller à la navigation
    </a>
  </div>

  <nav
    id="main-nav"
    class="glass-bg glass-border sticky top-0 z-[100] backdrop-blur-lg animate-fade-in-down"
    role="navigation"
    aria-label="Navigation principale"
  >
    <div class="container-fluid">
      <div class="flex justify-between h-20">
        <!-- Logo and brand - Modernisé avec gradient et animation -->
        <div class="flex items-center animate-fade-in-right">
          <router-link
            to="/"
            class="flex items-center space-x-3 p-2 rounded-xl transition-all duration-300 ease-spring hover:scale-105 hover:shadow-glow group"
            aria-label="Antigaspi - Retour à l'accueil"
            :aria-current="$route.path === '/' ? 'page' : undefined"
          >
            <div class="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center shadow-soft group-hover:shadow-glow transition-all duration-300">
              <span class="text-white text-xl">🌱</span>
            </div>
            <div class="flex flex-col">
              <span class="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Antigaspi
              </span>
              <span class="text-xs text-neutral-500 font-medium -mt-1">
                Sauvons ensemble
              </span>
            </div>
          </router-link>
        </div>

        <!-- Desktop Navigation - Design moderne -->
        <div class="hidden md:flex items-center space-x-8 animate-fade-in">
          <ul class="flex items-center space-x-8" role="menubar" aria-label="Menu principal">
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
              <div class="absolute inset-0 bg-gradient-primary opacity-0 group-hover:opacity-10 rounded-lg transition-opacity duration-200"></div>
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
              <div class="absolute inset-0 bg-gradient-primary opacity-0 group-hover:opacity-10 rounded-lg transition-opacity duration-200"></div>
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
              <div class="absolute inset-0 bg-gradient-primary opacity-0 group-hover:opacity-10 rounded-lg transition-opacity duration-200"></div>
            </router-link>
          </li>

          <!-- Dark Mode Toggle -->
          <li role="none">
            <DarkModeToggle aria-label="Basculer entre mode clair et mode sombre" />
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
                  <LogIn class="w-4 h-4" aria-hidden="true" />
                  Connexion
                </span>
                <div class="absolute inset-0 bg-gradient-secondary opacity-0 group-hover:opacity-10 rounded-lg transition-opacity duration-200"></div>
              </router-link>
            </li>
            <li role="none">
              <router-link
                to="/register"
                data-testid="nav-register"
                class="btn btn-primary btn-sm animate-pulse-glow"
                role="menuitem"
                :aria-current="$route.path === '/register' ? 'page' : undefined"
                aria-label="Créer un nouveau compte"
              >
                <UserPlus class="w-4 h-4" aria-hidden="true" />
                S'inscrire
              </router-link>
            </li>
          </template>

          <template v-else>
            <!-- User menu - Design moderne avec glassmorphism -->
            <li role="none">
              <div class="relative" ref="userMenuRef">
                <button
                  @click="showUserMenu = !showUserMenu"
                  class="flex items-center space-x-3 px-4 py-2 rounded-xl transition-all duration-200 ease-out hover:bg-gradient-primary hover:text-white hover:shadow-glow group"
                  :aria-expanded="showUserMenu"
                  aria-haspopup="menu"
                  :aria-label="`Menu utilisateur - ${authStore.user?.first_name} ${authStore.user?.last_name}`"
                  @keydown="handleMenuKeydown"
                >
                <div class="relative">
                  <div class="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center shadow-soft group-hover:shadow-glow transition-all duration-300">
                    <span class="text-white font-bold text-sm">
                      {{ userInitials }}
                    </span>
                  </div>
                  <div class="absolute -bottom-1 -right-1 w-4 h-4 bg-success-500 rounded-full border-2 border-white shadow-soft"></div>
                </div>
                <div class="flex flex-col text-left">
                  <span class="font-semibold text-sm group-hover:text-white transition-colors">
                    {{ authStore.user?.first_name }}
                  </span>
                  <span class="text-xs text-neutral-400 group-hover:text-white/80 transition-colors">
                    {{ authStore.user?.role }}
                  </span>
                </div>
                <ChevronDown
                  class="w-4 h-4 transition-transform duration-200 group-hover:text-white"
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
                  <div
                    v-show="showUserMenu"
                    ref="dropdownMenuRef"
                    class="absolute right-0 mt-3 w-64 glass-bg glass-border rounded-2xl shadow-hard py-2 z-[200] animate-fade-in-down"
                    role="menu"
                    :aria-labelledby="userMenuButtonId"
                    @keydown="handleDropdownKeydown"
                  >
                  <!-- User Info Header -->
                  <div class="px-4 py-3 border-b border-white/10">
                    <div class="flex items-center space-x-3">
                      <div class="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center shadow-soft">
                        <span class="text-white font-bold">{{ userInitials }}</span>
                      </div>
                      <div>
                        <p class="font-semibold text-neutral-900">{{ authStore.user?.first_name }} {{ authStore.user?.last_name }}</p>
                        <p class="text-sm text-neutral-500">{{ authStore.user?.email }}</p>
                        <span class="badge badge-primary mt-1">{{ getRoleLabel(authStore.user?.role) }}</span>
                      </div>
                    </div>
                  </div>

                  <!-- Menu Items -->
                  <div class="py-2" role="group" aria-label="Navigation utilisateur">
                    <router-link
                      :to="getDashboardRoute()"
                      class="flex items-center px-4 py-3 text-sm text-neutral-700 hover:bg-gradient-primary hover:text-white transition-all duration-200 group"
                      role="menuitem"
                      @click="showUserMenu = false"
                      @keydown="handleMenuItemKeydown"
                    >
                      <User class="w-4 h-4 mr-3 group-hover:text-white" aria-hidden="true" />
                      <span>Tableau de bord</span>
                    </router-link>
                    <router-link
                      to="/profile"
                      class="flex items-center px-4 py-3 text-sm text-neutral-700 hover:bg-gradient-secondary hover:text-white transition-all duration-200 group"
                      @click="showUserMenu = false"
                    >
                      <Settings class="w-4 h-4 mr-3 group-hover:text-white" />
                      <span>Mon profil</span>
                    </router-link>

                <template v-if="authStore.isConsumer">
                  <router-link
                    to="/reservations"
                    class="flex items-center px-4 py-3 text-sm text-neutral-700 hover:bg-gradient-primary hover:text-white transition-all duration-200 group"
                    @click="showUserMenu = false"
                  >
                    <ShoppingBag class="w-4 h-4 mr-3 group-hover:text-white" />
                    <span>Mes réservations</span>
                  </router-link>
                  <router-link
                    to="/loyalty"
                    class="flex items-center px-4 py-3 text-sm text-neutral-700 hover:bg-gradient-primary hover:text-white transition-all duration-200 group"
                    @click="showUserMenu = false"
                  >
                    <Star class="w-4 h-4 mr-3 group-hover:text-white" />
                    <span>Points de fidélité</span>
                  </router-link>
                </template>

                <template v-if="authStore.isMerchant">
                  <router-link
                    to="/merchant/products"
                    class="flex items-center px-4 py-3 text-sm text-neutral-700 hover:bg-gradient-primary hover:text-white transition-all duration-200 group"
                    @click="showUserMenu = false"
                  >
                    <Package class="w-4 h-4 mr-3 group-hover:text-white" />
                    <span>Mes produits</span>
                  </router-link>
                  <router-link
                    to="/merchant/reservations"
                    class="flex items-center px-4 py-3 text-sm text-neutral-700 hover:bg-gradient-primary hover:text-white transition-all duration-200 group"
                    @click="showUserMenu = false"
                  >
                    <ShoppingBag class="w-4 h-4 mr-3 group-hover:text-white" />
                    <span>Réservations reçues</span>
                  </router-link>
                  <router-link
                    to="/merchant/reviews/dashboard"
                    class="flex items-center px-4 py-3 text-sm text-neutral-700 hover:bg-gradient-primary hover:text-white transition-all duration-200 group"
                    @click="showUserMenu = false"
                  >
                    <MessageSquare class="w-4 h-4 mr-3 group-hover:text-white" />
                    <span>Mes avis</span>
                  </router-link>
                  <router-link
                    to="/merchant/loyalty"
                    class="flex items-center px-4 py-3 text-sm text-neutral-700 hover:bg-gradient-primary hover:text-white transition-all duration-200 group"
                    @click="showUserMenu = false"
                  >
                    <Star class="w-4 h-4 mr-3 group-hover:text-white" />
                    <span>Points de fidélité</span>
                  </router-link>
                </template>

                <template v-if="authStore.isAdmin">
                  <router-link
                    to="/admin/users"
                    class="flex items-center px-4 py-3 text-sm text-neutral-700 hover:bg-gradient-primary hover:text-white transition-all duration-200 group"
                    @click="showUserMenu = false"
                  >
                    <User class="w-4 h-4 mr-3 group-hover:text-white" />
                    <span>Utilisateurs</span>
                  </router-link>
                  <router-link
                    to="/admin/merchants"
                    class="flex items-center px-4 py-3 text-sm text-neutral-700 hover:bg-gradient-primary hover:text-white transition-all duration-200 group"
                    @click="showUserMenu = false"
                  >
                    <ShoppingBag class="w-4 h-4 mr-3 group-hover:text-white" />
                    <span>Commerçants</span>
                  </router-link>
                  <router-link
                    to="/admin/categories"
                    class="flex items-center px-4 py-3 text-sm text-neutral-700 hover:bg-gradient-primary hover:text-white transition-all duration-200 group"
                    @click="showUserMenu = false"
                  >
                    <Package class="w-4 h-4 mr-3 group-hover:text-white" />
                    <span>Catégories</span>
                  </router-link>
                  <router-link
                    to="/admin/reviews"
                    class="flex items-center px-4 py-3 text-sm text-neutral-700 hover:bg-gradient-primary hover:text-white transition-all duration-200 group"
                    @click="showUserMenu = false"
                  >
                    <MessageSquare class="w-4 h-4 mr-3 group-hover:text-white" />
                    <span>Modération avis</span>
                  </router-link>
                </template>

                  </div>

                  <!-- Logout Section -->
                  <div class="border-t border-white/10 pt-2 mt-2">
                    <button
                      @click="handleLogout"
                      class="flex items-center w-full px-4 py-3 text-sm text-error-600 hover:bg-error-50 hover:text-error-700 transition-all duration-200 group rounded-lg mx-2"
                    >
                      <LogOut class="w-4 h-4 mr-3 group-hover:text-error-700" />
                      <span>Se déconnecter</span>
                    </button>
                  </div>
                  </div>
                </transition>
              </div>
            </li>
          </template>
          </ul>
        </div>

        <!-- Mobile Navigation -->
        <div class="md:hidden flex items-center">
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
import { LogIn, UserPlus, User, Settings, LogOut, ChevronDown, Package, ShoppingBag, MessageSquare, Star } from 'lucide-vue-next'
import DarkModeToggle from '@/components/ui/DarkModeToggle.vue'
import MobileNav from '@/components/layout/MobileNav.vue'
import { useAccessibility } from '@/composables/useAccessibility'

const router = useRouter()
const authStore = useAuthStore()

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
  if (userMenuRef.value && !userMenuRef.value.contains(event.target as Node)) {
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