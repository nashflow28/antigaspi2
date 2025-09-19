<template>
  <div class="min-h-screen bg-neutral-50 py-10">
    <div class="max-w-5xl mx-auto px-4 space-y-8">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 class="text-3xl font-bold text-neutral-900">Modifier un produit</h1>
          <p class="text-neutral-600">Mettez à jour les informations de votre offre anti-gaspillage.</p>
        </div>
        <router-link :to="{ name: 'merchant-products' }" class="btn btn-outline inline-flex items-center justify-center">
          Retour à la liste
        </router-link>
      </div>

      <div v-if="loading" class="card p-6 flex items-center justify-center text-neutral-500">
        Chargement du produit...
      </div>

      <div v-else-if="loadError" class="card p-6 bg-error-50 border border-error-100 text-error-600">
        {{ loadError }}
      </div>

      <div v-else>
        <ProductForm
          mode="edit"
          :initial-values="productInitialValues"
          :submitting="submitting"
          :server-error="formError"
          submit-label="Mettre à jour le produit"
          @submit="handleSubmit"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ProductForm, { type ProductFormInitialValues, type ProductFormSubmitPayload } from '@/components/product/ProductForm.vue'
import { apiService } from '@/services/api'
import type { Product } from '@/types'

const route = useRoute()
const router = useRouter()

const productId = Number(route.params.id)
const loading = ref(true)
const submitting = ref(false)
const loadError = ref<string | null>(null)
const formError = ref<string | null>(null)
const productInitialValues = ref<ProductFormInitialValues | null>(null)

const mapProductToInitialValues = (product: Product): ProductFormInitialValues => {
  const toNumber = (value: string | number): number => {
    if (typeof value === 'number') {
      return value
    }
    const parsed = parseFloat(value)
    return Number.isNaN(parsed) ? 0 : parsed
  }

  return {
    name: product.name,
    description: product.description,
    category_id: product.category?.id ?? undefined,
    original_price: toNumber(product.original_price),
    discounted_price: toNumber(product.discounted_price),
    quantity_available: product.quantity_available,
    expiration_date: product.expiration_date,
    image_url: product.image_url ?? null,
    discount_percentage: product.discount_percentage
  }
}

const fetchProduct = async () => {
  try {
    if (!productId) {
      loadError.value = 'Identifiant de produit invalide.'
      return
    }

    const response = await apiService.getProduct(productId)
    if (!response.data) {
      loadError.value = 'Produit introuvable.'
      return
    }

    productInitialValues.value = mapProductToInitialValues(response.data)
  } catch (error: any) {
    console.error('Erreur lors du chargement du produit', error)
    loadError.value = error?.message ?? 'Impossible de charger le produit demandé.'
  } finally {
    loading.value = false
  }
}

const handleSubmit = async (payload: ProductFormSubmitPayload) => {
  try {
    submitting.value = true
    formError.value = null

    const { discount_percentage: _discount, ...productPayload } = payload

    await apiService.updateProduct(productId, productPayload as any)

    router.push({ name: 'merchant-products', query: { updated: 'true' } })
  } catch (error: any) {
    console.error('Erreur lors de la mise à jour du produit', error)
    formError.value = error?.message ?? 'La mise à jour du produit a échoué.'
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  fetchProduct()
})
</script>
