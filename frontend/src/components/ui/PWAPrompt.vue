<template>
  <!-- Prompt d'installation PWA -->
  <Teleport to="body">
    <Transition name="pwa-slide-up" appear>
      <div
        v-if="showInstallPrompt"
        class="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50"
      >
        <div class="bg-white dark:bg-dark-800 rounded shadow-80 border border-gray-200 dark:border-dark-700 p-6">
          <div class="flex items-stretch sm:items-start gap-3">
            <!-- Icon -->
            <div class="shrink-0">
              <div class="w-12 h-10 bg-gradient-to-r from-blue-600 to-blue-700 rounded flex items-center justify-center">
                <span class="text-white text-xl">🌱</span>
              </div>
            </div>

            <!-- Content -->
            <div class="flex-1">
              <h3 class="font-semibold text-gray-900 dark:text-white text-sm mb-1">
                Installer Antigaspi
              </h3>
              <p class="text-gray-700 dark:text-gray-500 text-xs leading-relaxed mt-3">
                Ajoutez Antigaspi à votre écran d'accueil pour un accès rapide et une expérience native.
              </p>

              <!-- Buttons -->
              <div class="flex gap-2">
                <Button
                  size="sm"
                  variant="primary"
                  :left-icon="Download"
                  :loading="installing"
                  aria-label="Installer l'application Antigaspi"
                  @click="handleInstall"
                >
                  Installer
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  aria-label="Ignorer l'installation"
                  @click="dismissInstallPrompt"
                >
                  Plus tard
                </Button>
              </div>
            </div>

            <!-- Close -->
            <Button
              variant="ghost"
              size="icon"
              :left-icon="X"
              class="shrink-0 text-gray-400 hover:text-gray-700 dark:hover:transition-colors"
              aria-label="Fermer"
              @click="dismissInstallPrompt"
            >
              <span class="sr-only">Fermer</span>
            </Button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- Prompt de mise à jour -->
  <Teleport to="body">
    <Transition name="pwa-slide-up" appear>
      <div
        v-if="showUpdatePrompt"
        class="fixed top-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50"
      >
        <div class="bg-blue-50 dark:bg-secondary-900/20 border border-blue-200 dark:border-blue-800 rounded shadow-xl p-6">
          <div class="flex items-stretch sm:items-start gap-3">
            <!-- Icon -->
            <div class="shrink-0">
              <div class="h-6 w-6 bg-blue-500 rounded flex items-center justify-center">
                <RefreshCw class="h-4 w-4 text-white" />
              </div>
            </div>

            <!-- Content -->
            <div class="flex-1">
              <h3 class="font-semibold text-secondary-900 dark:text-secondary-100 text-sm mb-1">
                Mise à jour disponible
              </h3>
              <p class="text-secondary-700 dark:text-secondary-200 text-xs leading-relaxed mt-3">
                Une nouvelle version d'Antigaspi est disponible avec des améliorations et corrections.
              </p>

              <!-- Buttons -->
              <div class="flex gap-2">
                <Button
                  size="sm"
                  variant="primary"
                  :left-icon="RefreshCw"
                  :loading="updating"
                  aria-label="Mettre à jour l'application"
                  @click="handleUpdate"
                >
                  Mettre à jour
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  aria-label="Ignorer la mise à jour"
                  @click="dismissUpdatePrompt"
                >
                  Plus tard
                </Button>
              </div>
            </div>

            <!-- Close -->
            <Button
              variant="ghost"
              size="icon"
              :left-icon="X"
              class="shrink-0 text-secondary-400 hover:text-info dark:hover:transition-colors"
              aria-label="Fermer"
              @click="dismissUpdatePrompt"
            >
              <span class="sr-only">Fermer</span>
            </Button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- Statut de connexion -->
  <Teleport to="body">
    <Transition name="pwa-fade">
      <div
        v-if="showConnectionStatus"
        class="fixed top-4 left-1/2 transform -translate-x-1/2 z-50"
      >
        <div
          :class="[
            'px-3 py-3 rounded-full shadow-lg text-sm font-medium flex items-center gap-2',
            isOnline
              ? 'bg-blue-500 text-white'
              : 'bg-red-500 text-white'
          ]"
        >
          <div
            :class="[
              'h-4 w-4 rounded-full',
              isOnline ? 'bg-white' : 'bg-white animate-pulse'
            ]"
          />
          {{ isOnline ? 'Connexion rétablie' : 'Hors ligne' }}
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { Download, X, RefreshCw } from 'lucide-vue-next'
import { usePWA } from '@/composables/usePWA'
import { useAccessibility } from '@/composables/useAccessibility'
import Button from './Button.vue'

