<template>
  <nav class="bg-white shadow-lg sticky top-0 z-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between h-16">
        <!-- Logo and brand -->
        <div class="flex items-center">
          <router-link to="/" class="flex items-center max-w-full shrink-0">
            <BrandLogo class="max-w-[9rem] sm:max-w-full" />
          </router-link>
        </div>

        <!-- Desktop Navigation -->
        <div class="hidden md:flex items-center space-x-6">
          <router-link
            to="/products"
            class="text-gray-600 hover:text-primary-600 font-medium"
            active-class="text-primary-600"
          >
            Produits
          </router-link>

          <template v-if="!authStore.isAuthenticated">
            <router-link
              to="/login"
              class="text-gray-600 hover:text-primary-600 font-medium"
            >
              Connexion
            </router-link>
            <router-link
              to="/register"
              class="btn btn-primary"
            >
              S'inscrire
            </router-link>
          </template>

          <template v-else>
            <!-- User menu -->
            <div class="relative" ref="userMenuRef">
              <button
                @click="showUserMenu = !showUserMenu"
                class="flex items-center space-x-2 text-gray-600 hover:text-primary-600"
              >
                <div class="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <span class="text-primary-600 font-semibold text-sm">
                    {{ userInitials }}
                  </span>
                </div>
                <span class="font-medium">{{ authStore.user?.first_name }}</span>
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/>
                </svg>
              </button>

              <!-- Dropdown menu -->
              <div
                v-show="showUserMenu"
                class="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-50"
              >
                <router-link
                  to="/dashboard"
                  class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  @click="showUserMenu = false"
                >
                  Tableau de bord
                </router-link>
                <router-link
                  to="/profile"
                  class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  @click="showUserMenu = false"
                >
                  Mon profil
                </router-link>

                <template v-if="authStore.isConsumer">
                  <router-link
                    to="/reservations"
                    class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    @click="showUserMenu = false"
                  >
                    Mes réservations
                  </router-link>
                </template>

                <template v-if="authStore.isMerchant">
                  <router-link
                    to="/merchant/products"
                    class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    @click="showUserMenu = false"
                  >
                    Mes produits
                  </router-link>
                  <router-link
                    to="/merchant/reservations"
                    class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    @click="showUserMenu = false"
                  >
                    Réservations reçues
                  </router-link>
                </template>

                <template v-if="authStore.isAdmin">
                  <router-link
                    to="/admin/users"
                    class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    @click="showUserMenu = false"
                  >
                    Utilisateurs
                  </router-link>
                  <router-link
                    to="/admin/merchants"
                    class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    @click="showUserMenu = false"
                  >
                    Commerçants
                  </router-link>
                </template>

                <hr class="my-1">
                <button
                  @click="handleLogout"
                  class="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  Se déconnecter
                </button>
              </div>
            </div>
          </template>
        </div>

        <!-- Mobile menu button -->
        <div class="md:hidden flex items-center">
          <button
            @click="showMobileMenu = !showMobileMenu"
            class="text-gray-600 hover:text-primary-600"
          >
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path v-if="!showMobileMenu" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
              <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Mobile Navigation -->
      <div v-show="showMobileMenu" class="md:hidden py-4 border-t border-gray-200">
        <div class="space-y-2">
          <router-link
            to="/products"
            class="block text-gray-600 hover:text-primary-600 font-medium py-2"
            @click="showMobileMenu = false"
          >
            Produits
          </router-link>

          <template v-if="!authStore.isAuthenticated">
            <router-link
              to="/login"
              class="block text-gray-600 hover:text-primary-600 font-medium py-2"
              @click="showMobileMenu = false"
            >
              Connexion
            </router-link>
            <router-link
              to="/register"
              class="block text-primary-600 font-medium py-2"
              @click="showMobileMenu = false"
            >
              S'inscrire
            </router-link>
          </template>

          <template v-else>
            <div class="pt-2 border-t border-gray-200">
              <div class="text-sm text-gray-500 mb-2">
                Connecté en tant que {{ authStore.user?.first_name }}
              </div>
              <router-link
                to="/dashboard"
                class="block text-gray-600 hover:text-primary-600 py-2"
                @click="showMobileMenu = false"
              >
                Tableau de bord
              </router-link>
              <button
                @click="handleLogout"
                class="block w-full text-left text-red-600 hover:text-red-700 py-2"
              >
                Se déconnecter
              </button>
            </div>
          </template>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import BrandLogo from '@/components/ui/BrandLogo.vue'

const router = useRouter()
const authStore = useAuthStore()

const showUserMenu = ref(false)
const showMobileMenu = ref(false)
const userMenuRef = ref<HTMLElement>()

const userInitials = computed(() => {
  if (!authStore.user) return 'U'
  const firstName = authStore.user.first_name
  const lastName = authStore.user.last_name
  return `${firstName[0]}${lastName[0]}`.toUpperCase()
})

const handleLogout = async () => {
  showUserMenu.value = false
  showMobileMenu.value = false
  await authStore.logout()
  router.push('/')
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
