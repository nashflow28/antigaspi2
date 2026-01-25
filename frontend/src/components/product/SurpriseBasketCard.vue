<template>
  <Card class="group overflow-hidden sm:block">
    <div class="relative h-8xl w-full">
      <img
        v-if="basket.image_url"
        :src="basket.image_url"
        :alt="basket.name"
        class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
      >
      <div
        v-else
        class="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-50 to-primary-500/5"
      >
        <Package class="h-6 w-6 text-primary-400" />
      </div>

      <div class="relative sm:absolute left-4 top-4 flex gap-2">
        <Badge variant="success" class="font-semibold">-{{ basket.basket_discount_percentage }}%</Badge>
        <Badge v-if="basket.quantity_available" variant="secondary">
          {{ basket.quantity_available }} restant{{ basket.quantity_available > 1 ? 's' : '' }}
        </Badge>
      </div>

      <span
        v-if="timeLeft"
        class="relative sm:absolute bottom-4 left-4 inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-3 text-xs font-medium text-neutral-800 shadow-xl"
      >
        <Clock class="h-4 w-4 text-primary-500" />
        {{ timeLeft }}
      </span>
    </div>

    <div class="space-y-4 p-6">
      <div class="space-y-4">
        <h3 class="text-lg font-semibold text-neutral-900 group-hover:transition-colors">
          {{ basket.name }}
        </h3>
        <p v-if="basket.surprise_description" class="line-clamp-2 text-sm text-neutral-700">
          {{ basket.surprise_description }}
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-3 text-sm text-neutral-500">
        <span class="inline-flex items-center gap-2 rounded-full bg-primary-50 px-3 py-3 text-primary-900">
          <Store class="h-4 w-4" />
          {{ basket.merchant.business_name }}
        </span>
        <span v-if="basket.category?.name" class="inline-flex items-center gap-2 rounded-full bg-primary-500/5 px-3 py-3 text-primary-500/90">
          <Tag class="h-4 w-4" />
          {{ basket.category.name }}
        </span>
      </div>

      <div class="flex items-end justify-start sm:justify-between">
        <div>
          <div class="text-xl font-semibold text-primary-600">{{ formattedDiscountedPrice }}</div>
          <div v-if="formattedOriginalPrice" class="text-sm text-neutral-400 line-through">
            {{ formattedOriginalPrice }}
          </div>
          <div v-if="formattedSavings" class="text-xs text-primary-600 font-medium">
            Économisez {{ formattedSavings }}
          </div>
        </div>
        <div class="flex flex-col gap-2">
          <button
            class="button-ghost-2025 text-sm"
            type="button"
            data-testid="surprise-basket-view"
            @click="$emit('view', basket)"
          >
            Voir les détails
          </button>
          <button
            class="button-primary-2025 text-sm"
            type="button"
            :disabled="basket.quantity_available === 0"
            data-testid="surprise-basket-reserve"
            @click="$emit('reserve', basket)"
          >
            {{ basket.quantity_available === 0 ? 'Épuisé' : 'Réserver' }}
          </button>
        </div>
      </div>
    </div>
  </Card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Clock, Package, Store, Tag } from 'lucide-vue-next'
import type { SurpriseBasket } from '@/services/surpriseBasketService'
import { formatPrice, formatSavings } from '@/utils/currency'
import Badge from '@/components/ui/2025/Badge.vue'
import Card from '@/components/ui/2025/Card.vue'

interface Props {
  basket: SurpriseBasket
}

const props = defineProps<Props>()

defineEmits<{
  view: [basket: SurpriseBasket]
  reserve: [basket: SurpriseBasket]
}>()

const formattedDiscountedPrice = computed(() => formatPrice(props.basket.discounted_price))

const formattedOriginalPrice = computed(() => {
  const original = props.basket.total_original_value ?? props.basket.original_price
  if (!original) return ''
  return formatPrice(original)
})

const formattedSavings = computed(() => {
  const original = props.basket.total_original_value ?? props.basket.original_price
  if (!original || original <= props.basket.discounted_price) {
    return ''
  }
  return formatSavings(original, props.basket.discounted_price)
})

const timeLeft = computed(() => {
  if (!props.basket.expiration_date) return ''
  const expiresAt = new Date(props.basket.expiration_date)
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
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
