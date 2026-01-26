<template>
  <DashboardLayout
    :sidebar="sidebar"
    :header="header"
    class="bg-gradient-to-br from-neutral-50 to-neutral-100"
  >
    <!-- Header -->
    <div class="bg-white/80 backdrop-blur-sm border-b border-neutral-200 sticky top-0 z-10">
      <div class="container px-3 sm:px-4 lg:px-6 mx-auto px-3 py-6">
        <div class="flex items-center justify-start sm:justify-between">
          <div>
            <h1 class="text-xl font-semibold text-neutral-900">Mes Points de Fidélité</h1>
            <p class="text-neutral-700 mt-1">
              Gagnez des points et profitez de récompenses exclusives
            </p>
          </div>
          <div class="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              :disabled="loading"
              @click="refreshPoints"
            >
              <RefreshCw class="h-4 w-4" :class="{ 'animate-spin': loading }" />
              Actualiser
            </Button>
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
                  <p class="text-sm font-medium text-neutral-700">Points Totaux</p>
                  <p class="text-xl font-semibold text-primary-600 mt-1">
                    {{ formatPoints(totalPoints) }}
                  </p>
                </div>
                <div class="p-3 bg-primary-100 rounded">
                  <Star class="h-6 w-6 text-primary-600" />
                </div>
              </div>
            </Card>

            <!-- Expiring Points -->
            <Card class="">
              <div class="flex items-center justify-start sm:justify-between">
                <div>
                  <p class="text-sm font-medium text-neutral-700">Points Expirent</p>
                  <p class="text-xl font-semibold text-orange-500 mt-1">
                    {{ formatPoints(expiringPoints) }}
                  </p>
                  <p class="text-xs text-neutral-500">Dans 30 jours</p>
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
                  <p class="text-sm font-medium text-neutral-700">Récompenses</p>
                  <p class="text-xl font-semibold text-primary-500 mt-1">
                    {{ availableRewards.length }}
                  </p>
                  <p class="text-xs text-neutral-500">Disponibles</p>
                </div>
                <div class="p-3 bg-primary-500/10 rounded">
                  <Gift class="h-6 w-6 text-primary-500" />
                </div>
              </div>
            </Card>
          </div>

          <Card v-if="tier" class="mt-4">
            <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div class="space-y-1">
                <p class="text-sm font-medium text-neutral-600">Niveau actuel</p>
                <div class="flex flex-wrap items-center gap-3">
                  <span
                    class="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide"
                    :class="tierColors[currentTier] || tierColors.bronze"
                  >
                    {{ tierLabel }}
                  </span>
                  <span class="text-sm text-neutral-500">
                    {{ formatPoints(tier?.lifetime_points ?? totalPoints) }} points cumulés
                  </span>
                </div>
              </div>
              <p class="text-sm text-neutral-600">
                <span v-if="tierNextLabel">
                  Prochain niveau : {{ tierNextLabel }} ({{ formatPoints(pointsToNextTier) }} pts)
                </span>
                <span v-else>Niveau maximum atteint</span>
              </p>
            </div>

            <div class="mt-4 h-3 w-full overflow-hidden rounded-full bg-neutral-200">
              <div
                class="h-full rounded-full transition-all duration-300"
                :class="tierProgressColors[currentTier] || tierProgressColors.bronze"
                :style="{ width: `${Math.min(100, Math.max(0, tierProgress))}%` }"
              />
            </div>
          </Card>
        </div>

        <!-- Points Breakdown -->
        <div class="lg:col-span-2">
          <Card class="">
            <div class="flex items-center justify-start sm:justify-between mt-4">
              <h3 class="text-xl font-semibold text-neutral-900">Répartition des Points</h3>
              <div class="flex items-center gap-2 text-sm text-neutral-700">
                <TrendingUp class="h-4 w-4" />
                Par catégorie
              </div>
            </div>

            <div v-if="pointsBreakdown.length > 0" class="space-y-4">
              <div
                v-for="breakdown in pointsBreakdown"
                :key="breakdown.earned_from"
                class="flex items-center justify-start sm:justify-between p-4 bg-neutral-50 rounded"
              >
                <div class="flex items-center gap-4">
                  <div :class="getPointTypeColor(breakdown.earned_from)" class="p-2 bg-white rounded">
                    <component :is="getPointTypeIcon(breakdown.earned_from)" class="h-4 w-4" />
                  </div>
                  <div>
                    <p class="font-medium text-neutral-900">{{ getPointTypeLabel(breakdown.earned_from) }}</p>
                    <p class="text-sm text-neutral-700">{{ formatPoints(parseInt(String(breakdown.total))) }} points</p>
                  </div>
                </div>
                <div class="text-right">
                  <span class="text-lg font-semibold text-neutral-900">{{ breakdown.total }}</span>
                </div>
              </div>
            </div>

            <div v-else class="text-left sm:text-center py-6 sm:py-8">
              <Star class="w-12 h-10 text-neutral-500 mx-auto mt-3" />
              <p class="text-neutral-700">Aucun point gagné pour le moment</p>
              <p class="text-sm text-neutral-500">Commencez par faire un achat ou laisser un avis !</p>
            </div>
          </Card>
        </div>

        <!-- Recent Activity -->
        <div class="lg:col-span-1">
          <Card class="">
            <h3 class="text-xl font-semibold text-neutral-900 mt-4">Activité Récente</h3>

            <div v-if="recentHistory.length > 0" class="space-y-2">
              <div
                v-for="activity in recentHistory.slice(0, 5)"
                :key="activity.id"
                class="flex items-center gap-4 p-3 bg-neutral-50 rounded"
              >
                <div :class="getPointTypeColor(activity.earned_from)" class="p-2 bg-white rounded flex-shrink-0">
                  <component :is="getPointTypeIcon(activity.earned_from)" class="h-4 w-4" />
                </div>
                <div class="flex-1 min-w-none">
                  <p class="text-sm font-medium text-neutral-900 truncate">{{ activity.description }}</p>
                  <p class="text-xs text-neutral-500">{{ formatDate(activity.created_at) }}</p>
                </div>
                <div class="text-right flex-shrink-0">
                  <span :class="activity.points > 0 ? 'text-green-600' : 'text-red-600'" class="text-sm font-semibold">
                    {{ activity.points > 0 ? '+' : '' }}{{ activity.points }}
                  </span>
                </div>
              </div>
            </div>

            <div v-else class="text-left sm:text-center py-6">
              <Clock class="w-12 h-10 text-neutral-500 mx-auto mb-4" />
              <p class="text-neutral-700 text-sm">Aucune activité récente</p>
            </div>
          </Card>
        </div>

        <!-- Rewards Section -->
        <div ref="rewardsSection" class="lg:col-span-3 space-y-6">
          <Card>
            <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mt-4">
              <div>
                <h3 class="text-xl font-semibold text-neutral-900">Échange Manuel</h3>
                <p class="text-sm text-neutral-600">
                  Saisissez un montant spécifique pour échanger vos points en fonction des offres proposées par
                  les commerçants.
                </p>
              </div>
              <div class="text-sm text-neutral-600 bg-primary-50 border border-primary-100 rounded px-3 py-2 flex items-center gap-2">
                <Minus class="h-4 w-4 text-primary-500" />
                <span>Points disponibles : {{ formatPoints(totalPoints) }}</span>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <Input
                v-model="manualPoints"
                type="number"
                min="1"
                label="Nombre de points à échanger"
                placeholder="Ex. 25"
                inputmode="numeric"
                :error="manualValidationMessage"
              />

              <Input
                v-model="manualDescription"
                label="Description (optionnelle)"
                placeholder="Ex. Réduction chez Bio Market"
                maxlength="120"
              />
            </div>

            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-4">
              <p class="text-sm text-neutral-600">
                {{ manualPointsPreview }}
              </p>

              <Button
                :disabled="!canSubmitManualRedeem"
                :loading="manualRedeeming"
                :full-width="true"
                class="sm:w-auto"
                @click="submitManualRedeem"
              >
                Échanger ces points
              </Button>
            </div>
          </Card>

          <Card>
            <div class="flex items-center justify-start sm:justify-between mt-4">
              <h3 class="text-xl font-semibold text-neutral-900">Récompenses Disponibles</h3>
              <div class="flex items-center gap-2 text-sm text-neutral-700">
                <Gift class="h-4 w-4" />
                {{ availableRewards.length }} disponible(s)
              </div>
            </div>

            <div v-if="rewardsLoading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
              <Card v-for="index in 3" :key="index" class="animate-pulse">
                <div class="h-6 bg-neutral-200 rounded w-1/2 mb-4" />
                <div class="h-4 bg-neutral-200 rounded w-2/3" />
              </Card>
            </div>

            <div v-else-if="rewardsError" class="text-sm text-accent-red mt-4">
              {{ rewardsError }}
            </div>

            <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
              <div
                v-for="reward in availableRewards"
                :key="reward.id"
                class="border border-neutral-200 rounded p-6 hover:transition-all duration-200"
                :class="[
                  canRedeem(reward.cost) ? 'bg-white hover:border-primary-300' : 'bg-neutral-50',
                  reward.highlight ? 'ring-2 ring-primary-300 shadow-glow' : ''
                ]"
              >
                <div class="flex items-center gap-4 mt-3">
                  <div class="p-3 bg-gradient-to-r from-primary-600 to-primary-700 rounded">
                    <component :is="reward.icon" class="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <div class="flex flex-wrap items-center gap-2">
                      <h4 class="font-semibold text-neutral-900">{{ reward.title }}</h4>
                      <span
                        v-if="reward.reward.tier_required"
                        class="rounded-full px-2 py-0.5 text-xs font-semibold uppercase tracking-wide"
                        :class="tierColors[reward.reward.tier_required] || 'bg-neutral-200 text-neutral-700'"
                      >
                        {{ tierLabels[reward.reward.tier_required] || reward.reward.tier_required }}
                      </span>
                    </div>
                    <p class="text-sm text-neutral-700">{{ reward.cost }} points</p>
                  </div>
                </div>

                <p class="text-sm text-neutral-700 mt-3">{{ reward.description }}</p>

                <Button
                  :disabled="!canRedeem(reward.cost)"
                  :variant="canRedeem(reward.cost) ? 'primary' : 'outline'"
                  :full-width="true"
                  class="mt-4"
                  @click="openRedeemModal(reward)"
                >
                  {{ canRedeem(reward.cost) ? 'Échanger' : 'Points insuffisants' }}
                </Button>
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
          <div class="px-4 py-4 border-b border-neutral-200">
            <div class="flex items-center justify-start sm:justify-between">
              <h3 class="text-lg font-semibold text-neutral-900">Confirmer l'échange</h3>
              <button class="p-2 hover:transition-colors" @click="closeRedeemModal">
                <X class="h-4 w-4 text-neutral-400" />
              </button>
            </div>
          </div>

          <div class="px-4 py-6">
            <div class="text-left sm:text-center mt-4">
              <div class="p-4 bg-gradient-to-r from-primary-600 to-primary-700 rounded inline-block mt-3">
                <component :is="selectedReward.icon" class="h-6 w-6 text-white" />
              </div>
              <h4 class="text-xl font-semibold text-neutral-900 mt-2">{{ selectedReward.title }}</h4>
              <p class="text-neutral-700">{{ selectedReward.description }}</p>
            </div>

            <div class="bg-neutral-50 rounded p-4 mt-4">
              <div class="flex justify-start sm:justify-between items-center">
                <span class="text-neutral-700">Coût de l'échange :</span>
                <span class="font-semibold text-primary-600">{{ formatPoints(selectedReward.cost) }} points</span>
              </div>
              <div class="flex justify-start sm:justify-between items-center mt-2">
                <span class="text-neutral-700">Points restants :</span>
                <span class="font-semibold text-neutral-900">{{ formatPoints(totalPoints - selectedReward.cost) }} points</span>
              </div>
            </div>

            <div class="flex gap-4">
              <Button variant="outline" class="flex-1" @click="closeRedeemModal">
                Annuler
              </Button>
              <Button
                :disabled="redeeming"
                class="flex-1"
                @click="confirmRedeem"
              >
                <Loader2 v-if="redeeming" class="h-4 w-4 mr-2 animate-spin" />
                {{ redeeming ? 'Échange...' : 'Confirmer' }}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </DashboardLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, type Component } from 'vue'
