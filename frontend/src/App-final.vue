<template>
  <div id="app" class="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-dark-900 dark:via-dark-800 dark:to-dark-900 transition-colors duration-500">
    <!-- Navigation -->
    <NavBar />

    <!-- Main Content with modern spacing -->
    <main id="main-content" class="flex-1 relative" role="main" aria-label="Contenu principal">
      <PageTransition>
        <router-view />
      </PageTransition>
    </main>

    <!-- Global Notifications -->
    <NotificationContainer />
    <NotificationSystem />

    <!-- Network Status -->
    <NetworkStatus />

    <!-- PWA Prompts -->
    <PWAPrompt />

    <!-- Error Dashboard (Dev only) -->
    <ErrorDashboard />

    <!-- Sequential Thinking (Dev only) -->
    <SequentialThinking />

    <!-- Background Pattern -->
    <div class="fixed inset-0 -z-10 opacity-20 dark:opacity-10">
      <div class="absolute inset-0 bg-gradient-to-r from-primary-500/10 via-secondary-500/5 to-accent-500/10"></div>
      <div class="absolute top-0 -left-4 w-72 h-72 bg-primary-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
      <div class="absolute top-0 -right-4 w-72 h-72 bg-secondary-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
      <div class="absolute -bottom-8 left-20 w-72 h-72 bg-accent-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import NavBar from '@/components/layout/NavBar.vue'
import NotificationContainer from '@/components/ui/NotificationContainer.vue'
import NotificationSystem from '@/components/ui/NotificationSystem.vue'
import NetworkStatus from '@/components/ui/NetworkStatus.vue'
import PageTransition from '@/components/ui/PageTransition.vue'
import PWAPrompt from '@/components/ui/PWAPrompt.vue'
import ErrorDashboard from '@/components/ui/ErrorDashboard.vue'
import SequentialThinking from '@/components/debug/SequentialThinking.vue'

const authStore = useAuthStore()

onMounted(async () => {
  // Initialize authentication state
  await authStore.initAuth()
})
</script>