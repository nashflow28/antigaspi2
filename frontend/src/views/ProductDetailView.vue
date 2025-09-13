<template>
  <div class="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100">
    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center min-h-screen">
      <div class="flex items-center gap-3">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <span class="text-neutral-600">Chargement du produit...</span>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="container mx-auto px-4 py-16 text-center">
      <AlertCircle class="w-16 h-16 text-red-500 mx-auto mb-4" />
      <h2 class="text-2xl font-bold text-neutral-900 mb-2">Produit introuvable</h2>
      <p class="text-neutral-600 mb-6">Le produit que vous recherchez n'existe pas ou a été supprimé.</p>
      <router-link to="/products" class="btn btn-primary">
        Retour au catalogue
      </router-link>
    </div>

    <!-- Product Detail -->
    <div v-else-if="product" class="container mx-auto px-4 py-8">
      <!-- Breadcrumb -->
      <nav class="flex items-center gap-2 text-sm text-neutral-600 mb-8">
        <router-link to="/" class="hover:text-primary-600 transition-colors">Accueil</router-link>
        <ChevronRight class="w-4 h-4" />
        <router-link to="/products" class="hover:text-primary-600 transition-colors">Catalogue</router-link>
        <ChevronRight class="w-4 h-4" />
        <span class="text-neutral-900 font-medium">{{ product.name }}</span>
      </nav>

      <!-- Main Content -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
        <!-- Product Image -->
        <div class="space-y-6">
          <div class="relative aspect-square bg-gradient-to-br from-primary-100 to-secondary-100 rounded-2xl overflow-hidden">
            <!-- Main Image Placeholder -->
            <div class="absolute inset-0 flex items-center justify-center">
              <Package class="w-32 h-32 text-primary-400 opacity-50" />
            </div>

            <!-- Status Badges -->
            <div class="absolute top-6 left-6 flex flex-col gap-3">
              <!-- Availability Badge -->
              <div class="bg-white/90 backdrop-blur-sm px-3 py-2 rounded-full text-sm font-medium">
                <div class="flex items-center gap-2">
                  <div class="w-2 h-2 bg-success-500 rounded-full"></div>
                  <span>{{ availableQuantity }} disponible{{ availableQuantity > 1 ? 's' : '' }}</span>
                </div>
              </div>
            </div>

            <!-- Discount Badge -->
            <div class="absolute top-6 right-6 bg-success-500 text-white px-4 py-2 rounded-full text-lg font-bold shadow-soft">
              -{{ product.discount }}%
            </div>

            <!-- Countdown -->
            <div class="absolute bottom-6 left-6 bg-accent-500 text-white px-4 py-2 rounded-full text-sm font-medium">
              ⏰ {{ formatTimeLeft(product.expires_at) }}
            </div>
          </div>
        </div>

        <!-- Product Information -->
        <div class="space-y-8">
          <!-- Header -->
          <div>
            <h1 class="text-3xl lg:text-4xl font-bold text-neutral-900 mb-4">
              {{ product.name }}
            </h1>
            <p class="text-lg text-neutral-600 leading-relaxed">
              {{ product.description }}
            </p>
          </div>

          <!-- Pricing -->
          <div class="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/50">
            <div class="flex items-baseline gap-4 mb-4">
              <span class="text-4xl font-bold text-primary-600">
                {{ formatPrice(product.discounted_price) }}
              </span>
              <span class="text-xl text-neutral-400 line-through">
                {{ formatPrice(product.original_price) }}
              </span>
              <span class="bg-success-100 text-success-700 px-3 py-1 rounded-full text-sm font-medium">
                Économisez {{ formatPrice(product.original_price - product.discounted_price) }}
              </span>
            </div>
            <p class="text-sm text-neutral-600">
              Prix par unité • Expiration le {{ formatDate(product.expires_at) }}
            </p>
          </div>

          <!-- Merchant Information -->
          <div class="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/50">
            <div class="flex items-start justify-between mb-4">
              <div>
                <h3 class="text-lg font-semibold text-neutral-900 mb-2">
                  {{ product.merchant.name }}
                </h3>
                <div class="flex items-center gap-2 text-neutral-600 mb-2">
                  <MapPin class="w-4 h-4" />
                  <span>{{ product.merchant.address }}</span>
                </div>
                <div class="flex items-center gap-2 text-neutral-600">
                  <Navigation class="w-4 h-4" />
                  <span>À {{ product.merchant.distance }}km de vous</span>
                </div>
              </div>
              <button class="btn btn-ghost btn-sm">
                <Phone class="w-4 h-4" />
                Contacter
              </button>
            </div>
          </div>

          <!-- Quantity Selector -->
          <div class="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/50">
            <h3 class="text-lg font-semibold text-neutral-900 mb-4">Quantité</h3>
            <div class="flex items-center gap-4">
              <button
                @click="decreaseQuantity"
                :disabled="selectedQuantity <= 1"
                class="btn btn-ghost btn-sm w-10 h-10 rounded-full p-0"
              >
                <Minus class="w-4 h-4" />
              </button>
              <span class="text-2xl font-bold text-neutral-900 min-w-12 text-center">
                {{ selectedQuantity }}
              </span>
              <button
                @click="increaseQuantity"
                :disabled="selectedQuantity >= availableQuantity"
                class="btn btn-ghost btn-sm w-10 h-10 rounded-full p-0"
              >
                <Plus class="w-4 h-4" />
              </button>
            </div>
            <p class="text-sm text-neutral-600 mt-2">
              Maximum {{ availableQuantity }} unité{{ availableQuantity > 1 ? 's' : '' }} disponible{{ availableQuantity > 1 ? 's' : '' }}
            </p>
          </div>

          <!-- Action Buttons -->
          <div class="flex flex-col sm:flex-row gap-4">
            <button
              @click="reserveProduct"
              :disabled="availableQuantity === 0 || reserving"
              class="btn btn-primary flex-1 text-lg py-4"
            >
              <ShoppingCart v-if="!reserving" class="w-5 h-5" />
              <div v-else class="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              {{ reserving ? 'Réservation...' : `Réserver • ${formatPrice(product.discounted_price * selectedQuantity)}` }}
            </button>
            <button
              @click="$router.go(-1)"
              class="btn btn-ghost sm:w-auto text-lg py-4"
            >
              <ArrowLeft class="w-5 h-5" />
              Retour
            </button>
          </div>

          <!-- Additional Info -->
          <div class="bg-blue-50 border border-blue-200 rounded-2xl p-6">
            <div class="flex items-start gap-3">
              <Info class="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div class="text-sm text-blue-800">
                <p class="font-medium mb-1">Information importante :</p>
                <p>Ce produit doit être récupéré avant sa date d'expiration. Après réservation, vous recevrez un code QR à présenter au commerçant pour retirer votre commande.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Related Information -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- Impact Environment -->
        <div class="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
          <div class="flex items-center gap-3 mb-4">
            <Leaf class="w-6 h-6 text-green-600" />
            <h3 class="text-lg font-semibold text-green-900">Impact écologique</h3>
          </div>
          <div class="space-y-2 text-sm text-green-800">
            <div class="flex justify-between">
              <span>CO₂ économisé :</span>
              <span class="font-medium">{{ (product.original_price * 0.2).toFixed(1) }}kg</span>
            </div>
            <div class="flex justify-between">
              <span>Eau sauvée :</span>
              <span class="font-medium">{{ (product.original_price * 15).toFixed(0) }}L</span>
            </div>
          </div>
        </div>

        <!-- Merchant Rating -->
        <div class="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-6 border border-yellow-200">
          <div class="flex items-center gap-3 mb-4">
            <Star class="w-6 h-6 text-yellow-600" />
            <h3 class="text-lg font-semibold text-yellow-900">Évaluation</h3>
          </div>
          <div class="space-y-2">
            <div class="flex items-center gap-2">
              <div class="flex">
                <Star class="w-4 h-4 text-yellow-500 fill-current" />
                <Star class="w-4 h-4 text-yellow-500 fill-current" />
                <Star class="w-4 h-4 text-yellow-500 fill-current" />
                <Star class="w-4 h-4 text-yellow-500 fill-current" />
                <Star class="w-4 h-4 text-yellow-300" />
              </div>
              <span class="text-sm text-yellow-800 font-medium">4.2/5</span>
            </div>
            <p class="text-sm text-yellow-800">Basé sur 127 avis</p>
          </div>
        </div>

        <!-- Quick Info -->
        <div class="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-6 border border-purple-200">
          <div class="flex items-center gap-3 mb-4">
            <Clock class="w-6 h-6 text-purple-600" />
            <h3 class="text-lg font-semibold text-purple-900">Récupération</h3>
          </div>
          <div class="space-y-2 text-sm text-purple-800">
            <div class="flex justify-between">
              <span>Horaires :</span>
              <span class="font-medium">9h-19h</span>
            </div>
            <div class="flex justify-between">
              <span>Délai :</span>
              <span class="font-medium">Immédiat</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  Package,
  MapPin,
  Navigation,
  Phone,
  Minus,
  Plus,
  ShoppingCart,
  ArrowLeft,
  Info,
  ChevronRight,
  AlertCircle,
  Leaf,
  Star,
  Clock
} from 'lucide-vue-next'

