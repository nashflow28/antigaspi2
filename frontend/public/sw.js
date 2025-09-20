// Service Worker pour Antigaspi PWA
// Version du cache - incrémenter pour forcer la mise à jour
const CACHE_VERSION = 'v1.1.0'
const STATIC_CACHE = `antigaspi-static-${CACHE_VERSION}`
const DYNAMIC_CACHE = `antigaspi-dynamic-${CACHE_VERSION}`
const API_CACHE = `antigaspi-api-${CACHE_VERSION}`

// Ressources à mettre en cache lors de l'installation
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html',
  // Assets critiques
  '/src/assets/css/main.css',
  '/src/assets/animations.css',
  // Pages principales
  '/products',
  '/merchants/map',
  '/reviews',
  '/surprise-baskets',
  '/offline-surprise-basket.html',
  '/login',
  '/register',
  // Icons
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/favicon.ico'
]

// URLs d'API à mettre en cache
const API_ROUTES = [
  '/api/products',
  '/api/categories',
  '/api/merchants',
  '/api/surprise-baskets'
]

// Stratégies de cache
const CACHE_STRATEGIES = {
  CACHE_FIRST: 'cache-first',
  NETWORK_FIRST: 'network-first',
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate',
  NETWORK_ONLY: 'network-only',
  CACHE_ONLY: 'cache-only'
}

// Configuration des routes et leurs stratégies
const ROUTE_CONFIG = {
  // Assets statiques - Cache First
  '/src/assets/': CACHE_STRATEGIES.CACHE_FIRST,
  '/icons/': CACHE_STRATEGIES.CACHE_FIRST,
  '/fonts/': CACHE_STRATEGIES.CACHE_FIRST,

  // Pages HTML - Network First avec fallback cache
  '/': CACHE_STRATEGIES.NETWORK_FIRST,
  '/surprise-baskets': CACHE_STRATEGIES.NETWORK_FIRST,

  // API - Stale While Revalidate pour les données
  '/api/products': CACHE_STRATEGIES.STALE_WHILE_REVALIDATE,
  '/api/categories': CACHE_STRATEGIES.STALE_WHILE_REVALIDATE,
  '/api/merchants': CACHE_STRATEGIES.STALE_WHILE_REVALIDATE,
  '/api/surprise-baskets': CACHE_STRATEGIES.STALE_WHILE_REVALIDATE,

  // API critiques - Network First
  '/api/auth': CACHE_STRATEGIES.NETWORK_FIRST,
  '/api/reservations': CACHE_STRATEGIES.NETWORK_FIRST
}

// Installation du Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker...', CACHE_VERSION)

  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static assets')
        return cache.addAll(STATIC_ASSETS)
      })
      .then(() => {
        console.log('[SW] Static assets cached successfully')
        return self.skipWaiting()
      })
      .catch((error) => {
        console.error('[SW] Failed to cache static assets:', error)
      })
  )
})

// Activation du Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker...', CACHE_VERSION)

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // Supprimer les anciens caches
            if (cacheName !== STATIC_CACHE &&
                cacheName !== DYNAMIC_CACHE &&
                cacheName !== API_CACHE) {
              console.log('[SW] Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => {
        console.log('[SW] Service Worker activated successfully')
        return self.clients.claim()
      })
      .catch((error) => {
        console.error('[SW] Activation failed:', error)
      })
  )
})

// Interception des requêtes
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Ignorer les requêtes non-GET
  if (request.method !== 'GET') {
    return
  }

  // Ignorer les requêtes vers d'autres domaines (sauf API)
  if (url.origin !== location.origin && !url.pathname.startsWith('/api')) {
    return
  }

  event.respondWith(handleRequest(request))
})

// Gestionnaire principal des requêtes
async function handleRequest(request) {
  const url = new URL(request.url)
  const strategy = getStrategyForRoute(url.pathname)

  try {
    switch (strategy) {
      case CACHE_STRATEGIES.CACHE_FIRST:
        return await cacheFirstStrategy(request)

      case CACHE_STRATEGIES.NETWORK_FIRST:
        return await networkFirstStrategy(request)

      case CACHE_STRATEGIES.STALE_WHILE_REVALIDATE:
        return await staleWhileRevalidateStrategy(request)

      case CACHE_STRATEGIES.NETWORK_ONLY:
        return await fetch(request)

      case CACHE_STRATEGIES.CACHE_ONLY:
        return await cacheOnlyStrategy(request)

      default:
        return await networkFirstStrategy(request)
    }
  } catch (error) {
    console.error('[SW] Request handling failed:', error)
    return await getOfflineFallback(request)
  }
}

// Stratégie Cache First
async function cacheFirstStrategy(request) {
  const cachedResponse = await caches.match(request)

  if (cachedResponse) {
    return cachedResponse
  }

  const networkResponse = await fetch(request)

  if (networkResponse.ok) {
    const cache = await caches.open(STATIC_CACHE)
    cache.put(request, networkResponse.clone())
  }

  return networkResponse
}

// Stratégie Network First
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request)

    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE)
      cache.put(request, networkResponse.clone())
    }

    return networkResponse
  } catch (error) {
    const cachedResponse = await caches.match(request)

    if (cachedResponse) {
      return cachedResponse
    }

    throw error
  }
}

