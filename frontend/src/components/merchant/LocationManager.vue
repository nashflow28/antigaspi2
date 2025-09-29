<template>
  <div class="bg-white rounded shadow-lg p-6 border border-gray-100">
    <div class="flex items-center justify-start sm:justify-between mt-4">
      <div class="flex items-center space-y-2 sm:space-x-3">
        <div class="w-12 h-10 bg-blue-100 rounded flex items-center justify-center">
          <MapPin class="h-6 w-6 text-info" />
        </div>
        <div>
          <h3 class="text-lg font-semibold text-gray-900">Géolocalisation</h3>
          <p class="text-gray-700 text-sm">Position de votre commerce</p>
        </div>
      </div>
      <button
        :disabled="loading"
        class="text-info hover:text-secondary-700 font-medium text-sm flex items-center space-y-4 sm:space-x-2"
        @click="getCurrentLocation"
      >
        <RefreshCw class="h-4 w-4" :class="{ 'animate-spin': loading }" />
        <span>{{ loading ? 'Localisation...' : 'Me localiser' }}</span>
      </button>
    </div>

    <div v-if="!hasLocation" class="text-left sm:text-center py-6 sm:py-8 border-2 border-dashed border-gray-300 rounded">
      <MapPin class="w-12 h-10 text-gray-400 mx-auto mt-3" />
      <h4 class="text-lg font-medium text-gray-900 mt-2">Aucune position définie</h4>
      <p class="text-gray-700 mt-3">
        Ajoutez la position de votre commerce pour que les clients puissent vous trouver facilement
      </p>
      <button
        class="bg-blue-600 text-white px-3 py-3 rounded hover:transition-colors"
        @click="showLocationModal = true"
      >
        Définir ma position
      </button>
    </div>

    <div v-else class="space-y-4">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div class="bg-gray-50 rounded p-4">
          <label class="text-sm font-medium text-gray-800">Latitude</label>
          <p class="text-lg text-gray-900">{{ location.latitude?.toFixed(6) }}</p>
        </div>
        <div class="bg-gray-50 rounded p-4">
          <label class="text-sm font-medium text-gray-800">Longitude</label>
          <p class="text-lg text-gray-900">{{ location.longitude?.toFixed(6) }}</p>
        </div>
      </div>

      <div class="flex space-y-2 sm:space-x-3">
        <button
          class="flex-1 bg-gray-100 text-gray-800 py-3 px-3 rounded hover:transition-colors"
          @click="showLocationModal = true"
        >
          Modifier
        </button>
        <button
          :disabled="loading"
          class="flex-1 bg-blue-600 text-white py-3 px-3 rounded hover:transition-colors disabled:opacity-50"
          @click="getCurrentLocation"
        >
          {{ loading ? 'Localisation...' : 'Relocaliser' }}
        </button>
      </div>
    </div>

    <!-- Location Modal -->
    <div v-if="showLocationModal" class="fixed inset-0 z-[9999] overflow-y-auto">
      <!-- Backdrop -->
      <div
        class="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity"
        @click="closeModal"
      />

      <!-- Modal -->
      <div class="flex min-h-screen items-center justify-center p-4">
        <div
          class="relative w-full max-w-full sm:max-w-4xl bg-white rounded shadow-xl transform transition-all"
          @click.stop
        >
          <!-- Header -->
          <div class="px-4 py-4 border-b border-gray-200">
            <div class="flex items-center justify-start sm:justify-between">
              <h3 class="text-lg font-semibold text-gray-900">Définir votre position</h3>
              <button
                class="p-2 hover:transition-colors"
                @click="closeModal"
              >
                <X class="h-4 w-4 text-gray-400" />
              </button>
            </div>
          </div>

          <!-- Form -->
          <form class="px-4 py-6 space-y-4" @submit.prevent="saveLocation">
            <!-- Map Selection Mode Toggle -->
            <div class="flex items-center justify-center space-y-4 sm:space-x-4 mt-3">
              <button
                type="button"
                :class="!mapSelectionMode ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'"
                class="px-3 py-3 rounded font-medium transition-colors"
                @click="mapSelectionMode = false"
              >
                Coordonnées manuelles
              </button>
              <button
                type="button"
                :class="mapSelectionMode ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'"
                class="px-3 py-3 rounded font-medium transition-colors"
                @click="toggleMapSelection"
              >
                Sélection sur carte
              </button>
            </div>

            <!-- Map Selection -->
            <div v-if="mapSelectionMode" class="mt-3">
              <div class="mt-2 flex items-center justify-start sm:justify-between">
                <label class="block text-sm font-medium text-gray-800">
                  Cliquez sur la carte pour choisir votre position
                </label>
                <button
                  type="button"
                  class="text-info hover:text-secondary-700 text-sm flex items-center space-y-4 sm:space-x-2"
                  @click="centerOnCurrentPosition"
                >
                  <MapPin class="h-4 w-4" />
                  <span>Ma position</span>
                </button>
              </div>
              <div
                ref="mapContainer"
                class="w-full h-9xl rounded border border-gray-300 bg-gray-100"
                style="min-height: 300px;"
              >
                <!-- Map will be loaded here -->
              </div>
            </div>

            <!-- Manual Coordinates (only show when not in map mode) -->
            <div v-else class="space-y-4">
              <div>
                <label for="latitude" class="block text-sm font-medium text-gray-800 mt-2">
                  Latitude *
                </label>
                <input
                  id="latitude"
                  v-model.number="form.latitude"
                  type="number"
                  step="0.000001"
                  min="-90"
                  max="90"
                  required
                  class="w-full border border-gray-300 rounded px-3 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: 5.3474"
                >
              </div>

              <div>
                <label for="longitude" class="block text-sm font-medium text-gray-800 mt-2">
                  Longitude *
                </label>
                <input
                  id="longitude"
                  v-model.number="form.longitude"
                  type="number"
                  step="0.000001"
                  min="-180"
                  max="180"
                  required
                  class="w-full border border-gray-300 rounded px-3 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: -3.9857"
                >
              </div>
            </div>

            <!-- Current Selection Display -->
            <div v-if="form.latitude && form.longitude" class="bg-green-50 rounded p-3 border border-blue-200">
              <div class="flex items-center space-y-4 sm:space-x-2 mt-2">
                <CheckCircle class="h-4 w-4 text-green-600" />
                <span class="font-medium text-green-800">Position sélectionnée</span>
              </div>
              <div class="text-sm text-green-700 grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <strong>Latitude:</strong> {{ form.latitude.toFixed(6) }}
                </div>
                <div>
                  <strong>Longitude:</strong> {{ form.longitude.toFixed(6) }}
                </div>
              </div>
            </div>

            <div class="bg-blue-50 rounded p-3">
              <p class="text-sm text-secondary-700">
                <strong>Deux options :</strong><br>
                • <strong>Coordonnées manuelles :</strong> Saisissez directement lat/long<br>
                • <strong>Sélection sur carte :</strong> Cliquez sur votre emplacement exact
              </p>
            </div>

            <div class="flex justify-center sm:justify-end space-y-2 sm:space-x-3 padding-t-lg">
              <button
                type="button"
                class="px-3 py-3 text-gray-700 hover:transition-colors"
                @click="closeModal"
              >
                Annuler
              </button>
              <button
                type="submit"
                :disabled="saving"
                class="px-4 py-3 bg-blue-600 text-white rounded hover:transition-colors disabled:opacity-50"
              >
                {{ saving ? 'Enregistrement...' : 'Enregistrer' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Notification -->
    <div v-if="notification.show" class="fixed bottom-4 right-4 z-[300]">
      <div
        class="bg-white rounded shadow-lg border-l-4 p-4 max-w-sm"
        :class="{
          'border-emerald-500': notification.type === 'success',
          'border-red-500': notification.type === 'error',
          'border-blue-500': notification.type === 'info'
        }"
      >
        <div class="flex items-stretch sm:items-start">
          <div class="flex-shrink-0">
            <CheckCircle
              v-if="notification.type === 'success'"
              class="h-4 w-4 text-green-600-500"
            />
            <XCircle
              v-if="notification.type === 'error'"
              class="h-4 w-4 text-red-500"
            />
            <Info
              v-if="notification.type === 'info'"
              class="h-4 w-4 text-blue-500"
            />
          </div>
          <div class="ml-4 w-none flex-1">
            <p class="text-sm font-medium text-gray-900">{{ notification.title }}</p>
            <p class="mt-1 text-sm text-gray-500">{{ notification.message }}</p>
          </div>
          <div class="ml-6 flex-shrink-0 flex">
            <button
              class="text-gray-400 hover:transition-colors"
              @click="notification.show = false"
            >
              <X class="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import apiService from '@/services/api'
import { MapPin, RefreshCw, X, CheckCircle, XCircle, Info } from 'lucide-vue-next'
import 'leaflet/dist/leaflet.css'

// State
const loading = ref(false)
const saving = ref(false)
const showLocationModal = ref(false)
const hasLocation = ref(false)
const mapSelectionMode = ref(false)
const mapContainer = ref<HTMLElement | null>(null)
let map: any = null
let marker: any = null

const location = ref({
  latitude: null as number | null,
  longitude: null as number | null
})

const form = ref({
  latitude: null as number | null,
  longitude: null as number | null
})

const notification = ref({
  show: false,
  type: 'info' as 'success' | 'error' | 'info',
  title: '',
  message: ''
})

// Methods
const showNotification = (type: 'success' | 'error' | 'info', title: string, message: string) => {
  notification.value = { show: true, type, title, message }
  setTimeout(() => {
    notification.value.show = false
  }, 5000)
}

const toNumberOrNull = (value: unknown): number | null => {
  if (value === null || value === undefined) {
    return null
  }

  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : null
}

const loadCurrentLocation = async () => {
  try {
    const response = await apiService.getMerchantLocation()

    if (response.success && response.data) {
      const latitude = toNumberOrNull(response.data.latitude)
      const longitude = toNumberOrNull(response.data.longitude)

      location.value.latitude = latitude
      location.value.longitude = longitude
      form.value.latitude = latitude
      form.value.longitude = longitude
      hasLocation.value = Boolean(response.data.has_location ?? (latitude !== null && longitude !== null))
    } else if (response.message) {
      showNotification('error', 'Erreur', response.message)
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur lors du chargement de la localisation'
    showNotification('error', 'Erreur', errorMessage)
  }
}

const getCurrentLocation = () => {
  if (!navigator.geolocation) {
    showNotification('error', 'Géolocalisation non supportée', 'Votre navigateur ne supporte pas la géolocalisation')
    return
  }

  loading.value = true

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const latitude = position.coords.latitude
      const longitude = position.coords.longitude

      try {
        await updateLocation(latitude, longitude)
      } catch (error) {
        // Notification already handled in updateLocation
      } finally {
        loading.value = false
      }
    },
    (error) => {
      loading.value = false
      let message = 'Impossible d\'obtenir votre position'

      switch (error.code) {
        case error.PERMISSION_DENIED:
          message = 'Autorisation de géolocalisation refusée'
          break
        case error.POSITION_UNAVAILABLE:
          message = 'Position non disponible'
          break
        case error.TIMEOUT:
          message = 'Délai de géolocalisation dépassé'
          break
      }

      showNotification('error', 'Erreur de géolocalisation', message)
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    }
  )
}

