<template>
  <!-- Mobile Menu Button -->
  <button
    class="md:hidden sm:block relative p-2 rounded text-gray-700 hover:text-gray-900 hover:transition-colors"
    :class="{ 'text-blue-600': mobileMenuOpen }"
    @click="toggleMobileMenu"
  >
    <span class="sr-only">Ouvrir le menu</span>
    <div class="h-6 w-6 relative">
      <!-- Hamburger lines -->
      <span
        class="relative sm:absolute block h-0.5 w-12 bg-current transform transition duration-300 ease-in-out"
        :class="mobileMenuOpen ? 'rotate-45 translate-y-2.5' : 'translate-y-0'"
      />
      <span
        class="relative sm:absolute block h-0.5 w-12 bg-current transform transition duration-300 ease-in-out translate-y-2.5"
        :class="mobileMenuOpen ? 'opacity-0' : 'opacity-100'"
      />
      <span
        class="relative sm:absolute block h-0.5 w-12 bg-current transform transition duration-300 ease-in-out translate-y-5"
        :class="mobileMenuOpen ? '-rotate-45 -translate-y-2.5' : 'translate-y-0'"
      />
    </div>
  </button>

  <!-- Mobile Menu Overlay -->
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-300"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-300"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="mobileMenuOpen"
        class="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden sm:block"
        @click="closeMobileMenu"
      />
    </Transition>

    <!-- Mobile Menu Panel -->
    <Transition
      enter-active-class="transition-transform duration-300 ease-out"
      enter-from-class="translate-x-full"
      enter-to-class="translate-x-0"
      leave-active-class="transition-transform duration-300 ease-in"
      leave-from-class="translate-x-0"
      leave-to-class="translate-x-full"
    >
      <div
        v-if="mobileMenuOpen"
        class="fixed right-0 top-0 h-full w-80 bg-white shadow-80 z-50 md:hidden sm:block overflow-y-auto"
      >
        <!-- Mobile menu header -->
        <div class="flex items-center justify-start sm:justify-between p-4 border-b border-gray-200">
          <div class="flex items-center space-y-2 sm:space-x-3">
            <div class="h-6 w-6 bg-gradient-to-r from-blue-500 to-blue-500/50 rounded flex items-center justify-center">
              <span class="text-white text-lg">🌱</span>
            </div>
            <span class="text-lg font-semibold text-gray-900 font-display">Antigaspi</span>
          </div>
          <button
            class="p-2 rounded text-gray-400 hover:text-gray-700 hover:transition-colors"
            @click="closeMobileMenu"
          >
            <X class="h-4 w-4" />
          </button>
        </div>

        <!-- User Profile Section (if authenticated) -->
        <div v-if="authStore.isAuthenticated" class="p-4 bg-gray-50 border-b border-gray-200">
          <div class="flex items-center space-y-2 sm:space-x-3">
            <div class="w-12 h-10 bg-gradient-to-r from-blue-500 to-blue-500/50 rounded-full flex items-center justify-center">
              <span class="text-white font-medium text-lg">
                {{ authStore.user?.first_name?.charAt(0) }}{{ authStore.user?.last_name?.charAt(0) }}
              </span>
            </div>
            <div>
              <p class="font-medium text-gray-900 font-heading">
                {{ authStore.user?.first_name }} {{ authStore.user?.last_name }}
              </p>
              <p class="text-sm text-gray-500">{{ authStore.user?.email }}</p>
              <span
                class="inline-flex items-center px-3 py-1 rounded text-xs font-medium"
                :class="getRoleBadgeClasses(authStore.user?.role)"
              >
                {{ getRoleLabel(authStore.user?.role) }}
              </span>
            </div>
          </div>
        </div>

        <!-- Navigation Links -->
        <nav class="p-4 space-y-4">
          <!-- Public Links -->
          <router-link
            to="/products"
            class="mobile-nav-link"
            @click="closeMobileMenu"
          >
            <Package class="h-4 w-4" />
            <span>Produits</span>
          </router-link>

          <router-link
            to="/surprise-baskets"
            class="mobile-nav-link"
            @click="closeMobileMenu"
          >
            <Gift class="h-4 w-4" />
            <span>Paniers surprise</span>
          </router-link>

          <router-link
            to="/merchants/map"
            class="mobile-nav-link"
            @click="closeMobileMenu"
          >
            <MapPin class="h-4 w-4" />
            <span>Carte des Commerçants</span>
          </router-link>

          <router-link
            to="/reviews"
            class="mobile-nav-link"
            @click="closeMobileMenu"
          >
            <MessageSquare class="h-4 w-4" />
            <span>Avis</span>
          </router-link>

          <!-- Authenticated User Links -->
          <template v-if="authStore.isAuthenticated">
            <div class="border-t border-gray-200 padding-t-lg mt-4">
              <router-link
                to="/dashboard"
                class="mobile-nav-link"
                @click="closeMobileMenu"
              >
                <BarChart3 class="h-4 w-4" />
                <span>Dashboard</span>
              </router-link>

              <router-link
                v-if="authStore.isConsumer"
                to="/surprise-baskets"
                class="mobile-nav-link"
                @click="closeMobileMenu"
              >
                <Gift class="h-4 w-4" />
                <span>Paniers surprise</span>
              </router-link>

              <router-link
                to="/reservations"
                class="mobile-nav-link"
                @click="closeMobileMenu"
              >
                <Calendar class="h-4 w-4" />
                <span>Mes Réservations</span>
              </router-link>

              <router-link
                to="/profile"
                class="mobile-nav-link"
                @click="closeMobileMenu"
              >
                <User class="h-4 w-4" />
                <span>Mon Profil</span>
              </router-link>

              <!-- Role-specific links -->
              <template v-if="authStore.user?.role === 'merchant'">
                <div class="border-t border-gray-200 padding-t-lg mt-4">
                  <p class="text-sm font-medium text-gray-500 uppercase tracking-wider mt-2">
                    Espace Commerçant
                  </p>
                  <router-link
                    to="/merchant/products"
                    class="mobile-nav-link"
                    @click="closeMobileMenu"
                  >
                    <Briefcase class="h-4 w-4" />
                    <span>Mes Produits</span>
                  </router-link>
                  <router-link
                    to="/merchant/reservations"
                    class="mobile-nav-link"
                    @click="closeMobileMenu"
                  >
                    <ShoppingCart class="h-4 w-4" />
                    <span>Réservations Reçues</span>
                  </router-link>
                  <router-link
                    to="/merchant/reviews"
                    class="mobile-nav-link"
                    @click="closeMobileMenu"
                  >
                    <Star class="h-4 w-4" />
                    <span>Avis Clients</span>
                  </router-link>
                </div>
              </template>

              <template v-if="authStore.user?.role === 'admin'">
                <div class="border-t border-gray-200 padding-t-lg mt-4">
                  <p class="text-sm font-medium text-gray-500 uppercase tracking-wider mt-2">
                    Administration
                  </p>
                  <router-link
                    to="/admin/dashboard"
                    class="mobile-nav-link"
                    @click="closeMobileMenu"
                  >
                    <Settings class="h-4 w-4" />
                    <span>Admin Dashboard</span>
                  </router-link>
                  <router-link
                    to="/admin/users"
                    class="mobile-nav-link"
                    @click="closeMobileMenu"
                  >
                    <Users class="h-4 w-4" />
                    <span>Gestion Utilisateurs</span>
                  </router-link>
                  <router-link
                    to="/admin/categories"
                    class="mobile-nav-link"
                    @click="closeMobileMenu"
                  >
                    <Grid class="h-4 w-4" />
                    <span>Catégories</span>
                  </router-link>
                </div>
              </template>
            </div>

            <!-- Logout Button -->
            <div class="border-t border-gray-200 padding-t-lg mt-4">
              <button
                class="mobile-nav-link text-red-600 hover:bg-red-50"
                @click="handleLogout"
              >
                <LogOut class="h-4 w-4" />
                <span>Se Déconnecter</span>
              </button>
            </div>
          </template>

          <!-- Guest Links -->
          <template v-else>
            <div class="border-t border-gray-200 padding-t-lg mt-4">
              <router-link
                to="/auth/login"
                class="mobile-nav-link"
                @click="closeMobileMenu"
              >
                <LogIn class="h-4 w-4" />
                <span>Se Connecter</span>
              </router-link>
              <router-link
                to="/auth/register"
                class="mobile-nav-link bg-blue-50 text-blue-900 border border-blue-200"
                @click="closeMobileMenu"
              >
                <UserPlus class="h-4 w-4" />
                <span>S'Inscrire</span>
              </router-link>
            </div>
          </template>
        </nav>

        <!-- App Info -->
        <div class="relative sm:absolute bottom-0 left-0 right-0 p-4 bg-gray-50 border-t border-gray-200">
          <p class="text-xs text-gray-500 text-left sm:text-center">
            Antigaspi © 2025<br>
            Lutter contre le gaspillage alimentaire
          </p>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import {
  X, Package, MapPin, MessageSquare, BarChart3, Calendar, User,
  Briefcase, ShoppingCart, Star, Settings, Users, Grid, LogOut,
  LogIn, UserPlus, Gift
} from 'lucide-vue-next'

