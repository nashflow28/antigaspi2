<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
    <!-- Header -->
    <div class="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
      <div class="container px-3 sm:px-4 lg:px-6 mx-auto px-3 py-6">
        <div class="flex flex-col lg:flex-row lg:items-center justify-start sm:justify-between gap-3">
          <div>
            <h1 class="text-xl font-semibold text-gray-900">Carte des commerçants</h1>
            <p class="text-gray-700 mt-1">
              {{ merchantsLoading ? 'Chargement...' : `${merchantsWithLocation.length} commerçant${merchantsWithLocation.length > 1 ? 's' : ''} référencé${merchantsWithLocation.length > 1 ? 's' : ''}` }}
            </p>
          </div>

          <!-- Location Controls -->
          <div class="flex flex-col sm:flex-row gap-3">
            <button
              :disabled="geoLoading"
              class="inline-flex items-center px-3 py-3 text-sm font-medium text-gray-800 bg-white border border-gray-300 rounded hover:transition-colors"
              @click="getCurrentLocation"
            >
              <MapPin class="w-4 h-4 mr-2" :class="{ 'animate-pulse': geoLoading }" />
              {{ geoLoading ? 'Localisation...' : (position ? 'Position activée' : 'Me localiser') }}
            </button>
            <button
              :disabled="merchantsLoading"
              class="inline-flex items-center px-3 py-3 text-sm font-medium text-white bg-blue-600 rounded hover:transition-colors disabled:opacity-50"
              @click="refreshMerchants"
            >
              <RefreshCw class="w-4 h-4 mr-2" :class="{ 'animate-spin': merchantsLoading }" />
              Actualiser
            </button>
          </div>
        </div>

        <!-- Search and Filters -->
        <div class="mt-4 flex flex-col lg:flex-row gap-4">
          <!-- Search -->
          <div class="relative flex-1">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Rechercher un commerçant..."
              class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              @input="handleSearch"
            />
          </div>

          <!-- Category Filter -->
          <select
            v-model="selectedCategory"
            class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            @change="filterMerchants"
          >
            <option value="">Toutes les catégories</option>
            <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
          </select>

          <!-- Distance Filter -->
          <select
            v-model="maxDistance"
            class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            :disabled="!position"
            @change="filterMerchants"
          >
            <option :value="null">Distance illimitée</option>
            <option :value="1">Moins de 1 km</option>
            <option :value="2">Moins de 2 km</option>
            <option :value="5">Moins de 5 km</option>
            <option :value="10">Moins de 10 km</option>
          </select>

          <!-- View Toggle -->
          <div class="flex rounded-lg border border-gray-300 overflow-hidden">
            <button
              :class="[
                'px-4 py-2 text-sm font-medium',
                viewMode === 'map' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
              ]"
              @click="viewMode = 'map'"
            >
              <Map class="w-4 h-4 inline mr-1" />
              Carte
            </button>
            <button
              :class="[
                'px-4 py-2 text-sm font-medium',
                viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
              ]"
              @click="viewMode = 'list'"
            >
              <List class="w-4 h-4 inline mr-1" />
              Liste
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Map Container -->
    <div class="container px-3 sm:px-4 lg:px-6 mx-auto px-3 py-6 sm:py-8">
      <!-- Map View -->
      <div v-if="viewMode === 'map'" class="bg-white rounded shadow-lg p-6">
        <div
          ref="mapContainer"
          class="w-full rounded border border-gray-300 map-container px-3 sm:px-4 lg:px-6"
          style="height: 600px;"
        >
          <!-- Map will be loaded here -->
        </div>

        <!-- Loading overlay -->
        <div v-if="merchantsLoading" class="relative sm:absolute inset-6 bg-white/80 rounded flex items-center justify-center">
          <div class="text-left sm:text-center">
            <div class="animate-spin rounded-full w-5 h-5 border-b-2 border-blue-600 mx-auto mt-3" />
            <p class="text-gray-700">Chargement des commerçants...</p>
          </div>
        </div>
      </div>

      <!-- List View -->
      <div v-else class="space-y-4">
        <div v-if="merchantsLoading" class="flex justify-center py-12">
          <div class="animate-spin rounded-full w-8 h-8 border-b-2 border-blue-600" />
        </div>

        <div v-else-if="filteredMerchants.length === 0" class="text-center py-12 bg-white rounded shadow-lg">
          <MapPin class="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 class="text-lg font-medium text-gray-900">Aucun commerçant trouvé</h3>
          <p class="text-gray-600 mt-2">Essayez de modifier vos critères de recherche</p>
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="merchant in filteredMerchants"
            :key="merchant.id"
            class="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
            @click="selectedMerchant = merchant"
          >
            <!-- Merchant Image/Avatar -->
            <div class="h-32 bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <Building class="w-16 h-16 text-white/80" />
            </div>

            <!-- Merchant Info -->
            <div class="p-4">
              <h3 class="font-semibold text-gray-900 text-lg">{{ merchant.business_name }}</h3>
              <p class="text-sm text-gray-600 mt-1">{{ merchant.business_type }}</p>

              <div class="flex items-center gap-2 mt-3 text-sm text-gray-500">
                <MapPin class="w-4 h-4" />
                <span>{{ merchant.user?.city || merchant.city || 'Lomé' }}</span>
              </div>

              <div v-if="merchant.distance_km && position" class="flex items-center gap-2 mt-2 text-sm text-blue-600">
                <Navigation class="w-4 h-4" />
                <span>{{ merchant.distance_km.toFixed(1) }} km</span>
              </div>

              <div class="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                <div class="flex items-center gap-2 text-sm text-green-600">
                  <Package class="w-4 h-4" />
                  <span>{{ merchant.products_count ?? 0 }} produits</span>
                </div>
                <button
                  class="text-sm font-medium text-blue-600 hover:text-blue-700"
                  @click.stop="viewMerchantDetail(merchant)"
                >
                  Voir →
                </button>
              </div>
            </div>
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
      <div class="flex min-h-screen items-center justify-center p-4">
        <div
          class="relative w-full max-w-xl bg-white rounded shadow-xl transform transition-all"
          @click.stop
        >
          <!-- Header -->
          <div class="px-6 py-4 border-b border-gray-200">
            <div class="flex items-center justify-start sm:justify-between">
              <h3 class="text-lg font-semibold text-gray-900">{{ selectedMerchant.business_name }}</h3>
              <button
                class="p-2 hover:transition-colors"
                @click="selectedMerchant = null"
              >
                <X class="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>

          <!-- Content -->
          <div class="px-6 py-6 space-y-4">
            <div class="flex items-center space-y-2 sm:space-x-3 text-gray-700">
              <Building class="w-4 h-4" />
              <span>{{ selectedMerchant.business_type }}</span>
            </div>

            <div class="flex items-center space-y-2 sm:space-x-3 text-gray-700">
              <MapPin class="w-4 h-4" />
              <span>{{ selectedMerchant.user?.address || selectedMerchant.user?.city || selectedMerchant.city }}</span>
            </div>

            <div v-if="selectedMerchant.distance_km" class="flex items-center space-y-2 sm:space-x-3 text-gray-700">
              <Navigation class="w-4 h-4" />
              <span>{{ selectedMerchant.distance_km.toFixed(1) }} km de votre position</span>
            </div>

            <div class="flex items-center space-y-2 sm:space-x-3 text-gray-700">
              <Phone class="w-4 h-4" />
              <span>{{ selectedMerchant.user?.phone || 'Non renseigné' }}</span>
            </div>

            <div class="bg-green-50 rounded p-4">
              <div class="flex items-center space-y-4 sm:space-x-2 text-green-700 mt-2">
                <Package class="w-4 h-4" />
                <span class="font-medium">{{ selectedMerchant.products_count ?? 0 }} produit(s) disponible(s)</span>
              </div>
              <p class="text-green-600 text-sm">
                Commerçant vérifié ✓
              </p>
            </div>
          </div>

          <!-- Actions -->
          <div class="px-6 py-4 border-t border-gray-200 flex justify-center sm:justify-end space-y-2 sm:space-x-3">
            <button
              class="px-6 py-3 bg-blue-600 text-white rounded hover:transition-colors"
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
import { MapPin, RefreshCw, X, Building, Navigation, Phone, Package, Search, Map, List } from 'lucide-vue-next'
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

