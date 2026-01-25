<template>
  <DashboardLayout :sidebar="sidebar" :header="header" class="bg-gradient-to-br from-neutral-50 via-sky-50/40 to-primary-50">
    <div class="space-y-6">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-2xl font-semibold text-neutral-900">Tableau de bord livreur</h1>
          <p class="text-sm text-neutral-600">Suivez vos livraisons et vos gains en un clin d'œil.</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          :disabled="loading"
          @click="refresh"
        >
          <RefreshCw class="h-4 w-4" :class="{ 'animate-spin': loading }" />
          Actualiser
        </Button>
      </div>

      <div v-if="!profile" class="space-y-4">
        <Card>
          <h2 class="text-lg font-semibold text-neutral-900">Profil livreur requis</h2>
          <p class="text-sm text-neutral-600 mt-2">
            Votre compte livreur n'est pas encore configuré. Complétez votre profil pour commencer.
          </p>
          <Button class="mt-4" @click="$router.push('/driver/profile/edit')">
            Compléter mon profil
          </Button>
        </Card>
      </div>

      <div v-else class="space-y-6">
        <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card>
            <p class="text-sm text-neutral-500">Aujourd'hui</p>
            <p class="text-2xl font-semibold text-neutral-900 mt-2">{{ stats?.today.deliveries ?? 0 }} livraisons</p>
            <p class="text-sm text-neutral-600">{{ formatPrice(stats?.today.earnings ?? 0) }}</p>
          </Card>
          <Card>
            <p class="text-sm text-neutral-500">Cette semaine</p>
            <p class="text-2xl font-semibold text-neutral-900 mt-2">{{ stats?.week.deliveries ?? 0 }} livraisons</p>
            <p class="text-sm text-neutral-600">{{ formatPrice(stats?.week.earnings ?? 0) }}</p>
          </Card>
          <Card>
            <p class="text-sm text-neutral-500">Ce mois</p>
            <p class="text-2xl font-semibold text-neutral-900 mt-2">{{ stats?.month.deliveries ?? 0 }} livraisons</p>
            <p class="text-sm text-neutral-600">{{ formatPrice(stats?.month.earnings ?? 0) }}</p>
          </Card>
          <Card>
            <p class="text-sm text-neutral-500">Total</p>
            <p class="text-2xl font-semibold text-neutral-900 mt-2">{{ stats?.total.deliveries ?? 0 }} livraisons</p>
            <p class="text-sm text-neutral-600">{{ formatPrice(stats?.total.earnings ?? 0) }}</p>
          </Card>
        </div>

        <div class="grid gap-4 lg:grid-cols-[2fr_1fr]">
          <Card class="space-y-4">
            <div class="flex items-center justify-between">
              <h2 class="text-lg font-semibold text-neutral-900">Statut & disponibilité</h2>
              <Badge :variant="profile.is_verified ? 'success' : 'warning'" size="sm">
                {{ profile.is_verified ? 'Vérifié' : 'En validation' }}
              </Badge>
            </div>
            <p class="text-sm text-neutral-600">
              {{ profile.is_verified
                ? 'Vous pouvez recevoir des propositions de livraison.'
                : 'Votre profil est en cours de vérification.' }}
            </p>
            <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div class="text-sm text-neutral-600">
                Disponibilité : <strong class="text-neutral-900">{{ profile.is_available ? 'En ligne' : 'Hors ligne' }}</strong>
              </div>
              <Button :disabled="!profile.is_verified" @click="toggleAvailability">
                {{ profile.is_available ? 'Passer hors ligne' : 'Passer en ligne' }}
              </Button>
            </div>
          </Card>

          <Card class="space-y-4">
            <h2 class="text-lg font-semibold text-neutral-900">Actions rapides</h2>
            <div class="flex flex-col gap-3">
              <Button variant="outline" @click="$router.push('/driver/deliveries/available')">
                Voir les livraisons disponibles
              </Button>
              <Button variant="outline" @click="$router.push('/driver/deliveries/active')">
                Livraison en cours
              </Button>
              <Button variant="outline" @click="$router.push('/driver/earnings')">
                Voir mes gains
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  </DashboardLayout>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { RefreshCw } from 'lucide-vue-next'
import DashboardLayout from '@/components/ui/DashboardLayout.vue'
import { Button, Card, Badge } from '@/components/ui/2025'
import { useDriverStore } from '@/stores/driver'
import { useDashboardLayout } from '@/composables/useDashboardLayout'
import { formatPrice } from '@/utils/currency'

const driverStore = useDriverStore()
const { profile, stats, loading } = storeToRefs(driverStore)

const { sidebar, header } = useDashboardLayout('driver')

const refresh = async () => {
  await driverStore.fetchProfile()
}

const toggleAvailability = async () => {
  await driverStore.toggleAvailability()
}

onMounted(() => {
  refresh()
})
</script>
