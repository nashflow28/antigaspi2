<template>
  <div class="container mx-auto py-8 px-4 max-w-2xl">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
        Donner votre avis
      </h1>
      <p v-if="productName" class="text-gray-600 dark:text-gray-300">
        sur <strong>{{ productName }}</strong>
      </p>
      <router-link :to="`/products/${productId}`" class="text-green-600 hover:text-green-700 text-sm mt-4 inline-block">
        ← Retour au produit
      </router-link>
    </div>

    <!-- Form -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <ReviewForm
        :loading="reviewsStore.loading"
        @submit="handleSubmit"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ReviewForm from '@/components/reviews/ReviewForm.vue'
import { useReviewsStore } from '@/stores/reviews'
import { useNotifications } from '@/composables/useNotifications'

const route = useRoute()
const router = useRouter()
const reviewsStore = useReviewsStore()
const { notify } = useNotifications()

const productId = ref<number | null>(null)
const merchantId = ref<number | null>(null)
const productName = ref('')

onMounted(() => {
  productId.value = Number(route.params.productId)
  merchantId.value = Number(route.params.merchantId)
  productName.value = String(route.params.productName || '')
})

const handleSubmit = async (data: any) => {
  if (!merchantId.value || !productId.value) {
    notify.error('Données manquantes pour créer l\'avis')
    return
  }

  const result = await reviewsStore.createReview({
    merchantId: merchantId.value,
    productId: productId.value,
    ...data
  })

  if (result.success) {
    setTimeout(() => {
      router.push(`/products/${productId.value}`)
    }, 1500)
  }
}
</script>
