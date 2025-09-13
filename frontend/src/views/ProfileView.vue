<template>
  <div class="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-6">
    <div class="max-w-4xl mx-auto">
      <!-- Header -->
      <div class="mb-8 text-center">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">Mon Profil</h1>
        <p class="text-gray-600">Gérez vos informations personnelles et préférences</p>
      </div>

      <!-- Profile Card -->
      <div class="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
        <!-- Profile Header -->
        <div class="bg-gradient-to-r from-green-600 to-blue-600 px-8 py-6 text-white">
          <div class="flex items-center space-x-6">
            <div class="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <UserIcon class="w-10 h-10 text-white" />
            </div>
            <div>
              <h2 class="text-2xl font-bold">
                {{ user?.first_name }} {{ user?.last_name }}
              </h2>
              <p class="text-green-100">{{ user?.email }}</p>
              <div class="flex items-center mt-2 space-x-2">
                <span class="px-3 py-1 bg-white bg-opacity-20 rounded-full text-sm">
                  {{ roleLabel }}
                </span>
                <span class="text-sm text-green-100">
                  Membre depuis {{ formatDate(user?.created_at) }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Profile Content -->
        <div class="p-8">
          <!-- Tabs -->
          <div class="border-b border-gray-200 mb-8">
            <nav class="-mb-px flex space-x-8">
              <button
                v-for="tab in tabs"
                :key="tab.id"
                @click="activeTab = tab.id"
                :class="[
                  activeTab === tab.id
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
                  'whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2'
                ]"
              >
                <component :is="tab.icon" class="w-5 h-5" />
                <span>{{ tab.name }}</span>
              </button>
            </nav>
          </div>

          <!-- Tab Content -->
          <div class="tab-content">
            <!-- Personal Information Tab -->
            <div v-if="activeTab === 'personal'" class="space-y-8">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Prénom</label>
                  <input
                    v-model="profileForm.first_name"
                    type="text"
                    class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Votre prénom"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Nom</label>
                  <input
                    v-model="profileForm.last_name"
                    type="text"
                    class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Votre nom"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    v-model="profileForm.email"
                    type="email"
                    class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="votre@email.com"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Téléphone</label>
                  <input
                    v-model="profileForm.phone"
                    type="tel"
                    class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="+33 6 12 34 56 78"
                  />
                </div>
                <div class="md:col-span-2">
                  <label class="block text-sm font-medium text-gray-700 mb-2">Ville</label>
                  <input
                    v-model="profileForm.city"
                    type="text"
                    class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Votre ville"
                  />
                </div>
              </div>

              <div class="flex justify-end">
                <button
                  @click="updateProfile"
                  :disabled="updating"
                  class="px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-xl font-medium hover:from-green-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  <CheckIcon v-if="!updating" class="w-5 h-5" />
                  <ArrowPathIcon v-else class="w-5 h-5 animate-spin" />
                  <span>{{ updating ? 'Mise à jour...' : 'Mettre à jour' }}</span>
                </button>
              </div>
            </div>

            <!-- Security Tab -->
            <div v-else-if="activeTab === 'security'" class="space-y-8">
              <div class="bg-amber-50 border border-amber-200 rounded-xl p-6">
                <div class="flex items-center space-x-3">
                  <ShieldCheckIcon class="w-6 h-6 text-amber-600" />
                  <div>
                    <h3 class="font-semibold text-amber-800">Sécurité du compte</h3>
                    <p class="text-sm text-amber-700">Modifiez votre mot de passe pour sécuriser votre compte</p>
                  </div>
                </div>
              </div>

              <div class="space-y-6">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Mot de passe actuel</label>
                  <input
                    v-model="passwordForm.current_password"
                    type="password"
                    class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Votre mot de passe actuel"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Nouveau mot de passe</label>
                  <input
                    v-model="passwordForm.new_password"
                    type="password"
                    class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Nouveau mot de passe"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Confirmer le mot de passe</label>
                  <input
                    v-model="passwordForm.confirm_password"
                    type="password"
                    class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Confirmer le nouveau mot de passe"
                  />
                </div>
              </div>

              <div class="flex justify-end">
                <button
                  @click="updatePassword"
                  :disabled="updatingPassword || !isPasswordFormValid"
                  class="px-6 py-3 bg-gradient-to-r from-amber-600 to-red-600 text-white rounded-xl font-medium hover:from-amber-700 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  <LockClosedIcon v-if="!updatingPassword" class="w-5 h-5" />
                  <ArrowPathIcon v-else class="w-5 h-5 animate-spin" />
                  <span>{{ updatingPassword ? 'Mise à jour...' : 'Changer le mot de passe' }}</span>
                </button>
              </div>
            </div>

            <!-- Preferences Tab -->
            <div v-else-if="activeTab === 'preferences'" class="space-y-8">
              <div class="grid grid-cols-1 gap-8">
                <!-- Notification Settings -->
                <div class="bg-gray-50 rounded-xl p-6">
                  <h3 class="font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                    <BellIcon class="w-5 h-5" />
                    <span>Notifications</span>
                  </h3>
                  <div class="space-y-4">
                    <div class="flex items-center justify-between">
                      <div>
                        <p class="font-medium text-gray-900">Notifications par email</p>
                        <p class="text-sm text-gray-600">Recevoir des notifications par email</p>
                      </div>
                      <label class="relative inline-flex items-center cursor-pointer">
                        <input
                          v-model="preferences.email_notifications"
                          type="checkbox"
                          class="sr-only peer"
                        />
                        <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                      </label>
                    </div>
                    <div class="flex items-center justify-between">
                      <div>
                        <p class="font-medium text-gray-900">Notifications de nouvelles offres</p>
                        <p class="text-sm text-gray-600">Recevoir des alertes pour les nouveaux produits</p>
                      </div>
                      <label class="relative inline-flex items-center cursor-pointer">
                        <input
                          v-model="preferences.product_notifications"
                          type="checkbox"
                          class="sr-only peer"
                        />
                        <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                      </label>
                    </div>
                  </div>
                </div>

                <!-- Distance Preferences -->
                <div class="bg-gray-50 rounded-xl p-6">
                  <h3 class="font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                    <MapPinIcon class="w-5 h-5" />
                    <span>Préférences de distance</span>
                  </h3>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Rayon de recherche maximum (km)
                    </label>
                    <select
                      v-model="preferences.max_distance"
                      class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="5">5 km</option>
                      <option value="10">10 km</option>
                      <option value="15">15 km</option>
                      <option value="25">25 km</option>
                      <option value="50">50 km</option>
                    </select>
                  </div>
                </div>
              </div>

              <div class="flex justify-end">
                <button
                  @click="updatePreferences"
                  :disabled="updatingPreferences"
                  class="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  <CogIcon v-if="!updatingPreferences" class="w-5 h-5" />
                  <ArrowPathIcon v-else class="w-5 h-5 animate-spin" />
                  <span>{{ updatingPreferences ? 'Sauvegarde...' : 'Sauvegarder' }}</span>
                </button>
              </div>
            </div>

            <!-- Statistics Tab -->
            <div v-else-if="activeTab === 'statistics'" class="space-y-8">
              <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div class="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
                  <div class="flex items-center space-x-4">
                    <div class="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                      <ShoppingBagIcon class="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p class="text-2xl font-bold text-green-900">{{ userStats.total_reservations }}</p>
                      <p class="text-green-700 text-sm">Réservations totales</p>
                    </div>
                  </div>
                </div>

                <div class="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                  <div class="flex items-center space-x-4">
                    <div class="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                      <CurrencyEuroIcon class="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p class="text-2xl font-bold text-blue-900">{{ userStats.total_savings }}€</p>
                      <p class="text-blue-700 text-sm">Économies totales</p>
                    </div>
                  </div>
                </div>

                <div class="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-6 border border-emerald-200">
                  <div class="flex items-center space-x-4">
                    <div class="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center">
                      <GlobeAltIcon class="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p class="text-2xl font-bold text-emerald-900">{{ userStats.co2_saved }}kg</p>
                      <p class="text-emerald-700 text-sm">CO2 économisé</p>
                    </div>
                  </div>
                </div>
              </div>

              <div class="bg-gray-50 rounded-xl p-6">
                <h3 class="font-semibold text-gray-900 mb-4">Impact environnemental</h3>
                <div class="space-y-4">
                  <div class="flex justify-between items-center py-3 border-b border-gray-200">
                    <span class="text-gray-700">Nourriture sauvée</span>
                    <span class="font-semibold text-green-600">{{ userStats.food_saved }}kg</span>
                  </div>
                  <div class="flex justify-between items-center py-3 border-b border-gray-200">
                    <span class="text-gray-700">Réservations terminées</span>
                    <span class="font-semibold text-blue-600">{{ userStats.completed_reservations }}</span>
                  </div>
                  <div class="flex justify-between items-center py-3">
                    <span class="text-gray-700">Ce mois-ci</span>
                    <span class="font-semibold text-purple-600">{{ userStats.this_month }} réservations</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="bg-white rounded-2xl shadow-xl p-6">
        <h3 class="font-semibold text-gray-900 mb-4">Actions rapides</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <router-link
            to="/dashboard"
            class="flex items-center space-x-3 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl hover:from-green-100 hover:to-blue-100 transition-colors"
          >
            <HomeIcon class="w-6 h-6 text-green-600" />
            <div>
              <p class="font-medium text-gray-900">Tableau de bord</p>
              <p class="text-sm text-gray-600">Retour à l'accueil</p>
            </div>
          </router-link>

          <router-link
            to="/products"
            class="flex items-center space-x-3 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl hover:from-blue-100 hover:to-purple-100 transition-colors"
          >
            <ShoppingBagIcon class="w-6 h-6 text-blue-600" />
            <div>
              <p class="font-medium text-gray-900">Parcourir les produits</p>
              <p class="text-sm text-gray-600">Découvrir de nouvelles offres</p>
            </div>
          </router-link>

          <router-link
            to="/reservations"
            class="flex items-center space-x-3 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl hover:from-purple-100 hover:to-pink-100 transition-colors"
          >
            <ClockIcon class="w-6 h-6 text-purple-600" />
            <div>
              <p class="font-medium text-gray-900">Mes réservations</p>
              <p class="text-sm text-gray-600">Gérer mes commandes</p>
            </div>
          </router-link>
        </div>
      </div>
    </div>

    <!-- Success/Error Messages -->
    <div
      v-if="message"
      :class="[
        'fixed top-4 right-4 px-6 py-4 rounded-xl shadow-lg z-50',
        messageType === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
      ]"
    >
      <div class="flex items-center space-x-2">
        <CheckCircleIcon v-if="messageType === 'success'" class="w-5 h-5" />
        <ExclamationCircleIcon v-else class="w-5 h-5" />
        <span>{{ message }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue'
import { useAuthStore } from '@/stores/auth'
import {
  UserIcon,
  HomeIcon,
  ShieldCheckIcon,
  CogIcon,
  ChartBarIcon,
  CheckIcon,
  LockClosedIcon,
  BellIcon,
  MapPinIcon,
  ShoppingBagIcon,
  CurrencyEuroIcon,
  GlobeAltIcon,
  ClockIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationCircleIcon
} from '@heroicons/vue/24/outline'

const authStore = useAuthStore()
const user = computed(() => authStore.user)

// Reactive data
const activeTab = ref('personal')
const updating = ref(false)
const updatingPassword = ref(false)
const updatingPreferences = ref(false)
const message = ref('')
const messageType = ref<'success' | 'error'>('success')

// Form data
const profileForm = reactive({
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  city: ''
})

const passwordForm = reactive({
  current_password: '',
  new_password: '',
  confirm_password: ''
})

const preferences = reactive({
  email_notifications: true,
  product_notifications: true,
  max_distance: '15'
})

const userStats = reactive({
  total_reservations: 0,
  completed_reservations: 0,
  total_savings: 0,
  food_saved: 0,
  co2_saved: 0,
  this_month: 0
})

// Computed properties
const roleLabel = computed(() => {
  switch (user.value?.role) {
    case 'consumer': return 'Consommateur'
    case 'merchant': return 'Commerçant'
    case 'admin': return 'Administrateur'
    default: return 'Utilisateur'
  }
})

const isPasswordFormValid = computed(() => {
  return passwordForm.current_password &&
         passwordForm.new_password &&
         passwordForm.confirm_password &&
         passwordForm.new_password === passwordForm.confirm_password &&
         passwordForm.new_password.length >= 6
})

// Tabs configuration
const tabs = [
  { id: 'personal', name: 'Informations personnelles', icon: UserIcon },
  { id: 'security', name: 'Sécurité', icon: ShieldCheckIcon },
  { id: 'preferences', name: 'Préférences', icon: CogIcon },
  { id: 'statistics', name: 'Statistiques', icon: ChartBarIcon }
]

// Methods
const formatDate = (dateString?: string) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long'
  })
}