import {
  Star, Clock, Gift, TrendingUp, RefreshCw, X, Loader2,
  ShoppingBag, MessageSquare, Users, Award, Minus
} from 'lucide-vue-next'
import { useLoyaltyPoints } from '@/composables/useLoyaltyPoints'
import { rewardsService } from '@/services/rewardsService'
import DashboardLayout from '@/components/ui/DashboardLayout.vue'
import Card from '@/components/ui/2025/Card.vue'
import { useDashboardLayout } from '@/composables/useDashboardLayout'
import Button from '@/components/ui/2025/Button.vue'
import Input from '@/components/ui/2025/Input.vue'
import { notify } from '@/composables/useNotifications'
import type { Reward } from '@/types'

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
  canRedeem,
  tier
} = useLoyaltyPoints()

// State
interface RewardOption {
  id: number
  title: string
  description: string
  cost: number
  icon: Component
  highlight?: boolean
  reward: Reward
}

const selectedReward = ref<RewardOption | null>(null)
const redeeming = ref(false)
const rewardsSection = ref<HTMLElement | null>(null)
const rewardsLoading = ref(false)
const rewardsError = ref<string | null>(null)

const manualPoints = ref('')
const manualDescription = ref('')
const manualRedeeming = ref(false)

const { sidebar, header } = useDashboardLayout('consumer')

