<template>
  <div class="location-picker">
    <!-- Search Header -->
    <div class="mt-3">
      <AddressSearch
        ref="addressSearch"
        :placeholder="searchPlaceholder"
        :enable-user-location="enableUserLocation"
        :country-code="countryCode"
        @select="handleAddressSelect"
        @clear="handleAddressClear"
        @error="handleSearchError"
      />
    </div>

    <!-- Map Container -->
    <div class="relative">
      <div
        ref="mapContainer"
        :class="[
          'w-full border border-gray-300 rounded overflow-hidden sm:block',
          heightClass
        ]"
        :style="{ height: mapHeight }"
      >
        <!-- Map will be rendered here -->
      </div>

      <!-- Loading Overlay -->
      <div
        v-if="mapLoading"
        class="relative sm:absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center rounded"
      >
        <div class="text-left sm:text-center">
          <div class="animate-spin rounded-full w-6 h-6 border-b-2 border-blue-600 mx-auto mt-2" />
          <p class="text-sm text-gray-700">Chargement de la carte...</p>
        </div>
      </div>

      <!-- Map Controls -->
      <div class="relative sm:absolute top-4 right-4 flex flex-col space-y-4">
        <!-- User Location Button -->
        <button
          v-if="enableUserLocation"
          :disabled="geoLoading"
          class="bg-white hover:transition-colors"
          title="Me localiser"
          @click="getCurrentLocation"
        >
          <MapPin class="w-4 h-4 text-gray-800" :class="{ 'animate-pulse': geoLoading }" />
        </button>

        <!-- Reset View Button -->
        <button
          v-if="selectedLocation"
          class="bg-white hover:transition-colors"
          title="Réinitialiser la vue"
          @click="resetMapView"
        >
          <RotateCcw class="w-4 h-4 text-gray-800" />
        </button>

        <!-- Fullscreen Toggle -->
        <button
          class="bg-white hover:transition-colors"
          :title="isFullscreen ? 'Quitter le plein écran' : 'Plein écran'"
          @click="toggleFullscreen"
        >
          <Minimize v-if="isFullscreen" class="w-4 h-4 text-gray-800" />
          <Maximize v-else class="w-4 h-4 text-gray-800" />
        </button>
      </div>

      <!-- Map Instructions -->
      <div
        v-if="!selectedLocation && showInstructions"
        class="relative sm:absolute bottom-4 left-4 right-4 bg-white bg-opacity-95 backdrop-blur-sm border border-gray-200 rounded p-3 shadow-sm"
      >
        <div class="flex items-stretch sm:items-start space-y-4 sm:space-x-2">
          <Info class="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
          <div class="text-sm text-gray-800">
            <p class="font-medium mb-1">Sélectionner un emplacement</p>
            <p class="text-xs text-gray-700">
              Cliquez sur la carte ou utilisez la recherche pour choisir votre adresse
            </p>
          </div>
          <button
            class="ml-auto p-1 hover:transition-colors"
            @click="showInstructions = false"
          >
            <X class="w-3 h-3 text-gray-400" />
          </button>
        </div>
      </div>
    </div>

    <!-- Selected Location Info -->
    <div v-if="selectedLocation" class="mt-4 p-4 bg-green-50 border border-blue-200 rounded">
      <div class="flex items-stretch sm:items-start justify-start sm:justify-between">
        <div class="flex items-stretch sm:items-start space-y-2 sm:space-x-3">
          <div class="p-2 bg-green-100 rounded">
            <MapPin class="w-4 h-4 text-green-600" />
          </div>
          <div class="flex-1">
            <h4 class="font-medium text-blue-900 mb-1">Emplacement sélectionné</h4>
            <p class="text-sm text-green-700 mt-2">
              {{ selectedLocation.display_name || selectedLocation.formatted_address }}
            </p>
            <div class="flex items-center space-y-4 sm:space-x-4 text-xs text-green-600">
              <span>{{ selectedLocation.lat.toFixed(6) }}, {{ selectedLocation.lng.toFixed(6) }}</span>
              <span v-if="selectedLocation.distance">
                {{ formatDistance(selectedLocation.distance) }} de votre position
              </span>
            </div>
          </div>
        </div>
        <button
          class="p-1 hover:transition-colors"
          title="Effacer la sélection"
          @click="clearSelection"
        >
          <X class="w-4 h-4 text-green-500" />
        </button>
      </div>
    </div>

    <!-- Action Buttons -->
    <div v-if="showActions" class="mt-4 flex justify-center sm:justify-end space-y-2 sm:space-x-3">
      <button
        v-if="allowClear"
        class="px-3 py-3 text-gray-800 bg-gray-100 hover:transition-colors"
        @click="clearSelection"
      >
        Effacer
      </button>
      <button
        :disabled="!selectedLocation"
        class="px-4 py-3 bg-blue-600 text-white rounded hover:transition-colors"
        @click="confirmSelection"
      >
        {{ confirmText }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { MapPin, RotateCcw, Maximize, Minimize, Info, X } from 'lucide-vue-next'
import AddressSearch, { type SearchResult } from './AddressSearch.vue'
import { useGeolocation } from '@/composables/useGeolocation'
import { notify } from '@/composables/useNotifications'

interface Props {
  mapHeight?: string
  heightClass?: string
  searchPlaceholder?: string
  enableUserLocation?: boolean
  countryCode?: string
  showActions?: boolean
  allowClear?: boolean
  confirmText?: string
  initialLocation?: SearchResult | null
  showInstructions?: boolean
  clickToSelect?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  mapHeight: '400px',
  heightClass: 'h-96',
  searchPlaceholder: 'Rechercher une adresse...',
  enableUserLocation: true,
  countryCode: 'TG',
  showActions: true,
  allowClear: true,
  confirmText: 'Confirmer l\'emplacement',
  initialLocation: null,
  showInstructions: true,
  clickToSelect: true
})

