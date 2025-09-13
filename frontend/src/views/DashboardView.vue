<template>
  <div class="min-h-screen bg-gradient-to-br from-neutral-50 to-primary-50">
    <!-- Page Header -->
    <div class="glass-bg glass-border border-b backdrop-blur-lg sticky top-20 z-40">
      <div class="container-fluid py-6">
        <div class="flex items-center justify-between animate-fade-in-up">
          <div>
            <h1 class="text-3xl lg:text-4xl font-bold text-neutral-900 mb-2">
              Bonjour {{ authStore.user?.first_name }} ! 👋
            </h1>
            <p class="text-lg text-neutral-600">
              Découvrez vos économies et votre impact environnemental
            </p>
          </div>
          <div class="hidden md:flex items-center gap-4">
            <div class="badge badge-success text-sm px-4 py-2">
              🌱 {{ userStats.co2Saved }}kg CO₂ économisés
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="container-fluid py-8">
      <!-- Quick Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <!-- Économies réalisées -->
        <div class="card card-interactive glow-effect animate-fade-in-up" style="animation-delay: 0.1s;">
          <div class="flex items-center justify-between">
            <div>
              <div class="text-2xl lg:text-3xl font-bold text-success-600 mb-2">
                {{ formatPrice(userStats.totalSavings) }}
              </div>
              <p class="text-sm text-neutral-600 font-medium">Économies totales</p>
              <div class="flex items-center mt-2 text-xs text-success-600">
                <TrendingUp class="w-4 h-4 mr-1" />
                <span>+{{ formatPrice(userStats.monthSavings) }} ce mois</span>
              </div>
            </div>
            <div class="w-16 h-16 bg-gradient-to-br from-success-100 to-success-200 rounded-2xl flex items-center justify-center">
              <Euro class="w-8 h-8 text-success-600" />
            </div>
          </div>
        </div>

        <!-- Produits sauvés -->
        <div class="card card-interactive glow-effect animate-fade-in-up" style="animation-delay: 0.2s;">
          <div class="flex items-center justify-between">
            <div>
              <div class="text-2xl lg:text-3xl font-bold text-primary-600 mb-2">
                {{ userStats.productsSaved }}
              </div>
              <p class="text-sm text-neutral-600 font-medium">Produits sauvés</p>
              <div class="flex items-center mt-2 text-xs text-primary-600">
                <Package class="w-4 h-4 mr-1" />
                <span>{{ userStats.monthProducts }} ce mois</span>
              </div>
            </div>
            <div class="w-16 h-16 bg-gradient-to-br from-primary-100 to-primary-200 rounded-2xl flex items-center justify-center">
              <ShoppingBag class="w-8 h-8 text-primary-600" />
            </div>
          </div>
        </div>

        <!-- Impact CO₂ -->
        <div class="card card-interactive glow-effect animate-fade-in-up" style="animation-delay: 0.3s;">
          <div class="flex items-center justify-between">
            <div>
              <div class="text-2xl lg:text-3xl font-bold text-secondary-600 mb-2">
                {{ userStats.co2Saved }}kg
              </div>
              <p class="text-sm text-neutral-600 font-medium">CO₂ évité</p>
              <div class="flex items-center mt-2 text-xs text-secondary-600">
                <Leaf class="w-4 h-4 mr-1" />
                <span>≈ {{ Math.round(userStats.co2Saved / 2.3) }} km en voiture</span>
              </div>
            </div>
            <div class="w-16 h-16 bg-gradient-to-br from-secondary-100 to-secondary-200 rounded-2xl flex items-center justify-center">
              <TreePine class="w-8 h-8 text-secondary-600" />
            </div>
          </div>
        </div>

        <!-- Réservations actives -->
        <div class="card card-interactive glow-effect animate-fade-in-up" style="animation-delay: 0.4s;">
          <div class="flex items-center justify-between">
            <div>
              <div class="text-2xl lg:text-3xl font-bold text-accent-600 mb-2">
                {{ userStats.activeReservations }}
              </div>
              <p class="text-sm text-neutral-600 font-medium">Réservations actives</p>
              <div class="flex items-center mt-2 text-xs text-accent-600">
                <Clock class="w-4 h-4 mr-1" />
                <span>À récupérer aujourd'hui</span>
              </div>
            </div>
            <div class="w-16 h-16 bg-gradient-to-br from-accent-100 to-accent-200 rounded-2xl flex items-center justify-center">
              <Calendar class="w-8 h-8 text-accent-600" />
            </div>
          </div>
        </div>
      </div>

      <div class="grid lg:grid-cols-3 gap-8">
        <!-- Section principale gauche -->
        <div class="lg:col-span-2 space-y-8">
          <!-- Réservations récentes -->
          <div class="card animate-fade-in-up" style="animation-delay: 0.5s;">
            <div class="flex items-center justify-between mb-6">
              <div>
                <h3 class="text-xl font-bold text-neutral-900 mb-1">Mes réservations récentes</h3>
                <p class="text-sm text-neutral-600">Vos dernières réservations de produits</p>
              </div>
              <router-link
                to="/reservations"
                class="btn btn-ghost btn-sm text-primary-600 hover:text-primary-700"
              >
                <span>Voir tout</span>
                <ArrowRight class="w-4 h-4" />
              </router-link>
            </div>

            <div class="space-y-4">
              <div v-if="recentReservations.length === 0" class="text-center py-12">
                <div class="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShoppingBag class="w-8 h-8 text-neutral-400" />
                </div>
                <p class="text-neutral-600 mb-4">Aucune réservation récente</p>
                <router-link to="/products" class="btn btn-primary btn-sm">
                  Découvrir les produits
                </router-link>
              </div>

              <div
                v-for="reservation in recentReservations"
                :key="reservation.id"
                class="flex items-center gap-4 p-4 rounded-xl border border-neutral-200 hover:border-primary-300 hover:shadow-medium transition-all duration-200"
              >
                <div class="w-16 h-16 bg-gradient-primary rounded-xl flex items-center justify-center">
                  <span class="text-white font-bold">{{ reservation.merchant.name[0] }}</span>
                </div>
                <div class="flex-1 min-w-0">
                  <h4 class="font-semibold text-neutral-900 mb-1">{{ reservation.product.name }}</h4>
                  <p class="text-sm text-neutral-600 mb-1">{{ reservation.merchant.name }}</p>
                  <div class="flex items-center gap-4 text-xs">
                    <span class="badge badge-primary">{{ formatPrice(reservation.price) }}</span>
                    <span class="text-neutral-500">{{ formatDate(reservation.pickup_date) }}</span>
                  </div>
                </div>
                <div class="text-right">
                  <span :class="getStatusClass(reservation.status)" class="badge">
                    {{ getStatusLabel(reservation.status) }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Produits recommandés -->
          <div class="card animate-fade-in-up" style="animation-delay: 0.6s;">
            <div class="flex items-center justify-between mb-6">
              <div>
                <h3 class="text-xl font-bold text-neutral-900 mb-1">Recommandés pour vous</h3>
                <p class="text-sm text-neutral-600">Basé sur vos préférences et votre localisation</p>
              </div>
              <router-link
                to="/products"
                class="btn btn-ghost btn-sm text-primary-600 hover:text-primary-700"
              >
                <span>Voir le catalogue</span>
                <ArrowRight class="w-4 h-4" />
              </router-link>
            </div>

            <div class="grid md:grid-cols-2 gap-4">
              <div
                v-for="product in recommendedProducts"
                :key="product.id"
                class="p-4 rounded-xl border border-neutral-200 hover:border-primary-300 hover:shadow-medium transition-all duration-200 cursor-pointer group"
                @click="viewProduct(product)"
              >
                <div class="flex items-center gap-3 mb-3">
                  <div class="w-12 h-12 bg-gradient-secondary rounded-xl flex items-center justify-center">
                    <Package class="w-6 h-6 text-white" />
                  </div>
                  <div class="flex-1 min-w-0">
                    <h4 class="font-semibold text-neutral-900 mb-1 group-hover:text-primary-600 transition-colors">
                      {{ product.name }}
                    </h4>
                    <p class="text-sm text-neutral-600">{{ product.merchant.name }}</p>
                  </div>
                </div>
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <span class="text-lg font-bold text-primary-600">{{ formatPrice(product.discounted_price) }}</span>
                    <span class="text-sm text-neutral-400 line-through">{{ formatPrice(product.original_price) }}</span>
                  </div>
                  <span class="badge badge-success">-{{ product.discount }}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Sidebar droite -->
        <div class="space-y-6">
          <!-- Badge d'impact -->
          <div class="card card-gradient text-center animate-fade-in-up" style="animation-delay: 0.7s;">
            <div class="text-6xl mb-4">🌍</div>
            <h3 class="text-xl font-bold text-neutral-900 mb-2">Éco-Héros</h3>
            <p class="text-sm text-neutral-600 mb-4">
              Vous avez évité le gaspillage de {{ userStats.productsSaved }} produits !
            </p>
            <div class="w-full bg-neutral-200 rounded-full h-2 mb-4">
              <div
                class="bg-gradient-primary h-2 rounded-full transition-all duration-500"
                :style="{ width: Math.min(100, (userStats.productsSaved / 100) * 100) + '%' }"
              ></div>
            </div>
            <p class="text-xs text-neutral-500">
              Plus que {{ Math.max(0, 100 - userStats.productsSaved) }} produits pour le niveau suivant
            </p>
          </div>

          <!-- Actions rapides -->
          <div class="card animate-fade-in-up" style="animation-delay: 0.8s;">
            <h3 class="text-lg font-bold text-neutral-900 mb-4">Actions rapides</h3>
            <div class="space-y-3">
              <router-link to="/products" class="flex items-center gap-3 p-3 rounded-xl hover:bg-primary-50 transition-colors group">
                <div class="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center group-hover:bg-primary-200 transition-colors">
                  <Search class="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <p class="font-medium text-neutral-900">Chercher des produits</p>
                  <p class="text-xs text-neutral-600">Découvrez les offres près de chez vous</p>
                </div>
              </router-link>

              <router-link to="/reservations" class="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary-50 transition-colors group">
                <div class="w-10 h-10 bg-secondary-100 rounded-xl flex items-center justify-center group-hover:bg-secondary-200 transition-colors">
                  <Calendar class="w-5 h-5 text-secondary-600" />
                </div>
                <div>
                  <p class="font-medium text-neutral-900">Mes réservations</p>
                  <p class="text-xs text-neutral-600">Gérer mes commandes en cours</p>
                </div>
              </router-link>

              <router-link to="/profile" class="flex items-center gap-3 p-3 rounded-xl hover:bg-accent-50 transition-colors group">
                <div class="w-10 h-10 bg-accent-100 rounded-xl flex items-center justify-center group-hover:bg-accent-200 transition-colors">
                  <User class="w-5 h-5 text-accent-600" />
                </div>
                <div>
                  <p class="font-medium text-neutral-900">Mon profil</p>
                  <p class="text-xs text-neutral-600">Paramètres et préférences</p>
                </div>
              </router-link>
            </div>
          </div>

          <!-- Tips écologiques -->
          <div class="card bg-gradient-to-br from-success-50 to-primary-50 border-success-200 animate-fade-in-up" style="animation-delay: 0.9s;">
            <div class="flex items-center gap-3 mb-4">
              <div class="w-8 h-8 bg-success-500 rounded-full flex items-center justify-center">
                <Lightbulb class="w-4 h-4 text-white" />
              </div>
              <h3 class="text-lg font-bold text-success-800">Astuce du jour</h3>
            </div>
            <p class="text-sm text-success-700 mb-4">
              {{ currentTip.text }}
            </p>
            <button @click="nextTip" class="btn btn-sm bg-success-500 text-white hover:bg-success-600 w-full">
              Astuce suivante
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import {
  TrendingUp, Euro, Package, ShoppingBag, Leaf, TreePine,
  Clock, Calendar, ArrowRight, Search, User, Lightbulb
} from 'lucide-vue-next'

const router = useRouter()
const authStore = useAuthStore()

// État des données utilisateur
const userStats = ref({
  totalSavings: 127.50,
  monthSavings: 23.80,
  productsSaved: 42,
  monthProducts: 8,
  co2Saved: 12.4,
  activeReservations: 3
})

const recentReservations = ref([
  {
    id: 1,
    product: { name: 'Pain artisanal du jour' },
    merchant: { name: 'Boulangerie Martin' },
    price: 2.50,
    pickup_date: new Date(),
    status: 'confirmed'
  },
  {
    id: 2,
    product: { name: 'Légumes de saison' },
    merchant: { name: 'Primeur Bio' },
    price: 8.90,
    pickup_date: new Date(Date.now() - 86400000),
    status: 'completed'
  }
])

const recommendedProducts = ref([
  {
    id: 1,
    name: 'Pâtisseries du jour',
    merchant: { name: 'Pâtisserie Delacroix' },
    original_price: 15.00,
    discounted_price: 7.50,
    discount: 50
  },
  {
    id: 2,
    name: 'Sandwich club',
    merchant: { name: 'Café Central' },
    original_price: 8.50,
    discounted_price: 4.25,
    discount: 50
  }
])

const ecoTips = ref([
  { text: "Privilégiez les commerces de proximité pour réduire votre empreinte carbone." },
  { text: "Réservez vos produits en fin de journée pour les meilleures offres." },
  { text: "Apportez vos sacs réutilisables lors de vos retraits." },
  { text: "Partagez l'application avec vos proches pour multiplier l'impact." }
])

const currentTipIndex = ref(0)
const currentTip = computed(() => ecoTips.value[currentTipIndex.value])

// Fonctions utilitaires
const formatPrice = (price: number) => {
  return `${price.toFixed(2)}€`
}

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short'
  }).format(date)
}

const getStatusClass = (status: string) => {
  const classes = {
    'confirmed': 'badge-warning',
    'completed': 'badge-success',
    'cancelled': 'badge-error',
    'pending': 'badge-secondary'
  }
  return classes[status as keyof typeof classes] || 'badge-secondary'
}

const getStatusLabel = (status: string) => {
  const labels = {
    'confirmed': 'Confirmée',
    'completed': 'Récupérée',
    'cancelled': 'Annulée',
    'pending': 'En attente'
  }
  return labels[status as keyof typeof labels] || status
}

const viewProduct = (product: any) => {
  router.push(`/products/${product.id}`)
}

const nextTip = () => {
  currentTipIndex.value = (currentTipIndex.value + 1) % ecoTips.value.length
}

// Vérifier l'authentification au montage
onMounted(() => {
  if (!authStore.isAuthenticated) {
    router.push('/login')
  }
})
</script>
