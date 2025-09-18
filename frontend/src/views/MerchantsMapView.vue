<template>
  <div class="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100">
    <!-- Header -->
    <div class="bg-white/80 backdrop-blur-sm border-b border-neutral-200 sticky top-0 z-10">
      <div class="container mx-auto px-4 py-6">
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 class="text-3xl font-bold text-neutral-900">Carte des commerçants</h1>
            <p class="text-neutral-600 mt-1">
              {{ loading ? 'Chargement...' : `${merchants.length} commerçant${merchants.length > 1 ? 's' : ''} référencé${merchants.length > 1 ? 's' : ''}` }}
            </p>
          </div>

          <!-- Location Controls -->
          <div class="flex flex-col sm:flex-row gap-3">
            <button
              @click="getCurrentLocation"
              :disabled="locationLoading"
              class="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <MapPin class="w-4 h-4 mr-2" :class="{ 'animate-pulse': locationLoading }" />
              {{ locationLoading ? 'Localisation...' : (userLocation ? 'Position activée' : 'Me localiser') }}
            </button>
            <button
              @click="refreshMerchants"
              :disabled="loading"
              class="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw class="w-4 h-4 mr-2" :class="{ 'animate-spin': loading }" />
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
          class="w-full rounded-lg border border-gray-300"
          style="height: 600px;"
        >
          <!-- Map will be loaded here -->
        </div>

        <!-- Loading overlay -->
        <div v-if="loading" class="absolute inset-6 bg-white/80 rounded-lg flex items-center justify-center">
          <div class="text-center">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p class="text-gray-600">Chargement des commerçants...</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Merchant Details Modal -->
    <div v-if="selectedMerchant" class="fixed inset-0 z-50 overflow-y-auto">
      <!-- Backdrop -->
      <div
        class="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity"
        @click="selectedMerchant = null"
      ></div>

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
                @click="selectedMerchant = null"
                class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
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
              <span>{{ selectedMerchant.user.address || selectedMerchant.user.city }}</span>
            </div>

            <div v-if="selectedMerchant.distance_km" class="flex items-center space-x-3 text-gray-600">
              <Navigation class="w-5 h-5" />
              <span>{{ selectedMerchant.distance_km.toFixed(1) }} km de votre position</span>
            </div>

            <div class="flex items-center space-x-3 text-gray-600">
              <Phone class="w-5 h-5" />
              <span>{{ selectedMerchant.user.phone || 'Non renseigné' }}</span>
            </div>

            <div class="bg-green-50 rounded-lg p-4">
              <div class="flex items-center space-x-2 text-green-700 mb-2">
                <Package class="w-5 h-5" />
                <span class="font-medium">{{ selectedMerchant.products_count }} produit(s) disponible(s)</span>
              </div>
              <p class="text-green-600 text-sm">
                Commerçant vérifié ✓
              </p>
            </div>
          </div>

          <!-- Actions -->
          <div class="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
            <button
              @click="viewMerchantProducts"
              class="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium transition-colors"
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
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { MapPin, RefreshCw, X, Building, Navigation, Phone, Package } from 'lucide-vue-next'
import { notify } from '@/composables/useNotifications'
import 'leaflet/dist/leaflet.css'

interface Merchant {
  id: number
  business_name: string
  business_type: string
  latitude: number
  longitude: number
  distance_km?: number
  products_count: number
  is_verified: boolean
  user: {
    city: string
    address: string
    phone: string
  }
}

const router = useRouter()

// State
const merchants = ref<Merchant[]>([])
const loading = ref(false)
const locationLoading = ref(false)
const selectedMerchant = ref<Merchant | null>(null)
const userLocation = ref<{ latitude: number; longitude: number } | null>(null)

// Map references
const mapContainer = ref<HTMLElement | null>(null)
let map: any = null
let userMarker: any = null
const merchantMarkers: any[] = []

// Methods
const initializeMap = async () => {
  if (!mapContainer.value) return

  try {
    // Import Leaflet
    const L = await import('leaflet')

    // Initialize map centered on Abidjan, Côte d'Ivoire
    const defaultCenter = [5.3474, -3.9857]
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
  if (!map || merchants.value.length === 0) return

  try {
    const L = await import('leaflet')

    // Clear existing markers
    clearMerchantMarkers()

    // Create custom icon for merchants
    const merchantIcon = L.divIcon({
      html: '<div class="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shadow-lg">🏪</div>',
      className: 'custom-div-icon',
      iconSize: [32, 32],
      iconAnchor: [16, 32]
    })

    // Add markers for each merchant
    merchants.value.forEach(merchant => {
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
    if (merchants.value.length > 0) {
      const group = L.featureGroup(merchantMarkers)
      map.fitBounds(group.getBounds().pad(0.1))
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
  if (!map || !userLocation.value) return

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
    userMarker = L.marker([userLocation.value.latitude, userLocation.value.longitude], {
      icon: userIcon
    }).addTo(map)

    userMarker.bindPopup('<div class="p-2"><strong>Votre position</strong></div>')

    // Center map on user location
    map.setView([userLocation.value.latitude, userLocation.value.longitude], 14)
  } catch (error) {
    notify.error('Impossible d\'afficher votre position sur la carte')
  }
}

const getCurrentLocation = () => {
  if (!navigator.geolocation) {
    notify.warning('La géolocalisation n\'est pas supportée par votre navigateur')
    return
  }

  locationLoading.value = true

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      userLocation.value = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      }
      locationLoading.value = false

      // Add user marker to map
      await addUserLocationMarker()
    },
    (error) => {
      locationLoading.value = false
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

      notify.error(message, 'Erreur de géolocalisation')
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000 // 5 minutes
    }
  )
}

const fetchAllMerchants = async () => {
  loading.value = true

  try {
    const response = await fetch('http://localhost:8000/api/merchants/all-with-location', {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()

    if (data.success) {
      merchants.value = data.data.map((merchant: any) => ({
        id: merchant.id,
        business_name: merchant.business_name,
        business_type: merchant.business_type,
        latitude: merchant.latitude,
        longitude: merchant.longitude,
        distance_km: merchant.distance_km,
        products_count: merchant.products_count,
        is_verified: merchant.is_verified,
        user: merchant.user
      }))

      // Add markers to map after loading merchants
      await addMerchantMarkers()
    } else {
      // Log error for debugging
      notify.error('Erreur lors de la récupération des commerçants')
    }
  } catch (error) {
    // Log error for debugging
    notify.error('Erreur lors de la récupération des commerçants')
  } finally {
    loading.value = false
  }
}

const refreshMerchants = async () => {
  await fetchAllMerchants()
}

const viewMerchantProducts = () => {
  if (selectedMerchant.value) {
    // For now, redirect to products view with merchant filter
    // This could be enhanced with a merchant-specific route
    router.push('/products')
    selectedMerchant.value = null
  }
}



// Initialize everything on mount
onMounted(async () => {
  await nextTick()
  await initializeMap()
  await fetchAllMerchants()
})
</script>