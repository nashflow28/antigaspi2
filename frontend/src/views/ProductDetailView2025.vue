<template>
  <div class="min-h-screen bg-gradient-to-br from-surface-light via-neutral-50 to-neutral-100 dark:from-surface-dark dark:via-neutral-900 dark:to-surface-darker">
    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center min-h-screen">
      <div class="flex items-center gap-3">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
        <span class="text-neutral-600 dark:text-neutral-300">Chargement du produit...</span>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="container px-3 sm:px-4 lg:px-6 mx-auto px-3 py-16 sm:py-16 lg:py-16 text-left sm:text-center">
      <AlertCircle class="w-12 h-10 text-accent-red mx-auto mt-3" />
      <h2 class="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mt-2">Produit introuvable</h2>
      <p class="text-neutral-600 dark:text-neutral-300 mt-4">Le produit que vous recherchez n'existe pas ou a été supprimé.</p>
      <Button variant="primary" @click="$router.push('/products')">
        Retour au catalogue
      </Button>
    </div>

    <!-- Product Detail -->
    <div v-else-if="product" class="container px-3 sm:px-4 lg:px-6 mx-auto px-3 sm:px-4 lg:px-6 py-8 sm:py-12 lg:py-16">
      <!-- Breadcrumb -->
      <nav class="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-300 mt-4 sm:mb-3xl">
        <router-link to="/" class="hover:transition-colors">Accueil</router-link>
        <ChevronRight class="h-4 w-4" />
        <router-link to="/products" class="hover:transition-colors">Catalogue</router-link>
        <ChevronRight class="h-4 w-4" />
        <span class="text-neutral-900 dark:text-neutral-100 font-medium">{{ product.name }}</span>
      </nav>

      <!-- Main Content -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 mb-3xl sm:mb-10 lg:mb-12">
        <!-- Product Image -->
        <div class="space-y-6">
          <Card
            variant="glass"
            :no-padding="true"
            class="relative aspect-square bg-gradient-to-br from-primary-500 via-accent-blue to-primary-700 rounded-3xl overflow-hidden sm:block shadow-card"
          >
            <!-- Product Image or Placeholder -->
            <div v-if="product.image_url" class="relative sm:absolute inset-0">
              <img
                :src="product.image_url"
                :alt="product.name"
                class="w-full h-full object-cover"
              >
            </div>
            <div v-else class="relative sm:absolute inset-0 flex items-center justify-center">
              <Package class="w-40 h-40 text-white/20" />
            </div>

            <!-- Glassmorphism overlay -->
            <div class="relative sm:absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

            <!-- Stock Badge -->
            <div class="relative sm:absolute top-4 left-4">
              <Badge
                :variant="availableQuantity > 5 ? 'success' : availableQuantity > 0 ? 'warning' : 'error'"
                class="backdrop-blur-md"
              >
                {{ availableQuantity > 0 ? `${availableQuantity} en stock` : 'Rupture de stock' }}
              </Badge>
            </div>

            <!-- Discount Badge -->
            <div v-if="discountPercentage > 0" class="relative sm:absolute top-4 right-4">
              <Badge variant="promo" class="backdrop-blur-md">
                -{{ discountPercentage }}%
              </Badge>
            </div>

            <!-- Status Badge -->
            <div class="relative sm:absolute bottom-4 right-4">
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
                <MapPin class="h-4 w-4 text-neutral-500 dark:text-neutral-400" />
                <div>
                  <p class="text-sm font-medium text-neutral-900 dark:text-neutral-100">{{ product.merchant?.business_name }}</p>
                  <p class="text-sm text-neutral-600 dark:text-neutral-300">{{ product.merchant?.address }}</p>
                </div>
              </div>

              <div class="flex items-center gap-3">
                <Clock class="h-4 w-4 text-neutral-500 dark:text-neutral-400" />
                <div>
                  <p class="text-sm font-medium text-neutral-900 dark:text-neutral-100">Récupération</p>
                  <p class="text-sm text-neutral-600 dark:text-neutral-300">
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
            <div class="flex items-center gap-3 mt-2">
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

            <h1 class="text-xl lg:text-3xl font-semibold text-neutral-900 dark:text-neutral-100 mt-3">
              {{ product.name }}
            </h1>

            <!-- Pricing -->
            <div class="flex items-center gap-3 mt-4">
              <div class="text-xl font-semibold text-primary-600 dark:text-primary-400">
                {{ formatPrice(product.discounted_price) }} XOF
              </div>
              <div v-if="product.original_price !== product.discounted_price" class="text-xl text-neutral-500 dark:text-neutral-400 line-through">
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
              <h3 class="text-lg font-semibold">Description</h3>
            </template>
            <p class="text-neutral-600 dark:text-neutral-300 leading-relaxed">
              {{ product.description || 'Aucune description disponible.' }}
            </p>
          </Card>

          <!-- Reservation Actions -->
          <Card variant="gradient">
            <div class="space-y-6">
              <div>
                <h3 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mt-3">Réservation</h3>

                <!-- Quantity Selector -->
                <div class="flex items-center gap-3 mt-4">
                  <label class="text-sm font-medium text-neutral-800 dark:text-neutral-200">Quantité :</label>
                  <div class="flex items-center border border-neutral-300 dark:border-neutral-600 rounded-xl bg-surface-light dark:bg-surface-dark">
                    <Button
                      variant="ghost"
                      size="sm"
                      :disabled="reservationQuantity <= 1"
                      @click="decreaseQuantity"
                    >
                      <Minus class="h-4 w-4" />
                    </Button>
                    <input
                      v-model.number="reservationQuantity"
                      type="number"
                      min="1"
                      :max="maxReservationQuantity"
                      class="w-12 text-left sm:text-center border-0 focus:ring-0 py-3 bg-transparent text-neutral-900 dark:text-neutral-100"
                    >
                    <Button
                      variant="ghost"
                      size="sm"
                      :disabled="reservationQuantity >= availableQuantity"
                      @click="increaseQuantity"
                    >
                      <Plus class="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <!-- Total Price -->
                <div class="flex items-center justify-start sm:justify-between p-4 bg-primary-50 dark:bg-primary-500/10 rounded-xl mt-4">
                  <span class="text-sm font-medium text-primary-900 dark:text-primary-100">Total :</span>
                  <span class="text-xl font-semibold text-primary-600 dark:text-primary-300">
                    {{ formatPrice(product.discounted_price * sanitizedReservationQuantity) }} XOF
                  </span>
                </div>

                <!-- Action Buttons -->
                <div class="space-y-2">
                  <Button
                    size="lg"
                    full-width
                    :disabled="availableQuantity === 0"
                    @click="goToReservation"
                  >
                    <ShoppingCart class="h-4 w-4 mr-2" />
                    Commencer la réservation
                  </Button>

                  <Button
                    variant="secondary"
                    size="lg"
                    full-width
                    :disabled="availableQuantity === 0 || reservationLoading"
                    :loading="reservationLoading"
                    @click="handleReservation"
                  >
                    <ShoppingCart class="h-4 w-4 mr-2" />
                    {{ reservationLoading ? 'Réservation...' : 'Réserver en 1 clic' }}
                  </Button>

                  <Button
                    variant="outline"
                    size="lg"
                    full-width
                    :disabled="loading"
                    @click="addToWishlist"
                  >
                    <Heart :class="['h-4 w-4 mr-2', isInWishlist && 'fill-current text-accent-red']" />
                    {{ isInWishlist ? 'Retiré des favoris' : 'Ajouter aux favoris' }}
                  </Button>
                </div>
            </div>
          </div>
        </Card>

        <!-- Share Product -->
        <Card>
          <div class="flex items-center justify-start sm:justify-between">
            <h3 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Partager</h3>
            <div class="flex gap-2">
              <Button variant="ghost" size="sm" @click="shareProduct('facebook')">
                <Facebook class="h-4 w-4" />
              </Button>
                <Button variant="ghost" size="sm" @click="shareProduct('twitter')">
                  <Twitter class="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" @click="shareProduct('whatsapp')">
                  <MessageCircle class="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" @click="copyLink">
                  <Copy class="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <!-- Related Products -->
      <Card v-if="relatedProducts.length > 0">
        <template #header>
          <h2 class="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Produits similaires</h2>
        </template>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          <Card
            v-for="relatedProduct in relatedProducts"
            :key="relatedProduct.id"
            interactive
            variant="bordered"
            class="group cursor-pointer"
            @click="navigateToProduct(relatedProduct.id)"
          >
            <div class="aspect-square bg-gradient-to-br from-neutral-200 to-neutral-300 dark:from-neutral-700 dark:to-neutral-800 rounded-2xl overflow-hidden sm:block mt-3">
              <img
                v-if="relatedProduct.image_url"
                :src="relatedProduct.image_url"
                :alt="relatedProduct.name"
                class="w-full h-full object-cover group-hover:transition-transform duration-300"
              >
              <div v-else class="flex items-center justify-center h-full">
                <Package class="w-12 h-10 text-neutral-400 dark:text-neutral-500" />
              </div>
            </div>

            <div>
              <h3 class="font-semibold text-neutral-900 dark:text-neutral-100 mb-1 truncate">{{ relatedProduct.name }}</h3>
              <p class="text-sm text-neutral-600 dark:text-neutral-300 mt-2">{{ relatedProduct.merchant?.business_name }}</p>
              <div class="flex items-center gap-2">
                <span class="font-semibold text-primary-600 dark:text-primary-400">{{ formatPrice(relatedProduct.discounted_price) }} XOF</span>
                <Badge size="xs" :variant="relatedProduct.quantity_available > 0 ? 'success' : 'error'">
                  {{ relatedProduct.quantity_available }} restants
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
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDesignSystem2025 } from '@/composables/useDesignSystem2025'
import { apiService } from '@/services/api'
import { notify } from '@/composables/useNotifications'
import { useAuthStore } from '@/stores/auth'
import { useReservationsStore } from '@/stores/reservations'
import { usePaymentsStore } from '@/stores/payments'

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
const authStore = useAuthStore()
const reservationsStore = useReservationsStore()
const paymentsStore = usePaymentsStore()

