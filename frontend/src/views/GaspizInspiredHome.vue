<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Hero -->
    <section class="relative overflow-hidden bg-gradient-to-br from-primary-700 via-primary-600 to-primary-800 text-white">
      <div class="absolute inset-0 opacity-30">
        <div class="absolute -top-10 -left-10 h-40 w-40 rounded-full bg-white/20 blur-3xl"></div>
        <div class="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-success-500/20 blur-3xl"></div>
      </div>
      <div class="relative mx-auto flex max-w-6xl flex-col items-center gap-10 px-6 py-24 text-center">
        <span class="rounded-full bg-white/10 px-4 py-1 text-sm font-medium uppercase tracking-widest text-primary-100">
          Inspiration Gaspiz
        </span>
        <h1 class="text-4xl font-bold md:text-6xl">
          Une expérience moderne pour lutter contre le gaspillage alimentaire
        </h1>
        <p class="max-w-3xl text-lg text-primary-100 md:text-xl">
          Découvrez une interface immersive inspirée de l'application Gaspiz pour connecter les consommateurs et les commerçants autour de produits sauvés.
        </p>
        <div class="flex flex-wrap justify-center gap-4">
          <router-link
            to="/products"
            class="btn bg-white text-primary-600 hover:bg-gray-100"
          >
            Explorer les offres
          </router-link>
          <router-link
            to="/register"
            class="btn bg-transparent ring-2 ring-white hover:bg-white/10"
          >
            Rejoindre la communauté
          </router-link>
        </div>
      </div>
    </section>

    <!-- Highlights -->
    <section class="mx-auto max-w-6xl px-6 py-16">
      <div class="grid gap-8 md:grid-cols-3">
        <div class="rounded-3xl bg-white p-8 shadow-lg shadow-primary-900/5">
          <div class="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-2xl">
            🥗
          </div>
          <h3 class="mb-3 text-xl font-semibold text-gray-900">Parcours simplifié</h3>
          <p class="text-gray-600">
            Un flux clair pour parcourir, réserver et récupérer les paniers anti-gaspi disponibles près de chez vous.
          </p>
        </div>
        <div class="rounded-3xl bg-white p-8 shadow-lg shadow-primary-900/5">
          <div class="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-success-100 text-2xl">
            ⚡
          </div>
          <h3 class="mb-3 text-xl font-semibold text-gray-900">Expérience performante</h3>
          <p class="text-gray-600">
            Des transitions rapides et un design soigné pour une navigation fluide sur mobile comme sur desktop.
          </p>
        </div>
        <div class="rounded-3xl bg-white p-8 shadow-lg shadow-primary-900/5">
          <div class="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-warning-100 text-2xl">
            🌍
          </div>
          <h3 class="mb-3 text-xl font-semibold text-gray-900">Impact mesurable</h3>
          <p class="text-gray-600">
            Visualisez les économies réalisées et les kilos d'aliments sauvés grâce à la communauté.
          </p>
        </div>
      </div>
    </section>

    <!-- Demo features -->
    <section class="bg-white py-16">
      <div class="mx-auto max-w-6xl px-6">
        <div class="mb-12 text-center">
          <h2 class="text-3xl font-bold text-gray-900 md:text-4xl">Fonctionnalités mises en avant</h2>
          <p class="mt-3 text-lg text-gray-600">
            Cette démo reprend les éléments clés de l'application Gaspiz et les adapte au projet AntiGaspi.
          </p>
        </div>
        <div class="grid gap-10 md:grid-cols-2">
          <div class="space-y-6 rounded-3xl border border-gray-100 bg-gray-50 p-8">
            <h3 class="text-xl font-semibold text-gray-900">Pour les consommateurs</h3>
            <ul class="space-y-4 text-gray-600">
              <li class="flex items-start gap-3">
                <span class="mt-1 text-primary-500">•</span>
                <span>Recherche intuitive de paniers disponibles selon la localisation et les préférences alimentaires.</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="mt-1 text-primary-500">•</span>
                <span>Système de réservation rapide avec suivi du statut de la commande.</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="mt-1 text-primary-500">•</span>
                <span>Tableau de bord personnalisé pour retrouver ses paniers favoris et ses économies.</span>
              </li>
            </ul>
          </div>
          <div class="space-y-6 rounded-3xl border border-gray-100 bg-gray-50 p-8">
            <h3 class="text-xl font-semibold text-gray-900">Pour les commerçants</h3>
            <ul class="space-y-4 text-gray-600">
              <li class="flex items-start gap-3">
                <span class="mt-1 text-success-500">•</span>
                <span>Publication simplifiée des paniers invendus avec gestion des créneaux de retrait.</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="mt-1 text-success-500">•</span>
                <span>Statistiques claires sur les ventes, les économies générées et la fidélisation des clients.</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="mt-1 text-success-500">•</span>
                <span>Outils de communication pour informer les consommateurs des disponibilités en temps réel.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <!-- Call to action -->
    <section class="bg-primary-700 py-20 text-white">
      <div class="mx-auto max-w-4xl px-6 text-center">
        <h2 class="text-3xl font-bold md:text-4xl">Prêt à découvrir la démo inspirée de Gaspiz ?</h2>
        <p class="mt-4 text-lg text-primary-100">
          Créez un compte ou connectez-vous pour explorer l'ensemble des fonctionnalités de la plateforme AntiGaspi.
        </p>
        <div class="mt-8 flex flex-wrap justify-center gap-4">
          <router-link to="/register" class="btn bg-white text-primary-600 hover:bg-gray-100">
            Je suis nouveau
          </router-link>
          <router-link to="/login" class="btn bg-transparent ring-2 ring-white hover:bg-white/10">
            J'ai déjà un compte
          </router-link>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
// No logic required for this marketing page yet.
</script>
