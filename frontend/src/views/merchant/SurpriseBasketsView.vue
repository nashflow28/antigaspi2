<template>
  <DashboardLayout
    :sidebar="sidebar"
    :header="header"
    class="bg-gradient-to-br from-purple-50 to-pink-50"
  >
    <div class="p-6">
    <!-- Header -->
    <div class="mb-8" v-if="currentView === 'list'">
      <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div>
          <h1 class="text-3xl lg:text-4xl font-bold text-neutral-900 mb-2">
            Paniers Surprise
          </h1>
          <p class="text-neutral-600 text-lg">
            Créez des paniers mystère pour valoriser vos invendus
          </p>
        </div>

        <div class="flex gap-4">
          <button
            @click="refreshData"
            class="btn btn-ghost"
            :disabled="loading"
          >
            <RefreshCwIcon class="w-5 h-5 mr-2" />
            Actualiser
          </button>
          <button
            @click="currentView = 'create'"
            class="btn btn-primary glow-effect"
          >
            <PlusIcon class="w-5 h-5 mr-2" />
            Nouveau panier
          </button>
        </div>
      </div>
    </div>

    <!-- Navigation Header for other views -->
    <div v-else class="mb-8">
      <div class="flex items-center gap-4 mb-4">
        <button
          @click="currentView = 'list'"
          class="flex items-center text-neutral-600 hover:text-neutral-900 transition-colors"
        >
          <ArrowLeftIcon class="w-5 h-5 mr-2" />
          Retour aux paniers
        </button>
      </div>

      <div>
        <h1 class="text-3xl lg:text-4xl font-bold text-neutral-900 mb-2">
          <template v-if="currentView === 'create'">Nouveau Panier Surprise</template>
          <template v-else-if="currentView === 'edit'">Modifier le Panier</template>
          <template v-else-if="currentView === 'detail'">Détails du Panier</template>
        </h1>
        <p class="text-neutral-600 text-lg">
          <template v-if="currentView === 'create'">Créez un panier mystère attractif</template>
          <template v-else-if="currentView === 'edit'">{{ editingBasket?.name }}</template>
          <template v-else-if="currentView === 'detail'">{{ selectedBasket?.name }}</template>
        </p>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading && currentView === 'list'" class="card">
      <div class="flex items-center justify-center py-12">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <span class="ml-3 text-neutral-600">Chargement des paniers surprise...</span>
      </div>
    </div>

    <!-- Error State -->
    <div v-if="error" class="card bg-accent-red/10 border-accent-red/30 mb-6">
      <div class="flex items-center justify-center py-8">
        <ExclamationTriangleIcon class="w-8 h-8 text-accent-red mr-3" />
        <div>
          <p class="text-accent-red/90 font-medium">Erreur lors du chargement</p>
          <p class="text-accent-red text-sm">{{ error }}</p>
        </div>
      </div>
    </div>

    <!-- List View -->
    <div v-if="currentView === 'list' && !loading">
      <!-- Quick Stats -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div class="card bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-purple-100 text-sm font-medium">Total Paniers</p>
              <p class="text-3xl font-bold">{{ baskets.length }}</p>
            </div>
            <div class="p-3 bg-white/20 rounded-xl">
              <GiftIcon class="w-6 h-6" />
            </div>
          </div>
        </div>

        <div class="card bg-gradient-to-r from-primary-500 to-primary-600 text-white">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-primary-100 text-sm font-medium">Actifs</p>
              <p class="text-3xl font-bold">{{ activeBaskets.length }}</p>
            </div>
            <div class="p-3 bg-white/20 rounded-xl">
              <CheckCircleIcon class="w-6 h-6" />
            </div>
          </div>
        </div>

        <div class="card bg-gradient-to-r from-accent-orange to-accent-orange/90 text-white">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-accent-orange/70 text-sm font-medium">Stock Total</p>
              <p class="text-3xl font-bold">{{ totalStock }}</p>
            </div>
            <div class="p-3 bg-white/20 rounded-xl">
              <PackageIcon class="w-6 h-6" />
            </div>
          </div>
        </div>

        <div class="card bg-gradient-to-r from-accent-blue/50 to-accent-blue/90 text-white">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-accent-blue/60 text-sm font-medium">Revenus Potentiels</p>
              <p class="text-3xl font-bold">{{ formatPrice(totalRevenue) }}</p>
            </div>
            <div class="p-3 bg-white/20 rounded-xl">
              <DollarSignIcon class="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="baskets.length === 0" class="card text-center py-12">
        <div class="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <GiftIcon class="w-10 h-10 text-purple-500" />
        </div>
        <h3 class="text-xl font-bold text-neutral-900 mb-2">Aucun panier surprise</h3>
        <p class="text-neutral-600 mb-6 max-w-md mx-auto">
          Créez votre premier panier surprise pour valoriser vos invendus et offrir des surprises à vos clients
        </p>
        <button
          @click="currentView = 'create'"
          class="btn btn-primary"
        >
          <PlusIcon class="w-5 h-5 mr-2" />
          Créer mon premier panier
        </button>
      </div>

      <!-- Baskets Grid -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="basket in baskets"
          :key="basket.id"
          class="card card-interactive glow-effect animate-fade-in-up overflow-hidden"
        >
          <!-- Image/Icon -->
          <div class="relative h-48 bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
            <GiftIcon class="w-16 h-16 text-purple-500" />

            <!-- Status Badge -->
            <div class="absolute top-4 right-4">
              <span
                class="px-2 py-1 text-xs font-medium rounded-full"
                :class="basket.is_active ? 'bg-primary-100 text-primary-700' : 'bg-neutral-100 text-neutral-600'"
              >
                {{ basket.is_active ? 'Actif' : 'Inactif' }}
              </span>
            </div>

            <!-- Discount Badge -->
            <div class="absolute bottom-4 left-4">
              <span class="px-2 py-1 text-xs font-bold bg-accent-red/100 text-white rounded-full">
                -{{ Math.round(((basket.original_price - basket.discounted_price) / basket.original_price) * 100) }}%
              </span>
            </div>
          </div>

          <!-- Content -->
          <div class="p-6">
            <div class="flex items-start justify-between mb-4">
              <div>
                <h3 class="font-bold text-neutral-900 mb-1">{{ basket.name }}</h3>
                <p class="text-sm text-neutral-600 line-clamp-2">{{ basket.description }}</p>
              </div>
            </div>

            <!-- Pricing -->
            <div class="flex items-center gap-2 mb-4">
              <span class="text-lg font-bold text-primary-600">{{ formatPrice(basket.discounted_price) }}</span>
              <span class="text-sm text-neutral-400 line-through">{{ formatPrice(basket.original_price) }}</span>
            </div>

            <!-- Stock -->
            <div class="flex items-center gap-2 mb-4 text-sm text-neutral-600">
              <PackageIcon class="w-4 h-4" />
              <span>{{ basket.quantity_available }} disponible{{ basket.quantity_available > 1 ? 's' : '' }}</span>
            </div>

            <!-- Products Count -->
            <div class="flex items-center gap-2 mb-6 text-sm text-neutral-600">
              <LayersIcon class="w-4 h-4" />
              <span>{{ basket.products?.length || 0 }} produit{{ (basket.products?.length || 0) > 1 ? 's' : '' }}</span>
            </div>

            <!-- Actions -->
            <div class="flex gap-2">
              <button
                @click="handleView(basket)"
                class="btn btn-ghost btn-sm flex-1"
              >
                <EyeIcon class="w-4 h-4 mr-1" />
                Voir
              </button>
              <button
                @click="handleEdit(basket)"
                class="btn btn-secondary btn-sm flex-1"
              >
                <PencilIcon class="w-4 h-4 mr-1" />
                Modifier
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create View -->
    <div v-else-if="currentView === 'create'">
      <CreateSurpriseBasket
        @cancel="currentView = 'list'"
        @created="handleBasketCreated"
      />
    </div>

    <!-- Edit View -->
    <div v-else-if="currentView === 'edit' && editingBasket">
      <EditSurpriseBasket
        :basket="editingBasket"
        @cancel="currentView = 'list'"
        @updated="handleBasketUpdated"
      />
    </div>

    <!-- Detail View -->
    <div v-else-if="currentView === 'detail' && selectedBasket">
      <SurpriseBasketDetail
        :basket="selectedBasket"
        @edit="handleEdit"
        @close="currentView = 'list'"
      />
    </div>
  </DashboardLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { merchantService } from '@/services/merchantService'