// Log migration usage - ProductDetailView successfully migrated to 2025 Design System
logMigration('ProductDetailView', 'Using 2025 components', {
  components: ['Button', 'Card', 'Badge'],
  migratedCount: 5
})

// Reactive state
interface ProductDetail {
  id: number
  name: string
  description: string | null
  original_price: number
  discounted_price: number
  quantity_available: number
  expiration_date: string
  image_url?: string | null
  discount_percentage: number
  category?: { id?: number; name?: string }
  merchant?: { business_name?: string; address?: string | null; phone?: string | null }
  is_surprise_basket?: boolean
  is_expired?: boolean
  is_expiring_soon?: boolean
}

interface RelatedProduct {
  id: number
  name: string
  discounted_price: number
  quantity_available: number
  merchant?: { business_name?: string }
  image_url?: string | null
}

const loading = ref(true)
const error = ref('')
const product = ref<ProductDetail | null>(null)
const relatedProducts = ref<RelatedProduct[]>([])
const reservationQuantity = ref(1)
const reservationLoading = ref(false)
const isInWishlist = ref(false)

const availableQuantity = computed(() => product.value?.quantity_available ?? 0)
const maxReservationQuantity = computed(() => Math.max(availableQuantity.value, 1))

const normalizeReservationQuantity = (value: unknown): number => {
  const numericValue = typeof value === 'number' ? value : Number(value)

  if (!Number.isFinite(numericValue)) {
    return 1
  }

  const flooredValue = Math.floor(numericValue)
  const minimumValue = Math.max(flooredValue, 1)
  const available = availableQuantity.value

  if (available > 0) {
    return Math.min(minimumValue, available)
  }

  return minimumValue
}

