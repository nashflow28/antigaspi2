<template>
  <div class="card card-interactive group cursor-pointer overflow-hidden glow-effect hover:shadow-lift transition-all duration-500">
    <!-- Image du produit avec gradients modernes -->
    <div class="relative h-52 mb-6 -m-6 mb-4 overflow-hidden rounded-t-2xl">
      <!-- Image réelle si disponible -->
      <img
        v-if="product.image_url"
        :src="product.image_url"
        :alt="product.name"
        class="absolute inset-0 w-full h-full object-cover"
      />
      <!-- Placeholder si pas d'image -->
      <div v-else class="absolute inset-0 bg-gradient-modern flex items-center justify-center">
        <Package class="w-20 h-20 text-white/30 group-hover:scale-110 transition-transform duration-300" />
      </div>

      <!-- Overlay glassmorphism -->
      <div class="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>

      <!-- Badge de réduction - Design 2025 -->
      <div class="absolute top-4 right-4 bg-gradient-accent text-white px-4 py-2 rounded-2xl text-sm font-bold shadow-glow-accent backdrop-blur-sm border border-white/20">
        <div class="flex items-center gap-1">
          <span class="text-xs">💥</span>
          <span>-{{ product.discount }}%</span>
        </div>
      </div>

      <!-- Badge de disponibilité - Design moderne -->
      <div class="absolute top-4 left-4 glass-bg backdrop-blur-md px-3 py-2 rounded-xl glass-border">
        <div class="flex items-center gap-2 text-xs font-medium text-white">
          <div class="w-2 h-2 bg-success-400 rounded-full animate-pulse"></div>
          <span>{{ product.available_quantity - product.reserved_quantity }} dispo</span>
        </div>
      </div>

      <!-- Countdown timer - Design élégant -->
      <div class="absolute bottom-4 left-4 glass-bg backdrop-blur-md px-3 py-2 rounded-xl glass-border">
        <div class="flex items-center gap-2 text-xs font-medium text-white">
          <span class="animate-pulse">⏰</span>
          <span>{{ formatTimeLeft(product.expires_at) }}</span>
        </div>
      </div>
    </div>

    <!-- Contenu avec espacement moderne -->
    <div class="space-y-5">
      <!-- Titre et description -->
      <div>
        <h3 class="text-xl font-bold text-neutral-900 mb-3 group-hover:text-primary-600 transition-colors line-clamp-2 leading-snug">
          {{ product.name }}
        </h3>
        <p class="text-sm text-neutral-600 line-clamp-2 leading-relaxed">{{ product.description }}</p>
      </div>

      <!-- Informations marchand - Design amélioré -->
      <div class="flex items-center gap-3 text-sm text-neutral-600 bg-neutral-50 rounded-xl p-3">
        <div class="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
          <MapPin class="w-4 h-4 text-primary-600" />
        </div>
        <div class="flex-1">
          <span class="font-semibold text-neutral-900 block">{{ product.merchant.name }}</span>
          <span class="text-xs text-neutral-500">{{ product.merchant.distance }}km de vous</span>
        </div>
      </div>

      <!-- Prix et actions - Design moderne -->
      <div class="pt-4 border-t border-neutral-100">
        <!-- Prix avec meilleur espacement -->
        <div class="flex items-baseline gap-3 mb-4">
          <div class="flex items-baseline gap-2">
            <span class="text-3xl font-bold text-success-600">
              {{ Math.round(product.discounted_price).toLocaleString('fr-FR') }}
            </span>
            <span class="text-sm font-medium text-success-600 whitespace-nowrap">
              F CFA
            </span>
          </div>
          <div class="flex items-baseline gap-1">
            <span class="text-lg text-neutral-400 line-through">
              {{ Math.round(product.original_price).toLocaleString('fr-FR') }}
            </span>
            <span class="text-xs text-neutral-400">
              F CFA
            </span>
          </div>
        </div>

        <!-- Boutons d'action modernes -->
        <div class="flex items-center gap-3">
          <button
            @click.stop="$emit('view', product)"
            class="btn btn-outline flex-1 group/btn"
          >
            <span class="group-hover/btn:scale-105 transition-transform">Voir</span>
          </button>
          <button
            @click.stop="$emit('reserve', product)"
            class="btn btn-primary flex-1 group/btn glow-effect"
            :disabled="product.available_quantity <= product.reserved_quantity"
          >
            <span class="group-hover/btn:scale-105 transition-transform">✨ Réserver</span>
          </button>
        </div>

        <!-- Indicateur d'économies -->
        <div class="mt-3 text-center">
          <span class="inline-flex items-center gap-1 text-xs font-medium text-success-700 bg-success-100 px-2 py-1 rounded-full">
            <span>💰</span>
            <span>Économisez {{ Math.round(product.original_price - product.discounted_price).toLocaleString('fr-FR') }} F CFA</span>
          </span>
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
  image_url?: string
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