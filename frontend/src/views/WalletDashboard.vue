<template>
  <DashboardLayout
    :sidebar="sidebar"
    :header="header"
    class="bg-gradient-to-br from-neutral-50 to-primary-50"
  >
    <!-- Page Header -->
    <div class="bg-white/60 backdrop-blur-md glass-border border-b backdrop-blur-lg sticky top-20 z-40">
      <div class="container px-4 sm:px-6 lg:px-8-2025 py-6">
        <div class="flex items-center justify-start sm:justify-between animate-fade-in-up">
          <div class="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              class="p-2"
              @click="$router.go(-1)"
            >
              <ArrowLeft class="w-10 h-10" />
            </Button>
            <div>
              <h1 class="text-responsive-xl lg:text-display-sm font-semibold text-heading mb-2">
                Portefeuille électronique 💳
              </h1>
              <p class="text-responsive-lg text-body">
                Gérez votre portefeuille et vos transactions
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="container px-4 sm:px-6 lg:px-8-2025 py-6 sm:py-8">
      <div class="max-w-full sm:max-w-6xl mx-auto space-y-8">
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
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in-up" style="animation-delay: 0.1s;">
          <Button
            variant="outline"
            class="p-4 h-auto flex-col justify-start"
            @click="showRechargeModal = true"
          >
            <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:transition-colors">
              <Plus class="w-10 h-10 text-success" />
            </div>
            <div class="font-medium text-heading">Recharger</div>
            <div class="text-responsive-sm text-muted">Ajouter des fonds</div>
          </Button>

          <Button
            variant="outline"
            class="p-4 h-auto flex-col justify-start"
            @click="showTransferModal = true"
          >
            <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:transition-colors">
              <ArrowUpRight class="w-10 h-10 text-info" />
            </div>
            <div class="font-medium text-heading">Transférer</div>
            <div class="text-responsive-sm text-muted">Vers un autre utilisateur</div>
          </Button>

          <Button
            variant="outline"
            class="p-4 h-auto flex-col justify-start"
            @click="showSettingsModal = true"
          >
            <div class="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:transition-colors">
              <Settings class="w-10 h-10 text-purple-600" />
            </div>
            <div class="font-medium text-heading">Paramètres</div>
            <div class="text-responsive-sm text-muted">PIN et limites</div>
          </Button>

          <Button
            variant="outline"
            class="p-4 h-auto flex-col justify-start"
            @click="showStatsModal = true"
          >
            <div class="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:transition-colors">
              <BarChart3 class="w-10 h-10 text-orange-600" />
            </div>
            <div class="font-medium text-heading">Statistiques</div>
            <div class="text-responsive-sm text-muted">Analyse des dépenses</div>
          </Button>
        </div>

        <!-- Main Content Grid -->
        <div class="grid lg:grid-cols-3 gap-6 sm:gap-8">
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
              <h3 class="text-responsive-lg font-semibold text-heading mb-4">Aperçu mensuel</h3>
              <div v-if="walletStore.stats" class="space-y-4">
                <div class="flex items-center justify-start sm:justify-between p-3 bg-green-50 rounded-lg">
                  <div class="flex items-center gap-2">
                    <ArrowUp class="w-5 h-5 text-success" />
                    <span class="text-responsive-sm font-medium text-green-800">Crédits</span>
                  </div>
                  <span class="font-semibold text-success">
                    {{ formatAmount(walletStore.stats.period_stats.total_credits) }} XOF
                  </span>
                </div>
                <div class="flex items-center justify-start sm:justify-between p-3 bg-red-50 rounded-lg">
                  <div class="flex items-center gap-2">
                    <ArrowDown class="w-5 h-5 text-error" />
                    <span class="text-responsive-sm font-medium text-red-800">Débits</span>
                  </div>
                  <span class="font-semibold text-error">
                    {{ formatAmount(walletStore.stats.period_stats.total_debits) }} XOF
                  </span>
                </div>
                <div class="flex items-center justify-start sm:justify-between p-3 bg-neutral-50 rounded-lg">
                  <div class="flex items-center gap-2">
                    <Activity class="w-5 h-5 text-body" />
                    <span class="text-responsive-sm font-medium text-heading-secondary">Transactions</span>
                  </div>
                  <span class="font-semibold text-body">
                    {{ walletStore.stats.period_stats.transaction_count }}
                  </span>
                </div>
              </div>
              <div v-else class="text-left sm:text-center py-4">
                <div class="animate-pulse">
                  <div class="h-5 bg-neutral-200 rounded w-3/4 mx-auto mb-2" />
                  <div class="h-5 bg-neutral-200 rounded w-1/2 mx-auto" />
                </div>
              </div>
            </Card>

            <!-- Daily Limit -->
            <Card class="animate-fade-in-up" style="animation-delay: 0.4s;">
              <h3 class="text-responsive-lg font-semibold text-heading mb-4">Limite quotidienne</h3>
              <div v-if="walletStore.wallet" class="space-y-3">
                <div class="flex justify-start sm:justify-between text-responsive-sm">
                  <span class="text-body">Utilisée aujourd'hui</span>
                  <span class="font-medium">{{ formatAmount(walletStore.dailySpent) }} XOF</span>
                </div>
                <div class="w-full bg-neutral-200 rounded-full h-3">
                  <div
                    class="bg-gradient-to-r from-primary-500 to-primary-600 h-3 rounded-full transition-all duration-300"
                    :style="{ width: Math.min(walletStore.dailyLimitUsagePercentage, 100) + '%' }"
                  />
                </div>
                <div class="flex justify-start sm:justify-between text-responsive-sm">
                  <span class="text-body">Limite</span>
                  <span class="font-medium">{{ formatAmount(walletStore.dailyLimit) }} XOF</span>
                </div>
              </div>
            </Card>

            <!-- Security -->
            <Card class="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 animate-fade-in-up" style="animation-delay: 0.5s;">
              <div class="flex items-center gap-3 mb-4">
                <div class="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                  <Shield class="w-5 h-5 text-white" />
                </div>
                <h3 class="text-responsive-lg font-semibold text-blue-800">Sécurité</h3>
              </div>
              <div class="space-y-2 text-responsive-sm">
                <div class="flex items-center justify-start sm:justify-between">
                  <span class="text-blue-700">Code PIN</span>
                  <span class="font-medium text-blue-800">
                    {{ walletStore.hasPin ? '✓ Configuré' : '⚠ Non configuré' }}
                  </span>
                </div>
                <div class="flex items-center justify-start sm:justify-between">
                  <span class="text-blue-700">Statut</span>
                  <span class="font-medium text-blue-800">
                    {{ walletStore.isActive ? '✓ Actif' : '⚠ Inactif' }}
                  </span>
                </div>
              </div>
              <button
                v-if="!walletStore.hasPin"
                class="w-full mt-4 px-4 py-3 bg-blue-600 text-white rounded-lg hover:transition-colors text-responsive-sm font-medium"
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
      <div class="bg-white rounded-xl p-6 w-full max-w-full sm:max-w-md">
        <div class="flex items-center justify-start sm:justify-between mb-6">
          <h3 class="text-responsive-xl font-semibold text-heading">Transfert (Bientôt disponible)</h3>
          <button
            class="text-placeholder hover:text-body"
            @click="showTransferModal = false"
          >
            <X class="w-10 h-10" />
          </Button>
        </div>
        <p class="text-body mb-4">
          La fonctionnalité de transfert entre utilisateurs sera disponible dans une prochaine mise à jour.
        </p>
        <button
          class="w-full px-4 py-3 bg-primary-600 text-white rounded-lg hover:transition-colors"
          @click="showTransferModal = false"
        >
          Compris
        </button>
      </div>
    </div>

    <!-- Settings Modal -->
    <div v-if="showSettingsModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div class="bg-white rounded-xl p-6 w-full max-w-full sm:max-w-md">
        <div class="flex items-center justify-start sm:justify-between mb-6">
          <h3 class="text-responsive-xl font-semibold text-heading">Paramètres du portefeuille</h3>
          <button
            class="text-placeholder hover:text-body"
            @click="showSettingsModal = false"
          >
            <X class="w-10 h-10" />
          </Button>
        </div>
        <div class="space-y-4">
          <button
            class="w-full flex items-center justify-start sm:justify-between p-4 border border-neutral-200 rounded-lg hover:transition-colors"
            @click="() => { showSettingsModal = false; showPinSetupModal = true }"
          >
            <div class="flex items-center gap-3">
              <Key class="w-5 h-5 text-body" />
              <span class="font-medium">{{ walletStore.hasPin ? 'Modifier le PIN' : 'Configurer un PIN' }}</span>
            </div>
            <ChevronRight class="w-5 h-5 text-placeholder" />
          </Button>

          <div class="p-4 border border-neutral-200 rounded-lg">
            <div class="flex items-center justify-start sm:justify-between mb-2">
              <span class="font-medium">Activer/Désactiver le portefeuille</span>
              <button
                :disabled="walletStore.loading"
                class="relative inline-flex h-10 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                :class="walletStore.isActive ? 'bg-primary-600' : 'bg-neutral-200'"
                @click="toggleWalletStatus"
              >
                <span
                  class="inline-block h-5 w-5 transform rounded-full bg-white transition-transform"
                  :class="walletStore.isActive ? 'translate-x-6' : 'translate-x-1'"
                />
              </Button>
            </div>
            <p class="text-responsive-sm text-muted">
              {{ walletStore.isActive ? 'Portefeuille activé' : 'Portefeuille désactivé' }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Stats Modal -->
    <div v-if="showStatsModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div class="bg-white rounded-xl p-6 w-full max-w-full sm:max-w-md">
        <div class="flex items-center justify-start sm:justify-between mb-6">
          <h3 class="text-responsive-xl font-semibold text-heading">Statistiques détaillées</h3>
          <button
            class="text-placeholder hover:text-body"
            @click="showStatsModal = false"
          >
            <X class="w-10 h-10" />
          </Button>
        </div>
        <p class="text-body mb-4">
          Les statistiques détaillées avec graphiques seront disponibles dans une prochaine version.
        </p>
        <button
          class="w-full px-4 py-3 bg-primary-600 text-white rounded-lg hover:transition-colors"
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
