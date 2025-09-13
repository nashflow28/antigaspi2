<template>
  <div class="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 flex items-center justify-center px-4">
    <div class="text-center max-w-md">
      <!-- 404 Illustration -->
      <div class="mb-8">
        <div class="relative">
          <!-- Background circle -->
          <div class="w-64 h-64 mx-auto bg-gradient-to-br from-primary-100 to-secondary-100 rounded-full flex items-center justify-center relative overflow-hidden">
            <!-- Animated background pattern -->
            <div class="absolute inset-0 opacity-10">
              <div class="absolute top-4 left-8 w-8 h-8 bg-primary-300 rounded-full animate-pulse"></div>
              <div class="absolute bottom-8 right-12 w-6 h-6 bg-secondary-300 rounded-full animate-pulse" style="animation-delay: 0.5s"></div>
              <div class="absolute top-16 right-6 w-4 h-4 bg-accent-300 rounded-full animate-pulse" style="animation-delay: 1s"></div>
              <div class="absolute bottom-16 left-16 w-5 h-5 bg-primary-300 rounded-full animate-pulse" style="animation-delay: 1.5s"></div>
            </div>

            <!-- Main 404 Icon -->
            <div class="text-center z-10">
              <div class="text-8xl font-bold text-primary-400 mb-2">404</div>
              <Frown class="w-16 h-16 text-primary-500 mx-auto animate-bounce" />
            </div>
          </div>
        </div>
      </div>

      <!-- Error Message -->
      <div class="mb-8">
        <h1 class="text-3xl lg:text-4xl font-bold text-neutral-900 mb-4">
          Page introuvable
        </h1>
        <p class="text-lg text-neutral-600 mb-6">
          Oops ! La page que vous cherchez n'existe pas ou a été déplacée.
        </p>
        <p class="text-sm text-neutral-500">
          Peut-être avez-vous tapé une mauvaise adresse ou suivi un lien obsolète ?
        </p>
      </div>

      <!-- Action Buttons -->
      <div class="space-y-4">
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            @click="goBack"
            class="btn btn-outline flex items-center justify-center"
          >
            <ArrowLeft class="w-5 h-5 mr-2" />
            Retour
          </button>

          <router-link
            to="/"
            class="btn btn-primary flex items-center justify-center"
          >
            <Home class="w-5 h-5 mr-2" />
            Accueil
          </router-link>
        </div>

        <!-- Quick Links -->
        <div class="pt-6 border-t border-neutral-200">
          <p class="text-sm text-neutral-600 mb-4">Ou essayez ces liens populaires :</p>
          <div class="flex flex-wrap justify-center gap-2">
            <router-link
              to="/products"
              class="inline-flex items-center px-3 py-2 text-sm text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
            >
              <ShoppingBag class="w-4 h-4 mr-1" />
              Catalogue
            </router-link>
            <router-link
              to="/dashboard"
              class="inline-flex items-center px-3 py-2 text-sm text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
            >
              <BarChart3 class="w-4 h-4 mr-1" />
              Tableau de bord
            </router-link>
            <router-link
              to="/profile"
              class="inline-flex items-center px-3 py-2 text-sm text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
            >
              <User class="w-4 h-4 mr-1" />
              Profil
            </router-link>
          </div>
        </div>
      </div>

      <!-- Help Section -->
      <div class="mt-12 pt-8 border-t border-neutral-200">
        <div class="bg-blue-50 border border-blue-200 rounded-2xl p-6">
          <div class="flex items-start gap-3">
            <Info class="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div class="text-left">
              <h3 class="font-medium text-blue-900 mb-2">Besoin d'aide ?</h3>
              <p class="text-sm text-blue-800 mb-3">
                Si vous pensez qu'il s'agit d'une erreur, n'hésitez pas à nous contacter.
              </p>
              <div class="flex flex-col sm:flex-row gap-2">
                <a
                  href="mailto:support@antigaspi.fr"
                  class="inline-flex items-center px-3 py-1.5 text-sm text-blue-700 hover:text-blue-800 hover:bg-blue-100 rounded-lg transition-colors"
                >
                  <Mail class="w-4 h-4 mr-1" />
                  Support
                </a>
                <a
                  href="tel:+33123456789"
                  class="inline-flex items-center px-3 py-1.5 text-sm text-blue-700 hover:text-blue-800 hover:bg-blue-100 rounded-lg transition-colors"
                >
                  <Phone class="w-4 h-4 mr-1" />
                  Nous appeler
                </a>
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

const router = useRouter()

const goBack = () => {
  // Check if there's history to go back to
  if (window.history.length > 1) {
    router.go(-1)
  } else {
    // If no history, go to home
    router.push('/')
  }
}
</script>

<style scoped>
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-20px); }
}

.animate-float {
  animation: float 3s ease-in-out infinite;
}

/* Custom animations for the background dots */
@keyframes pulse {
  0%, 100% { opacity: 0.4; transform: scale(1); }
  50% { opacity: 0.8; transform: scale(1.1); }
}
</style>