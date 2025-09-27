<template>
  <div class="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100">
    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center min-h-screen">
      <div class="flex items-center gap-3">
        <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
        <span class="text-neutral-600">Chargement du produit...</span>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="container mx-auto px-4 py-16 text-center">
      <AlertCircle class="w-16 h-16 text-red-500 mx-auto mb-4" />
      <h2 class="text-responsive-xl font-semibold text-neutral-900 mb-2">Produit introuvable</h2>
      <p class="text-neutral-600 mb-6">Le produit que vous recherchez n'existe pas ou a été supprimé.</p>
      <Button variant="primary" @click="$router.push('/products')">
        Retour au catalogue
      </Button>
    </div>

    <!-- Product Detail -->
    <div v-else-if="product" class="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <!-- Breadcrumb -->
      <nav class="flex items-center gap-2 text-responsive-sm text-neutral-600 mb-8">
        <router-link to="/" class="hover:transition-colors">Accueil</router-link>
        <ChevronRight class="w-5 h-5" />
        <router-link to="/products" class="hover:transition-colors">Catalogue</router-link>
        <ChevronRight class="w-5 h-5" />
        <span class="text-neutral-900 font-medium">{{ product.name }}</span>
      </nav>

      <!-- Main Content -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
        <!-- Product Image -->
        <div class="space-y-6">
          <Card
            variant="glass"
            :no-padding="true"
            class="relative aspect-square bg-gradient-to-br from-primary-500 via-accent-blue to-accent-blue/90 rounded-3xl overflow-hidden shadow-modern-2025 glow-effect"
          >
            <!-- Product Image or Placeholder -->
            <div v-if="product.image_url" class="absolute inset-0">
              <img
                :src="product.image_url"
                :alt="product.name"
                class="w-full h-full object-cover"
              >
            </div>
            <div v-else class="absolute inset-0 flex items-center justify-center">
              <Package class="w-40 h-40 text-white/20" />
            </div>

            <!-- Glassmorphism overlay -->
            <div class="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

            <!-- Stock Badge -->
            <div class="absolute top-4 left-4">
              <Badge
                :variant="product.quantity > 5 ? 'success' : product.quantity > 0 ? 'warning' : 'error'"
                class="backdrop-blur-md"
              >
                {{ product.quantity > 0 ? `${product.quantity} en stock` : 'Rupture de stock' }}
              </Badge>
            </div>

            <!-- Discount Badge -->
            <div v-if="discountPercentage > 0" class="absolute top-4 right-4">
              <Badge variant="promo" class="backdrop-blur-md">
                -{{ discountPercentage }}%
              </Badge>
            </div>

            <!-- Status Badge -->
            <div class="absolute bottom-4 right-4">
              <Badge
                :variant="statusVariant"
                class="backdrop-blur-md"
              >
                {{ statusLabel }}
              </Badge>
            </div>
          </Card>

          <!-- Additional Product Info -->
          <Card variant="elevated">
            <div class="space-y-4">
              <div class="flex items-center gap-3">
                <MapPin class="w-5 h-5 text-neutral-500" />
                <div>
                  <p class="text-responsive-sm font-medium text-neutral-900">{{ product.merchant?.business_name }}</p>
                  <p class="text-responsive-sm text-neutral-600">{{ product.merchant?.address }}</p>
                </div>
              </div>

              <div class="flex items-center gap-3">
                <Clock class="w-5 h-5 text-neutral-500" />
                <div>
                  <p class="text-responsive-sm font-medium text-neutral-900">Récupération</p>
                  <p class="text-responsive-sm text-neutral-600">
                    {{ formatExpiration(product.expiration_date) }}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <!-- Product Information -->
        <div class="space-y-8">
          <!-- Header -->
          <div>
            <div class="flex items-center gap-3 mb-2">
              <Badge :variant="getCategoryVariant(product.category?.name)">
                {{ product.category?.name }}
              </Badge>
              <Badge
                v-if="product.is_surprise_basket"
                variant="promo"
                class="animate-pulse"
              >
                Panier Surprise
              </Badge>
            </div>

            <h1 class="text-responsive-xl lg:text-display-sm font-semibold text-neutral-900 mb-4">
              {{ product.name }}
            </h1>

            <!-- Pricing -->
            <div class="flex items-center gap-4 mb-6">
              <div class="text-responsive-xl font-semibold text-primary-600">
                {{ formatPrice(product.discounted_price) }} XOF
              </div>
              <div v-if="product.original_price !== product.discounted_price" class="text-responsive-xl text-neutral-500 line-through">
                {{ formatPrice(product.original_price) }} XOF
              </div>
              <Badge v-if="discountPercentage > 0" variant="success">
                Économisez {{ formatPrice(product.original_price - product.discounted_price) }} XOF
              </Badge>
            </div>
          </div>

          <!-- Description -->
          <Card>
            <template #header>
              <h3 class="text-responsive-lg font-semibold">Description</h3>
            </template>
            <p class="text-neutral-700 leading-relaxed">
              {{ product.description || 'Aucune description disponible.' }}
            </p>
          </Card>

          <!-- Reservation Actions -->
          <Card variant="gradient">
            <div class="space-y-6">
              <div>
                <h3 class="text-responsive-lg font-semibold text-neutral-900 mb-4">Réservation</h3>

                <!-- Quantity Selector -->
                <div class="flex items-center gap-4 mb-6">
                  <label class="text-responsive-sm font-medium text-neutral-700">Quantité :</label>
                  <div class="flex items-center border border-neutral-300 rounded-lg">
                    <Button
                      variant="ghost"
                      size="sm"
                      :disabled="reservationQuantity <= 1"
                      @click="decreaseQuantity"
                    >
                      <Minus class="w-5 h-5" />
                    </Button>
                    <input
                      v-model.number="reservationQuantity"
                      type="number"
                      min="1"
                      :max="product.quantity"
                      class="w-16 text-center border-0 focus:ring-0 py-3"
                    >
                    <Button
                      variant="ghost"
                      size="sm"
                      :disabled="reservationQuantity >= product.quantity"
                      @click="increaseQuantity"
                    >
                      <Plus class="w-5 h-5" />
                    </Button>
                  </div>
                </div>

                <!-- Total Price -->
                <div class="flex items-center justify-between p-4 bg-primary-50 rounded-lg mb-6">
                  <span class="text-responsive-sm font-medium text-primary-900">Total :</span>
                  <span class="text-responsive-xl font-semibold text-primary-600">
                    {{ formatPrice(product.discounted_price * reservationQuantity) }} XOF
                  </span>
                </div>

                <!-- Action Buttons -->
                <div class="space-y-3">
                  <Button
                    size="lg"
                    full-width
                    :disabled="product.quantity === 0 || loading"
                    :loading="reservationLoading"
                    @click="handleReservation"
                  >
                    <ShoppingCart class="w-5 h-5 mr-2" />
                    {{ reservationLoading ? 'Réservation...' : 'Réserver maintenant' }}
                  </Button>

                  <Button
                    variant="outline"
                    size="lg"
                    full-width
                    :disabled="loading"
                    @click="addToWishlist"
                  >
                    <Heart :class="['w-5 h-5 mr-2', isInWishlist && 'fill-current text-red-500']" />
                    {{ isInWishlist ? 'Retiré des favoris' : 'Ajouter aux favoris' }}
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          <!-- Share Product -->
          <Card>
            <div class="flex items-center justify-between">
              <h3 class="text-responsive-lg font-semibold text-neutral-900">Partager</h3>
              <div class="flex gap-2">
                <Button variant="ghost" size="sm" @click="shareProduct('facebook')">
                  <Facebook class="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="sm" @click="shareProduct('twitter')">
                  <Twitter class="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="sm" @click="shareProduct('whatsapp')">
                  <MessageCircle class="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="sm" @click="copyLink">
                  <Copy class="w-5 h-5" />
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <!-- Related Products -->
      <Card v-if="relatedProducts.length > 0">
        <template #header>
          <h2 class="text-responsive-xl font-semibold text-neutral-900">Produits similaires</h2>
        </template>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card
            v-for="relatedProduct in relatedProducts"
            :key="relatedProduct.id"
            interactive
            variant="bordered"
            class="group cursor-pointer"
            @click="navigateToProduct(relatedProduct.id)"
          >
            <div class="aspect-square bg-gradient-to-br from-neutral-200 to-neutral-300 rounded-lg overflow-hidden mb-4">
              <img
                v-if="relatedProduct.image_url"
                :src="relatedProduct.image_url"
                :alt="relatedProduct.name"
                class="w-full h-full object-cover group-hover:transition-transform duration-300"
              >
              <div v-else class="flex items-center justify-center h-full">
                <Package class="w-12 h-12 text-neutral-400" />
              </div>
            </div>

            <div>
              <h3 class="font-semibold text-neutral-900 mb-1 truncate">{{ relatedProduct.name }}</h3>
              <p class="text-responsive-sm text-neutral-600 mb-2">{{ relatedProduct.merchant?.business_name }}</p>
              <div class="flex items-center gap-2">
                <span class="font-semibold text-primary-600">{{ formatPrice(relatedProduct.discounted_price) }} XOF</span>
                <Badge size="xs" :variant="relatedProduct.quantity > 0 ? 'success' : 'error'">
                  {{ relatedProduct.quantity }} restants
                </Badge>
              </div>
            </div>
          </Card>
        </div>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDesignSystem2025 } from '@/composables/useDesignSystem2025'

