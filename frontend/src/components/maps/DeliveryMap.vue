<template>
  <div class="relative h-full w-full">
    <div
      ref="mapContainer"
      class="h-full w-full rounded-lg"
      :style="{ minHeight: height }"
    />

    <!-- Overlay controls -->
    <div class="absolute bottom-4 right-4 z-[1000] flex flex-col gap-2">
      <Button
        variant="outline"
        size="sm"
        class="bg-white shadow-md"
        :disabled="loading"
        @click="centerOnUser"
      >
        <Navigation class="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="sm"
        class="bg-white shadow-md"
        :disabled="loading"
        @click="fitAllMarkers"
      >
        <Maximize2 class="h-4 w-4" />
      </Button>
    </div>

    <!-- Loading overlay -->
    <div
      v-if="loading"
      class="absolute inset-0 z-[1001] flex items-center justify-center rounded-lg bg-white/80"
    >
      <Loading label="Chargement de la carte..." />
    </div>

    <!-- Navigation buttons -->
    <div
      v-if="showNavigationButtons && (pickupLocation || deliveryLocation)"
      class="absolute bottom-4 left-4 z-[1000] flex flex-col gap-2"
    >
      <Button
        v-if="pickupLocation"
        size="sm"
        variant="primary"
        class="shadow-md"
        @click="openNavigation('pickup')"
      >
        <MapPin class="mr-2 h-4 w-4" />
        Retrait
      </Button>
      <Button
        v-if="deliveryLocation"
        size="sm"
        variant="secondary"
        class="shadow-md"
        @click="openNavigation('delivery')"
      >
        <MapPin class="mr-2 h-4 w-4" />
        Livraison
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Button, Loading } from '@/components/ui/2025'
import { MapPin, Navigation, Maximize2 } from 'lucide-vue-next'

interface Location {
  latitude: number
  longitude: number
  label?: string
}

interface Props {
  pickupLocation?: Location | null
  deliveryLocation?: Location | null
  driverLocation?: Location | null
  height?: string
  showRoute?: boolean
  showNavigationButtons?: boolean
  interactive?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  pickupLocation: null,
  deliveryLocation: null,
  driverLocation: null,
  height: '400px',
  showRoute: true,
  showNavigationButtons: true,
  interactive: true
})

const emit = defineEmits<{
  mapReady: [map: L.Map]
  locationUpdate: [location: Location]
}>()

const mapContainer = ref<HTMLDivElement | null>(null)
const loading = ref(true)

let map: L.Map | null = null
let pickupMarker: L.Marker | null = null
let deliveryMarker: L.Marker | null = null
let driverMarker: L.Marker | null = null
let routePolyline: L.Polyline | null = null

// Custom icons
const createCustomIcon = (color: string, emoji: string) => {
  return L.divIcon({
    html: `
      <div style="
        background-color: ${color};
        width: 36px;
        height: 36px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        font-size: 18px;
      ">
        ${emoji}
      </div>
    `,
    className: 'custom-marker',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20]
  })
}

const pickupIcon = createCustomIcon('#10B981', '📦')
const deliveryIcon = createCustomIcon('#F59E0B', '📍')
const driverIcon = createCustomIcon('#3B82F6', '🚴')

const initMap = () => {
  if (!mapContainer.value) return

  // Default center (Lomé, Togo)
  const defaultCenter: [number, number] = [6.1725, 1.2314]
  const defaultZoom = 13

  map = L.map(mapContainer.value, {
    center: defaultCenter,
    zoom: defaultZoom,
    zoomControl: props.interactive,
    dragging: props.interactive,
    scrollWheelZoom: props.interactive
  })

  // Add tile layer (OpenStreetMap)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19
  }).addTo(map)

  loading.value = false
  emit('mapReady', map)

  // Update markers after map is ready
  updateMarkers()
}