const updateLocation = async (latitude: number, longitude: number) => {
  try {
    const response = await apiService.updateMerchantLocation({ latitude, longitude })

    if (!response.success) {
      throw new Error(response.message || 'Erreur lors de la mise à jour de la position')
    }

    const updatedLatitude = toNumberOrNull(response.data?.latitude) ?? latitude
    const updatedLongitude = toNumberOrNull(response.data?.longitude) ?? longitude

    location.value.latitude = updatedLatitude
    location.value.longitude = updatedLongitude
    form.value.latitude = updatedLatitude
    form.value.longitude = updatedLongitude
    hasLocation.value = updatedLatitude !== null && updatedLongitude !== null

    const successMessage = response.message || 'Votre position a été mise à jour avec succès'
    showNotification('success', 'Position enregistrée', successMessage)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue lors de la mise à jour'
    showNotification('error', 'Erreur', errorMessage)
    throw error
  }
}

const saveLocation = async () => {
  if (!form.value.latitude || !form.value.longitude) {
    showNotification('error', 'Erreur', 'Veuillez saisir les coordonnées')
    return
  }

  saving.value = true

  try {
    await updateLocation(form.value.latitude, form.value.longitude)
    closeModal()
  } catch (error) {
    // Error already handled in updateLocation
  } finally {
    saving.value = false
  }
}

