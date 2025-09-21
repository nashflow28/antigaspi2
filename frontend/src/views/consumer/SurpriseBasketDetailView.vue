<template>
  <div class="min-h-screen bg-gradient-subtle pb-16">
    <div class="container mx-auto px-4 pt-10">
      <button
        type="button"
        class="mb-6 inline-flex items-center gap-2 text-sm font-medium text-neutral-600 hover:text-neutral-900"
        @click="router.back()"
      >
        <ArrowLeft class="h-4 w-4" />
        Retour
      </button>

      <div v-if="isLoading" class="card flex min-h-[240px] items-center justify-center text-neutral-500">
        <span class="inline-flex h-6 w-6 animate-spin rounded-full border-2 border-neutral-200 border-t-primary-500"></span>
        <span class="ml-3">Chargement du panier surprise...</span>
      </div>

      <div v-else-if="!basket" class="card text-center py-16">
        <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100">
          <Package class="h-8 w-8 text-neutral-400" />
        </div>
        <h2 class="text-xl font-semibold text-neutral-800">Panier introuvable</h2>
        <p class="mt-2 text-neutral-500">Ce panier surprise n'est plus disponible ou n'existe pas.</p>
        <button type="button" class="btn btn-primary mt-6" @click="router.push({ name: 'surprise-baskets' })">
          Voir les autres paniers
        </button>
      </div>

      <div v-else class="grid gap-8 lg:grid-cols-[2fr_1fr]">
        <article class="card overflow-hidden">
          <div class="relative h-64 w-full">
            <img
              v-if="basket.image_url"
              :src="basket.image_url"
              :alt="basket.name"
              class="h-full w-full object-cover"
            />
            <div
              v-else
              class="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50"
            >
              <Package class="h-12 w-12 text-primary-400" />
            </div>
            <div class="absolute left-6 top-6 flex items-center gap-3">
              <span class="badge badge-success font-semibold">-{{ basket.basket_discount_percentage }}%</span>
              <span class="rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-neutral-700 shadow-soft">
                <Clock class="mr-1 inline-block h-4 w-4 text-primary-500" />
                {{ timeLeft }}
              </span>
            </div>
          </div>

          <div class="space-y-6 p-6">
            <header class="space-y-2">
              <h1 class="text-3xl font-bold text-neutral-900">{{ basket.name }}</h1>
              <p v-if="basket.surprise_description" class="text-neutral-600">{{ basket.surprise_description }}</p>
              <div class="flex flex-wrap items-center gap-3 text-sm text-neutral-500">
                <span class="inline-flex items-center gap-2 rounded-full bg-primary-50 px-3 py-1 text-primary-700">
                  <Store class="h-4 w-4" />
                  {{ basket.merchant.business_name }}
                </span>
                <span v-if="basket.category?.name" class="inline-flex items-center gap-2 rounded-full bg-secondary-50 px-3 py-1 text-secondary-700">
                  <Tag class="h-4 w-4" />
                  {{ basket.category.name }}
                </span>
                <span class="inline-flex items-center gap-2 rounded-full bg-neutral-100 px-3 py-1 text-neutral-600">
                  <ShieldCheck class="h-4 w-4" />
                  Retrait garanti avant expiration
                </span>
              </div>
            </header>

            <section>
              <h2 class="text-lg font-semibold text-neutral-900">Contenu surprise</h2>
              <ul v-if="basket.surprise_basket_items?.length" class="mt-3 space-y-3">
                <li
                  v-for="item in basket.surprise_basket_items"
                  :key="item.id"
                  class="flex items-start justify-between rounded-xl bg-neutral-50 px-4 py-3"
                >
                  <div>
                    <p class="font-medium text-neutral-800">{{ item.product.name }}</p>
                    <p class="text-xs text-neutral-500">Quantité min : {{ item.quantity }}</p>
                  </div>
                  <span class="text-sm font-medium text-neutral-600">{{ formatPrice(item.total_price) }}</span>
                </li>
              </ul>
              <p v-else class="mt-3 text-sm text-neutral-500">
                Ce panier est une surprise ! Le commerçant sélectionne les meilleurs produits disponibles.
              </p>
            </section>
          </div>
        </article>

        <aside class="card space-y-6 p-6">
          <div>
            <h2 class="text-lg font-semibold text-neutral-900">Votre réservation</h2>
            <p class="text-sm text-neutral-500">Réservez dès maintenant et récupérez votre panier avant l'expiration.</p>
          </div>

          <div class="space-y-3 rounded-xl bg-neutral-50 p-4">
            <div class="flex items-center justify-between">
              <span class="text-sm text-neutral-500">Prix réduit</span>
              <span class="text-xl font-bold text-primary-600">{{ formattedDiscountedPrice }}</span>
            </div>
            <div class="flex items-center justify-between text-sm text-neutral-500">
              <span>Valeur d'origine</span>
              <span class="line-through">{{ formattedOriginalPrice }}</span>
            </div>
            <div class="flex items-center justify-between text-sm font-semibold text-success-600">
              <span>Économies</span>
              <span>{{ formattedSavings }}</span>
            </div>
          </div>

          <div class="space-y-3">
            <label class="form-label" for="quantity">Quantité</label>
            <input
              id="quantity"
              type="number"
              min="1"
              :max="Math.max(1, maxQuantity)"
              class="form-input"
              :disabled="maxQuantity === 0"
              v-model.number="quantity"
            />
            <p class="text-xs text-neutral-500">{{ maxQuantity }} panier{{ maxQuantity > 1 ? 's' : '' }} restant{{ maxQuantity > 1 ? 's' : '' }}</p>
          </div>

          <div class="space-y-4">
            <div>
              <div class="flex items-center justify-between">
                <h3 class="text-sm font-semibold text-neutral-900">Moyen de paiement</h3>
                <span class="text-xs text-neutral-500">Sélectionnez une option</span>
              </div>
              <div class="mt-3 space-y-3">
                <button
                  v-for="option in paymentOptions"
                  :key="option.value"
                  type="button"
                  class="flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-all"
                  :class="[
                    paymentMethod === option.value
                      ? 'border-primary-500 bg-primary-50 shadow-sm'
                      : 'border-neutral-200 hover:border-primary-200 hover:bg-primary-50/40'
                  ]"
                  @click="paymentMethod = option.value"
                >
                  <div
                    class="flex h-10 w-10 items-center justify-center rounded-full"
                    :class="paymentMethod === option.value ? 'bg-primary-500 text-white' : 'bg-neutral-100 text-neutral-600'"
                  >
                    <component :is="option.icon" class="h-5 w-5" />
                  </div>
                  <div class="flex-1">
                    <p class="font-medium text-neutral-900">{{ option.label }}</p>
                    <p class="text-xs text-neutral-500">{{ option.description }}</p>
                  </div>
                  <span
                    v-if="paymentMethod === option.value"
                    class="text-xs font-semibold text-primary-600"
                  >
                    Choisi
                  </span>
                </button>
              </div>
            </div>

            <div v-if="methodRequiresPhone" class="space-y-2">
              <label for="mobile-money-phone" class="form-label">Numéro Mobile Money</label>
              <input
                id="mobile-money-phone"
                v-model.trim="mobileMoneyPhone"
                type="tel"
                placeholder="+228 90 00 00 00"
                class="form-input"
                :class="{
                  'border-error-400 focus:border-error-400 focus:ring-error-100': mobileMoneyPhone && !isPhoneValid
                }"
                :disabled="submitting"
              />
              <p class="text-xs text-neutral-500">Utilisez un numéro enregistré sur le portefeuille sélectionné.</p>
              <p v-if="phoneError" class="text-xs font-medium text-error-600">{{ phoneError }}</p>
            </div>

            <p
              v-if="selectedPaymentOption?.instructions"
              class="rounded-xl bg-neutral-50 p-3 text-xs text-neutral-600"
            >
              {{ selectedPaymentOption.instructions }}
            </p>
          </div>

          <div class="rounded-xl bg-primary-50 p-4 text-sm text-primary-700">
            <p class="font-semibold">Montant à régler</p>
            <p class="text-2xl font-bold">{{ totalReservationPrice }}</p>
            <p v-if="quantity > 1" class="mt-1 text-xs text-primary-600">Soit {{ formattedDiscountedPrice }} par panier</p>
            <p v-if="methodRequiresPhone" class="mt-2 text-xs">
              Un SMS de validation sera envoyé par l'opérateur après la demande de paiement.
            </p>
            <p v-else-if="paymentMethod === 'paystack'" class="mt-2 text-xs">
              Une page sécurisée Paystack s'ouvrira pour finaliser le paiement.
            </p>
            <p v-else-if="paymentMethod === 'on_site'" class="mt-2 text-xs">
              Réglez ce montant directement auprès du commerçant lors du retrait.
            </p>
          </div>

          <div class="space-y-2">
            <button
              type="button"
              class="btn btn-primary w-full"
              :disabled="!canReserve || submitting"
              @click="reserveBasket"
            >
              <span v-if="submitting" class="inline-flex items-center gap-2">
                <Loader2 class="h-4 w-4 animate-spin" />
                Réservation en cours...
              </span>
              <span v-else>{{ reserveButtonLabel }}</span>
            </button>
            <p v-if="!authStore.isAuthenticated" class="text-center text-xs text-neutral-500">
              Connectez-vous pour finaliser la réservation.
            </p>
            <p v-else-if="!authStore.isConsumer" class="text-center text-xs text-neutral-500">
              Seuls les consommateurs peuvent réserver des paniers.
            </p>
          </div>
        </aside>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import type { Component } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Clock, Loader2, Package, ShieldCheck, Store, Tag, Smartphone, CreditCard, Wallet } from 'lucide-vue-next'
