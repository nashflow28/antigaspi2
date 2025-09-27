<template>
  <DashboardLayout
    :sidebar="sidebar"
    :header="header"
    class="bg-gradient-to-br from-neutral-50 to-primary-50"
  >
    <!-- Page Header -->
    <div class="bg-white/60 backdrop-blur-md border-b backdrop-blur-lg sticky top-20 z-40">
      <div class="container px-4 sm:px-6 lg:px-8-2025 py-6">
        <div class="flex items-center justify-start sm:justify-between animate-fade-in-up">
          <div>
            <h1 class="text-responsive-xl lg:text-display-sm font-semibold text-heading mb-2">
              Bonjour {{ authStore.user?.first_name }} ! 👋
            </h1>
            <p class="text-responsive-lg text-body">
              Découvrez vos économies et votre impact environnemental
            </p>
          </div>
          <div class="hidden sm:block md:flex items-center gap-4">
            <Badge variant="success" size="lg" class="text-responsive-sm px-4 py-3">
              🌱 {{ userStats.co2Saved }}kg CO₂ économisés
            </Badge>
          </div>
        </div>
      </div>
    </div>

    <div class="container px-4 sm:px-6 lg:px-8-2025 py-6 sm:py-8">
      <!-- Quick Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <!-- Économies réalisées -->
        <Card
          variant="glass"
          interactive
          class="glow-effect animate-fade-in-up"
          style="animation-delay: 0.1s;"
        >
          <div class="flex items-center justify-start sm:justify-between">
            <div>
              <div class="text-responsive-xl lg:text-responsive-xl font-semibold text-primary mb-2">
                {{ formatPrice(userStats.totalSavings) }}
              </div>
              <p class="text-responsive-sm text-body font-medium">Économies totales</p>
              <div class="flex items-center mt-2 text-responsive-xs text-primary">
                <TrendingUp class="w-5 h-5 mr-1" />
                <span>+{{ formatPrice(userStats.monthSavings) }} ce mois</span>
              </div>
            </div>
            <div class="w-16 h-16 bg-gradient-to-br from-primary-100 to-primary-200 rounded-2xl flex items-center justify-center">
              <DollarSign class="w-10 h-10 text-primary" />
            </div>
          </div>
        </Card>

        <!-- Produits sauvés -->
        <Card
          variant="glass"
          interactive
          class="glow-effect animate-fade-in-up"
          style="animation-delay: 0.2s;"
        >
          <div class="flex items-center justify-start sm:justify-between">
            <div>
              <div class="text-responsive-xl lg:text-responsive-xl font-semibold text-primary mb-2">
                {{ userStats.productsSaved }}
              </div>
              <p class="text-responsive-sm text-body font-medium">Produits sauvés</p>
              <div class="flex items-center mt-2 text-responsive-xs text-primary">
                <Package class="w-5 h-5 mr-1" />
                <span>{{ userStats.monthProducts }} ce mois</span>
              </div>
            </div>
            <div class="w-16 h-16 bg-gradient-to-br from-primary-100 to-primary-200 rounded-2xl flex items-center justify-center">
              <ShoppingBag class="w-10 h-10 text-primary" />
            </div>
          </div>
        </Card>

        <!-- Impact CO₂ -->
        <Card
          variant="glass"
          interactive
          class="glow-effect animate-fade-in-up"
          style="animation-delay: 0.3s;"
        >
          <div class="flex items-center justify-start sm:justify-between">
            <div>
              <div class="text-responsive-xl lg:text-responsive-xl font-semibold text-accent-blue mb-2">
                {{ userStats.co2Saved }}kg
              </div>
              <p class="text-responsive-sm text-body font-medium">CO₂ évité</p>
              <div class="flex items-center mt-2 text-responsive-xs text-accent-blue">
                <Leaf class="w-5 h-5 mr-1" />
                <span>≈ {{ Math.round(userStats.co2Saved / 2.3) }} km en voiture</span>
              </div>
            </div>
            <div class="w-16 h-16 bg-gradient-to-br from-accent-blue/10 to-accent-blue/20 rounded-2xl flex items-center justify-center">
              <TreePine class="w-10 h-10 text-accent-blue" />
            </div>
          </div>
        </Card>

        <!-- Réservations actives -->
        <Card
          variant="glass"
          interactive
          class="glow-effect animate-fade-in-up"
          style="animation-delay: 0.4s;"
        >
          <div class="flex items-center justify-start sm:justify-between">
            <div>
              <div class="text-responsive-xl lg:text-responsive-xl font-semibold text-accent-orange mb-2">
                {{ userStats.activeReservations }}
              </div>
              <p class="text-responsive-sm text-body font-medium">Réservations actives</p>
              <div class="flex items-center mt-2 text-responsive-xs text-accent-orange">
                <Clock class="w-5 h-5 mr-1" />
                <span>À récupérer aujourd'hui</span>
              </div>
            </div>
            <div class="w-16 h-16 bg-gradient-to-br from-accent-orange/10 to-accent-orange/20 rounded-2xl flex items-center justify-center">
              <Calendar class="w-10 h-10 text-accent-orange" />
            </div>
          </div>
        </Card>

        <!-- Portefeuille électronique -->
        <Card
          variant="glass"
          interactive
          class="glow-effect animate-fade-in-up cursor-pointer"
          style="animation-delay: 0.5s;"
          @click="router.push('/wallet')"
        >
          <div class="flex items-center justify-start sm:justify-between">
            <div>
              <div class="text-responsive-xl lg:text-responsive-xl font-semibold text-indigo-600 mb-2">
                {{ walletStore.formattedBalance || '0 XOF' }}
              </div>
              <p class="text-responsive-sm text-body font-medium">Mon portefeuille</p>
              <div class="flex items-center mt-2 text-responsive-xs text-indigo-600">
                <Wallet class="w-5 h-5 mr-1" />
                <span v-if="walletStore.isActive">Actif</span>
                <span v-else>Inactif</span>
              </div>
            </div>
            <div class="w-16 h-16 bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-2xl flex items-center justify-center">
              <Wallet class="w-10 h-10 text-indigo-600" />
            </div>
          </div>
        </Card>
      </div>

      <div class="grid lg:grid-cols-3 gap-6 sm:gap-8">
        <!-- Section principale gauche -->
        <div class="lg:col-span-2 space-y-8">
          <!-- Réservations récentes -->
          <Card class="animate-fade-in-up" style="animation-delay: 0.5s;">
            <div class="flex items-center justify-start sm:justify-between mb-6">
              <div>
                <h3 class="text-responsive-xl font-semibold text-heading mb-1">Mes réservations récentes</h3>
                <p class="text-responsive-sm text-body">Vos dernières réservations de produits</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                class="text-primary hover:text-primary-emphasis"
                @click="router.push('/reservations')"
              >
                <span>Voir tout</span>
                <ArrowRight class="w-5 h-5" />
              </Button>
            </div>

            <div class="space-y-4">
              <!-- Loading state -->
              <div v-if="loading" class="space-y-4">
                <div v-for="i in 3" :key="i" class="flex items-center gap-4 p-4 rounded-xl border border-neutral-200 animate-pulse">
                  <div class="w-16 h-16 bg-neutral-200 rounded-xl" />
                  <div class="flex-1 space-y-2">
                    <div class="h-5 bg-neutral-200 rounded w-3/4" />
                    <div class="h-3 bg-neutral-200 rounded w-1/2" />
                  </div>
                </div>
              </div>

              <div v-else-if="recentReservations.length === 0" class="text-left sm:text-center py-8 sm:py-10 lg:py-12">
                <div class="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShoppingBag class="w-10 h-10 text-placeholder" />
                </div>
                <p class="text-body mb-4">Aucune réservation récente</p>
                <Button variant="primary" size="sm" @click="router.push('/products')">
                  Découvrir les produits
                </Button>
              </div>

              <div
                v-for="reservation in recentReservations"
                v-else
                :key="reservation.id"
                class="flex items-center gap-4 p-4 rounded-xl border border-neutral-200 hover:border-primary-300 hover:transition-all duration-200"
              >
                <div class="w-16 h-16 bg-nav-gradient rounded-xl flex items-center justify-center">
                  <span class="text-white font-semibold">{{ reservation.merchant.name[0] }}</span>
                </div>
                <div class="flex-1 min-w-0">
                  <h4 class="font-semibold text-heading mb-1">{{ reservation.product.name }}</h4>
                  <p class="text-responsive-sm text-body mb-1">{{ reservation.merchant.name }}</p>
                  <div class="flex items-center gap-4 text-responsive-xs">
                    <Badge variant="primary">{{ formatPrice(reservation.price) }}</Badge>
                    <span class="text-muted">{{ formatDate(reservation.pickup_date) }}</span>
                  </div>
                </div>
                <div class="text-right">
                  <Badge :variant="getStatusVariant(reservation.status)">
                    {{ getStatusLabel(reservation.status) }}
                  </Badge>
                </div>
              </div>
            </div>
          </Card>

          <!-- Produits recommandés -->
          <Card class="animate-fade-in-up" style="animation-delay: 0.6s;">
            <div class="flex items-center justify-start sm:justify-between mb-6">
              <div>
                <h3 class="text-responsive-xl font-semibold text-heading mb-1">Recommandés pour vous</h3>
                <p class="text-responsive-sm text-body">Basé sur vos préférences et votre localisation</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                class="text-primary hover:text-primary-emphasis"
                @click="router.push('/products')"
              >
                <span>Voir le catalogue</span>
                <ArrowRight class="w-5 h-5" />
              </Button>
            </div>

            <div class="grid md:grid-cols-2 gap-4">
              <div
                v-for="product in recommendedProducts"
                :key="product.id"
                class="p-4 rounded-xl border border-neutral-200 hover:border-primary-300 hover:transition-all duration-200 cursor-pointer active:scale-95 touch-manipulation group"
                @click="viewProduct(product)"
              >
                <div class="flex items-center gap-3 mb-3">
                  <div class="w-12 h-12 bg-gradient-to-r from-accent-blue to-accent-blue/90 rounded-xl flex items-center justify-center">
                    <Package class="w-10 h-10 text-white" />
                  </div>
                  <div class="flex-1 min-w-0">
                    <h4 class="font-semibold text-heading mb-1 group-hover:transition-colors">
                      {{ product.name }}
                    </h4>
                    <p class="text-responsive-sm text-body">{{ product.merchant.name }}</p>
                  </div>
                </div>
                <div class="flex items-center justify-start sm:justify-between">
                  <div class="flex items-center gap-2">
                    <span class="text-responsive-lg font-semibold text-primary">{{ formatPrice(product.discounted_price) }}</span>
                    <span class="text-responsive-sm text-placeholder line-through">{{ formatPrice(product.original_price) }}</span>
                  </div>
                  <Badge variant="success">-{{ product.discount }}%</Badge>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <!-- Sidebar droite -->
        <div class="space-y-6">
          <!-- Badge d'impact -->
          <Card variant="gradient" class="text-left sm:text-center animate-fade-in-up" style="animation-delay: 0.7s;">
            <div class="text-display-lg mb-4">🌍</div>
            <h3 class="text-responsive-xl font-semibold text-heading mb-2">Éco-Héros</h3>
            <p class="text-responsive-sm text-body mb-4">
              Vous avez évité le gaspillage de {{ userStats.productsSaved }} produits !
            </p>
            <div class="w-full bg-neutral-200 rounded-full h-2 mb-4">
              <div
                class="bg-nav-gradient h-2 rounded-full transition-all duration-500"
                :style="{ width: Math.min(100, (userStats.productsSaved / 100) * 100) + '%' }"
              />
            </div>
            <p class="text-responsive-xs text-muted">
              Plus que {{ Math.max(0, 100 - userStats.productsSaved) }} produits pour le niveau suivant
            </p>
          </Card>

          <!-- Actions rapides -->
          <Card class="animate-fade-in-up" style="animation-delay: 0.8s;">
            <h3 class="text-responsive-lg font-semibold text-heading mb-4">Actions rapides</h3>
            <div class="space-y-3">
              <router-link to="/products" class="flex items-center gap-3 p-3 rounded-xl hover:transition-colors group">
                <div class="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center group-hover:transition-colors">
                  <Search class="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p class="font-medium text-heading">Chercher des produits</p>
                  <p class="text-responsive-xs text-body">Découvrez les offres près de chez vous</p>
                </div>
              </router-link>

              <router-link to="/reservations" class="flex items-center gap-3 p-3 rounded-xl hover:transition-colors group">
                <div class="w-10 h-10 bg-accent-blue/10 rounded-xl flex items-center justify-center group-hover:transition-colors">
                  <Calendar class="w-5 h-5 text-accent-blue" />
                </div>
                <div>
                  <p class="font-medium text-heading">Mes réservations</p>
                  <p class="text-responsive-xs text-body">Gérer mes commandes en cours</p>
                </div>
              </router-link>

              <router-link to="/profile" class="flex items-center gap-3 p-3 rounded-xl hover:transition-colors group">
                <div class="w-10 h-10 bg-accent-orange/10 rounded-xl flex items-center justify-center group-hover:transition-colors">
                  <User class="w-5 h-5 text-accent-orange" />
                </div>
                <div>
                  <p class="font-medium text-heading">Mon profil</p>
                  <p class="text-responsive-xs text-body">Paramètres et préférences</p>
                </div>
              </router-link>
            </div>
          </Card>

          <!-- Tips écologiques -->
          <Card class="bg-gradient-to-br from-primary-50 to-primary-100 border-primary-200 animate-fade-in-up" style="animation-delay: 0.9s;">
            <div class="flex items-center gap-3 mb-4">
              <div class="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center">
                <Lightbulb class="w-5 h-5 text-white" />
              </div>
              <h3 class="text-responsive-lg font-semibold text-primary-800">Astuce du jour</h3>
            </div>
            <p class="text-responsive-sm text-primary-emphasis mb-4">
              {{ currentTip.text }}
            </p>
            <Button size="sm" class="bg-primary-500 text-white hover:bg-primary-600 w-full" @click="nextTip">
              Astuce suivante
            </Button>
          </Card>
        </div>
      </div>
    </div>
  </DashboardLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useWalletStore } from '@/stores/wallet'
