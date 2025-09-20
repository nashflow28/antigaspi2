<template>
  <div class="surprise-baskets-view min-h-screen bg-gray-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Main Content -->
      <div v-if="currentView === 'list'">
        <SurpriseBasketsList
          @create="currentView = 'create'"
          @edit="handleEdit"
          @view="handleView"
        />
      </div>

      <!-- Create View -->
      <div v-else-if="currentView === 'create'">
        <div class="mb-6">
          <button
            @click="currentView = 'list'"
            class="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft class="w-4 h-4 mr-2" />
            Retour à la liste
          </button>
        </div>

        <CreateSurpriseBasket
          @cancel="currentView = 'list'"
          @created="handleBasketCreated"
        />
      </div>

      <!-- Edit View -->
      <div v-else-if="currentView === 'edit' && editingBasket">
        <div class="mb-6">
          <button
            @click="currentView = 'list'"
            class="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft class="w-4 h-4 mr-2" />
            Retour à la liste
          </button>
        </div>

        <EditSurpriseBasket
          :basket="editingBasket"
          @cancel="currentView = 'list'"
          @updated="handleBasketUpdated"
        />
      </div>

      <!-- Detail View -->
      <div v-else-if="currentView === 'detail' && selectedBasket">
        <div class="mb-6">
          <button
            @click="currentView = 'list'"
            class="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft class="w-4 h-4 mr-2" />
            Retour à la liste
          </button>
        </div>

        <SurpriseBasketDetail
          :basket="selectedBasket"
          @edit="handleEdit"
          @close="currentView = 'list'"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ArrowLeft } from 'lucide-vue-next'
import SurpriseBasketsList from '@/components/merchant/SurpriseBasketsList.vue'
import CreateSurpriseBasket from '@/components/merchant/CreateSurpriseBasket.vue'
import EditSurpriseBasket from '@/components/merchant/EditSurpriseBasket.vue'
import SurpriseBasketDetail from '@/components/merchant/SurpriseBasketDetail.vue'
import { notify } from '@/composables/useNotifications'

type ViewType = 'list' | 'create' | 'edit' | 'detail'

const currentView = ref<ViewType>('list')
const editingBasket = ref<any>(null)
const selectedBasket = ref<any>(null)

// Handlers
const handleEdit = (basket: any) => {
  editingBasket.value = basket
  currentView.value = 'edit'
}

const handleView = (basket: any) => {
  selectedBasket.value = basket
  currentView.value = 'detail'
}

const handleBasketCreated = () => {
  notify.success('Panier surprise créé avec succès')
  currentView.value = 'list'
}

const handleBasketUpdated = () => {
  notify.success('Panier surprise mis à jour avec succès')
  currentView.value = 'list'
  editingBasket.value = null
}
</script>