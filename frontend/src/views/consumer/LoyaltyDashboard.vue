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
            <h1 class="text-3xl font-bold text-neutral-900">Mes Points de Fidélité</h1>
            <p class="text-neutral-600 mt-1">
              Gagnez des points et profitez de récompenses exclusives
            </p>
          </div>
          <div class="flex items-center gap-3">
            <button
              :disabled="loading"
              class="button-outline-2025 text-sm"
              @click="refreshPoints"
            >
              <RefreshCw class="w-4 h-4" :class="{ 'animate-spin': loading }" />
              Actualiser
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="container mx-auto px-4 py-8">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Points Summary Cards -->
        <div class="lg:col-span-3">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <!-- Total Points -->
            <Card class="glow-effect">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-neutral-600">Points Totaux</p>
                  <p class="text-3xl font-bold text-primary-600 mt-1">
                    {{ formatPoints(totalPoints) }}
                  </p>
                </div>
                <div class="p-3 bg-primary-100 rounded-xl">
                  <Star class="w-8 h-8 text-primary-600" />
                </div>
              </div>
            </Card>

            <!-- Expiring Points -->
            <Card class="">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-neutral-600">Points Expirent</p>
                  <p class="text-2xl font-bold text-accent-orange mt-1">
                    {{ formatPoints(expiringPoints) }}
                  </p>
                  <p class="text-xs text-neutral-500">Dans 30 jours</p>
                </div>
                <div class="p-3 bg-accent-orange/15 rounded-xl">
                  <Clock class="w-8 h-8 text-accent-orange" />
                </div>
              </div>
            </Card>

            <!-- Available Rewards -->
            <Card class="cursor-pointer hover:shadow-modern-2025 transition-all duration-200" @click="scrollToRewards">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-neutral-600">Récompenses</p>
                  <p class="text-2xl font-bold text-accent-blue mt-1">
                    {{ availableRewards.length }}
                  </p>
                  <p class="text-xs text-neutral-500">Disponibles</p>
                </div>
                <div class="p-3 bg-accent-blue/10 rounded-xl">
                  <Gift class="w-8 h-8 text-accent-blue" />
                </div>
              </div>
            </Card>
          </div>
        </div>

        <!-- Points Breakdown -->
        <div class="lg:col-span-2">
          <Card class="">
            <div class="flex items-center justify-between mb-6">
              <h3 class="text-xl font-semibold text-neutral-900">Répartition des Points</h3>
              <div class="flex items-center gap-2 text-sm text-neutral-600">
                <TrendingUp class="w-4 h-4" />
                Par catégorie
              </div>
            </div>

            <div v-if="pointsBreakdown.length > 0" class="space-y-4">
              <div
                v-for="breakdown in pointsBreakdown"
                :key="breakdown.earned_from"
                class="flex items-center justify-between p-4 bg-neutral-50 rounded-xl"
              >
                <div class="flex items-center gap-3">
                  <div :class="getPointTypeColor(breakdown.earned_from)" class="p-2 bg-white rounded-lg">
                    <component :is="getPointTypeIcon(breakdown.earned_from)" class="w-5 h-5" />
                  </div>
                  <div>
                    <p class="font-medium text-neutral-900">{{ getPointTypeLabel(breakdown.earned_from) }}</p>
                    <p class="text-sm text-neutral-600">{{ formatPoints(parseInt(breakdown.total)) }} points</p>
                  </div>
                </div>
                <div class="text-right">
                  <span class="text-lg font-bold text-neutral-900">{{ breakdown.total }}</span>
                </div>
              </div>
            </div>

            <div v-else class="text-center py-8">
              <Star class="w-16 h-16 text-neutral-300 mx-auto mb-4" />
              <p class="text-neutral-600">Aucun point gagné pour le moment</p>
              <p class="text-sm text-neutral-500">Commencez par faire un achat ou laisser un avis !</p>
            </div>
          </Card>
        </div>

        <!-- Recent Activity -->
        <div class="lg:col-span-1">
          <Card class="">
            <h3 class="text-xl font-semibold text-neutral-900 mb-6">Activité Récente</h3>

            <div v-if="recentHistory.length > 0" class="space-y-3">
              <div
                v-for="activity in recentHistory.slice(0, 5)"
                :key="activity.id"
                class="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg"
              >
                <div :class="getPointTypeColor(activity.earned_from)" class="p-2 bg-white rounded-lg flex-shrink-0">
                  <component :is="getPointTypeIcon(activity.earned_from)" class="w-4 h-4" />
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-neutral-900 truncate">{{ activity.description }}</p>
                  <p class="text-xs text-neutral-500">{{ formatDate(activity.created_at) }}</p>
                </div>
                <div class="text-right flex-shrink-0">
                  <span :class="activity.points > 0 ? 'text-green-600' : 'text-red-600'" class="text-sm font-bold">
                    {{ activity.points > 0 ? '+' : '' }}{{ activity.points }}
                  </span>
                </div>
              </div>
            </div>

            <div v-else class="text-center py-6">
              <Clock class="w-12 h-12 text-neutral-300 mx-auto mb-3" />
              <p class="text-neutral-600 text-sm">Aucune activité récente</p>
            </div>
          </Card>
        </div>

        <!-- Rewards Section -->
        <div ref="rewardsSection" class="lg:col-span-3">
          <Card class="">
            <div class="flex items-center justify-between mb-6">
              <h3 class="text-xl font-semibold text-neutral-900">Récompenses Disponibles</h3>
              <div class="flex items-center gap-2 text-sm text-neutral-600">
                <Gift class="w-4 h-4" />
                {{ availableRewards.length }} disponible(s)
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div
                v-for="reward in availableRewards"
                :key="reward.id"
                class="border border-neutral-200 rounded-xl p-6 hover:shadow-modern-2025 transition-all duration-200"
                :class="canRedeem(reward.cost) ? 'bg-white hover:border-primary-300' : 'bg-neutral-50'"
              >
                <div class="flex items-center gap-3 mb-4">
                  <div class="p-3 bg-nav-gradient rounded-xl">
                    <component :is="reward.icon" class="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 class="font-semibold text-neutral-900">{{ reward.title }}</h4>
                    <p class="text-sm text-neutral-600">{{ reward.cost }} points</p>
                  </div>
                </div>

                <p class="text-sm text-neutral-600 mb-4">{{ reward.description }}</p>

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

      <div class="flex min-h-full items-center justify-center p-4">
        <div class="relative w-full max-w-md bg-white rounded-2xl shadow-xl transform transition-all" @click.stop>
          <div class="px-6 py-4 border-b border-gray-200">
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold text-gray-900">Confirmer l'échange</h3>
              <button class="p-2 hover:bg-gray-100 rounded-lg transition-colors" @click="closeRedeemModal">
                <X class="w-5 h-5 text-gray-400" />
              </button>
            </div>
          </div>

          <div class="px-6 py-6">
            <div class="text-center mb-6">
              <div class="p-4 bg-nav-gradient rounded-xl inline-block mb-4">
                <component :is="selectedReward.icon" class="w-8 h-8 text-white" />
              </div>
              <h4 class="text-xl font-semibold text-neutral-900 mb-2">{{ selectedReward.title }}</h4>
              <p class="text-neutral-600">{{ selectedReward.description }}</p>
            </div>

            <div class="bg-neutral-50 rounded-xl p-4 mb-6">
              <div class="flex justify-between items-center">
                <span class="text-neutral-600">Coût de l'échange :</span>
                <span class="font-bold text-primary-600">{{ formatPoints(selectedReward.cost) }} points</span>
              </div>
              <div class="flex justify-between items-center mt-2">
                <span class="text-neutral-600">Points restants :</span>
                <span class="font-bold text-neutral-900">{{ formatPoints(totalPoints - selectedReward.cost) }} points</span>
              </div>
            </div>

            <div class="flex gap-3">
              <button class="flex-1 button-outline-2025" @click="closeRedeemModal">
                Annuler
              </button>
              <button
                :disabled="redeeming"
                class="flex-1 button-primary-2025"
                @click="confirmRedeem"
              >
                <Loader2 v-if="redeeming" class="w-4 h-4 mr-2 animate-spin" />
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
