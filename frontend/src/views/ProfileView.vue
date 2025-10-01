<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 p-6">
    <div class="max-w-full sm:max-w-4xl mx-auto">
      <Card variant="elevated" class="mt-4 sm:mb-3xl">
        <div class="p-4 sm:p-6 lg:p-12">
          <h1 class="text-xl font-semibold mt-3">Mon Profil</h1>
          <p class="text-gray-700">Gestion des informations personnelles</p>

          <!-- User Information -->
          <div v-if="user" class="mt-8 space-y-6">
            <!-- Email -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <p class="text-base text-gray-900">{{ user.email }}</p>
            </div>

            <!-- Name -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Prénom</label>
                <p class="text-base text-gray-900">{{ user.first_name }}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Nom</label>
                <p class="text-base text-gray-900">{{ user.last_name }}</p>
              </div>
            </div>

            <!-- Contact -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div v-if="user.phone">
                <label class="block text-sm font-medium text-gray-700 mb-2">Téléphone</label>
                <p class="text-base text-gray-900">{{ user.phone }}</p>
              </div>
              <div v-if="user.city">
                <label class="block text-sm font-medium text-gray-700 mb-2">Ville</label>
                <p class="text-base text-gray-900">{{ user.city }}</p>
              </div>
            </div>

            <!-- Role -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Type de compte</label>
              <p class="text-base text-gray-900 capitalize">{{ getRoleLabel(user.role) }}</p>
            </div>

            <!-- Edit Button -->
            <div class="pt-4">
              <Button variant="primary" size="md" @click="editProfile">
                Modifier mon profil
              </Button>
            </div>
          </div>

          <div v-else class="mt-8 text-center text-gray-500">
            Chargement de vos informations...
          </div>
        </div>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import Card from '@/components/ui/2025/Card.vue'
import Button from '@/components/ui/2025/Button.vue'

const authStore = useAuthStore()
const user = computed(() => authStore.user)

const getRoleLabel = (role: string) => {
  const labels: Record<string, string> = {
    consumer: 'Consommateur',
    merchant: 'Commerçant',
    admin: 'Administrateur'
  }
  return labels[role] || role
}

const editProfile = () => {
  // TODO: Implement edit profile functionality
  console.log('Edit profile clicked')
}
</script>
