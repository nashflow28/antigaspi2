<template>
  <div class="min-h-screen bg-gradient-to-br from-neutral-50 to-primary-50">
    <!-- Page Header -->
    <div class="glass-bg glass-border border-b backdrop-blur-lg sticky top-20 z-40">
      <div class="container-fluid py-6">
        <div class="flex items-center gap-4 animate-fade-in-up">
          <button
            @click="$router.go(-1)"
            class="p-2 rounded-xl text-neutral-600 hover:text-primary-600 hover:bg-primary-50 transition-all duration-200"
          >
            <ArrowLeft class="w-6 h-6" />
          </button>
          <div>
            <h1 class="text-3xl lg:text-4xl font-bold text-neutral-900 mb-2">
              Réserver un produit 🛒
            </h1>
            <p class="text-lg text-neutral-600">
              Finalisez votre réservation en quelques étapes
            </p>
          </div>
        </div>
      </div>
    </div>

    <div class="container-fluid py-8">
      <div class="max-w-4xl mx-auto">
        <!-- Étapes de réservation -->
        <div class="card mb-8 animate-fade-in-up">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-xl font-bold text-neutral-900">Étapes de réservation</h2>
            <div class="text-sm text-neutral-600">
              Étape {{ currentStep }} sur 3
            </div>
          </div>

          <!-- Indicateur de progression -->
          <div class="flex items-center gap-4 mb-8">
            <div
              v-for="step in 3"
              :key="step"
              class="flex-1 relative"
            >
              <div
                :class="[
                  'w-full h-2 rounded-full transition-all duration-300',
                  step <= currentStep ? 'bg-primary-500' : 'bg-neutral-200'
                ]"
              ></div>
              <div
                :class="[
                  'absolute -top-6 left-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300',
                  step <= currentStep ? 'bg-primary-500 text-white' : 'bg-neutral-200 text-neutral-600'
                ]"
              >
                {{ step }}
              </div>
            </div>
          </div>

          <!-- Libellés des étapes -->
          <div class="grid grid-cols-3 gap-4 text-center text-sm">
            <div :class="currentStep >= 1 ? 'text-primary-600 font-medium' : 'text-neutral-500'">
              Détails produit
            </div>
            <div :class="currentStep >= 2 ? 'text-primary-600 font-medium' : 'text-neutral-500'">
              Informations récupération
            </div>
            <div :class="currentStep >= 3 ? 'text-primary-600 font-medium' : 'text-neutral-500'">
              Confirmation
            </div>
          </div>
        </div>

        <div class="grid lg:grid-cols-3 gap-8">
          <!-- Formulaire principal -->
          <div class="lg:col-span-2 space-y-6">
            <!-- Étape 1: Détails du produit -->
            <div v-if="currentStep === 1" class="card animate-fade-in-up">
              <h3 class="text-xl font-bold text-neutral-900 mb-6">Détails du produit</h3>

              <div class="flex gap-6 mb-6">
                <div class="w-32 h-32 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Package class="w-16 h-16 text-primary-400" />
                </div>
                <div class="flex-1">
                  <h4 class="text-2xl font-bold text-neutral-900 mb-2">{{ product.name }}</h4>
                  <p class="text-neutral-600 mb-4">{{ product.description }}</p>
                  <div class="flex items-center gap-4 mb-4">
                    <div class="flex items-center gap-2">
                      <span class="text-3xl font-bold text-primary-600">
                        {{ formatPrice(product.discounted_price) }}
                      </span>
                      <span class="text-lg text-neutral-400 line-through">
                        {{ formatPrice(product.original_price) }}
                      </span>
                    </div>
                    <span class="badge badge-success">-{{ product.discount }}%</span>
                  </div>
                  <div class="flex items-center gap-4 text-sm text-neutral-600">
                    <div class="flex items-center gap-1">
                      <Clock class="w-4 h-4" />
                      <span>{{ formatTimeLeft(product.expires_at) }}</span>
                    </div>
                    <div class="flex items-center gap-1">
                      <Package class="w-4 h-4" />
                      <span>{{ product.available_quantity - product.reserved_quantity }} disponibles</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Quantité -->
              <div class="space-y-4">
                <div>
                  <label class="form-label">Quantité souhaitée</label>
                  <div class="flex items-center gap-4">
                    <button
                      @click="decreaseQuantity"
                      :disabled="reservation.quantity <= 1"
                      class="p-3 rounded-xl border border-neutral-200 text-neutral-600 hover:bg-primary-50 hover:text-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      <Minus class="w-5 h-5" />
                    </button>
                    <input
                      v-model.number="reservation.quantity"
                      type="number"
                      :min="1"
                      :max="product.available_quantity - product.reserved_quantity"
                      class="w-20 text-center form-input"
                      @input="validateQuantity"
                    />
                    <button
                      @click="increaseQuantity"
                      :disabled="reservation.quantity >= (product.available_quantity - product.reserved_quantity)"
                      class="p-3 rounded-xl border border-neutral-200 text-neutral-600 hover:bg-primary-50 hover:text-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      <Plus class="w-5 h-5" />
                    </button>
                  </div>
                  <p class="text-sm text-neutral-500 mt-1">
                    Maximum {{ product.available_quantity - product.reserved_quantity }} disponible{{ (product.available_quantity - product.reserved_quantity) > 1 ? 's' : '' }}
                  </p>
                </div>

                <!-- Notes spéciales -->
                <div>
                  <label for="notes" class="form-label">Notes spéciales (optionnel)</label>
                  <textarea
                    id="notes"
                    v-model="reservation.notes"
                    placeholder="Allergies, préférences particulières..."
                    class="form-textarea"
                    rows="3"
                  ></textarea>
                </div>
              </div>
            </div>

            <!-- Étape 2: Informations récupération -->
            <div v-if="currentStep === 2" class="card animate-fade-in-up">
              <h3 class="text-xl font-bold text-neutral-900 mb-6">Informations de récupération</h3>

              <div class="space-y-6">
                <!-- Horaires de récupération -->
                <div>
                  <label class="form-label">Quand souhaitez-vous récupérer ?</label>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label for="pickup-date" class="text-sm font-medium text-neutral-700 mb-2 block">
                        Date de récupération
                      </label>
                      <input
                        id="pickup-date"
                        v-model="reservation.pickup_date"
                        type="date"
                        :min="getTodayDate()"
                        :max="getMaxPickupDate()"
                        class="form-input"
                        required
                      />
                    </div>
                    <div>
                      <label for="pickup-time" class="text-sm font-medium text-neutral-700 mb-2 block">
                        Heure de récupération
                      </label>
                      <select
                        id="pickup-time"
                        v-model="reservation.pickup_time"
                        class="form-select"
                        required
                      >
                        <option value="">Choisir un créneau</option>
                        <option value="09:00">09:00 - 10:00</option>
                        <option value="10:00">10:00 - 11:00</option>
                        <option value="11:00">11:00 - 12:00</option>
                        <option value="14:00">14:00 - 15:00</option>
                        <option value="15:00">15:00 - 16:00</option>
                        <option value="16:00">16:00 - 17:00</option>
                        <option value="17:00">17:00 - 18:00</option>
                        <option value="18:00">18:00 - 19:00</option>
                      </select>
                    </div>
                  </div>
                </div>

                <!-- Contact -->
                <div>
                  <label for="contact-phone" class="form-label">Téléphone de contact</label>
                  <input
                    id="contact-phone"
                    v-model="reservation.contact_phone"
                    type="tel"
                    placeholder="+33 1 23 45 67 89"
                    class="form-input"
                    required
                  />
                  <p class="text-sm text-neutral-500 mt-1">
                    Pour vous contacter en cas de problème
                  </p>
                </div>

                <!-- Instructions spéciales -->
                <div>
                  <label for="pickup-instructions" class="form-label">Instructions particulières (optionnel)</label>
                  <textarea
                    id="pickup-instructions"
                    v-model="reservation.pickup_instructions"
                    placeholder="Comment vous trouver, indications spéciales..."
                    class="form-textarea"
                    rows="3"
                  ></textarea>
                </div>
              </div>
            </div>

            <!-- Étape 3: Confirmation -->
            <div v-if="currentStep === 3" class="card animate-fade-in-up">
              <h3 class="text-xl font-bold text-neutral-900 mb-6">Confirmation de réservation</h3>

              <div class="space-y-6">
                <!-- Récapitulatif produit -->
                <div class="p-4 bg-primary-50 rounded-xl border border-primary-200">
                  <h4 class="font-bold text-primary-800 mb-3">Produit réservé</h4>
                  <div class="flex justify-between items-center mb-2">
                    <span>{{ product.name }}</span>
                    <span class="font-bold">{{ formatPrice(product.discounted_price) }}</span>
                  </div>
                  <div class="flex justify-between items-center mb-2">
                    <span>Quantité: {{ reservation.quantity }}</span>
                    <span class="font-bold text-primary-600">
                      {{ formatPrice(product.discounted_price * reservation.quantity) }}
                    </span>
                  </div>
                  <div class="text-sm text-primary-700 pt-2 border-t border-primary-200">
                    Économie: {{ formatPrice((product.original_price - product.discounted_price) * reservation.quantity) }}
                  </div>
                </div>

                <!-- Récapitulatif récupération -->
                <div class="p-4 bg-secondary-50 rounded-xl border border-secondary-200">
                  <h4 class="font-bold text-secondary-800 mb-3">Récupération</h4>
                  <div class="space-y-2 text-sm">
                    <div class="flex items-center gap-2">
                      <MapPin class="w-4 h-4 text-secondary-600" />
                      <span>{{ product.merchant.name }}</span>
                    </div>
                    <div class="flex items-center gap-2">
                      <Calendar class="w-4 h-4 text-secondary-600" />
                      <span>{{ formatPickupDateTime() }}</span>
                    </div>
                    <div class="flex items-center gap-2">
                      <Phone class="w-4 h-4 text-secondary-600" />
                      <span>{{ reservation.contact_phone }}</span>
                    </div>
                  </div>
                </div>

                <!-- Conditions -->
                <div class="p-4 bg-warning-50 rounded-xl border border-warning-200">
                  <h4 class="font-bold text-warning-800 mb-3">⚠️ Conditions importantes</h4>
                  <ul class="text-sm text-warning-700 space-y-1">
                    <li>• La réservation doit être récupérée dans les 24h après expiration</li>
                    <li>• En cas d'absence, le produit sera remis en vente</li>
                    <li>• Apportez une pièce d'identité pour la récupération</li>
                    <li>• Pensez à vos sacs réutilisables ! 🌱</li>
                  </ul>
                </div>

                <div class="flex items-center gap-3">
                  <input
                    id="accept-conditions"
                    v-model="acceptConditions"
                    type="checkbox"
                    class="form-checkbox"
                  />
                  <label for="accept-conditions" class="text-sm text-neutral-700">
                    J'accepte les conditions de réservation et je m'engage à récupérer le produit aux horaires convenus
                  </label>
                </div>
              </div>
            </div>

            <!-- Boutons navigation -->
            <div class="flex justify-between">
              <button
                v-if="currentStep > 1"
                @click="previousStep"
                class="btn btn-outline"
              >
                <ArrowLeft class="w-4 h-4 mr-2" />
                Étape précédente
              </button>
              <div v-else></div>

              <button
                v-if="currentStep < 3"
                @click="nextStep"
                :disabled="!canProceedToNextStep"
                class="btn btn-primary"
              >
                Étape suivante
                <ArrowRight class="w-4 h-4 ml-2" />
              </button>

              <button
                v-else
                @click="confirmReservation"
                :disabled="!acceptConditions || loading"
                class="btn btn-primary"
              >
                <Loader2 v-if="loading" class="w-4 h-4 mr-2 animate-spin" />
                Confirmer la réservation
              </button>
            </div>
          </div>

          <!-- Sidebar informations -->
          <div class="space-y-6">
            <!-- Informations marchand -->
            <div class="card animate-fade-in-up" style="animation-delay: 0.2s;">
              <h3 class="text-lg font-bold text-neutral-900 mb-4">Marchand</h3>
              <div class="space-y-3">
                <div class="flex items-center gap-3">
                  <div class="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center">
                    <Store class="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p class="font-semibold text-neutral-900">{{ product.merchant.name }}</p>
                    <p class="text-sm text-neutral-600">{{ product.merchant.address }}</p>
                  </div>
                </div>
                <div class="flex items-center gap-2 text-sm text-neutral-600">
                  <MapPin class="w-4 h-4" />
                  <span>À {{ product.merchant.distance }}km de vous</span>
                </div>
              </div>
            </div>

            <!-- Aide -->
            <div class="card bg-gradient-to-br from-success-50 to-primary-50 border-success-200 animate-fade-in-up" style="animation-delay: 0.4s;">
              <div class="flex items-center gap-3 mb-4">
                <div class="w-8 h-8 bg-success-500 rounded-full flex items-center justify-center">
                  <HelpCircle class="w-4 h-4 text-white" />
                </div>
                <h3 class="text-lg font-bold text-success-800">Besoin d'aide ?</h3>
              </div>
              <p class="text-sm text-success-700 mb-4">
                Une question sur votre réservation ?
              </p>
              <div class="space-y-2 text-sm text-success-700">
                <div class="flex items-center gap-2">
                  <Phone class="w-4 h-4" />
                  <span>01 23 45 67 89</span>
                </div>
                <div class="flex items-center gap-2">
                  <Mail class="w-4 h-4" />
                  <span>support@antigaspi.com</span>
                </div>
              </div>
            </div>

            <!-- Impact environnemental -->
            <div class="card bg-gradient-to-br from-accent-50 to-secondary-50 border-accent-200 animate-fade-in-up" style="animation-delay: 0.6s;">
              <div class="text-center">
                <div class="text-4xl mb-3">🌱</div>
                <h3 class="text-lg font-bold text-accent-800 mb-2">Votre impact</h3>
                <p class="text-sm text-accent-700 mb-3">
                  En réservant ce produit, vous évitez le gaspillage et économisez environ :
                </p>
                <div class="space-y-2">
                  <div class="text-2xl font-bold text-accent-600">
                    {{ Math.round((product.original_price - product.discounted_price) * reservation.quantity * 100) / 100 }}€
                  </div>
                  <div class="text-sm text-accent-700">
                    ~{{ Math.round(reservation.quantity * 0.5 * 100) / 100 }}kg CO₂ évités
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import {
  ArrowLeft, ArrowRight, Package, Clock, Minus, Plus, MapPin, Calendar,
  Phone, Store, HelpCircle, Mail, Loader2
} from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const currentStep = ref(1)
const loading = ref(false)
const acceptConditions = ref(false)

