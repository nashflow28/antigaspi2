<template>
  <DashboardLayout
    :sidebar="sidebar"
    :header="header"
    class="bg-gradient-to-br from-surface-light via-surface-light to-primary-50 dark:from-surface-dark dark:via-surface-darker dark:to-primary-950"
  >
    <div class="mx-auto w-full max-w-7xl space-y-8 px-3 py-6 sm:px-6 sm:py-8">
      <DashboardHeader
        data-testid="products-header"
        eyebrow="Administration"
        title="Gestion des produits"
        subtitle="Modérez les produits ajoutés par les commerçants"
      >
        <template #actions>
          <Button
            data-testid="products-refresh"
            variant="secondary"
            size="lg"
            class="gap-2"
            :loading="loading"
            @click="refreshData"
          >
            <ArrowPathIcon class="h-5 w-5" />
            Actualiser
          </Button>
        </template>
      </DashboardHeader>

      <StatCardGrid
        data-testid="products-stats-grid"
        :columns="'grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4'"
      >
        <StatCard
          title="Total produits"
          :value="formatNumber(products.length)"
          description="Produits sur la plateforme"
          :icon="ShoppingBagIcon"
          accent="primary"
        />
        <StatCard
          title="Produits actifs"
          :value="formatNumber(activeProducts)"
          description="Visibles par les clients"
          :icon="CheckCircleIcon"
          accent="success"
        />
        <StatCard
          title="Produits inactifs"
          :value="formatNumber(inactiveProducts)"
          description="Masqués ou expirés"
          :icon="XCircleIcon"
          accent="warning"
        />
        <StatCard
          title="En stock"
          :value="formatNumber(inStockProducts)"
          description="Disponibles à la réservation"
          :icon="ArchiveBoxIcon"
          accent="info"
        />
      </StatCardGrid>

      <DataTableCard
        data-testid="products-table"
        title="Liste des produits"
        description="Suivez les produits ajoutés et modérez le contenu"
        :columns="productTableColumns"
        :rows="paginatedProducts"
        :loading="loading"
        loading-text="Chargement des produits..."
        empty-title="Aucun produit"
        empty-description="Aucun produit n'a encore été ajouté par les commerçants."
        variant="glass"
      >
        <template #filters>
          <DashboardFilterBar
            v-model:search="searchQuery"
            data-testid="products-filters"
            :filters="dashboardFilters"
            placeholder="Rechercher un produit..."
            @update:filters="handleFiltersUpdate"
            @search="applyFilters"
          >
            <template #actions>
              <Button
                variant="ghost"
                size="sm"
                class="whitespace-nowrap text-neutral-600 hover:text-primary-600 dark:text-neutral-300"
                @click="resetFilters"
              >
                Réinitialiser
              </Button>
              <Button
                variant="secondary"
                size="sm"
                class="gap-2 whitespace-nowrap"
                :loading="loading"
                @click="refreshData"
              >
                <ArrowPathIcon class="h-4 w-4" />
                Actualiser
              </Button>
            </template>
          </DashboardFilterBar>
        </template>
      </DataTableCard>
    </div>
  </DashboardLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { apiService } from '@/services/api'
import { notify } from '@/composables/useNotifications'
import { useDashboardLayout } from '@/composables/useDashboardLayout'
import type { Product } from '@/types'
import type { DashboardFilter } from '@/components/dashboard/2025/DashboardFilterBar.vue'
import type { DataTableColumn } from '@/components/dashboard/2025/DataTableCard.vue'

// UI Components
import DashboardLayout from '@/components/ui/DashboardLayout.vue'
import { Button } from '@/components/ui/2025'
import {
  DashboardHeader,
  StatCard,
  StatCardGrid,
  DashboardFilterBar,
  DataTableCard
} from '@/components/dashboard/2025'

// Icons
import {
  ArrowPathIcon,
  ShoppingBagIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArchiveBoxIcon
} from '@heroicons/vue/24/outline'

