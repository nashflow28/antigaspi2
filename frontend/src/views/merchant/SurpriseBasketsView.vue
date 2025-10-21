<template>
  <DashboardLayout
    :sidebar="sidebar"
    :header="header"
    class="bg-gradient-to-br from-purple-50 to-pink-50"
  >
    <div class="p-6">
      <!-- Header -->
      <div v-if="currentView === 'list'" class="mt-4 sm:mb-3xl">
        <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 sm:gapadding-xl">
          <div>
            <h1 class="text-xl lg:text-3xl font-semibold text-gray-900 mt-2">
              Paniers Surprise
            </h1>
            <p class="text-gray-700 text-lg">
              Créez des paniers mystère pour valoriser vos invendus
            </p>
          </div>

          <div class="flex gap-3">
            <Button
              variant="ghost"
              :disabled="loading"
              :left-icon="RefreshCwIcon"
              @click="refreshData"
            >
              Actualiser
            </Button>
            <Button
              variant="primary"
              class="glow-effect"
              :left-icon="PlusIcon"
              @click="currentView = 'create'"
            >
              Nouveau panier
            </Button>
          </div>
        </div>
      </div>

      <!-- Navigation Header for other views -->
      <div v-else class="mt-4 sm:mb-3xl">
        <div class="flex items-center gap-3 mt-3">
          <button
            class="flex items-center text-gray-700 hover:transition-colors"
            @click="currentView = 'list'"
          >
            <ArrowLeftIcon class="h-4 w-4 mr-2" />
            Retour aux paniers
          </button>
        </div>

        <div>
          <h1 class="text-xl lg:text-3xl font-semibold text-gray-900 mt-2">
            <template v-if="currentView === 'create'">Nouveau Panier Surprise</template>
            <template v-else-if="currentView === 'edit'">Modifier le Panier</template>
            <template v-else-if="currentView === 'detail'">Détails du Panier</template>
          </h1>
          <p class="text-gray-700 text-lg">
            <template v-if="currentView === 'create'">Créez un panier mystère attractif</template>
            <template v-else-if="currentView === 'edit'">{{ editingBasket?.name }}</template>
            <template v-else-if="currentView === 'detail'">{{ selectedBasket?.name }}</template>
          </p>
        </div>
      </div>

      <!-- Loading State -->
      <Card v-if="loading && currentView === 'list'">
        <div class="flex items-center justify-center py-8 sm:py-12 lg:py-16">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          <span class="ml-4 text-gray-700">Chargement des paniers surprise...</span>
        </div>
      </Card>

      <!-- Error State -->
      <Card v-if="error" class="bg-red-600/10 border-red-600/30 mt-4">
        <div class="flex items-center justify-center py-6 sm:py-8">
          <AlertTriangleIcon class="h-6 w-6 text-red-600 mr-4" />
          <div>
            <p class="text-red-600/90 font-medium">Erreur lors du chargement</p>
            <p class="text-red-600 text-sm">{{ error }}</p>
          </div>
        </div>
      </Card>

      <!-- List View -->
      <div v-if="currentView === 'list' && !loading">
        <!-- Quick Stats -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-3 sm:gapadding-xl mt-4 sm:mb-3xl">
          <Card class="bg-gradient-to-r from-purple-500 to-blue-600 text-white">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-purple-100 text-sm font-medium">Total Paniers</p>
                <p class="text-xl font-semibold">{{ baskets.length }}</p>
              </div>
              <div class="p-3 bg-white/20 rounded">
                <GiftIcon class="h-6 w-6" />
              </div>
            </div>
          </Card>

          <Card class="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-blue-100 text-sm font-medium">Actifs</p>
                <p class="text-xl font-semibold">{{ activeBaskets.length }}</p>
              </div>
              <div class="p-3 bg-white/20 rounded">
                <CheckCircleIcon class="h-6 w-6" />
              </div>
            </div>
          </Card>

          <Card class="bg-gradient-to-r from-orange-500 to-orange-500/90 text-white">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-orange-500/70 text-sm font-medium">Stock Total</p>
                <p class="text-xl font-semibold">{{ totalStock }}</p>
              </div>
              <div class="p-3 bg-white/20 rounded">
                <PackageIcon class="h-6 w-6" />
              </div>
            </div>
          </Card>

          <Card class="bg-gradient-to-r from-blue-500/50 to-blue-500/90 text-white">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-blue-500/60 text-sm font-medium">Revenus Potentiels</p>
                <p class="text-xl font-semibold">{{ formatPrice(totalRevenue) }}</p>
              </div>
              <div class="p-3 bg-white/20 rounded">
                <DollarSignIcon class="h-6 w-6" />
              </div>
            </div>
          </Card>
        </div>

        <!-- Empty State -->
        <Card v-if="baskets.length === 0" class="text-left sm:text-center py-8 sm:py-12 lg:py-16">
          <div class="w-20 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mt-4">
            <GiftIcon class="h-6 w-6 text-purple-500" />
          </div>
          <h3 class="text-xl font-semibold text-gray-900 mt-2">Aucun panier surprise</h3>
          <p class="text-gray-700 mt-4 max-w-xl mx-auto">
            Créez votre premier panier surprise pour valoriser vos invendus et offrir des surprises à vos clients
          </p>
          <Button
            variant="primary"
            :left-icon="PlusIcon"
            @click="currentView = 'create'"
          >
            Créer mon premier panier
          </Button>
        </Card>

        <!-- Baskets Grid -->
        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gapadding-xl">
          <Card
            v-for="basket in baskets"
            :key="basket.id"
            interactive
            class="glow-effect animate-fade-in-up overflow-hidden sm:block"
          >
            <!-- Image/Icon -->
            <div class="relative h-8xl bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
              <GiftIcon class="w-12 h-10 text-purple-500" />

              <!-- Status Badge -->
              <div class="relative sm:absolute top-4 right-4">
                <span
                  class="px-3 py-3 text-xs font-medium rounded-full"
                  :class="basket.is_active ? 'bg-blue-100 text-blue-900' : 'bg-gray-100 text-gray-700'"
                >
                  {{ basket.is_active ? 'Actif' : 'Inactif' }}
                </span>
              </div>

              <!-- Discount Badge -->
              <div class="relative sm:absolute bottom-4 left-4">
                <span class="px-3 py-3 text-xs font-semibold bg-red-600/100 text-white rounded-full">
                  -{{ Math.round(((basket.original_price - basket.discounted_price) / basket.original_price) * 100) }}%
                </span>
              </div>
            </div>

            <!-- Content -->
            <div class="p-6">
              <div class="flex items-stretch sm:items-start justify-between mt-3">
                <div>
                  <h3 class="font-semibold text-gray-900 mb-1">{{ basket.name }}</h3>
                  <p class="text-sm text-gray-700 line-clamp-2">{{ basket.description }}</p>
                </div>
              </div>

              <!-- Pricing -->
              <div class="flex items-center gap-2 mt-3">
                <span class="text-lg font-semibold text-blue-600">{{ formatPrice(basket.discounted_price) }}</span>
                <span class="text-sm text-gray-400 line-through">{{ formatPrice(basket.original_price) }}</span>
              </div>

              <!-- Stock -->
              <div class="flex items-center gap-2 mt-3 text-sm text-gray-700">
                <PackageIcon class="h-4 w-4" />
                <span>{{ basket.quantity_available }} disponible{{ basket.quantity_available > 1 ? 's' : '' }}</span>
              </div>

              <!-- Products Count -->
              <div class="flex items-center gap-2 mt-4 text-sm text-gray-700">
                <LayersIcon class="h-4 w-4" />
                <span>{{ basket.products?.length || 0 }} produit{{ (basket.products?.length || 0) > 1 ? 's' : '' }}</span>
              </div>

              <!-- Actions -->
              <div class="flex flex-wrap gap-2 mt-4">
                <Button
                  variant="ghost"
                  size="sm"
                  class="flex-1"
                  :left-icon="EyeIcon"
                  @click="handleView(basket)"
                >
                  Voir
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  class="flex-1"
                  :left-icon="PencilIcon"
                  @click="handleEdit(basket)"
                >
                  Modifier
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  class="flex-1 text-blue-600"
                  :left-icon="basket.is_active ? EyeOffIcon : EyeIcon"
                  @click="handleToggleStatus(basket)"
                >
                  {{ basket.is_active ? 'Désactiver' : 'Activer' }}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  class="flex-1 text-red-600"
                  :left-icon="Trash2Icon"
                  @click="handleDelete(basket)"
                >
                  Supprimer
                </Button>
              </div>
            </div>
          </Card>
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
    </div>
  </DashboardLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { formatPrice } from '@/utils/currency'