const sanitizedReservationQuantity = computed(() => normalizeReservationQuantity(reservationQuantity.value))

// Computed
const discountPercentage = computed(() => {
  if (!product.value) return 0
  if (typeof product.value.discount_percentage === 'number' && product.value.discount_percentage > 0) {
    return Math.round(product.value.discount_percentage)
  }

  const { original_price, discounted_price } = product.value
  if (original_price <= discounted_price) return 0
  return Math.round(((original_price - discounted_price) / original_price) * 100)
})

const statusVariant = computed(() => {
  if (!product.value) return 'default'
  if (product.value.is_expired || availableQuantity.value === 0) return 'error'
  if (product.value.is_expiring_soon) return 'warning'

  const now = new Date()
  const expiration = new Date(product.value.expiration_date)
  const hoursUntilExpiration = (expiration.getTime() - now.getTime()) / (1000 * 60 * 60)

  if (hoursUntilExpiration < 6) return 'error'
  if (hoursUntilExpiration < 24) return 'warning'
  return 'success'
})

const statusLabel = computed(() => {
  if (!product.value) return ''
  if (product.value.is_expired) return 'Expiré'
  if (availableQuantity.value === 0) return 'Rupture'
  if (product.value.is_expiring_soon) return 'Expire bientôt'

  const now = new Date()
  const expiration = new Date(product.value.expiration_date)
  const hoursUntilExpiration = (expiration.getTime() - now.getTime()) / (1000 * 60 * 60)

  if (hoursUntilExpiration < 0) return 'Expiré'
  if (hoursUntilExpiration < 6) return 'Expire bientôt'
  if (hoursUntilExpiration < 24) return 'Expire aujourd\'hui'
  return 'Frais'
})

