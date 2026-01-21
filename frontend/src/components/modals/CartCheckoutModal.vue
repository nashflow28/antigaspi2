<template>
  <Modal
    v-model="isOpen"
    title="Confirmer votre réservation"
    size="xl"
    @close="handleClose"
  >
    <div class="space-y-6">
      <!-- Cart Summary -->
      <section class="space-y-3">
        <h3 class="text-lg font-semibold text-neutral-900">
          Récapitulatif ({{ itemsCount }} article{{ itemsCount > 1 ? 's' : '' }})
        </h3>
        <div class="space-y-2 max-h-64 overflow-y-auto">
          <div
            v-for="item in items"
            :key="item.id"
            class="flex gap-3 p-3 bg-neutral-50 rounded-lg"
          >
            <img
              v-if="item.imageUrl"
              :src="item.imageUrl"
              :alt="item.name"
              class="w-16 h-16 object-cover rounded"
            />
            <div class="flex-1">
              <p class="font-semibold text-neutral-900">{{ item.name }}</p>
              <p class="text-sm text-neutral-600">
                {{ item.quantity }}x {{ formatCurrency(item.price) }}
              </p>
              <p v-if="item.merchantName" class="text-xs text-neutral-500">
                {{ item.merchantName }}
              </p>
            </div>
            <div class="text-right">
              <p class="font-semibold text-neutral-900">
                {{ formatCurrency(item.price * item.quantity) }}
              </p>
            </div>
          </div>
        </div>

        <div class="border-t pt-3 space-y-1">
          <div class="flex justify-between text-neutral-700">
            <span>Sous-total</span>
            <span>{{ formatCurrency(totalAmount) }}</span>
          </div>
          <div v-if="totalSavings > 0" class="flex justify-between text-green-600 text-sm">
            <span>Économies</span>
            <span>-{{ formatCurrency(totalSavings) }}</span>
          </div>
          <div class="flex justify-between font-bold text-lg text-neutral-900 pt-2 border-t">
            <span>Total</span>
            <span>{{ formatCurrency(totalAmount) }}</span>
          </div>
        </div>
      </section>

      <!-- Pickup Info -->
      <section class="space-y-3">
        <h3 class="text-lg font-semibold text-neutral-900">Informations de retrait</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label for="pickup-date" class="block text-sm font-medium text-neutral-700 mb-1">
              Date de retrait *
            </label>
            <Input
              id="pickup-date"
              v-model="pickupDate"
              type="date"
              :min="minDate"
              :max="maxDate"
              :error="errors.pickupDate"
              required
            />
          </div>
          <div>
            <label for="pickup-time" class="block text-sm font-medium text-neutral-700 mb-1">
              Heure de retrait *
            </label>
            <Input
              id="pickup-time"
              v-model="pickupTime"
              type="time"
              :error="errors.pickupTime"
              required
            />
          </div>
        </div>
        <div>
          <label for="special-instructions" class="block text-sm font-medium text-neutral-700 mb-1">
            Instructions spéciales (optionnel)
          </label>
          <textarea
            id="special-instructions"
            v-model="specialInstructions"
            rows="2"
            class="w-full rounded-lg border border-neutral-300 p-3 text-neutral-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 focus:outline-none"
            placeholder="Ex: Appelez-moi 10 minutes avant le retrait"
          />
        </div>
      </section>

      <!-- Contact Info -->
      <section class="space-y-3">
        <h3 class="text-lg font-semibold text-neutral-900">Coordonnées</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label for="customer-phone" class="block text-sm font-medium text-neutral-700 mb-1">
              Téléphone *
            </label>
            <Input
              id="customer-phone"
              v-model="customerPhone"
              type="tel"
              placeholder="+228 90 XX XX XX"
              :error="errors.customerPhone"
              required
            />
          </div>
          <div>
            <label for="customer-email" class="block text-sm font-medium text-neutral-700 mb-1">
              Email *
            </label>
            <Input
              id="customer-email"
              v-model="customerEmail"
              type="email"
              placeholder="votre@email.com"
              :error="errors.customerEmail"
              required
            />
          </div>
        </div>
      </section>

      <!-- Payment Method -->
      <section class="space-y-3">
        <h3 class="text-lg font-semibold text-neutral-900">Mode de paiement</h3>
        <RadioGroup v-model="paymentMethod">
          <RadioOption value="on_site">
            <div class="flex items-center gap-3">
              <span class="text-2xl">💵</span>
              <div>
                <div class="font-semibold text-neutral-900">Paiement sur place</div>
                <div class="text-sm text-neutral-600">
                  Réglez directement au retrait
                </div>
              </div>
            </div>
          </RadioOption>

          <RadioOption value="flooz">
            <div class="flex items-center gap-3">
              <span class="text-2xl">📱</span>
              <div>
                <div class="font-semibold text-neutral-900">Flooz (Moov Togo)</div>
                <div class="text-sm text-neutral-600">
                  Paiement mobile money Moov
                </div>
              </div>
            </div>
          </RadioOption>

          <RadioOption value="tmoney">
            <div class="flex items-center gap-3">
              <span class="text-2xl">📱</span>
              <div>
                <div class="font-semibold text-neutral-900">T-Money (Togocom)</div>
                <div class="text-sm text-neutral-600">
                  Paiement mobile money Togocom
                </div>
              </div>
            </div>
          </RadioOption>

          <RadioOption value="orange_money">
            <div class="flex items-center gap-3">
              <span class="text-2xl">📱</span>
              <div>
                <div class="font-semibold text-neutral-900">Orange Money</div>
                <div class="text-sm text-neutral-600">
                  Paiement mobile money Orange
                </div>
              </div>
            </div>
          </RadioOption>

          <RadioOption value="mtn_momo">
            <div class="flex items-center gap-3">
              <span class="text-2xl">📱</span>
              <div>
                <div class="font-semibold text-neutral-900">MTN Mobile Money</div>
                <div class="text-sm text-neutral-600">
                  Paiement mobile money MTN
                </div>
              </div>
            </div>
          </RadioOption>

          <RadioOption value="wallet">
            <div class="flex items-center gap-3">
              <span class="text-2xl">💰</span>
              <div>
                <div class="font-semibold text-neutral-900">Portefeuille Antigaspi</div>
                <div class="text-sm" :class="walletBalance >= totalAmount ? 'text-green-600' : 'text-red-600'">
                  Solde: {{ formatCurrency(walletBalance) }}
                </div>
              </div>
            </div>
          </RadioOption>

          <RadioOption value="paystack">
            <div class="flex items-center gap-3">
              <span class="text-2xl">💳</span>
              <div>
                <div class="font-semibold text-neutral-900">Carte bancaire (Paystack)</div>
                <div class="text-sm text-neutral-600">
                  Paiement sécurisé par carte
                </div>
              </div>
            </div>
          </RadioOption>
        </RadioGroup>

        <!-- Mobile Money Phone -->
        <div v-if="requiresMobileMoneyPhone" class="mt-3">
          <label for="mobile-money-phone" class="block text-sm font-medium text-neutral-700 mb-1">
            Numéro {{ paymentMethodLabel }} *
          </label>
          <Input
            id="mobile-money-phone"
            v-model="mobileMoneyPhone"
            type="tel"
            placeholder="90 XX XX XX"
            :error="errors.mobileMoneyPhone"
            required
          />
          <p class="text-xs text-neutral-500 mt-1">
            Format: 8 chiffres sans indicatif (+228)
          </p>
        </div>

        <!-- Wallet PIN -->
        <div v-if="paymentMethod === 'wallet'" class="mt-3">
          <label class="block text-sm font-medium text-neutral-700 mb-1">
            Code PIN du portefeuille *
          </label>
          <PinInput
            v-model="walletPin"
            :length="4"
            :error="errors.walletPin"
          />
          <div v-if="walletBalance < totalAmount" class="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p class="text-sm text-red-800 flex items-center gap-2">
              <span>⚠️</span>
              <span>Solde insuffisant. Veuillez recharger votre portefeuille ou choisir un autre mode de paiement.</span>
            </p>
          </div>
        </div>
      </section>

      <!-- Terms -->
      <section>
        <Checkbox v-model="acceptTerms" :error="errors.acceptTerms">
          <span class="text-sm text-neutral-700">
            J'accepte les
            <a href="/terms" target="_blank" class="text-primary-600 underline hover:text-primary-700">
              conditions générales de vente
            </a>
          </span>
        </Checkbox>
      </section>
    </div>

    <!-- Actions -->
    <template #footer>
      <div class="flex gap-3 justify-end">
        <Button
          variant="ghost"
          @click="handleClose"
        >
          Annuler
        </Button>
        <Button
          variant="primary"
          size="lg"
          :loading="loading"
          :disabled="!canConfirm || loading"
          @click="handleConfirm"
        >
          Confirmer la réservation
        </Button>
      </div>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '@/stores/cart'
