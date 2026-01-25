<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <Card class="w-full max-w-xl">
      <div class="flex items-center justify-start sm:justify-between mt-4">
        <h3 class="text-xl font-semibold text-neutral-900">Recharger le portefeuille</h3>
        <Button
          variant="ghost"
          size="sm"
          class="p-1"
          @click="$emit('close')"
        >
          <svg
            class="h-6 w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </Button>
      </div>

      <form @submit.prevent="handleRecharge">
        <div class="space-y-4">
          <div>
            <Label for="amount">
              Montant à recharger
            </Label>
            <div class="relative">
              <Input
                id="amount"
                v-model="form.amount"
                type="number"
                min="100"
                max="1000000"
                step="50"
                placeholder="Montant en XOF"
                :error="errors.amount"
                required
              />
              <span class="relative sm:absolute right-3 top-3 text-neutral-500 text-sm">XOF</span>
            </div>
            <p v-if="errors.amount" class="mt-1 text-sm text-red-600">{{ errors.amount }}</p>
            <p class="mt-1 text-xs text-neutral-500">Montant minimum: 100 XOF, maximum: 1 000 000 XOF</p>
          </div>

          <div>
            <Label>
              Méthode de paiement
            </Label>
            <div class="space-y-4">
              <label
                v-for="method in paymentMethods"
                :key="method.value"
                class="flex items-center p-3 border border-neutral-200 rounded cursor-pointer hover:bg-neutral-50"
                :class="{'border-primary-500 bg-green-50': form.payment_method === method.value}"
              >
                <input
                  v-model="form.payment_method"
                  :value="method.value"
                  type="radio"
                  class="sr-only"
                >
                <div class="flex items-center space-y-2 sm:space-x-3 flex-1">
                  <div class="h-6 w-6 bg-neutral-100 rounded flex items-center justify-center">
                    <component :is="method.icon" class="h-6 w-6 text-neutral-700" />
                  </div>
                  <div>
                    <div class="font-medium text-neutral-900">{{ method.name }}</div>
                    <div class="text-sm text-neutral-500">{{ method.description }}</div>
                  </div>
                </div>
                <div
                  class="h-4 w-4 border-2 rounded-full"
                  :class="form.payment_method === method.value ? 'border-primary-500 bg-primary-500' : 'border-neutral-300'"
                >
                  <div v-if="form.payment_method === method.value" class="w-full h-full bg-white rounded-full scale-50" />
                </div>
              </label>
            </div>
            <p v-if="errors.payment_method" class="mt-1 text-sm text-red-600">{{ errors.payment_method }}</p>
          </div>

          <div v-if="requiresPhone" class="space-y-4">
            <Label for="phone">
              Numéro de téléphone
            </Label>
            <Input
              id="phone"
              v-model="form.phone"
              type="tel"
              placeholder="+228 XX XX XX XX"
              :error="errors.phone"
            />
            <p v-if="errors.phone" class="text-sm text-red-600">{{ errors.phone }}</p>
          </div>

          <div class="bg-primary-50 border border-primary-200 rounded p-4">
            <div class="flex items-stretch sm:items-start space-y-4 sm:space-x-2">
              <svg class="h-4 w-4 text-primary-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
              </svg>
              <div class="text-sm text-secondary-700">
                <p class="font-medium">Information importante</p>
                <p>La recharge sera effectuée via le provider de paiement sélectionné. Vous serez redirigé vers leur interface sécurisée.</p>
              </div>
            </div>
          </div>
        </div>

        <div class="flex space-y-2 sm:space-x-3 mt-6">
          <Button
            type="button"
            variant="outline"
            class="flex-1"
            @click="$emit('close')"
          >
            Annuler
          </Button>
          <Button
            type="submit"
            :disabled="!isValid"
            variant="success"
            class="flex-1"
          >
            <span v-if="false" class="flex items-center justify-center">
              <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                  class="opacity-25"
                />
                <path fill="currentColor" class="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Traitement...
            </span>
            <span v-else>
              Recharger {{ formatAmount(form.amount) }} XOF
            </span>
          </Button>
        </div>
      </form>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, defineComponent } from 'vue'
import Button from '@/components/ui/2025/Button.vue'
import Input from '@/components/ui/2025/Input.vue'
import Label from '@/components/ui/2025/Label.vue'
import Card from '@/components/ui/2025/Card.vue'

// Icons as components
const PhoneIcon = defineComponent({
  template: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>'
})

const CreditCardIcon = defineComponent({
  template: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>'
})

interface RechargeForm {
  amount: number | ''
  payment_method: string
  phone: string
}

const emit = defineEmits<{
  close: []
  recharge: [data: RechargeForm]
}>()


const form = ref<RechargeForm>({
  amount: '',
  payment_method: 'flooz',
  phone: ''
})

const errors = ref<Partial<Record<keyof RechargeForm, string>>>({})

const paymentMethods = [
  {
    value: 'flooz',
    name: 'Flooz',
    description: 'Paiement mobile Flooz',
    icon: PhoneIcon
  },
  {
    value: 'tmoney',
    name: 'T-Money',
    description: 'Paiement mobile T-Money',
    icon: PhoneIcon
  },
  {
    value: 'orange_money',
    name: 'Orange Money',
    description: 'Mobile Money Orange via CinetPay',
    icon: PhoneIcon
  },
  {
    value: 'mtn_momo',
    name: 'MTN MoMo',
    description: 'Mobile Money MTN via CinetPay',
    icon: PhoneIcon
  },
  {
    value: 'paystack',
    name: 'Carte bancaire',
    description: 'Visa, Mastercard via Paystack',
    icon: CreditCardIcon
  }
]

const requiresPhone = computed(() => {
  return ['flooz', 'tmoney', 'orange_money', 'mtn_momo'].includes(form.value.payment_method)
})

const isValid = computed(() => {
  return form.value.amount &&
         form.value.amount >= 100 &&
         form.value.amount <= 1000000 &&
         form.value.payment_method &&
         (!requiresPhone.value || form.value.phone)
})

const formatAmount = (amount: number | string): string => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  if (isNaN(num)) return '0'
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(num)
}

const validateForm = (): boolean => {
  errors.value = {}

  if (!form.value.amount) {
    errors.value.amount = 'Le montant est requis'
    return false
  }

  if (form.value.amount < 100) {
    errors.value.amount = 'Le montant minimum est de 100 XOF'
    return false
  }

  if (form.value.amount > 1000000) {
    errors.value.amount = 'Le montant maximum est de 1 000 000 XOF'
    return false
  }

  if (!form.value.payment_method) {
    errors.value.payment_method = 'Veuillez sélectionner une méthode de paiement'
    return false
  }

  if (requiresPhone.value && !form.value.phone) {
    errors.value.phone = 'Le numéro de téléphone est requis pour cette méthode'
    return false
  }

  return true
}

const handleRecharge = () => {
  if (validateForm()) {
    emit('recharge', form.value)
  }
}
</script>