const reservation = ref({
  quantity: 1,
  notes: '',
  pickup_date: '',
  pickup_time: '',
  contact_phone: authStore.user?.phone || '',
  pickup_instructions: ''
})

// Données de test du produit - en réalité, cela viendrait de l'API
const product = ref({
  id: 1,
  name: 'Pain artisanal du jour',
  description: 'Pain complet bio avec graines de tournesol et sésame',
  original_price: 4.50,
  discounted_price: 2.25,
  discount: 50,
  merchant: {
    name: 'Boulangerie Martin',
    address: '15 rue des Martyrs, 75009 Paris',
    distance: 0.3
  },
  expires_at: new Date(Date.now() + 3600000 * 6), // 6h
  available_quantity: 5,
  reserved_quantity: 2
})

// Computed properties
const canProceedToNextStep = computed(() => {
  switch (currentStep.value) {
    case 1:
      return reservation.value.quantity > 0 &&
             reservation.value.quantity <= (product.value.available_quantity - product.value.reserved_quantity)
    case 2:
      return reservation.value.pickup_date &&
             reservation.value.pickup_time &&
             reservation.value.contact_phone
    case 3:
      return acceptConditions.value
    default:
      return false
  }
})

// Fonctions
const formatPrice = (price: number) => {
  return `${price.toFixed(2)}€`
}