import { useReservationsStore } from '@/stores/reservations'
import { useAuthStore } from '@/stores/auth'
import { notify } from '@/composables/useNotifications'
import Modal from '@/components/ui/2025/Modal.vue'
import Button from '@/components/ui/2025/Button.vue'
import Input from '@/components/ui/2025/Input.vue'
import Checkbox from '@/components/ui/2025/Checkbox.vue'
import RadioGroup from '@/components/ui/2025/RadioGroup.vue'
import RadioOption from '@/components/ui/2025/RadioOption.vue'
import PinInput from '@/components/ui/2025/PinInput.vue'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'success': []
}>()

const router = useRouter()
const cartStore = useCartStore()
const reservationsStore = useReservationsStore()
const authStore = useAuthStore()

// Format currency helper
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    minimumFractionDigits: 0
  }).format(amount)
}

// State
const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const loading = ref(false)
const pickupDate = ref('')
const pickupTime = ref('')
const specialInstructions = ref('')
const paymentMethod = ref<'on_site' | 'flooz' | 'tmoney' | 'orange_money' | 'mtn_momo' | 'wallet' | 'paystack'>('on_site')
const customerPhone = ref(authStore.user?.phone || '')
const customerEmail = ref(authStore.user?.email || '')
const mobileMoneyPhone = ref('')
const walletPin = ref('')
const acceptTerms = ref(false)