import { useSurpriseBaskets } from '@/composables/useSurpriseBaskets'
import { useReservationsStore } from '@/stores/reservations'
import { useAuthStore } from '@/stores/auth'
import { usePaymentsStore, isFinalStatus } from '@/stores/payments'
import { notify } from '@/composables/useNotifications'
import { formatPrice, formatSavings } from '@/utils/currency'
import type { SurpriseBasket } from '@/services/surpriseBasketService'
import type { PaymentMethod } from '@/types'

const route = useRoute()
const router = useRouter()

const { getBasketById, loadBasket } = useSurpriseBaskets()
const reservationsStore = useReservationsStore()
const authStore = useAuthStore()
const paymentsStore = usePaymentsStore()

const basket = ref<SurpriseBasket | null>(null)
const isLoading = ref(true)
const quantity = ref(1)
const submitting = ref(false)
const paymentMethod = ref<PaymentMethod>('on_site')
const mobileMoneyPhone = ref(authStore.user?.phone || '')

const maxQuantity = computed(() => basket.value?.quantity_available ?? 0)

const formattedDiscountedPrice = computed(() => formatPrice(basket.value?.discounted_price ?? 0))
const formattedOriginalPrice = computed(() => {
  if (!basket.value) return ''
  const original = basket.value.total_original_value ?? basket.value.original_price
  return formatPrice(original)
})
const formattedSavings = computed(() => {
  if (!basket.value) return ''
  const original = basket.value.total_original_value ?? basket.value.original_price
  if (original <= basket.value.discounted_price) {
    return formatPrice(0)
  }
  return formatSavings(original, basket.value.discounted_price)
})

