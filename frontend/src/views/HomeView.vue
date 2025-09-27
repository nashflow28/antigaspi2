<template>
  <div class="min-h-screen">
    <!-- Hero Section - Design moderne avec glassmorphism et gradients -->
    <section class="relative bg-gradient-to-br from-primary-500 via-primary-600 to-accent-blue/90 text-white overflow-hidden" data-testid="hero-section">
      <!-- Background decorative elements -->
      <div class="absolute inset-0">
        <div class="absolute top-0 left-0 w-72 h-72 bg-accent-orange/20 rounded-full blur-3xl animate-pulse-glow" />
        <div class="absolute bottom-0 right-0 w-96 h-96 bg-accent-blue/20 rounded-full blur-3xl animate-pulse-glow" style="animation-delay: 1s;" />
        <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white/10 rounded-full blur-2xl" />
      </div>

      <div class="relative container-2025 py-32 lg:py-40">
        <div class="text-center max-w-5xl mx-auto">
          <!-- Badge avec animation -->
          <div class="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-responsive-sm font-medium mb-8 animate-fade-in-up">
            <span class="w-2 h-2 bg-primary-400 rounded-full animate-pulse" />
            <span>Ensemble contre le gaspillage alimentaire</span>
          </div>

          <!-- Titre principal avec gradient text -->
          <h1
            class="text-display-md md:text-display-xl font-semibold mb-8 animate-fade-in-up text-balance font-display"
            style="animation-delay: 0.2s; font-size: 8rem;"
            data-testid="main-hero-title"
          >
            <span class="bg-gradient-to-r from-white via-primary-100 to-accent-orange/70 bg-clip-text text-transparent">
              Sauvons
            </span>
            <br>
            <span class="text-white">
              notre planète
            </span>
          </h1>

          <!-- Sous-titre élégant -->
          <p class="text-responsive-xl md:text-responsive-xl lg:text-responsive-xl mb-12 text-white/90 max-w-4xl mx-auto leading-relaxed animate-fade-in-up font-light" style="animation-delay: 0.4s;">
            Transformons les invendus en opportunités.
            <span class="text-accent-orange/70 font-medium">Économisez jusqu'à 70%</span>
            tout en protégeant l'environnement.
          </p>

          <!-- CTA Buttons avec animations -->
          <div class="flex flex-col sm:flex-row gap-6 justify-center items-center animate-fade-in-up" style="animation-delay: 0.6s;">
            <Button
              as="router-link"
              to="/products"
              size="lg"
              variant="primary"
              class="bg-white text-primary-600 hover:bg-white hover:text-primary-700 hover:scale-105 shadow-toast hover:shadow-card-2025 group relative overflow-hidden"
            >
              <span class="relative z-10 flex items-center gap-3">
                🌟 Découvrir les offres
              </span>
              <div class="absolute inset-0 bg-nav-gradient opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
            </Button>

            <Button
              v-if="!authStore.isAuthenticated"
              as="router-link"
              to="/register"
              size="lg"
              variant="outline"
              class="border-white/30 text-white hover:bg-white hover:text-primary-600 hover:scale-105"
            >
              <span class="flex items-center gap-2">
                ✨ Rejoindre maintenant
              </span>
            </Button>
          </div>

          <!-- Stats avec glassmorphism -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 animate-fade-in-up" style="animation-delay: 0.8s;">
            <div class="bg-white/60 backdrop-blur-md glass-border rounded-2xl p-6 text-center">
              <div class="text-responsive-xl font-semibold text-accent-orange/70 mb-2">1,2M+</div>
              <div class="text-responsive-sm text-white/80">Produits sauvés</div>
            </div>
            <div class="bg-white/60 backdrop-blur-md glass-border rounded-2xl p-6 text-center">
              <div class="text-responsive-xl font-semibold text-primary-300 mb-2">50K+</div>
              <div class="text-responsive-sm text-white/80">Utilisateurs actifs</div>
            </div>
            <div class="bg-white/60 backdrop-blur-md glass-border rounded-2xl p-6 text-center">
              <div class="text-responsive-xl font-semibold text-accent-blue/70 mb-2">2,5K+</div>
              <div class="text-responsive-sm text-white/80">Commerçants partenaires</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Wave divider -->
      <div class="absolute bottom-0 left-0 right-0">
        <svg
          class="w-full h-20 text-neutral-50"
          fill="currentColor"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
        >
          <path d="M1200 120L0 16.48V120H1200Z" />
        </svg>
      </div>
    </section>

    <!-- Features Section - Design moderne avec cards interactives -->
    <section class="py-32 bg-gradient-to-b from-neutral-50 to-white relative">
      <div class="container-2025">
        <!-- Section Header -->
        <div class="text-center mb-20 animate-fade-in-up">
          <div class="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 rounded-full text-responsive-sm font-medium text-primary-600 mb-6">
            <span class="w-2 h-2 bg-primary-500 rounded-full" />
            Processus simple en 3 étapes
          </div>
          <h2 class="text-display-sm lg:text-display-md font-semibold text-neutral-900 mb-6 text-balance font-display">
            Comment ça marche ?
          </h2>
          <p class="text-responsive-xl text-neutral-600 max-w-2xl mx-auto">
            Rejoignez la révolution anti-gaspillage en quelques clics
          </p>
        </div>

        <!-- Features Grid avec animations décalées -->
        <div class="grid lg:grid-cols-3 gap-8 lg:gap-12">
          <!-- Feature 1 -->
          <Card :interactive="true" class="group glow-effect animate-fade-in-up" style="animation-delay: 0.2s;">
            <div class="relative">
              <!-- Icon avec gradient et animation -->
              <div class="w-20 h-20 bg-nav-gradient rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-card group-hover:shadow-card-2025 group-hover:scale-110 transition-all duration-300">
                <span class="text-responsive-xl">🔍</span>
              </div>

              <!-- Step number -->
              <div class="absolute -top-4 -right-4 w-8 h-8 bg-accent-orange text-white rounded-full flex items-center justify-center text-responsive-sm font-semibold shadow-card">
                1
              </div>
            </div>

            <div class="text-center">
              <h3 class="text-responsive-xl font-semibold text-neutral-900 mb-4 group-hover:text-primary-600 transition-colors font-heading">
                Découvrez
              </h3>
              <p class="text-neutral-600 leading-relaxed mb-6">
                Explorez les offres exclusives des commerçants locaux et trouvez des produits de qualité à prix réduits.
              </p>

              <!-- Mini feature list -->
              <div class="space-y-2 text-responsive-sm text-neutral-500">
                <div class="flex items-center gap-2">
                  <span class="w-1.5 h-1.5 bg-primary-500 rounded-full" />
                  <span>Géolocalisation intelligente</span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="w-1.5 h-1.5 bg-primary-500 rounded-full" />
                  <span>Filtres avancés</span>
                </div>
              </div>
            </div>
          </Card>

          <!-- Feature 2 -->
          <Card :interactive="true" class="group glow-effect animate-fade-in-up" style="animation-delay: 0.4s;">
            <div class="relative">
              <div class="w-20 h-20 bg-gradient-to-r from-accent-blue to-accent-blue/90 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-card group-hover:shadow-card-2025 group-hover:scale-110 transition-all duration-300">
                <span class="text-responsive-xl">⚡</span>
              </div>

              <div class="absolute -top-4 -right-4 w-8 h-8 bg-accent-orange text-white rounded-full flex items-center justify-center text-responsive-sm font-semibold shadow-card">
                2
              </div>
            </div>

            <div class="text-center">
              <h3 class="text-responsive-xl font-semibold text-neutral-900 mb-4 group-hover:text-accent-blue transition-colors font-heading">
                Réservez
              </h3>
              <p class="text-neutral-600 leading-relaxed mb-6">
                Réservez instantanément vos produits favoris avec paiement sécurisé et confirmation immédiate.
              </p>

              <div class="space-y-2 text-responsive-sm text-neutral-500">
                <div class="flex items-center gap-2">
                  <span class="w-1.5 h-1.5 bg-accent-blue/50 rounded-full" />
                  <span>Réservation instantanée</span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="w-1.5 h-1.5 bg-accent-blue/50 rounded-full" />
                  <span>Paiement sécurisé</span>
                </div>
              </div>
            </div>
          </Card>

          <!-- Feature 3 -->
          <Card :interactive="true" class="group glow-effect animate-fade-in-up" style="animation-delay: 0.6s;">
            <div class="relative">
              <div class="w-20 h-20 bg-gradient-to-r from-accent-orange to-accent-orange/90 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-card group-hover:shadow-card-2025 group-hover:scale-110 transition-all duration-300">
                <span class="text-responsive-xl">🌱</span>
              </div>

              <div class="absolute -top-4 -right-4 w-8 h-8 bg-accent-orange text-white rounded-full flex items-center justify-center text-responsive-sm font-semibold shadow-card">
                3
              </div>
            </div>

            <div class="text-center">
              <h3 class="text-responsive-xl font-semibold text-neutral-900 mb-4 group-hover:text-accent-orange transition-colors font-heading">
                Sauvez
              </h3>
              <p class="text-neutral-600 leading-relaxed mb-6">
                Récupérez vos achats et contribuez activement à la réduction du gaspillage alimentaire.
              </p>

              <div class="space-y-2 text-responsive-sm text-neutral-500">
                <div class="flex items-center gap-2">
                  <span class="w-1.5 h-1.5 bg-accent-orange rounded-full" />
                  <span>Impact environnemental</span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="w-1.5 h-1.5 bg-accent-orange rounded-full" />
                  <span>Économies réalisées</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <!-- Bottom CTA -->
        <div class="text-center mt-16 animate-fade-in-up" style="animation-delay: 0.8s;">
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
    <section class="py-20 bg-neutral-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-16">
          <h2 class="text-responsive-xl md:text-display-sm font-semibold text-neutral-900 mb-4">
            Notre impact
          </h2>
        </div>

        <div class="grid md:grid-cols-3 gap-8 text-center">
          <div>
            <div class="text-display-sm md:text-display-md font-semibold text-primary-600 mb-2">
              1,234
            </div>
            <p class="text-responsive-xl text-neutral-600">Produits sauvés</p>
          </div>

          <div>
            <div class="text-display-sm md:text-display-md font-semibold text-primary-600 mb-2">
              567
            </div>
            <p class="text-responsive-xl text-neutral-600">Utilisateurs actifs</p>
          </div>

          <div>
            <div class="text-display-sm md:text-display-md font-semibold text-accent-orange mb-2">
              89
            </div>
            <p class="text-responsive-xl text-neutral-600">Commerçants partenaires</p>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="py-20 bg-primary-600 text-white">
      <div class="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
        <h2 class="text-responsive-xl md:text-display-sm font-semibold mb-6">
          Prêt à faire la différence ?
        </h2>
        <p class="text-responsive-xl mb-8 text-primary-100">
          Rejoignez notre communauté et commencez à économiser tout en protégeant l'environnement
        </p>

        <template v-if="!authStore.isAuthenticated">
          <div class="space-x-4">
            <Button
              as="router-link"
              to="/register"
              class="bg-white text-primary-600 hover:bg-neutral-100 text-responsive-lg px-8 py-3"
            >
              Consommateur
            </Button>
            <Button
              as="router-link"
              to="/register"
              class="bg-primary-500 hover:bg-primary-400 text-responsive-lg px-8 py-3"
            >
              Commerçant
            </Button>
          </div>
        </template>

        <template v-else>
          <Button
            as="router-link"
            to="/dashboard"
            class="bg-white text-primary-600 hover:bg-neutral-100 text-responsive-lg px-8 py-3"
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