// Methods
const formatPrice = (price: number) => {
  return new Intl.NumberFormat('fr-FR').format(price)
}

const formatExpiration = (date: string | Date) => {
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(date))
}

const getCategoryVariant = (categoryName?: string) => {
  const variants: Record<string, string> = {
    'Boulangerie': 'warning',
    'Fruits et Légumes': 'success',
    'Produits laitiers': 'info',
    'Viandes': 'error'
  }
  return categoryName ? variants[categoryName] || 'default' : 'default'
}

const increaseQuantity = () => {
  if (product.value && reservationQuantity.value < availableQuantity.value) {
    reservationQuantity.value++
  }
}

const decreaseQuantity = () => {
  if (reservationQuantity.value > 1) {
    reservationQuantity.value--
  }
}

const goToReservation = () => {
  if (!product.value) return

  if (availableQuantity.value === 0) {
    notify.info('Ce produit est actuellement en rupture de stock.', 'Réservation')
    return
  }

  const quantity = sanitizedReservationQuantity.value
  const targetRoute = {
    name: 'product-reserve' as const,
    params: { id: product.value.id },
    query: quantity > 0 ? { quantity: String(quantity) } : undefined
  }

  if (!authStore.isAuthenticated) {
    notify.info('Connectez-vous pour réserver ce produit.', 'Connexion requise')
    const resolved = router.resolve(targetRoute)
    router.push({ name: 'login', query: { redirect: resolved.href } })
    return
  }

  router.push(targetRoute)
}

const handleReservation = async () => {
  if (!product.value) return

  if (availableQuantity.value === 0) {
    notify.info('Ce produit est actuellement en rupture de stock.', 'Réservation')
    return
  }

  if (!authStore.isAuthenticated) {
    notify.info('Connectez-vous pour réserver ce produit.', 'Connexion requise')
    router.push({ name: 'login', query: { redirect: `/products/${product.value.id}` } })
    return
  }

  reservationLoading.value = true

  try {
    const response = await reservationsStore.createReservation({
      productId: product.value.id,
      quantity: sanitizedReservationQuantity.value,
      paymentMethod: 'paystack',
      customerPhone: authStore.user?.phone || undefined,
      customerEmail: authStore.user?.email || undefined
    })

    if (!response.success) {
      notify.error(response.error || 'Impossible de créer la réservation pour le moment.', 'Réservation')
      return
    }

    if (response.payment) {
      paymentsStore.recordPayment(response.payment)
      if (response.payment.checkout_url) {
        window.open(response.payment.checkout_url, '_blank', 'noopener')
      }
    }

    notify.success('Votre réservation a bien été enregistrée.', 'Réservation')
    router.push({ name: 'reservations' })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inattendue lors de la réservation.'
    notify.error(message, 'Réservation')
  } finally {
    reservationLoading.value = false
  }
}