const {
  isOnline,
  updateAvailable,
  isInstallable,
  installApp,
  updateServiceWorker
} = usePWA()

const { announce } = useAccessibility()

const showInstallPrompt = ref(false)
const showUpdatePrompt = ref(false)
const showConnectionStatus = ref(false)
const installing = ref(false)
const updating = ref(false)
const connectionStatusTimeout = ref<number | null>(null)

// Montrer le prompt d'installation après un délai
const checkInstallPrompt = () => {
  if (isInstallable.value) {
    // Vérifier si l'utilisateur n'a pas déjà ignoré le prompt
    const dismissed = localStorage.getItem('pwa-install-dismissed')
    const lastDismissed = dismissed ? parseInt(dismissed) : 0
    const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000)

    if (lastDismissed < oneWeekAgo) {
      // Montrer après 30 secondes
      setTimeout(() => {
        showInstallPrompt.value = true
        announce('Proposition d\'installation de l\'application disponible')
      }, 30000)
    }
  }
}

// Gérer l'installation
const handleInstall = async () => {
  installing.value = true

  try {
    const result = await installApp()
    if (result) {
      showInstallPrompt.value = false
      announce('Application installée avec succès')
    }
  } catch {
    // console.error('Installation failed:', error)
    announce('Échec de l\'installation')
  } finally {
    installing.value = false
  }
}

// Ignorer le prompt d'installation
const dismissInstallPrompt = () => {
  showInstallPrompt.value = false
  localStorage.setItem('pwa-install-dismissed', Date.now().toString())
  announce('Installation ignorée')
}

// Gérer la mise à jour
const handleUpdate = async () => {
  updating.value = true

  try {
    await updateServiceWorker()
    announce('Mise à jour en cours...')
  } catch {
    // console.error('Update failed:', error)
    announce('Échec de la mise à jour')
  } finally {
    updating.value = false
  }
}

// Ignorer le prompt de mise à jour
const dismissUpdatePrompt = () => {
  showUpdatePrompt.value = false
  announce('Mise à jour ignorée')
}

// Afficher le statut de connexion
const showConnectionStatusBriefly = (duration = 3000) => {
  showConnectionStatus.value = true

  if (connectionStatusTimeout.value) {
    clearTimeout(connectionStatusTimeout.value)
  }

  connectionStatusTimeout.value = window.setTimeout(() => {
    showConnectionStatus.value = false
    connectionStatusTimeout.value = null
  }, duration)
}

// Watchers
watch(isInstallable, (newValue) => {
  if (newValue) {
    checkInstallPrompt()
  }
})

watch(updateAvailable, (newValue) => {
  if (newValue) {
    showUpdatePrompt.value = true
    announce('Mise à jour disponible pour l\'application')
  }
})

watch(isOnline, (newValue, oldValue) => {
  if (oldValue !== undefined && newValue !== oldValue) {
    showConnectionStatusBriefly()
  }
})

onMounted(() => {
  checkInstallPrompt()
})
</script>

<style scoped>
.pwa-slide-up-enter-active,
.pwa-slide-up-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.pwa-slide-up-enter-from {
  opacity: 0;
  transform: translateY(100px);
}

.pwa-slide-up-leave-to {
  opacity: 0;
  transform: translateY(100px);
}

.pwa-fade-enter-active,
.pwa-fade-leave-active {
  transition: opacity 0.3s ease;
}

.pwa-fade-enter-from,
.pwa-fade-leave-to {
  opacity: 0;
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .pwa-slide-up-enter-from,
  .pwa-slide-up-leave-to {
    transform: translateY(50px);
  }
}

/* Accessibility pour reduced motion */
@media (prefers-reduced-motion: reduce) {
  .pwa-slide-up-enter-active,
  .pwa-slide-up-leave-active,
  .pwa-fade-enter-active,
  .pwa-fade-leave-active {
    transition: none !important;
  }

  .pwa-slide-up-enter-from,
  .pwa-slide-up-leave-to {
    transform: none !important;
  }
}
</style>