import { formatPrice } from '@/utils/currency'
import type { SurpriseBasket } from '@/types'
import DashboardLayout from '@/components/ui/DashboardLayout.vue'
import { useDashboardLayout } from '@/composables/useDashboardLayout'
import {
  ArrowLeftIcon,
  PlusIcon,
  RefreshCwIcon,
  GiftIcon,
  CheckCircleIcon,
  PackageIcon,
  DollarSignIcon,
  LayersIcon,
  EyeIcon,
  PencilIcon,
  ExclamationTriangleIcon
} from 'lucide-vue-next'
import CreateSurpriseBasket from '@/components/merchant/CreateSurpriseBasket.vue'
import EditSurpriseBasket from '@/components/merchant/EditSurpriseBasket.vue'
import SurpriseBasketDetail from '@/components/merchant/SurpriseBasketDetail.vue'

type ViewType = 'list' | 'create' | 'edit' | 'detail'

// État
const currentView = ref<ViewType>('list')
const baskets = ref<SurpriseBasket[]>([])
const editingBasket = ref<SurpriseBasket | null>(null)
const selectedBasket = ref<SurpriseBasket | null>(null)
const loading = ref(false)
const error = ref('')
const { sidebar, header } = useDashboardLayout('merchant')

// Calculés
const activeBaskets = computed(() => baskets.value.filter(basket => basket.is_active))

const totalStock = computed(() =>
  baskets.value.reduce((sum, basket) => sum + basket.quantity_available, 0)
)

const totalRevenue = computed(() =>
  baskets.value.reduce((sum, basket) =>
    sum + (basket.discounted_price * basket.quantity_available), 0
  )
)

// Méthodes
const loadBaskets = async () => {
  try {
    loading.value = true
    error.value = ''

    const response = await merchantService.getSurpriseBaskets()

    if (!response.success) {
      throw new Error(response.message || 'Erreur lors du chargement des paniers surprise')
    }

    baskets.value = response.data.baskets

  } catch (err: any) {
    error.value = err.message
    console.error('Erreur lors du chargement des paniers surprise:', err)
  } finally {
    loading.value = false
  }
}

const refreshData = () => {
  loadBaskets()
}

// Handlers
const handleEdit = (basket: SurpriseBasket) => {
  editingBasket.value = basket
  currentView.value = 'edit'
}

const handleView = (basket: SurpriseBasket) => {
  selectedBasket.value = basket
  currentView.value = 'detail'
}

const handleBasketCreated = () => {
  console.log('✅ Panier surprise créé avec succès')
  currentView.value = 'list'
  loadBaskets() // Recharger la liste
}

const handleBasketUpdated = () => {
  console.log('✅ Panier surprise mis à jour avec succès')
  currentView.value = 'list'
  editingBasket.value = null
  loadBaskets() // Recharger la liste
}

// Initialisation
onMounted(() => {
  loadBaskets()
})
</script>