<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
    <!-- Page Header -->
    <div class="bg-white/60 backdrop-blur-md glass-border border-b backdrop-blur-lg sticky top-20 z-40">
      <div class="container py-6">
        <div class="flex items-center gap-3 animate-fade-in-up">
          <Button
            variant="ghost"
            size="sm"
            class="p-2"
            @click="$router.go(-1)"
          >
            <ArrowLeft class="h-6 w-6" />
          </Button>
          <div>
            <h1 class="text-xl lg:text-3xl font-semibold text-gray-900 mt-2">
              Réserver un produit 🛒
            </h1>
            <p class="text-lg text-gray-700">
              Finalisez votre réservation en quelques étapes
            </p>
          </div>
        </div>
      </div>
    </div>

    <div class="container py-6 sm:py-8">
      <div class="max-w-full sm:max-w-4xl mx-auto">
        <!-- Loading State -->
        <div v-if="loadingProduct" class="flex justify-center items-center min-h-9xl">
          <div class="flex items-center gap-3">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            <span class="text-gray-700">Chargement du produit...</span>
          </div>
        </div>

        <!-- Error State -->
        <Card v-else-if="productError" class="text-left sm:text-center py-16 sm:py-16 lg:py-16">
          <Package class="w-6xl h-6xl text-gray-500 mx-auto mt-3" />
          <h3 class="text-xl font-semibold text-gray-800 mt-2">Produit introuvable</h3>
          <p class="text-gray-500 mt-4">
            Le produit que vous souhaitez réserver n'existe pas ou n'est plus disponible.
          </p>
          <Button variant="primary" @click="$router.push('/products')">
            Retour au catalogue
          </Button>
        </Card>

        <!-- Main Content -->
        <div v-else>
          <!-- Étapes de réservation -->
          <Card class="mt-4 sm:mb-3xl animate-fade-in-up">
            <div class="flex items-center justify-start sm:justify-between mt-4">
              <h2 class="text-xl font-semibold text-gray-900">Étapes de réservation</h2>
              <div class="text-sm text-gray-700">
                Étape {{ currentStep }} sur 4
              </div>
            </div>

            <!-- Indicateur de progression -->
            <div class="flex items-center gap-3 mt-4 sm:mb-3xl">
              <div
                v-for="step in 4"
                :key="step"
                class="flex-1 relative"
              >
                <div
                  :class="[
                    'w-full h-4 rounded-full transition-all duration-300',
                    step <= currentStep ? 'bg-blue-500' : 'bg-gray-200'
                  ]"
                />
                <div
                  :class="[
                    'relative sm:absolute -top-6 left-0 h-6 w-6 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300',
                    step <= currentStep ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
                  ]"
                >
                  {{ step }}
                </div>
              </div>
            </div>

            <!-- Libellés des étapes -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-left sm:text-center text-sm">
              <div :class="currentStep >= 1 ? 'text-blue-600 font-medium' : 'text-gray-500'">
                Détails produit
              </div>
              <div :class="currentStep >= 2 ? 'text-blue-600 font-medium' : 'text-gray-500'">
                Informations récupération
              </div>
              <div :class="currentStep >= 3 ? 'text-blue-600 font-medium' : 'text-gray-500'">
                Paiement
              </div>
              <div :class="currentStep >= 4 ? 'text-blue-600 font-medium' : 'text-gray-500'">
                Confirmation
              </div>
            </div>
          </Card>

          <div class="grid lg:grid-cols-3 gap-4 sm:gap-8">
            <!-- Formulaire principal -->
            <div class="lg:col-span-2 space-y-6">
              <!-- Étape 1: Détails du produit -->
              <Card v-if="currentStep === 1" class="animate-fade-in-up">
                <template #header>
                  <h3 class="text-xl font-semibold text-gray-900">Détails du produit</h3>
                </template>

                <div class="flex gap-3 sm:gap-4 mt-4">
                  <div class="w-7xl h-7xl bg-gradient-to-br from-blue-100 to-blue-500/10 rounded flex items-center justify-center flex-shrink-0 overflow-hidden sm:block">
                    <img
                      v-if="product.image_url"
                      :src="product.image_url"
                      :alt="product.name"
                      class="w-full h-full object-cover"
                    >
                    <Package v-else class="w-12 h-10 text-blue-400" />
                  </div>
                  <div class="flex-1">
                    <h4 class="text-xl font-semibold text-gray-900 mt-2">{{ product.name }}</h4>
                    <p class="text-gray-700 mt-3">{{ product.description }}</p>
                    <div class="flex items-center gap-3 mt-3">
                      <div class="flex items-center gap-2">
                        <span class="text-xl font-semibold text-blue-600">
                          {{ formatPrice(product.discounted_price) }}
                        </span>
                        <span class="text-lg text-gray-400 line-through">
                          {{ formatPrice(product.original_price) }}
                        </span>
                      </div>
                      <Badge variant="success">-{{ product.discount }}%</Badge>
                    </div>
                    <div class="flex items-center gap-3 text-sm text-gray-700">
                      <div class="flex items-center gap-2">
                        <Clock class="h-4 w-4" />
                        <span>{{ formatTimeLeft(product.expires_at) }}</span>
                      </div>
                      <div class="flex items-center gap-2">
                        <Package class="h-4 w-4" />
                        <span>{{ product.available_quantity - product.reserved_quantity }} disponibles</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Quantité -->
                <div class="space-y-4">
                  <div>
                    <Label>Quantité souhaitée</Label>
                    <div class="flex items-center gap-3">
                      <Button
                        :disabled="reservation.quantity <= 1"
                        variant="outline"
                        size="sm"
                        class="p-3"
                        @click="decreaseQuantity"
                      >
                        <Minus class="h-4 w-4" />
                      </Button>
                      <Input
                        v-model.number="reservation.quantity"
                        type="number"
                        :min="1"
                        :max="product.available_quantity - product.reserved_quantity"
                        class="w-20 text-left sm:text-center"
                        @input="validateQuantity"
                      />
                      <Button
                        :disabled="reservation.quantity >= (product.available_quantity - product.reserved_quantity)"
                        variant="outline"
                        size="sm"
                        class="p-3"
                        @click="increaseQuantity"
                      >
                        <Plus class="h-4 w-4" />
                      </Button>
                    </div>
                    <p class="text-sm text-gray-500 mt-1">
                      Maximum {{ product.available_quantity - product.reserved_quantity }} disponible{{ (product.available_quantity - product.reserved_quantity) > 1 ? 's' : '' }}
                    </p>
                  </div>

                  <!-- Notes spéciales -->
                  <div>
                    <Label for="notes">Notes spéciales (optionnel)</Label>
                    <textarea
                      id="notes"
                      v-model="reservation.notes"
                      placeholder="Allergies, préférences particulières..."
                      class="w-full px-3 py-3 text-gray-900 bg-white border border-gray-200 rounded shadow-sm placeholder:text-gray-400 transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows="3"
                    />
                  </div>
                </div>
              </Card>

              <!-- Étape 2: Informations récupération -->
              <Card v-if="currentStep === 2" class="animate-fade-in-up">
                <template #header>
                  <h3 class="text-xl font-semibold text-gray-900">Informations de récupération</h3>
                </template>

                <div class="space-y-6">
                  <!-- Horaires de récupération -->
                  <div>
                    <Label>Quand souhaitez-vous récupérer ?</Label>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <Label for="pickup-date">
                          Date de récupération
                        </Label>
                        <Input
                          id="pickup-date"
                          v-model="reservation.pickup_date"
                          type="date"
                          :min="getTodayDate()"
                          :max="getMaxPickupDate()"
                          required
                        />
                      </div>
                      <div>
                        <Label for="pickup-time">
                          Heure de récupération
                        </Label>
                        <select
                          id="pickup-time"
                          v-model="reservation.pickup_time"
                          class="w-full px-3 py-3 text-gray-900 bg-white border border-gray-200 rounded shadow-sm transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                    <Label for="contact-phone">Téléphone de contact</Label>
                    <Input
                      id="contact-phone"
                      v-model="reservation.contact_phone"
                      type="tel"
                      placeholder="+33 1 23 45 67 89"
                      required
                    />
                    <p class="text-sm text-gray-500 mt-1">
                      Pour vous contacter en cas de problème
                    </p>
                  </div>

                  <!-- Instructions spéciales -->
                  <div>
                    <Label for="pickup-instructions">Instructions particulières (optionnel)</Label>
                    <textarea
                      id="pickup-instructions"
                      v-model="reservation.pickup_instructions"
                      placeholder="Comment vous trouver, indications spéciales..."
                      class="w-full px-3 py-3 text-gray-900 bg-white border border-gray-200 rounded shadow-sm placeholder:text-gray-400 transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows="3"
                    />
                  </div>
                </div>
              </Card>

              <!-- Étape 3: Paiement -->
              <Card v-if="currentStep === 3" class="animate-fade-in-up">
                <template #header>
                  <h3 class="text-xl font-semibold text-gray-900">Choisissez votre moyen de paiement</h3>
                </template>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                  <Button
                    v-for="option in paymentOptions"
                    :key="option.value"
                    type="button"
                    variant="outline"
                    class="p-4 text-left flex gap-3 items-stretch sm:items-start h-auto justify-start"
                    :class="[
                      paymentMethod === option.value
                        ? 'border-blue-500 bg-blue-50 shadow-sm'
                        : 'border-gray-200 hover:border-blue-200 hover:bg-blue-50/40'
                    ]"
                    @click="paymentMethod = option.value"
                  >
                    <div
                      class="h-6 w-6 rounded-full flex items-center justify-center"
                      :class="paymentMethod === option.value ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'"
                    >
                      <component :is="option.icon" class="h-4 w-4" />
                    </div>
                    <div class="flex-1">
                      <div class="flex items-center justify-start sm:justify-between">
                        <p class="font-semibold text-gray-900">{{ option.label }}</p>
                        <Badge
                          :variant="paymentMethod === option.value ? 'primary' : 'secondary'"
                          size="sm"
                          class="text-xs"
                        >
                          {{ option.description }}
                        </Badge>
                      </div>
                      <p class="text-sm text-gray-700 mt-1">{{ option.instructions }}</p>
                    </div>
                  </Button>
                </div>

                <div v-if="methodRequiresPhone" class="space-y-4">
                  <Label for="mobile-money-phone">Numéro Mobile Money</Label>
                  <Input
                    id="mobile-money-phone"
                    v-model="mobileMoneyPhone"
                    type="tel"
                    placeholder="+228 90 00 00 00"
                    :error="mobileMoneyPhone && !/^\+?[0-9]{8,15}$/.test(mobileMoneyPhone) ? 'Format invalide' : undefined"
                    required
                  />
                  <p class="text-xs text-gray-500">
                    Utilisez un numéro enregistré sur le portefeuille sélectionné.
                  </p>
                </div>

                <!-- Wallet payment PIN input -->
                <div v-if="paymentMethod === 'wallet'" class="space-y-4">
                  <Label for="wallet-pin">Code PIN du portefeuille</Label>
                  <Input
                    id="wallet-pin"
                    v-model="walletPin"
                    type="password"
                    maxlength="6"
                    placeholder="••••••"
                    class="text-left sm:text-center text-lg tracking-widest"
                    required
                    @input="(e) => e.target.value = e.target.value.replace(/\D/g, '')"
                  />
                  <div class="flex items-center justify-start sm:justify-between text-xs text-gray-500">
                    <span>Solde disponible: {{ walletStore.formattedBalance }}</span>
                    <span v-if="!canPayWithWallet" class="text-red-600">Solde insuffisant</span>
                  </div>
                </div>

                <div class="mt-6 p-4 bg-blue-50 border border-blue-200 rounded text-sm text-blue-900">
                  <p class="font-semibold mb-1">Montant à payer</p>
                  <p class="text-lg font-semibold text-blue-800">{{ formatPrice(totalAmount) }}</p>
                  <p v-if="methodRequiresPhone" class="mt-2 text-xs">
                    Un SMS de confirmation vous sera envoyé dès validation par l'opérateur.
                  </p>
                  <p v-else-if="paymentMethod === 'paystack'" class="mt-2 text-xs">
                    Vous serez redirigé vers la page Paystack après la création de la réservation.
                  </p>
                  <p v-else-if="paymentMethod === 'on_site'" class="mt-2 text-xs">
                    Réglez ce montant directement auprès du commerçant lors du retrait.
                  </p>
                  <p v-else-if="paymentMethod === 'wallet'" class="mt-2 text-xs">
                    Le montant sera débité instantanément de votre portefeuille après saisie du PIN.
                  </p>
                </div>
              </Card>

              <!-- Étape 4: Confirmation -->
              <Card v-if="currentStep === 4" class="animate-fade-in-up">
                <template #header>
                  <h3 class="text-xl font-semibold text-gray-900">Confirmation de réservation</h3>
                </template>

                <div class="space-y-6">
                  <!-- Récapitulatif produit -->
                  <div class="p-4 bg-blue-50 rounded border border-blue-200">
                    <h4 class="font-semibold text-blue-800 mb-4">Produit réservé</h4>
                    <div class="flex justify-start sm:justify-between items-center mt-2">
                      <span>{{ product.name }}</span>
                      <span class="font-semibold">{{ formatPrice(product.discounted_price) }}</span>
                    </div>
                    <div class="flex justify-start sm:justify-between items-center mt-2">
                      <span>Quantité: {{ reservation.quantity }}</span>
                      <span class="font-semibold text-blue-600">
                        {{ formatPrice(totalAmount) }}
                      </span>
                    </div>
                    <div class="text-sm text-blue-900 padding-t-sm border-t border-blue-200">
                      Économie: {{ formatPrice(savingsAmount) }}
                    </div>
                  </div>

                  <!-- Récapitulatif récupération -->
                  <div class="p-4 bg-blue-500/5 rounded border border-blue-500/30">
                    <h4 class="font-semibold text-blue-500/95 mb-4">Récupération</h4>
                    <div class="space-y-4 text-sm">
                      <div class="flex items-center gap-2">
                        <MapPin class="h-4 w-4 text-blue-500" />
                        <span>{{ product.merchant.name }}</span>
                      </div>
                      <div class="flex items-center gap-2">
                        <Calendar class="h-4 w-4 text-blue-500" />
                        <span>{{ formatPickupDateTime() }}</span>
                      </div>
                      <div class="flex items-center gap-2">
                        <Phone class="h-4 w-4 text-blue-500" />
                        <span>{{ reservation.contact_phone }}</span>
                      </div>
                    </div>
                  </div>

                  <!-- Récapitulatif paiement -->
                  <div class="p-4 bg-gray-50 rounded border border-gray-200">
                    <h4 class="font-semibold text-gray-800 mb-4">Paiement</h4>
                    <div class="flex items-center justify-start sm:justify-between mt-2">
                      <span class="text-gray-700">Méthode sélectionnée</span>
                      <span class="font-semibold text-gray-900">{{ selectedPaymentOption?.label }}</span>
                    </div>
                    <div class="flex items-center justify-start sm:justify-between mt-2">
                      <span class="text-gray-700">Montant</span>
                      <span class="font-semibold text-gray-900">{{ formatPrice(totalAmount) }}</span>
                    </div>
                    <div v-if="methodRequiresPhone" class="text-sm text-gray-700">
                      Téléphone Mobile Money : <span class="font-medium">{{ mobileMoneyPhone }}</span>
                    </div>
                    <div v-if="paymentMethod === 'wallet'" class="text-sm text-gray-700">
                      Solde disponible : <span class="font-medium text-green-600">{{ walletStore.formattedBalance }}</span>
                    </div>
                    <p class="text-xs text-gray-500 mt-3">
                      {{ selectedPaymentOption?.instructions }}
                    </p>
                  </div>

                  <!-- Conditions -->
                  <div class="p-4 bg-orange-500/10 rounded border border-orange-500/30">
                    <h4 class="font-semibold text-orange-500/95 mb-4">⚠️ Conditions importantes</h4>
                    <ul class="text-sm text-orange-500/90 space-y-4">
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
                      class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2"
                    >
                    <label for="accept-conditions" class="text-sm text-gray-800">
                      J'accepte les conditions de réservation et je m'engage à récupérer le produit aux horaires convenus
                    </label>
                  </div>
                </div>
              </Card>

              <!-- Boutons navigation -->
              <div class="flex justify-start sm:justify-between">
                <Button
                  v-if="currentStep > 1"
                  variant="outline"
                  @click="previousStep"
                >
                  <ArrowLeft class="h-4 w-4 mr-2" />
                  Étape précédente
                </Button>
                <div v-else />

                <Button
                  v-if="currentStep < 4"
                  :disabled="!canProceedToNextStep"
                  variant="primary"
                  @click="nextStep"
                >
                  Étape suivante
                  <ArrowRight class="h-4 w-4 ml-2" />
                </Button>

                <Button
                  v-else
                  :disabled="!acceptConditions || loading"
                  variant="primary"
                  :loading="loading"
                  @click="confirmReservation"
                >
                  Confirmer la réservation
                </Button>
              </div>
            </div>

            <!-- Sidebar informations -->
            <div class="space-y-6">
              <!-- Informations marchand -->
              <Card class="animate-fade-in-up" style="animation-delay: 0.2s;">
                <template #header>
                  <h3 class="text-lg font-semibold text-gray-900">Marchand</h3>
                </template>
                <div class="space-y-2">
                  <div class="flex items-center gap-3">
                    <div class="w-12 h-10 bg-gradient-to-r from-blue-600 to-blue-700 rounded flex items-center justify-center">
                      <Store class="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p class="font-semibold text-gray-900">{{ product.merchant.name }}</p>
                      <p class="text-sm text-gray-700">{{ product.merchant.address }}</p>
                    </div>
                  </div>
                  <div class="flex items-center gap-2 text-sm text-gray-700">
                    <MapPin class="h-4 w-4" />
                    <span>À {{ product.merchant.distance }}km de vous</span>
                  </div>
                </div>
              </Card>

              <!-- Aide -->
              <Card variant="gradient" class="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 animate-fade-in-up" style="animation-delay: 0.4s;">
                <div class="flex items-center gap-3 mt-3">
                  <div class="h-6 w-6 bg-blue-500 rounded-full flex items-center justify-center">
                    <HelpCircle class="h-4 w-4 text-white" />
                  </div>
                  <h3 class="text-lg font-semibold text-blue-800">Besoin d'aide ?</h3>
                </div>
                <p class="text-sm text-blue-900 mt-3">
                  Une question sur votre réservation ?
                </p>
                <div class="space-y-4 text-sm text-blue-900">
                  <div class="flex items-center gap-2">
                    <Phone class="h-4 w-4" />
                    <span>01 23 45 67 89</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <Mail class="h-4 w-4" />
                    <span>support@antigaspi.com</span>
                  </div>
                </div>
              </Card>

              <!-- Impact environnemental -->
              <Card variant="gradient" class="bg-gradient-to-br from-orange-500/10 to-blue-500/5 border-orange-500/30 animate-fade-in-up" style="animation-delay: 0.6s;">
                <div class="text-left sm:text-center">
                  <div class="text-3xl mb-4">🌱</div>
                  <h3 class="text-lg font-semibold text-orange-500/95 mt-2">Votre impact</h3>
                  <p class="text-sm text-orange-500/90 mb-4">
                    En réservant ce produit, vous évitez le gaspillage et économisez environ :
                  </p>
                  <div class="space-y-4">
                    <div class="text-xl font-semibold text-orange-500">
                      {{ Math.round((product.original_price - product.discounted_price) * reservation.quantity).toLocaleString('fr-FR') }} F CFA
                    </div>
                    <div class="text-sm text-orange-500/90">
                      ~{{ Math.round(reservation.quantity * 0.5 * 100) / 100 }}kg CO₂ évités
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div><!-- End Main Content -->
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, type Component } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useReservationsStore } from '@/stores/reservations'
import { usePaymentsStore, isFinalStatus } from '@/stores/payments'
import { useWalletStore } from '@/stores/wallet'
import { apiService } from '@/services/api'
import { notify } from '@/composables/useNotifications'
import type { PaymentMethod } from '@/types'
import {
  ArrowLeft, ArrowRight, Package, Clock, Minus, Plus, MapPin, Calendar,
  Phone, Store, HelpCircle, Mail, CreditCard, Smartphone, Wallet
} from 'lucide-vue-next'

