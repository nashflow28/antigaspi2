<template>
  <div class="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-primary-50 p-6 dark:from-neutral-950 dark:via-neutral-950 dark:to-neutral-900">
    <div class="max-w-4xl mx-auto">
      <!-- Header -->
      <div class="mb-8 text-center">
        <h1 class="mb-2 text-3xl font-bold text-neutral-900 dark:text-neutral-50">Mon Profil</h1>
        <p class="text-neutral-600 dark:text-neutral-300">Gérez vos informations personnelles et préférences</p>
      </div>

      <!-- Profile Card -->
      <div class="mb-8 overflow-hidden rounded-2xl bg-white/95 shadow-xl dark:bg-neutral-900/90">
        <!-- Profile Header -->
        <div class="bg-gradient-to-r from-primary-600 to-primary-700 px-8 py-6 text-white dark:from-primary-700 dark:to-primary-900">
          <div class="flex items-center space-x-6">
            <div class="flex h-20 w-20 items-center justify-center rounded-full bg-white/20">
              <UserIcon class="h-10 w-10 text-white" />
            </div>
            <div>
              <h2 class="text-2xl font-bold">
                {{ user?.first_name }} {{ user?.last_name }}
              </h2>
              <p class="text-primary-100/90">{{ user?.email }}</p>
              <div class="mt-2 flex items-center space-x-2">
                <span class="rounded-full bg-white/20 px-3 py-1 text-sm">
                  {{ roleLabel }}
                </span>
                <span class="text-sm text-primary-100">
                  Membre depuis {{ formatDate(user?.created_at) }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Profile Content -->
        <div class="p-8">
          <!-- Tabs -->
          <div class="mb-8 border-b border-neutral-200 dark:border-neutral-800">
            <nav class="-mb-px flex space-x-8" role="tablist" aria-label="Sections profil">
              <button
                v-for="tab in tabs"
                :key="tab.id"
                type="button"
                @click="activeTab = tab.id"
                role="tab"
                :id="`profile-tab-${tab.id}`"
                :aria-controls="`profile-panel-${tab.id}`"
                :aria-selected="activeTab === tab.id"
                :class="[
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600 dark:text-primary-300'
                    : 'border-transparent text-neutral-500 hover:border-neutral-300 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200',
                  'flex items-center space-x-2 whitespace-nowrap border-b-2 px-1 py-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-neutral-900'
                ]"
              >
                <component :is="tab.icon" class="h-5 w-5" aria-hidden="true" />
                <span>{{ tab.name }}</span>
              </button>
            </nav>
          </div>

          <!-- Tab Content -->
          <div class="tab-content">
            <!-- Personal Information Tab -->
            <div
              v-if="activeTab === 'personal'"
              :aria-labelledby="'profile-tab-personal'"
              :id="'profile-panel-personal'"
              class="space-y-8"
              role="tabpanel"
            >
              <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label class="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-200">Prénom</label>
                  <input
                    v-model="profileForm.first_name"
                    type="text"
                    class="w-full rounded-xl border border-neutral-300 bg-white/80 px-4 py-3 text-neutral-900 shadow-inner transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-neutral-700 dark:bg-neutral-900/80 dark:text-neutral-50 dark:focus-visible:ring-offset-neutral-950"
                    placeholder="Votre prénom"
                  />
                </div>
                <div>
                  <label class="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-200">Nom</label>
                  <input
                    v-model="profileForm.last_name"
                    type="text"
                    class="w-full rounded-xl border border-neutral-300 bg-white/80 px-4 py-3 text-neutral-900 shadow-inner transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-neutral-700 dark:bg-neutral-900/80 dark:text-neutral-50 dark:focus-visible:ring-offset-neutral-950"
                    placeholder="Votre nom"
                  />
                </div>
                <div>
                  <label class="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-200">Email</label>
                  <input
                    v-model="profileForm.email"
                    type="email"
                    class="w-full rounded-xl border border-neutral-300 bg-white/80 px-4 py-3 text-neutral-900 shadow-inner transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-neutral-700 dark:bg-neutral-900/80 dark:text-neutral-50 dark:focus-visible:ring-offset-neutral-950"
                    placeholder="votre@email.com"
                  />
                </div>
                <div>
                  <label class="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-200">Téléphone</label>
                  <input
                    v-model="profileForm.phone"
                    type="tel"
                    class="w-full rounded-xl border border-neutral-300 bg-white/80 px-4 py-3 text-neutral-900 shadow-inner transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-neutral-700 dark:bg-neutral-900/80 dark:text-neutral-50 dark:focus-visible:ring-offset-neutral-950"
                    placeholder="+33 6 12 34 56 78"
                  />
                </div>
                <div class="md:col-span-2">
                  <label class="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-200">Ville</label>
                  <input
                    v-model="profileForm.city"
                    type="text"
                    class="w-full rounded-xl border border-neutral-300 bg-white/80 px-4 py-3 text-neutral-900 shadow-inner transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-neutral-700 dark:bg-neutral-900/80 dark:text-neutral-50 dark:focus-visible:ring-offset-neutral-950"
                    placeholder="Votre ville"
                  />
                </div>
              </div>

              <div class="flex justify-end">
                <button
                  @click="updateProfile"
                  :disabled="updating"
                  class="flex items-center space-x-2 rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-3 font-medium text-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white hover:from-primary-700 hover:to-primary-800 disabled:cursor-not-allowed disabled:opacity-50 dark:focus-visible:ring-offset-neutral-950"
                >
                  <CheckIcon v-if="!updating" class="w-5 h-5" />
                  <ArrowPathIcon v-else class="w-5 h-5 animate-spin" />
                  <span>{{ updating ? 'Mise à jour...' : 'Mettre à jour' }}</span>
                </button>
              </div>
            </div>

            <!-- History Tab -->
            <div
              v-else-if="activeTab === 'history'"
              :aria-labelledby="'profile-tab-history'"
              :id="'profile-panel-history'"
              class="space-y-8"
              role="tabpanel"
            >
              <!-- Filters and Search -->
              <div class="rounded-xl border border-neutral-200 bg-white/95 p-6 dark:border-neutral-800 dark:bg-neutral-900/80">
                <div class="mb-6 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
                  <h3 class="flex items-center space-x-2 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                    <ClockIcon class="h-5 w-5" />
                    <span>Historique des réservations</span>
                  </h3>

                  <!-- Search and Filters -->
                  <div class="flex w-full flex-col gap-3 sm:flex-row md:w-auto">
                    <div class="relative">
                      <MagnifyingGlassIcon class="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-neutral-400 dark:text-neutral-500" />
                      <input
                        v-model="historyFilters.search"
                        type="text"
                        placeholder="Rechercher un produit..."
                        class="w-full rounded-lg border border-neutral-300 bg-white/80 py-2 pl-10 pr-4 text-sm text-neutral-900 shadow-inner transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-neutral-700 dark:bg-neutral-900/70 dark:text-neutral-50 dark:focus-visible:ring-offset-neutral-950"
                      />
                    </div>

                    <select
                      v-model="historyFilters.status"
                      class="rounded-lg border border-neutral-300 bg-white/80 px-3 py-2 text-sm text-neutral-900 shadow-inner transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-neutral-700 dark:bg-neutral-900/70 dark:text-neutral-50 dark:focus-visible:ring-offset-neutral-950"
                    >
                      <option value="">Tous les statuts</option>
                      <option value="pending">En attente</option>
                      <option value="confirmed">Confirmé</option>
                      <option value="ready">Prêt</option>
                      <option value="completed">Terminé</option>
                      <option value="cancelled">Annulé</option>
                    </select>

                    <select
                      v-model="historyFilters.period"
                      class="rounded-lg border border-neutral-300 bg-white/80 px-3 py-2 text-sm text-neutral-900 shadow-inner transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-neutral-700 dark:bg-neutral-900/70 dark:text-neutral-50 dark:focus-visible:ring-offset-neutral-950"
                    >
                      <option value="">Toute la période</option>
                      <option value="week">Cette semaine</option>
                      <option value="month">Ce mois</option>
                      <option value="quarter">Ce trimestre</option>
                      <option value="year">Cette année</option>
                    </select>
                  </div>
                </div>

                <!-- Reservations List -->
                <div class="space-y-4">
                  <div
                    v-for="reservation in filteredReservations"
                    :key="reservation.id"
                    class="rounded-xl border border-neutral-200 p-6 transition-shadow hover:shadow-glow dark:border-neutral-800 dark:bg-neutral-900/70"
                  >
                    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <!-- Reservation Info -->
                      <div class="flex-grow">
                        <div class="flex items-start gap-4">
                          <!-- Product Image -->
                          <div class="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                            <img
                              v-if="reservation.product?.image_url"
                              :src="reservation.product.image_url"
                              :alt="reservation.product.name"
                              class="w-full h-full object-cover"
                            />
                            <div v-else class="w-full h-full bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center">
                              <ShoppingBagIcon class="w-8 h-8 text-green-600" />
                            </div>
                          </div>

                          <!-- Details -->
                          <div class="flex-grow min-w-0">
                            <h4 class="font-semibold text-gray-900 mb-1">{{ reservation.product?.name }}</h4>
                            <p class="text-sm text-gray-600 mb-2">{{ reservation.merchant?.business_name }}</p>

                            <div class="flex flex-wrap gap-4 text-sm text-gray-600">
                              <span class="flex items-center gap-1">
                                <CalendarIcon class="w-4 h-4" />
                                {{ formatDate(reservation.created_at) }}
                              </span>
                              <span class="flex items-center gap-1">
                                <TagIcon class="w-4 h-4" />
                                Quantité: {{ reservation.quantity ?? reservation.quantity_reserved }}
                              </span>
                              <span class="font-medium text-gray-900">
                                {{ formatPrice(reservation.total_amount) }}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <!-- Status and Actions -->
                      <div class="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                        <span
                          :class="getReservationStatusClass(reservation.status)"
                          class="px-3 py-1 rounded-full text-sm font-medium"
                        >
                          {{ getReservationStatusLabel(reservation.status) }}
                        </span>

                        <!-- Action buttons for pending/confirmed reservations -->
                        <button
                          v-if="reservation.status === 'pending' || reservation.status === 'confirmed'"
                          @click="cancelReservation(reservation.id)"
                          class="px-3 py-1 text-red-600 hover:text-red-700 text-sm font-medium transition-colors"
                        >
                          Annuler
                        </button>
                      </div>
                    </div>

                    <!-- Pickup Info for ready/completed reservations -->
                    <div
                      v-if="reservation.status === 'ready' || reservation.status === 'completed'"
                      class="mt-4 pt-4 border-t border-gray-100"
                    >
                      <div class="text-sm text-gray-600">
                        <span class="font-medium">Récupération:</span>
                        {{ reservation.pickup_date ? formatDate(reservation.pickup_date) : 'À confirmer' }}
                        <span v-if="reservation.pickup_time" class="ml-2">
                          à {{ reservation.pickup_time }}
                        </span>
                      </div>
                    </div>
                  </div>

                  <!-- Empty State -->
                  <div
                    v-if="filteredReservations.length === 0"
                    class="text-center py-12"
                  >
                    <ClockIcon class="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 class="text-lg font-medium text-gray-900 mb-2">Aucune réservation trouvée</h3>
                    <p class="text-gray-600">
                      {{ historyFilters.search || historyFilters.status || historyFilters.period
                         ? 'Essayez de modifier vos filtres de recherche.'
                         : 'Vous n\'avez pas encore effectué de réservations.' }}
                    </p>
                  </div>
                </div>

                <!-- Pagination -->
                <div
                  v-if="reservationHistory.length > historyPageSize"
                  class="flex justify-between items-center mt-6 pt-6 border-t border-gray-200"
                >
                  <div class="text-sm text-gray-600">
                    Affichage {{ (historyCurrentPage - 1) * historyPageSize + 1 }}-{{ Math.min(historyCurrentPage * historyPageSize, filteredReservations.length) }}
                    sur {{ filteredReservations.length }} réservations
                  </div>

                  <div class="flex gap-2">
                    <button
                      @click="historyCurrentPage--"
                      :disabled="historyCurrentPage === 1"
                      class="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Précédent
                    </button>
                    <button
                      @click="historyCurrentPage++"
                      :disabled="historyCurrentPage * historyPageSize >= filteredReservations.length"
                      class="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Suivant
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Security Tab -->
            <div
              v-else-if="activeTab === 'security'"
              :aria-labelledby="'profile-tab-security'"
              :id="'profile-panel-security'"
              class="space-y-8"
              role="tabpanel"
            >
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
            <div
              v-else-if="activeTab === 'preferences'"
              :aria-labelledby="'profile-tab-preferences'"
              :id="'profile-panel-preferences'"
              class="space-y-8"
              role="tabpanel"
            >
              <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <!-- Notification Settings -->
                <div class="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                  <h3 class="font-semibold text-gray-900 mb-6 flex items-center space-x-2">
                    <BellIcon class="w-5 h-5 text-blue-600" />
                    <span>Notifications</span>
                  </h3>
                  <div class="space-y-6">
                    <div class="flex items-start justify-between gap-6">
                      <div>
                        <p class="font-medium text-gray-900">Notifications par email</p>
                        <p class="text-sm text-gray-600">Recevoir les confirmations de réservation et résumés par email.</p>
                      </div>
                      <label class="relative inline-flex items-center cursor-pointer">
                        <input
                          v-model="notificationSettings.email"
                          type="checkbox"
                          class="sr-only peer"
                        />
                        <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div class="flex items-start justify-between gap-6">
                      <div>
                        <p class="font-medium text-gray-900">Alertes SMS</p>
                        <p class="text-sm text-gray-600">Recevoir un SMS pour les mises à jour urgentes de réservation.</p>
                      </div>
                      <label class="relative inline-flex items-center cursor-pointer">
                        <input
                          v-model="notificationSettings.sms"
                          type="checkbox"
                          class="sr-only peer"
                        />
                        <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div class="flex items-start justify-between gap-6">
                      <div>
                        <p class="font-medium text-gray-900">Notifications push</p>
                        <p class="text-sm text-gray-600">
                          Recevoir des alertes instantanées dans votre navigateur dès qu'un panier est disponible.
                          <span v-if="!isPushSupported" class="text-red-500 block">Votre navigateur ne supporte pas les notifications push.</span>
                        </p>
                      </div>
                      <label class="relative inline-flex items-center cursor-pointer" :class="{ 'opacity-50': !isPushSupported }">
                        <input
                          v-model="notificationSettings.push"
                          type="checkbox"
                          class="sr-only peer"
                          :disabled="!isPushSupported"
                        />
                        <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div class="flex justify-end">
                      <button
                        @click="persistNotificationPreferences"
                        :disabled="savingNotifications"
                        class="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span v-if="!savingNotifications">Enregistrer mes préférences</span>
                        <span v-else>Enregistrement...</span>
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Search & Discovery Preferences -->
                <div class="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                  <h3 class="font-semibold text-gray-900 mb-6 flex items-center space-x-2">
                    <MapPinIcon class="w-5 h-5 text-green-600" />
                    <span>Recherche & Découverte</span>
                  </h3>
                  <div class="space-y-6">
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">
                        Rayon de recherche maximum
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
                        <option value="100">100 km</option>
                      </select>
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">
                        Catégories préférées
                      </label>
                      <div class="grid grid-cols-2 gap-2">
                        <label v-for="category in availableCategories" :key="category.id"
                               class="flex items-center space-x-2 p-2 rounded-lg hover:bg-green-100 cursor-pointer">
                          <input
                            v-model="preferences.preferred_categories"
                            type="checkbox"
                            :value="category.id"
                            class="text-green-600 rounded focus:ring-green-500"
                          />
                          <span class="text-sm text-gray-700">{{ category.name }}</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <!-- Shopping Preferences -->
                <div class="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
                  <h3 class="font-semibold text-gray-900 mb-6 flex items-center space-x-2">
                    <ShoppingBagIcon class="w-5 h-5 text-purple-600" />
                    <span>Préférences d'achat</span>
                  </h3>
                  <div class="space-y-6">
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">
                        Budget maximum par achat
                      </label>
                      <select
                        v-model="preferences.max_budget"
                        class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        <option value="1000">1,000 F CFA</option>
                        <option value="2500">2,500 F CFA</option>
                        <option value="5000">5,000 F CFA</option>
                        <option value="10000">10,000 F CFA</option>
                        <option value="25000">25,000 F CFA</option>
                        <option value="">Pas de limite</option>
                      </select>
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">
                        Mode d'affichage des prix
                      </label>
                      <select
                        v-model="preferences.price_display"
                        class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        <option value="discount_first">Remise en premier</option>
                        <option value="final_price">Prix final en premier</option>
                        <option value="both">Afficher les deux</option>
                      </select>
                    </div>
                    <div class="flex items-center justify-between">
                      <div>
                        <p class="font-medium text-gray-900">Réservation automatique</p>
                        <p class="text-sm text-gray-600">Réserver automatiquement les favoris</p>
                      </div>
                      <label class="relative inline-flex items-center cursor-pointer">
                        <input
                          v-model="preferences.auto_reserve_favorites"
                          type="checkbox"
                          class="sr-only peer"
                        />
                        <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                      </label>
                    </div>
                  </div>
                </div>

                <!-- Environmental & Privacy Settings -->
                <div class="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-6 border border-emerald-200">
                  <h3 class="font-semibold text-gray-900 mb-6 flex items-center space-x-2">
                    <GlobeAltIcon class="w-5 h-5 text-emerald-600" />
                    <span>Impact & Confidentialité</span>
                  </h3>
                  <div class="space-y-6">
                    <div class="flex items-center justify-between">
                      <div>
                        <p class="font-medium text-gray-900">Statistiques publiques</p>
                        <p class="text-sm text-gray-600">Partager votre impact environnemental</p>
                      </div>
                      <label class="relative inline-flex items-center cursor-pointer">
                        <input
                          v-model="preferences.public_impact_stats"
                          type="checkbox"
                          class="sr-only peer"
                        />
                        <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                      </label>
                    </div>
                    <div class="flex items-center justify-between">
                      <div>
                        <p class="font-medium text-gray-900">Recommandations personnalisées</p>
                        <p class="text-sm text-gray-600">Améliorer les suggestions basées sur vos habitudes</p>
                      </div>
                      <label class="relative inline-flex items-center cursor-pointer">
                        <input
                          v-model="preferences.personalized_recommendations"
                          type="checkbox"
                          class="sr-only peer"
                        />
                        <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                      </label>
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">
                        Fréquence des rapports d'impact
                      </label>
                      <select
                        v-model="preferences.impact_report_frequency"
                        class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      >
                        <option value="weekly">Hebdomadaire</option>
                        <option value="monthly">Mensuel</option>
                        <option value="quarterly">Trimestriel</option>
                        <option value="never">Jamais</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Language & Accessibility -->
              <div class="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-6 border border-orange-200">
                <h3 class="font-semibold text-gray-900 mb-6 flex items-center space-x-2">
                  <GlobeAltIcon class="w-5 h-5 text-orange-600" />
                  <span>Langue & Accessibilité</span>
                </h3>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Langue préférée
                    </label>
                    <select
                      v-model="preferences.language"
                      class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    >
                      <option value="fr">Français</option>
                      <option value="en">English</option>
                      <option value="ar">العربية</option>
                    </select>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Taille de police
                    </label>
                    <select
                      v-model="preferences.font_size"
                      class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    >
                      <option value="small">Petite</option>
                      <option value="medium">Normale</option>
                      <option value="large">Grande</option>
                      <option value="xlarge">Très grande</option>
                    </select>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Contraste élevé
                    </label>
                    <label class="relative inline-flex items-center cursor-pointer mt-3">
                      <input
                        v-model="preferences.high_contrast"
                        type="checkbox"
                        class="sr-only peer"
                      />
                      <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                    </label>
                  </div>
                </div>
              </div>

              <div class="flex justify-end">
                <button
                  @click="updatePreferences"
                  :disabled="updatingPreferences"
                  class="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 shadow-lg"
                >
                  <CogIcon v-if="!updatingPreferences" class="w-5 h-5" />
                  <ArrowPathIcon v-else class="w-5 h-5 animate-spin" />
                  <span>{{ updatingPreferences ? 'Sauvegarde en cours...' : 'Sauvegarder les préférences' }}</span>
                </button>
              </div>
            </div>

            <!-- Statistics Tab -->
            <div v-else-if="activeTab === 'statistics'" class="space-y-8">
              <!-- Key Metrics Cards -->
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
                      <BanknotesIcon class="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p class="text-2xl font-bold text-blue-900">{{ formatPrice(userStats.total_savings) }}</p>
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

              <!-- Charts Section -->
              <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- Monthly Activity Chart -->
                <div class="bg-white rounded-xl border border-gray-200 p-6">
                  <div class="flex items-center justify-between mb-6">
                    <h3 class="font-semibold text-gray-900">Activité mensuelle</h3>
                    <select
                      v-model="chartPeriod"
                      @change="updateCharts"
                      class="text-sm border border-gray-300 rounded-lg px-3 py-1"
                    >
                      <option value="6">6 derniers mois</option>
                      <option value="12">12 derniers mois</option>
                    </select>
                  </div>
                  <div class="h-64">
                    <!-- Chart placeholder - Chart.js integration à finaliser -->
                    <div v-if="monthlyData.labels.length > 0"
                         class="w-full h-full bg-gradient-to-br from-green-100 to-blue-100 rounded-lg flex items-center justify-center">
                      <div class="text-center">
                        <ChartBarIcon class="w-16 h-16 mx-auto mb-2 text-green-600" />
                        <p class="text-green-700 font-medium">Graphique d'activité mensuelle</p>
                      </div>
                    </div>
                    <div v-else class="flex items-center justify-center h-full text-gray-500">
                      <div class="text-center">
                        <ChartBarIcon class="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>Données en cours de chargement...</p>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Environmental Impact Chart -->
                <div class="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 class="font-semibold text-gray-900 mb-6">Impact environnemental</h3>
                  <div class="h-64">
                    <!-- Environmental chart placeholder - Chart.js integration à finaliser -->
                    <div v-if="environmentData.labels.length > 0"
                         class="w-full h-full bg-gradient-to-br from-emerald-100 to-teal-100 rounded-lg flex items-center justify-center">
                      <div class="text-center">
                        <GlobeAltIcon class="w-16 h-16 mx-auto mb-2 text-emerald-600" />
                        <p class="text-emerald-700 font-medium">Graphique d'impact environnemental</p>
                      </div>
                    </div>
                    <div v-else class="flex items-center justify-center h-full text-gray-500">
                      <div class="text-center">
                        <GlobeAltIcon class="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>Calcul de l'impact...</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Progress Tracking -->
              <div class="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
                <h3 class="font-semibold text-gray-900 mb-6">Progression & Objectifs</h3>
                <div class="space-y-6">
                  <!-- Monthly Goal Progress -->
                  <div>
                    <div class="flex justify-between items-center mb-2">
                      <span class="text-sm font-medium text-gray-700">Objectif mensuel</span>
                      <span class="text-sm text-purple-600">{{ userStats.this_month }}/10 réservations</span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-3">
                      <div
                        class="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-500"
                        :style="{ width: Math.min((userStats.this_month / 10) * 100, 100) + '%' }"
                      ></div>
                    </div>
                  </div>

                  <!-- Savings Goal Progress -->
                  <div>
                    <div class="flex justify-between items-center mb-2">
                      <span class="text-sm font-medium text-gray-700">Économies annuelles</span>
                      <span class="text-sm text-blue-600">{{ formatPrice(userStats.total_savings) }}/50,000 F CFA</span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-3">
                      <div
                        class="bg-gradient-to-r from-blue-500 to-cyan-500 h-3 rounded-full transition-all duration-500"
                        :style="{ width: Math.min((userStats.total_savings / 50000) * 100, 100) + '%' }"
                      ></div>
                    </div>
                  </div>

                  <!-- Environmental Goal Progress -->
                  <div>
                    <div class="flex justify-between items-center mb-2">
                      <span class="text-sm font-medium text-gray-700">Impact CO2</span>
                      <span class="text-sm text-green-600">{{ userStats.co2_saved }}/100 kg économisés</span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-3">
                      <div
                        class="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full transition-all duration-500"
                        :style="{ width: Math.min((userStats.co2_saved / 100) * 100, 100) + '%' }"
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Detailed Statistics Table -->
              <div class="bg-white rounded-xl border border-gray-200 p-6">
                <h3 class="font-semibold text-gray-900 mb-6">Statistiques détaillées</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div class="space-y-4">
                    <div class="flex justify-between items-center py-3 border-b border-gray-200">
                      <span class="text-gray-700">Nourriture sauvée</span>
                      <span class="font-semibold text-green-600">{{ userStats.food_saved }}kg</span>
                    </div>
                    <div class="flex justify-between items-center py-3 border-b border-gray-200">
                      <span class="text-gray-700">Réservations terminées</span>
                      <span class="font-semibold text-blue-600">{{ userStats.completed_reservations }}</span>
                    </div>
                    <div class="flex justify-between items-center py-3 border-b border-gray-200">
                      <span class="text-gray-700">Taux de complétion</span>
                      <span class="font-semibold text-purple-600">
                        {{ userStats.total_reservations > 0 ? Math.round((userStats.completed_reservations / userStats.total_reservations) * 100) : 0 }}%
                      </span>
                    </div>
                  </div>
                  <div class="space-y-4">
                    <div class="flex justify-between items-center py-3 border-b border-gray-200">
                      <span class="text-gray-700">Ce mois-ci</span>
                      <span class="font-semibold text-indigo-600">{{ userStats.this_month }} réservations</span>
                    </div>
                    <div class="flex justify-between items-center py-3 border-b border-gray-200">
                      <span class="text-gray-700">Économie moyenne</span>
                      <span class="font-semibold text-orange-600">
                        {{ userStats.total_reservations > 0 ? formatPrice(Math.round(userStats.total_savings / userStats.total_reservations)) : formatPrice(0) }}
                      </span>
                    </div>
                    <div class="flex justify-between items-center py-3 border-b border-gray-200">
                      <span class="text-gray-700">Membre depuis</span>
                      <span class="font-semibold text-gray-600">{{ memberSince }}</span>
                    </div>
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
        'fixed top-4 right-4 px-6 py-4 rounded-xl shadow-lg z-[110]',
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
import { ref, computed, onMounted, reactive, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { notify } from '@/composables/useNotifications'
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
  BanknotesIcon,
  GlobeAltIcon,
  ClockIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  MagnifyingGlassIcon,
  CalendarIcon,
  TagIcon
} from '@heroicons/vue/24/outline'
import { formatPrice } from '@/utils/currency'
// import { Line, Doughnut } from 'vue-chart-3'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
)