const updateMarkers = () => {
  if (!map) return

  // Update pickup marker
  if (props.pickupLocation) {
    const pos: [number, number] = [props.pickupLocation.latitude, props.pickupLocation.longitude]
    if (pickupMarker) {
      pickupMarker.setLatLng(pos)
    } else {
      pickupMarker = L.marker(pos, { icon: pickupIcon })
        .addTo(map)
        .bindPopup(`<strong>Point de retrait</strong><br>${props.pickupLocation.label || 'Commerçant'}`)
    }
  } else if (pickupMarker) {
    map.removeLayer(pickupMarker)
    pickupMarker = null
  }

  // Update delivery marker
  if (props.deliveryLocation) {
    const pos: [number, number] = [props.deliveryLocation.latitude, props.deliveryLocation.longitude]
    if (deliveryMarker) {
      deliveryMarker.setLatLng(pos)
    } else {
      deliveryMarker = L.marker(pos, { icon: deliveryIcon })
        .addTo(map)
        .bindPopup(`<strong>Point de livraison</strong><br>${props.deliveryLocation.label || 'Client'}`)
    }
  } else if (deliveryMarker) {
    map.removeLayer(deliveryMarker)
    deliveryMarker = null
  }

  // Update driver marker
  if (props.driverLocation) {
    const pos: [number, number] = [props.driverLocation.latitude, props.driverLocation.longitude]
    if (driverMarker) {
      driverMarker.setLatLng(pos)
    } else {
      driverMarker = L.marker(pos, { icon: driverIcon })
        .addTo(map)
        .bindPopup('<strong>Votre position</strong>')
    }
  } else if (driverMarker) {
    map.removeLayer(driverMarker)
    driverMarker = null
  }

  // Update route
  if (props.showRoute) {
    updateRoute()
  }

  // Fit bounds
  fitAllMarkers()
}

const updateRoute = () => {
  if (!map) return

  // Remove existing route
  if (routePolyline) {
    map.removeLayer(routePolyline)
    routePolyline = null
  }

  // Draw route line
  const points: [number, number][] = []

  if (props.driverLocation) {
    points.push([props.driverLocation.latitude, props.driverLocation.longitude])
  }

  if (props.pickupLocation) {
    points.push([props.pickupLocation.latitude, props.pickupLocation.longitude])
  }

  if (props.deliveryLocation) {
    points.push([props.deliveryLocation.latitude, props.deliveryLocation.longitude])
  }

  if (points.length >= 2) {
    routePolyline = L.polyline(points, {
      color: '#10B981',
      weight: 4,
      opacity: 0.7,
      dashArray: '10, 10'
    }).addTo(map)
  }
}

const fitAllMarkers = () => {
  if (!map) return

  const bounds: [number, number][] = []

  if (props.pickupLocation) {
    bounds.push([props.pickupLocation.latitude, props.pickupLocation.longitude])
  }
  if (props.deliveryLocation) {
    bounds.push([props.deliveryLocation.latitude, props.deliveryLocation.longitude])
  }
  if (props.driverLocation) {
    bounds.push([props.driverLocation.latitude, props.driverLocation.longitude])
  }

  if (bounds.length > 0) {
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 })
  }
}

const centerOnUser = () => {
  if (!map) return

  if (props.driverLocation) {
    map.setView([props.driverLocation.latitude, props.driverLocation.longitude], 16)
  } else {
    // Try to get current location
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location: Location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          }
          map?.setView([location.latitude, location.longitude], 16)
          emit('locationUpdate', location)
        },
        () => {
          console.warn('Unable to get current location')
        }
      )
    }
  }
}

const openNavigation = (type: 'pickup' | 'delivery') => {
  const location = type === 'pickup' ? props.pickupLocation : props.deliveryLocation
  if (!location) return

  // Open in external maps app
  const url = `https://www.google.com/maps/dir/?api=1&destination=${location.latitude},${location.longitude}`
  window.open(url, '_blank')
}

// Watch for location changes
watch(
  () => [props.pickupLocation, props.deliveryLocation, props.driverLocation],
  () => {
    nextTick(() => {
      updateMarkers()
    })
  },
  { deep: true }
)

onMounted(() => {
  nextTick(() => {
    initMap()
  })
})

onUnmounted(() => {
  if (map) {
    map.remove()
    map = null
  }
})

// Expose methods
defineExpose({
  fitAllMarkers,
  centerOnUser,
  getMap: () => map
})
</script>

<style>
.custom-marker {
  background: transparent !important;
  border: none !important;
}

/* Fix Leaflet default icon issue */
.leaflet-default-icon-path {
  background-image: url('https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png');
}
</style>