const emit = defineEmits<{
  select: [location: SearchResult]
  confirm: [location: SearchResult]
  clear: []
  error: [error: string]
}>()

const { position, getCurrentPosition, isLoading: geoLoading, formatDistance } = useGeolocation()

const addressSearch = ref<InstanceType<typeof AddressSearch>>()
const mapContainer = ref<HTMLElement>()
const mapLoading = ref(true)
const selectedLocation = ref<SearchResult | null>(props.initialLocation)
const isFullscreen = ref(false)
const showInstructions = ref(props.showInstructions)

// Map instance
let map: any = null
let selectedMarker: any = null

// Default location (Lomé, Togo)
const defaultCenter = { lat: 6.1319, lng: 1.2228 }

const initializeMap = async () => {
  if (!mapContainer.value) return

  mapLoading.value = true

  try {
    // Import Leaflet dynamically
    const L = await import('leaflet')

    // Initialize map
    const initialCenter: [number, number] = selectedLocation.value
      ? [selectedLocation.value.lat, selectedLocation.value.lng]
      : [defaultCenter.lat, defaultCenter.lng]

    map = L.map(mapContainer.value).setView(initialCenter, 13)

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map)

    // Add click handler if enabled
    if (props.clickToSelect) {
      map.on('click', handleMapClick)
    }

    // Add initial marker if location is provided
    if (selectedLocation.value) {
      addSelectedMarker(selectedLocation.value)
    }

    // Add user location marker if available
    if (position.value) {
      addUserLocationMarker()
    }

    mapLoading.value = false
  } catch (error) {
    // console.error('Failed to initialize map:', error)
    mapLoading.value = false
    emit('error', 'Erreur lors du chargement de la carte')
  }
}

