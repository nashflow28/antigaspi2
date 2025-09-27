<template>
  <DashboardLayout
    :sidebar="sidebar"
    :header="header"
    class="bg-gradient-to-br from-neutral-50 to-neutral-100"
  >
    <!-- Header -->
    <div class="bg-white/80 backdrop-blur-sm border-b border-neutral-200 sticky top-0 z-10">
      <div class="container mx-auto px-4 py-6">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-responsive-xl font-semibold text-neutral-900">Gestion des Points de Fidélité</h1>
            <p class="text-neutral-600 mt-1">
              Attribuez des points à vos clients fidèles
            </p>
          </div>
          <div class="flex items-center gap-3">
            <Button
              :disabled="loading"
              variant="outline"
              size="sm"
              :left-icon="RefreshCw"
              :icon-class="{ 'animate-spin': loading }"
              @click="refreshData"
            >
              Actualiser
            </Button>
            <Button
              variant="primary"
              size="sm"
              :left-icon="Plus"
              @click="openAwardModal()"
            >
              Attribuer Points
            </Button>
          </div>
        </div>
      </div>
    </div>

    <div class="container mx-auto px-4 py-8">
      <!-- Quick Stats -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-responsive-sm font-medium text-neutral-600">Total Clients</p>
              <p class="text-responsive-xl font-semibold text-primary-600 mt-1">{{ allUsersPoints.length }}</p>
            </div>
            <div class="p-3 bg-primary-100 rounded-xl">
              <Users class="w-10 h-10 text-primary-600" />
            </div>
          </div>
        </Card>

        <Card>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-responsive-sm font-medium text-neutral-600">Points Distribués</p>
              <p class="text-responsive-xl font-semibold text-green-600 mt-1">{{ totalPointsDistributed }}</p>
            </div>
            <div class="p-3 bg-green-100 rounded-xl">
              <TrendingUp class="w-10 h-10 text-green-600" />
            </div>
          </div>
        </Card>

        <Card>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-responsive-sm font-medium text-neutral-600">Clients Actifs</p>
              <p class="text-responsive-xl font-semibold text-blue-600 mt-1">{{ activeCustomers }}</p>
            </div>
            <div class="p-3 bg-blue-100 rounded-xl">
              <Star class="w-10 h-10 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-responsive-sm font-medium text-neutral-600">Moyenne Points</p>
              <p class="text-responsive-xl font-semibold text-purple-600 mt-1">{{ averagePoints }}</p>
            </div>
            <div class="p-3 bg-purple-100 rounded-xl">
              <Award class="w-10 h-10 text-purple-600" />
            </div>
          </div>
        </Card>
      </div>

      <!-- Customers List -->
      <Card>
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-responsive-xl font-semibold text-neutral-900">Clients avec Points de Fidélité</h3>
          <div class="flex items-center gap-3">
            <!-- Search -->
            <div class="relative">
              <Search class="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" />
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Rechercher un client..."
                class="pl-9 pr-4 py-3 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
            </div>
            <!-- Sort -->
            <select
              v-model="sortBy"
              class="px-4 py-3 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="total_points">Trier par points</option>
              <option value="name">Trier par nom</option>
              <option value="last_activity">Trier par activité</option>
            </select>
          </div>
        </div>

        <!-- Table -->
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-neutral-200">
                <th class="text-left py-3 px-4 font-semibold text-neutral-900">Client</th>
                <th class="text-left py-3 px-4 font-semibold text-neutral-900">Email</th>
                <th class="text-left py-3 px-4 font-semibold text-neutral-900">Points</th>
                <th class="text-left py-3 px-4 font-semibold text-neutral-900">Dernière Activité</th>
                <th class="text-left py-3 px-4 font-semibold text-neutral-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="customer in filteredCustomers"
                :key="customer.id"
                class="border-b border-neutral-100 hover:transition-colors"
              >
                <td class="py-4 px-4">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-nav-gradient rounded-full flex items-center justify-center text-white font-semibold">
                      {{ customer.name.charAt(0).toUpperCase() }}
                    </div>
                    <div>
                      <p class="font-medium text-neutral-900">{{ customer.name }}</p>
                      <p class="text-responsive-sm text-neutral-500">ID: {{ customer.id }}</p>
                    </div>
                  </div>
                </td>
                <td class="py-4 px-4 text-neutral-600">{{ customer.email }}</td>
                <td class="py-4 px-4">
                  <div class="flex items-center gap-2">
                    <Star class="w-5 h-5 text-yellow-500" />
                    <span class="font-semibold text-neutral-900">{{ formatPoints(customer.total_points) }}</span>
                  </div>
                </td>
                <td class="py-4 px-4 text-neutral-600">
                  {{ customer.last_activity ? formatDate(customer.last_activity) : 'Aucune' }}
                </td>
                <td class="py-4 px-4">
                  <Button
                    variant="primary"
                    size="sm"
                    :left-icon="Plus"
                    @click="openAwardModal(customer)"
                  >
                    Attribuer
                  </Button>
                </td>
              </tr>
            </tbody>
          </table>

          <div v-if="filteredCustomers.length === 0" class="text-center py-8">
            <Users class="w-16 h-16 text-neutral-300 mx-auto mb-4" />
            <p class="text-neutral-600">Aucun client trouvé</p>
            <p class="text-responsive-sm text-neutral-500">
              {{ searchQuery ? 'Modifiez votre recherche' : 'Les clients apparaîtront ici une fois qu\'ils auront des points' }}
            </p>
          </div>
        </div>
      </Card>
    </div>

    <!-- Award Points Modal -->
    <div v-if="showAwardModal" class="fixed inset-0 z-[9999] overflow-y-auto">
      <div class="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity" @click="closeAwardModal" />

      <div class="flex min-h-full items-center justify-center p-4">
        <div class="relative w-full max-w-md bg-white rounded-2xl shadow-xl transform transition-all" @click.stop>
          <div class="px-6 py-4 border-b border-neutral-200">
            <div class="flex items-center justify-between">
              <h3 class="text-responsive-lg font-semibold text-neutral-900">Attribuer des Points</h3>
              <button class="p-2 hover:transition-colors" @click="closeAwardModal">
                <X class="w-5 h-5 text-neutral-400" />
              </button>
            </div>
          </div>

          <form class="px-6 py-6 space-y-4" @submit.prevent="submitAward">
            <!-- Customer Selection -->
            <div v-if="!selectedCustomer">
              <Label>Sélectionner un client</Label>
              <div class="text-responsive-xs text-neutral-500 mb-2">
                Debug: {{ allUsersPoints.length }} clients chargés
              </div>
              <Select
                v-model="awardForm.user_id"
                required
              >
                <option value="">Choisir un client...</option>
                <option
                  v-for="customer in allUsersPoints"
                  :key="customer.id"
                  :value="customer.id"
                >
                  {{ customer.name }} ({{ customer.email }})
                </option>
              </Select>
            </div>

            <div v-else class="bg-neutral-50 rounded-lg p-3">
              <p class="text-responsive-sm text-neutral-600">Client sélectionné:</p>
              <p class="font-semibold text-neutral-900">{{ selectedCustomer.name }}</p>
              <p class="text-responsive-sm text-neutral-600">{{ selectedCustomer.email }}</p>
            </div>

            <!-- Points Amount -->
            <div>
              <Label>Nombre de points</Label>
              <Input
                v-model.number="awardForm.points"
                type="number"
                min="1"
                max="1000"
                required
                placeholder="Ex: 50"
              />
            </div>

            <!-- Reason -->
            <div>
              <Label>Motif</Label>
              <Select
                v-model="awardForm.earned_from"
                required
              >
                <option value="">Choisir un motif...</option>
                <option value="purchase">Achat</option>
                <option value="review">Avis laissé</option>
                <option value="referral">Parrainage</option>
                <option value="bonus">Bonus spécial</option>
              </Select>
            </div>

            <!-- Description -->
            <div>
              <Label>Description</Label>
              <textarea
                v-model="awardForm.description"
                required
                rows="3"
                class="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Décrivez pourquoi vous attribuez ces points..."
              />
            </div>

            <!-- Expiration (optional) -->
            <div>
              <Label>Expiration (optionnel)</Label>
              <Input
                v-model="awardForm.expires_at"
                type="date"
                :min="tomorrow"
              />
              <p class="text-responsive-xs text-neutral-500 mt-1">
                Laissez vide pour une expiration automatique dans 1 an
              </p>
            </div>

            <!-- Actions -->
            <div class="flex gap-3 pt-4">
              <Button
                type="button"
                class="flex-1"
                variant="outline"
                @click="closeAwardModal"
              >
                Annuler
              </Button>
              <Button
                type="submit"
                :disabled="awarding"
                class="flex-1"
                variant="primary"
                :left-icon="awarding ? Loader2 : undefined"
                :icon-class="awarding ? 'animate-spin' : undefined"
              >
                {{ awarding ? 'Attribution...' : 'Attribuer' }}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </DashboardLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  Plus, RefreshCw, X, Loader2, Search, Users, TrendingUp, Star, Award
} from 'lucide-vue-next'
import { useLoyaltyPoints } from '@/composables/useLoyaltyPoints'
import DashboardLayout from '@/components/ui/DashboardLayout.vue'
import { useDashboardLayout } from '@/composables/useDashboardLayout'
import Button from '@/components/ui/2025/Button.vue'
import Card from '@/components/ui/2025/Card.vue'
import Label from '@/components/ui/2025/Label.vue'
import Input from '@/components/ui/2025/Input.vue'
import Select from '@/components/ui/2025/Select.vue'

