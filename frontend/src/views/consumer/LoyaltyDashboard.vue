<template>
  <DashboardLayout
    :sidebar="sidebar"
    :header="header"
    class="bg-gradient-to-br from-gray-50 to-gray-100"
  >
    <!-- Header -->
    <div class="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
      <div class="container px-3 sm:px-4 lg:px-6 mx-auto px-3 py-6">
        <div class="flex items-center justify-start sm:justify-between">
          <div>
            <h1 class="text-xl font-semibold text-gray-900">Mes Points de Fidélité</h1>
            <p class="text-gray-700 mt-1">
              Gagnez des points et profitez de récompenses exclusives
            </p>
          </div>
          <div class="flex items-center gap-4">
            <button
              :disabled="loading"
              class="button-outline-2025 text-sm"
              @click="refreshPoints"
            >
              <RefreshCw class="h-4 w-4" :class="{ 'animate-spin': loading }" />
              Actualiser
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="container px-3 sm:px-4 lg:px-6 mx-auto px-3 py-6 sm:py-8">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        <!-- Points Summary Cards -->
        <div class="lg:col-span-3">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-6 mt-4 sm:mb-3xl">
            <!-- Total Points -->
            <Card class="glow-effect">
              <div class="flex items-center justify-start sm:justify-between">
                <div>
                  <p class="text-sm font-medium text-gray-700">Points Totaux</p>
                  <p class="text-xl font-semibold text-blue-600 mt-1">
                    {{ formatPoints(totalPoints) }}
                  </p>
                </div>
                <div class="p-3 bg-blue-100 rounded">
                  <Star class="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </Card>

            <!-- Expiring Points -->
            <Card class="">
              <div class="flex items-center justify-start sm:justify-between">
                <div>
                  <p class="text-sm font-medium text-gray-700">Points Expirent</p>
                  <p class="text-xl font-semibold text-orange-500 mt-1">
                    {{ formatPoints(expiringPoints) }}
                  </p>
                  <p class="text-xs text-gray-500">Dans 30 jours</p>
                </div>
                <div class="p-3 bg-orange-500/15 rounded">
                  <Clock class="h-6 w-6 text-orange-500" />
                </div>
              </div>
            </Card>

            <!-- Available Rewards -->
            <Card class="cursor-pointer hover:transition-all duration-200" @click="scrollToRewards">
              <div class="flex items-center justify-start sm:justify-between">
                <div>
                  <p class="text-sm font-medium text-gray-700">Récompenses</p>
                  <p class="text-xl font-semibold text-blue-500 mt-1">
                    {{ availableRewards.length }}
                  </p>
                  <p class="text-xs text-gray-500">Disponibles</p>
                </div>
                <div class="p-3 bg-blue-500/10 rounded">
                  <Gift class="h-6 w-6 text-blue-500" />
                </div>
              </div>
            </Card>
          </div>
        </div>

        <!-- Points Breakdown -->
        <div class="lg:col-span-2">
          <Card class="">
            <div class="flex items-center justify-start sm:justify-between mt-4">
              <h3 class="text-xl font-semibold text-gray-900">Répartition des Points</h3>
              <div class="flex items-center gap-2 text-sm text-gray-700">
                <TrendingUp class="h-4 w-4" />
                Par catégorie
              </div>
            </div>

            <div v-if="pointsBreakdown.length > 0" class="space-y-4">
              <div
                v-for="breakdown in pointsBreakdown"
                :key="breakdown.earned_from"
                class="flex items-center justify-start sm:justify-between p-4 bg-gray-50 rounded"
              >
                <div class="flex items-center gap-4">
                  <div :class="getPointTypeColor(breakdown.earned_from)" class="p-2 bg-white rounded">
                    <component :is="getPointTypeIcon(breakdown.earned_from)" class="h-4 w-4" />
                  </div>
                  <div>
                    <p class="font-medium text-gray-900">{{ getPointTypeLabel(breakdown.earned_from) }}</p>
                    <p class="text-sm text-gray-700">{{ formatPoints(parseInt(breakdown.total)) }} points</p>
                  </div>
                </div>
                <div class="text-right">
                  <span class="text-lg font-semibold text-gray-900">{{ breakdown.total }}</span>
                </div>
              </div>
            </div>

            <div v-else class="text-left sm:text-center py-6 sm:py-8">
              <Star class="w-12 h-10 text-gray-500 mx-auto mt-3" />
              <p class="text-gray-700">Aucun point gagné pour le moment</p>
              <p class="text-sm text-gray-500">Commencez par faire un achat ou laisser un avis !</p>
            </div>
          </Card>
        </div>

        <!-- Recent Activity -->
        <div class="lg:col-span-1">
          <Card class="">
            <h3 class="text-xl font-semibold text-gray-900 mt-4">Activité Récente</h3>

            <div v-if="recentHistory.length > 0" class="space-y-2">
              <div
                v-for="activity in recentHistory.slice(0, 5)"
                :key="activity.id"
                class="flex items-center gap-4 p-3 bg-gray-50 rounded"
              >
                <div :class="getPointTypeColor(activity.earned_from)" class="p-2 bg-white rounded flex-shrink-0">
                  <component :is="getPointTypeIcon(activity.earned_from)" class="h-4 w-4" />
                </div>
                <div class="flex-1 min-w-none">
                  <p class="text-sm font-medium text-gray-900 truncate">{{ activity.description }}</p>
                  <p class="text-xs text-gray-500">{{ formatDate(activity.created_at) }}</p>
                </div>
                <div class="text-right flex-shrink-0">
                  <span :class="activity.points > 0 ? 'text-green-600' : 'text-red-600'" class="text-sm font-semibold">
                    {{ activity.points > 0 ? '+' : '' }}{{ activity.points }}
                  </span>
                </div>
              </div>
            </div>

            <div v-else class="text-left sm:text-center py-6">
              <Clock class="w-12 h-10 text-gray-500 mx-auto mb-4" />
              <p class="text-gray-700 text-sm">Aucune activité récente</p>
            </div>
          </Card>
        </div>

        <!-- Rewards Section -->
        <div ref="rewardsSection" class="lg:col-span-3">
          <Card class="">
            <div class="flex items-center justify-start sm:justify-between mt-4">
              <h3 class="text-xl font-semibold text-gray-900">Récompenses Disponibles</h3>
              <div class="flex items-center gap-2 text-sm text-gray-700">
                <Gift class="h-4 w-4" />
                {{ availableRewards.length }} disponible(s)
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
              <div
                v-for="reward in availableRewards"
                :key="reward.id"
                class="border border-gray-200 rounded p-6 hover:transition-all duration-200"
                :class="canRedeem(reward.cost) ? 'bg-white hover:border-blue-300' : 'bg-gray-50'"
              >
                <div class="flex items-center gap-4 mt-3">
                  <div class="p-3 bg-gradient-to-r from-blue-600 to-blue-700 rounded">
                    <component :is="reward.icon" class="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h4 class="font-semibold text-gray-900">{{ reward.title }}</h4>
                    <p class="text-sm text-gray-700">{{ reward.cost }} points</p>
                  </div>
                </div>

                <p class="text-sm text-gray-700 mt-3">{{ reward.description }}</p>

                <button
                  :disabled="!canRedeem(reward.cost)"
                  class="w-full button-primary-2025"
                  :class="canRedeem(reward.cost) ? 'button-primary-2025' : 'button-outline-2025 opacity-50 cursor-not-allowed'"
                  @click="openRedeemModal(reward)"
                >
                  {{ canRedeem(reward.cost) ? 'Échanger' : 'Points insuffisants' }}
                </button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>

    <!-- Redeem Modal -->
    <div v-if="selectedReward" class="fixed inset-0 z-[9999] overflow-y-auto">
      <div class="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity" @click="closeRedeemModal" />

      <div class="flex min-h-screen items-center justify-center p-4">
        <div class="relative w-full max-w-xl bg-white rounded shadow-xl transform transition-all" @click.stop>
          <div class="px-4 py-4 border-b border-gray-200">
            <div class="flex items-center justify-start sm:justify-between">
              <h3 class="text-lg font-semibold text-gray-900">Confirmer l'échange</h3>
              <button class="p-2 hover:transition-colors" @click="closeRedeemModal">
                <X class="h-4 w-4 text-gray-400" />
              </button>
            </div>
          </div>

          <div class="px-4 py-6">
            <div class="text-left sm:text-center mt-4">
              <div class="p-4 bg-gradient-to-r from-blue-600 to-blue-700 rounded inline-block mt-3">
                <component :is="selectedReward.icon" class="h-6 w-6 text-white" />
              </div>
              <h4 class="text-xl font-semibold text-gray-900 mt-2">{{ selectedReward.title }}</h4>
              <p class="text-gray-700">{{ selectedReward.description }}</p>
            </div>

            <div class="bg-gray-50 rounded p-4 mt-4">
              <div class="flex justify-start sm:justify-between items-center">
                <span class="text-gray-700">Coût de l'échange :</span>
                <span class="font-semibold text-blue-600">{{ formatPoints(selectedReward.cost) }} points</span>
              </div>
              <div class="flex justify-start sm:justify-between items-center mt-2">
                <span class="text-gray-700">Points restants :</span>
                <span class="font-semibold text-gray-900">{{ formatPoints(totalPoints - selectedReward.cost) }} points</span>
              </div>
            </div>

            <div class="flex gap-4">
              <button class="flex-1 button-outline-2025" @click="closeRedeemModal">
                Annuler
              </button>
              <button
                :disabled="redeeming"
                class="flex-1 button-primary-2025"
                @click="confirmRedeem"
              >
                <Loader2 v-if="redeeming" class="h-4 w-4 mr-2 animate-spin" />
                {{ redeeming ? 'Échange...' : 'Confirmer' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </DashboardLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  Star, Clock, Gift, TrendingUp, RefreshCw, X, Loader2,
  ShoppingBag, MessageSquare, Users, Award, Minus
} from 'lucide-vue-next'
import { useLoyaltyPoints } from '@/composables/useLoyaltyPoints'
import DashboardLayout from '@/components/ui/DashboardLayout.vue'
import Button from '@/components/ui/2025/Button.vue'
import Card from '@/components/ui/2025/Card.vue'
import { useDashboardLayout } from '@/composables/useDashboardLayout'

// Composables
const {
  totalPoints,
  expiringPoints,
  pointsBreakdown,
  recentHistory,
  loading,
  fetchMyPoints,
  redeemPoints,
  formatPoints,
  getPointTypeLabel,
  getPointTypeColor,
  canRedeem
} = useLoyaltyPoints()

// State
const selectedReward = ref(null)
const redeeming = ref(false)
const rewardsSection = ref(null)

const { sidebar, header } = useDashboardLayout('consumer')

// Mock rewards data (this would come from an API in real app)
const availableRewards = ref([
  {
    id: 1,
    title: 'Réduction 10%',
    description: 'Obtenez 10% de réduction sur votre prochain achat',
    cost: 50,
    icon: 'ShoppingBag'
  },
  {
    id: 2,
    title: 'Livraison Gratuite',
    description: 'Livraison gratuite pour votre prochaine commande',
    cost: 30,
    icon: 'Gift'
  },
  {
    id: 3,
    title: 'Produit Bonus',
    description: 'Recevez un produit gratuit avec votre achat',
    cost: 100,
    icon: 'Award'
  }
])

// Methods
const refreshPoints = async () => {
  await fetchMyPoints()
}

const getPointTypeIcon = (type: string) => {
  const icons = {
    'purchase': ShoppingBag,
    'review': MessageSquare,
    'referral': Users,
    'bonus': Award,
    'redemption': Minus
  }
  return icons[type] || Star
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

const scrollToRewards = () => {
  rewardsSection.value?.scrollIntoView({ behavior: 'smooth' })
}

const openRedeemModal = (reward) => {
  selectedReward.value = reward
}

const closeRedeemModal = () => {
  selectedReward.value = null
  redeeming.value = false
}

const confirmRedeem = async () => {
  if (!selectedReward.value) return

  redeeming.value = true

  const success = await redeemPoints({
    points: selectedReward.value.cost,
    description: `Échange: ${selectedReward.value.title}`
  })

  if (success) {
    closeRedeemModal()
  }

  redeeming.value = false
}

// Lifecycle
onMounted(() => {
  fetchMyPoints()
})
</script>

<style scoped>
.glow-effect {
  position: relative;
}

.glow-effect::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 1rem;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(147, 51, 234, 0.15));
  opacity: 0.7;
  z-index: -1;
  filter: blur(20px);
  transition: opacity 0.3s ease;
}

.glow-effect:hover::before {
  opacity: 1;
}
</style>
