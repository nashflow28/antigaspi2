<template>
  <header class="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-40" role="banner">
    <div class="max-w-md mx-auto px-4">
      <div class="flex items-center justify-between h-16">
        <!-- Logo et titre -->
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center">
            <span class="text-white text-lg font-bold">🌱</span>
          </div>
          <div class="flex flex-col">
            <h1 class="text-lg font-bold text-gray-900">
              {{ pageTitle || 'Antigaspi' }}
            </h1>
            <p v-if="subtitle" class="text-xs text-gray-500">
              {{ subtitle }}
            </p>
          </div>
        </div>

        <!-- Actions à droite -->
        <div class="flex items-center gap-2">
          <!-- Bouton de recherche -->
          <button
            v-if="showSearch"
            @click="$emit('searchClick')"
            class="p-2 rounded-xl text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            aria-label="Rechercher"
          >
            🔍
          </button>

          <!-- Bouton notifications -->
          <button
            @click="$emit('notificationsClick')"
            class="relative p-2 rounded-xl text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            aria-label="Notifications"
          >
            🔔
            <div
              v-if="notificationsCount > 0"
              class="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1"
            >
              {{ notificationsCount > 99 ? '99+' : notificationsCount }}
            </div>
          </button>

          <!-- Bouton panier -->
          <button
            @click="$emit('cartClick')"
            class="relative p-2 rounded-xl text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            aria-label="Panier"
          >
            🛒
            <div
              v-if="cartItemsCount > 0"
              class="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1"
            >
              {{ cartItemsCount }}
            </div>
          </button>

          <!-- Menu utilisateur ou login -->
          <button
            v-if="isAuthenticated"
            @click="toggleUserMenu"
            class="p-1 rounded-xl hover:bg-blue-50 transition-colors"
          >
            <div class="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span class="text-white text-sm font-medium">
                {{ userInitials }}
              </span>
            </div>
          </button>
          <button
            v-else
            @click="$emit('loginClick')"
            class="p-2 rounded-xl text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            aria-label="Se connecter"
          >
            👤
          </button>
        </div>
      </div>
    </div>

    <!-- Menu utilisateur dropdown (simple) -->
    <div
      v-if="userMenuOpen && isAuthenticated"
      @click="closeUserMenu"
      class="fixed inset-0 z-50"
    >
      <div class="absolute inset-0 bg-black bg-opacity-20"></div>
      <div
        @click.stop
        class="absolute top-20 right-4 bg-white rounded-xl shadow-lg border p-4 min-w-[200px]"
      >
        <p class="font-medium text-gray-900 text-sm mb-2">{{ userName }}</p>
        <button
          @click="$emit('logout')"
          class="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
        >
          Se déconnecter
        </button>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

// Props
interface Props {
  pageTitle?: string
  subtitle?: string
  showSearch?: boolean
  notificationsCount?: number
  cartItemsCount?: number
  isAuthenticated?: boolean
  userName?: string
  userEmail?: string
  userAvatar?: string
}

const props = withDefaults(defineProps<Props>(), {
  pageTitle: 'Antigaspi',
  subtitle: '',
  showSearch: true,
  notificationsCount: 0,
  cartItemsCount: 0,
  isAuthenticated: false,
  userName: '',
  userEmail: '',
  userAvatar: ''
})

// State
const userMenuOpen = ref(false)

// Computed
const userInitials = computed(() => {
  if (!props.userName) return 'U'
  const names = props.userName.split(' ')
  if (names.length >= 2) {
    return `${names[0][0]}${names[1][0]}`.toUpperCase()
  }
  return names[0][0].toUpperCase()
})

// Emits
const emit = defineEmits<{
  searchClick: []
  notificationsClick: []
  cartClick: []
  loginClick: []
  logout: []
}>()

// Methods
const toggleUserMenu = () => {
  userMenuOpen.value = !userMenuOpen.value
}

const closeUserMenu = () => {
  userMenuOpen.value = false
}
</script>