// Composables
const {
  allUsersPoints,
  loading,
  fetchAllUsersPoints,
  awardPoints,
  formatPoints
} = useLoyaltyPoints()

// State
const showAwardModal = ref(false)
const selectedCustomer = ref(null)
const awarding = ref(false)
const searchQuery = ref('')
const sortBy = ref('total_points')

const awardForm = ref({
  user_id: '',
  points: null,
  earned_from: '',
  description: '',
  expires_at: ''
})

const { sidebar, header } = useDashboardLayout('merchant')

// Computed
const filteredCustomers = computed(() => {
  let filtered = allUsersPoints.value

  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(customer =>
      customer.name.toLowerCase().includes(query) ||
      customer.email.toLowerCase().includes(query)
    )
  }

  // Sort
  filtered.sort((a, b) => {
    if (sortBy.value === 'total_points') {
      return b.total_points - a.total_points
    } else if (sortBy.value === 'name') {
      return a.name.localeCompare(b.name)
    } else if (sortBy.value === 'last_activity') {
      if (!a.last_activity) return 1
      if (!b.last_activity) return -1
      return new Date(b.last_activity).getTime() - new Date(a.last_activity).getTime()
    }
    return 0
  })

  return filtered
})

const totalPointsDistributed = computed(() => {
  return allUsersPoints.value.reduce((sum, customer) => sum + customer.total_points, 0)
})

