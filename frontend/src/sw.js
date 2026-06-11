/* global self */
import { clientsClaim } from 'workbox-core'
import { cleanupOutdatedCaches, matchPrecache, precacheAndRoute } from 'workbox-precaching'
import { NavigationRoute, registerRoute, setCatchHandler } from 'workbox-routing'
import { NetworkFirst } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'

// Prend le contrôle des clients dès l'activation du nouveau service worker
clientsClaim()

// Mise à jour pilotée par l'application (registerType: 'prompt') :
// le client envoie SKIP_WAITING via updateSW() quand l'utilisateur accepte.
// Ce message est aussi compatible avec l'ancien sw.js manuel (même protocole).
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

// Purge des caches de l'ancien service worker manuel (public/sw.js)
const LEGACY_CACHES = ['antigaspi-v1.0.0', 'static-v1', 'dynamic-v1', 'api-v1']
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => Promise.all(
      cacheNames
        .filter((cacheName) => LEGACY_CACHES.includes(cacheName))
        .map((cacheName) => caches.delete(cacheName))
    ))
  )
})

// Navigations (documents) : NetworkFirst pour toujours servir un index.html frais.
// Enregistrée AVANT precacheAndRoute pour primer sur la route de precache
// ('/' serait sinon résolu vers l'index.html prébuffé en cache-first).
registerRoute(
  new NavigationRoute(
    new NetworkFirst({
      cacheName: 'pages',
      networkTimeoutSeconds: 5
    })
  )
)

// Precache des assets buildés (manifest injecté au build par vite-plugin-pwa)
precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()

// API : NetworkFirst avec expiration (équivalent de l'ancien cache 'api-v1',
// limité aux endpoints publics listés dans l'ancien sw.js)
const API_CACHED_PATHS = ['/api/products', '/api/categories', '/api/merchants']
registerRoute(
  ({ url }) => API_CACHED_PATHS.some(
    (path) => url.pathname === path || url.pathname.startsWith(`${path}/`)
  ),
  new NetworkFirst({
    cacheName: 'api-cache',
    networkTimeoutSeconds: 10,
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 24 * 60 * 60,
        purgeOnQuotaError: true
      })
    ]
  })
)

// Fallback hors ligne pour les navigations (équivalent de l'ancien offline.html)
setCatchHandler(async ({ request }) => {
  if (request.destination === 'document') {
    const fallback = await matchPrecache('/offline.html')
    if (fallback) {
      return fallback
    }
  }
  return Response.error()
})

// Background sync for form submissions
self.addEventListener('sync', (event) => {
  if (event.tag === 'form-submission') {
    event.waitUntil(handleFormSubmission())
  }
})

async function handleFormSubmission() {
  // Handle offline form submissions
  // This would sync with IndexedDB stored submissions
  console.log('Syncing offline form submissions...')
}

// Push notification handler
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json()

    const options = {
      body: data.body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      vibrate: [200, 100, 200],
      data: {
        url: data.url || '/'
      },
      actions: [
        {
          action: 'view',
          title: 'Voir',
          icon: '/icons/view.png'
        },
        {
          action: 'dismiss',
          title: 'Ignorer',
          icon: '/icons/dismiss.png'
        }
      ]
    }

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    )
  }
})

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  if (event.action === 'view') {
    const url = event.notification.data.url
    event.waitUntil(
      self.clients.openWindow(url)
    )
  }
})
