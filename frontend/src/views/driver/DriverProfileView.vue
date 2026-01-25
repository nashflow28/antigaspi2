<template>
  <DashboardLayout :sidebar="sidebar" :header="header" class="bg-gradient-to-br from-neutral-50 via-sky-50/40 to-primary-50">
    <div class="space-y-6">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-2xl font-semibold text-neutral-900">Mon profil livreur</h1>
          <p class="text-sm text-neutral-600">Gérez vos informations et votre véhicule.</p>
        </div>
        <Button variant="outline" size="sm" @click="$router.push('/driver/profile/edit')">
          Modifier mon profil
        </Button>
      </div>

      <Card v-if="!profile">
        <p class="text-sm text-neutral-600">Profil livreur introuvable. Veuillez le compléter.</p>
        <Button class="mt-4" @click="$router.push('/driver/profile/edit')">Créer mon profil</Button>
      </Card>

      <div v-else class="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card>
          <template #header>
            <h2 class="text-lg font-semibold text-neutral-900">Informations personnelles</h2>
          </template>
          <div class="space-y-3 text-sm text-neutral-600">
            <p><span class="font-medium text-neutral-900">Nom :</span> {{ profile.user?.first_name }} {{ profile.user?.last_name }}</p>
            <p><span class="font-medium text-neutral-900">Téléphone :</span> {{ profile.user?.phone || 'Non renseigné' }}</p>
            <p><span class="font-medium text-neutral-900">Zone :</span> {{ profile.zone?.name || 'Non définie' }}</p>
            <p><span class="font-medium text-neutral-900">Véhicule :</span> {{ vehicleLabel(profile.vehicle_type) }}</p>
            <p><span class="font-medium text-neutral-900">Immatriculation :</span> {{ profile.vehicle_plate || 'Non renseignée' }}</p>
            <p><span class="font-medium text-neutral-900">Permis :</span> {{ profile.license_number || 'Non renseigné' }}</p>
          </div>
        </Card>

        <Card>
          <template #header>
            <h2 class="text-lg font-semibold text-neutral-900">Statut</h2>
          </template>
          <div class="space-y-3 text-sm text-neutral-600">
            <p>
              <span class="font-medium text-neutral-900">Vérification :</span>
              <Badge :variant="profile.is_verified ? 'success' : 'warning'" size="sm">
                {{ profile.is_verified ? 'Vérifié' : 'En attente' }}
              </Badge>
            </p>
            <p><span class="font-medium text-neutral-900">Disponibilité :</span> {{ profile.is_available ? 'En ligne' : 'Hors ligne' }}</p>
            <p v-if="profile.rating"><span class="font-medium text-neutral-900">Note :</span> {{ profile.rating.toFixed(1) }}/5</p>
          </div>
        </Card>
      </div>
    </div>
  </DashboardLayout>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import DashboardLayout from '@/components/ui/DashboardLayout.vue'
import { Badge, Button, Card } from '@/components/ui/2025'
import { useDriverStore } from '@/stores/driver'
import { useDashboardLayout } from '@/composables/useDashboardLayout'

const driverStore = useDriverStore()
const { profile } = storeToRefs(driverStore)
const { sidebar, header } = useDashboardLayout('driver')

const vehicleLabel = (type: string) => {
  const labels: Record<string, string> = {
    moto: 'Moto',
    velo: 'Vélo',
    voiture: 'Voiture',
    pied: 'À pied'
  }
  return labels[type] || type
}

onMounted(() => {
  driverStore.fetchProfile()
})
</script>