const authStore = useAuthStore()
const user = computed(() => authStore.user)

// Notification store removed - using useNotifications composable
const notificationSettings = reactive({
  email: true,
  sms: false,
  push: false
})
const savingNotifications = ref(false)
const isPushSupported = typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator

const syncNotificationSettings = () => {
  // TODO: Implement notification store integration
  // notificationSettings.email = notificationStore.preferences.email
  // notificationSettings.sms = notificationStore.preferences.sms
  // notificationSettings.push = notificationStore.preferences.push
}

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
  // Search & Discovery
  max_distance: '15',
  preferred_categories: [] as number[],

  // Shopping
  max_budget: '',
  price_display: 'both',
  auto_reserve_favorites: false,

  // Privacy & Impact
  public_impact_stats: false,
  personalized_recommendations: true,
  impact_report_frequency: 'monthly',

  // Language & Accessibility
  language: 'fr',
  font_size: 'medium',
  high_contrast: false
})

// Available categories for preferences
const availableCategories = ref([
  { id: 1, name: 'Boulangerie' },
  { id: 2, name: 'Fruits & Légumes' },
  { id: 3, name: 'Viandes & Poissons' },
  { id: 4, name: 'Épicerie' },
  { id: 5, name: 'Produits Laitiers' },
  { id: 6, name: 'Plats Préparés' },
  { id: 7, name: 'Boissons' },
  { id: 8, name: 'Confiserie' }
])

