<template>
  <div class="min-h-screen flex items-center justify-center bg-neutral-50 py-8 sm:py-10 lg:py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-full sm:max-w-2xl w-full space-y-8">
      <!-- Header -->
      <div class="text-left sm:text-center">
        <router-link to="/" class="inline-flex items-center space-y-2 sm:space-y-0 sm:space-x-2 text-primary hover:text-primary-500">
          <span class="text-responsive-xl">🥬</span>
          <span class="text-responsive-xl font-semibold">Antigaspi</span>
        </router-link>
        <h2 class="mt-6 text-responsive-xl font-extrabold text-heading">
          Inscription
        </h2>
        <p class="mt-2 text-responsive-sm text-body">
          Rejoignez la communauté Antigaspi et contribuez à réduire le gaspillage alimentaire
        </p>
      </div>

      <!-- Register Form -->
      <Card>
        <RegisterForm />
      </Card>

      <!-- Additional Links -->
      <div class="text-left sm:text-center">
        <router-link
          to="/"
          class="text-responsive-sm text-muted hover:text-body-emphasis underline"
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
