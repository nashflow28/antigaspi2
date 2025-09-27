<template>
  <div class="address-search">
    <div class="relative">
      <!-- Search Input -->
      <div class="relative">
        <input
          ref="searchInput"
          v-model="searchQuery"
          type="text"
          :placeholder="placeholder"
          :disabled="loading"
          class="w-full pl-12 pr-12 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 shadow-sm"
          @input="handleInput"
          @focus="showResults = true"
          @blur="handleBlur"
          @keydown.enter.prevent="selectFirstResult"
          @keydown.arrow-down.prevent="navigateResults(1)"
          @keydown.arrow-up.prevent="navigateResults(-1)"
          @keydown.escape="clearResults"
        >

        <!-- Search Icon -->
        <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search class="w-5 h-5 text-gray-400" />
        </div>

        <!-- Loading/Clear Button -->
        <div class="absolute inset-y-0 right-0 pr-4 flex items-center">
          <button
            v-if="searchQuery && !loading"
            class="p-1 hover:bg-gray-100 rounded-full transition-colors"
            type="button"
            @click="clearSearch"
          >
            <X class="w-4 h-4 text-gray-400" />
          </button>
          <div v-else-if="loading" class="p-1">
            <div class="animate-spin w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full" />
          </div>
        </div>
      </div>

      <!-- Results Dropdown -->
      <Transition name="dropdown">
        <div
          v-if="showResults && (results.length > 0 || loading || error)"
          class="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto"
        >
          <!-- Loading State -->
          <div v-if="loading" class="p-4 text-center text-gray-500">
            <div class="flex items-center justify-center space-x-2">
              <div class="animate-spin w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full" />
              <span class="text-sm">Recherche en cours...</span>
            </div>
          </div>

          <!-- Error State -->
          <div v-else-if="error" class="p-4 text-center text-red-500">
            <div class="flex items-center justify-center space-x-2">
              <AlertCircle class="w-4 h-4" />
              <span class="text-sm">{{ error }}</span>
            </div>
          </div>

          <!-- Results -->
          <div v-else-if="results.length > 0">
            <button
              v-for="(result, index) in results"
              :key="`${result.place_id || result.lat}-${index}`"
              :class="[
                'w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0',
                { 'bg-primary-50': index === selectedIndex }
              ]"
              type="button"
              @click="selectResult(result)"
            >
              <div class="flex items-start space-x-3">
                <MapPin class="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                <div class="flex-1 min-w-0">
                  <div class="font-medium text-gray-900 truncate">
                    {{ result.display_name || result.formatted_address }}
                  </div>
                  <div v-if="result.address" class="text-sm text-gray-500 truncate">
                    {{ formatAddress(result.address) }}
                  </div>
                  <div class="flex items-center space-x-2 mt-1">
                    <span class="text-xs text-gray-400">
                      {{ result.type || 'Adresse' }}
                    </span>
                    <span v-if="result.distance" class="text-xs text-primary-600">
                      {{ formatDistance(result.distance) }}
                    </span>
                  </div>
                </div>
              </div>
            </button>
          </div>

          <!-- No Results -->
          <div v-else class="p-4 text-center text-gray-500">
            <div class="flex items-center justify-center space-x-2">
              <MapPin class="w-4 h-4" />
              <span class="text-sm">Aucun résultat trouvé</span>
            </div>
          </div>
        </div>
      </Transition>
    </div>

    <!-- Selected Location Display -->
    <div v-if="selectedLocation" class="mt-3 p-3 bg-primary-50 border border-primary-200 rounded-lg">
      <div class="flex items-start justify-between">
        <div class="flex items-start space-x-2">
          <MapPin class="w-4 h-4 text-primary-600 mt-0.5" />
          <div>
            <div class="font-medium text-primary-900 text-sm">
              {{ selectedLocation.display_name || selectedLocation.formatted_address }}
            </div>
            <div class="text-xs text-primary-600 mt-1">
              {{ selectedLocation.lat.toFixed(6) }}, {{ selectedLocation.lng.toFixed(6) }}
            </div>
          </div>
        </div>
        <button
          class="p-1 hover:bg-primary-100 rounded-full transition-colors"
          type="button"
          @click="clearSelection"
        >
          <X class="w-3 h-3 text-primary-500" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { Search, X, MapPin, AlertCircle } from 'lucide-vue-next'
import { useGeolocation } from '@/composables/useGeolocation'
import { debounce } from 'lodash-es'

export interface SearchResult {
  place_id?: string
  display_name?: string
  formatted_address?: string
  lat: number
  lng: number
  type?: string
  address?: {
    city?: string
    country?: string
    postcode?: string
    road?: string
  }
  distance?: number
}

interface Props {
  placeholder?: string
  minLength?: number
  debounceMs?: number
  enableUserLocation?: boolean
  countryCode?: string
  language?: string
  maxResults?: number
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Rechercher une adresse...',
  minLength: 3,
  debounceMs: 300,
  enableUserLocation: true,
  countryCode: 'TG', // Togo par défaut
  language: 'fr',
  maxResults: 5
})