const userStats = reactive({
  total_reservations: 0,
  completed_reservations: 0,
  total_savings: 0,
  food_saved: 0,
  co2_saved: 0,
  this_month: 0
})

// History tab data
const reservationHistory = ref<any[]>([])
const historyFilters = reactive({
  search: '',
  status: '',
  period: ''
})
const historyCurrentPage = ref(1)
const historyPageSize = ref(5)

// Charts data
const chartPeriod = ref('6')
const monthlyData = reactive({
  labels: [] as string[],
  datasets: [
    {
      label: 'Réservations',
      data: [] as number[],
      borderColor: '#10B981',
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
      tension: 0.4,
      fill: true
    },
    {
      label: 'Économies (F CFA)',
      data: [] as number[],
      borderColor: '#3B82F6',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      tension: 0.4,
      fill: true,
      yAxisID: 'y1'
    }
  ]
})

const environmentData = reactive({
  labels: ['CO2 économisé', 'Nourriture sauvée', 'Réservations complétées'],
  datasets: [
    {
      data: [] as number[],
      backgroundColor: [
        '#10B981',
        '#F59E0B',
        '#3B82F6'
      ],
      borderWidth: 0
    }
  ]
})

// Chart configuration (à activer quand Chart.js sera intégré)
/*
const lineChartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    intersect: false,
    mode: 'index' as const
  },
  scales: {
    y: {
      type: 'linear' as const,
      display: true,
      position: 'left' as const,
      title: {
        display: true,
        text: 'Réservations'
      }
    },
    y1: {
      type: 'linear' as const,
      display: true,
      position: 'right' as const,
      title: {
        display: true,
        text: 'Économies (F CFA)'
      },
      grid: {
        drawOnChartArea: false
      }
    }
  },
  plugins: {
    legend: {
      display: true,
      position: 'top' as const
    },
    tooltip: {
      callbacks: {
        label: function(context: any) {
          let label = context.dataset.label || '';
          if (label) {
            label += ': ';
          }
          if (context.datasetIndex === 1) {
            label += formatPrice(context.parsed.y);
          } else {
            label += context.parsed.y;
          }
          return label;
        }
      }
    }
  }
}))

const doughnutChartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'bottom' as const
    },
    tooltip: {
      callbacks: {
        label: function(context: any) {
          const label = context.label || '';
          const value = context.parsed;
          let suffix = '';

          if (label.includes('CO2')) suffix = ' kg';
          else if (label.includes('Nourriture')) suffix = ' kg';
          else if (label.includes('Réservations')) suffix = ' réservations';

          return `${label}: ${value}${suffix}`;
        }
      }
    }
  }
}))
*/

