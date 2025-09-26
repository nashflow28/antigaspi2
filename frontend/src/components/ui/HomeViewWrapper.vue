<template>
  <!-- HomeView Migration Wrapper -->
  <!-- Switches between legacy HomeView and HomeView2025 based on feature flags -->

  <HomeView2025
    v-if="shouldUseHome2025"
    v-bind="$attrs"
  />

  <HomeViewLegacy
    v-else
    v-bind="$attrs"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDesignSystem2025 } from '@/composables/useDesignSystem2025'

// Import both versions
import HomeView2025 from '@/views/HomeView2025.vue'
import HomeViewLegacy from '@/views/HomeView.vue'

const { isEnabled, logMigration } = useDesignSystem2025()

// Should use HomeView 2025?
const shouldUseHome2025 = computed(() => {
  return isEnabled.value || import.meta.env.VITE_HOME_2025 === 'true'
})

// Log migration usage
if (shouldUseHome2025.value) {
  logMigration('HomeViewWrapper', 'Using HomeView 2025 version', {
    featureFlag: import.meta.env.VITE_HOME_2025,
    globalFlag: import.meta.env.VITE_DS_2025
  })
}
</script>