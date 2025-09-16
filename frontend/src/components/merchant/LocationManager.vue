<template>
  <div class="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center space-x-3">
        <div class="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
          <MapPin class="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h3 class="text-lg font-semibold text-gray-900">Géolocalisation</h3>
          <p class="text-gray-600 text-sm">Position de votre commerce</p>
        </div>
      </div>
      <button
        @click="getCurrentLocation"
        :disabled="loading"
        class="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center space-x-1"
      >
        <RefreshCw class="w-4 h-4" :class="{ 'animate-spin': loading }" />
        <span>{{ loading ? 'Localisation...' : 'Me localiser' }}</span>
      </button>
    </div>

    <div v-if="!hasLocation" class="text-center py-8 border-2 border-dashed border-gray-300 rounded-xl">
      <MapPin class="w-12 h-12 text-gray-400 mx-auto mb-4" />
      <h4 class="text-lg font-medium text-gray-900 mb-2">Aucune position définie</h4>
      <p class="text-gray-600 mb-4">
        Ajoutez la position de votre commerce pour que les clients puissent vous trouver facilement
      </p>
      <button
        @click="showLocationModal = true"
        class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
      >
        Définir ma position
      </button>
    </div>

    <div v-else class="space-y-4">
      <div class="grid grid-cols-2 gap-4">
        <div class="bg-gray-50 rounded-lg p-4">
          <label class="text-sm font-medium text-gray-700">Latitude</label>
          <p class="text-lg text-gray-900">{{ location.latitude?.toFixed(6) }}</p>
        </div>
        <div class="bg-gray-50 rounded-lg p-4">
          <label class="text-sm font-medium text-gray-700">Longitude</label>
          <p class="text-lg text-gray-900">{{ location.longitude?.toFixed(6) }}</p>
        </div>
      </div>

      <div class="flex space-x-3">
        <button
          @click="showLocationModal = true"
          class="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Modifier
        </button>
        <button
          @click="getCurrentLocation"
          :disabled="loading"
          class="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {{ loading ? 'Localisation...' : 'Relocaliser' }}
        </button>
      </div>
    </div>

    <!-- Location Modal -->
    <div v-if="showLocationModal" class="fixed inset-0 z-50 overflow-y-auto">
      <!-- Backdrop -->
      <div
        class="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity"
        @click="closeModal"
      ></div>

      <!-- Modal -->
      <div class="flex min-h-full items-center justify-center p-4">
        <div
          class="relative w-full max-w-4xl bg-white rounded-2xl shadow-xl transform transition-all"
          @click.stop
        >
          <!-- Header -->
          <div class="px-6 py-4 border-b border-gray-200">
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold text-gray-900">Définir votre position</h3>
              <button
                @click="closeModal"
                class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XMarkIcon class="w-5 h-5 text-gray-400" />
              </button>
            </div>
          </div>

          <!-- Form -->
          <form @submit.prevent="saveLocation" class="px-6 py-6 space-y-4">
            <!-- Map Selection Mode Toggle -->
            <div class="flex items-center justify-center space-x-4 mb-4">
              <button
                type="button"
                @click="mapSelectionMode = false"
                :class="!mapSelectionMode ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'"
                class="px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Coordonnées manuelles
              </button>
              <button
                type="button"
                @click="toggleMapSelection"
                :class="mapSelectionMode ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'"
                class="px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Sélection sur carte
              </button>
            </div>

            <!-- Map Selection -->
            <div v-if="mapSelectionMode" class="mb-4">
              <div class="mb-2 flex items-center justify-between">
                <label class="block text-sm font-medium text-gray-700">
                  Cliquez sur la carte pour choisir votre position
                </label>
                <button
                  type="button"
                  @click="centerOnCurrentPosition"
                  class="text-blue-600 hover:text-blue-700 text-sm flex items-center space-x-1"
                >
                  <MapPin class="w-4 h-4" />
                  <span>Ma position</span>
                </button>
              </div>
              <div
                ref="mapContainer"
                class="w-full h-64 rounded-lg border border-gray-300 bg-gray-100"
                style="min-height: 300px;"
              >
                <!-- Map will be loaded here -->
              </div>
            </div>

            <!-- Manual Coordinates (only show when not in map mode) -->
            <div v-else class="space-y-4">
              <div>
                <label for="latitude" class="block text-sm font-medium text-gray-700 mb-2">
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
                  class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: 5.3474"
                />
              </div>

              <div>
                <label for="longitude" class="block text-sm font-medium text-gray-700 mb-2">
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
                  class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: -3.9857"
                />
              </div>
            </div>

            <!-- Current Selection Display -->
            <div v-if="form.latitude && form.longitude" class="bg-green-50 rounded-lg p-3 border border-green-200">
              <div class="flex items-center space-x-2 mb-2">
                <CheckCircle class="w-5 h-5 text-green-600" />
                <span class="font-medium text-green-800">Position sélectionnée</span>
              </div>
              <div class="text-sm text-green-700 grid grid-cols-2 gap-2">
                <div>
                  <strong>Latitude:</strong> {{ form.latitude.toFixed(6) }}
                </div>
                <div>
                  <strong>Longitude:</strong> {{ form.longitude.toFixed(6) }}
                </div>
              </div>
            </div>

            <div class="bg-blue-50 rounded-lg p-3">
              <p class="text-sm text-blue-700">
                <strong>Deux options :</strong><br>
                • <strong>Coordonnées manuelles :</strong> Saisissez directement lat/long<br>
                • <strong>Sélection sur carte :</strong> Cliquez sur votre emplacement exact
              </p>
            </div>

            <div class="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                @click="closeModal"
                class="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                :disabled="saving"
                class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors disabled:opacity-50"
              >
                {{ saving ? 'Enregistrement...' : 'Enregistrer' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Notification -->
    <div v-if="notification.show" class="fixed bottom-4 right-4 z-50">
      <div
        class="bg-white rounded-lg shadow-lg border-l-4 p-4 max-w-sm"
        :class="{
          'border-green-500': notification.type === 'success',
          'border-red-500': notification.type === 'error',
          'border-blue-500': notification.type === 'info'
        }"
      >
        <div class="flex items-start">
          <div class="flex-shrink-0">
            <CheckCircle
              v-if="notification.type === 'success'"
              class="w-5 h-5 text-green-500"
            />
            <XCircle
              v-if="notification.type === 'error'"
              class="w-5 h-5 text-red-500"
            />
            <Info
              v-if="notification.type === 'info'"
              class="w-5 h-5 text-blue-500"
            />
          </div>
          <div class="ml-3 w-0 flex-1">
            <p class="text-sm font-medium text-gray-900">{{ notification.title }}</p>
            <p class="mt-1 text-sm text-gray-500">{{ notification.message }}</p>
          </div>
          <div class="ml-4 flex-shrink-0 flex">
            <button
              @click="notification.show = false"
              class="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { MapPin, RefreshCw, X, CheckCircle, XCircle, Info } from 'lucide-vue-next'
import 'leaflet/dist/leaflet.css'

const authStore = useAuthStore()

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

const loadCurrentLocation = async () => {
  try {
    const token = authStore.token

    const response = await fetch('http://localhost:8000/api/merchants/location', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    })

    const data = await response.json()

    if (data.success) {
      location.value.latitude = parseFloat(data.data.latitude)
      location.value.longitude = parseFloat(data.data.longitude)
      hasLocation.value = data.data.has_location
    } else {
      console.error('Error loading location:', data.message)
    }
  } catch (error) {
    console.error('Error loading location:', error)
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

      // Auto-save the location
      await updateLocation(latitude, longitude)
      loading.value = false
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
    const token = authStore.token

    const response = await fetch('http://localhost:8000/api/merchants/location', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ latitude, longitude })
    })

    const data = await response.json()

    if (data.success) {
      location.value.latitude = parseFloat(data.data.latitude)
      location.value.longitude = parseFloat(data.data.longitude)
      hasLocation.value = true

      showNotification('success', 'Position enregistrée', 'Votre position a été mise à jour avec succès')
    } else {
      throw new Error(data.message || 'Erreur lors de la mise à jour')
    }
  } catch (error) {
    console.error('Error updating location:', error)
    showNotification('error', 'Erreur', error instanceof Error ? error.message : 'Erreur inconnue')
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

const openModal = () => {
  form.value.latitude = location.value.latitude
  form.value.longitude = location.value.longitude
  showLocationModal.value = true
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