const totalReservationPrice = computed(() => {
  if (!basket.value) return formatPrice(0)
  return formatPrice(basket.value.discounted_price * quantity.value)
})

type PaymentOption = {
  value: PaymentMethod
  label: string
  description: string
  requiresPhone: boolean
  icon: Component
  instructions: string
}

const paymentOptions: PaymentOption[] = [
  {
    value: 'flooz',
    label: 'Flooz (Moov Togo)',
    description: 'PayGate - Mobile Money',
    requiresPhone: true,
    icon: Smartphone,
    instructions: 'Assurez-vous que votre numéro Flooz est actif et dispose des fonds nécessaires.'
  },
  {
    value: 'tmoney',
    label: 'Mixx by Yas (Tmoney)',
    description: 'PayGate - Mobile Money',
    requiresPhone: true,
    icon: Smartphone,
    instructions: 'Le numéro Mixx by Yas doit être au format international (+228...).'
  },
  {
    value: 'paystack',
    label: 'Paystack',
    description: 'Cartes bancaires & Mobile Money',
    requiresPhone: false,
    icon: CreditCard,
    instructions: 'Vous serez redirigé vers Paystack pour finaliser le paiement de façon sécurisée.'
  },
  {
    value: 'on_site',
    label: 'Paiement sur place',
    description: 'Régler lors du retrait',
    requiresPhone: false,
    icon: Wallet,
    instructions: 'Préparez le montant exact et réglez directement auprès du commerçant.'
  }
]

const selectedPaymentOption = computed(() => paymentOptions.find(option => option.value === paymentMethod.value))
const methodRequiresPhone = computed(() => selectedPaymentOption.value?.requiresPhone ?? false)
const phonePattern = /^\+?[0-9]{8,15}$/
const isPhoneValid = computed(() => {
  if (!methodRequiresPhone.value) return true
  if (!mobileMoneyPhone.value) return false
  return phonePattern.test(mobileMoneyPhone.value)
})

const phoneError = computed(() => {
  if (!methodRequiresPhone.value) return ''
  if (!mobileMoneyPhone.value) return 'Le numéro est requis pour ce moyen de paiement.'
  if (!isPhoneValid.value) return 'Le format du numéro est invalide.'
  return ''
})

