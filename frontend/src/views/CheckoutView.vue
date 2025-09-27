<template>
  <div class="min-h-screen bg-gradient-to-b from-neutral-50 via-white to-primary-50 dark:from-neutral-950 dark:via-neutral-950 dark:to-neutral-900">
    <div class="border-b border-neutral-200/70 bg-white/80 backdrop-blur dark:border-neutral-800/70 dark:bg-neutral-900/80">
      <div class="container mx-auto px-6 py-10">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p class="inline-flex items-center gap-2 rounded-full bg-primary-100/70 px-4 py-1 text-responsive-sm font-medium text-primary-700 dark:bg-primary-500/20 dark:text-primary-100">
              <CreditCard class="h-4 w-4" />
              Finaliser ma réservation
            </p>
            <h1 class="mt-3 text-display-sm font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">Paiement sécurisé AntiGaspi</h1>
            <p class="mt-2 max-w-2xl text-neutral-600 dark:text-neutral-300">
              Vérifiez vos informations, choisissez votre mode de paiement et confirmez votre panier surprise en toute sérénité.
            </p>
          </div>
          <div class="flex items-center gap-2 text-responsive-sm text-neutral-500 dark:text-neutral-400" aria-hidden="true">
            <span class="flex h-8 w-8 items-center justify-center rounded-full bg-primary-500 text-responsive-sm font-semibold text-white">1</span>
            <span>Résumé</span>
            <span class="text-neutral-400 dark:text-neutral-600">—</span>
            <span class="flex h-8 w-8 items-center justify-center rounded-full bg-primary-500 text-responsive-sm font-semibold text-white">2</span>
            <span>Paiement</span>
            <span class="text-neutral-400 dark:text-neutral-600">—</span>
            <span class="flex h-8 w-8 items-center justify-center rounded-full bg-primary-500 text-responsive-sm font-semibold text-white">3</span>
            <span>Confirmation</span>
          </div>
        </div>
      </div>
    </div>

    <main class="container mx-auto grid gap-8 px-6 py-12 lg:grid-cols-[2fr_1fr]">
      <section class="space-y-6" aria-label="Formulaire de paiement">
        <Card class="bg-white/90 dark:bg-neutral-900/90">
          <template #header>
            <h2 id="checkout-pickup" class="text-responsive-xl font-semibold text-neutral-900 dark:text-neutral-50">Informations de retrait</h2>
          </template>
          <div class="grid gap-4 md:grid-cols-2" role="group" aria-labelledby="checkout-pickup">
            <label class="flex flex-col gap-2 text-responsive-sm text-neutral-600 dark:text-neutral-200">
              Nom complet
              <input
                v-model="contactName"
                type="text"
                class="rounded-2xl border border-neutral-200 bg-white/80 px-4 py-3 text-neutral-900 shadow-inner transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-neutral-700 dark:bg-neutral-900/80 dark:text-neutral-50 dark:focus-visible:ring-offset-neutral-950"
                placeholder="Ex : Kossi Awesso"
              >
            </label>
            <label class="flex flex-col gap-2 text-responsive-sm text-neutral-600 dark:text-neutral-200">
              Numéro de téléphone
              <input
                v-model="contactPhone"
                type="tel"
                class="rounded-2xl border border-neutral-200 bg-white/80 px-4 py-3 text-neutral-900 shadow-inner transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-neutral-700 dark:bg-neutral-900/80 dark:text-neutral-50 dark:focus-visible:ring-offset-neutral-950"
                placeholder="Ex : +228 90 00 00 00"
              >
            </label>
            <label class="flex flex-col gap-2 text-responsive-sm text-neutral-600 dark:text-neutral-200">
              Créneau de retrait
              <select
                v-model="pickupSlot"
                class="rounded-2xl border border-neutral-200 bg-white/80 px-4 py-3 text-neutral-900 shadow-inner transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-neutral-700 dark:bg-neutral-900/80 dark:text-neutral-50 dark:focus-visible:ring-offset-neutral-950"
              >
                <option value="asap">Dès que possible</option>
                <option value="lunch">Pause déjeuner (12h-14h)</option>
                <option value="evening">Fin de journée (18h-20h)</option>
              </select>
            </label>
            <label class="flex flex-col gap-2 text-responsive-sm text-neutral-600 dark:text-neutral-200">
              Notes pour le commerçant
              <textarea
                v-model="notes"
                rows="3"
                class="rounded-2xl border border-neutral-200 bg-white/80 px-4 py-3 text-neutral-900 shadow-inner transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-neutral-700 dark:bg-neutral-900/80 dark:text-neutral-50 dark:focus-visible:ring-offset-neutral-950"
                placeholder="Ex : Merci de prévoir un sac réutilisable."
              />
            </label>
          </div>
        </Card>

        <Card class="bg-white/90 dark:bg-neutral-900/90">
          <template #header>
            <div class="flex items-center justify-between gap-4">
              <h2 id="checkout-payment" class="text-responsive-xl font-semibold text-neutral-900 dark:text-neutral-50">Mode de paiement</h2>
              <span class="text-responsive-sm text-neutral-500 dark:text-neutral-400">Frais transparents, confirmation immédiate</span>
            </div>
          </template>

          <div
            class="grid gap-4 md:grid-cols-2"
            role="radiogroup"
            aria-labelledby="checkout-payment"
          >
            <button
              v-for="option in paymentOptions"
              :key="option.value"
              type="button"
              class="flex flex-col gap-2 rounded-3xl border px-5 py-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-neutral-950"
              role="radio"
              :aria-checked="option.value === selectedPayment"
              :class="option.value === selectedPayment
                ? 'border-primary-400 bg-primary-50/60 shadow-glow dark:border-primary-500 dark:bg-primary-500/20'
                : 'border-neutral-200 bg-white hover:border-primary-200 hover:bg-primary-50/40 dark:border-neutral-700 dark:bg-neutral-900/70 dark:hover:border-primary-500/60 dark:hover:bg-primary-500/10'"
              @click="selectedPayment = option.value"
            >
              <span class="text-responsive-sm font-semibold text-neutral-900 dark:text-neutral-50">{{ option.label }}</span>
              <span class="text-responsive-xs text-neutral-500 dark:text-neutral-300">{{ option.description }}</span>
            </button>
          </div>

          <div class="mt-4 flex items-center gap-2 rounded-2xl bg-primary-50 px-4 py-3 text-responsive-sm text-primary-700 dark:bg-primary-500/15 dark:text-primary-100">
            <ShieldCheck class="h-4 w-4" />
            Transactions chiffrées et conformes aux standards mobile money locaux.
          </div>
        </Card>

        <Card class="bg-white/90 dark:bg-neutral-900/90">
          <template #header>
            <h2 id="checkout-terms" class="text-responsive-xl font-semibold text-neutral-900 dark:text-neutral-50">Conditions</h2>
          </template>
          <div class="space-y-3 text-responsive-sm text-neutral-600 dark:text-neutral-300" role="group" aria-labelledby="checkout-terms">
            <label class="flex items-start gap-3">
              <input v-model="termsAccepted" type="checkbox" class="mt-1 h-5 w-5 rounded border-neutral-300 text-primary-600 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-neutral-700 dark:bg-neutral-900 dark:text-primary-400 dark:focus-visible:ring-offset-neutral-950">
              <span>J'accepte les conditions d'annulation AntiGaspi et m'engage à récupérer mon panier dans le créneau choisi.</span>
            </label>
            <label class="flex items-start gap-3">
              <input v-model="subscribeNotifications" type="checkbox" class="mt-1 h-5 w-5 rounded border-neutral-300 text-primary-600 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-neutral-700 dark:bg-neutral-900 dark:text-primary-400 dark:focus-visible:ring-offset-neutral-950">
              <span>Recevoir des alertes lorsqu'un panier similaire est publié par mes commerçants favoris.</span>
            </label>
          </div>
        </Card>

        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          <Button variant="ghost" class="text-neutral-500 dark:text-neutral-300" @click="router.push({ name: 'cart' })">
            Revenir au panier
          </Button>
          <Button
            :loading="processing"
            :disabled="!canConfirm"
            class="min-w-[220px]"
            @click="confirmCheckout"
          >
            Confirmer et payer
          </Button>
        </div>
      </section>

      <aside class="space-y-6" aria-label="Résumé et assistance">
        <Card class="bg-white/90 dark:bg-neutral-900/90">
          <template #header>
            <h2 class="text-responsive-xl font-semibold text-neutral-900 dark:text-neutral-50">Résumé du panier</h2>
          </template>
          <ul class="space-y-4 text-responsive-sm text-neutral-600 dark:text-neutral-300">
            <li
              v-for="item in items"
              :key="item.id"
              class="flex items-center justify-between"
            >
              <div>
                <p class="font-semibold text-neutral-800 dark:text-neutral-100">{{ item.name }}</p>
                <p v-if="item.merchantName" class="text-responsive-xs text-neutral-500 dark:text-neutral-400">{{ item.merchantName }}</p>
              </div>
              <div class="text-right">
                <p class="font-semibold text-neutral-800 dark:text-neutral-100">{{ formatPrice(item.price * item.quantity) }}</p>
                <p class="text-responsive-xs text-neutral-400 dark:text-neutral-500">{{ item.quantity }} × {{ formatPrice(item.price) }}</p>
              </div>
            </li>
          </ul>
          <div class="mt-6 space-y-2 border-t border-neutral-200 pt-4 text-responsive-sm dark:border-neutral-800">
            <div class="flex items-center justify-between">
              <span>Sous-total</span>
              <span class="font-semibold text-neutral-800 dark:text-neutral-100">{{ formattedTotal }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span>Frais de service</span>
              <span class="text-neutral-400 dark:text-neutral-500">Offerts</span>
            </div>
            <div class="flex items-center justify-between text-responsive-base font-semibold text-neutral-900 dark:text-neutral-50">
              <span>Total à régler</span>
              <span>{{ formattedTotal }}</span>
            </div>
          </div>
        </Card>

        <Card class="bg-primary-500/95 text-white dark:bg-primary-700/90">
          <template #header>
            <h2 class="text-responsive-lg font-semibold">Besoin d'aide ?</h2>
          </template>
          <p class="text-responsive-sm text-primary-50 dark:text-primary-100">
            Notre équipe support est disponible de 8h à 22h pour vous aider à finaliser vos réservations ou modifier un créneau.
          </p>
          <Button
            variant="secondary"
            class="mt-4 w-full border-white/40 bg-white/20 text-white transition hover:bg-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-primary-600/80"
            @click="router.push({ name: 'reservations' })"
          >
            Suivre mes réservations
          </Button>
        </Card>
      </aside>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import Button from '@/components/ui/Button.vue'
import Card from '@/components/ui/Card.vue'
import { useCartStore } from '@/stores/cart'
import { useFavoritesStore } from '@/stores/favorites'
import { notify } from '@/composables/useNotifications'
import { formatPrice } from '@/utils/currency'
import { CreditCard, ShieldCheck } from 'lucide-vue-next'

const router = useRouter()
const cartStore = useCartStore()
const favoritesStore = useFavoritesStore()
const { items, totalAmount } = storeToRefs(cartStore)

const contactName = ref('')
const contactPhone = ref('')
const pickupSlot = ref<'asap' | 'lunch' | 'evening'>('asap')
const notes = ref('')
const selectedPayment = ref<'wallet' | 'tmoney' | 'flooz' | 'on_site'>('wallet')
const termsAccepted = ref(true)
const subscribeNotifications = ref(true)
const processing = ref(false)

const paymentOptions = [
  {
    value: 'wallet' as const,
    label: 'Portefeuille AntiGaspi',
    description: 'Utilisez votre solde fidélité et vos remboursements cumulés.'
  },
  {
    value: 'tmoney' as const,
    label: 'TMoney',
    description: 'Paiement mobile sécurisé avec confirmation instantanée.'
  },
  {
    value: 'flooz' as const,
    label: 'Flooz',
    description: 'Validez via USSD ou notification push Flooz.'
  },
  {
    value: 'on_site' as const,
    label: 'Paiement sur place',
    description: 'Réglez directement chez le commerçant au moment du retrait.'
  }
]

const formattedTotal = computed(() => formatPrice(totalAmount.value))
const hasItems = computed(() => items.value.length > 0)
const canConfirm = computed(() => hasItems.value && termsAccepted.value && !processing.value)

const confirmCheckout = async () => {
  if (!hasItems.value) {
    notify.error('Votre panier est vide. Ajoutez un panier avant de procéder.', 'Paiement')
    router.push({ name: 'products' })
    return
  }

  if (!contactPhone.value.trim()) {
    notify.warning('Renseignez un numéro de téléphone pour le retrait.', 'Paiement')
    return
  }

  processing.value = true

  await new Promise(resolve => setTimeout(resolve, 1200))

  notify.success('Votre réservation est confirmée !', 'Paiement')
  cartStore.clearCart({ silent: true })

  if (subscribeNotifications.value) {
    favoritesStore.hydrateFromStorage()
    notify.info('Nous vous préviendrons lors des prochaines disponibilités similaires.', 'Notifications activées')
  }

  processing.value = false
  router.push({ name: 'reservations' })
}

onMounted(() => {
  cartStore.hydrateFromStorage()
})
</script>
