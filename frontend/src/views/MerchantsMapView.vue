<template>
  <div class="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100">
    <!-- Header -->
    <div class="bg-white/80 backdrop-blur-sm border-b border-neutral-200 sticky top-0 z-10">
      <div class="container mx-auto px-4 py-6">
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 class="text-3xl font-bold text-neutral-900">Carte des commerçants</h1>
            <p class="text-neutral-600 mt-1">
              {{ merchants.length }} commerçant{{ merchants.length > 1 ? 's' : '' }} trouvé{{ merchants.length > 1 ? 's' : '' }}
            </p>
          </div>

          <!-- Location Controls -->
          <div class="flex flex-col sm:flex-row gap-3">
            <button
              @click="getCurrentLocation"
              :disabled="locationLoading"
              class="btn btn-ghost flex items-center gap-2"
            >
              <MapPin class="w-5 h-5" :class="{ 'animate-pulse': locationLoading }" />
              {{ locationLoading ? 'Localisation...' : (userLocation ? 'Position activée' : 'Me localiser') }}
            </button>
            <button
              @click="searchNearbyMerchants"
              :disabled="!userLocation || loading"
              class="btn btn-primary flex items-center gap-2"
            >
              <Search class="w-5 h-5" />
              Chercher près de moi
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Map Container -->
    <div class="container mx-auto px-4 py-8">
      <div class="bg-white rounded-2xl shadow-lg p-6">
        <GoogleMap
          :api-key="googleMapsApiKey"
          :center="mapCenter"
          :zoom="mapZoom"
          :markers="mapMarkers"
          :show-user-location="!!userLocation"
          :user-location="userLocation"
          height="600px"
          height-class="h-[600px]"
          @map-ready="onMapReady"
          @marker-click="onMarkerClick"
        />
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
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import GoogleMap from '@/components/maps/GoogleMap.vue'
import { MapPin, Search, X, Building, Navigation, Phone, Package } from 'lucide-vue-next'

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

// Environment configuration
const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''

// State
const merchants = ref<Merchant[]>([])
const loading = ref(false)
const locationLoading = ref(false)
const selectedMerchant = ref<Merchant | null>(null)

const userLocation = ref<{ latitude: number; longitude: number } | null>(null)

// Map configuration
const mapCenter = computed(() => {
  if (userLocation.value) {
    return {
      lat: userLocation.value.latitude,
      lng: userLocation.value.longitude
    }
  }
  return { lat: 5.3474, lng: -3.9857 } // Abidjan default
})

const mapZoom = computed(() => userLocation.value ? 14 : 12)

const mapMarkers = computed(() => {
  return merchants.value.map(merchant => ({
    id: merchant.id,
    position: { lat: merchant.latitude, lng: merchant.longitude },
    title: merchant.business_name,
    info: `${merchant.business_type} - ${merchant.products_count} produit(s)`,
    onClick: () => {
      selectedMerchant.value = merchant
    }
  }))
})

// Methods
const getCurrentLocation = () => {
  if (!navigator.geolocation) {
    alert('La géolocalisation n\'est pas supportée par votre navigateur')
    return
  }

  locationLoading.value = true

  navigator.geolocation.getCurrentPosition(
    (position) => {
      userLocation.value = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      }
      locationLoading.value = false
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

      alert(message)
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000 // 5 minutes
    }
  )
}

const searchNearbyMerchants = async () => {
  if (!userLocation.value) {
    alert('Veuillez d\'abord activer votre géolocalisation')
    return
  }

  loading.value = true

  try {
    const params = new URLSearchParams({
      latitude: userLocation.value.latitude.toString(),
      longitude: userLocation.value.longitude.toString(),
      radius: '20' // 20km radius
    })

    const response = await fetch(`http://localhost:8000/api/merchants/nearby?${params}`, {
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
    } else {
      console.error('API returned error:', data.message)
      alert('Erreur lors de la recherche des commerçants')
    }
  } catch (error) {
    console.error('Error fetching nearby merchants:', error)
    alert('Erreur lors de la recherche des commerçants')
  } finally {
    loading.value = false
  }
}

const onMapReady = (map: google.maps.Map) => {
  console.log('Google Map is ready:', map)
}

const onMarkerClick = (marker: any) => {
  const merchant = merchants.value.find(m => m.id === marker.id)
  if (merchant) {
    selectedMerchant.value = merchant
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

// Load default merchants on mount
onMounted(async () => {
  // Try to get user location automatically
  getCurrentLocation()
})
</script>