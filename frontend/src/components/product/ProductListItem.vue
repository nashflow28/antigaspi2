<template>
  <Card class="group cursor-pointer p-6 hover:transition-all duration-300">
    <div class="flex items-center gap-3 sm:gap-6">
      <!-- Image du produit -->
      <div class="relative w-6xl h-6xl flex-shrink-0 overflow-hidden sm:block rounded">
        <div class="relative sm:absolute inset-0 bg-gradient-to-br from-primary-100 to-primary-500/10 flex items-center justify-center">
          <Package class="h-6 w-6 text-primary-400 opacity-50" />
        </div>

        <!-- Badge de réduction -->
        <div class="relative sm:absolute -top-2 -right-2 bg-primary-500 text-white px-3 py-3 rounded-full text-xs font-semibold shadow-lg">
          -{{ product.discount }}%
        </div>
      </div>

      <!-- Contenu principal -->
      <div class="flex-1 min-w-none space-y-2">
        <!-- Titre et description -->
        <div>
          <h3 class="text-xl font-semibold text-neutral-900 mb-1 group-hover:transition-colors">
            {{ product.name }}
          </h3>
          <p class="text-sm text-neutral-700 line-clamp-2">{{ product.description }}</p>
        </div>

        <!-- Informations marchand et timing -->
        <div class="flex items-center gap-3 text-sm">
          <div class="flex items-center gap-2 text-neutral-700">
            <MapPin class="h-4 w-4" />
            <span class="font-medium">{{ product.merchant.name }}</span>
          </div>

          <div class="flex items-center gap-2 text-neutral-500">
            <span>{{ product.merchant.distance }}km</span>
          </div>

          <div class="flex items-center gap-2 text-orange-500">
            <Clock class="h-4 w-4" />
            <span class="font-medium">{{ formatTimeLeft(product.expires_at) }}</span>
          </div>

          <div class="flex items-center gap-2">
            <div class="h-4 w-4 bg-primary-500 rounded-full" />
            <span class="text-sm text-neutral-700">
              {{ product.available_quantity - product.reserved_quantity }} disponible{{ (product.available_quantity - product.reserved_quantity) > 1 ? 's' : '' }}
            </span>
          </div>
        </div>
      </div>

      <!-- Prix et actions -->
      <div class="flex items-center gap-3 sm:gap-6">
        <!-- Prix -->
        <div class="text-right">
          <div class="text-xl font-semibold text-primary-600">
            {{ formatPrice(product.discounted_price) }}
          </div>
          <div class="text-sm text-neutral-400 line-through">
            {{ formatPrice(product.original_price) }}
          </div>
        </div>

        <!-- Boutons d'action -->
        <div class="flex flex-col gap-2">
          <Button
            variant="ghost"
            size="sm"
            class="min-w-[100px]"
            @click.stop="$emit('view', product)"
          >
            Voir détails
          </Button>
          <Button
            variant="primary"
            size="sm"
            class="min-w-[100px]"
            :disabled="product.available_quantity <= product.reserved_quantity"
            @click.stop="$emit('reserve', product)"
          >
            {{ product.available_quantity <= product.reserved_quantity ? 'Épuisé' : 'Réserver' }}
          </Button>
        </div>
      </div>
    </div>
  </Card>
</template>

<script setup lang="ts">
import { MapPin, Package, Clock } from 'lucide-vue-next'
import Button from '@/components/ui/2025/Button.vue'
import Card from '@/components/ui/2025/Card.vue'

interface Product {
  id: number
  name: string
  description: string
  original_price: number
  discounted_price: number
  discount: number
  merchant: {
    name: string
    address: string
    distance: number
  }
  expires_at: Date
  available_quantity: number
  reserved_quantity: number
}

interface Props {
  product: Product
}

defineProps<Props>()
defineEmits<{
  reserve: [product: Product]
  view: [product: Product]
}>()

const formatPrice = (price: number) => {
  return `${price.toFixed(0)} XOF`
}

const formatTimeLeft = (expiresAt: Date) => {
  const now = new Date()
  const diff = expiresAt.getTime() - now.getTime()

  if (diff < 0) return 'Expiré'

  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

  if (hours > 0) {
    return `${hours}h${minutes > 0 ? ` ${minutes}m` : ''}`
  }
  return `${minutes}m`
}
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
