<template>
  <div class="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100">
    <!-- Header -->
    <div class="bg-white/80 backdrop-blur-sm border-b border-neutral-200 sticky top-0 z-10">
      <div class="container mx-auto px-4 py-6">
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 class="text-3xl font-bold text-neutral-900">Centre d'avis</h1>
            <p class="text-neutral-600 mt-1">
              Consultez et gérez les avis des commerçants
            </p>
          </div>

          <!-- Merchant Selector -->
          <div class="flex items-center space-x-3">
            <label for="merchant-select" class="text-sm font-medium text-gray-700">
              Commerçant :
            </label>
            <select
              id="merchant-select"
              v-model="selectedMerchantId"
              @change="onMerchantChange"
              :disabled="merchantsLoading"
              class="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            >
              <option value="">Sélectionner un commerçant</option>
              <option
                v-for="merchant in merchantOptions"
                :key="merchant.id"
                :value="merchant.id"
              >
                {{ merchant.business_name }}
              </option>
            </select>
            <p v-if="merchantsLoading" class="text-xs text-gray-500 mt-1">Chargement des commerçants...</p>
            <p v-else-if="merchantsError" class="text-xs text-red-500 mt-1">{{ merchantsError }}</p>
          </div>
        </div>
      </div>
    </div>

    <div class="container mx-auto px-4 py-8">
      <div v-if="!selectedMerchantId" class="text-center py-16">
        <Star class="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 class="text-xl font-semibold text-gray-900 mb-2">Sélectionnez un commerçant</h2>
        <p class="text-gray-600">Choisissez un commerçant pour voir ses avis et en laisser un.</p>
      </div>

      <div v-else class="space-y-8">
        <!-- Review Form (for authenticated users) -->
        <div v-if="authStore.isAuthenticated && authStore.isConsumer">
          <ReviewForm
            :merchant-id="selectedMerchantId"
            :available-products="availableProducts"
            @success="onReviewSuccess"
          />
        </div>

        <div v-else-if="!authStore.isAuthenticated" class="bg-yellow-50 border border-yellow-200 rounded-2xl p-6">
          <div class="flex items-center space-x-3">
            <Info class="w-6 h-6 text-yellow-600" />
            <div>
              <h3 class="text-lg font-medium text-yellow-800">Connexion requise</h3>
              <p class="text-yellow-700">
                Connectez-vous pour laisser un avis sur ce commerçant.
              </p>
              <div class="mt-3 space-x-3">
                <router-link
                  to="/login"
                  class="inline-flex items-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                >
                  Se connecter
                </router-link>
                <router-link
                  to="/register"
                  class="inline-flex items-center px-4 py-2 border border-yellow-600 text-yellow-700 rounded-lg hover:bg-yellow-50 transition-colors"
                >
                  S'inscrire
                </router-link>
              </div>
            </div>
          </div>
        </div>

        <!-- Reviews List -->
        <ReviewsList
          ref="reviewsListRef"
          :merchant-id="selectedMerchantId"
          :key="selectedMerchantId"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import ReviewForm from '@/components/reviews/ReviewForm.vue'
import ReviewsList from '@/components/reviews/ReviewsList.vue'
import { Star, Info } from 'lucide-vue-next'
import { storeToRefs } from 'pinia'
import { useMerchantsStore } from '@/stores/merchants'
import { notify } from '@/composables/useNotifications'

interface Product {
  id: number
  name: string
}

const authStore = useAuthStore()
const merchantsStore = useMerchantsStore()
const { merchants, loading: merchantsLoading, error: merchantsError } = storeToRefs(merchantsStore)

const selectedMerchantId = ref<number | null>(null)
const availableProducts = ref<Product[]>([])
const reviewsListRef = ref()

const merchantOptions = computed(() => {
  return merchants.value.map(merchant => ({
    id: merchant.id,
    business_name: merchant.business_name,
  }))
})

const fetchMerchants = async () => {
  const result = await merchantsStore.fetchMerchants()
  if (!result.success && result.error) {
    notify.error(result.error, 'Avis commerçants')
  }
}

const onMerchantChange = async () => {
  if (!selectedMerchantId.value) {
    availableProducts.value = []
    return
  }

  // Fetch products for the selected merchant
  // This is a simplified example - in a real app you'd call the products API
  try {
    const response = await fetch(`http://localhost:8000/api/products?merchant_id=${selectedMerchantId.value}`)
    const data = await response.json()

    if (data.success) {
      availableProducts.value = data.data.map((product: any) => ({
        id: product.id,
        name: product.name
      }))
    } else {
      availableProducts.value = []
      notify.error(data.message || 'Impossible de charger les produits du commerçant')
    }
  } catch (error) {
    notify.error('Erreur lors du chargement des produits du commerçant')
    availableProducts.value = []
  }
}

const onReviewSuccess = (review: any) => {
  console.log('Review submitted successfully:', review)
  // Automatically refresh the reviews list
  if (reviewsListRef.value) {
    reviewsListRef.value.refreshReviews()
  }
}

onMounted(() => {
  fetchMerchants()
})
</script>