// Errors
const errors = ref({
  pickupDate: '',
  pickupTime: '',
  customerPhone: '',
  customerEmail: '',
  mobileMoneyPhone: '',
  walletPin: '',
  acceptTerms: ''
})

// Computed
const items = computed(() => cartStore.items)
const itemsCount = computed(() => cartStore.itemsCount)
const totalAmount = computed(() => cartStore.totalAmount)
const totalSavings = computed(() => cartStore.totalSavings)
const walletBalance = computed(() => authStore.user?.wallet_balance || 0)

const requiresMobileMoneyPhone = computed(() =>
  ['flooz', 'tmoney', 'orange_money', 'mtn_momo'].includes(paymentMethod.value)
)

const paymentMethodLabel = computed(() => {
  const labels: Record<string, string> = {
    flooz: 'Flooz',
    tmoney: 'T-Money',
    orange_money: 'Orange Money',
    mtn_momo: 'MTN MoMo'
  }
  return labels[paymentMethod.value] || ''
})

const minDate = computed(() => {
  const today = new Date()
  return today.toISOString().split('T')[0]
})

const maxDate = computed(() => {
  const maxDate = new Date()
  maxDate.setDate(maxDate.getDate() + 7)
  return maxDate.toISOString().split('T')[0]
})

const canConfirm = computed(() => {
  if (!pickupDate.value || !pickupTime.value) return false
  if (!acceptTerms.value) return false
  if (!customerPhone.value || !customerEmail.value) return false

  if (requiresMobileMoneyPhone.value) {
    if (!mobileMoneyPhone.value) return false
    if (errors.value.mobileMoneyPhone) return false
  }

  if (paymentMethod.value === 'wallet') {
    if (walletPin.value.length !== 4) return false
    if (walletBalance.value < totalAmount.value) return false
    if (errors.value.walletPin) return false
  }

  return true
})

// Validation watchers
watch(mobileMoneyPhone, (value) => {
  if (!requiresMobileMoneyPhone.value) {
    errors.value.mobileMoneyPhone = ''
    return
  }

  const cleaned = value.replace(/\D/g, '')
  if (!cleaned) {
    errors.value.mobileMoneyPhone = 'Le numéro est requis'
  } else if (cleaned.length !== 8) {
    errors.value.mobileMoneyPhone = 'Le numéro doit contenir 8 chiffres'
  } else {
    errors.value.mobileMoneyPhone = ''
  }
})

