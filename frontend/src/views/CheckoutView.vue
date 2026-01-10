<template>
  <div class="min-h-screen bg-gradient-to-b from-gray-50 via-white to-blue-50 dark:from-gray-950 dark:via-gray-950 dark:to-gray-900">
    <div class="border-b border-gray-200/70 bg-white/80 backdrop-blur dark:border-gray-800/70 dark:bg-gray-900/80">
      <div class="container px-3 py-8 mx-auto">
        <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p class="inline-flex items-center gap-2 rounded-full bg-blue-100/70 px-3 py-3 text-sm font-medium text-blue-900 dark:bg-blue-500/20 dark:text-blue-100">
              <CreditCard class="w-4 h-4" />
              Finaliser ma réservation
            </p>
            <h1 class="mt-3 text-3xl font-semibold tracking-tight text-gray-900 dark:text-gray-50">Paiement sécurisé AntiGaspi</h1>
            <p class="mt-2 max-w-full sm:max-w-80 text-gray-700 dark:text-gray-500">
              Vérifiez vos informations, choisissez votre mode de paiement et confirmez votre panier surprise en toute sérénité.
            </p>
          </div>
          <div class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400" aria-hidden="true">
            <span class="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-sm font-semibold text-white">1</span>
            <span>Résumé</span>
            <span class="text-gray-400 dark:text-gray-700">—</span>
            <span class="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-sm font-semibold text-white">2</span>
            <span>Paiement</span>
            <span class="text-gray-400 dark:text-gray-700">—</span>
            <span class="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-sm font-semibold text-white">3</span>
            <span>Confirmation</span>
          </div>
        </div>
      </div>
    </div>

    <main class="container px-3 sm:px-4 lg:px-6 mx-auto grid gap-6 sm:gap-8 px-4 py-8 sm:py-12 lg:py-16 lg:grid-cols-[2fr_1fr]">
      <section class="space-y-6" aria-label="Formulaire de paiement">
        <Card class="bg-white/90 dark:bg-gray-900/90">
          <template #header>
            <h2 id="checkout-pickup" class="text-xl font-semibold text-gray-900 dark:text-gray-50">Informations de retrait</h2>
          </template>
          <div class="grid gap-3 md:grid-cols-2" role="group" aria-labelledby="checkout-pickup">
            <label class="flex flex-col gap-2 text-sm text-gray-700 dark:text-gray-200">
              Nom complet
              <input
                v-model="contactName"
                type="text"
                class="rounded border border-gray-200 bg-white/80 px-3 py-3 text-gray-900 shadow-inner transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-gray-700 dark:bg-gray-900/80 dark:text-gray-50 dark:focus-visible:ring-offset-gray-950"
                placeholder="Ex : Kossi Awesso"
              >
            </label>
            <label class="flex flex-col gap-2 text-sm text-gray-700 dark:text-gray-200">
              Numéro de téléphone
              <input
                v-model="contactPhone"
                type="tel"
                class="rounded border border-gray-200 bg-white/80 px-3 py-3 text-gray-900 shadow-inner transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-gray-700 dark:bg-gray-900/80 dark:text-gray-50 dark:focus-visible:ring-offset-gray-950"
                placeholder="Ex : +228 90 00 00 00"
              >
            </label>
            <label class="flex flex-col gap-2 text-sm text-gray-700 dark:text-gray-200">
              Créneau de retrait
              <select
                v-model="pickupSlot"
                class="rounded border border-gray-200 bg-white/80 px-3 py-3 text-gray-900 shadow-inner transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-gray-700 dark:bg-gray-900/80 dark:text-gray-50 dark:focus-visible:ring-offset-gray-950"
              >
                <option value="asap">Dès que possible</option>
                <option value="lunch">Pause déjeuner (12h-14h)</option>
                <option value="evening">Fin de journée (18h-20h)</option>
              </select>
            </label>
            <label class="flex flex-col gap-2 text-sm text-gray-700 dark:text-gray-200">
              Notes pour le commerçant
              <textarea
                v-model="notes"
                rows="3"
                class="rounded border border-gray-200 bg-white/80 px-3 py-3 text-gray-900 shadow-inner transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-gray-700 dark:bg-gray-900/80 dark:text-gray-50 dark:focus-visible:ring-offset-gray-950"
                placeholder="Ex : Merci de prévoir un sac réutilisable."
              />
            </label>
          </div>
        </Card>

        <Card class="bg-white/90 dark:bg-gray-900/90">
          <template #header>
            <div class="flex items-center justify-between gap-3">
              <h2 id="checkout-payment" class="text-xl font-semibold text-gray-900 dark:text-gray-50">Mode de paiement</h2>
              <span class="text-sm text-gray-500 dark:text-gray-400">Frais transparents, confirmation immédiate</span>
            </div>
          </template>

          <div
            class="grid gap-3 md:grid-cols-2"
            role="radiogroup"
            aria-labelledby="checkout-payment"
          >
            <button
              v-for="option in paymentOptions"
              :key="option.value"
              type="button"
              class="flex flex-col gap-2 rounded border px-6 py-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-gray-950"
              role="radio"
              :aria-checked="option.value === selectedPayment"
              :class="option.value === selectedPayment
                ? 'border-blue-400 bg-blue-50/60 shadow-xl dark:border-blue-500 dark:bg-blue-500/20'
                : 'border-gray-200 bg-white hover:border-blue-200 hover:bg-blue-50/40 dark:border-gray-700 dark:bg-gray-900/70 dark:hover:border-blue-500/60 dark:hover:bg-blue-500/10'"
              @click="selectedPayment = option.value"
            >
              <span class="text-sm font-semibold text-gray-900 dark:text-gray-50">{{ option.label }}</span>
              <span class="text-xs text-gray-500 dark:text-gray-500">{{ option.description }}</span>
            </button>
          </div>

          <div class="mt-4 flex items-center gap-2 rounded bg-blue-50 px-3 py-3 text-sm text-blue-900 dark:bg-blue-500/15 dark:text-blue-100">
            <ShieldCheck class="w-4 h-4" />
            Transactions chiffrées et conformes aux standards mobile money locaux.
          </div>
        </Card>

        <Card class="bg-white/90 dark:bg-gray-900/90">
          <template #header>
            <h2 id="checkout-terms" class="text-xl font-semibold text-gray-900 dark:text-gray-50">Conditions</h2>
          </template>
          <div class="space-y-2 text-sm text-gray-700 dark:text-gray-500" role="group" aria-labelledby="checkout-terms">
            <label class="flex items-stretch sm:items-start gap-3">
              <input v-model="termsAccepted" type="checkbox" class="mt-1 w-4 h-4 rounded border-gray-300 text-blue-600 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-gray-700 dark:bg-gray-900 dark:text-blue-400 dark:focus-visible:ring-offset-gray-950">
              <span>J'accepte les conditions d'annulation AntiGaspi et m'engage à récupérer mon panier dans le créneau choisi.</span>
            </label>
            <label class="flex items-stretch sm:items-start gap-3">
              <input v-model="subscribeNotifications" type="checkbox" class="mt-1 w-4 h-4 rounded border-gray-300 text-blue-600 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-gray-700 dark:bg-gray-900 dark:text-blue-400 dark:focus-visible:ring-offset-gray-950">
              <span>Recevoir des alertes lorsqu'un panier similaire est publié par mes commerçants favoris.</span>
            </label>
          </div>
        </Card>

        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          <Button variant="ghost" class="text-gray-500 dark:text-gray-500" @click="router.push({ name: 'cart' })">
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
        <Card class="bg-white/90 dark:bg-gray-900/90">
          <template #header>
            <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-50">Résumé du panier</h2>
          </template>
          <ul class="space-y-4 text-sm text-gray-700 dark:text-gray-500">
            <li
              v-for="item in items"
              :key="item.id"
              class="flex items-center justify-between"
            >
              <div>
                <p class="font-semibold text-gray-800 dark:text-gray-100">{{ item.name }}</p>
                <p v-if="item.merchantName" class="text-xs text-gray-500 dark:text-gray-400">{{ item.merchantName }}</p>
              </div>
              <div class="text-right">
                <p class="font-semibold text-gray-800 dark:text-gray-100">{{ formatPrice(item.price * item.quantity) }}</p>
                <p class="text-xs text-gray-400 dark:text-gray-500">{{ item.quantity }} × {{ formatPrice(item.price) }}</p>
              </div>
            </li>
          </ul>
          <div class="mt-6 space-y-4 border-t border-gray-200 pt-6 text-sm dark:border-gray-800">
            <div class="flex items-center justify-between">
              <span>Sous-total</span>
              <span class="font-semibold text-gray-800 dark:text-gray-100">{{ formattedTotal }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span>Frais de service</span>
              <span class="text-gray-400 dark:text-gray-500">Offerts</span>
            </div>
            <div class="flex items-center justify-between text-base font-semibold text-gray-900 dark:text-gray-50">
              <span>Total à régler</span>
              <span>{{ formattedTotal }}</span>
            </div>
          </div>
        </Card>

        <Card class="bg-blue-500/95 text-white dark:bg-blue-700/90">
          <template #header>
            <h2 class="text-lg font-semibold">Besoin d'aide ?</h2>
          </template>
          <p class="text-sm text-blue-50 dark:text-blue-100">
            Notre équipe support est disponible de 8h à 22h pour vous aider à finaliser vos réservations ou modifier un créneau.
          </p>
          <Button
            variant="secondary"
            class="mt-4 w-full border-white/40 bg-white/20 text-white transition hover:bg-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-blue-600/80"
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
const selectedPayment = ref<'wallet' | 'flooz' | 'tmoney' | 'orange_money' | 'mtn_momo' | 'on_site'>('wallet')
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
    value: 'orange_money' as const,
    label: 'Orange Money',
    description: 'Paiement mobile Orange Money via CinetPay.'
  },
  {
    value: 'mtn_momo' as const,
    label: 'MTN MoMo',
    description: 'Paiement mobile MTN MoMo via CinetPay.'
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
    void favoritesStore.initialize()
    notify.info('Nous vous préviendrons lors des prochaines disponibilités similaires.', 'Notifications activées')
  }

  processing.value = false
  router.push({ name: 'reservations' })
}

onMounted(() => {
  cartStore.hydrateFromStorage()
})
</script>
