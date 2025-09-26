<template>
  <!-- ProductEditView Migration Wrapper -->
  <!-- Switches between legacy ProductEditView and ProductEditView2025 based on feature flags -->

  <ProductEditView2025
    v-if="shouldUseProductEdit2025"
    v-bind="$attrs"
  />

  <ProductEditViewLegacy
    v-else
    v-bind="$attrs"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDesignSystem2025 } from '@/composables/useDesignSystem2025'

// Import both versions
import ProductEditView2025 from '@/views/merchant/ProductEditView2025.vue'
import ProductEditViewLegacy from '@/views/merchant/ProductEditView.vue'

const { isEnabled, logMigration } = useDesignSystem2025()

// Should use ProductEditView 2025?
const shouldUseProductEdit2025 = computed(() => {
  return isEnabled.value || import.meta.env.VITE_PRODUCT_EDIT_2025 === 'true'
})

// Log migration usage
if (shouldUseProductEdit2025.value) {
  logMigration('ProductEditViewWrapper', 'Using ProductEditView 2025 version', {
    featureFlag: import.meta.env.VITE_PRODUCT_EDIT_2025,
    globalFlag: import.meta.env.VITE_DS_2025
  })
}
</script>