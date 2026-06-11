import { createApp } from 'vue'
import { MotionPlugin } from '@vueuse/motion'
import { registerSW } from 'virtual:pwa-register'
import { pinia } from '@/stores'
import router from '@/router'
import { useThemeStore } from '@/stores/theme'
import App from './App-progressive.vue'

import '@/assets/css/main.css'
import '@/assets/animations.css'

import { applySecurityMetaTags, validateCSPCompliance } from '@/utils/securityHeaders'

const app = createApp(App)

app.config.errorHandler = (error: unknown, instance, info: string) => {
  console.error('Vue Error Handler:', error, info)

  const componentName = instance?.$options.name ||
                        instance?.$options.__name ||
                        'UnknownComponent'

  const props = instance?.$props || {}

  if (import.meta.env.DEV) {
    console.group('Vue Error Details')
    console.error('Error:', error)
    console.error('Component:', componentName)
    console.error('Props:', props)
    console.error('Info:', info)
    console.groupEnd()
  }
}

app.config.warnHandler = (msg: string, instance, trace: string) => {
  if (import.meta.env.DEV) {
    console.warn('Vue Warning:', msg, trace)

    if (msg.includes('props') || msg.includes('missing') || msg.includes('failed')) {
      console.group('Vue Warning Details')
      console.warn('Message:', msg)
      console.warn('Component:', instance?.$options.name || 'Unknown')
      console.warn('Trace:', trace)
      console.groupEnd()
    }
  }
}

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled Promise Rejection:', event.reason)
  event.preventDefault()
})

window.addEventListener('error', (event) => {
  console.error('Global Error:', event.error)
})

app.use(pinia)
app.use(MotionPlugin)
app.use(router)

const themeStore = useThemeStore(pinia)
themeStore.hydrate()

try {
  applySecurityMetaTags()
  validateCSPCompliance()
} catch (error) {
  console.error('Security setup failed:', error)
}

try {
  app.mount('#app')
  console.log('Application mounted successfully')
} catch (error) {
  console.error('Failed to mount application:', error)

  const appElement = document.getElementById('app')
  if (appElement) {
    appElement.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 2rem; font-family: system-ui; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-align: center;">
        <div style="background: rgba(255, 255, 255, 0.1); padding: 3rem; border-radius: 1rem; backdrop-filter: blur(10px); max-width: 500px;">
          <h1 style="margin: 0 0 1rem 0; font-size: 2rem; font-weight: 600;">Erreur de démarrage</h1>
          <p style="margin: 0 0 2rem 0; font-size: 1.1rem; opacity: 0.9;">L'application n'a pas pu se charger correctement. Veuillez rafraîchir la page.</p>
          <button onclick="window.location.reload()" style="background: white; color: #667eea; border: none; padding: 0.75rem 2rem; border-radius: 0.5rem; font-size: 1rem; font-weight: 600; cursor: pointer;">Rafraîchir la page</button>
        </div>
      </div>
    `
  }
}

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  const updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      console.log('New app version available!')

      if (confirm('Une nouvelle version est disponible. Voulez-vous actualiser maintenant ?')) {
        // Envoie SKIP_WAITING au service worker en attente puis recharge la page
        updateSW(true)
      }
    },
    onRegisteredSW(swScriptUrl) {
      console.log('Service Worker registered successfully:', swScriptUrl)
    },
    onRegisterError(error) {
      console.error('Service Worker registration failed:', error)
    }
  })
}

let deferredPrompt: any
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault()
  deferredPrompt = e
  console.log('PWA install prompt available')
})

export const installPWA = async (): Promise<boolean> => {
  try {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      console.log(`User response to install prompt: ${outcome}`)
      deferredPrompt = null
      return outcome === 'accepted'
    }
    return false
  } catch (error) {
    console.error('PWA install failed:', error)
    return false
  }
}

// =============================================
// 🚀 PERFORMANCE OPTIMIZATION INITIALIZATION
// =============================================

// Import performance utilities
import { initializePerformance, optimizeImages } from './performance'

// Initialize performance monitoring and optimizations
if (typeof window !== 'undefined') {
  // Initialize performance system
  initializePerformance()

  // Optimize images on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', optimizeImages)
  } else {
    optimizeImages()
  }

  // Performance debugging in development
  if (import.meta.env.DEV) {
    console.log('🚀 Performance optimizations initialized')
    console.log('📊 Use window.performanceDebug for debugging tools')
  }
}

// Export for external use
export { initializePerformance } from './performance'