// Layout
const { sidebar, header } = useDashboardLayout('admin')

// State
const loading = ref(false)
const products = ref<Product[]>([])
const searchQuery = ref('')
const activeFilters = ref<Record<string, any>>({})

// Filters configuration
const dashboardFilters = computed<DashboardFilter[]>(() => [
  {
    id: 'status',
    label: 'Statut',
    type: 'select',
    options: [
      { value: 'all', label: 'Tous' },
      { value: 'active', label: 'Actifs' },
      { value: 'inactive', label: 'Inactifs' }
    ],
    value: activeFilters.value.status || 'all'
  },
  {
    id: 'category',
    label: 'Catégorie',
    type: 'select',
    options: [
      { value: 'all', label: 'Toutes' },
      { value: '1', label: 'Boulangerie' },
      { value: '2', label: 'Fruits & Légumes' },
      { value: '3', label: 'Produits laitiers' }
    ],
    value: activeFilters.value.category || 'all'
  }
])

// Computed stats
const activeProducts = computed(() =>
  products.value.filter(p => p.is_active).length
)

const inactiveProducts = computed(() =>
  products.value.filter(p => !p.is_active).length
)

const inStockProducts = computed(() =>
  products.value.filter(p => (p.quantity_available || 0) > 0).length
)

// Table columns
const productTableColumns: DataTableColumn[] = [
  { key: 'id', title: 'ID', width: '80px' },
  { key: 'name', title: 'Nom' },
  { key: 'merchant', title: 'Commerçant' },
  { key: 'category', title: 'Catégorie', align: 'center' },
  { key: 'price', title: 'Prix', align: 'right' },
  { key: 'quantity', title: 'Stock', align: 'center', width: '100px' },
  { key: 'status', title: 'Statut', align: 'center' },
  { key: 'actions', title: 'Actions', align: 'right', width: '180px' }
]

// Filtered and paginated products
const filteredProducts = computed(() => {
  let filtered = products.value

  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(product =>
      product.name.toLowerCase().includes(query) ||
      product.description?.toLowerCase().includes(query)
    )
  }

  // Status filter
  if (activeFilters.value.status && activeFilters.value.status !== 'all') {
    if (activeFilters.value.status === 'active') {
      filtered = filtered.filter(p => p.is_active)
    } else if (activeFilters.value.status === 'inactive') {
      filtered = filtered.filter(p => !p.is_active)
    }
  }

  // Category filter
  if (activeFilters.value.category && activeFilters.value.category !== 'all') {
    filtered = filtered.filter(p => p.category?.id === parseInt(activeFilters.value.category))
  }

  return filtered
})

const paginatedProducts = computed(() => {
  return filteredProducts.value.map(product => ({
    id: product.id,
    name: product.name,
    merchant: product.merchant?.business_name || `Commerçant #${product.merchant?.id}`,
    category: product.category?.name || `Cat. ${product.category?.id}`,
    price: `${product.discounted_price || product.original_price} XOF`,
    quantity: product.quantity_available || 0,
    status: product.is_active ? 'Actif' : 'Inactif',
    actions: '' // Actions rendered via slot or events
  }))
})

// Methods
const formatNumber = (value: number) => {
  return value.toLocaleString('fr-FR')
}

const fetchProducts = async () => {
  loading.value = true
  try {
    const response = await apiService.getProducts()
    if (response.success && response.data) {
      products.value = response.data
    }
  } catch (error: any) {
    notify.error(error.message || 'Erreur lors du chargement des produits', 'Erreur')
  } finally {
    loading.value = false
  }
}

const refreshData = async () => {
  await fetchProducts()
  notify.success('Données actualisées', 'Succès')
}

const handleFiltersUpdate = (filters: Record<string, any>) => {
  activeFilters.value = filters
}

const applyFilters = () => {
  // Filters are applied reactively via computed
}

const resetFilters = () => {
  searchQuery.value = ''
  activeFilters.value = {}
}

// Lifecycle
onMounted(() => {
  fetchProducts()
})
</script>