// Stratégie Stale While Revalidate
async function staleWhileRevalidateStrategy(request) {
  const cache = await caches.open(API_CACHE)
  const cachedResponse = await cache.match(request)

  // Lancer la requête réseau en arrière-plan
  const networkPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone())
      }
      return networkResponse
    })
    .catch((error) => {
      console.warn('[SW] Network request failed:', error)
    })

  // Retourner immédiatement la réponse en cache si disponible
  if (cachedResponse) {
    return cachedResponse
  }

  // Sinon, attendre la réponse réseau
  return await networkPromise
}

// Stratégie Cache Only
async function cacheOnlyStrategy(request) {
  const cachedResponse = await caches.match(request)

  if (!cachedResponse) {
    throw new Error('Resource not found in cache')
  }

  return cachedResponse
}

// Détermine la stratégie pour une route donnée
function getStrategyForRoute(pathname) {
  for (const [route, strategy] of Object.entries(ROUTE_CONFIG)) {
    if (pathname.startsWith(route)) {
      return strategy
    }
  }

  return CACHE_STRATEGIES.NETWORK_FIRST
}

// Fallback pour les requêtes hors ligne
async function getOfflineFallback(request) {
  const url = new URL(request.url)

  // Pour les pages HTML, retourner la page offline
  if (request.headers.get('accept')?.includes('text/html')) {
    if (url.pathname.startsWith('/surprise-baskets')) {
      const surpriseOffline = await caches.match('/offline-surprise-basket.html')
      if (surpriseOffline) {
        return surpriseOffline
      }
    }

    const offlinePage = await caches.match('/offline.html')
    return offlinePage || new Response('Offline', { status: 503 })
  }

  // Pour les API, retourner une réponse JSON d'erreur
  if (url.pathname.startsWith('/api')) {
    return new Response(JSON.stringify({
      error: 'Service unavailable',
      message: 'This feature requires an internet connection',
      offline: true
    }), {
      status: 503,
      headers: {
        'Content-Type': 'application/json',
      }
    })
  }

  // Pour les autres ressources, réponse générique
  return new Response('Resource not available offline', { status: 503 })
}

// Gestion des messages du client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type) {
    switch (event.data.type) {
      case 'SKIP_WAITING':
        self.skipWaiting()
        break

      case 'CACHE_URLS':
        cacheUrls(event.data.urls)
        break

      case 'CLEAR_CACHE':
        clearAllCaches()
        break

      case 'GET_CACHE_STATUS':
        getCacheStatus().then(status => {
          event.ports[0]?.postMessage(status)
        })
        break
    }
  }
})

// Cache des URLs spécifiques
async function cacheUrls(urls) {
  const cache = await caches.open(DYNAMIC_CACHE)

  for (const url of urls) {
    try {
      const response = await fetch(url)
      if (response.ok) {
        await cache.put(url, response)
      }
    } catch (error) {
      console.warn('[SW] Failed to cache URL:', url, error)
    }
  }
}

// Nettoyer tous les caches
async function clearAllCaches() {
  const cacheNames = await caches.keys()

  await Promise.all(
    cacheNames.map(cacheName => caches.delete(cacheName))
  )

  console.log('[SW] All caches cleared')
}

// Obtenir le statut du cache
async function getCacheStatus() {
  const cacheNames = await caches.keys()
  const status = {
    version: CACHE_VERSION,
    caches: []
  }

  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName)
    const keys = await cache.keys()

    status.caches.push({
      name: cacheName,
      size: keys.length,
      urls: keys.map(key => key.url)
    })
  }

  return status
}

// Gestion de la synchronisation en arrière-plan
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag)

  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync())
  }
})

// Synchronisation en arrière-plan
async function doBackgroundSync() {
  console.log('[SW] Performing background sync...')

  // Synchroniser les données critiques
  const criticalUrls = ['/api/products', '/api/categories']

  for (const url of criticalUrls) {
    try {
      const response = await fetch(url)
      if (response.ok) {
        const cache = await caches.open(API_CACHE)
        await cache.put(url, response.clone())
        console.log('[SW] Synced:', url)
      }
    } catch (error) {
      console.warn('[SW] Sync failed for:', url, error)
    }
  }
}

// Notifications push
self.addEventListener('push', (event) => {
  if (!event.data) {
    return
  }

  let payload

  try {
    payload = event.data.json()
  } catch (error) {
    console.warn('[SW] Failed to parse push payload as JSON', error)
    payload = { title: 'Antigaspi', body: event.data.text() }
  }

  const title = payload.title || 'Antigaspi'
  const options = {
    body: payload.body || 'Nouvelle notification',
    data: payload.data || {},
    icon: payload.icon || '/icons/icon-192.png',
    badge: payload.badge || '/icons/icon-192.png',
    vibrate: [100, 50, 100],
    actions: payload.actions || []
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const targetUrl = event.notification.data?.url || '/'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus()
          client.postMessage({ type: 'PUSH_NOTIFICATION_CLICKED', data: event.notification.data })
          return
        }
      }

      if (clients.openWindow) {
        return clients.openWindow(targetUrl)
      }
    })
  )
})

console.log('[SW] Service Worker loaded successfully', CACHE_VERSION)