const closeModal = () => {
  showLocationModal.value = false
  mapSelectionMode.value = false
  form.value.latitude = location.value.latitude
  form.value.longitude = location.value.longitude

  // Clean up map
  if (map) {
    map.remove()
    map = null
    marker = null
  }
}


// Map methods
const toggleMapSelection = async () => {
  mapSelectionMode.value = true

  await nextTick()

  if (mapContainer.value && !map) {
    initializeMap()
  }
}

const initializeMap = async () => {
  if (!mapContainer.value) return

  // Dynamically import Leaflet
  const L = await import('leaflet')

  // Default to Abidjan, Côte d'Ivoire if no location
  const defaultLat = form.value.latitude || 5.3474
  const defaultLng = form.value.longitude || -3.9857

  // Initialize map
  map = L.map(mapContainer.value).setView([defaultLat, defaultLng], 13)

  // Add tile layer (OpenStreetMap)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(map)

  // Add marker if coordinates exist
  if (form.value.latitude && form.value.longitude) {
    marker = L.marker([form.value.latitude, form.value.longitude], {
      draggable: true
    }).addTo(map)

    // Handle marker drag
    marker.on('dragend', (e: any) => {
      const position = e.target.getLatLng()
      updateFormCoordinates(position.lat, position.lng)
    })
  }

  // Handle map click
  map.on('click', (e: any) => {
    const { lat, lng } = e.latlng
    updateFormCoordinates(lat, lng)

    // Remove existing marker
    if (marker) {
      map.removeLayer(marker)
    }

    // Add new marker
    marker = L.marker([lat, lng], {
      draggable: true
    }).addTo(map)

    // Handle new marker drag
    marker.on('dragend', (e: any) => {
      const position = e.target.getLatLng()
      updateFormCoordinates(position.lat, position.lng)
    })
  })
}