import type { SurpriseBasket } from '@/services/surpriseBasketService'
import DashboardLayout from '@/components/ui/DashboardLayout.vue'
import { useDashboardLayout } from '@/composables/useDashboardLayout'
import Button from '@/components/ui/2025/Button.vue'
import Card from '@/components/ui/2025/Card.vue'
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
  EyeOffIcon,
  PencilIcon,
  AlertTriangleIcon,
  Trash2Icon
} from 'lucide-vue-next'
import CreateSurpriseBasket from '@/components/merchant/CreateSurpriseBasket.vue'
import EditSurpriseBasket from '@/components/merchant/EditSurpriseBasket.vue'
import SurpriseBasketDetail from '@/components/merchant/SurpriseBasketDetail.vue'
import { useSurpriseBaskets } from '@/composables/useSurpriseBaskets'

type ViewType = 'list' | 'create' | 'edit' | 'detail'

// État
const currentView = ref<ViewType>('list')
const editingBasket = ref<SurpriseBasket | null>(null)
const selectedBasket = ref<SurpriseBasket | null>(null)
const error = ref('')
const { sidebar, header } = useDashboardLayout('merchant')
const {
  merchantBaskets,
  loading,
  loadMerchantBaskets,
  updateBasket,
  deleteBasket
} = useSurpriseBaskets()

const baskets = computed(() => merchantBaskets.value)

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
  error.value = ''
  const success = await loadMerchantBaskets()
  if (!success) {
    error.value = 'Impossible de charger vos paniers surprise. Veuillez réessayer.'
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
  // console.log('✅ Panier surprise créé avec succès')
  currentView.value = 'list'
  loadBaskets() // Recharger la liste
}

const handleBasketUpdated = () => {
  // console.log('✅ Panier surprise mis à jour avec succès')
  currentView.value = 'list'
  editingBasket.value = null
  loadBaskets() // Recharger la liste
}

const handleToggleStatus = async (basket: SurpriseBasket) => {
  const updated = await updateBasket(basket.id, { is_active: !basket.is_active })
  if (updated && selectedBasket.value?.id === basket.id) {
    selectedBasket.value = updated
  }
}

const handleDelete = async (basket: SurpriseBasket) => {
  const confirmed = window.confirm(`Êtes-vous sûr de vouloir supprimer le panier "${basket.name}" ?`)
  if (!confirmed) {
    return
  }

  const deleted = await deleteBasket(basket.id)
  if (deleted) {
    if (selectedBasket.value?.id === basket.id) {
      selectedBasket.value = null
      currentView.value = 'list'
    }

    if (editingBasket.value?.id === basket.id) {
      editingBasket.value = null
    }
  }
}

// Initialisation
onMounted(() => {
  loadBaskets()
})
</script>
