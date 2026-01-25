<template>
  <DashboardLayout :sidebar="sidebar" :header="header" class="bg-gradient-to-br from-neutral-50 via-sky-50/40 to-primary-50">
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-semibold text-neutral-900">{{ isRegisterMode ? 'Créer mon profil' : 'Modifier mon profil' }}</h1>
          <p class="text-sm text-neutral-600">Renseignez vos informations pour recevoir des livraisons.</p>
        </div>
        <Button variant="ghost" size="sm" @click="$router.back()">
          Retour
        </Button>
      </div>

      <Card>
        <template #header>
          <h2 class="text-lg font-semibold text-neutral-900">Informations véhicule</h2>
        </template>

        <div class="grid gap-4 md:grid-cols-2">
          <label class="block text-sm font-medium text-neutral-700">
            Type de véhicule
            <select v-model="form.vehicle_type" class="mt-2 w-full rounded-xl border border-neutral-200 bg-white px-3 py-3 text-sm">
              <option value="moto">Moto</option>
              <option value="velo">Vélo</option>
              <option value="voiture">Voiture</option>
              <option value="pied">À pied</option>
            </select>
          </label>

          <Input v-model="form.vehicle_plate" label="Immatriculation" placeholder="Ex : TG-1234" />
          <Input v-model="form.license_number" label="Numéro de permis" placeholder="Ex : LM-001" />
          <label class="block text-sm font-medium text-neutral-700">
            Zone de livraison
            <select v-model="form.delivery_zone_id" class="mt-2 w-full rounded-xl border border-neutral-200 bg-white px-3 py-3 text-sm">
              <option value="">Sélectionner une zone</option>
              <option v-for="zone in zones" :key="zone.id" :value="zone.id">
                {{ zone.name }}
              </option>
            </select>
          </label>
        </div>
      </Card>

      <Card>
        <template #header>
          <h2 class="text-lg font-semibold text-neutral-900">Documents</h2>
        </template>
        <div class="grid gap-4 md:grid-cols-2">
          <Input v-model="form.photo_url" label="Photo de profil (URL)" placeholder="https://..." />
          <Input
            v-if="isRegisterMode"
            v-model="form.id_card_url"
            label="Carte d'identité (URL)"
            placeholder="https://..."
          />
          <Input
            v-if="isRegisterMode"
            v-model="form.license_url"
            label="Permis de conduire (URL)"
            placeholder="https://..."
          />
        </div>
      </Card>

      <div class="flex justify-end">
        <Button :loading="submitting" @click="handleSubmit">
          {{ isRegisterMode ? 'Créer mon profil' : 'Enregistrer' }}
        </Button>
      </div>
    </div>
  </DashboardLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { storeToRefs } from 'pinia'
import DashboardLayout from '@/components/ui/DashboardLayout.vue'
import { Button, Card, Input } from '@/components/ui/2025'
import { useDashboardLayout } from '@/composables/useDashboardLayout'
import { useDriverStore } from '@/stores/driver'
import { deliveryService } from '@/services/deliveryService'
import { driverService } from '@/services/driverService'
import { notify } from '@/composables/useNotifications'
import type { DeliveryZone } from '@/types'

const driverStore = useDriverStore()
const { profile } = storeToRefs(driverStore)
const { sidebar, header } = useDashboardLayout('driver')

const zones = ref<DeliveryZone[]>([])
const submitting = ref(false)

const form = reactive({
  vehicle_type: 'moto',
  vehicle_plate: '',
  license_number: '',
  delivery_zone_id: '' as number | '' ,
  photo_url: '',
  id_card_url: '',
  license_url: ''
})

const isRegisterMode = computed(() => !profile.value)

const loadZones = async () => {
  try {
    const response = await deliveryService.getZones()
    zones.value = response.data || []
  } catch (err) {
    zones.value = []
  }
}

const loadProfile = async () => {
  const success = await driverStore.fetchProfile()
  if (success && profile.value) {
    form.vehicle_type = profile.value.vehicle_type
    form.vehicle_plate = profile.value.vehicle_plate || ''
    form.license_number = profile.value.license_number || ''
    form.delivery_zone_id = profile.value.delivery_zone_id || ''
    form.photo_url = profile.value.photo_url || ''
  }
}

const handleSubmit = async () => {
  submitting.value = true

  try {
    if (isRegisterMode.value) {
      const response = await driverService.register({
        vehicle_type: form.vehicle_type as any,
        vehicle_plate: form.vehicle_plate || undefined,
        license_number: form.license_number || undefined,
        delivery_zone_id: form.delivery_zone_id ? Number(form.delivery_zone_id) : undefined,
        photo_url: form.photo_url || undefined,
        id_card_url: form.id_card_url || undefined,
        license_url: form.license_url || undefined
      })

      notify.success(response.message || 'Profil créé avec succès')
    } else {
      const response = await driverService.updateProfile({
        vehicle_type: form.vehicle_type as any,
        vehicle_plate: form.vehicle_plate || undefined,
        license_number: form.license_number || undefined,
        delivery_zone_id: form.delivery_zone_id ? Number(form.delivery_zone_id) : undefined,
        photo_url: form.photo_url || undefined
      })

      notify.success(response.message || 'Profil mis à jour')
    }

    await driverStore.fetchProfile()
  } catch (err: any) {
    notify.error(err?.message || 'Impossible de sauvegarder le profil')
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  await loadZones()
  await loadProfile()
})
</script>