const updateFormCoordinates = (lat: number, lng: number) => {
  form.value.latitude = parseFloat(lat.toFixed(6))
  form.value.longitude = parseFloat(lng.toFixed(6))
}

const centerOnCurrentPosition = async () => {
  if (!navigator.geolocation) {
    showNotification('error', 'Géolocalisation non supportée', 'Votre navigateur ne supporte pas la géolocalisation')
    return
  }

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const lat = position.coords.latitude
      const lng = position.coords.longitude

      if (map) {
        map.setView([lat, lng], 15)
        updateFormCoordinates(lat, lng)

        // Remove existing marker and add new one
        if (marker) {
          map.removeLayer(marker)
        }

        // Dynamically import Leaflet again
        const L = await import('leaflet')
        if (L) {
          marker = L.marker([lat, lng], {
            draggable: true
          }).addTo(map)

          marker.on('dragend', (e: any) => {
            const position = e.target.getLatLng()
            updateFormCoordinates(position.lat, position.lng)
          })
        }
      }
    },
    (error) => {
      let message = 'Impossible d\'obtenir votre position'
      switch (error.code) {
        case error.PERMISSION_DENIED:
          message = 'Autorisation de géolocalisation refusée'
          break
        case error.POSITION_UNAVAILABLE:
          message = 'Position non disponible'
          break
        case error.TIMEOUT:
          message = 'Délai de géolocalisation dépassé'
          break
      }
      showNotification('error', 'Erreur de géolocalisation', message)
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    }
  )
}

// Lifecycle
onMounted(async () => {
  await loadCurrentLocation()
})
</script>
