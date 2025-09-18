<template>
  <!-- Mobile Menu Button -->
  <button
    @click="toggleMobileMenu"
    class="md:hidden relative p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 transition-colors"
    :class="{ 'text-primary-600': mobileMenuOpen }"
  >
    <span class="sr-only">Ouvrir le menu</span>
    <div class="w-6 h-6 relative">
      <!-- Hamburger lines -->
      <span
        class="absolute block h-0.5 w-6 bg-current transform transition duration-300 ease-in-out"
        :class="mobileMenuOpen ? 'rotate-45 translate-y-2.5' : 'translate-y-0'"
      ></span>
      <span
        class="absolute block h-0.5 w-6 bg-current transform transition duration-300 ease-in-out translate-y-2.5"
        :class="mobileMenuOpen ? 'opacity-0' : 'opacity-100'"
      ></span>
      <span
        class="absolute block h-0.5 w-6 bg-current transform transition duration-300 ease-in-out translate-y-5"
        :class="mobileMenuOpen ? '-rotate-45 -translate-y-2.5' : 'translate-y-0'"
      ></span>
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
        @click="closeMobileMenu"
        class="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
      ></div>
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
        class="fixed right-0 top-0 h-full w-80 bg-white shadow-2xl z-50 md:hidden overflow-y-auto"
      >
        <!-- Mobile menu header -->
        <div class="flex items-center justify-between p-4 border-b border-gray-200">
          <div class="flex items-center space-x-3">
            <div class="w-8 h-8 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
              <span class="text-white text-lg">🌱</span>
            </div>
            <span class="text-lg font-semibold text-gray-900">Antigaspi</span>
          </div>
          <button
            @click="closeMobileMenu"
            class="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- User Profile Section (if authenticated) -->
        <div v-if="authStore.isAuthenticated" class="p-4 bg-gray-50 border-b border-gray-200">
          <div class="flex items-center space-x-3">
            <div class="w-12 h-12 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
              <span class="text-white font-medium text-lg">
                {{ authStore.user?.first_name?.charAt(0) }}{{ authStore.user?.last_name?.charAt(0) }}
              </span>
            </div>
            <div>
              <p class="font-medium text-gray-900">
                {{ authStore.user?.first_name }} {{ authStore.user?.last_name }}
              </p>
              <p class="text-sm text-gray-500">{{ authStore.user?.email }}</p>
              <span
                class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                :class="getRoleBadgeClasses(authStore.user?.role)"
              >
                {{ getRoleLabel(authStore.user?.role) }}
              </span>
            </div>
          </div>
        </div>

        <!-- Navigation Links -->
        <nav class="p-4 space-y-2">
          <!-- Public Links -->
          <router-link
            to="/products"
            @click="closeMobileMenu"
            class="mobile-nav-link"
          >
            <Package class="w-5 h-5" />
            <span>Produits</span>
          </router-link>

          <router-link
            to="/merchants/map"
            @click="closeMobileMenu"
            class="mobile-nav-link"
          >
            <MapPin class="w-5 h-5" />
            <span>Carte des Commerçants</span>
          </router-link>

          <router-link
            to="/reviews"
            @click="closeMobileMenu"
            class="mobile-nav-link"
          >
            <MessageSquare class="w-5 h-5" />
            <span>Avis</span>
          </router-link>

          <!-- Authenticated User Links -->
          <template v-if="authStore.isAuthenticated">
            <div class="border-t border-gray-200 pt-4 mt-4">
              <router-link
                to="/dashboard"
                @click="closeMobileMenu"
                class="mobile-nav-link"
              >
                <BarChart3 class="w-5 h-5" />
                <span>Dashboard</span>
              </router-link>

              <router-link
                to="/reservations"
                @click="closeMobileMenu"
                class="mobile-nav-link"
              >
                <Calendar class="w-5 h-5" />
                <span>Mes Réservations</span>
              </router-link>

              <router-link
                to="/profile"
                @click="closeMobileMenu"
                class="mobile-nav-link"
              >
                <User class="w-5 h-5" />
                <span>Mon Profil</span>
              </router-link>

              <!-- Role-specific links -->
              <template v-if="authStore.user?.role === 'merchant'">
                <div class="border-t border-gray-200 pt-4 mt-4">
                  <p class="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">
                    Espace Commerçant
                  </p>
                  <router-link
                    to="/merchant/products"
                    @click="closeMobileMenu"
                    class="mobile-nav-link"
                  >
                    <Briefcase class="w-5 h-5" />
                    <span>Mes Produits</span>
                  </router-link>
                  <router-link
                    to="/merchant/reservations"
                    @click="closeMobileMenu"
                    class="mobile-nav-link"
                  >
                    <ShoppingCart class="w-5 h-5" />
                    <span>Réservations Reçues</span>
                  </router-link>
                  <router-link
                    to="/merchant/reviews"
                    @click="closeMobileMenu"
                    class="mobile-nav-link"
                  >
                    <Star class="w-5 h-5" />
                    <span>Avis Clients</span>
                  </router-link>
                </div>
              </template>

              <template v-if="authStore.user?.role === 'admin'">
                <div class="border-t border-gray-200 pt-4 mt-4">
                  <p class="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">
                    Administration
                  </p>
                  <router-link
                    to="/admin/dashboard"
                    @click="closeMobileMenu"
                    class="mobile-nav-link"
                  >
                    <Settings class="w-5 h-5" />
                    <span>Admin Dashboard</span>
                  </router-link>
                  <router-link
                    to="/admin/users"
                    @click="closeMobileMenu"
                    class="mobile-nav-link"
                  >
                    <Users class="w-5 h-5" />
                    <span>Gestion Utilisateurs</span>
                  </router-link>
                  <router-link
                    to="/admin/categories"
                    @click="closeMobileMenu"
                    class="mobile-nav-link"
                  >
                    <Grid class="w-5 h-5" />
                    <span>Catégories</span>
                  </router-link>
                </div>
              </template>
            </div>

            <!-- Logout Button -->
            <div class="border-t border-gray-200 pt-4 mt-4">
              <button
                @click="handleLogout"
                class="mobile-nav-link text-red-600 hover:bg-red-50"
              >
                <LogOut class="w-5 h-5" />
                <span>Se Déconnecter</span>
              </button>
            </div>
          </template>

          <!-- Guest Links -->
          <template v-else>
            <div class="border-t border-gray-200 pt-4 mt-4">
              <router-link
                to="/auth/login"
                @click="closeMobileMenu"
                class="mobile-nav-link"
              >
                <LogIn class="w-5 h-5" />
                <span>Se Connecter</span>
              </router-link>
              <router-link
                to="/auth/register"
                @click="closeMobileMenu"
                class="mobile-nav-link bg-primary-50 text-primary-700 border border-primary-200"
              >
                <UserPlus class="w-5 h-5" />
                <span>S'Inscrire</span>
              </router-link>
            </div>
          </template>
        </nav>

        <!-- App Info -->
        <div class="absolute bottom-0 left-0 right-0 p-4 bg-gray-50 border-t border-gray-200">
          <p class="text-xs text-gray-500 text-center">
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
  LogIn, UserPlus
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
    case 'admin': return 'bg-purple-100 text-purple-800'
    case 'merchant': return 'bg-green-100 text-green-800'
    case 'consumer': return 'bg-blue-100 text-blue-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

// Close menu when route changes
router.afterEach(() => {
  closeMobileMenu()
})
</script>

<style scoped>
.mobile-nav-link {
  @apply flex items-center space-x-3 px-3 py-3 rounded-lg text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors font-medium;
}

.mobile-nav-link.router-link-active {
  @apply bg-primary-100 text-primary-700 border border-primary-200;
}
</style>