// Mock rewards data (this would come from an API in real app)
const availableRewards = ref<RewardOption[]>([])

const manualPointsValue = computed(() => {
  if (!manualPoints.value) {
    return NaN
  }

  const parsed = Number.parseInt(manualPoints.value, 10)
  return Number.isNaN(parsed) ? NaN : parsed
})

const manualValidationMessage = computed(() => {
  if (!manualPoints.value) {
    return ''
  }

  if (Number.isNaN(manualPointsValue.value)) {
    return 'Veuillez saisir un nombre de points valide.'
  }

  if (manualPointsValue.value <= 0) {
    return 'Le nombre de points doit être supérieur à 0.'
  }

  if (manualPointsValue.value > totalPoints.value) {
    return 'Vous n\'avez pas suffisamment de points pour cet échange.'
  }

  return ''
})

const canSubmitManualRedeem = computed(() => {
  return (
    !manualValidationMessage.value &&
    !Number.isNaN(manualPointsValue.value) &&
    manualPointsValue.value > 0 &&
    !manualRedeeming.value
  )
})

const manualPointsPreview = computed(() => {
  if (!manualPoints.value) {
    return 'Saisissez le nombre de points à échanger.'
  }

  if (Number.isNaN(manualPointsValue.value)) {
    return 'Entrez un nombre entier positif pour lancer un échange.'
  }

  const remaining = Math.max(totalPoints.value - manualPointsValue.value, 0)
  return `Après l'échange vous conserverez ${formatPoints(remaining)} point(s).`
})