interface Product {
  id: number
  name: string
  description: string
  original_price: number
  discounted_price: number
  discount: number
  merchant: {
    name: string
    address: string
    distance: number
  }
  expires_at: Date
  available_quantity: number
  reserved_quantity: number
  category?: string
}

const route = useRoute()
const router = useRouter()

// State
const product = ref<Product | null>(null)
const loading = ref(true)
const error = ref(false)
const selectedQuantity = ref(1)
const reserving = ref(false)

// Computed
const availableQuantity = computed(() => {
  if (!product.value) return 0
  return product.value.available_quantity - product.value.reserved_quantity
})

// Methods
const formatPrice = (price: number) => {
  return `${price.toFixed(2)}€`
}

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

const formatTimeLeft = (expiresAt: Date) => {
  const now = new Date()
  const diff = expiresAt.getTime() - now.getTime()

  if (diff < 0) return 'Expiré'

  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

  if (hours > 0) {
    return `${hours}h${minutes > 0 ? ` ${minutes}m` : ''}`
  }
  return `${minutes}m`
}

const increaseQuantity = () => {
  if (selectedQuantity.value < availableQuantity.value) {
    selectedQuantity.value++
  }
}

const decreaseQuantity = () => {
  if (selectedQuantity.value > 1) {
    selectedQuantity.value--
  }
}