const activeCustomers = computed(() => {
  return allUsersPoints.value.filter(customer => customer.total_points > 0).length
})

const averagePoints = computed(() => {
  if (allUsersPoints.value.length === 0) return 0
  return Math.round(totalPointsDistributed.value / allUsersPoints.value.length)
})

const tomorrow = computed(() => {
  const date = new Date()
  date.setDate(date.getDate() + 1)
  return date.toISOString().split('T')[0]
})

// Methods
const refreshData = async () => {
  await fetchAllUsersPoints()
}

const openAwardModal = (customer = null) => {
  selectedCustomer.value = customer
  if (customer) {
    awardForm.value.user_id = customer.id
  }
  showAwardModal.value = true
}

const closeAwardModal = () => {
  showAwardModal.value = false
  selectedCustomer.value = null
  awarding.value = false
  resetForm()
}

const resetForm = () => {
  awardForm.value = {
    user_id: '',
    points: null,
    earned_from: '',
    description: '',
    expires_at: ''
  }
}

const submitAward = async () => {
  awarding.value = true

  const data = {
    user_id: parseInt(awardForm.value.user_id),
    points: awardForm.value.points,
    earned_from: awardForm.value.earned_from,
    description: awardForm.value.description,
    expires_at: awardForm.value.expires_at || undefined
  }

  const success = await awardPoints(data)

  if (success) {
    closeAwardModal()
    await refreshData() // Refresh the list
  }

  awarding.value = false
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

// Lifecycle
onMounted(() => {
  fetchAllUsersPoints()
})
</script>

<style scoped>
/* Add any specific styles here */
</style>