const handleMapClick = async (e: any) => {
  const { lat, lng } = e.latlng

  // Create location object from click
  const clickedLocation: SearchResult = {
    lat,
    lng,
    display_name: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
    type: 'coordinates'
  }

  // Try to get address name via reverse geocoding
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=fr`
    )

    if (response.ok) {
      const data = await response.json()
      if (data.display_name) {
        clickedLocation.display_name = data.display_name
        clickedLocation.address = data.address
      }
    }
  } catch (error) {
    console.warn('Reverse geocoding failed:', error)
  }

  selectLocation(clickedLocation)
}

const addSelectedMarker = async (location: SearchResult) => {
  if (!map) return

  try {
    const L = await import('leaflet')

    // Remove existing marker
    if (selectedMarker) {
      map.removeLayer(selectedMarker)
    }

    // Create custom marker icon
    const markerIcon = L.divIcon({
      html: `
        <div class="bg-red-500 border-2 border-white rounded-full w-5 h-5 flex items-center justify-center shadow-lg">
          <div class="w-4 h-4 bg-white rounded-full"></div>
        </div>
      `,
      className: 'custom-marker',
      iconSize: [24, 24],
      iconAnchor: [12, 24]
    })

    // Add marker
    selectedMarker = L.marker([location.lat, location.lng], {
      icon: markerIcon,
      draggable: true
    }).addTo(map)

    // Handle marker drag
    selectedMarker.on('dragend', async (e: any) => {
      const { lat, lng } = e.target.getLatLng()
      await handleMapClick({ latlng: { lat, lng } })
    })

    // Center map on marker
    map.setView([location.lat, location.lng], 15)
  } catch (error) {
    // console.error('Failed to add marker:', error)
  }
}

const addUserLocationMarker = async () => {
  if (!map || !position.value) return

  try {
    const L = await import('leaflet')

    const userIcon = L.divIcon({
      html: `
        <div class="bg-blue-500 border-2 border-white rounded-full w-4 h-4 animate-pulse shadow-lg"></div>
      `,
      className: 'user-location-marker',
      iconSize: [16, 16],
      iconAnchor: [8, 8]
    })

    L.marker([position.value.latitude, position.value.longitude], {
      icon: userIcon
    }).addTo(map)
  } catch (error) {
    // console.error('Failed to add user location marker:', error)
  }
}

const selectLocation = (location: SearchResult) => {
  selectedLocation.value = location
  addSelectedMarker(location)
  showInstructions.value = false
  emit('select', location)
}

const handleAddressSelect = (result: SearchResult) => {
  selectLocation(result)
}

const handleAddressClear = () => {
  clearSelection()
}

const handleSearchError = (error: string) => {
  emit('error', error)
}

const getCurrentLocation = async () => {
  try {
    const coords = await getCurrentPosition()
    if (coords && map) {
      map.setView([coords.latitude, coords.longitude], 15)
      addUserLocationMarker()
    }
  } catch (error) {
    notify.error('Impossible d\'obtenir votre position')
  }
}

const resetMapView = () => {
  if (map) {
    const center = selectedLocation.value
      ? [selectedLocation.value.lat, selectedLocation.value.lng]
      : [defaultCenter.lat, defaultCenter.lng]
    map.setView(center, 13)
  }
}

const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value

  if (isFullscreen.value) {
    mapContainer.value?.classList.add('fullscreen-map')
  } else {
    mapContainer.value?.classList.remove('fullscreen-map')
  }

  // Trigger map resize after transition
  setTimeout(() => {
    if (map) {
      map.invalidateSize()
    }
  }, 300)
}

const clearSelection = () => {
  selectedLocation.value = null
  if (selectedMarker && map) {
    map.removeLayer(selectedMarker)
    selectedMarker = null
  }
  addressSearch.value?.clearSelection()
  emit('clear')
}

const confirmSelection = () => {
  if (selectedLocation.value) {
    emit('confirm', selectedLocation.value)
  }
}

// Watch for changes in initial location
watch(() => props.initialLocation, (newLocation) => {
  if (newLocation) {
    selectedLocation.value = newLocation
    if (map) {
      addSelectedMarker(newLocation)
    }
  }
}, { immediate: true })

// Watch for position changes
watch(position, (newPosition) => {
  if (newPosition && map) {
    addUserLocationMarker()
  }
})

onMounted(async () => {
  await nextTick()
  initializeMap()
})

onUnmounted(() => {
  if (map) {
    map.remove()
    map = null
  }
})

// Expose methods for parent component
defineExpose({
  clearSelection,
  setLocation: selectLocation,
  getSelectedLocation: () => selectedLocation.value,
  focusSearch: () => addressSearch.value?.focus()
})
</script>

<style scoped>
.fullscreen-map {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
  z-index: 9999 !important;
  border-radius: 0 !important;
}

:deep(.custom-marker) {
  background: transparent !important;
  border: none !important;
}

:deep(.user-location-marker) {
  background: transparent !important;
  border: none !important;
}

/* Leaflet popup customization */
:deep(.leaflet-popup-content-wrapper) {
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

:deep(.leaflet-popup-tip) {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
</style>
