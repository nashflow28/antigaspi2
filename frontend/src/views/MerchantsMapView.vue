<template>
  <div class="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100">
    <!-- Header -->
    <div class="bg-white/80 backdrop-blur-sm border-b border-neutral-200 sticky top-0 z-10">
      <div class="container mx-auto px-4 py-6">
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 class="text-3xl font-bold text-neutral-900">Carte des commerçants</h1>
            <p class="text-neutral-600 mt-1">
              {{ merchantsLoading ? 'Chargement...' : `${merchantsWithLocation.length} commerçant${merchantsWithLocation.length > 1 ? 's' : ''} référencé${merchantsWithLocation.length > 1 ? 's' : ''}` }}
            </p>
          </div>

          <!-- Location Controls -->
          <div class="flex flex-col sm:flex-row gap-3">
            <button
              :disabled="geoLoading"
              class="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              @click="getCurrentLocation"
            >
              <MapPin class="w-4 h-4 mr-2" :class="{ 'animate-pulse': geoLoading }" />
              {{ geoLoading ? 'Localisation...' : (position ? 'Position activée' : 'Me localiser') }}
            </button>
            <button
              :disabled="merchantsLoading"
              class="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              @click="refreshMerchants"
            >
              <RefreshCw class="w-4 h-4 mr-2" :class="{ 'animate-spin': merchantsLoading }" />
              Actualiser
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Map Container -->
    <div class="container mx-auto px-4 py-8">
      <div class="bg-white rounded-2xl shadow-lg p-6">
        <div
          ref="mapContainer"
          class="w-full rounded-lg border border-gray-300 map-container"
          style="height: 600px;"
        >
          <!-- Map will be loaded here -->
        </div>

        <!-- Loading overlay -->
        <div v-if="merchantsLoading" class="absolute inset-6 bg-white/80 rounded-lg flex items-center justify-center">
          <div class="text-center">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
            <p class="text-gray-600">Chargement des commerçants...</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Merchant Details Modal -->
    <div v-if="selectedMerchant" class="fixed inset-0 z-[9999] overflow-y-auto">
      <!-- Backdrop -->
      <div
        class="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity"
        @click="selectedMerchant = null"
      />

      <!-- Modal -->
      <div class="flex min-h-full items-center justify-center p-4">
        <div
          class="relative w-full max-w-lg bg-white rounded-2xl shadow-xl transform transition-all"
          @click.stop
        >
          <!-- Header -->
          <div class="px-6 py-4 border-b border-gray-200">
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold text-gray-900">{{ selectedMerchant.business_name }}</h3>
              <button
                class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                @click="selectedMerchant = null"
              >
                <X class="w-5 h-5 text-gray-400" />
              </button>
            </div>
          </div>

          <!-- Content -->
          <div class="px-6 py-6 space-y-4">
            <div class="flex items-center space-x-3 text-gray-600">
              <Building class="w-5 h-5" />
              <span>{{ selectedMerchant.business_type }}</span>
            </div>

            <div class="flex items-center space-x-3 text-gray-600">
              <MapPin class="w-5 h-5" />
              <span>{{ selectedMerchant.user?.address || selectedMerchant.user?.city || selectedMerchant.city }}</span>
            </div>

            <div v-if="selectedMerchant.distance_km" class="flex items-center space-x-3 text-gray-600">
              <Navigation class="w-5 h-5" />
              <span>{{ selectedMerchant.distance_km.toFixed(1) }} km de votre position</span>
            </div>

            <div class="flex items-center space-x-3 text-gray-600">
              <Phone class="w-5 h-5" />
              <span>{{ selectedMerchant.user?.phone || 'Non renseigné' }}</span>
            </div>

            <div class="bg-green-50 rounded-lg p-4">
              <div class="flex items-center space-x-2 text-green-700 mb-2">
                <Package class="w-5 h-5" />
                <span class="font-medium">{{ selectedMerchant.products_count ?? 0 }} produit(s) disponible(s)</span>
              </div>
              <p class="text-green-600 text-sm">
                Commerçant vérifié ✓
              </p>
            </div>
          </div>

          <!-- Actions -->
          <div class="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
            <button
              class="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium transition-colors"
              @click="viewMerchantProducts"
            >
              Voir les produits
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, nextTick, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { MapPin, RefreshCw, X, Building, Navigation, Phone, Package } from 'lucide-vue-next'
import { notify } from '@/composables/useNotifications'
import useGeolocation from '@/composables/useGeolocation'
import { storeToRefs } from 'pinia'
import { useMerchantsStore, type MerchantWithLocation } from '@/stores/merchants'
import 'leaflet/dist/leaflet.css'

