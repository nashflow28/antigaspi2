<template>
  <!-- Dashboard Migration Wrapper -->
  <!-- Switches between legacy DashboardView and DashboardView2025 based on feature flags -->

  <DashboardView2025
    v-if="shouldUseDashboard2025"
    v-bind="$attrs"
  />

  <DashboardViewLegacy
    v-else
    v-bind="$attrs"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDesignSystem2025 } from '@/composables/useDesignSystem2025'

// Import both versions
import DashboardView2025 from '@/views/DashboardView2025.vue'
import DashboardViewLegacy from '@/views/DashboardView.vue'

const { isEnabled, logMigration } = useDesignSystem2025()

// Should use Dashboard 2025?
const shouldUseDashboard2025 = computed(() => {
  return isEnabled.value || import.meta.env.VITE_DASHBOARD_2025 === 'true'
})

// Log migration usage
if (shouldUseDashboard2025.value) {
  logMigration('DashboardViewWrapper', 'Using Dashboard 2025 version', {
    featureFlag: import.meta.env.VITE_DASHBOARD_2025,
    globalFlag: import.meta.env.VITE_DS_2025
  })
}
</script>