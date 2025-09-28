<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-8 sm:py-12 lg:py-16 px-3 sm:px-4 lg:px-6">
    <div class="max-w-xl w-full space-y-8">
      <!-- Header -->
      <div class="text-left sm:text-center">
        <router-link to="/" class="inline-flex items-center space-y-4 sm:space-x-2 text-blue-600 hover:text-blue-500">
          <span class="text-xl">🥬</span>
          <span class="text-xl font-semibold">Antigaspi</span>
        </router-link>
        <h2 class="mt-6 text-xl font-extrabold text-gray-900">
          Connexion
        </h2>
        <p class="mt-2 text-sm text-gray-700">
          Connectez-vous à votre compte pour continuer
        </p>
      </div>

      <!-- Login Form -->
      <Card>
        <LoginForm />
      </Card>

      <!-- Additional Links -->
      <div class="text-left sm:text-center">
        <router-link
          to="/"
          class="text-sm text-gray-500 hover:text-gray-800 underline"
        >
          ← Retour à l'accueil
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import LoginForm from '@/components/forms/LoginForm.vue'
import Card from '@/components/ui/2025/Card.vue'
</script>
