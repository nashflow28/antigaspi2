<template>
  <!-- NotFoundView Migration Wrapper -->
  <!-- Switches between legacy NotFoundView and NotFoundView2025 based on feature flags -->

  <NotFoundView2025
    v-if="shouldUseNotFound2025"
    v-bind="$attrs"
  />

  <NotFoundViewLegacy
    v-else
    v-bind="$attrs"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDesignSystem2025 } from '@/composables/useDesignSystem2025'

// Import both versions
import NotFoundView2025 from '@/views/NotFoundView2025.vue'
import NotFoundViewLegacy from '@/views/NotFoundView.vue'

const { isEnabled, logMigration } = useDesignSystem2025()

// Should use NotFoundView 2025?
const shouldUseNotFound2025 = computed(() => {
  return isEnabled.value || import.meta.env.VITE_NOT_FOUND_2025 === 'true'
})

// Log migration usage
if (shouldUseNotFound2025.value) {
  logMigration('NotFoundViewWrapper', 'Using NotFoundView 2025 version', {
    featureFlag: import.meta.env.VITE_NOT_FOUND_2025,
    globalFlag: import.meta.env.VITE_DS_2025
  })
}
</script>