const router = useRouter()

// Composables
const { position, getCurrentPosition, isLoading: geoLoading } = useGeolocation()
const merchantsStore = useMerchantsStore()
const { merchants, loading: merchantsLoading } = storeToRefs(merchantsStore)

// State
const merchantsWithLocation = computed(() => merchants.value.filter(merchant => merchant.latitude !== null && merchant.longitude !== null))
const selectedMerchant = ref<MerchantWithLocation | null>(null)

// Map references
const mapContainer = ref<HTMLElement | null>(null)
let map: any = null
let userMarker: any = null
const merchantMarkers: any[] = []
const mapInitialized = ref(false)

// Methods
const initializeMap = async () => {
  if (!mapContainer.value) return

  try {
    // Import Leaflet
    const L = await import('leaflet')

    // Initialize map centered on Lomé, Togo
    const defaultCenter = [6.1319, 1.2228]
    map = L.map(mapContainer.value).setView(defaultCenter, 12)

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map)

  } catch (error) {
    notify.error('Erreur lors de l\'initialisation de la carte')
  }
}

const addMerchantMarkers = async () => {
  if (!map || merchantsWithLocation.value.length === 0) return

  try {
    const L = await import('leaflet')

    // Clear existing markers
    clearMerchantMarkers()

    // Create custom merchant icon
    const merchantIcon = L.divIcon({
      html: '🏪',
      className: 'merchant-icon',
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    })

    // Add markers for each merchant
    merchantsWithLocation.value.forEach(merchant => {
      const marker = L.marker([merchant.latitude, merchant.longitude], {
        icon: merchantIcon
      }).addTo(map)

      // Add popup with merchant info
      const popup = L.popup().setContent(`
        <div class="p-3">
          <h4 class="font-bold text-gray-900 mb-2">${merchant.business_name}</h4>
          <p class="text-sm text-gray-600 mb-1">${merchant.business_type}</p>
          <p class="text-sm text-gray-600 mb-2">${merchant.products_count} produit(s) disponible(s)</p>
          <div class="mt-3 text-center">
            <button id="details-btn-${merchant.id}" class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors">
              Voir les détails
            </button>
          </div>
        </div>
      `)

      marker.bindPopup(popup)

      // Handle popup open event to attach button listener
      marker.on('popupopen', () => {
        setTimeout(() => {
          const button = document.getElementById(`details-btn-${merchant.id}`)
          if (button) {
            button.addEventListener('click', (e) => {
              e.preventDefault()
              e.stopPropagation()
              selectedMerchant.value = merchant
              marker.closePopup() // Close the popup when opening modal
            })
          }
        }, 50)
      })

      merchantMarkers.push(marker)
    })

    // Adjust map view to show all merchants
    if (merchantMarkers.length > 0) {
      setTimeout(() => {
        try {
          const group = L.featureGroup(merchantMarkers)
          const bounds = group.getBounds()
          map.fitBounds(bounds.pad(0.1))

          // Fallback: set a reasonable zoom level if bounds are too wide
          setTimeout(() => {
            const currentZoom = map.getZoom()
            if (currentZoom < 6) {
              const centerLat = (bounds.getNorth() + bounds.getSouth()) / 2
              const centerLng = (bounds.getEast() + bounds.getWest()) / 2
              map.setView([centerLat, centerLng], 6)
            }
          }, 300)
        } catch (error) {
          notify.error('Erreur lors de l\'ajustement de la vue de la carte')
        }
      }, 100)
    }
  } catch (error) {
    notify.error('Erreur lors de l\'affichage des commerçants sur la carte')
  }
}

