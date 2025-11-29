<template>
  <div class="relative">
    <div class="w-full bg-gray-100 rounded border-2 border-dashed border-gray-300" :style="{ minHeight: height || '400px' }">
      <div class="h-full flex flex-col items-center justify-center p-4 sm:p-6 lg:px-6 text-left sm:text-center">
        <div class="mt-3">
          <MapPin class="w-12 h-10 text-gray-400 mx-auto" />
        </div>
        <h3 class="text-lg font-semibold text-gray-800 mt-2">Carte des commerçants</h3>
        <p class="text-gray-500 mt-4 max-w-xl">
          Chargement de la carte en cours. En attendant, voici la liste des commerçants à proximité.
        </p>

        <!-- Liste des marchands -->
        <div class="w-full max-w-full sm:max-w-80 space-y-2">
          <div
            v-for="marker in markers"
            :key="marker.id"
            class="bg-white rounded border border-gray-200 p-4 hover:transition-shadow cursor-pointer"
            @click="$emit('markerClick', marker)"
          >
            <div class="flex items-center justify-start sm:justify-between">
              <div>
                <h4 class="font-semibold text-gray-900">{{ marker.title }}</h4>
                <p class="text-sm text-gray-700">{{ marker.info }}</p>
                <div class="flex items-center mt-2 text-sm text-info">
                  <Navigation class="h-4 w-4 mr-1" />
                  <span>{{ marker.position.lat.toFixed(4) }}, {{ marker.position.lng.toFixed(4) }}</span>
                </div>
              </div>
              <div class="flex flex-col items-center">
                <div class="w-xs h-3 bg-blue-500 rounded-full mb-1" />
                <span class="text-xs text-gray-500">Actif</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Position utilisateur -->
        <div v-if="showUserLocation && userLocation" class="mt-6 p-4 bg-blue-50 rounded">
          <div class="flex items-center justify-center text-secondary-700">
            <MapPin class="h-4 w-4 mr-2" />
            <span class="text-sm">
              Votre position: {{ userLocation.latitude.toFixed(4) }}, {{ userLocation.longitude.toFixed(4) }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { MapPin, Navigation } from 'lucide-vue-next'

interface Marker {
  id: string | number
  position: { lat: number; lng: number }
  title: string
  info?: string
  onClick?: () => void
}

interface Props {
  markers?: Marker[]
  showUserLocation?: boolean
  userLocation?: { latitude: number; longitude: number } | null
  height?: string
}

withDefaults(defineProps<Props>(), {
  markers: () => [],
  showUserLocation: false,
  userLocation: null,
  height: '400px'
})

const emit = defineEmits<{
  mapReady: [map: any]
  markerClick: [marker: Marker]
}>()

onMounted(() => {
  // Simuler que la carte est prête
  emit('mapReady', { type: 'simple-map' })
})
</script>