// Import 2025 components
import Button from '@/components/ui/2025/Button.vue'
import Card from '@/components/ui/2025/Card.vue'
import Badge from '@/components/ui/2025/Badge.vue'

// Icons
import {
  AlertCircle, ChevronRight, Package, MapPin, Clock, ShoppingCart,
  Heart, Minus, Plus, Facebook, Twitter, MessageCircle, Copy
} from 'lucide-vue-next'

// Composables
const route = useRoute()
const router = useRouter()
const { logMigration } = useDesignSystem2025()

// Log migration usage - ProductDetailView successfully migrated to 2025 Design System
logMigration('ProductDetailView', 'Using 2025 components', {
  components: ['Button', 'Card', 'Badge'],
  migratedCount: 5
})

// Reactive state
const loading = ref(true)
const error = ref('')
const product = ref(null)
const relatedProducts = ref([])
const reservationQuantity = ref(1)
const reservationLoading = ref(false)
const isInWishlist = ref(false)

// Computed
const discountPercentage = computed(() => {
  if (!product.value) return 0
  const { original_price, discounted_price } = product.value
  if (original_price <= discounted_price) return 0
  return Math.round(((original_price - discounted_price) / original_price) * 100)
})

const statusVariant = computed(() => {
  if (!product.value) return 'default'
  const now = new Date()
  const expiration = new Date(product.value.expiration_date)
  const hoursUntilExpiration = (expiration.getTime() - now.getTime()) / (1000 * 60 * 60)

  if (hoursUntilExpiration < 6) return 'error'
  if (hoursUntilExpiration < 24) return 'warning'
  return 'success'
})