const memberSince = computed(() => {
  if (user.value?.created_at) {
    const date = new Date(user.value.created_at)
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long'
    })
  }
  return 'Non disponible'
})

watch(
  () => authStore.user,
  () => {
    // TODO: Implement notification store integration
    // notificationStore.hydratePreferencesFromUser()
    syncNotificationSettings()
  },
  { immediate: true }
)

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

// History computed properties
const filteredReservations = computed(() => {
  let filtered = [...reservationHistory.value]

  // Filter by search
  if (historyFilters.search) {
    const search = historyFilters.search.toLowerCase()
    filtered = filtered.filter(reservation =>
      reservation.product?.name?.toLowerCase().includes(search) ||
      reservation.merchant?.business_name?.toLowerCase().includes(search)
    )
  }

  // Filter by status
  if (historyFilters.status) {
    filtered = filtered.filter(reservation => reservation.status === historyFilters.status)
  }

  // Filter by period
  if (historyFilters.period) {
    const now = new Date()
    const filterDate = new Date()

    switch (historyFilters.period) {
      case 'week':
        filterDate.setDate(now.getDate() - 7)
        break
      case 'month':
        filterDate.setMonth(now.getMonth() - 1)
        break
      case 'quarter':
        filterDate.setMonth(now.getMonth() - 3)
        break
      case 'year':
        filterDate.setFullYear(now.getFullYear() - 1)
        break
    }

    filtered = filtered.filter(reservation =>
      new Date(reservation.created_at) >= filterDate
    )
  }

  // Pagination
  const start = (historyCurrentPage.value - 1) * historyPageSize.value
  const end = start + historyPageSize.value
  return filtered.slice(start, end)
})