const showMessage = (msg: string, type: 'success' | 'error' = 'success') => {
  message.value = msg
  messageType.value = type
  setTimeout(() => {
    message.value = ''
  }, 5000)
}

const updateProfile = async () => {
  try {
    updating.value = true
    // TODO: Implement API call to update profile
    await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
    showMessage('Profil mis à jour avec succès!', 'success')
  } catch (error) {
    showMessage('Erreur lors de la mise à jour du profil', 'error')
  } finally {
    updating.value = false
  }
}

const updatePassword = async () => {
  try {
    updatingPassword.value = true
    // TODO: Implement API call to update password
    await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
    passwordForm.current_password = ''
    passwordForm.new_password = ''
    passwordForm.confirm_password = ''
    showMessage('Mot de passe modifié avec succès!', 'success')
  } catch (error) {
    showMessage('Erreur lors de la modification du mot de passe', 'error')
  } finally {
    updatingPassword.value = false
  }
}

const updatePreferences = async () => {
  try {
    updatingPreferences.value = true
    // TODO: Implement API call to update preferences
    await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
    showMessage('Préférences sauvegardées avec succès!', 'success')
  } catch (error) {
    showMessage('Erreur lors de la sauvegarde des préférences', 'error')
  } finally {
    updatingPreferences.value = false
  }
}

const loadUserStats = async () => {
  try {
    // TODO: Implement API call to load user statistics
    // For now, using mock data
    userStats.total_reservations = 12
    userStats.completed_reservations = 8
    userStats.total_savings = 156.50
    userStats.food_saved = 15.2
    userStats.co2_saved = 38.0
    userStats.this_month = 3
  } catch (error) {
    console.error('Error loading user stats:', error)
  }
}

// Initialize form data
onMounted(() => {
  if (user.value) {
    profileForm.first_name = user.value.first_name
    profileForm.last_name = user.value.last_name
    profileForm.email = user.value.email
    profileForm.phone = user.value.phone || ''
    profileForm.city = user.value.city
  }
  loadUserStats()
})
</script>
