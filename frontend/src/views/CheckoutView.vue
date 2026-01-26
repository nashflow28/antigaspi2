<template>
  <div class="min-h-screen bg-gradient-to-br from-surface-light via-neutral-50 to-neutral-100 dark:from-surface-dark dark:via-neutral-900 dark:to-surface-darker">
    <div class="border-b border-neutral-200/70 bg-white/80 backdrop-blur dark:border-neutral-800/70 dark:bg-neutral-900/80">
      <div class="container px-3 py-8 mx-auto">
        <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p class="inline-flex items-center gap-2 rounded-full bg-primary-100/70 px-3 py-3 text-sm font-medium text-primary-900 dark:bg-primary-500/20 dark:text-primary-100">
              <CreditCard class="w-4 h-4" />
              Finaliser ma réservation
            </p>
            <h1 class="mt-3 text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">Paiement sécurisé GÊLADAL</h1>
            <p class="mt-2 max-w-full sm:max-w-80 text-neutral-700 dark:text-neutral-400">
              Vérifiez vos informations, choisissez votre mode de paiement et confirmez votre panier surprise en toute sérénité.
            </p>
          </div>
          <div class="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400" aria-hidden="true">
            <span class="flex h-8 w-8 items-center justify-center rounded-full bg-primary-500 text-sm font-semibold text-white">1</span>
            <span>Résumé</span>
            <span class="text-neutral-400 dark:text-neutral-600">—</span>
            <span class="flex h-8 w-8 items-center justify-center rounded-full bg-primary-500 text-sm font-semibold text-white">2</span>
            <span>Paiement</span>
            <span class="text-neutral-400 dark:text-neutral-600">—</span>
            <span class="flex h-8 w-8 items-center justify-center rounded-full bg-primary-500 text-sm font-semibold text-white">3</span>
            <span>Confirmation</span>
          </div>
        </div>
      </div>
    </div>

    <main class="container px-3 sm:px-4 lg:px-6 mx-auto grid gap-6 sm:gap-8 px-4 py-8 sm:py-12 lg:py-16 lg:grid-cols-[2fr_1fr]">
      <section class="space-y-6" aria-label="Formulaire de paiement">
        <Card class="bg-white/90 dark:bg-neutral-900/90">
          <template #header>
            <h2 id="checkout-pickup" class="text-xl font-semibold text-neutral-900 dark:text-neutral-50">Informations de retrait</h2>
          </template>
          <div class="grid gap-3 md:grid-cols-2" role="group" aria-labelledby="checkout-pickup">
            <Input
              v-model="contactName"
              label="Nom complet"
              placeholder="Ex : Kossi Awesso"
            />
            <Input
              v-model="contactPhone"
              type="tel"
              label="Numéro de téléphone"
              placeholder="Ex : +228 90 00 00 00"
            />
            <div class="space-y-2">
              <label class="text-sm font-medium text-neutral-700 dark:text-neutral-200">
                Créneau de retrait
              </label>
              <Select v-model="pickupSlot">
                <option value="asap">Dès que possible</option>
                <option value="lunch">Pause déjeuner (12h-14h)</option>
                <option value="evening">Fin de journée (18h-20h)</option>
              </Select>
            </div>
            <Textarea
              v-model="notes"
              label="Notes pour le commerçant"
              rows="3"
              helper-text="Ajoutez des précisions pour le retrait."
              placeholder="Ex : Merci de prévoir un sac réutilisable."
            />
          </div>
        </Card>

        <Card class="bg-white/90 dark:bg-neutral-900/90">
          <template #header>
            <div class="flex items-center justify-between gap-3">
              <h2 id="checkout-payment" class="text-xl font-semibold text-neutral-900 dark:text-neutral-50">Mode de paiement</h2>
              <span class="text-sm text-neutral-500 dark:text-neutral-400">Frais transparents, confirmation immédiate</span>
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
              class="flex flex-col gap-2 rounded border px-6 py-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-neutral-950"
              role="radio"
              :aria-checked="option.value === selectedPayment"
              :class="option.value === selectedPayment
                ? 'border-primary-400 bg-primary-50/60 shadow-xl dark:border-primary-500 dark:bg-primary-500/20'
                : 'border-neutral-200 bg-white hover:border-primary-200 hover:bg-primary-50/40 dark:border-neutral-700 dark:bg-neutral-900/70 dark:hover:border-primary-500/60 dark:hover:bg-primary-500/10'"
              @click="selectedPayment = option.value"
            >
              <span class="text-sm font-semibold text-neutral-900 dark:text-neutral-50">{{ option.label }}</span>
              <span class="text-xs text-neutral-500 dark:text-neutral-500">{{ option.description }}</span>
            </button>
          </div>

          <!-- Wallet PIN field (shown only when wallet payment is selected) -->
          <div v-if="selectedPayment === 'wallet'" class="mt-4 space-y-2">
            <Input
              v-model="walletPin"
              type="password"
              label="Code PIN Portefeuille"
              placeholder="••••••"
              inputmode="numeric"
              maxlength="6"
              help-text="Code à 4-6 chiffres configuré dans votre portefeuille"
            />
          </div>

          <div class="mt-4 flex items-center gap-2 rounded bg-primary-50 px-3 py-3 text-sm text-primary-900 dark:bg-primary-500/15 dark:text-primary-100">
            <ShieldCheck class="w-4 h-4" />
            Transactions chiffrées et conformes aux standards mobile money locaux.
          </div>
        </Card>

        <Card class="bg-white/90 dark:bg-neutral-900/90">
          <template #header>
            <h2 id="checkout-terms" class="text-xl font-semibold text-neutral-900 dark:text-neutral-50">Conditions</h2>
          </template>
          <div class="space-y-3 text-sm text-neutral-700 dark:text-neutral-500" role="group" aria-labelledby="checkout-terms">
            <Checkbox v-model="termsAccepted">
              J'accepte les conditions d'annulation GÊLADAL et m'engage à récupérer mon panier dans le créneau choisi.
            </Checkbox>
            <Checkbox v-model="subscribeNotifications">
              Recevoir des alertes lorsqu'un panier similaire est publié par mes commerçants favoris.
            </Checkbox>
          </div>
        </Card>

        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          <Button variant="ghost" class="text-neutral-500 dark:text-neutral-500" @click="router.push({ name: 'cart' })">
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
            <h2 class="text-xl font-semibold text-neutral-900 dark:text-neutral-50">Résumé du panier</h2>
          </template>
          <ul class="space-y-4 text-sm text-neutral-700 dark:text-neutral-500">
            <li
              v-for="item in items"
              :key="item.id"
              class="flex items-center justify-between"
            >
              <div>
                <p class="font-semibold text-neutral-800 dark:text-neutral-100">{{ item.name }}</p>
                <p v-if="item.merchantName" class="text-xs text-neutral-500 dark:text-neutral-400">{{ item.merchantName }}</p>
              </div>
              <div class="text-right">
                <p class="font-semibold text-neutral-800 dark:text-neutral-100">{{ formatPrice(item.price * item.quantity) }}</p>
                <p class="text-xs text-neutral-400 dark:text-neutral-500">{{ item.quantity }} × {{ formatPrice(item.price) }}</p>
              </div>
            </li>
          </ul>
          <div class="mt-6 space-y-4 border-t border-neutral-200 pt-6 text-sm dark:border-neutral-800">
            <div class="flex items-center justify-between">
              <span>Sous-total</span>
              <span class="font-semibold text-neutral-800 dark:text-neutral-100">{{ formattedTotal }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span>Frais de service</span>
              <span class="text-neutral-400 dark:text-neutral-500">Offerts</span>
            </div>
            <div class="flex items-center justify-between text-base font-semibold text-neutral-900 dark:text-neutral-50">
              <span>Total à régler</span>
              <span>{{ formattedTotal }}</span>
            </div>
          </div>
        </Card>

        <Card class="bg-primary-500/95 text-white dark:bg-primary-700/90">
          <template #header>
            <h2 class="text-lg font-semibold">Besoin d'aide ?</h2>
          </template>
          <p class="text-sm text-primary-50 dark:text-primary-100">
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
import { Button, Card } from '@/components/ui/2025'
import Input from '@/components/ui/2025/Input.vue'
import Select from '@/components/ui/2025/Select.vue'
import Checkbox from '@/components/ui/2025/Checkbox.vue'
import Textarea from '@/components/ui/2025/Textarea.vue'
import { useCartStore } from '@/stores/cart'
import { useFavoritesStore } from '@/stores/favorites'
import { notify } from '@/composables/useNotifications'
import { formatPrice } from '@/utils/currency'
import { CreditCard, ShieldCheck } from 'lucide-vue-next'
import apiService from '@/services/api'

const router = useRouter()
const cartStore = useCartStore()
const favoritesStore = useFavoritesStore()
const { items, totalAmount } = storeToRefs(cartStore)

const contactName = ref('')
const contactPhone = ref('')
const pickupSlot = ref<'asap' | 'lunch' | 'evening'>('asap')
const notes = ref('')
const selectedPayment = ref<'wallet' | 'flooz' | 'tmoney' | 'orange_money' | 'mtn_momo' | 'on_site'>('on_site')
const walletPin = ref('')
const termsAccepted = ref(true)
const subscribeNotifications = ref(true)
const processing = ref(false)

// Wallet payment requires PIN
const isWalletPayment = computed(() => selectedPayment.value === 'wallet')
const isMobileMoneyPayment = computed(() => ['flooz', 'tmoney', 'orange_money', 'mtn_momo'].includes(selectedPayment.value))

const paymentOptions = [
  {
    value: 'wallet' as const,
    label: 'Portefeuille GÊLADAL',
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
const canConfirm = computed(() => {
  if (!hasItems.value || !termsAccepted.value || processing.value) return false
  // Wallet payment requires PIN
  if (isWalletPayment.value && (!walletPin.value || walletPin.value.length < 4)) return false
  // Mobile Money requires phone number
  if (isMobileMoneyPayment.value && !contactPhone.value.trim()) return false
  return true
})

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

  // Validate wallet PIN if wallet payment selected
  if (isWalletPayment.value && (!walletPin.value || walletPin.value.length < 4)) {
    notify.warning('Renseignez votre code PIN portefeuille (4-6 chiffres).', 'Paiement')
    return
  }

  processing.value = true

  try {
    // Convert pickup slot to actual date/time
    const now = new Date()
    const pickupDate = now.toISOString().split('T')[0] // Today by default
    let pickupTime = ''

    switch (pickupSlot.value) {
      case 'asap':
        // ASAP: 30 min from now
        {
          const asapTime = new Date(now.getTime() + 30 * 60 * 1000)
          pickupTime = asapTime.toTimeString().slice(0, 5)
        }
        break
      case 'lunch':
        pickupTime = '12:00'
        break
      case 'evening':
        pickupTime = '18:00'
        break
      default:
        pickupTime = '12:00'
    }

    // Build order payload
    const orderPayload = {
      items: items.value.map(item => ({
        product_id: item.id,
        quantity: item.quantity
      })),
      payment_method: selectedPayment.value,
      wallet_pin: isWalletPayment.value ? walletPin.value : undefined,
      customer_phone: contactPhone.value.trim(),
      customer_name: contactName.value.trim() || undefined,
      pickup_date: pickupDate,
      pickup_time: pickupTime,
      notes: notes.value.trim() || undefined
    }

    // Call API to create order
    const response = await apiService.post<{
      success: boolean
      message?: string
      data?: {
        order_id?: number
        order_number?: string
        payment?: {
          id: number
          status: string
          provider: string
        }
        requires_payment_confirmation?: boolean
      }
    }>('/orders', orderPayload)

    if (!response.success) {
      throw new Error(response.message || 'Erreur lors de la création de la commande')
    }

    // Check if Mobile Money payment requires confirmation
    if (response.data?.requires_payment_confirmation && response.data?.payment) {
      notify.info('Validez le paiement sur votre téléphone', 'Paiement en attente')
      router.push({
        name: 'payment-status',
        params: { paymentId: response.data.payment.id }
      })
    } else {
      notify.success('Votre réservation est confirmée !', 'Paiement')
      router.push({ name: 'reservations' })
    }

    // Clear cart after successful order (backend already clears it, but sync local state)
    cartStore.clearCart({ silent: true })

    if (subscribeNotifications.value) {
      void favoritesStore.initialize()
      notify.info('Nous vous préviendrons lors des prochaines disponibilités similaires.', 'Notifications activées')
    }

  } catch (error: any) {
    const message = error?.response?.data?.message || error?.message || 'Erreur lors de la création de la commande'
    notify.error(message, 'Erreur')
  } finally {
    processing.value = false
  }
}

onMounted(() => {
  cartStore.hydrateFromStorage()
})
</script>