// Tabs configuration
const tabs = [
  { id: 'personal', name: 'Informations personnelles', icon: UserIcon },
  { id: 'history', name: 'Historique', icon: ClockIcon },
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

const persistNotificationPreferences = async () => {
  // TODO: Implement notification store integration
  // const previousPush = notificationStore.preferences.push

  try {
    savingNotifications.value = true
    // TODO: Implement notification preferences save
    // const saved = await notificationStore.savePreferences({
    //   email: notificationSettings.email,
    //   sms: notificationSettings.sms,
    //   push: notificationSettings.push
    // })

    // notificationSettings.email = saved.email
    // notificationSettings.sms = saved.sms
    // notificationSettings.push = saved.push

    // if (saved.push && !previousPush) {
    //   await notificationStore.ensurePushSubscription()
    // }

    notify.success('Préférences de notification mises à jour', 'Notifications')
  } catch (error: any) {
    const message = error?.message || 'Impossible de mettre à jour vos notifications pour le moment.'
    notify.error(message, 'Notifications')
  } finally {
    savingNotifications.value = false
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

// History methods
const loadReservationHistory = async () => {
  try {
    const response = await fetch('http://localhost:8000/api/reservations', {
      headers: {
        'Authorization': `Bearer ${authStore.token}`,
        'Accept': 'application/json'
      }
    })

    if (response.ok) {
      const data = await response.json()
      reservationHistory.value = data.data || []
    }
  } catch (error) {
    console.error('Error loading reservation history:', error)
  }
}

const getReservationStatusClass = (status: string) => {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800'
    case 'confirmed':
      return 'bg-blue-100 text-blue-800'
    case 'ready':
      return 'bg-purple-100 text-purple-800'
    case 'completed':
      return 'bg-green-100 text-green-800'
    case 'cancelled':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const getReservationStatusLabel = (status: string) => {
  switch (status) {
    case 'pending': return 'En attente'
    case 'confirmed': return 'Confirmé'
    case 'ready': return 'Prêt'
    case 'completed': return 'Terminé'
    case 'cancelled': return 'Annulé'
    default: return status
  }
}

const cancelReservation = async (reservationId: number) => {
  try {
    const response = await fetch(`http://localhost:8000/api/reservations/${reservationId}/cancel`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authStore.token}`,
        'Accept': 'application/json'
      }
    })

    if (response.ok) {
      showMessage('Réservation annulée avec succès', 'success')
      await loadReservationHistory() // Reload the history
    } else {
      showMessage('Erreur lors de l\'annulation de la réservation', 'error')
    }
  } catch (error) {
    showMessage('Erreur lors de l\'annulation de la réservation', 'error')
  }
}

// Charts functions
const updateCharts = async () => {
  await loadMonthlyData()
  await loadEnvironmentData()
}

const loadMonthlyData = async () => {
  try {
    const months = parseInt(chartPeriod.value)
    const response = await fetch(`http://localhost:8000/api/user/statistics/monthly?months=${months}`, {
      headers: {
        'Authorization': `Bearer ${authStore.token}`,
        'Accept': 'application/json'
      }
    })

    if (response.ok) {
      const data = await response.json()

      // Generate last N months
      const monthNames = [
        'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun',
        'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'
      ]

      const labels = []
      const reservationsData = []
      const savingsData = []

      for (let i = months - 1; i >= 0; i--) {
        const date = new Date()
        date.setMonth(date.getMonth() - i)
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        const monthLabel = `${monthNames[date.getMonth()]} ${date.getFullYear()}`

        labels.push(monthLabel)

        const monthData = data.data?.find((item: any) => item.month === monthKey)
        reservationsData.push(monthData?.reservations || 0)
        savingsData.push(monthData?.savings || 0)
      }

      monthlyData.labels.splice(0, monthlyData.labels.length, ...labels)
      monthlyData.datasets[0].data.splice(0, monthlyData.datasets[0].data.length, ...reservationsData)
      monthlyData.datasets[1].data.splice(0, monthlyData.datasets[1].data.length, ...savingsData)
    }
  } catch (error) {
    console.error('Erreur lors du chargement des données mensuelles:', error)
    // Generate mock data for demo
    generateMockMonthlyData()
  }
}

const loadEnvironmentData = async () => {
  try {
    // For now, use the current user stats for environmental impact
    environmentData.datasets[0].data.splice(0, environmentData.datasets[0].data.length,
      userStats.co2_saved,
      userStats.food_saved,
      userStats.completed_reservations
    )
  } catch (error) {
    console.error('Erreur lors du chargement des données environnementales:', error)
  }
}

const generateMockMonthlyData = () => {
  const months = parseInt(chartPeriod.value)
  const monthNames = [
    'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun',
    'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'
  ]

  const labels = []
  const reservationsData = []
  const savingsData = []

  for (let i = months - 1; i >= 0; i--) {
    const date = new Date()
    date.setMonth(date.getMonth() - i)
    const monthLabel = `${monthNames[date.getMonth()]} ${date.getFullYear()}`

    labels.push(monthLabel)
    reservationsData.push(Math.floor(Math.random() * 10) + 1)
    savingsData.push(Math.floor(Math.random() * 5000) + 500)
  }

  monthlyData.labels.splice(0, monthlyData.labels.length, ...labels)
  monthlyData.datasets[0].data.splice(0, monthlyData.datasets[0].data.length, ...reservationsData)
  monthlyData.datasets[1].data.splice(0, monthlyData.datasets[1].data.length, ...savingsData)
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
  loadReservationHistory()
  updateCharts()
})
</script>