import { formatPrice } from '@/utils/currency'
import {
  TrendingUp, DollarSign, Package, ShoppingBag, Leaf, TreePine,
  Clock, Calendar, ArrowRight, Search, User, Lightbulb, Wallet
} from 'lucide-vue-next'
import DashboardLayout from '@/components/ui/DashboardLayout.vue'
import { useDashboardLayout } from '@/composables/useDashboardLayout'

// Import 2025 Design System components
import Card from '@/components/ui/2025/Card.vue'
import Button from '@/components/ui/2025/Button.vue'
import Badge from '@/components/ui/2025/Badge.vue'

const router = useRouter()
const authStore = useAuthStore()
const walletStore = useWalletStore()
const { sidebar, header } = useDashboardLayout('consumer')

// État des données utilisateur
const userStats = ref({
  totalSavings: 83670, // 127.50€ × 656
  monthSavings: 15609, // 23.80€ × 656
  productsSaved: 42,
  monthProducts: 8,
  co2Saved: 12.4,
  activeReservations: 3
})

interface ReservationItem {
  id: number
  merchant: { name: string }
  product: { name: string }
  price: number
  pickup_date: string
  status: string
}

const recentReservations = ref<ReservationItem[]>([])
const loading = ref(true)

const recommendedProducts = ref([
  {
    id: 1,
    name: 'Pâtisseries du jour',
    merchant: { name: 'Pâtisserie Delacroix' },
    original_price: 9840, // 15.00€ × 656
    discounted_price: 4920, // 7.50€ × 656
    discount: 50
  },
  {
    id: 2,
    name: 'Sandwich club',
    merchant: { name: 'Café Central' },
    original_price: 5576, // 8.50€ × 656
    discounted_price: 2788, // 4.25€ × 656
    discount: 50
  }
])