const fetchProduct = async () => {
  try {
    loading.value = true
    error.value = false

    const productId = parseInt(route.params.id as string)

    // Mock data for now - replace with actual API call
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Mock product data based on ID
    const mockProducts: Product[] = [
      {
        id: 1,
        name: "Pain de campagne artisanal",
        description: "Pain traditionnel fait maison, cuit au four à bois dans notre boulangerie familiale depuis 1952. Préparé avec des farines biologiques locales et un levain naturel de 20 ans d'âge. Croûte croustillante et mie moelleuse, parfait pour accompagner tous vos repas de famille.",
        original_price: 4.50,
        discounted_price: 2.25,
        discount: 50,
        category: "bakery",
        merchant: {
          name: "Boulangerie Martin",
          address: "12 Rue de la Paix, 75001 Paris",
          distance: 0.8
        },
        expires_at: new Date(Date.now() + 4 * 60 * 60 * 1000),
        available_quantity: 5,
        reserved_quantity: 2
      },
      {
        id: 2,
        name: "Plateau de fromages",
        description: "Assortiment de fromages français sélectionnés par notre maître fromager : camembert de Normandie AOP, roquefort Papillon, chèvre cendré de Touraine, comté 18 mois d'affinage. Idéal pour un apéritif raffiné ou un plateau de fin de repas. Accompagné de conseils de dégustation.",
        original_price: 15.90,
        discounted_price: 7.95,
        discount: 50,
        category: "dairy",
        merchant: {
          name: "Fromagerie Dubois",
          address: "45 Avenue Victor Hugo, 75016 Paris",
          distance: 1.2
        },
        expires_at: new Date(Date.now() + 2 * 60 * 60 * 1000),
        available_quantity: 3,
        reserved_quantity: 0
      }
    ]

    const foundProduct = mockProducts.find(p => p.id === productId)

    if (!foundProduct) {
      error.value = true
      return
    }

    product.value = foundProduct
  } catch (err) {
    console.error('Erreur lors du chargement du produit:', err)
    error.value = true
  } finally {
    loading.value = false
  }
}

const reserveProduct = async () => {
  if (!product.value || availableQuantity.value === 0) return

  try {
    reserving.value = true

    // Mock API call - replace with actual reservation logic
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Navigate to reservation page
    router.push(`/products/${product.value.id}/reserve`)
  } catch (error) {
    console.error('Erreur lors de la réservation:', error)
    // Handle error (show toast, etc.)
  } finally {
    reserving.value = false
  }
}

// Lifecycle
onMounted(() => {
  fetchProduct()
})
</script>