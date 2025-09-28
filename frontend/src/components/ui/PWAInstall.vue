<template>
  <div v-if="showInstallPrompt" class="pwa-install-banner">
    <div class="pwa-banner-content">
      <div class="pwa-icon">
        🌱
      </div>
      <div class="pwa-text">
        <h3>Installer Antigaspi</h3>
        <p>Accédez plus rapidement à l'application depuis votre écran d'accueil</p>
      </div>
      <div class="pwa-actions">
        <Button
          variant="secondary"
          size="sm"
          class="install-btn"
          @click="installApp"
        >
          <Download class="h-4 w-4 mr-2" />
          Installer
        </Button>
        <Button
          variant="ghost"
          size="sm"
          class="dismiss-btn"
          @click="dismissPrompt"
        >
          <X class="h-4 w-4" />
        </Button>
      </div>
    </div>
  </div>

  <!-- Floating Install Button -->
  <Teleport to="body">
    <div
      v-if="showFloatingButton && !showInstallPrompt"
      class="pwa-floating-install"
      @click="showInstallPrompt = true"
    >
      <div class="floating-content">
        <Download class="h-4 w-4" />
        <span>Installer l'app</span>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { Download, X } from 'lucide-vue-next'
import Button from '@/components/ui/2025/Button.vue'

const showInstallPrompt = ref(false)
const showFloatingButton = ref(false)
const deferredPrompt = ref<any>(null)

const handleBeforeInstallPrompt = (e: Event) => {
  e.preventDefault()
  deferredPrompt.value = e

  // Show floating button after 30 seconds
  setTimeout(() => {
    if (deferredPrompt.value && !localStorage.getItem('pwa-prompt-dismissed')) {
      showFloatingButton.value = true
    }
  }, 30000)

  // Auto show banner on homepage after 60 seconds
  setTimeout(() => {
    if (deferredPrompt.value && !localStorage.getItem('pwa-prompt-dismissed') && window.location.pathname === '/') {
      showInstallPrompt.value = true
    }
  }, 60000)
}

const handleAppInstalled = () => {
  // console.log('PWA was installed')
  showInstallPrompt.value = false
  showFloatingButton.value = false
  deferredPrompt.value = null
  localStorage.setItem('pwa-installed', 'true')
}

const installApp = async () => {
  if (deferredPrompt.value) {
    deferredPrompt.value.prompt()
    const { outcome } = await deferredPrompt.value.userChoice

    if (outcome === 'accepted') {
      // console.log('User accepted the PWA install prompt')
    } else {
      // console.log('User dismissed the PWA install prompt')
      localStorage.setItem('pwa-prompt-dismissed', Date.now().toString())
    }

    showInstallPrompt.value = false
    showFloatingButton.value = false
    deferredPrompt.value = null
  }
}

const dismissPrompt = () => {
  showInstallPrompt.value = false
  localStorage.setItem('pwa-prompt-dismissed', Date.now().toString())
}

onMounted(() => {
  // Don't show if already installed or recently dismissed
  if (localStorage.getItem('pwa-installed') || isRecentlyDismissed()) {
    return
  }

  window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
  window.addEventListener('appinstalled', handleAppInstalled)
})

onUnmounted(() => {
  window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
  window.removeEventListener('appinstalled', handleAppInstalled)
})

const isRecentlyDismissed = (): boolean => {
  const dismissedTime = localStorage.getItem('pwa-prompt-dismissed')
  if (!dismissedTime) return false

  const daysSinceDismissed = (Date.now() - parseInt(dismissedTime)) / (1000 * 60 * 60 * 24)
  return daysSinceDismissed < 7 // Don't show again for 7 days
}
</script>

<style scoped>
.pwa-install-banner {
  position: fixed;
  bottom: 20px;
  left: 20px;
  right: 20px;
  background: linear-gradient(135deg, #10B981, #059669);
  color: white;
  padding: 16px 20px;
  rounded: 16px;
  box-shadow: 0 10px 25px -5px rgba(16, 185, 129, 0.4);
  z-index: 9999;
  animation: slideInUp 0.3s ease-out;
}

.pwa-banner-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.pwa-icon {
  font-size: 32px;
  flex-shrink: 0;
}

.pwa-text {
  flex: 1;
}

.pwa-text h3 {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 4px 0;
}

.pwa-text p {
  font-size: 14px;
  margin: 0;
  opacity: 0.9;
}

.pwa-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.install-btn {
  background: rgba(255, 255, 255, 0.2) !important;
  color: white !important;
  border: 1px solid rgba(255, 255, 255, 0.3) !important;
}

.install-btn:hover {
  background: rgba(255, 255, 255, 0.3) !important;
  transform: translateY(-1px);
}

.dismiss-btn {
  background: transparent !important;
  color: white !important;
  border: none !important;
  opacity: 0.8;
}

.dismiss-btn:hover {
  background: rgba(255, 255, 255, 0.1) !important;
  opacity: 1;
}

.pwa-floating-install {
  position: fixed;
  bottom: 80px;
  right: 20px;
  background: linear-gradient(135deg, #10B981, #059669);
  color: white;
  padding: 12px 16px;
  rounded: 50px;
  box-shadow: 0 4px 20px rgba(16, 185, 129, 0.4);
  cursor: pointer;
  z-index: 9998;
  animation: float 3s ease-in-out infinite;
}

.floating-content {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
}

.pwa-floating-install:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 25px rgba(16, 185, 129, 0.5);
}

@keyframes slideInUp {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

/* Mobile responsiveness */
@media (max-width: 640px) {
  .pwa-install-banner {
    left: 10px;
    right: 10px;
    bottom: 10px;
  }

  .pwa-banner-content {
    gap: 12px;
  }

  .pwa-icon {
    font-size: 24px;
  }

  .pwa-text h3 {
    font-size: 14px;
  }

  .pwa-text p {
    font-size: 12px;
  }

  .install-btn {
    padding: 6px 12px !important;
    font-size: 12px !important;
  }

  .pwa-floating-install {
    bottom: 70px;
    right: 15px;
    padding: 10px 14px;
  }

  .floating-content {
    font-size: 12px;
  }
}
</style>