// View mode and filters
const viewMode = ref<'map' | 'list'>('map')
const searchQuery = ref('')
const selectedCategory = ref('')
const maxDistance = ref<number | null>(null)
let searchTimeout: ReturnType<typeof setTimeout> | null = null

// Categories derived from merchants
const categories = computed(() => {
  const types = new Set(merchants.value.map(m => m.business_type).filter(Boolean))
  return Array.from(types).sort()
})

// State
const merchantsWithLocation = computed(() => merchants.value.filter(merchant => merchant.latitude !== null && merchant.longitude !== null))
const selectedMerchant = ref<MerchantWithLocation | null>(null)

// Filtered merchants based on search and filters
const filteredMerchants = computed(() => {
  let result = merchantsWithLocation.value

  // Search filter
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(m =>
      m.business_name?.toLowerCase().includes(query) ||
      m.business_type?.toLowerCase().includes(query) ||
      m.user?.city?.toLowerCase().includes(query)
    )
  }

  // Category filter
  if (selectedCategory.value) {
    result = result.filter(m => m.business_type === selectedCategory.value)
  }

  // Distance filter (requires user location)
  if (maxDistance.value && position.value) {
    result = result.filter(m => {
      if (!m.distance_km && m.latitude && m.longitude) {
        // Calculate distance if not already done
        m.distance_km = calculateDistance(
          position.value!.latitude,
          position.value!.longitude,
          m.latitude,
          m.longitude
        )
      }
      return m.distance_km !== undefined && m.distance_km !== null && m.distance_km <= maxDistance.value!
    })
  }

  // Sort by distance if user location is available
  if (position.value) {
    result = [...result].sort((a, b) => {
      const distA = a.distance_km ?? Infinity
      const distB = b.distance_km ?? Infinity
      return distA - distB
    })
  }

  return result
})

