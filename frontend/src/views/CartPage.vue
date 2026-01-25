<template>
  <div class="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-primary-50">
    <div class="border-b border-neutral-200/70 bg-white/80 backdrop-blur">
      <div class="container px-3 sm:px-4 lg:px-6 mx-auto py-12">
        <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p class="inline-flex items-center gap-2 rounded-full bg-primary-100/70 px-3 py-3 text-sm font-medium text-primary-900">
              <ShoppingCart class="h-4 w-4" />
              Mon panier GÊLADAL
            </p>
            <h1 class="mt-3 text-3xl font-semibold tracking-tight text-neutral-900">{{ headline }}</h1>
            <p class="mt-2 max-w-full sm:max-w-80 text-neutral-700">
              Ajustez vos quantités et finalisez votre réservation en toute sécurité.
            </p>
          </div>
          <Button
            variant="secondary"
            class="w-full max-w-xs"
            @click="router.push({ name: 'products' })"
          >
            Continuer mes achats
          </Button>
        </div>
      </div>
    </div>

    <main class="container px-3 sm:px-4 lg:px-6 mx-auto px-4 py-8 sm:py-12 lg:py-16">
      <!-- Empty State -->
      <div v-if="!hasItems" class="max-w-2xl mx-auto">
        <Card class="bg-white/90">
          <div class="py-12 text-center">
            <div class="mx-auto flex icon-xl items-center justify-center rounded-full bg-neutral-100 text-neutral-400">
              <ShoppingCart class="h-12 w-12" />
            </div>
            <h3 class="mt-4 text-xl font-semibold text-neutral-800">Votre panier est vide</h3>
            <p class="mt-2 text-neutral-500">
              Découvrez les produits anti-gaspi près de chez vous et ajoutez-les à votre panier.
            </p>
            <div class="mt-6 flex flex-col sm:flex-row justify-center gap-3">
              <Button @click="router.push({ name: 'products' })">
                Explorer les produits
              </Button>
              <Button variant="ghost" @click="router.push({ name: 'surprise-baskets' })">
                Voir les paniers surprise
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <!-- Cart Items -->
      <div v-else class="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <!-- Items List -->
        <section class="space-y-4">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-xl font-semibold text-neutral-900">
              Articles ({{ itemsCount }})
            </h2>
            <Button
              v-if="hasItems"
              variant="ghost"
              size="sm"
              :left-icon="Trash2"
              @click="handleClearCart"
            >
              Vider le panier
            </Button>
          </div>

          <CartItemCard
            v-for="item in items"
            :key="item.id"
            :item="item"
            @remove="handleRemoveItem"
            @update-quantity="handleUpdateQuantity"
          />
        </section>

        <!-- Summary Sidebar -->
        <aside class="lg:sticky lg:top-4 h-fit">
          <Card class="bg-white/90">
            <template #header>
              <h2 class="text-xl font-semibold text-neutral-900">Récapitulatif</h2>
            </template>

            <div class="space-y-4">
              <!-- Subtotal -->
              <div class="flex justify-between text-neutral-700">
                <span>Sous-total</span>
                <span class="font-semibold">{{ formatPrice(totalAmount) }}</span>
              </div>

              <!-- Savings -->
              <div v-if="totalSavings > 0" class="flex justify-between text-green-600">
                <span>Économies</span>
                <span class="font-semibold">-{{ formatPrice(totalSavings) }}</span>
              </div>

              <!-- Divider -->
              <div class="border-t border-neutral-200" />

              <!-- Total -->
              <div class="flex justify-between text-xl font-bold text-neutral-900">
                <span>Total</span>
                <span>{{ formatPrice(totalAmount) }}</span>
              </div>

              <!-- Impact Info -->
              <div class="p-3 bg-green-50 rounded-lg border border-green-200">
                <div class="flex items-center gap-2 text-green-800 text-sm font-medium mb-1">
                  <Leaf class="h-4 w-4" />
                  <span>Votre impact</span>
                </div>
                <p class="text-xs text-green-700">
                  En réservant ces produits, vous contribuez à réduire le gaspillage alimentaire
                  et soutenez les commerçants locaux.
                </p>
              </div>

              <!-- Checkout Button -->
              <Button
                variant="primary"
                size="lg"
                full-width
                :disabled="!hasItems"
                @click="showCheckoutModal = true"
              >
                Procéder au paiement
              </Button>

              <!-- Continue Shopping -->
              <Button
                variant="ghost"
                size="sm"
                full-width
                @click="router.push({ name: 'products' })"
              >
                Continuer mes achats
              </Button>

              <!-- Trust Indicators -->
              <div class="pt-4 border-t border-neutral-200 space-y-2 text-xs text-neutral-600">
                <div class="flex items-center gap-2">
                  <ShieldCheck class="h-4 w-4 text-green-600" />
                  <span>Paiement 100% sécurisé</span>
                </div>
                <div class="flex items-center gap-2">
                  <Clock class="h-4 w-4 text-primary-600" />
                  <span>Retrait rapide chez le commerçant</span>
                </div>
                <div class="flex items-center gap-2">
                  <CheckCircle class="h-4 w-4 text-green-600" />
                  <span>Satisfaction garantie</span>
                </div>
              </div>
            </div>
          </Card>
        </aside>
      </div>
    </main>

    <!-- Checkout Modal -->
    <CartCheckoutModal
      v-model="showCheckoutModal"
      @success="handleCheckoutSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '@/stores/cart'
import { notify } from '@/composables/useNotifications'
import Button from '@/components/ui/2025/Button.vue'
import Card from '@/components/ui/2025/Card.vue'
import CartItemCard from '@/components/cart/CartItemCard.vue'
import CartCheckoutModal from '@/components/modals/CartCheckoutModal.vue'
import {
  ShoppingCart,
  Trash2,
  Leaf,
  ShieldCheck,
  Clock,
  CheckCircle
} from 'lucide-vue-next'

const router = useRouter()
const cartStore = useCartStore()

// State
const showCheckoutModal = ref(false)

// Computed
const items = computed(() => cartStore.items)
const itemsCount = computed(() => cartStore.itemsCount)
const totalAmount = computed(() => cartStore.totalAmount)
const totalSavings = computed(() => cartStore.totalSavings)
const hasItems = computed(() => itemsCount.value > 0)

const headline = computed(() => {
  if (!hasItems.value) return 'Votre panier est vide'
  if (itemsCount.value === 1) return '1 article dans votre panier'
  return `${itemsCount.value} articles dans votre panier`
})

// Methods
const formatPrice = (price: number) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    minimumFractionDigits: 0
  }).format(price)
}

const handleRemoveItem = (id: number) => {
  cartStore.removeItem(id)
}

const handleUpdateQuantity = (id: number, quantity: number) => {
  cartStore.updateQuantity(id, quantity)
}

const handleClearCart = () => {
  if (confirm('Êtes-vous sûr de vouloir vider votre panier ?')) {
    cartStore.clearCart()
  }
}

const handleCheckoutSuccess = () => {
  showCheckoutModal.value = false
  notify.success('Réservation confirmée ! Rendez-vous chez le commerçant.', 'Succès')
}
</script>
