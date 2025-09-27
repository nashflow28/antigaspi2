<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-2xl w-full space-y-8">
      <!-- Header -->
      <div class="text-center">
        <router-link to="/" class="inline-flex items-center space-x-2 text-primary-600 hover:text-primary-500">
          <span class="text-3xl">🥬</span>
          <span class="text-2xl font-bold">Antigaspi</span>
        </router-link>
        <h2 class="mt-6 text-3xl font-extrabold text-gray-900">
          Inscription
        </h2>
        <p class="mt-2 text-sm text-gray-600">
          Rejoignez la communauté Antigaspi et contribuez à réduire le gaspillage alimentaire
        </p>
      </div>

      <!-- Register Form -->
      <Card>
        <RegisterForm />
      </Card>

      <!-- Additional Links -->
      <div class="text-center">
        <router-link
          to="/"
          class="text-sm text-gray-500 hover:text-gray-700 underline"
        >
          ← Retour à l'accueil
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import RegisterForm from '@/components/forms/RegisterForm.vue'
import Card from '@/components/ui/2025/Card.vue'
</script>
