<template>
  <div id="app" class="min-h-screen bg-gray-50">
    <!-- Navigation -->
    <NavBar />

    <!-- Main Content -->
    <main class="flex-1">
      <router-view />
    </main>

    <!-- Global Notifications -->
    <NotificationContainer />
    <NotificationSystem />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import NavBar from '@/components/layout/NavBar.vue'
import NotificationContainer from '@/components/ui/NotificationContainer.vue'
import NotificationSystem from '@/components/ui/NotificationSystem.vue'

const authStore = useAuthStore()

onMounted(async () => {
  // Initialize authentication state
  await authStore.initAuth()
})
</script>