const emit = defineEmits<{
  select: [result: SearchResult]
  clear: []
  error: [error: string]
}>()

const { position, getCurrentPosition } = useGeolocation()

const searchInput = ref<HTMLInputElement>()
const searchQuery = ref('')
const results = ref<SearchResult[]>([])
const selectedLocation = ref<SearchResult | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)
const showResults = ref(false)
const selectedIndex = ref(-1)

// Recherche avec Nominatim (OpenStreetMap)
const searchWithNominatim = async (query: string): Promise<SearchResult[]> => {
  const params = new URLSearchParams({
    q: query,
    format: 'json',
    addressdetails: '1',
    limit: props.maxResults.toString(),
    'accept-language': props.language,
    countrycodes: props.countryCode
  })

  const response = await fetch(`https://nominatim.openstreetmap.org/search?${params}`)

  if (!response.ok) {
    throw new Error('Erreur de recherche d\'adresse')
  }

  const data = await response.json()

  return data.map((item: any) => ({
    place_id: item.place_id,
    display_name: item.display_name,
    lat: parseFloat(item.lat),
    lng: parseFloat(item.lon),
    type: item.type,
    address: item.address,
    distance: position.value ? calculateDistance(
      { lat: position.value.latitude, lng: position.value.longitude },
      { lat: parseFloat(item.lat), lng: parseFloat(item.lon) }
    ) : undefined
  }))
}

// Calcul de distance simple
const calculateDistance = (pos1: { lat: number; lng: number }, pos2: { lat: number; lng: number }): number => {
  const R = 6371 // Rayon de la Terre en km
  const dLat = (pos2.lat - pos1.lat) * Math.PI / 180
  const dLon = (pos2.lng - pos1.lng) * Math.PI / 180
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(pos1.lat * Math.PI / 180) * Math.cos(pos2.lat * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

// Recherche debounced
const debouncedSearch = debounce(async (query: string) => {
  if (query.length < props.minLength) {
    results.value = []
    return
  }

  loading.value = true
  error.value = null

  try {
    const searchResults = await searchWithNominatim(query)

    // Trier par distance si position disponible
    if (position.value) {
      searchResults.sort((a, b) => (a.distance || 0) - (b.distance || 0))
    }

    results.value = searchResults
  } catch (err) {
    console.error('Search error:', err)
    error.value = err instanceof Error ? err.message : 'Erreur de recherche'
    emit('error', error.value)
  } finally {
    loading.value = false
  }
}, props.debounceMs)

const handleInput = () => {
  selectedIndex.value = -1
  if (searchQuery.value.trim()) {
    debouncedSearch(searchQuery.value.trim())
  } else {
    results.value = []
    error.value = null
  }
}

const selectResult = (result: SearchResult) => {
  selectedLocation.value = result
  searchQuery.value = result.display_name || result.formatted_address || ''
  showResults.value = false
  selectedIndex.value = -1
  emit('select', result)
}

const selectFirstResult = () => {
  if (results.value.length > 0) {
    selectResult(results.value[0])
  }
}

const navigateResults = (direction: number) => {
  if (results.value.length === 0) return

  selectedIndex.value += direction

  if (selectedIndex.value < 0) {
    selectedIndex.value = results.value.length - 1
  } else if (selectedIndex.value >= results.value.length) {
    selectedIndex.value = 0
  }
}

const clearSearch = () => {
  searchQuery.value = ''
  results.value = []
  error.value = null
  selectedIndex.value = -1
  showResults.value = false
}

const clearSelection = () => {
  selectedLocation.value = null
  clearSearch()
  emit('clear')
}

const clearResults = () => {
  showResults.value = false
  selectedIndex.value = -1
}

const handleBlur = () => {
  // Délai pour permettre le clic sur un résultat
  setTimeout(() => {
    showResults.value = false
  }, 200)
}

const formatAddress = (address: any): string => {
  const parts = []
  if (address.road) parts.push(address.road)
  if (address.city) parts.push(address.city)
  if (address.postcode) parts.push(address.postcode)
  return parts.join(', ')
}

const formatDistance = (distance: number): string => {
  if (distance < 1) {
    return `${Math.round(distance * 1000)}m`
  }
  return `${distance.toFixed(1)}km`
}

// Obtenir la position utilisateur au montage si activé
onMounted(async () => {
  if (props.enableUserLocation) {
    try {
      await getCurrentPosition()
    } catch (err) {
      console.warn('Could not get user location:', err)
    }
  }
})

// Cleanup
onUnmounted(() => {
  debouncedSearch.cancel()
})

// Expose methods for parent components
defineExpose({
  clearSearch,
  clearSelection,
  focus: () => searchInput.value?.focus(),
  getSelectedLocation: () => selectedLocation.value
})
</script>

<style scoped>
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Scrollbar styling for results */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>
