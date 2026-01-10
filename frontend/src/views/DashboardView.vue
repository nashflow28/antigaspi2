<template>
  <DashboardLayout
    :sidebar="sidebar"
    :header="header"
    class="bg-gradient-to-br from-gray-50 to-blue-50"
  >
    <!-- Page Header -->
    <div class="sticky top-20 z-40 border-b border-gray-200/70 bg-gray-100/80 backdrop-blur-lg">
      <div class="container px-3 sm:px-4 lg:px-6 py-6">
        <div class="flex items-center justify-start sm:justify-between animate-fade-in-up">
          <div>
            <h1 class="text-xl lg:text-3xl font-semibold text-gray-900 mt-2">
              Bonjour {{ authStore.user?.first_name }} ! 👋
            </h1>
            <p class="text-lg text-gray-700">
              Découvrez vos économies et votre impact environnemental
            </p>
          </div>
          <div class="hidden sm:block md:flex items-center gap-3">
            <Badge variant="success" size="lg">
              🌱 {{ userStats.co2Saved }}kg CO₂ économisés
            </Badge>
          </div>
        </div>
      </div>
    </div>

    <div class="container px-3 sm:px-4 lg:px-6 py-6 sm:py-8">
      <!-- Quick Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-6 mt-4 sm:mb-3xl">
        <!-- Économies réalisées -->
        <Card
          variant="glass"
          interactive
          class="glow-effect animate-fade-in-up"
          style="animation-delay: 0.1s;"
        >
          <div class="flex items-center justify-start sm:justify-between">
            <div>
              <div class="text-xl lg:text-xl font-semibold text-blue-600 mt-2">
                {{ formatPrice(userStats.totalSavings) }}
              </div>
              <p class="text-sm text-gray-700 font-medium">Économies totales</p>
              <div class="flex items-center mt-2 text-xs text-blue-600">
                <TrendingUp class="h-4 w-4 mr-1" />
                <span>+{{ formatPrice(userStats.monthSavings) }} ce mois</span>
              </div>
            </div>
            <div class="w-12 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded flex items-center justify-center">
              <DollarSign class="h-6 w-6 text-blue-600" />
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
              <div class="text-xl lg:text-xl font-semibold text-blue-600 mt-2">
                {{ userStats.productsSaved }}
              </div>
              <p class="text-sm text-gray-700 font-medium">Produits sauvés</p>
              <div class="flex items-center mt-2 text-xs text-blue-600">
                <Package class="h-4 w-4 mr-1" />
                <span>{{ userStats.monthProducts }} ce mois</span>
              </div>
            </div>
            <div class="w-12 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded flex items-center justify-center">
              <ShoppingBag class="h-6 w-6 text-blue-600" />
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
              <div class="text-xl lg:text-xl font-semibold text-blue-500 mt-2">
                {{ userStats.co2Saved }}kg
              </div>
              <p class="text-sm text-gray-700 font-medium">CO₂ évité</p>
              <div class="flex items-center mt-2 text-xs text-blue-500">
                <Leaf class="h-4 w-4 mr-1" />
                <span>≈ {{ Math.round(userStats.co2Saved / 2.3) }} km en voiture</span>
              </div>
            </div>
            <div class="w-12 h-10 bg-gradient-to-br from-blue-500/10 to-blue-500/20 rounded flex items-center justify-center">
              <TreePine class="h-6 w-6 text-blue-500" />
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
              <div class="text-xl lg:text-xl font-semibold text-orange-500 mt-2">
                {{ userStats.activeReservations }}
              </div>
              <p class="text-sm text-gray-700 font-medium">Réservations actives</p>
              <div class="flex items-center mt-2 text-xs text-orange-500">
                <Clock class="h-4 w-4 mr-1" />
                <span>À récupérer aujourd'hui</span>
              </div>
            </div>
            <div class="w-12 h-10 bg-gradient-to-br from-orange-500/10 to-orange-500/20 rounded flex items-center justify-center">
              <Calendar class="h-6 w-6 text-orange-500" />
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
              <div class="text-xl lg:text-xl font-semibold text-indigo-600 mt-2">
                {{ walletStore.formattedBalance || '0 XOF' }}
              </div>
              <p class="text-sm text-gray-700 font-medium">Mon portefeuille</p>
              <div class="flex items-center mt-2 text-xs text-indigo-600">
                <Wallet class="h-4 w-4 mr-1" />
                <span v-if="walletStore.isActive">Actif</span>
                <span v-else>Inactif</span>
              </div>
            </div>
            <div class="w-12 h-10 bg-gradient-to-br from-indigo-100 to-indigo-200 rounded flex items-center justify-center">
              <Wallet class="h-6 w-6 text-indigo-600" />
            </div>
          </div>
        </Card>
      </div>

      <div class="grid lg:grid-cols-3 gap-6 sm:gap-8">
        <!-- Section principale gauche -->
        <div class="lg:col-span-2 space-y-8">
          <!-- Réservations récentes -->
          <Card class="animate-fade-in-up" style="animation-delay: 0.5s;">
            <div class="flex items-center justify-start sm:justify-between mt-4">
              <div>
                <h3 class="text-xl font-semibold text-gray-900 mb-1">Mes réservations récentes</h3>
                <p class="text-sm text-gray-700">Vos dernières réservations de produits</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                :right-icon="ArrowRight"
                class="text-blue-600 hover:text-blue-900"
                @click="router.push('/reservations')"
              >
                Voir tout
              </Button>
            </div>

            <div class="space-y-4">
              <!-- Loading state -->
              <div v-if="loading" class="space-y-4">
                <div v-for="i in 3" :key="i" class="flex items-center gap-3 p-4 rounded border border-gray-200 animate-pulse">
                  <div class="w-12 h-10 bg-gray-200 rounded" />
                  <div class="flex-1 space-y-4">
                    <div class="h-4 bg-gray-200 rounded w-3/4" />
                    <div class="h-3 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
              </div>

              <div v-else-if="recentReservations.length === 0" class="text-left sm:text-center py-8 sm:py-12 lg:py-16">
                <div class="w-12 h-10 bg-gray-100 rounded-full flex items-center justify-center mx-auto mt-3">
                  <ShoppingBag class="h-6 w-6 text-gray-400" />
                </div>
                <p class="text-gray-700 mt-3">Aucune réservation récente</p>
                <Button variant="primary" size="sm" @click="router.push('/products')">
                  Découvrir les produits
                </Button>
              </div>

              <div
                v-for="reservation in recentReservations"
                v-else
                :key="reservation.id"
                class="flex items-center gap-3 p-4 rounded border border-gray-200 hover:border-blue-300 hover:transition-all duration-200"
              >
                <div class="w-12 h-10 bg-gradient-to-r from-blue-600 to-blue-700 rounded flex items-center justify-center">
                  <span class="text-white font-semibold">{{ reservation.merchant.name[0] }}</span>
                </div>
                <div class="flex-1 min-w-none">
                  <h4 class="font-semibold text-gray-900 mb-1">{{ reservation.product.name }}</h4>
                  <p class="text-sm text-gray-700 mb-1">{{ reservation.merchant.name }}</p>
                  <div class="flex items-center gap-3 text-xs">
                    <Badge variant="primary">{{ formatPrice(reservation.price) }}</Badge>
                    <span class="text-gray-500">{{ formatDate(reservation.pickup_date) }}</span>
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
            <div class="flex items-center justify-start sm:justify-between mt-4">
              <div>
                <h3 class="text-xl font-semibold text-gray-900 mb-1">Recommandés pour vous</h3>
                <p class="text-sm text-gray-700">Basé sur vos préférences et votre localisation</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                :right-icon="ArrowRight"
                class="text-blue-600 hover:text-blue-900"
                @click="router.push('/products')"
              >
                Voir le catalogue
              </Button>
            </div>

            <div class="grid md:grid-cols-2 gap-3">
              <div
                v-for="product in recommendedProducts"
                :key="product.id"
                class="p-4 rounded border border-gray-200 hover:border-blue-300 hover:transition-all duration-200 cursor-pointer active:scale-95 touch-manipulation group"
                @click="viewProduct(product)"
              >
                <div class="flex items-center gap-4 mb-4">
                  <div class="w-12 h-10 bg-gradient-to-r from-blue-500 to-blue-500/90 rounded flex items-center justify-center">
                    <Package class="h-6 w-6 text-white" />
                  </div>
                  <div class="flex-1 min-w-none">
                    <h4 class="font-semibold text-gray-900 mb-1 group-hover:transition-colors">
                      {{ product.name }}
                    </h4>
                    <p class="text-sm text-gray-700">{{ product.merchant.name }}</p>
                  </div>
                </div>
                <div class="flex items-center justify-start sm:justify-between">
                  <div class="flex items-center gap-2">
                    <span class="text-lg font-semibold text-blue-600">{{ formatPrice(product.discounted_price) }}</span>
                    <span class="text-sm text-gray-400 line-through">{{ formatPrice(product.original_price) }}</span>
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
            <div class="text-4xl mt-3">🌍</div>
            <h3 class="text-xl font-semibold text-gray-900 mt-2">Éco-Héros</h3>
            <p class="text-sm text-gray-700 mt-3">
              Vous avez évité le gaspillage de {{ userStats.productsSaved }} produits !
            </p>
            <div class="w-full bg-gray-200 rounded-full h-4 mt-3">
              <div
                class="bg-gradient-to-r from-blue-600 to-blue-700 h-4 rounded-full transition-all duration-500"
                :style="{ width: Math.min(100, (userStats.productsSaved / 100) * 100) + '%' }"
              />
            </div>
            <p class="text-xs text-gray-500">
              Plus que {{ Math.max(0, 100 - userStats.productsSaved) }} produits pour le niveau suivant
            </p>
          </Card>

          <!-- Actions rapides -->
          <Card class="animate-fade-in-up" style="animation-delay: 0.8s;">
            <h3 class="text-lg font-semibold text-gray-900 mt-3">Actions rapides</h3>
            <div class="space-y-2">
              <router-link to="/products" class="flex items-center gap-4 p-3 rounded hover:transition-colors group">
                <div class="h-6 w-6 bg-blue-100 rounded flex items-center justify-center group-hover:transition-colors">
                  <Search class="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p class="font-medium text-gray-900">Chercher des produits</p>
                  <p class="text-xs text-gray-700">Découvrez les offres près de chez vous</p>
                </div>
              </router-link>

              <router-link to="/reservations" class="flex items-center gap-4 p-3 rounded hover:transition-colors group">
                <div class="h-6 w-6 bg-blue-500/10 rounded flex items-center justify-center group-hover:transition-colors">
                  <Calendar class="h-4 w-4 text-blue-500" />
                </div>
                <div>
                  <p class="font-medium text-gray-900">Mes réservations</p>
                  <p class="text-xs text-gray-700">Gérer mes commandes en cours</p>
                </div>
              </router-link>

              <router-link to="/profile" class="flex items-center gap-4 p-3 rounded hover:transition-colors group">
                <div class="h-6 w-6 bg-orange-500/10 rounded flex items-center justify-center group-hover:transition-colors">
                  <User class="h-4 w-4 text-orange-500" />
                </div>
                <div>
                  <p class="font-medium text-gray-900">Mon profil</p>
                  <p class="text-xs text-gray-700">Paramètres et préférences</p>
                </div>
              </router-link>
            </div>
          </Card>

          <!-- Tips écologiques -->
          <Card class="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 animate-fade-in-up" style="animation-delay: 0.9s;">
            <div class="flex items-center gap-4 mt-3">
              <div class="h-6 w-6 bg-blue-500 rounded-full flex items-center justify-center">
                <Lightbulb class="h-4 w-4 text-white" />
              </div>
              <h3 class="text-lg font-semibold text-blue-800">Astuce du jour</h3>
            </div>
            <p class="text-sm text-blue-900 mt-3">
              {{ currentTip.text }}
            </p>
            <Button
              size="sm"
              variant="primary"
              class="w-full"
              @click="nextTip"
            >
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
import apiService from '@/services/api'
import {
  TrendingUp, DollarSign, Package, ShoppingBag, Leaf, TreePine,
  Clock, Calendar, ArrowRight, Search, User, Lightbulb, Wallet
} from 'lucide-vue-next'
import DashboardLayout from '@/components/ui/DashboardLayout.vue'
import { useDashboardLayout } from '@/composables/useDashboardLayout'
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
    const data = await apiService.get<{ success: boolean; data?: any[] }>('/reservations?per_page=3')
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
        pickup_date: res.pickup_date || res.created_at || new Date().toISOString(),
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

type BadgeVariant = 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'outline' | 'promo' | 'soft'

const getStatusVariant = (status: string): BadgeVariant => {
  const variants: Record<string, BadgeVariant> = {
    confirmed: 'warning',
    completed: 'success',
    cancelled: 'error',
    pending: 'secondary'
  }
  return variants[status] || 'secondary'
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
