<template>
  <div class="relative">
    <div
      ref="mapElement"
      :class="['w-full rounded', heightClass]"
      :style="{ minHeight: height || '400px' }"
    />

    <!-- Loading overlay -->
    <div
      v-if="loading"
      class="relative sm:absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded"
    >
      <div class="flex items-center space-y-2 sm:space-x-3">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        <span class="text-gray-700">Chargement de la carte...</span>
      </div>
    </div>

    <!-- Error state -->
    <div
      v-if="error"
      class="relative sm:absolute inset-0 bg-red-50 border border-red-200 rounded flex items-center justify-center"
    >
      <div class="text-left sm:text-center p-6">
        <div class="text-red-600 mt-2">
          <svg
            class="w-12 h-10 mx-auto"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.962-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>
        <h3 class="text-lg font-medium text-red-900 mb-1">Erreur de chargement</h3>
        <p class="text-red-600 text-sm">{{ error }}</p>
        <button
          class="mt-3 px-3 py-3 bg-red-600 text-white rounded hover:transition-colors"
          @click="initializeMap"
        >
          Réessayer
        </button>
      </div>
    </div>
  </div>
</template>

<!-- eslint-disable no-undef -->
<script setup lang="ts">
/// <reference types="@types/google.maps" />
import { ref, onMounted, watch, nextTick } from 'vue'
import { Loader } from '@googlemaps/js-api-loader'

interface Marker {
  id: string | number
  position: { lat: number; lng: number }
  title: string
  info?: string
  icon?: string
  onClick?: () => void
}

interface Props {
  apiKey: string
  center?: { lat: number; lng: number }
  zoom?: number
  height?: string
  heightClass?: string
  markers?: Marker[]
  showUserLocation?: boolean
  userLocation?: { latitude: number; longitude: number } | null
}

const props = withDefaults(defineProps<Props>(), {
  center: () => ({ lat: 5.3474, lng: -3.9857 }), // Abidjan, Côte d'Ivoire
  zoom: 12,
  height: '400px',
  heightClass: 'h-96',
  markers: () => [],
  showUserLocation: false,
  userLocation: null
})

const emit = defineEmits<{
  mapReady: [map: google.maps.Map]
  markerClick: [marker: Marker]
}>()

const mapElement = ref<HTMLElement>()
const loading = ref(true)
const error = ref<string | null>(null)
const mapInstance = ref<google.maps.Map | null>(null)
const markersInstances = ref<google.maps.Marker[]>([])
const userLocationMarker = ref<google.maps.Marker | null>(null)

const initializeMap = async () => {
  loading.value = true
  error.value = null

  try {
    const loader = new Loader({
      apiKey: props.apiKey,
      version: 'weekly',
      libraries: ['places', 'geometry']
    })

    await loader.load()

    if (!mapElement.value) {
      throw new Error('Map element not found')
    }

    // Determine initial center
    let initialCenter = props.center
    if (props.showUserLocation && props.userLocation) {
      initialCenter = {
        lat: props.userLocation.latitude,
        lng: props.userLocation.longitude
      }
    }

    mapInstance.value = new google.maps.Map(mapElement.value, {
      center: initialCenter,
      zoom: props.zoom,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        }
      ]
    })

    // Add user location marker if provided
    if (props.showUserLocation && props.userLocation) {
      addUserLocationMarker()
    }

    // Add merchants markers
    updateMarkers()

    emit('mapReady', mapInstance.value)
    loading.value = false

  } catch (err) {
    // console.error('Error initializing Google Map:', err)
    error.value = err instanceof Error ? err.message : 'Erreur de chargement de la carte'
    loading.value = false
  }
}

const addUserLocationMarker = () => {
  if (!mapInstance.value || !props.userLocation) return

  userLocationMarker.value = new google.maps.Marker({
    position: {
      lat: props.userLocation.latitude,
      lng: props.userLocation.longitude
    },
    map: mapInstance.value,
    title: 'Votre position',
    icon: {
      path: google.maps.SymbolPath.CIRCLE,
      scale: 8,
      fillColor: '#4285F4',
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: 2
    }
  })

  const infoWindow = new google.maps.InfoWindow({
    content: '<div class="p-3"><strong>Votre position</strong></div>'
  })

  userLocationMarker.value.addListener('click', () => {
    infoWindow.open(mapInstance.value, userLocationMarker.value)
  })
}

const updateMarkers = () => {
  if (!mapInstance.value) return

  // Clear existing markers
  markersInstances.value.forEach(marker => marker.setMap(null))
  markersInstances.value = []

  // Add new markers
  props.markers.forEach(markerData => {
    const marker = new google.maps.Marker({
      position: markerData.position,
      map: mapInstance.value,
      title: markerData.title,
      icon: markerData.icon || {
        path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
        scale: 5,
        fillColor: '#10B981',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 1
      }
    })

    if (markerData.info) {
      const infoWindow = new google.maps.InfoWindow({
        content: `<div class="p-3">
          <h3 class="font-semibold text-gray-900">${markerData.title}</h3>
          <p class="text-gray-700 text-sm mt-1">${markerData.info}</p>
        </div>`
      })

      marker.addListener('click', () => {
        infoWindow.open(mapInstance.value, marker)
        emit('markerClick', markerData)
        if (markerData.onClick) {
          markerData.onClick()
        }
      })
    }

    markersInstances.value.push(marker)
  })

  // Fit bounds if we have markers
  if (props.markers.length > 0) {
    const bounds = new google.maps.LatLngBounds()

    // Include user location in bounds if available
    if (props.showUserLocation && props.userLocation) {
      bounds.extend({
        lat: props.userLocation.latitude,
        lng: props.userLocation.longitude
      })
    }

    // Include all markers in bounds
    props.markers.forEach(marker => {
      bounds.extend(marker.position)
    })

    mapInstance.value.fitBounds(bounds)
  }
}

// Watch for changes in markers and update the map
watch(() => props.markers, updateMarkers, { deep: true })

// Watch for changes in user location
watch(() => props.userLocation, () => {
  if (userLocationMarker.value) {
    userLocationMarker.value.setMap(null)
  }
  if (props.showUserLocation && props.userLocation) {
    addUserLocationMarker()
  }
}, { deep: true })

onMounted(async () => {
  await nextTick()
  initializeMap()
})
</script>