const formatTimeLeft = (expiresAt: Date) => {
  const now = new Date()
  const diff = expiresAt.getTime() - now.getTime()

  if (diff < 0) return 'Expiré'

  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

  if (hours > 0) {
    return `${hours}h${minutes > 0 ? ` ${minutes}m` : ''}`
  }
  return `${minutes}m`
}

const formatPickupDateTime = () => {
  if (!reservation.value.pickup_date || !reservation.value.pickup_time) return ''

  const date = new Date(reservation.value.pickup_date)
  const timeRange = reservation.value.pickup_time === '09:00' ? '09:00 - 10:00' :
                   reservation.value.pickup_time === '10:00' ? '10:00 - 11:00' :
                   reservation.value.pickup_time === '11:00' ? '11:00 - 12:00' :
                   reservation.value.pickup_time === '14:00' ? '14:00 - 15:00' :
                   reservation.value.pickup_time === '15:00' ? '15:00 - 16:00' :
                   reservation.value.pickup_time === '16:00' ? '16:00 - 17:00' :
                   reservation.value.pickup_time === '17:00' ? '17:00 - 18:00' :
                   reservation.value.pickup_time === '18:00' ? '18:00 - 19:00' : reservation.value.pickup_time

  return `${date.toLocaleDateString('fr-FR')} de ${timeRange}`
}

