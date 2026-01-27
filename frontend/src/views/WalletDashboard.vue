<template>
  <DashboardLayout
    :sidebar="sidebar"
    :header="header"
    :mobile-nav="mobileNav"
    class="bg-gradient-to-br from-neutral-50 via-sky-50/40 to-primary-50"
  >
    <header class="sticky top-20 z-40 border-b border-white/60 bg-white/80 backdrop-blur-xl">
      <div class="container px-3 py-4">
        <div class="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            class="p-2"
            @click="$router.go(-1)"
          >
            <ArrowLeft class="h-6 w-6" />
          </Button>
          <div class="space-y-1">
            <h1 class="text-xl font-semibold text-neutral-900 lg:text-3xl">
              {{ pageTitle }}
            </h1>
            <p class="text-base text-neutral-600 lg:text-lg">
              {{ pageSubtitle }}
            </p>
          </div>
        </div>
      </div>
    </header>

    <div class="container px-3 py-6">
      <div class="mx-auto max-w-6xl space-y-6">
        <WalletCard
          :wallet="wallet"
          :loading="loading"
          @recharge="showRechargeModal = true"
          @settings="showSettingsModal = true"
        />

        <section class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Button
            variant="outline"
            class="h-auto items-start gap-3 rounded-2xl border-primary-200/60 bg-white/90 p-4 text-left shadow-sm transition hover:border-primary-300 hover:bg-white"
            @click="showRechargeModal = true"
          >
            <span class="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
              <Plus class="h-6 w-6 text-emerald-600" />
            </span>
            <span class="flex-1 space-y-1">
              <span class="block text-base font-semibold text-neutral-900">
                {{ isMerchant ? 'Encaisser un paiement' : 'Recharger' }}
              </span>
              <span class="block text-sm text-neutral-500">
                {{ isMerchant ? 'Initier un encaissement Mobile Money ou Paystack' : 'Ajouter des fonds instantanément' }}
              </span>
            </span>
          </Button>

          <Button
            variant="outline"
            class="h-auto items-start gap-3 rounded-2xl border-primary-200/60 bg-white/90 p-4 text-left shadow-sm transition hover:border-primary-300 hover:bg-white"
            @click="showTransferModal = true"
          >
            <span class="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100">
              <ArrowUpRight class="h-6 w-6 text-primary-600" />
            </span>
            <span class="flex-1 space-y-1">
              <span class="block text-base font-semibold text-neutral-900">Transférer</span>
              <span class="block text-sm text-neutral-500">Envoyer des fonds à un autre utilisateur</span>
            </span>
          </Button>

          <Button
            variant="outline"
            class="h-auto items-start gap-3 rounded-2xl border-primary-200/60 bg-white/90 p-4 text-left shadow-sm transition hover:border-primary-300 hover:bg-white"
            @click="showSettingsModal = true"
          >
            <span class="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100">
              <Settings class="h-6 w-6 text-indigo-600" />
            </span>
            <span class="flex-1 space-y-1">
              <span class="block text-base font-semibold text-neutral-900">Paramètres</span>
              <span class="block text-sm text-neutral-500">Gestion du PIN et des limites</span>
            </span>
          </Button>

          <Button
            variant="outline"
            class="h-auto items-start gap-3 rounded-2xl border-primary-200/60 bg-white/90 p-4 text-left shadow-sm transition hover:border-primary-300 hover:bg-white"
            @click="showStatsModal = true"
          >
            <span class="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
              <BarChart3 class="h-6 w-6 text-amber-600" />
            </span>
            <span class="flex-1 space-y-1">
              <span class="block text-base font-semibold text-neutral-900">Statistiques</span>
              <span class="block text-sm text-neutral-500">Analyse détaillée des mouvements</span>
            </span>
          </Button>
        </section>

        <section class="grid gap-6 lg:grid-cols-[2fr,1fr]">
          <WalletTransactions
            ref="transactionsComponent"
            :initial-transactions="transactions"
            :initial-pagination="transactionsPagination"
            @load-transactions="handleLoadTransactions"
          />

          <aside class="space-y-4">
            <Card class="space-y-4">
              <header class="flex items-center justify-between">
                <h3 class="text-lg font-semibold text-neutral-900">Aperçu du mois</h3>
              </header>
              <div v-if="stats" class="space-y-3">
                <div class="flex items-center justify-between rounded-xl bg-emerald-50 px-3 py-2">
                  <div class="flex items-center gap-2 text-emerald-700">
                    <ArrowUp class="h-4 w-4" />
                    <span class="text-sm font-medium">Crédits</span>
                  </div>
                  <span class="text-sm font-semibold text-emerald-700">
                    {{ formatAmount(stats.period_stats.total_credits) }} XOF
                  </span>
                </div>
                <div class="flex items-center justify-between rounded-xl bg-rose-50 px-3 py-2">
                  <div class="flex items-center gap-2 text-rose-700">
                    <ArrowDown class="h-4 w-4" />
                    <span class="text-sm font-medium">Débits</span>
                  </div>
                  <span class="text-sm font-semibold text-rose-700">
                    {{ formatAmount(stats.period_stats.total_debits) }} XOF
                  </span>
                </div>
                <div class="flex items-center justify-between rounded-xl bg-neutral-100 px-3 py-2">
                  <div class="flex items-center gap-2 text-neutral-700">
                    <Activity class="h-4 w-4" />
                    <span class="text-sm font-medium">Transactions</span>
                  </div>
                  <span class="text-sm font-semibold text-neutral-700">
                    {{ stats.period_stats.transaction_count }}
                  </span>
                </div>
              </div>
              <div v-else class="space-y-2">
                <div class="h-3 w-1/2 animate-pulse rounded-full bg-neutral-200" />
                <div class="h-3 w-2/3 animate-pulse rounded-full bg-neutral-200" />
                <div class="h-3 w-1/3 animate-pulse rounded-full bg-neutral-200" />
              </div>
            </Card>

            <Card class="space-y-4">
              <header class="flex items-center justify-between">
                <h3 class="text-lg font-semibold text-neutral-900">Limite quotidienne</h3>
                <span
                  v-if="wallet"
                  class="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-600"
                >
                  {{ formatAmount(wallet.daily_limit) }} XOF
                </span>
              </header>

              <div v-if="wallet" class="space-y-3">
                <div class="flex items-center justify-between text-sm text-neutral-600">
                  <span>Utilisé aujourd'hui</span>
                  <span class="font-semibold text-neutral-900">
                    {{ formatAmount(dailySpent) }} XOF
                  </span>
                </div>
                <div class="h-3 w-full overflow-hidden rounded-full bg-neutral-200">
                  <div
                    class="h-full rounded-full bg-gradient-to-r from-primary-500 to-indigo-500 transition-all duration-300"
                    :style="{ width: Math.min(Math.round(dailyLimitUsagePercentage), 100) + '%' }"
                  />
                </div>
                <div class="flex items-start justify-between text-sm text-neutral-500">
                  <span>Restant</span>
                  <span class="font-semibold text-neutral-900">
                    {{ formatAmount(remainingDailyLimit) }} XOF
                  </span>
                </div>
              </div>
              <p v-else class="text-sm text-neutral-500">
                Les limites apparaîtront dès que le portefeuille sera initialisé.
              </p>
            </Card>

            <Card class="space-y-4 bg-gradient-to-br from-neutral-50 via-primary-50 to-indigo-50">
              <header class="flex items-center gap-3">
                <span class="flex h-9 w-9 items-center justify-center rounded-full bg-primary-600 text-white">
                  <Shield class="h-4 w-4" />
                </span>
                <h3 class="text-lg font-semibold text-neutral-900">Sécurité</h3>
              </header>
              <div class="space-y-3 text-sm">
                <div class="flex items-center justify-between">
                  <span class="text-neutral-600">Code PIN</span>
                  <span class="font-medium text-neutral-900">
                    {{ hasPin ? '✓ Configuré' : '⚠ À configurer' }}
                  </span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-neutral-600">Statut</span>
                  <span class="font-medium text-neutral-900">
                    {{ isActive ? '✓ Actif' : '⚠ Inactif' }}
                  </span>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  class="w-full justify-center"
                  @click="showPinSetupModal = true"
                >
                  {{ hasPin ? 'Mettre à jour le PIN' : 'Configurer mon PIN' }}
                </Button>
              </div>
            </Card>
          </aside>
        </section>
      </div>
    </div>

    <WalletRecharge
      v-if="showRechargeModal"
      :loading="loading"
      @close="showRechargeModal = false"
      @recharge="handleRecharge"
    />

    <WalletPinSetup
      v-if="showPinSetupModal"
      :has-pin="hasPin"
      :loading="loading"
      @close="showPinSetupModal = false"
      @submit="handlePinSetup"
    />

    <div
      v-if="showTransferModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 p-4"
    >
      <div class="w-full max-w-xl space-y-4 rounded-2xl bg-white p-6 shadow-2xl">
        <header class="flex items-center justify-between">
          <h3 class="text-xl font-semibold text-neutral-900">Transfert (bientôt disponible)</h3>
          <Button variant="ghost" size="sm" @click="showTransferModal = false">
            <X class="h-5 w-5" />
          </Button>
        </header>
        <p class="text-sm text-neutral-600">
          L'envoi de fonds vers un autre portefeuille sera activé très prochainement.
          Restez connecté pour découvrir la version bêta.
        </p>
        <Button class="w-full justify-center" @click="showTransferModal = false">
          Compris
        </Button>
      </div>
    </div>

    <div
      v-if="showSettingsModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 p-4"
    >
      <div class="w-full max-w-xl space-y-5 rounded-2xl bg-white p-6 shadow-2xl">
        <header class="flex items-center justify-between">
          <h3 class="text-xl font-semibold text-neutral-900">Paramètres du portefeuille</h3>
          <Button variant="ghost" size="sm" @click="showSettingsModal = false">
            <X class="h-5 w-5" />
          </Button>
        </header>

        <Button
          variant="outline"
          class="h-auto items-center justify-between gap-3 rounded-xl border-neutral-200 p-4 text-left"
          @click="() => { showSettingsModal = false; showPinSetupModal = true }"
        >
          <span class="flex items-center gap-3 text-neutral-800">
            <span class="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100">
              <Key class="h-4 w-4" />
            </span>
            <span class="text-base font-medium">
              {{ hasPin ? 'Modifier mon code PIN' : 'Configurer un code PIN' }}
            </span>
          </span>
          <ChevronRight class="h-4 w-4 text-neutral-400" />
        </Button>

        <div class="space-y-2 rounded-xl border border-neutral-200 p-4">
          <div class="flex items-center justify-between text-sm">
            <span class="font-medium text-neutral-700">Activer le portefeuille</span>
            <button
              :disabled="loading"
              class="relative inline-flex h-6 w-12 items-center rounded-full transition-colors"
              :class="isActive ? 'bg-primary-600' : 'bg-neutral-300'"
              @click="toggleWalletStatus"
            >
              <span
                class="inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform"
                :class="isActive ? 'tranneutral-x-6' : 'tranneutral-x-1'"
              />
            </button>
          </div>
          <p class="text-sm text-neutral-500">
            {{ isActive ? 'Votre portefeuille est actif et prêt à recevoir des paiements.' : 'Activez le portefeuille pour encaisser et payer avec votre solde.' }}
          </p>
        </div>
      </div>
    </div>

    <div
      v-if="showStatsModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 p-4"
    >
      <div class="w-full max-w-xl space-y-4 rounded-2xl bg-white p-6 shadow-2xl">
        <header class="flex items-center justify-between">
          <h3 class="text-xl font-semibold text-neutral-900">Statistiques détaillées</h3>
          <Button variant="ghost" size="sm" @click="showStatsModal = false">
            <X class="h-5 w-5" />
          </Button>
        </header>
        <p class="text-sm text-neutral-600">
          Les graphiques d'analyse arriveront dans une prochaine itération. Vous pourrez suivre vos catégories de dépenses, vos habitudes de recharge et vos encaissements marchands.
        </p>
        <Button class="w-full justify-center" @click="showStatsModal = false">
          Fermer
        </Button>
      </div>
    </div>
  </DashboardLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute } from 'vue-router'
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  ArrowUpRight,
  Activity,
  BarChart3,
  ChevronRight,
  Key,
  Plus,
  Settings,
  Shield,
  X
} from 'lucide-vue-next'
import DashboardLayout from '@/components/ui/DashboardLayout.vue'
import Button from '@/components/ui/2025/Button.vue'
import Card from '@/components/ui/2025/Card.vue'
import WalletCard from '@/components/wallet/WalletCard.vue'
import WalletPinSetup from '@/components/wallet/WalletPinSetup.vue'
import WalletRecharge from '@/components/wallet/WalletRecharge.vue'
import WalletTransactions from '@/components/wallet/WalletTransactions.vue'
import { useDashboardLayout } from '@/composables/useDashboardLayout'
import { notify } from '@/composables/useNotifications'
import { useAuthStore } from '@/stores/auth'
import { useWalletStore } from '@/stores/wallet'

