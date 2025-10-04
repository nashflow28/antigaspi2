<template>
  <div class="min-h-screen">
    <!-- Hero Section - Design moderne avec glassmorphism et gradients -->
    <section class="relative bg-gradient-to-br from-blue-500 via-primary-600 to-blue-500/90 text-white overflow-hidden sm:block" data-testid="hero-section">
      <!-- Background decorative elements -->
      <div class="relative sm:absolute inset-0">
        <div class="relative sm:absolute top-0 left-0 w-72 h-72 bg-orange-500/20 rounded-full blur-3xl animate-pulse-glow" />
        <div class="relative sm:absolute bottom-0 right-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse-glow" style="animation-delay: 1s;" />
        <div class="relative sm:absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-9xl bg-white/10 rounded-full blur-2xl" />
      </div>

      <div class="relative container px-3 sm:px-4 lg:px-6 py-24 sm:py-28 lg:padding-y-md2 lg:py-40">
        <div class="text-left sm:text-center max-w-5xl mx-auto">
          <!-- Badge avec animation -->
          <div class="inline-flex items-center gap-2 px-3 py-3 bg-white/10 backdrop-blur-sm rounded-full text-sm font-medium mt-4 sm:mb-3xl animate-fade-in-up">
            <span class="h-4 w-4 bg-blue-400 rounded-full animate-pulse" />
            <span>Ensemble contre le gaspillage alimentaire</span>
          </div>

          <!-- Titre principal avec gradient text -->
          <h1
            class="text-4xl sm:text-6xl lg:text-7xl xl:text-8xl font-semibold mt-4 sm:mb-3xl animate-fade-in-up text-balance font-display leading-[1.08] sm:leading-[1.1]"
            style="animation-delay: 0.2s;"
            data-testid="main-hero-title"
          >
            <span class="bg-gradient-to-r from-white via-primary-100 to-orange-500/70 bg-clip-text text-transparent">
              Sauvons
            </span>
            <br>
            <span class="text-white">
              notre planète
            </span>
          </h1>

          <!-- Sous-titre élégant -->
          <p class="text-xl md:text-xl lg:text-xl mb-3xl sm:mb-10 lg:mb-12 text-white/90 max-w-full sm:max-w-4xl mx-auto leading-relaxed animate-fade-in-up font-light" style="animation-delay: 0.4s;">
            Transformons les invendus en opportunités.
            <span class="text-orange-500/70 font-medium">Économisez jusqu'à 70%</span>
            tout en protégeant l'environnement.
          </p>

          <!-- CTA Buttons avec animations -->
          <div class="flex flex-col sm:flex-row gap-3 sm:gap-6 justify-center items-center animate-fade-in-up" style="animation-delay: 0.6s;">
            <Button
              as="router-link"
              to="/products"
              size="lg"
              variant="primary"
              class="bg-white text-blue-600 hover:bg-white hover:text-blue-900 hover:scale-105 shadow-md hover:shadow-xl group relative overflow-hidden sm:block"
            >
              <span class="relative z-10 flex items-center gap-3">
                🌟 Découvrir les offres
              </span>
              <div class="relative sm:absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-700 opacity-0 group-hover:transition-opacity duration-300" />
            </Button>

            <Button
              v-if="!authStore.isAuthenticated"
              as="router-link"
              to="/register"
              size="lg"
              variant="outline"
              class="border-white/30 text-white hover:bg-white hover:text-blue-600 hover:scale-105"
            >
              <span class="flex items-center gap-2">
                ✨ Rejoindre maintenant
              </span>
            </Button>
          </div>

          <!-- Stats avec glassmorphism -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-6 spacing-xs6 animate-fade-in-up" style="animation-delay: 0.8s;">
            <div class="bg-white/60 backdrop-blur-md glass-border rounded p-6 text-left sm:text-center">
              <div class="text-xl font-semibold text-orange-500/70 mt-2">1,2M+</div>
              <div class="text-sm text-white/80">Produits sauvés</div>
            </div>
            <div class="bg-white/60 backdrop-blur-md glass-border rounded p-6 text-left sm:text-center">
              <div class="text-xl font-semibold text-blue-300 mt-2">50K+</div>
              <div class="text-sm text-white/80">Utilisateurs actifs</div>
            </div>
            <div class="bg-white/60 backdrop-blur-md glass-border rounded p-6 text-left sm:text-center">
              <div class="text-xl font-semibold text-blue-500/70 mt-2">2,5K+</div>
              <div class="text-sm text-white/80">Commerçants partenaires</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Wave divider -->
      <div class="relative sm:absolute bottom-0 left-0 right-0">
        <svg
          class="w-full h-12 text-gray-50"
          fill="currentColor"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
        >
          <path d="M1200 120L0 16.48V120H1200Z" />
        </svg>
      </div>
    </section>

    <!-- Features Section - Design moderne avec cards interactives -->
    <section class="py-24 sm:py-28 lg:padding-y-md2 bg-gradient-to-b from-gray-50 to-white relative">
      <div class="container px-3 sm:px-4 lg:px-6">
        <!-- Section Header -->
        <div class="text-left sm:text-center mb-16 sm:mb-18 lg:mb-20 animate-fade-in-up">
          <div class="inline-flex items-center gap-2 px-3 py-3 bg-blue-50 rounded-full text-sm font-medium text-blue-600 mt-4">
            <span class="h-4 w-4 bg-blue-500 rounded-full" />
            Processus simple en 3 étapes
          </div>
          <h2 class="text-3xl lg:text-3xl font-semibold text-gray-900 mt-4 text-balance font-display">
            Comment ça marche ?
          </h2>
          <p class="text-xl text-gray-700 max-w-full sm:max-w-80 mx-auto">
            Rejoignez la révolution anti-gaspillage en quelques clics
          </p>
        </div>

        <!-- Features Grid avec animations décalées -->
        <div class="grid lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-12">
          <!-- Feature 1 -->
          <Card :interactive="true" class="group glow-effect animate-fade-in-up" style="animation-delay: 0.2s;">
            <div class="relative">
              <!-- Icon avec gradient et animation -->
              <div class="w-20 h-12 bg-gradient-to-r from-blue-600 to-blue-700 rounded flex items-center justify-center mx-auto mt-4 shadow-lg group-hover:shadow-xl group-hover:transition-all duration-300">
                <span class="text-xl">🔍</span>
              </div>

              <!-- Step number -->
              <div class="relative sm:absolute -top-4 -right-4 h-6 w-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-semibold shadow-lg">
                1
              </div>
            </div>

            <div class="text-left sm:text-center">
              <h3 class="text-xl font-semibold text-gray-900 mt-3 group-hover:transition-colors font-heading">
                Découvrez
              </h3>
              <p class="text-gray-700 leading-relaxed mt-4">
                Explorez les offres exclusives des commerçants locaux et trouvez des produits de qualité à prix réduits.
              </p>

              <!-- Mini feature list -->
              <div class="space-y-4 text-sm text-gray-500">
                <div class="flex items-center gap-2">
                  <span class="w-xs.5 h-3.5 bg-blue-500 rounded-full" />
                  <span>Géolocalisation intelligente</span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="w-xs.5 h-3.5 bg-blue-500 rounded-full" />
                  <span>Filtres avancés</span>
                </div>
              </div>
            </div>
          </Card>

          <!-- Feature 2 -->
          <Card :interactive="true" class="group glow-effect animate-fade-in-up" style="animation-delay: 0.4s;">
            <div class="relative">
              <div class="w-20 h-12 bg-gradient-to-r from-blue-500 to-blue-500/90 rounded flex items-center justify-center mx-auto mt-4 shadow-lg group-hover:shadow-xl group-hover:transition-all duration-300">
                <span class="text-xl">⚡</span>
              </div>

              <div class="relative sm:absolute -top-4 -right-4 h-6 w-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-semibold shadow-lg">
                2
              </div>
            </div>

            <div class="text-left sm:text-center">
              <h3 class="text-xl font-semibold text-gray-900 mt-3 group-hover:transition-colors font-heading">
                Réservez
              </h3>
              <p class="text-gray-700 leading-relaxed mt-4">
                Réservez instantanément vos produits favoris avec paiement sécurisé et confirmation immédiate.
              </p>

              <div class="space-y-4 text-sm text-gray-500">
                <div class="flex items-center gap-2">
                  <span class="w-xs.5 h-3.5 bg-blue-500/50 rounded-full" />
                  <span>Réservation instantanée</span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="w-xs.5 h-3.5 bg-blue-500/50 rounded-full" />
                  <span>Paiement sécurisé</span>
                </div>
              </div>
            </div>
          </Card>

          <!-- Feature 3 -->
          <Card :interactive="true" class="group glow-effect animate-fade-in-up" style="animation-delay: 0.6s;">
            <div class="relative">
              <div class="w-20 h-12 bg-gradient-to-r from-orange-500 to-orange-500/90 rounded flex items-center justify-center mx-auto mt-4 shadow-lg group-hover:shadow-xl group-hover:transition-all duration-300">
                <span class="text-xl">🌱</span>
              </div>

              <div class="relative sm:absolute -top-4 -right-4 h-6 w-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-semibold shadow-lg">
                3
              </div>
            </div>

            <div class="text-left sm:text-center">
              <h3 class="text-xl font-semibold text-gray-900 mt-3 group-hover:transition-colors font-heading">
                Sauvez
              </h3>
              <p class="text-gray-700 leading-relaxed mt-4">
                Récupérez vos achats et contribuez activement à la réduction du gaspillage alimentaire.
              </p>

              <div class="space-y-4 text-sm text-gray-500">
                <div class="flex items-center gap-2">
                  <span class="w-xs.5 h-3.5 bg-orange-500 rounded-full" />
                  <span>Impact environnemental</span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="w-xs.5 h-3.5 bg-orange-500 rounded-full" />
                  <span>Économies réalisées</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <!-- Bottom CTA -->
        <div class="text-left sm:text-center spacing-xs6 animate-fade-in-up" style="animation-delay: 0.8s;">
          <Button
            as="router-link"
            to="/register"
            variant="primary"
            size="lg"
            class="glow-effect"
          >
            <span>Commencer maintenant</span>
            <span class="ml-2">→</span>
          </Button>
        </div>
      </div>
    </section>

    <!-- Stats Section -->
    <section class="py-16 sm:py-16-2 lg:py-16-3 bg-gray-50">
      <div class="max-w-full sm:max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
        <div class="text-left sm:text-center mb-12 sm:mb-14 lg:mb-16">
          <h2 class="text-xl md:text-3xl font-semibold text-gray-900 mt-3">
            Notre impact
          </h2>
        </div>

        <div class="grid md:grid-cols-3 gap-6 sm:gap-8 text-left sm:text-center">
          <div>
            <div class="text-3xl md:text-3xl font-semibold text-blue-600 mt-2">
              1,234
            </div>
            <p class="text-xl text-gray-700">Produits sauvés</p>
          </div>

          <div>
            <div class="text-3xl md:text-3xl font-semibold text-blue-600 mt-2">
              567
            </div>
            <p class="text-xl text-gray-700">Utilisateurs actifs</p>
          </div>

          <div>
            <div class="text-3xl md:text-3xl font-semibold text-orange-500 mt-2">
              89
            </div>
            <p class="text-xl text-gray-700">Commerçants partenaires</p>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="py-16 sm:py-16-2 lg:py-16-3 bg-blue-600 text-white">
      <div class="max-w-full sm:max-w-4xl mx-auto text-left sm:text-center px-3 sm:px-4 lg:px-6">
        <h2 class="text-xl md:text-3xl font-semibold mt-4">
          Prêt à faire la différence ?
        </h2>
        <p class="text-xl mt-4 sm:mb-3xl text-blue-100">
          Rejoignez notre communauté et commencez à économiser tout en protégeant l'environnement
        </p>

        <template v-if="!authStore.isAuthenticated">
          <div class="space-y-4 sm:space-x-4">
            <Button
              as="router-link"
              to="/register"
              class="bg-white text-blue-600 hover:bg-gray-100 text-lg px-6 py-3"
            >
              Consommateur
            </Button>
            <Button
              as="router-link"
              to="/register"
              class="bg-blue-500 hover:bg-blue-400 text-lg px-6 py-3"
            >
              Commerçant
            </Button>
          </div>
        </template>

        <template v-else>
          <Button
            as="router-link"
            to="/dashboard"
            class="bg-white text-blue-600 hover:bg-gray-100 text-lg px-6 py-3"
          >
            Accéder à mon tableau de bord
          </Button>
        </template>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import Button from '@/components/ui/2025/Button.vue'
import Card from '@/components/ui/2025/Card.vue'

const authStore = useAuthStore()
</script>