const getTodayDate = () => {
  return new Date().toISOString().split('T')[0]
}

const getMaxPickupDate = () => {
  const maxDate = new Date(product.value.expires_at)
  maxDate.setDate(maxDate.getDate() + 1) // Un jour après expiration
  return maxDate.toISOString().split('T')[0]
}

const increaseQuantity = () => {
  const maxQuantity = product.value.available_quantity - product.value.reserved_quantity
  if (reservation.value.quantity < maxQuantity) {
    reservation.value.quantity++
  }
}

const decreaseQuantity = () => {
  if (reservation.value.quantity > 1) {
    reservation.value.quantity--
  }
}

const validateQuantity = () => {
  const maxQuantity = product.value.available_quantity - product.value.reserved_quantity
  if (reservation.value.quantity < 1) {
    reservation.value.quantity = 1
  } else if (reservation.value.quantity > maxQuantity) {
    reservation.value.quantity = maxQuantity
  }
}

const nextStep = () => {
  if (canProceedToNextStep.value && currentStep.value < 3) {
    currentStep.value++
  }
}

const previousStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--
  }
}

const confirmReservation = async () => {
  if (!acceptConditions.value) return

  loading.value = true

  try {
    // Ici on appellerait l'API pour créer la réservation
    await new Promise(resolve => setTimeout(resolve, 2000)) // Simulation

    // Redirection vers la page de confirmation
    router.push({
      name: 'reservation-confirmed',
      params: {
        reservationId: 'temp-' + Date.now()
      }
    })
  } catch (error) {
    console.error('Erreur lors de la réservation:', error)
    alert('Erreur lors de la réservation. Veuillez réessayer.')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  // Vérifier l'authentification
  if (!authStore.isAuthenticated) {
    router.push('/login')
    return
  }

  // En réalité, charger les données du produit depuis l'API
  const productId = route.params.productId
  console.log('Loading product:', productId)
})
</script>