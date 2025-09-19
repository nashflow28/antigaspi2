<template>
  <!-- Prompt d'installation PWA -->
  <Teleport to="body">
    <Transition name="pwa-slide-up" appear>
      <div
        v-if="showInstallPrompt"
        class="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50"
      >
        <div class="bg-white dark:bg-dark-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-dark-700 p-6">
          <div class="flex items-start gap-4">
            <!-- Icon -->
            <div class="shrink-0">
              <div class="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center">
                <span class="text-white text-xl">🌱</span>
              </div>
            </div>

            <!-- Content -->
            <div class="flex-1">
              <h3 class="font-semibold text-gray-900 dark:text-white text-sm mb-1">
                Installer Antigaspi
              </h3>
              <p class="text-gray-600 dark:text-gray-300 text-xs leading-relaxed mb-4">
                Ajoutez Antigaspi à votre écran d'accueil pour un accès rapide et une expérience native.
              </p>

              <!-- Buttons -->
              <div class="flex gap-2">
                <InteractiveButton
                  size="sm"
                  variant="primary"
                  @click="handleInstall"
                  :loading="installing"
                  aria-label="Installer l'application Antigaspi"
                >
                  <Download class="w-4 h-4" aria-hidden="true" />
                  Installer
                </InteractiveButton>

                <InteractiveButton
                  size="sm"
                  variant="ghost"
                  @click="dismissInstallPrompt"
                  aria-label="Ignorer l'installation"
                >
                  Plus tard
                </InteractiveButton>
              </div>
            </div>

            <!-- Close -->
            <button
              @click="dismissInstallPrompt"
              class="shrink-0 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              aria-label="Fermer"
            >
              <X class="w-4 h-4" />
            </button>
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
        <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl shadow-xl p-6">
          <div class="flex items-start gap-4">
            <!-- Icon -->
            <div class="shrink-0">
              <div class="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <RefreshCw class="w-5 h-5 text-white" />
              </div>
            </div>

            <!-- Content -->
            <div class="flex-1">
              <h3 class="font-semibold text-blue-900 dark:text-blue-100 text-sm mb-1">
                Mise à jour disponible
              </h3>
              <p class="text-blue-700 dark:text-blue-200 text-xs leading-relaxed mb-4">
                Une nouvelle version d'Antigaspi est disponible avec des améliorations et corrections.
              </p>

              <!-- Buttons -->
              <div class="flex gap-2">
                <InteractiveButton
                  size="sm"
                  variant="primary"
                  @click="handleUpdate"
                  :loading="updating"
                  aria-label="Mettre à jour l'application"
                >
                  <RefreshCw class="w-4 h-4" aria-hidden="true" />
                  Mettre à jour
                </InteractiveButton>

                <InteractiveButton
                  size="sm"
                  variant="ghost"
                  @click="dismissUpdatePrompt"
                  aria-label="Ignorer la mise à jour"
                >
                  Plus tard
                </InteractiveButton>
              </div>
            </div>

            <!-- Close -->
            <button
              @click="dismissUpdatePrompt"
              class="shrink-0 p-1 text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 transition-colors"
              aria-label="Fermer"
            >
              <X class="w-4 h-4" />
            </button>
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
            'px-4 py-2 rounded-full shadow-lg text-sm font-medium flex items-center gap-2',
            isOnline
              ? 'bg-green-500 text-white'
              : 'bg-red-500 text-white'
          ]"
        >
          <div
            :class="[
              'w-2 h-2 rounded-full',
              isOnline ? 'bg-white' : 'bg-white animate-pulse'
            ]"
          ></div>
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
import InteractiveButton from './InteractiveButton.vue'

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
  } catch (error) {
    console.error('Installation failed:', error)
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
  } catch (error) {
    console.error('Update failed:', error)
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