const ecoTips = ref([
  { text: 'Privilégiez les commerces de proximité pour réduire votre empreinte carbone.' },
  { text: 'Réservez vos produits en fin de journée pour les meilleures offres.' },
  { text: 'Apportez vos sacs réutilisables lors de vos retraits.' },
  { text: "Partagez l'application avec vos proches pour multiplier l'impact." }
])

const currentTipIndex = ref(0)
const currentTip = computed(() => ecoTips.value[currentTipIndex.value])

// Load recent reservations
const loadRecentReservations = async () => {
  try {
    const response = await fetch('http://localhost:8000/api/reservations?per_page=3', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authStore.token}`
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    if (data.success && data.data) {
      // Transform API data to match dashboard interface
      recentReservations.value = data.data.map((res: any) => ({
        id: res.id,
        product: {
          name: res.product?.name || 'Produit inconnu'
        },
        merchant: {
          name: res.product?.merchant?.name || res.product?.merchant?.business_name || 'Commerçant inconnu'
        },
        price: parseFloat(res.total_amount || 0),
        pickup_date: res.pickup_date ? new Date(res.pickup_date) : new Date(res.created_at),
        status: res.status
      }))
    }
  } catch (error) {
    // console.error('Erreur lors du chargement des réservations récentes:', error)
    recentReservations.value = []
  } finally {
    loading.value = false
  }
}

// Fonctions utilitaires

const formatDate = (date: string | Date) => {
  const dateObj = date instanceof Date ? date : new Date(date)
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short'
  }).format(dateObj)
}

// Convert status to 2025 Badge variant
const getStatusVariant = (status: string) => {
  const variants = {
    'confirmed': 'warning' as const,
    'completed': 'success' as const,
    'cancelled': 'error' as const,
    'pending': 'secondary' as const
  }
  return variants[status as keyof typeof variants] || 'secondary' as const
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
  } else {
    loadRecentReservations()
    walletStore.fetchWallet()
  }
})
</script>
