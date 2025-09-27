<template>
  <div class="min-h-screen bg-gray-50">
    <!-- TopBar intégrée directement -->
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
                Antigaspi
              </h1>
              <p class="text-xs text-gray-500">
                TopBar Test
              </p>
            </div>
          </div>

          <!-- Actions à droite -->
          <div class="flex items-center gap-2">
            <!-- Bouton de recherche -->
            <button
              class="p-2 rounded-xl text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
              aria-label="Rechercher"
              @click="handleSearch"
            >
              🔍
            </button>

            <!-- Bouton notifications -->
            <button
              class="relative p-2 rounded-xl text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
              aria-label="Notifications"
              @click="handleNotifications"
            >
              🔔
              <div class="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                3
              </div>
            </button>

            <!-- Bouton panier -->
            <button
              class="relative p-2 rounded-xl text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
              aria-label="Panier"
              @click="handleCart"
            >
              🛒
              <div class="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                2
              </div>
            </button>

            <!-- Bouton utilisateur -->
            <button
              class="p-1 rounded-xl hover:bg-blue-50 transition-colors"
              @click="handleUser"
            >
              <div class="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span class="text-white text-sm font-medium">U</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- Main content avec padding pour la TopBar -->
    <main class="pt-16 p-4">
      <div class="bg-white rounded-lg shadow p-6 mb-4">
        <h2 class="text-xl font-bold text-gray-900 mb-4">
          🎯 TopBar Test Standalone
        </h2>

        <div class="space-y-3">
          <p class="text-green-600">✅ TopBar intégrée directement</p>
          <p class="text-green-600">✅ Émojis comme icônes</p>
          <p class="text-green-600">✅ Badges de notification</p>
          <p class="text-green-600">✅ Boutons interactifs</p>
          <p class="text-green-600">✅ Responsive design</p>
        </div>

        <div class="mt-6 grid grid-cols-2 gap-4">
          <div class="bg-blue-50 p-4 rounded-lg">
            <h3 class="font-medium text-blue-900 mb-2">Actions TopBar</h3>
            <div class="space-y-2 text-sm">
              <div>🔍 Recherche: {{ searchClicks }} clics</div>
              <div>🔔 Notifications: {{ notificationClicks }} clics</div>
              <div>🛒 Panier: {{ cartClicks }} clics</div>
              <div>👤 Utilisateur: {{ userClicks }} clics</div>
            </div>
          </div>

          <div class="bg-green-50 p-4 rounded-lg">
            <h3 class="font-medium text-green-900 mb-2">Navigation</h3>
            <div class="space-y-2">
              <router-link
                to="/"
                class="block text-blue-600 hover:text-blue-800 underline text-sm"
              >
                → Retour à l'accueil
              </router-link>
              <router-link
                to="/onboarding"
                class="block text-blue-600 hover:text-blue-800 underline text-sm"
              >
                → Onboarding
              </router-link>
              <router-link
                to="/gaspiz-demo"
                class="block text-blue-600 hover:text-blue-800 underline text-sm"
              >
                → Gaspiz Demo
              </router-link>
            </div>
          </div>
        </div>
      </div>

      <!-- Test d'interactivité -->
      <div class="bg-purple-50 rounded-lg p-4">
        <h3 class="font-medium text-purple-900 mb-2">Test d'interactivité</h3>
        <button
          class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md transition-colors"
          @click="counter++"
        >
          Compteur: {{ counter }}
        </button>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

// Reactive state
const counter = ref(0)
const searchClicks = ref(0)
const notificationClicks = ref(0)
const cartClicks = ref(0)
const userClicks = ref(0)

// Event handlers
const handleSearch = () => {
  searchClicks.value++
  console.log('🔍 Recherche cliquée')
}

const handleNotifications = () => {
  notificationClicks.value++
  console.log('🔔 Notifications cliquées')
}

const handleCart = () => {
  cartClicks.value++
  console.log('🛒 Panier cliqué')
}

const handleUser = () => {
  userClicks.value++
  console.log('👤 Utilisateur cliqué')
}
</script>