const tierColors: Record<string, string> = {
  bronze: 'bg-amber-100 text-amber-700',
  silver: 'bg-neutral-200 text-neutral-700',
  gold: 'bg-yellow-100 text-yellow-800',
  platinum: 'bg-indigo-100 text-indigo-700'
}

const tierProgressColors: Record<string, string> = {
  bronze: 'bg-amber-400',
  silver: 'bg-neutral-500',
  gold: 'bg-yellow-500',
  platinum: 'bg-indigo-500'
}

const tierLabels: Record<string, string> = {
  bronze: 'Bronze',
  silver: 'Argent',
  gold: 'Or',
  platinum: 'Platine'
}

const currentTier = computed(() => tier.value?.current_tier ?? 'bronze')
const tierLabel = computed(() => tier.value?.current_tier_name ?? 'Bronze')
const tierProgress = computed(() => tier.value?.progress_percentage ?? 0)
const tierNextLabel = computed(() => tier.value?.next_tier_name ?? null)
const pointsToNextTier = computed(() => tier.value?.points_to_next_tier ?? 0)

// Methods
const refreshPoints = async () => {
  await fetchMyPoints()
}

const getPointTypeIcon = (type: string) => {
  const icons: Record<string, typeof Star> = {
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

const openRedeemModal = (reward: RewardOption) => {
  selectedReward.value = reward
}

const closeRedeemModal = () => {
  selectedReward.value = null
  redeeming.value = false
}

const confirmRedeem = async () => {
  if (!selectedReward.value) return

  redeeming.value = true

  try {
    const response = await rewardsService.redeemReward(selectedReward.value.reward.id)
    notify.success(response.message || 'Récompense échangée avec succès')
    await fetchMyPoints()
    await loadRewards()
    closeRedeemModal()
  } catch (err: any) {
    notify.error(err?.message || 'Impossible d’échanger cette récompense')
  } finally {
    redeeming.value = false
  }
}

const submitManualRedeem = async () => {
  if (!canSubmitManualRedeem.value || Number.isNaN(manualPointsValue.value)) {
    return
  }

  manualRedeeming.value = true

  const success = await redeemPoints({
    points: manualPointsValue.value,
    description: manualDescription.value.trim() || `Échange manuel de ${manualPointsValue.value} points`
  })

  if (success) {
    manualPoints.value = ''
    manualDescription.value = ''
  }

  manualRedeeming.value = false
}

const getRewardIcon = (reward: Reward): Component => {
  const name = reward.name?.toLowerCase() ?? ''
  if (name.includes('livraison')) return Gift
  if (name.includes('réduction') || name.includes('reduction')) return ShoppingBag
  if (name.includes('bonus') || name.includes('gratuit')) return Award
  return Gift
}

const loadRewards = async () => {
  rewardsLoading.value = true
  rewardsError.value = null

  try {
    const response = await rewardsService.getRewards({ per_page: 12 })
    const rewards = response.data || []

    availableRewards.value = rewards.map((reward) => ({
      id: reward.id,
      title: reward.name,
      description: reward.description || 'Récompense exclusive GÊLADAL.',
      cost: reward.points_required,
      icon: getRewardIcon(reward),
      highlight: Boolean(reward.is_featured),
      reward
    }))
  } catch (err: any) {
    rewardsError.value = err?.message || 'Impossible de charger les récompenses'
  } finally {
    rewardsLoading.value = false
  }
}

// Lifecycle
onMounted(() => {
  fetchMyPoints()
  loadRewards()
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