// Import 2025 Design System components
import Card from '@/components/ui/2025/Card.vue'
import Button from '@/components/ui/2025/Button.vue'
import Badge from '@/components/ui/2025/Badge.vue'
import Input from '@/components/ui/2025/Input.vue'
import Label from '@/components/ui/2025/Label.vue'

interface ReserveProduct {
  id: number
  name: string
  description: string
  original_price: number
  discounted_price: number
  discount: number
  merchant: {
    name: string
    address: string
    distance?: number
    phone?: string
  }
  expires_at: Date
  available_quantity: number
  reserved_quantity: number
  image_url?: string | null
}

type PaymentOption = {
  value: PaymentMethod
  label: string
  description: string
  requiresPhone: boolean
  icon: Component
  instructions: string
}

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const reservationsStore = useReservationsStore()
const paymentsStore = usePaymentsStore()
const walletStore = useWalletStore()

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

const paymentMethod = ref<PaymentMethod>('on_site')
const mobileMoneyPhone = ref(authStore.user?.phone || '')

const product = ref<ReserveProduct | null>(null)
const loadingProduct = ref(true)
const productError = ref(false)

const paymentOptions = computed<PaymentOption[]>(() => {
  const options: PaymentOption[] = [
    {
      value: 'flooz',
      label: 'Flooz (Moov Togo)',
      description: 'PayGate - Mobile Money',
      requiresPhone: true,
      icon: Smartphone,
      instructions: 'Assurez-vous que votre numéro Flooz est actif et dispose des fonds nécessaires.'
    },
    {
      value: 'tmoney',
      label: 'Mixx by Yas (Tmoney)',
      description: 'PayGate - Mobile Money',
      requiresPhone: true,
      icon: Smartphone,
      instructions: 'Le numéro Mixx by Yas doit être au format international (+228...).'
    },
    {
      value: 'paystack',
      label: 'Paystack',
      description: 'Cartes bancaires & Mobile Money',
      requiresPhone: false,
      icon: CreditCard,
      instructions: 'Vous serez redirigé vers Paystack pour finaliser le paiement de façon sécurisée.'
    },
    {
      value: 'on_site',
      label: 'Paiement sur place',
      description: 'Régler lors du retrait',
      requiresPhone: false,
      icon: Wallet,
      instructions: 'Préparez le montant exact et réglez directement auprès du commerçant.'
    }
  ]

  // Add wallet option if user has wallet and sufficient balance
  if (walletStore.hasWallet && walletStore.isActive && walletStore.hasPin) {
    options.unshift({
      value: 'wallet',
      label: 'Portefeuille électronique',
      description: `Solde: ${walletStore.formattedBalance}`,
      requiresPhone: false,
      icon: Wallet,
      instructions: 'Paiement instantané depuis votre portefeuille. Saisissez votre code PIN pour confirmer.'
    })
  }

  return options
})

