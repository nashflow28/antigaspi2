<template>
  <div class="card card-interactive group cursor-pointer overflow-hidden">
    <!-- Image du produit -->
    <div class="relative h-48 mb-4 -m-6 mb-4 overflow-hidden">
      <div class="absolute inset-0 bg-gradient-to-br from-primary-100 to-secondary-100 flex items-center justify-center">
        <Package class="w-16 h-16 text-primary-400 opacity-50" />
      </div>

      <!-- Badge de réduction -->
      <div class="absolute top-3 right-3 bg-success-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-soft">
        -{{ product.discount }}%
      </div>

      <!-- Badge de disponibilité -->
      <div class="absolute top-3 left-3 flex items-center gap-2">
        <div class="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium">
          <div class="flex items-center gap-1">
            <div class="w-2 h-2 bg-success-500 rounded-full"></div>
            <span>{{ product.available_quantity - product.reserved_quantity }} disponible{{ (product.available_quantity - product.reserved_quantity) > 1 ? 's' : '' }}</span>
          </div>
        </div>
      </div>

      <!-- Countdown timer -->
      <div class="absolute bottom-3 left-3 bg-accent-500 text-white px-2 py-1 rounded-full text-xs font-medium">
        ⏰ {{ formatTimeLeft(product.expires_at) }}
      </div>
    </div>

    <!-- Contenu -->
    <div class="space-y-4">
      <!-- Titre et description -->
      <div>
        <h3 class="text-lg font-bold text-neutral-900 mb-2 group-hover:text-primary-600 transition-colors line-clamp-2">
          {{ product.name }}
        </h3>
        <p class="text-sm text-neutral-600 line-clamp-2">{{ product.description }}</p>
      </div>

      <!-- Informations marchand -->
      <div class="flex items-center gap-2 text-sm text-neutral-600">
        <MapPin class="w-4 h-4" />
        <span class="font-medium">{{ product.merchant.name }}</span>
        <span>•</span>
        <span>{{ product.merchant.distance }}km</span>
      </div>

      <!-- Prix et actions -->
      <div class="flex items-center justify-between pt-2 border-t border-neutral-100">
        <div class="flex items-center gap-2">
          <span class="text-2xl font-bold text-primary-600">
            {{ formatPrice(product.discounted_price) }}
          </span>
          <span class="text-sm text-neutral-400 line-through">
            {{ formatPrice(product.original_price) }}
          </span>
        </div>

        <div class="flex items-center gap-2">
          <button
            @click.stop="$emit('view', product)"
            class="btn btn-ghost btn-sm"
          >
            Voir
          </button>
          <button
            @click.stop="$emit('reserve', product)"
            class="btn btn-primary btn-sm"
            :disabled="product.available_quantity <= product.reserved_quantity"
          >
            Réserver
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { MapPin, Package } from 'lucide-vue-next'

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
  return `${price.toFixed(2)}€`
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