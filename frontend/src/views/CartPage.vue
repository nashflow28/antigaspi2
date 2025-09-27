<template>
  <div class="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-primary-50">
    <div class="border-b border-neutral-200/70 bg-white/80 backdrop-blur">
      <div class="container px-4 sm:px-6 lg:px-8 mx-auto px-6 py-10">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p class="inline-flex items-center gap-2 rounded-full bg-primary-100/70 px-4 py-3 text-responsive-sm font-medium text-primary-emphasis">
              <ShoppingCart class="h-5 w-5" />
              Mon panier AntiGaspi
            </p>
            <h1 class="mt-3 text-display-sm font-semibold tracking-tight text-heading">{{ headline }}</h1>
            <p class="mt-2 max-w-full sm:max-w-2xl text-body">
              Ajustez vos quantités, ajoutez un message au commerçant et finalisez votre réservation en toute sécurité.
            </p>
          </div>
          <Button
            variant="secondary"
            class="w-full max-w-xs"
            @click="router.push({ name: 'products' })"
          >
            Continuer mes découvertes
          </Button>
        </div>
      </div>
    </div>

    <main class="container px-4 sm:px-6 lg:px-8 mx-auto grid gap-6 sm:gap-8 px-6 py-8 sm:py-10 lg:py-12 lg:grid-cols-[2fr_1fr]">
      <section>
        <Card class="bg-white/90">
          <template #header>
            <div class="flex items-center justify-between">
              <h2 class="text-responsive-xl font-semibold text-heading">Articles réservés</h2>
              <span class="text-responsive-sm text-muted">{{ itemsCount }} article{{ itemsCount > 1 ? 's' : '' }}</span>
            </div>
          </template>

          <div v-if="!hasItems" class="py-8 sm:py-10 lg:py-12 text-left sm:text-center">
            <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100 text-placeholder">
              <ShoppingCart class="h-10 w-10" />
            </div>
            <h3 class="mt-4 text-responsive-xl font-semibold text-heading-secondary">Votre panier est vide</h3>
            <p class="mt-2 text-muted">
              Découvrez les paniers surprise près de chez vous et revenez finaliser votre commande.
            </p>
            <div class="mt-6 flex justify-center gap-3">
              <Button @click="router.push({ name: 'discover' })">
                Explorer les commerçants
              </Button>
              <Button variant="ghost" @click="router.push({ name: 'surprise-baskets' })">
                Voir les paniers disponibles
              </Button>
            </div>
          </div>

          <ul v-else class="divide-y divide-neutral-200/70">
            <li
              v-for="item in items"
              :key="item.id"
              class="flex flex-col gap-4 py-6 md:flex-row md:items-center md:justify-between"
            >
              <div class="flex flex-1 items-stretch sm:items-start gap-4">
                <div class="h-20 w-20 flex-shrink-0 rounded-2xl bg-neutral-100" aria-hidden="true" />
                <div>
                  <p class="text-responsive-lg font-semibold text-heading">{{ item.name }}</p>
                  <p v-if="item.merchantName" class="text-responsive-sm text-muted">{{ item.merchantName }}</p>
                  <div class="mt-2 flex items-center gap-3 text-responsive-sm">
                    <span class="font-semibold text-primary">{{ formatPrice(item.price) }}</span>
                    <span v-if="item.originalPrice" class="text-placeholder line-through">{{ formatPrice(item.originalPrice) }}</span>
                  </div>
                </div>
              </div>

              <div class="flex items-center justify-between gap-4 md:justify-end">
                <div class="flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-3 shadow-sm">
                  <button
                    type="button"
                    class="text-muted hover:text-heading-secondary"
                    aria-label="Diminuer la quantité"
                    @click="decreaseQuantity(item)"
                  >
                    <Minus class="h-5 w-5" />
                  </button>
                  <span class="w-10 text-left sm:text-center text-responsive-sm font-medium text-heading-secondary">{{ item.quantity }}</span>
                  <button
                    type="button"
                    class="text-muted hover:text-heading-secondary"
                    aria-label="Augmenter la quantité"
                    @click="increaseQuantity(item)"
                  >
                    <Plus class="h-5 w-5" />
                  </button>
                </div>

                <button
                  type="button"
                  class="flex items-center gap-2 rounded-full bg-neutral-100 px-4 py-3 text-responsive-sm text-muted transition hover:bg-neutral-200"
                  @click="removeItem(item.id)"
                >
                  <Trash2 class="h-5 w-5" />
                  Retirer
                </button>
              </div>
            </li>
          </ul>

          <template v-if="hasItems" #footer>
            <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Button variant="ghost" class="text-muted" @click="clearCart">
                Vider le panier
              </Button>
              <Button @click="router.push({ name: 'checkout' })">
                Procéder au paiement
              </Button>
            </div>
          </template>
        </Card>
      </section>

      <aside class="space-y-6">
        <Card class="bg-white/90">
          <template #header>
            <h2 class="text-responsive-xl font-semibold text-heading">Résumé de commande</h2>
          </template>
          <dl class="space-y-3 text-responsive-sm text-body">
            <div class="flex items-center justify-between">
              <dt>Sous-total</dt>
              <dd class="font-semibold text-heading-secondary">{{ formattedTotal }}</dd>
            </div>
            <div class="flex items-center justify-between">
              <dt>Frais de service</dt>
              <dd class="text-placeholder">Offerts</dd>
            </div>
            <div class="flex items-center justify-between border-t border-neutral-200 pt-3 text-responsive-base font-semibold text-heading">
              <dt>Total</dt>
              <dd>{{ formattedTotal }}</dd>
            </div>
          </dl>
          <p class="mt-4 text-responsive-xs text-muted">
            Les commerçants confirment généralement en moins de 10 minutes. Vous recevrez une notification dès que votre panier sera prêt.
          </p>
        </Card>

        <Card class="bg-primary-500/95 text-white">
          <template #header>
            <h2 class="text-responsive-lg font-semibold">Astuce AntiGaspi</h2>
          </template>
          <p class="text-responsive-sm text-primary-50">
            Ajoutez vos commerçants favoris pour retrouver plus facilement leurs paniers et recevoir leurs alertes.
          </p>
          <Button
            variant="secondary"
            class="mt-4 w-full border-white/40 bg-white/20 text-white hover:bg-white/30"
            @click="router.push({ name: 'favorites' })"
          >
            Gérer mes favoris
          </Button>
        </Card>
      </aside>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import Button from '@/components/ui/Button.vue'
import Card from '@/components/ui/Card.vue'
import { useCartStore, type CartItem } from '@/stores/cart'
import { formatPrice } from '@/utils/currency'
import { ShoppingCart, Minus, Plus, Trash2 } from 'lucide-vue-next'

const router = useRouter()
const cartStore = useCartStore()
const { items, itemsCount, totalAmount } = storeToRefs(cartStore)

const hasItems = computed(() => items.value.length > 0)
const formattedTotal = computed(() => formatPrice(totalAmount.value))
const headline = computed(() => hasItems.value
  ? 'Récapitulatif de vos paniers'
  : 'Ajoutez vos premiers paniers surprise')

const increaseQuantity = (item: CartItem) => {
  cartStore.updateQuantity(item.id, item.quantity + 1)
}

const decreaseQuantity = (item: CartItem) => {
  cartStore.updateQuantity(item.id, item.quantity - 1)
}

const removeItem = (id: number) => {
  cartStore.removeItem(id)
}

const clearCart = () => {
  cartStore.clearCart()
}

onMounted(() => {
  cartStore.hydrateFromStorage()
})
</script>