const selectedPaymentOption = computed(() => paymentOptions.value.find(option => option.value === paymentMethod.value))
const methodRequiresPhone = computed(() => selectedPaymentOption.value?.requiresPhone ?? false)

// Wallet-specific refs
const walletPin = ref('')

// Check if wallet can pay for the current amount
const canPayWithWallet = computed(() => {
  if (!walletStore.hasWallet || !walletStore.isActive || !walletStore.hasPin) return false
  return walletStore.canPay(totalAmount.value)
})

const availableQuantity = computed(() => {
  if (!product.value) return 0
  return product.value.available_quantity - product.value.reserved_quantity
})

const totalAmount = computed(() => {
  if (!product.value) return 0
  return product.value.discounted_price * reservation.value.quantity
})

const savingsAmount = computed(() => {
  if (!product.value) return 0
  return (product.value.original_price - product.value.discounted_price) * reservation.value.quantity
})

const canProceedToNextStep = computed(() => {
  switch (currentStep.value) {
    case 1:
      return reservation.value.quantity > 0 && reservation.value.quantity <= availableQuantity.value
    case 2:
      return Boolean(reservation.value.pickup_date && reservation.value.pickup_time && reservation.value.contact_phone)
    case 3:
      if (!paymentMethod.value) {
        return false
      }
      if (methodRequiresPhone.value) {
        return Boolean(mobileMoneyPhone.value && /^\+?[0-9]{8,15}$/.test(mobileMoneyPhone.value))
      }
      if (paymentMethod.value === 'wallet') {
        return Boolean(walletPin.value && walletPin.value.length >= 4 && canPayWithWallet.value)
      }
      return true
    case 4:
      return acceptConditions.value
    default:
      return false
  }
})