const router = useRouter()
const authStore = useAuthStore()

const mobileMenuOpen = ref(false)

const toggleMobileMenu = () => {
  mobileMenuOpen.value = !mobileMenuOpen.value
}

const closeMobileMenu = () => {
  mobileMenuOpen.value = false
}

const handleLogout = async () => {
  await authStore.logout()
  closeMobileMenu()
  router.push('/')
}

const getRoleLabel = (role?: string) => {
  switch (role) {
    case 'admin': return 'Administrateur'
    case 'merchant': return 'Commerçant'
    case 'consumer': return 'Consommateur'
    default: return 'Utilisateur'
  }
}

const getRoleBadgeClasses = (role?: string) => {
  switch (role) {
    case 'admin': return 'bg-blue-100 text-blue-800'
    case 'merchant': return 'bg-green-100 text-green-800'
    case 'consumer': return 'bg-blue-100 text-gray-800'
    default: return 'bg-gray-50-100 text-surface-800'
  }
}

// Close menu when route changes
router.afterEach(() => {
  closeMobileMenu()
})
</script>

<style scoped>
.mobile-nav-link {
  @apply flex items-center space-x-3 px-3 py-3 rounded text-surface-700 hover:bg-gray-50-100 hover:text-surface-900 transition-colors font-medium;
}

.mobile-nav-link.router-link-active {
  @apply bg-blue-100 text-blue-900 border border-blue-200;
}
</style>