interface Pagination {
  current_page: number
  last_page: number
  per_page: number
  total: number
  from: number
  to: number
}

const route = useRoute()
const authStore = useAuthStore()
const walletStore = useWalletStore()

const layoutRole: 'consumer' | 'merchant' = ((route.meta.roles as string[] | undefined)?.includes('merchant')
  || authStore.user?.role === 'merchant')
  ? 'merchant'
  : 'consumer'

const { sidebar, header, mobileNav } = useDashboardLayout(layoutRole)
const isMerchant = computed(() => layoutRole === 'merchant')
const pageTitle = computed(() => (isMerchant.value ? 'Paiements & Portefeuille' : 'Portefeuille électronique 💳'))
const pageSubtitle = computed(() => (isMerchant.value
  ? 'Encaissez vos paiements Mobile Money, Paystack et gérez votre solde commerçant.'
  : 'Gérez votre solde, vos limites et vos transactions quotidiennes.'))

const showRechargeModal = ref(false)
const showTransferModal = ref(false)
const showSettingsModal = ref(false)
const showStatsModal = ref(false)
const showPinSetupModal = ref(false)

const {
  wallet,
  stats,
  loading,
  hasPin,
  isActive,
  dailyLimitUsagePercentage,
  remainingDailyLimit,
  dailySpent,
  transactions: storeTransactions,
  transactionsPagination: storeTransactionsPagination,
  transactionsLoading
} = storeToRefs(walletStore)