const formatPrice = (price: number) => {
  return `${Math.round(price).toLocaleString('fr-FR')} F CFA`
}

const formatTimeLeft = (expiresAt: Date) => {
  const now = new Date()
  const diff = expiresAt.getTime() - now.getTime()

  if (diff <= 0) return 'Expiré'

  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

  if (hours > 0) {
    return `${hours}h${minutes > 0 ? ` ${minutes}m` : ''}`
  }

  return `${minutes}m`
}

const formatPickupDateTime = () => {
  if (!reservation.value.pickup_date || !reservation.value.pickup_time) return 'À définir'
  const date = new Date(`${reservation.value.pickup_date}T${reservation.value.pickup_time}`)
  return date.toLocaleString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getTodayDate = () => {
  return new Date().toISOString().split('T')[0]
}

const getMaxPickupDate = () => {
  if (!product.value) return getTodayDate()
  const maxDate = new Date(product.value.expires_at)
  maxDate.setDate(maxDate.getDate() + 1)
  return maxDate.toISOString().split('T')[0]
}

const increaseQuantity = () => {
  if (!product.value) return
  const maxQuantity = availableQuantity.value
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
  if (!product.value) return
  const maxQuantity = availableQuantity.value
  if (reservation.value.quantity < 1) {
    reservation.value.quantity = 1
  } else if (reservation.value.quantity > maxQuantity) {
    reservation.value.quantity = maxQuantity
  }
}

const nextStep = () => {
  if (canProceedToNextStep.value && currentStep.value < 4) {
    currentStep.value++
  }
}

const previousStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--
  }
}