const clearMerchantMarkers = () => {
  merchantMarkers.forEach(marker => {
    map.removeLayer(marker)
  })
  merchantMarkers.length = 0
}

const addUserLocationMarker = async () => {
  if (!map || !position.value) return

  try {
    const L = await import('leaflet')

    // Remove existing user marker
    if (userMarker) {
      map.removeLayer(userMarker)
    }

    // Create user location icon
    const userIcon = L.divIcon({
      html: '<div class="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-lg animate-pulse">📍</div>',
      className: 'custom-div-icon',
      iconSize: [24, 24],
      iconAnchor: [12, 24]
    })

    // Add user location marker
    userMarker = L.marker([position.value.latitude, position.value.longitude], {
      icon: userIcon
    }).addTo(map)

    userMarker.bindPopup('<div class="p-2"><strong>Votre position</strong></div>')

    // Center map on user location
    map.setView([position.value.latitude, position.value.longitude], 14)
  } catch (error) {
    notify.error('Impossible d\'afficher votre position sur la carte')
  }
}

const getCurrentLocation = async () => {
  try {
    const coords = await getCurrentPosition()
    if (coords) {
      // Add user marker to map
      await addUserLocationMarker()
    }
  } catch (error) {
    notify.error(error.message, 'Erreur de géolocalisation')
  }
}

const refreshMerchants = async () => {
  const result = await merchantsStore.fetchMerchants({ withLocation: true, force: true })
  if (result.success) {
    await addMerchantMarkers()
  }
}

const viewMerchantProducts = () => {
  if (selectedMerchant.value) {
    // For now, redirect to products view with merchant filter
    // This could be enhanced with a merchant-specific route
    router.push('/products')
    selectedMerchant.value = null
  }
}


watch(merchantsWithLocation, async () => {
  if (!mapInitialized.value) {
    return
  }
  await addMerchantMarkers()
})

// Cleanup on unmount
onUnmounted(() => {
  if (map) {
    map.remove()
    map = null
  }
  userMarker = null
  merchantMarkers.length = 0
})

// Initialize everything on mount with lazy loading
onMounted(async () => {
  await nextTick()

  // Initialize map with a small delay for better UX
  setTimeout(async () => {
    await initializeMap()
    mapInitialized.value = true
    if (merchantsWithLocation.value.length) {
      await addMerchantMarkers()
    }
  }, 100)

  // Fetch merchants data
  const result = await merchantsStore.fetchMerchants({ withLocation: true })
  if (result.success) {
    await addMerchantMarkers()
  }
})
</script>

<style scoped>
/* Temporarily removed all z-index overrides to debug marker visibility */
/* Navigation et modales doivent être au-dessus */
.navbar,
.nav-menu {
  z-index: 100 !important;
}

/* Dropdowns et menus déroulants */
:deep(.dropdown-menu),
:deep(.menu-dropdown),
:deep(select),
:deep(.select-dropdown) {
  z-index: 200 !important;
}

/* Modales et overlays critiques */
.modal,
.overlay,
.notification {
  z-index: 9999 !important;
}

/* Merchant icon styling - Simple and clean */
:deep(.merchant-icon) {
  background: #2563eb;
  color: white;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  border: 2px solid white;
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
}

/* Leaflet popup z-index fixes - Force visibility */
:deep(.leaflet-popup-pane) {
  z-index: 1000 !important;
  position: relative !important;
}

:deep(.leaflet-popup) {
  z-index: 1001 !important;
  display: block !important;
  visibility: visible !important;
  opacity: 1 !important;
}

:deep(.leaflet-popup-content-wrapper) {
  z-index: 1002 !important;
  display: block !important;
  visibility: visible !important;
  opacity: 1 !important;
  background: white !important;
  border: 1px solid #ccc !important;
  border-radius: 8px !important;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3) !important;
  max-width: 300px !important;
}

:deep(.leaflet-popup-content) {
  margin: 0 !important;
  padding: 0 !important;
  display: block !important;
  visibility: visible !important;
}

:deep(.leaflet-popup-tip) {
  z-index: 1003 !important;
  display: block !important;
  visibility: visible !important;
}
</style>
