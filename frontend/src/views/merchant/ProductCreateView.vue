<template>
  <div></div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

onMounted(() => {
  // Rediriger vers la page des produits avec l'indication d'ouvrir la modale
  router.replace({
    name: 'merchant-products',
    query: { action: 'create' }
  })
})
</script>
