<template>
  <nav class="glass-bg glass-border sticky top-0 z-50 backdrop-blur-lg animate-fade-in-down">
    <div class="container-fluid">
      <div class="flex justify-between h-20">
        <!-- Logo and brand - Modernisé avec gradient et animation -->
        <div class="flex items-center animate-fade-in-right">
          <router-link
            to="/"
            class="flex items-center space-x-3 p-2 rounded-xl transition-all duration-300 ease-spring hover:scale-105 hover:shadow-glow group"
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
          <!-- Navigation Links avec design moderne -->
          <router-link
            to="/products"
            class="nav-link relative group"
            active-class="nav-link-active"
          >
            <span class="relative z-10">Produits</span>
            <div class="absolute inset-0 bg-gradient-primary opacity-0 group-hover:opacity-10 rounded-lg transition-opacity duration-200"></div>
          </router-link>

          <router-link
            to="/merchants/map"
            class="nav-link relative group"
            active-class="nav-link-active"
          >
            <span class="relative z-10">Carte</span>
            <div class="absolute inset-0 bg-gradient-primary opacity-0 group-hover:opacity-10 rounded-lg transition-opacity duration-200"></div>
          </router-link>

          <router-link
            to="/reviews"
            class="nav-link relative group"
            active-class="nav-link-active"
          >
            <span class="relative z-10">Avis</span>
            <div class="absolute inset-0 bg-gradient-primary opacity-0 group-hover:opacity-10 rounded-lg transition-opacity duration-200"></div>
          </router-link>

          <!-- Dark Mode Toggle -->
          <DarkModeToggle />

          <template v-if="!authStore.isAuthenticated">
            <router-link
              to="/login"
              data-testid="nav-login"
              class="nav-link relative group"
            >
              <span class="relative z-10 flex items-center gap-2">
                <LogIn class="w-4 h-4" />
                Connexion
              </span>
              <div class="absolute inset-0 bg-gradient-secondary opacity-0 group-hover:opacity-10 rounded-lg transition-opacity duration-200"></div>
            </router-link>
            <router-link
              to="/register"
              data-testid="nav-register"
              class="btn btn-primary btn-sm animate-pulse-glow"
            >
              <UserPlus class="w-4 h-4" />
              S'inscrire
            </router-link>
          </template>

          <template v-else>
            <!-- User menu - Design moderne avec glassmorphism -->
            <div class="relative" ref="userMenuRef">
              <button
                @click="showUserMenu = !showUserMenu"
                class="flex items-center space-x-3 px-4 py-2 rounded-xl transition-all duration-200 ease-out hover:bg-gradient-primary hover:text-white hover:shadow-glow group"
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
                  class="absolute right-0 mt-3 w-64 glass-bg glass-border rounded-2xl shadow-hard py-2 z-50 animate-fade-in-down"
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
                        <span class="badge badge-primary mt-1">{{ authStore.user?.role }}</span>
                      </div>
                    </div>
                  </div>

                  <!-- Menu Items -->
                  <div class="py-2">
                    <router-link
                      :to="getDashboardRoute()"
                      class="flex items-center px-4 py-3 text-sm text-neutral-700 hover:bg-gradient-primary hover:text-white transition-all duration-200 group"
                      @click="showUserMenu = false"
                    >
                      <User class="w-4 h-4 mr-3 group-hover:text-white" />
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
                    class="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
                    @click="showUserMenu = false"
                  >
                    Mes réservations
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
          </template>
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
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { LogIn, UserPlus, User, Settings, LogOut, ChevronDown, Package, ShoppingBag, MessageSquare } from 'lucide-vue-next'
import DarkModeToggle from '@/components/ui/DarkModeToggle.vue'
import MobileNav from '@/components/layout/MobileNav.vue'

const router = useRouter()
const authStore = useAuthStore()

const showUserMenu = ref(false)
const userMenuRef = ref<HTMLElement>()

const userInitials = computed(() => {
  if (!authStore.user) return 'U'
  const firstName = authStore.user.first_name
  const lastName = authStore.user.last_name
  return `${firstName[0]}${lastName[0]}`.toUpperCase()
})

const handleLogout = async () => {
  showUserMenu.value = false
  await authStore.logout()
  router.push('/')
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