<template>
  <!-- AdminDashboardView Migration Wrapper -->
  <!-- Switches between legacy AdminDashboardView and AdminDashboardView2025 based on feature flags -->

  <AdminDashboardView2025
    v-if="shouldUseDashboard2025"
    v-bind="$attrs"
  />

  <AdminDashboardViewLegacy
    v-else
    v-bind="$attrs"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDesignSystem2025 } from '@/composables/useDesignSystem2025'

// Import both versions
import AdminDashboardView2025 from '@/views/admin/DashboardView2025.vue'
import AdminDashboardViewLegacy from '@/views/admin/DashboardView.vue'

const { isEnabled, logMigration } = useDesignSystem2025()

// Should use AdminDashboardView 2025?
const shouldUseDashboard2025 = computed(() => {
  return isEnabled.value || import.meta.env.VITE_DASHBOARD_2025 === 'true'
})

// Log migration usage
if (shouldUseDashboard2025.value) {
  logMigration('AdminDashboardViewWrapper', 'Using AdminDashboardView 2025 version', {
    featureFlag: import.meta.env.VITE_DASHBOARD_2025,
    globalFlag: import.meta.env.VITE_DS_2025
  })
}
</script>