watch(walletPin, (value) => {
  if (paymentMethod.value !== 'wallet') {
    errors.value.walletPin = ''
    return
  }

  if (!value) {
    errors.value.walletPin = 'Le PIN est requis'
  } else if (value.length > 0 && value.length !== 4) {
    errors.value.walletPin = 'Le PIN doit contenir 4 chiffres'
  } else {
    errors.value.walletPin = ''
  }
})

watch(customerPhone, (value) => {
  if (!value) {
    errors.value.customerPhone = 'Le téléphone est requis'
  } else {
    errors.value.customerPhone = ''
  }
})

watch(customerEmail, (value) => {
  if (!value) {
    errors.value.customerEmail = "L'email est requis"
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    errors.value.customerEmail = 'Email invalide'
  } else {
    errors.value.customerEmail = ''
  }
})

watch(pickupDate, (value) => {
  if (!value) {
    errors.value.pickupDate = 'La date est requise'
  } else {
    errors.value.pickupDate = ''
  }
})

watch(pickupTime, (value) => {
  if (!value) {
    errors.value.pickupTime = "L'heure est requise"
  } else {
    errors.value.pickupTime = ''
  }
})

watch(acceptTerms, (value) => {
  if (!value) {
    errors.value.acceptTerms = 'Vous devez accepter les conditions'
  } else {
    errors.value.acceptTerms = ''
  }
})

// Actions
const validateForm = (): boolean => {
  let isValid = true

  if (!pickupDate.value) {
    errors.value.pickupDate = 'La date est requise'
    isValid = false
  }

  if (!pickupTime.value) {
    errors.value.pickupTime = "L'heure est requise"
    isValid = false
  }

  if (!customerPhone.value) {
    errors.value.customerPhone = 'Le téléphone est requis'
    isValid = false
  }

  if (!customerEmail.value) {
    errors.value.customerEmail = "L'email est requis"
    isValid = false
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail.value)) {
    errors.value.customerEmail = 'Email invalide'
    isValid = false
  }

  if (requiresMobileMoneyPhone.value && !mobileMoneyPhone.value) {
    errors.value.mobileMoneyPhone = 'Le numéro est requis pour ce mode de paiement'
    isValid = false
  }

  if (paymentMethod.value === 'wallet' && walletPin.value.length !== 4) {
    errors.value.walletPin = 'Le PIN doit contenir 4 chiffres'
    isValid = false
  }

  if (!acceptTerms.value) {
    errors.value.acceptTerms = 'Vous devez accepter les conditions'
    isValid = false
  }

  return isValid
}

const handleConfirm = async () => {
  if (!validateForm()) {
    notify.error('Veuillez corriger les erreurs dans le formulaire', 'Validation')
    return
  }

  loading.value = true

  try {
    const results = []
    const failedItems = []

    for (const item of items.value) {
      if (item.type !== 'product' || !item.productId) continue

      const payload = {
        productId: item.productId,
        quantity: item.quantity,
        paymentMethod: paymentMethod.value,
        customerPhone: requiresMobileMoneyPhone.value ? mobileMoneyPhone.value : customerPhone.value,
        customerEmail: customerEmail.value,
        pickupDate: `${pickupDate.value} ${pickupTime.value}`,
        notes: specialInstructions.value || undefined,
        walletPin: paymentMethod.value === 'wallet' ? walletPin.value : undefined
      }

      const result = await reservationsStore.createReservation(payload)

      if (!result.success) {
        failedItems.push({ item, error: result.error })
      } else {
        results.push(result)
      }
    }

    if (failedItems.length > 0) {
      const errorMessage = failedItems.map(f => `${f.item.name}: ${f.error}`).join(', ')
      throw new Error(`Erreur pour certains produits: ${errorMessage}`)
    }

    cartStore.clearCart({ silent: true })

    notify.success(
      `${results.length} réservation${results.length > 1 ? 's' : ''} créée${results.length > 1 ? 's' : ''} avec succès`,
      'Réservations',
      { duration: 3000 }
    )

    handleClose()
    emit('success')

    router.push('/reservations')
  } catch (error: any) {
    console.error('Checkout error:', error)
    notify.error(
      error.message || 'Une erreur est survenue lors de la confirmation',
      'Erreur'
    )
  } finally {
    loading.value = false
  }
}

const handleClose = () => {
  isOpen.value = false
}
</script>
