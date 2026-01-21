<template>
  <Card class="cart-item-card">
    <div class="flex gap-4">
      <!-- Image -->
      <div class="flex-shrink-0">
        <img
          v-if="item.imageUrl"
          :src="item.imageUrl"
          :alt="item.name"
          class="w-24 h-24 object-cover rounded-lg"
        />
        <div
          v-else
          class="w-24 h-24 bg-neutral-100 rounded-lg flex items-center justify-center"
        >
          <Package class="h-10 w-10 text-neutral-400" />
        </div>
      </div>

      <!-- Content -->
      <div class="flex-1 min-w-0">
        <!-- Header -->
        <div class="flex items-start justify-between gap-2 mb-2">
          <div class="flex-1 min-w-0">
            <h3 class="text-base font-semibold text-neutral-900 truncate">
              {{ item.name }}
            </h3>
            <p v-if="item.merchantName" class="text-sm text-neutral-600">
              {{ item.merchantName }}
            </p>
            <Badge
              v-if="item.type === 'surprise_basket'"
              variant="secondary"
              size="sm"
              class="mt-1"
            >
              Panier Surprise
            </Badge>
          </div>
          <button
            type="button"
            class="text-neutral-400 hover:text-red-600 transition-colors"
            @click="$emit('remove', item.id)"
          >
            <Trash2 class="h-5 w-5" />
          </button>
        </div>

        <!-- Price & Quantity -->
        <div class="flex items-center justify-between gap-4">
          <div class="flex-1">
            <div class="flex items-center gap-2">
              <span class="text-lg font-bold text-primary-600">
                {{ formatCurrency(item.price) }}
              </span>
              <span
                v-if="item.originalPrice && item.originalPrice > item.price"
                class="text-sm text-neutral-500 line-through"
              >
                {{ formatCurrency(item.originalPrice) }}
              </span>
            </div>
            <p v-if="savings > 0" class="text-xs text-green-600">
              Économie: {{ formatCurrency(savings) }}
            </p>
            <p v-if="item.expiryDate" class="text-xs text-neutral-500 mt-1">
              Expire le: {{ formatDate(item.expiryDate) }}
            </p>
          </div>

          <!-- Quantity Controls -->
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="w-8 h-8 rounded-full border-2 border-neutral-300 flex items-center justify-center hover:bg-neutral-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              :disabled="item.quantity <= 1"
              @click="$emit('update-quantity', item.id, item.quantity - 1)"
            >
              <Minus class="h-4 w-4" />
            </button>
            <span class="w-8 text-center font-semibold text-neutral-900">
              {{ item.quantity }}
            </span>
            <button
              type="button"
              class="w-8 h-8 rounded-full border-2 border-neutral-300 flex items-center justify-center hover:bg-neutral-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              :disabled="item.maxQuantity ? item.quantity >= item.maxQuantity : false"
              @click="$emit('update-quantity', item.id, item.quantity + 1)"
            >
              <Plus class="h-4 w-4" />
            </button>
          </div>
        </div>

        <!-- Warning if max quantity reached -->
        <p
          v-if="item.maxQuantity && item.quantity >= item.maxQuantity"
          class="text-xs text-orange-600 mt-2 flex items-center gap-1"
        >
          <AlertCircle class="h-3 w-3" />
          Quantité maximale atteinte
        </p>
      </div>
    </div>

    <!-- Total for this item -->
    <div class="mt-3 pt-3 border-t border-neutral-200 flex justify-between items-center">
      <span class="text-sm text-neutral-600">Total pour cet article</span>
      <span class="text-lg font-bold text-neutral-900">
        {{ formatCurrency(item.price * item.quantity) }}
      </span>
    </div>
  </Card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CartItem } from '@/stores/cart'
import Card from '@/components/ui/2025/Card.vue'
import Badge from '@/components/ui/2025/Badge.vue'
import { Package, Trash2, Minus, Plus, AlertCircle } from 'lucide-vue-next'

const props = defineProps<{
  item: CartItem
}>()

defineEmits<{
  'remove': [id: number]
  'update-quantity': [id: number, quantity: number]
}>()

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    minimumFractionDigits: 0
  }).format(amount)
}

const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(date)
  } catch {
    return dateString
  }
}

const savings = computed(() => {
  if (!props.item.originalPrice) return 0
  return (props.item.originalPrice - props.item.price) * props.item.quantity
})
</script>

<style scoped>
.cart-item-card {
  transition: all 0.2s;
}

.cart-item-card:hover {
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
}
</style>