const timeLeft = computed(() => {
  if (!basket.value?.expiration_date) return 'Durée limitée'
  const expiresAt = new Date(basket.value.expiration_date)
  const now = new Date()
  const diff = expiresAt.getTime() - now.getTime()
  if (diff <= 0) return 'Expiré'

  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

  if (hours > 0) {
    return `${hours}h${minutes > 0 ? ` ${minutes}m` : ''}`
  }
  return `${minutes}m`
})

const canReserve = computed(() => {
  if (!authStore.isAuthenticated || !authStore.isConsumer) return false
  if (maxQuantity.value === 0) return false
  if (quantity.value < 1) return false
  if (!paymentMethod.value) return false
  if (methodRequiresPhone.value && !isPhoneValid.value) return false
  return true
})

const reserveButtonLabel = computed(() => {
  if (!authStore.isAuthenticated) return 'Se connecter pour réserver'
  if (!authStore.isConsumer) return 'Réservé aux consommateurs'
  if (maxQuantity.value === 0) return 'Indisponible'
  if (!paymentMethod.value) return 'Sélectionner un paiement'
  if (methodRequiresPhone.value) {
    if (!mobileMoneyPhone.value) return 'Renseigner votre numéro'
    if (!isPhoneValid.value) return 'Numéro invalide'
    return 'Confirmer et payer'
  }
  if (paymentMethod.value === 'on_site') return 'Réserver (paiement sur place)'
  if (paymentMethod.value === 'paystack') return 'Continuer vers le paiement'
  return 'Confirmer la réservation'
})

const ensureQuantityInBounds = () => {
  if (quantity.value < 1) quantity.value = 1
  if (maxQuantity.value && quantity.value > maxQuantity.value) {
    quantity.value = maxQuantity.value
  }
}

watch(quantity, ensureQuantityInBounds)
watch(maxQuantity, ensureQuantityInBounds)
watch(methodRequiresPhone, requires => {
  if (requires && !mobileMoneyPhone.value && authStore.user?.phone) {
    mobileMoneyPhone.value = authStore.user.phone
  }
})

const fetchBasket = async () => {
  const idParam = Number(route.params.id)
  if (Number.isNaN(idParam)) {
    notify.error('Identifiant de panier invalide')
    isLoading.value = false
    basket.value = null
    return
  }

  isLoading.value = true
  const cached = getBasketById(idParam)
  if (cached) {
    basket.value = cached
    isLoading.value = false
    return
  }

  const loaded = await loadBasket(idParam)
  basket.value = loaded ?? null
  isLoading.value = false
}

const reserveBasket = async () => {
  if (!basket.value) return
  if (!authStore.isAuthenticated) {
    notify.error('Connectez-vous pour réserver ce panier surprise.')
    router.push({ name: 'login' })
    return
  }
  if (!authStore.isConsumer) {
    notify.error('Seuls les consommateurs peuvent réserver ce panier.')
    return
  }
  if (maxQuantity.value === 0) {
    notify.error('Ce panier n\'est plus disponible.')
    return
  }

  submitting.value = true
  try {
    const response = await reservationsStore.createReservation({
      productId: basket.value.id,
      quantity: quantity.value,
      paymentMethod: paymentMethod.value,
      customerPhone: methodRequiresPhone.value
        ? mobileMoneyPhone.value
        : authStore.user?.phone || undefined,
      customerEmail: authStore.user?.email
    })
    if (response.success) {
      if (response.payment) {
        paymentsStore.recordPayment(response.payment)
        if (response.payment.checkout_url && response.payment.payment_method === 'paystack') {
          if (typeof window !== 'undefined') {
            window.open(response.payment.checkout_url, '_blank')
          }
        }
        if (!isFinalStatus(response.payment.status)) {
          paymentsStore.startPolling(response.payment.id)
          notify.info(
            'Paiement en attente de confirmation.',
            'Vous recevrez une notification dès validation du prestataire.'
          )
        } else if (response.payment.status === 'success' || response.payment.status === 'on_site') {
          notify.success('Paiement confirmé !', 'Votre réservation est validée.')
        }
      } else {
        notify.success('Réservation effectuée avec succès !')
      }
      router.push({ name: 'reservations' })
    } else {
      notify.error(response.error || 'Impossible de créer la réservation pour le moment.')
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inattendue lors de la réservation.'
    notify.error(message)
  } finally {
    submitting.value = false
  }
}

watch(() => route.params.id, fetchBasket)

onMounted(() => {
  paymentsStore.clearPayment()
  fetchBasket()
})
</script>
