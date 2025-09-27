<template>
  <div
    class="min-h-screen bg-gradient-to-br from-neutral-50 via-primary-50/30 to-accent-blue/10 flex items-center py-12 sm:py-14 lg:py-16"
  >
    <div class="container px-4 sm:px-6 lg:px-8-2025">
      <div
        class="mx-auto max-w-3xl rounded-4xl border border-neutral-200/70 bg-surface-light/95 p-10 text-left sm:text-center shadow-card backdrop-blur-xl"
      >
        <!-- 404 Illustration -->
        <div class="mb-10">
          <div class="relative">
            <!-- Background circle -->
            <div
              class="mx-auto flex h-64 w-64 items-center justify-center overflow-hidden sm:block rounded-full bg-gradient-to-br from-primary-100 to-accent-blue/10"
            >
              <!-- Animated background pattern -->
              <div class="relative sm:absolute inset-0 opacity-10">
                <div class="relative sm:absolute top-4 left-8 h-10 w-10 animate-pulse rounded-full bg-primary-300" />
                <div
                  class="relative sm:absolute bottom-8 right-12 h-10 w-10 animate-pulse rounded-full bg-accent-blue/20"
                  style="animation-delay: 0.5s"
                />
                <div
                  class="relative sm:absolute top-16 right-6 h-5 w-5 animate-pulse rounded-full bg-accent-orange/30"
                  style="animation-delay: 1s"
                />
                <div
                  class="relative sm:absolute bottom-16 left-16 h-5 w-5 animate-pulse rounded-full bg-primary-300"
                  style="animation-delay: 1.5s"
                />
              </div>

              <!-- Main 404 Icon -->
              <div class="z-10 text-left sm:text-center">
                <div class="mb-2 text-8xl font-semibold text-primary-500">404</div>
                <Frown class="mx-auto h-16 w-16 text-primary animate-bounce" />
              </div>
            </div>
          </div>
        </div>

        <!-- Error Message -->
        <div class="space-y-4">
          <h1 class="text-responsive-xl font-semibold text-heading lg:text-display-sm">
            Page introuvable
          </h1>
          <p class="text-responsive-lg text-body">
            Oups ! La page que vous cherchez n'existe pas ou a été déplacée.
          </p>
          <p class="text-responsive-sm text-muted">
            Peut-être avez-vous tapé une mauvaise adresse ou suivi un lien obsolète ?
          </p>
        </div>

        <!-- Action Buttons -->
        <div class="mt-8 space-y-6">
          <div class="flex flex-col items-center justify-center gap-4 sm:flex-row">
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
          <div class="rounded-3xl border border-neutral-200/70 bg-white/60 p-6 shadow-inner">
            <p class="mb-4 text-responsive-sm font-medium text-body">
              Ou essayez ces liens populaires :
            </p>
            <div class="flex flex-wrap justify-center gap-3">
              <Button
                tag="router-link"
                to="/products"
                variant="ghost"
                size="sm"
                class="text-primary transition-colors hover:bg-primary-50 hover:text-primary-emphasis"
                :left-icon="ShoppingBag"
              >
                Catalogue
              </Button>
              <Button
                tag="router-link"
                to="/dashboard"
                variant="ghost"
                size="sm"
                class="text-primary transition-colors hover:bg-primary-50 hover:text-primary-emphasis"
                :left-icon="BarChart3"
              >
                Tableau de bord
              </Button>
              <Button
                tag="router-link"
                to="/profile"
                variant="ghost"
                size="sm"
                class="text-primary transition-colors hover:bg-primary-50 hover:text-primary-emphasis"
                :left-icon="User"
              >
                Profil
              </Button>
            </div>
          </div>
        </div>

        <!-- Help Section -->
        <div class="mt-12 rounded-3xl border border-accent-blue/20 bg-accent-blue/10 p-4 sm:p-6 lg:p-8 text-left">
          <div class="flex items-stretch sm:items-start gap-4">
            <div class="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/80 shadow-card">
              <Info class="h-5 w-5 text-accent-blue" />
            </div>
            <div class="space-y-3">
              <h3 class="text-responsive-lg font-semibold text-accent-blue">
                Besoin d'aide ?
              </h3>
              <p class="text-responsive-sm text-accent-blue/80">
                Si vous pensez qu'il s'agit d'une erreur, n'hésitez pas à nous contacter.
              </p>
              <div class="flex flex-col gap-2 sm:flex-row">
                <Button
                  tag="a"
                  href="mailto:support@antigaspi.fr"
                  variant="ghost"
                  size="sm"
                  class="justify-start text-accent-blue transition-colors hover:bg-white/80 hover:text-accent-blue"
                  :left-icon="Mail"
                >
                  Support
                </Button>
                <Button
                  tag="a"
                  href="tel:+33123456789"
                  variant="ghost"
                  size="sm"
                  class="justify-start text-accent-blue transition-colors hover:bg-white/80 hover:text-accent-blue"
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
