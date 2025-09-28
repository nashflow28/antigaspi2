<template>
  <div
    class="min-h-screen bg-gradient-to-br from-gray-50 via-primary-50/30 to-blue-500/10 flex items-center py-16 sm:py-16 lg:py-16"
  >
    <div class="container px-3 sm:px-4 lg:px-6">
      <div
        class="mx-auto max-w-6xl rounded-3xl border border-gray-200/70 bg-gray-100/95 p-12 text-left sm:text-center shadow-lg backdrop-blur-xl"
      >
        <!-- 404 Illustration -->
        <div class="mb-10">
          <div class="relative">
            <!-- Background circle -->
            <div
              class="mx-auto flex h-9xl w-96 items-center justify-center overflow-hidden sm:block rounded-full bg-gradient-to-br from-blue-100 to-blue-500/10"
            >
              <!-- Animated background pattern -->
              <div class="relative sm:absolute inset-0 opacity-10">
                <div class="relative sm:absolute top-4 left-8 h-8 w-8 animate-pulse rounded-full bg-blue-300" />
                <div
                  class="relative sm:absolute bottom-8 right-12 h-8 w-8 animate-pulse rounded-full bg-blue-500/20"
                  style="animation-delay: 0.5s"
                />
                <div
                  class="relative sm:absolute top-16 right-6 h-4 w-4 animate-pulse rounded-full bg-orange-500/30"
                  style="animation-delay: 1s"
                />
                <div
                  class="relative sm:absolute bottom-16 left-16 h-4 w-4 animate-pulse rounded-full bg-blue-300"
                  style="animation-delay: 1.5s"
                />
              </div>

              <!-- Main 404 Icon -->
              <div class="z-10 text-left sm:text-center">
                <div class="mt-2 text-8xl font-semibold text-blue-500">404</div>
                <Frown class="mx-auto icon-xl text-blue-600 animate-bounce" />
              </div>
            </div>
          </div>
        </div>

        <!-- Error Message -->
        <div class="space-y-4">
          <h1 class="text-xl font-semibold text-gray-900 lg:text-3xl">
            Page introuvable
          </h1>
          <p class="text-lg text-gray-700">
            Oups ! La page que vous cherchez n'existe pas ou a été déplacée.
          </p>
          <p class="text-sm text-gray-500">
            Peut-être avez-vous tapé une mauvaise adresse ou suivi un lien obsolète ?
          </p>
        </div>

        <!-- Action Buttons -->
        <div class="mt-8 space-y-6">
          <div class="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              variant="outline"
              size="lg"
              class="justify-center"
              :left-icon="ArrowLeft"
              @click="goBack"
            >
              Retour
            </Button>

            <Button
              variant="primary"
              size="lg"
              tag="router-link"
              to="/"
              class="justify-center"
              :left-icon="Home"
            >
              Accueil
            </Button>
          </div>

          <!-- Quick Links -->
          <div class="rounded border border-gray-200/70 bg-white/60 p-6 shadow-inner">
            <p class="mt-3 text-sm font-medium text-gray-700">
              Ou essayez ces liens populaires :
            </p>
            <div class="flex flex-wrap justify-center gap-3">
              <Button
                tag="router-link"
                to="/products"
                variant="ghost"
                size="sm"
                class="text-blue-600 transition-colors hover:bg-blue-50 hover:text-blue-900"
                :left-icon="ShoppingBag"
              >
                Catalogue
              </Button>
              <Button
                tag="router-link"
                to="/dashboard"
                variant="ghost"
                size="sm"
                class="text-blue-600 transition-colors hover:bg-blue-50 hover:text-blue-900"
                :left-icon="BarChart3"
              >
                Tableau de bord
              </Button>
              <Button
                tag="router-link"
                to="/profile"
                variant="ghost"
                size="sm"
                class="text-blue-600 transition-colors hover:bg-blue-50 hover:text-blue-900"
                :left-icon="User"
              >
                Profil
              </Button>
            </div>
          </div>
        </div>

        <!-- Help Section -->
        <div class="spacing-xs2 rounded border border-blue-500/20 bg-blue-500/10 p-4 sm:p-6 lg:p-12 text-left">
          <div class="flex items-stretch sm:items-start gap-3">
            <div class="flex h-8 w-8 items-center justify-center rounded bg-white/80 shadow-lg">
              <Info class="h-4 w-4 text-blue-500" />
            </div>
            <div class="space-y-2">
              <h3 class="text-lg font-semibold text-blue-500">
                Besoin d'aide ?
              </h3>
              <p class="text-sm text-blue-500/80">
                Si vous pensez qu'il s'agit d'une erreur, n'hésitez pas à nous contacter.
              </p>
              <div class="flex flex-col gap-2 sm:flex-row">
                <Button
                  tag="a"
                  href="mailto:support@antigaspi.fr"
                  variant="ghost"
                  size="sm"
                  class="justify-start text-blue-500 transition-colors hover:bg-white/80 hover:text-blue-500"
                  :left-icon="Mail"
                >
                  Support
                </Button>
                <Button
                  tag="a"
                  href="tel:+33123456789"
                  variant="ghost"
                  size="sm"
                  class="justify-start text-blue-500 transition-colors hover:bg-white/80 hover:text-blue-500"
                  :left-icon="Phone"
                >
                  Nous appeler
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import {
  ArrowLeft,
  Home,
  ShoppingBag,
  BarChart3,
  User,
  Info,
  Mail,
  Phone,
  Frown
} from 'lucide-vue-next'

import Button from '@/components/ui/2025/Button.vue'

const router = useRouter()

const goBack = () => {
  if (window.history.length > 1) {
    router.go(-1)
  } else {
    router.push('/')
  }
}
</script>

<style scoped>
@keyframes float {
  0%,
  100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-20px);
  }
}

.animate-float {
  animation: float 3s ease-in-out infinite;
}

/* Custom animations for the background dots */
@keyframes pulse {
  0%,
  100% {
    opacity: 0.4;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.1);
  }
}
</style>
