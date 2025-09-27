<template>
  <DashboardLayout
    :sidebar="sidebar"
    :header="header"
    class="bg-gradient-to-br from-neutral-50 to-primary-50"
  >
    <!-- Page Header -->
    <div class="bg-white/60 backdrop-blur-md glass-border border-b backdrop-blur-lg sticky top-20 z-40">
      <div class="container-2025 py-6">
        <div class="flex items-center justify-between animate-fade-in-up">
          <div class="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              class="p-2"
              @click="$router.go(-1)"
            >
              <ArrowLeft class="w-6 h-6" />
            </Button>
            <div>
              <h1 class="text-3xl lg:text-4xl font-bold text-neutral-900 mb-2">
                Portefeuille électronique 💳
              </h1>
              <p class="text-lg text-neutral-600">
                Gérez votre portefeuille et vos transactions
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="container-2025 py-8">
      <div class="max-w-6xl mx-auto space-y-8">
        <!-- Wallet Card -->
        <div class="animate-fade-in-up">
          <WalletCard
            :wallet="walletStore.wallet"
            :loading="walletStore.loading"
            @recharge="showRechargeModal = true"
            @settings="showSettingsModal = true"
          />
        </div>

        <!-- Quick Actions -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in-up" style="animation-delay: 0.1s;">
          <Button
            variant="outline"
            class="p-4 h-auto flex-col justify-start"
            @click="showRechargeModal = true"
          >
            <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-green-200 transition-colors">
              <Plus class="w-6 h-6 text-green-600" />
            </div>
            <div class="font-medium text-neutral-900">Recharger</div>
            <div class="text-sm text-neutral-500">Ajouter des fonds</div>
          </Button>

          <Button
            variant="outline"
            class="p-4 h-auto flex-col justify-start"
            @click="showTransferModal = true"
          >
            <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-blue-200 transition-colors">
              <ArrowUpRight class="w-6 h-6 text-blue-600" />
            </div>
            <div class="font-medium text-neutral-900">Transférer</div>
            <div class="text-sm text-neutral-500">Vers un autre utilisateur</div>
          </Button>

          <Button
            variant="outline"
            class="p-4 h-auto flex-col justify-start"
            @click="showSettingsModal = true"
          >
            <div class="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-purple-200 transition-colors">
              <Settings class="w-6 h-6 text-purple-600" />
            </div>
            <div class="font-medium text-neutral-900">Paramètres</div>
            <div class="text-sm text-neutral-500">PIN et limites</div>
          </Button>

          <Button
            variant="outline"
            class="p-4 h-auto flex-col justify-start"
            @click="showStatsModal = true"
          >
            <div class="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-orange-200 transition-colors">
              <BarChart3 class="w-6 h-6 text-orange-600" />
            </div>
            <div class="font-medium text-neutral-900">Statistiques</div>
            <div class="text-sm text-neutral-500">Analyse des dépenses</div>
          </Button>
        </div>

        <!-- Main Content Grid -->
        <div class="grid lg:grid-cols-3 gap-8">
          <!-- Transactions -->
          <div class="lg:col-span-2 animate-fade-in-up" style="animation-delay: 0.2s;">
            <WalletTransactions
              ref="transactionsComponent"
              :initial-transactions="transactions"
              :initial-pagination="transactionsPagination"
              @load-transactions="handleLoadTransactions"
            />
          </div>

          <!-- Sidebar -->
          <div class="space-y-6">
            <!-- Stats Overview -->
            <Card class="animate-fade-in-up" style="animation-delay: 0.3s;">
              <h3 class="text-lg font-bold text-neutral-900 mb-4">Aperçu mensuel</h3>
              <div v-if="walletStore.stats" class="space-y-4">
                <div class="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div class="flex items-center gap-2">
                    <ArrowUp class="w-4 h-4 text-green-600" />
                    <span class="text-sm font-medium text-green-800">Crédits</span>
                  </div>
                  <span class="font-bold text-green-600">
                    {{ formatAmount(walletStore.stats.period_stats.total_credits) }} XOF
                  </span>
                </div>
                <div class="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div class="flex items-center gap-2">
                    <ArrowDown class="w-4 h-4 text-red-600" />
                    <span class="text-sm font-medium text-red-800">Débits</span>
                  </div>
                  <span class="font-bold text-red-600">
                    {{ formatAmount(walletStore.stats.period_stats.total_debits) }} XOF
                  </span>
                </div>
                <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div class="flex items-center gap-2">
                    <Activity class="w-4 h-4 text-gray-600" />
                    <span class="text-sm font-medium text-gray-800">Transactions</span>
                  </div>
                  <span class="font-bold text-gray-600">
                    {{ walletStore.stats.period_stats.transaction_count }}
                  </span>
                </div>
              </div>
              <div v-else class="text-center py-4">
                <div class="animate-pulse">
                  <div class="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-2" />
                  <div class="h-4 bg-gray-200 rounded w-1/2 mx-auto" />
                </div>
              </div>
            </Card>

            <!-- Daily Limit -->
            <Card class="animate-fade-in-up" style="animation-delay: 0.4s;">
              <h3 class="text-lg font-bold text-neutral-900 mb-4">Limite quotidienne</h3>
              <div v-if="walletStore.wallet" class="space-y-3">
                <div class="flex justify-between text-sm">
                  <span class="text-neutral-600">Utilisée aujourd'hui</span>
                  <span class="font-medium">{{ formatAmount(walletStore.dailySpent) }} XOF</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-3">
                  <div
                    class="bg-gradient-to-r from-primary-500 to-primary-600 h-3 rounded-full transition-all duration-300"
                    :style="{ width: Math.min(walletStore.dailyLimitUsagePercentage, 100) + '%' }"
                  />
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-neutral-600">Limite</span>
                  <span class="font-medium">{{ formatAmount(walletStore.dailyLimit) }} XOF</span>
                </div>
              </div>
            </Card>

            <!-- Security -->
            <Card class="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 animate-fade-in-up" style="animation-delay: 0.5s;">
              <div class="flex items-center gap-3 mb-4">
                <div class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <Shield class="w-4 h-4 text-white" />
                </div>
                <h3 class="text-lg font-bold text-blue-800">Sécurité</h3>
              </div>
              <div class="space-y-2 text-sm">
                <div class="flex items-center justify-between">
                  <span class="text-blue-700">Code PIN</span>
                  <span class="font-medium text-blue-800">
                    {{ walletStore.hasPin ? '✓ Configuré' : '⚠ Non configuré' }}
                  </span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-blue-700">Statut</span>
                  <span class="font-medium text-blue-800">
                    {{ walletStore.isActive ? '✓ Actif' : '⚠ Inactif' }}
                  </span>
                </div>
              </div>
              <button
                v-if="!walletStore.hasPin"
                class="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                @click="showPinSetupModal = true"
              >
                Configurer un PIN
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </div>

    <!-- Modals -->
    <WalletRecharge
      v-if="showRechargeModal"
      :loading="walletStore.loading"
      @close="showRechargeModal = false"
      @recharge="handleRecharge"
    />

    <WalletPinSetup
      v-if="showPinSetupModal"
      :has-pin="walletStore.hasPin"
      :loading="walletStore.loading"
      @close="showPinSetupModal = false"
      @submit="handlePinSetup"
    />

    <!-- Simplified Transfer Modal (basic implementation) -->
    <div v-if="showTransferModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div class="bg-white rounded-xl p-6 w-full max-w-md">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-xl font-semibold text-gray-900">Transfert (Bientôt disponible)</h3>
          <button
            class="text-gray-400 hover:text-gray-600"
            @click="showTransferModal = false"
          >
            <X class="w-6 h-6" />
          </Button>
        </div>
        <p class="text-gray-600 mb-4">
          La fonctionnalité de transfert entre utilisateurs sera disponible dans une prochaine mise à jour.
        </p>
        <button
          class="w-full px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          @click="showTransferModal = false"
        >
          Compris
        </button>
      </div>
    </div>

    <!-- Settings Modal -->
    <div v-if="showSettingsModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div class="bg-white rounded-xl p-6 w-full max-w-md">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-xl font-semibold text-gray-900">Paramètres du portefeuille</h3>
          <button
            class="text-gray-400 hover:text-gray-600"
            @click="showSettingsModal = false"
          >
            <X class="w-6 h-6" />
          </Button>
        </div>
        <div class="space-y-4">
          <button
            class="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            @click="() => { showSettingsModal = false; showPinSetupModal = true }"
          >
            <div class="flex items-center gap-3">
              <Key class="w-5 h-5 text-gray-600" />
              <span class="font-medium">{{ walletStore.hasPin ? 'Modifier le PIN' : 'Configurer un PIN' }}</span>
            </div>
            <ChevronRight class="w-5 h-5 text-gray-400" />
          </Button>

          <div class="p-4 border border-gray-200 rounded-lg">
            <div class="flex items-center justify-between mb-2">
              <span class="font-medium">Activer/Désactiver le portefeuille</span>
              <button
                :disabled="walletStore.loading"
                class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                :class="walletStore.isActive ? 'bg-primary-600' : 'bg-gray-200'"
                @click="toggleWalletStatus"
              >
                <span
                  class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                  :class="walletStore.isActive ? 'translate-x-6' : 'translate-x-1'"
                />
              </Button>
            </div>
            <p class="text-sm text-gray-500">
              {{ walletStore.isActive ? 'Portefeuille activé' : 'Portefeuille désactivé' }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Stats Modal -->
    <div v-if="showStatsModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div class="bg-white rounded-xl p-6 w-full max-w-md">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-xl font-semibold text-gray-900">Statistiques détaillées</h3>
          <button
            class="text-gray-400 hover:text-gray-600"
            @click="showStatsModal = false"
          >
            <X class="w-6 h-6" />
          </Button>
        </div>
        <p class="text-gray-600 mb-4">
          Les statistiques détaillées avec graphiques seront disponibles dans une prochaine version.
        </p>
        <button
          class="w-full px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          @click="showStatsModal = false"
        >
          Fermer
        </button>
      </div>
    </div>
  </DashboardLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useWalletStore } from '@/stores/wallet'
