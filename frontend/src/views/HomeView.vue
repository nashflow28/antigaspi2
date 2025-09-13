<template>
  <div class="min-h-screen">
    <!-- Hero Section -->
    <section class="bg-gradient-to-br from-primary-600 to-primary-800 text-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div class="text-center">
          <h1 class="text-4xl md:text-6xl font-bold mb-6">
            Réduisez le gaspillage alimentaire
          </h1>
          <p class="text-xl md:text-2xl mb-8 text-primary-100">
            Connecte commerçants et consommateurs pour économiser et protéger l'environnement
          </p>
          <div class="space-x-4">
            <router-link
              to="/products"
              class="btn bg-white text-primary-600 hover:bg-gray-100 text-lg px-8 py-3"
            >
              Découvrir les produits
            </router-link>
            <router-link
              v-if="!authStore.isAuthenticated"
              to="/register"
              class="btn bg-primary-500 hover:bg-primary-400 text-lg px-8 py-3"
            >
              Rejoindre maintenant
            </router-link>
          </div>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section class="py-20 bg-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-16">
          <h2 class="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Comment ça marche ?
          </h2>
          <p class="text-xl text-gray-600">
            Simple, efficace et écologique
          </p>
        </div>

        <div class="grid md:grid-cols-3 gap-8">
          <div class="text-center">
            <div class="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span class="text-2xl">🛒</span>
            </div>
            <h3 class="text-xl font-semibold mb-2">Découvrez</h3>
            <p class="text-gray-600">
              Parcourez les produits à prix réduit des commerçants près de chez vous
            </p>
          </div>

          <div class="text-center">
            <div class="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span class="text-2xl">📱</span>
            </div>
            <h3 class="text-xl font-semibold mb-2">Réservez</h3>
            <p class="text-gray-600">
              Réservez vos produits en quelques clics et économisez jusqu'à 50%
            </p>
          </div>

          <div class="text-center">
            <div class="w-16 h-16 bg-warning-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span class="text-2xl">🌍</span>
            </div>
            <h3 class="text-xl font-semibold mb-2">Sauvez</h3>
            <p class="text-gray-600">
              Récupérez vos produits et contribuez à la réduction du gaspillage
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Stats Section -->
    <section class="py-20 bg-gray-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-16">
          <h2 class="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Notre impact
          </h2>
        </div>

        <div class="grid md:grid-cols-3 gap-8 text-center">
          <div>
            <div class="text-4xl md:text-5xl font-bold text-primary-600 mb-2">
              1,234
            </div>
            <p class="text-xl text-gray-600">Produits sauvés</p>
          </div>

          <div>
            <div class="text-4xl md:text-5xl font-bold text-success-600 mb-2">
              567
            </div>
            <p class="text-xl text-gray-600">Utilisateurs actifs</p>
          </div>

          <div>
            <div class="text-4xl md:text-5xl font-bold text-warning-600 mb-2">
              89
            </div>
            <p class="text-xl text-gray-600">Commerçants partenaires</p>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="py-20 bg-primary-600 text-white">
      <div class="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
        <h2 class="text-3xl md:text-4xl font-bold mb-6">
          Prêt à faire la différence ?
        </h2>
        <p class="text-xl mb-8 text-primary-100">
          Rejoignez notre communauté et commencez à économiser tout en protégeant l'environnement
        </p>

        <template v-if="!authStore.isAuthenticated">
          <div class="space-x-4">
            <router-link
              to="/register"
              class="btn bg-white text-primary-600 hover:bg-gray-100 text-lg px-8 py-3"
            >
              Consommateur
            </router-link>
            <router-link
              to="/register"
              class="btn bg-primary-500 hover:bg-primary-400 text-lg px-8 py-3"
            >
              Commerçant
            </router-link>
          </div>
        </template>

        <template v-else>
          <router-link
            to="/dashboard"
            class="btn bg-white text-primary-600 hover:bg-gray-100 text-lg px-8 py-3"
          >
            Accéder à mon tableau de bord
          </router-link>
        </template>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
</script>