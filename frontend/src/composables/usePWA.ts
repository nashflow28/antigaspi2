import { ref, onMounted, onUnmounted } from 'vue'

export interface PWAUpdateInfo {
  available: boolean
  registration?: ServiceWorkerRegistration
  refreshing: boolean
}

export interface CacheStatus {
  version: string
  caches: Array<{
    name: string
    size: number
    urls: string[]
  }>
}

export const usePWA = () => {
  const isOnline = ref(navigator.onLine)
  const updateAvailable = ref(false)
  const isInstallable = ref(false)
  const isInstalled = ref(false)
  const refreshing = ref(false)
  const registration = ref<ServiceWorkerRegistration | null>(null)
  const installPrompt = ref<BeforeInstallPromptEvent | null>(null)
  const cacheStatus = ref<CacheStatus | null>(null)

  // Interface pour l'événement beforeinstallprompt
  interface BeforeInstallPromptEvent extends Event {
    readonly platforms: string[]
    readonly userChoice: Promise<{
      outcome: 'accepted' | 'dismissed'
      platform: string
    }>
    prompt(): Promise<void>
  }

  // Installer le Service Worker
  const installServiceWorker = async () => {
    if (!('serviceWorker' in navigator)) {
      console.warn('Service Worker not supported')
      return false
    }

    try {
      const reg = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      })

      registration.value = reg

      console.log('Service Worker registered successfully:', reg.scope)

      // Écouter les mises à jour
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing

        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                // Nouvelle version disponible
                updateAvailable.value = true
              } else {
                // Premier install
                console.log('Service Worker installed for the first time')
              }
            }
          })
        }
      })

      return true
    } catch (error) {
      console.error('Service Worker registration failed:', error)
      return false
    }
  }

  // Forcer la mise à jour du Service Worker
  const updateServiceWorker = async () => {
    if (!registration.value) return

    refreshing.value = true

    const reg = registration.value
    const waiting = reg.waiting

    if (waiting) {
      // Demander au service worker en attente de prendre le contrôle
      waiting.postMessage({ type: 'SKIP_WAITING' })

      // Attendre que le nouveau service worker prenne le contrôle
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        refreshing.value = false
        window.location.reload()
      })
    }
  }

  // Vérifier si l'app peut être installée
  const checkInstallability = () => {
    // Vérifier si l'app est déjà installée
    if (window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true) {
      isInstalled.value = true
      return
    }

    // Écouter l'événement beforeinstallprompt
    window.addEventListener('beforeinstallprompt', (e: Event) => {
      e.preventDefault()
      installPrompt.value = e as BeforeInstallPromptEvent
      isInstallable.value = true
    })

    // Écouter l'événement appinstalled
    window.addEventListener('appinstalled', () => {
      isInstalled.value = true
      isInstallable.value = false
      installPrompt.value = null
    })
  }

  // Installer l'application PWA
  const installApp = async () => {
    if (!installPrompt.value) return false

    try {
      await installPrompt.value.prompt()
      const choiceResult = await installPrompt.value.userChoice

      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt')
        isInstallable.value = false
        installPrompt.value = null
        return true
      } else {
        console.log('User dismissed the install prompt')
        return false
      }
    } catch (error) {
      console.error('Error during app installation:', error)
      return false
    }
  }

  // Gérer la connectivité
  const handleOnline = () => {
    isOnline.value = true
    announceConnectionStatus('Connexion rétablie')
  }

  const handleOffline = () => {
    isOnline.value = false
    announceConnectionStatus('Connexion perdue - Mode hors ligne activé')
  }

  // Annoncer le statut de connexion
  const announceConnectionStatus = (message: string) => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'ANNOUNCE',
        message
      })
    }
  }

  // Cache des URLs spécifiques
  const cacheUrls = async (urls: string[]) => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'CACHE_URLS',
        urls
      })
    }
  }

  // Vider le cache
  const clearCache = async () => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'CLEAR_CACHE'
      })
    }
  }

  // Obtenir le statut du cache
  const getCacheStatus = async (): Promise<CacheStatus | null> => {
    if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) {
      return null
    }

    return new Promise((resolve) => {
      const messageChannel = new MessageChannel()

      messageChannel.port1.onmessage = (event) => {
        cacheStatus.value = event.data
        resolve(event.data)
      }

      navigator.serviceWorker.controller.postMessage(
        { type: 'GET_CACHE_STATUS' },
        [messageChannel.port2]
      )
    })
  }

  // Enregistrer pour la synchronisation en arrière-plan
  const registerBackgroundSync = async (tag: string) => {
    if (!registration.value || !('sync' in window.ServiceWorkerRegistration.prototype)) {
      console.warn('Background sync not supported')
      return false
    }

    try {
      await (registration.value as any).sync.register(tag)
      console.log('Background sync registered:', tag)
      return true
    } catch (error) {
      console.error('Background sync registration failed:', error)
      return false
    }
  }

  // Partager du contenu
  const shareContent = async (shareData: ShareData) => {
    if ('share' in navigator) {
      try {
        await navigator.share(shareData)
        return true
      } catch (error) {
        console.error('Sharing failed:', error)
        return false
      }
    } else {
      // Fallback pour les navigateurs qui ne supportent pas Web Share API
      if (shareData.url) {
        await navigator.clipboard.writeText(shareData.url)
        return true
      }
      return false
    }
  }

  // Détecter le mode d'affichage
  const getDisplayMode = (): string => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return 'standalone'
    }
    if (window.matchMedia('(display-mode: minimal-ui)').matches) {
      return 'minimal-ui'
    }
    if (window.matchMedia('(display-mode: fullscreen)').matches) {
      return 'fullscreen'
    }
    return 'browser'
  }

  // Initialiser PWA
  const initializePWA = async () => {
    await installServiceWorker()
    checkInstallability()

    // Obtenir le statut initial du cache
    await getCacheStatus()

    console.log('PWA initialized successfully')
  }

  // Lifecycle
  onMounted(() => {
    // Écouter les changements de connectivité
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Initialiser PWA
    initializePWA()
  })

  onUnmounted(() => {
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
  })

  return {
    // État
    isOnline,
    updateAvailable,
    isInstallable,
    isInstalled,
    refreshing,
    registration,
    cacheStatus,

    // Méthodes Service Worker
    installServiceWorker,
    updateServiceWorker,

    // Méthodes Installation
    installApp,

    // Méthodes Cache
    cacheUrls,
    clearCache,
    getCacheStatus,

    // Méthodes Utilitaires
    registerBackgroundSync,
    shareContent,
    getDisplayMode,

    // Propriétés calculées
    displayMode: getDisplayMode(),
    canShare: 'share' in navigator,
    supportsBackgroundSync: 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype
  }
}