// Haversine formula to calculate distance
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371 // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// Debounced search handler
const handleSearch = () => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  searchTimeout = setTimeout(() => {
    filterMerchants()
  }, 300)
}

// Filter merchants and update map markers
const filterMerchants = () => {
  if (viewMode.value === 'map') {
    addMerchantMarkers()
  }
}

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
    const defaultCenter: [number, number] = [6.1319, 1.2228]
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
  if (!map || filteredMerchants.value.length === 0) return

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

    // Add markers for each filtered merchant
    filteredMerchants.value.forEach(merchant => {
      // Skip merchants without coordinates
      if (merchant.latitude === null || merchant.longitude === null) return

      const marker = L.marker([merchant.latitude, merchant.longitude], {
        icon: merchantIcon
      }).addTo(map)

      // Add popup with merchant info
      const popup = L.popup().setContent(`
        <div class="p-3">
          <h4 class="font-semibold text-gray-900 mt-2">${merchant.business_name}</h4>
          <p class="text-sm text-gray-700 mb-1">${merchant.business_type}</p>
          <p class="text-sm text-gray-700 mt-2">${merchant.products_count} produit(s) disponible(s)</p>
          <div class="mt-3 text-left sm:text-center">
            <button id="details-btn-${merchant.id}" class="bg-blue-600 text-white px-6 py-3 rounded text-sm hover:transition-colors">
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
      html: '<div class="bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center shadow-lg animate-pulse">📍</div>',
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
    const message = error instanceof Error ? error.message : 'Erreur inconnue'
    notify.error(message, 'Erreur de géolocalisation')
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
    // Redirect to merchant detail page
    router.push(`/merchants/${selectedMerchant.value.id}`)
    selectedMerchant.value = null
  }
}

const viewMerchantDetail = (merchant: MerchantWithLocation) => {
  router.push(`/merchants/${merchant.id}`)
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