const confirmReservation = async () => {
  if (!product.value || !acceptConditions.value) return

  loading.value = true
  const isWalletPayment = paymentMethod.value === 'wallet'

  try {
    const response = await reservationsStore.createReservation({
      productId: product.value.id,
      quantity: reservation.value.quantity,
      paymentMethod: paymentMethod.value,
      customerPhone: methodRequiresPhone.value ? mobileMoneyPhone.value : reservation.value.contact_phone || undefined,
      customerEmail: authStore.user?.email,
      notes: reservation.value.pickup_instructions || reservation.value.notes || undefined,
      pickupDate: reservation.value.pickup_date || undefined,
      pickupTime: reservation.value.pickup_time || undefined,
      walletPin: isWalletPayment ? walletPin.value : undefined
    })

    if (response.success) {
      if (response.payment) {
        paymentsStore.recordPayment(response.payment)
        if (!isFinalStatus(response.payment.status)) {
          paymentsStore.startPolling(response.payment.id)
          notify.info('Paiement en attente de confirmation.', 'Vous recevrez une notification dès validation du prestataire.')
        } else if (response.payment.status === 'success' || response.payment.status === 'on_site') {
          notify.success('Paiement confirmé !', 'Votre réservation est validée.')
        }
      } else {
        notify.success('Réservation enregistrée.', 'Vous pouvez suivre son statut dans vos réservations.')
      }

      router.push({ name: 'reservations' })
    } else {
      notify.error(response.error || 'Impossible de créer la réservation pour le moment.')
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inattendue lors de la réservation.'
    notify.error(message)
  } finally {
    loading.value = false
    if (isWalletPayment) {
      walletPin.value = ''
    }
  }
}

const fetchProduct = async () => {
  try {
    loadingProduct.value = true
    productError.value = false

    const productId = Number(route.params.id)
    if (Number.isNaN(productId)) {
      productError.value = true
      return
    }

    const response = await apiService.getProduct(productId)
    const apiProduct = response.data

    product.value = {
      id: apiProduct.id,
      name: apiProduct.name,
      description: apiProduct.description,
      original_price: Number(apiProduct.original_price),
      discounted_price: Number(apiProduct.discounted_price),
      discount: apiProduct.discount_percentage,
      merchant: {
        name: apiProduct.merchant?.business_name || apiProduct.merchant?.name || 'Commerçant',
        address: apiProduct.merchant?.address || apiProduct.merchant?.city || 'Adresse non renseignée',
        distance: apiProduct.merchant?.distance,
        phone: apiProduct.merchant?.phone
      },
      expires_at: new Date(apiProduct.expiration_date),
      available_quantity: apiProduct.quantity_available,
      reserved_quantity: (apiProduct as any).reserved_quantity ?? 0,
      image_url: apiProduct.image_url
    }
  } catch {
    productError.value = true
  } finally {
    loadingProduct.value = false
  }
}

onMounted(async () => {
  if (!authStore.isAuthenticated) {
    router.push('/login')
    return
  }

  if (!authStore.isConsumer) {
    notify.error('Seuls les consommateurs peuvent réserver des produits.')
    router.push('/')
    return
  }

  paymentsStore.clearPayment()
  await fetchProduct()

  // Load wallet information for authenticated users
  if (authStore.isAuthenticated) {
    await walletStore.fetchWallet()
  }
})
</script>