const addToWishlist = () => {
  if (!product.value) return

  isInWishlist.value = !isInWishlist.value
  logMigration('ProductDetailView', 'Wishlist toggle', {
    productId: product.value.id,
    added: isInWishlist.value
  })
}

const shareProduct = (platform: 'facebook' | 'twitter' | 'whatsapp') => {
  logMigration('ProductDetailView', 'Product shared', { platform })
  // Share logic would go here
}

const copyLink = async () => {
  try {
    await navigator.clipboard.writeText(window.location.href)
    logMigration('ProductDetailView', 'Link copied')
  } catch {
    // console.error('Failed to copy link:', error)
  }
}

const navigateToProduct = (productId: number) => {
  router.push(`/products/${productId}`)
}

const hydrateProduct = (apiProduct: any): ProductDetail | null => {
  if (!apiProduct) return null

  return {
    id: Number(apiProduct.id ?? 0),
    name: apiProduct.name,
    description: apiProduct.description ?? null,
    original_price: Number(apiProduct.original_price ?? 0),
    discounted_price: Number(apiProduct.discounted_price ?? 0),
    quantity_available: Number(apiProduct.quantity_available ?? 0),
    expiration_date: apiProduct.expiration_date,
    image_url: apiProduct.image_url ?? null,
    discount_percentage: Number(apiProduct.discount_percentage ?? 0),
    category: apiProduct.category,
    merchant: apiProduct.merchant ? {
      business_name: apiProduct.merchant.business_name ?? apiProduct.merchant.name,
      address: apiProduct.merchant.address ?? apiProduct.merchant.city ?? null,
      phone: apiProduct.merchant.phone ?? null
    } : undefined,
    is_surprise_basket: Boolean(apiProduct.is_surprise_basket),
    is_expired: Boolean(apiProduct.is_expired),
    is_expiring_soon: Boolean(apiProduct.is_expiring_soon)
  }
}

const hydrateRelatedProducts = (products: any[]): RelatedProduct[] => {
  if (!Array.isArray(products)) return []

  return products.map(item => ({
    id: item.id,
    name: item.name,
    discounted_price: Number(item.discounted_price ?? 0),
    quantity_available: Number(item.quantity_available ?? item.quantity ?? 0),
    merchant: item.merchant ? { business_name: item.merchant.business_name ?? item.merchant.name } : undefined,
    image_url: item.image_url ?? null
  }))
}

const fetchProduct = async () => {
  try {
    loading.value = true
    error.value = ''

    const productId = Number(route.params.id)
    if (Number.isNaN(productId)) {
      error.value = 'Identifiant de produit invalide.'
      return
    }

    const response = await apiService.getProduct(productId)

    if (!response.success) {
      error.value = response.message || 'Erreur lors du chargement du produit.'
      return
    }

    const hydratedProduct = hydrateProduct(response.data)

    if (!hydratedProduct) {
      error.value = 'Produit introuvable.'
      return
    }

    product.value = hydratedProduct
    reservationQuantity.value = 1

    const related = (response.data as any)?.related_products ?? []
    relatedProducts.value = hydrateRelatedProducts(related)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur lors du chargement du produit.'
    error.value = message
  } finally {
    loading.value = false
  }
}

onMounted(fetchProduct)

watch(() => route.params.id, () => {
  fetchProduct()
})

watch(availableQuantity, () => {
  const safeQuantity = normalizeReservationQuantity(reservationQuantity.value)

  if (reservationQuantity.value !== safeQuantity) {
    reservationQuantity.value = safeQuantity
  }
})

watch(reservationQuantity, (quantity) => {
  const safeQuantity = normalizeReservationQuantity(quantity)

  if (quantity !== safeQuantity) {
    reservationQuantity.value = safeQuantity
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

.shadow-xl {
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.1),
    0 10px 25px rgba(0, 0, 0, 0.05),
    0 0 0 1px rgba(255, 255, 255, 0.1);
}
</style>
