<template>
  <div class="min-h-screen bg-neutral-50 py-10">
    <div class="max-w-5xl mx-auto px-4 space-y-8">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 class="text-3xl font-bold text-neutral-900">Ajouter un nouveau produit</h1>
          <p class="text-neutral-600">Proposez une nouvelle offre et contribuez à réduire le gaspillage alimentaire.</p>
        </div>
        <router-link :to="{ name: 'merchant-products' }" class="btn btn-outline inline-flex items-center justify-center">
          Retour à la liste
        </router-link>
      </div>

      <ProductForm
        mode="create"
        :submitting="submitting"
        :server-error="formError"
        submit-label="Créer le produit"
        @submit="handleSubmit"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import ProductForm, { type ProductFormSubmitPayload } from '@/components/product/ProductForm.vue'
import { apiService } from '@/services/api'

const router = useRouter()

const submitting = ref(false)
const formError = ref<string | null>(null)

const handleSubmit = async (payload: ProductFormSubmitPayload) => {
  try {
    submitting.value = true
    formError.value = null

    const { discount_percentage: _discount, ...productPayload } = payload

    await apiService.createProduct(productPayload as any)

    router.push({ name: 'merchant-products', query: { created: 'true' } })
  } catch (error: any) {
    console.error('Erreur lors de la création du produit', error)
    formError.value = error?.message ?? 'La création du produit a échoué.'
  } finally {
    submitting.value = false
  }
}
</script>
