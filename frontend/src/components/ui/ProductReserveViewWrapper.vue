<template>
  <!-- ProductReserveView Migration Wrapper -->
  <!-- Switches between legacy ProductReserveView and ProductReserveView2025 based on feature flags -->

  <ProductReserveView2025
    v-if="shouldUseProductReserve2025"
    v-bind="$attrs"
  />

  <ProductReserveViewLegacy
    v-else
    v-bind="$attrs"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDesignSystem2025 } from '@/composables/useDesignSystem2025'

// Import both versions
import ProductReserveView2025 from '@/views/ProductReserveView2025.vue'
import ProductReserveViewLegacy from '@/views/ProductReserveView.vue'

const { isEnabled, logMigration } = useDesignSystem2025()

// Should use ProductReserveView 2025?
const shouldUseProductReserve2025 = computed(() => {
  return isEnabled.value || import.meta.env.VITE_PRODUCT_RESERVE_2025 === 'true'
})

// Log migration usage
if (shouldUseProductReserve2025.value) {
  logMigration('ProductReserveViewWrapper', 'Using ProductReserveView 2025 version', {
    featureFlag: import.meta.env.VITE_PRODUCT_RESERVE_2025,
    globalFlag: import.meta.env.VITE_DS_2025
  })
}
</script>