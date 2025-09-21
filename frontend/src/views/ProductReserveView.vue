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

        <!-- Loading State -->
        <div v-if="loadingProduct" class="flex justify-center items-center min-h-64">
          <div class="flex items-center gap-3">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <span class="text-neutral-600">Chargement du produit...</span>
          </div>
        </div>

        <!-- Error State -->
        <div v-else-if="productError" class="text-center py-16">
          <Package class="w-24 h-24 text-neutral-300 mx-auto mb-4" />
          <h3 class="text-xl font-bold text-neutral-700 mb-2">Produit introuvable</h3>
          <p class="text-neutral-500 mb-6">
            Le produit que vous souhaitez réserver n'existe pas ou n'est plus disponible.
          </p>
          <router-link to="/products" class="btn btn-primary">
            Retour au catalogue
          </router-link>
        </div>

        <!-- Main Content -->
        <div v-else>
        <!-- Étapes de réservation -->
        <div class="card mb-8 animate-fade-in-up">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-xl font-bold text-neutral-900">Étapes de réservation</h2>
            <div class="text-sm text-neutral-600">
              Étape {{ currentStep }} sur 4
            </div>
          </div>

          <!-- Indicateur de progression -->
          <div class="flex items-center gap-4 mb-8">
            <div
              v-for="step in 4"
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
          <div class="grid grid-cols-4 gap-4 text-center text-sm">
            <div :class="currentStep >= 1 ? 'text-primary-600 font-medium' : 'text-neutral-500'">
              Détails produit
            </div>
            <div :class="currentStep >= 2 ? 'text-primary-600 font-medium' : 'text-neutral-500'">
              Informations récupération
            </div>
            <div :class="currentStep >= 3 ? 'text-primary-600 font-medium' : 'text-neutral-500'">
              Paiement
            </div>
            <div :class="currentStep >= 4 ? 'text-primary-600 font-medium' : 'text-neutral-500'">
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
                <div class="w-32 h-32 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-2xl flex items-center justify-center flex-shrink-0 overflow-hidden">
                  <img
                    v-if="product.image_url"
                    :src="product.image_url"
                    :alt="product.name"
                    class="w-full h-full object-cover"
                  />
                  <Package v-else class="w-16 h-16 text-primary-400" />
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

            <!-- Étape 3: Paiement -->
            <div v-if="currentStep === 3" class="card animate-fade-in-up">
              <h3 class="text-xl font-bold text-neutral-900 mb-6">Choisissez votre moyen de paiement</h3>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <button
                  v-for="option in paymentOptions"
                  :key="option.value"
                  type="button"
                  class="p-4 border rounded-xl transition-all duration-300 text-left flex gap-3 items-start"
                  :class="[
                    paymentMethod === option.value
                      ? 'border-primary-500 bg-primary-50 shadow-sm'
                      : 'border-neutral-200 hover:border-primary-200 hover:bg-primary-50/40'
                  ]"
                  @click="paymentMethod = option.value"
                >
                  <div class="w-10 h-10 rounded-full flex items-center justify-center"
                       :class="paymentMethod === option.value ? 'bg-primary-500 text-white' : 'bg-neutral-100 text-neutral-600'">
                    <component :is="option.icon" class="w-5 h-5" />
                  </div>
                  <div class="flex-1">
                    <div class="flex items-center justify-between">
                      <p class="font-semibold text-neutral-900">{{ option.label }}</p>
                      <span
                        class="text-xs px-2 py-0.5 rounded-full"
                        :class="paymentMethod === option.value ? 'bg-primary-100 text-primary-700' : 'bg-neutral-100 text-neutral-600'"
                      >
                        {{ option.description }}
                      </span>
                    </div>
                    <p class="text-sm text-neutral-600 mt-1">{{ option.instructions }}</p>
                  </div>
                </button>
              </div>

              <div v-if="methodRequiresPhone" class="space-y-2">
                <label for="mobile-money-phone" class="form-label">Numéro Mobile Money</label>
                <input
                  id="mobile-money-phone"
                  v-model="mobileMoneyPhone"
                  type="tel"
                  placeholder="+228 90 00 00 00"
                  class="form-input"
                  :class="{
                    'border-error-400 focus:ring-error-100 focus:border-error-400': mobileMoneyPhone && !/^\+?[0-9]{8,15}$/.test(mobileMoneyPhone)
                  }"
                  required
                />
                <p class="text-xs text-neutral-500">
                  Utilisez un numéro enregistré sur le portefeuille sélectionné.
                </p>
              </div>

              <!-- Wallet payment PIN input -->
              <div v-if="paymentMethod === 'wallet'" class="space-y-2">
                <label for="wallet-pin" class="form-label">Code PIN du portefeuille</label>
                <input
                  id="wallet-pin"
                  v-model="walletPin"
                  type="password"
                  maxlength="6"
                  placeholder="••••••"
                  class="form-input text-center text-lg tracking-widest"
                  @input="(e) => e.target.value = e.target.value.replace(/\D/g, '')"
                  required
                />
                <div class="flex items-center justify-between text-xs text-neutral-500">
                  <span>Solde disponible: {{ walletStore.formattedBalance }}</span>
                  <span v-if="!canPayWithWallet" class="text-red-600">Solde insuffisant</span>
                </div>
              </div>

              <div class="mt-6 p-4 bg-primary-50 border border-primary-200 rounded-xl text-sm text-primary-700">
                <p class="font-semibold mb-1">Montant à payer</p>
                <p class="text-lg font-bold text-primary-800">{{ formatPrice(totalAmount) }}</p>
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
            </div>

            <!-- Étape 4: Confirmation -->
            <div v-if="currentStep === 4" class="card animate-fade-in-up">
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
                      {{ formatPrice(totalAmount) }}
                    </span>
                  </div>
                  <div class="text-sm text-primary-700 pt-2 border-t border-primary-200">
                    Économie: {{ formatPrice(savingsAmount) }}
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

                <!-- Récapitulatif paiement -->
                <div class="p-4 bg-neutral-50 rounded-xl border border-neutral-200">
                  <h4 class="font-bold text-neutral-800 mb-3">Paiement</h4>
                  <div class="flex items-center justify-between mb-2">
                    <span class="text-neutral-600">Méthode sélectionnée</span>
                    <span class="font-semibold text-neutral-900">{{ selectedPaymentOption?.label }}</span>
                  </div>
                  <div class="flex items-center justify-between mb-2">
                    <span class="text-neutral-600">Montant</span>
                    <span class="font-semibold text-neutral-900">{{ formatPrice(totalAmount) }}</span>
                  </div>
                  <div v-if="methodRequiresPhone" class="text-sm text-neutral-600">
                    Téléphone Mobile Money : <span class="font-medium">{{ mobileMoneyPhone }}</span>
                  </div>
                  <div v-if="paymentMethod === 'wallet'" class="text-sm text-neutral-600">
                    Solde disponible : <span class="font-medium text-green-600">{{ walletStore.formattedBalance }}</span>
                  </div>
                  <p class="text-xs text-neutral-500 mt-3">
                    {{ selectedPaymentOption?.instructions }}
                  </p>
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
                v-if="currentStep < 4"
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
                    {{ Math.round((product.original_price - product.discounted_price) * reservation.quantity).toLocaleString('fr-FR') }} F CFA
                  </div>
                  <div class="text-sm text-accent-700">
                    ~{{ Math.round(reservation.quantity * 0.5 * 100) / 100 }}kg CO₂ évités
                  </div>
                </div>
              </div>
            </div>
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
  Phone, Store, HelpCircle, Mail, Loader2, CreditCard, Smartphone, Wallet
} from 'lucide-vue-next'

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
const showWalletPayment = ref(false)
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
  } catch (error) {
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