const transactions = ref(storeTransactions.value)
const transactionsPagination = ref<Pagination | undefined>(storeTransactionsPagination.value || undefined)
const transactionsComponent = ref<InstanceType<typeof WalletTransactions> | null>(null)

const formatAmount = (amount: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

type PaymentMethod = 'flooz' | 'tmoney' | 'orange_money' | 'mtn_momo' | 'paystack'

const handleRecharge = async (data: { amount: number | ''; payment_method: string; phone?: string }) => {
  const amount = typeof data.amount === 'number' ? data.amount : 0
  const success = await walletStore.rechargeWallet(amount, data.payment_method as PaymentMethod, data.phone)

  if (success) {
    notify.success('Demande de recharge initiée', 'Vous serez redirigé vers le provider de paiement.')
    showRechargeModal.value = false
  } else {
    notify.error(walletStore.error || 'Erreur lors de la recharge du portefeuille.')
  }
}

const handlePinSetup = async (data: { currentPin?: string; newPin: string }) => {
  const { currentPin, newPin } = data
  const success = currentPin
    ? await walletStore.changePin(currentPin, newPin)
    : await walletStore.setPin(newPin)

  if (success) {
    notify.success('Code PIN mis à jour avec succès.')
    showPinSetupModal.value = false
  } else {
    notify.error(walletStore.error || 'Impossible de configurer le code PIN pour le moment.')
  }
}

const toggleWalletStatus = async () => {
  const nextStatus = !isActive.value
  const success = await walletStore.toggleWalletStatus(nextStatus)

  if (success) {
    notify.success(nextStatus ? 'Portefeuille activé' : 'Portefeuille désactivé')
  } else {
    notify.error(walletStore.error || 'Erreur lors de la mise à jour du statut du portefeuille.')
  }
}

const handleLoadTransactions = async (filters: Record<string, unknown>, page?: number) => {
  transactionsComponent.value?.setLoading(true)
  await walletStore.fetchTransactions(filters, page)
  transactionsComponent.value?.updateTransactions(walletStore.transactions, walletStore.transactionsPagination || undefined)
}

watch(
  storeTransactions,
  (newTransactions) => {
    transactions.value = newTransactions
    transactionsComponent.value?.updateTransactions(newTransactions, storeTransactionsPagination.value || undefined)
  },
  { immediate: true }
)

watch(
  storeTransactionsPagination,
  (newPagination) => {
    transactionsPagination.value = newPagination || undefined
  },
  { immediate: true }
)

watch(
  transactionsLoading,
  (isLoading) => {
    if (transactionsComponent.value) {
      transactionsComponent.value.setLoading(isLoading)
    }
  },
  { immediate: true }
)

onMounted(async () => {
  await walletStore.fetchWallet()
  await walletStore.fetchTransactions()
  await walletStore.fetchStats()
})
</script>
