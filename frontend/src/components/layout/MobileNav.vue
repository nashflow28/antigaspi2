<template>
  <!-- Mobile Menu Button -->
  <button
    class="md:hidden relative p-2 rounded-lg text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 transition-colors"
    :class="{ 'text-primary-600': mobileMenuOpen }"
    @click="toggleMobileMenu"
  >
    <span class="sr-only">Ouvrir le menu</span>
    <div class="w-6 h-6 relative">
      <!-- Hamburger lines -->
      <span
        class="absolute block h-0.5 w-6 bg-current transform transition duration-300 ease-in-out"
        :class="mobileMenuOpen ? 'rotate-45 translate-y-2.5' : 'translate-y-0'"
      />
      <span
        class="absolute block h-0.5 w-6 bg-current transform transition duration-300 ease-in-out translate-y-2.5"
        :class="mobileMenuOpen ? 'opacity-0' : 'opacity-100'"
      />
      <span
        class="absolute block h-0.5 w-6 bg-current transform transition duration-300 ease-in-out translate-y-5"
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
        class="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
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
        class="fixed right-0 top-0 h-full w-80 bg-white shadow-2xl z-50 md:hidden overflow-y-auto"
      >
        <!-- Mobile menu header -->
        <div class="flex items-center justify-between p-4 border-b border-neutral-200">
          <div class="flex items-center space-x-3">
            <div class="w-8 h-8 bg-gradient-to-r from-primary-500 to-accent-blue/50 rounded-lg flex items-center justify-center">
              <span class="text-white text-responsive-lg">🌱</span>
            </div>
            <span class="text-responsive-lg font-semibold text-neutral-900 font-display">Antigaspi</span>
          </div>
          <button
            class="p-2 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors"
            @click="closeMobileMenu"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- User Profile Section (if authenticated) -->
        <div v-if="authStore.isAuthenticated" class="p-4 bg-neutral-50 border-b border-neutral-200">
          <div class="flex items-center space-x-3">
            <div class="w-12 h-12 bg-gradient-to-r from-primary-500 to-accent-blue/50 rounded-full flex items-center justify-center">
              <span class="text-white font-medium text-responsive-lg">
                {{ authStore.user?.first_name?.charAt(0) }}{{ authStore.user?.last_name?.charAt(0) }}
              </span>
            </div>
            <div>
              <p class="font-medium text-neutral-900 font-heading">
                {{ authStore.user?.first_name }} {{ authStore.user?.last_name }}
              </p>
              <p class="text-responsive-sm text-neutral-500">{{ authStore.user?.email }}</p>
              <span
                class="inline-flex items-center px-2 py-0.5 rounded text-responsive-xs font-medium"
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
            class="mobile-nav-link"
            @click="closeMobileMenu"
          >
            <Package class="w-5 h-5" />
            <span>Produits</span>
          </router-link>

          <router-link
            to="/surprise-baskets"
            class="mobile-nav-link"
            @click="closeMobileMenu"
          >
            <Gift class="w-5 h-5" />
            <span>Paniers surprise</span>
          </router-link>

          <router-link
            to="/merchants/map"
            class="mobile-nav-link"
            @click="closeMobileMenu"
          >
            <MapPin class="w-5 h-5" />
            <span>Carte des Commerçants</span>
          </router-link>

          <router-link
            to="/reviews"
            class="mobile-nav-link"
            @click="closeMobileMenu"
          >
            <MessageSquare class="w-5 h-5" />
            <span>Avis</span>
          </router-link>

          <!-- Authenticated User Links -->
          <template v-if="authStore.isAuthenticated">
            <div class="border-t border-neutral-200 pt-4 mt-4">
              <router-link
                to="/dashboard"
                class="mobile-nav-link"
                @click="closeMobileMenu"
              >
                <BarChart3 class="w-5 h-5" />
                <span>Dashboard</span>
              </router-link>

              <router-link
                v-if="authStore.isConsumer"
                to="/surprise-baskets"
                class="mobile-nav-link"
                @click="closeMobileMenu"
              >
                <Gift class="w-5 h-5" />
                <span>Paniers surprise</span>
              </router-link>

              <router-link
                to="/reservations"
                class="mobile-nav-link"
                @click="closeMobileMenu"
              >
                <Calendar class="w-5 h-5" />
                <span>Mes Réservations</span>
              </router-link>

              <router-link
                to="/profile"
                class="mobile-nav-link"
                @click="closeMobileMenu"
              >
                <User class="w-5 h-5" />
                <span>Mon Profil</span>
              </router-link>

              <!-- Role-specific links -->
              <template v-if="authStore.user?.role === 'merchant'">
                <div class="border-t border-neutral-200 pt-4 mt-4">
                  <p class="text-responsive-sm font-medium text-neutral-500 uppercase tracking-wider mb-2">
                    Espace Commerçant
                  </p>
                  <router-link
                    to="/merchant/products"
                    class="mobile-nav-link"
                    @click="closeMobileMenu"
                  >
                    <Briefcase class="w-5 h-5" />
                    <span>Mes Produits</span>
                  </router-link>
                  <router-link
                    to="/merchant/reservations"
                    class="mobile-nav-link"
                    @click="closeMobileMenu"
                  >
                    <ShoppingCart class="w-5 h-5" />
                    <span>Réservations Reçues</span>
                  </router-link>
                  <router-link
                    to="/merchant/reviews"
                    class="mobile-nav-link"
                    @click="closeMobileMenu"
                  >
                    <Star class="w-5 h-5" />
                    <span>Avis Clients</span>
                  </router-link>
                </div>
              </template>

              <template v-if="authStore.user?.role === 'admin'">
                <div class="border-t border-neutral-200 pt-4 mt-4">
                  <p class="text-responsive-sm font-medium text-neutral-500 uppercase tracking-wider mb-2">
                    Administration
                  </p>
                  <router-link
                    to="/admin/dashboard"
                    class="mobile-nav-link"
                    @click="closeMobileMenu"
                  >
                    <Settings class="w-5 h-5" />
                    <span>Admin Dashboard</span>
                  </router-link>
                  <router-link
                    to="/admin/users"
                    class="mobile-nav-link"
                    @click="closeMobileMenu"
                  >
                    <Users class="w-5 h-5" />
                    <span>Gestion Utilisateurs</span>
                  </router-link>
                  <router-link
                    to="/admin/categories"
                    class="mobile-nav-link"
                    @click="closeMobileMenu"
                  >
                    <Grid class="w-5 h-5" />
                    <span>Catégories</span>
                  </router-link>
                </div>
              </template>
            </div>

            <!-- Logout Button -->
            <div class="border-t border-neutral-200 pt-4 mt-4">
              <button
                class="mobile-nav-link text-red-600 hover:bg-red-50"
                @click="handleLogout"
              >
                <LogOut class="w-5 h-5" />
                <span>Se Déconnecter</span>
              </button>
            </div>
          </template>

          <!-- Guest Links -->
          <template v-else>
            <div class="border-t border-neutral-200 pt-4 mt-4">
              <router-link
                to="/auth/login"
                class="mobile-nav-link"
                @click="closeMobileMenu"
              >
                <LogIn class="w-5 h-5" />
                <span>Se Connecter</span>
              </router-link>
              <router-link
                to="/auth/register"
                class="mobile-nav-link bg-primary-50 text-primary-700 border border-primary-200"
                @click="closeMobileMenu"
              >
                <UserPlus class="w-5 h-5" />
                <span>S'Inscrire</span>
              </router-link>
            </div>
          </template>
        </nav>

        <!-- App Info -->
        <div class="absolute bottom-0 left-0 right-0 p-4 bg-neutral-50 border-t border-neutral-200">
          <p class="text-responsive-xs text-neutral-500 text-center">
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