const statusLabel = computed(() => {
  if (!product.value) return ''
  const now = new Date()
  const expiration = new Date(product.value.expiration_date)
  const hoursUntilExpiration = (expiration.getTime() - now.getTime()) / (1000 * 60 * 60)

  if (hoursUntilExpiration < 0) return 'Expiré'
  if (hoursUntilExpiration < 6) return 'Expire bientôt'
  if (hoursUntilExpiration < 24) return 'Expire aujourd\'hui'
  return 'Frais'
})

// Methods
const formatPrice = (price) => {
  return new Intl.NumberFormat('fr-FR').format(price)
}

const formatExpiration = (date) => {
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(date))
}

const getCategoryVariant = (categoryName) => {
  const variants = {
    'Boulangerie': 'warning',
    'Fruits et Légumes': 'success',
    'Produits laitiers': 'info',
    'Viandes': 'error'
  }
  return variants[categoryName] || 'default'
}

const increaseQuantity = () => {
  if (reservationQuantity.value < product.value.quantity) {
    reservationQuantity.value++
  }
}

const decreaseQuantity = () => {
  if (reservationQuantity.value > 1) {
    reservationQuantity.value--
  }
}

const handleReservation = async () => {
  reservationLoading.value = true

  try {
    // Simulation de la réservation
    await new Promise(resolve => setTimeout(resolve, 1000))
    logMigration('ProductDetailView', 'Reservation created', {
      productId: product.value.id,
      quantity: reservationQuantity.value
    })

    router.push('/reservations')
  } catch (error) {
    console.error('Reservation error:', error)
  } finally {
    reservationLoading.value = false
  }
}

const addToWishlist = () => {
  isInWishlist.value = !isInWishlist.value
  logMigration('ProductDetailView', 'Wishlist toggle', {
    productId: product.value.id,
    added: isInWishlist.value
  })
}

const shareProduct = (platform) => {
  logMigration('ProductDetailView', 'Product shared', { platform })
  // Share logic would go here
}

const copyLink = async () => {
  try {
    await navigator.clipboard.writeText(window.location.href)
    logMigration('ProductDetailView', 'Link copied')
  } catch (error) {
    console.error('Failed to copy link:', error)
  }
}

const navigateToProduct = (productId) => {
  router.push(`/products/${productId}`)
}

// Load product data
onMounted(async () => {
  try {
    // Simulation du chargement des données
    await new Promise(resolve => setTimeout(resolve, 500))

    // Mock product data
    product.value = {
      id: route.params.id,
      name: 'Pain artisanal complet',
      description: 'Pain complet artisanal fait avec des ingrédients biologiques. Parfait pour un petit-déjeuner nutritif.',
      original_price: 800,
      discounted_price: 400,
      quantity: 8,
      expiration_date: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
      image_url: '/images/bread-artisan.jpg',
      category: { name: 'Boulangerie' },
      merchant: {
        business_name: 'Boulangerie Martin',
        address: '123 Avenue de la Paix, Lomé'
      },
      is_surprise_basket: false
    }

    relatedProducts.value = [
      {
        id: 2,
        name: 'Croissants artisanaux',
        discounted_price: 100,
        quantity: 5,
        merchant: { business_name: 'Boulangerie Martin' },
        image_url: '/images/croissants.jpg'
      }
      // ... more related products
    ]
  } catch (err) {
    error.value = 'Erreur lors du chargement du produit'
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.glow-effect {
  transition: all 0.3s ease;
}

.glow-effect:hover {
  box-shadow: 0 25px 50px rgba(16, 185, 129, 0.2);
}

.shadow-modern-2025 {
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.1),
    0 10px 25px rgba(0, 0, 0, 0.05),
    0 0 0 1px rgba(255, 255, 255, 0.1);
}
</style>