import { notify } from '@/composables/useNotifications'
import WalletCard from '@/components/wallet/WalletCard.vue'
import WalletRecharge from '@/components/wallet/WalletRecharge.vue'
import WalletTransactions from '@/components/wallet/WalletTransactions.vue'
import WalletPinSetup from '@/components/wallet/WalletPinSetup.vue'
import {
  ArrowLeft, Plus, ArrowUpRight, Settings, BarChart3, ArrowUp, ArrowDown,
  Activity, Shield, X, Key, ChevronRight
} from 'lucide-vue-next'
import DashboardLayout from '@/components/ui/DashboardLayout.vue'
import Card from '@/components/ui/2025/Card.vue'
import Button from '@/components/ui/2025/Button.vue'
import { useDashboardLayout } from '@/composables/useDashboardLayout'

const walletStore = useWalletStore()
const { sidebar, header } = useDashboardLayout('consumer')

const showRechargeModal = ref(false)
const showTransferModal = ref(false)
const showSettingsModal = ref(false)
const showStatsModal = ref(false)
const showPinSetupModal = ref(false)

const transactions = ref<any[]>([])
const transactionsPagination = ref<Pagination | undefined>(undefined)
const transactionsComponent = ref(null)

const formatAmount = (amount: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

const handleRecharge = async (data: any) => {
  const success = await walletStore.rechargeWallet(data.amount, data.payment_method, data.phone)

  if (success) {
    notify.success('Demande de recharge initiée', 'Vous serez redirigé vers le provider de paiement')
    showRechargeModal.value = false
  } else {
    notify.error(walletStore.error || 'Erreur lors de la recharge')
  }
}

const handlePinSetup = async (data: any) => {
  let success = false

  if (data.currentPin) {
    success = await walletStore.changePin(data.currentPin, data.newPin)
  } else {
    success = await walletStore.setPin(data.newPin)
  }

  if (success) {
    notify.success('Code PIN configuré avec succès')
    showPinSetupModal.value = false
  } else {
    notify.error(walletStore.error || 'Erreur lors de la configuration du PIN')
  }
}

const toggleWalletStatus = async () => {
  const newStatus = !walletStore.isActive
  const success = await walletStore.toggleWalletStatus(newStatus)

  if (success) {
    notify.success(newStatus ? 'Portefeuille activé' : 'Portefeuille désactivé')
  } else {
    notify.error(walletStore.error || 'Erreur lors de la modification du statut')
  }
}

const handleLoadTransactions = async (filters: any, page?: number) => {
  await walletStore.fetchTransactions(filters, page)

  if (transactionsComponent.value) {
    (transactionsComponent.value as any).updateTransactions(
      walletStore.transactions,
      walletStore.transactionsPagination
    )
  }
}

onMounted(async () => {
  // Load wallet data
  await walletStore.fetchWallet()

  // Load initial transactions
  await walletStore.fetchTransactions()
  transactions.value = walletStore.transactions
  transactionsPagination.value = walletStore.transactionsPagination

  // Load stats
  await walletStore.fetchStats()
})
</script>
