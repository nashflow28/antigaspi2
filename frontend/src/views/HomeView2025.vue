<template>
  <div class="min-h-screen">
    <!-- Hero Section - Design moderne avec glassmorphism et gradients -->
    <section class="relative bg-gradient-to-br from-primary-500 via-primary-600 to-primary-500/90 text-white overflow-hidden sm:block" data-testid="hero-section">
      <!-- Background decorative elements -->
      <div class="relative sm:absolute inset-0">
        <div class="relative sm:absolute top-0 left-0 w-72 h-72 bg-accent-orange/20 rounded-full blur-3xl animate-pulse-glow" />
        <div class="relative sm:absolute bottom-0 right-0 w-96 h-96 bg-primary-50 dark:bg-primary-500/20 rounded-full blur-3xl animate-pulse-glow" style="animation-delay: 1s;" />
        <div class="relative sm:absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-9xl bg-surface-light dark:bg-surface-dark/10 rounded-full blur-2xl" />
      </div>

      <div :class="[layoutContainerClass, 'relative py-24 sm:py-28 lg:padding-y-md2 lg:py-40']">
        <div class="text-left sm:text-center max-w-5xl mx-auto">
          <!-- Badge avec animation -->
          <Badge
            variant="outline"
            size="md"
            rounded
            class="bg-surface-light dark:bg-surface-dark/10 text-white/90 border-white/30 backdrop-blur-sm mt-4 sm:mb-3xl animate-fade-in-up"
          >
            <span class="flex items-center gap-2">
              <span class="h-4 w-4 rounded-full bg-primary-300 animate-pulse" />
              Ensemble contre le gaspillage alimentaire
            </span>
          </Badge>

          <!-- Titre principal avec gradient text -->
          <h1
            class="text-3xl md:text-5xl font-semibold mt-4 sm:mb-3xl animate-fade-in-up text-balance font-display"
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
          <p class="text-xl md:text-xl lg:text-xl mb-3xl sm:mb-10 lg:mb-12 text-white/90 max-w-full sm:max-w-4xl mx-auto leading-relaxed animate-fade-in-up font-light" style="animation-delay: 0.4s;">
            Transformons les invendus en opportunités.
            <span class="text-accent-orange/70 font-medium">Économisez jusqu'à 70%</span>
            tout en protégeant l'environnement.
          </p>

          <!-- CTA Buttons avec animations -->
          <div class="flex flex-col sm:flex-row gap-3 sm:gap-6 justify-center items-center animate-fade-in-up" style="animation-delay: 0.6s;">
            <Button
              size="lg"
              class="bg-surface-light dark:bg-surface-dark text-primary-600 dark:text-primary-400 hover:bg-surface-light dark:bg-surface-dark hover:text-primary-900 dark:text-primary-100 hover:scale-105 shadow-md hover:shadow-xl group relative overflow-hidden sm:block"
              @click="$router.push('/products')"
            >
              <span class="relative z-10 flex items-center gap-3">
                🌟 Découvrir les offres
              </span>
              <div class="relative sm:absolute inset-0 bg-gradient-to-r from-primary-600 to-primary-700 opacity-0 group-hover:transition-opacity duration-300" />
            </Button>

            <Button
              v-if="!authStore.isAuthenticated"
              variant="outline"
              size="lg"
              class="border-white/30 text-white hover:bg-surface-light dark:bg-surface-dark hover:text-primary-600 dark:text-primary-400 hover:scale-105"
              @click="$router.push('/register')"
            >
              <span class="flex items-center gap-2">
                ✨ Rejoindre maintenant
              </span>
            </Button>
          </div>

          <!-- Stats avec glassmorphism -->
          <div class="grid grid-cols-1 gap-3 sm:gap-6 md:grid-cols-3 spacing-xs6 animate-fade-in-up" style="animation-delay: 0.8s;">
            <Card
              variant="glass"
              rounded="xl"
              class="text-left sm:text-center backdrop-blur-md"
            >
              <div class="text-xl font-semibold text-accent-orange/70 mt-2">1,2M+</div>
              <div class="text-sm text-white/80">Produits sauvés</div>
            </Card>
            <Card
              variant="glass"
              rounded="xl"
              class="text-left sm:text-center backdrop-blur-md"
            >
              <div class="text-xl font-semibold text-primary-300 mt-2">50K+</div>
              <div class="text-sm text-white/80">Utilisateurs actifs</div>
            </Card>
            <Card
              variant="glass"
              rounded="xl"
              class="text-left sm:text-center backdrop-blur-md"
            >
              <div class="text-xl font-semibold text-primary-500 dark:text-primary-300/70 mt-2">2,5K+</div>
              <div class="text-sm text-white/80">Commerçants partenaires</div>
            </Card>
          </div>
        </div>
      </div>

      <!-- Wave divider -->
      <div class="relative sm:absolute bottom-0 left-0 right-0">
        <svg
          class="w-full h-12 text-neutral-50"
          fill="currentColor"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
        >
          <path d="M1200 120L0 16.48V120H1200Z" />
        </svg>
      </div>
    </section>

    <!-- Features Section - Design moderne avec cards interactives -->
    <section class="py-24 sm:py-28 lg:padding-y-md2 bg-gradient-to-b from-surface-light to-white relative">
      <div :class="layoutContainerClass">
        <!-- Section Header -->
        <div class="text-left sm:text-center mb-16 sm:mb-18 lg:mb-20 animate-fade-in-up">
          <Badge
            variant="primary"
            size="md"
            rounded
            class="bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 mt-4"
          >
            <span class="flex items-center gap-2">
              <span class="h-4 w-4 rounded-full bg-primary-50 dark:bg-primary-500/20" />
              Processus simple en 3 étapes
            </span>
          </Badge>
          <h2 class="text-3xl lg:text-3xl font-semibold text-neutral-900 dark:text-neutral-100 mt-4 text-balance font-display">
            Comment ça marche ?
          </h2>
          <p class="text-xl text-neutral-600 dark:text-neutral-300 max-w-full sm:max-w-80 mx-auto">
            Rejoignez la révolution anti-gaspillage en quelques clics
          </p>
        </div>

        <!-- Features Grid avec animations décalées -->
        <div class="grid lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-12">
          <!-- Feature 1 -->
          <Card
            variant="elevated"
            interactive
            class="group glow-effect animate-fade-in-up"
            style="animation-delay: 0.2s;"
          >
            <div class="relative">
              <!-- Icon avec gradient et animation -->
              <div class="w-20 h-12 bg-gradient-to-r from-primary-600 to-primary-700 rounded flex items-center justify-center mx-auto mt-4 shadow-xl group-hover:shadow-xl group-hover:transition-all duration-300">
                <span class="text-xl">🔍</span>
              </div>

              <!-- Step number -->
              <div class="relative sm:absolute -top-4 -right-4 h-6 w-6 bg-accent-orange text-white rounded-full flex items-center justify-center text-sm font-semibold shadow-xl">
                1
              </div>
            </div>

            <div class="text-left sm:text-center">
              <h3 class="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mt-3 group-hover:transition-colors font-heading">
                Découvrez
              </h3>
              <p class="text-neutral-600 dark:text-neutral-300 leading-relaxed mt-4">
                Explorez les offres exclusives des commerçants locaux et trouvez des produits de qualité à prix réduits.
              </p>

              <!-- Mini feature list -->
              <div class="space-y-4 text-sm text-neutral-500 dark:text-neutral-400">
                <div class="flex items-center gap-2">
                  <span class="w-xs.5 h-3.5 bg-primary-50 dark:bg-primary-500/20 rounded-full" />
                  <span>Géolocalisation intelligente</span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="w-xs.5 h-3.5 bg-primary-50 dark:bg-primary-500/20 rounded-full" />
                  <span>Filtres avancés</span>
                </div>
              </div>
            </div>
          </Card>

          <!-- Feature 2 -->
          <Card
            variant="elevated"
            interactive
            class="group glow-effect animate-fade-in-up"
            style="animation-delay: 0.4s;"
          >
            <div class="relative">
              <div class="w-20 h-12 bg-gradient-to-r from-primary-500 to-primary-500/90 rounded flex items-center justify-center mx-auto mt-4 shadow-xl group-hover:shadow-xl group-hover:transition-all duration-300">
                <span class="text-xl">⚡</span>
              </div>

              <div class="relative sm:absolute -top-4 -right-4 h-6 w-6 bg-accent-orange text-white rounded-full flex items-center justify-center text-sm font-semibold shadow-xl">
                2
              </div>
            </div>

            <div class="text-left sm:text-center">
              <h3 class="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mt-3 group-hover:transition-colors font-heading">
                Réservez
              </h3>
              <p class="text-neutral-600 dark:text-neutral-300 leading-relaxed mt-4">
                Réservez instantanément vos produits favoris avec paiement sécurisé et confirmation immédiate.
              </p>

              <div class="space-y-4 text-sm text-neutral-500 dark:text-neutral-400">
                <div class="flex items-center gap-2">
                  <span class="w-xs.5 h-3.5 bg-primary-50 dark:bg-primary-500/20 rounded-full" />
                  <span>Réservation instantanée</span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="w-xs.5 h-3.5 bg-primary-50 dark:bg-primary-500/20 rounded-full" />
                  <span>Paiement sécurisé</span>
                </div>
              </div>
            </div>
          </Card>

          <!-- Feature 3 -->
          <Card
            variant="elevated"
            interactive
            class="group glow-effect animate-fade-in-up"
            style="animation-delay: 0.6s;"
          >
            <div class="relative">
              <div class="w-20 h-12 bg-gradient-to-r from-accent-orange to-accent-orange/90 rounded flex items-center justify-center mx-auto mt-4 shadow-xl group-hover:shadow-xl group-hover:transition-all duration-300">
                <span class="text-xl">🌱</span>
              </div>

              <div class="relative sm:absolute -top-4 -right-4 h-6 w-6 bg-accent-orange text-white rounded-full flex items-center justify-center text-sm font-semibold shadow-xl">
                3
              </div>
            </div>

            <div class="text-left sm:text-center">
              <h3 class="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mt-3 group-hover:transition-colors font-heading">
                Sauvez
              </h3>
              <p class="text-neutral-600 dark:text-neutral-300 leading-relaxed mt-4">
                Récupérez vos achats et contribuez activement à la réduction du gaspillage alimentaire.
              </p>

              <div class="space-y-4 text-sm text-neutral-500 dark:text-neutral-400">
                <div class="flex items-center gap-2">
                  <span class="w-xs.5 h-3.5 bg-accent-orange rounded-full" />
                  <span>Impact environnemental</span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="w-xs.5 h-3.5 bg-accent-orange rounded-full" />
                  <span>Économies réalisées</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <!-- Bottom CTA -->
        <div class="text-left sm:text-center spacing-xs6 animate-fade-in-up" style="animation-delay: 0.8s;">
          <Button
            variant="primary"
            size="lg"
            class="glow-effect"
            @click="$router.push('/register')"
          >
            <span>Commencer maintenant</span>
            <span class="ml-2">→</span>
          </Button>
        </div>
      </div>
    </section>

    <!-- Stats Section -->
    <section class="py-16 sm:py-16-2 lg:py-16-3 bg-neutral-50 dark:bg-neutral-900/60">
      <div class="max-w-full sm:max-w-7xl mx-auto px-3">
        <div class="text-left sm:text-center mb-12 sm:mb-14 lg:mb-16">
          <h2 class="text-xl md:text-3xl font-semibold text-neutral-900 dark:text-neutral-100 mt-3">
            Notre impact
          </h2>
        </div>

        <div class="grid md:grid-cols-3 gap-6 sm:gap-8 text-left sm:text-center">
          <div>
            <div class="text-3xl md:text-3xl font-semibold text-primary-600 dark:text-primary-400 mt-2">
              1,234
            </div>
            <p class="text-xl text-neutral-600 dark:text-neutral-300">Produits sauvés</p>
          </div>

          <div>
            <div class="text-3xl md:text-3xl font-semibold text-primary-600 dark:text-primary-400 mt-2">
              567
            </div>
            <p class="text-xl text-neutral-600 dark:text-neutral-300">Utilisateurs actifs</p>
          </div>

          <div>
            <div class="text-3xl md:text-3xl font-semibold text-accent-orange mt-2">
              89
            </div>
            <p class="text-xl text-neutral-600 dark:text-neutral-300">Commerçants partenaires</p>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="py-16 sm:py-16-2 lg:py-16-3 bg-primary-600 text-white">
      <div class="max-w-full sm:max-w-4xl mx-auto text-left sm:text-center px-3">
        <h2 class="text-xl md:text-3xl font-semibold mt-4">
          Prêt à faire la différence ?
        </h2>
        <p class="text-xl mt-4 sm:mb-3xl text-primary-100">
          Rejoignez notre communauté et commencez à économiser tout en protégeant l'environnement
        </p>

        <template v-if="!authStore.isAuthenticated">
          <div class="space-y-4 sm:space-x-4">
            <Button
              class="bg-surface-light dark:bg-surface-dark text-primary-600 dark:text-primary-400 hover:bg-neutral-100 dark:bg-neutral-800 text-lg px-6 py-3"
              @click="$router.push('/register')"
            >
              Consommateur
            </Button>
            <Button
              class="bg-primary-50 dark:bg-primary-500/20 text-primary-700 dark:text-primary-100 hover:bg-primary-400 hover:text-white text-lg px-6 py-3"
              @click="$router.push('/register')"
            >
              Commerçant
            </Button>
          </div>
        </template>

        <template v-else>
          <Button
            class="bg-surface-light dark:bg-surface-dark text-primary-600 dark:text-primary-400 hover:bg-neutral-100 dark:bg-neutral-800 text-lg px-6 py-3"
            @click="$router.push('/dashboard')"
          >
            Accéder à mon tableau de bord
          </Button>
        </template>
      </div>
    </section>

    <!-- Featured Products Section -->
    <section class="py-16 bg-gray-50">
      <div :class="layoutContainerClass">
        <div class="mb-8">
          <h2 class="text-3xl font-semibold text-gray-900 mb-2">
            Produits en vedette
          </h2>
          <p class="text-gray-600">
            Découvrez les meilleures offres anti-gaspillage près de chez vous
          </p>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card v-for="i in 4" :key="i" class="animate-pulse">
            <div class="h-48 bg-gray-200 rounded-lg mb-4" />
            <div class="h-4 bg-gray-200 rounded w-3/4 mb-2" />
            <div class="h-4 bg-gray-200 rounded w-1/2" />
          </Card>
        </div>

        <!-- Products Grid -->
        <div v-else-if="featuredProducts.length > 0" data-testid="product-list" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <article
            v-for="product in featuredProducts"
            :key="product.id"
            data-testid="product-card"
            class="product-card bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
            @click="$router.push(`/products/${product.id}`)"
          >
            <div class="aspect-square overflow-hidden rounded-t-lg">
              <img
                v-if="product.image_url"
                :src="product.image_url"
                :alt="product.name"
                class="w-full h-full object-cover"
              >
              <div v-else class="w-full h-full bg-gray-200 flex items-center justify-center">
                <span class="text-4xl">📦</span>
              </div>
            </div>
            <div class="p-4">
              <h3 class="font-semibold text-gray-900 mb-1" data-testid="product-name">
                {{ product.name }}
              </h3>
              <p class="text-sm text-gray-500 mb-2">
                {{ product.category }}
              </p>
              <div class="flex items-center justify-between">
                <div>
                  <span class="text-lg font-bold text-primary-600" data-testid="product-price">
                    {{ product.discounted_price }} XOF
                  </span>
                  <span class="text-sm text-gray-400 line-through ml-2">
                    {{ product.original_price }} XOF
                  </span>
                </div>
                <Badge variant="success" size="sm">
                  -{{ Math.round((1 - product.discounted_price / product.original_price) * 100) }}%
                </Badge>
              </div>
            </div>
          </article>
        </div>

        <!-- Empty State -->
        <div v-else class="text-center py-12">
          <p class="text-gray-500">Aucun produit disponible pour le moment</p>
        </div>

        <!-- View All Button -->
        <div v-if="featuredProducts.length > 0" class="mt-8 text-center">
          <Button
            variant="outline"
            size="lg"
            @click="$router.push('/products')"
          >
            Voir tous les produits
          </Button>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { apiService } from '@/services/api'
import type { Product } from '@/types'

// Import 2025 Design System components
import Card from '@/components/ui/2025/Card.vue'
import Button from '@/components/ui/2025/Button.vue'
import Badge from '@/components/ui/2025/Badge.vue'

const authStore = useAuthStore()
const layoutContainerClass = 'mx-auto w-full max-w-7xl px-3 sm:px-4 lg:px-6'

const featuredProducts = ref<Product[]>([])
const loading = ref(true)

onMounted(async () => {
  try {
    const response = await apiService.getProducts({ limit: 8, is_active: true })
    featuredProducts.value = response.data.slice(0, 8) // Show first 8 products
  } catch (error) {
    console.error('Failed to load featured products:', error)
  } finally {
    loading.value = false
  }
})
</script>
