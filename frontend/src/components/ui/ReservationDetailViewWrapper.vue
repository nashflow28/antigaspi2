<template>
  <!-- ReservationDetailView Migration Wrapper -->
  <!-- Switches between legacy ReservationDetailView and ReservationDetailView2025 based on feature flags -->

  <ReservationDetailView2025
    v-if="shouldUseReservationDetail2025"
    v-bind="$attrs"
  />

  <ReservationDetailViewLegacy
    v-else
    v-bind="$attrs"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDesignSystem2025 } from '@/composables/useDesignSystem2025'

// Import both versions
import ReservationDetailView2025 from '@/views/ReservationDetailView2025.vue'
import ReservationDetailViewLegacy from '@/views/ReservationDetailView.vue'

const { isEnabled, logMigration } = useDesignSystem2025()

// Should use ReservationDetailView 2025?
const shouldUseReservationDetail2025 = computed(() => {
  return isEnabled.value || import.meta.env.VITE_RESERVATION_DETAIL_2025 === 'true'
})

// Log migration usage
if (shouldUseReservationDetail2025.value) {
  logMigration('ReservationDetailViewWrapper', 'Using ReservationDetailView 2025 version', {
    featureFlag: import.meta.env.VITE_RESERVATION_DETAIL_2025,
    globalFlag: import.meta.env.VITE_DS_2025
  })
}
</script>