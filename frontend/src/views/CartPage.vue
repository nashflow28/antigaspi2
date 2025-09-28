<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
    <div class="border-b border-gray-200/70 bg-white/80 backdrop-blur">
      <div class="container px-3 sm:px-4 lg:px-6 mx-auto px-4 py-12">
        <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p class="inline-flex items-center gap-2 rounded-full bg-blue-100/70 px-3 py-3 text-sm font-medium text-blue-900">
              <ShoppingCart class="h-4 w-4" />
              Mon panier AntiGaspi
            </p>
            <h1 class="mt-3 text-3xl font-semibold tracking-tight text-gray-900">{{ headline }}</h1>
            <p class="mt-2 max-w-full sm:max-w-80 text-gray-700">
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

    <main class="container px-3 sm:px-4 lg:px-6 mx-auto grid gap-6 sm:gap-8 px-4 py-8 sm:py-12 lg:py-16 lg:grid-cols-[2fr_1fr]">
      <section>
        <Card class="bg-white/90">
          <template #header>
            <div class="flex items-center justify-between">
              <h2 class="text-xl font-semibold text-gray-900">Articles réservés</h2>
              <span class="text-sm text-gray-500">{{ itemsCount }} article{{ itemsCount > 1 ? 's' : '' }}</span>
            </div>
          </template>

          <div v-if="!hasItems" class="py-8 sm:py-12 lg:py-16 text-left sm:text-center">
            <div class="mx-auto flex icon-xl items-center justify-center rounded-full bg-gray-100 text-gray-400">
              <ShoppingCart class="h-8 w-8" />
            </div>
            <h3 class="mt-4 text-xl font-semibold text-gray-800">Votre panier est vide</h3>
            <p class="mt-2 text-gray-500">
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
              class="flex flex-col gap-3 py-6 md:flex-row md:items-center md:justify-between"
            >
              <div class="flex flex-1 items-stretch sm:items-start gap-3">
                <div class="h-20 w-80 flex-shrink-0 rounded bg-gray-100" aria-hidden="true" />
                <div>
                  <p class="text-lg font-semibold text-gray-900">{{ item.name }}</p>
                  <p v-if="item.merchantName" class="text-sm text-gray-500">{{ item.merchantName }}</p>
                  <div class="mt-2 flex items-center gap-3 text-sm">
                    <span class="font-semibold text-blue-600">{{ formatPrice(item.price) }}</span>
                    <span v-if="item.originalPrice" class="text-gray-400 line-through">{{ formatPrice(item.originalPrice) }}</span>
                  </div>
                </div>
              </div>

              <div class="flex items-center justify-between gap-3 md:justify-end">
                <div class="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-3 shadow-sm">
                  <button
                    type="button"
                    class="text-gray-500 hover:text-gray-800"
                    aria-label="Diminuer la quantité"
                    @click="decreaseQuantity(item)"
                  >
                    <Minus class="h-4 w-4" />
                  </button>
                  <span class="w-12 text-left sm:text-center text-sm font-medium text-gray-800">{{ item.quantity }}</span>
                  <button
                    type="button"
                    class="text-gray-500 hover:text-gray-800"
                    aria-label="Augmenter la quantité"
                    @click="increaseQuantity(item)"
                  >
                    <Plus class="h-4 w-4" />
                  </button>
                </div>

                <button
                  type="button"
                  class="flex items-center gap-2 rounded-full bg-gray-100 px-3 py-3 text-sm text-gray-500 transition hover:bg-gray-200"
                  @click="removeItem(item.id)"
                >
                  <Trash2 class="h-4 w-4" />
                  Retirer
                </button>
              </div>
            </li>
          </ul>

          <template v-if="hasItems" #footer>
            <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Button variant="ghost" class="text-gray-500" @click="clearCart">
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
            <h2 class="text-xl font-semibold text-gray-900">Résumé de commande</h2>
          </template>
          <dl class="space-y-2 text-sm text-gray-700">
            <div class="flex items-center justify-between">
              <dt>Sous-total</dt>
              <dd class="font-semibold text-gray-800">{{ formattedTotal }}</dd>
            </div>
            <div class="flex items-center justify-between">
              <dt>Frais de service</dt>
              <dd class="text-gray-400">Offerts</dd>
            </div>
            <div class="flex items-center justify-between border-t border-gray-200 pt-3 text-base font-semibold text-gray-900">
              <dt>Total</dt>
              <dd>{{ formattedTotal }}</dd>
            </div>
          </dl>
          <p class="mt-4 text-xs text-gray-500">
            Les commerçants confirment généralement en moins de 10 minutes. Vous recevrez une notification dès que votre panier sera prêt.
          </p>
        </Card>

        <Card class="bg-blue-500/95 text-white">
          <template #header>
            <h2 class="text-lg font-semibold">Astuce AntiGaspi</h2>
          </template>
          <p class="text-sm text-blue-50">
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
