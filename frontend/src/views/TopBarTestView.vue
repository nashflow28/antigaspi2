<template>
  <div class="min-h-screen bg-neutral-50">
    <!-- TopBar intégrée directement -->
    <header class="fixed top-0 left-0 right-0 bg-white border-b border-neutral-200 z-40" role="banner">
      <div class="max-w-xl mx-auto px-3">
        <div class="flex items-center justify-start sm:justify-between h-10">
          <!-- Logo et titre -->
          <div class="flex items-center gap-3">
            <div class="h-6 w-6 bg-primary-600 rounded flex items-center justify-center">
              <span class="text-white text-lg font-semibold">🌱</span>
            </div>
            <div class="flex flex-col">
              <h1 class="text-lg font-semibold text-neutral-900">
                GÊLADAL
              </h1>
              <p class="text-xs text-neutral-500">
                TopBar Test
              </p>
            </div>
          </div>

          <!-- Actions à droite -->
          <div class="flex items-center gap-2">
            <!-- Bouton de recherche -->
            <button
              class="p-2 rounded text-neutral-700 hover:text-info hover:transition-colors"
              aria-label="Rechercher"
              @click="handleSearch"
            >
              🔍
            </button>

            <!-- Bouton notifications -->
            <button
              class="relative p-2 rounded text-neutral-700 hover:text-info hover:transition-colors"
              aria-label="Notifications"
              @click="handleNotifications"
            >
              🔔
              <div class="relative sm:absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center padding-x-xs">
                3
              </div>
            </button>

            <!-- Bouton panier -->
            <button
              class="relative p-2 rounded text-neutral-700 hover:text-info hover:transition-colors"
              aria-label="Panier"
              @click="handleCart"
            >
              🛒
              <div class="relative sm:absolute -top-1 -right-1 bg-primary-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center padding-x-xs">
                2
              </div>
            </button>

            <!-- Bouton utilisateur -->
            <button
              class="p-1 rounded hover:transition-colors"
              @click="handleUser"
            >
              <div class="h-6 w-6 bg-primary-600 rounded flex items-center justify-center">
                <span class="text-white text-sm font-medium">U</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- Main content avec padding pour la TopBar -->
    <main class="pt-16 p-4">
      <div class="bg-white rounded shadow p-6 mt-3">
        <h2 class="text-xl font-semibold text-neutral-900 mt-3">
          🎯 TopBar Test Standalone
        </h2>

        <div class="space-y-2">
          <p class="text-green-600">✅ TopBar intégrée directement</p>
          <p class="text-green-600">✅ Émojis comme icônes</p>
          <p class="text-green-600">✅ Badges de notification</p>
          <p class="text-green-600">✅ Boutons interactifs</p>
          <p class="text-green-600">✅ Responsive design</p>
        </div>

        <div class="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div class="bg-primary-50 p-4 rounded">
            <h3 class="font-medium text-secondary-900 mt-2">Actions TopBar</h3>
            <div class="space-y-4 text-sm">
              <div>🔍 Recherche: {{ searchClicks }} clics</div>
              <div>🔔 Notifications: {{ notificationClicks }} clics</div>
              <div>🛒 Panier: {{ cartClicks }} clics</div>
              <div>👤 Utilisateur: {{ userClicks }} clics</div>
            </div>
          </div>

          <div class="bg-green-50 p-4 rounded">
            <h3 class="font-medium text-primary-900 mt-2">Navigation</h3>
            <div class="space-y-4">
              <router-link
                to="/"
                class="block text-info hover:text-neutral-800 underline text-sm"
              >
                → Retour à l'accueil
              </router-link>
              <router-link
                to="/onboarding"
                class="block text-info hover:text-neutral-800 underline text-sm"
              >
                → Onboarding
              </router-link>
              <router-link
                to="/gaspiz-demo"
                class="block text-info hover:text-neutral-800 underline text-sm"
              >
                → Gaspiz Demo
              </router-link>
            </div>
          </div>
        </div>
      </div>

      <!-- Test d'interactivité -->
      <div class="bg-purple-50 rounded p-4">
        <h3 class="font-medium text-purple-900 mt-2">Test d'interactivité</h3>
        <button
          class="bg-purple-600 hover:transition-colors"
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
  // console.log('🔍 Recherche cliquée')
}

const handleNotifications = () => {
  notificationClicks.value++
  // console.log('🔔 Notifications cliquées')
}

const handleCart = () => {
  cartClicks.value++
  // console.log('🛒 Panier cliqué')
}

const handleUser = () => {
  userClicks.value++
  // console.log('👤 Utilisateur cliqué')
}
</script>
